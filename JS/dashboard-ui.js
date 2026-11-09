import {
  toPersianDigits,
  formatToman,
  getConsoleDisplayName,
  computeDashboardMetrics,
  computeCircularProgressGeometry,
  computeDonutSegmentsGeometry,
  interpolateCountUp,
  stepMarioState,
} from './dashboard-metrics.mjs';

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
  const duration = prefersReducedMotion ? 0 : options.duration ?? 1150;
  const suffix = options.suffix ?? '';
  const prefix = options.prefix ?? '';
  const useCommas = options.useCommas ?? false;

  const prevNumeric = Number(el.getAttribute('data-numeric-val') || 0);
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

  // Smooth animated scroll to #tables-section when clicking sidebar link
  document.querySelectorAll('a[href="#tables-section"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.getElementById('tables-section');
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        target.classList.add('card-highlight');
        setTimeout(() => target.classList.remove('card-highlight'), 1400);
      }
    });
  });
}

/**
 * 2 & 4. Staggered Card Entrance & Scroll-Reveal Animations
 */
function initScrollAndEntranceAnimations() {
  const revealTargets = document.querySelectorAll(
    '.mg-section-group, .mg-card, .x_panel, #ChargeModal .charge-modal-content, #myModal .modal-content, .mg-chart-card'
  );

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
  );

  revealTargets.forEach((el, idx) => {
    el.classList.add('mg-reveal-item');
    el.style.setProperty('--reveal-delay', `${Math.min(idx * 55, 280)}ms`);
    observer.observe(el);
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
}

function renderAndAnimateCircularCharts(metrics) {
  const gaugeArc = document.getElementById('gaugeOccupancyArc');
  if (!gaugeArc) return;

  // 1. Occupancy Circular Progress Chart (r=46)
  const occGeom = computeCircularProgressGeometry(metrics.occupancyPercent, 46);
  setText(
    'chartOccupancyDesc',
    `${toPersianDigits(metrics.occupiedStations)} ایستگاه مشغول از ${toPersianDigits(metrics.stationCapacity)} ایستگاه فعال`
  );
  setText('legendOccupiedCount', `${toPersianDigits(metrics.occupiedStations)} میز`);
  setText('legendFreeCount', `${toPersianDigits(metrics.availableStations)} میز`);

  // 2. Revenue Breakdown Multi-Segment Donut Chart (Game vs Buffet, r=46)
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
    46
  );

  const gameSeg = revDonut.segments[0];
  const buffetSeg = revDonut.segments[1];
  setText('chartRevenueDesc', `مجموع کل: ${formatToman(metrics.totalRevenue)} تومان`);
  setText('legendGameRev', `${formatToman(metrics.gameRevenue)} ت (${toPersianDigits(gameSeg.percent)}٪)`);
  setText('legendBuffetRev', `${formatToman(metrics.buffetRevenue)} ت (${toPersianDigits(buffetSeg.percent)}٪)`);

  // 3. Active Sessions & Timers Multi-Segment Donut Chart (Running vs Ready, r=46)
  const sessDonut = computeDonutSegmentsGeometry(
    [
      {
        id: 'running',
        label: 'تایمر روشن',
        value: metrics.activeSessionsCount,
        formatted: `${toPersianDigits(metrics.activeSessionsCount)} سشن فعال`,
        color: '#A855F7',
      },
      {
        id: 'waiting',
        label: 'آماده استارت',
        value: Math.max(0, metrics.waitingSessionsCount),
        formatted: `${toPersianDigits(metrics.waitingSessionsCount)} سشن آماده`,
        color: '#22D3EE',
      },
    ],
    46
  );

  const runSeg = sessDonut.segments[0];
  const waitSeg = sessDonut.segments[1];
  setText(
    'chartSessionsDesc',
    `${toPersianDigits(metrics.activeSessionsCount)} تایمر در حال اجرا از ${toPersianDigits(metrics.activeTablesCount)} میز ثبت‌شده`
  );
  setText('legendRunningSessions', `${toPersianDigits(metrics.activeSessionsCount)} سشن (${toPersianDigits(runSeg.percent)}٪)`);
  setText('legendWaitingSessions', `${toPersianDigits(metrics.waitingSessionsCount)} سشن (${toPersianDigits(waitSeg.percent)}٪)`);

  // Trigger smooth 0% -> target% fill and count-up when charts become visible
  const chartsSection = document.querySelector('.mg-charts-grid');
  const runChartFill = () => {
    // Chart 1: Occupancy Ring
    gaugeArc.setAttribute('stroke-dasharray', String(occGeom.circumference));
    gaugeArc.style.strokeDashoffset = String(occGeom.dashOffset);
    animateCountUp('gaugeOccupancyPercent', occGeom.clampedPercent, { suffix: '٪', duration: 1200 });

    // Chart 2: Revenue Donut
    const revEl0 = document.getElementById('donutRevSeg0');
    const revEl1 = document.getElementById('donutRevSeg1');
    if (revEl0 && revEl1) {
      revEl0.style.strokeDasharray = gameSeg.dashArray;
      revEl0.style.strokeDashoffset = String(gameSeg.dashOffset);
      revEl1.style.strokeDasharray = buffetSeg.dashArray;
      revEl1.style.strokeDashoffset = String(buffetSeg.dashOffset);
    }
    animateCountUp('donutRevCenterValue', gameSeg.percent, { suffix: '٪', duration: 1250 });
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
    animateCountUp('donutSessCenterValue', runSeg.percent, { suffix: '٪', duration: 1250 });
    setText('donutSessCenterLabel', 'تایمر فعال');
  };

  if (!prefersReducedMotion && chartsSection && 'IntersectionObserver' in window) {
    const chartObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(runChartFill, 90);
            chartObs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    chartObs.observe(chartsSection);
  } else {
    runChartFill();
  }

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
          setText('gaugeOccupancyPercent', `${toPersianDigits(100 - occGeom.clampedPercent)}٪`);
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

function fetchSharedJson(url, fallback) {
  window.__mgJsonPromises = window.__mgJsonPromises || {};
  if (!window.__mgJsonPromises[url]) {
    window.__mgJsonPromises[url] = fetch(url)
      .then((r) => (r.ok ? r.json() : fallback))
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

    // Active Table Counter Badge
    setText('activeTableFilteredCount', `${toPersianDigits(metrics.activeTablesCount)} میز فعال`);

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
    speed: 66,
    walkCycleTime: 0,
    timeSinceLastJump: 1.4,
    isJumping: false,
    jumpProgress: 0,
    jumpDuration: 0.62,
    jumpHeight: 26,
    jumpInterval: 3.4,
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

document.addEventListener('DOMContentLoaded', () => {
  initLiveClock();
  initSidebarAndNotifications();
  initQuickPresets();
  initTableSearchAndFilter();
  initButtonMicroInteractions();
  initScrollAndEntranceAnimations();
  initSuperMarioRunner();
  loadAndRenderKPIs();
});
