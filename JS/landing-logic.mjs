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
 * ============================================================================
 * 5-SCENE CINEMATIC STORYTELLING DATA & DETERMINISTIC TIMELINE COMPUTERS
 * ============================================================================
 */

export const SOFTWARE_TOUR_STOPS = Object.freeze([
  {
    id: 'stations',
    step: '۰۱',
    shortLabel: 'ایستگاه‌ها و کنسول‌ها',
    kicker: 'بخش ۰۱ · کنترل زنده سالن',
    title: 'مدیریت دقیق ایستگاه‌ها، کنسول‌های PS4/PS5 و سیستم‌های PC',
    description:
      'وضعیت هر میز، تایمر زنده، تغییر تعداد دسته‌ها در میانه سشن و نرخ اختصاصی هر نسل دستگاه به‌صورت یکپارچه و بدون خطا ثبت می‌شود.',
    bullets: [
      'شروع، جابه‌جایی میز، توقف و تسویه آنی سشن‌ها',
      'تعرفه جداگانه برای PS4، PS5، PC، بیلیارد و فوتبال‌دستی',
    ],
    route: 'app.metrogame.ir / tables',
    calloutSide: 'right',
    camera: { zoom: 1.07, panX: -2.2, panY: -1.8 },
    focusBox: { x: 8, y: 18, w: 68, h: 48 },
    darkSrc: 'assets/images/landing/preview-tables-dark.png',
    lightSrc: 'assets/images/landing/preview-tables-light.png',
    alt: 'نمای واقعی مدیریت ایستگاه‌ها و تایمر زنده در پنل مترو گیم',
  },
  {
    id: 'customers',
    step: '۰۲',
    shortLabel: 'مدیریت مشتریان',
    kicker: 'بخش ۰۲ · باشگاه مشتریان و اعتبار',
    title: 'پرونده کامل بازیکنان، شارژ اعتباری و وفادارسازی خودکار',
    description:
      'مشتریان ثابت مجموعه را با سابقه بازی، شارژ کیف پول، تخفیف پلکانی خودکار و پیگیری شفاف مانده بدهی بدون دفترچه کاغذی مدیریت کنید.',
    bullets: [
      'کسر خودکار هزینه بازی و بوفه از اعتبار حساب مشتری',
      'پایش دقیق بدهکاران و تسویه جزئی یا کامل در چند ثانیه',
    ],
    route: 'app.metrogame.ir / customers',
    calloutSide: 'left',
    camera: { zoom: 1.11, panX: 2.8, panY: -2.6 },
    focusBox: { x: 16, y: 20, w: 64, h: 46 },
    darkSrc: 'assets/images/landing/preview-overview-dark.png',
    lightSrc: 'assets/images/landing/preview-overview-light.png',
    alt: 'نمای واقعی پیشخوان و وضعیت مشتریان فعال در مترو گیم',
  },
  {
    id: 'buffet',
    step: '۰۳',
    shortLabel: 'بوفه و فروش',
    kicker: 'بخش ۰۳ · بوفه یکپارچه با میزها',
    title: 'ثبت فوری سفارش بوفه مستقیماً روی فاکتور همان میز',
    description:
      'نوشیدنی‌ها و اقلام بوفه را با قیمت و موجودی زنده تعریف کنید تا با یک کلیک روی میز فعال یا به‌صورت فروش مستقیم ثبت شوند.',
    bullets: [
      'افزودن فوری سفارش به فاکتور ایستگاه بدون محاسبه دستی',
      'تفکیک خودکار فروش بوفه از درآمد بازی در گزارش شیفت',
    ],
    route: 'app.metrogame.ir / buffet',
    calloutSide: 'right',
    camera: { zoom: 1.09, panX: -1.8, panY: 2.1 },
    focusBox: { x: 12, y: 22, w: 66, h: 48 },
    darkSrc: 'assets/images/landing/preview-buffet-dark.png',
    lightSrc: 'assets/images/landing/preview-buffet-light.png',
    alt: 'نمای واقعی مدیریت بوفه و ثبت سفارشات در مترو گیم',
  },
  {
    id: 'finance',
    step: '۰۴',
    shortLabel: 'گزارش‌های مالی',
    kicker: 'بخش ۰۴ · شفافیت کامل مالی',
    title: 'گزارش درآمد روزانه و ماهانه به تفکیک روش پرداخت',
    description:
      'جمع کل درآمد نقدی، کارت‌خوان، پرداخت اعتباری و سهم بوفه را در پایان هر شیفت با نمودارهای دقیق و بدون ابهام بررسی نمایید.',
    bullets: [
      'بستن سریع صندوق پایان شیفت با تطبیق کامل تراکنش‌ها',
      'نمایش تفکیکی درآمد هر بخش برای تصمیم‌گیری دقیق مدیر',
    ],
    route: 'app.metrogame.ir / income',
    calloutSide: 'left',
    camera: { zoom: 1.12, panX: 2.4, panY: 1.8 },
    focusBox: { x: 10, y: 16, w: 70, h: 52 },
    darkSrc: 'assets/images/landing/preview-finance-dark.png',
    lightSrc: 'assets/images/landing/preview-finance-light.png',
    alt: 'نمای واقعی گزارش‌های مالی و تحلیل درآمد در مترو گیم',
  },
  {
    id: 'tournaments',
    step: '۰۵',
    shortLabel: 'مدیریت تورنومنت',
    kicker: 'بخش ۰۵ · شبکه رقابت بین گیم‌نت‌ها',
    title: 'برگزاری تورنومنت، ارسال چالش مستقیم و جدول رتبه‌بندی',
    description:
      'مسابقات داخلی مجموعه را بسازید، برای باشگاه‌های دیگر چالش مستقیم بفرستید و جایگاه گیم‌نت خود را در رتبه‌بندی شبکه تثبیت کنید.',
    bullets: [
      'پوشش کامل بازی‌های ویدیویی، بیلیارد و فوتبال‌دستی',
      'توافق جایزه، میزبانی و جدول حذفی خودکار میان مدیران',
    ],
    route: 'app.metrogame.ir / tournaments',
    calloutSide: 'right',
    camera: { zoom: 1.06, panX: 0, panY: -1.4 },
    focusBox: { x: 11, y: 20, w: 68, h: 50 },
    darkSrc: 'assets/images/landing/preview-tournaments-dark.png',
    lightSrc: 'assets/images/landing/preview-tournaments-light.png',
    alt: 'نمای واقعی شبکه تورنومنت و چالش مستقیم مترو گیم',
  },
]);

export const HORIZONTAL_EXHIBITION_PANELS = Object.freeze([
  {
    id: 'hall-3d',
    index: '۰۱',
    layout: 'panoramic-3d',
    kicker: 'چیدمان فضایی و معماری سالن',
    title: 'طراح سه‌بعدی گیم‌نت با دیوارکشی، طبقات و تایمر زنده',
    description:
      'سالن واقعی خود را از صفر بسازید؛ دیوار بکشید، طبقه جدید اضافه کنید و میزهای کنسول، PC، بیلیارد و فوتبال‌دستی را دقیقاً با تایمر زنده بالای هر دستگاه ببینید.',
    points: [
      'همگام‌سازی خودکار میزهای چیده‌شده با پنل تایمرها',
      'ساخت دیوارهای داخلی، اتاق‌های VIP و مدیریت چندطبقه',
    ],
    route: 'app.metrogame.ir / gamenet-3d',
    darkSrc: 'assets/images/landing/preview-3d-dark.png',
    lightSrc: 'assets/images/landing/preview-3d-light.png',
    alt: 'طراح سه‌بعدی سالن گیم‌نت من در مترو گیم',
  },
  {
    id: 'console-matrix',
    index: '۰۲',
    layout: 'split-editorial',
    kicker: 'موتور تعرفه‌گذاری هوشمند',
    title: 'کنترل کامل PS4 و PS5 با تغییر لحظه‌ای تعداد دسته‌ها',
    description:
      'نرخ‌های تک‌دسته تا چهاردسته را برای هر نسل کنسول تعریف کنید تا هنگام تغییر تعداد بازیکنان در میانه سشن، محاسبه هزینه بدون توقف و بدون خطا ادامه یابد.',
    points: [
      'تفکیک دقیق تعرفه برای PlayStation 4 و PlayStation 5',
      'پشتیبانی از تغییر تعداد دسته در میانه بازی بدون بستن فاکتور',
    ],
    route: 'app.metrogame.ir / consoles',
    darkSrc: 'assets/images/landing/preview-console-dark.png',
    lightSrc: 'assets/images/landing/preview-console-light.png',
    alt: 'صفحه مدیریت کنسول‌های بازی و تعرفه‌ها در مترو گیم',
  },
  {
    id: 'live-command',
    index: '۰۳',
    layout: 'cinema-wide',
    kicker: 'مرکز فرماندهی لحظه‌ای',
    title: 'پیشخوان زنده سالن برای نظارت یکپارچه در ساعات شلوغ',
    description:
      'در یک نگاه ببینید کدام ایستگاه‌ها فعال‌اند، چه زمانی به پایان سشن باقی مانده و وضعیت فروش لحظه‌ای سالن و بوفه در چه سطحی قرار دارد.',
    points: [
      'پایش هم‌زمان میزهای فعال، زمان سپری‌شده و هشدار پایان سشن',
      'دسترسی سریع به ثبت میز جدید و عملیات پرتکرار اپراتور',
    ],
    route: 'app.metrogame.ir / dashboard',
    darkSrc: 'assets/images/landing/preview-overview-dark.png',
    lightSrc: 'assets/images/landing/preview-overview-light.png',
    alt: 'پیشخوان اصلی و پیست زنده میزها در مترو گیم',
  },
  {
    id: 'buffet-flow',
    index: '۰۴',
    layout: 'dual-focus',
    kicker: 'جریان سریع فروش بوفه',
    title: 'اتصال بی‌وقفه سفارش نوشیدنی و خوراکی به حساب هر ایستگاه',
    description:
      'از قلم افتادن سفارش‌ها در زمان شلوغی را متوقف کنید؛ هر قلم بوفه با یک کلیک روی میز مورد نظر می‌نشیند و در تسویه نهایی به‌صورت تفکیک‌شده نمایش داده می‌شود.',
    points: [
      'کنترل موجودی انبار بوفه و ویرایش سریع قیمت‌ها',
      'امکان فروش مستقیم پیشخوانی در کنار اتصال به فاکتور میز',
    ],
    route: 'app.metrogame.ir / buffet',
    darkSrc: 'assets/images/landing/preview-buffet-dark.png',
    lightSrc: 'assets/images/landing/preview-buffet-light.png',
    alt: 'بخش مدیریت بوفه و ثبت سفارشات در مترو گیم',
  },
  {
    id: 'financial-clarity',
    index: '۰۵',
    layout: 'audit-matrix',
    kicker: 'حسابرسی دقیق پایان شیفت',
    title: 'شفافیت کامل نقدی، کارت‌خوان، اعتباری و لیست بدهکاران',
    description:
      'پایان هر شیفت را در کمتر از یک دقیقه جمع‌بندی کنید؛ تفکیک کامل روش‌های پرداخت، تاریخچه مشتریان و نمودارهای درآمد بدون نیاز به فایل‌های پراکنده.',
    points: [
      'گزارش‌های دقیق روزانه، هفتگی و ماهانه با تفکیک منبع درآمد',
      'مدیریت ساختاریافته باشگاه مشتریان و تسویه شفاف بدهکاران',
    ],
    route: 'app.metrogame.ir / income',
    darkSrc: 'assets/images/landing/preview-finance-dark.png',
    lightSrc: 'assets/images/landing/preview-finance-light.png',
    alt: 'صفحه گزارش‌های مالی و تحلیل درآمد در مترو گیم',
  },
]);

/**
 * Scene One — The Dashboard Reveal (0..1 scroll progress inside pinned 100vh stage)
 * 0.00 - 0.25: Kinetic headline separates into 2 RTL layers, ambient focus tightens, floating glass frames separate.
 * 0.25 - 0.65: Angled dashboard rotates toward frontal (15deg -> 0deg), grows to command the viewport, decorations sweep away.
 * 0.65 - 1.00: Dashboard expands into near-fullscreen showcase, settles camera perspective, prepares smooth Scene Two handoff.
 */
export function computeSceneOneReveal(rawProgress) {
  const p = clamp01(rawProgress);
  const p1 = smoothstep(0.0, 0.28, p);
  const p2 = smoothstep(0.20, 0.68, p);
  const p3 = smoothstep(0.65, 1.0, p);
  const frameClear = smoothstep(0.16, 0.52, p);

  return {
    progress: p,
    phase: p < 0.25 ? 1 : p < 0.65 ? 2 : 3,
    line1X: Number(lerp(0, 48, p1).toFixed(2)),
    line2X: Number(lerp(0, -48, p1).toFixed(2)),
    copyY: Number(lerp(0, -82, p1).toFixed(2)),
    copyOpacity: Number(lerp(1, 0, smoothstep(0.04, 0.28, p)).toFixed(3)),
    copyScale: Number(lerp(1, 0.94, p1).toFixed(4)),
    floatSpreadX: Number(lerp(0, 96, smoothstep(0.02, 0.44, p)).toFixed(2)),
    floatOpacity: Number(lerp(1, 0, frameClear).toFixed(3)),
    focusBeamScale: Number(lerp(0.88, 1.24, p2).toFixed(3)),
    focusBeamOpacity: Number(lerp(0.52, 0.96, p2).toFixed(3)),
    stageRotateX: Number(lerp(15, 0, p2).toFixed(2)),
    stageRotateY: Number(lerp(-1.4, 0, p2).toFixed(2)),
    stageScale: Number((lerp(0.79, 1.0, p2) + lerp(0, 0.075, p3)).toFixed(4)),
    stageY: Number((lerp(205, 8, p2) + lerp(0, -12, p3)).toFixed(2)),
    stageRadius: Number(lerp(24, 14, smoothstep(0.25, 0.85, p)).toFixed(1)),
    chromeOpacity: Number(lerp(1, 0.28, p3).toFixed(3)),
    handoffOpacity: Number(lerp(0, 1, smoothstep(0.76, 1.0, p)).toFixed(3)),
  };
}

/**
 * Scene Two — Enter The Software (0..1 scroll progress across 5 camera stops)
 * Uses plateau + crisp clip-path wipe transitions so there is zero double-exposure ghosting.
 */
export function computeSceneTwoSoftware(rawProgress, stopCount = SOFTWARE_TOUR_STOPS.length) {
  const count = Math.max(1, Number(stopCount) || 5);
  const p = clamp01(rawProgress);
  const scaled = p * (count - 1);
  const baseIdx = Math.min(count - 1, Math.floor(scaled));
  const nextIdx = Math.min(count - 1, baseIdx + 1);
  const frac = scaled - baseIdx;

  // Hold each screen razor-sharp until 0.62, then perform a crisp wipe 0.62 -> 0.94
  const wipeT = baseIdx === nextIdx ? 0 : smoothstep(0.58, 0.94, frac);
  const activeIndex = wipeT >= 0.5 ? nextIdx : baseIdx;

  const baseStop = SOFTWARE_TOUR_STOPS[baseIdx] || SOFTWARE_TOUR_STOPS[0];
  const nextStop = SOFTWARE_TOUR_STOPS[nextIdx] || baseStop;

  // Smooth virtual interface camera zoom & pan
  const cameraScale = Number(lerp(baseStop.camera.zoom, nextStop.camera.zoom, wipeT).toFixed(4));
  const cameraX = Number(lerp(baseStop.camera.panX, nextStop.camera.panX, wipeT).toFixed(2));
  const cameraY = Number(lerp(baseStop.camera.panY, nextStop.camera.panY, wipeT).toFixed(2));

  // Focus reticle interpolation
  const focusX = Number(lerp(baseStop.focusBox.x, nextStop.focusBox.x, wipeT).toFixed(2));
  const focusY = Number(lerp(baseStop.focusBox.y, nextStop.focusBox.y, wipeT).toFixed(2));
  const focusW = Number(lerp(baseStop.focusBox.w, nextStop.focusBox.w, wipeT).toFixed(2));
  const focusH = Number(lerp(baseStop.focusBox.h, nextStop.focusBox.h, wipeT).toFixed(2));

  // Per-layer clip-path inset (0 = fully revealed, 100 = hidden off-edge)
  const layers = [];
  for (let i = 0; i < count; i++) {
    let reveal = 0;
    if (i === 0) {
      reveal = 1;
    } else if (i < baseIdx + 1) {
      reveal = 1;
    } else if (i === nextIdx && baseIdx !== nextIdx) {
      reveal = wipeT;
    } else {
      reveal = 0;
    }
    const clipPct = Number(((1 - reveal) * 100).toFixed(2));
    layers.push({
      index: i,
      reveal: Number(reveal.toFixed(3)),
      clipPct,
      visible: reveal > 0.001,
    });
  }

  // Callout transitions subtly during wipe and settles cleanly on plateau
  const calloutDip = Math.sin(wipeT * Math.PI);
  const calloutOpacity = Number(lerp(1, 0.24, calloutDip).toFixed(3));
  const calloutShiftY = Number((calloutDip * 14).toFixed(2));

  return {
    progress: p,
    activeIndex,
    wipeProgress: Number(wipeT.toFixed(3)),
    cameraScale,
    cameraX,
    cameraY,
    focusBox: { x: focusX, y: focusY, w: focusW, h: focusH },
    calloutOpacity,
    calloutShiftY,
    layers,
  };
}

/**
 * Scene Three — Horizontal Cinematic Feature Exhibition (RTL track travel)
 * In RTL flex-direction: row, panels lay out from right to left (panel 0 at right,
 * panel N-1 extending off-screen to the left). Advancing forward moves the track
 * in the POSITIVE +X direction.
 */
export function computeSceneThreeHorizontal(
  rawProgress,
  panelCount = HORIZONTAL_EXHIBITION_PANELS.length,
  maxTravelPx = 2400
) {
  const count = Math.max(1, Number(panelCount) || 5);
  const travelLimit = Math.max(0, Number(maxTravelPx) || 0);
  const p = clamp01(rawProgress);

  // Subtle lead-in & settle margins (0.04..0.96) for effortless entry/exit handoff
  const easedTravel = smoothstep(0.03, 0.97, p);
  const trackTranslateX = Number((easedTravel * travelLimit).toFixed(2));
  const panelFloat = easedTravel * (count - 1);
  const activeIndex = Math.max(0, Math.min(count - 1, Math.round(panelFloat)));

  const panels = [];
  for (let i = 0; i < count; i++) {
    const signedDist = i - panelFloat; // >0 = upcoming (left in RTL), <0 = passed (right in RTL)
    const absDist = Math.abs(signedDist);
    const clampedDist = Math.min(1.4, absDist);
    const rotateY = Number(Math.max(-6, Math.min(6, signedDist * 4.2)).toFixed(2));
    const scale = Number(lerp(1.0, 0.935, clamp01(clampedDist)).toFixed(4));
    const opacity = Number(lerp(1.0, 0.56, clamp01(clampedDist)).toFixed(3));
    const depthZ = Number(lerp(0, -28, clamp01(clampedDist)).toFixed(1));
    panels.push({ index: i, rotateY, scale, opacity, depthZ });
  }

  return {
    progress: p,
    easedProgress: Number(easedTravel.toFixed(4)),
    trackTranslateX,
    activeIndex,
    panels,
  };
}

/**
 * Scene Four — Tournament Network Continuous Transformation
 * 0.00 - 0.20: Single centered مترو گیم club card.
 * 0.20 - 0.42: Home card shifts right, challenger enters from left, VS emblem scales, SVG connectors draw.
 * 0.42 - 0.75: H2H stage compacts upward and transforms into live knockout bracket + drawn SVG paths.
 * 0.75 - 1.00: Final champion highlight illuminates & ranked leaderboard rises into view.
 */
export function computeSceneFourTournament(rawProgress) {
  const p = clamp01(rawProgress);
  const splitT = smoothstep(0.18, 0.42, p);
  const vsT = smoothstep(0.24, 0.44, p);
  const bracketT = smoothstep(0.44, 0.72, p);
  const championT = smoothstep(0.72, 0.96, p);

  let beatIndex = 0;
  if (p >= 0.72) beatIndex = 3;
  else if (p >= 0.44) beatIndex = 2;
  else if (p >= 0.20) beatIndex = 1;

  return {
    progress: p,
    beatIndex,
    // In RTL, home card starts centered (negative X shifts left toward center from its right grid column)
    // and settles to 0px in its right-hand H2H slot as splitT -> 1.
    homeCenterOffsetPct: Number(lerp(-58, 0, splitT).toFixed(2)),
    homeScale: Number(lerp(1.07, 1.0, splitT).toFixed(4)),
    challengerOffsetX: Number(lerp(-96, 0, splitT).toFixed(2)),
    challengerOpacity: Number(lerp(0, 1, smoothstep(0.20, 0.38, p)).toFixed(3)),
    challengerScale: Number(lerp(0.92, 1.0, splitT).toFixed(4)),
    vsScale: Number(lerp(0.52, 1.0, vsT).toFixed(3)),
    vsOpacity: Number(lerp(0, 1, vsT).toFixed(3)),
    vsDashOffset: Number(lerp(120, 0, smoothstep(0.26, 0.46, p)).toFixed(1)),
    h2hScale: Number(lerp(1.0, 0.94, bracketT).toFixed(4)),
    h2hShiftY: Number(lerp(36, 0, bracketT).toFixed(2)),
    bracketOpacity: Number(lerp(0, 1, bracketT).toFixed(3)),
    bracketY: Number(lerp(44, 0, bracketT).toFixed(2)),
    bracketScale: Number(lerp(0.94, 1.0, bracketT).toFixed(4)),
    bracketDashOffset: Number(lerp(240, 0, smoothstep(0.50, 0.78, p)).toFixed(1)),
    leaderboardOpacity: Number(lerp(0, 1, championT).toFixed(3)),
    leaderboardY: Number(lerp(40, 0, championT).toFixed(2)),
    championHighlight: Number(lerp(0, 1, championT).toFixed(3)),
  };
}

/**
 * Scene Five — Interactive Pricing Transformation
 * Converged unified glass stack smoothly separates into 4 individual subscription cards.
 * Once progress >= 0.85, all 4 cards settle to 0 offset / 1 scale / 1 opacity so pricing
 * stays completely stationary, legible, and interactive.
 */
export function computeSceneFivePricing(rawProgress) {
  const p = clamp01(rawProgress);
  const spreadT = smoothstep(0.05, 0.78, p);
  const featureReveal = smoothstep(0.32, 0.82, p);
  const ultimateGlow = smoothstep(0.54, 0.92, p);

  // Initial converged horizontal offsets (in px) pulling the 4 RTL columns toward center:
  // Col 0 (rightmost) pulls left (-X), Col 3 (leftmost) pulls right (+X)
  const initialOffsetsX = [-165, -55, 55, 165];
  const initialRotatesY = [9, 3.5, -3.5, -9];
  const initialOffsetsY = [26, 12, 12, 26];

  const cards = initialOffsetsX.map((startX, idx) => {
    const isUltimate = idx === 3;
    const cardT = smoothstep(0.05 + idx * 0.04, 0.74 + idx * 0.03, p);
    return {
      index: idx,
      offsetX: Number(lerp(startX, 0, cardT).toFixed(2)),
      offsetY: Number(lerp(initialOffsetsY[idx], 0, cardT).toFixed(2)),
      rotateY: Number(lerp(initialRotatesY[idx], 0, cardT).toFixed(2)),
      scale: Number(lerp(isUltimate ? 0.96 : 0.91, 1.0, cardT).toFixed(4)),
      opacity: Number(lerp(isUltimate ? 0.72 : 0.38, 1.0, cardT).toFixed(3)),
    };
  });

  return {
    progress: p,
    spreadProgress: Number(spreadT.toFixed(3)),
    featureOpacity: Number(lerp(0.15, 1.0, featureReveal).toFixed(3)),
    ultimateGlow: Number(ultimateGlow.toFixed(3)),
    settled: p >= 0.85,
    cards,
  };
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
