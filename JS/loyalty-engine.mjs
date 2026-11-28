/**
 * Pure Customer Loyalty & 24-Hour Playtime Reward Engine for مترو گیم.
 * Zero DOM dependencies — fully unit-tested via node:test.
 */

export const DEFAULT_LOYALTY_CONFIG = Object.freeze({
  milestoneHours: 24,
  discountPercent: 20,
});

export function sanitizeLoyaltyConfig(raw) {
  const rawHours = Number(raw?.milestoneHours);
  const rawDiscount = Number(raw?.discountPercent);

  const milestoneHours = Number.isFinite(rawHours)
    ? Math.max(1, Math.min(200, Math.round(rawHours)))
    : DEFAULT_LOYALTY_CONFIG.milestoneHours;

  const discountPercent = Number.isFinite(rawDiscount)
    ? Math.max(1, Math.min(90, Math.round(rawDiscount)))
    : DEFAULT_LOYALTY_CONFIG.discountPercent;

  return { milestoneHours, discountPercent };
}

/**
 * Computes cumulative playtime hours, progress toward the next 24-hour milestone,
 * and how many discount rewards a registered customer has earned / remaining.
 */
export function computeCustomerLoyalty(customer, rawConfig = DEFAULT_LOYALTY_CONFIG) {
  const config = sanitizeLoyaltyConfig(rawConfig);
  const milestoneSeconds = config.milestoneHours * 3600;
  const totalPlaySeconds = Math.max(0, Math.floor(Number(customer?.totalPlaySeconds) || 0));
  const totalPlayHours = Math.round((totalPlaySeconds / 3600) * 10) / 10;

  const earnedRewards = Math.floor(totalPlaySeconds / milestoneSeconds);
  const rawUsed = Math.max(0, Math.floor(Number(customer?.usedRewards) || 0));
  const usedRewards = Math.min(rawUsed, earnedRewards);
  const availableRewards = Math.max(0, earnedRewards - usedRewards);

  const secondsInCurrentCycle = totalPlaySeconds % milestoneSeconds;
  const hoursInCurrentCycle = Math.round((secondsInCurrentCycle / 3600) * 10) / 10;
  const hoursRemainingToNext = Math.max(
    0,
    Math.round(((milestoneSeconds - secondsInCurrentCycle) / 3600) * 10) / 10
  );
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((secondsInCurrentCycle / milestoneSeconds) * 100))
  );

  return {
    totalPlaySeconds,
    totalPlayHours,
    milestoneHours: config.milestoneHours,
    discountPercent: config.discountPercent,
    earnedRewards,
    usedRewards,
    availableRewards,
    hoursInCurrentCycle,
    hoursRemainingToNext,
    progressPercent,
    hasRewardReady: availableRewards > 0,
  };
}

/**
 * Applies an earned loyalty discount percentage to a raw invoice total,
 * keeping final payable rounded cleanly to 1,000 Toman when >= 1,000.
 */
export function applyLoyaltyDiscountToTotal(rawTotal = 0, discountPercent = 0, useReward = false) {
  const safeRaw = Math.max(0, Number(rawTotal) || 0);
  const safePercent = useReward
    ? Math.max(0, Math.min(90, Number(discountPercent) || 0))
    : 0;

  const discountAmount =
    safePercent > 0 ? Math.round(((safeRaw * safePercent) / 100) / 1000) * 1000 : 0;
  const clampedDiscount = Math.min(safeRaw, Math.max(0, discountAmount));
  const afterDiscount = Math.max(0, safeRaw - clampedDiscount);
  const payable = afterDiscount >= 1000 ? Math.round(afterDiscount / 1000) * 1000 : afterDiscount;
  const roundingDiff = afterDiscount - payable;

  return {
    rawTotal: safeRaw,
    discountPercent: safePercent,
    discountAmount: clampedDiscount,
    afterDiscount,
    payable,
    roundingDiff,
  };
}

/**
 * Estimates played seconds from an invoice's game rows when explicit playedSeconds
 * wasn't attached (using gameCost / basePrice * 3600).
 */
export function estimatePlayedSecondsFromGameItems(gameItems = []) {
  if (!Array.isArray(gameItems) || gameItems.length === 0) return 0;
  return gameItems.reduce((sum, item) => {
    const explicit = Number(item?.playedSeconds);
    if (Number.isFinite(explicit) && explicit > 0) {
      return sum + Math.floor(explicit);
    }
    const cost = Math.max(0, Number(item?.gameCost) || 0);
    const rate = Math.max(0, Number(item?.basePrice ?? item?.cosoleprice) || 0);
    if (cost > 0 && rate > 0) {
      return sum + Math.max(60, Math.round((cost / rate) * 3600));
    }
    return sum;
  }, 0);
}
