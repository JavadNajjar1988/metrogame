/**
 * مترو گیم — 5-Scene Scroll-Driven Cinematic Landing Engine (/landing)
 * Native browser scrolling (zero wheel hijacking), deterministic reversible timelines,
 * pointer-responsive depth, and full Dark/Light + Mobile parity.
 */
import {
  HERO_PREVIEW_TABS,
  SOFTWARE_TOUR_STOPS,
  HORIZONTAL_EXHIBITION_PANELS,
  TOURNAMENT_DISCIPLINES,
  SUBSCRIPTION_TIERS,
  resolveLandingTheme,
  getPreviewSrc,
  getTournamentDiscipline,
  getComparisonRows,
  getTierCapabilitiesSummary,
  computeStageTilt,
  computeMagneticOffset,
  computeAmbientState,
  computeSceneOneReveal,
  computeSceneTwoSoftware,
  computeSceneThreeHorizontal,
  computeSceneFourTournament,
  computeSceneFivePricing,
  toggleFaqState,
  validateDemoInquiry,
  clamp01,
} from './landing-logic.mjs?v=20261128-8';

const THEME_STORAGE_KEY = 'mg_theme_v1';
const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] || d);
}

const state = {
  theme: 'dark',
  heroTabId: 'overview',
  softwareStopIdx: 0,
  exhibitionPanelIdx: 0,
  disciplineId: 'video',
  selectedTierId: 'ultimate',
  compareCategory: 'all',
  openFaqId: 'faq-1',
  modalOpen: false,
  drawerOpen: false,
  // Pointer state for smooth restrained desktop depth
  pointerNormX: 0,
  pointerNormY: 0,
  stageTiltX: 0,
  stageTiltY: 0,
  stageGlintOpacity: 0,
  stageSpotX: 50,
  stageSpotY: 30,
};

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(pointer: fine) and (hover: hover)');
const mobileQuery = window.matchMedia('(max-width: 1024px)');

function isPinnedDesktopMode() {
  return !reducedMotionQuery.matches && !mobileQuery.matches;
}

/* ==========================================================================
   DOM REFERENCES
   ========================================================================== */
const dom = {
  header: document.getElementById('gdHeader'),
  scrollProgressBar: document.getElementById('gdScrollProgressBar'),
  navLinks: Array.from(document.querySelectorAll('.gd-nav-link')),
  themeToggle: document.getElementById('gdThemeToggle'),
  sunIcon: document.getElementById('gdSunIcon'),
  moonIcon: document.getElementById('gdMoonIcon'),
  menuToggle: document.getElementById('gdMenuToggle'),
  mobileDrawer: document.getElementById('gdMobileDrawer'),

  // Ambient Canvas
  orb1: document.getElementById('gdOrb1'),
  orb2: document.getElementById('gdOrb2'),
  orb3: document.getElementById('gdOrb3'),
  ambientMesh: document.getElementById('gdAmbientMesh'),

  // Scene 1: Dashboard Reveal
  sceneReveal: document.getElementById('scene-reveal'),
  revealBeam: document.getElementById('gdRevealBeam'),
  revealCopy: document.getElementById('gdRevealCopy'),
  heroLine1: document.getElementById('gdHeroLine1'),
  heroLine2: document.getElementById('gdHeroLine2'),
  floatRight: document.getElementById('gdRevealFloatRight'),
  floatLeft: document.getElementById('gdRevealFloatLeft'),
  revealStage: document.getElementById('gdRevealStage'),
  revealChrome: document.getElementById('gdRevealChrome'),
  revealFooter: document.getElementById('gdRevealFooter'),
  heroPreviewImg: document.getElementById('gdHeroPreviewImg'),
  heroRoute: document.getElementById('gdHeroRoute'),
  heroCaption: document.getElementById('gdHeroCaption'),
  heroTabs: Array.from(document.querySelectorAll('[data-hero-tab]')),
  scrollCue: document.getElementById('gdScrollCue'),

  // Scene 2: Enter The Software
  sceneSoftware: document.getElementById('scene-software'),
  softwareStepper: document.getElementById('gdSoftwareStepper'),
  softwareCounter: document.getElementById('gdSoftwareCounter'),
  softwareActiveLabel: document.getElementById('gdSoftwareActiveLabel'),
  softwareRoute: document.getElementById('gdSoftwareRoute'),
  softwareCamera: document.getElementById('gdSoftwareCamera'),
  softwareReticle: document.getElementById('gdSoftwareReticle'),
  softwareCallout: document.getElementById('gdSoftwareCallout'),
  softwareCalloutKicker: document.getElementById('gdSoftwareCalloutKicker'),
  softwareCalloutTitle: document.getElementById('gdSoftwareCalloutTitle'),
  softwareCalloutDesc: document.getElementById('gdSoftwareCalloutDesc'),
  softwareCalloutBullets: document.getElementById('gdSoftwareCalloutBullets'),

  // Scene 3: Horizontal Exhibition
  sceneExhibition: document.getElementById('scene-exhibition'),
  exhibitionViewport: document.getElementById('gdExhibitionViewport'),
  exhibitionTrack: document.getElementById('gdExhibitionTrack'),
  exhibitionCounter: document.getElementById('gdExhibitionCounter'),
  exhibitionProgressFill: document.getElementById('gdExhibitionProgressFill'),
  exhibitionDots: document.getElementById('gdExhibitionDots'),

  // Scene 4: Tournament Transformation
  sceneTournaments: document.getElementById('scene-tournaments'),
  disciplineBtns: Array.from(document.querySelectorAll('[data-discipline]')),
  disciplineSubtitle: document.getElementById('gdDisciplineSubtitle'),
  arenaBeats: Array.from(document.querySelectorAll('[data-beat-idx]')),
  h2hStage: document.getElementById('gdH2hStage'),
  clubACard: document.getElementById('gdClubACard'),
  clubBCard: document.getElementById('gdClubBCard'),
  clubAMono: document.getElementById('gdClubAMono'),
  clubAName: document.getElementById('gdClubAName'),
  clubACity: document.getElementById('gdClubACity'),
  clubARoster: document.getElementById('gdClubARoster'),
  clubARecord: document.getElementById('gdClubARecord'),
  clubBMono: document.getElementById('gdClubBMono'),
  clubBName: document.getElementById('gdClubBName'),
  clubBCity: document.getElementById('gdClubBCity'),
  clubBRoster: document.getElementById('gdClubBRoster'),
  clubBRecord: document.getElementById('gdClubBRecord'),
  vsEmblem: document.getElementById('gdVsEmblem'),
  vsPathLeft: document.getElementById('gdVsPathLeft'),
  vsPathRight: document.getElementById('gdVsPathRight'),
  arenaFormat: document.getElementById('gdArenaFormat'),
  arenaMode: document.getElementById('gdArenaMode'),
  arenaPrize: document.getElementById('gdArenaPrize'),
  bracketPanel: document.getElementById('gdBracketPanel'),
  bracketConnector: document.getElementById('gdBracketConnector'),
  championCard: document.getElementById('gdChampionCard'),
  leaderboardPanel: document.getElementById('gdLeaderboardPanel'),
  leaderboardBody: document.getElementById('gdLeaderboardBody'),
  brS1A: document.getElementById('gdBrS1A'),
  brS1B: document.getElementById('gdBrS1B'),
  brS1SA: document.getElementById('gdBrS1SA'),
  brS1SB: document.getElementById('gdBrS1SB'),
  brS2A: document.getElementById('gdBrS2A'),
  brS2B: document.getElementById('gdBrS2B'),
  brS2SA: document.getElementById('gdBrS2SA'),
  brS2SB: document.getElementById('gdBrS2SB'),
  brFinalA: document.getElementById('gdBrFinalA'),
  brFinalB: document.getElementById('gdBrFinalB'),
  brFinalStatus: document.getElementById('gdBrFinalStatus'),

  // Scene 5: Pricing Transformation + Inspector + Matrix
  scenePricing: document.getElementById('pricing'),
  pricingStage: document.getElementById('gdPricingStage'),
  pricingGrid: document.getElementById('gdPricingGrid'),
  inspectorPlanName: document.getElementById('gdInspectorPlanName'),
  inspectorPlanCount: document.getElementById('gdInspectorPlanCount'),
  planSwitchBtns: Array.from(document.querySelectorAll('[data-select-tier]')),
  compareTabs: Array.from(document.querySelectorAll('[data-compare-cat]')),
  compareTable: document.getElementById('gdCompareTable'),
  compareBody: document.getElementById('gdCompareBody'),

  // FAQ & Modal
  faqItems: Array.from(document.querySelectorAll('.gd-faq-item')),
  modalBackdrop: document.getElementById('gdInquiryModal'),
  closeModalBtn: document.getElementById('gdCloseModal'),
  inquiryForm: document.getElementById('gdInquiryForm'),
  tierSelect: document.getElementById('gdTierSelect'),
  inquirySuccess: document.getElementById('gdInquirySuccess'),
  successDetail: document.getElementById('gdSuccessDetail'),
  successDoneBtn: document.getElementById('gdSuccessDoneBtn'),
};

let softwareLayerImgs = [];
let softwareStepBtns = [];
let exhibitionPanelEls = [];
let exhibitionDotEls = [];
let pricingCardEls = [];
let pricingFeatureLists = [];
let exhibitionMaxTravel = 0;

/* ==========================================================================
   INITIAL DOM RENDERING FROM PURE DATA SOURCES
   ========================================================================== */
function renderSoftwareSceneMarkup() {
  if (dom.softwareStepper) {
    dom.softwareStepper.innerHTML = SOFTWARE_TOUR_STOPS.map(
      (stop, idx) => `
        <button
          type="button"
          class="gd-step-btn ${idx === 0 ? 'is-active' : ''}"
          role="tab"
          aria-selected="${idx === 0 ? 'true' : 'false'}"
          data-software-stop="${idx}"
        >
          <span class="gd-step-num">${stop.step}</span>
          <span>${stop.shortLabel}</span>
        </button>
      `
    ).join('');
    softwareStepBtns = Array.from(dom.softwareStepper.querySelectorAll('[data-software-stop]'));
  }

  if (dom.softwareCamera) {
    dom.softwareCamera.innerHTML = SOFTWARE_TOUR_STOPS.map((stop, idx) => {
      const src = state.theme === 'light' ? stop.lightSrc : stop.darkSrc;
      const clip = idx === 0 ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 0% 100%)';
      return `
        <img
          class="gd-software-layer gd-theme-screenshot"
          src="${src}"
          data-dark-src="${stop.darkSrc}"
          data-light-src="${stop.lightSrc}"
          alt="${stop.alt}"
          width="1440"
          height="900"
          referrerPolicy="no-referrer"
          style="z-index:${idx + 1}; clip-path:${clip};"
        >
      `;
    }).join('');
    softwareLayerImgs = Array.from(dom.softwareCamera.querySelectorAll('.gd-software-layer'));
  }

  updateSoftwareCallout(0);
}

function updateSoftwareCallout(index) {
  const stop = SOFTWARE_TOUR_STOPS[index] || SOFTWARE_TOUR_STOPS[0];
  state.softwareStopIdx = index;

  if (dom.softwareCounter) {
    dom.softwareCounter.textContent = `${stop.step} / ۰۵`;
  }
  if (dom.softwareActiveLabel) {
    dom.softwareActiveLabel.textContent = stop.shortLabel;
  }
  if (dom.softwareRoute) {
    dom.softwareRoute.textContent = stop.route;
  }
  if (dom.softwareCalloutKicker) {
    dom.softwareCalloutKicker.textContent = stop.kicker;
  }
  if (dom.softwareCalloutTitle) {
    dom.softwareCalloutTitle.textContent = stop.title;
  }
  if (dom.softwareCalloutDesc) {
    dom.softwareCalloutDesc.textContent = stop.description;
  }
  if (dom.softwareCalloutBullets) {
    dom.softwareCalloutBullets.innerHTML = stop.bullets.map((b) => `<li>${b}</li>`).join('');
  }
  if (dom.softwareCallout) {
    dom.softwareCallout.classList.toggle('is-side-right', stop.calloutSide === 'right');
    dom.softwareCallout.classList.toggle('is-side-left', stop.calloutSide === 'left');
  }
  softwareStepBtns.forEach((btn, idx) => {
    const active = idx === index;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function renderExhibitionMarkup() {
  if (dom.exhibitionTrack) {
    dom.exhibitionTrack.innerHTML = HORIZONTAL_EXHIBITION_PANELS.map((panel) => {
      const src = state.theme === 'light' ? panel.lightSrc : panel.darkSrc;
      return `
        <article class="gd-ex-panel is-${panel.layout}" data-ex-panel="${panel.id}">
          <div class="gd-ex-copy">
            <div>
              <div class="gd-ex-index-row">
                <span class="gd-tabular">${panel.index}</span>
                <span class="gd-sep" aria-hidden="true">·</span>
                <span>${panel.kicker}</span>
              </div>
              <h3 class="gd-ex-title">${panel.title}</h3>
            </div>
            <div>
              <p class="gd-ex-desc">${panel.description}</p>
              <ul class="gd-ex-points">
                ${panel.points.map((pt) => `<li>${pt}</li>`).join('')}
              </ul>
            </div>
          </div>
          <div class="gd-ex-media">
            <div class="gd-ex-media-bar">
              <span class="gd-chrome-url gd-ltr">${panel.route}</span>
              <div class="gd-chrome-dots" aria-hidden="true"><span></span><span></span><span></span></div>
            </div>
            <img
              class="gd-ex-img gd-theme-screenshot"
              src="${src}"
              data-dark-src="${panel.darkSrc}"
              data-light-src="${panel.lightSrc}"
              alt="${panel.alt}"
              width="1440"
              height="900"
              loading="lazy"
              referrerPolicy="no-referrer"
            >
          </div>
        </article>
      `;
    }).join('');
    exhibitionPanelEls = Array.from(dom.exhibitionTrack.querySelectorAll('.gd-ex-panel'));
  }

  if (dom.exhibitionDots) {
    dom.exhibitionDots.innerHTML = HORIZONTAL_EXHIBITION_PANELS.map(
      (panel, idx) => `
        <button
          type="button"
          class="gd-ex-dot ${idx === 0 ? 'is-active' : ''}"
          role="tab"
          aria-selected="${idx === 0 ? 'true' : 'false'}"
          aria-label="نمای ${panel.index}: ${panel.kicker}"
          data-ex-dot="${idx}"
        ></button>
      `
    ).join('');
    exhibitionDotEls = Array.from(dom.exhibitionDots.querySelectorAll('[data-ex-dot]'));
  }

  measureExhibitionTravel();
}

function measureExhibitionTravel() {
  if (!dom.exhibitionTrack || !dom.exhibitionViewport) {
    exhibitionMaxTravel = 0;
    return;
  }
  const viewportWidth = dom.exhibitionViewport.clientWidth;
  const trackWidth = dom.exhibitionTrack.scrollWidth;
  exhibitionMaxTravel = Math.max(0, trackWidth - viewportWidth);
}

function renderPricingCards() {
  if (!dom.pricingGrid) return;
  dom.pricingGrid.innerHTML = SUBSCRIPTION_TIERS.map((tier) => {
    const isSelected = tier.id === state.selectedTierId;
    return `
      <article
        class="gd-tier-card ${tier.featured ? 'is-featured' : ''} ${isSelected ? 'is-selected' : ''}"
        data-tier-card="${tier.id}"
        tabindex="0"
        role="button"
        aria-pressed="${isSelected ? 'true' : 'false'}"
      >
        <div class="gd-tier-head">
          <span class="gd-tier-kicker">${tier.featured ? 'پیشنهاد پرچم‌دار' : 'سطح اشتراک'}</span>
          <h3 class="gd-tier-name">${tier.persianName}</h3>
          <p class="gd-tier-sub">${tier.subtitle}</p>
        </div>

        <div class="gd-tier-pricing-box">
          <div class="gd-tier-price-slot">${tier.pricePlaceholder}</div>
          <div class="gd-tier-term-slot">${tier.termPlaceholder}</div>
        </div>

        <p class="gd-tier-summary">${tier.summary}</p>

        <ul class="gd-tier-features">
          ${tier.highlights
            .map(
              (item) => `
            <li class="${item.included ? '' : 'is-excluded'}">
              <span class="gd-tier-icon" aria-hidden="true">${item.included ? '✓' : '—'}</span>
              <span>${item.label}</span>
            </li>
          `
            )
            .join('')}
        </ul>

        <button
          type="button"
          class="gd-btn ${tier.featured ? 'gd-btn-primary' : 'gd-btn-secondary'}"
          data-open-inquiry="${tier.id}"
        >
          ${tier.ctaLabel}
        </button>
      </article>
    `;
  }).join('');

  pricingCardEls = Array.from(dom.pricingGrid.querySelectorAll('[data-tier-card]'));
  pricingFeatureLists = Array.from(dom.pricingGrid.querySelectorAll('.gd-tier-features'));

  pricingCardEls.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-inquiry]')) return;
      selectPricingTier(card.dataset.tierCard);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('[data-open-inquiry]')) return;
        e.preventDefault();
        selectPricingTier(card.dataset.tierCard);
      }
    });
  });
}

function renderComparisonTable() {
  if (!dom.compareBody) return;
  const rows = getComparisonRows(state.compareCategory);
  const tierKeys = ['standard', 'silver', 'gold', 'ultimate'];

  dom.compareBody.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td>
          <span class="gd-cmp-label">${row.label}</span>
          <span class="gd-cmp-note">${row.note}</span>
        </td>
        ${tierKeys
          .map((key) => {
            const included = row.tiers[key] === 'included';
            const selectedCls = key === state.selectedTierId ? 'is-selected-col' : '';
            return `
              <td data-tier-col="${key}" class="${selectedCls}">
                <span class="${included ? 'gd-cmp-check' : 'gd-cmp-dash'}" aria-label="${included ? 'فعال در این پلن' : 'غیرفعال در این پلن'}">
                  ${included ? '✓' : '—'}
                </span>
              </td>
            `;
          })
          .join('')}
      </tr>
    `
    )
    .join('');

  if (dom.compareTable) {
    dom.compareTable.querySelectorAll('thead th[data-tier-col]').forEach((th) => {
      th.classList.toggle('is-selected-col', th.dataset.tierCol === state.selectedTierId);
    });
  }
}

function selectPricingTier(tierId) {
  const summary = getTierCapabilitiesSummary(tierId);
  state.selectedTierId = summary.tierId;

  if (dom.inspectorPlanName) {
    dom.inspectorPlanName.textContent = `پلن ${summary.persianName}`;
  }
  if (dom.inspectorPlanCount) {
    dom.inspectorPlanCount.textContent = `${toPersianDigits(summary.includedCount)} از ${toPersianDigits(summary.totalCount)} قابلیت فعال`;
  }

  pricingCardEls.forEach((card) => {
    const active = card.dataset.tierCard === state.selectedTierId;
    card.classList.toggle('is-selected', active);
    card.setAttribute('aria-pressed', String(active));
  });

  dom.planSwitchBtns.forEach((btn) => {
    const active = btn.dataset.selectTier === state.selectedTierId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  renderComparisonTable();
}

function renderTournamentDiscipline(disciplineId) {
  const data = getTournamentDiscipline(disciplineId);
  state.disciplineId = data.id;

  dom.disciplineBtns.forEach((btn) => {
    const active = btn.dataset.discipline === data.id;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  if (dom.disciplineSubtitle) dom.disciplineSubtitle.textContent = data.subtitle;
  if (dom.clubAMono) dom.clubAMono.textContent = data.clubA.monogram;
  if (dom.clubAName) dom.clubAName.textContent = data.clubA.name;
  if (dom.clubACity) dom.clubACity.textContent = data.clubA.city;
  if (dom.clubARoster) dom.clubARoster.textContent = data.clubA.roster;
  if (dom.clubARecord) dom.clubARecord.textContent = data.clubA.record;

  if (dom.clubBMono) dom.clubBMono.textContent = data.clubB.monogram;
  if (dom.clubBName) dom.clubBName.textContent = data.clubB.name;
  if (dom.clubBCity) dom.clubBCity.textContent = data.clubB.city;
  if (dom.clubBRoster) dom.clubBRoster.textContent = data.clubB.roster;
  if (dom.clubBRecord) dom.clubBRecord.textContent = data.clubB.record;

  if (dom.arenaFormat) dom.arenaFormat.textContent = data.formatLabel;
  if (dom.arenaMode) dom.arenaMode.textContent = data.matchMode;
  if (dom.arenaPrize) dom.arenaPrize.textContent = data.prizeSummary;

  if (dom.brS1A) dom.brS1A.textContent = data.bracket.semi1.a;
  if (dom.brS1B) dom.brS1B.textContent = data.bracket.semi1.b;
  if (dom.brS1SA) dom.brS1SA.textContent = data.bracket.semi1.scoreA;
  if (dom.brS1SB) dom.brS1SB.textContent = data.bracket.semi1.scoreB;
  if (dom.brS2A) dom.brS2A.textContent = data.bracket.semi2.a;
  if (dom.brS2B) dom.brS2B.textContent = data.bracket.semi2.b;
  if (dom.brS2SA) dom.brS2SA.textContent = data.bracket.semi2.scoreA;
  if (dom.brS2SB) dom.brS2SB.textContent = data.bracket.semi2.scoreB;
  if (dom.brFinalA) dom.brFinalA.textContent = data.bracket.final.a;
  if (dom.brFinalB) dom.brFinalB.textContent = data.bracket.final.b;
  if (dom.brFinalStatus) dom.brFinalStatus.textContent = data.bracket.final.status;

  if (dom.leaderboardBody) {
    dom.leaderboardBody.innerHTML = data.leaderboard
      .map(
        (entry) => `
        <tr>
          <td>
            <div class="gd-lb-club-cell">
              <span class="gd-rank-badge rank-${entry.rank} gd-tabular">${toPersianDigits(entry.rank)}</span>
              <span>${entry.club}</span>
            </div>
          </td>
          <td class="gd-tabular">${entry.points}</td>
          <td class="gd-tabular">${entry.wins} / ${entry.losses}</td>
          <td class="gd-tabular">${entry.winRate}</td>
        </tr>
      `
      )
      .join('');
  }
}

/* ==========================================================================
   THEME SYSTEM (Updates Dark/Light Glass + All Scene Screenshots)
   ========================================================================== */
function applyTheme(rawTheme, persist = false) {
  const theme = resolveLandingTheme(rawTheme);
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (_) {
      // Ignore storage restrictions
    }
  }

  const isLight = theme === 'light';
  if (dom.sunIcon) dom.sunIcon.hidden = isLight;
  if (dom.moonIcon) dom.moonIcon.hidden = !isLight;
  if (dom.themeToggle) {
    const label = isLight ? 'تغییر به حالت تیره' : 'تغییر به حالت روشن';
    dom.themeToggle.setAttribute('aria-label', label);
    dom.themeToggle.setAttribute('title', label);
  }

  // Update Hero preview screenshot
  updateHeroTab(state.heroTabId, false);

  // Update all Dark/Light screenshots across Scenes 2 and 3
  document.querySelectorAll('.gd-theme-screenshot').forEach((img) => {
    const nextSrc = isLight ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (nextSrc && img.getAttribute('src') !== nextSrc) {
      img.setAttribute('src', nextSrc);
    }
  });
}

function updateHeroTab(tabId, animate = true) {
  const tab = HERO_PREVIEW_TABS.find((t) => t.id === tabId) || HERO_PREVIEW_TABS[0];
  state.heroTabId = tab.id;

  dom.heroTabs.forEach((btn) => {
    const active = btn.dataset.heroTab === tab.id;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  if (dom.heroRoute) dom.heroRoute.textContent = tab.route;
  if (dom.heroCaption) dom.heroCaption.textContent = tab.caption;

  const nextSrc = getPreviewSrc(tab.id, state.theme);
  if (dom.heroPreviewImg) {
    dom.heroPreviewImg.alt = tab.alt;
    if (dom.heroPreviewImg.getAttribute('src') !== nextSrc) {
      if (animate && !reducedMotionQuery.matches) {
        dom.heroPreviewImg.classList.add('is-swapping');
        window.setTimeout(() => {
          dom.heroPreviewImg.setAttribute('src', nextSrc);
          dom.heroPreviewImg.classList.remove('is-swapping');
        }, 120);
      } else {
        dom.heroPreviewImg.setAttribute('src', nextSrc);
      }
    }
  }
}

/* ==========================================================================
   UNIFIED 5-SCENE SCROLL & POINTER ENGINE (Single rAF Loop, Zero Wheel Hijack)
   ========================================================================== */
function getRunwayProgress(el) {
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const scrollable = Math.max(1, rect.height - window.innerHeight);
  return clamp01((-rect.top) / scrollable);
}

function getViewportEnterProgress(el, startRatio = 0.88, endRatio = 0.28) {
  if (!el) return 1;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 900;
  const startPx = vh * startRatio;
  const endPx = vh * endRatio;
  return clamp01((startPx - rect.top) / Math.max(1, startPx - endPx));
}

function applySceneOne(progress) {
  const s = computeSceneOneReveal(progress);
  if (dom.sceneReveal) dom.sceneReveal.dataset.phase = String(s.phase);

  if (dom.heroLine1) {
    dom.heroLine1.style.transform = `translate3d(${s.line1X}px, 0, 0)`;
  }
  if (dom.heroLine2) {
    dom.heroLine2.style.transform = `translate3d(${s.line2X}px, 0, 0)`;
  }
  if (dom.revealCopy) {
    dom.revealCopy.style.transform = `translate3d(0, ${s.copyY}px, 0) scale(${s.copyScale})`;
    dom.revealCopy.style.opacity = String(s.copyOpacity);
    dom.revealCopy.style.pointerEvents = s.copyOpacity < 0.2 ? 'none' : 'auto';
  }
  if (dom.floatRight) {
    dom.floatRight.style.transform = `translate3d(${s.floatSpreadX}px, -50%, 0)`;
    dom.floatRight.style.opacity = String(s.floatOpacity);
  }
  if (dom.floatLeft) {
    dom.floatLeft.style.transform = `translate3d(${-s.floatSpreadX}px, -50%, 0)`;
    dom.floatLeft.style.opacity = String(s.floatOpacity);
  }
  if (dom.revealBeam) {
    dom.revealBeam.style.transform = `scale(${s.focusBeamScale})`;
    dom.revealBeam.style.opacity = String(s.focusBeamOpacity);
  }
  if (dom.revealStage) {
    const rx = Number((s.stageRotateX + state.stageTiltX).toFixed(2));
    const ry = Number((s.stageRotateY + state.stageTiltY).toFixed(2));
    dom.revealStage.style.transform =
      `translate3d(0, ${s.stageY}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${s.stageScale})`;
    dom.revealStage.style.borderRadius = `${s.stageRadius}px`;
    dom.revealStage.style.setProperty('--spot-x', `${state.stageSpotX}%`);
    dom.revealStage.style.setProperty('--spot-y', `${state.stageSpotY}%`);
    dom.revealStage.style.setProperty('--glint-opacity', String(state.stageGlintOpacity));
  }
  if (dom.revealChrome) {
    dom.revealChrome.style.opacity = String(Math.max(0.55, s.chromeOpacity));
  }
  if (dom.scrollCue) {
    dom.scrollCue.style.opacity = String(clamp01(1 - progress * 5));
  }
}

function applySceneTwo(progress) {
  const s = computeSceneTwoSoftware(progress, SOFTWARE_TOUR_STOPS.length);
  if (dom.sceneSoftware) dom.sceneSoftware.dataset.activeStop = String(s.activeIndex);

  if (dom.softwareCamera) {
    dom.softwareCamera.style.transform =
      `translate3d(${s.cameraX}%, ${s.cameraY}%, 0) scale(${s.cameraScale})`;
  }

  softwareLayerImgs.forEach((img, idx) => {
    const layer = s.layers[idx];
    if (!layer) return;
    img.style.clipPath = `inset(0% 0% 0% ${layer.clipPct}%)`;
  });

  if (dom.softwareReticle) {
    dom.softwareReticle.style.left = `${s.focusBox.x}%`;
    dom.softwareReticle.style.top = `${s.focusBox.y}%`;
    dom.softwareReticle.style.width = `${s.focusBox.w}%`;
    dom.softwareReticle.style.height = `${s.focusBox.h}%`;
  }

  if (dom.softwareCallout) {
    dom.softwareCallout.style.opacity = String(s.calloutOpacity);
    dom.softwareCallout.style.transform = `translate3d(0, ${s.calloutShiftY}px, 0)`;
  }

  if (s.activeIndex !== state.softwareStopIdx) {
    updateSoftwareCallout(s.activeIndex);
  }
}

function applySceneThree(progress) {
  const s = computeSceneThreeHorizontal(
    progress,
    HORIZONTAL_EXHIBITION_PANELS.length,
    exhibitionMaxTravel
  );
  if (dom.sceneExhibition) {
    dom.sceneExhibition.dataset.activePanel = String(s.activeIndex);
    dom.sceneExhibition.dataset.travelX = String(s.trackTranslateX);
  }

  if (dom.exhibitionTrack) {
    // RTL flex-direction: row puts upcoming panels to the left; positive +X brings them into view
    dom.exhibitionTrack.style.transform = `translate3d(${s.trackTranslateX}px, 0, 0)`;
  }

  if (dom.exhibitionProgressFill) {
    dom.exhibitionProgressFill.style.transform = `scaleX(${Math.max(0.06, s.easedProgress)})`;
  }

  exhibitionPanelEls.forEach((panelEl, idx) => {
    const p = s.panels[idx];
    if (!p) return;
    panelEl.style.transform = `translate3d(0, 0, ${p.depthZ}px) rotateY(${p.rotateY}deg) scale(${p.scale})`;
    panelEl.style.opacity = String(p.opacity);
  });

  if (s.activeIndex !== state.exhibitionPanelIdx) {
    state.exhibitionPanelIdx = s.activeIndex;
    const panelData = HORIZONTAL_EXHIBITION_PANELS[s.activeIndex];
    if (dom.exhibitionCounter && panelData) {
      dom.exhibitionCounter.textContent = `${panelData.index} / ۰۵`;
    }
    exhibitionDotEls.forEach((dot, idx) => {
      const active = idx === s.activeIndex;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  }
}

function applySceneFour(progress) {
  const s = computeSceneFourTournament(progress);
  if (dom.sceneTournaments) dom.sceneTournaments.dataset.beat = String(s.beatIndex);

  dom.arenaBeats.forEach((beat, idx) => {
    beat.classList.toggle('is-active', idx <= s.beatIndex);
  });

  if (dom.h2hStage) {
    dom.h2hStage.style.transform = `translate3d(0, ${s.h2hShiftY}px, 0) scale(${s.h2hScale})`;
  }
  if (dom.clubACard) {
    dom.clubACard.style.transform = `translate3d(${s.homeCenterOffsetPct}%, 0, 0) scale(${s.homeScale})`;
  }
  if (dom.clubBCard) {
    dom.clubBCard.style.transform = `translate3d(${s.challengerOffsetX}px, 0, 0) scale(${s.challengerScale})`;
    dom.clubBCard.style.opacity = String(s.challengerOpacity);
  }
  if (dom.vsEmblem) {
    dom.vsEmblem.style.transform = `scale(${s.vsScale})`;
    dom.vsEmblem.style.opacity = String(s.vsOpacity);
  }
  if (dom.vsPathLeft) dom.vsPathLeft.style.strokeDashoffset = String(s.vsDashOffset);
  if (dom.vsPathRight) dom.vsPathRight.style.strokeDashoffset = String(s.vsDashOffset);

  if (dom.bracketPanel) {
    dom.bracketPanel.style.opacity = String(s.bracketOpacity);
    dom.bracketPanel.style.transform = `translate3d(0, ${s.bracketY}px, 0) scale(${s.bracketScale})`;
  }
  if (dom.bracketConnector) {
    dom.bracketConnector.querySelectorAll('path').forEach((path) => {
      path.style.strokeDashoffset = String(s.bracketDashOffset);
    });
  }
  if (dom.championCard) {
    dom.championCard.classList.toggle('is-champion-lit', s.championHighlight > 0.55);
  }
  if (dom.leaderboardPanel) {
    dom.leaderboardPanel.style.opacity = String(s.leaderboardOpacity);
    dom.leaderboardPanel.style.transform = `translate3d(0, ${s.leaderboardY}px, 0)`;
  }
}

function applySceneFive(progress) {
  const s = computeSceneFivePricing(progress);
  if (dom.scenePricing) dom.scenePricing.dataset.settled = String(s.settled);

  pricingCardEls.forEach((card, idx) => {
    const c = s.cards[idx];
    if (!c) return;
    if (s.settled) {
      card.style.transform = 'translate3d(0px, 0px, 0) scale(1)';
      card.style.opacity = '1';
    } else {
      card.style.transform =
        `translate3d(${c.offsetX}px, ${c.offsetY}px, 0) rotateY(${c.rotateY}deg) scale(${c.scale})`;
      card.style.opacity = String(c.opacity);
    }
  });

  pricingFeatureLists.forEach((list) => {
    list.style.opacity = String(s.settled ? 1 : s.featureOpacity);
  });
}

function updateActiveNavLink() {
  const sections = [
    dom.sceneReveal,
    dom.sceneSoftware,
    dom.sceneExhibition,
    dom.sceneTournaments,
    dom.scenePricing,
  ].filter(Boolean);

  const marker = window.innerHeight * 0.35;
  let activeId = 'scene-reveal';
  for (const sec of sections) {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= marker) {
      activeId = sec.id;
    }
  }

  dom.navLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.navTarget === activeId);
  });
}

let rafId = 0;

function tick() {
  rafId = 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const globalProgress = clamp01(scrollY / maxScroll);

  // Header & global progress rail
  if (dom.header) dom.header.classList.toggle('is-scrolled', scrollY > 18);
  if (dom.scrollProgressBar) {
    dom.scrollProgressBar.style.transform = `scaleX(${globalProgress.toFixed(4)})`;
  }

  // Ambient glass orbs (scroll + restrained pointer depth)
  if (!reducedMotionQuery.matches) {
    const amb = computeAmbientState(globalProgress);
    const px = state.pointerNormX * 14;
    const py = state.pointerNormY * 10;
    if (dom.orb1) dom.orb1.style.transform = `translate3d(${amb.orb1X + px}px, ${amb.orb1Y + py}px, 0)`;
    if (dom.orb2) dom.orb2.style.transform = `translate3d(${amb.orb2X - px * 0.8}px, ${amb.orb2Y - py * 0.6}px, 0)`;
    if (dom.orb3) dom.orb3.style.transform = `translate3d(${amb.orb3X + px * 0.6}px, ${amb.orb3Y + py * 0.8}px, 0)`;
    if (dom.ambientMesh) dom.ambientMesh.style.transform = `translate3d(0, ${amb.depthShiftY}px, 0)`;
  }

  if (isPinnedDesktopMode()) {
    applySceneOne(getRunwayProgress(dom.sceneReveal));
    applySceneTwo(getRunwayProgress(dom.sceneSoftware));
    applySceneThree(getRunwayProgress(dom.sceneExhibition));
    applySceneFour(getRunwayProgress(dom.sceneTournaments));
    applySceneFive(getViewportEnterProgress(dom.pricingStage, 0.90, 0.34));
  }

  updateActiveNavLink();
}

function scheduleTick() {
  if (!rafId) {
    rafId = window.requestAnimationFrame(tick);
  }
}

/* ==========================================================================
   DIRECT JUMP HELPERS FOR STEPPER / EXHIBITION CONTROLS
   ========================================================================== */
function scrollToRunwayFraction(runwayEl, fraction) {
  if (!runwayEl) return;
  const top = runwayEl.getBoundingClientRect().top + window.scrollY;
  const scrollable = Math.max(0, runwayEl.offsetHeight - window.innerHeight);
  const targetY = Math.round(top + scrollable * clamp01(fraction));
  window.scrollTo({ top: targetY, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
}

function selectMobileSoftwareStop(index) {
  const stop = SOFTWARE_TOUR_STOPS[index] || SOFTWARE_TOUR_STOPS[0];
  updateSoftwareCallout(index);
  softwareLayerImgs.forEach((img, i) => {
    img.style.clipPath = i <= index ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 0% 100%)';
  });
  if (dom.softwareCamera) {
    dom.softwareCamera.style.transform = 'none';
  }
  if (dom.softwareReticle) {
    dom.softwareReticle.style.left = `${stop.focusBox.x}%`;
    dom.softwareReticle.style.top = `${stop.focusBox.y}%`;
    dom.softwareReticle.style.width = `${stop.focusBox.w}%`;
    dom.softwareReticle.style.height = `${stop.focusBox.h}%`;
  }
}

/* ==========================================================================
   POINTER DEPTH & MAGNETIC CTA INTERACTIONS (DESKTOP FINE POINTER ONLY)
   ========================================================================== */
function initPointerInteractions() {
  if (!finePointerQuery.matches || reducedMotionQuery.matches) return;

  window.addEventListener(
    'pointermove',
    (e) => {
      state.pointerNormX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      state.pointerNormY = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
      scheduleTick();
    },
    { passive: true }
  );

  // Subtle tilt + glass glint on Scene 1 Dashboard Frame
  if (dom.revealStage) {
    dom.revealStage.addEventListener('pointermove', (e) => {
      const rect = dom.revealStage.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      const tilt = computeStageTilt(nx, ny, 2.4);
      state.stageTiltX = tilt.rotateX;
      state.stageTiltY = tilt.rotateY;
      state.stageSpotX = tilt.spotX;
      state.stageSpotY = tilt.spotY;
      state.stageGlintOpacity = 1;
      scheduleTick();
    });

    dom.revealStage.addEventListener('pointerleave', () => {
      state.stageTiltX = 0;
      state.stageTiltY = 0;
      state.stageGlintOpacity = 0;
      scheduleTick();
    });
  }

  // Subtle magnetic pull on primary CTAs
  document.querySelectorAll('.gd-magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const ny = ((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1;
      const { tx, ty } = computeMagneticOffset(nx, ny, 5.5);
      btn.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });

    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ==========================================================================
   MODAL, FAQ, DRAWER & EVENT WIRING
   ========================================================================== */
function setMobileDrawer(open) {
  state.drawerOpen = Boolean(open);
  if (dom.mobileDrawer) {
    dom.mobileDrawer.classList.toggle('is-open', state.drawerOpen);
    dom.mobileDrawer.setAttribute('aria-hidden', String(!state.drawerOpen));
  }
  if (dom.menuToggle) {
    dom.menuToggle.setAttribute('aria-expanded', String(state.drawerOpen));
  }
}

function openInquiryModal(tierId = 'ultimate') {
  state.modalOpen = true;
  if (dom.tierSelect) dom.tierSelect.value = tierId;
  if (dom.inquiryForm) dom.inquiryForm.hidden = false;
  if (dom.inquirySuccess) dom.inquirySuccess.hidden = true;
  clearFormErrors();

  if (dom.modalBackdrop) {
    dom.modalBackdrop.classList.add('is-open');
    dom.modalBackdrop.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('gd-modal-open');
  const firstInput = document.getElementById('gdFullName');
  if (firstInput) window.setTimeout(() => firstInput.focus(), 80);
}

function closeInquiryModal() {
  state.modalOpen = false;
  if (dom.modalBackdrop) {
    dom.modalBackdrop.classList.remove('is-open');
    dom.modalBackdrop.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('gd-modal-open');
}

function clearFormErrors() {
  document.querySelectorAll('[data-error-for]').forEach((el) => {
    el.textContent = '';
  });
}

function initScrollReveals() {
  const revealEls = Array.from(document.querySelectorAll('.gd-reveal'));
  if (!('IntersectionObserver' in window) || reducedMotionQuery.matches) {
    revealEls.forEach((el) => el.classList.add('is-inview'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-inview');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );
  revealEls.forEach((el) => io.observe(el));
}

function bindEvents() {
  if (dom.themeToggle) {
    dom.themeToggle.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark', true);
    });
  }

  if (dom.menuToggle) {
    dom.menuToggle.addEventListener('click', () => setMobileDrawer(!state.drawerOpen));
  }

  document.querySelectorAll('[data-mobile-link]').forEach((link) => {
    link.addEventListener('click', () => setMobileDrawer(false));
  });

  // Scene 1 Hero Preview Tabs
  dom.heroTabs.forEach((btn) => {
    btn.addEventListener('click', () => updateHeroTab(btn.dataset.heroTab, true));
  });

  // Scene 2 Software Stepper Clicks
  softwareStepBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.softwareStop) || 0;
      if (isPinnedDesktopMode()) {
        const fraction = SOFTWARE_TOUR_STOPS.length > 1 ? idx / (SOFTWARE_TOUR_STOPS.length - 1) : 0;
        scrollToRunwayFraction(dom.sceneSoftware, fraction);
      } else {
        selectMobileSoftwareStop(idx);
      }
    });
  });

  // Scene 3 Exhibition Dot Clicks
  exhibitionDotEls.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = Number(dot.dataset.exDot) || 0;
      if (isPinnedDesktopMode()) {
        const fraction =
          HORIZONTAL_EXHIBITION_PANELS.length > 1
            ? 0.04 + (idx / (HORIZONTAL_EXHIBITION_PANELS.length - 1)) * 0.92
            : 0;
        scrollToRunwayFraction(dom.sceneExhibition, fraction);
      } else if (exhibitionPanelEls[idx]) {
        exhibitionPanelEls[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // Scene 4 Discipline Tabs
  dom.disciplineBtns.forEach((btn) => {
    btn.addEventListener('click', () => renderTournamentDiscipline(btn.dataset.discipline));
  });

  // Scene 5 Inspector & Comparison Category Tabs
  dom.planSwitchBtns.forEach((btn) => {
    btn.addEventListener('click', () => selectPricingTier(btn.dataset.selectTier));
  });

  dom.compareTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.compareCategory = btn.dataset.compareCat || 'all';
      dom.compareTabs.forEach((t) => {
        const active = t === btn;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', String(active));
      });
      renderComparisonTable();
    });
  });

  // FAQ Accordion
  dom.faqItems.forEach((item) => {
    const trigger = item.querySelector('.gd-faq-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const nextOpenId = toggleFaqState(state.openFaqId, item.dataset.faqId);
      state.openFaqId = nextOpenId;
      dom.faqItems.forEach((other) => {
        const isOpen = other.dataset.faqId === nextOpenId;
        other.classList.toggle('is-open', isOpen);
        const btn = other.querySelector('.gd-faq-trigger');
        if (btn) btn.setAttribute('aria-expanded', String(isOpen));
      });
    });
  });

  // Consultation Modal Triggers (delegated so dynamically rendered pricing buttons work)
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-inquiry]');
    if (trigger) {
      e.preventDefault();
      openInquiryModal(trigger.dataset.openInquiry || 'ultimate');
    }
  });

  if (dom.closeModalBtn) dom.closeModalBtn.addEventListener('click', closeInquiryModal);
  if (dom.successDoneBtn) dom.successDoneBtn.addEventListener('click', closeInquiryModal);
  if (dom.modalBackdrop) {
    dom.modalBackdrop.addEventListener('click', (e) => {
      if (e.target === dom.modalBackdrop) closeInquiryModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.modalOpen) closeInquiryModal();
      if (state.drawerOpen) setMobileDrawer(false);
    }
  });

  if (dom.inquiryForm) {
    dom.inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearFormErrors();
      const formData = new FormData(dom.inquiryForm);
      const result = validateDemoInquiry({
        fullName: formData.get('fullName'),
        centerName: formData.get('centerName'),
        phone: formData.get('phone'),
        tierId: formData.get('tierId'),
        notes: formData.get('notes'),
      });

      if (!result.ok) {
        Object.entries(result.errors).forEach(([field, msg]) => {
          const errEl = document.querySelector(`[data-error-for="${field}"]`);
          if (errEl) errEl.textContent = msg;
        });
        return;
      }

      if (dom.successDetail) {
        dom.successDetail.textContent =
          `سپاس ${result.normalized.fullName} عزیز؛ درخواست مشاوره برای مجموعه «${result.normalized.centerName}» (${result.normalized.tierLabel}) ثبت شد. کارشناسان مترو گیم به‌زودی با شماره ${result.normalized.phone} تماس می‌گیرند.`;
      }
      dom.inquiryForm.hidden = true;
      if (dom.inquirySuccess) dom.inquirySuccess.hidden = false;
      dom.inquiryForm.reset();
    });
  }

  // Scroll & Resize Listeners
  window.addEventListener('scroll', scheduleTick, { passive: true });
  window.addEventListener(
    'resize',
    () => {
      measureExhibitionTravel();
      scheduleTick();
    },
    { passive: true }
  );
}

/* ==========================================================================
   BOOT
   ========================================================================== */
function init() {
  const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  state.theme = resolveLandingTheme(initialTheme);

  renderSoftwareSceneMarkup();
  renderExhibitionMarkup();
  renderPricingCards();
  selectPricingTier('ultimate');
  renderTournamentDiscipline('video');
  applyTheme(state.theme, false);

  initScrollReveals();
  bindEvents();
  initPointerInteractions();

  // Compute initial frame immediately
  measureExhibitionTravel();
  tick();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
