/**
 * Pure oval stadium track geometry, runner speed physics, lane de-collision,
 * and live session cost calculations for the Game District Home Arena Track.
 * Zero DOM dependencies — 100% unit-testable via node:test.
 */

export const TRACK_GEOMETRY = Object.freeze({
  width: 820,
  height: 320,
  leftCx: 210,
  rightCx: 610,
  cy: 160,
  radius: 112,
  laneStep: 20,
});

export const BASE_LAP_SEC = 60;

export const PRICE_TYPE_LABELS = Object.freeze({
  one_player_price: 'تک نفره',
  two_player_price: 'دو نفره',
  three_player_price: 'سه نفره',
  four_player_price: 'چهار نفره',
});

export const CONSOLE_DISPLAY_NAMES = Object.freeze({
  ps50: 'پلی‌استیشن ۵',
  ps4: 'پلی‌استیشن ۴',
  xbox: 'ایکس‌باکس',
  computer: 'سیستم PC',
  'pool-table': 'بیلیارد',
  foosball: 'فوتبال دستی',
  jewelry: 'اتاق VIP / VR',
});

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeProgress(progress) {
  if (!Number.isFinite(progress)) return 0;
  const mod = progress % 1;
  return mod < 0 ? mod + 1 : mod;
}

export function circularDistance(a, b) {
  const diff = Math.abs(normalizeProgress(a) - normalizeProgress(b));
  return Math.min(diff, 1 - diff);
}

/**
 * Uniform arc-length sampling along a stadium (pill-shaped) oval track.
 * Progress 0 starts at the top-left start/finish line and moves clockwise:
 *   Top straight -> Right semicircle -> Bottom straight -> Left semicircle -> Start/Finish
 */
export function sampleStadiumTrack(progress, geometry = TRACK_GEOMETRY, laneOffset = 0) {
  const { width, height, leftCx, rightCx, cy, radius } = geometry;
  const r = Math.max(24, radius);
  const straight = Math.max(10, rightCx - leftCx);
  const arcLen = Math.PI * r;
  const perimeter = 2 * straight + 2 * arcLen;

  const p = normalizeProgress(progress);
  const s = p * perimeter;

  let bx = leftCx;
  let by = cy - r;
  let nx = 0;
  let ny = -1;
  let angleRad = 0;
  let segment = 'top';

  if (s < straight) {
    // Top straightaway: leftCx -> rightCx (outward normal points straight up: 0, -1)
    bx = leftCx + s;
    by = cy - r;
    nx = 0;
    ny = -1;
    angleRad = 0;
    segment = 'top';
  } else if (s < straight + arcLen) {
    // Right semicircle: -PI/2 -> +PI/2 (outward normal is cos(theta), sin(theta))
    const theta = -Math.PI / 2 + (s - straight) / r;
    nx = Math.cos(theta);
    ny = Math.sin(theta);
    bx = rightCx + r * nx;
    by = cy + r * ny;
    angleRad = theta + Math.PI / 2;
    segment = 'right';
  } else if (s < 2 * straight + arcLen) {
    // Bottom straightaway: rightCx -> leftCx (outward normal points straight down: 0, +1)
    const d = s - (straight + arcLen);
    bx = rightCx - d;
    by = cy + r;
    nx = 0;
    ny = 1;
    angleRad = Math.PI;
    segment = 'bottom';
  } else {
    // Left semicircle: +PI/2 -> +3PI/2 (outward normal is cos(theta), sin(theta))
    const theta = Math.PI / 2 + (s - (2 * straight + arcLen)) / r;
    nx = Math.cos(theta);
    ny = Math.sin(theta);
    bx = leftCx + r * nx;
    by = cy + r * ny;
    angleRad = theta + Math.PI / 2;
    segment = 'left';
  }

  const x = bx + nx * laneOffset;
  const y = by + ny * laneOffset;

  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
    xPct: Number(((x / width) * 100).toFixed(4)),
    yPct: Number(((y / height) * 100).toFixed(4)),
    nx: Number(nx.toFixed(4)),
    ny: Number(ny.toFixed(4)),
    angleDeg: Number(((angleRad * 180) / Math.PI).toFixed(2)),
    segment,
    perimeter: Number(perimeter.toFixed(2)),
  };
}

/**
 * Generates an SVG path string for a stadium oval at a given radial offset.
 */
export function buildStadiumSvgPath(geometry = TRACK_GEOMETRY, laneOffset = 0) {
  const { leftCx, rightCx, cy, radius } = geometry;
  const r = Math.max(24, radius + laneOffset);
  return [
    `M ${leftCx} ${cy - r}`,
    `L ${rightCx} ${cy - r}`,
    `A ${r} ${r} 0 0 1 ${rightCx} ${cy + r}`,
    `L ${leftCx} ${cy + r}`,
    `A ${r} ${r} 0 0 1 ${leftCx} ${cy - r}`,
    'Z',
  ].join(' ');
}

/**
 * Builds 12 evenly-spaced milestone markers around the oval perimeter,
 * matching the stadium checkpoint ticks & inner labels (1..12).
 */
export function buildMilestoneTicks(count = 12, geometry = TRACK_GEOMETRY) {
  const total = Math.max(4, Math.floor(count));
  const ticks = [];
  for (let i = 0; i < total; i++) {
    const progress = i / total;
    const innerEdge = sampleStadiumTrack(progress, geometry, -22);
    const outerEdge = sampleStadiumTrack(progress, geometry, 6);
    const labelPt = sampleStadiumTrack(progress, geometry, -44);
    const percent = Math.round(progress * 100);
    ticks.push({
      index: i,
      stepNumber: i + 1,
      progress,
      percent,
      isStartFinish: i === 0,
      x1: innerEdge.x,
      y1: innerEdge.y,
      x2: outerEdge.x,
      y2: outerEdge.y,
      labelX: labelPt.x,
      labelY: labelPt.y,
    });
  }
  return ticks;
}

export function resolveHourlyPrice(consoles, consoleType, priceType) {
  const list = Array.isArray(consoles) ? consoles : [];
  const found = list.find((c) => c && c.name === consoleType);
  const rate = found ? Number(found[priceType]) : 0;
  return Number.isFinite(rate) && rate > 0 ? rate : 60000;
}

export function computeTableBuffetSummary(buffetTemp, tableNumber) {
  const key = String(tableNumber);
  let items = [];
  if (Array.isArray(buffetTemp)) {
    items = buffetTemp.filter((item) => item && String(item.tableNumber) === key);
  } else if (buffetTemp && typeof buffetTemp === 'object' && Array.isArray(buffetTemp[key])) {
    items = buffetTemp[key];
  }

  let count = 0;
  let total = 0;
  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unit = Math.max(0, Number(item.unitPrice) || 0);
    count += qty;
    total += qty * unit;
  }
  return { count, total, items };
}

/**
 * Computes full live track physics, progress, real-time lap cadence, and cost
 * for a single active table reservation.
 *
 * Real-time speed principle (BASE_LAP_SEC = 60s => 1 full lap per real minute):
 *  - Post-payment & standard 1-hour pre-payment => exactly 60s per lap (1.0x real-time clock).
 *  - Shorter registered time => gently brisker (e.g., 30m -> ~47s/lap, 15m -> ~37s/lap).
 *  - Longer registered time => gently calmer (e.g., 2h -> ~77s/lap, 3h -> ~88s/lap).
 *  - Ending soon (<= 5m left) => smooth urgency (30s..40s/lap).
 *  - Waiting (unstarted) => parked at start line (speedMultiplier = 0).
 *  - Overdue (pre-payment reached 0) => parked at finish line awaiting settlement.
 */
export function computeRunnerPhysics(reservation, context = {}, nowSec = Math.floor(Date.now() / 1000)) {
  const tableNumber = String(reservation?.tableNumber ?? '');
  const consoleType = String(reservation?.consoleType ?? 'ps4');
  const priceType = String(reservation?.priceType ?? 'one_player_price');
  const isPrePayment =
    reservation?.prePayment === 'pre-payment' || reservation?.paymentType === 'pre-payment';
  const paymentMode = isPrePayment ? 'pre-payment' : 'post-payment';
  const hourlyPrice = resolveHourlyPrice(context.consoles, consoleType, priceType);
  const prePaymentCost = Math.max(0, Number(reservation?.prePaymentCost) || 0);

  const clickTimes = Array.isArray(context.clickTimes) ? context.clickTimes : [];
  const finishTimes = Array.isArray(context.finishTimes) ? context.finishTimes : [];

  const clickEntry = clickTimes.find((c) => c && String(c.tableNumber) === tableNumber);
  const finishEntry = finishTimes.find((f) => f && String(f.tableNumber) === tableNumber);

  const buffet = computeTableBuffetSummary(context.buffetTemp, tableNumber);

  let status = 'waiting';
  let elapsedSec = 0;
  let remainingSec = 0;
  let totalSec = 0;
  let lapsCompleted = 0;
  let trueProgress = 0;
  let speedMultiplier = 0;
  let lapDurationSec = 0;
  let liveGameCost = 0;
  let startTime = 0;
  let finishTime = 0;

  if (isPrePayment) {
    const plannedSec =
      prePaymentCost > 0 ? Math.max(300, Math.round((prePaymentCost / hourlyPrice) * 3600)) : 3600;

    if (finishEntry && Number(finishEntry.finishTime) > 0) {
      finishTime = Number(finishEntry.finishTime);
      startTime = Number(finishEntry.startTime) > 0 ? Number(finishEntry.startTime) : finishTime - plannedSec;
      totalSec = Math.max(60, finishTime - startTime);
      elapsedSec = Math.max(0, nowSec - startTime);
      remainingSec = Math.max(0, finishTime - nowSec);
      trueProgress = clamp(elapsedSec / totalSec, 0, 1);

      liveGameCost = Math.round(((totalSec / 3600) * hourlyPrice) / 1000) * 1000;
      if (liveGameCost <= 0) liveGameCost = prePaymentCost || Math.round(hourlyPrice);

      if (remainingSec <= 0) {
        status = 'overdue';
        trueProgress = 1;
        speedMultiplier = 0;
        lapDurationSec = 0;
      } else if (remainingSec <= 300) {
        status = 'ending-soon';
        // Gentle real-time urgency as finish approaches (<= 5 min): 40s/lap -> 30s/lap
        const urgency = 1.5 + (1 - remainingSec / 300) * 0.5;
        speedMultiplier = Number(clamp(urgency, 1.5, 2.0).toFixed(2));
        lapDurationSec = Math.round(BASE_LAP_SEC / speedMultiplier);
      } else {
        status = 'running';
        // Real-time baseline: 60m => 1.0x (60s/lap = 1 full lap per real minute).
        // Shorter duration => gently faster (15m => ~37s/lap, 30m => ~47s/lap).
        // Longer duration => gently calmer (2h => ~77s/lap, 3h => ~88s/lap).
        const durationRatio = 3600 / Math.max(600, totalSec);
        const rawSpeed = Math.pow(durationRatio, 0.35);
        speedMultiplier = Number(clamp(rawSpeed, 0.65, 1.7).toFixed(2));
        lapDurationSec = Math.round(BASE_LAP_SEC / speedMultiplier);
      }
    } else {
      status = 'waiting';
      totalSec = plannedSec;
      remainingSec = plannedSec;
      trueProgress = 0;
      liveGameCost = prePaymentCost || Math.round((plannedSec / 3600) * hourlyPrice);
      speedMultiplier = 0;
      lapDurationSec = 0;
    }
  } else {
    // Post-payment (open-ended session): real-time 60s per lap (1 lap = 1 real minute),
    // while trueProgress tracks hourly session progress (1 full session lap = 1 hour).
    if (clickEntry && Number(clickEntry.clickTime) > 0) {
      startTime = Number(clickEntry.clickTime);
      elapsedSec = Math.max(0, nowSec - startTime);
      totalSec = 3600;
      lapsCompleted = Math.floor(elapsedSec / 3600);
      trueProgress = (elapsedSec % 3600) / 3600;
      status = 'running';

      speedMultiplier = 1;
      lapDurationSec = BASE_LAP_SEC;

      liveGameCost = Math.round(hourlyPrice * (Math.max(60, elapsedSec) / 3600));
    } else {
      status = 'waiting';
      elapsedSec = 0;
      totalSec = 3600;
      trueProgress = 0;
      speedMultiplier = 0;
      lapDurationSec = 0;
      liveGameCost = 0;
    }
  }

  const activeMilestoneIndex =
    status === 'waiting'
      ? 0
      : Math.min(11, Math.floor(normalizeProgress(trueProgress) * 12));

  const speedLabel =
    status === 'waiting'
      ? 'آماده شروع'
      : status === 'overdue'
      ? 'اتمام زمان'
      : status === 'ending-soon'
      ? 'نزدیک پایان'
      : speedMultiplier >= 1.25
      ? 'ریتم تندتر'
      : speedMultiplier <= 0.85
      ? 'ریتم آرام‌تر'
      : 'زمان واقعی';

  return {
    tableNumber,
    consoleType,
    consoleName: CONSOLE_DISPLAY_NAMES[consoleType] || consoleType,
    priceType,
    priceLabel: PRICE_TYPE_LABELS[priceType] || 'عادی',
    hourlyPrice,
    paymentMode,
    isPrePayment,
    prePaymentCost,
    status,
    startTime,
    finishTime,
    elapsedSec,
    remainingSec,
    totalSec,
    lapsCompleted,
    trueProgress: Number(trueProgress.toFixed(4)),
    progressPercent: Math.round(trueProgress * 100),
    speedMultiplier,
    lapDurationSec,
    speedLabel,
    liveGameCost,
    buffetCount: buffet.count,
    buffetTotal: buffet.total,
    buffetItems: buffet.items,
    grandTotal: liveGameCost + buffet.total,
    activeMilestoneIndex,
  };
}

/**
 * Computes a runner's animated position (0..1) on the stadium oval anchored to real wall-clock time.
 * - 'live-run': continuous clockwise orbit anchored to real elapsed seconds since session start,
 *   where 1 full lap takes runner.lapDurationSec real seconds (baseline 60s = 1 real minute/lap).
 * - 'true-pos': locks each runner strictly to its real trueProgress coordinate toward the finish line.
 */
export function computeAnimatedProgress(runner, subSecOffset = 0, mode = 'live-run') {
  if (!runner) return 0;
  if (runner.status === 'waiting') {
    return 0.015;
  }
  if (runner.status === 'overdue') {
    return 0.992;
  }
  if (mode === 'true-pos' || !runner.lapDurationSec || runner.lapDurationSec <= 0) {
    return clamp(runner.trueProgress, 0.02, 0.99);
  }
  const realElapsedSec = Math.max(0, (Number(runner.elapsedSec) || 0) + (Number(subSecOffset) || 0));
  return normalizeProgress(realElapsedSec / runner.lapDurationSec);
}

/**
 * Assigns radial lane offsets (0, +step, -step, +2*step, -2*step) so runner tokens
 * that occupy close positions on the oval never visually collide or block clicks.
 */
export function assignRunnerLanes(runners, minGap = 0.055, laneStep = TRACK_GEOMETRY.laneStep) {
  const candidates = [0, laneStep, -laneStep, laneStep * 1.75, -laneStep * 1.75];
  const placed = [];

  return runners.map((runner) => {
    const pos = Number.isFinite(runner.displayProgress)
      ? runner.displayProgress
      : runner.trueProgress || 0;

    let chosenLane = 0;
    for (const lane of candidates) {
      const collides = placed.some(
        (other) => other.laneOffset === lane && circularDistance(other.pos, pos) < minGap
      );
      if (!collides) {
        chosenLane = lane;
        break;
      }
    }

    placed.push({ pos, laneOffset: chosenLane });
    return { ...runner, laneOffset: chosenLane };
  });
}

export function formatDurationHMS(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatShortDuration(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  if (hrs > 0 && mins > 0) return `${hrs} ساعت و ${mins} دقیقه`;
  if (hrs > 0) return `${hrs} ساعت`;
  return `${Math.max(1, mins)} دقیقه`;
}

export function formatLapPace(lapDurationSec) {
  const rounded = Math.round(Number(lapDurationSec) || 0);
  if (rounded <= 0) return 'متوقف';
  if (rounded === 60) return 'هر ۱ دقیقه یک دور';
  if (rounded < 60) return `هر ${rounded} ثانیه یک دور`;
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  if (secs === 0) return `هر ${mins} دقیقه یک دور`;
  return `هر ${mins} دقیقه و ${secs} ثانیه یک دور`;
}

