import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HERO_PREVIEW_TABS,
  FEATURE_STORY_CHAPTERS,
  TOURNAMENT_DISCIPLINES,
  SUBSCRIPTION_TIERS,
  COMPARISON_ROWS,
  resolveLandingTheme,
  getPreviewSrc,
  getFeatureChapter,
  getTournamentDiscipline,
  getComparisonRows,
  computeStageTilt,
  toggleFaqState,
  validateDemoInquiry,
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

test('TOURNAMENT_DISCIPLINES covers video games, billiards, and foosball with H2H, bracket, and leaderboard', () => {
  assert.equal(TOURNAMENT_DISCIPLINES.length, 3);
  assert.deepEqual(
    TOURNAMENT_DISCIPLINES.map((d) => d.id),
    ['video', 'billiards', 'foosball']
  );
  const billiards = getTournamentDiscipline('billiards');
  assert.equal(billiards.clubA.name, 'Game District');
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
    centerName: 'گیم‌نت دیستریکت',
    phone: '۰۹۱۲-۳۴۵-۶۷۸۹',
    tierId: 'ultimate',
    notes: '۱۵ کنسول PS5 و ۳ میز بیلیارد',
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.normalized.phone, '09123456789');
  assert.equal(valid.normalized.tierId, 'ultimate');
  assert.equal(valid.normalized.tierLabel, 'پلن ویژه');
});
