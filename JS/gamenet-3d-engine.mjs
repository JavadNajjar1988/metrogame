/**
 * Pure 3D Game Center Builder domain engine:
 * - Multi-floor architecture (up to 4 floors), room dimensions, procedural wallpapers, floors & LED colors
 * - Interactive interior partition wall geometry (full, half, glass VIP, doorway), snapping & collision
 * - Expanded 26-item gaming equipment, multi-style billiard tables, staircase & rich decor catalog
 * - Per-item finish/tint customization, grid snapping, room boundary clamping, 90° rotation
 * - AABB & wall collision detection, blank from-scratch & starter presets, multi-floor Tables sync
 * Zero DOM / Zero Three.js dependencies — 100% unit-testable via node:test.
 */

export const ROOM_LIMITS = Object.freeze({
  minWidth: 6,
  maxWidth: 24,
  minDepth: 6,
  maxDepth: 20,
  minHeight: 2.8,
  maxHeight: 4.5,
  gridStep: 0.5,
  wallMargin: 0.16,
});

export const FLOOR_LIMITS = Object.freeze({
  maxFloors: 4,
  slabThickness: 0.24,
  defaultNames: Object.freeze(['طبقه همکف', 'طبقه اول', 'طبقه دوم', 'طبقه سوم']),
});

export const WALL_STYLES = Object.freeze([
  { id: 'full', label: 'دیوار کامل', heightRatio: 1, fixedHeight: null, thickness: 0.16, color: '#64748b' },
  { id: 'half', label: 'نیم‌دیوار', heightRatio: 0, fixedHeight: 1.25, thickness: 0.16, color: '#94a3b8' },
  { id: 'glass', label: 'شیشه‌ای VIP', heightRatio: 1, fixedHeight: null, thickness: 0.12, color: '#38bdf8' },
  { id: 'doorway', label: 'با درگاه ورودی', heightRatio: 1, fixedHeight: null, thickness: 0.16, color: '#a78bfa' },
]);

export const FLOOR_FINISHES = Object.freeze([
  { id: 'slate-tile', label: 'سرامیک تیره', color: '#1c2230', secondary: '#262f42' },
  { id: 'warm-wood', label: 'پارکت چوب', color: '#5c402c', secondary: '#483121' },
  { id: 'arena-carpet', label: 'موکت گیمینگ', color: '#191c2b', secondary: '#22263a' },
  { id: 'epoxy-dark', label: 'اپوکسی مشکی', color: '#111520', secondary: '#1e273a' },
  { id: 'check-lounge', label: 'شطرنجی لانژ', color: '#242938', secondary: '#353d52' },
  { id: 'marble-light', label: 'سنگ روشن', color: '#d6dbe4', secondary: '#c5ccd8' },
]);

export const WALL_FINISHES = Object.freeze([
  {
    id: 'charcoal',
    label: 'پنل آکوستیک',
    color: '#1a1f2c',
    trim: '#2b3347',
    swatchBg: 'repeating-linear-gradient(90deg, #1a1f2c 0 4px, #10141f 4px 6px)',
  },
  {
    id: 'hex-cyber',
    label: 'کاغذ دیواری شش‌ضلعی',
    color: '#131826',
    trim: '#242e48',
    swatchBg: 'radial-gradient(circle at 50% 50%, #2a3656 20%, #121726 70%)',
  },
  {
    id: 'brick-loft',
    label: 'آجر صنعتی تیره',
    color: '#3c2420',
    trim: '#281917',
    swatchBg: 'repeating-linear-gradient(0deg, #522f28 0 4px, #241412 4px 6px)',
  },
  {
    id: 'wood-slat',
    label: 'ترموود چوبی',
    color: '#5a3d28',
    trim: '#3a2618',
    swatchBg: 'repeating-linear-gradient(90deg, #744e34 0 4px, #2c1c12 4px 6px)',
  },
  {
    id: 'geo-gold',
    label: 'کاغذ دیواری لاکچری',
    color: '#151821',
    trim: '#8a6b2f',
    swatchBg: 'linear-gradient(135deg, #171b26 35%, #b58d3d 50%, #171b26 65%)',
  },
  {
    id: 'neon-grid',
    label: 'کاغذ دیواری نئونی',
    color: '#0f172a',
    trim: '#1e3a5f',
    swatchBg: 'linear-gradient(0deg, rgba(56,189,248,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.45) 1px, #0f172a 1px)',
  },
  {
    id: 'concrete',
    label: 'بتن اکسپوز',
    color: '#454c59',
    trim: '#323842',
    swatchBg: 'linear-gradient(135deg, #525a69, #3b424e)',
  },
  {
    id: 'midnight',
    label: 'سرمه‌ای شب',
    color: '#141c33',
    trim: '#202c4d',
    swatchBg: 'linear-gradient(135deg, #192445, #10172b)',
  },
  {
    id: 'ivory',
    label: 'سفید گرم',
    color: '#e6e4de',
    trim: '#cbc7be',
    swatchBg: 'linear-gradient(135deg, #efede8, #d8d4ca)',
  },
]);

export const LIGHTING_MOODS = Object.freeze([
  { id: 'esports', label: 'گیمینگ' },
  { id: 'lounge', label: 'لانژ شبانه' },
  { id: 'neon-club', label: 'سایبر نئون' },
  { id: 'warm-club', label: 'کلاب گرم' },
  { id: 'daylight', label: 'نور روز' },
]);

export const LED_COLORS = Object.freeze([
  { id: 'auto', label: 'همگام با تم', hex: '' },
  { id: 'violet', label: 'بنفش', hex: '#8b5cf6' },
  { id: 'cyan', label: 'آبی سایبری', hex: '#06b6d4' },
  { id: 'emerald', label: 'زمردی', hex: '#10b981' },
  { id: 'crimson', label: 'سرخ نئون', hex: '#f43f5e' },
  { id: 'amber', label: 'نارنجی گرم', hex: '#f59e0b' },
  { id: 'gold', label: 'طلایی', hex: '#eab308' },
]);

export const ITEM_TINT_SWATCHES = Object.freeze([
  { id: 'default', label: 'پیش‌فرض', hex: '' },
  { id: 'violet', label: 'بنفش', hex: '#7c3aed' },
  { id: 'cyan', label: 'آبی', hex: '#0ea5e9' },
  { id: 'emerald', label: 'سبز', hex: '#10b981' },
  { id: 'crimson', label: 'زرشکی', hex: '#e11d48' },
  { id: 'amber', label: 'نارنجی', hex: '#f59e0b' },
  { id: 'gold', label: 'طلایی', hex: '#d97706' },
  { id: 'obsidian', label: 'مشکی مات', hex: '#1e293b' },
]);

export const BILLIARD_FELT_VARIANTS = Object.freeze([
  { id: 'classic-green', label: 'سبز کلاسیک', feltHex: '#0f766e', railHex: '#6b4a33' },
  { id: 'tournament-blue', label: 'آبی تورنومنت', feltHex: '#1d4ed8', railHex: '#1e2433' },
  { id: 'vip-burgundy', label: 'زرشکی VIP', feltHex: '#881337', railHex: '#4a2518' },
  { id: 'luxury-black', label: 'مشکی لاکچری', feltHex: '#18181b', railHex: '#b48a3e' },
]);

export const CATALOG_CATEGORIES = Object.freeze([
  { id: 'all', label: 'همه' },
  { id: 'systems', label: 'سیستم و کنسول' },
  { id: 'arcade', label: 'بیلیارد و سالنی' },
  { id: 'furniture', label: 'مبلمان' },
  { id: 'decor', label: 'معماری و دکور' },
]);

export const ITEM_CATALOG = Object.freeze([
  // --- Systems & Consoles ---
  {
    type: 'pc-station',
    name: 'سیستم گیمینگ PC',
    shortName: 'سیستم PC',
    category: 'systems',
    width: 1.4,
    depth: 0.85,
    height: 1.35,
    isStation: true,
    consoleType: 'computer',
    accentColor: '#7c3aed',
  },
  {
    type: 'ps5-lounge',
    name: 'ایستگاه PS5 و TV',
    shortName: 'PS5',
    category: 'systems',
    width: 1.8,
    depth: 0.7,
    height: 1.55,
    isStation: true,
    consoleType: 'ps50',
    accentColor: '#3b82f6',
  },
  {
    type: 'ps4-station',
    name: 'ایستگاه PS4',
    shortName: 'PS4',
    category: 'systems',
    width: 1.5,
    depth: 0.7,
    height: 1.4,
    isStation: true,
    consoleType: 'ps4',
    accentColor: '#0ea5e9',
  },
  {
    type: 'vr-pod',
    name: 'کابین VIP / VR',
    shortName: 'کابین VR',
    category: 'systems',
    width: 2.1,
    depth: 2.1,
    height: 2.1,
    isStation: true,
    consoleType: 'jewelry',
    accentColor: '#10b981',
  },
  {
    type: 'arcade-cabinet',
    name: 'دستگاه آرکید کلاسیک',
    shortName: 'آرکید',
    category: 'systems',
    width: 0.85,
    depth: 0.85,
    height: 1.82,
    isStation: true,
    consoleType: 'ps4',
    accentColor: '#ec4899',
  },

  // --- Billiards & Hall Games (Multiple Styles) ---
  {
    type: 'billiard-table',
    name: 'بیلیارد کلاسیک سبز',
    shortName: 'بیلیارد',
    category: 'arcade',
    width: 2.6,
    depth: 1.45,
    height: 0.85,
    isStation: true,
    isBilliard: true,
    defaultVariant: 'classic-green',
    consoleType: 'pool-table',
    accentColor: '#059669',
  },
  {
    type: 'billiard-pro',
    name: 'بیلیارد تورنومنت آبی',
    shortName: 'بیلیارد پرو',
    category: 'arcade',
    width: 2.75,
    depth: 1.5,
    height: 0.86,
    isStation: true,
    isBilliard: true,
    defaultVariant: 'tournament-blue',
    consoleType: 'pool-table',
    accentColor: '#2563eb',
  },
  {
    type: 'billiard-vip',
    name: 'بیلیارد VIP زرشکی',
    shortName: 'بیلیارد VIP',
    category: 'arcade',
    width: 2.65,
    depth: 1.48,
    height: 0.86,
    isStation: true,
    isBilliard: true,
    defaultVariant: 'vip-burgundy',
    consoleType: 'pool-table',
    accentColor: '#be123c',
  },
  {
    type: 'billiard-snooker',
    name: 'میز اسنوکر ۱۲ فوت',
    shortName: 'اسنوکر',
    category: 'arcade',
    width: 3.2,
    depth: 1.75,
    height: 0.88,
    isStation: true,
    isBilliard: true,
    defaultVariant: 'classic-green',
    consoleType: 'pool-table',
    accentColor: '#15803d',
  },
  {
    type: 'foosball-table',
    name: 'فوتبال دستی',
    shortName: 'فوتبال دستی',
    category: 'arcade',
    width: 1.5,
    depth: 1.1,
    height: 0.92,
    isStation: true,
    consoleType: 'foosball',
    accentColor: '#16a34a',
  },

  // --- Furniture ---
  {
    type: 'gaming-chair',
    name: 'صندلی گیمینگ',
    shortName: 'صندلی',
    category: 'furniture',
    width: 0.7,
    depth: 0.7,
    height: 1.28,
    isStation: false,
    accentColor: '#8b5cf6',
  },
  {
    type: 'lounge-sofa',
    name: 'مبل دونفره',
    shortName: 'مبل',
    category: 'furniture',
    width: 1.85,
    depth: 0.9,
    height: 0.88,
    isStation: false,
    accentColor: '#64748b',
  },
  {
    type: 'bean-bag',
    name: 'پاف نشیمن گیمینگ',
    shortName: 'پاف',
    category: 'furniture',
    width: 0.95,
    depth: 0.95,
    height: 0.72,
    isStation: false,
    accentColor: '#6366f1',
  },
  {
    type: 'coffee-table',
    name: 'میز جلو مبلی',
    shortName: 'میز جلو',
    category: 'furniture',
    width: 1.15,
    depth: 0.65,
    height: 0.48,
    isStation: false,
    accentColor: '#94a3b8',
  },
  {
    type: 'empty-desk',
    name: 'میز گیمینگ خالی',
    shortName: 'میز',
    category: 'furniture',
    width: 1.4,
    depth: 0.8,
    height: 0.76,
    isStation: false,
    accentColor: '#6366f1',
  },

  // --- Architecture & Decorations ---
  {
    type: 'stairs-modern',
    name: 'راه‌پله طبقات',
    shortName: 'راه‌پله',
    category: 'decor',
    width: 1.4,
    depth: 2.6,
    height: 3.1,
    isStation: false,
    accentColor: '#94a3b8',
  },
  {
    type: 'reception-counter',
    name: 'پیشخوان و بوفه',
    shortName: 'بوفه',
    category: 'decor',
    width: 2.5,
    depth: 0.95,
    height: 1.15,
    isStation: false,
    accentColor: '#f59e0b',
  },
  {
    type: 'vending-fridge',
    name: 'یخچال نوشیدنی',
    shortName: 'یخچال',
    category: 'decor',
    width: 0.85,
    depth: 0.75,
    height: 1.95,
    isStation: false,
    accentColor: '#06b6d4',
  },
  {
    type: 'trophy-cabinet',
    name: 'ویترین کاپ و افتخارات',
    shortName: 'ویترین کاپ',
    category: 'decor',
    width: 1.35,
    depth: 0.55,
    height: 1.95,
    isStation: false,
    accentColor: '#eab308',
  },
  {
    type: 'wall-tv-spectator',
    name: 'نمایشگر مسابقات',
    shortName: 'نمایشگر',
    category: 'decor',
    width: 2.1,
    depth: 0.55,
    height: 2.05,
    isStation: false,
    accentColor: '#3b82f6',
  },
  {
    type: 'neon-sign-stand',
    name: 'تابلو نئون گیمینگ',
    shortName: 'تابلو نئون',
    category: 'decor',
    width: 1.4,
    depth: 0.4,
    height: 1.95,
    isStation: false,
    accentColor: '#d946ef',
  },
  {
    type: 'rgb-pillar',
    name: 'ستون نوری RGB',
    shortName: 'ستون نوری',
    category: 'decor',
    width: 0.45,
    depth: 0.45,
    height: 2.25,
    isStation: false,
    accentColor: '#8b5cf6',
  },
  {
    type: 'cue-rack',
    name: 'استند چوب بیلیارد',
    shortName: 'استند چوب',
    category: 'decor',
    width: 0.75,
    depth: 0.4,
    height: 1.45,
    isStation: false,
    accentColor: '#b45309',
  },
  {
    type: 'acoustic-wall-art',
    name: 'تابلو آکوستیک نوری',
    shortName: 'آکوستیک',
    category: 'decor',
    width: 1.5,
    depth: 0.35,
    height: 1.85,
    isStation: false,
    accentColor: '#14b8a6',
  },
  {
    type: 'plant-pot',
    name: 'گلدان سالن',
    shortName: 'گلدان',
    category: 'decor',
    width: 0.6,
    depth: 0.6,
    height: 1.35,
    isStation: false,
    accentColor: '#22c55e',
  },
  {
    type: 'neon-divider',
    name: 'پارتیشن نوری',
    shortName: 'پارتیشن',
    category: 'decor',
    width: 1.8,
    depth: 0.22,
    height: 1.9,
    isStation: false,
    accentColor: '#a855f7',
  },
]);

const CATALOG_MAP = new Map(ITEM_CATALOG.map((entry) => [entry.type, entry]));
const FLOOR_IDS = new Set(FLOOR_FINISHES.map((f) => f.id));
const WALL_IDS = new Set(WALL_FINISHES.map((w) => w.id));
const WALL_STYLE_IDS = new Set(WALL_STYLES.map((s) => s.id));
const MOOD_IDS = new Set(LIGHTING_MOODS.map((m) => m.id));
const LED_IDS = new Set(LED_COLORS.map((c) => c.id));
const TINT_IDS = new Set(ITEM_TINT_SWATCHES.map((t) => t.id));
const FELT_IDS = new Set(BILLIARD_FELT_VARIANTS.map((v) => v.id));

export function getCatalogItem(type) {
  return CATALOG_MAP.get(String(type)) || null;
}

export function getWallStyleSpec(styleId) {
  return WALL_STYLES.find((s) => s.id === styleId) || WALL_STYLES[0];
}

export function getBilliardFeltVariant(variantId, fallbackType = 'billiard-table') {
  if (variantId && FELT_IDS.has(variantId)) {
    return BILLIARD_FELT_VARIANTS.find((v) => v.id === variantId);
  }
  const spec = getCatalogItem(fallbackType);
  const defId = spec?.defaultVariant || 'classic-green';
  return BILLIARD_FELT_VARIANTS.find((v) => v.id === defId) || BILLIARD_FELT_VARIANTS[0];
}

export function resolveLedColorHex(ledColorId, fallbackHex = '#7c3aed') {
  const found = LED_COLORS.find((c) => c.id === ledColorId);
  return found && found.hex ? found.hex : fallbackHex;
}

export function resolveItemTintHex(tintId, fallbackHex = '#7c3aed') {
  const found = ITEM_TINT_SWATCHES.find((t) => t.id === tintId);
  return found && found.hex ? found.hex : fallbackHex;
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

export function normalizeRotationDeg(deg) {
  const raw = Number(deg) || 0;
  const snapped = Math.round(raw / 90) * 90;
  const mod = snapped % 360;
  return mod < 0 ? mod + 360 : mod;
}

export function snapToGrid(value, step = ROOM_LIMITS.gridStep) {
  const safeStep = Number(step) > 0 ? Number(step) : 0;
  if (safeStep <= 0) return Number(Number(value).toFixed(2));
  return Number((Math.round(value / safeStep) * safeStep).toFixed(2));
}

/**
 * Returns the world-space axis-aligned width (X) and depth (Z) of an item
 * after applying its 90-degree Y rotation.
 */
export function getRotatedFootprint(type, rotationDeg = 0) {
  const spec = getCatalogItem(type);
  if (!spec) return { width: 1, depth: 1, height: 1 };
  const rot = normalizeRotationDeg(rotationDeg);
  const swap = rot === 90 || rot === 270;
  return {
    width: swap ? spec.depth : spec.width,
    depth: swap ? spec.width : spec.depth,
    height: spec.height,
  };
}

/**
 * Clamps an item's center (x, z) so its full rotated bounding footprint stays
 * strictly inside the room's inner walls.
 */
export function clampItemToRoom(item, room, gridStep = ROOM_LIMITS.gridStep) {
  const safeRoom = sanitizeRoom(room);
  const rot = normalizeRotationDeg(item?.rotation);
  const fp = getRotatedFootprint(item?.type, rot);

  const halfRoomW = safeRoom.width / 2 - ROOM_LIMITS.wallMargin;
  const halfRoomD = safeRoom.depth / 2 - ROOM_LIMITS.wallMargin;
  const halfItemW = fp.width / 2;
  const halfItemD = fp.depth / 2;

  const minX = -Math.max(0, halfRoomW - halfItemW);
  const maxX = Math.max(0, halfRoomW - halfItemW);
  const minZ = -Math.max(0, halfRoomD - halfItemD);
  const maxZ = Math.max(0, halfRoomD - halfItemD);

  const rawX = snapToGrid(Number(item?.x) || 0, gridStep);
  const rawZ = snapToGrid(Number(item?.z) || 0, gridStep);

  return {
    ...item,
    rotation: rot,
    x: Number(clamp(rawX, minX, maxX).toFixed(2)),
    z: Number(clamp(rawZ, minZ, maxZ).toFixed(2)),
  };
}

/**
 * Interior Wall Geometry Helpers
 */
export function snapWallPointToRoom(rawX, rawZ, room, gridStep = ROOM_LIMITS.gridStep) {
  const safeRoom = sanitizeRoom(room);
  const maxW = safeRoom.width / 2 - 0.08;
  const maxD = safeRoom.depth / 2 - 0.08;
  const sx = snapToGrid(clamp(Number(rawX) || 0, -maxW, maxW), gridStep);
  const sz = snapToGrid(clamp(Number(rawZ) || 0, -maxD, maxD), gridStep);
  return {
    x: Number(clamp(sx, -maxW, maxW).toFixed(2)),
    z: Number(clamp(sz, -maxD, maxD).toFixed(2)),
  };
}

/**
 * Snaps the active wall endpoint relative to start point (supports clean 0°/90°/45° architectural snapping).
 */
export function snapWallEndpoint(
  startX,
  startZ,
  rawX,
  rawZ,
  room,
  { gridStep = ROOM_LIMITS.gridStep, orthoSnap = true } = {}
) {
  const base = snapWallPointToRoom(rawX, rawZ, room, gridStep);
  if (!orthoSnap || startX == null || startZ == null) return base;

  const dx = base.x - startX;
  const dz = base.z - startZ;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.01) return base;

  const angle = Math.atan2(dz, dx);
  // Snap to nearest 45-degree increment (0, 45, 90, 135, 180...)
  const snapRad = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
  const absCos = Math.abs(Math.cos(snapRad));
  const absSin = Math.abs(Math.sin(snapRad));

  let targetX = base.x;
  let targetZ = base.z;
  if (absCos > 0.9) {
    // Horizontal wall
    targetZ = startZ;
  } else if (absSin > 0.9) {
    // Vertical wall
    targetX = startX;
  } else {
    // 45-degree diagonal wall
    const proj = Math.max(Math.abs(dx), Math.abs(dz));
    targetX = startX + Math.sign(Math.cos(snapRad)) * proj;
    targetZ = startZ + Math.sign(Math.sin(snapRad)) * proj;
  }

  return snapWallPointToRoom(targetX, targetZ, room, gridStep);
}

export function getWallMetrics(wall) {
  const x1 = Number(wall?.x1) || 0;
  const z1 = Number(wall?.z1) || 0;
  const x2 = Number(wall?.x2) || 0;
  const z2 = Number(wall?.z2) || 0;
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  return {
    cx: Number(((x1 + x2) / 2).toFixed(3)),
    cz: Number(((z1 + z2) / 2).toFixed(3)),
    dx,
    dz,
    length: Number(length.toFixed(3)),
    angleRad: Math.atan2(-dz, dx),
  };
}

export function createWallSegment(x1, z1, x2, z2, room, style = 'full', id = null) {
  const safeRoom = sanitizeRoom(room);
  const p1 = snapWallPointToRoom(x1, z1, safeRoom, 0);
  const p2 = snapWallPointToRoom(x2, z2, safeRoom, 0);
  const length = Math.hypot(p2.x - p1.x, p2.z - p1.z);
  if (length < 0.45) return null;

  const resolvedStyle = WALL_STYLE_IDS.has(style) ? style : 'full';
  const styleSpec = getWallStyleSpec(resolvedStyle);

  return {
    id: id || `wall-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    x1: p1.x,
    z1: p1.z,
    x2: p2.x,
    z2: p2.z,
    style: resolvedStyle,
    thickness: styleSpec.thickness,
  };
}

export function sanitizeWalls(rawWalls, room) {
  if (!Array.isArray(rawWalls)) return [];
  const safeRoom = sanitizeRoom(room);
  const seen = new Set();
  const out = [];

  for (let i = 0; i < rawWalls.length && out.length < 80; i++) {
    const w = rawWalls[i];
    if (!w || typeof w !== 'object') continue;
    let id = String(w.id || `wall-${i + 1}`).slice(0, 48);
    if (seen.has(id)) id = `${id}-${i}`;
    const seg = createWallSegment(w.x1, w.z1, w.x2, w.z2, safeRoom, w.style, id);
    if (seg) {
      seen.add(seg.id);
      out.push(seg);
    }
  }
  return out;
}

/**
 * Checks whether a furniture/station candidate overlaps any drawn interior wall segment.
 * Allows passing through the centered 1.25m opening of 'doorway' walls when length >= 1.8m.
 */
export function checkItemWallCollision(candidate, walls = [], clearance = 0.06) {
  if (!candidate || !Array.isArray(walls) || walls.length === 0) return false;
  const fp = getRotatedFootprint(candidate.type, candidate.rotation);
  const halfW = Math.max(0.05, fp.width / 2 - clearance);
  const halfD = Math.max(0.05, fp.depth / 2 - clearance);

  const corners = [
    [candidate.x - halfW, candidate.z - halfD],
    [candidate.x + halfW, candidate.z - halfD],
    [candidate.x + halfW, candidate.z + halfD],
    [candidate.x - halfW, candidate.z + halfD],
  ];

  for (const wall of walls) {
    const m = getWallMetrics(wall);
    if (m.length < 0.45) continue;
    const ux = m.dx / m.length;
    const uz = m.dz / m.length;
    const nx = -uz;
    const nz = ux;
    const halfLen = m.length / 2;
    const halfThick = (Number(wall.thickness) || 0.16) / 2;

    let minAlong = Infinity;
    let maxAlong = -Infinity;
    let minPerp = Infinity;
    let maxPerp = -Infinity;

    for (const [px, pz] of corners) {
      const rx = px - m.cx;
      const rz = pz - m.cz;
      const along = rx * ux + rz * uz;
      const perp = rx * nx + rz * nz;
      if (along < minAlong) minAlong = along;
      if (along > maxAlong) maxAlong = along;
      if (perp < minPerp) minPerp = perp;
      if (perp > maxPerp) maxPerp = perp;
    }

    const overlapsPerp = minPerp < halfThick && maxPerp > -halfThick;
    const overlapsAlong = minAlong < halfLen && maxAlong > -halfLen;
    if (!overlapsPerp || !overlapsAlong) continue;

    // For doorway walls, allow items cleanly positioned inside the open portal? Usually block jambs only:
    if (wall.style === 'doorway' && m.length >= 1.8) {
      const doorHalf = 0.625;
      const hitsLeftJamb = minAlong < -doorHalf && maxAlong > -halfLen;
      const hitsRightJamb = minAlong < halfLen && maxAlong > doorHalf;
      if (!hitsLeftJamb && !hitsRightJamb) continue;
    }

    return true;
  }

  return false;
}

/**
 * Axis-aligned bounding-box overlap check on the floor plane (X/Z).
 * Uses a small clearance allowance (0.08m) so chairs tuck neatly near desks.
 */
export function checkItemCollision(candidate, items = [], ignoreId = null, clearance = 0.08, walls = []) {
  if (!candidate || !getCatalogItem(candidate.type)) return false;
  const fpA = getRotatedFootprint(candidate.type, candidate.rotation);
  const axMin = candidate.x - fpA.width / 2 + clearance;
  const axMax = candidate.x + fpA.width / 2 - clearance;
  const azMin = candidate.z - fpA.depth / 2 + clearance;
  const azMax = candidate.z + fpA.depth / 2 - clearance;

  for (const other of items) {
    if (!other || (ignoreId && String(other.id) === String(ignoreId))) continue;
    const fpB = getRotatedFootprint(other.type, other.rotation);
    const bxMin = other.x - fpB.width / 2 + clearance;
    const bxMax = other.x + fpB.width / 2 - clearance;
    const bzMin = other.z - fpB.depth / 2 + clearance;
    const bzMax = other.z + fpB.depth / 2 - clearance;

    const overlapX = axMin < bxMax && axMax > bxMin;
    const overlapZ = azMin < bzMax && azMax > bzMin;
    if (overlapX && overlapZ) {
      return true;
    }
  }

  if (walls && walls.length > 0 && checkItemWallCollision(candidate, walls)) {
    return true;
  }

  return false;
}

export function sanitizeRoom(rawRoom = {}) {
  const width = Math.round(
    clamp(Number(rawRoom?.width) || 14, ROOM_LIMITS.minWidth, ROOM_LIMITS.maxWidth)
  );
  const depth = Math.round(
    clamp(Number(rawRoom?.depth) || 10, ROOM_LIMITS.minDepth, ROOM_LIMITS.maxDepth)
  );
  const height = Number(
    clamp(Number(rawRoom?.height) || 3.4, ROOM_LIMITS.minHeight, ROOM_LIMITS.maxHeight).toFixed(1)
  );

  return {
    width,
    depth,
    height,
    floor: FLOOR_IDS.has(rawRoom?.floor) ? rawRoom.floor : 'slate-tile',
    wall: WALL_IDS.has(rawRoom?.wall) ? rawRoom.wall : 'charcoal',
    mood: MOOD_IDS.has(rawRoom?.mood) ? rawRoom.mood : 'esports',
    ledColor: LED_IDS.has(rawRoom?.ledColor) ? rawRoom.ledColor : 'auto',
    cutawayWalls: rawRoom?.cutawayWalls !== false,
  };
}

function sanitizeFloorItems(rawList, room) {
  const list = Array.isArray(rawList) ? rawList : [];
  const seenIds = new Set();
  const items = [];

  for (let idx = 0; idx < list.length && items.length < 160; idx++) {
    const entry = list[idx];
    if (!entry || typeof entry !== 'object') continue;
    const spec = getCatalogItem(entry.type);
    if (!spec) continue;

    let id = String(entry.id || `item-${idx + 1}`).slice(0, 48);
    if (seenIds.has(id)) id = `${id}-${idx}`;
    seenIds.add(id);

    const sanitizedItem = {
      id,
      type: String(entry.type),
      x: Number(entry.x) || 0,
      z: Number(entry.z) || 0,
      rotation: normalizeRotationDeg(entry.rotation),
      tableNumber: entry.tableNumber != null ? String(entry.tableNumber).trim().slice(0, 12) : '',
    };

    if (spec.isBilliard) {
      sanitizedItem.variant = FELT_IDS.has(entry.variant)
        ? entry.variant
        : spec.defaultVariant || 'classic-green';
    }
    if (entry.tint && TINT_IDS.has(entry.tint)) {
      sanitizedItem.tint = entry.tint;
    }

    items.push(clampItemToRoom(sanitizedItem, room, 0));
  }
  return items;
}

export function getDefaultFloorName(level = 0) {
  return FLOOR_LIMITS.defaultNames[level] || `طبقه ${level + 1}`;
}

export function createEmptyFloor(level = 0, baseRoom = null, name = null) {
  const room = sanitizeRoom(
    baseRoom || {
      width: 14,
      depth: 10,
      height: 3.4,
      floor: 'slate-tile',
      wall: 'charcoal',
      mood: 'esports',
      ledColor: 'auto',
      cutawayWalls: true,
    }
  );
  return {
    id: `floor-${level}-${Date.now().toString(36).slice(-4)}`,
    name: String(name || getDefaultFloorName(level)).trim().slice(0, 32),
    level,
    room,
    walls: [],
    items: [],
  };
}

export function syncActiveFloorAliases(layout) {
  if (!layout || !Array.isArray(layout.floors) || layout.floors.length === 0) return layout;
  const idx = clamp(Math.floor(Number(layout.activeFloorIndex) || 0), 0, layout.floors.length - 1);
  layout.activeFloorIndex = idx;
  const active = layout.floors[idx];
  layout.room = active.room;
  layout.walls = active.walls;
  layout.items = active.items;
  return layout;
}

export function getActiveFloor(layout) {
  if (!layout) return null;
  if (Array.isArray(layout.floors) && layout.floors.length > 0) {
    const idx = clamp(Math.floor(Number(layout.activeFloorIndex) || 0), 0, layout.floors.length - 1);
    return layout.floors[idx];
  }
  return {
    id: 'floor-0',
    name: getDefaultFloorName(0),
    level: 0,
    room: sanitizeRoom(layout.room),
    walls: Array.isArray(layout.walls) ? layout.walls : [],
    items: Array.isArray(layout.items) ? layout.items : [],
  };
}

/**
 * Computes the world-space Y elevation (top of floor slab) for any floor index.
 */
export function getFloorElevationY(floors = [], floorIndex = 0) {
  let y = 0;
  const safeIdx = clamp(Math.floor(Number(floorIndex) || 0), 0, Math.max(0, floors.length - 1));
  for (let i = 0; i < safeIdx; i++) {
    const h = Number(floors[i]?.room?.height) || 3.4;
    y += h + FLOOR_LIMITS.slabThickness;
  }
  return Number(y.toFixed(3));
}

export function addFloorToLayout(layout, options = {}) {
  const safe = sanitizeLayout(layout);
  if (safe.floors.length >= FLOOR_LIMITS.maxFloors) {
    return { ok: false, reason: 'max_floors', layout: safe, floorIndex: safe.activeFloorIndex };
  }
  const topFloor = safe.floors[safe.floors.length - 1];
  const nextLevel = safe.floors.length;
  const newFloor = createEmptyFloor(
    nextLevel,
    { ...topFloor.room, ...(options.room || {}) },
    options.name || getDefaultFloorName(nextLevel)
  );
  if (options.copyWalls && Array.isArray(topFloor.walls)) {
    newFloor.walls = topFloor.walls.map((w, idx) => ({
      ...w,
      id: `w-f${nextLevel}-${idx + 1}-${Date.now().toString(36).slice(-3)}`,
    }));
  }
  safe.floors.push(newFloor);
  safe.activeFloorIndex = nextLevel;
  syncActiveFloorAliases(safe);
  return { ok: true, layout: safe, floorIndex: nextLevel, floor: newFloor };
}

export function removeFloorFromLayout(layout, floorIndex) {
  const safe = sanitizeLayout(layout);
  if (safe.floors.length <= 1) {
    return { ok: false, reason: 'min_floors', layout: safe };
  }
  const idx = clamp(Math.floor(Number(floorIndex) || 0), 0, safe.floors.length - 1);
  safe.floors.splice(idx, 1);
  safe.floors.forEach((f, i) => {
    f.level = i;
  });
  safe.activeFloorIndex = clamp(safe.activeFloorIndex, 0, safe.floors.length - 1);
  syncActiveFloorAliases(safe);
  return { ok: true, layout: safe, activeFloorIndex: safe.activeFloorIndex };
}

export function setActiveFloorInLayout(layout, floorIndex) {
  if (!layout || !Array.isArray(layout.floors) || layout.floors.length === 0) return layout;
  layout.activeFloorIndex = clamp(Math.floor(Number(floorIndex) || 0), 0, layout.floors.length - 1);
  return syncActiveFloorAliases(layout);
}

export function renameFloorInLayout(layout, floorIndex, newName) {
  if (!layout || !Array.isArray(layout.floors)) return layout;
  const idx = clamp(Math.floor(Number(floorIndex) || 0), 0, layout.floors.length - 1);
  const cleaned = String(newName || '').trim().slice(0, 32);
  if (cleaned && layout.floors[idx]) {
    layout.floors[idx].name = cleaned;
  }
  return layout;
}

export function getAllLayoutItems(layout) {
  if (!layout) return [];
  if (Array.isArray(layout.floors) && layout.floors.length > 0) {
    const out = [];
    layout.floors.forEach((fl, floorIndex) => {
      const items = Array.isArray(fl?.items) ? fl.items : [];
      items.forEach((it) => {
        out.push({
          ...it,
          floorIndex,
          floorName: fl.name || getDefaultFloorName(floorIndex),
        });
      });
    });
    return out;
  }
  return (Array.isArray(layout.items) ? layout.items : []).map((it) => ({
    ...it,
    floorIndex: 0,
    floorName: getDefaultFloorName(0),
  }));
}

export function assignNextStationNumber(itemsOrLayout = [], type = '') {
  const spec = getCatalogItem(type);
  if (!spec || !spec.isStation) return '';
  const list = Array.isArray(itemsOrLayout)
    ? itemsOrLayout
    : getAllLayoutItems(itemsOrLayout);
  const used = new Set(
    list
      .map((i) => Number(i?.tableNumber))
      .filter((n) => Number.isFinite(n) && n > 0)
  );
  let next = 1;
  while (used.has(next)) next += 1;
  return String(next);
}

function wrapSingleFloorLayout(room, items = [], walls = [], floorName = 'طبقه همکف') {
  const safeRoom = sanitizeRoom(room);
  const safeWalls = sanitizeWalls(walls, safeRoom);
  const safeItems = items.map((it) => clampItemToRoom(it, safeRoom, 0));
  const floor = {
    id: 'floor-0',
    name: floorName,
    level: 0,
    room: safeRoom,
    walls: safeWalls,
    items: safeItems,
  };
  return syncActiveFloorAliases({
    version: 2,
    activeFloorIndex: 0,
    floors: [floor],
    room: safeRoom,
    walls: safeWalls,
    items: safeItems,
  });
}

/**
 * Generates curated, collision-free starter 3D Game Center layouts —
 * with 'empty' as the clean from-scratch canvas!
 */
export function createStarterLayout(preset = 'empty') {
  if (preset === 'empty') {
    return wrapSingleFloorLayout(
      {
        width: 14,
        depth: 10,
        height: 3.4,
        floor: 'slate-tile',
        wall: 'charcoal',
        mood: 'esports',
        ledColor: 'auto',
        cutawayWalls: true,
      },
      [],
      [],
      'طبقه همکف'
    );
  }

  if (preset === 'billiard-club') {
    const room = sanitizeRoom({
      width: 16,
      depth: 12,
      height: 3.6,
      floor: 'warm-wood',
      wall: 'brick-loft',
      mood: 'warm-club',
      ledColor: 'amber',
      cutawayWalls: true,
    });
    const rawItems = [
      { id: 'bp-1', type: 'billiard-pro', x: -3.5, z: -2.2, rotation: 0, tableNumber: '1', variant: 'tournament-blue' },
      { id: 'bv-2', type: 'billiard-vip', x: 2.2, z: -2.2, rotation: 0, tableNumber: '2', variant: 'vip-burgundy' },
      { id: 'bs-3', type: 'billiard-snooker', x: -1.8, z: 2.3, rotation: 0, tableNumber: '3', variant: 'classic-green' },
      { id: 'fb-4', type: 'foosball-table', x: 4.5, z: 2.4, rotation: 0, tableNumber: '4' },

      { id: 'cue-1', type: 'cue-rack', x: -6.8, z: -2.2, rotation: 90, tableNumber: '' },
      { id: 'trp-1', type: 'trophy-cabinet', x: -0.6, z: -5.4, rotation: 0, tableNumber: '' },
      { id: 'wtv-1', type: 'wall-tv-spectator', x: -4.2, z: -5.4, rotation: 0, tableNumber: '' },
      { id: 'neo-1', type: 'neon-sign-stand', x: 3.2, z: -5.4, rotation: 0, tableNumber: '', tint: 'amber' },
      { id: 'frd-1', type: 'vending-fridge', x: -7.1, z: 1.4, rotation: 90, tableNumber: '' },
      { id: 'rec-1', type: 'reception-counter', x: -5.8, z: 4.4, rotation: 180, tableNumber: '' },
      { id: 'sof-1', type: 'lounge-sofa', x: 6.2, z: -2.2, rotation: 270, tableNumber: '' },
      { id: 'ct-1', type: 'coffee-table', x: 4.9, z: -2.2, rotation: 90, tableNumber: '' },
      { id: 'pil-1', type: 'rgb-pillar', x: -7.2, z: -5.2, rotation: 0, tableNumber: '', tint: 'amber' },
      { id: 'pil-2', type: 'rgb-pillar', x: 7.2, z: -5.2, rotation: 0, tableNumber: '', tint: 'amber' },
      { id: 'plt-1', type: 'plant-pot', x: 7.0, z: 4.8, rotation: 0, tableNumber: '' },
    ];
    return wrapSingleFloorLayout(room, rawItems, []);
  }

  if (preset === 'compact') {
    const room = sanitizeRoom({
      width: 10,
      depth: 8,
      height: 3.2,
      floor: 'warm-wood',
      wall: 'wood-slat',
      mood: 'lounge',
      ledColor: 'auto',
      cutawayWalls: true,
    });
    const rawItems = [
      { id: 'st-1', type: 'ps5-lounge', x: -3.0, z: -3.4, rotation: 0, tableNumber: '1' },
      { id: 'sf-1', type: 'lounge-sofa', x: -3.0, z: -1.3, rotation: 180, tableNumber: '' },
      { id: 'st-2', type: 'ps4-station', x: 0.0, z: -3.4, rotation: 0, tableNumber: '2' },
      { id: 'sf-2', type: 'lounge-sofa', x: 0.0, z: -1.3, rotation: 180, tableNumber: '' },
      { id: 'st-3', type: 'pc-station', x: 3.8, z: -2.0, rotation: 270, tableNumber: '3' },
      { id: 'ch-3', type: 'gaming-chair', x: 2.9, z: -2.0, rotation: 90, tableNumber: '' },
      { id: 'st-4', type: 'pc-station', x: 3.8, z: 0.0, rotation: 270, tableNumber: '4' },
      { id: 'ch-4', type: 'gaming-chair', x: 2.9, z: 0.0, rotation: 90, tableNumber: '' },
      { id: 'rc-1', type: 'reception-counter', x: -2.8, z: 2.6, rotation: 180, tableNumber: '' },
      { id: 'fr-1', type: 'vending-fridge', x: 0.0, z: 2.9, rotation: 180, tableNumber: '' },
      { id: 'pl-1', type: 'plant-pot', x: -4.4, z: -3.4, rotation: 0, tableNumber: '' },
    ];
    return wrapSingleFloorLayout(room, rawItems, []);
  }

  // 'pro-arena' (14m x 10m flagship مترو گیم hall)
  const room = sanitizeRoom({
    width: 14,
    depth: 10,
    height: 3.5,
    floor: 'slate-tile',
    wall: 'hex-cyber',
    mood: 'esports',
    ledColor: 'auto',
    cutawayWalls: true,
  });

  const rawItems = [
    { id: 'ps5-1', type: 'ps5-lounge', x: -4.2, z: -4.4, rotation: 0, tableNumber: '1' },
    { id: 'ct-1', type: 'coffee-table', x: -4.2, z: -3.1, rotation: 0, tableNumber: '' },
    { id: 'sofa-1', type: 'lounge-sofa', x: -4.2, z: -1.9, rotation: 180, tableNumber: '' },

    { id: 'ps4-2', type: 'ps4-station', x: -1.4, z: -4.4, rotation: 0, tableNumber: '2' },
    { id: 'ct-2', type: 'coffee-table', x: -1.4, z: -3.1, rotation: 0, tableNumber: '' },
    { id: 'sofa-2', type: 'lounge-sofa', x: -1.4, z: -1.9, rotation: 180, tableNumber: '' },

    { id: 'ps4-3', type: 'ps4-station', x: 1.4, z: -4.4, rotation: 0, tableNumber: '3' },
    { id: 'ct-3', type: 'coffee-table', x: 1.4, z: -3.1, rotation: 0, tableNumber: '' },
    { id: 'sofa-3', type: 'lounge-sofa', x: 1.4, z: -1.9, rotation: 180, tableNumber: '' },

    { id: 'pc-4', type: 'pc-station', x: 5.9, z: -3.0, rotation: 270, tableNumber: '4' },
    { id: 'ch-4', type: 'gaming-chair', x: 4.9, z: -3.0, rotation: 90, tableNumber: '' },

    { id: 'pc-5', type: 'pc-station', x: 5.9, z: -1.0, rotation: 270, tableNumber: '5' },
    { id: 'ch-5', type: 'gaming-chair', x: 4.9, z: -1.0, rotation: 90, tableNumber: '' },

    { id: 'pc-6', type: 'pc-station', x: 5.9, z: 1.0, rotation: 270, tableNumber: '6' },
    { id: 'ch-6', type: 'gaming-chair', x: 4.9, z: 1.0, rotation: 90, tableNumber: '' },

    { id: 'div-1', type: 'neon-divider', x: 3.4, z: -2.0, rotation: 90, tableNumber: '' },

    { id: 'bil-7', type: 'billiard-table', x: 0.8, z: 2.3, rotation: 0, tableNumber: '7', variant: 'classic-green' },
    { id: 'foo-8', type: 'foosball-table', x: 4.5, z: 3.3, rotation: 0, tableNumber: '8' },

    { id: 'rec-1', type: 'reception-counter', x: -4.4, z: 2.8, rotation: 180, tableNumber: '' },
    { id: 'frd-1', type: 'vending-fridge', x: -6.3, z: 0.6, rotation: 90, tableNumber: '' },
    { id: 'trp-1', type: 'trophy-cabinet', x: -6.3, z: -1.8, rotation: 90, tableNumber: '' },
    { id: 'pil-1', type: 'rgb-pillar', x: -6.4, z: -4.4, rotation: 0, tableNumber: '' },
    { id: 'plt-2', type: 'plant-pot', x: 6.3, z: -4.3, rotation: 0, tableNumber: '' },
    { id: 'plt-3', type: 'plant-pot', x: -6.3, z: 3.8, rotation: 0, tableNumber: '' },
  ];

  return wrapSingleFloorLayout(room, rawItems, []);
}

/**
 * Validates and sanitizes a persisted layout object (supports both v1 single-floor and v2 multi-floor + walls).
 */
export function sanitizeLayout(raw) {
  if (!raw || typeof raw !== 'object') {
    return createStarterLayout('empty');
  }

  // Version 2 multi-floor format
  if (Array.isArray(raw.floors) && raw.floors.length > 0) {
    const floors = [];
    const seenFloorIds = new Set();

    for (let i = 0; i < raw.floors.length && floors.length < FLOOR_LIMITS.maxFloors; i++) {
      const f = raw.floors[i];
      if (!f || typeof f !== 'object') continue;
      const room = sanitizeRoom(f.room || raw.room || {});
      const walls = sanitizeWalls(f.walls, room);
      const items = sanitizeFloorItems(f.items, room);
      let id = String(f.id || `floor-${i}`).slice(0, 48);
      if (seenFloorIds.has(id)) id = `${id}-${i}`;
      seenFloorIds.add(id);

      floors.push({
        id,
        name: String(f.name || getDefaultFloorName(floors.length)).trim().slice(0, 32) || getDefaultFloorName(floors.length),
        level: floors.length,
        room,
        walls,
        items,
      });
    }

    if (floors.length === 0) {
      return createStarterLayout('empty');
    }

    const activeFloorIndex = clamp(
      Math.floor(Number(raw.activeFloorIndex) || 0),
      0,
      floors.length - 1
    );

    return syncActiveFloorAliases({
      version: 2,
      activeFloorIndex,
      floors,
      room: floors[activeFloorIndex].room,
      walls: floors[activeFloorIndex].walls,
      items: floors[activeFloorIndex].items,
    });
  }

  // Version 1 legacy single-floor format
  if (!raw.room) {
    return createStarterLayout('empty');
  }

  const room = sanitizeRoom(raw.room);
  const walls = sanitizeWalls(raw.walls, room);
  const items = sanitizeFloorItems(raw.items, room);

  return syncActiveFloorAliases({
    version: 2,
    activeFloorIndex: 0,
    floors: [
      {
        id: 'floor-0',
        name: getDefaultFloorName(0),
        level: 0,
        room,
        walls,
        items,
      },
    ],
    room,
    walls,
    items,
  });
}

export function summarizeLayoutStats(layout) {
  const safe = sanitizeLayout(layout);
  const activeFloor = getActiveFloor(safe);
  let stations = 0;
  let furniture = 0;
  let decor = 0;
  let totalItems = 0;
  let totalWalls = 0;
  let totalAreaSqm = 0;

  for (const fl of safe.floors) {
    totalAreaSqm += fl.room.width * fl.room.depth;
    totalWalls += fl.walls.length;
    totalItems += fl.items.length;
    for (const item of fl.items) {
      const spec = getCatalogItem(item.type);
      if (!spec) continue;
      if (spec.isStation) stations += 1;
      else if (spec.category === 'decor') decor += 1;
      else furniture += 1;
    }
  }

  return {
    areaSqm: activeFloor.room.width * activeFloor.room.depth,
    totalAreaSqm,
    floorCount: safe.floors.length,
    activeFloorIndex: safe.activeFloorIndex,
    activeFloorName: activeFloor.name,
    activeFloorItems: activeFloor.items.length,
    activeFloorWalls: activeFloor.walls.length,
    totalItems,
    totalWalls,
    stations,
    furniture,
    decor,
  };
}

/**
 * Computes a validated, room-clamped, grid-snapped target position when moving an existing item.
 * Optionally checks collision against drawn interior walls as well.
 */
export function moveItemToPoint(
  item,
  targetX,
  targetZ,
  room,
  allItems,
  gridStep = ROOM_LIMITS.gridStep,
  walls = []
) {
  if (!item || !getCatalogItem(item.type)) {
    return { ok: false, item: null, collides: true };
  }
  const candidate = clampItemToRoom(
    {
      ...item,
      x: Number(targetX) || 0,
      z: Number(targetZ) || 0,
    },
    room,
    gridStep
  );
  const collides = checkItemCollision(candidate, allItems, item.id, 0.08, walls);
  return {
    ok: !collides,
    item: candidate,
    collides,
  };
}

/**
 * Resolves 3D grid and mesh rendering parameters for solid vs wireframe view modes.
 */
export function resolveGridRenderStyle(renderMode = 'solid', floorId = 'slate-tile', gridSnap = true) {
  const mode = renderMode === 'wireframe' ? 'wireframe' : 'solid';
  const isWireframe = mode === 'wireframe';
  const isLightFloor = floorId === 'marble-light';

  if (isWireframe) {
    return {
      mode: 'wireframe',
      wireframe: true,
      gridVisible: true,
      majorOpacity: isLightFloor ? 0.88 : 0.85,
      minorOpacity: isLightFloor ? 0.42 : 0.36,
      showContactShadows: false,
    };
  }

  return {
    mode: 'solid',
    wireframe: false,
    gridVisible: Boolean(gridSnap),
    majorOpacity: isLightFloor ? 0.34 : 0.28,
    minorOpacity: isLightFloor ? 0.14 : 0.1,
    showContactShadows: true,
  };
}

/**
 * Maps 3D catalog station types directly to مترو گیم consoleType codes in data.json.
 */
export const STATION_TO_CONSOLE_TYPE = Object.freeze({
  'ps5-lounge': 'ps50',
  'ps4-station': 'ps4',
  'pc-station': 'computer',
  'vr-pod': 'jewelry',
  'vip-vr-booth': 'jewelry',
  'arcade-cabinet': 'ps4',
  'billiard-table': 'pool-table',
  'billiard-pro': 'pool-table',
  'billiard-vip': 'pool-table',
  'billiard-snooker': 'pool-table',
  'foosball-table': 'foosball',
});

/**
 * Extracts all playable stations (PC, PS5, PS4, VIP/VR, Arcade, Billiard variants, Foosball)
 * across ALL floors of a 3D layout, sorted naturally by tableNumber.
 */
export function extract3DStations(layout) {
  const items = getAllLayoutItems(layout);
  const seen = new Set();
  const stations = [];

  for (const item of items) {
    const spec = getCatalogItem(item?.type);
    if (!spec || !spec.isStation) continue;
    const tableNum = String(item?.tableNumber ?? '').trim();
    if (!tableNum || seen.has(tableNum)) continue;
    seen.add(tableNum);
    stations.push({
      id: String(item.id || `st-${tableNum}`),
      type: spec.type,
      name: spec.name,
      tableNumber: tableNum,
      consoleType: STATION_TO_CONSOLE_TYPE[spec.type] || spec.consoleType || 'ps50',
      accentColor: spec.accentColor,
      floorIndex: item.floorIndex ?? 0,
      floorName: item.floorName || getDefaultFloorName(item.floorIndex ?? 0),
    });
  }

  stations.sort((a, b) => {
    const na = Number(a.tableNumber);
    const nb = Number(b.tableNumber);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.tableNumber.localeCompare(b.tableNumber, 'fa');
  });

  return stations;
}

/**
 * Merges active reservations with all stations placed across all floors of the 3D floor plan
 * so every 3D PC, console, billiard, foosball, and VIP station appears inside the Tables section.
 */
export function mergeTablesWith3DStations(reservations = [], layout = null) {
  const activeList = Array.isArray(reservations) ? reservations : [];
  const stations3D = extract3DStations(layout);
  const stationByTable = new Map(stations3D.map((st) => [String(st.tableNumber), st]));

  const activeRows = activeList.map((res) => {
    const tKey = String(res?.tableNumber ?? '').trim();
    const match3D = stationByTable.get(tKey) || null;
    return {
      status: 'active',
      tableNumber: tKey,
      reservation: res,
      from3D: Boolean(match3D),
      station3D: match3D,
    };
  });

  const activeKeys = new Set(activeRows.map((r) => r.tableNumber));
  const idleRows = stations3D
    .filter((st) => !activeKeys.has(String(st.tableNumber)))
    .map((st) => ({
      status: 'idle',
      tableNumber: String(st.tableNumber),
      reservation: null,
      from3D: true,
      station3D: st,
    }));

  return {
    activeRows,
    idleRows,
    allRows: [...activeRows, ...idleRows],
    totalStations3D: stations3D.length,
  };
}

function padTwo(n) {
  return String(Math.max(0, Math.floor(n))).padStart(2, '0');
}

function formatHmsCompact(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0 ? `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}` : `${padTwo(m)}:${padTwo(s)}`;
}

/**
 * Computes the compact live timer text & status for floating overhead badges in the 3D scene.
 */
export function formatStationMiniTimer(
  reservation = null,
  clickTimeSec = null,
  finishTimeSec = null,
  nowSec = Math.floor(Date.now() / 1000)
) {
  if (!reservation) {
    return {
      text: 'آزاد',
      status: 'idle',
      isOccupied: false,
      seconds: 0,
    };
  }

  const isPre =
    reservation.prePayment === 'pre-payment' || reservation.paymentType === 'pre-payment';
  const now = Math.floor(Number(nowSec) || Date.now() / 1000);

  if (isPre) {
    const fin = Number(finishTimeSec);
    if (Number.isFinite(fin) && fin > 0) {
      const rem = fin - now;
      if (rem <= 0) {
        return { text: 'پایان وقت', status: 'expired', isOccupied: true, seconds: 0 };
      }
      return {
        text: formatHmsCompact(rem),
        status: rem <= 600 ? 'warning' : 'running',
        isOccupied: true,
        seconds: rem,
      };
    }
    return { text: 'آماده شروع', status: 'waiting', isOccupied: true, seconds: 0 };
  }

  const start = Number(clickTimeSec);
  if (Number.isFinite(start) && start > 0) {
    const elapsed = Math.max(0, now - start);
    return {
      text: formatHmsCompact(elapsed),
      status: 'running',
      isOccupied: true,
      seconds: elapsed,
    };
  }

  return { text: 'آماده شروع', status: 'waiting', isOccupied: true, seconds: 0 };
}
