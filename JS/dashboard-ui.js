import {
  toPersianDigits,
  formatToman,
  getConsoleDisplayName,
  computeDashboardMetrics,
  computeCircularProgressGeometry,
  computeDonutSegmentsGeometry,
  interpolateCountUp,
  stepMarioState,
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
 * Dedicated View Router for index.html:
 * Cleanly separates "خانه (پیشخوان)" (Overview KPIs + Circular Charts + Quick Access)
 * from "میزها" (Table Registration + Recharge + Buffet Order + Active Tables Table).
 */
function switchIndexView(targetView, options = {}) {
  const overviewPane = document.getElementById('mgOverviewView');
  const tablesPane = document.getElementById('mgTablesView');
  if (!overviewPane || !tablesPane) return;

  const isTables = targetView === 'tables';
  const activePane = isTables ? tablesPane : overviewPane;
  const inactivePane = isTables ? overviewPane : tablesPane;

  inactivePane.classList.remove('is-active-view');
  inactivePane.setAttribute('hidden', '');

  activePane.removeAttribute('hidden');
  activePane.classList.remove('is-active-view');
  void activePane.offsetWidth;
  activePane.classList.add('is-active-view');

  // Update sidebar active item
  const navOverview = document.getElementById('navItemOverview');
  const navTables = document.getElementById('navItemTables');
  if (navOverview && navTables) {
    navOverview.classList.toggle('active', !isTables);
    navTables.classList.toggle('active', isTables);
  }

  // Update top view-switcher buttons
  document.querySelectorAll('.mg-view-switch-btn[data-switch-view]').forEach((btn) => {
    const btnView = btn.getAttribute('data-switch-view');
    const active = btnView === (isTables ? 'tables' : 'overview');
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  // Update Topbar Heading with concise minimal title
  if (isTables) {
    setText('mgTopbarTitle', 'مدیریت میزها');
  } else {
    setText('mgTopbarTitle', 'پیشخوان');
  }

  requestAnimationFrame(() => {
    syncSidebarSlidingPill(null, { animateStretch: true });
  });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('mgSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  if (options.updateHistory !== false) {
    const targetHash = isTables ? '#tables-section' : '#overview';
    if (window.location.hash !== targetHash) {
      try {
        history.replaceState(null, '', targetHash);
      } catch {
        window.location.hash = targetHash;
      }
    }
  }

  if (options.scrollToTop !== false) {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }
}

function initIndexViewRouter() {
  const overviewPane = document.getElementById('mgOverviewView');
  const tablesPane = document.getElementById('mgTablesView');
  if (!overviewPane || !tablesPane) return;

  function resolveInitialView() {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash === '#tables-section' || hash === '#tables') {
      try {
        sessionStorage.removeItem('mg_return_to_tables');
      } catch {
        // Ignore
      }
      return 'tables';
    }
    if (hash === '#overview') {
      try {
        sessionStorage.removeItem('mg_return_to_tables');
      } catch {
        // Ignore
      }
      return 'overview';
    }
    try {
      if (sessionStorage.getItem('mg_return_to_tables') === '1') {
        sessionStorage.removeItem('mg_return_to_tables');
        return 'tables';
      }
    } catch {
      // Ignore
    }
    return 'overview';
  }

  // Apply initial view immediately
  const initialView = resolveInitialView();
  switchIndexView(initialView, { updateHistory: initialView === 'tables', scrollToTop: false });

  // Bind clicks on sidebar view items & switch buttons
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-nav-view], [data-switch-view]');
    if (!trigger) return;
    const targetView =
      trigger.getAttribute('data-nav-view') || trigger.getAttribute('data-switch-view');
    if (targetView === 'overview' || targetView === 'tables') {
      e.preventDefault();
      switchIndexView(targetView, { updateHistory: true, scrollToTop: true });
      const focusTable = trigger.getAttribute('data-focus-table');
      if (focusTable && targetView === 'tables') {
        setTimeout(() => {
          const tableCard = document.getElementById('tables-section');
          if (tableCard) {
            tableCard.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
          }
        }, 120);
      }
    }
  });

  // Listen to hash changes (e.g., browser back/forward or external hash links)
  window.addEventListener('hashchange', () => {
    const hash = (window.location.hash || '').toLowerCase();
    if (hash === '#tables-section' || hash === '#tables') {
      switchIndexView('tables', { updateHistory: false, scrollToTop: true });
    } else if (hash === '#overview' || hash === '') {
      switchIndexView('overview', { updateHistory: false, scrollToTop: true });
    }
  });

  // Preserve 'tables' view across form submissions & AJAX reloads in میزها
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

  // Instant visual feedback on sidebar navigation list
  const navList = sidebar ? sidebar.querySelector('.mg-nav-list') : null;
  if (navList) {
    const links = Array.from(navList.querySelectorAll('.mg-nav-item a'));
    links.forEach((link) => {
      link.addEventListener('pointerdown', () => {
        navList.querySelectorAll('.mg-nav-item').forEach((li) => li.classList.remove('active'));
        link.closest('.mg-nav-item')?.classList.add('active');
      });
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
 * 5. Super Mario Decorative Pixel-Art Animation
 * Authentic 16x16 pixel-art SVG sprite character with 4 frames (walk-1, walk-2, walk-3, jump),
 * retro warp pipes, question blocks, and coin pop-ups along the bottom edge of the dashboard.
 */
function buildMarioSpriteSvg() {
  // Colors: Red (#EF4444), Blue (#2563EB), Skin (#FBBF24), Brown (#78350F), Gold (#FDE047)
  const headAndTorso = `
    <!-- Cap -->
    <rect x="4" y="1" width="6" height="1" fill="#EF4444"/>
    <rect x="3" y="2" width="9" height="1" fill="#EF4444"/>
    <!-- Hair, Face & Moustache -->
    <rect x="3" y="3" width="3" height="1" fill="#78350F"/>
    <rect x="6" y="3" width="4" height="1" fill="#FBBF24"/>
    <rect x="10" y="3" width="1" height="1" fill="#1E293B"/>
    <rect x="2" y="4" width="2" height="2" fill="#78350F"/>
    <rect x="4" y="4" width="1" height="1" fill="#FBBF24"/>
    <rect x="5" y="4" width="1" height="1" fill="#78350F"/>
    <rect x="6" y="4" width="5" height="1" fill="#FBBF24"/>
    <rect x="11" y="4" width="2" height="1" fill="#FBBF24"/>
    <rect x="4" y="5" width="5" height="1" fill="#FBBF24"/>
    <rect x="9" y="5" width="4" height="1" fill="#78350F"/>
    <rect x="4" y="6" width="7" height="1" fill="#FBBF24"/>
    <!-- Shirt & Overalls Torso -->
    <rect x="3" y="7" width="8" height="3" fill="#EF4444"/>
    <rect x="5" y="7" width="1" height="4" fill="#2563EB"/>
    <rect x="8" y="7" width="1" height="4" fill="#2563EB"/>
    <rect x="4" y="9" width="6" height="3" fill="#2563EB"/>
    <rect x="5" y="9" width="1" height="1" fill="#FDE047"/>
    <rect x="8" y="9" width="1" height="1" fill="#FDE047"/>
  `;

  return `
    <svg class="mg-mario-svg" viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">
      <!-- Frame 0: Walk Stride 1 -->
      <g class="mg-mario-frame frame-0">
        ${headAndTorso}
        <rect x="2" y="8" width="2" height="2" fill="#FBBF24"/>
        <rect x="10" y="8" width="2" height="2" fill="#FBBF24"/>
        <rect x="3" y="12" width="3" height="2" fill="#2563EB"/>
        <rect x="8" y="12" width="3" height="2" fill="#2563EB"/>
        <rect x="2" y="14" width="4" height="2" fill="#78350F"/>
        <rect x="8" y="14" width="4" height="2" fill="#78350F"/>
      </g>
      <!-- Frame 1: Walk Mid-Stride -->
      <g class="mg-mario-frame frame-1">
        ${headAndTorso}
        <rect x="3" y="8" width="2" height="2" fill="#FBBF24"/>
        <rect x="9" y="8" width="2" height="2" fill="#FBBF24"/>
        <rect x="5" y="12" width="4" height="2" fill="#2563EB"/>
        <rect x="4" y="14" width="5" height="2" fill="#78350F"/>
      </g>
      <!-- Frame 2: Walk Extended Stride -->
      <g class="mg-mario-frame frame-2">
        ${headAndTorso}
        <rect x="1" y="7" width="2" height="2" fill="#FBBF24"/>
        <rect x="11" y="8" width="2" height="2" fill="#FBBF24"/>
        <rect x="2" y="12" width="3" height="2" fill="#2563EB"/>
        <rect x="9" y="11" width="3" height="2" fill="#2563EB"/>
        <rect x="1" y="14" width="4" height="2" fill="#78350F"/>
        <rect x="10" y="13" width="4" height="2" fill="#78350F"/>
      </g>
      <!-- Frame 3: Classic Jump Pose (One Arm Raised) -->
      <g class="mg-mario-frame frame-3">
        ${headAndTorso}
        <rect x="11" y="5" width="2" height="3" fill="#FBBF24"/>
        <rect x="1" y="8" width="2" height="2" fill="#FBBF24"/>
        <rect x="2" y="11" width="3" height="2" fill="#2563EB"/>
        <rect x="9" y="11" width="4" height="2" fill="#2563EB"/>
        <rect x="1" y="13" width="3" height="2" fill="#78350F"/>
        <rect x="11" y="12" width="3" height="2" fill="#78350F"/>
      </g>
    </svg>
  `;
}

function initSuperMarioRunner() {
  let stage = document.getElementById('mgMarioStage');
  if (!stage) {
    const mainWrapper = document.querySelector('.mg-main-wrapper');
    if (!mainWrapper) return;
    stage = document.createElement('div');
    stage.id = 'mgMarioStage';
    stage.className = 'mg-mario-stage';
    stage.setAttribute('aria-hidden', 'true');
    mainWrapper.appendChild(stage);
  }

  stage.innerHTML = `
    <div class="mg-mario-track" id="mgMarioTrack">
      <!-- Left Retro Warp Pipe -->
      <div class="mg-mario-pipe pipe-left" title="پورتال رترو">
        <div class="mg-pipe-rim"></div>
        <div class="mg-pipe-body"></div>
      </div>

      <!-- Decorative Floating Pixel Question Blocks & Coins -->
      <div class="mg-mario-qblock qblock-1" data-qblock="1"><span>?</span><i class="mg-mario-coin"></i></div>
      <div class="mg-mario-qblock qblock-2" data-qblock="2"><span>?</span><i class="mg-mario-coin"></i></div>
      <div class="mg-mario-qblock qblock-3" data-qblock="3"><span>?</span><i class="mg-mario-coin"></i></div>

      <!-- Super Mario Pixel Character -->
      <div class="mg-mario-actor frame-idx-0" id="mgMarioActor">
        <div class="mg-mario-sprite-flip" id="mgMarioFlip">
          ${buildMarioSpriteSvg()}
        </div>
        <div class="mg-mario-shadow" id="mgMarioShadow"></div>
      </div>

      <!-- Right Retro Warp Pipe -->
      <div class="mg-mario-pipe pipe-right" title="پورتال رترو">
        <div class="mg-pipe-rim"></div>
        <div class="mg-pipe-body"></div>
      </div>

      <!-- Luminous Pixel Ground Strip -->
      <div class="mg-mario-ground"></div>
    </div>
  `;

  const track = document.getElementById('mgMarioTrack');
  const actor = document.getElementById('mgMarioActor');
  const flipEl = document.getElementById('mgMarioFlip');
  const shadowEl = document.getElementById('mgMarioShadow');
  const qblocks = Array.from(stage.querySelectorAll('.mg-mario-qblock'));

  if (!track || !actor || !flipEl) return;

  let state = {
    x: 56,
    y: 0,
    minX: 48,
    maxX: Math.max(180, track.clientWidth - 76),
    direction: 1,
    speed: 46,
    walkCycleTime: 0,
    timeSinceLastJump: 1.4,
    isJumping: false,
    jumpProgress: 0,
    jumpDuration: 0.62,
    jumpHeight: 16,
    jumpInterval: 5.2,
    frameIndex: 0,
  };

  window.addEventListener('resize', () => {
    state.maxX = Math.max(140, track.clientWidth - 76);
    if (state.x > state.maxX) state.x = state.maxX;
  });

  if (prefersReducedMotion) {
    actor.style.transform = `translate3d(120px, 0px, 0)`;
    return;
  }

  let lastTs = performance.now();

  function loop(now) {
    const dt = (now - lastTs) / 1000;
    lastTs = now;

    if (!document.hidden) {
      state.maxX = Math.max(140, track.clientWidth - 76);
      state = stepMarioState(state, dt);

      // Update position & direction with GPU-accelerated translate3d
      actor.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
      flipEl.style.transform = `scaleX(${state.direction})`;
      actor.className = `mg-mario-actor frame-idx-${state.frameIndex}`;

      if (shadowEl) {
        const shadowScale = state.isJumping ? Math.max(0.45, 1 + state.y / 48) : 1;
        shadowEl.style.transform = `scaleX(${shadowScale.toFixed(2)})`;
        shadowEl.style.opacity = String((shadowScale * 0.65).toFixed(2));
      }

      // Check if Mario jumped near any Question Block to trigger a playful block bump + coin pop
      if (state.isJumping && state.jumpProgress > 0.35 && state.jumpProgress < 0.62) {
        const trackRect = track.getBoundingClientRect();
        const marioCenterX = state.x + 16;
        qblocks.forEach((qb) => {
          if (qb.classList.contains('hit')) return;
          const qbRect = qb.getBoundingClientRect();
          const qbCenterX = qbRect.left - trackRect.left + qbRect.width / 2;
          if (Math.abs(marioCenterX - qbCenterX) < 38) {
            qb.classList.add('hit');
            setTimeout(() => qb.classList.remove('hit'), 750);
          }
        });
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
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
   FLUID SLIDING & STRETCHING ORANGE-RED SIDEBAR INDICATOR + COLLAPSIBLE RAIL
   ========================================================================== */
function animateHeadingWords(elId, newText) {
  const el = document.getElementById(elId);
  if (!el) return;
  if (newText !== undefined) {
    el.textContent = String(newText);
  }
}

let lastPillTop = null;
let activePillAnim = null;

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

  const activeItem = navList.querySelector('.mg-nav-item.active');
  const target = hoverItem || activeItem;
  if (!target) {
    pill.style.opacity = '0';
    return;
  }

  const link = target.querySelector('a') || target;
  const nextTop = target.offsetTop;
  const height = link.offsetHeight || 44;
  const isHoveringOther = Boolean(hoverItem && activeItem && hoverItem !== activeItem);

  pill.classList.toggle('is-hover-preview', isHoveringOther);
  navList.classList.toggle('is-pill-elsewhere', isHoveringOther);
  pill.style.opacity = '1';
  pill.style.height = `${height}px`;

  // Determine real-time current Y of the indicator (even if mid-flight!)
  let fromY = lastPillTop;
  if (fromY === null) {
    try {
      const savedPrev = sessionStorage.getItem('mg_prev_pill_top');
      if (savedPrev !== null && savedPrev !== '') {
        fromY = Number(savedPrev);
        sessionStorage.removeItem('mg_prev_pill_top');
      }
    } catch {
      // ignore
    }
  } else {
    const navRect = navList.getBoundingClientRect();
    const pillRect = pill.getBoundingClientRect();
    if (pillRect.height > 0 && navRect.height > 0) {
      fromY = pillRect.top - navRect.top + navList.scrollTop;
    }
  }

  lastPillTop = nextTop;

  if (
    prefersReducedMotion ||
    fromY === null ||
    !Number.isFinite(fromY) ||
    Math.abs(nextTop - fromY) < 2 ||
    options.instant === true
  ) {
    if (activePillAnim) {
      activePillAnim.cancel();
      activePillAnim = null;
    }
    pill.style.transform = `translate3d(0, ${nextTop}px, 0) scaleX(1) scaleY(1)`;
    return;
  }

  const deltaY = nextTop - fromY;
  const dist = Math.abs(deltaY);
  // Subtle vertical elongation proportional to travel distance (1.15x to 1.38x)
  const stretchY = Math.min(1.38, 1.14 + (dist / 220) * 0.24);
  const squashX = Math.max(0.955, 1 - (stretchY - 1) * 0.14);
  const overshootY = deltaY > 0 ? 1.8 : -1.8;

  if (typeof pill.animate === 'function') {
    if (activePillAnim) {
      activePillAnim.cancel();
    }
    pill.style.transform = `translate3d(0, ${nextTop}px, 0) scaleX(1) scaleY(1)`;
    activePillAnim = pill.animate(
      [
        {
          transform: `translate3d(0, ${fromY.toFixed(1)}px, 0) scaleX(1) scaleY(1)`,
          offset: 0,
        },
        {
          transform: `translate3d(0, ${(fromY + deltaY * 0.54).toFixed(1)}px, 0) scaleX(${squashX.toFixed(3)}) scaleY(${stretchY.toFixed(3)})`,
          offset: 0.44,
        },
        {
          transform: `translate3d(0, ${(nextTop + overshootY).toFixed(1)}px, 0) scaleX(1.008) scaleY(0.972)`,
          offset: 0.84,
        },
        {
          transform: `translate3d(0, ${nextTop.toFixed(1)}px, 0) scaleX(1) scaleY(1)`,
          offset: 1,
        },
      ],
      {
        duration: 310,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards',
      }
    );
    activePillAnim.onfinish = () => {
      pill.style.transform = `translate3d(0, ${nextTop}px, 0) scaleX(1) scaleY(1)`;
      activePillAnim = null;
    };
  } else {
    pill.style.transform = `translate3d(0, ${nextTop}px, 0) scaleX(1) scaleY(1)`;
  }
}

function triggerQuickNewAction() {
  const isIndex = Boolean(document.getElementById('mgTablesView'));
  if (isIndex) {
    switchIndexView('tables', { updateHistory: true, scrollToTop: true });
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
    }, 180);
  } else {
    window.location.href = 'index.html#tables-section';
  }
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

  // 4. Fluid Sliding & Stretching Orange-Red Pill hover, active & click tracking
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
            if (lastPillTop !== null) {
              sessionStorage.setItem('mg_prev_pill_top', String(lastPillTop));
            }
          } catch {
            // ignore
          }
          items.forEach((li) => li.classList.remove('active'));
          item.classList.add('active');
          syncSidebarSlidingPill(item, { animateStretch: true });
        });
      }
    });
    navList.addEventListener('mouseleave', () => {
      syncSidebarSlidingPill(null, { animateStretch: true });
    });
    requestAnimationFrame(() => syncSidebarSlidingPill(null, { animateStretch: true }));
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
    { title: 'خانه (پیشخوان و آمار لحظه‌ای)', sub: 'نمای کلی سالن، نمودارهای دایره‌ای و سکوی راندمان', action: () => (document.getElementById('mgOverviewView') ? switchIndexView('overview') : (window.location.href = 'index.html#overview')), kbd: 'G H' },
    { title: 'مدیریت میزها و تایمر سشن‌ها', sub: 'ثبت میز، شارژ مجدد، سفارش بوفه و فاکتور میزها', action: () => (document.getElementById('mgTablesView') ? switchIndexView('tables') : (window.location.href = 'index.html#tables-section')), kbd: 'G T' },
    { title: 'ثبت سریع میز جدید', sub: 'پرش مستقیم به فرم راه‌اندازی ایستگاه جدید', action: () => triggerQuickNewAction(), kbd: 'N' },
    { title: 'مدیریت کنسول‌ها و تعرفه ساعتی', sub: 'تنظیم قیمت ساعتی PS5، PS4، سیستم PC و بیلیارد', action: () => (window.location.href = 'console.html'), kbd: 'G C' },
    { title: 'مدیریت بوفه و خوراکی‌ها', sub: 'افزودن محصول جدید به بوفه و بروزرسانی موجودی', action: () => (window.location.href = 'buffet.html'), kbd: 'G B' },
    { title: 'باشگاه مشتریان', sub: 'مدیریت لیست مشتریان و اشتراک‌ها', action: () => (window.location.href = 'acounts.html'), kbd: 'G U' },
    { title: 'حساب بدهکاران', sub: 'پیگیری و تسویه حساب‌های دفتری', action: () => (window.location.href = 'Debtors.html'), kbd: 'G D' },
    { title: 'گزارش جامع درآمد و تحلیل مالی', sub: 'تفکیک فروش کنسول‌ها، بوفه و روش‌های پرداخت', action: () => (window.location.href = 'income.html'), kbd: 'G I' },
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
  initSuperMarioRunner();
  animateHeadingWords('mgTopbarTitle');
  loadAndRenderKPIs();
});
