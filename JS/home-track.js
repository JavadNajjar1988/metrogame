import {
  TRACK_GEOMETRY,
  sampleStadiumTrack,
  buildStadiumSvgPath,
  buildMilestoneTicks,
  computeRunnerPhysics,
  computeAnimatedProgress,
  assignRunnerLanes,
  formatDurationHMS,
  formatShortDuration,
  formatLapPace,
} from './track-engine.mjs?v=20261123-3';
import { toPersianDigits, formatToman } from './dashboard-metrics.mjs';

const SVG_NS = 'http://www.w3.org/2000/svg';

function toEnglishDigits(str) {
  return String(str ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim();
}

function showTrackToast(message) {
  let toast = document.getElementById('mgToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'mgToast';
    toast.className = 'mg-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.__mgToastTimer);
  window.__mgToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function invalidateAllCaches() {
  window.__mgBundlePromise = null;
  window.__mgJsonPromises = {};
  try {
    sessionStorage.removeItem('mg_bundle_v1');
    sessionStorage.removeItem('mg_sidebar_badges');
  } catch {
    // ignore storage errors
  }
}

function postFormUrlEncoded(url, payload) {
  const body = new URLSearchParams();
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) body.set(k, String(v));
  });
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json',
    },
    body: body.toString(),
  });
}

function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

const trackState = {
  initialized: false,
  mode: 'live-run', // 'live-run' | 'true-pos'
  selectedTable: null,
  hoveredTable: null,
  confirmEndTable: null,
  busyAction: false,
  stationCapacity: 12,
  rawData: {
    reservations: [],
    consoles: [],
    clickTimes: [],
    finishTimes: [],
    buffetTemp: [],
  },
  runners: [],
  animStartPerf: performance.now(),
  lastComputedSec: Math.floor(Date.now() / 1000),
  frozenProgress: new Map(),
  lastActiveMilestone: -1,
  focusedTokenTable: null,
  rafId: null,
  lastSecondTick: 0,
  svgProgressPath: null,
  svgProgressPerimeter: 1500,
  milestoneEls: [],
  tokenMap: new Map(),
};

function isOverviewVisible() {
  const pane = document.getElementById('mgOverviewView');
  if (!pane) return false;
  return !pane.hasAttribute('hidden') && pane.classList.contains('is-active-view');
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildStaticTrackSvg(svg) {
  if (!svg || svg.dataset.trackBuilt === '1') return;
  svg.dataset.trackBuilt = '1';
  svg.innerHTML = '';

  const defs = createSvgEl('defs');

  // Accent progress gradient along track
  const grad = createSvgEl('linearGradient', {
    id: 'mgTrackProgressGrad',
    x1: '0%',
    y1: '0%',
    x2: '100%',
    y2: '100%',
  });
  grad.appendChild(createSvgEl('stop', { offset: '0%', 'stop-color': 'var(--mg-accent-soft, #A78BFA)' }));
  grad.appendChild(createSvgEl('stop', { offset: '100%', 'stop-color': 'var(--mg-accent-1, #7C3AED)' }));
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Outer filled stadium band (drawn via stroke on center path with thick stroke-width)
  const centerPathD = buildStadiumSvgPath(TRACK_GEOMETRY, 0);
  const outerPathD = buildStadiumSvgPath(TRACK_GEOMETRY, 36);
  const innerPathD = buildStadiumSvgPath(TRACK_GEOMETRY, -36);

  // Track asphalt/glass surface band
  svg.appendChild(
    createSvgEl('path', {
      d: centerPathD,
      class: 'mg-track-band',
      fill: 'none',
      'stroke-width': '72',
    })
  );

  // Outer & Inner crisp rim hairlines
  svg.appendChild(createSvgEl('path', { d: outerPathD, class: 'mg-track-rim-outer', fill: 'none' }));
  svg.appendChild(createSvgEl('path', { d: innerPathD, class: 'mg-track-rim-inner', fill: 'none' }));

  // Subtle dashed center running lane
  svg.appendChild(
    createSvgEl('path', {
      d: centerPathD,
      class: 'mg-track-lane-dash',
      fill: 'none',
      'stroke-dasharray': '5 10',
    })
  );

  // Active progress trail along center lane (length measured from sampleStadiumTrack)
  const sample0 = sampleStadiumTrack(0, TRACK_GEOMETRY, 0);
  trackState.svgProgressPerimeter = sample0.perimeter;
  const progressPath = createSvgEl('path', {
    d: centerPathD,
    id: 'mgTrackActiveArc',
    class: 'mg-track-progress-arc',
    fill: 'none',
    stroke: 'url(#mgTrackProgressGrad)',
    'stroke-dasharray': `${sample0.perimeter} ${sample0.perimeter}`,
    'stroke-dashoffset': `${sample0.perimeter}`,
  });
  svg.appendChild(progressPath);
  trackState.svgProgressPath = progressPath;

  // 12 Milestone ticks + inner labels (inspired by W2..W12 in stadium track)
  const ticks = buildMilestoneTicks(12, TRACK_GEOMETRY);
  const milestonesGroup = createSvgEl('g', { class: 'mg-track-milestones' });
  trackState.milestoneEls = [];

  ticks.forEach((tick) => {
    if (tick.isStartFinish) {
      // Iconic dashed start/finish line across track width at top-left straightaway
      const outerFinish = sampleStadiumTrack(0, TRACK_GEOMETRY, 35);
      const innerFinish = sampleStadiumTrack(0, TRACK_GEOMETRY, -35);
      milestonesGroup.appendChild(
        createSvgEl('line', {
          x1: outerFinish.x,
          y1: outerFinish.y,
          x2: innerFinish.x,
          y2: innerFinish.y,
          class: 'mg-track-start-line',
          'stroke-dasharray': '4 4',
        })
      );
      trackState.milestoneEls.push({ tickEl: null, labelEl: null });
      return;
    }

    const tickOuter = sampleStadiumTrack(tick.progress, TRACK_GEOMETRY, 18);
    const tickInner = sampleStadiumTrack(tick.progress, TRACK_GEOMETRY, -16);
    const tickLine = createSvgEl('line', {
      x1: tickOuter.x,
      y1: tickOuter.y,
      x2: tickInner.x,
      y2: tickInner.y,
      class: 'mg-track-tick',
      'data-milestone': tick.index,
    });
    milestonesGroup.appendChild(tickLine);

    const labelPt = sampleStadiumTrack(tick.progress, TRACK_GEOMETRY, -53);
    const labelText = createSvgEl('text', {
      x: labelPt.x,
      y: labelPt.y + 4,
      'text-anchor': 'middle',
      class: 'mg-track-milestone-label',
      'data-milestone': tick.index,
    });
    labelText.textContent = toPersianDigits(tick.stepNumber);
    milestonesGroup.appendChild(labelText);

    trackState.milestoneEls.push({ tickEl: tickLine, labelEl: labelText });
  });

  svg.appendChild(milestonesGroup);
}

function recomputeRunners(nowSec = Math.floor(Date.now() / 1000)) {
  const { reservations, consoles, clickTimes, finishTimes, buffetTemp } = trackState.rawData;
  const list = Array.isArray(reservations) ? reservations : [];
  const context = { consoles, clickTimes, finishTimes, buffetTemp };

  const computed = list.map((res) => computeRunnerPhysics(res, context, nowSec));
  trackState.lastComputedSec = nowSec;
  trackState.runners = computed;

  // Deselect if selected table no longer exists
  if (
    trackState.selectedTable &&
    !computed.some((r) => String(r.tableNumber) === String(trackState.selectedTable))
  ) {
    trackState.selectedTable = null;
    trackState.confirmEndTable = null;
    syncInspectorVisibility();
  }
}

function getFocusedRunner() {
  if (trackState.hoveredTable) {
    const h = trackState.runners.find((r) => String(r.tableNumber) === String(trackState.hoveredTable));
    if (h) return h;
  }
  if (trackState.selectedTable) {
    const s = trackState.runners.find((r) => String(r.tableNumber) === String(trackState.selectedTable));
    if (s) return s;
  }
  return null;
}

function updateCenterReadout() {
  const primaryEl = document.getElementById('mgTrackCenterPrimary');
  const subEl = document.getElementById('mgTrackCenterSub');
  const badgeEl = document.getElementById('mgTrackCenterBadge');
  const headerMetaEl = document.getElementById('mgArenaHeaderMeta');
  if (!primaryEl || !subEl || !badgeEl) return;

  const runners = trackState.runners;
  const runningCount = runners.filter((r) => r.status !== 'waiting').length;
  const waitingCount = runners.length - runningCount;

  if (headerMetaEl) {
    headerMetaEl.textContent =
      runners.length === 0
        ? 'پیست خالی · ۱۲ ایستگاه آماده'
        : `${toPersianDigits(runners.length)} میز فعال · ${toPersianDigits(runningCount)} در حال حرکت · ${toPersianDigits(waitingCount)} آماده`;
  }

  const focused = getFocusedRunner();

  if (focused) {
    const displayTimeSec = focused.isPrePayment ? focused.remainingSec : focused.elapsedSec;
    primaryEl.textContent = toPersianDigits(formatDurationHMS(displayTimeSec));
    subEl.textContent = focused.isPrePayment
      ? `میز ${toPersianDigits(focused.tableNumber)} · ${focused.consoleName} · ${toPersianDigits(focused.progressPercent)}٪ مسیر`
      : `میز ${toPersianDigits(focused.tableNumber)} · ${focused.consoleName}${focused.lapsCompleted > 0 ? ` · دور ${toPersianDigits(focused.lapsCompleted + 1)}` : ''}`;

    if (focused.status === 'waiting') {
      badgeEl.textContent = 'آماده استارت در خط شروع';
      badgeEl.dataset.state = 'waiting';
    } else if (focused.status === 'overdue') {
      badgeEl.textContent = 'زمان میز به پایان رسید · آماده تسویه';
      badgeEl.dataset.state = 'overdue';
    } else if (focused.status === 'ending-soon') {
      badgeEl.textContent = `رو به اتمام · ${toPersianDigits(formatLapPace(focused.lapDurationSec))}`;
      badgeEl.dataset.state = 'ending-soon';
    } else {
      badgeEl.textContent = `${toPersianDigits(formatLapPace(focused.lapDurationSec))} · ${formatToman(focused.grandTotal)} تومان`;
      badgeEl.dataset.state = 'running';
    }
  } else if (runners.length === 0) {
    primaryEl.textContent = '۰';
    subEl.textContent = `از ${toPersianDigits(trackState.stationCapacity)} ایستگاه فعال`;
    badgeEl.textContent = 'هنوز میزی روی پیست ثبت نشده است';
    badgeEl.dataset.state = 'empty';
  } else {
    primaryEl.textContent = toPersianDigits(runners.length);
    subEl.textContent = `از ${toPersianDigits(trackState.stationCapacity)} ایستگاه سالن`;
    badgeEl.textContent =
      runningCount > 0
        ? `${toPersianDigits(runningCount)} میز در حال حرکت (زمان واقعی) · روی هر میز کلیک کنید`
        : `${toPersianDigits(waitingCount)} میز آماده استارت · برای شروع کلیک کنید`;
    badgeEl.dataset.state = 'summary';
  }
}

function getHoverTrailRunner() {
  const key = trackState.hoveredTable || trackState.focusedTokenTable;
  if (!key) return null;
  return trackState.runners.find((r) => String(r.tableNumber) === String(key)) || null;
}

function updateActiveTrackArc(spacedRunners) {
  if (!trackState.svgProgressPath) return;

  const hoverTarget = getHoverTrailRunner();
  const targetSpaced = hoverTarget
    ? spacedRunners.find((r) => String(r.tableNumber) === String(hoverTarget.tableNumber)) || hoverTarget
    : null;

  const perim = trackState.svgProgressPerimeter || 1500;
  const shouldShow = Boolean(targetSpaced && targetSpaced.status !== 'waiting');

  if (shouldShow) {
    const rawProg = Number.isFinite(targetSpaced.displayProgress)
      ? targetSpaced.displayProgress
      : targetSpaced.trueProgress;
    const prog = Math.max(0.015, rawProg);
    trackState.svgProgressPath.style.strokeDashoffset = String(perim * (1 - prog));
    trackState.svgProgressPath.style.opacity = '1';
  } else {
    trackState.svgProgressPath.style.opacity = '0';
  }

  const activeMilestone = shouldShow
    ? Math.min(
        11,
        Math.floor(
          ((Number.isFinite(targetSpaced.displayProgress)
            ? targetSpaced.displayProgress
            : targetSpaced.trueProgress) %
            1) *
            12
        )
      )
    : -1;

  if (activeMilestone !== trackState.lastActiveMilestone) {
    trackState.lastActiveMilestone = activeMilestone;
    trackState.milestoneEls.forEach((item, idx) => {
      const isActive = idx === activeMilestone && idx > 0;
      if (item.tickEl) item.tickEl.classList.toggle('is-active', isActive);
      if (item.labelEl) item.labelEl.classList.toggle('is-active', isActive);
    });
  }
}

function syncRunnerTokensDOM() {
  const layer = document.getElementById('mgRunnersLayer');
  const emptyOverlay = document.getElementById('mgTrackEmptyState');
  if (!layer) return;

  const runners = trackState.runners;
  if (emptyOverlay) {
    emptyOverlay.hidden = runners.length > 0;
  }

  const activeIds = new Set(runners.map((r) => String(r.tableNumber)));

  // Remove stale tokens
  for (const [key, btn] of trackState.tokenMap.entries()) {
    if (!activeIds.has(key)) {
      btn.remove();
      trackState.tokenMap.delete(key);
    }
  }

  // Create or update runner tokens as native accessible buttons
  runners.forEach((runner) => {
    const key = String(runner.tableNumber);
    let btn = trackState.tokenMap.get(key);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mg-runner-token';
      btn.dataset.tableNumber = key;
      btn.innerHTML = `
        <span class="mg-runner-orbit" aria-hidden="true"></span>
        <span class="mg-runner-core">
          <span class="mg-runner-num"></span>
        </span>
      `;
      btn.addEventListener('click', () => {
        selectTableOnTrack(key);
      });
      btn.addEventListener('pointerenter', () => {
        trackState.hoveredTable = key;
        updateCenterReadout();
      });
      btn.addEventListener('pointerleave', () => {
        if (trackState.hoveredTable === key) {
          trackState.hoveredTable = null;
          updateCenterReadout();
        }
      });
      btn.addEventListener('focus', () => {
        if (btn.matches(':focus-visible')) {
          trackState.focusedTokenTable = key;
          updateCenterReadout();
        }
      });
      btn.addEventListener('blur', () => {
        if (trackState.focusedTokenTable === key) {
          trackState.focusedTokenTable = null;
          updateCenterReadout();
        }
      });
      layer.appendChild(btn);
      trackState.tokenMap.set(key, btn);
    }

    const numEl = btn.querySelector('.mg-runner-num');
    if (numEl) numEl.textContent = toPersianDigits(key);

    const isSelected = String(trackState.selectedTable) === key;
    btn.classList.toggle('is-selected', isSelected);
    btn.classList.toggle('is-running', runner.status === 'running');
    btn.classList.toggle('is-waiting', runner.status === 'waiting');
    btn.classList.toggle('is-ending-soon', runner.status === 'ending-soon');
    btn.classList.toggle('is-overdue', runner.status === 'overdue');
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    btn.dataset.status = runner.status;
    btn.dataset.speed = String(runner.speedMultiplier);

    const statusText =
      runner.status === 'waiting'
        ? 'آماده استارت'
        : runner.status === 'overdue'
        ? 'اتمام زمان'
        : runner.status === 'ending-soon'
        ? 'رو به اتمام'
        : 'در حال اجرا';

    btn.setAttribute(
      'aria-label',
      `میز ${toPersianDigits(key)} — ${runner.consoleName} — ${statusText}`
    );

    // Calm orbit pulse matching real-time cadence
    const pulseSec =
      runner.status === 'waiting'
        ? 0
        : runner.status === 'overdue'
        ? 1.8
        : Math.max(2.0, Math.min(3.6, 3.0 / Math.max(0.65, runner.speedMultiplier || 1)));
    btn.style.setProperty('--runner-pulse-dur', pulseSec > 0 ? `${pulseSec.toFixed(2)}s` : '0s');
  });
}

function positionRunnersForFrame() {
  const runners = trackState.runners;
  if (!runners.length) {
    updateActiveTrackArc([]);
    return;
  }

  const effectiveMode = prefersReducedMotion() ? 'true-pos' : trackState.mode;
  const subSecOffset = Math.max(0, Date.now() / 1000 - trackState.lastComputedSec);
  const activeKeys = new Set(runners.map((r) => String(r.tableNumber)));
  for (const existingKey of trackState.frozenProgress.keys()) {
    if (!activeKeys.has(existingKey)) trackState.frozenProgress.delete(existingKey);
  }

  const withProgress = runners.map((r) => {
    const key = String(r.tableNumber);
    const isPausedByPointer =
      String(trackState.hoveredTable) === key || String(trackState.focusedTokenTable) === key;

    let displayProgress;
    if (isPausedByPointer && trackState.frozenProgress.has(key)) {
      displayProgress = trackState.frozenProgress.get(key);
    } else {
      displayProgress = computeAnimatedProgress(r, subSecOffset, effectiveMode);
      trackState.frozenProgress.set(key, displayProgress);
    }

    return {
      ...r,
      displayProgress,
    };
  });

  const spaced = assignRunnerLanes(withProgress, 0.058, TRACK_GEOMETRY.laneStep);

  spaced.forEach((runner) => {
    const btn = trackState.tokenMap.get(String(runner.tableNumber));
    if (!btn) return;
    const pt = sampleStadiumTrack(runner.displayProgress, TRACK_GEOMETRY, runner.laneOffset);
    const nextLeft = `${pt.xPct}%`;
    const nextTop = `${pt.yPct}%`;
    if (btn.style.left !== nextLeft) btn.style.left = nextLeft;
    if (btn.style.top !== nextTop) btn.style.top = nextTop;
  });

  updateActiveTrackArc(spaced);
}

function syncInspectorVisibility() {
  const layout = document.getElementById('mgArenaLayout');
  const inspector = document.getElementById('mgTrackInspector');
  if (!layout || !inspector) return;

  const hasSelection = Boolean(trackState.selectedTable);
  layout.classList.toggle('has-inspector', hasSelection);
  inspector.hidden = !hasSelection;
  inspector.setAttribute('aria-hidden', hasSelection ? 'false' : 'true');
}

function renderInspectorContent() {
  const inspector = document.getElementById('mgTrackInspector');
  if (!inspector) return;
  if (!trackState.selectedTable) {
    syncInspectorVisibility();
    return;
  }

  const runner = trackState.runners.find(
    (r) => String(r.tableNumber) === String(trackState.selectedTable)
  );
  if (!runner) {
    trackState.selectedTable = null;
    syncInspectorVisibility();
    return;
  }

  syncInspectorVisibility();

  const titleEl = document.getElementById('mgInspectorTitle');
  const metaEl = document.getElementById('mgInspectorMeta');
  const statusEl = document.getElementById('mgInspectorStatus');
  const timerEl = document.getElementById('mgInspectorTimer');
  const timerCaptionEl = document.getElementById('mgInspectorTimerCaption');
  const progressBarEl = document.getElementById('mgInspectorProgressBar');
  const progressTextEl = document.getElementById('mgInspectorProgressText');
  const speedTextEl = document.getElementById('mgInspectorSpeedText');
  const gameCostEl = document.getElementById('mgInspectorGameCost');
  const buffetCostEl = document.getElementById('mgInspectorBuffetCost');
  const grandTotalEl = document.getElementById('mgInspectorGrandTotal');
  const startBtn = document.getElementById('mgInspectorStartBtn');
  const extendHintEl = document.getElementById('mgInspectorExtendHint');
  const endWrap = document.getElementById('mgInspectorEndWrap');
  const endBtn = document.getElementById('mgInspectorEndBtn');
  const endConfirmBox = document.getElementById('mgInspectorEndConfirm');
  const manageBtn = document.getElementById('mgInspectorManageBtn');

  if (titleEl) titleEl.textContent = `میز ${toPersianDigits(runner.tableNumber)}`;
  if (metaEl) {
    metaEl.textContent = `${runner.consoleName} · ${runner.priceLabel} · ${runner.isPrePayment ? 'پیش‌پرداخت' : 'پس‌کرایه'} · ساعتی ${formatToman(runner.hourlyPrice)} ت`;
  }

  const statusMap = {
    waiting: 'آماده شروع',
    running: 'در حال اجرا',
    'ending-soon': 'نزدیک به اتمام',
    overdue: 'زمان به پایان رسید',
  };
  if (statusEl) {
    statusEl.textContent = statusMap[runner.status] || 'فعال';
    statusEl.dataset.status = runner.status;
  }

  if (timerEl) {
    const secs = runner.isPrePayment ? runner.remainingSec : runner.elapsedSec;
    timerEl.textContent = toPersianDigits(formatDurationHMS(secs));
  }
  if (timerCaptionEl) {
    if (runner.status === 'waiting') {
      timerCaptionEl.textContent = runner.isPrePayment
        ? `مدت رزروشده: ${toPersianDigits(formatShortDuration(runner.totalSec))}`
        : 'زمان‌سنج هنوز شروع نشده است';
    } else if (runner.isPrePayment) {
      timerCaptionEl.textContent =
        runner.status === 'overdue'
          ? 'زمان پیش‌پرداخت تمام شده — آماده تمدید یا تسویه'
          : `زمان باقی‌مانده از ${toPersianDigits(formatShortDuration(runner.totalSec))}`;
    } else {
      timerCaptionEl.textContent = `زمان سپری‌شده (${toPersianDigits(runner.lapsCompleted)} دور کامل)`;
    }
  }

  if (progressBarEl) {
    progressBarEl.style.width = `${runner.status === 'waiting' ? 0 : Math.max(4, runner.progressPercent)}%`;
  }
  if (progressTextEl) {
    progressTextEl.textContent = `${toPersianDigits(runner.progressPercent)}٪ مسیر پیست`;
  }
  if (speedTextEl) {
    speedTextEl.textContent =
      runner.status === 'waiting'
        ? 'متوقف در خط استارت'
        : runner.status === 'overdue'
        ? 'متوقف در خط پایان'
        : toPersianDigits(formatLapPace(runner.lapDurationSec));
  }

  if (gameCostEl) gameCostEl.textContent = `${formatToman(runner.liveGameCost)} تومان`;
  if (buffetCostEl) {
    buffetCostEl.textContent =
      runner.buffetCount > 0
        ? `${formatToman(runner.buffetTotal)} تومان (${toPersianDigits(runner.buffetCount)} قلم)`
        : '۰ تومان';
  }
  if (grandTotalEl) grandTotalEl.textContent = `${formatToman(runner.grandTotal)} تومان`;

  if (startBtn) {
    startBtn.hidden = runner.status !== 'waiting';
    startBtn.disabled = trackState.busyAction;
  }

  if (extendHintEl) {
    extendHintEl.textContent = runner.isPrePayment
      ? 'زمان اضافه‌شده بلافاصله به پایان سشن افزوده می‌شود'
      : 'با افزودن زمان، این میز به سشن زمان‌دار تبدیل می‌شود';
  }

  const isConfirmingEnd = String(trackState.confirmEndTable) === String(runner.tableNumber);
  if (endBtn) {
    endBtn.hidden = isConfirmingEnd;
    endBtn.disabled = trackState.busyAction;
  }
  if (endConfirmBox) {
    endConfirmBox.hidden = !isConfirmingEnd;
  }
  if (endWrap) {
    endWrap.dataset.confirming = isConfirmingEnd ? 'true' : 'false';
  }
  if (manageBtn) {
    manageBtn.setAttribute('data-focus-table', String(runner.tableNumber));
  }
}

function selectTableOnTrack(tableNumber) {
  const key = String(tableNumber);
  if (String(trackState.selectedTable) === key) {
    // Clicking the already-selected runner closes the inspector cleanly
    closeTrackInspector();
    return;
  }
  trackState.selectedTable = key;
  trackState.confirmEndTable = null;
  syncRunnerTokensDOM();
  updateCenterReadout();
  renderInspectorContent();
}

export function closeTrackInspector() {
  trackState.selectedTable = null;
  trackState.confirmEndTable = null;
  syncRunnerTokensDOM();
  updateCenterReadout();
  syncInspectorVisibility();
}

async function refreshWorkspaceAfterMutation() {
  invalidateAllCaches();
  if (typeof window.renderTablesWorkspace === 'function') {
    await window.renderTablesWorkspace({ forceFresh: true });
  }
  window.dispatchEvent(new CustomEvent('mg:tables-updated'));
}

async function handleStartSelectedTable() {
  if (trackState.busyAction || !trackState.selectedTable) return;
  const runner = trackState.runners.find(
    (r) => String(r.tableNumber) === String(trackState.selectedTable)
  );
  if (!runner || runner.status !== 'waiting') return;

  trackState.busyAction = true;
  renderInspectorContent();

  try {
    const nowSec = Math.floor(Date.now() / 1000);
    if (runner.isPrePayment) {
      const finishTime = nowSec + Math.max(300, runner.totalSec);
      const resp = await postFormUrlEncoded('./timer.php', {
        startTime: nowSec,
        finishTime,
        tableNumber: runner.tableNumber,
      });
      if (!resp.ok) throw new Error('start_pre_failed');
    } else {
      const resp = await postFormUrlEncoded('./timing.php', {
        clickTime: nowSec,
        tableNumber: runner.tableNumber,
      });
      if (!resp.ok) throw new Error('start_post_failed');
    }

    showTrackToast(`تایمر میز ${toPersianDigits(runner.tableNumber)} شروع شد.`);
    await refreshWorkspaceAfterMutation();
  } catch {
    showTrackToast('خطا در شروع زمان‌سنج میز. دوباره تلاش کنید.');
  } finally {
    trackState.busyAction = false;
    renderInspectorContent();
  }
}

async function handleExtendSelectedTable(extraMinutes, extraAmountToman = 0) {
  if (trackState.busyAction || !trackState.selectedTable) return;
  const runner = trackState.runners.find(
    (r) => String(r.tableNumber) === String(trackState.selectedTable)
  );
  if (!runner) return;

  const mins = Math.max(0, Number(extraMinutes) || 0);
  const amount = Math.max(0, Number(extraAmountToman) || 0);
  const secondsFromMins = Math.round(mins * 60);
  const secondsFromAmount =
    amount > 0 ? Math.round((3600 * amount) / Math.max(1000, runner.hourlyPrice)) : 0;
  const totalAddSeconds = secondsFromMins + secondsFromAmount;

  if (totalAddSeconds < 60) {
    showTrackToast('لطفاً حداقل ۱ دقیقه یا مبلغ معتبر وارد کنید.');
    return;
  }

  trackState.busyAction = true;
  renderInspectorContent();

  try {
    const resp = await postFormUrlEncoded('./charging.php', {
      tableNumber: runner.tableNumber,
      charge_Time: totalAddSeconds,
    });
    const resJson = await resp.json().catch(() => ({}));
    if (!resp.ok || resJson.error) {
      throw new Error(resJson.error || 'charge_failed');
    }

    const addedMins = Math.round(totalAddSeconds / 60);
    showTrackToast(
      `مدت ${toPersianDigits(addedMins)} دقیقه به میز ${toPersianDigits(runner.tableNumber)} اضافه شد.`
    );

    const customInput = document.getElementById('mgInspectorCustomMinutes');
    if (customInput) customInput.value = '';

    await refreshWorkspaceAfterMutation();
  } catch (err) {
    showTrackToast(err?.message && err.message !== 'charge_failed' ? err.message : 'تمدید زمان ثبت نشد.');
  } finally {
    trackState.busyAction = false;
    renderInspectorContent();
  }
}

async function handleConfirmEndSelectedTable() {
  if (trackState.busyAction || !trackState.selectedTable) return;
  const runner = trackState.runners.find(
    (r) => String(r.tableNumber) === String(trackState.selectedTable)
  );
  if (!runner) return;

  trackState.busyAction = true;
  renderInspectorContent();

  try {
    const gameCost = Math.max(0, runner.liveGameCost);
    const saveResp = await postFormUrlEncoded('./game_temporary.php', {
      gameCost,
      consoleType: runner.consoleType,
      priceType: runner.priceType,
      tableNumber: runner.tableNumber,
    });
    if (!saveResp.ok) throw new Error('save_game_failed');

    const delResp = await postFormUrlEncoded('./delete_reservation.php', {
      tableNumber: runner.tableNumber,
    });
    if (!delResp.ok && delResp.status !== 303) throw new Error('delete_res_failed');

    invalidateAllCaches();
    location.href = 'invoice.html?table=' + encodeURIComponent(runner.tableNumber);
  } catch {
    showTrackToast('پایان بازی ثبت نشد. لطفاً دوباره تلاش کنید.');
    trackState.busyAction = false;
    trackState.confirmEndTable = null;
    renderInspectorContent();
  }
}

function animationLoop(nowPerf) {
  trackState.rafId = requestAnimationFrame(animationLoop);

  if (document.hidden || !isOverviewVisible()) return;

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec !== trackState.lastSecondTick) {
    trackState.lastSecondTick = nowSec;
    recomputeRunners(nowSec);
    syncRunnerTokensDOM();
    updateCenterReadout();
    if (trackState.selectedTable) {
      renderInspectorContent();
    }
  }

  positionRunnersForFrame();
}

function bindTrackControlsOnce() {
  const section = document.getElementById('mgArenaTrackSection');
  if (!section || section.dataset.trackEventsBound === '1') return;
  section.dataset.trackEventsBound = '1';

  // Segmented mode switcher: live-run (real-time ~1 min/lap) vs true-pos (full session progress)
  section.querySelectorAll('[data-track-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-track-mode');
      if (mode !== 'live-run' && mode !== 'true-pos') return;
      trackState.mode = mode;
      trackState.frozenProgress.clear();
      section.querySelectorAll('[data-track-mode]').forEach((b) => {
        const active = b.getAttribute('data-track-mode') === mode;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      positionRunnersForFrame();
    });
  });

  // Inspector close button
  const closeBtn = document.getElementById('mgInspectorCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeTrackInspector());
  }

  // Start waiting table timer button
  const startBtn = document.getElementById('mgInspectorStartBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => handleStartSelectedTable());
  }

  // Quick extend buttons (+15, +30, +60 min)
  section.querySelectorAll('[data-extend-minutes]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mins = Number(btn.getAttribute('data-extend-minutes')) || 0;
      handleExtendSelectedTable(mins, 0);
    });
  });

  // Custom extend form
  const extendForm = document.getElementById('mgInspectorExtendForm');
  if (extendForm) {
    extendForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('mgInspectorCustomMinutes');
      const unitSelect = document.getElementById('mgInspectorCustomUnit');
      const rawVal = Number(toEnglishDigits(input ? input.value : '').replace(/[,٬\s]/g, '')) || 0;
      const unit = unitSelect ? unitSelect.value : 'minutes';
      if (unit === 'toman') {
        handleExtendSelectedTable(0, rawVal);
      } else {
        handleExtendSelectedTable(rawVal, 0);
      }
    });
  }

  // Two-step inline confirmation for End Session & Invoice
  const endBtn = document.getElementById('mgInspectorEndBtn');
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      if (!trackState.selectedTable) return;
      trackState.confirmEndTable = trackState.selectedTable;
      renderInspectorContent();
    });
  }

  const endConfirmYes = document.getElementById('mgInspectorEndConfirmYes');
  if (endConfirmYes) {
    endConfirmYes.addEventListener('click', () => handleConfirmEndSelectedTable());
  }

  const endConfirmCancel = document.getElementById('mgInspectorEndConfirmCancel');
  if (endConfirmCancel) {
    endConfirmCancel.addEventListener('click', () => {
      trackState.confirmEndTable = null;
      renderInspectorContent();
    });
  }

  // Close inspector on Escape
  if (!window.__mgTrackEscBound) {
    window.__mgTrackEscBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && trackState.selectedTable) {
        closeTrackInspector();
      }
    });
  }
}

/**
 * Public entry point called by dashboard-ui.js whenever Overview data loads or updates.
 */
export function updateHomeArenaTrack(data = {}) {
  const svg = document.getElementById('mgTrackSvg');
  if (!svg) return;

  buildStaticTrackSvg(svg);
  bindTrackControlsOnce();

  trackState.rawData = {
    reservations: Array.isArray(data.reservations) ? data.reservations : [],
    consoles: Array.isArray(data.consoles) ? data.consoles : [],
    clickTimes: Array.isArray(data.clickTimes) ? data.clickTimes : [],
    finishTimes: Array.isArray(data.finishTimes) ? data.finishTimes : [],
    buffetTemp: data.buffetTemp ?? [],
  };
  if (Number(data.stationCapacity) > 0) {
    trackState.stationCapacity = Number(data.stationCapacity);
  }

  const nowSec = Math.floor(Date.now() / 1000);
  trackState.lastSecondTick = nowSec;
  recomputeRunners(nowSec);
  syncRunnerTokensDOM();
  updateCenterReadout();
  positionRunnersForFrame();
  if (trackState.selectedTable) {
    renderInspectorContent();
  } else {
    syncInspectorVisibility();
  }

  if (!trackState.rafId) {
    trackState.animStartPerf = performance.now();
    trackState.rafId = requestAnimationFrame(animationLoop);
  }
}
