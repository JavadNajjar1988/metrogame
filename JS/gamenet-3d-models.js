/**
 * Procedural PBR CanvasTextures & Composite 5-12 Part Three.js Models
 * for the Game District 3D Game Center Builder.
 * Supports 9 procedural wallpapers, 6 floor finishes, 4 billiard/snooker models
 * with live felt/rail customization, and rich architectural decorations.
 * Zero external asset dependencies (zero 404s).
 */
import * as THREE from 'three';
import {
  FLOOR_FINISHES,
  WALL_FINISHES,
  getCatalogItem,
  getBilliardFeltVariant,
  resolveItemTintHex,
  resolveLedColorHex,
} from './gamenet-3d-engine.mjs?v=20261126-8';

const textureCache = new Map();

function makeCanvasTexture(
  cacheKey,
  width,
  height,
  drawFn,
  { repeatX = 1, repeatY = 1, anisotropy = 4, srgb = true } = {}
) {
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
        ctx.fillStyle = '#181c2c';
        ctx.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 16) {
          for (let x = 0; x < w; x += 16) {
            ctx.fillStyle = (x + y) % 32 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.06)';
            ctx.fillRect(x, y, 8, 8);
          }
        }
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      } else if (floorId === 'epoxy-dark') {
        // Glossy metallic-flecked dark esports epoxy floor
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#0f131d');
        grad.addColorStop(0.5, '#171f30');
        grad.addColorStop(1, '#0d111a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 160; i++) {
          ctx.fillStyle = i % 3 === 0 ? 'rgba(148, 163, 184, 0.09)' : 'rgba(56, 189, 248, 0.05)';
          ctx.fillRect((i * 83) % w, (i * 137) % h, 5, 3);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      } else if (floorId === 'check-lounge') {
        // Architectural slate & charcoal diagonal/checkered club tiles
        const cells = 4;
        const step = w / cells;
        for (let y = 0; y < cells; y++) {
          for (let x = 0; x < cells; x++) {
            const isAlt = (x + y) % 2 === 0;
            ctx.fillStyle = isAlt ? '#23293a' : '#171c29';
            ctx.fillRect(x * step + 2, y * step + 2, step - 4, step - 4);
            ctx.strokeStyle = 'rgba(255,255,255,0.045)';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x * step + 6, y * step + 6, step - 12, step - 12);
          }
        }
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

function drawHexagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function createWallTexture(wallId, accentHex = '#7c3aed', anisotropy = 4) {
  const finish = WALL_FINISHES.find((w) => w.id === wallId) || WALL_FINISHES[0];
  const accentTag = wallId === 'hex-cyber' || wallId === 'neon-grid' ? accentHex : 'base';

  return makeCanvasTexture(
    `wall-${wallId}-${accentTag}`,
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = finish.color;
      ctx.fillRect(0, 0, w, h);

      if (wallId === 'charcoal' || wallId === 'midnight') {
        const slats = 16;
        const sw = w / slats;
        for (let i = 0; i < slats; i++) {
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.16)';
          ctx.fillRect(i * sw, 0, sw * 0.72, h);
          ctx.fillStyle = 'rgba(0,0,0,0.38)';
          ctx.fillRect(i * sw + sw * 0.72, 0, sw * 0.28, h);
        }
      } else if (wallId === 'hex-cyber') {
        // Dark carbon 3D hexagon gaming wallpaper with subtle accent edge glint
        ctx.fillStyle = '#111624';
        ctx.fillRect(0, 0, w, h);
        const r = 42;
        const dx = r * Math.sqrt(3);
        const dy = r * 1.5;
        let idx = 0;
        for (let row = -1; row * dy < h + r; row++) {
          for (let col = -1; col * dx < w + r; col++) {
            const cx = col * dx + (row % 2 === 0 ? 0 : dx / 2);
            const cy = row * dy;
            drawHexagon(ctx, cx, cy, r - 3);
            const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
            grad.addColorStop(0, '#1d263d');
            grad.addColorStop(1, '#121828');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.lineWidth = idx % 7 === 0 ? 2.4 : 1.4;
            ctx.strokeStyle = idx % 7 === 0 ? accentHex : 'rgba(148, 163, 184, 0.14)';
            ctx.globalAlpha = idx % 7 === 0 ? 0.52 : 1;
            ctx.stroke();
            ctx.globalAlpha = 1;
            idx += 1;
          }
        }
      } else if (wallId === 'brick-loft') {
        // Industrial dark red-brown loft brick wallpaper
        ctx.fillStyle = '#1d1312';
        ctx.fillRect(0, 0, w, h);
        const rows = 12;
        const cols = 5;
        const bh = h / rows;
        const bw = w / cols;
        for (let r = 0; r < rows; r++) {
          const off = (r % 2) * (bw / 2);
          for (let c = -1; c <= cols; c++) {
            const bx = c * bw + off;
            const by = r * bh;
            const tone = ((r * 7 + c * 11) % 5) * 6;
            ctx.fillStyle = `rgb(${78 + tone}, ${44 + Math.round(tone * 0.5)}, ${38 + Math.round(tone * 0.4)})`;
            ctx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fillRect(bx + 3, by + 3, bw - 6, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.18)';
            ctx.fillRect(bx + 3, by + bh - 7, bw - 6, 4);
          }
        }
      } else if (wallId === 'wood-slat') {
        // Warm architectural walnut vertical acoustic wood slats over black felt
        ctx.fillStyle = '#141110';
        ctx.fillRect(0, 0, w, h);
        const slats = 14;
        const sw = w / slats;
        for (let i = 0; i < slats; i++) {
          const x = i * sw;
          const tone = (i % 3) * 8;
          const grad = ctx.createLinearGradient(x, 0, x + sw * 0.7, 0);
          grad.addColorStop(0, `rgb(${112 + tone}, ${74 + tone}, ${46 + Math.round(tone * 0.6)})`);
          grad.addColorStop(1, `rgb(${84 + tone}, ${54 + tone}, ${34 + Math.round(tone * 0.5)})`);
          ctx.fillStyle = grad;
          ctx.fillRect(x + 2, 0, sw * 0.68, h);
          ctx.strokeStyle = 'rgba(28, 16, 8, 0.16)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + sw * 0.3, 0);
          ctx.lineTo(x + sw * 0.36, h);
          ctx.stroke();
        }
      } else if (wallId === 'geo-gold') {
        // Luxury Art-Deco Obsidian & Brushed Gold Geometric Wallpaper
        ctx.fillStyle = '#131620';
        ctx.fillRect(0, 0, w, h);
        const step = 128;
        ctx.strokeStyle = 'rgba(212, 168, 83, 0.38)';
        ctx.lineWidth = 2;
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            ctx.beginPath();
            ctx.moveTo(x + step / 2, y);
            ctx.lineTo(x + step, y + step / 2);
            ctx.lineTo(x + step / 2, y + step);
            ctx.lineTo(x, y + step / 2);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeStyle = 'rgba(212, 168, 83, 0.16)';
            ctx.beginPath();
            ctx.moveTo(x + step / 2, y + 18);
            ctx.lineTo(x + step - 18, y + step / 2);
            ctx.lineTo(x + step / 2, y + step - 18);
            ctx.lineTo(x + 18, y + step / 2);
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = 'rgba(212, 168, 83, 0.38)';
          }
        }
      } else if (wallId === 'neon-grid') {
        // Cyber architectural grid wallpaper with glowing accent nodes
        ctx.fillStyle = '#0d1323';
        ctx.fillRect(0, 0, w, h);
        const step = 64;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.11)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= w; i += step) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, h);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(w, i);
          ctx.stroke();
        }
        // Horizontal neon accent racing bands
        ctx.strokeStyle = accentHex;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.25);
        ctx.lineTo(w, h * 0.25);
        ctx.moveTo(0, h * 0.75);
        ctx.lineTo(w, h * 0.75);
        ctx.stroke();
        ctx.globalAlpha = 1;
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

      ctx.fillStyle = accentHex;
      ctx.globalAlpha = 0.26;
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.45, h * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (variant === 'tv') {
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
      } else if (variant === 'tournament') {
        // Esports tournament bracket broadcast graphic
        ctx.strokeStyle = accentHex;
        ctx.lineWidth = 4;
        ctx.strokeRect(18, 18, w - 36, h - 36);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        // Left bracket nodes
        ctx.fillRect(38, 48, 120, 34);
        ctx.fillRect(38, 98, 120, 34);
        ctx.fillRect(38, 152, 120, 34);
        // Right bracket nodes
        ctx.fillRect(w - 158, 48, 120, 34);
        ctx.fillRect(w - 158, 98, 120, 34);
        ctx.fillRect(w - 158, 152, 120, 34);
        // Center final match highlight
        ctx.fillStyle = accentHex;
        ctx.fillRect(w / 2 - 68, 86, 136, 72);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w / 2 - 44, 108, 88, 10);
        ctx.fillRect(w / 2 - 28, 130, 56, 8);
      } else if (variant === 'arcade') {
        // Retro pixel synthwave horizon
        ctx.fillStyle = '#170a2e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.44, 58, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        for (let y = h * 0.56; y < h; y += 18) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      } else {
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
 * Redraws a crisp, balanced floating overhead station badge + live mini-timer canvas in-place.
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
    idle: { border: 'rgba(148, 163, 184, 0.72)', badgeBg: '#1e293b', text: '#f1f5f9', dot: '#94a3b8' },
  }[status] || { border: accentHex, badgeBg: '#1e293b', text: '#f8fafc', dot: accentHex };

  drawRoundedRectPath(ctx, 8, 10, w - 16, h - 20, (h - 20) / 2);
  ctx.fillStyle = status === 'idle' ? 'rgba(10, 15, 28, 0.9)' : 'rgba(8, 13, 24, 0.96)';
  ctx.fill();
  ctx.lineWidth = status === 'idle' ? 3.5 : 4.5;
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  const circleR = 40;
  const circleX = w - 62;
  const circleY = h / 2;
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
  ctx.fillStyle = palette.badgeBg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = status === 'idle' ? accentHex : '#ffffff';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 42px Vazirmatn, Tahoma, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(displayNum, circleX, circleY + 2);

  ctx.beginPath();
  ctx.arc(38, h / 2, 8, 0, Math.PI * 2);
  ctx.fillStyle = palette.dot;
  ctx.fill();

  ctx.fillStyle = palette.text;
  const isClock = displayText.includes(':');
  const fontSize = isClock ? (displayText.length > 8 ? 36 : 42) : 38;
  ctx.font = `800 ${fontSize}px Vazirmatn, Tahoma, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textAreaLeft = 56;
  const textAreaRight = circleX - circleR - 10;
  const textCenterX = (textAreaLeft + textAreaRight) / 2;
  const maxTextW = Math.max(140, textAreaRight - textAreaLeft);
  ctx.fillText(displayText, textCenterX, h / 2 + 2, maxTextW);
}

function createStationTimerSprite(tableNumber, timerState, accentHex, anisotropy = 4) {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 128;
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

function addPart(
  group,
  geometry,
  material,
  x,
  y,
  z,
  { rx = 0, ry = 0, rz = 0, cast = true, receive = true } = {}
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  group.add(mesh);
  return mesh;
}

/**
 * Builds a grounded composite 3D architectural room shell with procedural wallpaper,
 * floor finish, plinth, dual-scale snapping grid, baseboards & customizable LED cornice.
 */
export function buildRoomShell(room, accentHex = '#7c3aed', anisotropy = 4) {
  const group = new THREE.Group();
  group.name = 'RoomShell';

  const { width, depth, height, floor, wall, ledColor, cutawayWalls } = room;
  const wallThick = 0.16;
  const resolvedLedHex = resolveLedColorHex(ledColor, accentHex);
  const accentColor = new THREE.Color(resolvedLedHex);

  // 1. Floor slab (top surface strictly at y = 0)
  const floorTex = createFloorTexture(floor, width, depth, anisotropy);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: floorTex,
    roughness:
      floor === 'epoxy-dark'
        ? 0.18
        : floor === 'marble-light'
          ? 0.25
          : floor === 'arena-carpet'
            ? 0.92
            : 0.48,
    metalness: floor === 'epoxy-dark' ? 0.22 : floor === 'slate-tile' ? 0.12 : 0.04,
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

  // 3. Crisp dual-scale 3D floor snapping grid
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

  // 4. Walls with procedural wallpaper finish
  const wallTex = createWallTexture(wall, resolvedLedHex, anisotropy);
  const wallFinish = WALL_FINISHES.find((w) => w.id === wall) || WALL_FINISHES[0];
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: wallTex,
    roughness: wall === 'ivory' || wall === 'brick-loft' ? 0.8 : wall === 'geo-gold' ? 0.45 : 0.62,
    metalness: wall === 'geo-gold' ? 0.22 : 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(wallFinish.trim),
    roughness: 0.38,
    metalness: wall === 'geo-gold' ? 0.65 : 0.32,
  });
  const ledStripMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.55,
    roughness: 0.2,
    metalness: 0.1,
  });

  // North back wall (-Z)
  addPart(group, new THREE.BoxGeometry(width + wallThick * 2, height, wallThick), wallMat, 0, height / 2, -halfD - wallThick / 2, { cast: false });
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
 * Helper to construct multi-style Billiard & Snooker tables with felt/rail variants,
 * brass/chrome pocket castings, balls, resting cue & optional overhead LED frame trim.
 */
function buildBilliardVariantParts(group, spec, item, { darkMetal, brushedSteel, glowAccent }) {
  const variant = getBilliardFeltVariant(item.variant, item.type);
  const isPro = item.type === 'billiard-pro';
  const isVip = item.type === 'billiard-vip';
  const isSnooker = item.type === 'billiard-snooker';

  const w = spec.width;
  const d = spec.depth;
  const feltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(variant.feltHex),
    roughness: 0.92,
    metalness: 0.02,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(variant.railHex),
    roughness: isPro ? 0.32 : 0.58,
    metalness: isPro ? 0.55 : isVip ? 0.2 : 0.08,
  });
  const pocketMetal = new THREE.MeshStandardMaterial({
    color: isVip || isSnooker ? 0xd4a853 : isPro ? 0xcbd5e1 : 0xb48a3e,
    roughness: 0.22,
    metalness: 0.88,
  });

  // 1. Heavy apron cabinet
  addPart(group, new THREE.BoxGeometry(w - 0.16, 0.22, d - 0.14), railMat, 0, 0.69, 0);
  // 2. Playing felt bed
  addPart(group, new THREE.BoxGeometry(w - 0.34, 0.03, d - 0.32), feltMat, 0, 0.805, 0);
  // 3-6. Raised cushioned rails
  const railH = 0.075;
  const railW = 0.12;
  addPart(group, new THREE.BoxGeometry(w - 0.06, railH, railW), railMat, 0, 0.82, -(d / 2 - railW / 2 - 0.03));
  addPart(group, new THREE.BoxGeometry(w - 0.06, railH, railW), railMat, 0, 0.82, d / 2 - railW / 2 - 0.03);
  addPart(group, new THREE.BoxGeometry(railW, railH, d - 0.08), railMat, -(w / 2 - railW / 2 - 0.03), 0.82, 0);
  addPart(group, new THREE.BoxGeometry(railW, railH, d - 0.08), railMat, w / 2 - railW / 2 - 0.03, 0.82, 0);

  // 7. 6 metallic pocket brackets (corners + side centers)
  const px = w / 2 - 0.09;
  const pz = d / 2 - 0.09;
  [
    [-px, -pz],
    [0, -pz - 0.01],
    [px, -pz],
    [-px, pz],
    [0, pz + 0.01],
    [px, pz],
  ].forEach(([cx, cz]) => {
    addPart(group, new THREE.CylinderGeometry(0.055, 0.055, 0.085, 10), pocketMetal, cx, 0.822, cz, { cast: false });
  });

  // 8. Legs (Snooker gets 6 heavy carved legs; Pro gets sleek angled A-frames; VIP gets gold-footed pillars)
  const legMat = isPro ? darkMetal : railMat;
  const legXs = isSnooker ? [-w * 0.4, 0, w * 0.4] : [-w * 0.39, w * 0.39];
  const legZs = [-d * 0.34, d * 0.34];
  legXs.forEach((lx) => {
    legZs.forEach((lz) => {
      addPart(group, new THREE.BoxGeometry(0.14, 0.58, 0.14), legMat, lx, 0.3, lz);
      addPart(group, new THREE.BoxGeometry(0.16, 0.06, 0.16), pocketMetal, lx, 0.03, lz);
    });
  });

  // 9. Pro Tournament LED under-apron strip OR VIP gold side molding
  if (isPro) {
    addPart(group, new THREE.BoxGeometry(w - 0.3, 0.025, 0.025), glowAccent, 0, 0.61, d / 2 - 0.06, { cast: false });
    addPart(group, new THREE.BoxGeometry(w - 0.3, 0.025, 0.025), glowAccent, 0, 0.61, -(d / 2 - 0.06), { cast: false });
  } else if (isVip) {
    addPart(group, new THREE.BoxGeometry(w - 0.24, 0.025, 0.02), pocketMetal, 0, 0.68, d / 2 - 0.065, { cast: false });
    addPart(group, new THREE.BoxGeometry(w - 0.24, 0.025, 0.02), pocketMetal, 0, 0.68, -(d / 2 - 0.065), { cast: false });
  }

  // 10. Cue ball + racked triangle of balls + cue stick resting on rail
  const whiteBall = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.12, metalness: 0.1 });
  const redBall = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.12, metalness: 0.1 });
  const yellowBall = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.12, metalness: 0.1 });
  const blackBall = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.15 });
  const ballGeo = new THREE.SphereGeometry(0.032, 12, 12);

  addPart(group, ballGeo, whiteBall, -w * 0.26, 0.85, 0);
  addPart(group, ballGeo, redBall, w * 0.18, 0.85, 0);
  addPart(group, ballGeo, yellowBall, w * 0.21, 0.85, 0.04);
  addPart(group, ballGeo, redBall, w * 0.21, 0.85, -0.04);
  addPart(group, ballGeo, blackBall, w * 0.24, 0.85, 0);
  if (isSnooker) {
    addPart(group, ballGeo, redBall, w * 0.24, 0.85, 0.075);
    addPart(group, ballGeo, redBall, w * 0.24, 0.85, -0.075);
    addPart(group, ballGeo, yellowBall, -w * 0.16, 0.85, 0.14);
  }

  const cueMat = new THREE.MeshStandardMaterial({ color: 0xb07d4f, roughness: 0.42, metalness: 0.05 });
  addPart(group, new THREE.CylinderGeometry(0.009, 0.015, 1.38, 8), cueMat, -0.35, 0.87, d / 2 - 0.07, {
    rz: Math.PI / 2,
  });
}

/**
 * Builds a detailed composite 5-12 part 3D model for any catalog item,
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

  const itemAccentHex = resolveItemTintHex(item.tint, accentHex);
  const accent = new THREE.Color(itemAccentHex);
  const statusColor = isOccupied ? new THREE.Color('#22c55e') : accent;

  // Shared calibrated PBR materials (varying roughness by >= 0.25 between adjacent parts)
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x1e2433, roughness: 0.28, metalness: 0.78 });
  const brushedSteel = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.22, metalness: 0.88 });
  const goldMetal = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.22, metalness: 0.9 });
  const matteDesk = new THREE.MeshStandardMaterial({ color: 0x151924, roughness: 0.62, metalness: 0.12 });
  const warmWood = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.68, metalness: 0.05 });
  const leatherDark = new THREE.MeshStandardMaterial({ color: 0x1f2536, roughness: 0.78, metalness: 0.05 });
  const fabricSofa = new THREE.MeshStandardMaterial({
    color: item.tint && item.tint !== 'default' ? accent.clone().multiplyScalar(0.55) : new THREE.Color(0x2c3448),
    roughness: 0.92,
    metalness: 0.02,
  });
  const psWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.28, metalness: 0.08 });
  const glowAccent = new THREE.MeshStandardMaterial({
    color: statusColor,
    emissive: statusColor,
    emissiveIntensity: isOccupied ? 1.85 : 1.2,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Soft radial contact shadow plane at y = 0.008
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

  switch (item.type) {
    case 'pc-station': {
      addPart(group, new THREE.BoxGeometry(1.36, 0.055, 0.76), matteDesk, 0, 0.74, 0);
      addPart(group, new THREE.BoxGeometry(0.06, 0.72, 0.68), darkMetal, -0.6, 0.36, 0);
      addPart(group, new THREE.BoxGeometry(0.06, 0.72, 0.68), darkMetal, 0.6, 0.36, 0);
      addPart(group, new THREE.BoxGeometry(1.16, 0.05, 0.05), darkMetal, 0, 0.18, -0.26);
      addPart(group, new THREE.BoxGeometry(1.3, 0.025, 0.025), glowAccent, 0, 0.74, -0.385, { cast: false });
      addPart(group, new THREE.CylinderGeometry(0.03, 0.04, 0.24, 12), brushedSteel, -0.1, 0.88, -0.18);
      addPart(group, new THREE.BoxGeometry(0.28, 0.018, 0.18), darkMetal, -0.1, 0.775, -0.18);
      addPart(group, new THREE.BoxGeometry(0.76, 0.38, 0.035), darkMetal, -0.1, 1.07, -0.16);
      const screenMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('pc', itemAccentHex, anisotropy),
        emissive: new THREE.Color(itemAccentHex),
        emissiveIntensity: 0.35,
        roughness: 0.15,
        metalness: 0.1,
      });
      addPart(group, new THREE.PlaneGeometry(0.71, 0.33), screenMat, -0.1, 1.07, -0.141, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.24, 0.48, 0.44), darkMetal, 0.47, 1.01, -0.06);
      addPart(group, new THREE.BoxGeometry(0.02, 0.36, 0.32), glowAccent, 0.348, 1.01, -0.06, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.74, 0.008, 0.3), leatherDark, -0.1, 0.772, 0.15, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.38, 0.022, 0.14), darkMetal, -0.17, 0.786, 0.15);
      addPart(group, new THREE.BoxGeometry(0.36, 0.006, 0.12), glowAccent, -0.17, 0.799, 0.15, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.065, 0.026, 0.11), brushedSteel, 0.14, 0.788, 0.15);
      break;
    }

    case 'ps5-lounge': {
      addPart(group, new THREE.BoxGeometry(1.74, 0.42, 0.52), matteDesk, 0, 0.25, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.42), brushedSteel, -0.78, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.42), brushedSteel, 0.78, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(1.62, 0.18, 0.03), warmWood, 0, 0.24, 0.22);
      addPart(group, new THREE.BoxGeometry(1.66, 0.03, 0.03), glowAccent, 0, 0.47, -0.3, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.18, 0.42, 0.06), darkMetal, 0, 0.68, -0.14);
      addPart(group, new THREE.BoxGeometry(1.42, 0.82, 0.045), darkMetal, 0, 1.12, -0.12);
      const tvScreenMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('tv', itemAccentHex, anisotropy),
        emissive: new THREE.Color(itemAccentHex),
        emissiveIntensity: 0.32,
        roughness: 0.12,
        metalness: 0.15,
      });
      addPart(group, new THREE.PlaneGeometry(1.36, 0.76), tvScreenMat, 0, 1.12, -0.095, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.1, 0.38, 0.24), darkMetal, 0.66, 0.65, 0.04);
      addPart(group, new THREE.BoxGeometry(0.024, 0.4, 0.26), psWhite, 0.6, 0.66, 0.04);
      addPart(group, new THREE.BoxGeometry(0.024, 0.4, 0.26), psWhite, 0.72, 0.66, 0.04);
      addPart(group, new THREE.BoxGeometry(0.015, 0.34, 0.015), glowAccent, 0.66, 0.66, 0.165, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.15, 0.045, 0.09), psWhite, -0.58, 0.49, 0.08, { ry: 0.2 });
      addPart(group, new THREE.BoxGeometry(0.15, 0.045, 0.09), psWhite, -0.36, 0.49, 0.09, { ry: -0.2 });
      break;
    }

    case 'ps4-station': {
      addPart(group, new THREE.BoxGeometry(1.44, 0.4, 0.5), matteDesk, 0, 0.24, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.4), darkMetal, -0.64, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(0.05, 0.06, 0.4), darkMetal, 0.64, 0.03, -0.05);
      addPart(group, new THREE.BoxGeometry(1.34, 0.025, 0.025), glowAccent, 0, 0.45, -0.28, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.16, 0.36, 0.05), darkMetal, 0, 0.62, -0.12);
      addPart(group, new THREE.BoxGeometry(1.18, 0.68, 0.04), darkMetal, 0, 1.02, -0.1);
      const screenMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('tv', itemAccentHex, anisotropy),
        emissive: new THREE.Color(itemAccentHex),
        emissiveIntensity: 0.28,
        roughness: 0.14,
        metalness: 0.12,
      });
      addPart(group, new THREE.PlaneGeometry(1.12, 0.62), screenMat, 0, 1.02, -0.078, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.32, 0.065, 0.32), leatherDark, 0.42, 0.475, 0.04);
      addPart(group, new THREE.BoxGeometry(0.28, 0.014, 0.015), glowAccent, 0.42, 0.48, 0.205, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.14, 0.04, 0.085), darkMetal, -0.42, 0.46, 0.08);
      break;
    }

    case 'vr-pod': {
      addPart(group, new THREE.CylinderGeometry(0.98, 1.04, 0.12, 8), matteDesk, 0, 0.06, 0);
      addPart(group, new THREE.TorusGeometry(0.99, 0.025, 10, 8), glowAccent, 0, 0.12, 0, { rx: Math.PI / 2, rz: Math.PI / 8, cast: false });
      const angles = [-Math.PI * 0.75, -Math.PI * 0.25, Math.PI * 0.5];
      angles.forEach((a) => {
        const px = Math.cos(a) * 0.88;
        const pz = Math.sin(a) * 0.88;
        addPart(group, new THREE.BoxGeometry(0.11, 1.92, 0.11), darkMetal, px, 1.04, pz);
        addPart(group, new THREE.BoxGeometry(0.04, 1.65, 0.04), glowAccent, px * 0.94, 1.06, pz * 0.94, { cast: false });
      });
      addPart(group, new THREE.TorusGeometry(0.88, 0.035, 10, 24), brushedSteel, 0, 2.02, 0, { rx: Math.PI / 2 });
      addPart(group, new THREE.CylinderGeometry(0.03, 0.08, 1.05, 12), brushedSteel, 0, 0.62, -0.68);
      addPart(group, new THREE.BoxGeometry(0.2, 0.11, 0.12), psWhite, 0, 1.18, -0.66);
      break;
    }

    case 'arcade-cabinet': {
      // Classic upright neon arcade machine
      addPart(group, new THREE.BoxGeometry(0.76, 1.76, 0.72), darkMetal, 0, 0.88, -0.02);
      // Glowing side accent stripes
      addPart(group, new THREE.BoxGeometry(0.025, 1.68, 0.04), glowAccent, -0.39, 0.88, 0.34, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.025, 1.68, 0.04), glowAccent, 0.39, 0.88, 0.34, { cast: false });
      // Top illuminated marquee header
      addPart(group, new THREE.BoxGeometry(0.7, 0.22, 0.05), glowAccent, 0, 1.64, 0.35, { cast: false });
      // Angled CRT gaming screen
      const arcScreen = new THREE.MeshStandardMaterial({
        map: createScreenTexture('arcade', itemAccentHex, anisotropy),
        emissive: new THREE.Color('#f43f5e'),
        emissiveIntensity: 0.35,
        roughness: 0.12,
        metalness: 0.1,
      });
      addPart(group, new THREE.PlaneGeometry(0.62, 0.48), arcScreen, 0, 1.24, 0.3, { rx: -0.22, cast: false });
      // Control deck with joysticks & buttons
      addPart(group, new THREE.BoxGeometry(0.74, 0.09, 0.34), matteDesk, 0, 0.92, 0.36, { rx: 0.12 });
      addPart(group, new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), brushedSteel, -0.18, 1.0, 0.38);
      addPart(group, new THREE.SphereGeometry(0.028, 10, 10), glowAccent, -0.18, 1.05, 0.38, { cast: false });
      addPart(group, new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), brushedSteel, 0.12, 1.0, 0.38);
      addPart(group, new THREE.SphereGeometry(0.028, 10, 10), glowAccent, 0.12, 1.05, 0.38, { cast: false });
      // Coin door panel
      addPart(group, new THREE.BoxGeometry(0.32, 0.36, 0.03), brushedSteel, 0, 0.44, 0.35);
      break;
    }

    case 'billiard-table':
    case 'billiard-pro':
    case 'billiard-vip':
    case 'billiard-snooker': {
      buildBilliardVariantParts(group, spec, item, { darkMetal, brushedSteel, glowAccent });
      break;
    }

    case 'foosball-table': {
      addPart(group, new THREE.BoxGeometry(1.42, 0.28, 0.78), darkMetal, 0, 0.74, 0);
      const pitchMat = new THREE.MeshStandardMaterial({
        map: createFoosballPitchTexture(anisotropy),
        roughness: 0.55,
        metalness: 0.05,
      });
      addPart(group, new THREE.PlaneGeometry(1.3, 0.68), pitchMat, 0, 0.885, 0, { rx: -Math.PI / 2, cast: false });
      [[-0.58, -0.32], [0.58, -0.32], [-0.58, 0.32], [0.58, 0.32]].forEach(([lx, lz]) => {
        addPart(group, new THREE.BoxGeometry(0.09, 0.64, 0.09), warmWood, lx, 0.32, lz);
      });
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

    case 'gaming-chair': {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5;
        addPart(group, new THREE.BoxGeometry(0.05, 0.045, 0.32), brushedSteel, Math.sin(a) * 0.14, 0.06, Math.cos(a) * 0.14, { ry: a });
      }
      addPart(group, new THREE.CylinderGeometry(0.035, 0.045, 0.36, 12), darkMetal, 0, 0.25, 0);
      addPart(group, new THREE.BoxGeometry(0.52, 0.09, 0.5), leatherDark, 0, 0.45, 0.02);
      addPart(group, new THREE.BoxGeometry(0.46, 0.78, 0.1), leatherDark, 0, 0.86, -0.2, { rx: -0.1 });
      addPart(group, new THREE.BoxGeometry(0.07, 0.62, 0.12), glowAccent, -0.24, 0.84, -0.16, { rx: -0.1, cast: false });
      addPart(group, new THREE.BoxGeometry(0.07, 0.62, 0.12), glowAccent, 0.24, 0.84, -0.16, { rx: -0.1, cast: false });
      addPart(group, new THREE.BoxGeometry(0.26, 0.12, 0.08), fabricSofa, 0, 1.14, -0.15);
      addPart(group, new THREE.BoxGeometry(0.07, 0.22, 0.05), darkMetal, -0.27, 0.56, -0.02);
      addPart(group, new THREE.BoxGeometry(0.07, 0.22, 0.05), darkMetal, 0.27, 0.56, -0.02);
      addPart(group, new THREE.BoxGeometry(0.09, 0.035, 0.28), darkMetal, -0.27, 0.67, 0.04);
      addPart(group, new THREE.BoxGeometry(0.09, 0.035, 0.28), darkMetal, 0.27, 0.67, 0.04);
      break;
    }

    case 'lounge-sofa': {
      addPart(group, new THREE.BoxGeometry(1.76, 0.1, 0.82), darkMetal, 0, 0.18, 0);
      [[-0.82, -0.34], [0.82, -0.34], [-0.82, 0.34], [0.82, 0.34]].forEach(([lx, lz]) => {
        addPart(group, new THREE.CylinderGeometry(0.025, 0.02, 0.14, 10), brushedSteel, lx, 0.07, lz);
      });
      addPart(group, new THREE.BoxGeometry(0.76, 0.18, 0.66), fabricSofa, -0.4, 0.32, 0.06);
      addPart(group, new THREE.BoxGeometry(0.76, 0.18, 0.66), fabricSofa, 0.4, 0.32, 0.06);
      addPart(group, new THREE.BoxGeometry(1.56, 0.54, 0.2), fabricSofa, 0, 0.58, -0.28, { rx: -0.08 });
      addPart(group, new THREE.BoxGeometry(0.18, 0.44, 0.84), fabricSofa, -0.84, 0.42, 0);
      addPart(group, new THREE.BoxGeometry(0.18, 0.44, 0.84), fabricSofa, 0.84, 0.42, 0);
      addPart(group, new THREE.BoxGeometry(0.32, 0.26, 0.11), glowAccent, -0.58, 0.53, -0.1, { ry: 0.28, rx: -0.12, cast: false });
      break;
    }

    case 'bean-bag': {
      // Sculpted multi-lobe plush gaming lounge bean bag
      const bagMat = new THREE.MeshStandardMaterial({
        color: item.tint && item.tint !== 'default' ? accent : new THREE.Color(0x3b4261),
        roughness: 0.9,
        metalness: 0.02,
      });
      const baseSphere = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), bagMat);
      baseSphere.scale.set(1.05, 0.62, 1.05);
      baseSphere.position.set(0, 0.26, 0.04);
      baseSphere.castShadow = true;
      baseSphere.receiveShadow = true;
      group.add(baseSphere);

      const backRest = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), bagMat);
      backRest.scale.set(0.96, 1.05, 0.68);
      backRest.position.set(0, 0.46, -0.2);
      backRest.castShadow = true;
      group.add(backRest);

      // Contrast seam piping ring
      addPart(group, new THREE.TorusGeometry(0.36, 0.02, 8, 20), glowAccent, 0, 0.22, 0.04, { rx: Math.PI / 2, cast: false });
      break;
    }

    case 'coffee-table': {
      addPart(group, new THREE.BoxGeometry(1.1, 0.045, 0.6), warmWood, 0, 0.44, 0);
      addPart(group, new THREE.BoxGeometry(0.96, 0.028, 0.46), matteDesk, 0, 0.18, 0);
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

    case 'reception-counter': {
      addPart(group, new THREE.BoxGeometry(2.42, 0.96, 0.72), matteDesk, 0, 0.48, 0);
      addPart(group, new THREE.BoxGeometry(2.46, 0.06, 0.34), warmWood, 0, 1.02, -0.2);
      addPart(group, new THREE.BoxGeometry(2.3, 0.04, 0.04), glowAccent, 0, 0.12, -0.37, { cast: false });
      addPart(group, new THREE.BoxGeometry(2.3, 0.035, 0.035), glowAccent, 0, 0.94, -0.37, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.46, 0.3, 0.03), darkMetal, -0.45, 1.15, 0.05, { ry: Math.PI });
      addPart(group, new THREE.CylinderGeometry(0.025, 0.035, 0.14, 10), brushedSteel, -0.45, 1.02, 0.05);
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

    case 'vending-fridge': {
      // Illuminated glass-front gaming beverage chiller stocked with energy drinks
      addPart(group, new THREE.BoxGeometry(0.8, 1.9, 0.68), darkMetal, 0, 0.95, 0);
      addPart(group, new THREE.BoxGeometry(0.72, 0.18, 0.04), glowAccent, 0, 1.78, 0.34, { cast: false });
      // Interior chilled light backing
      const innerBack = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: new THREE.Color('#38bdf8'),
        emissiveIntensity: 0.25,
        roughness: 0.4,
      });
      addPart(group, new THREE.BoxGeometry(0.66, 1.38, 0.04), innerBack, 0, 0.96, 0.24, { cast: false });
      // 3 shelves with colorful energy drink cans
      const canColors = [0x22c55e, 0x3b82f6, 0xf43f5e, 0xf59e0b];
      for (let s = 0; s < 3; s++) {
        const sy = 0.56 + s * 0.42;
        addPart(group, new THREE.BoxGeometry(0.66, 0.025, 0.22), brushedSteel, 0, sy, 0.2);
        for (let c = 0; c < 4; c++) {
          const canMat = new THREE.MeshStandardMaterial({
            color: canColors[(c + s) % canColors.length],
            roughness: 0.24,
            metalness: 0.72,
          });
          addPart(group, new THREE.CylinderGeometry(0.035, 0.035, 0.14, 10), canMat, -0.21 + c * 0.14, sy + 0.09, 0.26);
        }
      }
      // Glass door panel + vertical chrome handle
      const doorGlass = new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.24,
        roughness: 0.1,
        metalness: 0.2,
      });
      addPart(group, new THREE.BoxGeometry(0.68, 1.4, 0.025), doorGlass, 0, 0.96, 0.345, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.03, 0.48, 0.04), brushedSteel, -0.32, 1.05, 0.37);
      break;
    }

    case 'trophy-cabinet': {
      // Architectural glass trophy & championship showcase cabinet
      addPart(group, new THREE.BoxGeometry(1.3, 0.44, 0.5), matteDesk, 0, 0.22, 0);
      addPart(group, new THREE.BoxGeometry(1.3, 0.08, 0.5), darkMetal, 0, 1.88, 0);
      addPart(group, new THREE.BoxGeometry(1.24, 1.4, 0.05), darkMetal, 0, 1.14, -0.22);
      // Corner glass posts
      [[-0.62, 0.22], [0.62, 0.22], [-0.62, -0.22], [0.62, -0.22]].forEach(([px, pz]) => {
        addPart(group, new THREE.BoxGeometry(0.05, 1.44, 0.05), brushedSteel, px, 1.16, pz);
      });
      // Top showcase LED bar
      addPart(group, new THREE.BoxGeometry(1.16, 0.03, 0.04), glowAccent, 0, 1.82, 0.02, { cast: false });
      // Glass shelves
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.25,
        roughness: 0.12,
        metalness: 0.2,
      });
      addPart(group, new THREE.BoxGeometry(1.2, 0.02, 0.42), glassMat, 0, 0.95, 0, { cast: false });
      addPart(group, new THREE.BoxGeometry(1.2, 0.02, 0.42), glassMat, 0, 1.42, 0, { cast: false });
      // 3 Sculpted Metallic Championship Trophies (Gold, Silver, Bronze)
      const trophyMats = [
        goldMetal,
        brushedSteel,
        new THREE.MeshStandardMaterial({ color: 0xcd7f32, roughness: 0.28, metalness: 0.85 }),
      ];
      [-0.36, 0, 0.36].forEach((tx, idx) => {
        const yBase = idx === 1 ? 1.43 : 0.96;
        addPart(group, new THREE.BoxGeometry(0.12, 0.06, 0.12), darkMetal, tx, yBase + 0.03, 0);
        addPart(group, new THREE.CylinderGeometry(0.022, 0.04, 0.12, 10), trophyMats[idx], tx, yBase + 0.12, 0);
        addPart(group, new THREE.CylinderGeometry(0.095, 0.045, 0.16, 12), trophyMats[idx], tx, yBase + 0.24, 0);
      });
      // Front glass face
      addPart(group, new THREE.BoxGeometry(1.22, 1.4, 0.02), glassMat, 0, 1.14, 0.23, { cast: false });
      break;
    }

    case 'wall-tv-spectator': {
      // Wide dual-post tournament spectator scoreboard screen
      addPart(group, new THREE.BoxGeometry(1.6, 0.06, 0.46), darkMetal, 0, 0.03, 0);
      addPart(group, new THREE.CylinderGeometry(0.038, 0.042, 1.85, 12), brushedSteel, -0.58, 0.96, -0.05);
      addPart(group, new THREE.CylinderGeometry(0.038, 0.042, 1.85, 12), brushedSteel, 0.58, 0.96, -0.05);
      addPart(group, new THREE.BoxGeometry(2.02, 1.12, 0.06), darkMetal, 0, 1.44, 0.02);
      const specMat = new THREE.MeshStandardMaterial({
        map: createScreenTexture('tournament', itemAccentHex, anisotropy),
        emissive: new THREE.Color(itemAccentHex),
        emissiveIntensity: 0.38,
        roughness: 0.14,
        metalness: 0.1,
      });
      addPart(group, new THREE.PlaneGeometry(1.92, 1.02), specMat, 0, 1.44, 0.054, { cast: false });
      addPart(group, new THREE.BoxGeometry(1.96, 0.03, 0.03), glowAccent, 0, 2.01, 0.02, { cast: false });
      break;
    }

    case 'neon-sign-stand': {
      // Freestanding steel totem with glowing geometric neon gaming emblem
      addPart(group, new THREE.BoxGeometry(1.32, 0.08, 0.36), darkMetal, 0, 0.04, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.86, 0.07), darkMetal, -0.62, 0.96, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.86, 0.07), darkMetal, 0.62, 0.96, 0);
      addPart(group, new THREE.BoxGeometry(1.32, 0.07, 0.07), darkMetal, 0, 1.88, 0);
      // Dark acoustic backdrop board
      addPart(group, new THREE.BoxGeometry(1.18, 1.18, 0.04), matteDesk, 0, 1.24, 0);
      // Neon glowing diamond + dual ring controller motif
      addPart(group, new THREE.TorusGeometry(0.36, 0.022, 10, 4), glowAccent, 0, 1.24, 0.04, { cast: false });
      addPart(group, new THREE.TorusGeometry(0.14, 0.018, 8, 16), glowAccent, -0.24, 1.24, 0.04, { cast: false });
      addPart(group, new THREE.TorusGeometry(0.14, 0.018, 8, 16), glowAccent, 0.24, 1.24, 0.04, { cast: false });
      addPart(group, new THREE.BoxGeometry(0.92, 0.026, 0.03), glowAccent, 0, 0.72, 0.04, { cast: false });
      break;
    }

    case 'rgb-pillar': {
      // Architectural corner/aisle RGB light column
      addPart(group, new THREE.CylinderGeometry(0.2, 0.22, 0.14, 8), darkMetal, 0, 0.07, 0);
      addPart(group, new THREE.CylinderGeometry(0.11, 0.11, 1.98, 12), glowAccent, 0, 1.12, 0, { cast: false });
      // Vertical metallic architectural fins around light core
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        addPart(
          group,
          new THREE.BoxGeometry(0.035, 2.02, 0.07),
          darkMetal,
          Math.cos(a) * 0.13,
          1.12,
          Math.sin(a) * 0.13,
          { ry: -a }
        );
      }
      addPart(group, new THREE.CylinderGeometry(0.17, 0.17, 0.1, 8), darkMetal, 0, 2.16, 0);
      break;
    }

    case 'cue-rack': {
      // Billiard club cue rack with 4 angled wooden cues & chalk tray
      addPart(group, new THREE.BoxGeometry(0.7, 0.07, 0.34), warmWood, 0, 0.035, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.32, 0.07), warmWood, -0.3, 0.69, -0.08);
      addPart(group, new THREE.BoxGeometry(0.07, 1.32, 0.07), warmWood, 0.3, 0.69, -0.08);
      addPart(group, new THREE.BoxGeometry(0.68, 0.08, 0.14), warmWood, 0, 1.32, -0.04);
      addPart(group, new THREE.BoxGeometry(0.62, 0.05, 0.14), matteDesk, 0, 0.78, -0.04);
      const cueMat = new THREE.MeshStandardMaterial({ color: 0xc2915f, roughness: 0.4, metalness: 0.05 });
      const chalkMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.85, metalness: 0 });
      [-0.21, -0.07, 0.07, 0.21].forEach((cx) => {
        addPart(group, new THREE.CylinderGeometry(0.009, 0.015, 1.36, 8), cueMat, cx, 0.73, 0.02, { rx: -0.06 });
      });
      addPart(group, new THREE.BoxGeometry(0.04, 0.04, 0.04), chalkMat, -0.15, 0.83, 0.01);
      addPart(group, new THREE.BoxGeometry(0.04, 0.04, 0.04), chalkMat, 0.15, 0.83, 0.01);
      break;
    }

    case 'acoustic-wall-art': {
      // Freestanding hexagonal acoustic gaming panel sculpture with LED halo
      addPart(group, new THREE.BoxGeometry(1.44, 0.07, 0.3), darkMetal, 0, 0.035, 0);
      addPart(group, new THREE.BoxGeometry(0.06, 1.76, 0.06), darkMetal, -0.58, 0.91, -0.06);
      addPart(group, new THREE.BoxGeometry(0.06, 1.76, 0.06), darkMetal, 0.58, 0.91, -0.06);
      const acousticMat = new THREE.MeshStandardMaterial({ color: 0x242c40, roughness: 0.94, metalness: 0.02 });
      const positions = [
        [-0.32, 1.38],
        [0.0, 1.56],
        [0.32, 1.38],
        [-0.32, 0.98],
        [0.0, 1.16],
        [0.32, 0.98],
        [0.0, 0.76],
      ];
      positions.forEach(([hx, hy], idx) => {
        addPart(
          group,
          new THREE.CylinderGeometry(0.18, 0.18, 0.06, 6),
          idx === 1 || idx === 4 ? glowAccent : acousticMat,
          hx,
          hy,
          0.02,
          { rx: Math.PI / 2, cast: idx !== 1 && idx !== 4 }
        );
      });
      break;
    }

    case 'plant-pot': {
      const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.48, metalness: 0.12 });
      const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2a20, roughness: 0.95, metalness: 0 });
      const leafDark = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.62, metalness: 0.02 });
      const leafLight = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.56, metalness: 0.02 });
      addPart(group, new THREE.CylinderGeometry(0.24, 0.19, 0.44, 14), potMat, 0, 0.22, 0);
      addPart(group, new THREE.CylinderGeometry(0.21, 0.21, 0.04, 12), soilMat, 0, 0.43, 0);
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
      addPart(group, new THREE.BoxGeometry(1.76, 0.07, 0.18), darkMetal, 0, 0.035, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.84, 0.09), darkMetal, -0.85, 0.94, 0);
      addPart(group, new THREE.BoxGeometry(0.07, 1.84, 0.09), darkMetal, 0.85, 0.94, 0);
      addPart(group, new THREE.BoxGeometry(1.76, 0.06, 0.09), darkMetal, 0, 1.85, 0);
      const frostMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.26,
        roughness: 0.35,
        metalness: 0.1,
      });
      addPart(group, new THREE.BoxGeometry(1.62, 1.72, 0.025), frostMat, 0, 0.94, 0, { cast: false });
      addPart(group, new THREE.BoxGeometry(1.62, 0.03, 0.04), glowAccent, 0, 1.78, 0, { cast: false });
      break;
    }

    default: {
      addPart(group, new THREE.BoxGeometry(spec.width, spec.height, spec.depth), matteDesk, 0, spec.height / 2, 0);
    }
  }

  // Refined, compact overhead live mini-timer sprite above every 3D station
  if (spec.isStation && item.tableNumber) {
    const resolvedTimer =
      timerState ||
      (isOccupied
        ? { text: 'فعال', status: 'running', isOccupied: true }
        : { text: 'آزاد', status: 'idle', isOccupied: false });
    const sprite = createStationTimerSprite(item.tableNumber, resolvedTimer, itemAccentHex, anisotropy);
    sprite.position.set(0, spec.height + 0.48, 0);
    sprite.scale.set(1.42, 0.43, 1);
    group.add(sprite);
  }

  // Invisible simplified picking/raycast proxy box
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
