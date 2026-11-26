import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSeedTournaments,
  sanitizeTournamentInput,
  validateParticipantInput,
  generateSingleEliminationBracket,
  recordBracketMatchWinner,
  computeNetworkSummary,
  filterTournaments,
  LOCAL_GAMENET_ID,
} from './tournaments-engine.mjs';

test('sanitizeTournamentInput validates required fields and normalizes Persian numbers', () => {
  const bad = sanitizeTournamentInput({ title: 'ab', gameId: 'fc25', prizeFirst: 'جایزه' });
  assert.ok(bad.error);

  const missingPrize = sanitizeTournamentInput({ title: 'جام زمستانی', gameId: 'fc25', prizeFirst: '' });
  assert.ok(missingPrize.error);

  const valid = sanitizeTournamentInput({
    title: 'جام شبکه‌ای ولورانت',
    gameId: 'valorant',
    maxSlots: '۱۶',
    entryFee: '۱۰۰,۰۰۰',
    prizeType: 'mixed',
    prizePoolValue: '۱۲,۰۰۰,۰۰۰',
    prizeFirst: '۸ میلیون تومان + ۱۰ ساعت بازی',
    scope: 'network',
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.value.gameName, 'Valorant');
  assert.equal(valid.value.maxSlots, 16);
  assert.equal(valid.value.entryFee, 100000);
  assert.equal(valid.value.prizePoolValue, 12000000);
  assert.equal(valid.value.scope, 'network');
});

test('validateParticipantInput prevents duplicates, empty fields, and over-capacity enrollment', () => {
  const tournament = {
    status: 'registration',
    maxSlots: 2,
    participants: [
      { id: '1', playerName: 'علی', onlineId: 'Ali_Pro' },
    ],
  };

  assert.ok(validateParticipantInput({ playerName: '', onlineId: 'NewID' }, tournament).error);
  assert.ok(validateParticipantInput({ playerName: 'رضا', onlineId: 'ali_pro' }, tournament).error);

  const ok = validateParticipantInput({ playerName: 'رضا حسینی', onlineId: 'Reza_99' }, tournament);
  assert.equal(ok.error, undefined);
  assert.equal(ok.value.playerName, 'رضا حسینی');

  tournament.participants.push({ id: '2', playerName: 'رضا حسینی', onlineId: 'Reza_99' });
  const full = validateParticipantInput({ playerName: 'مهدی', onlineId: 'Mahdi_X' }, tournament);
  assert.ok(full.error);
});

test('generateSingleEliminationBracket handles byes and recordBracketMatchWinner crowns champion', () => {
  const participants = [
    { id: 'a', playerName: 'بازیکن ۱', onlineId: 'P1', gamenetId: LOCAL_GAMENET_ID, gamenetName: 'Game District' },
    { id: 'b', playerName: 'بازیکن ۲', onlineId: 'P2', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
    { id: 'c', playerName: 'بازیکن ۳', onlineId: 'P3', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
  ];

  const bracket = generateSingleEliminationBracket(participants, 4);
  assert.equal(bracket.rounds.length, 2);
  // Match 1 has playerA (a) vs playerB (c), Match 2 has playerA (b) with automatic bye to Final!
  assert.equal(bracket.rounds[0].matches[0].status, 'ready');
  assert.equal(bracket.rounds[0].matches[1].status, 'bye');
  assert.equal(bracket.rounds[1].matches[0].playerB.id, 'b');

  // Advance Match 1 winner (a)
  const step1 = recordBracketMatchWinner(bracket, 'r1-m1', 'A', 3, 1);
  assert.equal(step1.completed, false);
  assert.equal(step1.bracket.rounds[1].matches[0].playerA.id, 'a');
  assert.equal(step1.bracket.rounds[1].matches[0].status, 'ready');

  // Crown champion in Final
  const step2 = recordBracketMatchWinner(step1.bracket, 'r2-m1', 'B', 1, 3);
  assert.equal(step2.completed, true);
  assert.equal(step2.champion.id, 'b');
});

test('computeNetworkSummary and filterTournaments compute accurate network KPIs and leaderboard', () => {
  const seeds = createSeedTournaments();
  const summary = computeNetworkSummary(seeds);

  assert.equal(summary.totalTournaments, 4);
  assert.equal(summary.activeTournaments, 3);
  assert.ok(summary.connectedGamenets >= 6);
  assert.ok(summary.totalPrizePool > 0);
  assert.ok(summary.totalPlayers >= 16);
  assert.equal(summary.partnerLeaderboard[0].championships, 1);
  assert.equal(summary.partnerLeaderboard[0].id, LOCAL_GAMENET_ID);

  const regOnly = filterTournaments(seeds, { status: 'registration' });
  assert.equal(regOnly.length, 2);

  const byGame = filterTournaments(seeds, { game: 'fc25' });
  assert.equal(byGame.length, 1);
  assert.equal(byGame[0].id, 'trn-fc25-autumn');

  const search = filterTournaments(seeds, { query: 'اصفهان' });
  assert.equal(search.length, 1);
});
