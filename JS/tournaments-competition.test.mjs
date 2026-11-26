import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCAL_GAMENET_ID,
  createSeedTournaments,
  recordBracketMatchWinner,
} from './tournaments-engine.mjs';
import {
  LEADERBOARD_POINTS,
  acceptDirectChallenge,
  buildHeadToHeadMatchFromDirectChallenge,
  computeDirectChallengeTermsDiff,
  computeGamingCenterLeaderboard,
  confirmDirectChallengeTerms,
  createSeedDirectChallenges,
  filterDirectChallenges,
  proposeDirectChallengeChanges,
  rejectDirectChallenge,
  sanitizeDirectChallengeInput,
} from './tournaments-competition.mjs';

test('leaderboard points follow exact scoring rules (+100 win, +50 runner-up, +20 match win, 0 loss) without double-counting', () => {
  // Single completed 4-team tournament:
  // Semi 1: Game District beats Nexus Club (GD +20, NX 0)
  // Semi 2: Arena Plus beats Cyberland (AP +20, CL 0)
  // Final: Game District beats Arena Plus (GD +20 + 100 = 140; AP +0 + 50 = 70)
  const tournaments = [
    {
      id: 'trn-test-1',
      scope: 'inter_center',
      category: 'billiards',
      gameId: 'billiards-8ball',
      gameName: 'بیلیارد ایت‌بال (8-Ball)',
      status: 'completed',
      createdAt: '2026-11-20T10:00:00Z',
      bracket: {
        completedAt: '2026-11-24T20:00:00Z',
        champion: { id: 'p1', playerName: 'رضا', gamenetId: 'game-district', gamenetName: 'Game District' },
        runnerUp: { id: 'p3', playerName: 'کیان', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
        rounds: [
          {
            index: 0,
            matches: [
              {
                id: 'r0-m0',
                status: 'done',
                playerA: { id: 'p1', playerName: 'رضا', gamenetId: 'game-district', gamenetName: 'Game District' },
                playerB: { id: 'p2', playerName: 'سامان', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
                winnerId: 'p1',
              },
              {
                id: 'r0-m1',
                status: 'done',
                playerA: { id: 'p3', playerName: 'کیان', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
                playerB: { id: 'p4', playerName: 'مهدی', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
                winnerId: 'p3',
              },
              // Unverified & cancelled matches MUST award 0 points
              {
                id: 'r0-m2',
                status: 'done',
                cancelled: true,
                playerA: { id: 'p2', playerName: 'سامان', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
                playerB: { id: 'p4', playerName: 'مهدی', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
                winnerId: 'p2',
              },
              {
                id: 'r0-m3',
                status: 'done',
                verified: false,
                playerA: { id: 'p2', playerName: 'سامان', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
                playerB: { id: 'p4', playerName: 'مهدی', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
                winnerId: 'p2',
              },
            ],
          },
          {
            index: 1,
            matches: [
              {
                id: 'r1-m0',
                status: 'done',
                playerA: { id: 'p1', playerName: 'رضا', gamenetId: 'game-district', gamenetName: 'Game District' },
                playerB: { id: 'p3', playerName: 'کیان', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
                winnerId: 'p1',
              },
            ],
          },
        ],
      },
    },
    // Internal tournament must NOT inflate inter-center leaderboard
    {
      id: 'trn-internal-ignore',
      scope: 'internal',
      category: 'billiards',
      gameId: 'billiards-8ball',
      status: 'completed',
      bracket: {
        completedAt: '2026-11-25T10:00:00Z',
        champion: { id: 'i1', playerName: 'داخلی', gamenetId: 'game-district', gamenetName: 'Game District' },
        rounds: [
          {
            index: 0,
            matches: [
              {
                id: 'r0-m0',
                status: 'done',
                playerA: { id: 'i1', playerName: 'A', gamenetId: 'game-district', gamenetName: 'Game District' },
                playerB: { id: 'i2', playerName: 'B', gamenetId: 'game-district', gamenetName: 'Game District' },
                winnerId: 'i1',
              },
            ],
          },
        ],
      },
    },
  ];

  const board = computeGamingCenterLeaderboard(tournaments, [], { category: 'all', timeframe: 'all_time' });
  const gd = board.rows.find((r) => r.id === 'game-district');
  const ap = board.rows.find((r) => r.id === 'arena-plus');
  const nx = board.rows.find((r) => r.id === 'nexus-club');

  assert.equal(gd.points, LEADERBOARD_POINTS.TOURNAMENT_WIN + 2 * LEADERBOARD_POINTS.MATCH_WIN); // 140
  assert.equal(gd.wins, 2);
  assert.equal(gd.losses, 0);
  assert.equal(gd.winRate, 100);
  assert.equal(gd.rank, 1);

  assert.equal(ap.points, LEADERBOARD_POINTS.RUNNER_UP + LEADERBOARD_POINTS.MATCH_WIN); // 70
  assert.equal(ap.wins, 1);
  assert.equal(ap.losses, 1);
  assert.equal(ap.winRate, 50);
  assert.equal(ap.rank, 2);

  assert.equal(nx.points, 0);
  assert.equal(nx.wins, 0);
  assert.equal(nx.losses, 1);
});

test('leaderboard filters by category, specific game, and monthly vs all-time without double-counting linked direct challenges', () => {
  const h2hTournaments = [
    {
      id: 'trn-h2h-1',
      scope: 'inter_center',
      isHeadToHead: true,
      matchMode: 'head_to_head',
      sourceDirectChallengeId: 'dch-1',
      category: 'billiards',
      gameId: 'billiards-8ball',
      status: 'completed',
      bracket: {
        completedAt: '2026-11-25T15:00:00Z',
        champion: { id: 'a', playerName: 'رضا', gamenetId: 'game-district', gamenetName: 'Game District' },
        runnerUp: { id: 'b', playerName: 'علی', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
        rounds: [
          {
            index: 0,
            matches: [
              {
                id: 'r0-m0',
                status: 'done',
                playerA: { id: 'a', playerName: 'رضا', gamenetId: 'game-district', gamenetName: 'Game District' },
                playerB: { id: 'b', playerName: 'علی', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
                winnerId: 'a',
              },
            ],
          },
        ],
      },
    },
    {
      id: 'trn-old-cs2',
      scope: 'inter_center',
      category: 'video_games',
      gameId: 'cs2',
      status: 'completed',
      bracket: {
        completedAt: '2026-09-10T18:00:00Z', // Older than 30 days
        champion: { id: 'c1', playerName: 'Wolves', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
        runnerUp: { id: 'c2', playerName: 'Alpha', gamenetId: 'game-district', gamenetName: 'Game District' },
        rounds: [
          {
            index: 0,
            matches: [
              {
                id: 'r0-m0',
                status: 'done',
                playerA: { id: 'c1', playerName: 'Wolves', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
                playerB: { id: 'c2', playerName: 'Alpha', gamenetId: 'game-district', gamenetName: 'Game District' },
                winnerId: 'c1',
              },
            ],
          },
        ],
      },
    },
  ];

  // Duplicate completed direct challenge referencing trn-h2h-1 must NOT be counted twice!
  const directChallenges = [
    {
      id: 'dch-1',
      challengerGamenetId: 'game-district',
      challengerGamenetName: 'Game District',
      targetGamenetId: 'nexus-club',
      targetGamenetName: 'Nexus Club',
      category: 'billiards',
      gameId: 'billiards-8ball',
      status: 'completed',
      linkedTournamentId: 'trn-h2h-1',
      result: { winnerGamenetId: 'game-district', completedAt: '2026-11-25T15:00:00Z', verified: true },
    },
  ];

  const monthlyBilliards = computeGamingCenterLeaderboard(h2hTournaments, directChallenges, {
    category: 'billiards',
    game: 'billiards-8ball',
    timeframe: 'monthly',
  });
  const gdMonthly = monthlyBilliards.rows.find((r) => r.id === 'game-district');
  assert.equal(gdMonthly.points, 20); // Only +20 once, NOT 40 and NOT +100 tournament trophy
  assert.equal(gdMonthly.wins, 1);

  const monthlyAll = computeGamingCenterLeaderboard(h2hTournaments, directChallenges, {
    category: 'all',
    timeframe: 'monthly',
  });
  const cyberMonthly = monthlyAll.rows.find((r) => r.id === 'cyberland-isf');
  assert.equal(cyberMonthly.points, 0); // Sept event excluded from Monthly

  const allTimeAll = computeGamingCenterLeaderboard(h2hTournaments, directChallenges, {
    category: 'all',
    timeframe: 'all_time',
  });
  const cyberAllTime = allTimeAll.rows.find((r) => r.id === 'cyberland-isf');
  assert.equal(cyberAllTime.points, 120); // 100 champ + 20 match win
});

test('direct challenge lifecycle enforces validation, counter-proposal diffs, mutual agreement, and head-to-head conversion', () => {
  // Reject targeting self
  const badSelf = sanitizeDirectChallengeInput({ targetGamenetId: LOCAL_GAMENET_ID });
  assert.ok(badSelf.error);

  // Create valid physical billiards direct challenge
  const created = sanitizeDirectChallengeInput({
    targetGamenetId: 'nexus-club',
    category: 'billiards',
    gameId: 'billiards-8ball',
    entryType: 'individual',
    teamName: 'رضا حیدری',
    proposedDate: 'پنجشنبه ۶ آذر ۱۴۰۵',
    proposedTime: '۲۰:۰۰',
    venue: 'سالن بیلیارد Game District',
    prizeType: 'vip_session',
    prizeSummary: '۲ ساعت سشن VIP رایگان',
  });
  assert.ok(!created.error);
  const dc = { id: 'dch-unit-1', ...created.value };
  assert.equal(dc.mode, 'physical');
  assert.equal(dc.status, 'pending');

  // Target proposes changes -> must move to awaiting_agreement with diff
  const proposed = proposeDirectChallengeChanges(dc, {
    proposerGamenetId: 'nexus-club',
    proposedTime: '۲۱:۳۰',
    prizeSummary: '۳ ساعت سشن VIP رایگان',
    teamName: 'سامان نوری',
  });
  assert.ok(!proposed.error);
  assert.equal(proposed.challenge.status, 'awaiting_agreement');
  assert.equal(proposed.challenge.pendingProposal.diff.length, 2);
  assert.equal(proposed.challenge.agreements['nexus-club'], true);
  assert.equal(proposed.challenge.agreements[LOCAL_GAMENET_ID], false);

  // Direct accept must be blocked while counter-proposal awaits mutual confirmation
  const blockedAccept = acceptDirectChallenge(proposed.challenge, {});
  assert.ok(blockedAccept.error);

  // Challenger confirms final terms -> both agreed -> status becomes accepted
  const confirmed = confirmDirectChallengeTerms(proposed.challenge, {
    gamenetId: LOCAL_GAMENET_ID,
  });
  assert.ok(!confirmed.error);
  assert.equal(confirmed.bothAgreed, true);
  assert.equal(confirmed.challenge.status, 'accepted');
  assert.equal(confirmed.challenge.proposedTime, '۲۱:۳۰');
  assert.equal(confirmed.challenge.prizeSummary, '۳ ساعت سشن VIP رایگان');

  // Convert to Head-to-Head match & record result
  const built = buildHeadToHeadMatchFromDirectChallenge(confirmed.challenge, 'trn-h2h-unit');
  assert.ok(!built.error);
  assert.equal(built.tournament.isHeadToHead, true);
  assert.equal(built.tournament.bracket.rounds.length, 1);

  const rec = recordBracketMatchWinner(built.tournament.bracket, 'r0-m0', 'A', 5, 3);
  assert.ok(!rec.error);
  assert.equal(rec.completed, true);
  assert.equal(rec.champion.gamenetId, LOCAL_GAMENET_ID);
});

test('direct challenge rejection, terms diffing, and seed filtering work cleanly', () => {
  const seeds = createSeedDirectChallenges();
  assert.equal(seeds.length, 5);
  assert.equal(filterDirectChallenges(seeds, { box: 'incoming' }).length, 3);
  assert.equal(filterDirectChallenges(seeds, { box: 'sent' }).length, 2);
  assert.equal(filterDirectChallenges(seeds, { box: 'awaiting_agreement' }).length, 1);
  assert.equal(filterDirectChallenges(seeds, { box: 'rejected' }).length, 1);

  const diff = computeDirectChallengeTermsDiff(
    { proposedDate: 'جمعه', prizeSummary: '۲ ساعت VIP' },
    { proposedDate: 'شنبه', prizeSummary: '۴ ساعت VIP' }
  );
  assert.equal(diff.length, 2);

  const rej = rejectDirectChallenge(seeds[0], { reason: 'تداخل زمانی' });
  assert.ok(!rej.error);
  assert.equal(rej.challenge.status, 'rejected');
  assert.equal(rej.challenge.rejectionReason, 'تداخل زمانی');

  // Seed tournaments produce a non-empty leaderboard with valid rank movement
  const seedBoard = computeGamingCenterLeaderboard(createSeedTournaments(), seeds, {
    category: 'all',
    timeframe: 'all_time',
  });
  assert.ok(seedBoard.rows.length >= 6);
  assert.ok(seedBoard.rows[0].points > 0);
});
