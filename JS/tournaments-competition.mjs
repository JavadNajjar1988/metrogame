/**
 * Pure Domain Engine for:
 * 1. Gaming Center Leaderboard ("رتبه‌بندی گیم‌نت‌ها") with strict anti-double-counting
 * 2. Direct Gaming Center Challenges ("چالش مستقیم") with term counter-proposals,
 *    mutual agreement gating, and Head-to-Head match progression.
 *
 * Zero DOM dependencies — shared cleanly between backend.mjs, JS/tournaments-renderers.mjs,
 * JS/tournaments.js, and unit tests.
 */
import {
  COMPETITION_CATEGORIES,
  LOCAL_GAMENET_CITY,
  LOCAL_GAMENET_ID,
  LOCAL_GAMENET_NAME,
  LOCAL_GAMENET_VENUE,
  NETWORK_PARTNER_GAMENETS,
  PRIZE_TYPES,
  TOURNAMENT_GAMES,
  cleanText,
  getCategoryMeta,
  getPrizeTypeLabel,
  isPhysicalCategory,
  normalizeDigits,
  normalizeTournamentRecord,
  parseMembersList,
} from './tournaments-engine.mjs';

function getActivityById(gameId) {
  return TOURNAMENT_GAMES.find((g) => g.id === gameId) || null;
}

export const LEADERBOARD_POINTS = {
  TOURNAMENT_WIN: 100,
  RUNNER_UP: 50,
  MATCH_WIN: 20,
  MATCH_LOSS: 0,
};

export const DIRECT_CHALLENGE_STATUS_META = {
  pending: { id: 'pending', label: 'در انتظار پاسخ', tone: 'accent' },
  awaiting_agreement: { id: 'awaiting_agreement', label: 'در انتظار توافق نهایی', tone: 'amber' },
  accepted: { id: 'accepted', label: 'تاییدشده · آماده مسابقه', tone: 'emerald' },
  rejected: { id: 'rejected', label: 'رد شده', tone: 'rose' },
  completed: { id: 'completed', label: 'پایان‌یافته', tone: 'muted' },
};

/**
 * Enriched gaming center directory with safe visual identity tokens / local emblem paths.
 */
export const GAMING_CENTER_DIRECTORY = [
  {
    id: 'game-district',
    name: 'مترو گیم',
    shortCode: 'GD',
    city: 'تهران',
    venue: LOCAL_GAMENET_VENUE,
    logoUrl: 'src/assets/images/metrogame_emblem_1794207267121.jpg',
    brandHue: 'violet',
    isLocal: true,
    verified: true,
  },
  {
    id: 'nexus-club',
    name: 'Nexus Club',
    shortCode: 'NX',
    city: 'تهران',
    venue: 'باشگاه Nexus Club — تهران، جردن، سالن بیلیارد و VIP',
    logoUrl: '',
    brandHue: 'blue',
    isLocal: false,
    verified: true,
  },
  {
    id: 'arena-plus',
    name: 'آرنا پلاس',
    shortCode: 'AP',
    city: 'تهران',
    venue: 'باشگاه آرنا پلاس — تهران، شهرک غرب، سالن VIP',
    logoUrl: '',
    brandHue: 'indigo',
    isLocal: false,
    verified: true,
  },
  {
    id: 'cyberland-isf',
    name: 'سایبرلند',
    shortCode: 'CL',
    city: 'اصفهان',
    venue: 'باشگاه سایبرلند — اصفهان، خیابان چهارباغ بالا',
    logoUrl: '',
    brandHue: 'teal',
    isLocal: false,
    verified: true,
  },
  {
    id: 'neonzone-mhd',
    name: 'نئون‌زون',
    shortCode: 'NZ',
    city: 'مشهد',
    venue: 'مجموعه نئون‌زون — مشهد، بلوار وکیل‌آباد',
    logoUrl: '',
    brandHue: 'slate',
    isLocal: false,
    verified: true,
  },
  {
    id: 'parsian-shz',
    name: 'گیم‌کلاب پارسیان',
    shortCode: 'GP',
    city: 'شیراز',
    venue: 'گیم‌کلاب پارسیان — شیراز، معالی‌آباد، سالن بیلیارد و بازی',
    logoUrl: '',
    brandHue: 'amber',
    isLocal: false,
    verified: true,
  },
  {
    id: 'proplay-tbz',
    name: 'پروپلی',
    shortCode: 'PP',
    city: 'تبریز',
    venue: 'سالن پروپلی — تبریز، ولیعصر',
    logoUrl: '',
    brandHue: 'emerald',
    isLocal: false,
    verified: true,
  },
];

export function getGamingCenterInfo(centerId, fallbackName = '', fallbackCity = '') {
  const key = cleanText(centerId, 60);
  const found =
    GAMING_CENTER_DIRECTORY.find((c) => c.id === key) ||
    NETWORK_PARTNER_GAMENETS.find((c) => c.id === key);
  if (found) {
    return {
      id: found.id,
      name: found.name,
      shortCode:
        found.shortCode ||
        found.name
          .split(/\s+/)
          .map((w) => w[0] || '')
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      city: found.city || 'تهران',
      venue: found.venue || `سالن اصلی ${found.name}`,
      logoUrl: found.logoUrl || '',
      brandHue: found.brandHue || 'slate',
      isLocal: Boolean(found.isLocal || found.id === LOCAL_GAMENET_ID),
      verified: true,
    };
  }
  const safeName = cleanText(fallbackName, 70) || 'گیم‌نت عضو شبکه';
  return {
    id: key || 'partner-club',
    name: safeName,
    shortCode: safeName.slice(0, 2).toUpperCase(),
    city: cleanText(fallbackCity, 40) || 'ایران',
    venue: `سالن اصلی ${safeName}`,
    logoUrl: '',
    brandHue: 'slate',
    isLocal: key === LOCAL_GAMENET_ID,
    verified: true,
  };
}

export function getDirectChallengeStatusMeta(status) {
  return DIRECT_CHALLENGE_STATUS_META[status] || DIRECT_CHALLENGE_STATUS_META.pending;
}

/**
 * Helper to check if an ISO timestamp falls inside the "monthly" window (last 30 days
 * relative to referenceDateIso) for deterministic Monthly vs All-Time rankings.
 */
function isWithinMonthlyWindow(isoTimestamp, referenceMs) {
  if (!isoTimestamp) return true;
  const parsed = Date.parse(isoTimestamp);
  if (!Number.isFinite(parsed)) return true;
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  return referenceMs - parsed <= THIRTY_DAYS_MS;
}

/**
 * Collects verified competitive events from both Tournaments and Completed Direct Challenges
 * while strictly preventing double-counting of the same match or tournament finish.
 *
 * Rules:
 * - Tournament victory (multi-round inter-center tournament): +100 points (once per tournamentId)
 * - Runner-up (multi-round inter-center tournament): +50 points (once per tournamentId)
 * - Verified match victory (non-bye, non-cancelled, distinct centers): +20 points (once per matchKey)
 * - Match loss: 0 points
 * - Cancelled or unverified matches: 0 points (ignored)
 */
function aggregateLeaderboardStats(
  tournaments = [],
  directChallenges = [],
  filters = {},
  options = {}
) {
  const categoryFilter = filters.category || 'all';
  const gameFilter = filters.game || 'all';
  const timeframe = filters.timeframe || 'all_time'; // 'all_time' | 'monthly'
  const referenceMs = options.referenceMs ?? Date.parse('2026-11-26T23:59:59Z');
  const excludeEventId = options.excludeEventId || null;

  const statsMap = new Map();
  GAMING_CENTER_DIRECTORY.forEach((center) => {
    statsMap.set(center.id, {
      id: center.id,
      name: center.name,
      shortCode: center.shortCode,
      city: center.city,
      logoUrl: center.logoUrl,
      brandHue: center.brandHue,
      isLocal: center.isLocal,
      points: 0,
      tournamentWins: 0,
      runnerUps: 0,
      wins: 0,
      losses: 0,
      completedMatches: 0,
      winRate: 0,
    });
  });

  const ensureCenter = (centerId, fallbackName = '', fallbackCity = '') => {
    const id = cleanText(centerId, 60) || LOCAL_GAMENET_ID;
    if (!statsMap.has(id)) {
      const info = getGamingCenterInfo(id, fallbackName, fallbackCity);
      statsMap.set(id, {
        id: info.id,
        name: info.name,
        shortCode: info.shortCode,
        city: info.city,
        logoUrl: info.logoUrl,
        brandHue: info.brandHue,
        isLocal: info.isLocal,
        points: 0,
        tournamentWins: 0,
        runnerUps: 0,
        wins: 0,
        losses: 0,
        completedMatches: 0,
        winRate: 0,
      });
    }
    return statsMap.get(id);
  };

  // Deduplication guards so a single match or tournament finish can NEVER be counted twice
  const countedMatches = new Set();
  const countedTournamentFinishes = new Set();
  const linkedDirectIdsSeen = new Set();

  const matchesFilter = (category, gameId, eventIso) => {
    if (categoryFilter !== 'all' && category !== categoryFilter) return false;
    if (gameFilter !== 'all' && gameId !== gameFilter) return false;
    if (timeframe === 'monthly' && !isWithinMonthlyWindow(eventIso, referenceMs)) return false;
    return true;
  };

  const normalizedTournaments = (Array.isArray(tournaments) ? tournaments : []).map(
    normalizeTournamentRecord
  );

  for (const t of normalizedTournaments) {
    if (!t || t.cancelled === true) continue;
    if (excludeEventId && t.id === excludeEventId) continue;
    // Only rank inter-center competitions (internal single-center qualifiers don't inflate inter-center rank)
    if (t.scope === 'internal') continue;

    if (t.sourceDirectChallengeId) {
      linkedDirectIdsSeen.add(t.sourceDirectChallengeId);
    }

    const eventIso = t.bracket?.completedAt || t.createdAt || '';
    if (!matchesFilter(t.category, t.gameId, eventIso)) continue;

    const rounds = Array.isArray(t.bracket?.rounds) ? t.bracket.rounds : [];
    for (const round of rounds) {
      const matches = Array.isArray(round.matches) ? round.matches : [];
      for (const m of matches) {
        // Ignore pending, ready, bye, cancelled, or explicitly unverified matches
        if (m.status !== 'done') continue;
        if (m.cancelled === true || m.verified === false) continue;
        if (!m.playerA || !m.playerB || !m.winnerId) continue;

        const matchKey = `${t.id}::${m.id}`;
        if (countedMatches.has(matchKey)) continue;
        countedMatches.add(matchKey);

        const winner = m.winnerId === m.playerA.id ? m.playerA : m.playerB;
        const loser = m.winnerId === m.playerA.id ? m.playerB : m.playerA;

        const winCenterId = winner.gamenetId || t.hostGamenetId || LOCAL_GAMENET_ID;
        const loseCenterId = loser.gamenetId || t.hostGamenetId || LOCAL_GAMENET_ID;

        const winCenter = ensureCenter(winCenterId, winner.gamenetName);
        const loseCenter = ensureCenter(loseCenterId, loser.gamenetName);

        winCenter.wins += 1;
        winCenter.completedMatches += 1;
        winCenter.points += LEADERBOARD_POINTS.MATCH_WIN;

        loseCenter.losses += 1;
        loseCenter.completedMatches += 1;
        loseCenter.points += LEADERBOARD_POINTS.MATCH_LOSS;
      }
    }

    // Award Tournament Victory (+100) and Runner-Up (+50) only for completed tournaments (not standalone 1-match duels)
    const isStandaloneHeadToHead = Boolean(t.isHeadToHead || t.matchMode === 'head_to_head');
    if (
      t.status === 'completed' &&
      !isStandaloneHeadToHead &&
      t.bracket?.champion &&
      !countedTournamentFinishes.has(t.id)
    ) {
      countedTournamentFinishes.add(t.id);
      const champ = t.bracket.champion;
      const champCenter = ensureCenter(champ.gamenetId || t.hostGamenetId, champ.gamenetName);
      champCenter.tournamentWins += 1;
      champCenter.points += LEADERBOARD_POINTS.TOURNAMENT_WIN;

      const runnerUp = t.bracket.runnerUp;
      if (runnerUp && runnerUp.gamenetId !== champ.gamenetId) {
        const runnerCenter = ensureCenter(
          runnerUp.gamenetId || t.hostGamenetId,
          runnerUp.gamenetName
        );
        runnerCenter.runnerUps += 1;
        runnerCenter.points += LEADERBOARD_POINTS.RUNNER_UP;
      } else if (runnerUp && runnerUp.gamenetId === champ.gamenetId) {
        // Still award runner-up once if same center had both finalists, but never double-count the same placement
        const runnerCenter = ensureCenter(
          runnerUp.gamenetId || t.hostGamenetId,
          runnerUp.gamenetName
        );
        runnerCenter.runnerUps += 1;
        runnerCenter.points += LEADERBOARD_POINTS.RUNNER_UP;
      }
    }
  }

  // Count completed Direct Challenges that are NOT already represented in tournaments.json (anti-double-counting!)
  const directList = Array.isArray(directChallenges) ? directChallenges : [];
  for (const dc of directList) {
    if (!dc || dc.status !== 'completed' || !dc.result) continue;
    if (dc.result.cancelled === true || dc.result.verified === false) continue;
    if (excludeEventId && (dc.id === excludeEventId || dc.linkedTournamentId === excludeEventId)) {
      continue;
    }
    if (dc.linkedTournamentId && linkedDirectIdsSeen.has(dc.id)) {
      // Already counted via the linked head-to-head match in tournaments.json!
      continue;
    }

    const eventIso = dc.result.completedAt || dc.updatedAt || dc.createdAt || '';
    if (!matchesFilter(dc.category, dc.gameId, eventIso)) continue;

    const matchKey = `direct::${dc.id}`;
    if (countedMatches.has(matchKey)) continue;
    countedMatches.add(matchKey);

    const winnerCenterId = dc.result.winnerGamenetId;
    const loserCenterId =
      winnerCenterId === dc.challengerGamenetId ? dc.targetGamenetId : dc.challengerGamenetId;
    if (!winnerCenterId || !loserCenterId) continue;

    const winCenter = ensureCenter(
      winnerCenterId,
      winnerCenterId === dc.challengerGamenetId ? dc.challengerGamenetName : dc.targetGamenetName
    );
    const loseCenter = ensureCenter(
      loserCenterId,
      loserCenterId === dc.challengerGamenetId ? dc.challengerGamenetName : dc.targetGamenetName
    );

    winCenter.wins += 1;
    winCenter.completedMatches += 1;
    winCenter.points += LEADERBOARD_POINTS.MATCH_WIN;

    loseCenter.losses += 1;
    loseCenter.completedMatches += 1;
    loseCenter.points += LEADERBOARD_POINTS.MATCH_LOSS;
  }

  // Finalize win rates & deterministic sort
  const ranked = Array.from(statsMap.values())
    .map((row) => ({
      ...row,
      winRate:
        row.completedMatches > 0
          ? Math.round((row.wins / row.completedMatches) * 100)
          : 0,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.tournamentWins !== a.tournamentWins) return b.tournamentWins - a.tournamentWins;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (a.isLocal !== b.isLocal) return a.isLocal ? -1 : 1;
      return a.name.localeCompare(b.name, 'fa');
    });

  return ranked;
}

/**
 * Computes the official Gaming Center Leaderboard including movement vs previous position.
 * Previous position is derived deterministically by removing the single most recent
 * completed inter-center event in the filtered scope so rank movement always reflects real results.
 */
export function computeGamingCenterLeaderboard(
  tournaments = [],
  directChallenges = [],
  filters = {},
  options = {}
) {
  const referenceMs = options.referenceMs ?? Date.parse('2026-11-26T23:59:59Z');
  const current = aggregateLeaderboardStats(tournaments, directChallenges, filters, {
    referenceMs,
  });

  // Identify most recent completed event within the current filter to compute genuine rank movement
  const categoryFilter = filters.category || 'all';
  const gameFilter = filters.game || 'all';
  const timeframe = filters.timeframe || 'all_time';
  const completedEvents = [];

  (Array.isArray(tournaments) ? tournaments : []).forEach((raw) => {
    const t = normalizeTournamentRecord(raw);
    if (!t || t.scope === 'internal' || t.cancelled === true) return;
    const hasDone = (t.bracket?.rounds || []).some((r) =>
      (r.matches || []).some((m) => m.status === 'done' && m.playerA && m.playerB)
    );
    if (!hasDone) return;
    const iso = t.bracket?.completedAt || t.createdAt || '';
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return;
    if (gameFilter !== 'all' && t.gameId !== gameFilter) return;
    if (timeframe === 'monthly' && !isWithinMonthlyWindow(iso, referenceMs)) return;
    completedEvents.push({ id: t.id, ts: Date.parse(iso) || 0 });
  });

  (Array.isArray(directChallenges) ? directChallenges : []).forEach((dc) => {
    if (!dc || dc.status !== 'completed' || !dc.result || dc.linkedTournamentId) return;
    const iso = dc.result.completedAt || dc.updatedAt || '';
    if (categoryFilter !== 'all' && dc.category !== categoryFilter) return;
    if (gameFilter !== 'all' && dc.gameId !== gameFilter) return;
    if (timeframe === 'monthly' && !isWithinMonthlyWindow(iso, referenceMs)) return;
    completedEvents.push({ id: dc.id, ts: Date.parse(iso) || 0 });
  });

  completedEvents.sort((a, b) => b.ts - a.ts);
  const latestEventId = completedEvents[0]?.id || null;

  const previousRankMap = new Map();
  if (latestEventId) {
    const previous = aggregateLeaderboardStats(tournaments, directChallenges, filters, {
      referenceMs,
      excludeEventId: latestEventId,
    });
    previous.forEach((row, idx) => {
      previousRankMap.set(row.id, idx + 1);
    });
  }

  const rows = current.map((row, idx) => {
    const rank = idx + 1;
    const prevRank = previousRankMap.get(row.id) ?? rank;
    const delta = prevRank - rank; // positive = moved up (e.g. from 3 to 1 => +2)
    let movement = 'same';
    if (row.completedMatches === 0 && row.points === 0) {
      movement = 'same';
    } else if (delta > 0) {
      movement = 'up';
    } else if (delta < 0) {
      movement = 'down';
    }
    return {
      ...row,
      rank,
      previousRank: prevRank,
      movement,
      movementDelta: Math.abs(delta),
    };
  });

  const activeRows = rows.filter((r) => r.completedMatches > 0 || r.points > 0);
  const totalMatchesCounted = Math.round(
    rows.reduce((sum, r) => sum + r.completedMatches, 0) / 2
  );

  return {
    rows,
    activeCentersCount: activeRows.length,
    totalMatchesCounted,
    leader: rows[0] || null,
    scoringRules: [
      { key: 'tournament_win', label: 'قهرمانی تورنومنت', points: LEADERBOARD_POINTS.TOURNAMENT_WIN },
      { key: 'runner_up', label: 'نایب‌قهرمانی تورنومنت', points: LEADERBOARD_POINTS.RUNNER_UP },
      { key: 'match_win', label: 'برد در هر دیدار رسمی', points: LEADERBOARD_POINTS.MATCH_WIN },
      { key: 'match_loss', label: 'باخت در دیدار', points: LEADERBOARD_POINTS.MATCH_LOSS },
    ],
  };
}

/* ==========================================================================
   DIRECT GAMING CENTER CHALLENGES ("چالش مستقیم")
   ========================================================================== */

export function sanitizeDirectChallengeInput(input = {}) {
  const targetGamenetId = cleanText(input.targetGamenetId, 60);
  if (!targetGamenetId || targetGamenetId === LOCAL_GAMENET_ID) {
    return { error: 'لطفاً یک گیم‌نت مقصد معتبر از شبکه انتخاب کنید.' };
  }
  const targetCenter = getGamingCenterInfo(targetGamenetId, input.targetGamenetName);

  const category = COMPETITION_CATEGORIES.some((c) => c.id === input.category)
    ? input.category
    : 'video_games';
  const physicalOnly = isPhysicalCategory(category);

  let mode = physicalOnly ? 'physical' : input.mode === 'physical' ? 'physical' : 'online';
  const activity = getActivityById(input.gameId);
  const gameId =
    activity && activity.category === category
      ? activity.id
      : TOURNAMENT_GAMES.find((g) => g.category === category)?.id || 'fc25';
  const resolvedActivity = getActivityById(gameId);
  const gameName =
    input.gameId === 'custom'
      ? cleanText(input.customGameName, 60) || resolvedActivity?.name || 'مسابقه سفارشی'
      : resolvedActivity?.name || 'EA Sports FC 25';

  const entryType = input.entryType === 'team' ? 'team' : 'individual';
  const format =
    cleanText(input.format, 50) ||
    (entryType === 'team' ? resolvedActivity?.defaultFormat || 'تیمی ۲ به ۲' : 'انفرادی ۱ به ۱');

  const teamName = cleanText(input.teamName, 60);
  const members = parseMembersList(input.members);
  if (!teamName) {
    return { error: 'نام بازیکن یا تیم نماینده گیم‌نت خود را وارد کنید.' };
  }
  if (entryType === 'team' && members.length < 2) {
    return { error: 'برای چالش تیمی حداقل ۲ عضو از مشتریان یا ترکیب تیم را انتخاب کنید.' };
  }

  const proposedDate = cleanText(input.proposedDate, 50);
  const proposedTime = cleanText(input.proposedTime, 30);
  if (!proposedDate) {
    return { error: 'تاریخ پیشنهادی برگزاری مسابقه را مشخص کنید.' };
  }

  const venue =
    mode === 'physical'
      ? cleanText(input.venue, 110) || LOCAL_GAMENET_VENUE
      : '';
  const platform =
    mode === 'online'
      ? cleanText(input.platform, 40) || resolvedActivity?.platform || 'PC'
      : resolvedActivity?.platform || 'میز رسمی سالن';

  const prizeType = PRIZE_TYPES.some((p) => p.id === input.prizeType)
    ? input.prizeType
    : 'vip_session';
  const prizeSummary = cleanText(input.prizeSummary, 160);
  if (!prizeSummary) {
    return { error: 'جایزه یا پاداش پیشنهادی چالش را وارد کنید.' };
  }

  const notes = cleanText(input.notes, 260);
  const finalMembers =
    members.length > 0 ? members : [{ name: teamName, customerId: null, role: 'نماینده اصلی' }];

  const terms = {
    proposedDate,
    proposedTime: proposedTime || '۲۱:۰۰',
    mode,
    venue,
    platform,
    format,
    prizeType,
    prizeSummary,
    notes,
  };

  return {
    value: {
      challengerGamenetId: LOCAL_GAMENET_ID,
      challengerGamenetName: LOCAL_GAMENET_NAME,
      challengerCity: LOCAL_GAMENET_CITY,
      targetGamenetId: targetCenter.id,
      targetGamenetName: targetCenter.name,
      targetCity: targetCenter.city,
      category,
      gameId,
      gameName,
      mode,
      entryType,
      format,
      platform,
      venue,
      proposedDate: terms.proposedDate,
      proposedTime: terms.proposedTime,
      prizeType: terms.prizeType,
      prizeSummary: terms.prizeSummary,
      notes: terms.notes,
      challengerRoster: {
        teamId: cleanText(input.teamId, 60) || '',
        teamName,
        onlineId: mode === 'online' ? cleanText(input.onlineId, 50) : '',
        members: finalMembers,
      },
      targetRoster: null,
      status: 'pending',
      originalTerms: { ...terms },
      currentTerms: { ...terms },
      pendingProposal: null,
      agreements: {
        [LOCAL_GAMENET_ID]: true,
        [targetCenter.id]: false,
      },
      rejectionReason: '',
      linkedTournamentId: null,
      result: null,
      updatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Computes field-by-field comparison between original and proposed terms for transparent negotiation.
 */
export function computeDirectChallengeTermsDiff(originalTerms = {}, updatedTerms = {}) {
  const fields = [
    { key: 'proposedDate', label: 'تاریخ برگزاری' },
    { key: 'proposedTime', label: 'ساعت شروع' },
    { key: 'mode', label: 'نوع برگزاری', format: (v) => (v === 'physical' ? 'حضوری در سالن' : 'آنلاین') },
    { key: 'venue', label: 'محل میزبانی' },
    { key: 'format', label: 'فرمت مسابقه' },
    { key: 'prizeType', label: 'نوع جایزه', format: (v) => getPrizeTypeLabel(v) },
    { key: 'prizeSummary', label: 'شرح جایزه' },
    { key: 'notes', label: 'توضیحات تکمیلی' },
  ];

  return fields
    .map((f) => {
      const rawOld = cleanText(originalTerms?.[f.key], 200);
      const rawNew = cleanText(updatedTerms?.[f.key], 200);
      if (rawOld === rawNew) return null;
      return {
        key: f.key,
        label: f.label,
        original: f.format ? f.format(rawOld) : rawOld || '—',
        updated: f.format ? f.format(rawNew) : rawNew || '—',
      };
    })
    .filter(Boolean);
}

/**
 * Recipient accepts a pending direct challenge directly with its original terms,
 * or both sides confirm when no counter-proposal is pending.
 */
export function acceptDirectChallenge(challenge, payload = {}) {
  if (!challenge) return { error: 'چالش مستقیم یافت نشد.' };
  if (challenge.status === 'rejected' || challenge.status === 'completed') {
    return { error: 'این چالش مستقیم دیگر قابل پذیرش نیست.' };
  }
  if (challenge.status === 'awaiting_agreement') {
    return { error: 'تغییراتی روی شرایط پیشنهاد شده است؛ لطفاً از گزینه «تایید شرایط نهایی» استفاده کنید.' };
  }

  const next = structuredClone(challenge);
  const teamName =
    cleanText(payload.teamName, 60) ||
    next.targetRoster?.teamName ||
    `نماینده ${next.targetGamenetName}`;
  const members = parseMembersList(payload.members);
  const resolvedMembers =
    members.length > 0
      ? members
      : next.targetRoster?.members?.length
        ? next.targetRoster.members
        : [{ name: teamName, customerId: null, role: 'نماینده اصلی' }];

  if (next.entryType === 'team' && resolvedMembers.length < 2) {
    return { error: 'برای چالش تیمی حداقل ۲ عضو نماینده وارد کنید.' };
  }

  next.targetRoster = {
    teamId: cleanText(payload.teamId, 60) || next.targetRoster?.teamId || '',
    teamName,
    onlineId: next.mode === 'online' ? cleanText(payload.onlineId, 50) : '',
    members: resolvedMembers,
  };

  next.agreements = {
    ...(next.agreements || {}),
    [next.challengerGamenetId]: true,
    [next.targetGamenetId]: true,
  };
  next.status = 'accepted';
  next.pendingProposal = null;
  next.updatedAt = new Date().toISOString();
  return { challenge: next };
}

/**
 * Rejects a direct challenge with an optional polite reason.
 */
export function rejectDirectChallenge(challenge, payload = {}) {
  if (!challenge) return { error: 'چالش مستقیم یافت نشد.' };
  if (challenge.status === 'completed') {
    return { error: 'چالش پایان‌یافته را نمی‌توان رد کرد.' };
  }
  const next = structuredClone(challenge);
  next.status = 'rejected';
  next.rejectionReason =
    cleanText(payload.reason, 200) || 'به دلیل تداخل برنامه سالن در تاریخ پیشنهادی، فعلاً امکان برگزاری وجود ندارد.';
  next.pendingProposal = null;
  next.updatedAt = new Date().toISOString();
  return { challenge: next };
}

/**
 * Proposes modified terms (date, time, venue, mode, prize, format, notes).
 * Resets the OTHER center's confirmation to false so BOTH centers must explicitly agree.
 */
export function proposeDirectChallengeChanges(challenge, payload = {}) {
  if (!challenge) return { error: 'چالش مستقیم یافت نشد.' };
  if (challenge.status === 'rejected' || challenge.status === 'completed') {
    return { error: 'امکان تغییر شرایط برای این چالش وجود ندارد.' };
  }

  const next = structuredClone(challenge);
  const proposerId = cleanText(payload.proposerGamenetId, 60) || LOCAL_GAMENET_ID;
  const proposerCenter = getGamingCenterInfo(proposerId);
  const baseTerms = next.currentTerms || next.originalTerms || {};
  const physicalOnly = isPhysicalCategory(next.category);

  const nextMode = physicalOnly
    ? 'physical'
    : payload.mode === 'physical' || payload.mode === 'online'
      ? payload.mode
      : baseTerms.mode || next.mode;

  const updatedTerms = {
    proposedDate: cleanText(payload.proposedDate, 50) || baseTerms.proposedDate || next.proposedDate,
    proposedTime: cleanText(payload.proposedTime, 30) || baseTerms.proposedTime || next.proposedTime,
    mode: nextMode,
    venue:
      nextMode === 'physical'
        ? cleanText(payload.venue, 110) || baseTerms.venue || next.venue || LOCAL_GAMENET_VENUE
        : '',
    platform: baseTerms.platform || next.platform,
    format: cleanText(payload.format, 50) || baseTerms.format || next.format,
    prizeType: PRIZE_TYPES.some((p) => p.id === payload.prizeType)
      ? payload.prizeType
      : baseTerms.prizeType || next.prizeType,
    prizeSummary:
      cleanText(payload.prizeSummary, 160) || baseTerms.prizeSummary || next.prizeSummary,
    notes:
      payload.notes !== undefined
        ? cleanText(payload.notes, 260)
        : baseTerms.notes || next.notes || '',
  };

  const diff = computeDirectChallengeTermsDiff(baseTerms, updatedTerms);
  if (diff.length === 0) {
    return { error: 'حداقل یک مورد (تاریخ، ساعت، محل برگزاری، فرمت یا جایزه) را تغییر دهید.' };
  }

  // Optional target roster attachment if the recipient is submitting the counter-proposal
  if (cleanText(payload.teamName, 60)) {
    const members = parseMembersList(payload.members);
    const tName = cleanText(payload.teamName, 60);
    next.targetRoster = {
      teamId: cleanText(payload.teamId, 60) || '',
      teamName: tName,
      onlineId: nextMode === 'online' ? cleanText(payload.onlineId, 50) : '',
      members: members.length > 0 ? members : [{ name: tName, customerId: null, role: 'نماینده اصلی' }],
    };
  }

  const otherCenterId =
    proposerId === next.challengerGamenetId ? next.targetGamenetId : next.challengerGamenetId;

  next.pendingProposal = {
    proposedById: proposerId,
    proposedByName: proposerCenter.name,
    proposedAt: new Date().toISOString(),
    previousTerms: { ...baseTerms },
    proposedTerms: { ...updatedTerms },
    diff,
  };
  next.agreements = {
    [proposerId]: true,
    [otherCenterId]: false,
  };
  next.status = 'awaiting_agreement';
  next.updatedAt = new Date().toISOString();
  return { challenge: next };
}

/**
 * Confirms proposed final terms. Challenge ONLY becomes `accepted` once BOTH centers
 * have explicitly agreed (`agreements[challenger] && agreements[target]`).
 */
export function confirmDirectChallengeTerms(challenge, payload = {}) {
  if (!challenge) return { error: 'چالش مستقیم یافت نشد.' };
  if (challenge.status !== 'awaiting_agreement') {
    return { error: 'این چالش در مرحله توافق نهایی شرایط نیست.' };
  }

  const next = structuredClone(challenge);
  const confirmingCenterId = cleanText(payload.gamenetId, 60) || LOCAL_GAMENET_ID;
  const finalizeBoth = payload.confirmBoth === '1' || payload.confirmBoth === true;

  next.agreements = { ...(next.agreements || {}) };
  if (finalizeBoth) {
    next.agreements[next.challengerGamenetId] = true;
    next.agreements[next.targetGamenetId] = true;
  } else {
    next.agreements[confirmingCenterId] = true;
  }

  // Attach target roster if supplied during confirmation
  if (!next.targetRoster && cleanText(payload.teamName, 60)) {
    const tName = cleanText(payload.teamName, 60);
    const members = parseMembersList(payload.members);
    next.targetRoster = {
      teamId: cleanText(payload.teamId, 60) || '',
      teamName: tName,
      onlineId: next.mode === 'online' ? cleanText(payload.onlineId, 50) : '',
      members: members.length > 0 ? members : [{ name: tName, customerId: null, role: 'نماینده اصلی' }],
    };
  }

  const bothAgreed = Boolean(
    next.agreements[next.challengerGamenetId] && next.agreements[next.targetGamenetId]
  );

  if (bothAgreed) {
    const finalTerms = next.pendingProposal?.proposedTerms || next.currentTerms;
    next.currentTerms = { ...finalTerms };
    next.proposedDate = finalTerms.proposedDate;
    next.proposedTime = finalTerms.proposedTime;
    next.mode = finalTerms.mode;
    next.venue = finalTerms.venue;
    next.format = finalTerms.format;
    next.prizeType = finalTerms.prizeType;
    next.prizeSummary = finalTerms.prizeSummary;
    next.notes = finalTerms.notes;
    next.pendingProposal = null;
    next.status = 'accepted';
    if (!next.targetRoster) {
      next.targetRoster = {
        teamId: '',
        teamName: `نماینده ${next.targetGamenetName}`,
        onlineId: '',
        members: [{ name: `نماینده ${next.targetGamenetName}`, customerId: null, role: 'نماینده اصلی' }],
      };
    }
  }
  next.updatedAt = new Date().toISOString();
  return { challenge: next, bothAgreed };
}

/**
 * Converts an accepted Direct Challenge into an integrated Head-to-Head Match record
 * compatible with tournaments.json so it flows naturally into Active Tournaments,
 * the dedicated Head-to-Head Match View, and Leaderboard points.
 */
export function buildHeadToHeadMatchFromDirectChallenge(challenge, generatedTournamentId) {
  if (!challenge || challenge.status !== 'accepted') {
    return { error: 'ابتدا هر دو گیم‌نت باید شرایط چالش مستقیم را تایید کنند.' };
  }

  const cRoster = challenge.challengerRoster || {
    teamName: `نماینده ${challenge.challengerGamenetName}`,
    members: [],
  };
  const tRoster = challenge.targetRoster || {
    teamName: `نماینده ${challenge.targetGamenetName}`,
    members: [],
  };

  const pA = {
    id: `${challenge.id}-pA`,
    playerName: cRoster.teamName,
    onlineId: challenge.mode === 'online' ? cRoster.onlineId || '' : '',
    gamenetId: challenge.challengerGamenetId,
    gamenetName: challenge.challengerGamenetName,
    city: challenge.challengerCity,
    members: Array.isArray(cRoster.members) ? cRoster.members : [],
    joinedAt: challenge.updatedAt || new Date().toISOString(),
  };

  const pB = {
    id: `${challenge.id}-pB`,
    playerName: tRoster.teamName,
    onlineId: challenge.mode === 'online' ? tRoster.onlineId || '' : '',
    gamenetId: challenge.targetGamenetId,
    gamenetName: challenge.targetGamenetName,
    city: challenge.targetCity,
    members: Array.isArray(tRoster.members) ? tRoster.members : [],
    joinedAt: challenge.updatedAt || new Date().toISOString(),
  };

  const startDate = `${challenge.proposedDate}${challenge.proposedTime ? ` — ساعت ${challenge.proposedTime}` : ''}`;

  const tournament = normalizeTournamentRecord({
    id: generatedTournamentId,
    scope: 'inter_center',
    matchMode: 'head_to_head',
    isHeadToHead: true,
    sourceDirectChallengeId: challenge.id,
    category: challenge.category,
    mode: challenge.mode,
    title: `دیدار رو‌در‌رو: ${challenge.challengerGamenetName} مقابل ${challenge.targetGamenetName} (${challenge.gameName})`,
    gameId: challenge.gameId,
    gameName: challenge.gameName,
    platform: challenge.platform,
    venue: challenge.mode === 'physical' ? challenge.venue : '',
    entryType: challenge.entryType,
    format: challenge.format,
    maxSlots: 2,
    startDate,
    registrationDeadline: challenge.proposedDate,
    lobbyCode: challenge.mode === 'online' ? `H2H-${challenge.id.slice(-4).toUpperCase()}` : '',
    rules:
      challenge.notes ||
      `دیدار رسمی مستقیم بین ${challenge.challengerGamenetName} و ${challenge.targetGamenetName} با توافق کامل طرفین.`,
    hostGamenetId: challenge.challengerGamenetId,
    hostGamenetName: challenge.challengerGamenetName,
    hostCity: challenge.challengerCity,
    prizeType: challenge.prizeType,
    prizePoolValue: 0,
    prizes: {
      first: challenge.prizeSummary,
      second: '',
      third: '',
    },
    prizeAgreement: {
      status: 'agreed',
      type: challenge.prizeType,
      summary: challenge.prizeSummary,
      proposedById: challenge.challengerGamenetId,
      proposedByName: challenge.challengerGamenetName,
      confirmations: [
        {
          gamenetId: challenge.challengerGamenetId,
          gamenetName: challenge.challengerGamenetName,
          agreed: true,
        },
        {
          gamenetId: challenge.targetGamenetId,
          gamenetName: challenge.targetGamenetName,
          agreed: true,
        },
      ],
    },
    status: 'live',
    createdAt: new Date().toISOString(),
    participants: [pA, pB],
    bracket: {
      generatedAt: new Date().toISOString(),
      size: 2,
      champion: null,
      runnerUp: null,
      finalScore: null,
      completedAt: null,
      rounds: [
        {
          index: 0,
          name: 'دیدار رو‌در‌رو (Head-to-Head)',
          matches: [
            {
              id: 'r0-m0',
              roundIndex: 0,
              matchIndex: 0,
              playerA: {
                id: pA.id,
                playerName: pA.playerName,
                onlineId: pA.onlineId,
                gamenetId: pA.gamenetId,
                gamenetName: pA.gamenetName,
                members: pA.members,
              },
              playerB: {
                id: pB.id,
                playerName: pB.playerName,
                onlineId: pB.onlineId,
                gamenetId: pB.gamenetId,
                gamenetName: pB.gamenetName,
                members: pB.members,
              },
              scoreA: null,
              scoreB: null,
              winnerId: null,
              status: 'ready',
              verified: true,
            },
          ],
        },
      ],
    },
  });

  return { tournament };
}

/**
 * Filters Direct Challenges by inbox view, category, and search query.
 */
export function filterDirectChallenges(list = [], filters = {}) {
  const items = Array.isArray(list) ? list : [];
  const box = filters.box || 'all'; // all | incoming | sent | pending | awaiting_agreement | accepted | rejected | completed
  const category = filters.category || 'all';
  const query = cleanText(filters.query, 80).toLowerCase();

  return items.filter((dc) => {
    if (category !== 'all' && dc.category !== category) return false;
    if (box === 'incoming' && dc.targetGamenetId !== LOCAL_GAMENET_ID) return false;
    if (box === 'sent' && dc.challengerGamenetId !== LOCAL_GAMENET_ID) return false;
    if (box === 'pending' && dc.status !== 'pending') return false;
    if (box === 'awaiting_agreement' && dc.status !== 'awaiting_agreement') return false;
    if (box === 'accepted' && dc.status !== 'accepted') return false;
    if (box === 'rejected' && dc.status !== 'rejected') return false;
    if (box === 'completed' && dc.status !== 'completed') return false;

    if (query) {
      const hay = [
        dc.challengerGamenetName,
        dc.targetGamenetName,
        dc.gameName,
        dc.prizeSummary,
        dc.venue,
        dc.notes,
        dc.challengerRoster?.teamName,
        dc.targetRoster?.teamName,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

/**
 * Deterministic rich seed Direct Challenges covering every workflow state:
 * 1. Sent & Pending: مترو گیم VS Nexus Club (Billiards 1v1, 2 Hours VIP)
 * 2. Incoming & Pending: آرنا پلاس VS مترو گیم (Foosball 2v2)
 * 3. Awaiting Agreement (Counter-Proposal Diff): مترو گیم VS سایبرلند (CS2 5v5)
 * 4. Accepted (Ready Head-to-Head): گیم‌کلاب پارسیان VS مترو گیم (EA Sports FC 25 1v1)
 * 5. Rejected: نئون‌زون VS مترو گیم (Valorant 5v5)
 */
export function createSeedDirectChallenges() {
  const cs2Orig = {
    proposedDate: 'جمعه ۷ آذر ۱۴۰۵',
    proposedTime: '۲۰:۳۰',
    mode: 'online',
    venue: '',
    platform: 'PC',
    format: 'تیمی ۵ به ۵ (Best of 3)',
    prizeType: 'vip_session',
    prizeSummary: '۱۰ ساعت سشن VIP رایگان برای تیم برنده',
    notes: 'نقشه‌های Mirage، Inferno و Ancient با قوانین استاندارد MR12',
  };
  const cs2Counter = {
    ...cs2Orig,
    proposedDate: 'شنبه ۸ آذر ۱۴۰۵',
    proposedTime: '۲۱:۳۰',
    prizeType: 'mixed',
    prizeSummary: '۱۵ ساعت سشن VIP رایگان + ۳,۰۰۰,۰۰۰ تومان اعتبار بوفه',
    notes: 'لطفاً بازی به شنبه شب منتقل شود تا ترکیب کامل هر دو باشگاه حاضر باشد.',
  };

  return [
    {
      id: 'dch-gd-nexus-billiards',
      challengerGamenetId: LOCAL_GAMENET_ID,
      challengerGamenetName: LOCAL_GAMENET_NAME,
      challengerCity: LOCAL_GAMENET_CITY,
      targetGamenetId: 'nexus-club',
      targetGamenetName: 'Nexus Club',
      targetCity: 'تهران',
      category: 'billiards',
      gameId: 'billiards-8ball',
      gameName: 'بیلیارد ایت‌بال (8-Ball)',
      mode: 'physical',
      entryType: 'individual',
      format: 'انفرادی ۱ به ۱ (بهترین از ۷ گیم)',
      platform: 'میز ۹ فوت باشگاهی',
      venue: LOCAL_GAMENET_VENUE,
      proposedDate: 'پنجشنبه ۶ آذر ۱۴۰۵',
      proposedTime: '۱۹:۰۰',
      prizeType: 'vip_session',
      prizeSummary: '۲ ساعت بازی VIP رایگان در سالن میزبان',
      notes: 'مسابقه حضوری روی میز شماره ۱ سالن بیلیارد مترو گیم با داوری رسمی.',
      challengerRoster: {
        teamId: 'team-gd-billiards',
        teamName: 'رضا حیدری (قهرمان ایت‌بال)',
        onlineId: '',
        members: [{ name: 'رضا حیدری', customerId: '104', role: 'بازیکن انفرادی ایت‌بال' }],
      },
      targetRoster: null,
      status: 'pending',
      originalTerms: {
        proposedDate: 'پنجشنبه ۶ آذر ۱۴۰۵',
        proposedTime: '۱۹:۰۰',
        mode: 'physical',
        venue: LOCAL_GAMENET_VENUE,
        platform: 'میز ۹ فوت باشگاهی',
        format: 'انفرادی ۱ به ۱ (بهترین از ۷ گیم)',
        prizeType: 'vip_session',
        prizeSummary: '۲ ساعت بازی VIP رایگان در سالن میزبان',
        notes: 'مسابقه حضوری روی میز شماره ۱ سالن بیلیارد مترو گیم با داوری رسمی.',
      },
      currentTerms: {
        proposedDate: 'پنجشنبه ۶ آذر ۱۴۰۵',
        proposedTime: '۱۹:۰۰',
        mode: 'physical',
        venue: LOCAL_GAMENET_VENUE,
        platform: 'میز ۹ فوت باشگاهی',
        format: 'انفرادی ۱ به ۱ (بهترین از ۷ گیم)',
        prizeType: 'vip_session',
        prizeSummary: '۲ ساعت بازی VIP رایگان در سالن میزبان',
        notes: 'مسابقه حضوری روی میز شماره ۱ سالن بیلیارد مترو گیم با داوری رسمی.',
      },
      pendingProposal: null,
      agreements: {
        [LOCAL_GAMENET_ID]: true,
        'nexus-club': false,
      },
      rejectionReason: '',
      linkedTournamentId: null,
      result: null,
      createdAt: '2026-11-25T14:20:00Z',
      updatedAt: '2026-11-25T14:20:00Z',
    },
    {
      id: 'dch-arena-gd-foosball',
      challengerGamenetId: 'arena-plus',
      challengerGamenetName: 'آرنا پلاس',
      challengerCity: 'تهران',
      targetGamenetId: LOCAL_GAMENET_ID,
      targetGamenetName: LOCAL_GAMENET_NAME,
      targetCity: LOCAL_GAMENET_CITY,
      category: 'foosball',
      gameId: 'foosball-2v2',
      gameName: 'فوتبال دستی تیمی (۲ به ۲)',
      mode: 'physical',
      entryType: 'team',
      format: 'تیمی ۲ به ۲ (بهترین از ۵ ست)',
      platform: 'میز حرفه‌ای تورنومنت',
      venue: 'باشگاه آرنا پلاس — تهران، شهرک غرب، سالن میزهای حرفه‌ای',
      proposedDate: 'جمعه ۷ آذر ۱۴۰۵',
      proposedTime: '۱۸:۳۰',
      prizeType: 'playtime',
      prizeSummary: '۶ ساعت بازی رایگان + پذیرایی ویژه بوفه برای زوج برنده',
      notes: 'دعوت رسمی باشگاه آرنا پلاس از تیم فوتبال دستی مترو گیم برای دوئل حضوری.',
      challengerRoster: {
        teamId: 'ext-arena-foos',
        teamName: 'زوج طوفان آرنا',
        onlineId: '',
        members: [
          { name: 'سعید کریمی', customerId: null, role: 'مهاجم' },
          { name: 'میلاد شریفی', customerId: null, role: 'مدافع' },
        ],
      },
      targetRoster: null,
      status: 'pending',
      originalTerms: {
        proposedDate: 'جمعه ۷ آذر ۱۴۰۵',
        proposedTime: '۱۸:۳۰',
        mode: 'physical',
        venue: 'باشگاه آرنا پلاس — تهران، شهرک غرب، سالن میزهای حرفه‌ای',
        platform: 'میز حرفه‌ای تورنومنت',
        format: 'تیمی ۲ به ۲ (بهترین از ۵ ست)',
        prizeType: 'playtime',
        prizeSummary: '۶ ساعت بازی رایگان + پذیرایی ویژه بوفه برای زوج برنده',
        notes: 'دعوت رسمی باشگاه آرنا پلاس از تیم فوتبال دستی مترو گیم برای دوئل حضوری.',
      },
      currentTerms: {
        proposedDate: 'جمعه ۷ آذر ۱۴۰۵',
        proposedTime: '۱۸:۳۰',
        mode: 'physical',
        venue: 'باشگاه آرنا پلاس — تهران، شهرک غرب، سالن میزهای حرفه‌ای',
        platform: 'میز حرفه‌ای تورنومنت',
        format: 'تیمی ۲ به ۲ (بهترین از ۵ ست)',
        prizeType: 'playtime',
        prizeSummary: '۶ ساعت بازی رایگان + پذیرایی ویژه بوفه برای زوج برنده',
        notes: 'دعوت رسمی باشگاه آرنا پلاس از تیم فوتبال دستی مترو گیم برای دوئل حضوری.',
      },
      pendingProposal: null,
      agreements: {
        'arena-plus': true,
        [LOCAL_GAMENET_ID]: false,
      },
      rejectionReason: '',
      linkedTournamentId: null,
      result: null,
      createdAt: '2026-11-25T16:10:00Z',
      updatedAt: '2026-11-25T16:10:00Z',
    },
    {
      id: 'dch-gd-cyber-cs2',
      challengerGamenetId: LOCAL_GAMENET_ID,
      challengerGamenetName: LOCAL_GAMENET_NAME,
      challengerCity: LOCAL_GAMENET_CITY,
      targetGamenetId: 'cyberland-isf',
      targetGamenetName: 'سایبرلند',
      targetCity: 'اصفهان',
      category: 'video_games',
      gameId: 'cs2',
      gameName: 'Counter-Strike 2',
      mode: 'online',
      entryType: 'team',
      format: cs2Orig.format,
      platform: 'PC',
      venue: '',
      proposedDate: cs2Orig.proposedDate,
      proposedTime: cs2Orig.proposedTime,
      prizeType: cs2Orig.prizeType,
      prizeSummary: cs2Orig.prizeSummary,
      notes: cs2Orig.notes,
      challengerRoster: {
        teamId: 'team-gd-alpha',
        teamName: 'تیم Alpha',
        onlineId: 'Steam:GD_AlphaSquad',
        members: [
          { name: 'علیرضا گوهری', customerId: '101', role: 'کاپیتان (IGL)' },
          { name: 'آرش کاظمی', customerId: '102', role: 'AWPer' },
          { name: 'امیرحسین نادری', customerId: '103', role: 'Entry Fragger' },
          { name: 'سهیل مرادی', customerId: null, role: 'Support' },
          { name: 'کیانوش رضایی', customerId: null, role: 'Lurker' },
        ],
      },
      targetRoster: {
        teamId: 'ext-cyber-wolves',
        teamName: 'تیم Isfahan Wolves',
        onlineId: 'Steam:Cyber_Wolves',
        members: [
          { name: 'سهیل رضایی', customerId: null, role: 'کاپیتان' },
          { name: 'ماهان فرهادی', customerId: null, role: 'Rifler' },
          { name: 'پدرام موسوی', customerId: null, role: 'AWPer' },
          { name: 'حسین طاهری', customerId: null, role: 'Support' },
          { name: 'بهنام کریمی', customerId: null, role: 'Lurker' },
        ],
      },
      status: 'awaiting_agreement',
      originalTerms: cs2Orig,
      currentTerms: cs2Orig,
      pendingProposal: {
        proposedById: 'cyberland-isf',
        proposedByName: 'سایبرلند',
        proposedAt: '2026-11-25T18:00:00Z',
        previousTerms: cs2Orig,
        proposedTerms: cs2Counter,
        diff: computeDirectChallengeTermsDiff(cs2Orig, cs2Counter),
      },
      agreements: {
        'cyberland-isf': true,
        [LOCAL_GAMENET_ID]: false,
      },
      rejectionReason: '',
      linkedTournamentId: null,
      result: null,
      createdAt: '2026-11-24T12:00:00Z',
      updatedAt: '2026-11-25T18:00:00Z',
    },
    {
      id: 'dch-parsian-gd-fc25',
      challengerGamenetId: 'parsian-shz',
      challengerGamenetName: 'گیم‌کلاب پارسیان',
      challengerCity: 'شیراز',
      targetGamenetId: LOCAL_GAMENET_ID,
      targetGamenetName: LOCAL_GAMENET_NAME,
      targetCity: LOCAL_GAMENET_CITY,
      category: 'video_games',
      gameId: 'fc25',
      gameName: 'EA Sports FC 25',
      mode: 'online',
      entryType: 'individual',
      format: 'انفرادی ۱ به ۱ (دو بازی رفت و برگشت)',
      platform: 'پلی‌استیشن ۵',
      venue: '',
      proposedDate: 'چهارشنبه ۵ آذر ۱۴۰۵',
      proposedTime: '۲۱:۰۰',
      prizeType: 'gift_card',
      prizeSummary: 'گیفت‌کارت ۲۰ دلاری PlayStation + ۴ ساعت بازی رایگان',
      notes: 'دوئل مستقیم قهرمانان FC25 تهران و شیراز روی سرور آنلاین PS5.',
      challengerRoster: {
        teamId: 'ext-parsian-fc',
        teamName: 'پویا شریفی',
        onlineId: 'PSN:Pouya_Shz',
        members: [{ name: 'پویا شریفی', customerId: null, role: 'بازیکن اصلی' }],
      },
      targetRoster: {
        teamId: '',
        teamName: 'محمد باقر قالیباف',
        onlineId: 'PSN:GD_MBQ',
        members: [{ name: 'محمد باقر قالیباف', customerId: '1', role: 'نماینده مترو گیم' }],
      },
      status: 'accepted',
      originalTerms: {
        proposedDate: 'چهارشنبه ۵ آذر ۱۴۰۵',
        proposedTime: '۲۱:۰۰',
        mode: 'online',
        venue: '',
        platform: 'پلی‌استیشن ۵',
        format: 'انفرادی ۱ به ۱ (دو بازی رفت و برگشت)',
        prizeType: 'gift_card',
        prizeSummary: 'گیفت‌کارت ۲۰ دلاری PlayStation + ۴ ساعت بازی رایگان',
        notes: 'دوئل مستقیم قهرمانان FC25 تهران و شیراز روی سرور آنلاین PS5.',
      },
      currentTerms: {
        proposedDate: 'چهارشنبه ۵ آذر ۱۴۰۵',
        proposedTime: '۲۱:۰۰',
        mode: 'online',
        venue: '',
        platform: 'پلی‌استیشن ۵',
        format: 'انفرادی ۱ به ۱ (دو بازی رفت و برگشت)',
        prizeType: 'gift_card',
        prizeSummary: 'گیفت‌کارت ۲۰ دلاری PlayStation + ۴ ساعت بازی رایگان',
        notes: 'دوئل مستقیم قهرمانان FC25 تهران و شیراز روی سرور آنلاین PS5.',
      },
      pendingProposal: null,
      agreements: {
        'parsian-shz': true,
        [LOCAL_GAMENET_ID]: true,
      },
      rejectionReason: '',
      linkedTournamentId: 'trn-h2h-parsian-fc25',
      result: null,
      createdAt: '2026-11-23T11:00:00Z',
      updatedAt: '2026-11-24T17:30:00Z',
    },
    {
      id: 'dch-neon-gd-val',
      challengerGamenetId: 'neonzone-mhd',
      challengerGamenetName: 'نئون‌زون',
      challengerCity: 'مشهد',
      targetGamenetId: LOCAL_GAMENET_ID,
      targetGamenetName: LOCAL_GAMENET_NAME,
      targetCity: LOCAL_GAMENET_CITY,
      category: 'video_games',
      gameId: 'valorant',
      gameName: 'Valorant',
      mode: 'online',
      entryType: 'team',
      format: 'تیمی ۵ به ۵',
      platform: 'PC',
      venue: '',
      proposedDate: 'دوشنبه ۳ آذر ۱۴۰۵',
      proposedTime: '۲۳:۰۰',
      prizeType: 'cash',
      prizeSummary: '۴,۰۰۰,۰۰۰ تومان جایزه نقدی',
      notes: 'مسابقه شبانه ۵ به ۵ روی سرور بحرین.',
      challengerRoster: {
        teamId: 'ext-neon-val',
        teamName: 'تیم Neon Strike',
        onlineId: 'Riot:NeonStrike#IR',
        members: [
          { name: 'آرمان شمس', customerId: null, role: 'Duelist' },
          { name: 'سروش بهشتی', customerId: null, role: 'Controller' },
        ],
      },
      targetRoster: null,
      status: 'rejected',
      originalTerms: {
        proposedDate: 'دوشنبه ۳ آذر ۱۴۰۵',
        proposedTime: '۲۳:۰۰',
        mode: 'online',
        venue: '',
        platform: 'PC',
        format: 'تیمی ۵ به ۵',
        prizeType: 'cash',
        prizeSummary: '۴,۰۰۰,۰۰۰ تومان جایزه نقدی',
        notes: 'مسابقه شبانه ۵ به ۵ روی سرور بحرین.',
      },
      currentTerms: {
        proposedDate: 'دوشنبه ۳ آذر ۱۴۰۵',
        proposedTime: '۲۳:۰۰',
        mode: 'online',
        venue: '',
        platform: 'PC',
        format: 'تیمی ۵ به ۵',
        prizeType: 'cash',
        prizeSummary: '۴,۰۰۰,۰۰۰ تومان جایزه نقدی',
        notes: 'مسابقه شبانه ۵ به ۵ روی سرور بحرین.',
      },
      pendingProposal: null,
      agreements: {
        'neonzone-mhd': true,
        [LOCAL_GAMENET_ID]: false,
      },
      rejectionReason: 'ساعت ۲۳:۰۰ با برنامه تعطیلی شیفت شب سالن تداخل داشت؛ هفته آینده با ساعت زودتر هماهنگ می‌کنیم.',
      linkedTournamentId: null,
      result: null,
      createdAt: '2026-11-20T09:00:00Z',
      updatedAt: '2026-11-21T14:00:00Z',
    },
  ];
}
