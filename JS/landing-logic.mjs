/**
 * Pure domain logic for the standalone Game District Cinematic SaaS Landing Page (/landing).
 * Zero DOM dependencies — 100% unit-testable via node:test.
 */

export const HERO_PREVIEW_TABS = Object.freeze([
  {
    id: 'overview',
    label: 'پیشخوان مدیریت',
    route: 'app.gamedistrict.ir / dashboard',
    caption: 'نمای یکپارچه وضعیت سالن، میزهای فعال و شاخص‌های روزانه',
    darkSrc: 'assets/images/landing/preview-overview-dark.png',
    lightSrc: 'assets/images/landing/preview-overview-light.png',
    alt: 'پیش‌نمایش پیشخوان اصلی پنل مدیریت گیم‌نت Game District',
  },
  {
    id: 'tables',
    label: 'میزها و تایمر زنده',
    route: 'app.gamedistrict.ir / tables',
    caption: 'کنترل لحظه‌ای زمان‌سنج ایستگاه‌ها، وضعیت پرداخت و سفارش بوفه',
    darkSrc: 'assets/images/landing/preview-tables-dark.png',
    lightSrc: 'assets/images/landing/preview-tables-light.png',
    alt: 'پیش‌نمایش مدیریت میزها و تایمر زنده Game District',
  },
  {
    id: 'studio3d',
    label: 'طراحی سه‌بعدی سالن',
    route: 'app.gamedistrict.ir / gamenet-3d',
    caption: 'چیدمان تعاملی نقشه سه‌بعدی سالن همراه با تایمر زنده بالای هر ایستگاه',
    darkSrc: 'assets/images/landing/preview-3d-dark.png',
    lightSrc: 'assets/images/landing/preview-3d-light.png',
    alt: 'پیش‌نمایش طراح سه‌بعدی سالن گیم‌نت من در Game District',
  },
  {
    id: 'tournaments',
    label: 'شبکه تورنومنت',
    route: 'app.gamedistrict.ir / tournaments',
    caption: 'برگزاری مسابقات داخلی، ارسال چالش مستقیم و جدول رتبه‌بندی گیم‌نت‌ها',
    darkSrc: 'assets/images/landing/preview-tournaments-dark.png',
    lightSrc: 'assets/images/landing/preview-tournaments-light.png',
    alt: 'پیش‌نمایش بخش تورنومنت و رتبه‌بندی گیم‌نت‌ها در Game District',
  },
]);

export const FEATURE_STORY_CHAPTERS = Object.freeze([
  {
    id: 'stations',
    index: '۰۱',
    title: 'مدیریت ایستگاه‌های بازی',
    shortLabel: 'ایستگاه‌ها و تایمر',
    route: 'app.gamedistrict.ir / tables',
    summary:
      'تمامی ایستگاه‌های سالن با تایمر زنده، محاسبه خودکار هزینه بر اساس مدت بازی و تفکیک وضعیت آزاد یا اشغال در یک صفحه مدیریت می‌شوند.',
    highlights: [
      'شروع، توقف، جابه‌جایی میز و تسویه سریع بدون خطای انسانی',
      'هشدار پایان زمان و نمایش دقیق زمان سپری‌شده هر سشن',
      'همگام‌سازی لحظه‌ای ایستگاه‌ها با نقشه سه‌بعدی سالن',
    ],
    calloutTitle: 'کنترل لحظه‌ای سشن‌ها',
    calloutMeta: 'تایمر دقیق · محاسبه خودکار تعرفه · تفکیک وضعیت میزها',
    darkSrc: 'assets/images/landing/preview-tables-dark.png',
    lightSrc: 'assets/images/landing/preview-tables-light.png',
    alt: 'صفحه مدیریت ایستگاه‌های بازی و تایمر زنده در Game District',
  },
  {
    id: 'consoles',
    index: '۰۲',
    title: 'مدیریت PS4 و PS5',
    shortLabel: 'PS4 و PS5',
    route: 'app.gamedistrict.ir / consoles',
    summary:
      'تعریف تعرفه مستقل برای هر نسل کنسول و تعداد دسته‌های فعال تا هزینه بازی‌های تک‌نفره، دونفره و چهارنفره دقیقاً مطابق نرخ مجموعه محاسبه شود.',
    highlights: [
      'تعرفه‌گذاری جداگانه برای PlayStation 4، PlayStation 5 و دسته‌های اضافه',
      'تغییر تعداد دسته در میانه بازی بدون نیاز به بستن فاکتور',
      'مدیریت کامل لیست کنسول‌ها و وضعیت آماده‌به‌کار هر دستگاه',
    ],
    calloutTitle: 'تعرفه‌گذاری هوشمند کنسول‌ها',
    calloutMeta: 'PS4 · PS5 · محاسبه دقیق بر اساس تعداد دسته',
    darkSrc: 'assets/images/landing/preview-console-dark.png',
    lightSrc: 'assets/images/landing/preview-console-light.png',
    alt: 'بخش مدیریت کنسول‌های PS4 و PS5 و تعرفه‌ها در Game District',
  },
  {
    id: 'pc',
    index: '۰۳',
    title: 'مدیریت سیستم‌های PC',
    shortLabel: 'سیستم‌های PC',
    route: 'app.gamedistrict.ir / dashboard',
    summary:
      'ایستگاه‌های کامپیوتر و اتاق‌های VIP را با نرخ ساعتی اختصاصی، پیشخوان نظارتی یکپارچه و اتصال مستقیم به حساب اعتباری مشتریان ثابت کنترل کنید.',
    highlights: [
      'پایش هم‌زمان تمامی سیستم‌های فعال از پیست زنده پیشخوان',
      'پشتیبانی از نرخ‌های عادی، نیم‌بها یا اتاق‌های اختصاصی VIP',
      'کسر خودکار هزینه بازی از شارژ حساب مشتریان عضو باشگاه',
    ],
    calloutTitle: 'نظارت یکپارچه بر ایستگاه‌های PC',
    calloutMeta: 'نمای زنده پیشخوان · نرخ اختصاصی · اتصال به کیف پول مشتری',
    darkSrc: 'assets/images/landing/preview-overview-dark.png',
    lightSrc: 'assets/images/landing/preview-overview-light.png',
    alt: 'نمای پیشخوان و مدیریت سیستم‌های PC در Game District',
  },
  {
    id: 'physical',
    index: '۰۴',
    title: 'بیلیارد و فوتبال‌دستی',
    shortLabel: 'بیلیارد و فوتبال‌دستی',
    route: 'app.gamedistrict.ir / gamenet-3d',
    summary:
      'مجموعه‌های تفریحی تنها به کنسول محدود نیستند؛ میزهای بیلیارد، اسنوکر و فوتبال‌دستی را هم در تایمر سالن و هم در طراح سه‌بعدی مدیریت کنید.',
    highlights: [
      'چیدمان واقعی میزهای بیلیارد و فوتبال‌دستی در نقشه سه‌بعدی سالن',
      'ثبت زمان‌بندی دقیق سشن و تفکیک درآمد بخش‌های فیزیکی',
      'پشتیبانی کامل از برگزاری مسابقات بیلیارد و فوتبال‌دستی در شبکه تورنومنت',
    ],
    calloutTitle: 'چیدمان سه‌بعدی و میزهای تفریحی',
    calloutMeta: 'بیلیارد · فوتبال‌دستی · همگام با مدیریت میزها',
    darkSrc: 'assets/images/landing/preview-3d-dark.png',
    lightSrc: 'assets/images/landing/preview-3d-light.png',
    alt: 'بخش طراحی سه‌بعدی سالن شامل میزهای بیلیارد و فوتبال‌دستی در Game District',
  },
  {
    id: 'buffet',
    index: '۰۵',
    title: 'مدیریت بوفه و سفارشات',
    shortLabel: 'بوفه و سفارشات',
    route: 'app.gamedistrict.ir / buffet',
    summary:
      'فروش نوشیدنی و خوراکی‌های بوفه را با ثبت سریع روی فاکتور همان میز یا به‌صورت فروش مستقیم مدیریت کنید تا هیچ سفارشی از قلم نیفتد.',
    highlights: [
      'تعریف منوی کامل بوفه با قیمت به‌روز و مدیریت موجودی کالاها',
      'افزودن فوری سفارشات به فاکتور میز فعال در یک کلیک',
      'تفکیک شفاف درآمد بوفه از درآمد بازی‌ها در گزارش پایان روز',
    ],
    calloutTitle: 'بوفه متصل به فاکتور میزها',
    calloutMeta: 'ثبت سریع سفارش · مدیریت اقلام · تسویه یکپارچه',
    darkSrc: 'assets/images/landing/preview-buffet-dark.png',
    lightSrc: 'assets/images/landing/preview-buffet-light.png',
    alt: 'صفحه مدیریت بوفه و ثبت سفارشات در Game District',
  },
  {
    id: 'finance',
    index: '۰۶',
    title: 'مشتریان و گزارش‌های مالی',
    shortLabel: 'مشتریان و مالی',
    route: 'app.gamedistrict.ir / income',
    summary:
      'باشگاه مشتریان، شارژ اعتباری، لیست بدهکاران و گزارش درآمد روزانه و ماهانه به تفکیک روش پرداخت با دقت کامل در اختیار مدیر مجموعه است.',
    highlights: [
      'تفکیک پرداخت‌های نقدی، کارت‌خوان، اعتباری و مانده بدهکاران',
      'باشگاه مشتریان با تخفیف خودکار پس از ساعات بازی ثبت‌شده',
      'حسابرسی سریع پایان شیفت بدون نیاز به دفترچه یا فایل‌های پراکنده',
    ],
    calloutTitle: 'شفافیت کامل مالی و باشگاه مشتریان',
    calloutMeta: 'گزارش درآمد · بدهکاران · شارژ اعتباری مشتریان',
    darkSrc: 'assets/images/landing/preview-finance-dark.png',
    lightSrc: 'assets/images/landing/preview-finance-light.png',
    alt: 'صفحه گزارش‌های مالی و مدیریت مشتریان در Game District',
  },
]);

export const TOURNAMENT_DISCIPLINES = Object.freeze([
  {
    id: 'video',
    label: 'بازی‌های ویدیویی',
    subtitle: 'EA Sports FC · Counter-Strike 2 · Tekken · Valorant',
    formatLabel: 'تورنومنت بین گیم‌نت‌ها · تیمی ۵ نفره',
    matchMode: 'آنلاین / حضوری با داوری مدیران',
    prizeSummary: 'جایزه توافقی: شارژ VIP و ساعت بازی رایگان',
    clubA: {
      name: 'Game District',
      city: 'تهران',
      monogram: 'GD',
      roster: 'تیم منتخب پنج‌نفره · رتبه ۱ جدول',
      record: '۲۴ برد · ۵ باخت',
    },
    clubB: {
      name: 'Nexus Arena',
      city: 'اصفهان',
      monogram: 'NA',
      roster: 'تیم اول مجموعه · رتبه ۲ جدول',
      record: '۲۱ برد · ۷ باخت',
    },
    bracket: {
      semi1: { a: 'Game District', b: 'Vortex Club', scoreA: '۲', scoreB: '۰', winner: 'a' },
      semi2: { a: 'Nexus Arena', b: 'Pixel Hub', scoreA: '۲', scoreB: '۱', winner: 'a' },
      final: { a: 'Game District', b: 'Nexus Arena', status: 'چالش نهایی · آماده برگزاری' },
    },
    leaderboard: [
      { rank: 1, club: 'Game District', points: '۱,۴۸۰', wins: '۲۴', losses: '۵', winRate: '۸۳٪', trend: 'up' },
      { rank: 2, club: 'Nexus Arena', points: '۱,۳۱۰', wins: '۲۱', losses: '۷', winRate: '۷۵٪', trend: 'up' },
      { rank: 3, club: 'Vortex Club', points: '۱,۱۹۰', wins: '۱۸', losses: '۸', winRate: '۶۹٪', trend: 'same' },
      { rank: 4, club: 'Pixel Hub', points: '۹۸۰', wins: '۱۵', losses: '۱۰', winRate: '۶۰٪', trend: 'down' },
    ],
  },
  {
    id: 'billiards',
    label: 'بیلیارد',
    subtitle: 'ایت‌بال · ناین‌بال · اسنوکر تیمی و انفرادی',
    formatLabel: 'چالش مستقیم حضوری · میز استاندارد',
    matchMode: 'میزبانی توافقی میان دو باشگاه',
    prizeSummary: 'جایزه توافقی: کاپ رقابت و اشتراک ویژه سالن',
    clubA: {
      name: 'Game District',
      city: 'تهران',
      monogram: 'GD',
      roster: 'نماینده برتر ایت‌بال · رتبه ۱ بیلیارد',
      record: '۱۶ برد · ۳ باخت',
    },
    clubB: {
      name: 'Crown Billiards',
      city: 'شیراز',
      monogram: 'CB',
      roster: 'قهرمان داخلی باشگاه · رتبه ۲ بیلیارد',
      record: '۱۴ برد · ۵ باخت',
    },
    bracket: {
      semi1: { a: 'Game District', b: 'Royal Cue', scoreA: '۵', scoreB: '۲', winner: 'a' },
      semi2: { a: 'Crown Billiards', b: 'Metro Lounge', scoreA: '۵', scoreB: '۴', winner: 'a' },
      final: { a: 'Game District', b: 'Crown Billiards', status: 'میزبانی تأییدشده · توافق جایزه' },
    },
    leaderboard: [
      { rank: 1, club: 'Game District', points: '۹۴۰', wins: '۱۶', losses: '۳', winRate: '۸۴٪', trend: 'up' },
      { rank: 2, club: 'Crown Billiards', points: '۸۶۰', wins: '۱۴', losses: '۵', winRate: '۷۴٪', trend: 'same' },
      { rank: 3, club: 'Royal Cue', points: '۷۷۰', wins: '۱۲', losses: '۶', winRate: '۶۷٪', trend: 'up' },
      { rank: 4, club: 'Metro Lounge', points: '۶۴۰', wins: '۱۰', losses: '۸', winRate: '۵۶٪', trend: 'down' },
    ],
  },
  {
    id: 'foosball',
    label: 'فوتبال‌دستی',
    subtitle: 'رقابت دونفره حرفه‌ای · مسابقات انفرادی و حذفی',
    formatLabel: 'لیگ چالش مستقیم · تیم دونفره',
    matchMode: 'حضوری در باشگاه میزبان',
    prizeSummary: 'جایزه توافقی: کارت هدیه و بسته تجهیزات',
    clubA: {
      name: 'Game District',
      city: 'تهران',
      monogram: 'GD',
      roster: 'زوج قهرمان داخلی · رتبه ۱ فوتبال‌دستی',
      record: '۱۳ برد · ۲ باخت',
    },
    clubB: {
      name: 'Pulse Club',
      city: 'مشهد',
      monogram: 'PC',
      roster: 'تیم منتخب باشگاه · رتبه ۲ فوتبال‌دستی',
      record: '۱۱ برد · ۴ باخت',
    },
    bracket: {
      semi1: { a: 'Game District', b: 'Orbit Play', scoreA: '۳', scoreB: '۱', winner: 'a' },
      semi2: { a: 'Pulse Club', b: 'Arena Plus', scoreA: '۳', scoreB: '۲', winner: 'a' },
      final: { a: 'Game District', b: 'Pulse Club', status: 'فینال چالش مستقیم · ثبت نتیجه' },
    },
    leaderboard: [
      { rank: 1, club: 'Game District', points: '۷۸۰', wins: '۱۳', losses: '۲', winRate: '۸۷٪', trend: 'up' },
      { rank: 2, club: 'Pulse Club', points: '۶۹۰', wins: '۱۱', losses: '۴', winRate: '۷۳٪', trend: 'up' },
      { rank: 3, club: 'Orbit Play', points: '۵۹۰', wins: '۹', losses: '۶', winRate: '۶۰٪', trend: 'same' },
      { rank: 4, club: 'Arena Plus', points: '۵۱۰', wins: '۸', losses: '۷', winRate: '۵۳٪', trend: 'down' },
    ],
  },
]);

export const SUBSCRIPTION_TIERS = Object.freeze([
  {
    id: 'standard',
    persianName: 'عادی',
    subtitle: 'شروع منظم عملیات سالن',
    featured: false,
    pricePlaceholder: 'تعرفه: قابل تنظیم (پس از مشاوره)',
    termPlaceholder: 'دوره اشتراک: قابل تنظیم',
    summary: 'پایه‌ای دقیق برای مدیریت میزها، زمان‌سنج کنسول‌ها و حسابرسی روزانه بدون پیچیدگی.',
    ctaLabel: 'درخواست مشاوره پلن عادی',
    highlights: [
      { label: 'مدیریت ایستگاه‌های PS4، PS5 و PC با تایمر زنده', included: true },
      { label: 'ثبت فروش بوفه و اتصال مستقیم به فاکتور میز', included: true },
      { label: 'ثبت مشتریان، لیست بدهکاران و گزارش درآمد روزانه', included: true },
      { label: 'طراح سه‌بعدی سالن و شبکه تورنومنت بین گیم‌نت‌ها', included: false },
    ],
  },
  {
    id: 'silver',
    persianName: 'نقره‌ای',
    subtitle: 'رشد و وفادارسازی مشتریان',
    featured: false,
    pricePlaceholder: 'تعرفه: قابل تنظیم (پس از مشاوره)',
    termPlaceholder: 'دوره اشتراک: قابل تنظیم',
    summary: 'مناسب برای مجموعه‌های فعال که علاوه بر کنترل سالن، روی بازگشت مشتریان تمرکز دارند.',
    ctaLabel: 'درخواست مشاوره پلن نقره‌ای',
    highlights: [
      { label: 'تمامی امکانات پلن عادی با مدیریت کامل بوفه و مالی', included: true },
      { label: 'باشگاه مشتریان، شارژ اعتباری و تخفیف خودکار ساعات بازی', included: true },
      { label: 'برگزاری تورنومنت‌های داخلی برای مشتریان مجموعه', included: true },
      { label: 'چالش مستقیم بین گیم‌نت‌ها و جدول رتبه‌بندی شبکه', included: false },
    ],
  },
  {
    id: 'gold',
    persianName: 'طلایی',
    subtitle: 'مدیریت حرفه‌ای و چیدمان سه‌بعدی',
    featured: false,
    pricePlaceholder: 'تعرفه: قابل تنظیم (پس از مشاوره)',
    termPlaceholder: 'دوره اشتراک: قابل تنظیم',
    summary: 'برای گیم‌نت‌های پیشرفته که کنترل بصری سه‌بعدی، بیلیارد و گزارش‌گیری دقیق می‌خواهند.',
    ctaLabel: 'درخواست مشاوره پلن طلایی',
    highlights: [
      { label: 'تمامی امکانات پلن نقره‌ای و باشگاه مشتریان کامل', included: true },
      { label: 'طراح سه‌بعدی سالن با همگام‌سازی خودکار میزها و بیلیارد', included: true },
      { label: 'انتشار فراخوان رقابت و حضور در تورنومنت‌های شبکه', included: true },
      { label: 'پیکربندی اختصاصی شعب و پشتیبانی سفارشی اولویت‌دار', included: false },
    ],
  },
  {
    id: 'ultimate',
    persianName: 'ویژه',
    subtitle: 'نسخه کامل و پرچم‌دار پلتفرم',
    featured: true,
    pricePlaceholder: 'تعرفه: پیکربندی اختصاصی',
    termPlaceholder: 'دوره اشتراک: قابل تنظیم',
    summary: 'کامل‌ترین تجربه Game District شامل شبکه کامل تورنومنت، چالش مستقیم، رتبه‌بندی و امکانات اختصاصی.',
    ctaLabel: 'شروع مشاوره پلن ویژه',
    highlights: [
      { label: 'دسترسی کامل به تمامی ابزارهای مدیریت سالن، بوفه و مالی', included: true },
      { label: 'طراح سه‌بعدی پیشرفته با شخصی‌سازی کامل دکور و تجهیزات', included: true },
      { label: 'شبکه کامل تورنومنت، چالش مستقیم، توافق جایزه و رتبه‌بندی', included: true },
      { label: 'پیکربندی اختصاصی متناسب با ساختار مجموعه و پشتیبانی ویژه', included: true },
    ],
  },
]);

export const COMPARISON_ROWS = Object.freeze([
  {
    id: 'stations-timers',
    category: 'operations',
    label: 'مدیریت ایستگاه‌های بازی و تایمر زنده',
    note: 'PS4، PS5، سیستم‌های PC، بیلیارد و فوتبال‌دستی',
    tiers: { standard: 'included', silver: 'included', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'console-tariffs',
    category: 'operations',
    label: 'تعرفه‌گذاری مستقل بر اساس نسل کنسول و تعداد دسته',
    note: 'محاسبه خودکار تغییر دسته در میانه سشن',
    tiers: { standard: 'included', silver: 'included', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'buffet-sync',
    category: 'finance',
    label: 'مدیریت بوفه، موجودی و اتصال سفارش به فاکتور میز',
    note: 'تفکیک فروش بوفه از هزینه بازی در تسویه',
    tiers: { standard: 'included', silver: 'included', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'loyalty-wallet',
    category: 'finance',
    label: 'باشگاه مشتریان، شارژ اعتباری و تخفیف خودکار',
    note: 'حفظ مشتریان ثابت و پیگیری سابقه بازی',
    tiers: { standard: 'excluded', silver: 'included', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'financial-analytics',
    category: 'finance',
    label: 'گزارش‌های مالی، تفکیک روش پرداخت و مدیریت بدهکاران',
    note: 'نقدی، کارت‌خوان، اعتباری و حسابرسی روزانه',
    tiers: { standard: 'included', silver: 'included', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'studio-3d',
    category: 'network',
    label: 'طراح سه‌بعدی سالن و همگام‌سازی خودکار میزها',
    note: 'چیدمان بصری کنسول‌ها، PC، بیلیارد و دکوراسیون',
    tiers: { standard: 'excluded', silver: 'excluded', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'internal-tournaments',
    category: 'network',
    label: 'برگزاری تورنومنت‌های داخلی و انتخاب تیم منتخب',
    note: 'بازی‌های ویدیویی، بیلیارد و فوتبال‌دستی',
    tiers: { standard: 'excluded', silver: 'included', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'direct-challenges',
    category: 'network',
    label: 'شبکه رقابت بین گیم‌نت‌ها، چالش مستقیم و رتبه‌بندی',
    note: 'فراخوان عمومی، توافق جایزه و جدول امتیازات',
    tiers: { standard: 'excluded', silver: 'excluded', gold: 'included', ultimate: 'included' },
  },
  {
    id: 'custom-deployment',
    category: 'network',
    label: 'پیکربندی اختصاصی مجموعه و پشتیبانی اولویت‌دار',
    note: 'متناسب با نیازهای مجموعه‌های بزرگ (قابل توافق)',
    tiers: { standard: 'excluded', silver: 'excluded', gold: 'excluded', ultimate: 'included' },
  },
]);

/**
 * Normalizes persisted theme string to strictly 'dark' or 'light'.
 */
export function resolveLandingTheme(rawTheme) {
  return rawTheme === 'light' ? 'light' : 'dark';
}

/**
 * Resolves the appropriate product preview image path for a given hero tab and theme.
 */
export function getPreviewSrc(tabId, theme = 'dark') {
  const normalizedTheme = resolveLandingTheme(theme);
  const tab = HERO_PREVIEW_TABS.find((t) => t.id === tabId) || HERO_PREVIEW_TABS[0];
  return normalizedTheme === 'light' ? tab.lightSrc : tab.darkSrc;
}

/**
 * Resolves an interactive feature chapter object by id.
 */
export function getFeatureChapter(chapterId) {
  return FEATURE_STORY_CHAPTERS.find((c) => c.id === chapterId) || FEATURE_STORY_CHAPTERS[0];
}

/**
 * Resolves a tournament discipline dataset by id.
 */
export function getTournamentDiscipline(disciplineId) {
  return TOURNAMENT_DISCIPLINES.find((d) => d.id === disciplineId) || TOURNAMENT_DISCIPLINES[0];
}

/**
 * Filters comparison rows by category ('all' | 'operations' | 'finance' | 'network').
 */
export function getComparisonRows(category = 'all') {
  if (!category || category === 'all') return COMPARISON_ROWS;
  return COMPARISON_ROWS.filter((row) => row.category === category);
}

/**
 * Computes restrained pointer-responsive perspective tilt and specular coordinates
 * for the hero dashboard showcase stage.
 */
export function computeStageTilt(normX, normY, maxDeg = 3.2) {
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const nx = clamp(Number(normX) || 0, -1, 1);
  const ny = clamp(Number(normY) || 0, -1, 1);
  return {
    rotateX: Number((-ny * maxDeg).toFixed(2)),
    rotateY: Number((nx * maxDeg).toFixed(2)),
    spotX: Number(((nx + 1) * 50).toFixed(1)),
    spotY: Number(((ny + 1) * 50).toFixed(1)),
  };
}

/**
 * Converts Persian/Arabic numerals to ASCII digits for clean validation.
 */
export function toLatinDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Toggles single-open FAQ accordion item id.
 */
export function toggleFaqState(currentOpenId, clickedId) {
  if (!clickedId) return null;
  return currentOpenId === clickedId ? null : clickedId;
}

/**
 * Validates demo / subscription consultation form submissions.
 */
export function validateDemoInquiry(input = {}) {
  const fullName = String(input.fullName ?? '').trim();
  const centerName = String(input.centerName ?? '').trim();
  const rawPhone = toLatinDigits(String(input.phone ?? '')).replace(/[\s\-()]/g, '');
  const tierId = String(input.tierId ?? 'ultimate').trim().toLowerCase();
  const notes = String(input.notes ?? '').trim().slice(0, 400);

  const errors = {};

  if (fullName.length < 2) {
    errors.fullName = 'لطفاً نام و نام خانوادگی مدیر مجموعه را وارد کنید.';
  }

  if (centerName.length < 2) {
    errors.centerName = 'لطفاً نام گیم‌نت یا باشگاه خود را وارد کنید.';
  }

  if (!/^(?:\+?98|0)?9\d{9}$/.test(rawPhone) && !/^\+?\d{8,15}$/.test(rawPhone)) {
    errors.phone = 'لطفاً یک شماره تماس معتبر وارد کنید (مثلاً ۰۹۱۲۳۴۵۶۷۸۹).';
  }

  const validTier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId) || SUBSCRIPTION_TIERS[3];

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors, normalized: null };
  }

  return {
    ok: true,
    errors: {},
    normalized: {
      fullName,
      centerName,
      phone: rawPhone,
      tierId: validTier.id,
      tierLabel: `پلن ${validTier.persianName}`,
      notes,
    },
  };
}
