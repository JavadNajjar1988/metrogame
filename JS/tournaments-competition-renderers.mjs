/**
 * Pure HTML Renderers for:
 * - Gaming Center Leaderboard ("رتبه‌بندی گیم‌نت‌ها")
 * - Direct Gaming Center Challenges ("چالش مستقیم") with VS cards & term diff comparisons
 * - Dedicated Head-to-Head Match View for 2-center direct matches
 *
 * Strictly escapes every dynamic string via escapeHtml; zero DOM side effects.
 */
import {
  LOCAL_GAMENET_ID,
  getCategoryMeta,
  getPrizeTypeLabel,
} from './tournaments-engine.mjs';
import {
  getDirectChallengeStatusMeta,
  getGamingCenterInfo,
} from './tournaments-competition.mjs';
import { escapeHtml, getCategoryIconSvg, getTrophyIconSvg } from './tournaments-renderers.mjs';

function isSafeLocalImagePath(url) {
  return typeof url === 'string' && /^src\/assets\/images\/[\w.-]+\.(?:jpg|jpeg|png|webp)$/i.test(url);
}

export function renderCenterLogo(centerId, fallbackName = '', size = 'md') {
  const info = getGamingCenterInfo(centerId, fallbackName);
  const sizeClass = size === 'lg' ? 'is-lg' : size === 'sm' ? 'is-sm' : 'is-md';
  if (isSafeLocalImagePath(info.logoUrl)) {
    return `
      <span class="trn-center-logo ${sizeClass} is-photo" aria-hidden="true">
        <img src="${escapeHtml(info.logoUrl)}" alt="" referrerpolicy="no-referrer" loading="lazy">
      </span>
    `;
  }
  return `
    <span class="trn-center-logo ${sizeClass} is-monogram hue-${escapeHtml(info.brandHue)}" aria-hidden="true">
      ${escapeHtml(info.shortCode)}
    </span>
  `;
}

function renderRankMedal(rank, fmt) {
  if (rank === 1) {
    return `
      <span class="trn-rank-badge is-gold" title="رتبه اول">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"/></svg>
        <span class="trn-tabular">${fmt.num(1)}</span>
      </span>
    `;
  }
  if (rank === 2) {
    return `
      <span class="trn-rank-badge is-silver" title="رتبه دوم">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>
        <span class="trn-tabular">${fmt.num(2)}</span>
      </span>
    `;
  }
  if (rank === 3) {
    return `
      <span class="trn-rank-badge is-bronze" title="رتبه سوم">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>
        <span class="trn-tabular">${fmt.num(3)}</span>
      </span>
    `;
  }
  return `<span class="trn-rank-num trn-tabular">${fmt.num(rank)}</span>`;
}

function renderMovementIndicator(row, fmt) {
  if (row.movement === 'up' && row.movementDelta > 0) {
    return `
      <span class="trn-move is-up" title="صعود ${fmt.num(row.movementDelta)} پله نسبت به رتبه قبل">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
        <span class="trn-tabular">+${fmt.num(row.movementDelta)}</span>
      </span>
    `;
  }
  if (row.movement === 'down' && row.movementDelta > 0) {
    return `
      <span class="trn-move is-down" title="نزول ${fmt.num(row.movementDelta)} پله نسبت به رتبه قبل">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        <span class="trn-tabular">-${fmt.num(row.movementDelta)}</span>
      </span>
    `;
  }
  return `<span class="trn-move is-same" title="بدون تغییر رتبه"><span>—</span></span>`;
}

/**
 * Renders the full Gaming Center Leaderboard table + transparent points legend.
 */
export function renderGamingCenterLeaderboard(board, filters, fmt) {
  const rows = Array.isArray(board?.rows) ? board.rows : [];
  const hasAnyMatches = board?.totalMatchesCounted > 0;

  const scoringBar = `
    <div class="trn-lb-scoring-bar" aria-label="ساختار امتیازدهی رتبه‌بندی">
      <div class="trn-lb-scoring-head">
        <strong>سیستم امتیازدهی شفاف و بدون شمارش تکراری</strong>
        <span>هر دیدار تاییدشده و هر عنوان تورنومنت دقیقاً یک‌بار محاسبه می‌شود؛ مسابقات لغو یا تاییدنشده امتیازی ندارند.</span>
      </div>
      <div class="trn-lb-scoring-rules">
        <div class="trn-lb-rule-item">
          <span class="trn-lb-rule-pts is-accent trn-tabular">+${fmt.num(100)}</span>
          <span class="trn-lb-rule-lbl">قهرمانی تورنومنت</span>
        </div>
        <div class="trn-lb-rule-item">
          <span class="trn-lb-rule-pts is-blue trn-tabular">+${fmt.num(50)}</span>
          <span class="trn-lb-rule-lbl">نایب‌قهرمانی</span>
        </div>
        <div class="trn-lb-rule-item">
          <span class="trn-lb-rule-pts is-emerald trn-tabular">+${fmt.num(20)}</span>
          <span class="trn-lb-rule-lbl">برد در هر دیدار رسمی</span>
        </div>
        <div class="trn-lb-rule-item">
          <span class="trn-lb-rule-pts is-muted trn-tabular">${fmt.num(0)}</span>
          <span class="trn-lb-rule-lbl">باخت یا دیدار لغوشده</span>
        </div>
      </div>
    </div>
  `;

  if (!hasAnyMatches) {
    return `
      ${scoringBar}
      <div class="trn-empty-state trn-glass-surface">
        <h3>نتیجه تاییدشده‌ای برای این فیلتر ثبت نشده است</h3>
        <p>فیلتر بازه زمانی (ماه جاری / کل تاریخچه) یا بازی انتخابی را تغییر دهید تا رتبه‌بندی سایر رقابت‌ها نمایش داده شود.</p>
      </div>
    `;
  }

  const tbodyRows = rows
    .map((row) => {
      const topClass = row.rank <= 3 ? `is-top-${row.rank}` : '';
      const localClass = row.isLocal ? 'is-local-center' : '';
      const breakdownParts = [];
      if (row.tournamentWins > 0) breakdownParts.push(`${fmt.num(row.tournamentWins)} قهرمانی`);
      if (row.runnerUps > 0) breakdownParts.push(`${fmt.num(row.runnerUps)} نایب‌قهرمانی`);
      if (row.wins > 0) breakdownParts.push(`${fmt.num(row.wins)} برد`);
      const breakdownText = breakdownParts.length > 0 ? breakdownParts.join(' · ') : 'بدون نتیجه در این بازه';

      return `
        <tr class="trn-lb-row ${topClass} ${localClass}">
          <td class="trn-lb-col-rank">${renderRankMedal(row.rank, fmt)}</td>
          <td class="trn-lb-col-center">
            <div class="trn-lb-center-cell">
              ${renderCenterLogo(row.id, row.name, 'sm')}
              <div class="trn-lb-center-copy">
                <div class="trn-lb-center-title">
                  <strong>${escapeHtml(row.name)}</strong>
                  ${row.isLocal ? '<span class="trn-local-tag">گیم‌نت شما</span>' : ''}
                </div>
                <span class="trn-lb-center-city">${escapeHtml(row.city)}</span>
              </div>
            </div>
          </td>
          <td class="trn-lb-col-points">
            <div class="trn-lb-points-wrap">
              <strong class="trn-lb-points-val trn-tabular">${fmt.num(row.points)}</strong>
              <span class="trn-lb-points-sub">${escapeHtml(breakdownText)}</span>
            </div>
          </td>
          <td class="trn-lb-col-wl trn-tabular">
            <span class="trn-wl-win">${fmt.num(row.wins)}</span>
            <span class="trn-wl-sep">/</span>
            <span class="trn-wl-loss">${fmt.num(row.losses)}</span>
          </td>
          <td class="trn-lb-col-matches trn-tabular">${fmt.num(row.completedMatches)}</td>
          <td class="trn-lb-col-rate">
            <div class="trn-winrate-cell">
              <span class="trn-tabular">${fmt.num(row.winRate)}٪</span>
              <div class="trn-winrate-track" aria-hidden="true">
                <div class="trn-winrate-fill" style="width:${Math.min(100, Math.max(0, row.winRate))}%"></div>
              </div>
            </div>
          </td>
          <td class="trn-lb-col-move">${renderMovementIndicator(row, fmt)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    ${scoringBar}
    <div class="trn-lb-table-card trn-glass-surface">
      <div class="trn-lb-table-head">
        <div>
          <h4 class="trn-panel-title">جدول رسمی رتبه‌بندی گیم‌نت‌ها</h4>
          <p class="trn-panel-sub">
            ${escapeHtml(filters.timeframe === 'monthly' ? 'عملکرد ۳۰ روز اخیر (ماه جاری)' : 'عملکرد کل تاریخچه شبکه')}
            · <span class="trn-tabular">${fmt.num(board.totalMatchesCounted)}</span> دیدار رسمی تاییدشده
          </p>
        </div>
        ${
          board.leader && board.leader.points > 0
            ? `<div class="trn-lb-leader-chip">
                <span>صدرنشین فعلی:</span>
                <strong>${escapeHtml(board.leader.name)}</strong>
                <span class="trn-tabular">(${fmt.num(board.leader.points)} امتیاز)</span>
              </div>`
            : ''
        }
      </div>
      <div class="mg-table-responsive">
        <table class="table mg-table trn-lb-table">
          <thead>
            <tr>
              <th>رتبه</th>
              <th>گیم‌نت</th>
              <th>امتیاز کل</th>
              <th>برد / باخت</th>
              <th>دیدارهای کامل‌شده</th>
              <th>درصد برد</th>
              <th>تغییر رتبه</th>
            </tr>
          </thead>
          <tbody>${tbodyRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Renders an elegant Head-to-Head Direct Challenge Card ("مترو گیم VS Nexus Club")
 * including term negotiation diffs, mutual agreement status, and contextual admin actions.
 */
export function renderDirectChallengeCard(dc, fmt) {
  const statusMeta = getDirectChallengeStatusMeta(dc.status);
  const catMeta = getCategoryMeta(dc.category);
  const isSent = dc.challengerGamenetId === LOCAL_GAMENET_ID;
  const isIncoming = dc.targetGamenetId === LOCAL_GAMENET_ID;
  const isPhysical = dc.mode === 'physical';

  const directionLabel = isIncoming ? 'دعوت دریافتی' : 'چالش ارسالی';
  const challengerAgreed = Boolean(dc.agreements?.[dc.challengerGamenetId]);
  const targetAgreed = Boolean(dc.agreements?.[dc.targetGamenetId]);
  const localAgreed = Boolean(dc.agreements?.[LOCAL_GAMENET_ID]);

  // Term comparison box if counter-proposal is pending
  let diffSection = '';
  if (dc.status === 'awaiting_agreement' && dc.pendingProposal && Array.isArray(dc.pendingProposal.diff)) {
    const diffRows = dc.pendingProposal.diff
      .map(
        (item) => `
          <div class="trn-diff-row">
            <span class="trn-diff-label">${escapeHtml(item.label)}</span>
            <span class="trn-diff-old">${escapeHtml(item.original)}</span>
            <span class="trn-diff-arrow" aria-hidden="true">←</span>
            <span class="trn-diff-new">${escapeHtml(item.updated)}</span>
          </div>
        `
      )
      .join('');

    diffSection = `
      <div class="trn-dc-diff-box">
        <div class="trn-dc-diff-head">
          <div>
            <strong>پیشنهاد تغییر شرایط توسط ${escapeHtml(dc.pendingProposal.proposedByName)}</strong>
            <span>برای نهایی شدن چالش، هر دو گیم‌نت باید شرایط اصلاح‌شده را صراحتاً تایید کنند.</span>
          </div>
          <div class="trn-dc-agreement-checks">
            <span class="trn-agree-item ${challengerAgreed ? 'is-ok' : 'is-wait'}">
              ${escapeHtml(dc.challengerGamenetName)}: ${challengerAgreed ? 'تایید کرده' : 'در انتظار تایید'}
            </span>
            <span aria-hidden="true">·</span>
            <span class="trn-agree-item ${targetAgreed ? 'is-ok' : 'is-wait'}">
              ${escapeHtml(dc.targetGamenetName)}: ${targetAgreed ? 'تایید کرده' : 'در انتظار تایید'}
            </span>
          </div>
        </div>
        <div class="trn-diff-list">
          <div class="trn-diff-row is-header">
            <span>مورد تغییریافته</span>
            <span>شرایط قبلی</span>
            <span aria-hidden="true"></span>
            <span>شرایط پیشنهادی جدید</span>
          </div>
          ${diffRows}
        </div>
      </div>
    `;
  }

  // Rejection or Completed result banner
  let outcomeBanner = '';
  if (dc.status === 'rejected' && dc.rejectionReason) {
    outcomeBanner = `
      <div class="trn-dc-outcome is-rejected">
        <strong>دلیل رد چالش:</strong>
        <span>${escapeHtml(dc.rejectionReason)}</span>
      </div>
    `;
  } else if (dc.status === 'completed' && dc.result) {
    outcomeBanner = `
      <div class="trn-dc-outcome is-completed">
        <strong>نتیجه تاییدشده دیدار:</strong>
        <span>برنده: <strong>${escapeHtml(dc.result.winnerName)} (${escapeHtml(dc.result.winnerGamenetName)})</strong> · امتیاز نهایی <span class="trn-tabular">${fmt.num(dc.result.scoreA)} – ${fmt.num(dc.result.scoreB)}</span> (+${fmt.num(20)} امتیاز رتبه‌بندی)</span>
      </div>
    `;
  }

  // Contextual actions based on status & role
  const actions = [];
  if (dc.status === 'pending') {
    if (isIncoming) {
      actions.push(`<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-dc-accept="${escapeHtml(dc.id)}">پذیرش چالش</button>`);
      actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-dc-propose="${escapeHtml(dc.id)}">پیشنهاد تغییر شرایط</button>`);
      actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn trn-delete-btn mg-btn-sm" data-trn-dc-reject="${escapeHtml(dc.id)}">رد کردن</button>`);
    } else if (isSent) {
      actions.push(`<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-dc-accept="${escapeHtml(dc.id)}">ثبت تایید حریف و شروع دیدار</button>`);
      actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-dc-propose="${escapeHtml(dc.id)}">ویرایش / پیشنهاد شرایط جدید</button>`);
      actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn trn-delete-btn mg-btn-sm" data-trn-dc-delete="${escapeHtml(dc.id)}">لغو چالش</button>`);
    }
  } else if (dc.status === 'awaiting_agreement') {
    if (!localAgreed) {
      actions.push(`<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-dc-confirm="${escapeHtml(dc.id)}">تایید شرایط نهایی (توافق دوطرفه)</button>`);
    } else {
      actions.push(`<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-dc-confirm-both="${escapeHtml(dc.id)}">ثبت تایید گیم‌نت مقابل و نهایی‌سازی</button>`);
    }
    actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-dc-propose="${escapeHtml(dc.id)}">پیشنهاد تغییر مجدد</button>`);
    actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn trn-delete-btn mg-btn-sm" data-trn-dc-reject="${escapeHtml(dc.id)}">رد کردن</button>`);
  } else if (dc.status === 'accepted' && dc.linkedTournamentId) {
    actions.push(`<button type="button" class="btn mg-btn mg-btn-primary mg-btn-sm" data-trn-open-detail="${escapeHtml(dc.linkedTournamentId)}">ورود به صفحه دیدار رو‌در‌رو و ثبت نتیجه</button>`);
  } else if (dc.status === 'completed' && dc.linkedTournamentId) {
    actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-open-detail="${escapeHtml(dc.linkedTournamentId)}">مشاهده جزئیات و نتیجه دیدار</button>`);
  } else if (dc.status === 'rejected') {
    actions.push(`<button type="button" class="btn mg-btn trn-ghost-btn trn-delete-btn mg-btn-sm" data-trn-dc-delete="${escapeHtml(dc.id)}">حذف از فهرست</button>`);
  }

  return `
    <article class="trn-dc-card trn-glass-surface is-status-${escapeHtml(dc.status)}" data-direct-challenge-id="${escapeHtml(dc.id)}">
      <div class="trn-dc-top-meta">
        <div class="trn-dc-meta-group">
          <span class="trn-dc-cat-inline">${getCategoryIconSvg(dc.category, 15)} ${escapeHtml(catMeta.label)}</span>
          <span aria-hidden="true">·</span>
          <span>${escapeHtml(directionLabel)}</span>
          <span aria-hidden="true">·</span>
          <span>${isPhysical ? 'مسابقه حضوری' : 'مسابقه آنلاین'}</span>
        </div>
        <span class="trn-dc-status-badge is-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span>
      </div>

      <div class="trn-dc-versus-row">
        <div class="trn-dc-side is-challenger">
          ${renderCenterLogo(dc.challengerGamenetId, dc.challengerGamenetName, 'md')}
          <div class="trn-dc-side-copy">
            <strong class="trn-dc-center-name">${escapeHtml(dc.challengerGamenetName)}</strong>
            <span class="trn-dc-roster-line">
              ${escapeHtml(dc.challengerRoster?.teamName || 'نماینده میزبان')} · ${escapeHtml(dc.challengerCity)}
            </span>
          </div>
        </div>

        <div class="trn-dc-vs-mark" aria-label="در برابر">
          <span>VS</span>
        </div>

        <div class="trn-dc-side is-target">
          <div class="trn-dc-side-copy is-align-end">
            <strong class="trn-dc-center-name">${escapeHtml(dc.targetGamenetName)}</strong>
            <span class="trn-dc-roster-line">
              ${escapeHtml(dc.targetRoster?.teamName || 'در انتظار تعیین نماینده')} · ${escapeHtml(dc.targetCity)}
            </span>
          </div>
          ${renderCenterLogo(dc.targetGamenetId, dc.targetGamenetName, 'md')}
        </div>
      </div>

      <div class="trn-dc-specs-grid">
        <div class="trn-dc-spec-cell">
          <span>رشته / بازی</span>
          <strong>${escapeHtml(dc.gameName)}</strong>
        </div>
        <div class="trn-dc-spec-cell">
          <span>فرمت</span>
          <strong>${escapeHtml(dc.format)}</strong>
        </div>
        <div class="trn-dc-spec-cell">
          <span>زمان پیشنهادی</span>
          <strong>${escapeHtml(dc.proposedDate)}${dc.proposedTime ? ` · ساعت ${escapeHtml(dc.proposedTime)}` : ''}</strong>
        </div>
        <div class="trn-dc-spec-cell is-prize">
          <span>جایزه (${escapeHtml(getPrizeTypeLabel(dc.prizeType))})</span>
          <strong>${escapeHtml(dc.prizeSummary)}</strong>
        </div>
      </div>

      <div class="trn-dc-venue-line">
        ${
          isPhysical
            ? `<span>محل میزبانی حضوری: <strong>${escapeHtml(dc.venue)}</strong></span>`
            : `<span>پلتفرم آنلاین: <strong>${escapeHtml(dc.platform || 'PC')}</strong></span>`
        }
        ${dc.notes ? `<span aria-hidden="true">·</span><span class="trn-dc-notes">${escapeHtml(dc.notes)}</span>` : ''}
      </div>

      ${diffSection}
      ${outcomeBanner}

      <div class="trn-dc-actions">
        ${actions.join('')}
      </div>
    </article>
  `;
}

/**
 * Renders a clean, dedicated Head-to-Head Match View for 2-center Direct Challenges
 * instead of forcing an unnecessarily complicated multi-round bracket tree.
 */
export function renderHeadToHeadMatchStage(tournament, fmt) {
  const match = tournament.bracket?.rounds?.[0]?.matches?.[0];
  if (!match || !match.playerA || !match.playerB) {
    return `
      <div class="trn-empty-state">
        <h3>ترکیب دو گیم‌نت در حال تکمیل است</h3>
        <p>پس از تایید هر دو نماینده، صفحه دیدار رو‌در‌رو به‌صورت خودکار آماده ثبت نتیجه می‌شود.</p>
      </div>
    `;
  }

  const pA = match.playerA;
  const pB = match.playerB;
  const isDone = match.status === 'done';
  const aWon = isDone && match.winnerId === pA.id;
  const bWon = isDone && match.winnerId === pB.id;
  const isPhysical = tournament.mode === 'physical';

  const renderRosterMembers = (player) => {
    const members = Array.isArray(player.members) ? player.members : [];
    if (members.length === 0) return '';
    return `
      <div class="trn-h2h-members">
        ${members.map((m) => `<span>${escapeHtml(m.name)}${m.role ? ` (${escapeHtml(m.role)})` : ''}</span>`).join(' · ')}
      </div>
    `;
  };

  return `
    <div class="trn-h2h-stage">
      <div class="trn-h2h-arena-card">
        <div class="trn-h2h-competitor ${aWon ? 'is-winner' : isDone ? 'is-loser' : ''}">
          ${renderCenterLogo(pA.gamenetId, pA.gamenetName, 'lg')}
          <span class="trn-h2h-gamenet">${escapeHtml(pA.gamenetName)}</span>
          <h4 class="trn-h2h-player">${escapeHtml(pA.playerName)}</h4>
          ${!isPhysical && pA.onlineId ? `<span class="trn-h2h-online-id">${escapeHtml(pA.onlineId)}</span>` : ''}
          ${renderRosterMembers(pA)}
          ${aWon ? '<span class="trn-h2h-win-label">برنده دیدار رسمی (+۲۰ امتیاز)</span>' : ''}
        </div>

        <div class="trn-h2h-center-box">
          <span class="trn-h2h-round-tag">${isDone ? 'نتیجه نهایی ثبت‌شده' : 'دیدار رو‌در‌رو (Head-to-Head)'}</span>
          ${
            isDone
              ? `<div class="trn-h2h-scoreline trn-tabular">
                  <span class="${aWon ? 'is-win' : ''}">${fmt.num(match.scoreA)}</span>
                  <span class="trn-h2h-dash">–</span>
                  <span class="${bWon ? 'is-win' : ''}">${fmt.num(match.scoreB)}</span>
                </div>`
              : `<div class="trn-h2h-vs-circle">VS</div>`
          }
          <div class="trn-h2h-schedule-meta">
            <span>${escapeHtml(tournament.startDate || 'زمان توافق‌شده')}</span>
            <span>${isPhysical ? escapeHtml(tournament.venue) : `پلتفرم: ${escapeHtml(tournament.platform)}`}</span>
          </div>
          ${
            !isDone
              ? `<button type="button" class="btn mg-btn mg-btn-primary" data-trn-record-match="${escapeHtml(match.id)}">
                  ثبت نتیجه دیدار رو‌در‌رو
                </button>`
              : `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-jump-tab="leaderboard">
                  مشاهده تاثیر امتیاز در رتبه‌بندی گیم‌نت‌ها
                </button>`
          }
        </div>

        <div class="trn-h2h-competitor ${bWon ? 'is-winner' : isDone ? 'is-loser' : ''}">
          ${renderCenterLogo(pB.gamenetId, pB.gamenetName, 'lg')}
          <span class="trn-h2h-gamenet">${escapeHtml(pB.gamenetName)}</span>
          <h4 class="trn-h2h-player">${escapeHtml(pB.playerName)}</h4>
          ${!isPhysical && pB.onlineId ? `<span class="trn-h2h-online-id">${escapeHtml(pB.onlineId)}</span>` : ''}
          ${renderRosterMembers(pB)}
          ${bWon ? '<span class="trn-h2h-win-label">برنده دیدار رسمی (+۲۰ امتیاز)</span>' : ''}
        </div>
      </div>

      <div class="trn-h2h-summary-strip">
        <div>
          <span>جایزه توافق‌شده</span>
          <strong>${escapeHtml(tournament.prizeAgreement?.summary || tournament.prizes?.first || '—')}</strong>
        </div>
        <div>
          <span>فرمت رقابت</span>
          <strong>${escapeHtml(tournament.format)}</strong>
        </div>
        <div>
          <span>قوانین و یادداشت توافق</span>
          <strong>${escapeHtml(tournament.rules || 'قوانین استاندارد شبکه گیم‌نت‌ها')}</strong>
        </div>
      </div>
    </div>
  `;
}
