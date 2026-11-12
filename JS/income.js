import {
  toPersianDigits,
  formatToman,
  computeCircularProgressGeometry,
  computeDonutSegmentsGeometry,
  interpolateCountUp,
  computeIncomeReportMetrics,
} from './dashboard-metrics.mjs?v=20261109-3';

const CONSOLE_META = [
  { key: 'ps4', label: 'پلی‌استیشن ۴', color: '#8B5CF6', lightColor: '#6D28D9', dotClass: 'dot-purple' },
  { key: 'ps50', label: 'پلی‌استیشن ۵', color: '#A78BFA', lightColor: '#4F46E5', dotClass: 'dot-indigo' },
  { key: 'xbox', label: 'ایکس‌باکس', color: '#6D28D9', lightColor: '#8B5CF6', dotClass: 'dot-purple' },
  { key: 'computer', label: 'سیستم PC', color: '#10B981', lightColor: '#0D9488', dotClass: 'dot-emerald' },
  { key: 'jewelry', label: 'وی‌آر / VIP', color: '#F59E0B', lightColor: '#6366F1', dotClass: 'dot-indigo' },
  { key: 'foosball', label: 'فوتبال دستی', color: '#64748B', lightColor: '#64748B', dotClass: 'dot-slate' },
];

const BUFFET_META = [
  { key: 'cold_drink', label: 'نوشیدنی سرد', color: '#8B5CF6', lightColor: '#6D28D9', dotClass: 'dot-purple' },
  { key: 'fastfood', label: 'فست‌فود و ساندویچ', color: '#F59E0B', lightColor: '#4F46E5', dotClass: 'dot-indigo' },
  { key: 'snack', label: 'اسنک و تنقلات', color: '#A78BFA', lightColor: '#8B5CF6', dotClass: 'dot-purple' },
  { key: 'hot_drink', label: 'نوشیدنی گرم', color: '#10B981', lightColor: '#0D9488', dotClass: 'dot-emerald' },
  { key: 'other', label: 'سایر اقلام', color: '#64748B', lightColor: '#64748B', dotClass: 'dot-slate' },
];

const PAYMENT_META = [
  { key: 'credit', label: 'کارتخوان (POS)', color: '#8B5CF6', lightColor: '#6D28D9', dotClass: 'dot-purple' },
  { key: 'cash', label: 'دریافتی نقدی', color: '#10B981', lightColor: '#0D9488', dotClass: 'dot-emerald' },
  { key: 'account', label: 'حساب کاربری', color: '#64748B', lightColor: '#4F46E5', dotClass: 'dot-indigo' },
];

function isLightModeActive() {
  return document.documentElement.getAttribute('data-theme') === 'light';
}

function getMetaColor(metaItem) {
  return isLightModeActive() && metaItem.lightColor ? metaItem.lightColor : metaItem.color;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function animateNumber(id, targetValue, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = Math.max(0, Math.round(Number(targetValue) || 0));
  const duration = options.duration ?? 950;
  const suffix = options.suffix ?? '';
  const useCommas = options.useCommas ?? true;

  const prev = Number(el.getAttribute('data-val') || 0);
  el.setAttribute('data-val', String(target));

  const format = (v) => `${useCommas ? formatToman(v) : toPersianDigits(v)}${suffix}`;
  if (prev === target) {
    el.textContent = format(target);
    return;
  }

  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const cur = interpolateCountUp(prev, target, t);
    el.textContent = format(cur);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = format(target);
    }
  }
  requestAnimationFrame(step);
}

function animateKpiRing(id, percent) {
  const circle = document.getElementById(id);
  if (!circle) return;
  const geom = computeCircularProgressGeometry(Math.max(10, percent), 20);
  circle.setAttribute('stroke-dasharray', String(geom.circumference));
  requestAnimationFrame(() => {
    circle.style.strokeDashoffset = String(geom.dashOffset);
  });
}

function formatPaymentBadge(type) {
  if (type === 'کارتخوان') {
    return `<span class="mg-pay-method-badge badge-pos"><span class="mg-legend-dot dot-purple"></span>کارتخوان (POS)</span>`;
  }
  if (type === 'نقدی') {
    return `<span class="mg-pay-method-badge badge-cash"><span class="mg-legend-dot dot-emerald"></span>دریافتی نقدی</span>`;
  }
  return `<span class="mg-pay-method-badge badge-account"><span class="mg-legend-dot dot-indigo"></span>حساب کاربری</span>`;
}

function formatAmountCell(amount, isTotal = false) {
  const num = Number(amount) || 0;
  if (num <= 0) {
    return `<span class="mg-zero-amount">۰ <small>تومان</small></span>`;
  }
  return `<span class="${isTotal ? 'mg-total-amount' : 'mg-positive-amount'}">${formatToman(num)} <small>تومان</small></span>`;
}

/**
 * Renders an interactive SVG multi-segment donut chart and its interactive legend.
 */
function renderInteractiveDonut({
  svgId,
  legendId,
  centerValId,
  centerLabelId,
  items,
  emptyLabel = 'بدون تراکنش',
}) {
  const svg = document.getElementById(svgId);
  const legend = document.getElementById(legendId);
  if (!svg || !legend) return;

  // Remove old dynamic segment circles
  svg.querySelectorAll('.mg-donut-segment').forEach((c) => c.remove());
  legend.innerHTML = '';

  const radius = 54;
  const geom = computeDonutSegmentsGeometry(items, radius);
  const nonZeroSegments = geom.segments.filter((s) => s.value > 0);
  const activeSegments = nonZeroSegments.length > 0 ? nonZeroSegments : geom.segments.slice(0, 1);

  // Pick dominant segment for default center readout
  const sortedByVal = [...geom.segments].sort((a, b) => b.value - a.value);
  const topSeg = sortedByVal[0] || { percent: 0, label: emptyLabel, value: 0 };

  if (geom.total <= 0) {
    setText(centerValId, '۰٪');
    setText(centerLabelId, emptyLabel);
  } else {
    animateNumber(centerValId, topSeg.percent, { useCommas: false, suffix: '٪', duration: 900 });
    setText(centerLabelId, topSeg.label);
  }

  const createdCircles = [];

  activeSegments.forEach((seg, idx) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '70');
    circle.setAttribute('cy', '70');
    circle.setAttribute('r', String(radius));
    circle.setAttribute('class', 'mg-donut-segment');
    circle.setAttribute('stroke', geom.total > 0 ? seg.color : 'rgba(156, 163, 175, 0.2)');
    const finalDashArray = geom.total > 0 ? seg.dashArray : `${geom.circumference} 0`;
    circle.setAttribute('stroke-dasharray', finalDashArray);
    circle.setAttribute('stroke-dashoffset', String(seg.dashOffset));
    circle.style.strokeDasharray = finalDashArray;
    circle.style.strokeDashoffset = String(seg.dashOffset);
    circle.style.filter = 'none';
    svg.appendChild(circle);
    createdCircles.push({ circle, seg, idx });
  });

  // Render full legend rows with mini progress bars and Toman values
  const legendEls = [];
  geom.segments.forEach((seg) => {
    const row = document.createElement('div');
    row.className = `mg-income-legend-row ${seg.value > 0 ? 'has-value' : 'is-zero'}`;
    row.innerHTML = `
      <div class="mg-income-legend-top">
        <span class="mg-income-legend-name">
          <span class="mg-legend-dot" style="background:${seg.color};"></span>
          <span>${seg.label}</span>
        </span>
        <span class="mg-income-legend-stats">
          <strong>${formatToman(seg.value)} ت</strong>
          <span class="mg-income-legend-pct">${toPersianDigits(seg.percent)}٪</span>
        </span>
      </div>
      <div class="mg-income-legend-bar-track">
        <div class="mg-income-legend-bar-fill" style="width: ${ Math.max(seg.value > 0 ? 6 : 0, seg.percent) }%; background: ${seg.color};"></div>
      </div>
    `;
    legend.appendChild(row);
    legendEls.push({ row, seg });
  });

  function highlightByKey(key) {
    createdCircles.forEach(({ circle, seg }) => {
      const match = seg.id === key;
      circle.classList.toggle('is-active-segment', match);
      circle.classList.toggle('is-dimmed-segment', !match);
    });
    legendEls.forEach(({ row, seg }) => {
      row.classList.toggle('is-active', seg.id === key);
    });
    const target = geom.segments.find((s) => s.id === key);
    if (target) {
      setText(centerValId, `${toPersianDigits(target.percent)}٪`);
      setText(centerLabelId, target.label);
    }
  }

  function resetHighlight() {
    createdCircles.forEach(({ circle }) => {
      circle.classList.remove('is-active-segment', 'is-dimmed-segment');
    });
    legendEls.forEach(({ row }) => row.classList.remove('is-active'));
    if (geom.total <= 0) {
      setText(centerValId, '۰٪');
      setText(centerLabelId, emptyLabel);
    } else {
      setText(centerValId, `${toPersianDigits(topSeg.percent)}٪`);
      setText(centerLabelId, topSeg.label);
    }
  }

  createdCircles.forEach(({ circle, seg }) => {
    circle.addEventListener('mouseenter', () => highlightByKey(seg.id));
    circle.addEventListener('mouseleave', resetHighlight);
  });

  legendEls.forEach(({ row, seg }) => {
    row.addEventListener('mouseenter', () => highlightByKey(seg.id));
    row.addEventListener('mouseleave', resetHighlight);
  });
}

function renderTablesAndCharts(report, periodSubtitle) {
  setText('tableTitle', periodSubtitle);

  // Update Top Strip
  setText('incStripTotal', `${formatToman(report.totalIncome)} تومان`);
  setText('incStripGame', `${formatToman(report.totalColumn.totalItem)} تومان`);
  setText('incStripBuffet', `${formatToman(report.totalBuffetColumn.totalBuffetItem)} تومان`);
  setText('incStripCount', `${toPersianDigits(report.transactionsCount)} فاکتور`);

  // Update Section Header Tags
  setText('gameSectionTotalTag', `جمع کل بازی: ${formatToman(report.totalColumn.totalItem)} تومان`);
  setText('buffetSectionTotalTag', `جمع کل بوفه: ${formatToman(report.totalBuffetColumn.totalBuffetItem)} تومان`);
  setText('totalSectionIncomeTag', `تجمیع کل: ${formatToman(report.totalIncome)} تومان`);

  // Update 4 Financial KPI Cards
  animateNumber('incKpiTotal', report.totalIncome);
  setText(
    'incKpiTotalSub',
    `مجموع ${toPersianDigits(report.transactionsCount)} تراکنش ثبت‌شده در دوره انتخابی`
  );
  animateKpiRing('incRingTotal', report.totalIncome > 0 ? 100 : 12);

  animateNumber('incKpiGame', report.totalColumn.totalItem);
  setText(
    'incKpiGameSub',
    `${toPersianDigits(report.gameSharePercent)}٪ از کل درآمد · پیشتاز: پلی‌استیشن ۴`
  );
  animateKpiRing('incRingGame', report.gameSharePercent);

  animateNumber('incKpiBuffet', report.totalBuffetColumn.totalBuffetItem);
  setText(
    'incKpiBuffetSub',
    `${toPersianDigits(report.buffetSharePercent)}٪ از کل درآمد · پرفروش: نوشیدنی سرد`
  );
  animateKpiRing('incRingBuffet', report.buffetSharePercent);

  const posShare =
    report.totalIncome > 0 ? Math.round((report.totalCredit / report.totalIncome) * 100) : 0;
  animateNumber('incKpiPos', report.totalCredit);
  setText(
    'incKpiPosSub',
    `نقدی: ${formatToman(report.totalCash)} ت · حساب کاربری: ${formatToman(report.totalAccount)} ت`
  );
  animateKpiRing('incRingPos', posShare);

  // 1. Populate #GameIncomeTable
  const gameTbody = document.querySelector('#GameIncomeTable tbody');
  if (gameTbody) {
    gameTbody.innerHTML = '';
    for (const type of ['کارتخوان', 'نقدی', 'حساب کاربری']) {
      const r = report.rowData[type];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatPaymentBadge(type)}</td>
        <td>${formatAmountCell(r.ps4)}</td>
        <td>${formatAmountCell(r.ps50)}</td>
        <td>${formatAmountCell(r.computer)}</td>
        <td>${formatAmountCell(r.xbox)}</td>
        <td>${formatAmountCell(r.jewelry)}</td>
        <td>${formatAmountCell(r.foosball)}</td>
        <td>${formatAmountCell(r.totalItem, true)}</td>
      `;
      gameTbody.appendChild(tr);
    }
    const totalTr = document.createElement('tr');
    totalTr.className = 'mg-income-total-row';
    totalTr.innerHTML = `
      <td><strong>جمع کل کنسول‌ها</strong></td>
      <td>${formatAmountCell(report.totalColumn.ps4, true)}</td>
      <td>${formatAmountCell(report.totalColumn.ps50, true)}</td>
      <td>${formatAmountCell(report.totalColumn.computer, true)}</td>
      <td>${formatAmountCell(report.totalColumn.xbox, true)}</td>
      <td>${formatAmountCell(report.totalColumn.jewelry, true)}</td>
      <td>${formatAmountCell(report.totalColumn.foosball, true)}</td>
      <td><span class="mg-grand-total-pill">${formatToman(report.totalColumn.totalItem)} تومان</span></td>
    `;
    gameTbody.appendChild(totalTr);
  }

  // Render Game Console Donut
  renderInteractiveDonut({
    svgId: 'gameDonutSvg',
    legendId: 'gameDonutLegend',
    centerValId: 'gameDonutCenterVal',
    centerLabelId: 'gameDonutCenterLabel',
    items: CONSOLE_META.map((c) => ({
      id: c.key,
      label: c.label,
      value: report.totalColumn[c.key] || 0,
      color: getMetaColor(c),
    })),
  });

  // 2. Populate #BuffetIncomeTable
  const buffetTbody = document.querySelector('#BuffetIncomeTable tbody');
  if (buffetTbody) {
    buffetTbody.innerHTML = '';
    for (const type of ['کارتخوان', 'نقدی', 'حساب کاربری']) {
      const r = report.rowBuffetData[type];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatPaymentBadge(type)}</td>
        <td>${formatAmountCell(r.cold_drink)}</td>
        <td>${formatAmountCell(r.hot_drink)}</td>
        <td>${formatAmountCell(r.snack)}</td>
        <td>${formatAmountCell(r.fastfood)}</td>
        <td>${formatAmountCell(r.other)}</td>
        <td>${formatAmountCell(r.totalBuffetItem, true)}</td>
      `;
      buffetTbody.appendChild(tr);
    }
    const totalBuffetTr = document.createElement('tr');
    totalBuffetTr.className = 'mg-income-total-row';
    totalBuffetTr.innerHTML = `
      <td><strong>جمع کل بوفه</strong></td>
      <td>${formatAmountCell(report.totalBuffetColumn.cold_drink, true)}</td>
      <td>${formatAmountCell(report.totalBuffetColumn.hot_drink, true)}</td>
      <td>${formatAmountCell(report.totalBuffetColumn.snack, true)}</td>
      <td>${formatAmountCell(report.totalBuffetColumn.fastfood, true)}</td>
      <td>${formatAmountCell(report.totalBuffetColumn.other, true)}</td>
      <td><span class="mg-grand-total-pill pill-amber">${formatToman(report.totalBuffetColumn.totalBuffetItem)} تومان</span></td>
    `;
    buffetTbody.appendChild(totalBuffetTr);
  }

  // Render Buffet Donut
  renderInteractiveDonut({
    svgId: 'buffetDonutSvg',
    legendId: 'buffetDonutLegend',
    centerValId: 'buffetDonutCenterVal',
    centerLabelId: 'buffetDonutCenterLabel',
    items: BUFFET_META.map((b) => ({
      id: b.key,
      label: b.label,
      value: report.totalBuffetColumn[b.key] || 0,
      color: getMetaColor(b),
    })),
  });

  // 3. Populate #IncomeTable & Horizontal Comparison Bars
  const incomeTbody = document.querySelector('#IncomeTable tbody');
  const cashPct =
    report.totalIncome > 0 ? Math.round((report.totalCash / report.totalIncome) * 100) : 0;
  const creditPct =
    report.totalIncome > 0 ? Math.round((report.totalCredit / report.totalIncome) * 100) : 0;
  const accountPct =
    report.totalIncome > 0 ? Math.round((report.totalAccount / report.totalIncome) * 100) : 0;

  if (incomeTbody) {
    incomeTbody.innerHTML = `
      <tr class="mg-income-total-row">
        <td>
          <div class="mg-pay-summary-cell">
            ${formatAmountCell(report.totalCash, true)}
            <span class="mg-pay-pct-tag tag-emerald">${toPersianDigits(cashPct)}٪ از کل</span>
          </div>
        </td>
        <td>
          <div class="mg-pay-summary-cell">
            ${formatAmountCell(report.totalCredit, true)}
            <span class="mg-pay-pct-tag tag-cyan">${toPersianDigits(creditPct)}٪ از کل</span>
          </div>
        </td>
        <td>
          <div class="mg-pay-summary-cell">
            ${formatAmountCell(report.totalAccount, true)}
            <span class="mg-pay-pct-tag tag-purple">${toPersianDigits(accountPct)}٪ از کل</span>
          </div>
        </td>
        <td>
          <span class="mg-grand-total-pill pill-emerald">${formatToman(report.totalIncome)} تومان</span>
        </td>
      </tr>
    `;
  }

  const barsWrap = document.getElementById('paymentMethodBars');
  if (barsWrap) {
    const light = isLightModeActive();
    const barItems = [
      {
        label: 'دستگاه کارتخوان (POS)',
        amount: report.totalCredit,
        pct: creditPct,
        color: light ? '#6D28D9' : '#22D3EE',
      },
      {
        label: 'دریافتی نقدی صندوق',
        amount: report.totalCash,
        pct: cashPct,
        color: light ? '#0D9488' : '#10B981',
      },
      {
        label: 'کسر از حساب کاربری مشتریان',
        amount: report.totalAccount,
        pct: accountPct,
        color: light ? '#4F46E5' : '#A855F7',
      },
    ];
    barsWrap.innerHTML = barItems
      .map(
        (item) => `
        <div class="mg-pay-bar-item">
          <div class="mg-pay-bar-label">
            <span>${item.label}</span>
            <strong>${formatToman(item.amount)} تومان (${toPersianDigits(item.pct)}٪)</strong>
          </div>
          <div class="mg-pay-bar-track">
            <div class="mg-pay-bar-fill" style="width: ${Math.max(item.amount > 0 ? 5 : 0, item.pct)}%; background: ${item.color}; box-shadow: ${light ? 'none' : `0 0 12px ${item.color}`};"></div>
          </div>
        </div>
      `
      )
      .join('');
  }

  // Render Payment Method Donut
  renderInteractiveDonut({
    svgId: 'paymentDonutSvg',
    legendId: 'paymentDonutLegend',
    centerValId: 'paymentDonutCenterVal',
    centerLabelId: 'paymentDonutCenterLabel',
    items: PAYMENT_META.map((p) => ({
      id: p.key,
      label: p.label,
      value:
        p.key === 'credit'
          ? report.totalCredit
          : p.key === 'cash'
          ? report.totalCash
          : report.totalAccount,
      color: getMetaColor(p),
    })),
  });
}

async function initIncomeDashboard() {
  if (!document.getElementById('GameIncomeTable')) return;
  try {
    let cachedBundle = null;
    try {
      const raw = sessionStorage.getItem('mg_bundle_v1');
      if (raw) cachedBundle = JSON.parse(raw);
    } catch {
      cachedBundle = null;
    }

    const fetchOrCached = (key, url) => {
      if (cachedBundle && cachedBundle[key]) {
        return Promise.resolve(cachedBundle[key]);
      }
      return fetch(url).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    };

    const [calRes, creditRes, cashRes, customerRes] = await Promise.all([
      fetch('./Calender.json').then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetchOrCached('creditpay.json', './creditpay.json'),
      fetchOrCached('cashPay.json', './cashPay.json'),
      fetchOrCached('customerPay.json', './customerPay.json'),
    ]);

    const savedStart = calRes?.[0]?.start || '2023-11-21T00:00:00+03:30';
    const savedEnd = calRes?.[0]?.end || '2023-11-21T23:59:59+03:30';

    const formatFaDate = (iso) => {
      try {
        return new Date(iso).toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        });
      } catch {
        return '';
      }
    };

    function applyFilterMode(mode, customStart = null, customEnd = null) {
      let filterMode = 'all';
      let startDate = null;
      let endDate = null;
      let subtitle = 'نمایش جامع کلیه تراکنش‌های ثبت‌شده گیم‌نت (همه دوره‌ها)';

      if (mode === 'saved') {
        filterMode = 'range';
        startDate = savedStart;
        endDate = savedEnd;
        subtitle = `بازه ذخیره‌شده تقویم: از ${formatFaDate(savedStart)} تا ${formatFaDate(savedEnd)}`;
      } else if (mode === 'nov2023') {
        filterMode = 'range';
        startDate = '2023-11-01T00:00:00+03:30';
        endDate = '2023-11-30T23:59:59+03:30';
        subtitle = `گزارش تراکنش‌های آبان و آذر ۱۴۰۲ (${formatFaDate(startDate)} تا ${formatFaDate(endDate)})`;
      } else if (mode === 'today') {
        filterMode = 'range';
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        startDate = startOfDay.toISOString();
        endDate = endOfDay.toISOString();
        subtitle = `گزارش تراکنش‌های شیفت امروز (${formatFaDate(startDate)})`;
      } else if (mode === 'custom' && customStart && customEnd) {
        filterMode = 'range';
        startDate = `${customStart}T00:00:00`;
        endDate = `${customEnd}T23:59:59`;
        subtitle = `بازه انتخابی: از ${formatFaDate(startDate)} تا ${formatFaDate(endDate)}`;
      }

      const report = computeIncomeReportMetrics({
        creditPay: creditRes,
        cashPay: cashRes,
        customerPay: customerRes,
        startDate,
        endDate,
        filterMode,
      });

      lastIncomeState = { report, subtitle };
      renderTablesAndCharts(report, subtitle);
    }

    // Default to 'all' so all 3 tables and all 3 donut charts show rich, complete data immediately
    applyFilterMode('all');

    // Bind Filter Preset Buttons
    const filterBtns = document.querySelectorAll('[data-income-filter]');
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-income-filter') || 'all';
        applyFilterMode(mode);
      });
    });

    // Bind Custom Date Range Apply Button & Persist to Calender.php
    const applyBtn = document.getElementById('applyCustomDateBtn');
    const startInput = document.getElementById('incomeStartDate');
    const endInput = document.getElementById('incomeEndDate');

    if (applyBtn && startInput && endInput) {
      applyBtn.addEventListener('click', async () => {
        const sVal = startInput.value;
        const eVal = endInput.value;
        if (!sVal || !eVal) return;

        filterBtns.forEach((b) => b.classList.remove('active'));
        applyFilterMode('custom', sVal, eVal);

        try {
          const form = new URLSearchParams();
          form.set('start', `${sVal}T00:00:00+03:30`);
          form.set('end', `${eVal}T23:59:59+03:30`);
          await fetch('./Calender.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: form.toString(),
          });
        } catch {
          // Non-fatal
        }
      });
    }
  } catch (err) {
    console.error('Income report load error:', err);
  }
}

let lastIncomeState = null;

if (!window.__mgIncomeThemeListenerBound) {
  window.__mgIncomeThemeListenerBound = true;
  window.addEventListener('mg:theme-changed', () => {
    if (lastIncomeState && document.getElementById('GameIncomeTable')) {
      renderTablesAndCharts(lastIncomeState.report, lastIncomeState.subtitle);
    }
  });
}

window.renderIncomePage = initIncomeDashboard;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initIncomeDashboard);
} else {
  initIncomeDashboard();
}