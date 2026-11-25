/**
 * Procedural PBR CanvasTextures & Composite 5-10 Part Three.js Models
 * for the Game District 3D Game Center Builder.
 * Zero external asset dependencies (zero 404s).
 */
import * as THREE from 'three';
import {
  FLOOR_FINISHES,
  WALL_FINISHES,
  getCatalogItem,
} from './gamenet-3d-engine.mjs?v=20261124-7';

const textureCache = new Map();

function makeCanvasTexture(cacheKey, width, height, drawFn, { repeatX = 1, repeatY = 1, anisotropy = 4, srgb = true } = {}) {
  const fullKey = `${cacheKey}:${repeatX}:${repeatY}`;
  if (textureCache.has(fullKey)) return textureCache.get(fullKey);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);

  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = Math.max(1, anisotropy);
  tex.needsUpdate = true;
  textureCache.set(fullKey, tex);
  return tex;
}

export function createFloorTexture(floorId, roomW, roomD, anisotropy = 4) {
  const finish = FLOOR_FINISHES.find((f) => f.id === floorId) || FLOOR_FINISHES[0];
  const repX = Math.max(2, Math.round(roomW / 2));
  const repY = Math.max(2, Math.round(roomD / 2));

  return makeCanvasTexture(
    `floor-${floorId}`,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = finish.color;
      ctx.fillRect(0, 0, w, h);

      if (floorId === 'slate-tile') {
        const tiles = 4;
        const step = w / tiles;
        for (let y = 0; y < tiles; y++) {
          for (let x = 0; x < tiles; x++) {
            const shade = ((x * 7 + y * 13) % 5) * 3 - 6;
            ctx.fillStyle = `rgb(${28 + shade}, ${34 + shade}, ${48 + shade})`;
            ctx.fillRect(x * step + 3, y * step + 3, step - 6, step - 6);
            // Subtle architectural sheen corner
            const grad = ctx.createLinearGradient(x * step, y * step, (x + 1) * step, (y + 1) * step);
            grad.addColorStop(0, 'rgba(255,255,255,0.035)');
            grad.addColorStop(1, 'rgba(0,0,0,0.05)');
            ctx.fillStyle = grad;
            ctx.fillRect(x * step + 3, y * step + 3, step - 6, step - 6);
          }
        }
        ctx.strokeStyle = 'rgba(10, 13, 20, 0.72)';
        ctx.lineWidth = 4;
        for (let i = 0; i <= tiles; i++) {
          ctx.beginPath();
          ctx.moveTo(i * step, 0);
          ctx.lineTo(i * step, h);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i * step);
          ctx.lineTo(w, i * step);
          ctx.stroke();
        }
      } else if (floorId === 'warm-wood') {
        const rows = 8;
        const plankH = h / rows;
        for (let r = 0; r < rows; r++) {
          const offset = (r % 2) * (w / 2);
          for (let c = -1; c <= 1; c++) {
            const px = c * (w / 2) + offset;
            const tone = ((r * 5 + c * 9) & 3) * 5;
            ctx.fillStyle = `rgb(${92 + tone}, ${64 + Math.round(tone * 0.7)}, ${44 + Math.round(tone * 0.5)})`;
            ctx.fillRect(px + 2, r * plankH + 2, w / 2 - 4, plankH - 4);
            // Wood grain streaks
            ctx.strokeStyle = 'rgba(32, 18, 10, 0.16)';
            ctx.lineWidth = 1.5;
            for (let g = 0; g < 4; g++) {
              ctx.beginPath();
              const gy = r * plankH + 10 + g * ((plankH - 16) / 3);
              ctx.moveTo(px + 4, gy);
              ctx.bezierCurveTo(px + w * 0.16, gy + 3, px + w * 0.34, gy - 3, px + w / 2 - 4, gy);
              ctx.stroke();
            }
          }
        }
      } else if (floorId === 'arena-carpet') {
        // Acoustic hexagonal / woven gaming carpet
        ctx.fillStyle = '#181c2c';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let y = 0; y < h; y += 16) {
          for (let x = 0; x < w; x += 16) {
            ctx.fillStyle = (x + y) % 32 === 0 ? 'rgba(255,255,255,0.028)' : 'rgba(0,0,0,0.06)';
            ctx.fillRect(x, y, 8, 8);
          }
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      } else {
        // Light architectural marble/terrazzo
        ctx.fillStyle = '#dce1ea';
        ctx.fillRect(0, 0, w, h);
        const step = w / 2;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, step - 3, step - 3);
        ctx.strokeRect(step + 1.5, 1.5, step - 3, step - 3);
        ctx.strokeRect(1.5, step + 1.5, step - 3, step - 3);
        ctx.strokeRect(step + 1.5, step + 1.5, step - 3, step - 3);
        // Subtle mineral veins
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.14)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.moveTo((i * 97) % w, 0);
          ctx.bezierCurveTo((i * 131 + 80) % w, h * 0.35, (i * 73 + 20) % w, h * 0.7, (i * 157) % w, h);
          ctx.stroke();
        }
      }
    },
    { repeatX: repX, repeatY: repY, anisotropy, srgb: true }
  );
}

export function createWallTexture(wallId, anisotropy = 4) {
  const finish = WALL_FINISHES.find((w) => w.id === wallId) || WALL_FINISHES[0];
  return makeCanvasTexture(
    `wall-${wallId}`,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = finish.color;
      ctx.fillRect(0, 0, w, h);

      if (wallId === 'charcoal' || wallId === 'midnight') {
        // Acoustic vertical slat paneling
        const slats = 16;
        const sw = w / slats;
        for (let i = 0; i < slats; i++) {
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.16)';
          ctx.fillRect(i * sw, 0, sw * 0.72, h);
          ctx.fillStyle = 'rgba(0,0,0,0.38)';
          ctx.fillRect(i * sw + sw * 0.72, 0, sw * 0.28, h);
        }
      } else if (wallId === 'concrete') {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, w - 8, h / 2 - 8);
        ctx.strokeRect(4, h / 2 + 4, w - 8, h / 2 - 8);
        for (let i = 0; i < 140; i++) {
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';
          ctx.fillRect((i * 71) % w, (i * 113) % h, 18, 12);
        }
      } else {
        // Warm ivory architectural plaster panels
        ctx.strokeStyle = 'rgba(120, 113, 108, 0.14)';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 8, w / 2 - 12, h - 16);
        ctx.strokeRect(w / 2 + 4, 8, w / 2 - 12, h - 16);
      }
    },
    { repeatX: 3, repeatY: 1, anisotropy, srgb: true }
  );
}

function createScreenTexture(variant, accentHex, anisotropy = 4) {
  return makeCanvasTexture(
    `screen-${variant}-${accentHex}`,
    512,
    256,
    (ctx, w, h) => {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0b1020');
      grad.addColorStop(0.5, '#131b35');
      grad.addColorStop(1, '#0d1324');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Accent geometric esports graphic (clean, no messy text)
      ctx.fillStyle = accentHex;
      ctx.globalAlpha = 0.26;
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.45, h * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (variant === 'tv') {
        // Console dashboard tiles
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(36 + i * 112, 86, 94, 96);
        }
        ctx.fillStyle = accentHex;
        ctx.fillRect(36, 86, 94, 96);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fillRect(36, 36, 130, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(36, 206, 260, 10);
      } else {
        // Ultrawide PC game HUD horizon
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(28, h * 0.72);
        ctx.lineTo(w * 0.34, h * 0.44);
        ctx.lineTo(w * 0.56, h * 0.58);
        ctx.lineTo(w * 0.82, h * 0.28);
        ctx.lineTo(w - 28, h * 0.52);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(28, 26, 140, 22);
        ctx.fillRect(w - 130, 26, 102, 22);
      }
    },
    { repeatX: 1, repeatY: 1, anisotropy, srgb: true }
  );
}

function createContactShadowTexture() {
  return makeCanvasTexture(
    'contact-shadow-radial',
    128,
    128,
    (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.08, w / 2, h / 2, w * 0.48);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
      grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.22)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    },
    { repeatX: 1, repeatY: 1, anisotropy: 1, srgb: false }
  );
}

function createFoosballPitchTexture(anisotropy = 4) {
  return makeCanvasTexture(
    'foosball-pitch',
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.fillRect(i * (w / 8), 0, w / 8, h);
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.82)';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.beginPath();
      ctx.moveTo(w / 2, 12);
      ctx.lineTo(w / 2, h - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 34, 0, Math.PI * 2);
      ctx.stroke();
    },
    { repeatX: 1, repeatY: 1, anisotropy, srgb: true }
  );
}

function toFaDigitsLocal(val) {
  return String(val ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

/**
 * Redraws a compact floating overhead station badge + live mini-timer canvas in-place.
 * Reusing the same canvas avoids texture allocation churn during 1Hz live updates.
 */
export function drawStationTimerCanvas(canvas, tableNumber, timerState = null, accentHex = '#7c3aed') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const status = timerState?.status || 'idle';
  const rawText = timerState?.text || 'آزاد';
  const displayText = toFaDigitsLocal(rawText);
  const displayNum = toFaDigitsLocal(tableNumber);

  const palette = {
    running: { border: '#22c55e', badgeBg: '#16a34a', text: '#dcfce7', dot: '#4ade80' },
    warning: { border: '#f59e0b', badgeBg: '#d97706', text: '#fef3c7', dot: '#fbbf24' },
    expired: { border: '#ef4444', badgeBg: '#dc2626', text: '#fee2e2', dot: '#f87171' },
    waiting: { border: accentHex, badgeBg: accentHex, text: '#ede9fe', dot: accentHex },
    idle: { border: 'rgba(148, 163, 184, 0.58)', badgeBg: '#1e293b', text: '#cbd5e1', dot: '#64748b' },
  }[status] || { border: accentHex, badgeBg: '#1e293b', text: '#e2e8f0', dot: accentHex };

  // Pill background
  drawRoundedRectPath(ctx, 6, 8, w - 12, h - 16, (h - 16) / 2);
  ctx.fillStyle = status === 'idle' ? 'rgba(11, 16, 30, 0.86)' : 'rgba(10, 15, 28, 0.95)';
  ctx.fill();
  ctx.lineWidth = status === 'idle' ? 3 : 4;
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  // Right-side circular station number badge
  const circleR = 26;
  const circleX = w - 42;
  const circleY = h / 2;
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = palette.badgeBg;
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = status === 'idle' ? accentHex : '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayNum, circleX, circleY + 2);

  // Small status dot on the left side
  ctx.beginPath();
  ctx.arc(28, h / 2, 6, 0, Math.PI * 2);
  ctx.fillStyle = palette.dot;
  ctx.fill();

  // Compact live timer readout with adaptive sizing so multi-hour timers never crowd
  ctx.fillStyle = palette.text;
  const isClock = displayText.includes(':');
  const fontSize = isClock ? (displayText.length > 8 ? 24 : 28) : 24;
  ctx.font = `bold ${fontSize}px Vazirmatn, Tahoma, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textAreaLeft = 42;
  const textAreaRight = circleX - circleR - 8;
  const textCenterX = (textAreaLeft + textAreaRight) / 2;
  const maxTextW = Math.max(80, textAreaRight - textAreaLeft);
  ctx.fillText(displayText, textCenterX, h / 2 + 2, maxTextW);
}

function createStationTimerSprite(tableNumber, timerState, accentHex, anisotropy = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 304;
  canvas.height = 88;
  drawStationTimerCanvas(canvas, tableNumber, timerState, accentHex);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, anisotropy);
  texture.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
  });
  mat.userData.ownsTexture = true;

  const sprite = new THREE.Sprite(mat);
  sprite.name = 'StationBadge';
  sprite.userData.timerCanvas = canvas;
  sprite.userData.timerTexture = texture;
  sprite.userData.tableNumber = String(tableNumber);
  sprite.userData.lastText = timerState?.text || 'آزاد';
  sprite.userData.lastStatus = timerState?.status || 'idle';
  return sprite;
}

function addPart(group, geometry, material, x, y, z, { rx = 0, ry = 0, rz = 0, cast = true, receive = true } = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  group.add(mesh);
  return mesh;
}

/**
 * Builds a grounded composite 3D architectural room shell (floor slab, plinth, grid,
 * baseboards, acoustic walls, overhead LED cornice strip).
 */
export function buildRoomShell(room, accentHex = '#7c3aed', anisotropy = 4) {
  const group = new THREE.Group();
  group.name = 'RoomShell';

  const { width, depth, height, floor, wall, cutawayWalls } = room;
  const wallThick = 0.16;
  const accentColor = new THREE.Color(accentHex);

  // 1. Floor slab (top surface strictly at y = 0)
  const floorTex = createFloorTexture(floor, width, depth, anisotropy);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: floor === 'marble-light' ? 0.25 : floor === 'arena-carpet' ? 0.92 : 0.48,
    metalness: floor === 'slate-tile' ? 0.12 : 0.04,
  });
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(width, 0.18, depth), floorMat);
  floorMesh.position.set(0, -0.09, 0);
  floorMesh.receiveShadow = true;
  floorMesh.name = 'FloorHitPlane';
  group.add(floorMesh);

  // 2. Architectural dark plinth trim beneath floor
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x0b0e17,
    roughness: 0.72,
    metalness: 0.18,
  });
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(width + 0.36, 0.24, depth + 0.36), plinthMat);
  plinth.position.set(0, -0.22, 0);
  plinth.receiveShadow = true;
  plinth.name = 'RoomPlinth';
  group.add(plinth);

  // 3. Crisp dual-scale 3D floor snapping grid (0.5m minor + 1.0m major lines, polygonOffset prevents Z-fighting)
  const gridGroup = new THREE.Group();
  gridGroup.name = 'FloorGrid';
  const halfW = width / 2;
  const halfD = depth / 2;
  const majorPts = [];
  const minorPts = [];

  for (let x = -halfW; x <= halfW + 0.001; x += 0.5) {
    const isMajor = Math.abs(Math.round(x) - x) < 0.01;
    (isMajor ? majorPts : minorPts).push(x, isMajor ? 0.012 : 0.009, -halfD, x, isMajor ? 0.012 : 0.009, halfD);
  }
  for (let z = -halfD; z <= halfD + 0.001; z += 0.5) {
    const isMajor = Math.abs(Math.round(z) - z) < 0.01;
    (isMajor ? majorPts : minorPts).push(-halfW, isMajor ? 0.012 : 0.009, z, halfW, isMajor ? 0.012 : 0.009, z);
  }

  const majorMat = new THREE.LineBasicMaterial({
    color: floor === 'marble-light' ? 0x475569 : accentColor.clone().lerp(new THREE.Color(0xcbd5e1), 0.55),
    transparent: true,
    opacity: floor === 'marble-light' ? 0.34 : 0.28,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const majorGeo = new THREE.BufferGeometry();
  majorGeo.setAttribute('position', new THREE.Float32BufferAttribute(majorPts, 3));
  const majorLines = new THREE.LineSegments(majorGeo, majorMat);
  majorLines.name = 'MajorGridLines';
  gridGroup.add(majorLines);

  if (minorPts.length > 0) {
    const minorMat = new THREE.LineBasicMaterial({
      color: floor === 'marble-light' ? 0x64748b : 0x94a3b8,
      transparent: true,
      opacity: floor === 'marble-light' ? 0.14 : 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const minorGeo = new THREE.BufferGeometry();
    minorGeo.setAttribute('position', new THREE.Float32BufferAttribute(minorPts, 3));
    const minorLines = new THREE.LineSegments(minorGeo, minorMat);
    minorLines.name = 'MinorGridLines';
    gridGroup.add(minorLines);
  }
  group.add(gridGroup);

  // 4. Walls (North -Z & West -X full height; South +Z & East +X cutaway curb or full height)
  const wallTex = createWallTexture(wall, anisotropy);
  const wallFinish = WALL_FINISHES.find((w) => w.id === wall) || WALL_FINISHES[0];
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: wall === 'ivory' ? 0.78 : 0.64,
    metalness: 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wallFinish.trim),
    roughness: 0.4,
    metalness: 0.32,
  });
  const ledStripMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.1,
  });

  // North back wall (-Z)
  addPart(group, new THREE.BoxGeometry(width + wallThick * 2, height, wallThick), wallMat, 0, height / 2, -halfD - wallThick / 2, { cast: false });
  // North baseboard + LED ceiling cornice
  addPart(group, new THREE.BoxGeometry(width, 0.12, 0.04), trimMat, 0, 0.06, -halfD + 0.02, { cast: false });
  addPart(group, new THREE.BoxGeometry(width - 0.2, 0.055, 0.05), ledStripMat, 0, height - 0.14, -halfD + 0.025, { cast: false, receive: false });

  // West left wall (-X)
  addPart(group, new THREE.BoxGeometry(wallThick, height, depth), wallMat, -halfW - wallThick / 2, height / 2, 0, { cast: false });
  addPart(group, new THREE.BoxGeometry(0.04, 0.12, depth), trimMat, -halfW + 0.02, 0.06, 0, { cast: false });
  addPart(group, new THREE.BoxGeometry(0.05, 0.055, depth - 0.2), ledStripMat, -halfW + 0.025, height - 0.14, 0, { cast: false, receive: false });

  const frontWallH = cutawayWalls ? 0.22 : height;
  const frontMat = cutawayWalls ? trimMat : wallMat;

  // South front wall (+Z)
  addPart(group, new THREE.BoxGeometry(width + wallThick * 2, frontWallH, wallThick), frontMat, 0, frontWallH / 2, halfD + wallThick / 2, { cast: false });
  // East right wall (+X)
  addPart(group, new THREE.BoxGeometry(wallThick, frontWallH, depth), frontMat, halfW + wallThick / 2, frontWallH / 2, 0, { cast: false });

  if (!cutawayWalls) {
    addPart(group, new THREE.BoxGeometry(width - 0.2, 0.055, 0.05), ledStripMat, 0, height - 0.14, halfD - 0.025, { cast: false, receive: false });
    addPart(group, new THREE.BoxGeometry(0.05, 0.055, depth - 0.2), ledStripMat, halfW - 0.025, height - 0.14, 0, { cast: false, receive: false });
  }

  return { group, floorMesh, gridGroup };
}

/**
 * Builds a detailed composite 5-10 part 3D model for any catalog item,
 * pivoted cleanly at bottom-center (y = 0) with contact shadow & picking proxy.
 */
export function buildFurnitureModel(
  item,
  { accentHex = '#7c3aed', isOccupied = false, timerState = null, anisotropy = 4 } = {}
) {
  const spec = getCatalogItem(item.type);
  const group = new THREE.Group();
  group.name = `Item-${item.id}`;
  group.userData.itemId = item.id;
  group.userData.itemType = item.type;

  if (!spec) return group;

  const accent = new THREE.Color(accentHex);
  const statusColor = isOccupied ? new THREE.Color('#22c55e') : accent;

  // Shared calibrated PBR materials (varying roughness by >= 0.25 between adjacent parts)
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e2433, roughness: 0.28, metalness: 0.78 });
  const brushedSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.88 });
  const matteDesk = new THREE.MeshStandardMaterial({ color: 0x151924, roughness: 0.62, metalness: 0.12 });
  const warmWood = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.68, metalness: 0.05 });
  const leatherDark = new THREE.MeshStandardMaterial({ color: 0x1f2536, roughness: 0.78, metalness: 0.05 });
  const fabricSofa = new THREE.MeshStandardMaterial({ color: 0x2c3448, roughness: 0.92, metalness: 0.02 });
  const psWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.28, metalness: 0.08 });
  const glowAccent = new THREE.MeshStandardMaterial({
    color: statusColor,
    emissive: statusColor,
    emissiveIntensity: isOccupied ? 1.85 : 1.15,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Soft radial contact shadow plane at y = 0.008 (prevents floating appearance)
  const shadowMat = new THREE.MeshBasicMaterial({
    map: createContactShadowTexture(),
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * 1.16, spec.depth * 1.16),
    shadowMat
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.008;
  shadowPlane.name = 'ContactShadow';
  group.add(shadowPlane);

  // Build composite 3D geometry per item type (all bottom-center at y = 0)
  switch (item.type) {
    case 'pc-station': {
      // 1. Tabletop
      addPart(group, new THREE.BoxGeometry(1.36, 0.055, 0.76), matteDesk, 0, 0.74, 0);
      // 2-3. Steel legs + crossbar
      addPart(group, new THREE.BoxGeometry(0.06, 0.72, 0.68), darkMetal, -0.6, 0.36, 0);
      addPart(group, new THREE.BoxGeometry(0.06, 0.72, 0.68), darkMetal, 0.6, 0.36, 0);
      addPart(group, new THREE.BoxGeometry(1.16, 0.05, 0.05), darkMetal, 0, 0.18, -0.26);
      // 4. Rear RGB accent strip
      addPart(group, new THREE.BoxGeometry(1.3, 0.025, 0.025), glowAccent, 0, 0.74, -0.385, { cast: false });
      // 5. Monitor stand + ultrawide curved display
      addPart(group, new THREE.CylinderGeometry(0.03, 0.04, 0.24, 12), brushedSteel, -0.1, 0.88, -0.18);
      addPart(group, new THREE.BoxGeometry(0.28, 0.018, 0.18), darkMetal, -0.1, 0.775, -0.18);
      const monFrame = addPart(group, new THREE.BoxGeometry(0.76, 0.38, 0.035), darkMetal, -0.1, 1.07, -0.16);
      const screenMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('pc', accentHex, anisotropy),
        emissive: new THREE.Color(accentHex),
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.1,
      });
      addPart(group, new THREE.PlaneGeometry(0.71, 0.33), screenMat, -0.1, 1.07, -0.141, { cast: false });
      monFrame.castShadow = true;
      // 6. Glass PC Tower on right side with glowing internal fan strip
      addPart(group, new THREE.BoxGeometry(0.24, 0.48, 0.44), darkMetal, 0.47, 1.01, -0.06);
      addPart(group, new THREE.BoxGeometry(0.02, 0.36, 0.32), glowAccent, 0.348, 1.01, -0.06, { cast: false });
      // 7. Desk mat + mechanical keyboard + mouse
      addPart(group, new THREE.BoxGeometry(0.74, 0.008, 0.3), leatherDark, -0.1, 0.772, 0.15, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.38, 0.022, 0.14), darkMetal, -0.17, 0.786, 0.15);
      addPart(group, new THREE.BoxGeometry(0.36, 0.006, 0.12), glowAccent, -0.17, 0.799, 0.15, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.065, 0.026, 0.11), brushedSteel, 0.14, 0.788, 0.15);
      break;
    }

    case 'ps5-lounge': {
      // 1. Low media cabinet
      addPart(group, new THREE.BoxGeometry(1.74, 0.42, 0.52), matteDesk, 0, 0.25, -0.05);
      // 2. Cabinet legs
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.42), brushedSteel, -0.78, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.42), brushedSteel, 0.78, 0.03, -0.05);
      // 3. Wood accent front drawer strip + LED bias strip
      addPart(group, new THREE.BoxGeometry(1.62, 0.18, 0.03), warmWood, 0, 0.24, 0.22);
      addPart(group, new THREE.BoxGeometry(1.66, 0.03, 0.03), glowAccent, 0, 0.47, -0.3, { cast: false });
      // 4. 55-inch Slim TV panel + stand
      addPart(group, new THREE.BoxGeometry(0.18, 0.42, 0.06), darkMetal, 0, 0.68, -0.14);
      addPart(group, new THREE.BoxGeometry(1.42, 0.82, 0.045), darkMetal, 0, 1.12, -0.12);
      const tvScreenMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('tv', accentHex, anisotropy),
        emissive: new THREE.Color(accentHex),
        emissiveIntensity: 0.32,
        roughness: 0.12,
        metalness: 0.15,
      });
      addPart(group, new THREE.PlaneGeometry(1.36, 0.76), tvScreenMat, 0, 1.12, -0.095, { cast: false });
      // 5. Iconic white/black PS5 tower on right
      addPart(group, new THREE.BoxGeometry(0.1, 0.38, 0.24), darkMetal, 0.66, 0.65, 0.04);
      addPart(group, new THREE.BoxGeometry(0.024, 0.4, 0.26), psWhite, 0.6, 0.66, 0.04);
      addPart(group, new THREE.BoxGeometry(0.024, 0.4, 0.26), psWhite, 0.72, 0.66, 0.04);
      addPart(group, new THREE.BoxGeometry(0.015, 0.34, 0.015), glowAccent, 0.66, 0.66, 0.165, { cast: false });
      // 6. DualSense controllers on dock
      addPart(group, new THREE.BoxGeometry(0.15, 0.045, 0.09), psWhite, -0.58, 0.49, 0.08, { ry: 0.2 });
      addPart(group, new THREE.BoxGeometry(0.15, 0.045, 0.09), psWhite, -0.36, 0.49, 0.09, { ry: -0.2 });
      break;
    }

    case 'ps4-station': {
      // 1. Sleek low console stand
      addPart(group, new THREE.BoxGeometry(1.44, 0.4, 0.5), matteDesk, 0, 0.24, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.4), darkMetal, -0.64, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.4), darkMetal, 0.64, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(1.34, 0.025, 0.025), glowAccent, 0, 0.45, -0.28, { cast: false });
      // 2. 43-inch Display
      addPart(group, new THREE.BoxGeometry(0.16, 0.36, 0.05), darkMetal, 0, 0.62, -0.12);
      addPart(group, new THREE.BoxGeometry(1.18, 0.68, 0.04), darkMetal, 0, 1.02, -0.1);
      const screenMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('tv', accentHex, anisotropy),
        emissive: new THREE.Color(accentHex),
        emissiveIntensity: 0.28,
        roughness: 0.14,
        metalness: 0.12,
      });
      addPart(group, new THREE.PlaneGeometry(1.12, 0.62), screenMat, 0, 1.02, -0.078, { cast: false });
      // 3. PS4 Pro triple-tier matte black chassis + blue/accent light bar
      addPart(group, new THREE.BoxGeometry(0.32, 0.065, 0.32), leatherDark, 0.42, 0.475, 0.04);
      addPart(group, new THREE.BoxGeometry(0.28, 0.014, 0.015), glowAccent, 0.42, 0.48, 0.205, { cast: false });
      // 4. Controllers
      addPart(group, new THREE.BoxGeometry(0.14, 0.04, 0.085), darkMetal, -0.42, 0.46, 0.08);
      break;
    }

    case 'vr-pod': {
      // 1. Octagonal raised VR arena platform
      addPart(group, new THREE.CylinderGeometry(0.98, 1.04, 0.12, 8), matteDesk, 0, 0.06, 0);
      addPart(group, new THREE.TorusGeometry(0.99, 0.025, 10, 8), glowAccent, 0, 0.12, 0, { rx: Math.PI / 2, rz: Math.PI / 8, cast: false });
      // 2-4. Three vertical sensor totem pillars
      const angles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.5];
      angles.forEach((a) => {
        const px = Math.cos(a) * 0.88;
        const pz = Math.sin(a) * 0.88;
        addPart(group, new THREE.BoxGeometry(0.11, 1.92, 0.11), darkMetal, px, 1.04, pz);
        addPart(group, new THREE.BoxGeometry(0.04, 1.65, 0.04), glowAccent, px * 0.94, 1.06, pz * 0.94, { cast: false });
      });
      // 5. Overhead halo ring
      addPart(group, new THREE.TorusGeometry(0.88, 0.035, 10, 24), brushedSteel, 0, 2.02, 0, { rx: Math.PI / 2 });
      // 6. VR headset pedestal stand
      addPart(group, new THREE.CylinderGeometry(0.03, 0.08, 1.05, 12), brushedSteel, 0, 0.62, -0.68);
      addPart(group, new THREE.BoxGeometry(0.2, 0.11, 0.12), psWhite, 0, 1.18, -0.66);
      break;
    }

    case 'gaming-chair': {
      // 1. 5-star caster base
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        addPart(group, new THREE.BoxGeometry(0.05, 0.045, 0.32), brushedSteel, Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14, { ry: a });
      }
      // 2. Pneumatic center cylinder
      addPart(group, new THREE.CylinderGeometry(0.035, 0.045, 0.36, 12), darkMetal, 0, 0.25, 0);
      // 3. Bucket seat cushion
      addPart(group, new THREE.BoxGeometry(0.52, 0.09, 0.5), leatherDark, 0, 0.45, 0.02);
      // 4. Sculpted high racing backrest + side bolsters
      addPart(group, new THREE.BoxGeometry(0.46, 0.78, 0.1), leatherDark, 0, 0.86, -0.2, { rx: -0.1 });
      addPart(group, new THREE.BoxGeometry(0.07, 0.62, 0.12), glowAccent, -0.24, 0.84, -0.16, { rx: -0.1, cast: false });
      addPart(group, new THREE.BoxGeometry(0.07, 0.62, 0.12), glowAccent, 0.24, 0.84, -0.16, { rx: -0.1, cast: false });
      // 5. Headrest pillow
      addPart(group, new THREE.BoxGeometry(0.26, 0.12, 0.08), fabricSofa, 0, 1.14, -0.15);
      // 6-7. Dual 4D armrests
      addPart(group, new THREE.BoxGeometry(0.07, 0.22, 0.05), darkMetal, -0.27, 0.56, -0.02);
      addPart(group, new THREE.BoxGeometry(0.07, 0.22, 0.05), darkMetal, 0.27, 0.56, -0.02);
      addPart(group, new THREE.BoxGeometry(0.09, 0.035, 0.28), darkMetal, -0.27, 0.67, 0.04);
      addPart(group, new THREE.BoxGeometry(0.09, 0.035, 0.28), darkMetal, 0.27, 0.67, 0.04);
      break;
    }

    case 'lounge-sofa': {
      // 1. Metal base frame + 4 legs
      addPart(group, new THREE.BoxGeometry(1.76, 0.1, 0.82), darkMetal, 0, 0.18, 0);
      [[-0.82, -0.34], [0.82, -0.34], [-0.82, 0.34], [0.82, 0.34]].forEach(([lx, lz]) => {
        addPart(group, new THREE.CylinderGeometry(0.025, 0.02, 0.14, 10), brushedSteel, lx, 0.07, lz);
      });
      // 2-3. Deep dual plush seat cushions
      addPart(group, new THREE.BoxGeometry(0.76, 0.18, 0.66), fabricSofa, -0.4, 0.32, 0.06);
      addPart(group, new THREE.BoxGeometry(0.76, 0.18, 0.66), fabricSofa, 0.4, 0.32, 0.06);
      // 4. Full-width backrest
      addPart(group, new THREE.BoxGeometry(1.56, 0.54, 0.2), fabricSofa, 0, 0.58, -0.28, { rx: -0.08 });
      // 5-6. Wide padded armrests
      addPart(group, new THREE.BoxGeometry(0.18, 0.44, 0.84), fabricSofa, -0.84, 0.42, 0);
      addPart(group, new THREE.BoxGeometry(0.18, 0.44, 0.84), fabricSofa, 0.84, 0.42, 0);
      // 7. Accent throw cushion
      addPart(group, new THREE.BoxGeometry(0.32, 0.26, 0.11), glowAccent, -0.58, 0.53, -0.1, { ry: 0.28, rx: -0.12, cast: false });
      break;
    }

    case 'coffee-table': {
      // 1. Smoked tabletop
      addPart(group, new THREE.BoxGeometry(1.1, 0.045, 0.6), warmWood, 0, 0.44, 0);
      // 2. Lower slatted shelf
      addPart(group, new THREE.BoxGeometry(0.96, 0.028, 0.46), matteDesk, 0, 0.18, 0);
      // 3-6. Four tapered dark metal legs
      [[-0.48, -0.24], [0.48, -0.24], [-0.48, 0.24], [0.48, 0.24]].forEach(([lx, lz]) => {
        addPart(group, new THREE.CylinderGeometry(0.024, 0.018, 0.42, 10), darkMetal, lx, 0.21, lz);
      });
      break;
    }

    case 'empty-desk': {
      addPart(group, new THREE.BoxGeometry(1.36, 0.055, 0.76), matteDesk, 0, 0.73, 0);
      addPart(group, new THREE.BoxGeometry(0.06, 0.7, 0.66), darkMetal, -0.6, 0.35, 0);
      addPart(group, new THREE.BoxGeometry(0.06, 0.7, 0.66), darkMetal, 0.6, 0.35, 0);
      addPart(group, new THREE.BoxGeometry(1.16, 0.05, 0.05), darkMetal, 0, 0.2, -0.24);
      addPart(group, new THREE.BoxGeometry(1.3, 0.022, 0.022), glowAccent, 0, 0.73, -0.38, { cast: false });
      break;
    }

    case 'billiard-table': {
      const feltMat = new THREE.MeshStandardMaterial({ color: 0x0f766e, roughness: 0.92, metalness: 0.02 });
      // 1. Heavy apron cabinet + wood frame rails
      addPart(group, new THREE.BoxGeometry(2.44, 0.2, 1.32), warmWood, 0, 0.7, 0);
      // 2. Tournament green/teal felt bed
      addPart(group, new THREE.BoxGeometry(2.24, 0.03, 1.12), feltMat, 0, 0.805, 0);
      // 3-6. Raised cushioned wooden rails
      addPart(group, new THREE.BoxGeometry(2.54, 0.075, 0.12), warmWood, 0, 0.82, -0.65);
      addPart(group, new THREE.BoxGeometry(2.54, 0.075, 0.12), warmWood, 0, 0.82, 0.65);
      addPart(group, new THREE.BoxGeometry(0.12, 0.075, 1.4), warmWood, -1.22, 0.82, 0);
      addPart(group, new THREE.BoxGeometry(0.12, 0.075, 1.4), warmWood, 1.22, 0.82, 0);
      // 7-10. Four sturdy legs + brass feet
      [[-1.02, -0.5], [1.02, -0.5], [-1.02, 0.5], [1.02, 0.5]].forEach(([lx, lz]) => {
        addPart(group, new THREE.BoxGeometry(0.14, 0.62, 0.14), darkMetal, lx, 0.31, lz);
      });
      // 11. Cue ball + racked billiard balls + resting cue stick
      const whiteBall = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.12, metalness: 0.1 });
      const redBall = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.12, metalness: 0.1 });
      const yellowBall = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.12, metalness: 0.1 });
      const ballGeo = new THREE.SphereGeometry(0.032, 12, 12);
      addPart(group, ballGeo, whiteBall, -0.65, 0.85, 0);
      addPart(group, ballGeo, redBall, 0.45, 0.85, 0);
      addPart(group, ballGeo, yellowBall, 0.52, 0.85, 0.04);
      addPart(group, ballGeo, redBall, 0.52, 0.85, -0.04);
      addPart(group, new THREE.CylinderGeometry(0.01, 0.016, 1.35, 8), warmWood, -0.35, 0.87, 0.66, { rz: Math.PI / 2 });
      break;
    }

    case 'foosball-table': {
      // 1. Cabinet box
      addPart(group, new THREE.BoxGeometry(1.42, 0.28, 0.78), darkMetal, 0, 0.74, 0);
      // 2. Printed football pitch bed
      const pitchMat = new THREE.MeshStandardMaterial({
        map: createFoosballPitchTexture(anisotropy),
        roughness: 0.55,
        metalness: 0.05,
      });
      addPart(group, new THREE.PlaneGeometry(1.3, 0.68), pitchMat, 0, 0.885, 0, { rx: -Math.PI / 2, cast: false });
      // 3-6. Four angled sturdy legs
      [[-0.58, -0.32], [0.58, -0.32], [-0.58, 0.32], [0.58, 0.32]].forEach(([lx, lz]) => {
        addPart(group, new THREE.BoxGeometry(0.09, 0.64, 0.09), warmWood, lx, 0.32, lz);
      });
      // 7. Chrome player rods with miniature figurines
      const teamA = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.35, metalness: 0.15 });
      const teamB = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.35, metalness: 0.15 });
      for (let i = 0; i < 6; i++) {
        const rxPos = -0.5 + i * 0.2;
        addPart(group, new THREE.CylinderGeometry(0.01, 0.01, 1.06, 8), brushedSteel, rxPos, 0.86, 0, { rx: Math.PI / 2 });
        const mat = i % 2 === 0 ? teamA : teamB;
        addPart(group, new THREE.BoxGeometry(0.035, 0.09, 0.035), mat, rxPos, 0.86, -0.18);
        addPart(group, new THREE.BoxGeometry(0.035, 0.09, 0.035), mat, rxPos, 0.86, 0.18);
      }
      break;
    }

    case 'reception-counter': {
      // 1. Main slatted reception counter body
      addPart(group, new THREE.BoxGeometry(2.42, 0.96, 0.72), matteDesk, 0, 0.48, 0);
      // 2. Raised front reception ledge
      addPart(group, new THREE.BoxGeometry(2.46, 0.06, 0.34), warmWood, 0, 1.02, -0.2);
      // 3. Lower front accent LED strip
      addPart(group, new THREE.BoxGeometry(2.3, 0.04, 0.04), glowAccent, 0, 0.12, -0.37, { cast: false });
      addPart(group, new THREE.BoxGeometry(2.3, 0.035, 0.035), glowAccent, 0, 0.94, -0.37, { cast: false });
      // 4. POS management monitor on counter
      addPart(group, new THREE.BoxGeometry(0.46, 0.3, 0.03), darkMetal, -0.45, 1.15, 0.05, { ry: Math.PI });
      addPart(group, new THREE.CylinderGeometry(0.025, 0.035, 0.14, 10), brushedSteel, -0.45, 1.02, 0.05);
      // 5. Glass buffet display case on right side
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.32,
        roughness: 0.12,
        metalness: 0.2,
      });
      addPart(group, new THREE.BoxGeometry(0.76, 0.38, 0.44), glassMat, 0.68, 1.15, 0.02, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.64, 0.03, 0.34), brushedSteel, 0.68, 1.12, 0.02);
      break;
    }

    case 'plant-pot': {
      // 1. Fluted architectural ceramic planter
      const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.12 });
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.95, metalness: 0 });
      const leafDark = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.62, metalness: 0.02 });
      const leafLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.56, metalness: 0.02 });
      addPart(group, new THREE.CylinderGeometry(0.24, 0.19, 0.44, 14), potMat, 0, 0.22, 0);
      addPart(group, new THREE.CylinderGeometry(0.21, 0.21, 0.04, 12), soilMat, 0, 0.43, 0);
      // 2-7. Multi-blade sculptural architectural plant foliage
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6;
        const h = 0.62 + (i % 2) * 0.22;
        addPart(
          group,
          new THREE.ConeGeometry(0.095, h, 5),
          i % 2 === 0 ? leafDark : leafLight,
          Math.cos(a) * 0.09,
          0.44 + h / 2,
          Math.sin(a) * 0.09,
          { rx: Math.sin(a) * 0.24, rz: -Math.cos(a) * 0.24 }
        );
      }
      break;
    }

    case 'neon-divider': {
      // 1. Brushed dark aluminum frame
      addPart(group, new THREE.BoxGeometry(1.76, 0.07, 0.18), darkMetal, 0, 0.035, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.84, 0.09), darkMetal, -0.85, 0.94, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.84, 0.09), darkMetal, 0.85, 0.94, 0);
      addPart(group, new THREE.BoxGeometry(1.76, 0.06, 0.09), darkMetal, 0, 1.85, 0);
      // 2. Frosted translucent partition glass
      const frostMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.26,
        roughness: 0.35,
        metalness: 0.1,
      });
      addPart(group, new THREE.BoxGeometry(1.62, 1.72, 0.025), frostMat, 0, 0.94, 0, { cast: false });
      // 3. Accent glowing edge strip
      addPart(group, new THREE.BoxGeometry(1.62, 0.03, 0.04), glowAccent, 0, 1.78, 0, { cast: false });
      break;
    }

    default: {
      addPart(group, new THREE.BoxGeometry(spec.width, spec.height, spec.depth), matteDesk, 0, spec.height / 2, 0);
    }
  }

  // Floating station number + compact live mini-timer HUD above every 3D station
  if (spec.isStation && item.tableNumber) {
    const resolvedTimer =
      timerState ||
      (isOccupied
        ? { text: 'فعال', status: 'running', isOccupied: true }
        : { text: 'آزاد', status: 'idle', isOccupied: false });
    const sprite = createStationTimerSprite(item.tableNumber, resolvedTimer, accentHex, anisotropy);
    sprite.position.set(0, spec.height + 0.44, 0);
    sprite.scale.set(1.22, 0.355, 1);
    group.add(sprite);
  }

  // Invisible simplified picking/raycast proxy box (fast & accurate clicks!)
  const pickProxy = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width, Math.max(0.55, spec.height), spec.depth),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  pickProxy.position.y = Math.max(0.55, spec.height) / 2;
  pickProxy.userData.pickItemId = item.id;
  pickProxy.name = 'PickProxy';
  group.add(pickProxy);

  group.position.set(item.x || 0, 0, item.z || 0);
  group.rotation.y = THREE.MathUtils.degToRad(item.rotation || 0);
  return group;
}

/**
 * Builds a translucent ghost preview box + footprint outline for placement mode.
 */
export function buildPlacementGhost(type) {
  const spec = getCatalogItem(type);
  const group = new THREE.Group();
  if (!spec) return group;

  const boxMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const box = new THREE.Mesh(new THREE.BoxGeometry(spec.width, spec.height, spec.depth), boxMat);
  box.position.y = spec.height / 2;
  box.name = 'GhostBox';
  group.add(box);

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(spec.width, spec.height, spec.depth)),
    new THREE.LineBasicMaterial({ color: 0x4ade80 })
  );
  edges.position.y = spec.height / 2;
  edges.name = 'GhostEdges';
  group.add(edges);

  // Ground grid highlight pad so the user sees exact snapped cells on the 3D grid
  const padMat = new THREE.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(spec.width + 0.12, spec.depth + 0.12), padMat);
  pad.rotation.x = -Math.PI / 2;
  pad.position.y = 0.018;
  pad.name = 'GhostPad';
  group.add(pad);

  // Direction indicator arrow on front (+Z) so user sees which way desk/sofa faces
  const arrow = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.3, 4),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
  );
  arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 0.14, spec.depth / 2 + 0.18);
  group.add(arrow);

  return group;
}

/**
 * Builds an accent selection floor ring that wraps neatly around the selected item.
 */
export function buildSelectionRing(accentHex = '#7c3aed') {
  const group = new THREE.Group();
  group.visible = false;

  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(accentHex),
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

  const frame = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ringMat);
  frame.rotation.x = -Math.PI / 2;
  frame.position.y = 0.015;
  frame.name = 'SelFill';
  group.add(frame);

  const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.02, 1));
  const border = new THREE.LineSegments(
    borderGeo,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  border.position.y = 0.02;
  border.name = 'SelBorder';
  group.add(border);

  return group;
}

export function disposeObject3D(root) {
  if (!root) return;
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m) => {
        if (m.userData?.ownsTexture && m.map) {
          m.map.dispose();
        }
        m.dispose();
      });
    }
  });
}
