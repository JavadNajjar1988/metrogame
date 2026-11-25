import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACK_GEOMETRY,
  BASE_LAP_SEC,
  sampleStadiumTrack,
  buildStadiumSvgPath,
  buildMilestoneTicks,
  computeRunnerPhysics,
  computeAnimatedProgress,
  assignRunnerLanes,
  formatDurationHMS,
  formatLapPace,
} from './track-engine.mjs';

test('sampleStadiumTrack forms a closed clockwise stadium loop starting at top-left finish line', () => {
  const start = sampleStadiumTrack(0, TRACK_GEOMETRY, 0);
  const end = sampleStadiumTrack(1, TRACK_GEOMETRY, 0);
  assert.equal(start.x, TRACK_GEOMETRY.leftCx);
  assert.equal(start.y, TRACK_GEOMETRY.cy - TRACK_GEOMETRY.radius);
  assert.equal(start.x, end.x);
  assert.equal(start.y, end.y);

  // Outer lane offset pushes runner outward (smaller y on top straightaway)
  const outer = sampleStadiumTrack(0, TRACK_GEOMETRY, 20);
  assert.equal(outer.y, TRACK_GEOMETRY.cy - (TRACK_GEOMETRY.radius + 20));

  // Right semicircle apex sits near rightCx + radius
  const quarterPoint = sampleStadiumTrack(0.35, TRACK_GEOMETRY, 0);
  assert.ok(quarterPoint.x > TRACK_GEOMETRY.rightCx);

  // SVG path builds cleanly
  const svgPath = buildStadiumSvgPath(TRACK_GEOMETRY, 0);
  assert.ok(svgPath.startsWith('M 210 48') && svgPath.endsWith('Z'));
});

test('buildMilestoneTicks generates 12 distinct perimeter ticks with strictly vertical straightaway ticks', () => {
  const ticks = buildMilestoneTicks(12, TRACK_GEOMETRY);
  assert.equal(ticks.length, 12);
  assert.equal(ticks[0].isStartFinish, true);
  assert.equal(ticks[1].isStartFinish, false);
  assert.equal(ticks[6].percent, 50);
  // Top straightaway ticks (index 1 & 2) must be strictly vertical (x1 === x2)
  assert.equal(ticks[1].x1, ticks[1].x2);
  assert.equal(ticks[2].x1, ticks[2].x2);
});

test('computeRunnerPhysics anchors 1-hour tables to real-time 60s/lap and gently scales shorter vs longer pre-payment durations', () => {
  const now = 1_795_400_000;
  const consoles = [{ name: 'ps50', one_player_price: 80000 }];

  const oneHourTable = computeRunnerPhysics(
    { tableNumber: '10', consoleType: 'ps50', priceType: 'one_player_price', prePayment: 'pre-payment', prePaymentCost: '80000' },
    { consoles, finishTimes: [{ tableNumber: '10', startTime: now - 15, finishTime: now + 3585 }] },
    now
  );

  const shortTable = computeRunnerPhysics(
    { tableNumber: '1', consoleType: 'ps50', priceType: 'one_player_price', prePayment: 'pre-payment', prePaymentCost: '20000' },
    { consoles, finishTimes: [{ tableNumber: '1', startTime: now - 300, finishTime: now + 600 }] },
    now
  );

  const longTable = computeRunnerPhysics(
    { tableNumber: '2', consoleType: 'ps50', priceType: 'one_player_price', prePayment: 'pre-payment', prePaymentCost: '160000' },
    { consoles, finishTimes: [{ tableNumber: '2', startTime: now - 1800, finishTime: now + 5400 }] },
    now
  );

  const endingSoonTable = computeRunnerPhysics(
    { tableNumber: '3', consoleType: 'ps50', priceType: 'one_player_price', prePayment: 'pre-payment', prePaymentCost: '80000' },
    { consoles, finishTimes: [{ tableNumber: '3', startTime: now - 3420, finishTime: now + 180 }] },
    now
  );

  const overdueTable = computeRunnerPhysics(
    { tableNumber: '4', consoleType: 'ps50', priceType: 'one_player_price', prePayment: 'pre-payment', prePaymentCost: '40000' },
    { consoles, finishTimes: [{ tableNumber: '4', startTime: now - 1900, finishTime: now - 100 }] },
    now
  );

  // Standard 1-hour table runs at exact real-time 60s per lap (15s elapsed => 0.25 of oval)
  assert.equal(BASE_LAP_SEC, 60);
  assert.equal(oneHourTable.lapDurationSec, 60);
  assert.equal(oneHourTable.speedMultiplier, 1);
  assert.equal(computeAnimatedProgress(oneHourTable, 0, 'live-run'), 0.25);
  assert.equal(computeAnimatedProgress(oneHourTable, 15, 'live-run'), 0.5);
  assert.equal(computeAnimatedProgress(oneHourTable, 45, 'live-run'), 0);
  assert.equal(formatLapPace(60), 'هر ۱ دقیقه یک دور');
  assert.equal(formatLapPace(45), 'هر 45 ثانیه یک دور');
  assert.equal(formatLapPace(77), 'هر 1 دقیقه و 17 ثانیه یک دور');

  // Short 15-min table runs brisker than 2-hour table, yet both stay calm (>= 35s/lap)
  assert.ok(shortTable.speedMultiplier > longTable.speedMultiplier);
  assert.ok(shortTable.lapDurationSec < longTable.lapDurationSec);
  assert.ok(shortTable.lapDurationSec >= 35 && longTable.lapDurationSec >= 70);
  assert.equal(shortTable.status, 'running');
  assert.equal(shortTable.progressPercent, 33);

  // Ending-soon (< 5 min left) enters gentle real-time urgency (30s..40s/lap)
  assert.equal(endingSoonTable.status, 'ending-soon');
  assert.ok(endingSoonTable.lapDurationSec >= 30 && endingSoonTable.lapDurationSec <= 40);

  // Overdue stops at 100% finish line
  assert.equal(overdueTable.status, 'overdue');
  assert.equal(overdueTable.progressPercent, 100);
  assert.equal(computeAnimatedProgress(overdueTable, 5, 'live-run'), 0.992);
});

test('computeRunnerPhysics handles post-payment exact 60s real-time laps, waiting tables, and buffet totals', () => {
  const now = 1_795_400_000;
  const consoles = [{ name: 'ps4', one_player_price: 60000 }];

  const runningPost = computeRunnerPhysics(
    { tableNumber: '5', consoleType: 'ps4', priceType: 'one_player_price', postPayment: 'post-payment' },
    {
      consoles,
      clickTimes: [{ tableNumber: '5', clickTime: now - 5400 }], // 1h 30m (exact multiple of 60s)
      buffetTemp: { '5': [{ title: 'نوشابه', unitPrice: 25000, quantity: 2 }] },
    },
    now
  );

  assert.equal(runningPost.status, 'running');
  assert.equal(runningPost.lapDurationSec, 60);
  assert.equal(runningPost.speedMultiplier, 1);
  assert.equal(computeAnimatedProgress(runningPost, 30, 'live-run'), 0.5);
  assert.equal(runningPost.lapsCompleted, 1);
  assert.equal(runningPost.progressPercent, 50);
  assert.equal(runningPost.liveGameCost, 90000);
  assert.equal(runningPost.buffetCount, 2);
  assert.equal(runningPost.buffetTotal, 50000);
  assert.equal(runningPost.grandTotal, 140000);

  const waitingPost = computeRunnerPhysics(
    { tableNumber: '6', consoleType: 'ps4', priceType: 'one_player_price', postPayment: 'post-payment' },
    { consoles, clickTimes: [] },
    now
  );

  assert.equal(waitingPost.status, 'waiting');
  assert.equal(waitingPost.speedMultiplier, 0);
  assert.equal(computeAnimatedProgress(waitingPost, 10, 'live-run'), 0.015);
  assert.equal(formatDurationHMS(5400), '01:30:00');
});

test('assignRunnerLanes separates overlapping runners into distinct radial lanes without moving well-spaced runners', () => {
  const crowded = [
    { tableNumber: '1', displayProgress: 0.5 },
    { tableNumber: '2', displayProgress: 0.51 },
    { tableNumber: '3', displayProgress: 0.52 },
    { tableNumber: '4', displayProgress: 0.1 },
  ];

  const spaced = assignRunnerLanes(crowded, 0.055, 20);
  assert.equal(spaced[0].laneOffset, 0);
  assert.equal(spaced[1].laneOffset, 20);
  assert.equal(spaced[2].laneOffset, -20);
  assert.equal(spaced[3].laneOffset, 0);
});
