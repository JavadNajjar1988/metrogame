/**
 * Interactive 3D Game Center Builder ("گیم نت من") Controller.
 * Follows Three.js Skill directives:
 * - Software-WebGL guard (isSoftwareGl) affecting only rendering cost
 * - Mandatory RoomEnvironment studio reflections + ACESFilmicToneMapping + SRGBColorSpace
 * - Render-on-demand with afterDraw software-WebGL synchronization
 * - Smooth exponential camera preset damping (cancels on OrbitControls 'start')
 * - Ergonomic collapsible bottom dock (zero mid-left/mid-right viewport occlusion, no backdrop-filter over WebGL)
 * - Persistent save/load via gamenet_layout.json + save_layout.php
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ROOM_LIMITS,
  FLOOR_FINISHES,
  WALL_FINISHES,
  LIGHTING_MOODS,
  CATALOG_CATEGORIES,
  ITEM_CATALOG,
  getCatalogItem,
  clampItemToRoom,
  checkItemCollision,
  createStarterLayout,
  sanitizeLayout,
  assignNextStationNumber,
  summarizeLayoutStats,
  normalizeRotationDeg,
  moveItemToPoint,
  resolveGridRenderStyle,
  formatStationMiniTimer,
} from './gamenet-3d-engine.mjs?v=20261124-7';
import {
  buildRoomShell,
  buildFurnitureModel,
  buildPlacementGhost,
  buildSelectionRing,
  drawStationTimerCanvas,
  disposeObject3D,
} from './gamenet-3d-models.js?v=20261124-7';
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
  itemsContainer: null,
  floorHitMesh: null,
  gridGroup: null,
  itemMeshMap: new Map(),
  pickProxies: [],
  selectionRing: null,
  placementGhost: null,

  // On-demand render & camera transition state
  frameId: 0,
  renderBusy: false,
  renderDirty: false,
  camTransitionActive: false,
  lastTransitionPerf: 0,

  // Builder data state
  layout: createStarterLayout('pro-arena'),
  occupiedTables: new Set(),
  reservationsByTable: new Map(),
  clickTimesByTable: new Map(),
  finishTimesByTable: new Map(),
  stationTimerSprites: new Map(),
  timerTickId: null,
  gridSnap: true,
  renderMode: 'solid', // 'solid' | 'wireframe'
  activeTab: 'catalog', // 'catalog' | 'room' | 'selected'
  activeCategory: 'all',
  dockCollapsed: false,
  selectedId: null,
  placingType: null,
  movingItemId: null,
  placingRotation: 0,
  placingValid: true,
  draggingId: null,
  dragStartSnapshot: null,
  pointerDownPos: null,
  hasUnsavedChanges: false,
  lastMoveRaycast: 0,
};

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
  const { width, depth, height } = builder.layout.room;
  const maxDim = Math.max(width, depth);

  if (preset === 'top') {
    _camGoalPos.set(0.01, maxDim * 1.44, 0.01);
    _camGoalTarget.set(0, 0, 0.35);
  } else if (preset === 'inside') {
    _camGoalPos.set(width * 0.34, Math.min(2.1, height * 0.62), depth * 0.38);
    _camGoalTarget.set(-width * 0.14, 0.9, -depth * 0.22);
  } else if (preset === 'iso') {
    _camGoalPos.set(maxDim * 0.92, maxDim * 0.78, maxDim * 0.92);
    _camGoalTarget.set(0, -0.35, 0.65);
  } else {
    // Default hero 3D architectural perspective framed cleanly above bottom dock
    _camGoalPos.set(width * 0.82, Math.max(9.2, maxDim * 0.76), depth * 1.2);
    _camGoalTarget.set(0, -0.75, 1.05);
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
  const mood = builder.layout.room.mood;
  const lightTheme = isLightTheme();
  const accentHex = getActiveAccentHex();

  let bgHex = lightTheme ? 0xe9eef6 : 0x0b0f1a;
  if (mood === 'daylight') {
    bgHex = lightTheme ? 0xeef3fa : 0x182133;
    builder.keyLight.color.setHex(0xfff6e8);
    builder.keyLight.intensity = 2.0;
    builder.hemiLight.color.setHex(0xdbeafe);
    builder.hemiLight.groundColor.setHex(0x475569);
    builder.hemiLight.intensity = 1.05;
    builder.rimLight.color.setHex(0x93c5fd);
    builder.rimLight.intensity = 0.55;
  } else if (mood === 'lounge') {
    bgHex = lightTheme ? 0xe8e5e0 : 0x0e0b14;
    builder.keyLight.color.setHex(0xffd29d);
    builder.keyLight.intensity = 1.45;
    builder.hemiLight.color.setHex(0x94a3b8);
    builder.hemiLight.groundColor.setHex(0x271d18);
    builder.hemiLight.intensity = 0.65;
    builder.rimLight.color.set(accentHex);
    builder.rimLight.intensity = 0.8;
  } else {
    // 'esports' balanced studio look
    bgHex = lightTheme ? 0xe6ecf5 : 0x0a0d16;
    builder.keyLight.color.setHex(0xfff3e0);
    builder.keyLight.intensity = 1.65;
    builder.hemiLight.color.setHex(0xa5b4fc);
    builder.hemiLight.groundColor.setHex(0x1e293b);
    builder.hemiLight.intensity = 0.78;
    builder.rimLight.color.set(accentHex);
    builder.rimLight.intensity = 0.75;
  }

  builder.scene.background = new THREE.Color(bgHex);
  builder.scene.fog = new THREE.FogExp2(bgHex, 0.015);
  requestRender();
}

function rebuildRoom3D() {
  if (!builder.roomContainer || !builder.renderer) return;
  while (builder.roomContainer.children.length > 0) {
    const child = builder.roomContainer.children[0];
    builder.roomContainer.remove(child);
    disposeObject3D(child);
  }

  const maxAniso = builder.renderer.capabilities.getMaxAnisotropy();
  const { group, floorMesh, gridGroup } = buildRoomShell(
    builder.layout.room,
    getActiveAccentHex(),
    maxAniso
  );
  builder.roomContainer.add(group);
  builder.floorHitMesh = floorMesh;
  builder.gridGroup = gridGroup;
  builder.gridGroup.visible = builder.gridSnap;

  // Adjust directional shadow camera bounds to match room size tightly
  if (builder.keyLight) {
    const d = Math.max(builder.layout.room.width, builder.layout.room.depth) * 0.72 + 2;
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

function applyRenderMode() {
  const style = resolveGridRenderStyle(
    builder.renderMode,
    builder.layout.room.floor,
    builder.gridSnap
  );

  const applyToSubtree = (root) => {
    if (!root) return;
    root.traverse((obj) => {
      if (obj.name === 'PickProxy' || obj.name === 'StationBadge') return;
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
  applyToSubtree(builder.itemsContainer);

  if (builder.gridGroup) {
    builder.gridGroup.visible = style.gridVisible;
    const isLightFloor = builder.layout.room.floor === 'marble-light';
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
      drawStationTimerCanvas(entry.canvas, entry.tableNumber, state, accentHex);
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

  for (const item of builder.layout.items) {
    const timerState = getStationTimerState(item.tableNumber, nowSec);
    const isOccupied = Boolean(timerState.isOccupied);
    const model = buildFurnitureModel(item, {
      accentHex,
      isOccupied,
      timerState,
      anisotropy: maxAniso,
    });
    builder.itemsContainer.add(model);
    builder.itemMeshMap.set(item.id, model);
    registerStationTimerSprite(item, model);
    const proxy = model.getObjectByName('PickProxy');
    if (proxy) builder.pickProxies.push(proxy);
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

function updateSelectionRing() {
  if (!builder.selectionRing) return;
  const item = builder.layout.items.find((i) => i.id === builder.selectedId);
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
  builder.selectionRing.position.set(item.x, 0, item.z);
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
  if (canvas) canvas.style.cursor = 'grab';
  syncDockUI();
  requestRender();
}

function enterPlacementMode(type) {
  if (!getCatalogItem(type)) return;
  if (builder.placingType === type && !builder.movingItemId) {
    clearPlacementMode();
    return;
  }
  clearPlacementMode();
  builder.selectedId = null;
  updateSelectionRing();

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
  const item = builder.layout.items.find((i) => i.id === itemId);
  if (!item || !getCatalogItem(item.type)) return;
  if (builder.movingItemId === item.id) {
    clearPlacementMode();
    return;
  }
  clearPlacementMode();
  builder.selectedId = item.id;
  builder.movingItemId = item.id;
  builder.placingType = item.type;
  builder.placingRotation = normalizeRotationDeg(item.rotation || 0);
  builder.placementGhost = buildPlacementGhost(item.type);
  builder.placementGhost.position.set(item.x, 0, item.z);
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
    builder.layout.room,
    step
  );

  const collides = checkItemCollision(candidate, builder.layout.items, ignoreId);
  builder.placingValid = !collides;
  builder.placementGhost.position.set(candidate.x, 0, candidate.z);
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
    showBuilderToast('این فضا با وسیله دیگری هم‌پوشانی دارد؛ نقطه آزاد را انتخاب کنید.');
    return;
  }

  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;

  // Click-to-Move commit for an existing gaming station
  if (builder.movingItemId) {
    const item = builder.layout.items.find((i) => i.id === builder.movingItemId);
    if (!item) {
      clearPlacementMode();
      return;
    }
    const movedRes = moveItemToPoint(
      { ...item, rotation: builder.placingRotation },
      builder.placementGhost.position.x,
      builder.placementGhost.position.z,
      builder.layout.room,
      builder.layout.items,
      step
    );
    if (!movedRes.ok || !movedRes.item) {
      showBuilderToast('این فضا با وسیله دیگری هم‌پوشانی دارد؛ نقطه آزاد را انتخاب کنید.');
      return;
    }
    Object.assign(item, movedRes.item);
    const mesh = builder.itemMeshMap.get(item.id);
    if (mesh) {
      mesh.position.set(item.x, 0, item.z);
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
  const newItem = clampItemToRoom(
    {
      id: newId,
      type: builder.placingType,
      x: builder.placementGhost.position.x,
      z: builder.placementGhost.position.z,
      rotation: builder.placingRotation,
      tableNumber: assignNextStationNumber(builder.layout.items, builder.placingType),
    },
    builder.layout.room,
    step
  );

  builder.layout.items.push(newItem);
  rebuildSingleItem3D(newItem);
  markDirty();

  const spec = getCatalogItem(newItem.type);
  showBuilderToast(`${spec ? spec.name : 'آیتم'} روی نقشه قرار گرفت.`);

  if (!keepPlacing) {
    clearPlacementMode();
    selectItem(newItem.id);
  }
}

function selectItem(id) {
  builder.selectedId = id || null;
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
  const item = builder.layout.items.find((i) => i.id === builder.selectedId);
  if (!item) return;

  const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;
  const rotated = clampItemToRoom(
    { ...item, rotation: normalizeRotationDeg(item.rotation + deltaDeg) },
    builder.layout.room,
    step
  );
  if (checkItemCollision(rotated, builder.layout.items, item.id)) {
    showBuilderToast('فضای کافی برای چرخش در این نقطه نیست؛ ابتدا کمی جابه‌جا کنید.');
    return;
  }
  Object.assign(item, rotated);
  const mesh = builder.itemMeshMap.get(item.id);
  if (mesh) {
    mesh.position.set(item.x, 0, item.z);
    mesh.rotation.y = THREE.MathUtils.degToRad(item.rotation);
  }
  updateSelectionRing();
  markDirty();
  syncDockUI();
}

function duplicateSelectedItem() {
  const src = builder.layout.items.find((i) => i.id === builder.selectedId);
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
        tableNumber: assignNextStationNumber(builder.layout.items, src.type),
      },
      builder.layout.room,
      step
    );
    if (!checkItemCollision(cand, builder.layout.items)) {
      placed = cand;
      break;
    }
  }

  if (!placed) {
    showBuilderToast('جای آزاد کنار این وسیله پیدا نشد؛ از کاتالوگ اضافه کنید.');
    return;
  }

  builder.layout.items.push(placed);
  rebuildSingleItem3D(placed);
  markDirty();
  selectItem(placed.id);
  showBuilderToast(`${spec ? spec.name : 'آیتم'} تکثیر شد.`);
}

function deleteSelectedItem() {
  if (!builder.selectedId) return;
  const idx = builder.layout.items.findIndex((i) => i.id === builder.selectedId);
  if (idx === -1) return;
  const [removed] = builder.layout.items.splice(idx, 1);

  const mesh = builder.itemMeshMap.get(removed.id);
  if (mesh && builder.itemsContainer) {
    builder.itemsContainer.remove(mesh);
    disposeObject3D(mesh);
    builder.itemMeshMap.delete(removed.id);
    builder.pickProxies = builder.pickProxies.filter((p) => p.userData.pickItemId !== removed.id);
  }
  builder.selectedId = null;
  builder.activeTab = 'catalog';
  updateSelectionRing();
  markDirty();
  syncDockUI();
  showBuilderToast('آیتم از سالن حذف شد.');
}

function updateRoomConfig(patch) {
  builder.layout.room = sanitizeLayout({
    room: { ...builder.layout.room, ...patch },
    items: [],
  }).room;

  // Keep all placed items strictly inside the updated room walls
  builder.layout.items = builder.layout.items.map((it) =>
    clampItemToRoom(it, builder.layout.room, 0)
  );
  rebuildRoom3D();
  rebuildItems3D();
  markDirty();
  syncDockUI();
}

function applyStarterPreset(preset) {
  clearPlacementMode();
  builder.selectedId = null;
  builder.layout = createStarterLayout(preset);
  rebuildRoom3D();
  rebuildItems3D();
  setCameraPreset('hero', false);
  markDirty();
  syncDockUI();
  const labels = {
    'pro-arena': 'چیدمان سالن استاندارد بارگذاری شد.',
    compact: 'چیدمان سالن جمع‌وجور بارگذاری شد.',
    empty: 'سالن خالی آماده طراحی اختصاصی شماست.',
  };
  showBuilderToast(labels[preset] || 'چیدمان به‌روزرسانی شد.');
}

async function saveLayoutToServer() {
  const saveBtn = document.getElementById('mg3dSaveBtn');
  if (saveBtn) saveBtn.disabled = true;

  try {
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
      if (saved && saved.room && Array.isArray(saved.items)) {
        builder.layout = sanitizeLayout(saved);
        builder.hasUnsavedChanges = false;
      }
    }
  } catch {
    // Keep starter layout
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
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (!updateCanvasMouse(e)) return;

    builder.pointerDownPos = { x: e.clientX, y: e.clientY };

    if (builder.placingType) {
      builder.pointerDownPos = null;
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        updateGhostAtPoint(_hitPoint);
        placeItemAtGhost(e.shiftKey);
      }
      return;
    }

    builder.raycaster.setFromCamera(_mouse, builder.camera);
    const hits = builder.raycaster.intersectObjects(builder.pickProxies, false);
    if (hits.length > 0) {
      const hitId = hits[0].object.userData.pickItemId;
      if (hitId) {
        selectItem(hitId);
        // Prepare drag-on-floor immediately
        const item = builder.layout.items.find((i) => i.id === hitId);
        if (item && builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
          builder.draggingId = hitId;
          builder.dragStartSnapshot = { x: item.x, z: item.z };
          _dragOffset.set(item.x - _hitPoint.x, 0, item.z - _hitPoint.z);
          if (builder.controls) builder.controls.enabled = false;
          canvas.style.cursor = 'grabbing';
        }
      }
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (!builder.draggingId && !builder.placingType && now - builder.lastMoveRaycast < 45) {
      return;
    }
    builder.lastMoveRaycast = now;
    if (!updateCanvasMouse(e)) return;

    if (builder.placingType) {
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        updateGhostAtPoint(_hitPoint);
      }
      return;
    }

    if (builder.draggingId) {
      const item = builder.layout.items.find((i) => i.id === builder.draggingId);
      if (!item) return;
      builder.raycaster.setFromCamera(_mouse, builder.camera);
      if (builder.raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        const step = builder.gridSnap ? ROOM_LIMITS.gridStep : 0;
        const moved = moveItemToPoint(
          item,
          _hitPoint.x + _dragOffset.x,
          _hitPoint.z + _dragOffset.z,
          builder.layout.room,
          builder.layout.items,
          step
        );
        const mesh = builder.itemMeshMap.get(item.id);
        if (moved.ok && moved.item && mesh) {
          item.x = moved.item.x;
          item.z = moved.item.z;
          mesh.position.set(item.x, 0, item.z);
          updateSelectionRing();
          markDirty();
        }
      }
      return;
    }

    // Light hover cursor feedback
    builder.raycaster.setFromCamera(_mouse, builder.camera);
    const hits = builder.raycaster.intersectObjects(builder.pickProxies, false);
    canvas.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  });

  const finishDrag = (e) => {
    if (builder.draggingId) {
      builder.draggingId = null;
      builder.dragStartSnapshot = null;
      if (builder.controls) builder.controls.enabled = true;
      canvas.style.cursor = 'grab';
      syncDockUI();
      requestRender();
      return;
    }
    // Click on empty floor deselects current item
    if (!builder.placingType && builder.pointerDownPos) {
      const moved = Math.hypot(e.clientX - builder.pointerDownPos.x, e.clientY - builder.pointerDownPos.y);
      if (moved < 5 && updateCanvasMouse(e)) {
        builder.raycaster.setFromCamera(_mouse, builder.camera);
        const hits = builder.raycaster.intersectObjects(builder.pickProxies, false);
        if (hits.length === 0 && builder.selectedId) {
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
  const specEl = document.getElementById('mg3dRoomSpecText');
  if (specEl) {
    specEl.textContent =
      `${toPersianDigits(builder.layout.room.width)}×${toPersianDigits(builder.layout.room.depth)} متر (${toPersianDigits(stats.areaSqm)} م²) · ` +
      `${toPersianDigits(stats.stations)} ایستگاه بازی · ${toPersianDigits(stats.totalItems)} وسیله`;
  }

  const saveBtn = document.getElementById('mg3dSaveBtn');
  if (saveBtn) {
    saveBtn.textContent = builder.hasUnsavedChanges ? 'ذخیره تغییرات' : 'ذخیره‌شده';
    saveBtn.classList.toggle('is-dirty', builder.hasUnsavedChanges);
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

  const dock = document.getElementById('mg3dBottomDock');
  const toggleBtn = document.getElementById('mg3dDockToggle');
  if (dock) dock.classList.toggle('is-collapsed', builder.dockCollapsed);
  if (toggleBtn) {
    toggleBtn.textContent = builder.dockCollapsed ? '▴ نمایش ابزارهای طراحی' : '▾ مخفی کردن ابزارها';
    toggleBtn.setAttribute('aria-expanded', builder.dockCollapsed ? 'false' : 'true');
  }

  const shell = document.getElementById('mg3dBuilderShell');
  if (shell) {
    shell.dataset.editorMode = builder.movingItemId ? 'move' : builder.placingType ? 'add' : 'idle';
    shell.dataset.selectedId = builder.selectedId || '';
    shell.dataset.itemCount = String(builder.layout.items.length);
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

  // Placement / Click-to-Move mode hint banner
  const hintBar = document.getElementById('mg3dPlaceBanner');
  if (hintBar) {
    if (builder.placingType) {
      const spec = getCatalogItem(builder.placingType);
      hintBar.hidden = false;
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
    selectedTabBtn.hidden = !builder.selectedId;
  }

  document.querySelectorAll('[data-3d-tab]').forEach((btn) => {
    const active = btn.getAttribute('data-3d-tab') === builder.activeTab;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('[data-3d-pane]').forEach((pane) => {
    pane.hidden = pane.getAttribute('data-3d-pane') !== builder.activeTab;
  });

  // Category filter buttons
  document.querySelectorAll('[data-3d-cat]').forEach((btn) => {
    const active = btn.getAttribute('data-3d-cat') === builder.activeCategory;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  renderCatalogCards();

  // Room controls values
  const { width, depth, height, floor, wall, mood, cutawayWalls } = builder.layout.room;
  const wVal = document.getElementById('mg3dRoomWVal');
  const dVal = document.getElementById('mg3dRoomDVal');
  const hVal = document.getElementById('mg3dRoomHVal');
  const wInput = document.getElementById('mg3dRoomWInput');
  const dInput = document.getElementById('mg3dRoomDInput');
  const hInput = document.getElementById('mg3dRoomHInput');
  if (wVal) wVal.textContent = `${toPersianDigits(width)} متر`;
  if (dVal) dVal.textContent = `${toPersianDigits(depth)} متر`;
  if (hVal) hVal.textContent = `${toPersianDigits(height)} متر`;
  if (wInput) wInput.value = String(width);
  if (dInput) dInput.value = String(depth);
  if (hInput) hInput.value = String(height);

  document.querySelectorAll('[data-3d-floor]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-floor') === floor);
  });
  document.querySelectorAll('[data-3d-wall]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-wall') === wall);
  });
  document.querySelectorAll('[data-3d-mood]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-3d-mood') === mood);
  });

  const cutawayBtn = document.getElementById('mg3dCutawayBtn');
  if (cutawayBtn) {
    cutawayBtn.textContent = cutawayWalls ? 'نمای باز (۲ دیوار)' : 'نمای بسته (۴ دیوار)';
    cutawayBtn.classList.toggle('is-active', cutawayWalls);
  }
  const snapBtn = document.getElementById('mg3dSnapBtn');
  if (snapBtn) {
    snapBtn.textContent = builder.gridSnap ? 'تراز روی شبکه: روشن' : 'تراز روی شبکه: آزاد';
    snapBtn.classList.toggle('is-active', builder.gridSnap);
  }

  // Selected item inspector controls
  const selItem = builder.layout.items.find((i) => i.id === builder.selectedId);
  if (selItem) {
    const spec = getCatalogItem(selItem.type);
    const nameEl = document.getElementById('mg3dSelName');
    const coordsEl = document.getElementById('mg3dSelCoords');
    const tableWrap = document.getElementById('mg3dSelTableWrap');
    const tableInput = document.getElementById('mg3dSelTableInput');
    if (nameEl) nameEl.textContent = spec ? spec.name : selItem.type;
    if (coordsEl) {
      coordsEl.textContent = `موقعیت (${toPersianDigits(itemCoords(selItem.x))}، ${toPersianDigits(itemCoords(selItem.z))}) · زاویه ${toPersianDigits(selItem.rotation)}° · بکشید یا دکمه جابه‌جایی را بزنید`;
    }
    if (tableWrap) tableWrap.hidden = !(spec && spec.isStation);
    if (tableInput && document.activeElement !== tableInput) {
      tableInput.value = selItem.tableNumber || '';
    }
  }
}

function buildHudMarkup(shell) {
  const floorSwatches = FLOOR_FINISHES.map(
    (f) => `<button type="button" class="mg3d-swatch-btn" data-3d-floor="${f.id}" title="${f.label}">
      <span class="mg3d-swatch-dot" style="background:${f.color}"></span>
      <span>${f.label}</span>
    </button>`
  ).join('');

  const wallSwatches = WALL_FINISHES.map(
    (w) => `<button type="button" class="mg3d-swatch-btn" data-3d-wall="${w.id}" title="${w.label}">
      <span class="mg3d-swatch-dot" style="background:${w.color}"></span>
      <span>${w.label}</span>
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

    <!-- Minimal Top Spec & Camera Bar (zero mid-viewport occlusion) -->
    <div class="mg3d-top-hud">
      <div class="mg3d-spec-block">
        <strong class="mg3d-spec-title">طراح سه‌بعدی گیم‌نت</strong>
        <span id="mg3dRoomSpecText" class="mg3d-spec-meta">۱۴×۱۰ متر · در حال بارگذاری...</span>
      </div>
      <div class="mg3d-top-actions">
        <div class="mg3d-cam-group" role="group" aria-label="زاویه دوربین سه‌بعدی">
          <button type="button" class="mg3d-cam-btn is-active" data-3d-cam="hero">سه‌بعدی</button>
          <button type="button" class="mg3d-cam-btn" data-3d-cam="iso">ایزومتریک</button>
          <button type="button" class="mg3d-cam-btn" data-3d-cam="top">نمای بالا</button>
          <button type="button" class="mg3d-cam-btn" data-3d-cam="inside">داخل سالن</button>
        </div>
        <button
          type="button"
          id="mg3dWireframeToggleBtn"
          class="mg3d-view-toggle-btn"
          aria-pressed="false"
          aria-label="تغییر حالت نمایش شبکه سه‌بعدی بین توپر و سیمی"
          title="تغییر نمایش شبکه سه‌بعدی بین حالت توپر و سیمی (W)"
          data-render-mode="solid"
        >
          <svg class="mg3d-view-toggle-icon" viewBox="0 0 18 18" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 1.75 15.25 5.25v7.5L9 16.25l-6.25-3.5v-7.5L9 1.75Z"/>
            <path d="M9 9.25 15.25 5.25M9 9.25 2.75 5.25M9 9.25v7"/>
          </svg>
          <span id="mg3dWireframeToggleLabel">نمای توپر</span>
        </button>
        <button type="button" id="mg3dSaveBtn" class="mg3d-save-btn">ذخیره‌شده</button>
      </div>
    </div>

    <!-- Placement Mode Prompt (visible only when actively placing an item) -->
    <div id="mg3dPlaceBanner" class="mg3d-place-banner" hidden>
      <span id="mg3dPlaceBannerText">حالت چیدمان فعال است</span>
      <div class="mg3d-place-banner-actions">
        <button type="button" id="mg3dPlaceRotateBtn" class="mg3d-mini-btn">چرخش ۹۰° (R)</button>
        <button type="button" id="mg3dPlaceCancelBtn" class="mg3d-mini-btn is-danger">لغو (Esc)</button>
      </div>
    </div>

    <!-- Unified Collapsible Bottom Control Dock (Zero Side-Panel Clutter) -->
    <div id="mg3dBottomDock" class="mg3d-bottom-dock">
      <button type="button" id="mg3dDockToggle" class="mg3d-dock-toggle" aria-expanded="true">▾ مخفی کردن ابزارها</button>
      <div class="mg3d-dock-surface">
        <div class="mg3d-dock-tabs" role="tablist" aria-label="ابزارهای طراح سه‌بعدی">
          <button type="button" role="tab" class="mg3d-tab-btn is-active" data-3d-tab="catalog" aria-selected="true">چیدمان میز و سیستم‌ها</button>
          <button type="button" role="tab" class="mg3d-tab-btn" data-3d-tab="room" aria-selected="false">تنظیمات محیط و ابعاد</button>
          <button type="button" role="tab" id="mg3dTabSelectedBtn" class="mg3d-tab-btn" data-3d-tab="selected" aria-selected="false" hidden>ویرایش وسیله انتخاب‌شده</button>
        </div>

        <!-- TAB 1: Catalog & Furniture Placement -->
        <div class="mg3d-dock-pane" data-3d-pane="catalog">
          <div class="mg3d-cat-bar">${catBtns}</div>
          <div id="mg3dCatalogList" class="mg3d-catalog-strip"></div>
        </div>

        <!-- TAB 2: Room Dimensions, Floor/Wall Finishes, Lighting & Presets -->
        <div class="mg3d-dock-pane" data-3d-pane="room" hidden>
          <div class="mg3d-room-grid">
            <div class="mg3d-room-col">
              <div class="mg3d-slider-row">
                <label for="mg3dRoomWInput">عرض سالن</label>
                <span id="mg3dRoomWVal">۱۴ متر</span>
                <input type="range" id="mg3dRoomWInput" min="6" max="24" step="1" value="14">
              </div>
              <div class="mg3d-slider-row">
                <label for="mg3dRoomDInput">طول سالن</label>
                <span id="mg3dRoomDVal">۱۰ متر</span>
                <input type="range" id="mg3dRoomDInput" min="6" max="20" step="1" value="10">
              </div>
              <div class="mg3d-slider-row">
                <label for="mg3dRoomHInput">ارتفاع سقف</label>
                <span id="mg3dRoomHVal">۳.۵ متر</span>
                <input type="range" id="mg3dRoomHInput" min="2.8" max="4.5" step="0.1" value="3.5">
              </div>
            </div>

            <div class="mg3d-room-col">
              <div class="mg3d-sub-label">کف‌پوش سالن</div>
              <div class="mg3d-swatch-row">${floorSwatches}</div>
              <div class="mg3d-sub-label">جنس دیوارها</div>
              <div class="mg3d-swatch-row">${wallSwatches}</div>
            </div>

            <div class="mg3d-room-col">
              <div class="mg3d-sub-label">نورپردازی و نمایش</div>
              <div class="mg3d-btn-row">${moodBtns}</div>
              <div class="mg3d-btn-row">
                <button type="button" id="mg3dCutawayBtn" class="mg3d-seg-btn is-active">نمای باز (۲ دیوار)</button>
                <button type="button" id="mg3dSnapBtn" class="mg3d-seg-btn is-active">تراز روی شبکه: روشن</button>
              </div>
              <div class="mg3d-sub-label">قالب‌های آماده</div>
              <div class="mg3d-btn-row">
                <button type="button" class="mg3d-seg-btn" data-3d-preset="pro-arena">سالن استاندارد</button>
                <button type="button" class="mg3d-seg-btn" data-3d-preset="compact">سالن جمع‌وجور</button>
                <button type="button" class="mg3d-seg-btn is-danger-ghost" data-3d-preset="empty">سالن خالی</button>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: Selected Item Inspector -->
        <div class="mg3d-dock-pane" data-3d-pane="selected" hidden>
          <div class="mg3d-selected-bar">
            <div class="mg3d-selected-info">
              <strong id="mg3dSelName">—</strong>
              <span id="mg3dSelCoords">—</span>
            </div>
            <div id="mg3dSelTableWrap" class="mg3d-sel-table-field">
              <label for="mg3dSelTableInput">شماره میز:</label>
              <input type="text" id="mg3dSelTableInput" class="mg3d-table-input" inputmode="numeric" maxlength="6" placeholder="مثلاً ۱">
            </div>
            <div class="mg3d-selected-actions">
              <button type="button" id="mg3dSelMoveBtn" class="mg3d-action-btn is-accent">جابه‌جایی (M)</button>
              <button type="button" id="mg3dSelRotateBtn" class="mg3d-action-btn">چرخش ۹۰° (R)</button>
              <button type="button" id="mg3dSelDupBtn" class="mg3d-action-btn">تکثیر (D)</button>
              <button type="button" id="mg3dSelDelBtn" class="mg3d-action-btn is-danger">حذف</button>
              <button type="button" id="mg3dSelCloseBtn" class="mg3d-action-btn">بستن</button>
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
  });

  document.getElementById('mg3dDockToggle')?.addEventListener('click', () => {
    builder.dockCollapsed = !builder.dockCollapsed;
    syncDockUI();
  });

  document.getElementById('mg3dSaveBtn')?.addEventListener('click', () => {
    saveLayoutToServer();
  });

  document.getElementById('mg3dWireframeToggleBtn')?.addEventListener('click', () => {
    toggleRenderMode();
  });

  document.getElementById('mg3dPlaceRotateBtn')?.addEventListener('click', () => rotateSelectedItem(90));
  document.getElementById('mg3dPlaceCancelBtn')?.addEventListener('click', () => clearPlacementMode());

  document.getElementById('mg3dCutawayBtn')?.addEventListener('click', () => {
    updateRoomConfig({ cutawayWalls: !builder.layout.room.cutawayWalls });
  });

  document.getElementById('mg3dSnapBtn')?.addEventListener('click', () => {
    builder.gridSnap = !builder.gridSnap;
    applyRenderMode();
    syncDockUI();
  });

  document.getElementById('mg3dRoomWInput')?.addEventListener('input', (e) => {
    updateRoomConfig({ width: Number(e.target.value) });
  });
  document.getElementById('mg3dRoomDInput')?.addEventListener('input', (e) => {
    updateRoomConfig({ depth: Number(e.target.value) });
  });
  document.getElementById('mg3dRoomHInput')?.addEventListener('input', (e) => {
    updateRoomConfig({ height: Number(e.target.value) });
  });

  document.getElementById('mg3dSelMoveBtn')?.addEventListener('click', () => {
    if (builder.selectedId) enterMoveMode(builder.selectedId);
  });
  document.getElementById('mg3dSelRotateBtn')?.addEventListener('click', () => rotateSelectedItem(90));
  document.getElementById('mg3dSelDupBtn')?.addEventListener('click', () => duplicateSelectedItem());
  document.getElementById('mg3dSelDelBtn')?.addEventListener('click', () => deleteSelectedItem());
  document.getElementById('mg3dSelCloseBtn')?.addEventListener('click', () => selectItem(null));

  document.getElementById('mg3dSelTableInput')?.addEventListener('input', (e) => {
    const item = builder.layout.items.find((i) => i.id === builder.selectedId);
    if (!item) return;
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

      if (e.key === 'Escape') {
        if (builder.placingType) clearPlacementMode();
        else if (builder.selectedId) selectItem(null);
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
        if (builder.selectedId) {
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

  // WebGL context loss/restore safety
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

  // Mandatory Studio Environment Reflections (RoomEnvironment + PMREMGenerator)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(44, 16 / 9, 0.15, 160);
  builder.camera = camera;

  // Balanced 3-point warm/cool studio lighting rig (<= 1 shadow caster)
  const keyLight = new THREE.DirectionalLight(0xfff3e0, 1.65);
  keyLight.position.set(11, 18, 12);
  keyLight.castShadow = !builder.isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 60;
  scene.add(keyLight);
  builder.keyLight = keyLight;

  const hemiLight = new THREE.HemisphereLight(0xa5b4fc, 0x1e293b, 0.78);
  scene.add(hemiLight);
  builder.hemiLight = hemiLight;

  const rimLight = new THREE.DirectionalLight(0x7c3aed, 0.75);
  rimLight.position.set(-12, 9, -11);
  scene.add(rimLight);
  builder.rimLight = rimLight;

  // Scene hierarchy groups
  builder.roomContainer = new THREE.Group();
  builder.itemsContainer = new THREE.Group();
  builder.selectionRing = buildSelectionRing(getActiveAccentHex());
  scene.add(builder.roomContainer);
  scene.add(builder.itemsContainer);
  scene.add(builder.selectionRing);

  // OrbitControls (damping disabled on software WebGL per skill directive)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !builder.isSoftwareGl;
  controls.dampingFactor = 0.07;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;
  controls.minDistance = 4;
  controls.maxDistance = 38;
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

  // Sync 3D lighting & accent strips whenever Dark/Light or Accent Palette changes
  builder.themeObserver = new MutationObserver(() => {
    if (!builder.mounted) return;
    rebuildRoom3D();
    rebuildItems3D();
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
      rebuildRoom3D();
      rebuildItems3D();
      resizeRendererToHost();
      setCameraPreset('hero', true);
      syncDockUI();
      ensure3DTimerLoop();
      requestRender();
    }

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

  // Re-sync live reservations (occupied badges & mini-timers) and viewport size whenever returning to tab
  await loadSavedLayoutAndReservations({ onlyReservations: builder.hasUnsavedChanges });
  rebuildItems3D();
  resizeRendererToHost();
  syncDockUI();
  ensure3DTimerLoop();
  requestRender();
}
