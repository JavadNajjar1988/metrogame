/**
 * Pure domain logic for the standalone مترو گیم Cinematic SaaS Landing Page (/landing).
 * Zero DOM dependencies — 100% unit-testable via node:test.
 */

export const HERO_PREVIEW_TABS = Object.freeze([
  {
    id: 'overview',
    label: 'پیشخوان مدیریت',
    route: 'app.metrogame.ir / dashboard',
    caption: 'نمای یکپارچه وضعیت سالن، میزهای فعال و شاخص‌های روزانه',
    darkSrc: 'assets/images/landing/preview-overview-dark.png',
    lightSrc: 'assets/images/landing/preview-overview-light.png',
    alt: 'پیش‌نمایش پیشخوان اصلی پنل مدیریت گیم‌نت مترو گیم',
  },
  {
    id: 'tables',
    label: 'میزها و تایمر زنده',
    route: 'app.metrogame.ir / tables',
    caption: 'کنترل لحظه‌ای زمان‌سنج ایستگاه‌ها، وضعیت پرداخت و سفارش بوفه',
    darkSrc: 'assets/images/landing/preview-tables-dark.png',
    lightSrc: 'assets/images/landing/preview-tables-light.png',
    alt: 'پیش‌نمایش مدیریت میزها و تایمر زنده مترو گیم',
  },
  {
    id: 'studio3d',
    label: 'طراحی سه‌بعدی سالن',
    route: 'app.metrogame.ir / gamenet-3d',
    caption: 'چیدمان تعاملی نقشه سه‌بعدی سالن همراه با تایمر زنده بالای هر ایستگاه',
    darkSrc: 'assets/images/landing/preview-3d-dark.png',
    lightSrc: 'assets/images/landing/preview-3d-light.png',
    alt: 'پیش‌نمایش طراح سه‌بعدی سالن گیم‌نت من در مترو گیم',
  },
  {
    id: 'tournaments',
    label: 'شبکه تورنومنت',
    route: 'app.metrogame.ir / tournaments',
    caption: 'برگزاری مسابقات داخلی، ارسال چالش مستقیم و جدول رتبه‌بندی گیم‌نت‌ها',
    darkSrc: 'assets/images/landing/preview-tournaments-dark.png',
    lightSrc: 'assets/images/landing/preview-tournaments-light.png',
    alt: 'پیش‌نمایش بخش تورنومنت و رتبه‌بندی گیم‌نت‌ها در مترو گیم',
  },
]);

export const FEATURE_STORY_CHAPTERS = Object.freeze([
  {
    id: 'stations',
    index: '۰۱',
    title: 'مدیریت ایستگاه‌های بازی',
    shortLabel: 'ایستگاه‌ها و تایمر',
    route: 'app.metrogame.ir / tables',
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
    alt: 'صفحه مدیریت ایستگاه‌های بازی و تایمر زنده در مترو گیم',
  },
  {
    id: 'consoles',
    index: '۰۲',
    title: 'مدیریت PS4 و PS5',
    shortLabel: 'PS4 و PS5',
    route: 'app.metrogame.ir / consoles',
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
    alt: 'بخش مدیریت کنسول‌های PS4 و PS5 و تعرفه‌ها در مترو گیم',
  },
  {
    id: 'pc',
    index: '۰۳',
    title: 'مدیریت سیستم‌های PC',
    shortLabel: 'سیستم‌های PC',
    route: 'app.metrogame.ir / dashboard',
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
    alt: 'نمای پیشخوان و مدیریت سیستم‌های PC در مترو گیم',
  },
  {
    id: 'physical',
    index: '۰۴',
    title: 'بیلیارد و فوتبال‌دستی',
    shortLabel: 'بیلیارد و فوتبال‌دستی',
    route: 'app.metrogame.ir / gamenet-3d',
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
    alt: 'بخش طراحی سه‌بعدی سالن شامل میزهای بیلیارد و فوتبال‌دستی در مترو گیم',
  },
  {
    id: 'buffet',
    index: '۰۵',
    title: 'مدیریت بوفه و سفارشات',
    shortLabel: 'بوفه و سفارشات',
    route: 'app.metrogame.ir / buffet',
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
    alt: 'صفحه مدیریت بوفه و ثبت سفارشات در مترو گیم',
  },
  {
    id: 'finance',
    index: '۰۶',
    title: 'مشتریان و گزارش‌های مالی',
    shortLabel: 'مشتریان و مالی',
    route: 'app.metrogame.ir / income',
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
    alt: 'صفحه گزارش‌های مالی و مدیریت مشتریان در مترو گیم',
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
      name: 'مترو گیم',
      city: 'تهران',
      monogram: 'MG',
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
      semi1: { a: 'مترو گیم', b: 'Vortex Club', scoreA: '۲', scoreB: '۰', winner: 'a' },
      semi2: { a: 'Nexus Arena', b: 'Pixel Hub', scoreA: '۲', scoreB: '۱', winner: 'a' },
      final: { a: 'مترو گیم', b: 'Nexus Arena', status: 'چالش نهایی · آماده برگزاری' },
    },
    leaderboard: [
      { rank: 1, club: 'مترو گیم', points: '۱,۴۸۰', wins: '۲۴', losses: '۵', winRate: '۸۳٪', trend: 'up' },
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
      name: 'مترو گیم',
      city: 'تهران',
      monogram: 'MG',
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
      semi1: { a: 'مترو گیم', b: 'Royal Cue', scoreA: '۵', scoreB: '۲', winner: 'a' },
      semi2: { a: 'Crown Billiards', b: 'Metro Lounge', scoreA: '۵', scoreB: '۴', winner: 'a' },
      final: { a: 'مترو گیم', b: 'Crown Billiards', status: 'میزبانی تأییدشده · توافق جایزه' },
    },
    leaderboard: [
      { rank: 1, club: 'مترو گیم', points: '۹۴۰', wins: '۱۶', losses: '۳', winRate: '۸۴٪', trend: 'up' },
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
      name: 'مترو گیم',
      city: 'تهران',
      monogram: 'MG',
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
      semi1: { a: 'مترو گیم', b: 'Orbit Play', scoreA: '۳', scoreB: '۱', winner: 'a' },
      semi2: { a: 'Pulse Club', b: 'Arena Plus', scoreA: '۳', scoreB: '۲', winner: 'a' },
      final: { a: 'مترو گیم', b: 'Pulse Club', status: 'فینال چالش مستقیم · ثبت نتیجه' },
    },
    leaderboard: [
      { rank: 1, club: 'مترو گیم', points: '۷۸۰', wins: '۱۳', losses: '۲', winRate: '۸۷٪', trend: 'up' },
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
    summary: 'کامل‌ترین تجربه مترو گیم شامل شبکه کامل تورنومنت، چالش مستقیم، رتبه‌بندی و امکانات اختصاصی.',
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

export const PINNED_STORY_STAGES = Object.freeze([
  {
    id: 'stations',
    stepNumber: '۰۱',
    kicker: 'مرحله اول · کنترل سالن و دستگاه‌ها',
    title: 'مدیریت زنده ایستگاه‌ها، کنسول‌ها و میزهای سالن',
    description:
      'تمامی کنسول‌های PS4 و PS5، سیستم‌های PC، میزهای بیلیارد و فوتبال‌دستی را با تایمر دقیق، تغییر تعداد دسته در میانه بازی و محاسبه خودکار هزینه کنترل کنید.',
    metrics: [
      'ثبت و کنترل لحظه‌ای وضعیت هر میز و کنسول',
      'محاسبه هوشمند نرخ بر اساس نسل دستگاه و تعداد دسته',
      'همگام‌سازی کامل ایستگاه‌ها با نقشه سه‌بعدی سالن',
    ],
    route: 'app.metrogame.ir / tables',
    focusLabel: 'پایش زنده تایمرها و وضعیت ایستگاه‌ها',
    focusBox: { x: 10, y: 20, w: 66, h: 46 },
    focalOrigin: '52% 34%',
    darkSrc: 'assets/images/landing/preview-tables-dark.png',
    lightSrc: 'assets/images/landing/preview-tables-light.png',
    alt: 'مرحله اول: مدیریت ایستگاه‌ها و کنسول‌ها در مترو گیم',
  },
  {
    id: 'buffet',
    stepNumber: '۰۲',
    kicker: 'مرحله دوم · فروش بوفه یکپارچه',
    title: 'مدیریت بوفه و اتصال فوری سفارش به فاکتور میز',
    description:
      'منوی نوشیدنی‌ها و خوراکی‌های مجموعه را تعریف کنید و سفارش هر بازیکن را با یک کلیک روی فاکتور همان میز یا به‌صورت فروش مستقیم ثبت نمایید.',
    metrics: [
      'ثبت سریع اقلام بوفه بدون نیاز به فاکتور جداگانه',
      'کنترل موجودی کالاها و قیمت‌گذاری منعطف در هر لحظه',
      'تفکیک خودکار درآمد بوفه از هزینه بازی در تسویه نهایی',
    ],
    route: 'app.metrogame.ir / buffet',
    focusLabel: 'منوی بوفه و ثبت سریع سفارش روی میزها',
    focusBox: { x: 14, y: 24, w: 62, h: 48 },
    focalOrigin: '48% 42%',
    darkSrc: 'assets/images/landing/preview-buffet-dark.png',
    lightSrc: 'assets/images/landing/preview-buffet-light.png',
    alt: 'مرحله دوم: مدیریت بوفه و محصولات در مترو گیم',
  },
  {
    id: 'finance',
    stepNumber: '۰۳',
    kicker: 'مرحله سوم · باشگاه مشتریان و شفافیت مالی',
    title: 'مدیریت مشتریان، بدهکاران و گزارش‌های مالی دقیق',
    description:
      'باشگاه مشتریان با تخفیف خودکار، شارژ حساب اعتباری، لیست بدهکاران و گزارش شفاف درآمد روزانه و ماهانه را بدون خطا در پایان هر شیفت بررسی کنید.',
    metrics: [
      'تفکیک کامل پرداخت نقدی، کارت‌خوان و اعتبار مشتریان',
      'پیگیری شفاف بدهکاران و تسویه جزئی یا کامل در چند ثانیه',
      'نمودارها و گزارش‌های دقیق برای تصمیم‌گیری مالی مدیر',
    ],
    route: 'app.metrogame.ir / income',
    focusLabel: 'تحلیل درآمد، تفکیک پرداخت‌ها و باشگاه مشتریان',
    focusBox: { x: 12, y: 18, w: 68, h: 50 },
    focalOrigin: '50% 36%',
    darkSrc: 'assets/images/landing/preview-finance-dark.png',
    lightSrc: 'assets/images/landing/preview-finance-light.png',
    alt: 'مرحله سوم: مدیریت مشتریان و گزارش‌های مالی در مترو گیم',
  },
  {
    id: 'tournaments',
    stepNumber: '۰۴',
    kicker: 'مرحله چهارم · شبکه رقابت بین گیم‌نت‌ها',
    title: 'برگزاری تورنومنت، چالش مستقیم و رتبه‌بندی باشگاه‌ها',
    description:
      'فراتر از مدیریت داخلی، مسابقات رسمی مجموعه را برگزار کنید، برای گیم‌نت‌های دیگر چالش مستقیم بفرستید و جایگاه باشگاه خود را در جدول رتبه‌بندی بالا ببرید.',
    metrics: [
      'فراخوان عمومی و ارسال چالش مستقیم میان مدیران گیم‌نت‌ها',
      'پوشش کامل بازی‌های ویدیویی، بیلیارد و فوتبال‌دستی',
      'جدول حذفی خودکار، توافق جایزه و امتیازدهی شفاف در رتبه‌بندی',
    ],
    route: 'app.metrogame.ir / tournaments',
    focusLabel: 'فراخوان‌ها، چالش مستقیم و رتبه‌بندی گیم‌نت‌ها',
    focusBox: { x: 10, y: 22, w: 68, h: 52 },
    focalOrigin: '50% 44%',
    darkSrc: 'assets/images/landing/preview-tournaments-dark.png',
    lightSrc: 'assets/images/landing/preview-tournaments-light.png',
    alt: 'مرحله چهارم: شبکه مدیریت تورنومنت در مترو گیم',
  },
]);

export const TOURNAMENT_STORY_BEATS = Object.freeze([
  { id: 'connect', step: '۰۱', label: 'اتصال گیم‌نت‌ها' },
  { id: 'challenge', step: '۰۲', label: 'ارسال چالش مستقیم' },
  { id: 'compete', step: '۰۳', label: 'رقابت و جدول حذفی' },
  { id: 'champion', step: '۰۴', label: 'قهرمانی و رتبه‌بندی' },
]);

/**
 * Pure easing & interpolation primitives for deterministic scroll-linked timelines.
 */
export function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function lerp(start, end, t) {
  return start + (end - start) * clamp01(t);
}

export function smoothstep(edge0, edge1, x) {
  if (edge1 === edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function rangeProgress(progress, start, end) {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp01((progress - start) / (end - start));
}

/**
 * Computes continuous scroll-linked transformation values for the Hero section.
 * Progress 0 = top of page (angled perspective, full headline);
 * Progress 1 = settled hero dashboard centerpiece handing off into product journey.
 */
export function computeHeroScrollState(rawProgress) {
  const p = clamp01(rawProgress);
  const copyFade = smoothstep(0.02, 0.56, p);
  const stageSettle = smoothstep(0.0, 0.78, p);
  const satEase = smoothstep(0.18, 0.88, p);

  return {
    progress: p,
    copyY: Number(lerp(0, -68, copyFade).toFixed(2)),
    copyOpacity: Number(lerp(1, 0.14, copyFade).toFixed(3)),
    copyScale: Number(lerp(1, 0.96, copyFade).toFixed(4)),
    stageScale: Number(lerp(0.945, 1.035, stageSettle).toFixed(4)),
    stageRotateX: Number(lerp(8.5, 0, stageSettle).toFixed(2)),
    stageY: Number(lerp(24, -16, stageSettle).toFixed(2)),
    backplateY: Number(lerp(12, -10, stageSettle).toFixed(2)),
    backplateScale: Number(lerp(0.95, 1.015, stageSettle).toFixed(4)),
    haloScale: Number(lerp(0.92, 1.16, stageSettle).toFixed(3)),
    haloOpacity: Number(lerp(0.66, 1, stageSettle).toFixed(3)),
    satellitesY: [
      Number(lerp(26, 0, satEase).toFixed(2)),
      Number(lerp(42, 0, satEase).toFixed(2)),
      Number(lerp(58, 0, satEase).toFixed(2)),
    ],
  };
}

/**
 * Computes continuous stage progress and crossfade layer weights for the
 * 4-stage pinned scroll storytelling showcase.
 */
export function computePinnedStoryState(rawProgress, stageCount = PINNED_STORY_STAGES.length) {
  const count = Math.max(1, Number(stageCount) || 4);
  const p = clamp01(rawProgress);
  const stageFloat = p * (count - 1);
  const activeIndex = Math.max(0, Math.min(count - 1, Math.round(stageFloat)));
  const bandStart = Math.max(0, activeIndex - 0.5);
  const bandEnd = Math.min(count - 1, activeIndex + 0.5);
  const stageLocalProgress =
    bandEnd > bandStart ? clamp01((stageFloat - bandStart) / (bandEnd - bandStart)) : 1;

  const layers = [];
  for (let i = 0; i < count; i++) {
    const dist = Math.abs(stageFloat - i);
    const opacity = Number(clamp01(1 - smoothstep(0.30, 0.56, dist)).toFixed(3));
    const scale = Number(lerp(1.0, 0.972, clamp01(dist)).toFixed(4));
    const translateY = Number(((i - stageFloat) * 14).toFixed(2));
    layers.push({ index: i, opacity, scale, translateY });
  }

  return {
    progress: p,
    activeIndex,
    stageFloat: Number(stageFloat.toFixed(3)),
    stageLocalProgress: Number(stageLocalProgress.toFixed(3)),
    layers,
  };
}

/**
 * Computes continuous scroll-linked choreography for the Tournament Network
 * cinematic sequence: Connect -> Challenge -> Compete -> Become Champions.
 */
export function computeTournamentRevealState(rawProgress) {
  const p = clamp01(rawProgress);
  const atmo = smoothstep(0.0, 0.35, p);
  const clubs = smoothstep(0.05, 0.38, p);
  const vs = smoothstep(0.2, 0.48, p);
  const connectors = smoothstep(0.28, 0.56, p);
  const bracket = smoothstep(0.44, 0.74, p);
  const leaderboard = smoothstep(0.62, 0.92, p);

  let storyBeatIndex = 0;
  if (p >= 0.66) storyBeatIndex = 3;
  else if (p >= 0.44) storyBeatIndex = 2;
  else if (p >= 0.22) storyBeatIndex = 1;

  return {
    progress: p,
    atmosphereOpacity: Number(lerp(0.25, 1, atmo).toFixed(3)),
    clubAOffsetX: Number(lerp(72, 0, clubs).toFixed(2)),
    clubBOffsetX: Number(lerp(-72, 0, clubs).toFixed(2)),
    clubsOpacity: Number(lerp(0.15, 1, clubs).toFixed(3)),
    vsScale: Number(lerp(0.66, 1, vs).toFixed(3)),
    vsOpacity: Number(lerp(0.05, 1, vs).toFixed(3)),
    connectorDashOffset: Number(lerp(120, 0, connectors).toFixed(1)),
    bracketOpacity: Number(lerp(0.18, 1, bracket).toFixed(3)),
    bracketY: Number(lerp(28, 0, bracket).toFixed(2)),
    bracketDashOffset: Number(lerp(220, 0, bracket).toFixed(1)),
    leaderboardOpacity: Number(lerp(0.18, 1, leaderboard).toFixed(3)),
    leaderboardY: Number(lerp(32, 0, leaderboard).toFixed(2)),
    storyBeatIndex,
  };
}

/**
 * Computes subtle, restrained scroll-linked atmospheric glass lighting positions
 * so sections feel visually connected without distracting neon effects.
 */
export function computeAmbientState(rawScrollProgress) {
  const p = clamp01(rawScrollProgress);
  const wave = Math.sin(p * Math.PI * 2);
  const cosWave = Math.cos(p * Math.PI);

  return {
    progress: p,
    orb1X: Number((wave * 9).toFixed(2)),
    orb1Y: Number(lerp(-4, 18, p).toFixed(2)),
    orb2X: Number((-wave * 11).toFixed(2)),
    orb2Y: Number(lerp(14, -14, p).toFixed(2)),
    orb3X: Number((cosWave * 8).toFixed(2)),
    orb3Y: Number(lerp(10, -18, p).toFixed(2)),
    depthShiftY: Number(lerp(0, -48, p).toFixed(2)),
  };
}

/**
 * Computes restrained magnetic attraction offset for primary CTA buttons.
 */
export function computeMagneticOffset(normX, normY, maxShift = 6) {
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const nx = clamp(Number(normX) || 0, -1, 1);
  const ny = clamp(Number(normY) || 0, -1, 1);
  const limit = Math.max(0, Number(maxShift) || 0);
  return {
    tx: Number((nx * limit).toFixed(2)),
    ty: Number((ny * limit).toFixed(2)),
  };
}

/**
 * Summarizes included vs locked capabilities for any subscription tier id
 * from COMPARISON_ROWS without inventing any price or entitlement data.
 */
export function getTierCapabilitiesSummary(tierId) {
  const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId) || SUBSCRIPTION_TIERS[3];
  let includedCount = 0;
  let excludedCount = 0;
  for (const row of COMPARISON_ROWS) {
    if (row.tiers[tier.id] === 'included') includedCount += 1;
    else excludedCount += 1;
  }
  return {
    tierId: tier.id,
    persianName: tier.persianName,
    subtitle: tier.subtitle,
    includedCount,
    excludedCount,
    totalCount: COMPARISON_ROWS.length,
    featured: tier.featured,
  };
}

/**
 * Computes restrained pointer-responsive perspective tilt and specular coordinates
 * for the hero dashboard showcase stage and premium glass cards.
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
