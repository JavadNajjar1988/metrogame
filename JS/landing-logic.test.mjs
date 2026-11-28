import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_PREVIEW_TABS,
  FEATURE_STORY_CHAPTERS,
  PINNED_STORY_STAGES,
  TOURNAMENT_STORY_BEATS,
  TOURNAMENT_DISCIPLINES,
  SUBSCRIPTION_TIERS,
  COMPARISON_ROWS,
  resolveLandingTheme,
  getPreviewSrc,
  getFeatureChapter,
  getTournamentDiscipline,
  getComparisonRows,
  computeStageTilt,
  computeHeroScrollState,
  computePinnedStoryState,
  computeTournamentRevealState,
  computeAmbientState,
  computeMagneticOffset,
  getTierCapabilitiesSummary,
  toggleFaqState,
  validateDemoInquiry,
  SOFTWARE_TOUR_STOPS,
  HORIZONTAL_EXHIBITION_PANELS,
  computeSceneOneReveal,
  computeSceneTwoSoftware,
  computeSceneThreeHorizontal,
  computeSceneFourTournament,
  computeSceneFivePricing,
} from './landing-logic.mjs';

test('resolveLandingTheme defaults safely to dark and accepts light', () => {
  assert.equal(resolveLandingTheme('light'), 'light');
  assert.equal(resolveLandingTheme('dark'), 'dark');
  assert.equal(resolveLandingTheme(undefined), 'dark');
  assert.equal(resolveLandingTheme('invalid'), 'dark');
});

test('getPreviewSrc returns matching dark and light product screenshots', () => {
  assert.equal(HERO_PREVIEW_TABS.length, 4);
  assert.equal(getPreviewSrc('studio3d', 'dark'), 'assets/images/landing/preview-3d-dark.png');
  assert.equal(getPreviewSrc('studio3d', 'light'), 'assets/images/landing/preview-3d-light.png');
  assert.equal(getPreviewSrc('unknown', 'light'), 'assets/images/landing/preview-overview-light.png');
});

test('FEATURE_STORY_CHAPTERS covers all 6 core product capabilities with real dark/light previews', () => {
  assert.equal(FEATURE_STORY_CHAPTERS.length, 6);
  const ids = FEATURE_STORY_CHAPTERS.map((c) => c.id);
  assert.deepEqual(ids, ['stations', 'consoles', 'pc', 'physical', 'buffet', 'finance']);
  for (const ch of FEATURE_STORY_CHAPTERS) {
    assert.ok(ch.darkSrc.startsWith('assets/images/landing/preview-'));
    assert.ok(ch.lightSrc.startsWith('assets/images/landing/preview-'));
    assert.equal(ch.highlights.length, 3);
  }
  assert.equal(getFeatureChapter('buffet').id, 'buffet');
  assert.equal(getFeatureChapter('missing').id, 'stations');
});

test('PINNED_STORY_STAGES covers 4 sequential scroll storytelling stages with real previews', () => {
  assert.equal(PINNED_STORY_STAGES.length, 4);
  assert.deepEqual(
    PINNED_STORY_STAGES.map((s) => s.id),
    ['stations', 'buffet', 'finance', 'tournaments']
  );
  for (const stage of PINNED_STORY_STAGES) {
    assert.ok(stage.darkSrc.startsWith('assets/images/landing/preview-'));
    assert.ok(stage.lightSrc.startsWith('assets/images/landing/preview-'));
    assert.equal(stage.metrics.length, 3);
    assert.ok(stage.focusBox.w > 0 && stage.focusBox.h > 0);
  }
});

test('computeHeroScrollState smoothly flattens tilt, scales dashboard, and lifts headline continuously', () => {
  const start = computeHeroScrollState(0);
  const mid = computeHeroScrollState(0.5);
  const end = computeHeroScrollState(1);

  assert.equal(start.copyY, 0);
  assert.equal(start.copyOpacity, 1);
  assert.ok(start.stageRotateX > mid.stageRotateX && mid.stageRotateX > end.stageRotateX);
  assert.equal(end.stageRotateX, 0);
  assert.ok(end.stageScale > mid.stageScale && mid.stageScale > start.stageScale);
  assert.ok(end.copyY < mid.copyY && mid.copyY < start.copyY);
  assert.equal(end.satellitesY[0], 0);
  assert.deepEqual(computeHeroScrollState(-1), start);
  assert.deepEqual(computeHeroScrollState(3), end);
});

test('computePinnedStoryState maps continuous scroll progress across 4 crossfading layers reversibly', () => {
  const s0 = computePinnedStoryState(0);
  const s1 = computePinnedStoryState(0.35);
  const s2 = computePinnedStoryState(0.62);
  const s3 = computePinnedStoryState(0.98);

  assert.equal(s0.activeIndex, 0);
  assert.equal(s0.layers[0].opacity, 1);
  assert.equal(s0.layers[3].opacity, 0);

  assert.equal(s1.activeIndex, 1);
  assert.ok(s1.layers[1].opacity > 0.7);

  assert.equal(s2.activeIndex, 2);
  assert.ok(s2.layers[2].opacity > 0.7);

  assert.equal(s3.activeIndex, 3);
  assert.equal(s3.layers[3].opacity, 1);
  assert.equal(s3.layers[0].opacity, 0);
});

test('computeTournamentRevealState scrubs H2H clubs, VS emblem, connectors, bracket, and leaderboard in order', () => {
  assert.equal(TOURNAMENT_STORY_BEATS.length, 4);
  const t0 = computeTournamentRevealState(0);
  const tMid = computeTournamentRevealState(0.5);
  const tEnd = computeTournamentRevealState(1);

  assert.equal(t0.storyBeatIndex, 0);
  assert.ok(t0.clubAOffsetX > 0 && t0.clubBOffsetX < 0);
  assert.equal(t0.connectorDashOffset, 120);

  assert.equal(tMid.storyBeatIndex, 2);
  assert.equal(tMid.clubAOffsetX, 0);
  assert.equal(tMid.clubBOffsetX, 0);
  assert.ok(tMid.connectorDashOffset < 120);

  assert.equal(tEnd.storyBeatIndex, 3);
  assert.equal(tEnd.connectorDashOffset, 0);
  assert.equal(tEnd.bracketDashOffset, 0);
  assert.equal(tEnd.leaderboardOpacity, 1);
});

test('computeAmbientState and computeMagneticOffset stay smoothly bounded', () => {
  const a0 = computeAmbientState(0);
  const a1 = computeAmbientState(1);
  assert.ok(Math.abs(a0.orb1X) <= 10);
  assert.ok(a1.depthShiftY < a0.depthShiftY);

  const mag = computeMagneticOffset(2, -2, 6);
  assert.deepEqual(mag, { tx: 6, ty: -6 });
  assert.deepEqual(computeMagneticOffset(0, 0, 6), { tx: 0, ty: 0 });
});

test('getTierCapabilitiesSummary counts unlocked and locked features accurately per plan', () => {
  const std = getTierCapabilitiesSummary('standard');
  const sil = getTierCapabilitiesSummary('silver');
  const gld = getTierCapabilitiesSummary('gold');
  const ult = getTierCapabilitiesSummary('ultimate');

  assert.equal(std.persianName, 'عادی');
  assert.equal(std.includedCount + std.excludedCount, COMPARISON_ROWS.length);
  assert.ok(std.includedCount < sil.includedCount);
  assert.ok(sil.includedCount < gld.includedCount);
  assert.ok(gld.includedCount < ult.includedCount);
  assert.equal(ult.includedCount, COMPARISON_ROWS.length);
  assert.equal(ult.excludedCount, 0);
});

test('TOURNAMENT_DISCIPLINES covers video games, billiards, and foosball with H2H, bracket, and leaderboard', () => {
  assert.equal(TOURNAMENT_DISCIPLINES.length, 3);
  assert.deepEqual(
    TOURNAMENT_DISCIPLINES.map((d) => d.id),
    ['video', 'billiards', 'foosball']
  );
  const billiards = getTournamentDiscipline('billiards');
  assert.equal(billiards.clubA.name, 'مترو گیم');
  assert.ok(billiards.leaderboard.length >= 4);
  assert.ok(billiards.bracket.final.a);
});

test('SUBSCRIPTION_TIERS defines عادی، نقره‌ای، طلایی، ویژه with ویژه featured and zero invented prices', () => {
  assert.equal(SUBSCRIPTION_TIERS.length, 4);
  assert.deepEqual(
    SUBSCRIPTION_TIERS.map((t) => t.persianName),
    ['عادی', 'نقره‌ای', 'طلایی', 'ویژه']
  );
  const featured = SUBSCRIPTION_TIERS.filter((t) => t.featured);
  assert.equal(featured.length, 1);
  assert.equal(featured[0].id, 'ultimate');
  assert.equal(featured[0].persianName, 'ویژه');
  for (const tier of SUBSCRIPTION_TIERS) {
    assert.equal(/\d{3,}/.test(tier.pricePlaceholder), false);
    assert.equal(/تومان|ریال|\$/.test(tier.pricePlaceholder), false);
  }
});

test('getComparisonRows filters cleanly across categories with explicit included/excluded states', () => {
  assert.equal(getComparisonRows('all').length, COMPARISON_ROWS.length);
  const netRows = getComparisonRows('network');
  assert.ok(netRows.length >= 3);
  for (const row of COMPARISON_ROWS) {
    for (const tierKey of ['standard', 'silver', 'gold', 'ultimate']) {
      assert.ok(['included', 'excluded'].includes(row.tiers[tierKey]));
    }
  }
});

test('computeStageTilt clamps subtle perspective angles and maps specular hotspot cleanly', () => {
  const center = computeStageTilt(0, 0, 3);
  assert.deepEqual(center, { rotateX: 0, rotateY: 0, spotX: 50, spotY: 50 });

  const clamped = computeStageTilt(5, -5, 3);
  assert.equal(clamped.rotateY, 3);
  assert.equal(clamped.rotateX, 3);
  assert.equal(clamped.spotX, 100);
  assert.equal(clamped.spotY, 0);
});

test('toggleFaqState opens and closes FAQ accordion items cleanly', () => {
  assert.equal(toggleFaqState(null, 'faq-1'), 'faq-1');
  assert.equal(toggleFaqState('faq-1', 'faq-1'), null);
  assert.equal(toggleFaqState('faq-1', 'faq-2'), 'faq-2');
});

test('validateDemoInquiry rejects incomplete inputs and accepts valid Persian-digit phone numbers', () => {
  const invalid = validateDemoInquiry({ fullName: 'ع', centerName: '', phone: '123' });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.fullName);
  assert.ok(invalid.errors.centerName);
  assert.ok(invalid.errors.phone);

  const valid = validateDemoInquiry({
    fullName: 'آرش محمدی',
    centerName: 'گیم‌نت مترو گیم',
    phone: '۰۹۱۲-۳۴۵-۶۷۸۹',
    tierId: 'ultimate',
    notes: '۱۵ کنسول PS5 و ۳ میز بیلیارد',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.normalized.phone, '09123456789');
  assert.equal(valid.normalized.tierId, 'ultimate');
  assert.equal(valid.normalized.tierLabel, 'پلن ویژه');
});

test('Scene One (computeSceneOneReveal) executes 3-phase headline split, frontal rotation, and near-fullscreen expansion', () => {
  const s0 = computeSceneOneReveal(0);
  const sMid = computeSceneOneReveal(0.45);
  const sEnd = computeSceneOneReveal(1);

  assert.equal(s0.phase, 1);
  assert.equal(s0.line1X, 0);
  assert.equal(s0.line2X, 0);
  assert.equal(s0.copyOpacity, 1);
  assert.ok(s0.stageRotateX >= 14);

  assert.equal(sMid.phase, 2);
  assert.ok(sMid.line1X > 0 && sMid.line2X < 0);
  assert.ok(sMid.stageRotateX < s0.stageRotateX);
  assert.ok(sMid.stageScale > s0.stageScale);

  assert.equal(sEnd.phase, 3);
  assert.equal(sEnd.stageRotateX, 0);
  assert.equal(sEnd.copyOpacity, 0);
  assert.ok(sEnd.stageScale > 1.04);
  assert.equal(sEnd.handoffOpacity, 1);
  assert.deepEqual(computeSceneOneReveal(-2), s0);
  assert.deepEqual(computeSceneOneReveal(4), sEnd);
});

test('Scene Two (computeSceneTwoSoftware) covers 5 authentic software stops with crisp clip-path transitions and camera pan/zoom', () => {
  assert.equal(SOFTWARE_TOUR_STOPS.length, 5);
  assert.deepEqual(
    SOFTWARE_TOUR_STOPS.map((s) => s.id),
    ['stations', 'customers', 'buffet', 'finance', 'tournaments']
  );

  const t0 = computeSceneTwoSoftware(0);
  const t2 = computeSceneTwoSoftware(0.5);
  const t4 = computeSceneTwoSoftware(1);

  assert.equal(t0.activeIndex, 0);
  assert.equal(t0.layers[0].clipPct, 0);
  assert.equal(t0.layers[1].clipPct, 100);
  assert.ok(t0.cameraScale > 1);

  assert.equal(t2.activeIndex, 2);
  assert.equal(t2.layers[2].clipPct, 0);
  assert.equal(t2.layers[4].clipPct, 100);

  assert.equal(t4.activeIndex, 4);
  assert.equal(t4.layers[4].clipPct, 0);
  assert.equal(t4.calloutOpacity, 1);
});

test('Scene Three (computeSceneThreeHorizontal) glides RTL exhibition panels smoothly with bounded 3D depth', () => {
  assert.equal(HORIZONTAL_EXHIBITION_PANELS.length, 5);
  const h0 = computeSceneThreeHorizontal(0, 5, 2400);
  const hMid = computeSceneThreeHorizontal(0.5, 5, 2400);
  const hEnd = computeSceneThreeHorizontal(1, 5, 2400);

  assert.equal(h0.trackTranslateX, 0);
  assert.equal(h0.activeIndex, 0);
  assert.ok(hMid.trackTranslateX > 900 && hMid.trackTranslateX < 1500);
  assert.equal(hMid.activeIndex, 2);
  assert.equal(hEnd.trackTranslateX, 2400);
  assert.equal(hEnd.activeIndex, 4);

  for (const panel of hMid.panels) {
    assert.ok(Math.abs(panel.rotateY) <= 6);
    assert.ok(panel.scale >= 0.9 && panel.scale <= 1.0);
  }
});

test('Scene Four (computeSceneFourTournament) transforms centered single card into H2H, bracket, and champion leaderboard', () => {
  const f0 = computeSceneFourTournament(0.05);
  const fSplit = computeSceneFourTournament(0.36);
  const fBracket = computeSceneFourTournament(0.64);
  const fChamp = computeSceneFourTournament(0.98);

  assert.equal(f0.beatIndex, 0);
  assert.ok(f0.homeCenterOffsetPct < -40);
  assert.equal(f0.challengerOpacity, 0);
  assert.equal(f0.bracketOpacity, 0);

  assert.equal(fSplit.beatIndex, 1);
  assert.ok(fSplit.challengerOpacity > 0.7);
  assert.ok(fSplit.vsOpacity > 0.5);
  assert.ok(fSplit.vsDashOffset < 120);

  assert.equal(fBracket.beatIndex, 2);
  assert.equal(fBracket.homeCenterOffsetPct, 0);
  assert.ok(fBracket.bracketOpacity > 0.7);

  assert.equal(fChamp.beatIndex, 3);
  assert.equal(fChamp.bracketDashOffset, 0);
  assert.equal(fChamp.leaderboardOpacity, 1);
  assert.equal(fChamp.championHighlight, 1);
});

test('Scene Five (computeSceneFivePricing) fans converged glass monolith into 4 stationary readable pricing cards', () => {
  const p0 = computeSceneFivePricing(0);
  const pMid = computeSceneFivePricing(0.45);
  const pSettled = computeSceneFivePricing(0.92);

  assert.equal(p0.settled, false);
  assert.ok(p0.cards[0].offsetX < 0 && p0.cards[3].offsetX > 0);
  assert.ok(Math.abs(pMid.cards[0].offsetX) < Math.abs(p0.cards[0].offsetX));

  assert.equal(pSettled.settled, true);
  assert.equal(pSettled.featureOpacity, 1);
  assert.equal(pSettled.ultimateGlow, 1);
  for (const card of pSettled.cards) {
    assert.equal(card.offsetX, 0);
    assert.equal(card.offsetY, 0);
    assert.equal(card.rotateY, 0);
    assert.equal(card.scale, 1);
    assert.equal(card.opacity, 1);
  }
});
