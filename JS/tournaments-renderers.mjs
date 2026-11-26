/**
 * Pure HTML Renderers for the Inter-Gamenet Competitive Network ("تورنومنت").
 * Strictly escapes every dynamic value before insertion; zero DOM mutation side effects.
 */
import {
  COMPETITION_CATEGORIES,
  LOCAL_GAMENET_ID,
  canFormTournamentFromChallenge,
  getCategoryMeta,
  getChallengeStatusMeta,
  getCoverImageForTournament,
  getPrizeTypeLabel,
  getStatusMeta,
  buildChampionHeadline,
} from './tournaments-engine.mjs';

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function getCategoryIconSvg(categoryId, size = 18) {
  if (categoryId === 'billiards') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="9.5" r="2.2"/><circle cx="12" cy="14.5" r="2.4"/></svg>`;
  }
  if (categoryId === 'foosball') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="1" y1="9.5" x2="23" y2="9.5"/><line x1="1" y1="14.5" x2="23" y2="14.5"/><circle cx="7.5" cy="9.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="14.5" r="1.2" fill="currentColor"/></svg>`;
  }
  if (categoryId === 'video_games') {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="4"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15.5" cy="13.5" r="1" fill="currentColor"/><circle cx="18" cy="10.5" r="1" fill="currentColor"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;
}

export function getTrophyIconSvg(size = 28) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`;
}

export function renderCategorySelectorBar(activeCategory, counts = {}, fmt) {
  const items = [
    {
      id: 'all',
      label: 'همه رشته‌ها',
      sub: 'آنلاین و حضوری',
      count: counts.all ?? 0,
    },
    ...COMPETITION_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      sub: c.modeLabel,
      count: counts[c.id] ?? 0,
    })),
  ];

  return items
    .map((item) => {
      const active = activeCategory === item.id;
      return `
        <button
          type="button"
          class="trn-cat-card ${active ? 'is-active' : ''}"
          data-trn-category="${escapeHtml(item.id)}"
          aria-pressed="${active ? 'true' : 'false'}"
        >
          <span class="trn-cat-icon">${getCategoryIconSvg(item.id, 20)}</span>
          <span class="trn-cat-copy">
            <strong class="trn-cat-label">${escapeHtml(item.label)}</strong>
            <span class="trn-cat-sub">${escapeHtml(item.sub)}</span>
          </span>
          <span class="trn-cat-count trn-tabular">${fmt.num(item.count)}</span>
        </button>
      `;
    })
    .join('');
}

export function renderOverviewDashboard({ tournaments, challenges, teams, summary }, fmt) {
  const readyChallenge = challenges.find((c) => canFormTournamentFromChallenge(c)) || challenges.find((c) => c.status !== 'formed');
  const activeLive = tournaments.find((t) => t.status === 'live' && t.scope === 'inter_center') || tournaments.find((t) => t.status === 'live');
  const latestChampion = tournaments.find((t) => t.status === 'completed' && t.bracket?.champion);
  const internalActive = tournaments.find((t) => t.scope === 'internal');

  const readyBlock = readyChallenge
    ? (() => {
        const isReady = canFormTournamentFromChallenge(readyChallenge);
        const agreed = readyChallenge.prizeAgreement?.status === 'agreed';
        const catMeta = getCategoryMeta(readyChallenge.category);
        return `
          <article class="trn-ov-panel">
            <div class="trn-ov-panel-head">
              <div>
                <p class="trn-ov-kicker">چالش‌های باز بین‌گیم‌نتی · ${escapeHtml(catMeta.label)}</p>
                <h3 class="trn-panel-title">${escapeHtml(readyChallenge.title)}</h3>
              </div>
              <span class="trn-status-text is-${isReady ? 'emerald' : 'accent'}">${isReady ? 'آماده تشکیل تورنومنت' : 'در انتظار پذیرش'}</span>
            </div>
            <p class="trn-ov-statement">${escapeHtml(readyChallenge.statement)}</p>
            <div class="trn-ov-meta-line">
              <span>میزبان: <strong>${escapeHtml(readyChallenge.hostGamenetName)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>گیم‌نت‌های تاییدشده: <strong class="trn-tabular">${fmt.num(readyChallenge.participatingCenters?.length || 1)} از ${fmt.num(readyChallenge.maxCenters)}</strong></span>
              <span aria-hidden="true">·</span>
              <span class="trn-prize-state-inline is-${agreed ? 'agreed' : 'proposed'}">${agreed ? 'جایزه: توافق نهایی شده' : 'جایزه: پیشنهادی'}</span>
            </div>
            <div class="trn-ov-actions">
              ${
                isReady
                  ? `<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-form-tournament="${escapeHtml(readyChallenge.id)}">تشکیل خودکار تورنومنت و تولید جدول</button>`
                  : `<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-accept="${escapeHtml(readyChallenge.id)}">پذیرش چالش و اعزام نماینده</button>`
              }
              <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-jump-tab="challenges">مشاهده همه چالش‌ها (${fmt.num(summary.openChallenges)})</button>
            </div>
          </article>
        `;
      })()
    : `
      <article class="trn-ov-panel">
        <p class="trn-ov-kicker">چالش‌های باز شبکه</p>
        <h3 class="trn-panel-title">چالش باز جدیدی ثبت نشده است</h3>
        <p class="trn-ov-statement">تیم منتخب گیم‌نت خود را انتخاب کنید و یک فراخوان رقابت رسمی برای سایر گیم‌نت‌های شبکه منتشر کنید.</p>
        <div class="trn-ov-actions">
          <button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-action="open-challenge">انتشار چالش جدید</button>
        </div>
      </article>
    `;

  const championBlock = latestChampion
    ? renderChampionCard(latestChampion, fmt, { compact: true })
    : `
      <article class="trn-ov-panel">
        <p class="trn-ov-kicker">تالار قهرمانان</p>
        <h3 class="trn-panel-title">هنوز تورنومنت پایان‌یافته‌ای ثبت نشده است</h3>
        <p class="trn-ov-statement">با ثبت نتیجه فینال در جدول مسابقات، قهرمان رسمی و جزئیات جایزه در این بخش ثبت می‌شود.</p>
      </article>
    `;

  const workflowStrip = `
    <section class="trn-workflow-grid" aria-label="دسترسی سریع جریان‌های رقابت">
      <article class="trn-workflow-card">
        <span class="trn-workflow-step">۰۱</span>
        <h4>ساخت تیم‌های نماینده</h4>
        <p>از مشتریان ثبت‌نام‌شده باشگاه تیم‌های ویدیویی، فوتبال دستی و بیلیارد بسازید (${fmt.num(teams.length)} تیم آماده).</p>
        <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-jump-tab="teams">مدیریت تیم‌های سالن</button>
      </article>
      <article class="trn-workflow-card">
        <span class="trn-workflow-step">۰۲</span>
        <h4>مسابقات داخلی انتخابی</h4>
        <p>${internalActive ? `رویداد داخلی فعال: ${escapeHtml(internalActive.title)}` : 'مسابقه داخلی برگزار کنید و برندگان را به‌عنوان نماینده رسمی سالن معرفی کنید.'}</p>
        <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-jump-tab="internal">بخش مسابقات داخلی</button>
      </article>
      <article class="trn-workflow-card">
        <span class="trn-workflow-step">۰۳</span>
        <h4>چالش و توافق جایزه</h4>
        <p>فراخوان رقابت بدهید، چالش سایر گیم‌نت‌ها را بپذیرید و پس از توافق روی جایزه، جدول را خودکار بسازید.</p>
        <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-jump-tab="challenges">ورود به چالش‌های باز</button>
      </article>
      <article class="trn-workflow-card">
        <span class="trn-workflow-step">۰۴</span>
        <h4>جدول مسابقات و قهرمانی</h4>
        <p>${activeLive ? `مسابقه در حال اجرا: ${escapeHtml(activeLive.title)}` : 'نتایج هر مرحله را ثبت کنید و قهرمان نهایی را در تالار افتخارات نمایش دهید.'}</p>
        <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-jump-tab="brackets">باز کردن جدول فعال</button>
      </article>
    </section>
  `;

  return `
    ${workflowStrip}
    <div class="trn-ov-split">
      ${readyBlock}
      ${championBlock}
    </div>
  `;
}

export function renderChallengeCard(ch, fmt) {
  const catMeta = getCategoryMeta(ch.category);
  const statusMeta = getChallengeStatusMeta(ch.status);
  const isPhysical = ch.mode === 'physical';
  const centers = Array.isArray(ch.participatingCenters) ? ch.participatingCenters : [];
  const canForm = canFormTournamentFromChallenge(ch);
  const localJoined = centers.some((c) => c.gamenetId === LOCAL_GAMENET_ID);
  const isFull = centers.length >= Number(ch.maxCenters || 8);
  const isAgreed = ch.prizeAgreement?.status === 'agreed';
  const confirmedIds = new Set(ch.prizeAgreement?.confirmedGamenetIds || []);
  const localConfirmedPrize = confirmedIds.has(LOCAL_GAMENET_ID);
  const scopeLabel = ch.competitionScope === 'two_center' ? 'رقابت دو گیم‌نت' : `تورنومنت چندگیم‌نتی (تا ${fmt.num(ch.maxCenters)} سالن)`;
  const coverSrc = getCoverImageForTournament(ch);

  const centersHtml = centers
    .map((c) => {
      const membersText = (c.members || []).map((m) => m.name).join('، ');
      const prizeOk = confirmedIds.has(String(c.gamenetId));
      return `
        <li class="trn-center-row ${c.gamenetId === LOCAL_GAMENET_ID ? 'is-local' : ''}">
          <div class="trn-center-row-main">
            <strong>${escapeHtml(c.gamenetName)} (${escapeHtml(c.city || 'ایران')})</strong>
            <span class="trn-center-team">نماینده: ${escapeHtml(c.teamName)}${membersText ? ` — ${escapeHtml(membersText)}` : ''}</span>
          </div>
          <div class="trn-center-row-status">
            <span class="trn-status-text is-emerald">${c.role === 'host' ? 'میزبان و تاییدشده' : 'ثبت‌نام تاییدشده'}</span>
            <span aria-hidden="true">·</span>
            <span class="${prizeOk ? 'trn-prize-ok' : 'trn-prize-wait'}">${prizeOk ? 'جایزه تایید شد' : 'در انتظار تایید جایزه'}</span>
          </div>
        </li>
      `;
    })
    .join('');

  return `
    <article class="trn-challenge-card ${canForm ? 'is-ready-form' : ''}" data-challenge-id="${escapeHtml(ch.id)}">
      <div class="trn-challenge-top">
        <div class="trn-challenge-thumb">
          <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(ch.gameName)}" loading="lazy" referrerpolicy="no-referrer">
          <div class="trn-card-media-scrim" aria-hidden="true"></div>
          <div class="trn-challenge-thumb-meta">
            <span>${escapeHtml(catMeta.label)}</span>
            <span aria-hidden="true">·</span>
            <span>${isPhysical ? 'مسابقه حضوری' : escapeHtml(ch.platform || 'آنلاین')}</span>
          </div>
        </div>

        <div class="trn-challenge-head-body">
          <div class="trn-card-kicker">
            <span class="trn-status-text is-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(ch.gameName)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(scopeLabel)}</span>
          </div>
          <h3 class="trn-card-title">${escapeHtml(ch.title)}</h3>
          <p class="trn-challenge-statement">${escapeHtml(ch.statement)}</p>
          <div class="trn-challenge-specs">
            <span>میزبان: <strong>${escapeHtml(ch.hostGamenetName)} (${escapeHtml(ch.hostCity)})</strong></span>
            <span aria-hidden="true">·</span>
            <span>تاریخ پیشنهادی: <strong>${escapeHtml(ch.preferredDate)}</strong></span>
            <span aria-hidden="true">·</span>
            <span>فرمت: <strong>${escapeHtml(ch.format)}</strong></span>
            ${
              isPhysical
                ? `<span aria-hidden="true">·</span><span>محل برگزاری حضوری: <strong>${escapeHtml(ch.venue)}</strong></span>`
                : `<span aria-hidden="true">·</span><span>پلتفرم: <strong>${escapeHtml(ch.platform || 'PC')}</strong></span>`
            }
          </div>
        </div>
      </div>

      <!-- Prize Agreement Block (Clear Proposed vs Agreed distinction) -->
      <div class="trn-prize-agreement-box is-${isAgreed ? 'agreed' : 'proposed'}">
        <div class="trn-prize-agreement-head">
          <div class="trn-prize-agreement-title-wrap">
            <span class="trn-prize-agreement-state is-${isAgreed ? 'agreed' : 'proposed'}">
              ${isAgreed ? 'توافق نهایی جایزه تایید شد' : 'جایزه پیشنهادی — در انتظار توافق طرفین'}
            </span>
            <span aria-hidden="true">·</span>
            <span class="trn-muted-meta">${escapeHtml(getPrizeTypeLabel(ch.prizeAgreement?.prizeType))}</span>
            ${
              ch.prizeAgreement?.proposedByGamenetName
                ? `<span aria-hidden="true">·</span><span class="trn-muted-meta">پیشنهاددهنده: ${escapeHtml(ch.prizeAgreement.proposedByGamenetName)}</span>`
                : ''
            }
          </div>
          ${
            ch.status !== 'formed'
              ? `
                <div class="trn-prize-agreement-actions">
                  ${
                    !isAgreed
                      ? `<button type="button" class="trn-inline-action is-confirm" data-trn-confirm-prize="${escapeHtml(ch.id)}" data-finalize-all="${localConfirmedPrize && centers.length >= 2 ? '1' : '0'}">${localConfirmedPrize && centers.length >= 2 ? 'ثبت توافق نهایی طرفین' : 'تأیید این جایزه'}</button>`
                      : ''
                  }
                  <button type="button" class="trn-inline-action" data-trn-open-prize-edit="${escapeHtml(ch.id)}">ویرایش / پیشنهاد جایزه</button>
                </div>
              `
              : ''
          }
        </div>
        <strong class="trn-prize-agreement-summary">${escapeHtml(ch.prizeAgreement?.summary || 'توافقی')}</strong>
      </div>

      <!-- Participating Centers & Rosters -->
      <div class="trn-centers-section">
        <div class="trn-side-head-row">
          <span class="trn-section-mini-label">گیم‌نت‌های شرکت‌کننده و ترکیب تیم‌ها</span>
          <span class="trn-muted-meta trn-tabular">${fmt.num(centers.length)} از ${fmt.num(ch.maxCenters)} گیم‌نت · مهلت: ${escapeHtml(ch.registrationDeadline || 'باز')}</span>
        </div>
        <ul class="trn-centers-list">${centersHtml}</ul>
      </div>

      ${
        canForm
          ? `
            <div class="trn-auto-form-banner">
              <div>
                <strong>حداقل ۲ گیم‌نت چالش را پذیرفته‌اند — تورنومنت آماده تشکیل است</strong>
                <span>ساختار جدول حذفی به‌صورت خودکار بر اساس گیم‌نت‌ها و تیم‌های تاییدشده تولید می‌شود.</span>
              </div>
              <button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-form-tournament="${escapeHtml(ch.id)}">
                تشکیل خودکار تورنومنت و جدول
              </button>
            </div>
          `
          : ''
      }

      <div class="trn-challenge-footer">
        ${
          ch.status === 'formed' && ch.formedTournamentId
            ? `<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-detail="${escapeHtml(ch.formedTournamentId)}">مشاهده جدول تورنومنت تشکیل‌شده</button>`
            : !localJoined && !isFull
              ? `<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-accept="${escapeHtml(ch.id)}">پذیرش چالش توسط Game District</button>`
              : !isFull
                ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-open-accept-partner="${escapeHtml(ch.id)}">ثبت پذیرش گیم‌نت همکار دیگر</button>`
                : ''
        }
        ${
          ch.hostGamenetId === LOCAL_GAMENET_ID && ch.status !== 'formed'
            ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm trn-delete-btn" data-trn-delete-challenge="${escapeHtml(ch.id)}">حذف فراخوان</button>`
            : ''
        }
      </div>
    </article>
  `;
}

export function renderTeamCard(team, fmt) {
  const catMeta = getCategoryMeta(team.category);
  const isPhysical = team.mode === 'physical';
  const members = Array.isArray(team.members) ? team.members : [];
  const membersHtml = members
    .map(
      (m) => `
        <li class="trn-team-member-item">
          <strong>${escapeHtml(m.name)}</strong>
          <span>${escapeHtml(m.role || (m.customerId ? `عضو باشگاه #${fmt.num(m.customerId)}` : 'عضو تیم'))}</span>
        </li>
      `
    )
    .join('');

  return `
    <article class="trn-team-card" data-team-id="${escapeHtml(team.id)}">
      <div class="trn-team-card-head">
        <div class="trn-team-icon-box">${getCategoryIconSvg(team.category, 20)}</div>
        <div class="trn-team-head-copy">
          <div class="trn-card-kicker">
            <span>${escapeHtml(catMeta.label)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(team.gameName)}</span>
            <span aria-hidden="true">·</span>
            <span>${team.entryType === 'individual' ? 'نماینده انفرادی' : `تیم ${fmt.num(members.length)} نفره`}</span>
          </div>
          <h3 class="trn-card-title">${escapeHtml(team.name)}</h3>
        </div>
      </div>

      ${
        !isPhysical && team.onlineTag
          ? `<div class="trn-team-meta-row">شناسه آنلاین تیم: <strong class="trn-tabular">${escapeHtml(team.onlineTag)}</strong></div>`
          : isPhysical
            ? `<div class="trn-team-meta-row">نوع رقابت: <strong>حضوری در سالن (${escapeHtml(team.gamenetName)})</strong></div>`
            : ''
      }

      ${team.notes ? `<p class="trn-team-notes">${escapeHtml(team.notes)}</p>` : ''}

      <ul class="trn-team-members-list">${membersHtml}</ul>

      <div class="trn-card-actions">
        <button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-challenge-from-team="${escapeHtml(team.id)}">
          انتشار چالش با این تیم
        </button>
        <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm trn-delete-btn" data-trn-delete-team="${escapeHtml(team.id)}" aria-label="حذف تیم ${escapeHtml(team.name)}">
          حذف
        </button>
      </div>
    </article>
  `;
}

export function renderTournamentCard(t, fmt) {
  const catMeta = getCategoryMeta(t.category);
  const statusMeta = getStatusMeta(t.status);
  const isPhysical = t.mode === 'physical';
  const coverSrc = getCoverImageForTournament(t);
  const participants = Array.isArray(t.participants) ? t.participants : [];
  const maxSlots = Math.max(2, Number(t.maxSlots) || 8);
  const pct = Math.min(100, Math.round((participants.length / maxSlots) * 100));
  const prizeTypeLabel = getPrizeTypeLabel(t.prizeAgreement?.prizeType || t.prizeType);
  const prizeAgreed = t.prizeAgreement?.status === 'agreed';
  const scopeLabel = t.scope === 'internal' ? 'مسابقه داخلی سالن' : 'تورنومنت بین‌گیم‌نتی';
  const isFull = participants.length >= maxSlots;
  const canEnroll = t.status !== 'completed' && !isFull;
  const champName = t.bracket?.champion?.playerName;

  return `
    <article class="trn-card" data-tournament-id="${escapeHtml(t.id)}">
      <div class="trn-card-media">
        <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(t.title)}" class="trn-card-img" loading="lazy" referrerpolicy="no-referrer">
        <div class="trn-card-media-scrim" aria-hidden="true"></div>
        <div class="trn-card-media-footer">
          <span class="trn-status-text is-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(scopeLabel)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(t.startDate)}</span>
        </div>
      </div>

      <div class="trn-card-body">
        <div class="trn-card-kicker">
          <span>${escapeHtml(catMeta.label)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(t.gameName)}</span>
          <span aria-hidden="true">·</span>
          <span>${isPhysical ? 'حضوری' : escapeHtml(t.platform || 'آنلاین')}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(t.format)}</span>
        </div>

        <h3 class="trn-card-title">${escapeHtml(t.title)}</h3>

        <div class="trn-card-host">
          میزبان: <strong>${escapeHtml(t.hostGamenetName)} (${escapeHtml(t.hostCity)})</strong>
          ${
            isPhysical
              ? `<span aria-hidden="true">·</span><span>محل برگزاری: <strong>${escapeHtml(t.venue)}</strong></span>`
              : `<span aria-hidden="true">·</span><span>ورودی: <strong class="trn-tabular">${fmt.toman(t.entryFee)}</strong></span>`
          }
        </div>

        <div class="trn-card-prize-row">
          <div class="trn-card-prize-meta">
            <span class="trn-card-prize-label">${escapeHtml(prizeTypeLabel)}</span>
            <span aria-hidden="true">·</span>
            <span class="trn-prize-state-inline is-${prizeAgreed ? 'agreed' : 'proposed'}">
              ${t.scope === 'internal' ? 'جایزه مصوب سالن' : prizeAgreed ? 'توافق نهایی شده' : 'جایزه پیشنهادی'}
            </span>
          </div>
          <strong class="trn-card-prize-text">${escapeHtml(t.prizeAgreement?.summary || t.prizes?.first || fmt.toman(t.prizePoolValue))}</strong>
        </div>

        ${
          champName
            ? `<div class="trn-card-champion">قهرمان رسمی: <strong>${escapeHtml(champName)}</strong> (${escapeHtml(t.bracket.champion.gamenetName)})</div>`
            : ''
        }

        <div class="trn-capacity-wrap">
          <div class="trn-capacity-meta">
            <span>شرکت‌کنندگان ثبت‌شده</span>
            <span class="trn-tabular">${fmt.num(participants.length)} از ${fmt.num(maxSlots)}</span>
          </div>
          <div class="trn-capacity-track" role="progressbar" aria-valuenow="${participants.length}" aria-valuemin="0" aria-valuemax="${maxSlots}">
            <div class="trn-capacity-fill" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div class="trn-card-actions">
          <button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-detail="${escapeHtml(t.id)}">
            ${t.bracket ? 'مشاهده جدول و نتایج' : 'مدیریت و قرعه‌کشی'}
          </button>
          ${
            canEnroll
              ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-quick-enroll="${escapeHtml(t.id)}">${t.scope === 'internal' ? 'افزودن مشتری' : 'اعزام نماینده'}</button>`
              : t.scope === 'internal' && champName
                ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-promote-winner="${escapeHtml(t.id)}">معرفی به‌عنوان تیم نماینده</button>`
                : ''
          }
        </div>
      </div>
    </article>
  `;
}

export function renderChampionCard(t, fmt, options = {}) {
  const champ = t.bracket?.champion;
  if (!champ) return '';
  const catMeta = getCategoryMeta(t.category);
  const finalScore = t.bracket?.finalScore;
  const runnerUp = t.bracket?.runnerUp;
  const headline = buildChampionHeadline(t);
  const dateLabel = t.completedDateLabel || t.startDate || '۵ آذر ۱۴۰۵';
  const awardedPrize = t.prizeAgreement?.summary || t.prizes?.first || fmt.toman(t.prizePoolValue);
  const isPhysical = t.mode === 'physical';
  const membersList = Array.isArray(champ.members) && champ.members.length > 0
    ? champ.members.map((m) => m.name).join('، ')
    : '';

  return `
    <article class="trn-champ-showcase ${options.compact ? 'is-compact' : ''}" data-champion-tournament="${escapeHtml(t.id)}">
      <div class="trn-champ-sheen" aria-hidden="true"></div>
      <div class="trn-champ-top">
        <div class="trn-champ-trophy-badge" aria-hidden="true">${getTrophyIconSvg(options.compact ? 24 : 30)}</div>
        <div class="trn-champ-heading">
          <div class="trn-card-kicker">
            <span class="trn-status-text is-emerald">قهرمان رسمی تورنومنت</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(catMeta.label)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(t.gameName)}</span>
            <span aria-hidden="true">·</span>
            <span>${escapeHtml(dateLabel)}</span>
          </div>
          <h3 class="trn-champ-title">${escapeHtml(champ.playerName)}</h3>
          <p class="trn-champ-headline">${escapeHtml(headline)}</p>
        </div>
      </div>

      <div class="trn-champ-details-grid">
        <div class="trn-champ-detail-cell">
          <span>گیم‌نت نماینده</span>
          <strong>${escapeHtml(champ.gamenetName)}</strong>
        </div>
        <div class="trn-champ-detail-cell">
          <span>نتیجه دیدار فینال</span>
          <strong class="trn-tabular">
            ${
              finalScore
                ? `${fmt.num(finalScore.scoreA)} – ${fmt.num(finalScore.scoreB)}${runnerUp ? ` (مقابل ${escapeHtml(runnerUp.playerName)})` : ''}`
                : 'تکمیل‌شده'
            }
          </strong>
        </div>
        <div class="trn-champ-detail-cell">
          <span>${isPhysical ? 'محل برگزاری حضوری' : 'پلتفرم و رویداد'}</span>
          <strong>${isPhysical ? escapeHtml(t.venue || t.hostGamenetName) : `${escapeHtml(t.platform || 'آنلاین')} · ${escapeHtml(t.title)}`}</strong>
        </div>
        <div class="trn-champ-detail-cell is-prize">
          <span>جایزه اهداشده</span>
          <strong>${escapeHtml(awardedPrize)}</strong>
        </div>
      </div>

      ${
        membersList
          ? `<div class="trn-champ-members">اعضای تیم قهرمان: <strong>${escapeHtml(membersList)}</strong></div>`
          : ''
      }

      <div class="trn-champ-actions">
        <button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-open-detail="${escapeHtml(t.id)}">
          مشاهده جدول کامل نتایج
        </button>
        ${
          t.scope === 'internal'
            ? `<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-promote-winner="${escapeHtml(t.id)}">ثبت قهرمان در تیم‌های نماینده سالن</button>`
            : ''
        }
      </div>
    </article>
  `;
}

export function renderBracketHeader(t, allTournaments, fmt) {
  const catMeta = getCategoryMeta(t.category);
  const statusMeta = getStatusMeta(t.status);
  const isPhysical = t.mode === 'physical';
  const selectorOptions = allTournaments
    .map(
      (item) =>
        `<option value="${escapeHtml(item.id)}" ${item.id === t.id ? 'selected' : ''}>${escapeHtml(item.title)} (${escapeHtml(item.gameName)})</option>`
    )
    .join('');

  return `
    <div class="trn-detail-top">
      <div class="trn-detail-info">
        <div class="trn-card-kicker">
          <span class="trn-status-text is-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span>
          <span aria-hidden="true">·</span>
          <span>${t.scope === 'internal' ? 'مسابقه داخلی سالن' : 'تورنومنت بین‌گیم‌نتی'}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(catMeta.label)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(t.gameName)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(t.format)}</span>
        </div>
        <h2 class="trn-detail-title">${escapeHtml(t.title)}</h2>
        <div class="trn-detail-mode-strip is-${isPhysical ? 'physical' : 'online'}">
          ${
            isPhysical
              ? `
                <span>نوع برگزاری: <strong>رقابت حضوری</strong></span>
                <span aria-hidden="true">·</span>
                <span>گیم‌نت میزبان: <strong>${escapeHtml(t.hostGamenetName)} (${escapeHtml(t.hostCity)})</strong></span>
                <span aria-hidden="true">·</span>
                <span>محل برگزاری: <strong>${escapeHtml(t.venue)}</strong></span>
                <span aria-hidden="true">·</span>
                <span>زمان: <strong>${escapeHtml(t.startDate)}</strong></span>
              `
              : `
                <span>نوع برگزاری: <strong>رقابت آنلاین</strong></span>
                <span aria-hidden="true">·</span>
                <span>پلتفرم: <strong>${escapeHtml(t.platform || 'PC')}</strong></span>
                <span aria-hidden="true">·</span>
                <span>میزبان: <strong>${escapeHtml(t.hostGamenetName)} (${escapeHtml(t.hostCity)})</strong></span>
                <span aria-hidden="true">·</span>
                <span>زمان: <strong>${escapeHtml(t.startDate)}</strong></span>
                <span aria-hidden="true">·</span>
                <span>کد لابی: <strong class="trn-tabular">${escapeHtml(t.lobbyCode || 'NET-LIVE')}</strong></span>
              `
          }
        </div>
        ${t.rules ? `<p class="trn-detail-rules">${escapeHtml(t.rules)}</p>` : ''}
      </div>
      <div class="trn-detail-switcher">
        <label for="trnDetailSelect" class="mg-label">تغییر تورنومنت در جدول</label>
        <select id="trnDetailSelect" class="form-control mg-select">${selectorOptions}</select>
        ${
          t.hostGamenetId === LOCAL_GAMENET_ID
            ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm trn-delete-btn" data-trn-delete="${escapeHtml(t.id)}">حذف این تورنومنت</button>`
            : ''
        }
      </div>
    </div>
  `;
}

export function renderBracketStage(t, fmt) {
  if (!t.bracket || !Array.isArray(t.bracket.rounds)) {
    return `
      <div class="trn-bracket-empty">
        <h4>جدول حذفی هنوز تولید نشده است</h4>
        <p>پس از ثبت‌نام حداقل ۲ شرکت‌کننده یا تیم، دکمه «قرعه‌کشی و ساخت جدول» را بزنید تا جفت‌سازی رقابت‌ها و دورها به‌صورت خودکار ایجاد شوند.</p>
      </div>
    `;
  }

  const champShowcase = t.bracket.champion ? renderChampionCard(t, fmt) : '';

  const roundsHtml = t.bracket.rounds
    .map((round) => {
      const matchesHtml = round.matches
        .map((m) => {
          const aWin = m.winnerId && m.playerA && m.winnerId === m.playerA.id;
          const bWin = m.winnerId && m.playerB && m.winnerId === m.playerB.id;
          const canRecord = Boolean(m.playerA && m.playerB && m.status !== 'done');
          const actionLabel =
            m.status === 'done'
              ? 'نتیجه ثبت شد'
              : m.status === 'bye'
                ? 'صعود خودکار'
                : canRecord
                  ? 'ثبت نتیجه'
                  : 'در انتظار حریف';

          const membersA = Array.isArray(m.playerA?.members) && m.playerA.members.length > 1
            ? m.playerA.members.map((x) => x.name).slice(0, 3).join('، ')
            : '';
          const membersB = Array.isArray(m.playerB?.members) && m.playerB.members.length > 1
            ? m.playerB.members.map((x) => x.name).slice(0, 3).join('، ')
            : '';

          return `
            <div class="trn-match-card ${canRecord ? 'is-actionable' : ''} ${m.status === 'done' ? 'is-done' : ''}">
              <div class="trn-match-head">
                <span class="trn-match-id">${escapeHtml(round.name)} — دیدار ${fmt.num(m.matchIndex + 1)}</span>
                ${
                  canRecord
                    ? `<button type="button" class="trn-record-btn" data-trn-record-match="${escapeHtml(m.id)}">ثبت نتیجه</button>`
                    : `<span class="trn-match-state">${escapeHtml(actionLabel)}</span>`
                }
              </div>
              <div class="trn-match-slot ${aWin ? 'is-winner' : ''}">
                <div class="trn-slot-player">
                  <strong>${escapeHtml(m.playerA ? m.playerA.playerName : '— در انتظار —')}</strong>
                  <span>${escapeHtml(m.playerA ? `${m.playerA.gamenetName}${membersA ? ` · ${membersA}` : ''}` : '')}</span>
                </div>
                <span class="trn-slot-score trn-tabular">${m.scoreA !== null && m.scoreA !== undefined ? fmt.num(m.scoreA) : '–'}</span>
              </div>
              <div class="trn-match-slot ${bWin ? 'is-winner' : ''}">
                <div class="trn-slot-player">
                  <strong>${escapeHtml(m.playerB ? m.playerB.playerName : m.status === 'bye' ? 'استراحت (Bye)' : '— در انتظار —')}</strong>
                  <span>${escapeHtml(m.playerB ? `${m.playerB.gamenetName}${membersB ? ` · ${membersB}` : ''}` : '')}</span>
                </div>
                <span class="trn-slot-score trn-tabular">${m.scoreB !== null && m.scoreB !== undefined ? fmt.num(m.scoreB) : '–'}</span>
              </div>
            </div>
          `;
        })
        .join('');

      return `
        <div class="trn-round-col">
          <div class="trn-round-title">${escapeHtml(round.name)}</div>
          <div class="trn-round-matches">${matchesHtml}</div>
        </div>
      `;
    })
    .join('');

  return `${champShowcase}<div class="trn-bracket-grid">${roundsHtml}</div>`;
}
