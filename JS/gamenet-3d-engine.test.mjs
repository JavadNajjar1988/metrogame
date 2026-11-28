import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_CATALOG,
  WALL_FINISHES,
  FLOOR_FINISHES,
  LIGHTING_MOODS,
  LED_COLORS,
  BILLIARD_FELT_VARIANTS,
  getBilliardFeltVariant,
  resolveLedColorHex,
  resolveItemTintHex,
  getRotatedFootprint,
  clampItemToRoom,
  checkItemCollision,
  createStarterLayout,
  sanitizeLayout,
  assignNextStationNumber,
  summarizeLayoutStats,
  snapToGrid,
  moveItemToPoint,
  resolveGridRenderStyle,
  extract3DStations,
  mergeTablesWith3DStations,
  formatStationMiniTimer,
} from './gamenet-3d-engine.mjs';

test('getRotatedFootprint swaps width and depth cleanly on 90 and 270 degree rotations', () => {
  const base = getRotatedFootprint('billiard-table', 0);
  const rotated90 = getRotatedFootprint('billiard-table', 90);
  const rotated180 = getRotatedFootprint('billiard-table', 180);
  const rotated270 = getRotatedFootprint('billiard-table', -90);

  assert.equal(base.width, 2.6);
  assert.equal(base.depth, 1.45);
  assert.equal(rotated90.width, 1.45);
  assert.equal(rotated90.depth, 2.6);
  assert.equal(rotated180.width, 2.6);
  assert.equal(rotated270.width, 1.45);

  const snooker = getRotatedFootprint('billiard-snooker', 90);
  assert.equal(snooker.width, 1.75);
  assert.equal(snooker.depth, 3.2);
});

test('clampItemToRoom keeps furniture strictly within room walls and snaps to grid', () => {
  const room = { width: 10, depth: 8, height: 3.2 };
  const clamped = clampItemToRoom(
    { id: 'x1', type: 'billiard-table', x: 99, z: -99, rotation: 0 },
    room,
    0.5
  );
  // Half room width = 5 - 0.16 = 4.84; half billiard width = 1.3 -> maxX = 3.54
  assert.ok(clamped.x <= 3.55 && clamped.x >= 3.5);
  // Half room depth = 4 - 0.16 = 3.84; half billiard depth = 0.725 -> minZ = -3.115
  assert.ok(clamped.z >= -3.12 && clamped.z <= -3.1);
  assert.equal(snapToGrid(1.26, 0.5), 1.5);
  assert.equal(snapToGrid(1.24, 0.5), 1);
});

test('checkItemCollision detects overlaps and respects ignoreId and spacing', () => {
  const existing = [
    { id: 'a', type: 'pc-station', x: 0, z: 0, rotation: 0 },
    { id: 'b', type: 'billiard-table', x: 4, z: 0, rotation: 0 },
  ];

  assert.equal(checkItemCollision({ id: 'new', type: 'pc-station', x: 0.4, z: 0, rotation: 0 }, existing), true);
  assert.equal(checkItemCollision({ id: 'a', type: 'pc-station', x: 0.2, z: 0, rotation: 0 }, existing, 'a'), false);
  assert.equal(checkItemCollision({ id: 'new', type: 'gaming-chair', x: 0, z: 0.8, rotation: 0 }, existing), false);
});

test('expanded catalogs include wallpapers, multiple billiard styles, decorations, and collision-free starter layouts', () => {
  assert.ok(ITEM_CATALOG.length >= 24);
  assert.ok(WALL_FINISHES.length >= 8);
  assert.ok(FLOOR_FINISHES.length >= 6);
  assert.ok(LIGHTING_MOODS.length >= 5);
  assert.ok(LED_COLORS.length >= 6);
  assert.equal(BILLIARD_FELT_VARIANTS.length, 4);

  for (const preset of ['pro-arena', 'billiard-club', 'compact', 'empty']) {
    const layout = createStarterLayout(preset);
    const sanitized = sanitizeLayout(layout);
    assert.equal(sanitized.items.length, layout.items.length);

    for (const item of sanitized.items) {
      assert.equal(
        checkItemCollision(item, sanitized.items, item.id),
        false,
        `Starter preset "${preset}" has collision on item "${item.id}"`
      );
    }
  }

  const pro = createStarterLayout('pro-arena');
  const stats = summarizeLayoutStats(pro);
  assert.equal(stats.areaSqm, 140);
  assert.equal(stats.stations, 8);
  assert.equal(assignNextStationNumber(pro.items, 'pc-station'), '9');
  assert.equal(assignNextStationNumber(pro.items, 'plant-pot'), '');

  const club = createStarterLayout('billiard-club');
  const clubStations = extract3DStations(club);
  assert.equal(clubStations.length, 4);
  assert.equal(clubStations.filter((s) => s.consoleType === 'pool-table').length, 3);
});

test('sanitizeLayout preserves valid wallpapers, LED colors, billiard variants, and item tints while rejecting invalid values', () => {
  const fallback = sanitizeLayout(null);
  assert.equal(fallback.room.width, 14);
  assert.ok(fallback.items.length > 0);

  const cleaned = sanitizeLayout({
    room: {
      width: 999,
      depth: 2,
      floor: 'invalid-floor',
      wall: 'hex-cyber',
      mood: 'neon-club',
      ledColor: 'emerald',
    },
    items: [
      { id: 'ok', type: 'billiard-pro', x: 0, z: 0, rotation: 90, tableNumber: '12', variant: 'vip-burgundy' },
      { id: 'dec', type: 'neon-sign-stand', x: 2, z: 0, rotation: 0, tint: 'cyan' },
      { id: 'bad-tint', type: 'billiard-vip', x: -2, z: 0, rotation: 0, variant: 'nope', tint: 'hack' },
      { id: 'bad', type: 'nonexistent-item', x: 0, z: 0, rotation: 0 },
    ],
  });
  assert.equal(cleaned.room.width, 24);
  assert.equal(cleaned.room.depth, 6);
  assert.equal(cleaned.room.floor, 'slate-tile');
  assert.equal(cleaned.room.wall, 'hex-cyber');
  assert.equal(cleaned.room.mood, 'neon-club');
  assert.equal(cleaned.room.ledColor, 'emerald');
  assert.equal(cleaned.items.length, 3);
  assert.equal(cleaned.items[0].variant, 'vip-burgundy');
  assert.equal(cleaned.items[1].tint, 'cyan');
  assert.equal(cleaned.items[2].variant, 'vip-burgundy');
  assert.equal(cleaned.items[2].tint, undefined);

  assert.equal(getBilliardFeltVariant('luxury-black', 'billiard-table').feltHex, '#18181b');
  assert.equal(resolveLedColorHex('cyan', '#7c3aed'), '#06b6d4');
  assert.equal(resolveLedColorHex('auto', '#7c3aed'), '#7c3aed');
  assert.equal(resolveItemTintHex('crimson', '#7c3aed'), '#e11d48');
});

test('moveItemToPoint snaps to 3D grid, clamps to room walls, and rejects collisions', () => {
  const room = { width: 12, depth: 10, height: 3.4 };
  const stationA = { id: 'st-1', type: 'pc-station', x: -2, z: -2, rotation: 0, tableNumber: '1' };
  const stationB = { id: 'st-2', type: 'pc-station', x: 2, z: 2, rotation: 0, tableNumber: '2' };
  const items = [stationA, stationB];

  const moved = moveItemToPoint(stationA, 0.24, -0.76, room, items, 0.5);
  assert.equal(moved.ok, true);
  assert.equal(moved.collides, false);
  assert.equal(moved.item.x, 0);
  assert.equal(moved.item.z, -1);

  const blocked = moveItemToPoint(stationA, 2.1, 2.0, room, items, 0.5);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.collides, true);

  const clamped = moveItemToPoint(stationA, -50, -50, room, items, 0.5);
  assert.equal(clamped.ok, true);
  assert.ok(clamped.item.x >= -5.2 && clamped.item.z >= -4.5);
});

test('resolveGridRenderStyle switches cleanly between solid and wireframe 3D grid styles', () => {
  const solidSnapOn = resolveGridRenderStyle('solid', 'slate-tile', true);
  assert.equal(solidSnapOn.mode, 'solid');
  assert.equal(solidSnapOn.wireframe, false);
  assert.equal(solidSnapOn.gridVisible, true);
  assert.equal(solidSnapOn.showContactShadows, true);

  const solidSnapOff = resolveGridRenderStyle('solid', 'slate-tile', false);
  assert.equal(solidSnapOff.gridVisible, false);

  const wireSnapOff = resolveGridRenderStyle('wireframe', 'slate-tile', false);
  assert.equal(wireSnapOff.mode, 'wireframe');
  assert.equal(wireSnapOff.wireframe, true);
  assert.equal(wireSnapOff.gridVisible, true);
  assert.equal(wireSnapOff.showContactShadows, false);
  assert.ok(wireSnapOff.majorOpacity > solidSnapOn.majorOpacity);
  assert.ok(wireSnapOff.minorOpacity > solidSnapOn.minorOpacity);

  const wireLight = resolveGridRenderStyle('wireframe', 'marble-light', true);
  assert.ok(wireLight.majorOpacity >= 0.85);

  const fallback = resolveGridRenderStyle('unknown-mode', 'slate-tile', true);
  assert.equal(fallback.mode, 'solid');
  assert.equal(fallback.wireframe, false);
});

test('extract3DStations and mergeTablesWith3DStations map PC, consoles, billiard variants and foosball into Tables list', () => {
  const layout = createStarterLayout('pro-arena');
  const stations = extract3DStations(layout);
  assert.equal(stations.length, 8);
  assert.equal(stations.find((s) => s.tableNumber === '4')?.consoleType, 'computer');
  assert.equal(stations.find((s) => s.tableNumber === '7')?.consoleType, 'pool-table');
  assert.equal(stations.find((s) => s.tableNumber === '8')?.consoleType, 'foosball');

  const merged = mergeTablesWith3DStations(
    [{ tableNumber: '2', consoleType: 'ps4', priceType: 'one_player_price' }],
    layout
  );
  assert.equal(merged.activeRows.length, 1);
  assert.equal(merged.activeRows[0].from3D, true);
  assert.equal(merged.idleRows.length, 7);
  assert.equal(merged.allRows.length, 8);
  assert.ok(merged.idleRows.some((r) => r.tableNumber === '7' && r.station3D.consoleType === 'pool-table'));
});

test('formatStationMiniTimer computes accurate idle, waiting, running, warning, and expired states', () => {
  assert.equal(formatStationMiniTimer(null).status, 'idle');
  assert.equal(formatStationMiniTimer(null).text, 'آزاد');

  const postWaiting = formatStationMiniTimer({ tableNumber: '3', postPayment: 'post-payment' }, null, null, 10000);
  assert.equal(postWaiting.status, 'waiting');

  const postRunning = formatStationMiniTimer({ tableNumber: '2', postPayment: 'post-payment' }, 10000, null, 10000 + 3725);
  assert.equal(postRunning.status, 'running');
  assert.equal(postRunning.text, '01:02:05');

  const preWarning = formatStationMiniTimer({ tableNumber: '5', prePayment: 'pre-payment' }, null, 10000 + 300, 10000);
  assert.equal(preWarning.status, 'warning');
  assert.equal(preWarning.text, '05:00');

  const preExpired = formatStationMiniTimer({ tableNumber: '5', prePayment: 'pre-payment' }, null, 9990, 10000);
  assert.equal(preExpired.status, 'expired');
});
