/**
 * Pure 3D Game Center Builder domain engine:
 * - Room dimensions, floor/wall/lighting catalogs
 * - 13-item gaming equipment & furniture catalog with physical footprints
 * - Grid snapping, room boundary clamping, 90-degree footprint rotation
 * - AABB collision detection & starter arena layouts
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

export const FLOOR_FINISHES = Object.freeze([
  { id: 'slate-tile', label: 'سرامیک تیره', color: '#1c2230', secondary: '#262f42' },
  { id: 'warm-wood', label: 'پارکت چوب', color: '#5c402c', secondary: '#483121' },
  { id: 'arena-carpet', label: 'موکت سالن', color: '#191c2b', secondary: '#22263a' },
  { id: 'marble-light', label: 'سنگ روشن', color: '#d6dbe4', secondary: '#c5ccd8' },
]);

export const WALL_FINISHES = Object.freeze([
  { id: 'charcoal', label: 'پنل زغالی', color: '#1a1f2c', trim: '#2b3347' },
  { id: 'concrete', label: 'بتن مدرن', color: '#454c59', trim: '#323842' },
  { id: 'midnight', label: 'سرمه‌ای شب', color: '#141c33', trim: '#202c4d' },
  { id: 'ivory', label: 'سفید گرم', color: '#e6e4de', trim: '#cbc7be' },
]);

export const LIGHTING_MOODS = Object.freeze([
  { id: 'esports', label: 'گیمینگ' },
  { id: 'daylight', label: 'نور روز' },
  { id: 'lounge', label: 'لانژ شبانه' },
]);

export const CATALOG_CATEGORIES = Object.freeze([
  { id: 'all', label: 'همه' },
  { id: 'systems', label: 'سیستم و کنسول' },
  { id: 'furniture', label: 'میز و صندلی' },
  { id: 'arcade', label: 'بازی سالنی' },
  { id: 'decor', label: 'بوفه و دکور' },
]);

export const ITEM_CATALOG = Object.freeze([
  {
    type: 'pc-station',
    name: 'سیستم گیمینگ PC',
    shortName: 'PC',
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
    shortName: 'VR',
    category: 'systems',
    width: 2.1,
    depth: 2.1,
    height: 2.1,
    isStation: true,
    consoleType: 'jewelry',
    accentColor: '#10b981',
  },
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
  {
    type: 'billiard-table',
    name: 'میز بیلیارد',
    shortName: 'بیلیارد',
    category: 'arcade',
    width: 2.6,
    depth: 1.45,
    height: 0.85,
    isStation: true,
    consoleType: 'pool-table',
    accentColor: '#059669',
  },
  {
    type: 'foosball-table',
    name: 'فوتبال دستی',
    shortName: 'فوتبال',
    category: 'arcade',
    width: 1.5,
    depth: 1.1,
    height: 0.92,
    isStation: true,
    consoleType: 'foosball',
    accentColor: '#16a34a',
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
const MOOD_IDS = new Set(LIGHTING_MOODS.map((m) => m.id));

export function getCatalogItem(type) {
  return CATALOG_MAP.get(String(type)) || null;
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
 * Axis-aligned bounding-box overlap check on the floor plane (X/Z).
 * Uses a small clearance allowance (0.08m) so chairs tuck neatly near desks.
 */
export function checkItemCollision(candidate, items = [], ignoreId = null, clearance = 0.08) {
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
    cutawayWalls: rawRoom?.cutawayWalls !== false,
  };
}

export function assignNextStationNumber(items = [], type = '') {
  const spec = getCatalogItem(type);
  if (!spec || !spec.isStation) return '';
  const used = new Set(
    items
      .map((i) => Number(i?.tableNumber))
      .filter((n) => Number.isFinite(n) && n > 0)
  );
  let next = 1;
  while (used.has(next)) next += 1;
  return String(next);
}

/**
 * Generates curated, collision-free starter 3D Game Center layouts.
 */
export function createStarterLayout(preset = 'pro-arena') {
  if (preset === 'empty') {
    return {
      version: 1,
      room: sanitizeRoom({
        width: 12,
        depth: 10,
        height: 3.4,
        floor: 'slate-tile',
        wall: 'charcoal',
        mood: 'esports',
        cutawayWalls: true,
      }),
      items: [],
    };
  }

  if (preset === 'compact') {
    const room = sanitizeRoom({
      width: 10,
      depth: 8,
      height: 3.2,
      floor: 'warm-wood',
      wall: 'charcoal',
      mood: 'lounge',
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
      { id: 'pl-1', type: 'plant-pot', x: -4.4, z: -3.4, rotation: 0, tableNumber: '' },
    ];
    return {
      version: 1,
      room,
      items: rawItems.map((it) => clampItemToRoom(it, room, 0)),
    };
  }

  // Default 'pro-arena' (14m x 10m flagship Game District hall)
  const room = sanitizeRoom({
    width: 14,
    depth: 10,
    height: 3.5,
    floor: 'slate-tile',
    wall: 'charcoal',
    mood: 'esports',
    cutawayWalls: true,
  });

  const rawItems = [
    // North wall: 3 Console TV Lounges (PS5 + PS4) with sofas & coffee tables
    { id: 'ps5-1', type: 'ps5-lounge', x: -4.2, z: -4.4, rotation: 0, tableNumber: '1' },
    { id: 'ct-1', type: 'coffee-table', x: -4.2, z: -3.1, rotation: 0, tableNumber: '' },
    { id: 'sofa-1', type: 'lounge-sofa', x: -4.2, z: -1.9, rotation: 180, tableNumber: '' },

    { id: 'ps4-2', type: 'ps4-station', x: -1.4, z: -4.4, rotation: 0, tableNumber: '2' },
    { id: 'ct-2', type: 'coffee-table', x: -1.4, z: -3.1, rotation: 0, tableNumber: '' },
    { id: 'sofa-2', type: 'lounge-sofa', x: -1.4, z: -1.9, rotation: 180, tableNumber: '' },

    { id: 'ps4-3', type: 'ps4-station', x: 1.4, z: -4.4, rotation: 0, tableNumber: '3' },
    { id: 'ct-3', type: 'coffee-table', x: 1.4, z: -3.1, rotation: 0, tableNumber: '' },
    { id: 'sofa-3', type: 'lounge-sofa', x: 1.4, z: -1.9, rotation: 180, tableNumber: '' },

    // East Esports PC Zone (3 back-to-wall PC stations + gaming chairs)
    { id: 'pc-4', type: 'pc-station', x: 5.9, z: -3.0, rotation: 270, tableNumber: '4' },
    { id: 'ch-4', type: 'gaming-chair', x: 4.9, z: -3.0, rotation: 90, tableNumber: '' },

    { id: 'pc-5', type: 'pc-station', x: 5.9, z: -1.0, rotation: 270, tableNumber: '5' },
    { id: 'ch-5', type: 'gaming-chair', x: 4.9, z: -1.0, rotation: 90, tableNumber: '' },

    { id: 'pc-6', type: 'pc-station', x: 5.9, z: 1.0, rotation: 270, tableNumber: '6' },
    { id: 'ch-6', type: 'gaming-chair', x: 4.9, z: 1.0, rotation: 90, tableNumber: '' },

    // Neon divider separating Esports PCs from lounge
    { id: 'div-1', type: 'neon-divider', x: 3.4, z: -2.0, rotation: 90, tableNumber: '' },

    // Center-South Arcade Zone: Billiard & Foosball
    { id: 'bil-7', type: 'billiard-table', x: 0.8, z: 2.3, rotation: 0, tableNumber: '7' },
    { id: 'foo-8', type: 'foosball-table', x: 4.5, z: 3.3, rotation: 0, tableNumber: '8' },

    // West Reception & Buffet Counter + Decorative Plants
    { id: 'rec-1', type: 'reception-counter', x: -4.4, z: 2.8, rotation: 180, tableNumber: '' },
    { id: 'plt-1', type: 'plant-pot', x: -6.3, z: -4.3, rotation: 0, tableNumber: '' },
    { id: 'plt-2', type: 'plant-pot', x: 6.3, z: -4.3, rotation: 0, tableNumber: '' },
    { id: 'plt-3', type: 'plant-pot', x: -6.3, z: 3.8, rotation: 0, tableNumber: '' },
  ];

  return {
    version: 1,
    room,
    items: rawItems.map((it) => clampItemToRoom(it, room, 0)),
  };
}

/**
 * Validates and sanitizes a persisted layout object loaded from gamenet_layout.json.
 */
export function sanitizeLayout(raw) {
  if (!raw || typeof raw !== 'object' || !raw.room) {
    return createStarterLayout('pro-arena');
  }

  const room = sanitizeRoom(raw.room);
  const rawList = Array.isArray(raw.items) ? raw.items : [];
  const seenIds = new Set();
  const items = [];

  for (let idx = 0; idx < rawList.length && items.length < 160; idx++) {
    const entry = rawList[idx];
    if (!entry || typeof entry !== 'object') continue;
    if (!getCatalogItem(entry.type)) continue;

    let id = String(entry.id || `item-${idx + 1}`).slice(0, 48);
    if (seenIds.has(id)) id = `${id}-${idx}`;
    seenIds.add(id);

    const clamped = clampItemToRoom(
      {
        id,
        type: String(entry.type),
        x: Number(entry.x) || 0,
        z: Number(entry.z) || 0,
        rotation: normalizeRotationDeg(entry.rotation),
        tableNumber: entry.tableNumber != null ? String(entry.tableNumber).trim().slice(0, 12) : '',
      },
      room,
      0
    );
    items.push(clamped);
  }

  return {
    version: 1,
    room,
    items,
  };
}

export function summarizeLayoutStats(layout) {
  const safe = sanitizeLayout(layout);
  let stations = 0;
  let furniture = 0;
  let decor = 0;

  for (const item of safe.items) {
    const spec = getCatalogItem(item.type);
    if (!spec) continue;
    if (spec.isStation) stations += 1;
    else if (spec.category === 'decor') decor += 1;
    else furniture += 1;
  }

  return {
    areaSqm: safe.room.width * safe.room.depth,
    totalItems: safe.items.length,
    stations,
    furniture,
    decor,
  };
}

/**
 * Computes a validated, room-clamped, grid-snapped target position when moving an existing item.
 * Returns { ok, item, collides } without mutating the input array.
 */
export function moveItemToPoint(item, targetX, targetZ, room, allItems, gridStep = ROOM_LIMITS.gridStep) {
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
  const collides = checkItemCollision(candidate, allItems, item.id);
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
 * Maps 3D catalog station types directly to Game District consoleType codes in data.json.
 */
export const STATION_TO_CONSOLE_TYPE = Object.freeze({
  'ps5-lounge': 'ps50',
  'ps4-station': 'ps4',
  'pc-station': 'computer',
  'vip-vr-booth': 'jewelry',
  'billiard-table': 'pool-table',
  'foosball-table': 'foosball',
});

/**
 * Extracts all playable stations (PC, PS5, PS4, VIP/VR, Billiard, Foosball) from a 3D layout,
 * sorted naturally by tableNumber.
 */
export function extract3DStations(layout) {
  const items = Array.isArray(layout?.items) ? layout.items : [];
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
      consoleType: STATION_TO_CONSOLE_TYPE[spec.type] || 'ps50',
      accentColor: spec.accentColor,
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
 * Merges active reservations with all stations placed in the 3D floor plan so every
 * 3D PC, console, billiard, foosball, and VIP station appears inside the Tables section.
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
 * Computes the compact live timer text & status for floating overhead mini-timers in the 3D scene.
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



