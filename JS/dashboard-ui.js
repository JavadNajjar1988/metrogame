import {
  toPersianDigits,
  formatToman,
  getConsoleDisplayName,
  computeDashboardMetrics,
  computeCircularProgressGeometry,
  computeDonutSegmentsGeometry,
  interpolateCountUp,
} from './dashboard-metrics.mjs?v=20261109-3';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Smoothly animates a numeric value from 0 (or previous numeric value) to targetValue using requestAnimationFrame.
 */
function animateCountUp(idOrEl, targetValue, options = {}) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;

  const target = Math.max(0, Math.round(Number(targetValue) || 0));
  const duration = prefersReducedMotion ? 0 : Math.min(options.duration ?? 550, 650);
  const suffix = options.suffix ?? '';
  const prefix = options.prefix ?? '';
  const useCommas = options.useCommas ?? false;

  const hasPrev = el.hasAttribute('data-numeric-val');
  const prevNumeric = hasPrev ? Number(el.getAttribute('data-numeric-val') || 0) : Math.floor(target * 0.55);
  el.setAttribute('data-numeric-val', String(target));

  const formatVal = (val) => {
    const core = useCommas ? formatToman(val) : toPersianDigits(val);
    return `${prefix}${core}${suffix}`;
  };

  if (duration <= 0 || prevNumeric === target) {
    el.textContent = formatVal(target);
    return;
  }

  const startTime = performance.now();
  el.classList.add('mg-value-updating');

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const current = interpolateCountUp(prevNumeric, target, progress);
    el.textContent = formatVal(current);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = formatVal(target);
      setTimeout(() => el.classList.remove('mg-value-updating'), 180);
    }
  }

  requestAnimationFrame(frame);
}

function initLiveClock() {
  const clockEl = document.getElementById('mgLiveClockText');
  if (!clockEl) return;

  function tick() {
    try {
      const now = new Date();
      const dateStr = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }).format(now);
      const timeStr = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      clockEl.textContent = `${dateStr} | ساعت ${timeStr}`;
    } catch {
      clockEl.textContent = 'ساعت سیستم فعال';
    }
  }
  tick();
  setInterval(tick, 1000);
}

/**
 * 1. Button Animations, Glowing Ripple Micro-Interactions & Smooth Section Jumps
 */
function initButtonMicroInteractions() {
  document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest(
      '.mg-btn, .btn, .mg-chip-btn, .mg-filter-btn, .mg-icon-btn, .mg-logout-btn, .mg-radio-card'
    );
    if (!btn || btn.disabled || prefersReducedMotion) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.75;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'mg-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    btn.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 620);
  });
}

/**
 * Universal Instant SPA Section Router:
 * Switches between all 7 dashboard sections (خانه, میزها, مدیریت کنسول‌ها, مدیریت بوفه,
 * مشتریان, بدهکاران, گزارش درآمد) instantaneously in-place (<5ms) without a browser
 * page reload, keeping the sidebar sliding pill animation 100% fluid and unbroken.
 */
const SPA_SECTIONS = {
  overview: {
    key: 'overview',
    navMatch: '#overview',
    title: 'پیشخوان',
    docTitle: 'گیم سنتر | پیشخوان مدیریت میزها و کنسول‌ها',
    tip: 'مانیتورینگ زنده ظرفیت ایستگاه‌ها، نمودارهای دایره‌ای درآمد، وضعیت تایمرها و خلاصه میزهای فعال',
    url: 'index.html#overview',
  },
  tables: {
    key: 'tables',
    navMatch: '#tables-section',
    title: 'مدیریت میزها',
    docTitle: 'گیم سنتر | مدیریت میزها',
    tip: 'ثبت و راه‌اندازی میز جدید، شارژ مجدد سشن‌ها، ثبت سفارش بوفه و مدیریت تایمرها',
    url: 'index.html#tables-section',
  },
  console: {
    key: 'console',
    file: 'console.html',
    script: 'JS/console.js?v=20261110-15',
    renderFn: 'renderConsolePage',
    navMatch: 'console.html',
    title: 'مدیریت کنسول‌ها',
    docTitle: 'گیم سنتر | مدیریت کنسول‌ها',
    tip: 'تنظیم تعرفه ساعتی تک‌دسته و چنددسته برای کنسول‌ها، سیستم‌ها و میزهای بازی',
    url: 'console.html',
  },
  buffet: {
    key: 'buffet',
    file: 'buffet.html',
    script: 'JS/buffet.js?v=20261110-15',
    renderFn: 'renderBuffetPage',
    navMatch: 'buffet.html',
    title: 'مدیریت بوفه و خوراکی‌ها',
    docTitle: 'گیم سنتر | مدیریت بوفه و خوراکی‌ها',
    tip: 'ثبت محصولات خوراکی، نوشیدنی، قیمت واحد و کنترل لحظه‌ای موجودی انبار بوفه',
    url: 'buffet.html',
  },
  accounts: {
    key: 'accounts',
    file: 'acounts.html',
    script: 'JS/acounts.js?v=20261110-15',
    renderFn: 'renderAccountsPage',
    navMatch: 'acounts.html',
    title: 'باشگاه مشتریان',
    docTitle: 'گیم سنتر | باشگاه مشتریان',
    tip: 'ثبت اشتراک اعضای باشگاه، کد اشتراک، شماره تماس و مدیریت حساب‌های مشتریان',
    url: 'acounts.html',
  },
  debtors: {
    key: 'debtors',
    file: 'Debtors.html',
    script: 'JS/Debtors.js?v=20261110-15',
    renderFn: 'renderDebtorsPage',
    navMatch: 'Debtors.html',
    title: 'مدیریت حساب بدهکاران',
    docTitle: 'گیم سنتر | حساب بدهکاران',
    tip: 'پیگیری مانده بدهی دفتری مشتریان، ثبت بدهکار جدید و تسویه حساب سریع',
    url: 'Debtors.html',
  },
  income: {
    key: 'income',
    file: 'income.html',
    script: 'JS/income.js?v=20261110-15',
    renderFn: 'renderIncomePage',
    navMatch: 'income.html',
    title: 'گزارش جامع درآمد و تحلیل مالی',
    docTitle: 'گیم سنتر | گزارش جامع درآمد و تحلیل مالی',
    tip: 'تحلیل جامع درآمد کنسول‌ها، فروش بوفه، نمودار روش‌های پرداخت و فیلتر بازه زمانی',
    url: 'income.html',
  },
};

const spaTemplateCache = new Map();
const spaScriptPromises = new Map();
let currentSpaSectionKey = 'overview';

function resolveSectionKeyFromHref(href = '') {
  const clean = String(href || '').trim();
  const lower = clean.toLowerCase();
  if (lower.includes('console.html')) return 'console';
  if (lower.includes('buffet.html')) return 'buffet';
  if (lower.includes('acounts.html')) return 'accounts';
  if (lower.includes('debtors.html')) return 'debtors';
  if (lower.includes('income.html')) return 'income';
  if (lower.includes('#tables-section') || lower.includes('#tables') || lower === 'tables') {
    return 'tables';
  }
  if (lower.includes('#overview') || lower.includes('index.html') || lower === 'overview') {
    return 'overview';
  }
  return null;
}

function detectInitialSectionKey() {
  const path = (window.location.pathname || '').toLowerCase();
  const hash = (window.location.hash || '').toLowerCase();
  if (path.includes('console.html')) return 'console';
  if (path.includes('buffet.html')) return 'buffet';
  if (path.includes('acounts.html')) return 'accounts';
  if (path.includes('debtors.html')) return 'debtors';
  if (path.includes('income.html')) return 'income';
  if (hash === '#tables-section' || hash === '#tables') {
    try {
      sessionStorage.removeItem('mg_return_to_tables');
    } catch {
      // ignore
    }
    return 'tables';
  }
  if (hash === '#overview') {
    try {
      sessionStorage.removeItem('mg_return_to_tables');
    } catch {
      // ignore
    }
    return 'overview';
  }
  try {
    if (sessionStorage.getItem('mg_return_to_tables') === '1') {
      sessionStorage.removeItem('mg_return_to_tables');
      return 'tables';
    }
  } catch {
    // ignore
  }
  return 'overview';
}

function ensureSpaScriptLoaded(scriptSrc, renderFnName) {
  if (!scriptSrc) return Promise.resolve();
  if (renderFnName && typeof window[renderFnName] === 'function') {
    return Promise.resolve();
  }
  const baseName = scriptSrc.split('?')[0].toLowerCase();
  if (spaScriptPromises.has(baseName)) {
    return spaScriptPromises.get(baseName);
  }
  const existing = Array.from(document.querySelectorAll('script[src]')).find((s) =>
    (s.getAttribute('src') || '').toLowerCase().includes(baseName)
  );
  if (existing && renderFnName && typeof window[renderFnName] === 'function') {
    return Promise.resolve();
  }
  const p = new Promise((resolve) => {
    const s = document.createElement('script');
    if (baseName.includes('income.js') || baseName.endsWith('.mjs')) {
      s.type = 'module';
    }
    s.src = scriptSrc;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
  spaScriptPromises.set(baseName, p);
  return p;
}

async function fetchSectionMainHtml(sectionKey) {
  if (spaTemplateCache.has(sectionKey)) {
    return spaTemplateCache.get(sectionKey);
  }
  const sec = SPA_SECTIONS[sectionKey];
  if (!sec || !sec.file) return '';
  try {
    const res = await fetch(sec.file, { cache: 'force-cache' });
    if (!res.ok) return '';
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const mainEl = doc.querySelector('main.mg-content');
    const inner = mainEl ? mainEl.innerHTML : '';
    if (inner) {
      spaTemplateCache.set(sectionKey, inner);
    }
    return inner;
  } catch {
    return '';
  }
}

async function ensureIndexViewsPresent() {
  if (document.getElementById('mgOverviewView') && document.getElementById('mgTablesView')) {
    return true;
  }
  const mainEl = document.querySelector('main.mg-content');
  if (!mainEl) return false;
  try {
    const res = await fetch('index.html', { cache: 'force-cache' });
    if (!res.ok) return false;
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const overviewEl = doc.getElementById('mgOverviewView');
    const tablesEl = doc.getElementById('mgTablesView');
    if (overviewEl && !document.getElementById('mgOverviewView')) {
      overviewEl.classList.remove('is-active-view');
      overviewEl.setAttribute('hidden', '');
      mainEl.insertBefore(overviewEl, mainEl.firstChild);
    }
    if (tablesEl && !document.getElementById('mgTablesView')) {
      tablesEl.classList.remove('is-active-view');
      tablesEl.setAttribute('hidden', '');
      mainEl.insertBefore(tablesEl, document.getElementById('mgDynamicView'));
    }
    await ensureSpaScriptLoaded('JS/7878.js?v=20261110-15', 'renderTablesWorkspace');
    if (typeof window.renderTablesWorkspace === 'function') {
      window.renderTablesWorkspace();
    }
    initQuickPresets();
    initTableSearchAndFilter();
    return true;
  } catch {
    return false;
  }
}

function getOrCreateDynamicViewPane() {
  const mainEl = document.querySelector('main.mg-content');
  if (!mainEl) return null;
  let dyn = document.getElementById('mgDynamicView');
  if (!dyn) {
    dyn = document.createElement('div');
    dyn.id = 'mgDynamicView';
    dyn.className = 'mg-view-pane';
    dyn.setAttribute('hidden', '');
    mainEl.appendChild(dyn);
  }
  return dyn;
}

function syncSidebarNavActiveState(sectionKey) {
  const sec = SPA_SECTIONS[sectionKey] || SPA_SECTIONS.overview;
  const navList = document.querySelector('.mg-nav-list');
  if (!navList) return null;

  let matchedItem = null;
  navList.querySelectorAll('.mg-nav-item').forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const href = (a.getAttribute('href') || '').toLowerCase();
    const dataView = (a.getAttribute('data-nav-view') || '').toLowerCase();
    const isMatch = Boolean(
      (sectionKey === 'overview' && (dataView === 'overview' || href.includes('#overview'))) ||
        (sectionKey === 'tables' && (dataView === 'tables' || href.includes('#tables'))) ||
        (Boolean(sec.file) && href.includes(sec.file.toLowerCase()))
    );
    if (isMatch && !matchedItem) {
      li.classList.add('active');
      matchedItem = li;
    } else {
      li.classList.remove('active');
    }
  });

  document.querySelectorAll('.mg-view-switch-btn[data-switch-view]').forEach((btn) => {
    const btnView = btn.getAttribute('data-switch-view');
    const active = Boolean(btnView === sectionKey);
    if (active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  return matchedItem;
}

async function switchSpaSection(targetKey, options = {}) {
  const sectionKey = SPA_SECTIONS[targetKey] ? targetKey : 'overview';
  const sec = SPA_SECTIONS[sectionKey];
  currentSpaSectionKey = sectionKey;

  // 1. Update sidebar active state and animate sliding violet pill immediately on Frame 0
  const activeNavItem = syncSidebarNavActiveState(sectionKey);
  syncSidebarSlidingPill(activeNavItem, { animateStretch: true, commitActive: true });

  // 2. Update topbar title & browser document title immediately
  setText('mgTopbarTitle', sec.title);
  if (sec.docTitle) {
    document.title = sec.docTitle;
  }

  // 3. Close mobile sidebar if open
  const sidebar = document.getElementById('mgSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  // 4. Update URL history without triggering a page reload
  if (options.updateHistory !== false) {
    try {
      history.pushState({ spaSection: sectionKey }, sec.docTitle || '', sec.url);
    } catch {
      // ignore
    }
  }

  if (options.scrollToTop !== false && window.scrollY > 40) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }

  // 5. Swap main view panes without synchronous layout thrashing so sidebar spring animation stays at 60fps
  if (sectionKey === 'overview' || sectionKey === 'tables') {
    await ensureIndexViewsPresent();
    if (currentSpaSectionKey !== sectionKey) return;

    const overviewPane = document.getElementById('mgOverviewView');
    const tablesPane = document.getElementById('mgTablesView');
    const dynPane = document.getElementById('mgDynamicView');

    if (dynPane) {
      dynPane.classList.remove('is-active-view');
      dynPane.setAttribute('hidden', '');
    }

    if (overviewPane && tablesPane) {
      const isTables = sectionKey === 'tables';
      const activePane = isTables ? tablesPane : overviewPane;
      const inactivePane = isTables ? overviewPane : tablesPane;

      inactivePane.classList.remove('is-active-view');
      inactivePane.setAttribute('hidden', '');

      activePane.removeAttribute('hidden');
      activePane.classList.add('is-active-view');
    }

    requestAnimationFrame(() => {
      if (currentSpaSectionKey !== sectionKey) return;
      if (sectionKey === 'overview') {
        loadAndRenderKPIs();
      }
      initScrollAndEntranceAnimations();
      initExclamationTooltips();
    });
    return;
  }

  // Management sub-section ('console', 'buffet', 'accounts', 'debtors', 'income')
  const overviewPane = document.getElementById('mgOverviewView');
  const tablesPane = document.getElementById('mgTablesView');
  if (overviewPane) {
    overviewPane.classList.remove('is-active-view');
    overviewPane.setAttribute('hidden', '');
  }
  if (tablesPane) {
    tablesPane.classList.remove('is-active-view');
    tablesPane.setAttribute('hidden', '');
  }

  const dynPane = getOrCreateDynamicViewPane();
  if (!dynPane) return;

  if (dynPane.getAttribute('data-spa-section') !== sectionKey) {
    const html = await fetchSectionMainHtml(sectionKey);
    if (currentSpaSectionKey !== sectionKey) return;
    if (html) {
      dynPane.innerHTML = html;
      dynPane.setAttribute('data-spa-section', sectionKey);
    }
  }

  dynPane.removeAttribute('hidden');
  dynPane.classList.add('is-active-view');

  await ensureSpaScriptLoaded(sec.script, sec.renderFn);
  if (currentSpaSectionKey !== sectionKey) return;

  requestAnimationFrame(() => {
    if (currentSpaSectionKey !== sectionKey) return;
    if (sec.renderFn && typeof window[sec.renderFn] === 'function') {
      try {
        window[sec.renderFn]();
      } catch {
        // ignore
      }
    }
    initScrollAndEntranceAnimations();
    initExclamationTooltips();
  });
}

function switchIndexView(targetView, options = {}) {
  const key = targetView === 'tables' ? 'tables' : 'overview';
  return switchSpaSection(key, options);
}

function prefetchAllSpaSections() {
  const runPrefetch = () => {
    Object.values(SPA_SECTIONS).forEach((sec) => {
      if (sec.file && !spaTemplateCache.has(sec.key)) {
        fetchSectionMainHtml(sec.key);
      }
      if (sec.script) {
        ensureSpaScriptLoaded(sec.script, sec.renderFn);
      }
    });
    if (!document.getElementById('mgOverviewView')) {
      ensureIndexViewsPresent();
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(runPrefetch, { timeout: 600 });
  } else {
    setTimeout(runPrefetch, 120);
  }
}

function initIndexViewRouter() {
  const mainEl = document.querySelector('main.mg-content');
  if (!mainEl) return;

  const initialKey = detectInitialSectionKey();
  currentSpaSectionKey = initialKey;

  // If page loaded directly on a secondary HTML file (e.g., console.html), wrap its initial <main> content into #mgDynamicView
  if (!document.getElementById('mgOverviewView') && initialKey !== 'overview' && initialKey !== 'tables') {
    let dynPane = document.getElementById('mgDynamicView');
    if (!dynPane) {
      const initialHtml = mainEl.innerHTML;
      spaTemplateCache.set(initialKey, initialHtml);
      dynPane = document.createElement('div');
      dynPane.id = 'mgDynamicView';
      dynPane.className = 'mg-view-pane is-active-view';
      dynPane.setAttribute('data-spa-section', initialKey);
      dynPane.innerHTML = initialHtml;
      mainEl.innerHTML = '';
      mainEl.appendChild(dynPane);
    }
    syncSidebarNavActiveState(initialKey);
    setText('mgTopbarTitle', SPA_SECTIONS[initialKey]?.title || 'پیشخوان');
    requestAnimationFrame(() => {
      syncSidebarSlidingPill(null, { instant: true, commitActive: true });
    });
  } else {
    switchSpaSection(initialKey, { updateHistory: false, scrollToTop: false });
  }

  // Intercept clicks on all sidebar navigation links & view switch buttons for instant SPA switching
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const trigger = e.target.closest('[data-nav-view], [data-switch-view], .mg-nav-item a');
    if (!trigger) return;

    const explicitView =
      trigger.getAttribute('data-nav-view') || trigger.getAttribute('data-switch-view');
    const href = trigger.getAttribute('href') || '';
    const targetKey = resolveSectionKeyFromHref(explicitView || href);
    if (!targetKey) return;

    e.preventDefault();
    switchSpaSection(targetKey, { updateHistory: true, scrollToTop: true }).then(() => {
      const focusTable = trigger.getAttribute('data-focus-table');
      if (focusTable && targetKey === 'tables') {
        setTimeout(() => {
          const tableCard = document.getElementById('tables-section');
          if (tableCard) {
            tableCard.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'start',
            });
          }
        }, 80);
      }
    });
  });

  // Support browser back/forward navigation seamlessly
  window.addEventListener('popstate', (e) => {
    const stateKey = e.state && e.state.spaSection;
    const key = stateKey || detectInitialSectionKey();
    switchSpaSection(key, { updateHistory: false, scrollToTop: true });
  });

  window.addEventListener('hashchange', () => {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash === '#tables-section' || hash === '#tables') {
      switchSpaSection('tables', { updateHistory: false, scrollToTop: true });
    } else if (hash === '#overview') {
      switchSpaSection('overview', { updateHistory: false, scrollToTop: true });
    }
  });

  // Preserve 'tables' view across form submissions in میزها
  const regForm = document.querySelector('form[action="process.php"]');
  if (regForm) {
    regForm.addEventListener('submit', () => {
      try {
        sessionStorage.setItem('mg_return_to_tables', '1');
      } catch {
        // Ignore
      }
    });
  }
  ['chargeForm', 'buyForm'].forEach((formId) => {
    const f = document.getElementById(formId);
    if (f) {
      f.addEventListener('submit', () => {
        try {
          sessionStorage.setItem('mg_return_to_tables', '1');
        } catch {
          // Ignore
        }
      });
    }
  });

  // Pre-fetch all section templates and scripts so every switch is <5ms
  prefetchAllSpaSections();
}

/**
 * 2 & 4. Staggered Card Entrance Animations (Always visible, never stuck at opacity: 0)
 */
function initScrollAndEntranceAnimations() {
  const revealTargets = document.querySelectorAll(
    '.mg-card, .x_panel, #ChargeModal .charge-modal-content, #myModal .modal-content, .mg-chart-card'
  );
  revealTargets.forEach((el, idx) => {
    el.classList.add('is-visible');
    if (!prefersReducedMotion) {
      el.style.setProperty('--stagger-idx', String(Math.min(idx + 1, 8)));
      el.classList.add('mg-stagger-item');
    }
  });
}

function initSidebarAndNotifications() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.getElementById('mgSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('open');
    });
  }
  if (backdrop && sidebar) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
    });
  }

  const notifBtn = document.getElementById('mgNotifBtn');
  const notifDropdown = document.getElementById('mgNotifDropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBtn) {
        notifDropdown.classList.remove('open');
      }
    });
  }
}

function initQuickPresets() {
  function setActiveChip(clickedBtn) {
    const parent = clickedBtn.closest('.mg-preset-chips');
    if (parent) {
      parent.querySelectorAll('.mg-chip-btn').forEach((b) => b.classList.remove('active'));
    }
    clickedBtn.classList.add('active');
  }

  document.querySelectorAll('[data-prepay-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveChip(btn);
      const amount = btn.getAttribute('data-prepay-preset');
      const preRadio = document.getElementById('pre-payment');
      const postRadio = document.getElementById('post-payment');
      const costInput = document.getElementById('pre-payment-cost');
      if (preRadio && costInput) {
        preRadio.checked = true;
        if (postRadio) postRadio.checked = false;
        preRadio.closest('.mg-radio-card')?.classList.add('is-selected');
        postRadio?.closest('.mg-radio-card')?.classList.remove('is-selected');
        costInput.disabled = false;
        costInput.value = amount;
        costInput.focus();
      }
    });
  });

  document.querySelectorAll('[data-price-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveChip(btn);
      const priceVal = btn.getAttribute('data-price-preset');
      const select = document.getElementById('priceType');
      if (select && priceVal) {
        select.value = priceVal;
      }
    });
  });

  document.querySelectorAll('[data-charge-amount]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveChip(btn);
      const input = document.getElementById('chargeAmount');
      if (input) input.value = btn.getAttribute('data-charge-amount');
    });
  });

  document.querySelectorAll('[data-charge-time]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveChip(btn);
      const input = document.getElementById('chargeTime');
      if (input) input.value = btn.getAttribute('data-charge-time');
    });
  });

  document.querySelectorAll('[data-buffet-qty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveChip(btn);
      const input = document.getElementById('quantity');
      if (input) input.value = btn.getAttribute('data-buffet-qty');
    });
  });
}

function initTableSearchAndFilter() {
  const searchInput = document.getElementById('dashboardSearch');
  const filterBtns = document.querySelectorAll('[data-table-filter]');
  let activeFilter = 'all';
  let searchQuery = '';

  function applyFilter() {
    const tbody = document.getElementById('reservationTableBody');
    if (!tbody) return;
    const rows = Array.from(tbody.querySelectorAll('tr:not(.mg-empty-row)'));
    let visibleCount = 0;

    rows.forEach((row, idx) => {
      const payment = row.getAttribute('data-payment') || '';
      const consoleType = row.getAttribute('data-console') || '';
      const searchText = (row.getAttribute('data-search') || row.textContent || '').toLowerCase();

      let matchesFilter = true;
      if (activeFilter === 'post-payment') {
        matchesFilter = payment === 'post-payment';
      } else if (activeFilter === 'pre-payment') {
        matchesFilter = payment === 'pre-payment';
      } else if (activeFilter === 'console') {
        matchesFilter = ['ps50', 'ps4', 'xbox'].includes(consoleType);
      } else if (activeFilter === 'other') {
        matchesFilter = ['computer', 'pool-table', 'foosball', 'jewelry'].includes(consoleType);
      }

      const matchesSearch = !searchQuery || searchText.includes(searchQuery.toLowerCase());
      const show = matchesFilter && matchesSearch;
      row.style.display = show ? '' : 'none';
      if (show) {
        visibleCount++;
        if (!prefersReducedMotion) {
          row.style.animation = 'none';
          void row.offsetWidth;
          row.style.animation = `mgRowSlideIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 45}ms both`;
        }
      }
    });

    const countTag = document.getElementById('activeTableFilteredCount');
    if (countTag && rows.length > 0) {
      countTag.textContent = `${toPersianDigits(visibleCount)} از ${toPersianDigits(rows.length)} میز`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      if (searchQuery) {
        const tablesPane = document.getElementById('mgTablesView');
        if (tablesPane && tablesPane.hasAttribute('hidden')) {
          switchIndexView('tables', { updateHistory: true, scrollToTop: false });
        }
      }
      applyFilter();
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.getAttribute('data-table-filter') || 'all';
      applyFilter();
    });
  });
}

function renderOverviewMiniStations(reservations, clickTimes, finishTimes, buffetTemp) {
  const container = document.getElementById('overviewMiniTablesList');
  if (!container) return;

  const list = Array.isArray(reservations) ? reservations : [];
  if (list.length === 0) {
    container.innerHTML = `
      <div class="mg-mini-station-empty">
        <p>در حال حاضر هیچ میز فعالی ثبت نشده است.</p>
        <button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-switch-view="tables">
          <span>+ ثبت میز جدید</span>
        </button>
      </div>
    `;
    return;
  }

  const priceTypeLabels = {
    one_player_price: 'تک نفره',
    two_player_price: 'دو نفره',
    three_player_price: 'سه نفره',
    four_player_price: 'چهار نفره',
  };

  container.innerHTML = list
    .map((res) => {
      const tNum = String(res.tableNumber);
      const isPre = res.prePayment === 'pre-payment';
      const consoleName = getConsoleDisplayName(res.consoleType);
      const gameMode = priceTypeLabels[res.priceType] || 'عادی';

      const hasStartedPost =
        !isPre &&
        Array.isArray(clickTimes) &&
        clickTimes.some((c) => String(c.tableNumber) === tNum && Number(c.clickTime) > 0);
      const hasStartedPre =
        isPre &&
        Array.isArray(finishTimes) &&
        finishTimes.some((f) => String(f.tableNumber) === tNum && Number(f.finishTime) > 0);
      const isRunning = hasStartedPost || hasStartedPre;

      const buffetCount = Array.isArray(buffetTemp)
        ? buffetTemp.filter((b) => String(b.tableNumber) === tNum).length
        : 0;

      return `
        <article class="mg-mini-station-card ${isRunning ? 'is-running' : 'is-waiting'}">
          <div class="mg-mini-station-top">
            <div class="mg-mini-station-num">
              <span class="mg-mini-num-badge">میز ${toPersianDigits(tNum)}</span>
              <strong>${consoleName}</strong>
              <span class="mg-mini-inline-sub">${gameMode} · ${isPre ? 'شارژی' : 'پس‌کرایه'}${buffetCount > 0 ? ' · بوفه (' + toPersianDigits(buffetCount) + ')' : ''}</span>
            </div>
            <div class="mg-mini-station-end">
              <span class="mg-mini-status-tag ${isRunning ? 'tag-running' : 'tag-waiting'}">
                <span class="mg-status-dot"></span>
                ${isRunning ? 'در حال اجرا' : 'آماده'}
              </span>
              <button type="button" class="btn mg-btn mg-btn-cyan mg-btn-sm" data-switch-view="tables" data-focus-table="${tNum}">
                <span>مدیریت &larr;</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

/**
 * 3. Animated Circular Progress Rings & Interactive Multi-Segment Donut Charts
 */
function animateKpiMiniRings(metrics) {
  const miniRadius = 20;
  const activeRatio =
    metrics.stationCapacity > 0
      ? Math.round((metrics.activeTablesCount / metrics.stationCapacity) * 100)
      : 0;
  const gameShare =
    metrics.totalRevenue > 0 ? Math.round((metrics.gameRevenue / metrics.totalRevenue) * 100) : 75;
  const buffetShare =
    metrics.totalRevenue > 0 ? Math.round((metrics.buffetRevenue / metrics.totalRevenue) * 100) : 25;
  const sessionShare =
    metrics.activeTablesCount > 0
      ? Math.round((metrics.activeSessionsCount / metrics.activeTablesCount) * 100)
      : 0;

  const ringConfigs = [
    { id: 'kpiRingActiveTables', percent: Math.max(12, activeRatio) },
    { id: 'kpiRingStations', percent: Math.max(12, metrics.occupancyPercent) },
    { id: 'kpiRingRevenue', percent: Math.max(15, gameShare) },
    { id: 'kpiRingSessions', percent: Math.max(15, sessionShare) },
    { id: 'kpiRingBuffet', percent: Math.max(15, buffetShare) },
  ];

  ringConfigs.forEach(({ id, percent }, idx) => {
    const circle = document.getElementById(id);
    if (!circle) return;
    const geom = computeCircularProgressGeometry(percent, miniRadius);
    circle.setAttribute('stroke-dasharray', String(geom.circumference));
    setTimeout(() => {
      circle.style.strokeDashoffset = String(geom.dashOffset);
    }, prefersReducedMotion ? 0 : 120 + idx * 70);
  });

  // Sync Sidebar "Today So Far" Goal Ring & Podium Pot
  const dailyTarget = 3000000;
  const goalPct = Math.min(100, Math.max(8, Math.round((metrics.totalRevenue / dailyTarget) * 100)));
  setText('mgTodayGoalPct', `${toPersianDigits(goalPct)}٪`);
  setText('mgTodayGoalAmount', `${formatToman(metrics.totalRevenue)} تومان`);
  setText(
    'mgTodayGoalSub',
    `${toPersianDigits(metrics.activeTablesCount)} میز فعال · هدف ۳ میلیون`
  );
  const todayRingArc = document.getElementById('mgTodayRingArc');
  if (todayRingArc) {
    const todayGeom = computeCircularProgressGeometry(goalPct, 18);
    todayRingArc.setAttribute('stroke-dasharray', String(todayGeom.circumference));
    requestAnimationFrame(() => {
      todayRingArc.style.strokeDashoffset = String(todayGeom.dashOffset);
    });
  }

  setText('mgPodiumTotalVal', `${formatToman(metrics.totalRevenue)} تومان`);
  if (metrics.buffetRevenue > 0) {
    setText('mgTargetBuffetVal', `${formatToman(metrics.buffetRevenue)} ت`);
  }
}

function renderAndAnimateCircularCharts(metrics) {
  const gaugeArc = document.getElementById('gaugeOccupancyArc');
  if (!gaugeArc) return;

  const gaugeRadius = 50;

  // 1. Occupancy Circular Progress Chart (r=50)
  const occDonut = computeDonutSegmentsGeometry(
    [
      {
        id: 'occupied',
        label: 'اشغال سالن',
        value: Math.max(1, metrics.occupiedStations),
        color: '#8B5CF6',
      },
      {
        id: 'free',
        label: 'ظرفیت آزاد',
        value: Math.max(0, metrics.availableStations),
        color: '#3F3F52',
      },
    ],
    gaugeRadius
  );
  const occGeom = computeCircularProgressGeometry(metrics.occupancyPercent, gaugeRadius);
  const freePct = Math.max(0, 100 - occGeom.clampedPercent);

  setText(
    'chartOccupancyDesc',
    `${toPersianDigits(metrics.occupiedStations)} ایستگاه مشغول از ${toPersianDigits(metrics.stationCapacity)} ایستگاه فعال`
  );
  setText(
    'legendOccupiedCount',
    `${toPersianDigits(metrics.occupiedStations)} میز (${toPersianDigits(occGeom.clampedPercent)}٪)`
  );
  setText(
    'legendFreeCount',
    `${toPersianDigits(metrics.availableStations)} میز (${toPersianDigits(freePct)}٪)`
  );

  const occBarEl = document.getElementById('occBarOccupied');
  const freeBarEl = document.getElementById('occBarFree');
  if (occBarEl) occBarEl.style.width = `${Math.max(8, occGeom.clampedPercent)}%`;
  if (freeBarEl) freeBarEl.style.width = `${Math.max(8, freePct)}%`;

  // 2. Revenue Breakdown Multi-Segment Donut Chart (Game vs Buffet, r=50)
  const revDonut = computeDonutSegmentsGeometry(
    [
      {
        id: 'game',
        label: 'سهم بازی',
        value: metrics.gameRevenue,
        formatted: `${formatToman(metrics.gameRevenue)} تومان`,
        color: '#10B981',
      },
      {
        id: 'buffet',
        label: 'سهم بوفه',
        value: metrics.buffetRevenue,
        formatted: `${formatToman(metrics.buffetRevenue)} تومان`,
        color: '#F59E0B',
      },
    ],
    gaugeRadius
  );

  const gameSeg = revDonut.segments[0];
  const buffetSeg = revDonut.segments[1];
  setText('chartRevenueDesc', `مجموع کل: ${formatToman(metrics.totalRevenue)} تومان`);
  setText('legendGameRev', `${formatToman(metrics.gameRevenue)} ت (${toPersianDigits(gameSeg.percent)}٪)`);
  setText('legendBuffetRev', `${formatToman(metrics.buffetRevenue)} ت (${toPersianDigits(buffetSeg.percent)}٪)`);

  const revBarGame = document.getElementById('revBarGame');
  const revBarBuffet = document.getElementById('revBarBuffet');
  if (revBarGame) revBarGame.style.width = `${Math.max(8, gameSeg.percent)}%`;
  if (revBarBuffet) revBarBuffet.style.width = `${Math.max(8, buffetSeg.percent)}%`;

  // 3. Active Sessions & Timers Multi-Segment Donut Chart (Running vs Ready, r=50)
  const sessDonut = computeDonutSegmentsGeometry(
    [
      {
        id: 'running',
        label: 'تایمر فعال',
        value: Math.max(0, metrics.activeSessionsCount),
        formatted: `${toPersianDigits(metrics.activeSessionsCount)} سشن فعال`,
        color: '#8B5CF6',
      },
      {
        id: 'waiting',
        label: 'آماده استارت',
        value: Math.max(0, metrics.waitingSessionsCount),
        formatted: `${toPersianDigits(metrics.waitingSessionsCount)} سشن آماده`,
        color: '#4B5563',
      },
    ],
    gaugeRadius
  );

  const runSeg = sessDonut.segments[0];
  const waitSeg = sessDonut.segments[1];
  setText(
    'chartSessionsDesc',
    `${toPersianDigits(metrics.activeSessionsCount)} تایمر در حال اجرا از ${toPersianDigits(metrics.activeTablesCount)} میز ثبت‌شده`
  );
  setText('legendRunningSessions', `${toPersianDigits(metrics.activeSessionsCount)} سشن (${toPersianDigits(runSeg.percent)}٪)`);
  setText('legendWaitingSessions', `${toPersianDigits(metrics.waitingSessionsCount)} سشن (${toPersianDigits(waitSeg.percent)}٪)`);

  const sessBarRunning = document.getElementById('sessBarRunning');
  const sessBarWaiting = document.getElementById('sessBarWaiting');
  if (sessBarRunning) sessBarRunning.style.width = `${Math.max(8, runSeg.percent)}%`;
  if (sessBarWaiting) sessBarWaiting.style.width = `${Math.max(8, waitSeg.percent)}%`;

  // Animate circular progress & donut segments immediately via requestAnimationFrame
  requestAnimationFrame(() => {
    // Chart 1: Occupancy Ring + Available Arc
    gaugeArc.setAttribute('stroke-dasharray', String(occGeom.circumference));
    gaugeArc.style.strokeDashoffset = String(occGeom.dashOffset);
    const availArc = document.getElementById('gaugeAvailableArc');
    if (availArc && occDonut.segments[1]) {
      availArc.style.strokeDasharray = occDonut.segments[1].dashArray;
      availArc.style.strokeDashoffset = String(occDonut.segments[1].dashOffset);
    }
    animateCountUp('gaugeOccupancyPercent', occGeom.clampedPercent, { suffix: '٪', duration: 1100 });

    // Chart 2: Revenue Donut
    const revEl0 = document.getElementById('donutRevSeg0');
    const revEl1 = document.getElementById('donutRevSeg1');
    if (revEl0 && revEl1) {
      revEl0.style.strokeDasharray = gameSeg.dashArray;
      revEl0.style.strokeDashoffset = String(gameSeg.dashOffset);
      revEl1.style.strokeDasharray = buffetSeg.dashArray;
      revEl1.style.strokeDashoffset = String(buffetSeg.dashOffset);
    }
    animateCountUp('donutRevCenterValue', gameSeg.percent, { suffix: '٪', duration: 1150 });
    setText('donutRevCenterLabel', 'سهم بازی');

    // Chart 3: Sessions Donut
    const sessEl0 = document.getElementById('donutSessSeg0');
    const sessEl1 = document.getElementById('donutSessSeg1');
    if (sessEl0 && sessEl1) {
      sessEl0.style.strokeDasharray = runSeg.dashArray;
      sessEl0.style.strokeDashoffset = String(runSeg.dashOffset);
      sessEl1.style.strokeDasharray = waitSeg.dashArray;
      sessEl1.style.strokeDashoffset = String(waitSeg.dashOffset);
    }
    animateCountUp('donutSessCenterValue', runSeg.percent, { suffix: '٪', duration: 1150 });
    setText('donutSessCenterLabel', 'تایمر فعال');
  });

  // Interactive Hover Highlighting for Donut Segments & Legends
  bindDonutHoverInteractions('revenueDonutSvg', 'revenueDonutLegend', revDonut.segments, 'donutRevCenterValue', 'donutRevCenterLabel');
  bindDonutHoverInteractions('sessionsDonutSvg', 'sessionsDonutLegend', sessDonut.segments, 'donutSessCenterValue', 'donutSessCenterLabel');

  // Occupancy Ring Legend Hover Highlight
  const occCard = document.getElementById('chartOccupancyCard');
  if (occCard) {
    occCard.querySelectorAll('[data-highlight-ring]').forEach((item) => {
      item.addEventListener('mouseenter', () => {
        const mode = item.getAttribute('data-highlight-ring');
        gaugeArc.classList.add('is-hovered');
        if (mode === 'free') {
          setText('gaugeOccupancyPercent', `${toPersianDigits(freePct)}٪`);
          setText('gaugeOccupancySub', 'ظرفیت آزاد');
        } else {
          setText('gaugeOccupancyPercent', `${toPersianDigits(occGeom.clampedPercent)}٪`);
          setText('gaugeOccupancySub', 'اشغال سالن');
        }
      });
      item.addEventListener('mouseleave', () => {
        gaugeArc.classList.remove('is-hovered');
        setText('gaugeOccupancyPercent', `${toPersianDigits(occGeom.clampedPercent)}٪`);
        setText('gaugeOccupancySub', 'اشغال سالن');
      });
    });
  }
}

function bindDonutHoverInteractions(svgId, legendId, segmentsData, centerValId, centerLabelId) {
  const svg = document.getElementById(svgId);
  const legend = document.getElementById(legendId);
  if (!svg || !segmentsData || segmentsData.length === 0) return;

  const segCircles = Array.from(svg.querySelectorAll('.mg-donut-segment'));
  const legendItems = legend ? Array.from(legend.querySelectorAll('.mg-legend-item')) : [];

  function highlightSegment(idx) {
    segCircles.forEach((c, i) => {
      c.classList.toggle('is-active-segment', i === idx);
      c.classList.toggle('is-dimmed-segment', i !== idx);
    });
    legendItems.forEach((li, i) => {
      li.classList.toggle('is-active', i === idx);
    });
    const seg = segmentsData[idx];
    if (seg) {
      setText(centerValId, `${toPersianDigits(seg.percent)}٪`);
      setText(centerLabelId, seg.label);
    }
  }

  function resetHighlight() {
    segCircles.forEach((c) => {
      c.classList.remove('is-active-segment', 'is-dimmed-segment');
    });
    legendItems.forEach((li) => li.classList.remove('is-active'));
    const primary = segmentsData[0];
    if (primary) {
      setText(centerValId, `${toPersianDigits(primary.percent)}٪`);
      setText(centerLabelId, primary.label);
    }
  }

  segCircles.forEach((circle, idx) => {
    circle.addEventListener('mouseenter', () => highlightSegment(idx));
    circle.addEventListener('mouseleave', resetHighlight);
  });

  legendItems.forEach((item, idx) => {
    item.addEventListener('mouseenter', () => highlightSegment(idx));
    item.addEventListener('mouseleave', resetHighlight);
  });
}

function restoreCachedBadges() {
  try {
    const cached = sessionStorage.getItem('mg_sidebar_badges');
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed.tables !== undefined) setText('navTablesBadge', toPersianDigits(parsed.tables));
    if (parsed.consoles !== undefined) setText('navConsolesBadge', toPersianDigits(parsed.consoles));
    if (parsed.customers !== undefined) setText('navCustomersBadge', toPersianDigits(parsed.customers));
    if (parsed.debtors !== undefined) setText('navDebtorsBadge', toPersianDigits(parsed.debtors));
    return parsed;
  } catch {
    return null;
  }
}

function getSharedBundle() {
  if (!window.__mgBundlePromise) {
    let cached = null;
    try {
      const raw = sessionStorage.getItem('mg_bundle_v1');
      if (raw) cached = JSON.parse(raw);
    } catch {
      cached = null;
    }

    const networkPromise = fetch('./bundle.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((bundle) => {
        if (bundle && typeof bundle === 'object') {
          try {
            sessionStorage.setItem('mg_bundle_v1', JSON.stringify(bundle));
          } catch {
            // ignore storage errors
          }
          return bundle;
        }
        return cached;
      })
      .catch(() => cached);

    window.__mgBundlePromise = cached ? Promise.resolve(cached) : networkPromise;
  }
  return window.__mgBundlePromise;
}

function fetchSharedJson(url, fallback) {
  const cleanKey = String(url).replace(/^\.\//, '');
  window.__mgJsonPromises = window.__mgJsonPromises || {};
  if (!window.__mgJsonPromises[url]) {
    window.__mgJsonPromises[url] = getSharedBundle()
      .then((bundle) => {
        if (bundle && cleanKey in bundle) return bundle[cleanKey];
        return fetch(url).then((r) => (r.ok ? r.json() : fallback));
      })
      .catch(() => fallback);
  }
  return window.__mgJsonPromises[url];
}

async function loadAndRenderKPIs() {
  const cachedBadges = restoreCachedBadges();
  const hasFullKpiWidgets = Boolean(document.getElementById('kpiActiveTables'));

  try {
    if (!hasFullKpiWidgets) {
      if (cachedBadges) return;
      const [dataRes, reservationsRes, debtPayRes, customerDataRes] = await Promise.all([
        fetchSharedJson('./data.json', { consoles: [] }),
        fetchSharedJson('./reservations.json', []),
        fetchSharedJson('./debtpay.json', []),
        fetchSharedJson('./customer_data.json', []),
      ]);
      const tablesCount = Array.isArray(reservationsRes) ? reservationsRes.length : 0;
      const consolesCount = Array.isArray(dataRes?.consoles) ? dataRes.consoles.length : 0;
      const customersCount = Array.isArray(customerDataRes)
        ? customerDataRes.length
        : customerDataRes && typeof customerDataRes === 'object'
        ? Object.keys(customerDataRes).length
        : 0;
      const debtorsCount = Array.isArray(debtPayRes) ? debtPayRes.length : 0;

      setText('navTablesBadge', toPersianDigits(tablesCount));
      setText('navConsolesBadge', toPersianDigits(consolesCount));
      setText('navCustomersBadge', toPersianDigits(customersCount));
      setText('navDebtorsBadge', toPersianDigits(debtorsCount));

      try {
        sessionStorage.setItem(
          'mg_sidebar_badges',
          JSON.stringify({
            tables: tablesCount,
            consoles: consolesCount,
            customers: customersCount,
            debtors: debtorsCount,
          })
        );
      } catch {
        // Ignore storage errors
      }
      return;
    }

    const [
      dataRes,
      reservationsRes,
      clickTimeRes,
      finishTimeRes,
      buffetTempRes,
      cashPayRes,
      creditPayRes,
      customerPayRes,
      debtPayRes,
      customerDataRes,
    ] = await Promise.all([
      fetchSharedJson('./data.json', { consoles: [] }),
      fetchSharedJson('./reservations.json', []),
      fetchSharedJson('./clickTime.json', []),
      fetchSharedJson('./finishTime.json', []),
      fetchSharedJson('./buffet_temporary.json', []),
      fetchSharedJson('./cashPay.json', []),
      fetchSharedJson('./creditpay.json', []),
      fetchSharedJson('./customerPay.json', []),
      fetchSharedJson('./debtpay.json', []),
      fetchSharedJson('./customer_data.json', []),
    ]);

    const metrics = computeDashboardMetrics({
      reservations: reservationsRes,
      consoles: dataRes?.consoles || [],
      clickTimes: clickTimeRes,
      finishTimes: finishTimeRes,
      buffetTemp: buffetTempRes,
      cashPay: cashPayRes,
      creditPay: creditPayRes,
      customerPay: customerPayRes,
      totalStations: 12,
    });

    const customersCount = Array.isArray(customerDataRes)
      ? customerDataRes.length
      : customerDataRes && typeof customerDataRes === 'object'
      ? Object.keys(customerDataRes).length
      : 0;
    const debtorsCount = Array.isArray(debtPayRes) ? debtPayRes.length : 0;

    // Update Sidebar Badges
    setText('navTablesBadge', toPersianDigits(metrics.activeTablesCount));
    setText('navConsolesBadge', toPersianDigits(metrics.consolesCount));
    setText('navCustomersBadge', toPersianDigits(customersCount));
    setText('navDebtorsBadge', toPersianDigits(debtorsCount));

    try {
      sessionStorage.setItem(
        'mg_sidebar_badges',
        JSON.stringify({
          tables: metrics.activeTablesCount,
          consoles: metrics.consolesCount,
          customers: customersCount,
          debtors: debtorsCount,
        })
      );
    } catch {
      // Ignore storage errors
    }

    // Update Top Status Strip with Smooth Count-Up
    animateCountUp('statusStripActiveTables', metrics.activeTablesCount, { duration: 900 });
    animateCountUp('statusStripFreeStations', metrics.availableStations, { duration: 950 });
    animateCountUp('statusStripOccupancy', metrics.occupancyPercent, { suffix: '٪', duration: 1000 });
    animateCountUp('statusStripOpenBuffet', metrics.activeBuffetTotal, {
      useCommas: true,
      suffix: ' تومان',
      duration: 1050,
    });

    // Update 5 KPI Summary Widgets with Smooth Count-Up
    // 1. Active Tables
    animateCountUp('kpiActiveTables', metrics.activeTablesCount, { duration: 950 });
    setText(
      'kpiActiveTablesSub',
      `${toPersianDigits(metrics.postpaidTablesCount)} پس‌کرایه · ${toPersianDigits(metrics.prepaidTablesCount)} پیش‌پرداخت`
    );

    // 2. Occupied vs Available Stations
    setText(
      'kpiStationsRatio',
      `${toPersianDigits(metrics.occupiedStations)} / ${toPersianDigits(metrics.stationCapacity)}`
    );
    setText(
      'kpiStationsSub',
      `${toPersianDigits(metrics.availableStations)} ایستگاه آزاد (${toPersianDigits(metrics.occupancyPercent)}٪ اشغال)`
    );

    // 3. Total / Today's Revenue
    animateCountUp('kpiTotalRevenue', metrics.totalRevenue, { useCommas: true, duration: 1300 });
    setText('kpiRevenueSub', `سهم بازی: ${formatToman(metrics.gameRevenue)} تومان`);

    // 4. Current Active Sessions
    animateCountUp('kpiActiveSessions', metrics.activeSessionsCount, { duration: 950 });
    setText(
      'kpiSessionsSub',
      metrics.waitingSessionsCount > 0
        ? `${toPersianDigits(metrics.waitingSessionsCount)} میز آماده استارت`
        : 'تمامی میزهای ثبت‌شده در حال اجرا'
    );

    // 5. Buffet Sales Summary
    animateCountUp('kpiBuffetRevenue', metrics.buffetRevenue, { useCommas: true, duration: 1200 });
    setText(
      'kpiBuffetSub',
      `${toPersianDigits(metrics.activeBuffetItemsCount)} سفارش باز (${formatToman(metrics.activeBuffetTotal)} تومان)`
    );

    // Active Table Counter Badge & Dedicated Tables View Banner Counters
    setText('activeTableFilteredCount', `${toPersianDigits(metrics.activeTablesCount)} میز فعال`);
    setText('tablesBannerActive', `${toPersianDigits(metrics.activeTablesCount)} میز`);
    setText('tablesBannerPostpaid', `${toPersianDigits(metrics.postpaidTablesCount)} میز`);
    setText('tablesBannerPrepaid', `${toPersianDigits(metrics.prepaidTablesCount)} میز`);
    setText('tablesBannerRunning', `${toPersianDigits(metrics.activeSessionsCount)} سشن`);

    // Render Overview Mini Active Stations Snapshot
    renderOverviewMiniStations(reservationsRes, clickTimeRes, finishTimeRes, buffetTempRes);

    // Animate KPI Mini Progress Rings & Main Circular/Donut Charts
    animateKpiMiniRings(metrics);
    renderAndAnimateCircularCharts(metrics);

    // Populate Notifications Dropdown
    const notifList = document.getElementById('mgNotifList');
    const notifCountEl = document.getElementById('mgNotifCount');
    if (notifList) {
      notifList.innerHTML = '';
      const alerts = [];

      if (Array.isArray(reservationsRes)) {
        reservationsRes.forEach((res) => {
          alerts.push({
            title: `میز ${toPersianDigits(res.tableNumber)} — ${getConsoleDisplayName(res.consoleType)}`,
            meta: res.prePayment === 'pre-payment' ? 'سشن پیش‌پرداخت فعال' : 'سشن پس‌کرایه فعال',
          });
        });
      }
      if (metrics.activeBuffetItemsCount > 0) {
        alerts.push({
          title: `${toPersianDigits(metrics.activeBuffetItemsCount)} سفارش بوفه روی میزهای فعال`,
          meta: `مجموع باز: ${formatToman(metrics.activeBuffetTotal)} تومان`,
        });
      }
      if (Array.isArray(debtPayRes) && debtPayRes.length > 0) {
        alerts.push({
          title: `${toPersianDigits(debtPayRes.length)} پرونده بدهکار ثبت‌شده`,
          meta: 'قابل مشاهده در بخش بدهکاران',
        });
      }

      if (notifCountEl) {
        notifCountEl.textContent = toPersianDigits(alerts.length);
      }

      if (alerts.length === 0) {
        notifList.innerHTML = '<li class="mg-notif-item">اعلان جدیدی وجود ندارد.</li>';
      } else {
        alerts.forEach((item) => {
          const li = document.createElement('li');
          li.className = 'mg-notif-item';
          li.innerHTML = `<strong>${item.title}</strong><span>${item.meta}</span>`;
          notifList.appendChild(li);
        });
      }
    }
  } catch (err) {
    console.warn('Dashboard metrics load warning:', err);
  }
}

/**
 * 5. Universal Exclamation (!) Tooltip System for All Field Labels, Cards, Charts & Headers
 * Hides inline muted descriptions across all pages and reveals them via an interactive '!' badge
 * on mouse hover (desktop) or finger hold/touch (mobile/tablet).
 */
const FIELD_HELP_DICTIONARY = {
  tableNumber: 'شماره میز یا ایستگاه بازی را وارد کنید (مثلاً ۱ تا ۱۲)',
  consoleType: 'نوع کنسول یا دستگاه متصل به این ایستگاه را انتخاب کنید',
  'pre-payment-cost': 'در حالت پیش‌پرداخت، مبلغ شارژ اولیه میز را به تومان وارد یا از دکمه‌های آماده انتخاب کنید',
  priceType: 'تعرفه محاسبه قیمت بر اساس تعداد بازیکنان و دسته‌های فعال',
  chargeTableSelect: 'میز فعالی که قصد تمدید زمان یا افزایش اعتبار آن را دارید انتخاب کنید',
  chargeAmount: 'مبلغ شارژ اضافه به تومان (به صورت خودکار به زمان بازی تبدیل می‌شود)',
  chargeTime: 'مدت زمان دلخواه به دقیقه جهت افزودن مستقیم به تایمر میز',
  buffetTableSelect: 'میز فعالی که سفارش خوراکی یا نوشیدنی برای آن ثبت می‌شود',
  productDropdown: 'خوراکی یا نوشیدنی مورد نظر را از لیست موجودی بوفه انتخاب کنید',
  quantity: 'تعداد اقلام سفارشی برای درج در فاکتور بوفه میز',
  priceForOne: 'نرخ یک ساعت بازی تک‌نفره (تک دسته) به تومان',
  priceForTwo: 'نرخ یک ساعت بازی دونفره (دو دسته) به تومان',
  priceForThree: 'نرخ یک ساعت بازی سه‌نفره (سه دسته) به تومان',
  priceForFour: 'نرخ یک ساعت بازی چهارنفره (چهار دسته) به تومان',
  'title-tag': 'نام کامل خوراکی یا نوشیدنی جهت نمایش در منوی بوفه',
  unitPrice: 'قیمت فروش هر واحد از این محصول به تومان',
  costomerName: 'نام و نام خانوادگی مشتری جهت ثبت در باشگاه و صدور کد اشتراک',
  acountCharge: 'مبلغ اعتبار اولیه کیف پول مشتری به تومان',
  editAcountCharge: 'مبلغی که به موجودی فعلی حساب مشتری اضافه می‌شود (به تومان)',
  debtName: 'نام کامل مشتری بدهکار جهت ثبت فاکتور در فهرست حساب‌های دفتری',
  customerId: 'کد اشتراک عضو باشگاه مشتریان جهت کسر مبلغ فاکتور از کیف پول',
  loginUsername: 'نام کاربری اختصاصی مدیر شیفت یا ادمین سیستم',
  loginPassword: 'گذرواژه امنیتی جهت ورود به پنل مدیریت گیم‌نت',
};

const LABEL_TEXT_HELP_FALLBACKS = [
  { match: 'نوع پرداخت', tip: 'پس‌کرایه برای محاسبه زمان باز تا پایان بازی و پیش‌پرداخت برای شارژ اولیه محدود است' },
  { match: 'انتخاب نوع دستگاه', tip: 'کنسول یا دستگاه مورد نظر را برای تعریف یا ویرایش تعرفه ساعتی انتخاب کنید' },
  { match: 'دسته‌بندی خوراکی', tip: 'گروه محصول را جهت تفکیک در منو و گزارش‌های مالی بوفه انتخاب کنید' },
];

const CARD_TITLE_HELP_FALLBACKS = [
  { match: 'میزهای فعال', tip: 'نمای سریع ایستگاه‌های در حال کار و وضعیت لحظه‌ای تایمرها' },
  { match: 'لیست محصولات موجود در بوفه', tip: 'فهرست تمامی خوراکی‌ها و نوشیدنی‌های ثبت‌شده همراه با قیمت واحد و امکان حذف' },
  { match: 'لیست کنسول‌ها و تعرفه‌های ثبت‌شده', tip: 'جدول نرخ‌های ساعتی تعریف‌شده برای هر کنسول از یک تا چهار بازیکن' },
  { match: 'لیست مشتریان و اعتبار باقیمانده', tip: 'فهرست اعضای باشگاه مشتریان، کد اشتراک و موجودی کیف پول هر عضو' },
  { match: 'فاکتور تسویه میز', tip: 'ریز کارکرد زمان بازی و سفارش‌های بوفه میز جهت تسویه نهایی' },
];

function createInfoBangButton(getTipTextFn) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mg-info-bang';
  btn.setAttribute('aria-label', 'مشاهده توضیحات راهنما');
  btn.innerHTML = `<span class="mg-info-bang-mark" aria-hidden="true">!</span>`;
  btn._getTipText = getTipTextFn;
  return btn;
}

function attachBangToTarget(targetEl, getTipTextFn) {
  if (!targetEl || targetEl.querySelector(':scope > .mg-info-bang')) return null;
  const btn = createInfoBangButton(getTipTextFn);
  targetEl.classList.add('mg-has-info-bang');
  targetEl.appendChild(btn);
  return btn;
}

function initExclamationTooltips() {
  // Remove any leftover Mario stage element if present
  document.querySelectorAll('#mgMarioStage, .mg-mario-stage').forEach((el) => el.remove());

  // 1. Create global floating tooltip popover
  let popover = document.getElementById('mgInfoBangPopover');
  if (!popover) {
    popover = document.createElement('div');
    popover.id = 'mgInfoBangPopover';
    popover.className = 'mg-info-bang-popover';
    popover.setAttribute('role', 'tooltip');
    popover.setAttribute('aria-hidden', 'true');
    document.body.appendChild(popover);
  }

  let activeBtn = null;
  let touchHideTimer = null;

  function showBangTooltip(btn) {
    if (!btn || typeof btn._getTipText !== 'function') return;
    if (touchHideTimer) {
      clearTimeout(touchHideTimer);
      touchHideTimer = null;
    }
    const text = (btn._getTipText() || '').replace(/^—\s*/, '').trim();
    if (!text) return;

    activeBtn = btn;
    btn.classList.add('is-active');
    popover.textContent = text;
    popover.classList.add('is-visible');
    popover.setAttribute('aria-hidden', 'false');

    const rect = btn.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    const margin = 10;

    let top = rect.top - popRect.height - 10;
    let placeBelow = false;
    if (top < margin) {
      top = rect.bottom + 10;
      placeBelow = true;
    }
    popover.classList.toggle('is-below', placeBelow);

    let left = rect.left + rect.width / 2 - popRect.width / 2;
    if (left < margin) left = margin;
    if (left + popRect.width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - popRect.width - margin);
    }

    popover.style.top = `${Math.round(top)}px`;
    popover.style.left = `${Math.round(left)}px`;
  }

  function hideBangTooltip(immediate = false) {
    if (touchHideTimer) {
      clearTimeout(touchHideTimer);
      touchHideTimer = null;
    }
    const doHide = () => {
      if (activeBtn) {
        activeBtn.classList.remove('is-active');
        activeBtn = null;
      }
      popover.classList.remove('is-visible');
      popover.setAttribute('aria-hidden', 'true');
    };
    if (immediate) {
      doHide();
    } else {
      touchHideTimer = setTimeout(doHide, 90);
    }
  }

  // Bind global Mouse Hover, Focus, and Touch Hold events once
  if (!window.__mgBangGlobalBound) {
    window.__mgBangGlobalBound = true;

    document.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.mg-info-bang');
      if (btn) {
        showBangTooltip(btn);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const btn = e.target.closest('.mg-info-bang');
      if (btn && !btn.contains(e.relatedTarget)) {
        hideBangTooltip(false);
      }
    });

    document.addEventListener('focusin', (e) => {
      const btn = e.target.closest('.mg-info-bang');
      if (btn) showBangTooltip(btn);
    });

    document.addEventListener('focusout', (e) => {
      const btn = e.target.closest('.mg-info-bang');
      if (btn) hideBangTooltip(true);
    });

    // Prevent label activation when clicking/holding on '!' inside a <label>
    document.addEventListener(
      'click',
      (e) => {
        const btn = e.target.closest('.mg-info-bang');
        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          showBangTooltip(btn);
        } else if (activeBtn) {
          hideBangTooltip(true);
        }
      },
      true
    );

    // Touch hold support for mobile/tablet devices
    document.addEventListener(
      'touchstart',
      (e) => {
        const btn = e.target.closest('.mg-info-bang');
        if (btn) {
          e.stopPropagation();
          showBangTooltip(btn);
        } else if (activeBtn) {
          hideBangTooltip(true);
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'touchend',
      (e) => {
        const btn = e.target.closest('.mg-info-bang');
        if (btn) {
          if (touchHideTimer) clearTimeout(touchHideTimer);
          touchHideTimer = setTimeout(() => hideBangTooltip(true), 1200);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        if (activeBtn) hideBangTooltip(true);
      },
      { passive: true }
    );
  }

  // 2. Convert Page Topbar Headings (.mg-page-heading)
  document.querySelectorAll('.mg-page-heading').forEach((headingBox) => {
    const h1 = headingBox.querySelector('h1');
    const p = headingBox.querySelector('p');
    if (p) {
      p.classList.add('mg-hint-source-hidden');
    }
    if (h1 && h1.id === 'mgTopbarTitle') {
      // Place '!' as sibling inside .mg-page-heading so setText('mgTopbarTitle') never overwrites it
      if (!headingBox.querySelector(':scope > .mg-info-bang')) {
        headingBox.classList.add('mg-has-info-bang-row');
        const btn = createInfoBangButton(() => {
          const sec = SPA_SECTIONS[currentSpaSectionKey];
          return (sec && sec.tip) || (p && p.textContent) || SPA_SECTIONS.overview.tip;
        });
        headingBox.appendChild(btn);
      }
    } else if (p && h1) {
      attachBangToTarget(h1, () => p.textContent);
    }
  });

  // 3. Convert KPI Card Footers (.mg-kpi-card)
  document.querySelectorAll('.mg-kpi-card').forEach((card) => {
    const label = card.querySelector('.mg-kpi-label');
    const footer = card.querySelector('.mg-kpi-footer');
    if (label && footer) {
      footer.classList.add('mg-hint-source-hidden');
      attachBangToTarget(label, () => footer.textContent);
    }
  });

  // 4. Convert Circular Donut Chart Descriptions (.mg-chart-card & .mg-income-chart-panel)
  document.querySelectorAll('.mg-chart-card').forEach((card) => {
    const title = card.querySelector('.mg-chart-title');
    const desc = card.querySelector('.mg-chart-desc');
    if (title && desc) {
      desc.classList.add('mg-hint-source-hidden');
      attachBangToTarget(title, () => desc.textContent);
    }
  });

  document.querySelectorAll('.mg-income-donut-header').forEach((header) => {
    const badge = header.querySelector('.mg-chart-badge');
    const hint = header.querySelector('.mg-income-donut-hint');
    if (badge && hint) {
      hint.classList.add('mg-hint-source-hidden');
      attachBangToTarget(badge, () => hint.textContent);
    }
  });

  // 5. Convert Tables Banner & Section Captions (.mg-tables-banner-sub & .mg-section-caption)
  document.querySelectorAll('.mg-tables-header-banner').forEach((banner) => {
    const title = banner.querySelector('.mg-tables-banner-title');
    const sub = banner.querySelector('.mg-tables-banner-sub');
    if (title && sub) {
      sub.classList.add('mg-hint-source-hidden');
      attachBangToTarget(title, () => sub.textContent);
    }
  });

  document.querySelectorAll('.mg-section-bar').forEach((bar) => {
    const heading = bar.querySelector('.mg-section-heading');
    const caption = bar.querySelector('.mg-section-caption');
    if (heading && caption) {
      caption.classList.add('mg-hint-source-hidden');
      attachBangToTarget(heading, () => caption.textContent);
    }
  });

  // 6. Convert All Card Subtitles (.mg-card-subtitle) & Remaining Card Titles
  document.querySelectorAll('.mg-card-subtitle').forEach((sub) => {
    sub.classList.add('mg-hint-source-hidden');
    const container = sub.parentElement;
    const title =
      (container && container.querySelector('.mg-card-title')) ||
      sub.closest('.mg-card-header, .mg-income-filter-bar')?.querySelector('.mg-card-title');
    if (title) {
      attachBangToTarget(title, () => sub.textContent);
    }
  });

  document.querySelectorAll('.mg-card-title').forEach((title) => {
    if (title.querySelector('.mg-info-bang')) return;
    const text = title.textContent.trim();
    const found = CARD_TITLE_HELP_FALLBACKS.find((item) => text.includes(item.match));
    if (found) {
      attachBangToTarget(title, () => found.tip);
    }
  });

  // 7. Add '!' Tooltip to Every Form Field Label (.mg-form-group .mg-label) Across All Pages
  document.querySelectorAll('.mg-form-group .mg-label, .mg-label').forEach((label) => {
    if (label.querySelector('.mg-info-bang')) return;
    const forId = label.getAttribute('for') || '';
    const group = label.closest('.mg-form-group');
    const control =
      (forId && document.getElementById(forId)) ||
      (group && group.querySelector('input, select, textarea'));
    const controlId = (control && control.id) || forId;

    let tipText = FIELD_HELP_DICTIONARY[controlId] || '';
    if (!tipText) {
      const rawLabel = label.textContent.trim();
      const matched = LABEL_TEXT_HELP_FALLBACKS.find((f) => rawLabel.includes(f.match));
      if (matched) {
        tipText = matched.tip;
      } else if (control && control.getAttribute('placeholder')) {
        tipText = `راهنما: ${control.getAttribute('placeholder')}`;
      } else {
        tipText = `تکمیل یا انتخاب مقدار برای فیلد «${rawLabel.replace(/[:：]/g, '')}»`;
      }
    }

    attachBangToTarget(label, () => tipText);
  });

  // 8. Invoice Payment Section & Login Subtitle
  const invoicePayHeading = document.querySelector('.invoice h3');
  if (invoicePayHeading) {
    const helperP = invoicePayHeading.parentElement?.querySelector('p');
    if (helperP) {
      helperP.classList.add('mg-hint-source-hidden');
      attachBangToTarget(invoicePayHeading, () => helperP.textContent);
    }
  }

  const loginCard = document.querySelector('main.mg-card h1');
  if (loginCard) {
    const loginSub = loginCard.parentElement?.querySelector('p');
    if (loginSub) {
      loginSub.classList.add('mg-hint-source-hidden');
      attachBangToTarget(loginCard, () => loginSub.textContent);
    }
  }
}

/* ==========================================================================
   SITE-WIDE PERSIAN FONT SWITCHER (Vazirmatn RD UI FD / Vazirmatn UI FD / Yekan)
   ========================================================================== */
function applySiteFont(fontKey) {
  const validKey = ['vazirmatn-classic', 'vazirmatn-rd', 'yekan'].includes(fontKey)
    ? fontKey
    : 'vazirmatn-classic';
  document.documentElement.setAttribute('data-font', validKey);
  try {
    localStorage.setItem('mg_site_font_v2', validKey);
  } catch {
    // ignore storage errors
  }
}

function initFontSwitcher() {
  applySiteFont('vazirmatn-classic');
}

/* ==========================================================================
   DUAL-THEME SYSTEM (DARK MODE & SOFT LIGHT GAMING DASHBOARD MODE)
   WITH CIRCULAR REVEAL VIEW-TRANSITION & 3D ICON MORPH ANIMATION
   ========================================================================== */
const THEME_STORAGE_KEY = 'mg_theme_v1';
let themeTransitionTimer = null;

function getSavedSiteTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage errors
  }
  const currentAttr = document.documentElement.getAttribute('data-theme');
  return currentAttr === 'light' ? 'light' : 'dark';
}

function buildThemeToggleIconsMarkup() {
  return `
    <span class="mg-theme-icon-stage" aria-hidden="true">
      <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </span>
  `;
}

function syncThemeToggleButtons(theme) {
  const isLight = theme === 'light';
  const label = isLight ? 'تغییر به حالت تیره (Dark Mode)' : 'تغییر به حالت روشن (Light Mode)';
  document.querySelectorAll('#mgThemeToggleBtn, .mg-theme-toggle-btn').forEach((btn) => {
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  });
}

function getThemeToggleOrigin(triggerEvent = null) {
  const btn = document.getElementById('mgThemeToggleBtn') || document.querySelector('.mg-theme-toggle-btn');
  if (btn) {
    const rect = btn.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        btn,
      };
    }
  }
  if (triggerEvent && typeof triggerEvent.clientX === 'number' && triggerEvent.clientX > 0) {
    return {
      x: Math.round(triggerEvent.clientX),
      y: Math.round(triggerEvent.clientY),
      btn,
    };
  }
  return {
    x: 64,
    y: 36,
    btn,
  };
}

function spawnThemeWaveOverlay(x, y, maxRadius, targetTheme) {
  if (prefersReducedMotion || !document.body) return;
  let wave = document.getElementById('mgThemeWaveOverlay');
  if (wave) wave.remove();

  wave = document.createElement('div');
  wave.id = 'mgThemeWaveOverlay';
  wave.className = `mg-theme-wave-overlay to-${targetTheme}`;
  wave.style.setProperty('--wave-x', `${x}px`);
  wave.style.setProperty('--wave-y', `${y}px`);
  wave.style.setProperty('--wave-r', `${Math.ceil(maxRadius)}px`);
  document.body.appendChild(wave);

  if (typeof wave.animate === 'function') {
    const anim = wave.animate(
      [
        {
          transform: 'translate(-50%, -50%) scale(0.02)',
          opacity: 0.78,
        },
        {
          transform: 'translate(-50%, -50%) scale(0.65)',
          opacity: 0.38,
          offset: 0.6,
        },
        {
          transform: 'translate(-50%, -50%) scale(1.06)',
          opacity: 0,
        },
      ],
      {
        duration: 540,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );
    anim.onfinish = () => wave.remove();
  } else {
    setTimeout(() => wave.remove(), 550);
  }
}

function commitThemeDomState(validTheme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', validTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  } catch {
    // ignore storage errors
  }
  syncThemeToggleButtons(validTheme);
  try {
    window.dispatchEvent(new CustomEvent('mg:theme-changed', { detail: { theme: validTheme } }));
  } catch {
    // ignore
  }
}

function applySiteTheme(themeKey, options = {}) {
  const validTheme = themeKey === 'light' ? 'light' : 'dark';
  const root = document.documentElement;

  if (!options.animate || prefersReducedMotion) {
    commitThemeDomState(validTheme);
    return;
  }

  const { x, y, btn } = getThemeToggleOrigin(options.event);
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  if (btn) {
    btn.classList.remove('is-animating-theme');
    void btn.offsetWidth;
    btn.classList.add('is-animating-theme');
    setTimeout(() => btn.classList.remove('is-animating-theme'), 560);
  }

  root.classList.add('is-theme-switching');
  if (themeTransitionTimer) clearTimeout(themeTransitionTimer);
  themeTransitionTimer = setTimeout(() => {
    root.classList.remove('is-theme-switching');
    root.classList.remove('is-theme-vt-active');
    themeTransitionTimer = null;
  }, 560);

  spawnThemeWaveOverlay(x, y, maxRadius, validTheme);

  if (typeof document.startViewTransition === 'function') {
    try {
      root.classList.add('is-theme-vt-active');
      const transition = document.startViewTransition(() => {
        commitThemeDomState(validTheme);
      });
      transition.ready
        .then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${Math.ceil(maxRadius)}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 500,
              easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        })
        .catch(() => {
          root.classList.remove('is-theme-vt-active');
        });
      transition.finished
        .then(() => {
          root.classList.remove('is-theme-vt-active');
        })
        .catch(() => {
          root.classList.remove('is-theme-vt-active');
        });
      return;
    } catch {
      root.classList.remove('is-theme-vt-active');
    }
  }

  commitThemeDomState(validTheme);
}

function toggleSiteTheme(triggerEvent = null) {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  applySiteTheme(next, { animate: true, event: triggerEvent });
}

function initThemeSwitcher() {
  const initialTheme = getSavedSiteTheme();
  applySiteTheme(initialTheme, { animate: false });

  const topbarLeft = document.querySelector('.mg-topbar-left');
  let toggleBtn = document.getElementById('mgThemeToggleBtn');

  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.id = 'mgThemeToggleBtn';
    toggleBtn.innerHTML = buildThemeToggleIconsMarkup();

    if (topbarLeft) {
      toggleBtn.className = 'mg-icon-btn mg-theme-toggle-btn';
      const notifWrap = topbarLeft.querySelector('.mg-notification-wrap');
      if (notifWrap) {
        topbarLeft.insertBefore(toggleBtn, notifWrap);
      } else {
        topbarLeft.appendChild(toggleBtn);
      }
    } else {
      // Standalone page without topbar (e.g. login.html)
      toggleBtn.className = 'mg-icon-btn mg-theme-toggle-btn mg-floating-theme-toggle';
      document.body.appendChild(toggleBtn);
    }
  } else if (!toggleBtn.querySelector('.mg-theme-icon-stage')) {
    toggleBtn.innerHTML = buildThemeToggleIconsMarkup();
  }

  syncThemeToggleButtons(initialTheme);

  if (!toggleBtn.dataset.themeBound) {
    toggleBtn.dataset.themeBound = '1';
    toggleBtn.addEventListener('click', (e) => {
      toggleSiteTheme(e);
    });
  }
}

/* ==========================================================================
   FLUID 60FPS SPRING-PHYSICS SIDEBAR INDICATOR + COLLAPSIBLE RAIL
   ========================================================================== */
function animateHeadingWords(elId, newText) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (newText !== undefined) {
    el.textContent = String(newText);
  }
}

let lastPillTop = null;
let committedPillTop = null;
const pillSpringState = {
  currentY: null,
  targetY: null,
  velocityY: 0,
  currentH: 42,
  targetH: 42,
  rafId: null,
  lastTs: 0,
};

const NAV_ICON_SVGS = {
  overview: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  tables: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="12" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/></svg>`,
  console: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="4"/></svg>`,
  buffet: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
  accounts: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  debtors: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`,
  income: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
};

function buildHamburgerToggleMarkup() {
  return `
    <span class="mg-hamburger-box" aria-hidden="true">
      <span class="mg-hm-bar bar-1"></span>
      <span class="mg-hm-bar bar-2"></span>
      <span class="mg-hm-bar bar-3"></span>
    </span>
  `;
}

function stepPillSpringFrame(ts) {
  const pill = document.getElementById('mgNavSlidingPill');
  if (!pill || pillSpringState.targetY === null) {
    pillSpringState.rafId = null;
    return;
  }

  const dt = pillSpringState.lastTs
    ? Math.min(0.032, Math.max(0.004, (ts - pillSpringState.lastTs) / 1000))
    : 1 / 60;
  pillSpringState.lastTs = ts;

  // Critically-damped spring parameters (omega_0 = 21 rad/s -> fast, silky, zero jitter)
  const stiffness = 440;
  const damping = 39;

  const disp = pillSpringState.currentY - pillSpringState.targetY;
  const springForce = -stiffness * disp;
  const dampingForce = -damping * pillSpringState.velocityY;
  const accel = springForce + dampingForce;

  pillSpringState.velocityY += accel * dt;
  pillSpringState.currentY += pillSpringState.velocityY * dt;
  pillSpringState.currentH += (pillSpringState.targetH - pillSpringState.currentH) * Math.min(1, dt * 22);

  // Subtle organic squash & stretch proportional to instantaneous velocity
  const speed = Math.abs(pillSpringState.velocityY);
  const stretchRatio = Math.min(0.14, speed / 2600);
  const scaleY = 1 + stretchRatio;
  const scaleX = 1 - stretchRatio * 0.24;

  pill.style.height = `${pillSpringState.currentH.toFixed(1)}px`;
  pill.style.transform = `translate3d(0, ${pillSpringState.currentY.toFixed(2)}px, 0) scaleX(${scaleX.toFixed(3)}) scaleY(${scaleY.toFixed(3)})`;

  if (
    Math.abs(pillSpringState.targetY - pillSpringState.currentY) < 0.25 &&
    Math.abs(pillSpringState.velocityY) < 4 &&
    Math.abs(pillSpringState.targetH - pillSpringState.currentH) < 0.25
  ) {
    pillSpringState.currentY = pillSpringState.targetY;
    pillSpringState.currentH = pillSpringState.targetH;
    pillSpringState.velocityY = 0;
    pillSpringState.rafId = null;
    pillSpringState.lastTs = 0;
    pill.style.height = `${pillSpringState.targetH}px`;
    pill.style.transform = `translate3d(0, ${pillSpringState.targetY}px, 0) scaleX(1) scaleY(1)`;
    return;
  }

  pillSpringState.rafId = requestAnimationFrame(stepPillSpringFrame);
}

function syncSidebarSlidingPill(hoverItem = null, options = {}) {
  const navList = document.querySelector('.mg-nav-list');
  if (!navList) return;

  let pill = document.getElementById('mgNavSlidingPill');
  if (!pill) {
    pill = document.createElement('div');
    pill.id = 'mgNavSlidingPill';
    pill.className = 'mg-nav-sliding-pill';
    pill.setAttribute('aria-hidden', 'true');
    navList.insertBefore(pill, navList.firstChild);
  }

  const allItems = navList.querySelectorAll('.mg-nav-item');
  const activeItem = navList.querySelector('.mg-nav-item.active');
  const target = hoverItem || activeItem;

  allItems.forEach((item) => {
    item.classList.toggle('is-pill-target', item === target);
  });

  if (!target) {
    pill.style.opacity = '0';
    return;
  }

  const link = target.querySelector('a') || target;
  const nextTop = target.offsetTop;
  const height = link.offsetHeight || 44;
  const isHoveringOther = Boolean(
    hoverItem && activeItem && hoverItem !== activeItem && !options.commitActive
  );

  pill.classList.toggle('is-hover-preview', isHoveringOther);
  navList.classList.toggle('is-pill-elsewhere', isHoveringOther);
  pill.style.opacity = '1';

  // Restore previous pill position across full-page navigations if needed
  if (pillSpringState.currentY === null) {
    let initialY = nextTop;
    try {
      const savedPrev = sessionStorage.getItem('mg_prev_pill_top');
      if (savedPrev !== null && savedPrev !== '') {
        const parsed = Number(savedPrev);
        if (Number.isFinite(parsed)) {
          initialY = parsed;
        }
        sessionStorage.removeItem('mg_prev_pill_top');
      }
    } catch {
      // ignore
    }
    pillSpringState.currentY = initialY;
    pillSpringState.currentH = height;
  }

  lastPillTop = nextTop;
  if (!hoverItem || options.commitActive || target === activeItem) {
    committedPillTop = activeItem ? activeItem.offsetTop : nextTop;
  }

  pillSpringState.targetY = nextTop;
  pillSpringState.targetH = height;

  if (
    prefersReducedMotion ||
    options.instant === true ||
    (Math.abs(nextTop - pillSpringState.currentY) < 0.5 && Math.abs(pillSpringState.velocityY) < 2)
  ) {
    if (pillSpringState.rafId) {
      cancelAnimationFrame(pillSpringState.rafId);
      pillSpringState.rafId = null;
    }
    pillSpringState.currentY = nextTop;
    pillSpringState.currentH = height;
    pillSpringState.velocityY = 0;
    pillSpringState.lastTs = 0;
    pill.style.height = `${height}px`;
    pill.style.transform = `translate3d(0, ${nextTop}px, 0) scaleX(1) scaleY(1)`;
    return;
  }

  if (!pillSpringState.rafId) {
    pillSpringState.lastTs = 0;
    pillSpringState.rafId = requestAnimationFrame(stepPillSpringFrame);
  }
}

function triggerQuickNewAction() {
  switchSpaSection('tables', { updateHistory: true, scrollToTop: true }).then(() => {
    setTimeout(() => {
      const inputNum = document.getElementById('InputNumber');
      if (inputNum) {
        inputNum.focus();
        const card = inputNum.closest('.mg-card');
        if (card) {
          card.classList.remove('mg-flash-pulse');
          void card.offsetWidth;
          card.classList.add('mg-flash-pulse');
        }
      }
    }, 120);
  });
}

function initIgnaraSidebarFeatures() {
  const sidebar = document.getElementById('mgSidebar');
  if (!sidebar) return;

  // 1. Ensure fold button has the animated Hamburger / Collapse morphing bars
  const brand = sidebar.querySelector('.mg-brand');
  let foldBtn = document.getElementById('mgSidebarFoldBtn');
  if (brand && !foldBtn) {
    foldBtn = document.createElement('button');
    foldBtn.type = 'button';
    foldBtn.id = 'mgSidebarFoldBtn';
    foldBtn.className = 'mg-sidebar-fold-btn';
    foldBtn.setAttribute('aria-label', 'جمع و باز کردن منوی کناری');
    foldBtn.setAttribute('title', 'جمع / باز کردن منو [');
    brand.appendChild(foldBtn);
  }
  if (foldBtn) {
    foldBtn.innerHTML = buildHamburgerToggleMarkup();
  }

  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  if (mobileMenuBtn) {
    mobileMenuBtn.innerHTML = buildHamburgerToggleMarkup();
  }

  const navList = sidebar.querySelector('.mg-nav-list');
  if (navList && !document.getElementById('mgSidebarQuickNew')) {
    const newWrap = document.createElement('div');
    newWrap.className = 'mg-sidebar-new-wrap';
    newWrap.innerHTML = `
      <button type="button" id="mgSidebarQuickNew" class="mg-sidebar-new-btn" data-rail-tip="ثبت سریع میز جدید (N)">
        <span class="mg-sidebar-new-ico">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </span>
        <span class="mg-sidebar-new-label">ثبت سریع میز جدید</span>
        <kbd class="mg-kbd">N</kbd>
      </button>
    `;
    navList.parentNode.insertBefore(newWrap, navList);
  }

  // Ensure every nav link has .mg-nav-icon, .mg-nav-label, --nav-i stagger index, and data-rail-tip
  sidebar.querySelectorAll('.mg-nav-item').forEach((item, idx) => {
    item.style.setProperty('--nav-i', String(idx));
    const a = item.querySelector('a');
    if (!a) return;

    // Auto-inject icon on secondary pages if missing
    if (!a.querySelector('.mg-nav-icon')) {
      const href = (a.getAttribute('href') || '').toLowerCase();
      let iconKey = 'overview';
      if (href.includes('tables')) iconKey = 'tables';
      else if (href.includes('console')) iconKey = 'console';
      else if (href.includes('buffet')) iconKey = 'buffet';
      else if (href.includes('acount')) iconKey = 'accounts';
      else if (href.includes('debtor')) iconKey = 'debtors';
      else if (href.includes('income')) iconKey = 'income';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'mg-nav-icon';
      iconSpan.innerHTML = NAV_ICON_SVGS[iconKey] || NAV_ICON_SVGS.overview;
      a.insertBefore(iconSpan, a.firstChild);
    }

    const spans = Array.from(a.querySelectorAll(':scope > span'));
    spans.forEach((sp) => {
      if (!sp.classList.contains('mg-nav-icon') && !sp.classList.contains('mg-nav-badge')) {
        sp.classList.add('mg-nav-label');
        if (!a.getAttribute('data-rail-tip')) {
          a.setAttribute('data-rail-tip', sp.textContent.trim());
        }
      }
    });
  });

  // 2. Restore saved Rail state from localStorage & smoothly animate collapse/expand
  function setRailMode(isRail, animate = true) {
    document.documentElement.classList.toggle('is-rail', isRail);
    if (foldBtn) {
      foldBtn.classList.toggle('is-collapsed', isRail);
      foldBtn.setAttribute('aria-pressed', isRail ? 'true' : 'false');
      foldBtn.setAttribute('title', isRail ? 'باز کردن منو [' : 'جمع کردن منو [');
    }
    try {
      localStorage.setItem('mg_sidebar_rail', isRail ? '1' : '0');
    } catch {
      // ignore
    }
    if (!animate) {
      syncSidebarSlidingPill(null, { instant: true });
      return;
    }
    const start = performance.now();
    function trackCollapseFrame(now) {
      syncSidebarSlidingPill(null, { instant: true });
      if (now - start < 350) {
        requestAnimationFrame(trackCollapseFrame);
      }
    }
    requestAnimationFrame(trackCollapseFrame);
  }

  try {
    if (localStorage.getItem('mg_sidebar_rail') === '1') {
      setRailMode(true, false);
    }
  } catch {
    // ignore
  }

  if (foldBtn) {
    foldBtn.addEventListener('click', () => {
      const next = !document.documentElement.classList.contains('is-rail');
      setRailMode(next, true);
    });
  }

  // 3. Quick New button click
  const quickNewBtn = document.getElementById('mgSidebarQuickNew');
  if (quickNewBtn) {
    quickNewBtn.addEventListener('click', triggerQuickNewAction);
  }

  // 4. Fluid 60fps Spring-Physics Violet Pill hover, active & click tracking
  if (navList) {
    const items = Array.from(navList.querySelectorAll('.mg-nav-item'));
    items.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        syncSidebarSlidingPill(item, { animateStretch: true });
      });
      const link = item.querySelector('a');
      if (link) {
        link.addEventListener('click', () => {
          try {
            const originTop =
              pillSpringState.currentY !== null
                ? pillSpringState.currentY
                : committedPillTop !== null
                  ? committedPillTop
                  : lastPillTop;
            if (originTop !== null) {
              sessionStorage.setItem('mg_prev_pill_top', String(originTop));
            }
          } catch {
            // ignore
          }
        });
      }
    });
    navList.addEventListener('mouseleave', () => {
      syncSidebarSlidingPill(null, { animateStretch: true });
    });
    requestAnimationFrame(() => syncSidebarSlidingPill(null, { animateStretch: true, commitActive: true }));
    window.addEventListener('resize', () => syncSidebarSlidingPill(null, { instant: true }));
  }

  // 5. Floating RTL Tooltip in Rail Mode
  let railTip = document.getElementById('mgRailTooltip');
  if (!railTip) {
    railTip = document.createElement('div');
    railTip.id = 'mgRailTooltip';
    railTip.className = 'mg-rail-tooltip';
    railTip.setAttribute('role', 'tooltip');
    document.body.appendChild(railTip);
  }

  sidebar.addEventListener('mouseover', (e) => {
    if (!document.documentElement.classList.contains('is-rail')) {
      railTip.classList.remove('is-visible');
      return;
    }
    const target = e.target.closest('[data-rail-tip]');
    if (!target) return;
    const label = target.getAttribute('data-rail-tip');
    if (!label) return;

    const rect = target.getBoundingClientRect();
    railTip.textContent = label;
    railTip.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
    railTip.style.right = `${Math.round(window.innerWidth - rect.left + 10)}px`;
    railTip.classList.add('is-visible');
  });

  sidebar.addEventListener('mouseout', (e) => {
    const target = e.target.closest('[data-rail-tip]');
    if (target) {
      railTip.classList.remove('is-visible');
    }
  });

  // 6. Global Keyboard Shortcuts ('[' for sidebar rail toggle, 'N' for Quick New)
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    const isTyping =
      tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable;
    if (isTyping || e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === '[' || e.key === 'ج') {
      e.preventDefault();
      const next = !document.documentElement.classList.contains('is-rail');
      setRailMode(next, true);
    } else if (e.key === 'n' || e.key === 'N' || e.key === 'د') {
      e.preventDefault();
      triggerQuickNewAction();
    }
  });
}

function initCommandPalette() {
  if (document.getElementById('mgCmdModal')) return;

  const commands = [
    { title: 'خانه (پیشخوان و آمار لحظه‌ای)', sub: 'نمای کلی سالن، نمودارهای دایره‌ای و خلاصه میزهای فعال', action: () => switchSpaSection('overview'), kbd: 'G H' },
    { title: 'مدیریت میزها و تایمر سشن‌ها', sub: 'ثبت میز، شارژ مجدد، سفارش بوفه و فاکتور میزها', action: () => switchSpaSection('tables'), kbd: 'G T' },
    { title: 'ثبت سریع میز جدید', sub: 'پرش مستقیم به فرم راه‌اندازی ایستگاه جدید', action: () => triggerQuickNewAction(), kbd: 'N' },
    { title: 'مدیریت کنسول‌ها و تعرفه ساعتی', sub: 'تنظیم قیمت ساعتی PS5، PS4، سیستم PC و بیلیارد', action: () => switchSpaSection('console'), kbd: 'G C' },
    { title: 'مدیریت بوفه و خوراکی‌ها', sub: 'افزودن محصول جدید به بوفه و بروزرسانی موجودی', action: () => switchSpaSection('buffet'), kbd: 'G B' },
    { title: 'باشگاه مشتریان', sub: 'مدیریت لیست مشتریان و اشتراک‌ها', action: () => switchSpaSection('accounts'), kbd: 'G U' },
    { title: 'حساب بدهکاران', sub: 'پیگیری و تسویه حساب‌های دفتری', action: () => switchSpaSection('debtors'), kbd: 'G D' },
    { title: 'گزارش جامع درآمد و تحلیل مالی', sub: 'تفکیک فروش کنسول‌ها، بوفه و روش‌های پرداخت', action: () => switchSpaSection('income'), kbd: 'G I' },
    { title: 'تغییر پوسته (حالت روشن / حالت تیره)', sub: 'جابه‌جایی آنی بین تم تیره گیمینگ و تم روشن روزانه', action: () => toggleSiteTheme(), kbd: 'T' },
    { title: 'جمع / باز کردن منوی کناری (حالت فشرده)', sub: 'تغییر وضعیت سایدبار بین حالت کامل و آیکونی', action: () => document.getElementById('mgSidebarFoldBtn')?.click(), kbd: '[' },
  ];

  const modalWrap = document.createElement('div');
  modalWrap.id = 'mgCmdModal';
  modalWrap.className = 'mg-cmd-backdrop';
  modalWrap.setAttribute('hidden', '');
  modalWrap.innerHTML = `
    <div class="mg-cmd-dialog" role="dialog" aria-modal="true" aria-label="جستجوی سریع و فرمان‌ها">
      <div class="mg-cmd-input-row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="mgCmdInput" class="mg-cmd-input" placeholder="جستجوی بخش، عملیات، میز یا فرمان سریع..." autocomplete="off">
        <kbd class="mg-kbd">ESC</kbd>
      </div>
      <div class="mg-cmd-list" id="mgCmdList" role="listbox"></div>
    </div>
  `;
  document.body.appendChild(modalWrap);

  const cmdInput = document.getElementById('mgCmdInput');
  const cmdList = document.getElementById('mgCmdList');
  let activeIdx = 0;
  let filtered = commands.slice();

  function renderCmdList() {
    if (filtered.length === 0) {
      cmdList.innerHTML = `<div class="mg-cmd-empty">موردی مطابق جستجوی شما یافت نشد.</div>`;
      return;
    }
    cmdList.innerHTML = filtered
      .map(
        (cmd, idx) => `
        <button type="button" class="mg-cmd-item ${idx === activeIdx ? 'is-selected' : ''}" data-cmd-idx="${idx}" role="option" aria-selected="${idx === activeIdx}">
          <div class="mg-cmd-item-meta">
            <strong>${cmd.title}</strong>
            <span>${cmd.sub}</span>
          </div>
          <kbd class="mg-kbd">${cmd.kbd}</kbd>
        </button>
      `
      )
      .join('');
  }

  function openCmdModal() {
    modalWrap.removeAttribute('hidden');
    cmdInput.value = '';
    filtered = commands.slice();
    activeIdx = 0;
    renderCmdList();
    requestAnimationFrame(() => cmdInput.focus());
  }

  function closeCmdModal() {
    modalWrap.setAttribute('hidden', '');
  }

  cmdInput.addEventListener('input', () => {
    const q = cmdInput.value.trim().toLowerCase();
    filtered = q
      ? commands.filter(
          (c) => c.title.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q)
        )
      : commands.slice();
    activeIdx = 0;
    renderCmdList();
  });

  cmdList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cmd-idx]');
    if (!btn) return;
    const cmd = filtered[Number(btn.getAttribute('data-cmd-idx'))];
    closeCmdModal();
    if (cmd) cmd.action();
  });

  modalWrap.addEventListener('click', (e) => {
    if (e.target === modalWrap) closeCmdModal();
  });

  const kbdTrigger = document.getElementById('mgCmdTriggerBadge');
  if (kbdTrigger) {
    kbdTrigger.addEventListener('click', openCmdModal);
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (modalWrap.hasAttribute('hidden')) openCmdModal();
      else closeCmdModal();
      return;
    }
    if (modalWrap.hasAttribute('hidden')) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeCmdModal();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filtered.length > 0) {
        activeIdx = (activeIdx + 1) % filtered.length;
        renderCmdList();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filtered.length > 0) {
        activeIdx = (activeIdx - 1 + filtered.length) % filtered.length;
        renderCmdList();
      }
    } else if (e.key === 'Enter' && filtered[activeIdx]) {
      e.preventDefault();
      const chosen = filtered[activeIdx];
      closeCmdModal();
      chosen.action();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeSwitcher();
  initFontSwitcher();
  initLiveClock();
  initSidebarAndNotifications();
  initIgnaraSidebarFeatures();
  initIndexViewRouter();
  initCommandPalette();
  initQuickPresets();
  initTableSearchAndFilter();
  initButtonMicroInteractions();
  initScrollAndEntranceAnimations();
  initExclamationTooltips();
  animateHeadingWords('mgTopbarTitle');
  loadAndRenderKPIs();
});
