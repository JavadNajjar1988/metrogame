/**
 * Pure Inter-Gamenet Tournament Network Engine ("تورنومنت")
 * Zero DOM dependencies — shared cleanly between backend.mjs, JS/tournaments.js, and unit tests.
 */

export const LOCAL_GAMENET_ID = 'game-district';
export const LOCAL_GAMENET_NAME = 'Game District';
export const LOCAL_GAMENET_CITY = 'تهران';

export const TOURNAMENT_IMAGES = {
  hero: 'src/assets/images/tournament_arena_hero_1795601704002.jpg',
  pc: 'src/assets/images/tournament_cover_pc_1795601704257.jpg',
  console: 'src/assets/images/tournament_cover_console_1795601705064.jpg',
};

export const TOURNAMENT_GAMES = [
  { id: 'fc25', name: 'FC 25', platform: 'پلی‌استیشن ۵', defaultFormat: 'حذفی ۱ به ۱', coverKey: 'console' },
  { id: 'cs2', name: 'Counter-Strike 2', platform: 'PC', defaultFormat: 'تیمی ۵ به ۵', coverKey: 'pc' },
  { id: 'valorant', name: 'Valorant', platform: 'PC', defaultFormat: 'تیمی ۵ به ۵', coverKey: 'pc' },
  { id: 'dota2', name: 'Dota 2', platform: 'PC', defaultFormat: 'تیمی ۵ به ۵', coverKey: 'pc' },
  { id: 'warzone', name: 'Call of Duty: Warzone', platform: 'کراس‌پلتفرم', defaultFormat: 'دو نفره (Duo)', coverKey: 'pc' },
  { id: 'rocket-league', name: 'Rocket League', platform: 'کراس‌پلتفرم', defaultFormat: 'دو نفره (2v2)', coverKey: 'console' },
  { id: 'tekken8', name: 'Tekken 8', platform: 'پلی‌استیشن ۵', defaultFormat: 'حذفی ۱ به ۱', coverKey: 'console' },
  { id: 'r6', name: 'Rainbow Six Siege', platform: 'PC', defaultFormat: 'تیمی ۵ به ۵', coverKey: 'pc' },
];

export const PRIZE_TYPES = [
  { id: 'cash', label: 'جایزه نقدی' },
  { id: 'playtime', label: 'ساعت بازی رایگان' },
  { id: 'hardware', label: 'تجهیزات گیمینگ' },
  { id: 'buffet', label: 'اعتبار بوفه و باشگاه' },
  { id: 'mixed', label: 'ترکیبی (نقدی + هدیه سالن)' },
];

export const TOURNAMENT_FORMATS = [
  'حذفی ۱ به ۱',
  'دو نفره (2v2)',
  'تیمی ۵ به ۵',
  'گروهی + حذفی',
];

export const TOURNAMENT_PLATFORMS = [
  'پلی‌استیشن ۵',
  'PC',
  'ایکس‌باکس',
  'کراس‌پلتفرم',
];

export const STATUS_META = {
  registration: { id: 'registration', label: 'در حال ثبت‌نام', tone: 'accent' },
  live: { id: 'live', label: 'در حال برگزاری', tone: 'emerald' },
  completed: { id: 'completed', label: 'پایان‌یافته', tone: 'muted' },
};

export const NETWORK_PARTNER_GAMENETS = [
  { id: 'game-district', name: 'Game District', city: 'تهران', isLocal: true, verified: true, stations: 18 },
  { id: 'arena-plus', name: 'آرنا پلاس', city: 'تهران', isLocal: false, verified: true, stations: 24 },
  { id: 'cyberland-isf', name: 'سایبرلند', city: 'اصفهان', isLocal: false, verified: true, stations: 20 },
  { id: 'neonzone-mhd', name: 'نئون‌زون', city: 'مشهد', isLocal: false, verified: true, stations: 16 },
  { id: 'parsian-shz', name: 'گیم‌کلاب پارسیان', city: 'شیراز', isLocal: false, verified: true, stations: 14 },
  { id: 'pixel-tbz', name: 'پیکسل استیشن', city: 'تبریز', isLocal: false, verified: true, stations: 12 },
];

export function normalizeDigits(str) {
  return String(str ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

export function cleanText(value, maxLen = 120) {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

export function getPrizeTypeLabel(id) {
  const found = PRIZE_TYPES.find((p) => p.id === id);
  return found ? found.label : 'جایزه اختصاصی سالن';
}

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.registration;
}

export function getCoverImageForTournament(tournament) {
  if (!tournament) return TOURNAMENT_IMAGES.hero;
  const key = tournament.coverKey;
  if (key && Object.hasOwn(TOURNAMENT_IMAGES, key)) {
    return TOURNAMENT_IMAGES[key];
  }
  const game = TOURNAMENT_GAMES.find(
    (g) => g.id === tournament.gameId || g.name.toLowerCase() === String(tournament.gameName || '').toLowerCase()
  );
  if (game && Object.hasOwn(TOURNAMENT_IMAGES, game.coverKey)) {
    return TOURNAMENT_IMAGES[game.coverKey];
  }
  return String(tournament.platform || '').includes('PC') ? TOURNAMENT_IMAGES.pc : TOURNAMENT_IMAGES.console;
}

export function sanitizeTournamentInput(raw = {}) {
  const title = cleanText(raw.title, 90);
  if (title.length < 3) {
    return { error: 'عنوان تورنومنت باید حداقل ۳ کاراکتر باشد.' };
  }

  const gameId = cleanText(raw.gameId, 40);
  const presetGame = TOURNAMENT_GAMES.find((g) => g.id === gameId);
  const gameName = presetGame ? presetGame.name : cleanText(raw.gameName || raw.customGameName, 60);
  if (!gameName) {
    return { error: 'نام بازی آنلاین را انتخاب یا وارد کنید.' };
  }

  const platform = cleanText(raw.platform, 30) || (presetGame ? presetGame.platform : 'کراس‌پلتفرم');
  const format = cleanText(raw.format, 40) || (presetGame ? presetGame.defaultFormat : 'حذفی ۱ به ۱');

  const rawSlots = Number(normalizeDigits(raw.maxSlots).replace(/[,٬\s]/g, ''));
  const allowedSlots = [4, 8, 16, 32];
  const maxSlots = allowedSlots.includes(rawSlots) ? rawSlots : 8;

  const rawEntry = Number(normalizeDigits(raw.entryFee ?? 0).replace(/[,٬\s]/g, ''));
  if (!Number.isFinite(rawEntry) || rawEntry < 0 || rawEntry > 50_000_000) {
    return { error: 'مبلغ ورودی معتبر نیست.' };
  }
  const entryFee = Math.round(rawEntry);

  const rawPrizeVal = Number(normalizeDigits(raw.prizePoolValue ?? 0).replace(/[,٬\s]/g, ''));
  if (!Number.isFinite(rawPrizeVal) || rawPrizeVal < 0 || rawPrizeVal > 2_000_000_000) {
    return { error: 'ارزش کل جایزه معتبر نیست.' };
  }
  const prizePoolValue = Math.round(rawPrizeVal);

  const prizeType = PRIZE_TYPES.some((p) => p.id === raw.prizeType) ? raw.prizeType : 'mixed';
  const prizeFirst = cleanText(raw.prizeFirst, 100);
  if (!prizeFirst) {
    return { error: 'جایزه نفر یا تیم اول را مشخص کنید.' };
  }
  const prizeSecond = cleanText(raw.prizeSecond, 100) || 'اعتبار بازی رایگان در سالن مبدا';
  const prizeThird = cleanText(raw.prizeThird, 100) || 'اعتبار بوفه و اشتراک ویژه';

  const scope = raw.scope === 'local' ? 'local' : 'network';
  const startDate = cleanText(raw.startDate, 40) || 'پنج‌شنبه ساعت ۲۱:۰۰';
  const lobbyCode = cleanText(raw.lobbyCode, 40) || `GD-${Math.floor(1000 + Math.random() * 9000)}`;
  const rules = cleanText(raw.rules, 260) || 'حضور ۱۵ دقیقه قبل از شروع مسابقه در لابی آنلاین الزامی است. نتیجه هر دور توسط مدیر گیم‌نت میزبان تأیید می‌شود.';

  const hostGamenetId = cleanText(raw.hostGamenetId, 40) || LOCAL_GAMENET_ID;
  const hostGamenetName = cleanText(raw.hostGamenetName, 60) || LOCAL_GAMENET_NAME;
  const hostCity = cleanText(raw.hostCity, 30) || LOCAL_GAMENET_CITY;

  const coverKey = presetGame
    ? presetGame.coverKey
    : platform.includes('PC')
      ? 'pc'
      : 'console';

  return {
    value: {
      title,
      gameId: presetGame ? presetGame.id : 'custom',
      gameName,
      platform,
      format,
      scope,
      status: 'registration',
      maxSlots,
      entryFee,
      prizeType,
      prizePoolValue,
      prizes: {
        first: prizeFirst,
        second: prizeSecond,
        third: prizeThird,
      },
      startDate,
      lobbyCode,
      rules,
      hostGamenetId,
      hostGamenetName,
      hostCity,
      coverKey,
    },
  };
}

export function validateParticipantInput(raw = {}, tournament = null) {
  const playerName = cleanText(raw.playerName, 60);
  const onlineId = cleanText(raw.onlineId, 48);
  const gamenetName = cleanText(raw.gamenetName, 60) || LOCAL_GAMENET_NAME;
  const gamenetId = cleanText(raw.gamenetId, 40) || LOCAL_GAMENET_ID;
  const city = cleanText(raw.city, 30) || LOCAL_GAMENET_CITY;
  const customerId = cleanText(raw.customerId, 20);

  if (playerName.length < 2) {
    return { error: 'نام بازیکن یا تیم باید حداقل ۲ کاراکتر باشد.' };
  }
  if (onlineId.length < 2) {
    return { error: 'شناسه آنلاین (PSN / Steam / Riot ID) الزامی است.' };
  }

  if (tournament) {
    if (tournament.status === 'completed') {
      return { error: 'این تورنومنت به پایان رسیده و ثبت‌نام جدید ممکن نیست.' };
    }
    const existing = Array.isArray(tournament.participants) ? tournament.participants : [];
    if (existing.length >= Number(tournament.maxSlots || 8)) {
      return { error: 'ظرفیت این تورنومنت تکمیل شده است.' };
    }
    const duplicate = existing.some(
      (p) => String(p.onlineId || '').trim().toLowerCase() === onlineId.toLowerCase()
    );
    if (duplicate) {
      return { error: 'بازیکنی با این شناسه آنلاین قبلاً در تورنومنت ثبت شده است.' };
    }
  }

  return {
    value: {
      playerName,
      onlineId,
      gamenetId,
      gamenetName,
      city,
      customerId: customerId || null,
    },
  };
}

/**
 * Generates a balanced single-elimination knockout bracket (4, 8, or 16 slots).
 * Automatically advances single-sided "bye" matches into the next round.
 */
export function generateSingleEliminationBracket(participants = [], maxSlots = 8) {
  const list = Array.isArray(participants) ? participants.filter(Boolean) : [];
  const baseSize = Math.max(4, Math.min(16, Number(maxSlots) || 8));
  let bracketSize = 4;
  if (baseSize > 8 || list.length > 8) bracketSize = 16;
  else if (baseSize > 4 || list.length > 4) bracketSize = 8;

  const totalRounds = Math.log2(bracketSize);
  const roundNamesByCount = {
    2: ['نیمه‌نهایی', 'فینال'],
    3: ['یک‌چهارم نهایی', 'نیمه‌نهایی', 'فینال'],
    4: ['یک‌هشتم نهایی', 'یک‌چهارم نهایی', 'نیمه‌نهایی', 'فینال'],
  };
  const roundNames = roundNamesByCount[totalRounds] || ['دور اول', 'فینال'];

  const rounds = [];
  for (let r = 0; r < totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r + 1);
    const matches = [];
    for (let m = 0; m < matchCount; m++) {
      matches.push({
        id: `r${r + 1}-m${m + 1}`,
        roundIndex: r,
        matchIndex: m,
        playerA: null,
        playerB: null,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        status: 'pending',
      });
    }
    rounds.push({
      index: r,
      name: roundNames[r] || `دور ${r + 1}`,
      matches,
    });
  }

  // Seed players across Round 1 slots (paired evenly to avoid dead matches when under-filled)
  const round0 = rounds[0].matches;
  for (let i = 0; i < round0.length; i++) {
    const pA = list[i] || null;
    const pB = list[i + round0.length] || null;
    round0[i].playerA = pA ? toSlotPlayer(pA) : null;
    round0[i].playerB = pB ? toSlotPlayer(pB) : null;
    if (round0[i].playerA && round0[i].playerB) {
      round0[i].status = 'ready';
    } else if (round0[i].playerA && !round0[i].playerB) {
      // Automatic bye advancement
      round0[i].winnerId = round0[i].playerA.id;
      round0[i].status = 'bye';
      propagateWinner(rounds, 0, i, round0[i].playerA);
    }
  }

  return {
    bracketSize,
    generatedAt: new Date().toISOString(),
    champion: null,
    rounds,
  };
}

function toSlotPlayer(p) {
  return {
    id: String(p.id),
    playerName: p.playerName,
    onlineId: p.onlineId,
    gamenetId: p.gamenetId,
    gamenetName: p.gamenetName,
  };
}

function propagateWinner(rounds, roundIndex, matchIndex, winnerPlayer) {
  const nextRound = rounds[roundIndex + 1];
  if (!nextRound) return;
  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextMatch = nextRound.matches[nextMatchIndex];
  if (!nextMatch) return;

  if (matchIndex % 2 === 0) {
    nextMatch.playerA = toSlotPlayer(winnerPlayer);
  } else {
    nextMatch.playerB = toSlotPlayer(winnerPlayer);
  }

  if (nextMatch.playerA && nextMatch.playerB && nextMatch.status === 'pending') {
    nextMatch.status = 'ready';
  }
}

/**
 * Records the result & winner for a bracket match, propagating the winner to the next round
 * or crowning the tournament champion if it was the Final.
 */
export function recordBracketMatchWinner(bracket, matchId, winnerSide, scoreA = null, scoreB = null) {
  if (!bracket || !Array.isArray(bracket.rounds)) {
    return { error: 'جدول مسابقات هنوز تولید نشده است.' };
  }
  if (winnerSide !== 'A' && winnerSide !== 'B') {
    return { error: 'برنده مسابقه به‌درستی انتخاب نشده است.' };
  }

  const nextBracket = structuredClone(bracket);
  let targetRound = null;
  let targetMatch = null;
  for (const round of nextBracket.rounds) {
    const found = round.matches.find((m) => m.id === matchId);
    if (found) {
      targetRound = round;
      targetMatch = found;
      break;
    }
  }

  if (!targetMatch || !targetRound) {
    return { error: 'مسابقه مورد نظر در جدول پیدا نشد.' };
  }
  if (!targetMatch.playerA || !targetMatch.playerB) {
    return { error: 'هر دو طرف مسابقه باید مشخص باشند تا نتیجه ثبت شود.' };
  }

  const parsedA = scoreA === null || scoreA === '' ? (winnerSide === 'A' ? 2 : 0) : Number(normalizeDigits(scoreA));
  const parsedB = scoreB === null || scoreB === '' ? (winnerSide === 'B' ? 2 : 0) : Number(normalizeDigits(scoreB));
  if (!Number.isFinite(parsedA) || !Number.isFinite(parsedB) || parsedA < 0 || parsedB < 0 || parsedA > 999 || parsedB > 999) {
    return { error: 'امتیاز واردشده معتبر نیست.' };
  }

  const winner = winnerSide === 'A' ? targetMatch.playerA : targetMatch.playerB;
  targetMatch.scoreA = Math.floor(parsedA);
  targetMatch.scoreB = Math.floor(parsedB);
  targetMatch.winnerId = winner.id;
  targetMatch.status = 'done';

  const isFinal = targetRound.index === nextBracket.rounds.length - 1;
  if (isFinal) {
    nextBracket.champion = toSlotPlayer(winner);
  } else {
    propagateWinner(nextBracket.rounds, targetRound.index, targetMatch.matchIndex, winner);
  }

  return {
    bracket: nextBracket,
    completed: isFinal,
    champion: nextBracket.champion || null,
  };
}

export function filterTournaments(tournaments = [], filters = {}) {
  const list = Array.isArray(tournaments) ? tournaments : [];
  const statusFilter = filters.status || 'all';
  const gameFilter = filters.game || 'all';
  const scopeFilter = filters.scope || 'all';
  const query = cleanText(filters.query, 80).toLowerCase();

  return list.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (gameFilter !== 'all' && t.gameId !== gameFilter && t.gameName !== gameFilter) return false;
    if (scopeFilter === 'hosted-by-me' && t.hostGamenetId !== LOCAL_GAMENET_ID) return false;
    if (scopeFilter === 'network' && t.scope !== 'network') return false;
    if (query) {
      const hay = [
        t.title,
        t.gameName,
        t.hostGamenetName,
        t.hostCity,
        t.prizes?.first,
        t.platform,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function computeNetworkSummary(tournaments = []) {
  const list = Array.isArray(tournaments) ? tournaments : [];
  const gamenetMap = new Map();

  NETWORK_PARTNER_GAMENETS.forEach((gn) => {
    gamenetMap.set(gn.id, {
      id: gn.id,
      name: gn.name,
      city: gn.city,
      isLocal: Boolean(gn.isLocal),
      stations: gn.stations,
      hostedCount: 0,
      playersSent: 0,
      championships: 0,
      prizeOffered: 0,
    });
  });

  let activeTournaments = 0;
  let totalPrizePool = 0;
  let totalPlayers = 0;
  let localPlayers = 0;

  for (const t of list) {
    if (t.status === 'registration' || t.status === 'live') {
      activeTournaments += 1;
      totalPrizePool += Math.max(0, Number(t.prizePoolValue) || 0);
    }

    const hostKey = t.hostGamenetId || LOCAL_GAMENET_ID;
    if (!gamenetMap.has(hostKey)) {
      gamenetMap.set(hostKey, {
        id: hostKey,
        name: t.hostGamenetName || 'گیم‌نت عضو شبکه',
        city: t.hostCity || 'ایران',
        isLocal: hostKey === LOCAL_GAMENET_ID,
        stations: 12,
        hostedCount: 0,
        playersSent: 0,
        championships: 0,
        prizeOffered: 0,
      });
    }
    const hostEntry = gamenetMap.get(hostKey);
    hostEntry.hostedCount += 1;
    hostEntry.prizeOffered += Math.max(0, Number(t.prizePoolValue) || 0);

    const participants = Array.isArray(t.participants) ? t.participants : [];
    totalPlayers += participants.length;
    for (const p of participants) {
      const pKey = p.gamenetId || hostKey;
      if (pKey === LOCAL_GAMENET_ID) localPlayers += 1;
      if (!gamenetMap.has(pKey)) {
        gamenetMap.set(pKey, {
          id: pKey,
          name: p.gamenetName || 'گیم‌نت عضو شبکه',
          city: p.city || 'ایران',
          isLocal: pKey === LOCAL_GAMENET_ID,
          stations: 10,
          hostedCount: 0,
          playersSent: 0,
          championships: 0,
          prizeOffered: 0,
        });
      }
      gamenetMap.get(pKey).playersSent += 1;
    }

    const champ = t.bracket?.champion;
    if (champ && champ.gamenetId && gamenetMap.has(champ.gamenetId)) {
      gamenetMap.get(champ.gamenetId).championships += 1;
    }
  }

  const partnerLeaderboard = Array.from(gamenetMap.values()).sort((a, b) => {
    if (b.championships !== a.championships) return b.championships - a.championships;
    if (b.playersSent !== a.playersSent) return b.playersSent - a.playersSent;
    return b.prizeOffered - a.prizeOffered;
  });

  return {
    totalTournaments: list.length,
    activeTournaments,
    connectedGamenets: partnerLeaderboard.length,
    totalPrizePool,
    totalPlayers,
    localPlayers,
    partnerLeaderboard,
  };
}

export function createSeedTournaments() {
  const fcParticipants = [
    { id: 'p-fc-1', playerName: 'آرش کاظمی', onlineId: 'Arash_GD99', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران' },
    { id: 'p-fc-2', playerName: 'کیان مرادی', onlineId: 'KianPro_AP', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران' },
    { id: 'p-fc-3', playerName: 'سهیل رضایی', onlineId: 'Soheil_CL', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان' },
    { id: 'p-fc-4', playerName: 'پویا شریفی', onlineId: 'Pouya_NZ', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد' },
    { id: 'p-fc-5', playerName: 'امیرحسین نادری', onlineId: 'Amir_GD07', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران' },
    { id: 'p-fc-6', playerName: 'مانی کریمی', onlineId: 'Mani_Pars', gamenetId: 'parsian-shz', gamenetName: 'گیم‌کلاب پارسیان', city: 'شیراز' },
    { id: 'p-fc-7', playerName: 'نیما اکبری', onlineId: 'Nima_Pix', gamenetId: 'pixel-tbz', gamenetName: 'پیکسل استیشن', city: 'تبریز' },
    { id: 'p-fc-8', playerName: 'شایان بهرامی', onlineId: 'Shayan_AP2', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران' },
  ];
  let fcBracket = generateSingleEliminationBracket(fcParticipants, 8);
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m1', 'A', 3, 1).bracket;
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m2', 'B', 1, 2).bracket;
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m3', 'A', 4, 2).bracket;
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m4', 'A', 2, 0).bracket;

  const tekkenParticipants = [
    { id: 'p-tk-1', playerName: 'رضا حیدری', onlineId: 'Reza_IronFist', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران' },
    { id: 'p-tk-2', playerName: 'سینا محمدی', onlineId: 'Sina_Kazuya', gamenetId: 'parsian-shz', gamenetName: 'گیم‌کلاب پارسیان', city: 'شیراز' },
    { id: 'p-tk-3', playerName: 'ماهان فرهادی', onlineId: 'Mahan_CL', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان' },
    { id: 'p-tk-4', playerName: 'دانیال قاسمی', onlineId: 'Danial_NZ', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد' },
  ];
  let tekkenBracket = generateSingleEliminationBracket(tekkenParticipants, 4);
  tekkenBracket = recordBracketMatchWinner(tekkenBracket, 'r1-m1', 'A', 3, 1).bracket;
  tekkenBracket = recordBracketMatchWinner(tekkenBracket, 'r1-m2', 'B', 2, 3).bracket;
  tekkenBracket = recordBracketMatchWinner(tekkenBracket, 'r2-m1', 'A', 3, 2).bracket;

  return [
    {
      id: 'trn-fc25-autumn',
      title: 'جام سراسری FC 25 شبکه گیم‌نت‌ها',
      gameId: 'fc25',
      gameName: 'FC 25',
      platform: 'پلی‌استیشن ۵',
      format: 'حذفی ۱ به ۱',
      scope: 'network',
      status: 'live',
      maxSlots: 8,
      entryFee: 150000,
      prizeType: 'mixed',
      prizePoolValue: 15000000,
      prizes: {
        first: '۱۰,۰۰۰,۰۰۰ تومان نقدی + ۱۰ ساعت بازی VIP رایگان',
        second: '۳,۵۰۰,۰۰۰ تومان نقدی + ۵ ساعت بازی رایگان',
        third: '۱,۵۰۰,۰۰۰ تومان اعتبار بوفه و باشگاه',
      },
      startDate: 'امشب ساعت ۲۱:۰۰',
      lobbyCode: 'GD-FC25-884',
      rules: 'زمان هر نیمه ۶ دقیقه، تیم‌های باشگاهی آزاد و اتصال از طریق لابی آنلاین شبکه گیم‌نت‌ها الزامی است.',
      hostGamenetId: 'game-district',
      hostGamenetName: 'Game District',
      hostCity: 'تهران',
      coverKey: 'console',
      createdAt: '2026-11-22T14:00:00.000Z',
      participants: fcParticipants,
      bracket: fcBracket,
    },
    {
      id: 'trn-cs2-intercity',
      title: 'لیگ تیمی Counter-Strike 2 بین‌گیم‌نتی',
      gameId: 'cs2',
      gameName: 'Counter-Strike 2',
      platform: 'PC',
      format: 'تیمی ۵ به ۵',
      scope: 'network',
      status: 'registration',
      maxSlots: 8,
      entryFee: 250000,
      prizeType: 'hardware',
      prizePoolValue: 25000000,
      prizes: {
        first: '۱۵,۰۰۰,۰۰۰ تومان + ۵ عدد ماوس‌پد و هدست گیمینگ',
        second: '۷,۰۰۰,۰۰۰ تومان جایزه نقدی',
        third: '۳,۰۰۰,۰۰۰ تومان + ۱۵ ساعت سیستم گیمینگ رایگان',
      },
      startDate: 'جمعه ساعت ۲۰:۰۰',
      lobbyCode: 'AP-CS2-502',
      rules: 'رقابت روی سرور اختصاصی ۱۲۸ تیک؛ هر گیم‌نت می‌تواند تا ۲ تیم ثبت‌نام‌شده اعزام کند.',
      hostGamenetId: 'arena-plus',
      hostGamenetName: 'آرنا پلاس',
      hostCity: 'تهران',
      coverKey: 'pc',
      createdAt: '2026-11-23T11:30:00.000Z',
      participants: [
        { id: 'p-cs-1', playerName: 'تیم Phoenix GD', onlineId: 'Steam:GD_Phoenix', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران' },
        { id: 'p-cs-2', playerName: 'تیم Apex Arena', onlineId: 'Steam:Apex_AP', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران' },
        { id: 'p-cs-3', playerName: 'تیم Isfahan Wolves', onlineId: 'Steam:Isf_Wolves', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان' },
        { id: 'p-cs-4', playerName: 'تیم Khorasan Five', onlineId: 'Steam:Khorasan5', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد' },
        { id: 'p-cs-5', playerName: 'تیم Shiraz Strike', onlineId: 'Steam:Shz_Strike', gamenetId: 'parsian-shz', gamenetName: 'گیم‌کلاب پارسیان', city: 'شیراز' },
      ],
      bracket: null,
    },
    {
      id: 'trn-valorant-cup',
      title: 'تورنومنت آزاد Valorant شبانه',
      gameId: 'valorant',
      gameName: 'Valorant',
      platform: 'PC',
      format: 'دو نفره (2v2)',
      scope: 'network',
      status: 'registration',
      maxSlots: 8,
      entryFee: 0,
      prizeType: 'playtime',
      prizePoolValue: 6000000,
      prizes: {
        first: '۳۰ ساعت سیستم گیمینگ رایگان در سالن مبدا + ۲ میلیون تومان',
        second: '۱۵ ساعت بازی رایگان + بسته نوشیدنی بوفه',
        third: '۸ ساعت بازی رایگان در سالن مبدا',
      },
      startDate: 'شنبه ساعت ۲۲:۰۰',
      lobbyCode: 'CL-VAL-319',
      rules: 'ورودی کاملاً رایگان برای اعضای باشگاه مشتریان گیم‌نت‌های متصل به سامانه.',
      hostGamenetId: 'cyberland-isf',
      hostGamenetName: 'سایبرلند',
      hostCity: 'اصفهان',
      coverKey: 'pc',
      createdAt: '2026-11-24T09:15:00.000Z',
      participants: [
        { id: 'p-val-1', playerName: 'تیم Vipers Isfahan', onlineId: 'Riot:ViperISF#IR', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان' },
        { id: 'p-val-2', playerName: 'تیم Tabriz Duo', onlineId: 'Riot:PixDuo#TBZ', gamenetId: 'pixel-tbz', gamenetName: 'پیکسل استیشن', city: 'تبریز' },
        { id: 'p-val-3', playerName: 'تیم Mashhad Radiants', onlineId: 'Riot:NZRad#MHD', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد' },
      ],
      bracket: null,
    },
    {
      id: 'trn-tekken-weekend',
      title: 'کاپ تک‌نفره Tekken 8 (فصل آبان)',
      gameId: 'tekken8',
      gameName: 'Tekken 8',
      platform: 'پلی‌استیشن ۵',
      format: 'حذفی ۱ به ۱',
      scope: 'network',
      status: 'completed',
      maxSlots: 4,
      entryFee: 100000,
      prizeType: 'cash',
      prizePoolValue: 8000000,
      prizes: {
        first: '۵,۰۰۰,۰۰۰ تومان جایزه نقدی',
        second: '۲,۰۰۰,۰۰۰ تومان جایزه نقدی',
        third: '۱,۰۰۰,۰۰۰ تومان اعتبار باشگاه',
      },
      startDate: 'هفته گذشته',
      lobbyCode: 'PS-TK8-104',
      rules: 'قوانین استاندارد ۳ راند از ۵ راند با تایید نتیجه توسط مدیران سالن.',
      hostGamenetId: 'parsian-shz',
      hostGamenetName: 'گیم‌کلاب پارسیان',
      hostCity: 'شیراز',
      coverKey: 'console',
      createdAt: '2026-11-18T17:00:00.000Z',
      participants: tekkenParticipants,
      bracket: tekkenBracket,
    },
  ];
}
