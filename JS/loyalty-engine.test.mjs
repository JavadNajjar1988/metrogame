import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LOYALTY_CONFIG,
  sanitizeLoyaltyConfig,
  computeCustomerLoyalty,
  applyLoyaltyDiscountToTotal,
  estimatePlayedSecondsFromGameItems,
} from './loyalty-engine.mjs';

test('sanitizeLoyaltyConfig enforces safe bounds and defaults to 24h / 20%', () => {
  assert.deepEqual(sanitizeLoyaltyConfig(null), DEFAULT_LOYALTY_CONFIG);
  assert.deepEqual(sanitizeLoyaltyConfig({ milestoneHours: 999, discountPercent: 150 }), {
    milestoneHours: 200,
    discountPercent: 90,
  });
  assert.deepEqual(sanitizeLoyaltyConfig({ milestoneHours: 0, discountPercent: -5 }), {
    milestoneHours: 1,
    discountPercent: 1,
  });
  assert.deepEqual(sanitizeLoyaltyConfig({ milestoneHours: 12, discountPercent: 15 }), {
    milestoneHours: 12,
    discountPercent: 15,
  });
});

test('computeCustomerLoyalty tracks 24-hour milestones, progress percent, and redeemed rewards', () => {
  const below = computeCustomerLoyalty({ totalPlaySeconds: 18 * 3600, usedRewards: 0 });
  assert.equal(below.totalPlayHours, 18);
  assert.equal(below.earnedRewards, 0);
  assert.equal(below.availableRewards, 0);
  assert.equal(below.hasRewardReady, false);
  assert.equal(below.hoursRemainingToNext, 6);
  assert.equal(below.progressPercent, 75);

  const earnedOne = computeCustomerLoyalty({ totalPlaySeconds: 25.5 * 3600, usedRewards: 0 });
  assert.equal(earnedOne.earnedRewards, 1);
  assert.equal(earnedOne.availableRewards, 1);
  assert.equal(earnedOne.hasRewardReady, true);
  assert.equal(earnedOne.hoursInCurrentCycle, 1.5);
  assert.equal(earnedOne.hoursRemainingToNext, 22.5);

  const afterRedeem = computeCustomerLoyalty({ totalPlaySeconds: 25.5 * 3600, usedRewards: 1 });
  assert.equal(afterRedeem.availableRewards, 0);
  assert.equal(afterRedeem.hasRewardReady, false);

  const multipleMilestones = computeCustomerLoyalty({ totalPlaySeconds: 50 * 3600, usedRewards: 1 });
  assert.equal(multipleMilestones.earnedRewards, 2);
  assert.equal(multipleMilestones.availableRewards, 1);
});

test('applyLoyaltyDiscountToTotal deducts discount cleanly and rounds payable to 1,000 Toman', () => {
  const noDiscount = applyLoyaltyDiscountToTotal(100000, 20, false);
  assert.equal(noDiscount.discountAmount, 0);
  assert.equal(noDiscount.payable, 100000);

  const withDiscount = applyLoyaltyDiscountToTotal(100000, 20, true);
  assert.equal(withDiscount.discountAmount, 20000);
  assert.equal(withDiscount.payable, 80000);

  const oddTotal = applyLoyaltyDiscountToTotal(53400, 20, true);
  assert.equal(oddTotal.discountAmount, 11000);
  assert.equal(oddTotal.payable, 42000);
});

test('estimatePlayedSecondsFromGameItems prefers explicit playedSeconds and falls back to cost/rate', () => {
  const explicit = estimatePlayedSecondsFromGameItems([
    { playedSeconds: 5400, gameCost: 30000, basePrice: 20000 },
  ]);
  assert.equal(explicit, 5400);

  const fallback = estimatePlayedSecondsFromGameItems([
    { gameCost: 40000, basePrice: 20000 },
  ]);
  assert.equal(fallback, 7200);
});
