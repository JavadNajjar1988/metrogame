/**
 * Standalone interactive & motion controller for /landing
 * (Game District — Cinematic Premium SaaS Landing Page).
 * 100% isolated from existing administration dashboard scripts.
 */
import {
  HERO_PREVIEW_TABS,
  FEATURE_STORY_CHAPTERS,
  SUBSCRIPTION_TIERS,
  resolveLandingTheme,
  getPreviewSrc,
  getFeatureChapter,
  getTournamentDiscipline,
  getComparisonRows,
  computeStageTilt,
  toggleFaqState,
  validateDemoInquiry,
} from './landing-logic.mjs?v=20261128-4';

const state = {
  theme: resolveLandingTheme(document.documentElement.getAttribute('data-theme')),
  activeHeroTab: 'overview',
  activeStoryId: 'stations',
  activeDiscipline: 'video',
  activeCompareCat: 'all',
  openFaqId: 'faq-1',
  mobileMenuOpen: false,
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CHECK_ICON_SVG =
  '<svg class="gd-check-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"></path></svg>';

const DASH_ICON_SVG =
  '<svg class="gd-dash-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h8"></path></svg>';

const CHEVRON_SVG =
  '<svg class="gd-story-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3.5 5.5 8 10 12.5"></path></svg>';

/* ==========================================================================
   1. THEME MANAGEMENT (SVG toggleAttribute + Live Screenshot Swapping)
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

  const storyChapter = getFeatureChapter(state.activeStoryId);
  const storyImg = document.getElementById('gdStoryStageImg');
  if (storyImg) {
    storyImg.src = theme === 'light' ? storyChapter.lightSrc : storyChapter.darkSrc;
  }

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
   2. HERO CHOREOGRAPHY, PREVIEW TABS & POINTER-RESPONSIVE STAGE DEPTH
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
      }, 140);
    }
  }
}

function initHeroStageParallax() {
  if (prefersReducedMotion) return;
  const outer = document.getElementById('gdHeroStageOuter');
  const frame = document.getElementById('gdHeroStageFrame');
  if (!outer || !frame) return;

  let rafId = 0;

  outer.addEventListener('pointermove', (e) => {
    if (window.innerWidth < 960 || e.pointerType === 'touch') return;
    const rect = frame.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const { rotateX, rotateY, spotX, spotY } = computeStageTilt(normX, normY, 2.8);

    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      frame.classList.add('is-tilting');
      frame.style.setProperty('--tilt-x', `${rotateX}deg`);
      frame.style.setProperty('--tilt-y', `${rotateY}deg`);
      frame.style.setProperty('--spot-x', `${spotX}%`);
      frame.style.setProperty('--spot-y', `${spotY}%`);
    });
  });

  outer.addEventListener('pointerleave', () => {
    cancelAnimationFrame(rafId);
    frame.classList.remove('is-tilting');
    frame.style.setProperty('--tilt-x', '1.4deg');
    frame.style.setProperty('--tilt-y', '0deg');
  });
}

/* ==========================================================================
   3. INTERACTIVE PRODUCT STORYTELLING DECK (#features)
   ========================================================================== */

function bindPointerSpotlight(el) {
  if (!el || prefersReducedMotion) return;
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

  container.querySelectorAll('[data-story-id]').forEach((btn) => {
    bindPointerSpotlight(btn);
    btn.addEventListener('click', () => {
      setStoryChapter(btn.dataset.storyId);
    });
  });
}

function setStoryChapter(chapterId) {
  const chapter = getFeatureChapter(chapterId);
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
  const img = document.getElementById('gdStoryStageImg');

  if (titleEl) titleEl.textContent = chapter.title;
  if (routeEl) routeEl.textContent = chapter.route;
  if (calloutTitle) calloutTitle.textContent = chapter.calloutTitle;
  if (calloutMeta) calloutMeta.textContent = chapter.calloutMeta;

  if (img) {
    const nextSrc = state.theme === 'light' ? chapter.lightSrc : chapter.darkSrc;
    if (img.getAttribute('src') !== nextSrc) {
      img.classList.add('is-swapping');
      window.setTimeout(() => {
        img.src = nextSrc;
        img.alt = chapter.alt;
        img.classList.remove('is-swapping');
      }, 140);
    }
  }
}

/* ==========================================================================
   4. PREMIUM TOURNAMENT NETWORK ARENA (#tournaments)
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
   5. INTERACTIVE PRICING CARDS & COMPARISON MATRIX (#pricing)
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

    return `
      <article
        class="gd-plan-card gd-reveal${tier.featured ? ' is-featured' : ''}"
        style="--reveal-delay: ${idx * 75}ms;"
        data-plan-tier="${tier.id}"
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

  // Pointer spotlight ONLY on the featured Ultimate plan card
  const featuredCard = grid.querySelector('.gd-plan-card.is-featured');
  if (featuredCard) bindPointerSpotlight(featuredCard);

  // Hovering a plan card softly highlights its column in the comparison table
  grid.querySelectorAll('[data-plan-tier]').forEach((card) => {
    const tierKey = card.dataset.planTier;
    card.addEventListener('pointerenter', () => highlightCompareColumn(tierKey));
    card.addEventListener('pointerleave', () => highlightCompareColumn(null));
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
    const cls = isFeatured ? ' class="col-featured"' : '';
    if (status === 'included') {
      return `<td data-tier-col="${tierKey}"${cls}><span class="gd-cell-inc" aria-label="شامل این پلن">${CHECK_ICON_SVG}</span></td>`;
    }
    return `<td data-tier-col="${tierKey}"${cls}><span class="gd-cell-exc" aria-label="در این پلن وجود ندارد">—</span></td>`;
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
}

function highlightCompareColumn(tierKey) {
  const table = document.getElementById('gdCompareTable');
  if (!table) return;
  table.querySelectorAll('[data-tier-col]').forEach((cell) => {
    cell.classList.toggle('col-highlight', Boolean(tierKey && cell.dataset.tierCol === tierKey));
  });
}

/* ==========================================================================
   6. FAQ ACCORDION, SCROLL-SPY, MOBILE DRAWER & MODAL
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

/* ==========================================================================
   7. SCROLL-DRIVEN REVEALS (Fires Once Only) & HEADER SCROLL-SPY
   ========================================================================== */

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
    { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

function initHeaderAndScrollSpy() {
  const header = document.getElementById('gdHeader');
  const navLinks = Array.from(document.querySelectorAll('.gd-nav-link[data-nav-target]'));
  const sectionIds = navLinks.map((a) => a.dataset.navTarget);
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

  const onScroll = () => {
    if (header) {
      header.classList.toggle('is-scrolled', window.scrollY > 20);
    }
    const scrollPos = window.scrollY + 190;
    let activeId = '';
    for (const sec of sections) {
      const top = sec.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollPos) {
        activeId = sec.id;
      }
    }
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.navTarget === activeId);
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   8. BOOTSTRAP
   ========================================================================== */

function init() {
  // Render data-driven sections before attaching observers
  renderStoryList();
  renderTournamentDiscipline(state.activeDiscipline);
  renderPricingCards();
  renderComparisonTable('all');
  syncFaqAccordion();

  // Sync theme icons & matching theme screenshots
  applyTheme(state.theme);

  // Trigger choreographed hero entrance
  triggerHeroEntrance();
  initHeroStageParallax();
  initScrollReveal();
  initHeaderAndScrollSpy();

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
