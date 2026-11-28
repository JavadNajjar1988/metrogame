/**
 * Standalone interactive & continuous scroll-driven motion controller for /landing
 * (مترو گیم — Cinematic Premium Glass SaaS Landing Page).
 * 100% isolated from existing administration dashboard scripts.
 */
import {
  HERO_PREVIEW_TABS,
  FEATURE_STORY_CHAPTERS,
  PINNED_STORY_STAGES,
  SUBSCRIPTION_TIERS,
  resolveLandingTheme,
  getPreviewSrc,
  getFeatureChapter,
  getTournamentDiscipline,
  getComparisonRows,
  getTierCapabilitiesSummary,
  clamp01,
  computeHeroScrollState,
  computePinnedStoryState,
  computeTournamentRevealState,
  computeAmbientState,
  computeMagneticOffset,
  computeStageTilt,
  toggleFaqState,
  validateDemoInquiry,
} from './landing-logic.mjs?v=20261128-7';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianNumber(num) {
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] || d);
}

const state = {
  theme: resolveLandingTheme(document.documentElement.getAttribute('data-theme')),
  activeHeroTab: 'overview',
  activeJourneyIndex: 0,
  activeStoryId: 'stations',
  activeStoryLayer: 'A',
  activeDiscipline: 'video',
  selectedTierId: 'ultimate',
  activeCompareCat: 'all',
  openFaqId: 'faq-1',
  mobileMenuOpen: false,
  lastTournamentBeat: -1,
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isFinePointer =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const CHECK_ICON_SVG =
  '<svg class="gd-check-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"></path></svg>';

const DASH_ICON_SVG =
  '<svg class="gd-dash-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h8"></path></svg>';

const CHEVRON_SVG =
  '<svg class="gd-story-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3.5 5.5 8 10 12.5"></path></svg>';

/* ==========================================================================
   1. THEME MANAGEMENT (Live Screenshot Swapping Across All Layers)
   ========================================================================== */

function syncThemeIcons(theme) {
  const sun = document.getElementById('gdSunIcon');
  const moon = document.getElementById('gdMoonIcon');
  const btn = document.getElementById('gdThemeToggle');
  if (sun) sun.toggleAttribute('hidden', theme === 'light');
  if (moon) moon.toggleAttribute('hidden', theme !== 'light');
  if (btn) {
    const label = theme === 'light' ? 'تغییر به حالت تاریک' : 'تغییر به حالت روشن';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }
}

function swapAllScreenshots(theme) {
  const heroImg = document.getElementById('gdHeroPreviewImg');
  if (heroImg) {
    heroImg.src = getPreviewSrc(state.activeHeroTab, theme);
  }

  // Update all 4 stacked pinned storytelling layers
  document.querySelectorAll('.gd-journey-layer-img').forEach((img) => {
    const nextSrc = theme === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (nextSrc && img.getAttribute('src') !== nextSrc) {
      img.setAttribute('src', nextSrc);
    }
  });

  // Update dual-layer feature preview stage
  const storyChapter = getFeatureChapter(state.activeStoryId);
  const storySrc = theme === 'light' ? storyChapter.lightSrc : storyChapter.darkSrc;
  const imgA = document.getElementById('gdStoryStageImgA');
  const imgB = document.getElementById('gdStoryStageImgB');
  if (imgA && imgA.classList.contains('is-active')) imgA.src = storySrc;
  if (imgB && imgB.classList.contains('is-active')) imgB.src = storySrc;

  // Update remaining static theme-aware screenshots
  document.querySelectorAll('.gd-theme-screenshot').forEach((img) => {
    const nextSrc = theme === 'light' ? img.dataset.lightSrc : img.dataset.darkSrc;
    if (nextSrc && img.getAttribute('src') !== nextSrc) {
      img.setAttribute('src', nextSrc);
    }
  });
}

function applyTheme(nextTheme) {
  state.theme = resolveLandingTheme(nextTheme);
  document.documentElement.setAttribute('data-theme', state.theme);
  try {
    localStorage.setItem('mg_theme_v1', state.theme);
  } catch {
    // ignore restricted storage
  }
  syncThemeIcons(state.theme);
  swapAllScreenshots(state.theme);
}

/* ==========================================================================
   2. HERO ENTRANCE & PREVIEW TABS
   ========================================================================== */

function triggerHeroEntrance() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  if (prefersReducedMotion) {
    hero.classList.add('is-entered');
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add('is-entered');
    });
  });
}

function setHeroPreviewTab(tabId) {
  const tab = HERO_PREVIEW_TABS.find((t) => t.id === tabId) || HERO_PREVIEW_TABS[0];
  state.activeHeroTab = tab.id;

  const img = document.getElementById('gdHeroPreviewImg');
  const routeEl = document.getElementById('gdHeroRoute');
  const captionEl = document.getElementById('gdHeroCaption');

  document.querySelectorAll('[data-hero-tab]').forEach((btn) => {
    const active = btn.dataset.heroTab === tab.id;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (routeEl) routeEl.textContent = tab.route;
  if (captionEl) captionEl.textContent = tab.caption;

  if (img) {
    const targetSrc = getPreviewSrc(tab.id, state.theme);
    if (img.getAttribute('src') !== targetSrc) {
      img.classList.add('is-swapping');
      window.setTimeout(() => {
        img.src = targetSrc;
        img.alt = tab.alt;
        img.classList.remove('is-swapping');
      }, 130);
    }
  }
}

/* ==========================================================================
   3. PINNED 4-STAGE SCROLL STORYTELLING (#product-journey)
   ========================================================================== */

function renderPinnedJourney() {
  const stepsEl = document.getElementById('gdJourneySteps');
  const layersEl = document.getElementById('gdJourneyLayers');
  const dotsEl = document.getElementById('gdJourneyDots');
  const mobileTabsEl = document.getElementById('gdJourneyMobileTabs');

  if (stepsEl) {
    stepsEl.innerHTML = PINNED_STORY_STAGES.map((stage, idx) => {
      const active = idx === 0;
      const metricsHtml = stage.metrics
        .map((m) => `<li>${CHECK_ICON_SVG}<span>${m}</span></li>`)
        .join('');

      return `
        <button
          type="button"
          class="gd-journey-step${active ? ' is-active' : ''}"
          data-journey-step="${idx}"
          aria-pressed="${active ? 'true' : 'false'}"
        >
          <div class="gd-journey-step-top">
            <span class="gd-journey-step-kicker">${stage.kicker}</span>
            <span class="gd-journey-step-num">${stage.stepNumber}</span>
          </div>
          <h3 class="gd-journey-step-title">${stage.title}</h3>
          <p class="gd-journey-step-desc">${stage.description}</p>
          <ul class="gd-journey-step-list">${metricsHtml}</ul>
          <div class="gd-journey-step-progress" aria-hidden="true">
            <div class="gd-journey-step-progress-fill"></div>
          </div>
        </button>
      `;
    }).join('');
  }

  if (layersEl) {
    layersEl.innerHTML = PINNED_STORY_STAGES.map((stage, idx) => {
      const src = state.theme === 'light' ? stage.lightSrc : stage.darkSrc;
      return `
        <div class="gd-journey-layer${idx === 0 ? ' is-primary' : ''}" data-journey-layer="${idx}">
          <img
            class="gd-journey-layer-img"
            src="${src}"
            data-dark-src="${stage.darkSrc}"
            data-light-src="${stage.lightSrc}"
            alt="${stage.alt}"
            width="1440"
            height="900"
            referrerPolicy="no-referrer"
          >
        </div>
      `;
    }).join('');
  }

  if (dotsEl) {
    dotsEl.innerHTML = PINNED_STORY_STAGES.map(
      (stage, idx) => `
        <button
          type="button"
          class="gd-journey-dot${idx === 0 ? ' is-active' : ''}"
          role="tab"
          aria-selected="${idx === 0 ? 'true' : 'false'}"
          aria-label="مرحله ${stage.stepNumber}: ${stage.title}"
          data-journey-jump="${idx}"
        ></button>
      `
    ).join('');
  }

  if (mobileTabsEl) {
    mobileTabsEl.innerHTML = PINNED_STORY_STAGES.map(
      (stage, idx) => `
        <button
          type="button"
          class="gd-journey-mobile-tab${idx === 0 ? ' is-active' : ''}"
          role="tab"
          aria-selected="${idx === 0 ? 'true' : 'false'}"
          data-journey-mobile="${idx}"
        >${stage.stepNumber} · ${stage.kicker.split('·')[1]?.trim() || stage.title}</button>
      `
    ).join('');
  }

  const jumpToStage = (idx, shouldScrollOnDesktop = true) => {
    const clamped = Math.max(0, Math.min(PINNED_STORY_STAGES.length - 1, Number(idx) || 0));
    if (window.innerWidth > 1024 && shouldScrollOnDesktop) {
      const targetCard = stepsEl?.querySelector(`[data-journey-step="${clamped}"]`);
      if (targetCard) {
        const rect = targetCard.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - Math.round(window.innerHeight * 0.28);
        window.scrollTo({ top: Math.max(0, targetY), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    } else {
      applyDiscreteJourneyStage(clamped);
    }
  };

  stepsEl?.querySelectorAll('[data-journey-step]').forEach((btn) => {
    btn.addEventListener('click', () => jumpToStage(btn.dataset.journeyStep, true));
  });

  dotsEl?.querySelectorAll('[data-journey-jump]').forEach((btn) => {
    btn.addEventListener('click', () => jumpToStage(btn.dataset.journeyJump, true));
  });

  mobileTabsEl?.querySelectorAll('[data-journey-mobile]').forEach((btn) => {
    btn.addEventListener('click', () => applyDiscreteJourneyStage(Number(btn.dataset.journeyMobile)));
  });

  applyJourneyMeta(0);
}

function applyJourneyMeta(stageIndex) {
  const stage = PINNED_STORY_STAGES[stageIndex] || PINNED_STORY_STAGES[0];
  state.activeJourneyIndex = stageIndex;

  const counterEl = document.getElementById('gdJourneyCounter');
  const titleEl = document.getElementById('gdJourneyStageTitle');
  const routeEl = document.getElementById('gdJourneyStageRoute');
  const focusLabelEl = document.getElementById('gdJourneyFocusLabel');
  const focusBoxEl = document.getElementById('gdJourneyFocusBox');

  if (counterEl) counterEl.textContent = `${stage.stepNumber} / ۰۴`;
  if (titleEl) titleEl.textContent = stage.title;
  if (routeEl) routeEl.textContent = stage.route;
  if (focusLabelEl) focusLabelEl.textContent = stage.focusLabel;

  if (focusBoxEl && stage.focusBox) {
    focusBoxEl.style.left = `${stage.focusBox.x}%`;
    focusBoxEl.style.top = `${stage.focusBox.y}%`;
    focusBoxEl.style.width = `${stage.focusBox.w}%`;
    focusBoxEl.style.height = `${stage.focusBox.h}%`;
  }

  document.querySelectorAll('[data-journey-step]').forEach((btn) => {
    const active = Number(btn.dataset.journeyStep) === stageIndex;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  document.querySelectorAll('[data-journey-jump]').forEach((btn) => {
    const active = Number(btn.dataset.journeyJump) === stageIndex;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  document.querySelectorAll('[data-journey-mobile]').forEach((btn) => {
    const active = Number(btn.dataset.journeyMobile) === stageIndex;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
}

function applyDiscreteJourneyStage(stageIndex) {
  const clamped = Math.max(0, Math.min(PINNED_STORY_STAGES.length - 1, stageIndex));
  applyJourneyMeta(clamped);

  document.querySelectorAll('[data-journey-layer]').forEach((layer) => {
    const idx = Number(layer.dataset.journeyLayer);
    const active = idx === clamped;
    layer.style.opacity = active ? '1' : '0';
    layer.style.transform = active ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 12px, 0) scale(0.97)';
    layer.style.zIndex = active ? '2' : '1';
  });

  document.querySelectorAll('[data-journey-step]').forEach((btn) => {
    const idx = Number(btn.dataset.journeyStep);
    const fill = btn.querySelector('.gd-journey-step-progress-fill');
    if (fill) {
      fill.style.setProperty('--step-progress', idx <= clamped ? '1' : '0');
    }
  });
}

/* ==========================================================================
   4. INTERACTIVE FEATURE EXPLORER WITH DUAL-LAYER CROSS-MORPH (#features)
   ========================================================================== */

function bindPointerSpotlight(el) {
  if (!el || prefersReducedMotion || !isFinePointer) return;
  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const rect = el.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
  });
}

function renderStoryList() {
  const container = document.getElementById('gdStoryList');
  if (!container) return;

  container.innerHTML = FEATURE_STORY_CHAPTERS.map((ch) => {
    const active = ch.id === state.activeStoryId;
    const bulletsHtml = ch.highlights
      .map((item) => `<li>${CHECK_ICON_SVG}<span>${item}</span></li>`)
      .join('');

    return `
      <button
        type="button"
        class="gd-story-item${active ? ' is-active' : ''}"
        role="tab"
        aria-selected="${active ? 'true' : 'false'}"
        data-story-id="${ch.id}"
      >
        <div class="gd-story-item-head">
          <div class="gd-story-item-title-group">
            <span class="gd-story-index">${ch.index}</span>
            <span class="gd-story-title">${ch.title}</span>
          </div>
          ${CHEVRON_SVG}
        </div>
        <div class="gd-story-body-wrap">
          <div class="gd-story-body">
            <p class="gd-story-summary">${ch.summary}</p>
            <ul class="gd-story-bullets">${bulletsHtml}</ul>
          </div>
        </div>
      </button>
    `;
  }).join('');

  const items = Array.from(container.querySelectorAll('[data-story-id]'));
  items.forEach((btn, idx) => {
    bindPointerSpotlight(btn);
    btn.addEventListener('click', () => {
      setStoryChapter(btn.dataset.storyId);
    });
    // Responsive hover preview on desktop fine pointers
    btn.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch' || window.innerWidth < 1120) return;
      if (state.activeStoryId !== btn.dataset.storyId) {
        setStoryChapter(btn.dataset.storyId);
      }
    });
    // Full keyboard arrow navigation
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = items[(idx + 1) % items.length];
        next.focus();
        setStoryChapter(next.dataset.storyId);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        e.preventDefault();
        const prev = items[(idx - 1 + items.length) % items.length];
        prev.focus();
        setStoryChapter(prev.dataset.storyId);
      }
    });
  });
}

function setStoryChapter(chapterId) {
  const chapter = getFeatureChapter(chapterId);
  const changed = state.activeStoryId !== chapter.id;
  state.activeStoryId = chapter.id;

  document.querySelectorAll('[data-story-id]').forEach((btn) => {
    const active = btn.dataset.storyId === chapter.id;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const titleEl = document.getElementById('gdStoryStageTitle');
  const routeEl = document.getElementById('gdStoryStageRoute');
  const calloutTitle = document.getElementById('gdStoryCalloutTitle');
  const calloutMeta = document.getElementById('gdStoryCalloutMeta');

  if (titleEl) titleEl.textContent = chapter.title;
  if (routeEl) routeEl.textContent = chapter.route;
  if (calloutTitle) calloutTitle.textContent = chapter.calloutTitle;
  if (calloutMeta) calloutMeta.textContent = chapter.calloutMeta;

  if (!changed) return;

  // Dual-layer seamless cross-morph (zero blink)
  const imgA = document.getElementById('gdStoryStageImgA');
  const imgB = document.getElementById('gdStoryStageImgB');
  if (!imgA || !imgB) return;

  const nextSrc = state.theme === 'light' ? chapter.lightSrc : chapter.darkSrc;
  const incoming = state.activeStoryLayer === 'A' ? imgB : imgA;
  const outgoing = state.activeStoryLayer === 'A' ? imgA : imgB;

  incoming.src = nextSrc;
  incoming.alt = chapter.alt;
  incoming.setAttribute('aria-hidden', 'false');
  outgoing.setAttribute('aria-hidden', 'true');

  requestAnimationFrame(() => {
    incoming.classList.add('is-active');
    outgoing.classList.remove('is-active');
  });

  state.activeStoryLayer = state.activeStoryLayer === 'A' ? 'B' : 'A';
}

/* ==========================================================================
   5. TOURNAMENT NETWORK ARENA (#tournaments)
   ========================================================================== */

function renderTournamentDiscipline(disciplineId) {
  const data = getTournamentDiscipline(disciplineId);
  state.activeDiscipline = data.id;

  document.querySelectorAll('[data-discipline]').forEach((btn) => {
    const active = btn.dataset.discipline === data.id;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('gdDisciplineSubtitle', data.subtitle);
  setText('gdClubAMono', data.clubA.monogram);
  setText('gdClubAName', data.clubA.name);
  setText('gdClubACity', data.clubA.city);
  setText('gdClubARoster', data.clubA.roster);
  setText('gdClubARecord', data.clubA.record);

  setText('gdClubBMono', data.clubB.monogram);
  setText('gdClubBName', data.clubB.name);
  setText('gdClubBCity', data.clubB.city);
  setText('gdClubBRoster', data.clubB.roster);
  setText('gdClubBRecord', data.clubB.record);

  setText('gdArenaFormat', data.formatLabel);
  setText('gdArenaMode', data.matchMode);
  setText('gdArenaPrize', data.prizeSummary);

  setText('gdBrS1A', data.bracket.semi1.a);
  setText('gdBrS1B', data.bracket.semi1.b);
  setText('gdBrS1SA', data.bracket.semi1.scoreA);
  setText('gdBrS1SB', data.bracket.semi1.scoreB);

  setText('gdBrS2A', data.bracket.semi2.a);
  setText('gdBrS2B', data.bracket.semi2.b);
  setText('gdBrS2SA', data.bracket.semi2.scoreA);
  setText('gdBrS2SB', data.bracket.semi2.scoreB);

  setText('gdBrFinalA', data.bracket.final.a);
  setText('gdBrFinalB', data.bracket.final.b);
  setText('gdBrFinalStatus', data.bracket.final.status);

  const tbody = document.getElementById('gdLeaderboardBody');
  if (tbody) {
    tbody.innerHTML = data.leaderboard
      .map((row) => {
        const rankClass = row.rank <= 3 ? ` rank-${row.rank}` : '';
        const trendHtml =
          row.trend === 'up'
            ? '<span class="gd-trend-up" aria-label="صعود">▲</span>'
            : row.trend === 'down'
              ? '<span class="gd-trend-down" aria-label="نزول">▼</span>'
              : '<span class="gd-trend-down" aria-label="ثابت">—</span>';

        return `
          <tr>
            <td>
              <span class="gd-lb-club">
                <span class="gd-rank-num${rankClass}">${row.rank}</span>
                <span class="gd-ltr">${row.club}</span>
                ${trendHtml}
              </span>
            </td>
            <td class="gd-lb-pts">${row.points}</td>
            <td class="gd-tabular">${row.wins} / ${row.losses}</td>
            <td class="gd-tabular">${row.winRate}</td>
          </tr>
        `;
      })
      .join('');
  }
}

/* ==========================================================================
   6. INTERACTIVE PRICING CARDS, PLAN INSPECTOR & COMPARISON MATRIX (#pricing)
   ========================================================================== */

function renderPricingCards() {
  const grid = document.getElementById('gdPricingGrid');
  if (!grid) return;

  grid.innerHTML = SUBSCRIPTION_TIERS.map((tier, idx) => {
    const featuresHtml = tier.highlights
      .map(
        (feat) => `
          <li class="${feat.included ? '' : 'is-excluded'}">
            ${feat.included ? CHECK_ICON_SVG : DASH_ICON_SVG}
            <span>${feat.label}</span>
          </li>
        `
      )
      .join('');

    const btnClass = tier.featured ? 'gd-btn gd-btn-primary gd-plan-cta' : 'gd-btn gd-btn-secondary gd-plan-cta';
    const isSelected = tier.id === state.selectedTierId;

    return `
      <article
        class="gd-plan-card gd-reveal${tier.featured ? ' is-featured' : ''}${isSelected ? ' is-selected' : ''}"
        style="--reveal-delay: ${idx * 75}ms;"
        data-plan-tier="${tier.id}"
        tabindex="0"
        aria-label="انتخاب پلن ${tier.persianName} برای مقایسه امکانات"
      >
        <div class="gd-plan-top">
          <h3 class="gd-plan-name">${tier.persianName}</h3>
          ${tier.featured ? '<span class="gd-plan-featured-note">پرچم‌دار پلتفرم</span>' : ''}
        </div>
        <div class="gd-plan-sub">${tier.subtitle}</div>

        <div class="gd-plan-placeholder-box">
          <div class="gd-plan-price-ph">${tier.pricePlaceholder}</div>
          <div class="gd-plan-term-ph">${tier.termPlaceholder}</div>
        </div>

        <p class="gd-plan-summary">${tier.summary}</p>

        <ul class="gd-plan-features">${featuresHtml}</ul>

        <button type="button" class="${btnClass}" data-open-inquiry="${tier.id}">
          <span>${tier.ctaLabel}</span>
          ${
            tier.featured
              ? '<svg class="gd-btn-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.5 8h-9M7 4.5 3.5 8 7 11.5"></path></svg>'
              : ''
          }
        </button>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('[data-plan-tier]').forEach((card) => {
    const tierKey = card.dataset.planTier;
    bindPointerSpotlight(card);

    card.addEventListener('click', (e) => {
      if (e.target.closest('[data-open-inquiry]')) return;
      selectPricingTier(tierKey);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('[data-open-inquiry]')) return;
        e.preventDefault();
        selectPricingTier(tierKey);
      }
    });

    card.addEventListener('pointerenter', () => highlightCompareColumn(tierKey));
    card.addEventListener('pointerleave', () => highlightCompareColumn(null));
  });
}

function selectPricingTier(tierId) {
  const summary = getTierCapabilitiesSummary(tierId);
  state.selectedTierId = summary.tierId;

  document.querySelectorAll('[data-plan-tier]').forEach((card) => {
    const active = card.dataset.planTier === summary.tierId;
    card.classList.toggle('is-selected', active);
  });

  document.querySelectorAll('[data-select-tier]').forEach((btn) => {
    const active = btn.dataset.selectTier === summary.tierId;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  const nameEl = document.getElementById('gdInspectorPlanName');
  const countEl = document.getElementById('gdInspectorPlanCount');
  if (nameEl) nameEl.textContent = `پلن ${summary.persianName}`;
  if (countEl) {
    countEl.textContent = `${toPersianNumber(summary.includedCount)} از ${toPersianNumber(summary.totalCount)} قابلیت فعال`;
  }

  syncSelectedTierInTable();
}

function syncSelectedTierInTable() {
  const table = document.getElementById('gdCompareTable');
  if (!table) return;

  table.querySelectorAll('[data-tier-col]').forEach((cell) => {
    cell.classList.toggle('col-selected', cell.dataset.tierCol === state.selectedTierId);
  });

  table.querySelectorAll('tbody tr').forEach((tr) => {
    const activeCell = tr.querySelector(`td[data-tier-col="${state.selectedTierId}"]`);
    const isIncluded = activeCell?.dataset.included === 'true';
    tr.classList.toggle('is-row-included', Boolean(isIncluded));
    tr.classList.toggle('is-row-locked', !isIncluded);
  });
}

function renderComparisonTable(category = 'all') {
  state.activeCompareCat = category;
  const rows = getComparisonRows(category);
  const tbody = document.getElementById('gdCompareBody');

  document.querySelectorAll('[data-compare-cat]').forEach((btn) => {
    const active = btn.dataset.compareCat === category;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });

  if (!tbody) return;

  const renderCell = (status, tierKey) => {
    const isFeatured = tierKey === 'ultimate';
    const isSelected = tierKey === state.selectedTierId;
    const classes = [];
    if (isFeatured) classes.push('col-featured');
    if (isSelected) classes.push('col-selected');
    const clsAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
    const includedAttr = status === 'included' ? 'true' : 'false';

    if (status === 'included') {
      return `<td data-tier-col="${tierKey}" data-included="${includedAttr}"${clsAttr}><span class="gd-cell-inc" aria-label="شامل این پلن">${CHECK_ICON_SVG}</span></td>`;
    }
    return `<td data-tier-col="${tierKey}" data-included="${includedAttr}"${clsAttr}><span class="gd-cell-exc" aria-label="در این پلن وجود ندارد">—</span></td>`;
  };

  tbody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>
            <span class="gd-compare-feat-name">${row.label}</span>
            <span class="gd-compare-feat-note">${row.note}</span>
          </td>
          ${renderCell(row.tiers.standard, 'standard')}
          ${renderCell(row.tiers.silver, 'silver')}
          ${renderCell(row.tiers.gold, 'gold')}
          ${renderCell(row.tiers.ultimate, 'ultimate')}
        </tr>
      `
    )
    .join('');

  syncSelectedTierInTable();
}

function highlightCompareColumn(tierKey) {
  const table = document.getElementById('gdCompareTable');
  if (!table) return;
  table.querySelectorAll('[data-tier-col]').forEach((cell) => {
    cell.classList.toggle('col-highlight', Boolean(tierKey && cell.dataset.tierCol === tierKey));
  });
}

/* ==========================================================================
   7. CONTINUOUS SCROLL-LINKED CHOREOGRAPHY ENGINE (Zero Scroll-Jacking)
   ========================================================================== */

function initScrollChoreography() {
  const header = document.getElementById('gdHeader');
  const progressBar = document.getElementById('gdScrollProgressBar');
  const ambientCanvas = document.getElementById('gdAmbientCanvas');

  const heroSection = document.getElementById('hero');
  const heroCopy = document.getElementById('gdHeroCopy');
  const heroHalo = document.getElementById('gdHeroHalo');
  const heroBackplate = document.getElementById('gdHeroBackplate');
  const heroStageFrame = document.getElementById('gdHeroStageFrame');
  const heroSatellites = Array.from(document.querySelectorAll('#gdHeroSatellites .gd-satellite'));

  const journeySection = document.getElementById('product-journey');
  const journeyStepsEl = document.getElementById('gdJourneySteps');
  const journeyLayers = Array.from(document.querySelectorAll('[data-journey-layer]'));
  const journeySteps = Array.from(document.querySelectorAll('[data-journey-step]'));

  const editorialRows = Array.from(document.querySelectorAll('[data-editorial-morph]'));

  const arenaSection = document.getElementById('tournaments');
  const arenaVeil = document.getElementById('gdArenaDepthVeil');
  const arenaBeats = Array.from(document.querySelectorAll('#gdArenaBeats .gd-arena-beat'));
  const clubACard = document.getElementById('gdClubACard');
  const clubBCard = document.getElementById('gdClubBCard');
  const vsEmblem = document.getElementById('gdVsEmblem');
  const vsPaths = Array.from(document.querySelectorAll('.gd-vs-path'));
  const bracketPanel = document.getElementById('gdBracketPanel');
  const bracketPaths = Array.from(document.querySelectorAll('#gdBracketConnector path'));
  const leaderboardPanel = document.getElementById('gdLeaderboardPanel');

  const navLinks = Array.from(document.querySelectorAll('.gd-nav-link[data-nav-target]'));
  const navSections = navLinks.map((a) => document.getElementById(a.dataset.navTarget)).filter(Boolean);

  let rafScheduled = false;

  const updateScrollFrame = () => {
    rafScheduled = false;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight || 900;
    const vw = window.innerWidth || 1440;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
    const globalProgress = clamp01(scrollY / maxScroll);

    // 1) Header scrolled state + subtle 2px scroll progress rail + nav spy
    if (header) {
      header.classList.toggle('is-scrolled', scrollY > 20);
    }
    if (progressBar) {
      progressBar.style.setProperty('--scroll-progress', globalProgress.toFixed(4));
    }

    const spyAnchor = scrollY + 210;
    let activeSectionId = '';
    for (const sec of navSections) {
      const top = sec.getBoundingClientRect().top + scrollY;
      if (top <= spyAnchor) activeSectionId = sec.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.navTarget === activeSectionId);
    });

    if (prefersReducedMotion) return;

    // 2) Dynamic living glass ambient orbs & depth mesh
    if (ambientCanvas) {
      const amb = computeAmbientState(globalProgress);
      ambientCanvas.style.setProperty('--orb1-x', `${amb.orb1X}vw`);
      ambientCanvas.style.setProperty('--orb1-y', `${amb.orb1Y}vh`);
      ambientCanvas.style.setProperty('--orb2-x', `${amb.orb2X}vw`);
      ambientCanvas.style.setProperty('--orb2-y', `${amb.orb2Y}vh`);
      ambientCanvas.style.setProperty('--orb3-x', `${amb.orb3X}vw`);
      ambientCanvas.style.setProperty('--orb3-y', `${amb.orb3Y}vh`);
      ambientCanvas.style.setProperty('--ambient-depth-y', `${amb.depthShiftY}px`);
    }

    // 3) Interactive Hero Transformation (Desktop > 1024px)
    if (heroSection && vw > 1024) {
      const heroRange = Math.max(420, Math.min(760, heroSection.offsetHeight * 0.62));
      const heroState = computeHeroScrollState(scrollY / heroRange);

      if (heroCopy) {
        heroCopy.style.setProperty('--hero-copy-y', `${heroState.copyY}px`);
        heroCopy.style.setProperty('--hero-copy-op', String(heroState.copyOpacity));
        heroCopy.style.setProperty('--hero-copy-scale', String(heroState.copyScale));
      }
      if (heroStageFrame) {
        heroStageFrame.style.setProperty('--scroll-rx', `${heroState.stageRotateX}deg`);
        heroStageFrame.style.setProperty('--scroll-scale', String(heroState.stageScale));
        heroStageFrame.style.setProperty('--scroll-y', `${heroState.stageY}px`);
      }
      if (heroBackplate) {
        heroBackplate.style.setProperty('--hero-back-y', `${heroState.backplateY}px`);
        heroBackplate.style.setProperty('--hero-back-scale', String(heroState.backplateScale));
      }
      if (heroHalo) {
        heroHalo.style.setProperty('--hero-halo-scale', String(heroState.haloScale));
        heroHalo.style.setProperty('--hero-halo-op', String(heroState.haloOpacity));
      }
      heroSatellites.forEach((sat, idx) => {
        const y = heroState.satellitesY[idx] ?? 0;
        sat.style.setProperty('--sat-scroll-y', `${y}px`);
      });
    }

    // 4) Pinned 4-Stage Scroll Storytelling Showcase (Desktop > 1024px)
    if (journeySection && journeyStepsEl && vw > 1024) {
      const rect = journeyStepsEl.getBoundingClientRect();
      const startOffset = vh * 0.28;
      const trackDistance = Math.max(1, rect.height - vh * 0.42);
      const rawJourneyProgress = (startOffset - rect.top) / trackDistance;
      const journeyState = computePinnedStoryState(rawJourneyProgress, PINNED_STORY_STAGES.length);

      if (journeyState.activeIndex !== state.activeJourneyIndex) {
        applyJourneyMeta(journeyState.activeIndex);
      }

      // Continuous crossfade + scale morphing across all 4 stacked screenshots
      journeyState.layers.forEach((layerState) => {
        const layerEl = journeyLayers[layerState.index];
        if (!layerEl) return;
        layerEl.style.opacity = String(layerState.opacity);
        layerEl.style.transform = `translate3d(0, ${layerState.translateY}px, 0) scale(${layerState.scale})`;
        layerEl.style.zIndex = layerState.index === journeyState.activeIndex ? '2' : '1';
      });

      // Update per-step progress bars smoothly
      journeySteps.forEach((stepEl, idx) => {
        const fill = stepEl.querySelector('.gd-journey-step-progress-fill');
        if (!fill) return;
        let p = 0;
        if (idx < journeyState.activeIndex) p = 1;
        else if (idx === journeyState.activeIndex) p = journeyState.stageLocalProgress;
        fill.style.setProperty('--step-progress', p.toFixed(3));
      });
    }

    // 5) Subtle Depth Parallax on Editorial Deep-Dive Rows (Desktop > 920px)
    if (vw > 920) {
      editorialRows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > vh + 120) return;
        const centerOffset = (rect.top + rect.height * 0.5 - vh * 0.5) / (vh * 0.65);
        const clamped = Math.max(-1, Math.min(1, centerOffset));
        const textLayer = row.querySelector('[data-parallax-layer="text"]');
        const visualLayer = row.querySelector('[data-parallax-layer="visual"]');
        if (textLayer) textLayer.style.setProperty('--parallax-y', `${(clamped * 16).toFixed(2)}px`);
        if (visualLayer) visualLayer.style.setProperty('--parallax-y', `${(-clamped * 20).toFixed(2)}px`);
      });
    }

    // 6) Scroll-Scrubbed Tournament Network Cinematic Sequence (Desktop > 920px)
    if (arenaSection && vw > 920) {
      const rect = arenaSection.getBoundingClientRect();
      const totalSpan = Math.max(1, rect.height * 0.68);
      const rawArenaProgress = (vh * 0.88 - rect.top) / totalSpan;
      const arena = computeTournamentRevealState(rawArenaProgress);

      if (arenaVeil) {
        arenaVeil.style.setProperty('--arena-atmo-op', String(arena.atmosphereOpacity));
      }
      if (clubACard) {
        clubACard.style.setProperty('--club-x', `${arena.clubAOffsetX}px`);
        clubACard.style.setProperty('--club-op', String(arena.clubsOpacity));
      }
      if (clubBCard) {
        clubBCard.style.setProperty('--club-x', `${arena.clubBOffsetX}px`);
        clubBCard.style.setProperty('--club-op', String(arena.clubsOpacity));
      }
      if (vsEmblem) {
        vsEmblem.style.setProperty('--vs-scale', String(arena.vsScale));
        vsEmblem.style.setProperty('--vs-op', String(arena.vsOpacity));
      }
      vsPaths.forEach((path) => {
        path.style.setProperty('--vs-dash', String(arena.connectorDashOffset));
      });
      if (bracketPanel) {
        bracketPanel.style.setProperty('--panel-y', `${arena.bracketY}px`);
        bracketPanel.style.setProperty('--panel-op', String(arena.bracketOpacity));
      }
      bracketPaths.forEach((path) => {
        path.style.setProperty('--bracket-dash', String(arena.bracketDashOffset));
      });
      if (leaderboardPanel) {
        leaderboardPanel.style.setProperty('--panel-y', `${arena.leaderboardY}px`);
        leaderboardPanel.style.setProperty('--panel-op', String(arena.leaderboardOpacity));
      }

      if (arena.storyBeatIndex !== state.lastTournamentBeat) {
        state.lastTournamentBeat = arena.storyBeatIndex;
        arenaBeats.forEach((beatEl, idx) => {
          beatEl.classList.toggle('is-active', idx === arena.storyBeatIndex);
          beatEl.classList.toggle('is-passed', idx < arena.storyBeatIndex);
        });
      }
    }
  };

  const requestUpdate = () => {
    if (rafScheduled) return;
    rafScheduled = true;
    requestAnimationFrame(updateScrollFrame);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  updateScrollFrame();
}

/* ==========================================================================
   8. SELECTIVE MOUSE-RESPONSIVE INTERACTIONS (Desktop Fine-Pointer Only)
   ========================================================================== */

function initSelectivePointerInteractions() {
  if (prefersReducedMotion || !isFinePointer) return;

  // A) Hero Dashboard Stage subtle 3D tilt + specular sheen (composes with scroll tilt)
  const heroOuter = document.getElementById('gdHeroStageOuter');
  const heroFrame = document.getElementById('gdHeroStageFrame');
  if (heroOuter && heroFrame) {
    let rafId = 0;
    heroOuter.addEventListener('pointermove', (e) => {
      if (window.innerWidth <= 1024 || e.pointerType === 'touch') return;
      const rect = heroFrame.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const { rotateX, rotateY, spotX, spotY } = computeStageTilt(normX, normY, 2.4);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        heroFrame.classList.add('is-tilting');
        heroFrame.style.setProperty('--ptr-rx', `${rotateX}deg`);
        heroFrame.style.setProperty('--ptr-ry', `${rotateY}deg`);
        heroFrame.style.setProperty('--spot-x', `${spotX}%`);
        heroFrame.style.setProperty('--spot-y', `${spotY}%`);
      });
    });

    heroOuter.addEventListener('pointerleave', () => {
      cancelAnimationFrame(rafId);
      heroFrame.classList.remove('is-tilting');
      heroFrame.style.setProperty('--ptr-rx', '0deg');
      heroFrame.style.setProperty('--ptr-ry', '0deg');
    });
  }

  // B) Selective 3D glass tilt + sheen on curated interactive showcase cards
  document.querySelectorAll('.gd-tilt-card').forEach((card) => {
    let rafId = 0;
    card.addEventListener('pointermove', (e) => {
      if (window.innerWidth <= 1024 || e.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const { rotateX, rotateY, spotX, spotY } = computeStageTilt(normX, normY, 2.2);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        card.classList.add('is-tilting');
        card.style.setProperty('--card-rx', `${rotateX}deg`);
        card.style.setProperty('--card-ry', `${rotateY}deg`);
        card.style.setProperty('--spot-x', `${spotX}%`);
        card.style.setProperty('--spot-y', `${spotY}%`);
      });
    });

    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(rafId);
      card.classList.remove('is-tilting');
      card.style.setProperty('--card-rx', '0deg');
      card.style.setProperty('--card-ry', '0deg');
    });
  });

  // C) Restrained magnetic pull on primary CTAs (.gd-magnetic)
  document.querySelectorAll('.gd-magnetic').forEach((btn) => {
    let rafId = 0;
    btn.addEventListener('pointermove', (e) => {
      if (window.innerWidth <= 1024 || e.pointerType === 'touch') return;
      const rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      const { tx, ty } = computeMagneticOffset(normX, normY, 5.5);

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        btn.style.setProperty('--mag-x', `${tx}px`);
        btn.style.setProperty('--mag-y', `${ty}px`);
      });
    });

    btn.addEventListener('pointerleave', () => {
      cancelAnimationFrame(rafId);
      btn.style.setProperty('--mag-x', '0px');
      btn.style.setProperty('--mag-y', '0px');
    });
  });
}

/* ==========================================================================
   9. FAQ ACCORDION, MOBILE DRAWER, MODAL & ONE-SHOT REVEALS
   ========================================================================== */

function syncFaqAccordion() {
  document.querySelectorAll('.gd-faq-item').forEach((item) => {
    const isOpen = item.dataset.faqId === state.openFaqId;
    item.classList.toggle('is-open', isOpen);
    const trigger = item.querySelector('.gd-faq-trigger');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function setMobileMenu(open) {
  state.mobileMenuOpen = Boolean(open);
  const toggle = document.getElementById('gdMenuToggle');
  const drawer = document.getElementById('gdMobileDrawer');
  if (toggle) {
    toggle.setAttribute('aria-expanded', state.mobileMenuOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', state.mobileMenuOpen ? 'بستن منوی ناوبری' : 'باز کردن منوی ناوبری');
  }
  if (drawer) {
    drawer.classList.toggle('is-open', state.mobileMenuOpen);
    drawer.setAttribute('aria-hidden', state.mobileMenuOpen ? 'false' : 'true');
  }
}

function openInquiryModal(tierId = 'ultimate') {
  const backdrop = document.getElementById('gdInquiryModal');
  const form = document.getElementById('gdInquiryForm');
  const success = document.getElementById('gdInquirySuccess');
  const tierSelect = document.getElementById('gdTierSelect');

  if (!backdrop) return;
  if (form) {
    form.hidden = false;
    form.querySelectorAll('.gd-field-error').forEach((el) => {
      el.textContent = '';
    });
  }
  if (success) success.hidden = true;
  if (tierSelect && tierId) tierSelect.value = tierId;

  backdrop.classList.add('is-open');
  backdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const firstInput = document.getElementById('gdFullName');
  if (firstInput) window.setTimeout(() => firstInput.focus(), 110);
}

function closeInquiryModal() {
  const backdrop = document.getElementById('gdInquiryModal');
  if (!backdrop) return;
  backdrop.classList.remove('is-open');
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function handleInquirySubmit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = {
    fullName: form.fullName?.value,
    centerName: form.centerName?.value,
    phone: form.phone?.value,
    tierId: form.tierId?.value,
    notes: form.notes?.value,
  };

  form.querySelectorAll('.gd-field-error').forEach((el) => {
    el.textContent = '';
  });

  const result = validateDemoInquiry(payload);
  if (!result.ok) {
    Object.entries(result.errors).forEach(([field, msg]) => {
      const errEl = form.querySelector(`[data-error-for="${field}"]`);
      if (errEl) errEl.textContent = msg;
    });
    const firstKey = Object.keys(result.errors)[0];
    const firstField = form.querySelector(`[name="${firstKey}"]`);
    if (firstField) firstField.focus();
    return;
  }

  try {
    const existing = JSON.parse(localStorage.getItem('gd_landing_inquiries_v1') || '[]');
    existing.unshift({ ...result.normalized, createdAt: new Date().toISOString() });
    localStorage.setItem('gd_landing_inquiries_v1', JSON.stringify(existing.slice(0, 20)));
  } catch {
    // ignore storage restriction
  }

  const successBox = document.getElementById('gdInquirySuccess');
  const detailEl = document.getElementById('gdSuccessDetail');
  if (detailEl) {
    detailEl.textContent = `درخواست مشاوره برای مجموعه «${result.normalized.centerName}» (${result.normalized.tierLabel}) با شماره ${result.normalized.phone} ثبت شد. کارشناسان ما در کوتاه‌ترین زمان با شما تماس می‌گیرند.`;
  }
  form.hidden = true;
  if (successBox) successBox.hidden = false;
  form.reset();
}

function initScrollReveal() {
  const revealTargets = document.querySelectorAll('.gd-reveal, .gd-reveal-scale');
  if (!revealTargets.length) return;

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
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   10. BOOTSTRAP
   ========================================================================== */

function init() {
  // Render data-driven sections before attaching observers & scroll engine
  renderPinnedJourney();
  renderStoryList();
  renderTournamentDiscipline(state.activeDiscipline);
  renderPricingCards();
  renderComparisonTable('all');
  selectPricingTier(state.selectedTierId);
  syncFaqAccordion();

  // Sync theme icons & matching theme screenshots
  applyTheme(state.theme);

  // Trigger hero entrance + continuous scroll engine + selective pointer effects
  triggerHeroEntrance();
  initScrollReveal();
  initScrollChoreography();
  initSelectivePointerInteractions();

  // Theme switcher
  const themeBtn = document.getElementById('gdThemeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    });
  }

  // Mobile navigation drawer
  const menuBtn = document.getElementById('gdMenuToggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => setMobileMenu(!state.mobileMenuOpen));
  }
  document.querySelectorAll('[data-mobile-link]').forEach((link) => {
    link.addEventListener('click', () => setMobileMenu(false));
  });

  // Hero preview tabs
  document.querySelectorAll('[data-hero-tab]').forEach((btn) => {
    btn.addEventListener('click', () => setHeroPreviewTab(btn.dataset.heroTab));
  });

  // Tournament discipline switcher
  document.querySelectorAll('[data-discipline]').forEach((btn) => {
    btn.addEventListener('click', () => renderTournamentDiscipline(btn.dataset.discipline));
  });

  // Pricing tier inspector switcher
  document.querySelectorAll('[data-select-tier]').forEach((btn) => {
    btn.addEventListener('click', () => selectPricingTier(btn.dataset.selectTier));
  });

  // Comparison category filter tabs
  document.querySelectorAll('[data-compare-cat]').forEach((btn) => {
    btn.addEventListener('click', () => renderComparisonTable(btn.dataset.compareCat));
  });

  // FAQ accordion clicks
  document.querySelectorAll('.gd-faq-item').forEach((item) => {
    const trigger = item.querySelector('.gd-faq-trigger');
    if (trigger) {
      trigger.addEventListener('click', () => {
        state.openFaqId = toggleFaqState(state.openFaqId, item.dataset.faqId);
        syncFaqAccordion();
      });
    }
  });

  // Inquiry modal triggers (delegated so dynamically rendered pricing buttons work)
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-inquiry]');
    if (trigger) {
      openInquiryModal(trigger.dataset.openInquiry || 'ultimate');
    }
  });

  const closeBtn = document.getElementById('gdCloseModal');
  const doneBtn = document.getElementById('gdSuccessDoneBtn');
  const backdrop = document.getElementById('gdInquiryModal');
  const form = document.getElementById('gdInquiryForm');

  if (closeBtn) closeBtn.addEventListener('click', closeInquiryModal);
  if (doneBtn) doneBtn.addEventListener('click', closeInquiryModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeInquiryModal();
    });
  }
  if (form) form.addEventListener('submit', handleInquirySubmit);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeInquiryModal();
      setMobileMenu(false);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
