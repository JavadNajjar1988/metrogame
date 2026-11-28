import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ITEM_CATALOG,
  WALL_FINISHES,
  WALL_STYLES,
  FLOOR_FINISHES,
  FLOOR_LIMITS,
  LIGHTING_MOODS,
  LED_COLORS,
  BILLIARD_FELT_VARIANTS,
  getBilliardFeltVariant,
  resolveLedColorHex,
  resolveItemTintHex,
  getRotatedFootprint,
  clampItemToRoom,
  checkItemCollision,
  checkItemWallCollision,
  snapWallEndpoint,
  createWallSegment,
  getWallMetrics,
  createStarterLayout,
  sanitizeLayout,
  addFloorToLayout,
  removeFloorFromLayout,
  setActiveFloorInLayout,
  renameFloorInLayout,
  getFloorElevationY,
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
  assert.ok(clamped.x <= 3.55 && clamped.x >= 3.5);
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

test('interior wall drawing snaps cleanly, rejects tiny walls, and collides with furniture while allowing doorway opening', () => {
  const room = { width: 14, depth: 10, height: 3.4 };
  assert.equal(WALL_STYLES.length, 4);

  // Ortho snap pulls nearly-horizontal line to exact horizontal
  const snappedH = snapWallEndpoint(-2, -1, 3.1, -0.7, room, { gridStep: 0.5, orthoSnap: true });
  assert.equal(snappedH.z, -1);
  assert.equal(snappedH.x, 3);

  // Rejects degenerate short segments (< 0.45m)
  assert.equal(createWallSegment(0, 0, 0.2, 0.1, room, 'full'), null);

  // Creates valid wall and computes metrics
  const wall = createWallSegment(-3, 0, 3, 0, room, 'full', 'w-1');
  assert.ok(wall);
  assert.equal(getWallMetrics(wall).length, 6);

  // Furniture placed across solid wall collides
  const pcOnWall = { id: 'p1', type: 'pc-station', x: 0, z: 0, rotation: 0 };
  assert.equal(checkItemWallCollision(pcOnWall, [wall]), true);

  // Furniture safely beside wall does not collide
  const pcClear = { id: 'p2', type: 'pc-station', x: 0, z: 1.5, rotation: 0 };
  assert.equal(checkItemWallCollision(pcClear, [wall]), false);

  // Doorway wall allows small item in center opening but blocks solid side jambs
  const doorWall = createWallSegment(-3, 0, 3, 0, room, 'doorway', 'w-door');
  const plantInOpening = { id: 'pl-1', type: 'plant-pot', x: 0, z: 0, rotation: 0 };
  const plantOnJamb = { id: 'pl-2', type: 'plant-pot', x: -2, z: 0, rotation: 0 };
  assert.equal(checkItemWallCollision(plantInOpening, [doorWall]), false);
  assert.equal(checkItemWallCollision(plantOnJamb, [doorWall]), true);
});

test('multi-floor management supports adding up to maxFloors, elevation stacking, renaming, removing, and cross-floor station sync', () => {
  const scratch = createStarterLayout('empty');
  assert.equal(scratch.version, 2);
  assert.equal(scratch.floors.length, 1);
  assert.equal(scratch.items.length, 0);
  assert.equal(scratch.walls.length, 0);

  // Place station #1 on ground floor
  scratch.floors[0].items.push({ id: 'g-1', type: 'ps5-lounge', x: -2, z: -2, rotation: 0, tableNumber: '1' });

  // Add floor 1
  const add1 = addFloorToLayout(scratch);
  assert.equal(add1.ok, true);
  assert.equal(add1.layout.floors.length, 2);
  assert.equal(add1.layout.activeFloorIndex, 1);
  assert.equal(add1.layout.floors[1].name, 'طبقه اول');

  // Elevation of floor 1 = ground height + slabThickness
  const expectedElev1 = Number((3.4 + FLOOR_LIMITS.slabThickness).toFixed(3));
  assert.equal(getFloorElevationY(add1.layout.floors, 1), expectedElev1);

  // Next auto station number scans ALL floors so floor 1 gets station #2
  const nextNum = assignNextStationNumber(add1.layout, 'pc-station');
  assert.equal(nextNum, '2');
  add1.layout.floors[1].items.push({ id: 'f1-2', type: 'pc-station', x: 1, z: 1, rotation: 0, tableNumber: nextNum });

  // Rename floor 1
  renameFloorInLayout(add1.layout, 1, 'طبقه VIP');
  assert.equal(add1.layout.floors[1].name, 'طبقه VIP');

  // Stations extracted across ALL floors with floor labels
  const allStations = extract3DStations(add1.layout);
  assert.equal(allStations.length, 2);
  assert.equal(allStations[0].tableNumber, '1');
  assert.equal(allStations[0].floorIndex, 0);
  assert.equal(allStations[1].tableNumber, '2');
  assert.equal(allStations[1].floorName, 'طبقه VIP');

  // Add up to maxFloors (4) and ensure 5th is rejected
  const add2 = addFloorToLayout(add1.layout);
  const add3 = addFloorToLayout(add2.layout);
  const add4 = addFloorToLayout(add3.layout);
  assert.equal(add3.ok, true);
  assert.equal(add3.layout.floors.length, FLOOR_LIMITS.maxFloors);
  assert.equal(add4.ok, false);

  // Switch active floor and verify top-level aliases sync cleanly
  setActiveFloorInLayout(add3.layout, 0);
  assert.equal(add3.layout.items.length, 1);
  assert.equal(add3.layout.items[0].id, 'g-1');

  // Remove floors cleanly down to 1, and block deleting the last remaining floor
  let cur = add3.layout;
  cur = removeFloorFromLayout(cur, 3).layout;
  cur = removeFloorFromLayout(cur, 2).layout;
  cur = removeFloorFromLayout(cur, 1).layout;
  assert.equal(cur.floors.length, 1);
  assert.equal(removeFloorFromLayout(cur, 0).ok, false);
});

test('expanded catalogs include wallpapers, staircase, multiple billiard styles, decorations, and collision-free starter layouts', () => {
  assert.ok(ITEM_CATALOG.length >= 25);
  assert.ok(ITEM_CATALOG.some((i) => i.type === 'stairs-modern'));
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

test('sanitizeLayout migrates legacy v1 layouts, defaults null to blank scratch room, and validates fields', () => {
  const fallback = sanitizeLayout(null);
  assert.equal(fallback.version, 2);
  assert.equal(fallback.room.width, 14);
  assert.equal(fallback.items.length, 0);
  assert.equal(fallback.floors.length, 1);

  const cleaned = sanitizeLayout({
    room: {
      width: 999,
      depth: 2,
      floor: 'invalid-floor',
      wall: 'hex-cyber',
      mood: 'neon-club',
      ledColor: 'emerald',
    },
    walls: [
      { id: 'w1', x1: -2, z1: -2, x2: 2, z2: -2, style: 'glass' },
      { id: 'w-bad', x1: 0, z1: 0, x2: 0.1, z2: 0, style: 'full' },
    ],
    items: [
      { id: 'ok', type: 'billiard-pro', x: 0, z: 0, rotation: 90, tableNumber: '12', variant: 'vip-burgundy' },
      { id: 'dec', type: 'neon-sign-stand', x: 2, z: 0, rotation: 0, tint: 'cyan' },
      { id: 'bad-tint', type: 'billiard-vip', x: -2, z: 0, rotation: 0, variant: 'nope', tint: 'hack' },
      { id: 'bad', type: 'nonexistent-item', x: 0, z: 0, rotation: 0 },
    ],
  });
  assert.equal(cleaned.version, 2);
  assert.equal(cleaned.room.width, 24);
  assert.equal(cleaned.room.depth, 6);
  assert.equal(cleaned.room.floor, 'slate-tile');
  assert.equal(cleaned.room.wall, 'hex-cyber');
  assert.equal(cleaned.room.mood, 'neon-club');
  assert.equal(cleaned.room.ledColor, 'emerald');
  assert.equal(cleaned.walls.length, 1);
  assert.equal(cleaned.walls[0].style, 'glass');
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

test('moveItemToPoint snaps to 3D grid, clamps to room walls, and rejects collisions with items or walls', () => {
  const room = { width: 12, depth: 10, height: 3.4 };
  const stationA = { id: 'st-1', type: 'pc-station', x: -2, z: -2, rotation: 0, tableNumber: '1' };
  const stationB = { id: 'st-2', type: 'pc-station', x: 2, z: 2, rotation: 0, tableNumber: '2' };
  const items = [stationA, stationB];
  const walls = [createWallSegment(-4, 0, 4, 0, room, 'full', 'w-mid')];

  const moved = moveItemToPoint(stationA, 0.24, -1.76, room, items, 0.5, walls);
  assert.equal(moved.ok, true);
  assert.equal(moved.collides, false);
  assert.equal(moved.item.x, 0);
  assert.equal(moved.item.z, -2);

  const blockedByItem = moveItemToPoint(stationA, 2.1, 2.0, room, items, 0.5, walls);
  assert.equal(blockedByItem.ok, false);
  assert.equal(blockedByItem.collides, true);

  const blockedByWall = moveItemToPoint(stationA, 0, 0, room, items, 0.5, walls);
  assert.equal(blockedByWall.ok, false);
  assert.equal(blockedByWall.collides, true);

  const clamped = moveItemToPoint(stationA, -50, -50, room, items, 0.5, walls);
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
