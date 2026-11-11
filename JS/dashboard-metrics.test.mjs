import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toPersianDigits,
  formatToman,
  getConsoleDisplayName,
  getPriceTypeLabel,
  calculateChargeSeconds,
  computeDashboardMetrics,
  computeCircularProgressGeometry,
  computeDonutSegmentsGeometry,
  interpolateCountUp,
  stepMarioState,
  computeIncomeReportMetrics,
} from './dashboard-metrics.mjs';

test('toPersianDigits converts ASCII digits to Persian numerals', () => {
  assert.equal(toPersianDigits(1234567890), '۱۲۳۴۵۶۷۸۹۰');
  assert.equal(toPersianDigits('میز 5'), 'میز ۵');
  assert.equal(toPersianDigits(null), '۰');
});

test('formatToman formats currency with commas and Persian digits', () => {
  assert.equal(formatToman(0), '۰');
  assert.equal(formatToman(-500), '۰');
  assert.equal(formatToman(145000), '۱۴۵,۰۰۰');
  assert.equal(formatToman('2500000'), '۲,۵۰۰,۰۰۰');
});

test('getConsoleDisplayName and getPriceTypeLabel map known codes', () => {
  assert.equal(getConsoleDisplayName('ps50'), 'پلی‌استیشن ۵ (PS5)');
  assert.equal(getConsoleDisplayName('ps4'), 'پلی‌استیشن ۴ (PS4)');
  assert.equal(getPriceTypeLabel('two_player_price'), 'دو نفره');
  assert.equal(getPriceTypeLabel('unknown'), 'استاندارد');
});

test('calculateChargeSeconds converts minutes and Toman amount into total seconds', () => {
  const seconds = calculateChargeSeconds({
    chargeAmount: 30000,
    chargeTimeMinutes: 30,
    hourlyPrice: 60000,
  });
  assert.equal(seconds, 3600);
});

test('computeDashboardMetrics computes accurate KPI values from game center data (both object and array schemas)', () => {
  const metrics = computeDashboardMetrics({
    reservations: [
      { tableNumber: '2', consoleType: 'ps4', priceType: 'one_player_price', postPayment: 'post-payment' },
      { tableNumber: '3', consoleType: 'ps50', priceType: 'two_player_price', prePayment: 'pre-payment', prePaymentCost: 50000 },
    ],
    consoles: [{ name: 'ps4' }, { name: 'ps50' }, { name: 'xbox' }],
    clickTimes: [{ tableNumber: '2', clickTime: '1794204236' }],
    finishTimes: [],
    buffetTemp: {
      2: [{ productCode: '10023', title: 'نوشابه', quantity: '2', unitPrice: '25000' }],
    },
    cashPay: [{ gameTotal: '70000', Buffet: [['cold_drink', '25000']] }],
    creditPay: [{ gameTotal: '130000', Buffet: [['fastfood', '50000']] }],
    customerPay: [{ gameTotal: '50000', Buffet: 0 }],
    totalStations: 10,
  });

  assert.equal(metrics.activeTablesCount, 2);
  assert.equal(metrics.occupiedStations, 2);
  assert.equal(metrics.availableStations, 8);
  assert.equal(metrics.occupancyPercent, 20);
  assert.equal(metrics.postpaidTablesCount, 1);
  assert.equal(metrics.prepaidTablesCount, 1);
  assert.equal(metrics.activeSessionsCount, 1);
  assert.equal(metrics.waitingSessionsCount, 1);
  assert.equal(metrics.gameRevenue, 250000);
  assert.equal(metrics.settledBuffetRevenue, 75000);
  assert.equal(metrics.activeBuffetTotal, 50000);
  assert.equal(metrics.activeBuffetItemsCount, 2);
  assert.equal(metrics.buffetRevenue, 125000);
  assert.equal(metrics.totalRevenue, 375000);
});

test('computeCircularProgressGeometry and computeDonutSegmentsGeometry calculate accurate SVG ring offsets', () => {
  const ring0 = computeCircularProgressGeometry(0, 46);
  const ring50 = computeCircularProgressGeometry(50, 46);
  const ring100 = computeCircularProgressGeometry(100, 46);

  assert.equal(ring0.clampedPercent, 0);
  assert.equal(ring0.dashOffset, ring0.circumference);
  assert.equal(ring50.clampedPercent, 50);
  assert.ok(Math.abs(ring50.dashOffset - ring50.circumference / 2) < 0.05);
  assert.equal(ring100.clampedPercent, 100);
  assert.equal(ring100.dashOffset, 0);

  const donut = computeDonutSegmentsGeometry(
    [
      { id: 'game', label: 'بازی', value: 750000, color: '#10B981' },
      { id: 'buffet', label: 'بوفه', value: 250000, color: '#F59E0B' },
    ],
    46
  );
  assert.equal(donut.total, 1000000);
  assert.equal(donut.segments[0].percent, 75);
  assert.equal(donut.segments[1].percent, 25);
  assert.equal(donut.segments[0].dashOffset, 0);
  assert.ok(donut.segments[1].dashOffset < 0);
});

test('interpolateCountUp and stepMarioState handle easing, boundary turn-around, and parabolic jump physics', () => {
  assert.equal(interpolateCountUp(0, 1000, 0), 0);
  assert.equal(interpolateCountUp(0, 1000, 1), 1000);
  assert.ok(interpolateCountUp(0, 1000, 0.5) > 500); // Cubic-out is >50% at t=0.5

  // Test boundary turn-around from right edge
  const turned = stepMarioState({ x: 399, minX: 40, maxX: 400, direction: 1, speed: 100 }, 0.05);
  assert.equal(turned.x, 400);
  assert.equal(turned.direction, -1);
  assert.equal(turned.turnedAround, true);

  // Test periodic jump trigger and parabolic arc
  const jumped = stepMarioState(
    { x: 200, minX: 40, maxX: 400, direction: 1, timeSinceLastJump: 3.7, jumpInterval: 3.5 },
    0.05
  );
  assert.equal(jumped.isJumping, true);
  assert.equal(jumped.frameIndex, 3);
  assert.ok(jumped.y < 0);
});

test('computeIncomeReportMetrics aggregates consoles, buffet categories, and payment types safely', () => {
  const report = computeIncomeReportMetrics({
    creditPay: [
      { gameTotal: '45000', Buffet: [['cold_drink', '25000']], consoleType: 'ps4', paydate: 'Tuesday, November 21, 2023' },
      { gameTotal: '45000', Buffet: '85', consoleType: 'ps4', paydate: '85' },
    ],
    cashPay: [
      { gameTotal: '30000', Buffet: [['snack', '10000']], consoleType: 'ps50', paydate: 'Wed Nov 22 2023 10:05:15 GMT+0330' },
    ],
    customerPay: [
      { gameTotal: '25000', Buffet: [['fastfood', '20000']], consoleType: 'xbox', paydate: 'Monday, 11/20/2023' },
    ],
    filterMode: 'all',
  });

  assert.equal(report.totalColumn.ps4, 45000);
  assert.equal(report.totalColumn.ps50, 30000);
  assert.equal(report.totalColumn.xbox, 25000);
  assert.equal(report.totalColumn.totalItem, 100000);
  assert.equal(report.totalBuffetColumn.cold_drink, 25000);
  assert.equal(report.totalBuffetColumn.snack, 10000);
  assert.equal(report.totalBuffetColumn.fastfood, 20000);
  assert.equal(report.totalBuffetColumn.totalBuffetItem, 55000);
  assert.equal(report.totalCredit, 70000);
  assert.equal(report.totalCash, 40000);
  assert.equal(report.totalAccount, 45000);
  assert.equal(report.totalIncome, 155000);
  assert.equal(report.transactionsCount, 3);
});


