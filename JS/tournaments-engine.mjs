/**
 * Pure Inter-Gamenet Competitive Network Engine ("تورنومنت")
 * Supports Video Games (online), Table Football / Foosball (physical), and Billiards / Pool (physical).
 * Zero DOM dependencies — shared cleanly between backend.mjs, JS/tournaments.js, and unit tests.
 */

export const LOCAL_GAMENET_ID = 'game-district';
export const LOCAL_GAMENET_NAME = 'Game District';
export const LOCAL_GAMENET_CITY = 'تهران';
export const LOCAL_GAMENET_VENUE = 'سالن اصلی گیم‌نت Game District — تهران، سعادت‌آباد';

export const TOURNAMENT_IMAGES = {
  hero: 'src/assets/images/tournament_arena_hero_1795601704002.jpg',
  pc: 'src/assets/images/tournament_cover_pc_1795601704257.jpg',
  console: 'src/assets/images/tournament_cover_console_1795601705064.jpg',
  billiards: 'src/assets/images/tournament_cover_billiards_1795669737688.jpg',
  foosball: 'src/assets/images/tournament_cover_foosball_1795669738904.jpg',
};

export const COMPETITION_CATEGORIES = [
  {
    id: 'video_games',
    label: 'بازی‌های ویدیویی',
    shortLabel: 'بازی ویدیویی',
    mode: 'online',
    modeLabel: 'رقابت آنلاین',
    description: 'EA Sports FC، CS2، Valorant، Tekken و سایر بازی‌های آنلاین',
    coverKey: 'pc',
  },
  {
    id: 'foosball',
    label: 'فوتبال دستی',
    shortLabel: 'فوتبال دستی',
    mode: 'physical',
    modeLabel: 'رقابت حضوری',
    description: 'مسابقات انفرادی و تیمی فوتبال دستی در سالن‌های میزبان',
    coverKey: 'foosball',
  },
  {
    id: 'billiards',
    label: 'بیلیارد',
    shortLabel: 'بیلیارد',
    mode: 'physical',
    modeLabel: 'رقابت حضوری',
    description: 'ایت‌بال، ناین‌بال و اسنوکر به‌صورت انفرادی و دو نفره',
    coverKey: 'billiards',
  },
];

export const TOURNAMENT_GAMES = [
  // Video Games (Online)
  {
    id: 'fc25',
    category: 'video_games',
    name: 'EA Sports FC 25',
    platform: 'پلی‌استیشن ۵',
    defaultFormat: 'انفرادی ۱ به ۱',
    entryType: 'individual',
    teamSize: 1,
    coverKey: 'console',
  },
  {
    id: 'cs2',
    category: 'video_games',
    name: 'Counter-Strike 2',
    platform: 'PC',
    defaultFormat: 'تیمی ۵ به ۵',
    entryType: 'team',
    teamSize: 5,
    coverKey: 'pc',
  },
  {
    id: 'valorant',
    category: 'video_games',
    name: 'Valorant',
    platform: 'PC',
    defaultFormat: 'تیمی ۵ به ۵',
    entryType: 'team',
    teamSize: 5,
    coverKey: 'pc',
  },
  {
    id: 'tekken8',
    category: 'video_games',
    name: 'Tekken 8',
    platform: 'پلی‌استیشن ۵',
    defaultFormat: 'انفرادی ۱ به ۱',
    entryType: 'individual',
    teamSize: 1,
    coverKey: 'console',
  },
  {
    id: 'dota2',
    category: 'video_games',
    name: 'Dota 2',
    platform: 'PC',
    defaultFormat: 'تیمی ۵ به ۵',
    entryType: 'team',
    teamSize: 5,
    coverKey: 'pc',
  },
  {
    id: 'warzone',
    category: 'video_games',
    name: 'Call of Duty: Warzone',
    platform: 'کراس‌پلتفرم',
    defaultFormat: 'دو نفره (2v2)',
    entryType: 'team',
    teamSize: 2,
    coverKey: 'pc',
  },
  {
    id: 'rocket-league',
    category: 'video_games',
    name: 'Rocket League',
    platform: 'کراس‌پلتفرم',
    defaultFormat: 'دو نفره (2v2)',
    entryType: 'team',
    teamSize: 2,
    coverKey: 'console',
  },
  // Table Football / Foosball (Physical)
  {
    id: 'foosball-1v1',
    category: 'foosball',
    name: 'فوتبال دستی انفرادی (۱ به ۱)',
    platform: 'میز حرفه‌ای تورنومنت',
    defaultFormat: 'انفرادی ۱ به ۱',
    entryType: 'individual',
    teamSize: 1,
    coverKey: 'foosball',
  },
  {
    id: 'foosball-2v2',
    category: 'foosball',
    name: 'فوتبال دستی تیمی (۲ به ۲)',
    platform: 'میز حرفه‌ای تورنومنت',
    defaultFormat: 'تیمی ۲ به ۲',
    entryType: 'team',
    teamSize: 2,
    coverKey: 'foosball',
  },
  // Billiards / Pool (Physical)
  {
    id: 'billiards-8ball',
    category: 'billiards',
    name: 'بیلیارد ایت‌بال (8-Ball)',
    platform: 'میز ۹ فوت باشگاهی',
    defaultFormat: 'انفرادی ۱ به ۱',
    entryType: 'individual',
    teamSize: 1,
    coverKey: 'billiards',
  },
  {
    id: 'billiards-9ball',
    category: 'billiards',
    name: 'بیلیارد ناین‌بال (9-Ball)',
    platform: 'میز ۹ فوت باشگاهی',
    defaultFormat: 'انفرادی ۱ به ۱',
    entryType: 'individual',
    teamSize: 1,
    coverKey: 'billiards',
  },
  {
    id: 'billiards-doubles',
    category: 'billiards',
    name: 'بیلیارد تیمی (دوبل ۲ به ۲)',
    platform: 'میز ۹ فوت باشگاهی',
    defaultFormat: 'تیمی ۲ به ۲',
    entryType: 'team',
    teamSize: 2,
    coverKey: 'billiards',
  },
];

export const PRIZE_TYPES = [
  { id: 'playtime', label: 'ساعت بازی رایگان' },
  { id: 'vip_session', label: 'سشن بازی VIP رایگان' },
  { id: 'hardware', label: 'تجهیزات و لوازم گیمینگ' },
  { id: 'gift_card', label: 'گیفت‌کارت بازی' },
  { id: 'cash', label: 'جایزه نقدی' },
  { id: 'buffet', label: 'اعتبار بوفه و باشگاه' },
  { id: 'custom', label: 'جایزه توافقی / سفارشی' },
  { id: 'mixed', label: 'ترکیبی (نقدی + خدمات سالن)' },
];

export const TOURNAMENT_FORMATS = [
  'انفرادی ۱ به ۱',
  'تیمی ۲ به ۲',
  'تیمی ۵ به ۵',
  'دوئل دو گیم‌نت (رفت و برگشت / تک‌حذفی)',
  'تورنومنت چندگیم‌نتی حذفی',
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

export const CHALLENGE_STATUS_META = {
  open: { id: 'open', label: 'در انتظار پذیرش حریف', tone: 'accent' },
  ready: { id: 'ready', label: 'آماده تشکیل تورنومنت', tone: 'emerald' },
  formed: { id: 'formed', label: 'تورنومنت تشکیل شد', tone: 'muted' },
};

export const NETWORK_PARTNER_GAMENETS = [
  {
    id: 'game-district',
    name: 'Game District',
    city: 'تهران',
    venue: LOCAL_GAMENET_VENUE,
    isLocal: true,
    verified: true,
    stations: 18,
  },
  {
    id: 'nexus-club',
    name: 'Nexus Club',
    city: 'تهران',
    venue: 'باشگاه Nexus Club — تهران، جردن، سالن بیلیارد و VIP',
    isLocal: false,
    verified: true,
    stations: 22,
  },
  {
    id: 'arena-plus',
    name: 'آرنا پلاس',
    city: 'تهران',
    venue: 'باشگاه آرنا پلاس — تهران، شهرک غرب، سالن VIP',
    isLocal: false,
    verified: true,
    stations: 24,
  },
  {
    id: 'cyberland-isf',
    name: 'سایبرلند',
    city: 'اصفهان',
    venue: 'باشگاه سایبرلند — اصفهان، خیابان چهارباغ بالا',
    isLocal: false,
    verified: true,
    stations: 20,
  },
  {
    id: 'neonzone-mhd',
    name: 'نئون‌زون',
    city: 'مشهد',
    venue: 'مجموعه نئون‌زون — مشهد، بلوار وکیل‌آباد',
    isLocal: false,
    verified: true,
    stations: 16,
  },
  {
    id: 'parsian-shz',
    name: 'گیم‌کلاب پارسیان',
    city: 'شیراز',
    venue: 'گیم‌کلاب پارسیان — شیراز، معالی‌آباد، سالن بیلیارد و بازی',
    isLocal: false,
    verified: true,
    stations: 14,
  },
  {
    id: 'pixel-tbz',
    name: 'پیکسل استیشن',
    city: 'تبریز',
    venue: 'پیکسل استیشن — تبریز، ولیعصر، طبقه دوم',
    isLocal: false,
    verified: true,
    stations: 12,
  },
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

export function getCategoryMeta(categoryId) {
  return COMPETITION_CATEGORIES.find((c) => c.id === categoryId) || COMPETITION_CATEGORIES[0];
}

export function isPhysicalCategory(categoryId) {
  return categoryId === 'billiards' || categoryId === 'foosball';
}

export function getModeForCategory(categoryId) {
  return isPhysicalCategory(categoryId) ? 'physical' : 'online';
}

export function getActivitiesByCategory(categoryId) {
  if (!categoryId || categoryId === 'all') return TOURNAMENT_GAMES;
  return TOURNAMENT_GAMES.filter((g) => g.category === categoryId);
}

export function getPrizeTypeLabel(id) {
  const found = PRIZE_TYPES.find((p) => p.id === id);
  return found ? found.label : 'جایزه توافقی سالن';
}

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.registration;
}

export function getChallengeStatusMeta(status) {
  return CHALLENGE_STATUS_META[status] || CHALLENGE_STATUS_META.open;
}

export function getCoverImageForTournament(item) {
  if (!item) return TOURNAMENT_IMAGES.hero;
  const key = item.coverKey;
  if (key && Object.hasOwn(TOURNAMENT_IMAGES, key)) {
    return TOURNAMENT_IMAGES[key];
  }
  if (item.category === 'billiards') return TOURNAMENT_IMAGES.billiards;
  if (item.category === 'foosball') return TOURNAMENT_IMAGES.foosball;

  const game = TOURNAMENT_GAMES.find(
    (g) => g.id === item.gameId || g.name.toLowerCase() === String(item.gameName || '').toLowerCase()
  );
  if (game && Object.hasOwn(TOURNAMENT_IMAGES, game.coverKey)) {
    return TOURNAMENT_IMAGES[game.coverKey];
  }
  return String(item.platform || '').includes('PC') ? TOURNAMENT_IMAGES.pc : TOURNAMENT_IMAGES.console;
}

export function parseMembersList(rawMembers) {
  if (Array.isArray(rawMembers)) {
    return rawMembers
      .map((m) => {
        if (typeof m === 'string') {
          const name = cleanText(m, 50);
          return name ? { name, customerId: null, role: '' } : null;
        }
        if (m && typeof m === 'object') {
          const name = cleanText(m.name || m.playerName, 50);
          if (!name) return null;
          return {
            name,
            customerId: cleanText(m.customerId, 20) || null,
            role: cleanText(m.role, 30) || '',
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 10);
  }
  if (typeof rawMembers === 'string') {
    const trimmed = rawMembers.trim();
    if (trimmed.startsWith('[')) {
      try {
        return parseMembersList(JSON.parse(trimmed));
      } catch {
        // Fallback to comma-separated parsing
      }
    }
    return trimmed
      .split(/[,،\n]+/)
      .map((item) => cleanText(item, 50))
      .filter(Boolean)
      .slice(0, 10)
      .map((name) => ({ name, customerId: null, role: '' }));
  }
  return [];
}

/**
 * Normalizes any legacy tournament record so existing stored JSON seamlessly works
 * with categories, physical vs online metadata, and prize agreements.
 */
export function normalizeTournamentRecord(raw = {}) {
  const preset = TOURNAMENT_GAMES.find(
    (g) => g.id === raw.gameId || g.name.toLowerCase() === String(raw.gameName || '').toLowerCase()
  );
  const category = COMPETITION_CATEGORIES.some((c) => c.id === raw.category)
    ? raw.category
    : preset
      ? preset.category
      : 'video_games';
  const mode = isPhysicalCategory(category)
    ? 'physical'
    : raw.mode === 'physical'
      ? 'physical'
      : 'online';
  const scope = raw.scope === 'internal' || raw.scope === 'local' ? 'internal' : 'inter_center';
  const hostGamenetId = raw.hostGamenetId || LOCAL_GAMENET_ID;
  const hostGamenetName = raw.hostGamenetName || LOCAL_GAMENET_NAME;
  const hostCity = raw.hostCity || LOCAL_GAMENET_CITY;

  const defaultPrizeSummary = raw.prizes?.first || 'جایزه توافقی میان گیم‌نت‌های شرکت‌کننده';
  const prizeAgreement = raw.prizeAgreement && typeof raw.prizeAgreement === 'object'
    ? {
        status: raw.prizeAgreement.status === 'agreed' ? 'agreed' : 'proposed',
        prizeType: PRIZE_TYPES.some((p) => p.id === raw.prizeAgreement.prizeType)
          ? raw.prizeAgreement.prizeType
          : raw.prizeType || 'mixed',
        summary: cleanText(raw.prizeAgreement.summary, 180) || defaultPrizeSummary,
        proposedByGamenetId: raw.prizeAgreement.proposedByGamenetId || hostGamenetId,
        proposedByGamenetName: raw.prizeAgreement.proposedByGamenetName || hostGamenetName,
        confirmedGamenetIds: Array.isArray(raw.prizeAgreement.confirmedGamenetIds)
          ? Array.from(new Set(raw.prizeAgreement.confirmedGamenetIds.map(String)))
          : [hostGamenetId],
      }
    : {
        status: scope === 'internal' || raw.status === 'completed' || raw.status === 'live' ? 'agreed' : 'proposed',
        prizeType: raw.prizeType || 'mixed',
        summary: defaultPrizeSummary,
        proposedByGamenetId: hostGamenetId,
        proposedByGamenetName: hostGamenetName,
        confirmedGamenetIds: [hostGamenetId],
      };

  const partnerInfo = NETWORK_PARTNER_GAMENETS.find((g) => g.id === hostGamenetId);
  const venue =
    mode === 'physical'
      ? cleanText(raw.venue, 120) || partnerInfo?.venue || `سالن حضوری ${hostGamenetName} (${hostCity})`
      : '';

  return {
    ...raw,
    category,
    mode,
    scope,
    isHeadToHead: Boolean(raw.isHeadToHead || raw.matchMode === 'head_to_head'),
    matchMode: raw.isHeadToHead || raw.matchMode === 'head_to_head' ? 'head_to_head' : 'bracket',
    sourceDirectChallengeId: raw.sourceDirectChallengeId || null,
    hostGamenetId,
    hostGamenetName,
    hostCity,
    venue,
    prizeAgreement,
    coverKey: raw.coverKey || preset?.coverKey || getCategoryMeta(category).coverKey,
    participants: Array.isArray(raw.participants) ? raw.participants : [],
  };
}

/**
 * Validates and sanitizes a representative team (or solo representative) for a gaming center.
 */
export function sanitizeTeamInput(raw = {}) {
  const name = cleanText(raw.name, 70);
  if (name.length < 2) {
    return { error: 'نام تیم یا نماینده باید حداقل ۲ کاراکتر باشد.' };
  }

  const category = COMPETITION_CATEGORIES.some((c) => c.id === raw.category)
    ? raw.category
    : 'video_games';
  const mode = getModeForCategory(category);

  const gameId = cleanText(raw.gameId, 40);
  const preset = TOURNAMENT_GAMES.find((g) => g.id === gameId && g.category === category);
  const gameName = preset
    ? preset.name
    : cleanText(raw.gameName || raw.customGameName, 60) || getCategoryMeta(category).label;

  const entryType = raw.entryType === 'individual' ? 'individual' : 'team';
  const members = parseMembersList(raw.members);
  if (members.length === 0) {
    return { error: 'حداقل یک بازیکن (از باشگاه مشتریان یا به‌صورت دستی) برای تیم مشخص کنید.' };
  }
  if (entryType === 'team' && members.length < 2) {
    return { error: 'برای تیم نمایندگی حداقل ۲ عضو انتخاب یا وارد کنید (یا حالت انفرادی را برگزینید).' };
  }

  const onlineTag = mode === 'online' ? cleanText(raw.onlineTag, 50) : '';
  const notes = cleanText(raw.notes, 180);

  return {
    value: {
      name,
      category,
      mode,
      gameId: preset ? preset.id : 'custom',
      gameName,
      entryType,
      members,
      onlineTag,
      notes,
      gamenetId: cleanText(raw.gamenetId, 40) || LOCAL_GAMENET_ID,
      gamenetName: cleanText(raw.gamenetName, 60) || LOCAL_GAMENET_NAME,
      city: cleanText(raw.city, 30) || LOCAL_GAMENET_CITY,
    },
  };
}

/**
 * Validates a new Public Challenge Announcement published by a gaming center.
 */
export function sanitizeChallengeInput(raw = {}) {
  const category = COMPETITION_CATEGORIES.some((c) => c.id === raw.category)
    ? raw.category
    : 'video_games';
  const mode = getModeForCategory(category);

  const gameId = cleanText(raw.gameId, 40);
  const preset = TOURNAMENT_GAMES.find((g) => g.id === gameId && g.category === category);
  const gameName = preset ? preset.name : cleanText(raw.gameName || raw.customGameName, 60);
  if (!gameName) {
    return { error: 'بازی یا رشته ورزشی چالش را انتخاب یا وارد کنید.' };
  }

  const teamName = cleanText(raw.teamName, 70);
  if (teamName.length < 2) {
    return { error: 'نام تیم یا شرکت‌کننده نماینده الزامی است.' };
  }

  const members = parseMembersList(raw.members);
  if (members.length === 0) {
    return { error: 'اعضای تیم یا نام شرکت‌کننده چالش را مشخص کنید.' };
  }

  const title = cleanText(raw.title, 96) || `چالش ${gameName} — ${teamName}`;
  const competitionScope = raw.competitionScope === 'multi_center' ? 'multi_center' : 'two_center';
  const entryType = raw.entryType === 'individual' ? 'individual' : 'team';
  const format =
    cleanText(raw.format, 50) ||
    (competitionScope === 'two_center' ? 'دوئل دو گیم‌نت' : 'تورنومنت چندگیم‌نتی حذفی');

  const rawCap = Number(normalizeDigits(raw.maxCenters || (competitionScope === 'two_center' ? 2 : 8)));
  const maxCenters = competitionScope === 'two_center' ? 2 : [4, 8, 16].includes(rawCap) ? rawCap : 8;

  const preferredDate = cleanText(raw.preferredDate, 50) || 'پنج‌شنبه ساعت ۲۰:۳۰';
  const registrationDeadline = cleanText(raw.registrationDeadline, 50) || '۲۴ ساعت پیش از شروع مسابقه';
  const platform =
    mode === 'online'
      ? cleanText(raw.platform, 30) || preset?.platform || 'PC'
      : '';
  const venue =
    mode === 'physical'
      ? cleanText(raw.venue, 120) || LOCAL_GAMENET_VENUE
      : '';

  const prizeType = PRIZE_TYPES.some((p) => p.id === raw.prizeType) ? raw.prizeType : 'playtime';
  const suggestedPrize = cleanText(raw.suggestedPrize, 160);
  if (suggestedPrize.length < 3) {
    return { error: 'جایزه پیشنهادی مسابقه را وارد کنید.' };
  }
  const rawPrizeVal = Number(normalizeDigits(raw.prizePoolValue ?? 0).replace(/[,٬\s]/g, ''));
  const prizePoolValue = Number.isFinite(rawPrizeVal) && rawPrizeVal >= 0 && rawPrizeVal <= 2_000_000_000
    ? Math.round(rawPrizeVal)
    : 0;

  const gamenetId = cleanText(raw.gamenetId, 40) || LOCAL_GAMENET_ID;
  const gamenetName = cleanText(raw.gamenetName, 60) || LOCAL_GAMENET_NAME;
  const city = cleanText(raw.city, 30) || LOCAL_GAMENET_CITY;

  const statement =
    cleanText(raw.statement, 240) ||
    `گیم‌نت ${gamenetName} با ${entryType === 'team' ? `تیم ${members.length} نفره «${teamName}»` : `نماینده خود «${teamName}»`} آماده رقابت در ${gameName} است. سایر گیم‌نت‌ها برای پذیرش این چالش دعوت می‌شوند.`;

  const onlineTag = mode === 'online' ? cleanText(raw.onlineTag, 50) || `Club:${gamenetId}` : '';

  return {
    value: {
      title,
      statement,
      category,
      mode,
      gameId: preset ? preset.id : 'custom',
      gameName,
      platform,
      venue,
      competitionScope,
      entryType,
      format,
      maxCenters,
      preferredDate,
      registrationDeadline,
      hostGamenetId: gamenetId,
      hostGamenetName: gamenetName,
      hostCity: city,
      teamId: cleanText(raw.teamId, 40) || null,
      teamName,
      members,
      coverKey: preset?.coverKey || getCategoryMeta(category).coverKey,
      status: 'open',
      prizeAgreement: {
        status: 'proposed',
        prizeType,
        summary: suggestedPrize,
        prizePoolValue,
        proposedByGamenetId: gamenetId,
        proposedByGamenetName: gamenetName,
        confirmedGamenetIds: [gamenetId],
      },
      participatingCenters: [
        {
          gamenetId,
          gamenetName,
          city,
          teamId: cleanText(raw.teamId, 40) || null,
          teamName,
          onlineId: onlineTag,
          members,
          role: 'host',
          registrationStatus: 'confirmed',
          prizeConfirmed: true,
          joinedAt: new Date().toISOString(),
        },
      ],
      formedTournamentId: null,
    },
  };
}

/**
 * Checks whether a public challenge has at least 2 distinct confirmed gaming centers
 * so automatic tournament formation can be triggered.
 */
export function canFormTournamentFromChallenge(challenge) {
  if (!challenge || challenge.status === 'formed' || challenge.formedTournamentId) return false;
  const centers = Array.isArray(challenge.participatingCenters) ? challenge.participatingCenters : [];
  const confirmedDistinct = new Set(
    centers
      .filter((c) => c && c.registrationStatus === 'confirmed' && c.gamenetId)
      .map((c) => String(c.gamenetId))
  );
  return confirmedDistinct.size >= 2;
}

/**
 * Evaluates whether all confirmed participating centers (minimum 2) have agreed on the proposed prize.
 */
export function computePrizeAgreementStatus(challengeOrTournament) {
  const agreement = challengeOrTournament?.prizeAgreement;
  if (!agreement) return 'proposed';
  const confirmed = new Set(
    Array.isArray(agreement.confirmedGamenetIds) ? agreement.confirmedGamenetIds.map(String) : []
  );

  if (Array.isArray(challengeOrTournament.participatingCenters)) {
    const centers = challengeOrTournament.participatingCenters.filter(
      (c) => c && c.registrationStatus === 'confirmed'
    );
    const distinctIds = Array.from(new Set(centers.map((c) => String(c.gamenetId))));
    if (distinctIds.length < 2) return 'proposed';
    return distinctIds.every((id) => confirmed.has(id)) ? 'agreed' : 'proposed';
  }

  // For tournaments directly
  const participants = Array.isArray(challengeOrTournament.participants)
    ? challengeOrTournament.participants
    : [];
  const distinctCenters = Array.from(
    new Set(participants.map((p) => String(p.gamenetId || challengeOrTournament.hostGamenetId)))
  );
  if (challengeOrTournament.scope === 'internal') return 'agreed';
  if (distinctCenters.length < 2) return confirmed.size >= 2 ? 'agreed' : 'proposed';
  return distinctCenters.every((id) => confirmed.has(id)) ? 'agreed' : 'proposed';
}

/**
 * Accepts a public challenge on behalf of a gaming center, adding its representative team/competitor
 * and optionally confirming or counter-proposing the prize.
 */
export function acceptChallengeForCenter(challenge, rawAccept = {}) {
  if (!challenge) return { error: 'چالش مورد نظر پیدا نشد.' };
  if (challenge.status === 'formed' || challenge.formedTournamentId) {
    return { error: 'تورنومنت این چالش قبلاً تشکیل شده است.' };
  }

  const gamenetId = cleanText(rawAccept.gamenetId, 40) || LOCAL_GAMENET_ID;
  const gamenetName = cleanText(rawAccept.gamenetName, 60) || LOCAL_GAMENET_NAME;
  const city = cleanText(rawAccept.city, 30) || LOCAL_GAMENET_CITY;
  const teamName = cleanText(rawAccept.teamName, 70);
  const members = parseMembersList(rawAccept.members);

  if (teamName.length < 2) {
    return { error: 'نام تیم یا شرکت‌کننده اعزامی را مشخص کنید.' };
  }
  if (members.length === 0) {
    return { error: 'حداقل یک عضو برای نماینده گیم‌نت وارد کنید.' };
  }

  const next = structuredClone(challenge);
  const centers = Array.isArray(next.participatingCenters) ? next.participatingCenters : [];
  if (centers.some((c) => String(c.gamenetId) === String(gamenetId))) {
    return { error: 'این گیم‌نت قبلاً در این چالش ثبت‌نام کرده است.' };
  }
  if (centers.length >= Number(next.maxCenters || 8)) {
    return { error: 'ظرفیت پذیرش گیم‌نت‌ها در این چالش تکمیل شده است.' };
  }

  const confirmExistingPrize = rawAccept.confirmPrize !== false && rawAccept.confirmPrize !== '0' && rawAccept.confirmPrize !== 'false';
  const counterPrize = cleanText(rawAccept.counterPrize, 160);
  const counterPrizeType = PRIZE_TYPES.some((p) => p.id === rawAccept.counterPrizeType)
    ? rawAccept.counterPrizeType
    : next.prizeAgreement?.prizeType || 'playtime';

  const onlineId =
    next.mode === 'online'
      ? cleanText(rawAccept.onlineId, 50) || `Club:${gamenetId}`
      : `میزبان/عضو ${gamenetName}`;

  centers.push({
    gamenetId,
    gamenetName,
    city,
    teamId: cleanText(rawAccept.teamId, 40) || null,
    teamName,
    onlineId,
    members,
    role: 'challenger',
    registrationStatus: 'confirmed',
    prizeConfirmed: confirmExistingPrize && !counterPrize,
    joinedAt: new Date().toISOString(),
  });
  next.participatingCenters = centers;

  if (!next.prizeAgreement) {
    next.prizeAgreement = {
      status: 'proposed',
      prizeType: 'playtime',
      summary: 'جایزه توافقی',
      prizePoolValue: 0,
      proposedByGamenetId: next.hostGamenetId,
      proposedByGamenetName: next.hostGamenetName,
      confirmedGamenetIds: [next.hostGamenetId],
    };
  }

  if (counterPrize) {
    // Counter-proposal resets confirmations to only the proposing center
    next.prizeAgreement.summary = counterPrize;
    next.prizeAgreement.prizeType = counterPrizeType;
    next.prizeAgreement.proposedByGamenetId = gamenetId;
    next.prizeAgreement.proposedByGamenetName = gamenetName;
    next.prizeAgreement.confirmedGamenetIds = [gamenetId];
    next.participatingCenters.forEach((c) => {
      c.prizeConfirmed = String(c.gamenetId) === String(gamenetId);
    });
  } else if (confirmExistingPrize) {
    const confirmed = new Set(next.prizeAgreement.confirmedGamenetIds || []);
    confirmed.add(gamenetId);
    next.prizeAgreement.confirmedGamenetIds = Array.from(confirmed);
  }

  next.prizeAgreement.status = computePrizeAgreementStatus(next);
  if (canFormTournamentFromChallenge(next)) {
    next.status = 'ready';
  }

  return { challenge: next };
}

/**
 * Proposes an updated prize on a challenge (resets status to 'proposed')
 * or confirms the current prize for a gaming center (moves to 'agreed' once all confirmed centers agree).
 */
export function updateChallengePrizeAgreement(challenge, { actionType, gamenetId, gamenetName, summary, prizeType, prizePoolValue } = {}) {
  if (!challenge) return { error: 'چالش پیدا نشد.' };
  const next = structuredClone(challenge);
  const actorId = cleanText(gamenetId, 40) || LOCAL_GAMENET_ID;
  const actorName = cleanText(gamenetName, 60) || LOCAL_GAMENET_NAME;

  if (!next.prizeAgreement) {
    next.prizeAgreement = {
      status: 'proposed',
      prizeType: 'playtime',
      summary: 'جایزه توافقی',
      prizePoolValue: 0,
      proposedByGamenetId: actorId,
      proposedByGamenetName: actorName,
      confirmedGamenetIds: [actorId],
    };
  }

  if (actionType === 'propose') {
    const cleanSummary = cleanText(summary, 160);
    if (cleanSummary.length < 3) {
      return { error: 'شرح جایزه پیشنهادی باید حداقل ۳ کاراکتر باشد.' };
    }
    next.prizeAgreement.summary = cleanSummary;
    if (PRIZE_TYPES.some((p) => p.id === prizeType)) {
      next.prizeAgreement.prizeType = prizeType;
    }
    if (prizePoolValue !== undefined && prizePoolValue !== null && prizePoolValue !== '') {
      const val = Number(normalizeDigits(prizePoolValue).replace(/[,٬\s]/g, ''));
      if (Number.isFinite(val) && val >= 0 && val <= 2_000_000_000) {
        next.prizeAgreement.prizePoolValue = Math.round(val);
      }
    }
    next.prizeAgreement.proposedByGamenetId = actorId;
    next.prizeAgreement.proposedByGamenetName = actorName;
    next.prizeAgreement.confirmedGamenetIds = [actorId];
    if (Array.isArray(next.participatingCenters)) {
      next.participatingCenters.forEach((c) => {
        c.prizeConfirmed = String(c.gamenetId) === String(actorId);
      });
    }
    next.prizeAgreement.status = 'proposed';
    return { challenge: next };
  }

  // Confirm current prize
  const confirmed = new Set(next.prizeAgreement.confirmedGamenetIds || []);
  confirmed.add(actorId);
  // If user is confirming on behalf of all participating centers (finalizing agreement in demo/club flow)
  if (actionType === 'finalize_all' && Array.isArray(next.participatingCenters)) {
    next.participatingCenters.forEach((c) => {
      confirmed.add(String(c.gamenetId));
      c.prizeConfirmed = true;
    });
  } else if (Array.isArray(next.participatingCenters)) {
    next.participatingCenters.forEach((c) => {
      if (String(c.gamenetId) === String(actorId)) c.prizeConfirmed = true;
    });
  }
  next.prizeAgreement.confirmedGamenetIds = Array.from(confirmed);
  next.prizeAgreement.status = computePrizeAgreementStatus(next);

  return { challenge: next };
}

/**
 * Automatically converts an accepted challenge (>= 2 gaming centers) into a full Tournament
 * with its visual bracket immediately generated!
 */
export function buildTournamentFromChallenge(challenge, overrides = {}, generatedId = 'trn-formed') {
  if (!canFormTournamentFromChallenge(challenge)) {
    return { error: 'برای تشکیل خودکار تورنومنت حداقل ۲ گیم‌نت باید چالش را پذیرفته باشند.' };
  }

  const confirmedCenters = (challenge.participatingCenters || []).filter(
    (c) => c && c.registrationStatus === 'confirmed'
  );
  const mode = getModeForCategory(challenge.category);
  const title = cleanText(overrides.title, 96) || challenge.title.replace(/^چالش\s+/u, 'تورنومنت ');
  const startDate = cleanText(overrides.startDate, 50) || challenge.preferredDate || 'پنج‌شنبه ساعت ۲۱:۰۰';
  const registrationDeadline = cleanText(overrides.registrationDeadline, 50) || challenge.registrationDeadline || '';
  const venue =
    mode === 'physical'
      ? cleanText(overrides.venue, 120) || challenge.venue || LOCAL_GAMENET_VENUE
      : '';
  const platform =
    mode === 'online'
      ? cleanText(overrides.platform, 30) || challenge.platform || 'PC'
      : '';

  const requestedSlots = Number(normalizeDigits(overrides.maxSlots || challenge.maxCenters || confirmedCenters.length));
  const allowedSlots = [2, 4, 8, 16];
  const minNeeded = confirmedCenters.length <= 2 ? 2 : confirmedCenters.length <= 4 ? 4 : confirmedCenters.length <= 8 ? 8 : 16;
  const maxSlots = allowedSlots.includes(requestedSlots) ? Math.max(requestedSlots, minNeeded) : minNeeded;

  const participants = confirmedCenters.map((c, idx) => ({
    id: `p-ch-${idx + 1}-${c.gamenetId}`,
    playerName: c.teamName,
    onlineId: mode === 'online' ? c.onlineId || `Club:${c.gamenetId}` : `نماینده ${c.gamenetName}`,
    gamenetId: c.gamenetId,
    gamenetName: c.gamenetName,
    city: c.city || 'ایران',
    members: Array.isArray(c.members) ? c.members : [],
    registeredAt: c.joinedAt || new Date().toISOString(),
  }));

  const bracket = generateSingleEliminationBracket(participants, maxSlots);
  const prizeSummary = cleanText(overrides.prizeSummary, 160) || challenge.prizeAgreement?.summary || 'جایزه توافقی شبکه';
  const prizePoolValue = Number(challenge.prizeAgreement?.prizePoolValue) || 0;
  const prizeStatus =
    overrides.confirmPrizeNow === true || overrides.confirmPrizeNow === '1'
      ? 'agreed'
      : challenge.prizeAgreement?.status || 'proposed';

  const tournament = normalizeTournamentRecord({
    id: generatedId,
    title,
    category: challenge.category,
    mode,
    gameId: challenge.gameId,
    gameName: challenge.gameName,
    platform,
    venue,
    format: cleanText(overrides.format, 50) || challenge.format,
    scope: 'inter_center',
    status: 'live',
    maxSlots,
    entryFee: 0,
    prizeType: challenge.prizeAgreement?.prizeType || 'playtime',
    prizePoolValue,
    prizes: {
      first: prizeSummary,
      second: cleanText(overrides.prizeSecond, 100) || 'تقدیرنامه و امتیاز رنکینگ باشگاه در شبکه',
      third: cleanText(overrides.prizeThird, 100) || 'امتیاز رنکینگ شبکه گیم‌نت‌ها',
    },
    prizeAgreement: {
      status: prizeStatus,
      prizeType: challenge.prizeAgreement?.prizeType || 'playtime',
      summary: prizeSummary,
      proposedByGamenetId: challenge.prizeAgreement?.proposedByGamenetId || challenge.hostGamenetId,
      proposedByGamenetName: challenge.prizeAgreement?.proposedByGamenetName || challenge.hostGamenetName,
      confirmedGamenetIds:
        prizeStatus === 'agreed'
          ? confirmedCenters.map((c) => c.gamenetId)
          : challenge.prizeAgreement?.confirmedGamenetIds || [challenge.hostGamenetId],
    },
    startDate,
    registrationDeadline,
    lobbyCode: mode === 'online' ? `NET-${Math.floor(1000 + Math.random() * 9000)}` : '',
    rules:
      cleanText(overrides.rules, 260) ||
      (mode === 'physical'
        ? `مسابقه به‌صورت حضوری در ${venue} برگزار می‌شود. حضور تیم‌ها ۱۵ دقیقه پیش از زمان مقرر الزامی است.`
        : 'مسابقه آنلاین میان نمایندگان رسمی گیم‌نت‌ها؛ نتیجه هر دیدار پس از تایید مدیران دو سالن در جدول ثبت می‌شود.'),
    hostGamenetId: challenge.hostGamenetId,
    hostGamenetName: challenge.hostGamenetName,
    hostCity: challenge.hostCity,
    coverKey: challenge.coverKey,
    sourceChallengeId: challenge.id,
    createdAt: new Date().toISOString(),
    participants,
    bracket,
  });

  return { tournament };
}

export function sanitizeTournamentInput(raw = {}) {
  const title = cleanText(raw.title, 96);
  if (title.length < 3) {
    return { error: 'عنوان تورنومنت باید حداقل ۳ کاراکتر باشد.' };
  }

  const category = COMPETITION_CATEGORIES.some((c) => c.id === raw.category)
    ? raw.category
    : 'video_games';
  const mode = getModeForCategory(category);

  const gameId = cleanText(raw.gameId, 40);
  const presetGame = TOURNAMENT_GAMES.find((g) => g.id === gameId);
  const gameName = presetGame ? presetGame.name : cleanText(raw.gameName || raw.customGameName, 60);
  if (!gameName) {
    return { error: 'نام بازی یا رشته ورزشی را انتخاب یا وارد کنید.' };
  }

  const platform =
    mode === 'online'
      ? cleanText(raw.platform, 30) || (presetGame ? presetGame.platform : 'کراس‌پلتفرم')
      : '';
  const venue =
    mode === 'physical'
      ? cleanText(raw.venue, 120) || LOCAL_GAMENET_VENUE
      : '';

  const format = cleanText(raw.format, 50) || (presetGame ? presetGame.defaultFormat : 'انفرادی ۱ به ۱');

  const rawSlots = Number(normalizeDigits(raw.maxSlots).replace(/[,٬\s]/g, ''));
  const allowedSlots = [2, 4, 8, 16, 32];
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
  const prizeFirst = cleanText(raw.prizeFirst, 140);
  if (!prizeFirst) {
    return { error: 'جایزه نفر یا تیم اول را مشخص کنید.' };
  }
  const prizeSecond = cleanText(raw.prizeSecond, 120) || 'اعتبار بازی رایگان در سالن میزبان';
  const prizeThird = cleanText(raw.prizeThird, 120) || 'اعتبار بوفه و امتیاز باشگاه';

  const scope = raw.scope === 'internal' || raw.scope === 'local' ? 'internal' : 'inter_center';
  const startDate = cleanText(raw.startDate, 50) || 'پنج‌شنبه ساعت ۲۱:۰۰';
  const registrationDeadline = cleanText(raw.registrationDeadline, 50) || '';
  const lobbyCode = mode === 'online' ? cleanText(raw.lobbyCode, 40) || `GD-${Math.floor(1000 + Math.random() * 9000)}` : '';
  const rules =
    cleanText(raw.rules, 260) ||
    (mode === 'physical'
      ? `مسابقه حضوری در ${venue}. ثبت نتایج هر دور توسط داور و مدیر سالن میزبان انجام می‌شود.`
      : 'حضور ۱۵ دقیقه قبل از شروع مسابقه در لابی آنلاین الزامی است. نتیجه هر دور توسط مدیر گیم‌نت میزبان تأیید می‌شود.');

  const hostGamenetId = cleanText(raw.hostGamenetId, 40) || LOCAL_GAMENET_ID;
  const hostGamenetName = cleanText(raw.hostGamenetName, 60) || LOCAL_GAMENET_NAME;
  const hostCity = cleanText(raw.hostCity, 30) || LOCAL_GAMENET_CITY;

  const coverKey = presetGame
    ? presetGame.coverKey
    : category === 'billiards'
      ? 'billiards'
      : category === 'foosball'
        ? 'foosball'
        : platform.includes('PC')
          ? 'pc'
          : 'console';

  return {
    value: {
      title,
      category,
      mode,
      gameId: presetGame ? presetGame.id : 'custom',
      gameName,
      platform,
      venue,
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
      prizeAgreement: {
        status: scope === 'internal' ? 'agreed' : 'proposed',
        prizeType,
        summary: prizeFirst,
        proposedByGamenetId: hostGamenetId,
        proposedByGamenetName: hostGamenetName,
        confirmedGamenetIds: [hostGamenetId],
      },
      startDate,
      registrationDeadline,
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
  const playerName = cleanText(raw.playerName, 65);
  const isPhysical = tournament ? tournament.mode === 'physical' || isPhysicalCategory(tournament.category) : false;
  const rawOnlineId = cleanText(raw.onlineId, 48);
  const onlineId = isPhysical
    ? rawOnlineId || `عضو حضوری ${cleanText(raw.gamenetName, 30) || LOCAL_GAMENET_NAME}`
    : rawOnlineId;
  const gamenetName = cleanText(raw.gamenetName, 60) || LOCAL_GAMENET_NAME;
  const gamenetId = cleanText(raw.gamenetId, 40) || LOCAL_GAMENET_ID;
  const city = cleanText(raw.city, 30) || LOCAL_GAMENET_CITY;
  const customerId = cleanText(raw.customerId, 20);
  const members = parseMembersList(raw.members);

  if (playerName.length < 2) {
    return { error: 'نام بازیکن یا تیم باید حداقل ۲ کاراکتر باشد.' };
  }
  if (!isPhysical && onlineId.length < 2) {
    return { error: 'شناسه آنلاین (PSN / Steam / Riot ID) برای مسابقات ویدیویی الزامی است.' };
  }

  if (tournament) {
    if (tournament.status === 'completed') {
      return { error: 'این تورنومنت به پایان رسیده و ثبت‌نام جدید ممکن نیست.' };
    }
    const existing = Array.isArray(tournament.participants) ? tournament.participants : [];
    if (existing.length >= Number(tournament.maxSlots || 8)) {
      return { error: 'ظرفیت این تورنومنت تکمیل شده است.' };
    }
    const duplicate = existing.some((p) => {
      if (!isPhysical && p.onlineId && onlineId) {
        return String(p.onlineId).trim().toLowerCase() === onlineId.toLowerCase();
      }
      return (
        String(p.playerName || '').trim().toLowerCase() === playerName.toLowerCase() &&
        String(p.gamenetId || '') === String(gamenetId)
      );
    });
    if (duplicate) {
      return {
        error: isPhysical
          ? 'این بازیکن یا تیم قبلاً از این گیم‌نت ثبت شده است.'
          : 'بازیکن یا تیمی با این شناسه آنلاین قبلاً در تورنومنت ثبت شده است.',
      };
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
      members,
    },
  };
}

/**
 * Generates a balanced single-elimination knockout bracket (2, 4, 8, or 16 slots).
 * Supports 2-center direct finals as well as multi-center tournaments, with automatic bye advancement.
 */
export function generateSingleEliminationBracket(participants = [], maxSlots = 8) {
  const list = Array.isArray(participants) ? participants.filter(Boolean) : [];
  const requested = Number(maxSlots) || 8;
  let bracketSize = 2;
  if (requested > 8 || list.length > 8) bracketSize = 16;
  else if (requested > 4 || list.length > 4) bracketSize = 8;
  else if (requested > 2 || list.length > 2) bracketSize = 4;
  else bracketSize = 2;

  const totalRounds = Math.log2(bracketSize);
  const roundNamesByCount = {
    1: ['فینال مستقیم'],
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

  const round0 = rounds[0].matches;
  for (let i = 0; i < round0.length; i++) {
    const pA = list[i] || null;
    const pB = list[i + round0.length] || null;
    round0[i].playerA = pA ? toSlotPlayer(pA) : null;
    round0[i].playerB = pB ? toSlotPlayer(pB) : null;
    if (round0[i].playerA && round0[i].playerB) {
      round0[i].status = 'ready';
    } else if (round0[i].playerA && !round0[i].playerB) {
      round0[i].winnerId = round0[i].playerA.id;
      round0[i].status = 'bye';
      propagateWinner(rounds, 0, i, round0[i].playerA);
    }
  }

  return {
    bracketSize,
    generatedAt: new Date().toISOString(),
    champion: null,
    runnerUp: null,
    finalScore: null,
    completedAt: null,
    rounds,
  };
}

function toSlotPlayer(p) {
  return {
    id: String(p.id),
    playerName: p.playerName,
    onlineId: p.onlineId || '',
    gamenetId: p.gamenetId || LOCAL_GAMENET_ID,
    gamenetName: p.gamenetName || LOCAL_GAMENET_NAME,
    members: Array.isArray(p.members) ? p.members : [],
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
 * Records match score & winner, propagating to the next round or crowning the official champion.
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
  const runnerUp = winnerSide === 'A' ? targetMatch.playerB : targetMatch.playerA;
  targetMatch.scoreA = Math.floor(parsedA);
  targetMatch.scoreB = Math.floor(parsedB);
  targetMatch.winnerId = winner.id;
  targetMatch.status = 'done';

  const isFinal = targetRound.index === nextBracket.rounds.length - 1;
  if (isFinal) {
    nextBracket.champion = toSlotPlayer(winner);
    nextBracket.runnerUp = toSlotPlayer(runnerUp);
    nextBracket.finalScore = {
      scoreA: targetMatch.scoreA,
      scoreB: targetMatch.scoreB,
      winnerName: winner.playerName,
      runnerUpName: runnerUp.playerName,
    };
    nextBracket.completedAt = new Date().toISOString();
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
  const list = (Array.isArray(tournaments) ? tournaments : []).map(normalizeTournamentRecord);
  const statusFilter = filters.status || 'all';
  const categoryFilter = filters.category || 'all';
  const gameFilter = filters.game || 'all';
  const scopeFilter = filters.scope || 'all';
  const query = cleanText(filters.query, 80).toLowerCase();

  return list.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (gameFilter !== 'all' && t.gameId !== gameFilter && t.gameName !== gameFilter) return false;
    if (scopeFilter === 'internal' && t.scope !== 'internal') return false;
    if (scopeFilter === 'inter_center' && t.scope !== 'inter_center') return false;
    if (scopeFilter === 'hosted-by-me' && t.hostGamenetId !== LOCAL_GAMENET_ID) return false;
    if (query) {
      const hay = [
        t.title,
        t.gameName,
        t.hostGamenetName,
        t.hostCity,
        t.venue,
        t.prizes?.first,
        t.prizeAgreement?.summary,
        t.platform,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function filterChallenges(challenges = [], filters = {}) {
  const list = Array.isArray(challenges) ? challenges : [];
  const categoryFilter = filters.category || 'all';
  const statusFilter = filters.status || 'all';
  const query = cleanText(filters.query, 80).toLowerCase();

  return list.filter((ch) => {
    if (categoryFilter !== 'all' && ch.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && ch.status !== statusFilter) return false;
    if (query) {
      const hay = [
        ch.title,
        ch.statement,
        ch.gameName,
        ch.teamName,
        ch.hostGamenetName,
        ch.hostCity,
        ch.venue,
        ch.prizeAgreement?.summary,
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function computeNetworkSummary(tournaments = [], challenges = [], teams = []) {
  const list = (Array.isArray(tournaments) ? tournaments : []).map(normalizeTournamentRecord);
  const challengeList = Array.isArray(challenges) ? challenges : [];
  const teamList = Array.isArray(teams) ? teams : [];
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
  let internalCount = 0;
  let completedCount = 0;
  let totalPrizePool = 0;
  let totalPlayers = 0;
  let localPlayers = 0;

  for (const t of list) {
    if (t.scope === 'internal') internalCount += 1;
    if (t.status === 'completed') {
      completedCount += 1;
    } else if (t.status === 'registration' || t.status === 'live') {
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

  const openChallenges = challengeList.filter((c) => c && c.status !== 'formed').length;
  const readyChallenges = challengeList.filter((c) => canFormTournamentFromChallenge(c)).length;
  const localTeamsCount = teamList.filter((tm) => tm && tm.gamenetId === LOCAL_GAMENET_ID).length;

  const partnerLeaderboard = Array.from(gamenetMap.values()).sort((a, b) => {
    if (b.championships !== a.championships) return b.championships - a.championships;
    if (b.playersSent !== a.playersSent) return b.playersSent - a.playersSent;
    return b.prizeOffered - a.prizeOffered;
  });

  return {
    totalTournaments: list.length,
    activeTournaments,
    internalCount,
    completedCount,
    openChallenges,
    readyChallenges,
    localTeamsCount,
    connectedGamenets: partnerLeaderboard.length,
    totalPrizePool,
    totalPlayers,
    localPlayers,
    partnerLeaderboard,
  };
}

export function buildChampionHeadline(tournament) {
  const champ = tournament?.bracket?.champion;
  if (!champ) return '';
  const dateLabel = tournament.completedDateLabel || tournament.startDate || '۵ آذر ۱۴۰۵';
  return `${champ.playerName} به نمایندگی از گیم‌نت ${champ.gamenetName} در تاریخ ${dateLabel} قهرمان تورنومنت ${tournament.gameName} شد.`;
}

/* ==========================================================================
   DETERMINISTIC SEED DATA (Teams, Open Challenges, Internal & Inter-Center Tournaments)
   ========================================================================== */

export function createSeedTeams() {
  return [
    {
      id: 'team-gd-alpha-cs2',
      name: 'تیم Alpha',
      category: 'video_games',
      mode: 'online',
      gameId: 'cs2',
      gameName: 'Counter-Strike 2',
      entryType: 'team',
      onlineTag: 'Steam:GD_AlphaSquad',
      gamenetId: LOCAL_GAMENET_ID,
      gamenetName: LOCAL_GAMENET_NAME,
      city: LOCAL_GAMENET_CITY,
      members: [
        { name: 'علیرضا گوهری', customerId: '37809', role: 'کاپیتان (IGL)' },
        { name: 'آرش کاظمی', customerId: null, role: 'AWPer' },
        { name: 'امیرحسین نادری', customerId: null, role: 'Entry Fragger' },
        { name: 'سهیل مرادی', customerId: null, role: 'Support' },
        { name: 'کیانوش رضایی', customerId: null, role: 'Lurker' },
      ],
      notes: 'تیم منتخب ۵ نفره Game District برنده لیگ داخلی آبان ۱۴۰۵',
      createdAt: '2026-11-20T10:00:00.000Z',
    },
    {
      id: 'team-gd-foosball-duo',
      name: 'تیم رعد Game District',
      category: 'foosball',
      mode: 'physical',
      gameId: 'foosball-2v2',
      gameName: 'فوتبال دستی تیمی (۲ به ۲)',
      entryType: 'team',
      onlineTag: '',
      gamenetId: LOCAL_GAMENET_ID,
      gamenetName: LOCAL_GAMENET_NAME,
      city: LOCAL_GAMENET_CITY,
      members: [
        { name: 'محمد باقر قالیباف', customerId: '05052', role: 'مهاجم' },
        { name: 'جعفر محمدی2', customerId: '85852', role: 'مدافع' },
      ],
      notes: 'زوج برتر میز شماره ۱ فوتبال دستی سالن — آماده رقابت حضوری با باشگاه‌های تهران',
      createdAt: '2026-11-21T15:30:00.000Z',
    },
    {
      id: 'team-gd-billiards-ace',
      name: 'نماینده ایت‌بال — رضا حیدری',
      category: 'billiards',
      mode: 'physical',
      gameId: 'billiards-8ball',
      gameName: 'بیلیارد ایت‌بال (8-Ball)',
      entryType: 'individual',
      onlineTag: '',
      gamenetId: LOCAL_GAMENET_ID,
      gamenetName: LOCAL_GAMENET_NAME,
      city: LOCAL_GAMENET_CITY,
      members: [{ name: 'رضا حیدری', customerId: null, role: 'بازیکن انفرادی ایت‌بال' }],
      notes: 'قهرمان دوره پاییزه بیلیارد داخلی Game District',
      createdAt: '2026-11-22T18:00:00.000Z',
    },
  ];
}

export function createSeedChallenges() {
  return [
    {
      id: 'chl-gd-cs2-alpha',
      title: 'چالش ۵ به ۵ Counter-Strike 2 — تیم Alpha',
      statement:
        'گیم‌نت Game District با تیم ۵ نفره منتخب خود (تیم Alpha) آماده رقابت در Counter-Strike 2 است. سایر گیم‌نت‌ها برای پذیرش این چالش دعوت می‌شوند.',
      category: 'video_games',
      mode: 'online',
      gameId: 'cs2',
      gameName: 'Counter-Strike 2',
      platform: 'PC',
      venue: '',
      competitionScope: 'multi_center',
      entryType: 'team',
      format: 'تیمی ۵ به ۵ — تورنومنت چندگیم‌نتی حذفی',
      maxCenters: 4,
      preferredDate: 'پنج‌شنبه ۶ آذر — ساعت ۲۱:۰۰',
      registrationDeadline: 'تا چهارشنبه ساعت ۲۳:۵۹',
      hostGamenetId: LOCAL_GAMENET_ID,
      hostGamenetName: LOCAL_GAMENET_NAME,
      hostCity: LOCAL_GAMENET_CITY,
      teamId: 'team-gd-alpha-cs2',
      teamName: 'تیم Alpha',
      members: [
        { name: 'علیرضا گوهری', customerId: '37809', role: 'کاپیتان' },
        { name: 'آرش کاظمی', customerId: null, role: 'AWPer' },
        { name: 'امیرحسین نادری', customerId: null, role: 'Entry' },
        { name: 'سهیل مرادی', customerId: null, role: 'Support' },
        { name: 'کیانوش رضایی', customerId: null, role: 'Lurker' },
      ],
      coverKey: 'pc',
      status: 'ready',
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'hardware',
        summary: '۵ عدد هدست گیمینگ حرفه‌ای + ۲۰ ساعت سشن VIP رایگان در سالن میزبان',
        prizePoolValue: 18000000,
        proposedByGamenetId: LOCAL_GAMENET_ID,
        proposedByGamenetName: LOCAL_GAMENET_NAME,
        confirmedGamenetIds: [LOCAL_GAMENET_ID, 'arena-plus', 'cyberland-isf'],
      },
      participatingCenters: [
        {
          gamenetId: LOCAL_GAMENET_ID,
          gamenetName: LOCAL_GAMENET_NAME,
          city: LOCAL_GAMENET_CITY,
          teamId: 'team-gd-alpha-cs2',
          teamName: 'تیم Alpha',
          onlineId: 'Steam:GD_AlphaSquad',
          members: [
            { name: 'علیرضا گوهری', customerId: '37809', role: 'کاپیتان' },
            { name: 'آرش کاظمی', customerId: null, role: 'AWPer' },
            { name: 'امیرحسین نادری', customerId: null, role: 'Entry' },
            { name: 'سهیل مرادی', customerId: null, role: 'Support' },
            { name: 'کیانوش رضایی', customerId: null, role: 'Lurker' },
          ],
          role: 'host',
          registrationStatus: 'confirmed',
          prizeConfirmed: true,
          joinedAt: '2026-11-23T12:00:00.000Z',
        },
        {
          gamenetId: 'arena-plus',
          gamenetName: 'آرنا پلاس',
          city: 'تهران',
          teamId: null,
          teamName: 'تیم Apex Arena',
          onlineId: 'Steam:AP_Apex5',
          members: [
            { name: 'کیان مرادی', customerId: null, role: 'کاپیتان' },
            { name: 'شایان بهرامی', customerId: null, role: 'Rifler' },
            { name: 'پارسا نجفی', customerId: null, role: 'AWPer' },
            { name: 'نیما شاکری', customerId: null, role: 'Support' },
            { name: 'ماهان زارع', customerId: null, role: 'Entry' },
          ],
          role: 'challenger',
          registrationStatus: 'confirmed',
          prizeConfirmed: true,
          joinedAt: '2026-11-24T09:15:00.000Z',
        },
        {
          gamenetId: 'cyberland-isf',
          gamenetName: 'سایبرلند',
          city: 'اصفهان',
          teamId: null,
          teamName: 'تیم Isfahan Wolves',
          onlineId: 'Steam:CL_Wolves',
          members: [
            { name: 'سهیل رضایی', customerId: null, role: 'کاپیتان' },
            { name: 'ماهان فرهادی', customerId: null, role: 'Rifler' },
            { name: 'پدرام موسوی', customerId: null, role: 'AWPer' },
            { name: 'حسین طاهری', customerId: null, role: 'Support' },
            { name: 'بهنام کریمی', customerId: null, role: 'Entry' },
          ],
          role: 'challenger',
          registrationStatus: 'confirmed',
          prizeConfirmed: true,
          joinedAt: '2026-11-24T16:40:00.000Z',
        },
      ],
      formedTournamentId: null,
      createdAt: '2026-11-23T12:00:00.000Z',
    },
    {
      id: 'chl-arena-foosball-duel',
      title: 'چالش حضوری فوتبال دستی ۲ به ۲ تهران',
      statement:
        'باشگاه آرنا پلاس با تیم دو نفره منتخب فوتبال دستی خود آماده میزبانی یک دوئل رسمی از سایر گیم‌نت‌های تهران است.',
      category: 'foosball',
      mode: 'physical',
      gameId: 'foosball-2v2',
      gameName: 'فوتبال دستی تیمی (۲ به ۲)',
      platform: '',
      venue: 'باشگاه آرنا پلاس — تهران، شهرک غرب، سالن میزهای حرفه‌ای',
      competitionScope: 'two_center',
      entryType: 'team',
      format: 'دوئل دو گیم‌نت (بهترین از ۵ ست)',
      maxCenters: 2,
      preferredDate: 'جمعه ۷ آذر — ساعت ۱۹:۰۰',
      registrationDeadline: 'تا پنج‌شنبه ساعت ۲۰:۰۰',
      hostGamenetId: 'arena-plus',
      hostGamenetName: 'آرنا پلاس',
      hostCity: 'تهران',
      teamId: null,
      teamName: 'زوج طوفان آرنا',
      members: [
        { name: 'سروش امینی', customerId: null, role: 'مهاجم' },
        { name: 'پویا ملکی', customerId: null, role: 'مدافع' },
      ],
      coverKey: 'foosball',
      status: 'open',
      prizeAgreement: {
        status: 'proposed',
        prizeType: 'vip_session',
        summary: '۱۵ ساعت سشن VIP رایگان + پذیرایی کامل بوفه برای تیم برنده',
        prizePoolValue: 4500000,
        proposedByGamenetId: 'arena-plus',
        proposedByGamenetName: 'آرنا پلاس',
        confirmedGamenetIds: ['arena-plus'],
      },
      participatingCenters: [
        {
          gamenetId: 'arena-plus',
          gamenetName: 'آرنا پلاس',
          city: 'تهران',
          teamId: null,
          teamName: 'زوج طوفان آرنا',
          onlineId: '',
          members: [
            { name: 'سروش امینی', customerId: null, role: 'مهاجم' },
            { name: 'پویا ملکی', customerId: null, role: 'مدافع' },
          ],
          role: 'host',
          registrationStatus: 'confirmed',
          prizeConfirmed: true,
          joinedAt: '2026-11-24T13:00:00.000Z',
        },
      ],
      formedTournamentId: null,
      createdAt: '2026-11-24T13:00:00.000Z',
    },
    {
      id: 'chl-parsian-billiards',
      title: 'چالش حضوری بیلیارد ایت‌بال بین‌باشگاهی',
      statement:
        'گیم‌کلاب پارسیان با قهرمان ایت‌بال سالن خود آماده رقابت با نمایندگان سایر گیم‌نت‌ها در مسابقه حضوری ۸-Ball است.',
      category: 'billiards',
      mode: 'physical',
      gameId: 'billiards-8ball',
      gameName: 'بیلیارد ایت‌بال (8-Ball)',
      platform: '',
      venue: 'گیم‌کلاب پارسیان — شیراز، معالی‌آباد، سالن بیلیارد طبقه اول',
      competitionScope: 'multi_center',
      entryType: 'individual',
      format: 'انفرادی ۱ به ۱ — حذفی ۴ گیم‌نت',
      maxCenters: 4,
      preferredDate: 'شنبه ۸ آذر — ساعت ۱۸:۳۰',
      registrationDeadline: 'تا جمعه ساعت ۲۲:۰۰',
      hostGamenetId: 'parsian-shz',
      hostGamenetName: 'گیم‌کلاب پارسیان',
      hostCity: 'شیراز',
      teamId: null,
      teamName: 'مانی کریمی',
      members: [{ name: 'مانی کریمی', customerId: null, role: 'بازیکن ایت‌بال' }],
      coverKey: 'billiards',
      status: 'open',
      prizeAgreement: {
        status: 'proposed',
        prizeType: 'gift_card',
        summary: 'چوب بیلیارد حرفه‌ای + گیفت‌کارت ۱۰ ساعت بازی رایگان',
        prizePoolValue: 7500000,
        proposedByGamenetId: 'parsian-shz',
        proposedByGamenetName: 'گیم‌کلاب پارسیان',
        confirmedGamenetIds: ['parsian-shz'],
      },
      participatingCenters: [
        {
          gamenetId: 'parsian-shz',
          gamenetName: 'گیم‌کلاب پارسیان',
          city: 'شیراز',
          teamId: null,
          teamName: 'مانی کریمی',
          onlineId: '',
          members: [{ name: 'مانی کریمی', customerId: null, role: 'بازیکن ایت‌بال' }],
          role: 'host',
          registrationStatus: 'confirmed',
          prizeConfirmed: true,
          joinedAt: '2026-11-24T17:20:00.000Z',
        },
      ],
      formedTournamentId: null,
      createdAt: '2026-11-24T17:20:00.000Z',
    },
  ];
}

export function createSeedTournaments() {
  // 1. Active Inter-Center Online Tournament (EA Sports FC 25)
  const fcParticipants = [
    { id: 'p-fc-1', playerName: 'آرش کاظمی', onlineId: 'Arash_GD99', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'آرش کاظمی' }] },
    { id: 'p-fc-2', playerName: 'کیان مرادی', onlineId: 'KianPro_AP', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران', members: [{ name: 'کیان مرادی' }] },
    { id: 'p-fc-3', playerName: 'سهیل رضایی', onlineId: 'Soheil_CL', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان', members: [{ name: 'سهیل رضایی' }] },
    { id: 'p-fc-4', playerName: 'پویا شریفی', onlineId: 'Pouya_NZ', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد', members: [{ name: 'پویا شریفی' }] },
    { id: 'p-fc-5', playerName: 'امیرحسین نادری', onlineId: 'Amir_GD07', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'امیرحسین نادری' }] },
    { id: 'p-fc-6', playerName: 'مانی کریمی', onlineId: 'Mani_Pars', gamenetId: 'parsian-shz', gamenetName: 'گیم‌کلاب پارسیان', city: 'شیراز', members: [{ name: 'مانی کریمی' }] },
    { id: 'p-fc-7', playerName: 'نیما اکبری', onlineId: 'Nima_Pix', gamenetId: 'pixel-tbz', gamenetName: 'پیکسل استیشن', city: 'تبریز', members: [{ name: 'نیما اکبری' }] },
    { id: 'p-fc-8', playerName: 'شایان بهرامی', onlineId: 'Shayan_AP2', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران', members: [{ name: 'شایان بهرامی' }] },
  ];
  let fcBracket = generateSingleEliminationBracket(fcParticipants, 8);
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m1', 'A', 3, 1).bracket;
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m2', 'B', 1, 2).bracket;
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m3', 'A', 4, 2).bracket;
  fcBracket = recordBracketMatchWinner(fcBracket, 'r1-m4', 'A', 2, 0).bracket;

  // 2. Active Inter-Center Physical Billiards Tournament
  const billiardsParticipants = [
    { id: 'p-bil-1', playerName: 'رضا حیدری', onlineId: '', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'رضا حیدری' }] },
    { id: 'p-bil-2', playerName: 'فرهاد شریفی', onlineId: '', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران', members: [{ name: 'فرهاد شریفی' }] },
    { id: 'p-bil-3', playerName: 'کامران ساعدی', onlineId: '', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان', members: [{ name: 'کامران ساعدی' }] },
    { id: 'p-bil-4', playerName: 'نوید جلالی', onlineId: '', gamenetId: 'parsian-shz', gamenetName: 'گیم‌کلاب پارسیان', city: 'شیراز', members: [{ name: 'نوید جلالی' }] },
  ];
  let billiardsBracket = generateSingleEliminationBracket(billiardsParticipants, 4);
  billiardsBracket = recordBracketMatchWinner(billiardsBracket, 'r1-m1', 'A', 5, 3).bracket;

  // 3. Internal Gaming Center Competition (Foosball inside Game District)
  const internalFoosballParticipants = [
    { id: 'p-int-1', playerName: 'تیم رعد (قالیباف / محمدی)', onlineId: '', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'محمد باقر قالیباف', customerId: '05052' }, { name: 'جعفر محمدی2', customerId: '85852' }] },
    { id: 'p-int-2', playerName: 'تیم عقاب (گوهری / محمد)', onlineId: '', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'علیرضا گوهری', customerId: '37809' }, { name: 'محمد', customerId: '43876' }] },
    { id: 'p-int-3', playerName: 'زوج شهاب', onlineId: '', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'مهدی رحیمی' }, { name: 'سعید کریمی' }] },
    { id: 'p-int-4', playerName: 'زوج طوفان', onlineId: '', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'پدرام نوری' }, { name: 'احسان رضایی' }] },
  ];
  let internalFoosballBracket = generateSingleEliminationBracket(internalFoosballParticipants, 4);
  internalFoosballBracket = recordBracketMatchWinner(internalFoosballBracket, 'r1-m1', 'A', 10, 7).bracket;
  internalFoosballBracket = recordBracketMatchWinner(internalFoosballBracket, 'r1-m2', 'A', 10, 8).bracket;

  // 4. Completed Inter-Center CS2 Championship (Champion: Team Alpha representing Game District!)
  const cs2CompletedParticipants = [
    {
      id: 'p-cs-c1',
      playerName: 'تیم Alpha',
      onlineId: 'Steam:GD_AlphaSquad',
      gamenetId: 'game-district',
      gamenetName: 'Game District',
      city: 'تهران',
      members: [
        { name: 'علیرضا گوهری', customerId: '37809' },
        { name: 'آرش کاظمی' },
        { name: 'امیرحسین نادری' },
        { name: 'سهیل مرادی' },
        { name: 'کیانوش رضایی' },
      ],
    },
    { id: 'p-cs-c2', playerName: 'تیم Apex Arena', onlineId: 'Steam:AP_Apex5', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران', members: [{ name: 'کیان مرادی' }, { name: 'شایان بهرامی' }] },
    { id: 'p-cs-c3', playerName: 'تیم Isfahan Wolves', onlineId: 'Steam:CL_Wolves', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان', members: [{ name: 'سهیل رضایی' }, { name: 'ماهان فرهادی' }] },
    { id: 'p-cs-c4', playerName: 'تیم Khorasan Five', onlineId: 'Steam:NZ_K5', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد', members: [{ name: 'پویا شریفی' }, { name: 'دانیال قاسمی' }] },
  ];
  let cs2DoneBracket = generateSingleEliminationBracket(cs2CompletedParticipants, 4);
  cs2DoneBracket = recordBracketMatchWinner(cs2DoneBracket, 'r1-m1', 'A', 16, 11).bracket;
  cs2DoneBracket = recordBracketMatchWinner(cs2DoneBracket, 'r1-m2', 'A', 16, 13).bracket;
  cs2DoneBracket = recordBracketMatchWinner(cs2DoneBracket, 'r2-m1', 'A', 16, 12).bracket;
  cs2DoneBracket.completedAt = '2026-11-26T19:45:00.000Z';

  // 5. Completed Physical Billiards Championship
  const billiardsDoneParticipants = [
    { id: 'p-bd-1', playerName: 'رضا حیدری', onlineId: '', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران', members: [{ name: 'رضا حیدری' }] },
    { id: 'p-bd-2', playerName: 'سینا محمدی', onlineId: '', gamenetId: 'parsian-shz', gamenetName: 'گیم‌کلاب پارسیان', city: 'شیراز', members: [{ name: 'سینا محمدی' }] },
    { id: 'p-bd-3', playerName: 'ماهان فرهادی', onlineId: '', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان', members: [{ name: 'ماهان فرهادی' }] },
    { id: 'p-bd-4', playerName: 'دانیال قاسمی', onlineId: '', gamenetId: 'neonzone-mhd', gamenetName: 'نئون‌زون', city: 'مشهد', members: [{ name: 'دانیال قاسمی' }] },
  ];
  let billiardsDoneBracket = generateSingleEliminationBracket(billiardsDoneParticipants, 4);
  billiardsDoneBracket = recordBracketMatchWinner(billiardsDoneBracket, 'r1-m1', 'A', 6, 4).bracket;
  billiardsDoneBracket = recordBracketMatchWinner(billiardsDoneBracket, 'r1-m2', 'B', 3, 6).bracket;
  billiardsDoneBracket = recordBracketMatchWinner(billiardsDoneBracket, 'r2-m1', 'B', 5, 7).bracket;
  billiardsDoneBracket.completedAt = '2026-11-19T20:15:00.000Z';

  return [
    {
      id: 'trn-fc25-autumn',
      title: 'جام سراسری EA Sports FC 25 شبکه گیم‌نت‌ها',
      category: 'video_games',
      mode: 'online',
      gameId: 'fc25',
      gameName: 'EA Sports FC 25',
      platform: 'پلی‌استیشن ۵',
      venue: '',
      format: 'انفرادی ۱ به ۱',
      scope: 'inter_center',
      status: 'live',
      maxSlots: 8,
      entryFee: 150000,
      prizeType: 'mixed',
      prizePoolValue: 15000000,
      prizes: {
        first: '۱۰,۰۰۰,۰۰۰ تومان نقدی + ۱۰ ساعت سشن VIP رایگان',
        second: '۳,۵۰۰,۰۰۰ تومان + ۵ ساعت بازی رایگان',
        third: '۱,۵۰۰,۰۰۰ تومان اعتبار بوفه و باشگاه',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'mixed',
        summary: '۱۰,۰۰۰,۰۰۰ تومان نقدی + ۱۰ ساعت سشن VIP رایگان برای قهرمان',
        proposedByGamenetId: 'game-district',
        proposedByGamenetName: 'Game District',
        confirmedGamenetIds: ['game-district', 'arena-plus', 'cyberland-isf', 'neonzone-mhd', 'parsian-shz', 'pixel-tbz'],
      },
      startDate: 'امشب ساعت ۲۱:۰۰',
      registrationDeadline: 'تکمیل ظرفیت',
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
      id: 'trn-billiards-tehran-open',
      title: 'مسابقات حضوری بیلیارد ایت‌بال بین‌گیم‌نتی',
      category: 'billiards',
      mode: 'physical',
      gameId: 'billiards-8ball',
      gameName: 'بیلیارد ایت‌بال (8-Ball)',
      platform: '',
      venue: LOCAL_GAMENET_VENUE + ' — میزهای ۹ فوت شماره ۱ و ۲',
      format: 'انفرادی ۱ به ۱ — Race to 5',
      scope: 'inter_center',
      status: 'live',
      maxSlots: 4,
      entryFee: 200000,
      prizeType: 'vip_session',
      prizePoolValue: 9000000,
      prizes: {
        first: '۶,۰۰۰,۰۰۰ تومان + ۱۵ ساعت بازی VIP و بیلیارد رایگان',
        second: '۲,۰۰۰,۰۰۰ تومان + ۵ ساعت بیلیارد رایگان',
        third: '۱,۰۰۰,۰۰۰ تومان اعتبار بوفه باشگاه',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'vip_session',
        summary: '۶,۰۰۰,۰۰۰ تومان + ۱۵ ساعت بازی VIP و بیلیارد رایگان',
        proposedByGamenetId: 'game-district',
        proposedByGamenetName: 'Game District',
        confirmedGamenetIds: ['game-district', 'arena-plus', 'cyberland-isf', 'parsian-shz'],
      },
      startDate: 'جمعه ۷ آذر — ساعت ۱۸:۰۰',
      registrationDeadline: 'تکمیل ظرفیت',
      lobbyCode: '',
      rules: 'برگزاری کاملاً حضوری روی میزهای استاندارد ۹ فوت در سالن میزبان. هر دیدار تا کسب ۵ گیم (Race to 5) ادامه دارد.',
      hostGamenetId: 'game-district',
      hostGamenetName: 'Game District',
      hostCity: 'تهران',
      coverKey: 'billiards',
      createdAt: '2026-11-23T10:30:00.000Z',
      participants: billiardsParticipants,
      bracket: billiardsBracket,
    },
    {
      id: 'trn-internal-foosball-qual',
      title: 'انتخابی داخلی فوتبال دستی Game District (تیمی ۲ به ۲)',
      category: 'foosball',
      mode: 'physical',
      gameId: 'foosball-2v2',
      gameName: 'فوتبال دستی تیمی (۲ به ۲)',
      platform: '',
      venue: LOCAL_GAMENET_VENUE + ' — میز فوتبال دستی حرفه‌ای',
      format: 'تیمی ۲ به ۲ — انتخابی تیم نماینده سالن',
      scope: 'internal',
      status: 'live',
      maxSlots: 4,
      entryFee: 0,
      prizeType: 'playtime',
      prizePoolValue: 3000000,
      prizes: {
        first: 'انتخاب به‌عنوان تیم رسمی سالن + ۱۰ ساعت بازی رایگان',
        second: '۵ ساعت بازی رایگان در سالن',
        third: 'پذیرایی رایگان بوفه برای هر دو بازیکن',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'playtime',
        summary: 'انتخاب به‌عنوان تیم رسمی Game District + ۱۰ ساعت بازی رایگان',
        proposedByGamenetId: 'game-district',
        proposedByGamenetName: 'Game District',
        confirmedGamenetIds: ['game-district'],
      },
      startDate: 'امشب ساعت ۱۹:۳۰',
      registrationDeadline: 'ویژه اعضای باشگاه مشتریان Game District',
      lobbyCode: '',
      rules: 'رقابت داخلی مشتریان ثبت‌نام‌شده سالن؛ تیم قهرمان به‌عنوان نماینده رسمی Game District در چالش‌های بین‌گیم‌نتی معرفی می‌شود.',
      hostGamenetId: 'game-district',
      hostGamenetName: 'Game District',
      hostCity: 'تهران',
      coverKey: 'foosball',
      createdAt: '2026-11-24T08:00:00.000Z',
      participants: internalFoosballParticipants,
      bracket: internalFoosballBracket,
    },
    {
      id: 'trn-cs2-champions-nov',
      title: 'قهرمانی Counter-Strike 2 شبکه گیم‌نت‌ها (فصل آذر)',
      category: 'video_games',
      mode: 'online',
      gameId: 'cs2',
      gameName: 'Counter-Strike 2',
      platform: 'PC',
      venue: '',
      format: 'تیمی ۵ به ۵',
      scope: 'inter_center',
      status: 'completed',
      maxSlots: 4,
      entryFee: 250000,
      prizeType: 'hardware',
      prizePoolValue: 22000000,
      prizes: {
        first: '۱۵,۰۰۰,۰۰۰ تومان + ۵ ست هدست و ماوس‌پد گیمینگ + ۲۰ ساعت VIP',
        second: '۵,۰۰۰,۰۰۰ تومان جایزه نقدی',
        third: '۲,۰۰۰,۰۰۰ تومان اعتبار باشگاه',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'hardware',
        summary: '۱۵,۰۰۰,۰۰۰ تومان + ۵ ست هدست گیمینگ + ۲۰ ساعت سشن VIP رایگان',
        proposedByGamenetId: 'game-district',
        proposedByGamenetName: 'Game District',
        confirmedGamenetIds: ['game-district', 'arena-plus', 'cyberland-isf', 'neonzone-mhd'],
      },
      startDate: '۵ آذر ۱۴۰۵ (۲۶ نوامبر ۲۰۲۶)',
      completedDateLabel: '۵ آذر ۱۴۰۵ (۲۶ نوامبر ۲۰۲۶)',
      lobbyCode: 'GD-CS2-901',
      rules: 'برگزاری روی سرور اختصاصی ۱۲۸ تیک بین تیم‌های ۵ نفره منتخب گیم‌نت‌ها.',
      hostGamenetId: 'game-district',
      hostGamenetName: 'Game District',
      hostCity: 'تهران',
      coverKey: 'pc',
      createdAt: '2026-11-20T16:00:00.000Z',
      participants: cs2CompletedParticipants,
      bracket: cs2DoneBracket,
    },
    {
      id: 'trn-billiards-autumn-cup',
      title: 'کاپ پاییزه بیلیارد ایت‌بال بین‌باشگاهی',
      category: 'billiards',
      mode: 'physical',
      gameId: 'billiards-8ball',
      gameName: 'بیلیارد ایت‌بال (8-Ball)',
      platform: '',
      venue: 'گیم‌کلاب پارسیان — شیراز، معالی‌آباد، سالن بیلیارد',
      format: 'انفرادی ۱ به ۱',
      scope: 'inter_center',
      status: 'completed',
      maxSlots: 4,
      entryFee: 150000,
      prizeType: 'gift_card',
      prizePoolValue: 8000000,
      prizes: {
        first: '۵,۰۰۰,۰۰۰ تومان + چوب بیلیارد حرفه‌ای و گیفت‌کارت VIP',
        second: '۲,۰۰۰,۰۰۰ تومان + ۵ ساعت بیلیارد رایگان',
        third: '۱,۰۰۰,۰۰۰ تومان اعتبار باشگاه',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'gift_card',
        summary: '۵,۰۰۰,۰۰۰ تومان + چوب بیلیارد حرفه‌ای و گیفت‌کارت VIP',
        proposedByGamenetId: 'parsian-shz',
        proposedByGamenetName: 'گیم‌کلاب پارسیان',
        confirmedGamenetIds: ['game-district', 'parsian-shz', 'cyberland-isf', 'neonzone-mhd'],
      },
      startDate: '۲۸ آبان ۱۴۰۵ (۱۹ نوامبر ۲۰۲۶)',
      completedDateLabel: '۲۸ آبان ۱۴۰۵ (۱۹ نوامبر ۲۰۲۶)',
      lobbyCode: '',
      rules: 'برگزاری حضوری در سالن بیلیارد میزبان با داوری رسمی باشگاه‌ها.',
      hostGamenetId: 'parsian-shz',
      hostGamenetName: 'گیم‌کلاب پارسیان',
      hostCity: 'شیراز',
      coverKey: 'billiards',
      createdAt: '2026-11-16T15:00:00.000Z',
      participants: billiardsDoneParticipants,
      bracket: billiardsDoneBracket,
    },
    {
      id: 'trn-h2h-parsian-fc25',
      title: 'دیدار رو‌در‌رو: گیم‌کلاب پارسیان مقابل Game District (EA Sports FC 25)',
      category: 'video_games',
      mode: 'online',
      matchMode: 'head_to_head',
      isHeadToHead: true,
      sourceDirectChallengeId: 'dch-parsian-gd-fc25',
      gameId: 'fc25',
      gameName: 'EA Sports FC 25',
      platform: 'پلی‌استیشن ۵',
      venue: '',
      format: 'انفرادی ۱ به ۱ (دو بازی رفت و برگشت)',
      scope: 'inter_center',
      status: 'live',
      maxSlots: 2,
      entryFee: 0,
      prizeType: 'gift_card',
      prizePoolValue: 3500000,
      prizes: {
        first: 'گیفت‌کارت ۲۰ دلاری PlayStation + ۴ ساعت بازی رایگان',
        second: '',
        third: '',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'gift_card',
        summary: 'گیفت‌کارت ۲۰ دلاری PlayStation + ۴ ساعت بازی رایگان',
        proposedByGamenetId: 'parsian-shz',
        proposedByGamenetName: 'گیم‌کلاب پارسیان',
        confirmedGamenetIds: ['parsian-shz', 'game-district'],
      },
      startDate: 'چهارشنبه ۵ آذر ۱۴۰۵ — ساعت ۲۱:۰۰',
      registrationDeadline: 'تاییدشده توسط هر دو گیم‌نت',
      lobbyCode: 'H2H-FC25',
      rules: 'دوئل مستقیم قهرمانان FC25 تهران و شیراز روی سرور آنلاین PS5.',
      hostGamenetId: 'parsian-shz',
      hostGamenetName: 'گیم‌کلاب پارسیان',
      hostCity: 'شیراز',
      coverKey: 'console',
      createdAt: '2026-11-24T17:30:00.000Z',
      participants: [
        {
          id: 'h2h-p1',
          playerName: 'پویا شریفی',
          onlineId: 'PSN:Pouya_Shz',
          gamenetId: 'parsian-shz',
          gamenetName: 'گیم‌کلاب پارسیان',
          city: 'شیراز',
          members: [{ name: 'پویا شریفی', customerId: null, role: 'بازیکن اصلی' }],
          joinedAt: '2026-11-24T17:30:00.000Z',
        },
        {
          id: 'h2h-p2',
          playerName: 'محمد باقر قالیباف',
          onlineId: 'PSN:GD_MBQ',
          gamenetId: 'game-district',
          gamenetName: 'Game District',
          city: 'تهران',
          members: [{ name: 'محمد باقر قالیباف', customerId: '1', role: 'نماینده Game District' }],
          joinedAt: '2026-11-24T17:30:00.000Z',
        },
      ],
      bracket: {
        generatedAt: '2026-11-24T17:30:00.000Z',
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
                  id: 'h2h-p1',
                  playerName: 'پویا شریفی',
                  onlineId: 'PSN:Pouya_Shz',
                  gamenetId: 'parsian-shz',
                  gamenetName: 'گیم‌کلاب پارسیان',
                  members: [{ name: 'پویا شریفی', customerId: null, role: 'بازیکن اصلی' }],
                },
                playerB: {
                  id: 'h2h-p2',
                  playerName: 'محمد باقر قالیباف',
                  onlineId: 'PSN:GD_MBQ',
                  gamenetId: 'game-district',
                  gamenetName: 'Game District',
                  members: [{ name: 'محمد باقر قالیباف', customerId: '1', role: 'نماینده Game District' }],
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
    },
    {
      id: 'trn-foosball-oct-league',
      title: 'جام مهرماه فوتبال دستی ۲ به ۲ باشگاه‌های پایتخت',
      category: 'foosball',
      mode: 'physical',
      gameId: 'foosball-2v2',
      gameName: 'فوتبال دستی تیمی (۲ به ۲)',
      platform: '',
      venue: 'باشگاه Nexus Club — تهران، جردن، سالن بیلیارد و VIP',
      format: 'تیمی ۲ به ۲',
      scope: 'inter_center',
      status: 'completed',
      maxSlots: 4,
      entryFee: 100000,
      prizeType: 'vip_session',
      prizePoolValue: 6000000,
      prizes: {
        first: '۱۲ ساعت بازی VIP رایگان + کاپ افتخار باشگاه‌ها',
        second: '۶ ساعت بازی رایگان',
        third: 'اعتبار بوفه باشگاه',
      },
      prizeAgreement: {
        status: 'agreed',
        prizeType: 'vip_session',
        summary: '۱۲ ساعت بازی VIP رایگان + کاپ افتخار باشگاه‌ها',
        proposedByGamenetId: 'nexus-club',
        proposedByGamenetName: 'Nexus Club',
        confirmedGamenetIds: ['nexus-club', 'arena-plus', 'game-district', 'cyberland-isf'],
      },
      startDate: '۲۲ مهر ۱۴۰۵ (۱۴ اکتبر ۲۰۲۶)',
      completedDateLabel: '۲۲ مهر ۱۴۰۵ (۱۴ اکتبر ۲۰۲۶)',
      lobbyCode: '',
      rules: 'رقابت حضوری بین‌باشگاهی مهرماه برای رنکینگ کل تاریخچه فوتبال دستی.',
      hostGamenetId: 'nexus-club',
      hostGamenetName: 'Nexus Club',
      hostCity: 'تهران',
      coverKey: 'foosball',
      createdAt: '2026-10-12T10:00:00.000Z',
      participants: [
        { id: 'fo1', playerName: 'زوج نکسوس', gamenetId: 'nexus-club', gamenetName: 'Nexus Club', city: 'تهران' },
        { id: 'fo2', playerName: 'زوج طوفان آرنا', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس', city: 'تهران' },
        { id: 'fo3', playerName: 'تیم رعد Game District', gamenetId: 'game-district', gamenetName: 'Game District', city: 'تهران' },
        { id: 'fo4', playerName: 'زوج سایبر', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند', city: 'اصفهان' },
      ],
      bracket: {
        generatedAt: '2026-10-14T15:00:00.000Z',
        size: 4,
        champion: { id: 'fo1', playerName: 'زوج نکسوس', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
        runnerUp: { id: 'fo2', playerName: 'زوج طوفان آرنا', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
        finalScore: { scoreA: 3, scoreB: 1, winnerName: 'زوج نکسوس', runnerUpName: 'زوج طوفان آرنا' },
        completedAt: '2026-10-14T21:00:00.000Z',
        rounds: [
          {
            index: 0,
            name: 'نیمه‌نهایی',
            matches: [
              {
                id: 'r0-m0',
                roundIndex: 0,
                matchIndex: 0,
                playerA: { id: 'fo1', playerName: 'زوج نکسوس', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
                playerB: { id: 'fo4', playerName: 'زوج سایبر', gamenetId: 'cyberland-isf', gamenetName: 'سایبرلند' },
                scoreA: 3,
                scoreB: 0,
                winnerId: 'fo1',
                status: 'done',
                verified: true,
              },
              {
                id: 'r0-m1',
                roundIndex: 0,
                matchIndex: 1,
                playerA: { id: 'fo2', playerName: 'زوج طوفان آرنا', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
                playerB: { id: 'fo3', playerName: 'تیم رعد Game District', gamenetId: 'game-district', gamenetName: 'Game District' },
                scoreA: 3,
                scoreB: 2,
                winnerId: 'fo2',
                status: 'done',
                verified: true,
              },
            ],
          },
          {
            index: 1,
            name: 'فینال',
            matches: [
              {
                id: 'r1-m0',
                roundIndex: 1,
                matchIndex: 0,
                playerA: { id: 'fo1', playerName: 'زوج نکسوس', gamenetId: 'nexus-club', gamenetName: 'Nexus Club' },
                playerB: { id: 'fo2', playerName: 'زوج طوفان آرنا', gamenetId: 'arena-plus', gamenetName: 'آرنا پلاس' },
                scoreA: 3,
                scoreB: 1,
                winnerId: 'fo1',
                status: 'done',
                verified: true,
              },
            ],
          },
        ],
      },
    },
  ];
}
