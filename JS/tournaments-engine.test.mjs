import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPETITION_CATEGORIES,
  createSeedTournaments,
  createSeedTeams,
  createSeedChallenges,
  sanitizeTournamentInput,
  sanitizeTeamInput,
  sanitizeChallengeInput,
  validateParticipantInput,
  acceptChallengeForCenter,
  updateChallengePrizeAgreement,
  canFormTournamentFromChallenge,
  buildTournamentFromChallenge,
  generateSingleEliminationBracket,
  recordBracketMatchWinner,
  computeNetworkSummary,
  filterTournaments,
  filterChallenges,
  buildChampionHeadline,
  LOCAL_GAMENET_ID,
} from './tournaments-engine.mjs';

test('supports all 3 categories and separates online video games from physical billiards/foosball', () => {
  assert.equal(COMPETITION_CATEGORIES.length, 3);

  const onlineTrn = sanitizeTournamentInput({
    title: 'جام آنلاین ولورانت',
    category: 'video_games',
    gameId: 'valorant',
    maxSlots: '۸',
    prizeFirst: '۱۰ ساعت VIP رایگان',
    scope: 'inter_center',
  });
  assert.equal(onlineTrn.error, undefined);
  assert.equal(onlineTrn.value.mode, 'online');
  assert.equal(onlineTrn.value.platform, 'PC');
  assert.equal(onlineTrn.value.venue, '');

  const physicalTrn = sanitizeTournamentInput({
    title: 'مسابقه بیلیارد سالن',
    category: 'billiards',
    gameId: 'billiards-8ball',
    venue: 'سالن بیلیارد طبقه اول Game District',
    prizeFirst: 'چوب بیلیارد + ۵ ساعت بازی رایگان',
    scope: 'internal',
  });
  assert.equal(physicalTrn.error, undefined);
  assert.equal(physicalTrn.value.mode, 'physical');
  assert.equal(physicalTrn.value.platform, '');
  assert.equal(physicalTrn.value.lobbyCode, '');
  assert.equal(physicalTrn.value.venue, 'سالن بیلیارد طبقه اول Game District');
  assert.equal(physicalTrn.value.scope, 'internal');

  // Physical tournaments must NOT require an online ID for participants
  const physPlayer = validateParticipantInput(
    { playerName: 'مهدی کریمی', onlineId: '' },
    { status: 'registration', maxSlots: 8, category: 'billiards', mode: 'physical', participants: [] }
  );
  assert.equal(physPlayer.error, undefined);

  // Online tournaments MUST require an online ID
  const onlineMissingId = validateParticipantInput(
    { playerName: 'مهدی کریمی', onlineId: '' },
    { status: 'registration', maxSlots: 8, category: 'video_games', mode: 'online', participants: [] }
  );
  assert.ok(onlineMissingId.error);
});

test('representative team creation validates roster size for teams vs individuals', () => {
  const tooSmallTeam = sanitizeTeamInput({
    name: 'تیم بتا',
    category: 'video_games',
    gameId: 'cs2',
    entryType: 'team',
    members: ['علیرضا'],
  });
  assert.ok(tooSmallTeam.error);

  const validTeam = sanitizeTeamInput({
    name: 'تیم دلتا',
    category: 'foosball',
    gameId: 'foosball-2v2',
    entryType: 'team',
    members: ['علیرضا گوهری', 'جعفر محمدی'],
  });
  assert.equal(validTeam.error, undefined);
  assert.equal(validTeam.value.mode, 'physical');
  assert.equal(validTeam.value.members.length, 2);

  const validSolo = sanitizeTeamInput({
    name: 'قهرمان ایت‌بال',
    category: 'billiards',
    gameId: 'billiards-8ball',
    entryType: 'individual',
    members: ['رضا حیدری'],
  });
  assert.equal(validSolo.error, undefined);
  assert.equal(validSolo.value.entryType, 'individual');
});

test('public challenge acceptance, prize agreement (proposed -> agreed), and automatic tournament formation', () => {
  const created = sanitizeChallengeInput({
    category: 'foosball',
    gameId: 'foosball-2v2',
    teamName: 'تیم رعد',
    members: ['محمد باقر قالیباف', 'جعفر محمدی'],
    competitionScope: 'two_center',
    suggestedPrize: '۱۰ ساعت بازی VIP رایگان',
    venue: 'سالن اصلی Game District',
  });
  assert.equal(created.error, undefined);

  const challenge = { id: 'chl-test-1', ...created.value };
  assert.equal(challenge.prizeAgreement.status, 'proposed');
  assert.equal(canFormTournamentFromChallenge(challenge), false);

  // Second gaming center accepts with a counter-proposal -> remains 'proposed', but tournament formation is now unlocked!
  const accepted = acceptChallengeForCenter(challenge, {
    gamenetId: 'arena-plus',
    gamenetName: 'آرنا پلاس',
    city: 'تهران',
    teamName: 'زوج طوفان آرنا',
    members: ['سروش امینی', 'پویا ملکی'],
    counterPrize: '۱۵ ساعت بازی VIP + پذیرایی کامل بوفه',
    counterPrizeType: 'vip_session',
  });
  assert.equal(accepted.error, undefined);
  assert.equal(accepted.challenge.participatingCenters.length, 2);
  assert.equal(accepted.challenge.prizeAgreement.status, 'proposed');
  assert.equal(canFormTournamentFromChallenge(accepted.challenge), true);
  assert.equal(accepted.challenge.status, 'ready');

  // Host center confirms the counter-proposed prize -> status transitions to 'agreed'!
  const agreed = updateChallengePrizeAgreement(accepted.challenge, {
    actionType: 'confirm',
    gamenetId: LOCAL_GAMENET_ID,
    gamenetName: 'Game District',
  });
  assert.equal(agreed.error, undefined);
  assert.equal(agreed.challenge.prizeAgreement.status, 'agreed');

  // Auto-form tournament with 2-center direct Final bracket
  const formed = buildTournamentFromChallenge(agreed.challenge, {}, 'trn-auto-1');
  assert.equal(formed.error, undefined);
  assert.equal(formed.tournament.id, 'trn-auto-1');
  assert.equal(formed.tournament.mode, 'physical');
  assert.equal(formed.tournament.status, 'live');
  assert.equal(formed.tournament.participants.length, 2);
  assert.equal(formed.tournament.bracket.rounds.length, 1);
  assert.equal(formed.tournament.bracket.rounds[0].matches[0].status, 'ready');

  // Record final match winner & crown champion
  const crowned = recordBracketMatchWinner(formed.tournament.bracket, 'r1-m1', 'A', 10, 6);
  assert.equal(crowned.completed, true);
  assert.equal(crowned.champion.playerName, 'تیم رعد');
  assert.equal(crowned.bracket.runnerUp.playerName, 'زوج طوفان آرنا');
});

test('multi-round bracket handles byes and crowns champion with headline', () => {
  const participants = [
    { id: 'a', playerName: 'تیم Alpha', onlineId: 'Steam:A', gamenetId: LOCAL_GAMENET_ID, gamenetName: 'Game District' },
    { id: 'b', playerName: 'تیم Beta', onlineId: 'Steam:B', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
    { id: 'c', playerName: 'تیم Gamma', onlineId: 'Steam:C', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
  ];

  const bracket = generateSingleEliminationBracket(participants, 4);
  assert.equal(bracket.rounds.length, 2);
  assert.equal(bracket.rounds[0].matches[1].status, 'bye');
  assert.equal(bracket.rounds[1].matches[0].playerB.id, 'b');

  const semi = recordBracketMatchWinner(bracket, 'r1-m1', 'A', 16, 12);
  assert.equal(semi.completed, false);
  assert.equal(semi.bracket.rounds[1].matches[0].status, 'ready');

  const final = recordBracketMatchWinner(semi.bracket, 'r2-m1', 'A', 16, 10);
  assert.equal(final.completed, true);
  assert.equal(final.champion.playerName, 'تیم Alpha');

  const headline = buildChampionHeadline({
    gameName: 'Counter-Strike 2',
    completedDateLabel: '۵ آذر ۱۴۰۵',
    bracket: final.bracket,
  });
  assert.ok(headline.includes('تیم Alpha'));
  assert.ok(headline.includes('Game District'));
  assert.ok(headline.includes('Counter-Strike 2'));
});

test('seed data, category filtering, and network summary work seamlessly together', () => {
  const tournaments = createSeedTournaments();
  const challenges = createSeedChallenges();
  const teams = createSeedTeams();

  const summary = computeNetworkSummary(tournaments, challenges, teams);
  assert.equal(summary.totalTournaments, 5);
  assert.equal(summary.activeTournaments, 3);
  assert.equal(summary.internalCount, 1);
  assert.equal(summary.completedCount, 2);
  assert.equal(summary.openChallenges, 3);
  assert.equal(summary.readyChallenges, 1);
  assert.equal(summary.localTeamsCount, 3);

  assert.equal(filterTournaments(tournaments, { category: 'billiards' }).length, 2);
  assert.equal(filterTournaments(tournaments, { scope: 'internal' }).length, 1);
  assert.equal(filterChallenges(challenges, { category: 'foosball' }).length, 1);
});
