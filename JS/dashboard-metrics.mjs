// Pure functions for computing Metrogame Gaming Center dashboard KPIs, formatting Persian digits, and filtering active tables.

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts English/Arabic numerals in a string or number to Persian numerals.
 * @param {string|number} value
 * @returns {string}
 */
export function toPersianDigits(value) {
  if (value === null || value === undefined) return '۰';
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

/**
 * Formats a numeric amount in Toman with thousands separators and Persian digits.
 * @param {number|string} amount
 * @returns {string}
 */
export function formatToman(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return '۰';
  const formatted = Math.round(num).toLocaleString('en-US');
  return toPersianDigits(formatted);
}

/**
 * Translates console code to display name in Persian/English for UI badges.
 * @param {string} consoleType
 * @returns {string}
 */
export function getConsoleDisplayName(consoleType) {
  const map = {
    ps50: 'پلی‌استیشن ۵ (PS5)',
    ps4: 'پلی‌استیشن ۴ (PS4)',
    xbox: 'ایکس‌باکس (Xbox)',
    computer: 'سیستم گیمینگ (PC)',
    'pool-table': 'میز بیلیارد (Billiard)',
    foosball: 'فوتبال دستی',
    jewelry: 'وی‌آر / ویژه (VIP)',
  };
  return map[consoleType] || consoleType || 'نامشخص';
}

/**
 * Translates priceType code to Persian label.
 * @param {string} priceType
 * @returns {string}
 */
export function getPriceTypeLabel(priceType) {
  const map = {
    one_player_price: 'یک نفره',
    two_player_price: 'دو نفره',
    three_player_price: 'سه نفره',
    four_player_price: 'چهار نفره',
  };
  return map[priceType] || 'استاندارد';
}

/**
 * Calculates seconds to add for a table charge based on amount (Toman), time (minutes), and console hourly rate.
 * @param {object} params
 * @param {number|string} params.chargeAmount
 * @param {number|string} params.chargeTimeMinutes
 * @param {number|string} params.hourlyPrice
 * @returns {number}
 */
export function calculateChargeSeconds({ chargeAmount = 0, chargeTimeMinutes = 0, hourlyPrice = 0 }) {
  const minutesSec = Math.max(0, Number(chargeTimeMinutes) || 0) * 60;
  const amount = Math.max(0, Number(chargeAmount) || 0);
  const rate = Number(hourlyPrice) || 0;
  const amountSec = rate > 0 ? Math.round((3600 * amount) / rate) : 0;
  return minutesSec + amountSec;
}

/**
 * Normalizes buffet_temporary.json (which may be a map keyed by tableNumber or a flat array) into a flat list of order items.
 * @param {object|Array} buffetTemp
 * @returns {Array}
 */
export function normalizeBuffetTempItems(buffetTemp) {
  if (!buffetTemp) return [];
  if (Array.isArray(buffetTemp)) return buffetTemp;
  if (typeof buffetTemp === 'object') {
    const items = [];
    for (const [tableKey, list] of Object.entries(buffetTemp)) {
      if (Array.isArray(list)) {
        for (const entry of list) {
          if (entry && typeof entry === 'object') {
            items.push({ ...entry, tableNumber: entry.tableNumber ?? tableKey });
          }
        }
      }
    }
    return items;
  }
  return [];
}

/**
 * Computes summary metrics for the 5 admin KPI widgets from backend JSON datasets.
 * @param {object} payload
 * @returns {object}
 */
export function computeDashboardMetrics({
  reservations = [],
  consoles = [],
  clickTimes = [],
  finishTimes = [],
  buffetTemp = [],
  cashPay = [],
  creditPay = [],
  customerPay = [],
  totalStations = 12,
} = {}) {
  const safeReservations = Array.isArray(reservations) ? reservations : [];
  const safeClickTimes = Array.isArray(clickTimes) ? clickTimes : [];
  const safeFinishTimes = Array.isArray(finishTimes) ? finishTimes : [];
  const safeBuffetItems = normalizeBuffetTempItems(buffetTemp);
  const safeCash = Array.isArray(cashPay) ? cashPay : [];
  const safeCredit = Array.isArray(creditPay) ? creditPay : [];
  const safeCustomer = Array.isArray(customerPay) ? customerPay : [];

  const activeTablesCount = safeReservations.length;
  const stationCapacity = Math.max(Number(totalStations) || 12, activeTablesCount);
  const occupiedStations = activeTablesCount;
  const availableStations = Math.max(0, stationCapacity - occupiedStations);
  const occupancyPercent = stationCapacity > 0 ? Math.round((occupiedStations / stationCapacity) * 100) : 0;

  const prepaidTablesCount = safeReservations.filter((r) => r.prePayment === 'pre-payment').length;
  const postpaidTablesCount = safeReservations.filter((r) => r.postPayment === 'post-payment').length;

  // Running sessions: tables that have an active start timestamp in clickTime.json or finishTime.json
  const runningTableSet = new Set();
  for (const item of safeClickTimes) {
    if (item && item.tableNumber !== undefined && Number(item.clickTime) > 0) {
      runningTableSet.add(String(item.tableNumber));
    }
  }
  for (const item of safeFinishTimes) {
    if (item && item.tableNumber !== undefined && Number(item.finishTime) > 0) {
      runningTableSet.add(String(item.tableNumber));
    }
  }
  const activeSessionsCount = safeReservations.filter((r) => runningTableSet.has(String(r.tableNumber))).length;
  const waitingSessionsCount = Math.max(0, activeTablesCount - activeSessionsCount);

  // Revenue calculation across cash, credit (POS), and customer balance payments
  const allPayments = [...safeCash, ...safeCredit, ...safeCustomer];
  let gameRevenue = 0;
  let settledBuffetRevenue = 0;

  for (const entry of allPayments) {
    if (!entry) continue;
    gameRevenue += Number(entry.gameTotal ?? entry.gameCost ?? 0) || 0;
    if (Array.isArray(entry.Buffet)) {
      for (const bRow of entry.Buffet) {
        if (Array.isArray(bRow)) {
          settledBuffetRevenue += Number(bRow[1]) || 0;
        } else if (bRow && typeof bRow === 'object') {
          settledBuffetRevenue += Number(bRow.price ?? bRow.totalPrice ?? 0) || 0;
        }
      }
    } else {
      settledBuffetRevenue += Number(entry.buffetCost ?? entry.Buffet ?? 0) || 0;
    }
  }

  // Open buffet orders on active tables
  let activeBuffetTotal = 0;
  let activeBuffetItemsCount = 0;
  for (const item of safeBuffetItems) {
    if (!item) continue;
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice ?? item.price ?? 0) || 0;
    const rowTotal = Number(item.totalPrice) || qty * unitPrice;
    activeBuffetTotal += rowTotal;
    activeBuffetItemsCount += qty;
  }

  const buffetRevenue = settledBuffetRevenue + activeBuffetTotal;
  const totalRevenue = gameRevenue + buffetRevenue;

  return {
    activeTablesCount,
    stationCapacity,
    occupiedStations,
    availableStations,
    occupancyPercent,
    prepaidTablesCount,
    postpaidTablesCount,
    activeSessionsCount,
    waitingSessionsCount,
    totalRevenue,
    gameRevenue,
    settledBuffetRevenue,
    activeBuffetTotal,
    activeBuffetItemsCount,
    buffetRevenue,
    consolesCount: Array.isArray(consoles) ? consoles.length : 0,
  };
}

/**
 * Computes SVG stroke-dasharray and stroke-dashoffset for a circular progress ring.
 * @param {number} percent - 0 to 100
 * @param {number} radius - SVG circle radius
 * @returns {{ circumference: number, dashOffset: number, clampedPercent: number }}
 */
export function computeCircularProgressGeometry(percent, radius = 46) {
  const safeRadius = Math.max(1, Number(radius) || 46);
  const clampedPercent = Math.min(100, Math.max(0, Number(percent) || 0));
  const circumference = Number((2 * Math.PI * safeRadius).toFixed(2));
  const dashOffset = Number((circumference * (1 - clampedPercent / 100)).toFixed(2));
  return {
    circumference,
    dashOffset,
    clampedPercent: Math.round(clampedPercent),
  };
}

/**
 * Computes SVG stroke-dasharray and stroke-dashoffset for a multi-segment donut chart.
 * @param {Array<{ id: string, label: string, value: number, color: string }>} segments
 * @param {number} radius
 * @returns {{ total: number, circumference: number, segments: Array }}
 */
export function computeDonutSegmentsGeometry(segments = [], radius = 46) {
  const safeRadius = Math.max(1, Number(radius) || 46);
  const circumference = 2 * Math.PI * safeRadius;
  const rawTotal = segments.reduce((acc, s) => acc + Math.max(0, Number(s?.value) || 0), 0);
  const total = rawTotal > 0 ? rawTotal : 1;

  let accumulatedFraction = 0;
  const computed = segments.map((seg, idx) => {
    const val = Math.max(0, Number(seg?.value) || 0);
    const fraction = rawTotal > 0 ? val / total : idx === 0 ? 1 : 0;
    const percent = Math.round(fraction * 100);
    const arcLength = Number((fraction * circumference).toFixed(2));
    const gapLength = Number(Math.max(0, circumference - arcLength).toFixed(2));
    // SVG circle starts at -90deg; negative offset shifts start clockwise by accumulated fraction
    const dashOffset = Number((-accumulatedFraction * circumference).toFixed(2));
    accumulatedFraction += fraction;

    return {
      ...seg,
      value: val,
      percent,
      fraction,
      dashArray: `${arcLength} ${gapLength}`,
      dashOffset,
      circumference: Number(circumference.toFixed(2)),
    };
  });

  return {
    total: rawTotal,
    circumference: Number(circumference.toFixed(2)),
    segments: computed,
  };
}

/**
 * Cubic-out easing interpolation for smooth count-up numerical animations.
 * @param {number} startValue
 * @param {number} endValue
 * @param {number} progress - 0 to 1
 * @returns {number}
 */
export function interpolateCountUp(startValue, endValue, progress) {
  const t = Math.min(1, Math.max(0, Number(progress) || 0));
  const eased = 1 - Math.pow(1 - t, 3);
  const start = Number(startValue) || 0;
  const end = Number(endValue) || 0;
  return Math.round(start + (end - start) * eased);
}

/**
 * Advances the Super Mario decorative runner state by dtSeconds.
 * Handles horizontal walking, smooth boundary turn-around, and natural parabolic jumping.
 * @param {object} state
 * @param {number} dtSeconds
 * @returns {object}
 */
export function stepMarioState(state, dtSeconds = 0.016) {
  const dt = Math.min(0.1, Math.max(0, Number(dtSeconds) || 0.016));
  const minX = state.minX ?? 48;
  const maxX = Math.max(minX + 60, state.maxX ?? 800);
  const speed = state.speed ?? 68; // pixels per second

  let x = Number(state.x ?? minX);
  let direction = state.direction === -1 ? -1 : 1; // 1 = left-to-right, -1 = right-to-left
  let walkCycleTime = (Number(state.walkCycleTime) || 0) + dt;
  let timeSinceLastJump = (Number(state.timeSinceLastJump) || 0) + dt;
  let isJumping = Boolean(state.isJumping);
  let jumpProgress = Number(state.jumpProgress) || 0;
  const jumpDuration = state.jumpDuration ?? 0.62;
  const jumpHeight = state.jumpHeight ?? 26;
  const jumpInterval = state.jumpInterval ?? 3.6;

  // Move horizontally
  x += direction * speed * dt;

  // Turn around smoothly at boundaries
  let turnedAround = false;
  if (x >= maxX) {
    x = maxX;
    direction = -1;
    turnedAround = true;
  } else if (x <= minX) {
    x = minX;
    direction = 1;
    turnedAround = true;
  }

  // Trigger natural jump periodically when walking away from immediate edges
  let justJumped = false;
  if (!isJumping && timeSinceLastJump >= jumpInterval && x > minX + 30 && x < maxX - 30) {
    isJumping = true;
    jumpProgress = 0;
    timeSinceLastJump = 0;
    justJumped = true;
  }

  // Compute vertical parabolic jump offset (y <= 0, 0 is ground)
  let y = 0;
  if (isJumping) {
    jumpProgress += dt / jumpDuration;
    if (jumpProgress >= 1) {
      isJumping = false;
      jumpProgress = 0;
      y = 0;
    } else {
      // Smooth parabola peaking at jumpProgress = 0.5
      y = Number((-4 * jumpHeight * jumpProgress * (1 - jumpProgress)).toFixed(2));
    }
  }

  // 3-frame walk cycle (0, 1, 2) at ~9 fps, or frame 3 when jumping
  const frameIndex = isJumping ? 3 : Math.floor(walkCycleTime * 9) % 3;

  return {
    ...state,
    minX,
    maxX,
    speed,
    x: Number(x.toFixed(2)),
    y,
    direction,
    turnedAround,
    isJumping,
    justJumped,
    jumpProgress: Number(jumpProgress.toFixed(3)),
    walkCycleTime: Number(walkCycleTime.toFixed(3)),
    timeSinceLastJump: Number(timeSinceLastJump.toFixed(3)),
    frameIndex,
  };
}

