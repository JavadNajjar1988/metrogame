/**
 * Interactive 3D Game Center Builder ("گیم نت من") Controller.
 * Features:
 * - Build-from-scratch empty canvas + optional starter presets
 * - Interactive 3D interior partition wall drawing (full, half, glass VIP, doorway) with live length preview & chaining
 * - Multi-floor / multi-story architecture (up to 4 floors) with solo editing & stacked cutaway view
 * - Ultra-clear high-DPI floating overhead station badges (Device Name + Table # + Live Status/Timer)
 * - Software-WebGL guard, RoomEnvironment reflections, ACESFilmicToneMapping, SRGBColorSpace, render-on-demand + afterDraw
 * - Persistent save/load via gamenet_layout.json + save_layout.php
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ROOM_LIMITS,
  FLOOR_LIMITS,
  WALL_STYLES,
  FLOOR_FINISHES,
  WALL_FINISHES,
  LIGHTING_MOODS,
  LED_COLORS,
  ITEM_TINT_SWATCHES,
  BILLIARD_FELT_VARIANTS,
  CATALOG_CATEGORIES,
  ITEM_CATALOG,
  getCatalogItem,
  getWallStyleSpec,
  getWallMetrics,
  clampItemToRoom,
  checkItemCollision,
  snapWallPointToRoom,
  snapWallEndpoint,
  createWallSegment,
  createStarterLayout,
  sanitizeLayout,
  getActiveFloor,
  getFloorElevationY,
  addFloorToLayout,
  removeFloorFromLayout,
  setActiveFloorInLayout,
  renameFloorInLayout,
  syncActiveFloorAliases,
  assignNextStationNumber,
  summarizeLayoutStats,
  normalizeRotationDeg,
  moveItemToPoint,
  resolveGridRenderStyle,
  resolveLedColorHex,
  formatStationMiniTimer,
} from './gamenet-3d-engine.mjs?v=20261127-1';
import {
  buildRoomShell,
  buildInteriorWallMesh,
  buildWallPreviewGroup,
  updateWallPreviewGroup,
  buildFurnitureModel,
  buildPlacementGhost,
  buildSelectionRing,
  drawStationTimerCanvas,
  disposeObject3D,
} from './gamenet-3d-models.js?v=20261127-1';
import { toPersianDigits } from './dashboard-metrics.mjs?v=20261109-3';

// Pre-allocated scratch vectors (zero GC in render/interaction loops)
const _mouse = new THREE.Vector2();
const _hitPoint = new THREE.Vector3();
const _dragOffset = new THREE.Vector3();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _camGoalPos = new THREE.Vector3();
const _camGoalTarget = new THREE.Vector3();

function detectSoftwareGl() {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2') || probe.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function getActiveAccentHex() {
  const styles = getComputedStyle(document.documentElement);
  const raw = styles.getPropertyValue('--mg-accent-1').trim();
  return /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : '#7c3aed';
}

function isLightTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

function itemCoords(val) {
  const rounded = Math.round((Number(val) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function showBuilderToast(message) {
  let toast = document.getElementById('mgToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mgToast';
    toast.className = 'mg-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__mgToastTimer);
  window.__mgToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

const builder = {
  mounted: false,
  isSoftwareGl: false,
  renderer: null,
  scene: null,
  camera: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  resizeObserver: null,
  themeObserver: null,

  // Lights
  keyLight: null,
  hemiLight: null,
  rimLight: null,

  // Scene groups
  roomContainer: null,
  wallsContainer: null,
  itemsContainer: null,
  floorHitMesh: null,
  gridGroup: null,
  itemMeshMap: new Map(),
  wallMeshMap: new Map(),
  pickProxies: [],
  wallPickProxies: [],
  selectionRing: null,
  placementGhost: null,
  wallPreviewGroup: null,

  // On-demand render & camera transition state
  frameId: 0,
  renderBusy: false,
  renderDirty: false,
  camTransitionActive: false,
  lastTransitionPerf: 0,
  lastCameraPreset: 'hero',

  // Builder data state (default: clean blank scratch canvas!)
  layout: createStarterLayout('empty'),
  viewAllFloors: false,
  occupiedTables: new Set(),
  reservationsByTable: new Map(),
  clickTimesByTable: new Map(),
  finishTimesByTable: new Map(),
  stationTimerSprites: new Map(),
  timerTickId: null,
  gridSnap: true,
  renderMode: 'solid', // 'solid' | 'wireframe'
  activeTab: 'catalog', // 'catalog' | 'walls' | 'floors' | 'style' | 'room' | 'selected'
  activeCategory: 'all',
  dockCollapsed: false,

  // Selection & editing state
  selectedId: null,
  selectedWallId: null,
  placingType: null,
  movingItemId: null,
  placingRotation: 0,
  placingValid: true,

  // Interactive Wall Drawing state
  wallDrawMode: false,
  wallStyle: 'full',
  wallOrthoSnap: true,
  wallDrawStart: null, // { x, z } | null
  wallDrawHover: null, // { x, z } | null

  // Dragging state
  draggingId: null,
  dragStartSnapshot: null,
  dragHistoryPushed: false,
  pointerDownPos: null,
  hasUnsavedChanges: false,
  lastMoveRaycast: 0,
  undoStack: [],
  redoStack: [],
  lastHistoryKey: '',
  lastHistoryAt: 0,
};

const MAX_HISTORY_STEPS = 30;

function activeFloor() {
  return getActiveFloor(builder.layout);
}

function activeElevationY() {
  if (!builder.viewAllFloors) return 0;
  return getFloorElevationY(builder.layout.floors, builder.layout.activeFloorIndex);
}

function syncGroundPlane() {
  _groundPlane.set(new THREE.Vector3(0, 1, 0), -activeElevationY());
}

function cloneLayoutSnapshot(layout) {
  const safe = sanitizeLayout(layout);
  return {
    version: 2,
    activeFloorIndex: safe.activeFloorIndex,
    floors: safe.floors.map((fl) => ({
      id: fl.id,
      name: fl.name,
      level: fl.level,
      room: { ...fl.room },
      walls: (fl.walls || []).map((w) => ({ ...w })),
      items: (fl.items || []).map((it) => ({ ...it })),
    })),
  };
}

function pushHistorySnapshot(coalesceKey = '') {
  const now = Date.now();
  if (coalesceKey && coalesceKey === builder.lastHistoryKey && now - builder.lastHistoryAt < 750) {
    builder.lastHistoryAt = now;
    return;
  }
  builder.undoStack.push(cloneLayoutSnapshot(builder.layout));
  if (builder.undoStack.length > MAX_HISTORY_STEPS) {
    builder.undoStack.shift();
  }
  builder.redoStack = [];
  builder.lastHistoryKey = coalesceKey;
  builder.lastHistoryAt = now;
  updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('mg3dUndoBtn');
  const redoBtn = document.getElementById('mg3dRedoBtn');
  if (undoBtn) undoBtn.disabled = builder.undoStack.length === 0;
  if (redoBtn) redoBtn.disabled = builder.redoStack.length === 0;
}

function restoreLayoutFromSnapshot(snapshot, toastMessage) {
  clearPlacementMode();
  exitWallDrawMode(false);
  builder.layout = sanitizeLayout(snapshot);
  const fl = activeFloor();
  if (builder.selectedId && !fl.items.some((i) => i.id === builder.selectedId)) {
    builder.selectedId = null;
  }
  if (builder.selectedWallId && !fl.walls.some((w) => w.id === builder.selectedWallId)) {
    builder.selectedWallId = null;
  }
  if (!builder.selectedId && !builder.selectedWallId && builder.activeTab === 'selected') {
    builder.activeTab = 'catalog';
  }
  builder.lastHistoryKey = '';
  rebuildAll3D();
  markDirty();
  syncDockUI();
  showBuilderToast(toastMessage);
}

function undoLayout() {
  if (builder.undoStack.length === 0) return;
  builder.redoStack.push(cloneLayoutSnapshot(builder.layout));
  const prev = builder.undoStack.pop();
  restoreLayoutFromSnapshot(prev, 'تغییر قبلی بازگردانی شد.');
}

function redoLayout() {
  if (builder.redoStack.length === 0) return;
  builder.undoStack.push(cloneLayoutSnapshot(builder.layout));
  const next = builder.redoStack.pop();
  restoreLayoutFromSnapshot(next, 'تغییر مجدداً اعمال شد.');
}

function afterDraw(cb) {
  if (!builder.renderer) return;
  const gl = builder.renderer.getContext();
  if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext && gl.fenceSync) {
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (!builder.renderer) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        builder.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        builder.frameId = window.setTimeout(cb, 80);
      }
    };
    builder.frameId = window.setTimeout(poll, 5);
  } else {
    builder.frameId = window.setTimeout(cb, 80);
  }
}

function requestRender() {
  if (!builder.renderer || !builder.scene || !builder.camera) return;
  if (builder.renderBusy) {
    builder.renderDirty = true;
    return;
  }
  builder.renderBusy = true;
  builder.frameId = requestAnimationFrame((nowPerf) => {
    builder.renderDirty = false;

    if (builder.camTransitionActive && builder.controls) {
      const dt = Math.min(0.08, Math.max(0.004, (nowPerf - (builder.lastTransitionPerf || nowPerf)) / 1000));
      builder.lastTransitionPerf = nowPerf;
      const lambda = builder.isSoftwareGl ? 12 : 7;
      builder.camera.position.x = THREE.MathUtils.damp(builder.camera.position.x, _camGoalPos.x, lambda, dt);
      builder.camera.position.y = THREE.MathUtils.damp(builder.camera.position.y, _camGoalPos.y, lambda, dt);
      builder.camera.position.z = THREE.MathUtils.damp(builder.camera.position.z, _camGoalPos.z, lambda, dt);
      builder.controls.target.x = THREE.MathUtils.damp(builder.controls.target.x, _camGoalTarget.x, lambda, dt);
      builder.controls.target.y = THREE.MathUtils.damp(builder.controls.target.y, _camGoalTarget.y, lambda, dt);
      builder.controls.target.z = THREE.MathUtils.damp(builder.controls.target.z, _camGoalTarget.z, lambda, dt);

      const posDone = builder.camera.position.distanceTo(_camGoalPos) < 0.04;
      const tgtDone = builder.controls.target.distanceTo(_camGoalTarget) < 0.04;
      if (posDone && tgtDone) {
        builder.camera.position.copy(_camGoalPos);
        builder.controls.target.copy(_camGoalTarget);
        builder.camTransitionActive = false;
      } else {
        builder.renderDirty = true;
      }
    }

    if (builder.controls) {
      builder.controls.update();
    }
    builder.renderer.render(builder.scene, builder.camera);

    const done = () => {
      builder.renderBusy = false;
      if (builder.renderDirty || builder.camTransitionActive) {
        requestRender();
      }
    };
    if (builder.isSoftwareGl) afterDraw(done);
    else done();
  });
}

function setCameraPreset(preset, instant = false) {
  if (!builder.camera || !builder.controls) return;
  builder.lastCameraPreset = preset || 'hero';
  const fl = activeFloor();
  const { width, depth, height } = fl.room;
  const maxDim = Math.max(width, depth);
  const elevY = activeElevationY();
  const stackCount = builder.viewAllFloors ? builder.layout.floors.length : 1;
  const totalStackH = builder.viewAllFloors
    ? getFloorElevationY(builder.layout.floors, builder.layout.floors.length - 1) + height
    : height;
  const midStackY = builder.viewAllFloors ? totalStackH * 0.44 : elevY;

  if (preset === 'top') {
    _camGoalPos.set(0.01, elevY + maxDim * 1.42, 0.01);
    _camGoalTarget.set(0, elevY, 0.35);
  } else if (preset === 'inside') {
    _camGoalPos.set(width * 0.34, elevY + Math.min(2.1, height * 0.62), depth * 0.38);
    _camGoalTarget.set(-width * 0.14, elevY + 0.9, -depth * 0.22);
  } else if (preset === 'iso') {
    const pull = stackCount > 1 ? 1 + (stackCount - 1) * 0.22 : 1;
    _camGoalPos.set(maxDim * 0.92 * pull, midStackY + maxDim * 0.78 * pull, maxDim * 0.92 * pull);
    _camGoalTarget.set(0, midStackY - 0.25, 0.55);
  } else {
    const pull = stackCount > 1 ? 1 + (stackCount - 1) * 0.24 : 1;
    _camGoalPos.set(width * 0.82 * pull, midStackY + Math.max(9.2, maxDim * 0.74) * pull, depth * 1.18 * pull);
    _camGoalTarget.set(0, midStackY - 0.55, 0.95);
  }

  if (instant) {
    builder.camera.position.copy(_camGoalPos);
    builder.controls.target.copy(_camGoalTarget);
    builder.camTransitionActive = false;
    builder.controls.update();
    requestRender();
    return;
  }

  builder.camTransitionActive = true;
  builder.lastTransitionPerf = performance.now();
  requestRender();
}

function applyLightingMood() {
  if (!builder.scene || !builder.keyLight || !builder.hemiLight || !builder.rimLight) return;
  const fl = activeFloor();
  const mood = fl.room.mood;
  const lightTheme = isLightTheme();
  const accentHex = resolveLedColorHex(fl.room.ledColor, getActiveAccentHex());

  let bgHex = lightTheme ? 0xe9eef6 : 0x0b0f1a;
  if (mood === 'daylight') {
    bgHex = lightTheme ? 0xeef3fa : 0x182133;
    builder.keyLight.color.setHex(0xfff6e8);
    builder.keyLight.intensity = 2.05;
    builder.hemiLight.color.setHex(0xdbeafe);
    builder.hemiLight.groundColor.setHex(0x475569);
    builder.hemiLight.intensity = 1.08;
    builder.rimLight.color.setHex(0x93c5fd);
    builder.rimLight.intensity = 0.55;
  } else if (mood === 'lounge') {
    bgHex = lightTheme ? 0xe8e5e0 : 0x0e0b14;
    builder.keyLight.color.setHex(0xffd29d);
    builder.keyLight.intensity = 1.42;
    builder.hemiLight.color.setHex(0x94a3b8);
    builder.hemiLight.groundColor.setHex(0x271d18);
    builder.hemiLight.intensity = 0.65;
    builder.rimLight.color.set(accentHex);
    builder.rimLight.intensity = 0.85;
  } else if (mood === 'neon-club') {
    bgHex = lightTheme ? 0xe4e9f7 : 0x070a14;
    builder.keyLight.color.setHex(0xe0f2fe);
    builder.keyLight.intensity = 1.38;
    builder.hemiLight.color.setHex(0x38bdf8);
    builder.hemiLight.groundColor.setHex(0x1e1b4b);
    builder.hemiLight.intensity = 0.72;
    builder.rimLight.color.set(accentHex);
    builder.rimLight.intensity = 1.15;
  } else if (mood === 'warm-club') {
    bgHex = lightTheme ? 0xefe9df : 0x120e0b;
    builder.keyLight.color.setHex(0xffdfaa);
    builder.keyLight.intensity = 1.72;
    builder.hemiLight.color.setHex(0xfde68a);
    builder.hemiLight.groundColor.setHex(0x312115);
    builder.hemiLight.intensity = 0.68;
    builder.rimLight.color.setHex(0xf59e0b);
    builder.rimLight.intensity = 0.78;
  } else {
    bgHex = lightTheme ? 0xe6ecf5 : 0x0a0d16;
    builder.keyLight.color.setHex(0xfff3e0);
    builder.keyLight.intensity = 1.65;
    builder.hemiLight.color.setHex(0xa5b4fc);
    builder.hemiLight.groundColor.setHex(0x1e293b);
    builder.hemiLight.intensity = 0.78;
    builder.rimLight.color.set(accentHex);
    builder.rimLight.intensity = 0.82;
  }

  builder.scene.background = new THREE.Color(bgHex);
  builder.scene.fog = new THREE.FogExp2(bgHex, builder.viewAllFloors ? 0.009 : 0.014);
  requestRender();
}

function getFloorsToRender() {
  const floors = builder.layout.floors || [];
  if (builder.viewAllFloors && floors.length > 1) {
    return floors.map((floor, idx) => ({
      floor,
      index: idx,
      isActive: idx === builder.layout.activeFloorIndex,
      elevationY: getFloorElevationY(floors, idx),
    }));
  }
  const activeIdx = builder.layout.activeFloorIndex;
  return [
    {
      floor: floors[activeIdx] || floors[0],
      index: activeIdx,
      isActive: true,
      elevationY: 0,
    },
  ];
}

function rebuildRoom3D() {
  if (!builder.roomContainer || !builder.renderer) return;
  while (builder.roomContainer.children.length > 0) {
    const child = builder.roomContainer.children[0];
    builder.roomContainer.remove(child);
    disposeObject3D(child);
  }

  syncGroundPlane();
  const maxAniso = builder.renderer.capabilities.getMaxAnisotropy();
  const accentHex = getActiveAccentHex();
  const floorsToRender = getFloorsToRender();
  const showLabels = builder.viewAllFloors && floorsToRender.length > 1;

  builder.floorHitMesh = null;
  builder.gridGroup = null;

  for (const entry of floorsToRender) {
    const { group, floorMesh, gridGroup } = buildRoomShell(entry.floor.room, accentHex, maxAniso, {
      elevationY: entry.elevationY,
      isUpperFloor: builder.viewAllFloors && entry.index > 0,
      isActiveFloor: entry.isActive,
      floorName: entry.floor.name,
      showFloorLabel: showLabels,
    });
    builder.roomContainer.add(group);
    if (entry.isActive) {
      builder.floorHitMesh = floorMesh;
      builder.gridGroup = gridGroup;
      builder.gridGroup.visible = builder.gridSnap;
    }
  }

  // Adjust directional shadow camera bounds cleanly
  if (builder.keyLight) {
    const fl = activeFloor();
    const d = Math.max(fl.room.width, fl.room.depth) * 0.78 + 3;
    builder.keyLight.shadow.camera.left = -d;
    builder.keyLight.shadow.camera.right = d;
    builder.keyLight.shadow.camera.top = d;
    builder.keyLight.shadow.camera.bottom = -d;
    builder.keyLight.shadow.camera.updateProjectionMatrix();
  }

  applyLightingMood();
  applyRenderMode();
  requestRender();
}

function rebuildWalls3D() {
  if (!builder.wallsContainer || !builder.renderer) return;
  while (builder.wallsContainer.children.length > 0) {
    const child = builder.wallsContainer.children[0];
    builder.wallsContainer.remove(child);
    disposeObject3D(child);
  }
  builder.wallMeshMap.clear();
  builder.wallPickProxies = [];

  const accentHex = getActiveAccentHex();
  const maxAniso = builder.renderer.capabilities.getMaxAnisotropy();
  const floorsToRender = getFloorsToRender();

  for (const entry of floorsToRender) {
    const walls = entry.floor.walls || [];
    for (const wall of walls) {
      const isSelected = entry.isActive && wall.id === builder.selectedWallId;
      const mesh = buildInteriorWallMesh(wall, entry.floor.room, accentHex, maxAniso, {
        elevationY: entry.elevationY,
        isSelected,
        isInteractive: entry.isActive,
      });
      builder.wallsContainer.add(mesh);
      if (entry.isActive) {
        builder.wallMeshMap.set(wall.id, mesh);
        const proxy = mesh.getObjectByName('WallPickProxy');
        if (proxy) builder.wallPickProxies.push(proxy);
      }
    }
  }

  applyRenderMode();
  requestRender();
}

function applyRenderMode() {
  const fl = activeFloor();
  const style = resolveGridRenderStyle(builder.renderMode, fl.room.floor, builder.gridSnap);

  const applyToSubtree = (root) => {
    if (!root) return;
    root.traverse((obj) => {
      if (
        obj.name === 'PickProxy' ||
        obj.name === 'WallPickProxy' ||
        obj.name === 'StationBadge' ||
        obj.name === 'FloorLevelBadge' ||
        obj.name === 'WallLengthLabel'
      ) {
        return;
      }
      if (obj.name === 'ContactShadow') {
        obj.visible = style.showContactShadows;
        return;
      }
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if ('wireframe' in mat && mat.wireframe !== style.wireframe) {
          mat.wireframe = style.wireframe;
          mat.needsUpdate = true;
        }
      }
    });
  };

  applyToSubtree(builder.roomContainer);
  applyToSubtree(builder.wallsContainer);
  applyToSubtree(builder.itemsContainer);

  if (builder.gridGroup) {
    builder.gridGroup.visible = style.gridVisible;
    const isLightFloor = fl.room.floor === 'marble-light';
    const accentColor = new THREE.Color(getActiveAccentHex());
    const majorLines = builder.gridGroup.getObjectByName('MajorGridLines');
    const minorLines = builder.gridGroup.getObjectByName('MinorGridLines');

    if (majorLines && majorLines.material) {
      majorLines.material.opacity = style.majorOpacity;
      if (style.wireframe) {
        majorLines.material.color.copy(
          isLightFloor ? accentColor : accentColor.clone().lerp(new THREE.Color(0x38bdf8), 0.35)
        );
      } else {
        majorLines.material.color.copy(
          isLightFloor
            ? new THREE.Color(0x475569)
            : accentColor.clone().lerp(new THREE.Color(0xcbd5e1), 0.55)
        );
      }
      majorLines.material.needsUpdate = true;
    }

    if (minorLines && minorLines.material) {
      minorLines.material.opacity = style.minorOpacity;
      minorLines.material.color.setHex(
        style.wireframe
          ? isLightFloor
            ? 0x475569
            : 0x7dd3fc
          : isLightFloor
            ? 0x64748b
            : 0x94a3b8
      );
      minorLines.material.needsUpdate = true;
    }
  }

  requestRender();
}

function toggleRenderMode() {
  builder.renderMode = builder.renderMode === 'wireframe' ? 'solid' : 'wireframe';
  applyRenderMode();
  syncDockUI();
  showBuilderToast(
    builder.renderMode === 'wireframe'
      ? 'نمای سیمی (Wireframe) شبکه سه‌بعدی فعال شد.'
      : 'نمای توپر (Solid) سه‌بعدی فعال شد.'
  );
}

function getStationTimerState(tableNumber, nowSec = Math.floor(Date.now() / 1000)) {
  const key = String(tableNumber ?? '').trim();
  if (!key) return formatStationMiniTimer(null, null, null, nowSec);
  const res = builder.reservationsByTable.get(key) || null;
  const clickSec = builder.clickTimesByTable.get(key) ?? null;
  const finishSec = builder.finishTimesByTable.get(key) ?? null;
  return formatStationMiniTimer(res, clickSec, finishSec, nowSec);
}

function registerStationTimerSprite(item, model) {
  if (!item || !model) return;
  const sprite = model.getObjectByName('StationBadge');
  if (sprite && sprite.userData?.timerCanvas && sprite.userData?.timerTexture) {
    builder.stationTimerSprites.set(item.id, {
      tableNumber: String(item.tableNumber || ''),
      deviceLabel: String(sprite.userData.deviceLabel || ''),
      sprite,
      canvas: sprite.userData.timerCanvas,
      texture: sprite.userData.timerTexture,
    });
  } else {
    builder.stationTimerSprites.delete(item.id);
  }
}

function refreshStationTimerSprites() {
  if (!builder.mounted || builder.stationTimerSprites.size === 0) return;
  const pane = document.getElementById('mgMyGamenetView');
  if (pane && pane.hasAttribute('hidden')) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const accentHex = getActiveAccentHex();
  let anyChanged = false;

  for (const entry of builder.stationTimerSprites.values()) {
    const state = getStationTimerState(entry.tableNumber, nowSec);
    if (
      state.text !== entry.sprite.userData.lastText ||
      state.status !== entry.sprite.userData.lastStatus
    ) {
      drawStationTimerCanvas(
        entry.canvas,
        entry.tableNumber,
        state,
        accentHex,
        entry.deviceLabel
      );
      entry.texture.needsUpdate = true;
      entry.sprite.userData.lastText = state.text;
      entry.sprite.userData.lastStatus = state.status;
      anyChanged = true;
    }
  }

  if (anyChanged) {
    requestRender();
  }
}

function ensure3DTimerLoop() {
  if (builder.timerTickId) return;
  builder.timerTickId = window.setInterval(() => {
    refreshStationTimerSprites();
  }, 1000);
}

function rebuildItems3D() {
  if (!builder.itemsContainer || !builder.renderer) return;
  while (builder.itemsContainer.children.length > 0) {
    const child = builder.itemsContainer.children[0];
    builder.itemsContainer.remove(child);
    disposeObject3D(child);
  }
  builder.itemMeshMap.clear();
  builder.stationTimerSprites.clear();
  builder.pickProxies = [];

  const accentHex = getActiveAccentHex();
  const maxAniso = builder.renderer.capabilities.getMaxAnisotropy();
  const nowSec = Math.floor(Date.now() / 1000);
  const floorsToRender = getFloorsToRender();

  for (const entry of floorsToRender) {
    const items = entry.floor.items || [];
    for (const item of items) {
      const timerState = getStationTimerState(item.tableNumber, nowSec);
      const isOccupied = Boolean(timerState.isOccupied);
      const model = buildFurnitureModel(item, {
        accentHex,
        isOccupied,
        timerState,
        anisotropy: maxAniso,
        elevationY: entry.elevationY,
        showBadge: entry.isActive,
        isInteractive: entry.isActive,
      });
      builder.itemsContainer.add(model);
      if (entry.isActive) {
        builder.itemMeshMap.set(item.id, model);
        registerStationTimerSprite(item, model);
        const proxy = model.getObjectByName('PickProxy');
        if (proxy) builder.pickProxies.push(proxy);
      }
    }
  }

  applyRenderMode();
  updateSelectionRing();
  requestRender();
}

function rebuildSingleItem3D(item) {
  if (!builder.itemsContainer || !builder.renderer || !item) return;
  const old = builder.itemMeshMap.get(item.id);
  if (old) {
    builder.itemsContainer.remove(old);
    disposeObject3D(old);
    builder.itemMeshMap.delete(item.id);
    builder.stationTimerSprites.delete(item.id);
    builder.pickProxies = builder.pickProxies.filter((p) => p.userData.pickItemId !== item.id);
  }
  const accentHex = getActiveAccentHex();
  const maxAniso = builder.renderer.capabilities.getMaxAnisotropy();
  const timerState = getStationTimerState(item.tableNumber);
  const isOccupied = Boolean(timerState.isOccupied);
  const model = buildFurnitureModel(item, {
    accentHex,
    isOccupied,
    timerState,
    anisotropy: maxAniso,
    elevationY: activeElevationY(),
    showBadge: true,
    isInteractive: true,
  });
  builder.itemsContainer.add(model);
  builder.itemMeshMap.set(item.id, model);
  registerStationTimerSprite(item, model);
  const proxy = model.getObjectByName('PickProxy');
  if (proxy) builder.pickProxies.push(proxy);
  applyRenderMode();
  updateSelectionRing();
  requestRender();
}

function rebuildAll3D() {
  syncActiveFloorAliases(builder.layout);
  rebuildRoom3D();
  rebuildWalls3D();
  rebuildItems3D();
}

function updateSelectionRing() {
  if (!builder.selectionRing) return;
  const fl = activeFloor();
  const item = fl.items.find((i) => i.id === builder.selectedId);
  if (!item) {
    builder.selectionRing.visible = false;
    requestRender();
    return;
  }
  const spec = getCatalogItem(item.type);
  if (!spec) {
    builder.selectionRing.visible = false;
    return;
  }

  const fill = builder.selectionRing.getObjectByName('SelFill');
  const border = builder.selectionRing.getObjectByName('SelBorder');
  if (fill) {
    fill.scale.set(spec.width + 0.22, spec.depth + 0.22, 1);
    fill.material.color.set(getActiveAccentHex());
    fill.material.opacity = 0.24;
  }
  if (border) {
    border.scale.set(spec.width + 0.22, 1, spec.depth + 0.22);
  }
  builder.selectionRing.position.set(item.x, activeElevationY(), item.z);
  builder.selectionRing.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);
  builder.selectionRing.visible = true;
  requestRender();
}

function clearPlacementMode() {
  builder.placingType = null;
  builder.movingItemId = null;
  if (builder.placementGhost && builder.scene) {
    builder.scene.remove(builder.placementGhost);
    disposeObject3D(builder.placementGhost);
    builder.placementGhost = null;
  }
  const canvas = builder.renderer?.domElement;
  if (canvas && !builder.wallDrawMode) canvas.style.cursor = 'grab';
  syncDockUI();
  requestRender();
}

function enterWallDrawMode(style = null) {
  if (style) builder.wallStyle = style;
  clearPlacementMode();
  builder.selectedId = null;
  builder.selectedWallId = null;
  updateSelectionRing();
  rebuildWalls3D();

  builder.wallDrawMode = true;
  builder.wallDrawStart = null;
  builder.wallDrawHover = null;
  builder.activeTab = 'walls';
  if (builder.dockCollapsed) builder.dockCollapsed = false;

  const canvas = builder.renderer?.domElement;
  if (canvas) canvas.style.cursor = 'crosshair';
  updateWallPreviewVisual();
  syncDockUI();
  requestRender();
}

function exitWallDrawMode(syncUi = true) {
  builder.wallDrawMode = false;
  builder.wallDrawStart = null;
  builder.wallDrawHover = null;
  updateWallPreviewVisual();
  const canvas = builder.renderer?.domElement;
  if (canvas && !builder.placingType) canvas.style.cursor = 'grab';
  if (syncUi) syncDockUI();
  requestRender();
}

function updateWallPreviewVisual() {
  if (!builder.wallPreviewGroup) return;
  if (!builder.wallDrawMode) {
    builder.wallPreviewGroup.visible = false;
    return;
  }
  const fl = activeFloor();
  updateWallPreviewGroup(
    builder.wallPreviewGroup,
    builder.wallDrawStart,
    builder.wallDrawHover,
    fl.room,
    builder.wallStyle,
    activeElevationY()
  );
  requestRender();
}

function handleWallDrawClick(worldPt) {
  const fl = activeFloor();
  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;

  if (!builder.wallDrawStart) {
    const start = snapWallPointToRoom(worldPt.x, worldPt.z, fl.room, step);
    builder.wallDrawStart = start;
    builder.wallDrawHover = start;
    updateWallPreviewVisual();
    syncDockUI();
    return;
  }

  const end = snapWallEndpoint(
    builder.wallDrawStart.x,
    builder.wallDrawStart.z,
    worldPt.x,
    worldPt.z,
    fl.room,
    { gridStep: step, orthoSnap: builder.wallOrthoSnap }
  );

  const seg = createWallSegment(
    builder.wallDrawStart.x,
    builder.wallDrawStart.z,
    end.x,
    end.z,
    fl.room,
    builder.wallStyle
  );

  if (!seg) {
    showBuilderToast('طول دیوار باید حداقل نیم متر باشد.');
    return;
  }

  pushHistorySnapshot();
  fl.walls.push(seg);
  syncActiveFloorAliases(builder.layout);
  rebuildWalls3D();
  markDirty();

  // Chain cleanly from endpoint for fast multi-wall room drawing!
  builder.wallDrawStart = { x: seg.x2, z: seg.z2 };
  builder.wallDrawHover = { x: seg.x2, z: seg.z2 };
  updateWallPreviewVisual();
  syncDockUI();

  const styleSpec = getWallStyleSpec(seg.style);
  const len = getWallMetrics(seg).length.toFixed(1).replace(/\.0$/, '');
  showBuilderToast(`${styleSpec.label} (${toPersianDigits(len)} متر) رسم شد — کلیک بعدی یا راست‌کلیک برای پایان.`);
}

function selectWall(wallId) {
  clearPlacementMode();
  if (builder.wallDrawMode) exitWallDrawMode(false);
  builder.selectedId = null;
  builder.selectedWallId = wallId || null;
  updateSelectionRing();
  if (builder.selectedWallId) {
    builder.activeTab = 'selected';
    if (builder.dockCollapsed) builder.dockCollapsed = false;
  } else if (builder.activeTab === 'selected') {
    builder.activeTab = 'walls';
  }
  rebuildWalls3D();
  syncDockUI();
}

function updateSelectedWallStyle(newStyle) {
  const fl = activeFloor();
  const wall = fl.walls.find((w) => w.id === builder.selectedWallId);
  if (!wall) return;
  const spec = getWallStyleSpec(newStyle);
  pushHistorySnapshot();
  wall.style = spec.id;
  wall.thickness = spec.thickness;
  rebuildWalls3D();
  markDirty();
  syncDockUI();
}

function deleteSelectedWall() {
  if (!builder.selectedWallId) return;
  const fl = activeFloor();
  const idx = fl.walls.findIndex((w) => w.id === builder.selectedWallId);
  if (idx === -1) return;
  pushHistorySnapshot();
  fl.walls.splice(idx, 1);
  syncActiveFloorAliases(builder.layout);
  builder.selectedWallId = null;
  builder.activeTab = 'walls';
  rebuildWalls3D();
  markDirty();
  syncDockUI();
  showBuilderToast('دیوار داخلی حذف شد.');
}

function clearFloorWalls() {
  const fl = activeFloor();
  if (!fl.walls.length) return;
  pushHistorySnapshot();
  fl.walls = [];
  syncActiveFloorAliases(builder.layout);
  builder.selectedWallId = null;
  builder.wallDrawStart = null;
  rebuildWalls3D();
  updateWallPreviewVisual();
  markDirty();
  syncDockUI();
  showBuilderToast('همه دیوارهای داخلی این طبقه پاک شدند.');
}

function enterPlacementMode(type) {
  if (!getCatalogItem(type)) return;
  if (builder.wallDrawMode) exitWallDrawMode(false);
  if (builder.placingType === type && !builder.movingItemId) {
    clearPlacementMode();
    return;
  }
  clearPlacementMode();
  builder.selectedId = null;
  builder.selectedWallId = null;
  updateSelectionRing();
  rebuildWalls3D();

  builder.placingType = type;
  builder.movingItemId = null;
  builder.placingRotation = 0;
  builder.placementGhost = buildPlacementGhost(type);
  builder.placementGhost.visible = false;
  if (builder.scene) builder.scene.add(builder.placementGhost);

  const canvas = builder.renderer?.domElement;
  if (canvas) canvas.style.cursor = 'crosshair';
  syncDockUI();
  requestRender();
}

function enterMoveMode(itemId) {
  const fl = activeFloor();
  const item = fl.items.find((i) => i.id === itemId);
  if (!item || !getCatalogItem(item.type)) return;
  if (builder.wallDrawMode) exitWallDrawMode(false);
  if (builder.movingItemId === item.id) {
    clearPlacementMode();
    return;
  }
  clearPlacementMode();
  builder.selectedId = item.id;
  builder.selectedWallId = null;
  builder.movingItemId = item.id;
  builder.placingType = item.type;
  builder.placingRotation = normalizeRotationDeg(item.rotation || 0);
  builder.placementGhost = buildPlacementGhost(item.type);
  builder.placementGhost.position.set(item.x, activeElevationY(), item.z);
  builder.placementGhost.rotation.y = THREE.MathUtils.degToRad(builder.placingRotation);
  builder.placementGhost.visible = true;
  builder.placingValid = true;
  if (builder.scene) builder.scene.add(builder.placementGhost);

  const canvas = builder.renderer?.domElement;
  if (canvas) canvas.style.cursor = 'crosshair';
  syncDockUI();
  requestRender();
}

function updateGhostAtPoint(worldPt) {
  if (!builder.placingType || !builder.placementGhost) return;
  const fl = activeFloor();
  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;
  const ignoreId = builder.movingItemId || null;
  const candidate = clampItemToRoom(
    {
      id: ignoreId || '__ghost__',
      type: builder.placingType,
      x: worldPt.x,
      z: worldPt.z,
      rotation: builder.placingRotation,
    },
    fl.room,
    step
  );

  const collides = checkItemCollision(candidate, fl.items, ignoreId, 0.08, fl.walls);
  builder.placingValid = !collides;
  builder.placementGhost.position.set(candidate.x, activeElevationY(), candidate.z);
  builder.placementGhost.rotation.y = THREE.MathUtils.degToRad(candidate.rotation);
  builder.placementGhost.visible = true;

  const box = builder.placementGhost.getObjectByName('GhostBox');
  const edges = builder.placementGhost.getObjectByName('GhostEdges');
  const pad = builder.placementGhost.getObjectByName('GhostPad');
  if (box) box.material.color.setHex(collides ? 0xef4444 : 0x22c55e);
  if (edges) edges.material.color.setHex(collides ? 0xf87171 : 0x4ade80);
  if (pad) pad.material.color.setHex(collides ? 0xef4444 : 0x22c55e);
  requestRender();
}

function markDirty() {
  builder.hasUnsavedChanges = true;
  updateTopHudStats();
}

function placeItemAtGhost(keepPlacing = false) {
  if (!builder.placingType || !builder.placementGhost || !builder.placementGhost.visible) return;
  if (!builder.placingValid) {
    showBuilderToast('این فضا با دیوار یا وسیله دیگری هم‌پوشانی دارد؛ نقطه آزاد را انتخاب کنید.');
    return;
  }

  const fl = activeFloor();
  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;

  if (builder.movingItemId) {
    const item = fl.items.find((i) => i.id === builder.movingItemId);
    if (!item) {
      clearPlacementMode();
      return;
    }
    const movedRes = moveItemToPoint(
      { ...item, rotation: builder.placingRotation },
      builder.placementGhost.position.x,
      builder.placementGhost.position.z,
      fl.room,
      fl.items,
      step,
      fl.walls
    );
    if (!movedRes.ok || !movedRes.item) {
      showBuilderToast('این فضا با دیوار یا وسیله دیگری هم‌پوشانی دارد؛ نقطه آزاد را انتخاب کنید.');
      return;
    }
    pushHistorySnapshot();
    Object.assign(item, movedRes.item);
    const mesh = builder.itemMeshMap.get(item.id);
    if (mesh) {
      mesh.position.set(item.x, activeElevationY(), item.z);
      mesh.rotation.y = THREE.MathUtils.degToRad(item.rotation);
    }
    markDirty();
    const spec = getCatalogItem(item.type);
    const targetId = item.id;
    clearPlacementMode();
    selectItem(targetId);
    showBuilderToast(`${spec ? spec.name : 'آیتم'} به موقعیت جدید منتقل شد.`);
    return;
  }

  const newId = `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const spec = getCatalogItem(builder.placingType);
  const newItem = clampItemToRoom(
    {
      id: newId,
      type: builder.placingType,
      x: builder.placementGhost.position.x,
      z: builder.placementGhost.position.z,
      rotation: builder.placingRotation,
      tableNumber: assignNextStationNumber(builder.layout, builder.placingType),
      ...(spec?.defaultVariant ? { variant: spec.defaultVariant } : {}),
    },
    fl.room,
    step
  );

  pushHistorySnapshot();
  fl.items.push(newItem);
  syncActiveFloorAliases(builder.layout);
  rebuildSingleItem3D(newItem);
  markDirty();

  showBuilderToast(`${spec ? spec.name : 'آیتم'} روی نقشه قرار گرفت.`);

  if (!keepPlacing) {
    clearPlacementMode();
    selectItem(newItem.id);
  }
}

function selectItem(id) {
  const prevWall = builder.selectedWallId;
  builder.selectedId = id || null;
  builder.selectedWallId = null;
  if (prevWall) rebuildWalls3D();

  if (builder.selectedId) {
    builder.activeTab = 'selected';
    if (builder.dockCollapsed) builder.dockCollapsed = false;
  } else if (builder.activeTab === 'selected') {
    builder.activeTab = 'catalog';
  }
  updateSelectionRing();
  syncDockUI();
}

function rotateSelectedItem(deltaDeg = 90) {
  if (builder.placingType && builder.placementGhost) {
    builder.placingRotation = normalizeRotationDeg(builder.placingRotation + deltaDeg);
    updateGhostAtPoint(builder.placementGhost.position);
    return;
  }
  const fl = activeFloor();
  const item = fl.items.find((i) => i.id === builder.selectedId);
  if (!item) return;

  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;
  const rotated = clampItemToRoom(
    { ...item, rotation: normalizeRotationDeg(item.rotation + deltaDeg) },
    fl.room,
    step
  );
  if (checkItemCollision(rotated, fl.items, item.id, 0.08, fl.walls)) {
    showBuilderToast('فضای کافی برای چرخش در این نقطه نیست؛ ابتدا کمی جابه‌جا کنید.');
    return;
  }
  pushHistorySnapshot();
  Object.assign(item, rotated);
  const mesh = builder.itemMeshMap.get(item.id);
  if (mesh) {
    mesh.position.set(item.x, activeElevationY(), item.z);
    mesh.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  }
  updateSelectionRing();
  markDirty();
  syncDockUI();
}

function duplicateSelectedItem() {
  const fl = activeFloor();
  const src = fl.items.find((i) => i.id === builder.selectedId);
  if (!src) return;
  const spec = getCatalogItem(src.type);
  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;

  const offsets = [
    [spec.width + 0.2, 0],
    [-(spec.width + 0.2), 0],
    [0, spec.depth + 0.2],
    [0, -(spec.depth + 0.2)],
    [1.5, 1.5],
  ];

  let placed = null;
  for (const [dx, dz] of offsets) {
    const cand = clampItemToRoom(
      {
        id: `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        type: src.type,
        x: src.x + dx,
        z: src.z + dz,
        rotation: src.rotation,
        tableNumber: assignNextStationNumber(builder.layout, src.type),
        ...(src.variant ? { variant: src.variant } : {}),
        ...(src.tint ? { tint: src.tint } : {}),
      },
      fl.room,
      step
    );
    if (!checkItemCollision(cand, fl.items, null, 0.08, fl.walls)) {
      placed = cand;
      break;
    }
  }

  if (!placed) {
    showBuilderToast('جای آزاد کنار این وسیله پیدا نشد؛ از کاتالوگ اضافه کنید.');
    return;
  }

  pushHistorySnapshot();
  fl.items.push(placed);
  syncActiveFloorAliases(builder.layout);
  rebuildSingleItem3D(placed);
  markDirty();
  selectItem(placed.id);
  showBuilderToast(`${spec ? spec.name : 'آیتم'} تکثیر شد.`);
}

function deleteSelectedItem() {
  if (builder.selectedWallId) {
    deleteSelectedWall();
    return;
  }
  if (!builder.selectedId) return;
  const fl = activeFloor();
  const idx = fl.items.findIndex((i) => i.id === builder.selectedId);
  if (idx === -1) return;
  pushHistorySnapshot();
  const [removed] = fl.items.splice(idx, 1);
  syncActiveFloorAliases(builder.layout);

  const mesh = builder.itemMeshMap.get(removed.id);
  if (mesh && builder.itemsContainer) {
    builder.itemsContainer.remove(mesh);
    disposeObject3D(mesh);
    builder.itemMeshMap.delete(removed.id);
    builder.stationTimerSprites.delete(removed.id);
    builder.pickProxies = builder.pickProxies.filter((p) => p.userData.pickItemId !== removed.id);
  }
  builder.selectedId = null;
  builder.activeTab = 'catalog';
  updateSelectionRing();
  markDirty();
  syncDockUI();
  showBuilderToast('آیتم از سالن حذف شد.');
}

function updateSelectedItemStyle(patch) {
  const fl = activeFloor();
  const item = fl.items.find((i) => i.id === builder.selectedId);
  if (!item) return;
  pushHistorySnapshot();
  if ('variant' in patch) {
    if (patch.variant) item.variant = patch.variant;
    else delete item.variant;
  }
  if ('tint' in patch) {
    if (patch.tint && patch.tint !== 'default') item.tint = patch.tint;
    else delete item.tint;
  }
  rebuildSingleItem3D(item);
  markDirty();
  syncDockUI();
}

function updateRoomConfig(patch, coalesceKey = '') {
  pushHistorySnapshot(coalesceKey);
  const fl = activeFloor();
  fl.room = sanitizeLayout({
    room: { ...fl.room, ...patch },
    items: [],
  }).room;

  fl.items = fl.items.map((it) => clampItemToRoom(it, fl.room, 0));
  fl.walls = (fl.walls || [])
    .map((w) => createWallSegment(w.x1, w.z1, w.x2, w.z2, fl.room, w.style, w.id))
    .filter(Boolean);
  syncActiveFloorAliases(builder.layout);
  rebuildAll3D();
  markDirty();
  syncDockUI();
}

// --- Multi-Floor Actions ---
function switchActiveFloor(floorIndex) {
  const nextIdx = Math.max(0, Math.min(builder.layout.floors.length - 1, Number(floorIndex) || 0));
  if (nextIdx === builder.layout.activeFloorIndex) return;
  clearPlacementMode();
  if (builder.wallDrawMode) {
    builder.wallDrawStart = null;
    builder.wallDrawHover = null;
  }
  builder.selectedId = null;
  builder.selectedWallId = null;
  if (builder.activeTab === 'selected') builder.activeTab = 'catalog';

  setActiveFloorInLayout(builder.layout, nextIdx);
  rebuildAll3D();
  updateWallPreviewVisual();
  setCameraPreset(builder.lastCameraPreset || 'hero', false);
  syncDockUI();
  showBuilderToast(`طبقه فعال: ${activeFloor().name}`);
}

function addNewFloor(copyWalls = false) {
  if (builder.layout.floors.length >= FLOOR_LIMITS.maxFloors) {
    showBuilderToast(`حداکثر ${toPersianDigits(FLOOR_LIMITS.maxFloors)} طبقه پشتیبانی می‌شود.`);
    return;
  }
  pushHistorySnapshot();
  clearPlacementMode();
  builder.selectedId = null;
  builder.selectedWallId = null;

  const res = addFloorToLayout(builder.layout, { copyWalls });
  if (!res.ok) return;
  builder.layout = res.layout;
  rebuildAll3D();
  setCameraPreset('hero', false);
  markDirty();
  syncDockUI();
  showBuilderToast(`${res.floor.name} به ساختمان اضافه شد.`);
}

function removeCurrentOrTargetFloor(floorIndex) {
  if (builder.layout.floors.length <= 1) {
    showBuilderToast('حداقل یک طبقه باید وجود داشته باشد.');
    return;
  }
  pushHistorySnapshot();
  clearPlacementMode();
  builder.selectedId = null;
  builder.selectedWallId = null;
  const res = removeFloorFromLayout(builder.layout, floorIndex);
  if (!res.ok) return;
  builder.layout = res.layout;
  if (builder.layout.floors.length <= 1) builder.viewAllFloors = false;
  rebuildAll3D();
  setCameraPreset('hero', false);
  markDirty();
  syncDockUI();
  showBuilderToast('طبقه انتخاب‌شده حذف شد.');
}

function toggleViewAllFloors() {
  if (builder.layout.floors.length <= 1) {
    builder.viewAllFloors = false;
    return;
  }
  builder.viewAllFloors = !builder.viewAllFloors;
  rebuildAll3D();
  setCameraPreset(builder.viewAllFloors ? 'iso' : 'hero', false);
  syncDockUI();
  showBuilderToast(
    builder.viewAllFloors
      ? 'نمای کامل همه طبقات به صورت هم‌زمان فعال شد.'
      : `تمرکز روی ${activeFloor().name} فعال شد.`
  );
}

function applyStarterPreset(preset) {
  pushHistorySnapshot();
  clearPlacementMode();
  exitWallDrawMode(false);
  builder.selectedId = null;
  builder.selectedWallId = null;
  builder.viewAllFloors = false;
  if (builder.activeTab === 'selected') builder.activeTab = 'catalog';
  builder.layout = createStarterLayout(preset);
  rebuildAll3D();
  setCameraPreset('hero', false);
  markDirty();
  syncDockUI();
  const labels = {
    'pro-arena': 'چیدمان سالن پرچمدار بارگذاری شد.',
    'billiard-club': 'چیدمان باشگاه بیلیارد VIP بارگذاری شد.',
    compact: 'چیدمان سالن جمع‌وجور بارگذاری شد.',
    empty: 'فضای خالی آماده ساخت گیم‌نت اختصاصی شما از صفر است.',
  };
  showBuilderToast(labels[preset] || 'چیدمان به‌روزرسانی شد.');
}

async function saveLayoutToServer() {
  const saveBtn = document.getElementById('mg3dSaveBtn');
  if (saveBtn) saveBtn.disabled = true;

  try {
    syncActiveFloorAliases(builder.layout);
    const body = new URLSearchParams();
    body.set('layout', JSON.stringify(builder.layout));
    const res = await fetch('./save_layout.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || 'save_failed');
    }
    builder.hasUnsavedChanges = false;
    updateTopHudStats();
    try {
      sessionStorage.removeItem('mg_bundle_v1');
    } catch {
      // ignore storage errors
    }
    window.dispatchEvent(new CustomEvent('mg:layout-updated'));
    showBuilderToast('طراحی سه‌بعدی گیم‌نت ذخیره و با بخش میزها همگام شد.');
  } catch (err) {
    showBuilderToast(err?.message && err.message !== 'save_failed' ? err.message : 'خطا در ذخیره چیدمان.');
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

async function loadSavedLayoutAndReservations({ onlyReservations = false } = {}) {
  try {
    const bust = Date.now();
    const [layoutRes, resRes, clickRes, finishRes] = await Promise.all([
      onlyReservations
        ? Promise.resolve(null)
        : fetch('./gamenet_layout.json?t=' + bust, { cache: 'no-store' }).catch(() => null),
      fetch('./reservations.json?t=' + bust, { cache: 'no-store' }).catch(() => null),
      fetch('./clickTime.json?t=' + bust, { cache: 'no-store' }).catch(() => null),
      fetch('./finishTime.json?t=' + bust, { cache: 'no-store' }).catch(() => null),
    ]);

    if (resRes && resRes.ok) {
      const reservations = await resRes.json().catch(() => []);
      const list = Array.isArray(reservations) ? reservations : [];
      builder.occupiedTables = new Set(list.map((r) => String(r.tableNumber)));
      builder.reservationsByTable = new Map(list.map((r) => [String(r.tableNumber), r]));
    }

    if (clickRes && clickRes.ok) {
      const clicks = await clickRes.json().catch(() => []);
      builder.clickTimesByTable = new Map(
        (Array.isArray(clicks) ? clicks : []).map((c) => [String(c.tableNumber), Number(c.clickTime)])
      );
    }

    if (finishRes && finishRes.ok) {
      const finishes = await finishRes.json().catch(() => []);
      builder.finishTimesByTable = new Map(
        (Array.isArray(finishes) ? finishes : []).map((f) => [String(f.tableNumber), Number(f.finishTime)])
      );
    }

    if (!onlyReservations && layoutRes && layoutRes.ok) {
      const saved = await layoutRes.json().catch(() => null);
      if (saved && (Array.isArray(saved.floors) || (saved.room && Array.isArray(saved.items)))) {
        builder.layout = sanitizeLayout(saved);
        builder.hasUnsavedChanges = false;
      }
    }
  } catch {
    // Keep clean blank starter layout
  }
}

function updateCanvasMouse(event) {
  const canvas = builder.renderer?.domElement;
  if (!canvas) return false;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  _mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  _mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  return true;
}

function bindCanvasPointerEvents(canvas) {
  canvas.addEventListener('contextmenu', (e) => {
    if (builder.wallDrawMode) {
      e.preventDefault();
      if (builder.wallDrawStart) {
        builder.wallDrawStart = null;
        updateWallPreviewVisual();
        syncDockUI();
      } else {
        exitWallDrawMode();
      }
    }
  });

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (!updateCanvasMouse(e)) return;

    builder.pointerDownPos = { x: e.clientX, y: e.clientY };

    // 1. Wall Drawing Mode
    if (builder.wallDrawMode) {
      builder.pointerDownPos = null;
      syncGroundPlane();
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        handleWallDrawClick(_hitPoint);
      }
      return;
    }

    // 2. Furniture Placement / Click-to-Move Mode
    if (builder.placingType) {
      builder.pointerDownPos = null;
      syncGroundPlane();
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        updateGhostAtPoint(_hitPoint);
        placeItemAtGhost(e.shiftKey);
      }
      return;
    }

    // 3. Pick furniture item
    builder.raycaster.setFromCamera(_mouse, builder.camera);
    const hits = builder.raycaster.intersectObjects(builder.pickProxies, false);
    if (hits.length > 0) {
      const hitId = hits[0].object.userData.pickItemId;
      if (hitId) {
        selectItem(hitId);
        const fl = activeFloor();
        const item = fl.items.find((i) => i.id === hitId);
        syncGroundPlane();
        if (item && builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
          builder.draggingId = hitId;
          builder.dragStartSnapshot = { x: item.x, z: item.z };
          builder.dragHistoryPushed = false;
          _dragOffset.set(item.x - _hitPoint.x, 0, item.z - _hitPoint.z);
          if (builder.controls) builder.controls.enabled = false;
          canvas.style.cursor = 'grabbing';
        }
        return;
      }
    }

    // 4. Pick interior drawn wall
    const wallHits = builder.raycaster.intersectObjects(builder.wallPickProxies, false);
    if (wallHits.length > 0) {
      const hitWallId = wallHits[0].object.userData.pickWallId;
      if (hitWallId) {
        selectWall(hitWallId);
      }
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (!builder.draggingId && !builder.placingType && !builder.wallDrawMode && now - builder.lastMoveRaycast < 45) {
      return;
    }
    builder.lastMoveRaycast = now;
    if (!updateCanvasMouse(e)) return;

    if (builder.wallDrawMode) {
      syncGroundPlane();
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        const fl = activeFloor();
        const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;
        builder.wallDrawHover = builder.wallDrawStart
          ? snapWallEndpoint(
              builder.wallDrawStart.x,
              builder.wallDrawStart.z,
              _hitPoint.x,
              _hitPoint.z,
              fl.room,
              { gridStep: step, orthoSnap: builder.wallOrthoSnap }
            )
          : snapWallPointToRoom(_hitPoint.x, _hitPoint.z, fl.room, step);
        updateWallPreviewVisual();
      }
      return;
    }

    if (builder.placingType) {
      syncGroundPlane();
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        updateGhostAtPoint(_hitPoint);
      }
      return;
    }

    if (builder.draggingId) {
      const fl = activeFloor();
      const item = fl.items.find((i) => i.id === builder.draggingId);
      if (!item) return;
      syncGroundPlane();
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;
        const moved = moveItemToPoint(
          item,
          _hitPoint.x + _dragOffset.x,
          _hitPoint.z + _dragOffset.z,
          fl.room,
          fl.items,
          step,
          fl.walls
        );
        const mesh = builder.itemMeshMap.get(item.id);
        if (moved.ok && moved.item && mesh) {
          if (
            !builder.dragHistoryPushed &&
            (Math.abs(moved.item.x - item.x) > 0.01 || Math.abs(moved.item.z - item.z) > 0.01)
          ) {
            pushHistorySnapshot();
            builder.dragHistoryPushed = true;
          }
          item.x = moved.item.x;
          item.z = moved.item.z;
          mesh.position.set(item.x, activeElevationY(), item.z);
          updateSelectionRing();
          markDirty();
        }
      }
      return;
    }

    // Light hover cursor feedback
    builder.raycaster.setFromCamera(_mouse, builder.camera);
    const hits = builder.raycaster.intersectObjects(
      [...builder.pickProxies, ...builder.wallPickProxies],
      false
    );
    canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  });

  const finishDrag = (e) => {
    if (builder.draggingId) {
      builder.draggingId = null;
      builder.dragStartSnapshot = null;
      builder.dragHistoryPushed = false;
      if (builder.controls) builder.controls.enabled = true;
      canvas.style.cursor = 'grab';
      syncDockUI();
      requestRender();
      return;
    }
    if (!builder.placingType && !builder.wallDrawMode && builder.pointerDownPos) {
      const moved = Math.hypot(e.clientX - builder.pointerDownPos.x, e.clientY - builder.pointerDownPos.y);
      if (moved < 5 && updateCanvasMouse(e)) {
        builder.raycaster.setFromCamera(_mouse, builder.camera);
        const hits = builder.raycaster.intersectObjects(
          [...builder.pickProxies, ...builder.wallPickProxies],
          false
        );
        if (hits.length === 0 && (builder.selectedId || builder.selectedWallId)) {
          selectItem(null);
        }
      }
    }
    builder.pointerDownPos = null;
  };

  canvas.addEventListener('pointerup', finishDrag);
  canvas.addEventListener('pointercancel', finishDrag);
}

function updateTopHudStats() {
  const stats = summarizeLayoutStats(builder.layout);
  const fl = activeFloor();
  const specEl = document.getElementById('mg3dRoomSpecText');
  if (specEl) {
    specEl.textContent =
      `${fl.name} · ${toPersianDigits(fl.room.width)}×${toPersianDigits(fl.room.depth)} م (${toPersianDigits(stats.areaSqm)} م²) · ` +
      `${toPersianDigits(stats.floorCount)} طبقه · ${toPersianDigits(stats.totalWalls)} دیوار · ${toPersianDigits(stats.stations)} ایستگاه`;
  }

  const saveBtn = document.getElementById('mg3dSaveBtn');
  if (saveBtn) {
    saveBtn.textContent = builder.hasUnsavedChanges ? 'ذخیره تغییرات' : 'ذخیره‌شده';
    saveBtn.classList.toggle('is-dirty', builder.hasUnsavedChanges);
  }
}

function renderFloorStrip() {
  const stripEl = document.getElementById('mg3dFloorTabs');
  if (!stripEl) return;
  const floors = builder.layout.floors || [];

  const tabsHtml = floors
    .map((fl, idx) => {
      const active = idx === builder.layout.activeFloorIndex;
      return `<button type="button" class="mg3d-floor-pill ${active ? 'is-active' : ''}" data-3d-select-floor="${idx}" aria-pressed="${active ? 'true' : 'false'}">${fl.name}</button>`;
    })
    .join('');

  const addBtnHtml =
    floors.length < FLOOR_LIMITS.maxFloors
      ? `<button type="button" id="mg3dQuickAddFloorBtn" class="mg3d-floor-add-btn" title="افزودن طبقه جدید">+ طبقه</button>`
      : '';

  const allToggleHtml =
    floors.length > 1
      ? `<button type="button" id="mg3dAllFloorsToggleBtn" class="mg3d-floor-view-btn ${builder.viewAllFloors ? 'is-active' : ''}" aria-pressed="${builder.viewAllFloors ? 'true' : 'false'}">${builder.viewAllFloors ? 'همه طبقات' : 'فقط این طبقه'}</button>`
      : '';

  stripEl.innerHTML = `${tabsHtml}${addBtnHtml}${allToggleHtml}`;
}

function renderFloorsDockPane() {
  const listEl = document.getElementById('mg3dFloorManagerList');
  if (!listEl) return;
  const floors = builder.layout.floors || [];

  listEl.innerHTML = floors
    .map((fl, idx) => {
      const isActive = idx === builder.layout.activeFloorIndex;
      const canDelete = floors.length > 1;
      return `
        <div class="mg3d-floor-card ${isActive ? 'is-active' : ''}">
          <button type="button" class="mg3d-floor-card-main" data-3d-select-floor="${idx}">
            <strong>${fl.name}</strong>
            <span>${toPersianDigits(fl.items.length)} وسیله · ${toPersianDigits(fl.walls.length)} دیوار</span>
          </button>
          ${
            canDelete
              ? `<button type="button" class="mg3d-floor-del-btn" data-3d-del-floor="${idx}" title="حذف این طبقه" aria-label="حذف ${fl.name}">×</button>`
              : ''
          }
        </div>
      `;
    })
    .join('');

  const nameInput = document.getElementById('mg3dFloorNameInput');
  if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = activeFloor().name;
  }

  const addEmptyBtn = document.getElementById('mg3dAddFloorEmptyBtn');
  const addCopyBtn = document.getElementById('mg3dAddFloorCopyBtn');
  const maxReached = floors.length >= FLOOR_LIMITS.maxFloors;
  if (addEmptyBtn) addEmptyBtn.disabled = maxReached;
  if (addCopyBtn) addCopyBtn.disabled = maxReached;

  const stackBtn = document.getElementById('mg3dFloorsStackToggleBtn');
  if (stackBtn) {
    stackBtn.disabled = floors.length <= 1;
    stackBtn.classList.toggle('is-active', builder.viewAllFloors);
    stackBtn.textContent = builder.viewAllFloors ? 'نمای همه طبقات: روشن' : 'نمای همه طبقات: خاموش';
  }
}

function renderCatalogCards() {
  const listEl = document.getElementById('mg3dCatalogList');
  if (!listEl) return;

  const filtered =
    builder.activeCategory === 'all'
      ? ITEM_CATALOG
      : ITEM_CATALOG.filter((item) => item.category === builder.activeCategory);

  listEl.innerHTML = filtered
    .map((item) => {
      const isPlacing = builder.placingType === item.type;
      return `
        <button type="button" class="mg3d-catalog-item ${isPlacing ? 'is-active' : ''}" data-place-type="${item.type}" aria-pressed="${isPlacing ? 'true' : 'false'}">
          <span class="mg3d-cat-swatch" style="--item-tint: ${item.accentColor}"></span>
          <span class="mg3d-cat-info">
            <strong class="mg3d-cat-name">${item.name}</strong>
            <span class="mg3d-cat-dim">${toPersianDigits(item.width)}×${toPersianDigits(item.depth)} م</span>
          </span>
        </button>
      `;
    })
    .join('');
}

function syncDockUI() {
  updateTopHudStats();
  renderFloorStrip();
  renderFloorsDockPane();

  const fl = activeFloor();
  const dock = document.getElementById('mg3dBottomDock');
  const toggleBtn = document.getElementById('mg3dDockToggle');
  if (dock) dock.classList.toggle('is-collapsed', builder.dockCollapsed);
  if (toggleBtn) {
    toggleBtn.textContent = builder.dockCollapsed ? '▴ نمایش ابزارهای طراحی' : '▾ مخفی کردن ابزارها';
    toggleBtn.setAttribute('aria-expanded', builder.dockCollapsed ? 'false' : 'true');
  }

  const shell = document.getElementById('mg3dBuilderShell');
  if (shell) {
    shell.dataset.editorMode = builder.wallDrawMode
      ? 'draw-wall'
      : builder.movingItemId
        ? 'move'
        : builder.placingType
          ? 'add'
          : 'idle';
    shell.dataset.selectedId = builder.selectedId || '';
    shell.dataset.selectedWallId = builder.selectedWallId || '';
    shell.dataset.itemCount = String(fl.items.length);
    shell.dataset.wallCount = String(fl.walls.length);
    shell.dataset.floorCount = String(builder.layout.floors.length);
    shell.dataset.activeFloor = String(builder.layout.activeFloorIndex);
    shell.dataset.viewAllFloors = builder.viewAllFloors ? '1' : '0';
    shell.dataset.renderMode = builder.renderMode;
  }

  const wireToggleBtn = document.getElementById('mg3dWireframeToggleBtn');
  const wireToggleLabel = document.getElementById('mg3dWireframeToggleLabel');
  if (wireToggleBtn) {
    const isWire = builder.renderMode === 'wireframe';
    wireToggleBtn.classList.toggle('is-active', isWire);
    wireToggleBtn.setAttribute('aria-pressed', isWire ? 'true' : 'false');
    wireToggleBtn.dataset.renderMode = builder.renderMode;
    if (wireToggleLabel) {
      wireToggleLabel.textContent = isWire ? 'نمای سیمی' : 'نمای توپر';
    }
  }

  // Empty scratch-start subtle guide banner (non-blocking, disappears as soon as user starts building or opens walls/floors tools)
  const emptyPrompt = document.getElementById('mg3dEmptyScratchBar');
  if (emptyPrompt) {
    const isFloorBlank = fl.items.length === 0 && fl.walls.length === 0;
    const isBusyMode = Boolean(
      builder.placingType ||
        builder.wallDrawMode ||
        builder.viewAllFloors ||
        builder.activeTab === 'walls' ||
        builder.activeTab === 'floors'
    );
    emptyPrompt.hidden = !isFloorBlank || isBusyMode;
  }

  // Placement / Wall Drawing / Click-to-Move mode hint banner
  const hintBar = document.getElementById('mg3dPlaceBanner');
  const rotateBtn = document.getElementById('mg3dPlaceRotateBtn');
  if (hintBar) {
    if (builder.wallDrawMode) {
      const styleSpec = getWallStyleSpec(builder.wallStyle);
      hintBar.hidden = false;
      if (rotateBtn) rotateBtn.hidden = true;
      const textEl = document.getElementById('mg3dPlaceBannerText');
      if (textEl) {
        textEl.textContent = builder.wallDrawStart
          ? `رسم ${styleSpec.label}: نقطه پایان را روی کف کلیک کنید (راست‌کلیک قطع زنجیره · Esc توقف)`
          : `حالت دیوارکشی (${styleSpec.label}): نقطه شروع دیوار را روی کف سالن کلیک کنید`;
      }
    } else if (builder.placingType) {
      const spec = getCatalogItem(builder.placingType);
      hintBar.hidden = false;
      if (rotateBtn) rotateBtn.hidden = false;
      const textEl = document.getElementById('mg3dPlaceBannerText');
      if (textEl) {
        textEl.textContent = builder.movingItemId
          ? `حالت جابه‌جایی: ${spec ? spec.name : ''} — روی نقطه جدید شبکه کلیک کنید (R چرخش · Esc لغو)`
          : `حالت چیدمان: ${spec ? spec.name : ''} — روی کف سالن کلیک کنید (R چرخش · Esc لغو)`;
      }
    } else {
      hintBar.hidden = true;
    }
  }

  // Tab buttons & panes
  const selectedTabBtn = document.getElementById('mg3dTabSelectedBtn');
  if (selectedTabBtn) {
    const hasSelection = Boolean(builder.selectedId || builder.selectedWallId);
    selectedTabBtn.hidden = !hasSelection;
    selectedTabBtn.textContent = builder.selectedWallId ? 'ویرایش دیوار' : 'ویرایش قطعه';
  }

  document.querySelectorAll('[data-3d-tab]').forEach((btn) => {
    const active = btn.getAttribute('data-3d-tab') === builder.activeTab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('[data-3d-pane]').forEach((pane) => {
    pane.hidden = pane.getAttribute('data-3d-pane') !== builder.activeTab;
  });

  // Wall draw pane buttons
  const wallDrawToggleBtn = document.getElementById('mg3dWallDrawToggleBtn');
  if (wallDrawToggleBtn) {
    wallDrawToggleBtn.classList.toggle('is-active', builder.wallDrawMode);
    wallDrawToggleBtn.textContent = builder.wallDrawMode ? 'توقف رسم دیوار (Esc)' : 'شروع رسم دیوار (L)';
  }
  const wallOrthoBtn = document.getElementById('mg3dWallOrthoBtn');
  if (wallOrthoBtn) {
    wallOrthoBtn.classList.toggle('is-active', builder.wallOrthoSnap);
    wallOrthoBtn.textContent = builder.wallOrthoSnap ? 'زاویه منظم: ۹۰°/۴۵°' : 'زاویه: آزاد';
  }
  const clearWallsBtn = document.getElementById('mg3dClearWallsBtn');
  if (clearWallsBtn) {
    clearWallsBtn.disabled = fl.walls.length === 0;
  }
  const wallCountLabel = document.getElementById('mg3dWallCountBadge');
  if (wallCountLabel) {
    wallCountLabel.textContent = `${toPersianDigits(fl.walls.length)} دیوار در ${fl.name}`;
  }
  document.querySelectorAll('[data-3d-wall-style]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-wall-style') === builder.wallStyle);
  });

  // Category filter buttons
  document.querySelectorAll('[data-3d-cat]').forEach((btn) => {
    const active = btn.getAttribute('data-3d-cat') === builder.activeCategory;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderCatalogCards();

  updateUndoRedoButtons();

  // Room controls values
  const { width, depth, height, floor, wall, ledColor, mood, cutawayWalls } = fl.room;
  const wVal = document.getElementById('mg3dRoomWVal');
  const dVal = document.getElementById('mg3dRoomDVal');
  const hVal = document.getElementById('mg3dRoomHVal');
  const wInput = document.getElementById('mg3dRoomWInput');
  const dInput = document.getElementById('mg3dRoomDInput');
  const hInput = document.getElementById('mg3dRoomHInput');
  if (wVal) wVal.textContent = `${toPersianDigits(width)} م`;
  if (dVal) dVal.textContent = `${toPersianDigits(depth)} م`;
  if (hVal) hVal.textContent = `${toPersianDigits(height)} م`;
  if (wInput) wInput.value = String(width);
  if (dInput) dInput.value = String(depth);
  if (hInput) hInput.value = String(height);

  document.querySelectorAll('[data-3d-floor]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-floor') === floor);
  });
  document.querySelectorAll('[data-3d-wall]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-wall') === wall);
  });
  document.querySelectorAll('[data-3d-led]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-led') === (ledColor || 'auto'));
  });
  document.querySelectorAll('[data-3d-mood]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-mood') === mood);
  });

  const cutawayBtn = document.getElementById('mg3dCutawayBtn');
  if (cutawayBtn) {
    cutawayBtn.textContent = cutawayWalls ? '۲ دیوار' : '۴ دیوار';
    cutawayBtn.classList.toggle('is-active', cutawayWalls);
  }
  const snapBtn = document.getElementById('mg3dSnapBtn');
  if (snapBtn) {
    snapBtn.textContent = builder.gridSnap ? 'شبکه: روشن' : 'شبکه: آزاد';
    snapBtn.classList.toggle('is-active', builder.gridSnap);
  }

  // Selected item vs Selected wall inspector
  const itemInspector = document.getElementById('mg3dItemInspector');
  const wallInspector = document.getElementById('mg3dWallInspector');

  const selItem = fl.items.find((i) => i.id === builder.selectedId);
  const selWall = fl.walls.find((w) => w.id === builder.selectedWallId);

  if (itemInspector) itemInspector.hidden = !selItem;
  if (wallInspector) wallInspector.hidden = !selWall;

  if (selItem) {
    const spec = getCatalogItem(selItem.type);
    const nameEl = document.getElementById('mg3dSelName');
    const coordsEl = document.getElementById('mg3dSelCoords');
    const tableWrap = document.getElementById('mg3dSelTableWrap');
    const tableInput = document.getElementById('mg3dSelTableInput');
    const variantWrap = document.getElementById('mg3dSelVariantWrap');
    const tintWrap = document.getElementById('mg3dSelTintWrap');

    if (nameEl) nameEl.textContent = spec ? spec.name : selItem.type;
    if (coordsEl) {
      coordsEl.textContent = `(${toPersianDigits(itemCoords(selItem.x))}، ${toPersianDigits(itemCoords(selItem.z))}) · ${toPersianDigits(selItem.rotation)}°`;
    }
    if (tableWrap) tableWrap.hidden = !(spec && spec.isStation);
    if (tableInput && document.activeElement !== tableInput) {
      tableInput.value = selItem.tableNumber || '';
    }

    const isBilliard = Boolean(spec && spec.isBilliard);
    if (variantWrap) {
      variantWrap.hidden = !isBilliard;
      const activeVariant = selItem.variant || spec?.defaultVariant || 'classic-green';
      variantWrap.querySelectorAll('[data-3d-item-variant]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-3d-item-variant') === activeVariant);
      });
    }
    if (tintWrap) {
      tintWrap.hidden = isBilliard;
      const activeTint = selItem.tint || 'default';
      tintWrap.querySelectorAll('[data-3d-item-tint]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-3d-item-tint') === activeTint);
      });
    }
  }

  if (selWall) {
    const m = getWallMetrics(selWall);
    const spec = getWallStyleSpec(selWall.style);
    const wallNameEl = document.getElementById('mg3dSelWallName');
    const wallMetaEl = document.getElementById('mg3dSelWallMeta');
    if (wallNameEl) wallNameEl.textContent = spec.label;
    if (wallMetaEl) {
      wallMetaEl.textContent = `طول ${toPersianDigits(m.length.toFixed(1))} متر`;
    }
    document.querySelectorAll('[data-3d-sel-wall-style]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-3d-sel-wall-style') === selWall.style);
    });
  }
}

function buildHudMarkup(shell) {
  const floorSwatches = FLOOR_FINISHES.map(
    (f) => `<button type="button" class="mg3d-swatch-btn" data-3d-floor="${f.id}" title="${f.label}">
      <span class="mg3d-swatch-dot" style="background:linear-gradient(135deg, ${f.color}, ${f.secondary || f.color})"></span>
      <span>${f.label}</span>
    </button>`
  ).join('');

  const wallSwatches = WALL_FINISHES.map(
    (w) => `<button type="button" class="mg3d-swatch-btn" data-3d-wall="${w.id}" title="${w.label}">
      <span class="mg3d-swatch-dot mg3d-wallpaper-dot" style="background:${w.swatchBg || w.color}"></span>
      <span>${w.label}</span>
    </button>`
  ).join('');

  const ledSwatches = LED_COLORS.map(
    (l) => `<button type="button" class="mg3d-swatch-btn" data-3d-led="${l.id}" title="${l.label}">
      <span class="mg3d-led-dot" style="background:${l.hex || 'conic-gradient(#7c3aed, #06b6d4, #10b981, #f59e0b, #7c3aed)'}"></span>
      <span>${l.label}</span>
    </button>`
  ).join('');

  const billiardVariantBtns = BILLIARD_FELT_VARIANTS.map(
    (v) => `<button type="button" class="mg3d-swatch-btn" data-3d-item-variant="${v.id}" title="${v.label}">
      <span class="mg3d-swatch-dot" style="background:linear-gradient(135deg, ${v.feltHex} 60%, ${v.railHex} 60%)"></span>
      <span>${v.label}</span>
    </button>`
  ).join('');

  const itemTintBtns = ITEM_TINT_SWATCHES.map(
    (t) => `<button type="button" class="mg3d-swatch-btn" data-3d-item-tint="${t.id}" title="${t.label}">
      <span class="mg3d-led-dot" style="background:${t.hex || 'linear-gradient(135deg, #64748b, #cbd5e1)'}"></span>
      <span>${t.label}</span>
    </button>`
  ).join('');

  const wallStyleBtns = WALL_STYLES.map(
    (ws) => `<button type="button" class="mg3d-swatch-btn" data-3d-wall-style="${ws.id}">
      <span class="mg3d-led-dot" style="background:${ws.color}"></span>
      <span>${ws.label}</span>
    </button>`
  ).join('');

  const selWallStyleBtns = WALL_STYLES.map(
    (ws) => `<button type="button" class="mg3d-swatch-btn" data-3d-sel-wall-style="${ws.id}">
      <span class="mg3d-led-dot" style="background:${ws.color}"></span>
      <span>${ws.label}</span>
    </button>`
  ).join('');

  const moodBtns = LIGHTING_MOODS.map(
    (m) => `<button type="button" class="mg3d-seg-btn" data-3d-mood="${m.id}">${m.label}</button>`
  ).join('');

  const catBtns = CATALOG_CATEGORIES.map(
    (c) => `<button type="button" class="mg3d-seg-btn" data-3d-cat="${c.id}" aria-pressed="${c.id === 'all' ? 'true' : 'false'}">${c.label}</button>`
  ).join('');

  shell.innerHTML = `
    <div id="mg3dCanvasHost" class="mg3d-canvas-host" aria-label="فضای سه‌بعدی طراحی گیم‌نت"></div>

    <!-- Non-overlapping Top Overlay Stack (Top Bar + Contextual Banners) -->
    <div class="mg3d-top-overlay-stack">
      <!-- Compact Top Spec, Multi-Floor Bar, Camera & History Bar -->
      <div class="mg3d-top-hud">
        <div class="mg3d-top-left-stack">
          <div class="mg3d-spec-block">
            <strong class="mg3d-spec-title">طراح سه‌بعدی گیم‌نت</strong>
            <span id="mg3dRoomSpecText" class="mg3d-spec-meta">طبقه همکف · ۱۴×۱۰ متر</span>
          </div>
          <div id="mg3dFloorTabs" class="mg3d-floor-bar" role="group" aria-label="مدیریت طبقات گیم‌نت"></div>
        </div>

        <div class="mg3d-top-actions">
          <div class="mg3d-cam-group" role="group" aria-label="زاویه دوربین سه‌بعدی">
            <button type="button" class="mg3d-cam-btn is-active" data-3d-cam="hero">سه‌بعدی</button>
            <button type="button" class="mg3d-cam-btn" data-3d-cam="iso">ایزومتریک</button>
            <button type="button" class="mg3d-cam-btn" data-3d-cam="top">بالا</button>
            <button type="button" class="mg3d-cam-btn" data-3d-cam="inside">داخل</button>
          </div>
          <div class="mg3d-undo-group" role="group" aria-label="بازگردانی تغییرات">
            <button type="button" id="mg3dUndoBtn" class="mg3d-icon-btn" title="بازگشت به مرحله قبل (Ctrl+Z)" aria-label="بازگشت به مرحله قبل" disabled>
              <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5.5 6.5H11a3.5 3.5 0 1 1 0 7H7.5"/>
                <path d="M8 4 5.5 6.5 8 9"/>
              </svg>
            </button>
            <button type="button" id="mg3dRedoBtn" class="mg3d-icon-btn" title="انجام مجدد (Ctrl+Y)" aria-label="انجام مجدد" disabled>
              <svg viewBox="0 0 18 18" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12.5 6.5H7a3.5 3.5 0 1 0 0 7h3.5"/>
                <path d="M10 4l2.5 2.5L10 9"/>
              </svg>
            </button>
          </div>
          <button
            type="button"
            id="mg3dWireframeToggleBtn"
            class="mg3d-view-toggle-btn"
            aria-pressed="false"
            aria-label="تغییر حالت نمایش شبکه سه‌بعدی بین توپر و سیمی"
            title="تغییر نمایش بین حالت توپر و سیمی (W)"
            data-render-mode="solid"
          >
            <svg class="mg3d-view-toggle-icon" viewBox="0 0 18 18" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 1.75 15.25 5.25v7.5L9 16.25l-6.25-3.5v-7.5L9 1.75Z"/>
              <path d="M9 9.25 15.25 5.25M9 9.25 2.75 5.25M9 9.25v7"/>
            </svg>
            <span id="mg3dWireframeToggleLabel">نمای توپر</span>
          </button>
          <button type="button" id="mg3dScratchResetBtn" class="mg3d-view-toggle-btn" title="شروع مجدد با سالن خالی">شروع از صفر</button>
          <button type="button" id="mg3dSaveBtn" class="mg3d-save-btn">ذخیره‌شده</button>
        </div>
      </div>

      <!-- Lightweight Non-Blocking Blank-Canvas Starter Guide (flows cleanly below top bar) -->
      <div id="mg3dEmptyScratchBar" class="mg3d-empty-guide" hidden>
        <span class="mg3d-empty-guide-text">فضای خالی آماده ساخت گیم‌نت شما از صفر — دیوار بکشید، طبقه اضافه کنید یا تجهیزات را از پایین بچینید</span>
        <div class="mg3d-place-banner-actions">
          <button type="button" id="mg3dGuideDrawWallBtn" class="mg3d-mini-btn is-accent">رسم دیوار</button>
          <button type="button" id="mg3dGuideAddFloorBtn" class="mg3d-mini-btn">+ طبقه جدید</button>
          <button type="button" id="mg3dGuideLoadSampleBtn" class="mg3d-mini-btn">چیدمان نمونه</button>
        </div>
      </div>

      <!-- Placement / Wall Draw Mode Prompt -->
      <div id="mg3dPlaceBanner" class="mg3d-place-banner" hidden>
        <span id="mg3dPlaceBannerText">حالت چیدمان فعال است</span>
        <div class="mg3d-place-banner-actions">
          <button type="button" id="mg3dPlaceRotateBtn" class="mg3d-mini-btn">چرخش ۹۰° (R)</button>
          <button type="button" id="mg3dPlaceCancelBtn" class="mg3d-mini-btn is-danger">پایان (Esc)</button>
        </div>
      </div>
    </div>

    <!-- Compact Collapsible Bottom Studio Dock -->
    <div id="mg3dBottomDock" class="mg3d-bottom-dock">
      <button type="button" id="mg3dDockToggle" class="mg3d-dock-toggle" aria-expanded="true">▾ مخفی کردن ابزارها</button>
      <div class="mg3d-dock-surface">
        <div class="mg3d-dock-tabs" role="tablist" aria-label="ابزارهای طراح سه‌بعدی">
          <button type="button" role="tab" class="mg3d-tab-btn is-active" data-3d-tab="catalog" aria-selected="true">چیدمان و وسایل</button>
          <button type="button" role="tab" class="mg3d-tab-btn" data-3d-tab="walls" aria-selected="false">دیوارکشی داخلی</button>
          <button type="button" role="tab" class="mg3d-tab-btn" data-3d-tab="floors" aria-selected="false">مدیریت طبقات</button>
          <button type="button" role="tab" class="mg3d-tab-btn" data-3d-tab="style" aria-selected="false">کاغذ دیواری و فضا</button>
          <button type="button" role="tab" class="mg3d-tab-btn" data-3d-tab="room" aria-selected="false">ابعاد و نور</button>
          <button type="button" role="tab" id="mg3dTabSelectedBtn" class="mg3d-tab-btn" data-3d-tab="selected" aria-selected="false" hidden>ویرایش قطعه</button>
        </div>

        <!-- TAB 1: Equipment, Billiards, Stairs & Decor Catalog -->
        <div class="mg3d-dock-pane" data-3d-pane="catalog">
          <div class="mg3d-cat-bar">${catBtns}</div>
          <div id="mg3dCatalogList" class="mg3d-catalog-strip"></div>
        </div>

        <!-- TAB 2: Interactive Interior Wall Drawing -->
        <div class="mg3d-dock-pane" data-3d-pane="walls" hidden>
          <div class="mg3d-wall-tools-row">
            <button type="button" id="mg3dWallDrawToggleBtn" class="mg3d-action-btn is-accent">شروع رسم دیوار (L)</button>
            <div class="mg3d-style-scroll">${wallStyleBtns}</div>
          </div>
          <div class="mg3d-room-controls-row">
            <span id="mg3dWallCountBadge" class="mg3d-row-label">۰ دیوار در طبقه همکف</span>
            <div class="mg3d-ctrl-group">
              <button type="button" id="mg3dWallOrthoBtn" class="mg3d-seg-btn is-active">زاویه منظم: ۹۰°/۴۵°</button>
              <button type="button" id="mg3dClearWallsBtn" class="mg3d-seg-btn is-danger-ghost" disabled>پاک کردن دیوارهای این طبقه</button>
            </div>
          </div>
        </div>

        <!-- TAB 3: Multi-Floor / Multi-Story Manager -->
        <div class="mg3d-dock-pane" data-3d-pane="floors" hidden>
          <div id="mg3dFloorManagerList" class="mg3d-floor-cards-strip"></div>
          <div class="mg3d-room-controls-row">
            <div class="mg3d-sel-table-field">
              <label for="mg3dFloorNameInput">نام طبقه فعال:</label>
              <input type="text" id="mg3dFloorNameInput" class="mg3d-floor-name-input" maxlength="28" placeholder="مثلاً طبقه VIP">
            </div>
            <div class="mg3d-ctrl-group">
              <button type="button" id="mg3dAddFloorEmptyBtn" class="mg3d-action-btn is-accent">+ افزودن طبقه خالی</button>
              <button type="button" id="mg3dAddFloorCopyBtn" class="mg3d-action-btn">+ طبقه با دیوارهای فعلی</button>
              <button type="button" id="mg3dFloorsStackToggleBtn" class="mg3d-seg-btn" disabled>نمای همه طبقات: خاموش</button>
            </div>
          </div>
        </div>

        <!-- TAB 4: Wallpapers, Floor Finishes & Wall LED Color -->
        <div class="mg3d-dock-pane" data-3d-pane="style" hidden>
          <div class="mg3d-style-rows">
            <div class="mg3d-style-row">
              <span class="mg3d-row-label">کاغذ دیواری</span>
              <div class="mg3d-style-scroll">${wallSwatches}</div>
            </div>
            <div class="mg3d-style-row">
              <span class="mg3d-row-label">کف‌پوش سالن</span>
              <div class="mg3d-style-scroll">${floorSwatches}</div>
            </div>
            <div class="mg3d-style-row">
              <span class="mg3d-row-label">نور LED دیوار</span>
              <div class="mg3d-style-scroll">${ledSwatches}</div>
            </div>
          </div>
        </div>

        <!-- TAB 5: Dimensions, Lighting Mood & Optional Starter Presets -->
        <div class="mg3d-dock-pane" data-3d-pane="room" hidden>
          <div class="mg3d-room-sliders-row">
            <div class="mg3d-slider-inline">
              <label for="mg3dRoomWInput">عرض</label>
              <input type="range" id="mg3dRoomWInput" min="6" max="24" step="1" value="14">
              <span id="mg3dRoomWVal">۱۴ م</span>
            </div>
            <div class="mg3d-slider-inline">
              <label for="mg3dRoomDInput">طول</label>
              <input type="range" id="mg3dRoomDInput" min="6" max="20" step="1" value="10">
              <span id="mg3dRoomDVal">۱۰ م</span>
            </div>
            <div class="mg3d-slider-inline">
              <label for="mg3dRoomHInput">سقف</label>
              <input type="range" id="mg3dRoomHInput" min="2.8" max="4.5" step="0.1" value="3.4">
              <span id="mg3dRoomHVal">۳.۴ م</span>
            </div>
          </div>
          <div class="mg3d-room-controls-row">
            <div class="mg3d-ctrl-group">
              <span class="mg3d-row-label">نور:</span>
              <div class="mg3d-btn-row">${moodBtns}</div>
            </div>
            <div class="mg3d-ctrl-group">
              <button type="button" id="mg3dCutawayBtn" class="mg3d-seg-btn is-active">۲ دیوار</button>
              <button type="button" id="mg3dSnapBtn" class="mg3d-seg-btn is-active">شبکه: روشن</button>
            </div>
            <div class="mg3d-ctrl-group">
              <span class="mg3d-row-label">قالب:</span>
              <div class="mg3d-btn-row">
                <button type="button" class="mg3d-seg-btn is-danger-ghost" data-3d-preset="empty">فضای خالی (از صفر)</button>
                <button type="button" class="mg3d-seg-btn" data-3d-preset="pro-arena">سالن پرچمدار</button>
                <button type="button" class="mg3d-seg-btn" data-3d-preset="billiard-club">باشگاه بیلیارد</button>
                <button type="button" class="mg3d-seg-btn" data-3d-preset="compact">جمع‌وجور</button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 6: Selected Item OR Selected Interior Wall Inspector -->
        <div class="mg3d-dock-pane" data-3d-pane="selected" hidden>
          <div id="mg3dItemInspector">
            <div class="mg3d-selected-bar">
              <div class="mg3d-selected-info">
                <strong id="mg3dSelName">—</strong>
                <span id="mg3dSelCoords">—</span>
              </div>
              <div id="mg3dSelTableWrap" class="mg3d-sel-table-field">
                <label for="mg3dSelTableInput">شماره میز:</label>
                <input type="text" id="mg3dSelTableInput" class="mg3d-table-input" inputmode="numeric" maxlength="6" placeholder="۱">
              </div>
              <div class="mg3d-selected-actions">
                <button type="button" id="mg3dSelMoveBtn" class="mg3d-action-btn is-accent">جابه‌جایی (M)</button>
                <button type="button" id="mg3dSelRotateBtn" class="mg3d-action-btn">چرخش (R)</button>
                <button type="button" id="mg3dSelDupBtn" class="mg3d-action-btn">تکثیر (D)</button>
                <button type="button" id="mg3dSelDelBtn" class="mg3d-action-btn is-danger">حذف</button>
                <button type="button" id="mg3dSelCloseBtn" class="mg3d-action-btn">بستن</button>
              </div>
            </div>
            <div id="mg3dSelVariantWrap" class="mg3d-style-row" hidden>
              <span class="mg3d-row-label">طرح میز بیلیارد</span>
              <div class="mg3d-style-scroll">${billiardVariantBtns}</div>
            </div>
            <div id="mg3dSelTintWrap" class="mg3d-style-row" hidden>
              <span class="mg3d-row-label">رنگ و تم قطعه</span>
              <div class="mg3d-style-scroll">${itemTintBtns}</div>
            </div>
          </div>

          <div id="mg3dWallInspector" hidden>
            <div class="mg3d-selected-bar">
              <div class="mg3d-selected-info">
                <strong id="mg3dSelWallName">دیوار داخلی</strong>
                <span id="mg3dSelWallMeta">—</span>
              </div>
              <div class="mg3d-selected-actions">
                <button type="button" id="mg3dSelWallDelBtn" class="mg3d-action-btn is-danger">حذف دیوار (Del)</button>
                <button type="button" id="mg3dSelWallCloseBtn" class="mg3d-action-btn">بستن</button>
              </div>
            </div>
            <div class="mg3d-style-row">
              <span class="mg3d-row-label">نوع دیوار</span>
              <div class="mg3d-style-scroll">${selWallStyleBtns}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindHudEvents(shell) {
  if (shell.dataset.hudBound === '1') return;
  shell.dataset.hudBound = '1';

  shell.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-3d-tab]');
    if (tabBtn) {
      builder.activeTab = tabBtn.getAttribute('data-3d-tab');
      if (builder.dockCollapsed) builder.dockCollapsed = false;
      syncDockUI();
      return;
    }

    const catBtn = e.target.closest('[data-3d-cat]');
    if (catBtn) {
      builder.activeCategory = catBtn.getAttribute('data-3d-cat');
      syncDockUI();
      return;
    }

    const placeBtn = e.target.closest('[data-place-type]');
    if (placeBtn) {
      enterPlacementMode(placeBtn.getAttribute('data-place-type'));
      return;
    }

    const wallStyleBtn = e.target.closest('[data-3d-wall-style]');
    if (wallStyleBtn) {
      const style = wallStyleBtn.getAttribute('data-3d-wall-style');
      enterWallDrawMode(style);
      return;
    }

    const selWallStyleBtn = e.target.closest('[data-3d-sel-wall-style]');
    if (selWallStyleBtn) {
      updateSelectedWallStyle(selWallStyleBtn.getAttribute('data-3d-sel-wall-style'));
      return;
    }

    const selectFloorBtn = e.target.closest('[data-3d-select-floor]');
    if (selectFloorBtn) {
      switchActiveFloor(Number(selectFloorBtn.getAttribute('data-3d-select-floor')));
      return;
    }

    const delFloorBtn = e.target.closest('[data-3d-del-floor]');
    if (delFloorBtn) {
      removeCurrentOrTargetFloor(Number(delFloorBtn.getAttribute('data-3d-del-floor')));
      return;
    }

    if (e.target.closest('#mg3dQuickAddFloorBtn')) {
      addNewFloor(false);
      return;
    }

    if (e.target.closest('#mg3dAllFloorsToggleBtn')) {
      toggleViewAllFloors();
      return;
    }

    const camBtn = e.target.closest('[data-3d-cam]');
    if (camBtn) {
      const preset = camBtn.getAttribute('data-3d-cam');
      shell.querySelectorAll('[data-3d-cam]').forEach((b) => {
        b.classList.toggle('is-active', b === camBtn);
      });
      setCameraPreset(preset, false);
      return;
    }

    const floorBtn = e.target.closest('[data-3d-floor]');
    if (floorBtn) {
      updateRoomConfig({ floor: floorBtn.getAttribute('data-3d-floor') });
      return;
    }

    const wallBtn = e.target.closest('[data-3d-wall]');
    if (wallBtn) {
      updateRoomConfig({ wall: wallBtn.getAttribute('data-3d-wall') });
      return;
    }

    const ledBtn = e.target.closest('[data-3d-led]');
    if (ledBtn) {
      updateRoomConfig({ ledColor: ledBtn.getAttribute('data-3d-led') });
      return;
    }

    const moodBtn = e.target.closest('[data-3d-mood]');
    if (moodBtn) {
      updateRoomConfig({ mood: moodBtn.getAttribute('data-3d-mood') });
      return;
    }

    const presetBtn = e.target.closest('[data-3d-preset]');
    if (presetBtn) {
      applyStarterPreset(presetBtn.getAttribute('data-3d-preset'));
      return;
    }

    const variantBtn = e.target.closest('[data-3d-item-variant]');
    if (variantBtn) {
      updateSelectedItemStyle({ variant: variantBtn.getAttribute('data-3d-item-variant') });
      return;
    }

    const tintBtn = e.target.closest('[data-3d-item-tint]');
    if (tintBtn) {
      updateSelectedItemStyle({ tint: tintBtn.getAttribute('data-3d-item-tint') });
      return;
    }
  });

  document.getElementById('mg3dDockToggle')?.addEventListener('click', () => {
    builder.dockCollapsed = !builder.dockCollapsed;
    syncDockUI();
  });

  document.getElementById('mg3dUndoBtn')?.addEventListener('click', () => undoLayout());
  document.getElementById('mg3dRedoBtn')?.addEventListener('click', () => redoLayout());
  document.getElementById('mg3dSaveBtn')?.addEventListener('click', () => saveLayoutToServer());
  document.getElementById('mg3dWireframeToggleBtn')?.addEventListener('click', () => toggleRenderMode());
  document.getElementById('mg3dScratchResetBtn')?.addEventListener('click', () => applyStarterPreset('empty'));

  // Empty scratch guide quick buttons
  document.getElementById('mg3dGuideDrawWallBtn')?.addEventListener('click', () => enterWallDrawMode());
  document.getElementById('mg3dGuideAddFloorBtn')?.addEventListener('click', () => addNewFloor(false));
  document.getElementById('mg3dGuideLoadSampleBtn')?.addEventListener('click', () => applyStarterPreset('pro-arena'));

  // Banner cancel / rotate
  document.getElementById('mg3dPlaceRotateBtn')?.addEventListener('click', () => rotateSelectedItem(90));
  document.getElementById('mg3dPlaceCancelBtn')?.addEventListener('click', () => {
    if (builder.wallDrawMode) exitWallDrawMode();
    else clearPlacementMode();
  });

  // Wall drawing controls
  document.getElementById('mg3dWallDrawToggleBtn')?.addEventListener('click', () => {
    if (builder.wallDrawMode) exitWallDrawMode();
    else enterWallDrawMode();
  });
  document.getElementById('mg3dWallOrthoBtn')?.addEventListener('click', () => {
    builder.wallOrthoSnap = !builder.wallOrthoSnap;
    syncDockUI();
  });
  document.getElementById('mg3dClearWallsBtn')?.addEventListener('click', () => clearFloorWalls());

  // Floor manager dock controls
  document.getElementById('mg3dAddFloorEmptyBtn')?.addEventListener('click', () => addNewFloor(false));
  document.getElementById('mg3dAddFloorCopyBtn')?.addEventListener('click', () => addNewFloor(true));
  document.getElementById('mg3dFloorsStackToggleBtn')?.addEventListener('click', () => toggleViewAllFloors());
  document.getElementById('mg3dFloorNameInput')?.addEventListener('input', (e) => {
    const val = String(e.target.value || '').trim();
    if (!val) return;
    pushHistorySnapshot(`floor-name-${builder.layout.activeFloorIndex}`);
    renameFloorInLayout(builder.layout, builder.layout.activeFloorIndex, val);
    if (builder.viewAllFloors) rebuildRoom3D();
    markDirty();
    renderFloorStrip();
    renderFloorsDockPane();
  });

  // Room dimensions & toggles
  document.getElementById('mg3dCutawayBtn')?.addEventListener('click', () => {
    updateRoomConfig({ cutawayWalls: !activeFloor().room.cutawayWalls });
  });
  document.getElementById('mg3dSnapBtn')?.addEventListener('click', () => {
    builder.gridSnap = !builder.gridSnap;
    applyRenderMode();
    syncDockUI();
  });
  document.getElementById('mg3dRoomWInput')?.addEventListener('input', (e) => {
    updateRoomConfig({ width: Number(e.target.value) }, 'room-w');
  });
  document.getElementById('mg3dRoomDInput')?.addEventListener('input', (e) => {
    updateRoomConfig({ depth: Number(e.target.value) }, 'room-d');
  });
  document.getElementById('mg3dRoomHInput')?.addEventListener('input', (e) => {
    updateRoomConfig({ height: Number(e.target.value) }, 'room-h');
  });

  // Item & Wall inspector actions
  document.getElementById('mg3dSelMoveBtn')?.addEventListener('click', () => {
    if (builder.selectedId) enterMoveMode(builder.selectedId);
  });
  document.getElementById('mg3dSelRotateBtn')?.addEventListener('click', () => rotateSelectedItem(90));
  document.getElementById('mg3dSelDupBtn')?.addEventListener('click', () => duplicateSelectedItem());
  document.getElementById('mg3dSelDelBtn')?.addEventListener('click', () => deleteSelectedItem());
  document.getElementById('mg3dSelCloseBtn')?.addEventListener('click', () => selectItem(null));
  document.getElementById('mg3dSelWallDelBtn')?.addEventListener('click', () => deleteSelectedWall());
  document.getElementById('mg3dSelWallCloseBtn')?.addEventListener('click', () => selectWall(null));

  document.getElementById('mg3dSelTableInput')?.addEventListener('input', (e) => {
    const fl = activeFloor();
    const item = fl.items.find((i) => i.id === builder.selectedId);
    if (!item) return;
    pushHistorySnapshot(`table-${item.id}`);
    const normalized = String(e.target.value || '')
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .trim()
      .slice(0, 6);
    item.tableNumber = normalized;
    rebuildSingleItem3D(item);
    markDirty();
  });

  // Keyboard shortcuts strictly scoped while #mgMyGamenetView is visible
  if (!window.__mg3dKeysBound) {
    window.__mg3dKeysBound = true;
    document.addEventListener('keydown', (e) => {
      const pane = document.getElementById('mgMyGamenetView');
      if (!pane || pane.hasAttribute('hidden')) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redoLayout();
        else undoLayout();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redoLayout();
        return;
      }

      if (e.key === 'Escape') {
        if (builder.wallDrawMode) {
          if (builder.wallDrawStart) {
            builder.wallDrawStart = null;
            updateWallPreviewVisual();
            syncDockUI();
          } else {
            exitWallDrawMode();
          }
        } else if (builder.placingType) {
          clearPlacementMode();
        } else if (builder.selectedId || builder.selectedWallId) {
          selectItem(null);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (builder.wallDrawMode) exitWallDrawMode();
        else enterWallDrawMode();
      } else if (e.key === 'm' || e.key === 'M') {
        if (builder.selectedId) {
          e.preventDefault();
          enterMoveMode(builder.selectedId);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        rotateSelectedItem(90);
      } else if (e.key === 'd' || e.key === 'D') {
        if (builder.selectedId) {
          e.preventDefault();
          duplicateSelectedItem();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (builder.selectedId || builder.selectedWallId) {
          e.preventDefault();
          deleteSelectedItem();
        }
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        toggleRenderMode();
      } else if (e.key === 'h' || e.key === 'H') {
        builder.dockCollapsed = !builder.dockCollapsed;
        syncDockUI();
      }
    });
  }
}

function resizeRendererToHost() {
  const host = document.getElementById('mg3dCanvasHost');
  if (!host || !builder.renderer || !builder.camera) return;
  const w = Math.max(320, host.clientWidth);
  const h = Math.max(360, host.clientHeight);
  builder.camera.aspect = w / h;
  builder.camera.updateProjectionMatrix();
  builder.renderer.setSize(w, h, false);
  requestRender();
}

function initThreeScene(host) {
  builder.isSoftwareGl = detectSoftwareGl();

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !builder.isSoftwareGl,
      powerPreference: 'high-performance',
    });
  } catch {
    host.innerHTML =
      '<div class="mg3d-fallback">مرورگر شما از WebGL پشتیبانی نمی‌کند؛ لطفاً شتاب سخت‌افزاری را فعال کنید.</div>';
    return false;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(builder.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = !builder.isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'mg3d-webgl-canvas';
  renderer.domElement.setAttribute('data-testid', 'mg3d-canvas');
  host.innerHTML = '';
  host.appendChild(renderer.domElement);
  builder.renderer = renderer;

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(builder.frameId);
    clearTimeout(builder.frameId);
    builder.renderBusy = false;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    requestRender();
  });

  const scene = new THREE.Scene();
  builder.scene = scene;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.15, 180);
  builder.camera = camera;

  const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.65);
  keyLight.position.set(11, 22, 12);
  keyLight.castShadow = !builder.isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 75;
  scene.add(keyLight);
  builder.keyLight = keyLight;

  const hemiLight = new THREE.HemisphereLight(0xa5b4fc, 0x1e293b, 0.78);
  scene.add(hemiLight);
  builder.hemiLight = hemiLight;

  const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.75);
  rimLight.position.set(-12, 12, -11);
  scene.add(rimLight);
  builder.rimLight = rimLight;

  // Scene hierarchy groups
  builder.roomContainer = new THREE.Group();
  builder.wallsContainer = new THREE.Group();
  builder.itemsContainer = new THREE.Group();
  builder.selectionRing = buildSelectionRing(getActiveAccentHex());
  builder.wallPreviewGroup = buildWallPreviewGroup(
    getActiveAccentHex(),
    renderer.capabilities.getMaxAnisotropy()
  );
  scene.add(builder.roomContainer);
  scene.add(builder.wallsContainer);
  scene.add(builder.itemsContainer);
  scene.add(builder.selectionRing);
  scene.add(builder.wallPreviewGroup);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !builder.isSoftwareGl;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 4;
  controls.maxDistance = 48;
  controls.addEventListener('start', () => {
    builder.camTransitionActive = false;
  });
  controls.addEventListener('change', () => {
    requestRender();
  });
  builder.controls = controls;

  bindCanvasPointerEvents(renderer.domElement);

  if (typeof ResizeObserver !== 'undefined') {
    builder.resizeObserver = new ResizeObserver(() => resizeRendererToHost());
    builder.resizeObserver.observe(host);
  }

  builder.themeObserver = new MutationObserver(() => {
    if (!builder.mounted) return;
    rebuildAll3D();
  });
  builder.themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-accent'],
  });

  if (!builder.isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  return true;
}

/**
 * Public entry point called by dashboard-ui.js whenever the "گیم نت من" view becomes active.
 */
export async function mountMyGamenet3D() {
  const shell = document.getElementById('mg3dBuilderShell');
  if (!shell) return;

  if (!builder.mounted) {
    builder.mounted = true;
    buildHudMarkup(shell);
    bindHudEvents(shell);
    await loadSavedLayoutAndReservations();

    const host = document.getElementById('mg3dCanvasHost');
    if (host && initThreeScene(host)) {
      rebuildAll3D();
      resizeRendererToHost();
      setCameraPreset('hero', true);
      syncDockUI();
      ensure3DTimerLoop();
      requestRender();
    }

    // Safe read/test helper for verification
    window.__mg3dBuilder = {
      getState: () => ({
        floorCount: builder.layout.floors.length,
        activeFloorIndex: builder.layout.activeFloorIndex,
        viewAllFloors: builder.viewAllFloors,
        wallCount: activeFloor().walls.length,
        itemCount: activeFloor().items.length,
        wallDrawMode: builder.wallDrawMode,
        wallStyle: builder.wallStyle,
      }),
      addWallDirect: (x1, z1, x2, z2, style = 'full') => {
        const fl = activeFloor();
        const seg = createWallSegment(x1, z1, x2, z2, fl.room, style);
        if (!seg) return false;
        pushHistorySnapshot();
        fl.walls.push(seg);
        syncActiveFloorAliases(builder.layout);
        rebuildWalls3D();
        markDirty();
        syncDockUI();
        return true;
      },
      placeItemDirect: (type, x, z, rotation = 0) => {
        const fl = activeFloor();
        const spec = getCatalogItem(type);
        if (!spec) return false;
        const item = clampItemToRoom(
          {
            id: `it-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
            type,
            x,
            z,
            rotation,
            tableNumber: assignNextStationNumber(builder.layout, type),
            ...(spec.defaultVariant ? { variant: spec.defaultVariant } : {}),
          },
          fl.room,
          0.5
        );
        pushHistorySnapshot();
        fl.items.push(item);
        syncActiveFloorAliases(builder.layout);
        rebuildSingleItem3D(item);
        markDirty();
        syncDockUI();
        return true;
      },
      addFloor: (copyWalls = false) => addNewFloor(copyWalls),
      switchFloor: (idx) => switchActiveFloor(idx),
      toggleAllFloors: () => toggleViewAllFloors(),
      setCamera: (preset) => setCameraPreset(preset, true),
    };

    if (!window.__mg3dTablesSyncBound) {
      window.__mg3dTablesSyncBound = true;
      window.addEventListener('mg:tables-updated', async () => {
        if (!builder.mounted) return;
        await loadSavedLayoutAndReservations({ onlyReservations: true });
        rebuildItems3D();
      });
    }
    return;
  }

  await loadSavedLayoutAndReservations({ onlyReservations: builder.hasUnsavedChanges });
  rebuildItems3D();
  resizeRendererToHost();
  syncDockUI();
  ensure3DTimerLoop();
  requestRender();
}
