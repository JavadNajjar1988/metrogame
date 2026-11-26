/**
 * Inter-Gamenet Tournament Network Controller ("تورنومنت")
 * Wrapped in an IIFE with dynamic ESM import so it works identically whether loaded
 * as a classic <script> or via SPA injection.
 */
(function initTournamentsController() {
  const enginePromise = Promise.all([
    import('./tournaments-engine.mjs?v=20261125-1'),
    import('./dashboard-metrics.mjs?v=20261109-3'),
  ]);

  const state = {
    tournaments: [],
    customers: {},
    activeTab: 'directory',
    selectedId: null,
    filters: {
      status: 'all',
      game: 'all',
      query: '',
    },
    engine: null,
    metrics: null,
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatFaNum(num) {
    if (state.metrics?.toPersianDigits) {
      return state.metrics.toPersianDigits(String(num ?? 0));
    }
    return String(num ?? 0);
  }

  function formatToman(amount) {
    const val = Math.max(0, Math.round(Number(amount) || 0));
    if (val === 0) return 'رایگان';
    if (state.metrics?.formatToman) {
      return `${state.metrics.formatToman(val)} تومان`;
    }
    return `${val.toLocaleString('fa-IR')} تومان`;
  }

  function showToast(message) {
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

  async function postTournamentAction(payload) {
    const body = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        body.set(k, String(v));
      }
    });
    const res = await fetch('tournaments_api.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Accept: 'application/json',
      },
      body: body.toString(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || 'خطا در ارتباط با سرور تورنومنت.');
    }
    return data;
  }

  async function fetchFreshData() {
    const [trnRes, custRes] = await Promise.all([
      fetch(`tournaments.json?_=${Date.now()}`, { cache: 'no-store' }),
      fetch(`customer_data.json?_=${Date.now()}`, { cache: 'no-store' }).catch(() => null),
    ]);

    if (trnRes.ok) {
      const list = await trnRes.json();
      state.tournaments = Array.isArray(list) ? list : [];
    }
    if (custRes && custRes.ok) {
      const custObj = await custRes.json();
      state.customers = custObj && typeof custObj === 'object' ? custObj : {};
    }

    if (!state.selectedId || !state.tournaments.some((t) => t.id === state.selectedId)) {
      const liveFirst = state.tournaments.find((t) => t.status === 'live') || state.tournaments[0];
      state.selectedId = liveFirst ? liveFirst.id : null;
    }
  }

  function getSelectedTournament() {
    return state.tournaments.find((t) => t.id === state.selectedId) || state.tournaments[0] || null;
  }

  function populateSelectOptions() {
    const { TOURNAMENT_GAMES } = state.engine;
    const gameFilter = document.getElementById('trnGameFilter');
    if (gameFilter && gameFilter.options.length <= 1) {
      TOURNAMENT_GAMES.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        gameFilter.appendChild(opt);
      });
    }

    const createGame = document.getElementById('trnInputGame');
    if (createGame && createGame.options.length === 0) {
      TOURNAMENT_GAMES.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `${g.name} (${g.platform})`;
        createGame.appendChild(opt);
      });
      const customOpt = document.createElement('option');
      customOpt.value = 'custom';
      customOpt.textContent = 'سایر بازی‌های آنلاین (ورود دستی)...';
      createGame.appendChild(customOpt);
    }

    const customerPicker = document.getElementById('trnCustomerPicker');
    if (customerPicker) {
      const currentVal = customerPicker.value;
      customerPicker.innerHTML = '<option value="">وارد کردن دستی نام بازیکن / تیم...</option>';
      Object.entries(state.customers || {}).forEach(([id, cust]) => {
        if (!cust || !cust.customerName) return;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${cust.customerName} (کد ${formatFaNum(id)})`;
        customerPicker.appendChild(opt);
      });
      if (currentVal) customerPicker.value = currentVal;
    }
  }

  function renderKPIsAndHero() {
    const summary = state.engine.computeNetworkSummary(state.tournaments);

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('trnKpiActive', formatFaNum(summary.activeTournaments));
    setEl('trnKpiActiveSub', `از مجموع ${formatFaNum(summary.totalTournaments)} رویداد ثبت‌شده`);
    setEl('trnKpiGamenets', formatFaNum(summary.connectedGamenets));
    setEl('trnKpiPrize', summary.totalPrizePool > 0 ? formatToman(summary.totalPrizePool) : 'توافقی');
    setEl('trnKpiPlayers', formatFaNum(summary.totalPlayers));
    setEl('trnKpiPlayersSub', `${formatFaNum(summary.localPlayers)} شرکت‌کننده از سالن شما`);

    const navBadge = document.getElementById('navTournamentsBadge');
    if (navBadge) {
      navBadge.textContent = formatFaNum(summary.activeTournaments);
    }

    const featured =
      state.tournaments.find((t) => t.status === 'live') ||
      state.tournaments.find((t) => t.status === 'registration') ||
      state.tournaments[0];

    const heroCap = document.getElementById('trnHeroHighlight');
    if (heroCap) {
      if (!featured) {
        heroCap.innerHTML =
          '<span class="trn-hero-caption-meta">هنوز تورنومنتی ثبت نشده است — اولین رقابت شبکه‌ای را بسازید</span>';
      } else {
        const statusMeta = state.engine.getStatusMeta(featured.status);
        const count = Array.isArray(featured.participants) ? featured.participants.length : 0;
        heroCap.innerHTML = `
          <div class="trn-hero-caption-meta">
            <span>${escapeHtml(featured.gameName)}</span>
            <span aria-hidden="true">·</span>
            <span>میزبان: ${escapeHtml(featured.hostGamenetName)} (${escapeHtml(featured.hostCity)})</span>
            <span aria-hidden="true">·</span>
            <span class="trn-status-text is-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span>
          </div>
          <div class="trn-hero-caption-title">${escapeHtml(featured.title)}</div>
          <div class="trn-hero-caption-prize">
            <span>جایزه اول: ${escapeHtml(featured.prizes?.first || 'توافقی')}</span>
            <span aria-hidden="true">·</span>
            <span class="trn-tabular">${formatFaNum(count)} از ${formatFaNum(featured.maxSlots)} ظرفیت</span>
          </div>
        `;
      }
    }
  }

  function renderDirectoryCards() {
    const grid = document.getElementById('trnCardsGrid');
    if (!grid) return;

    const filtered = state.engine.filterTournaments(state.tournaments, state.filters);
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="trn-empty-state">
          <h3>تورنومنتی با این فیلتر پیدا نشد</h3>
          <p>فیلتر جستجو را تغییر دهید یا یک تورنومنت جدید برای شبکه گیم‌نت‌ها تعریف کنید.</p>
          <button type="button" class="btn mg-btn mg-btn-primary" data-trn-action="open-create">ساخت تورنومنت جدید</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map((t) => {
        const statusMeta = state.engine.getStatusMeta(t.status);
        const coverSrc = state.engine.getCoverImageForTournament(t);
        const participants = Array.isArray(t.participants) ? t.participants : [];
        const maxSlots = Math.max(2, Number(t.maxSlots) || 8);
        const pct = Math.min(100, Math.round((participants.length / maxSlots) * 100));
        const prizeTypeLabel = state.engine.getPrizeTypeLabel(t.prizeType);
        const scopeLabel = t.scope === 'local' ? 'اختصاصی سالن' : 'شبکه سراسری گیم‌نت‌ها';
        const isFull = participants.length >= maxSlots;
        const canEnroll = t.status !== 'completed' && !isFull;
        const champName = t.bracket?.champion?.playerName;

        return `
          <article class="trn-card" data-tournament-id="${escapeHtml(t.id)}">
            <div class="trn-card-media">
              <img
                src="${escapeHtml(coverSrc)}"
                alt="${escapeHtml(t.title)}"
                class="trn-card-img"
                loading="lazy"
                referrerpolicy="no-referrer"
              >
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
                <span>${escapeHtml(t.gameName)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(t.platform)}</span>
                <span aria-hidden="true">·</span>
                <span>${escapeHtml(t.format)}</span>
              </div>

              <h3 class="trn-card-title">${escapeHtml(t.title)}</h3>

              <div class="trn-card-host">
                میزبان: <strong>${escapeHtml(t.hostGamenetName)}</strong> (${escapeHtml(t.hostCity)})
                <span aria-hidden="true">·</span>
                ورودی: <strong class="trn-tabular">${formatToman(t.entryFee)}</strong>
              </div>

              <div class="trn-card-prize-row">
                <span class="trn-card-prize-label">${escapeHtml(prizeTypeLabel)}</span>
                <strong class="trn-card-prize-text">${escapeHtml(t.prizes?.first || formatToman(t.prizePoolValue))}</strong>
              </div>

              ${
                champName
                  ? `<div class="trn-card-champion">قهرمان نهایی: <strong>${escapeHtml(champName)}</strong> (${escapeHtml(t.bracket.champion.gamenetName)})</div>`
                  : ''
              }

              <div class="trn-capacity-wrap">
                <div class="trn-capacity-meta">
                  <span>ظرفیت ثبت‌نام</span>
                  <span class="trn-tabular">${formatFaNum(participants.length)} از ${formatFaNum(maxSlots)}</span>
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
                    ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm" data-trn-quick-enroll="${escapeHtml(t.id)}">اعزام بازیکن</button>`
                    : ''
                }
              </div>
            </div>
          </article>
        `;
      })
      .join('');
  }

  function renderBracketDetail() {
    const t = getSelectedTournament();
    const headerEl = document.getElementById('trnDetailHeader');
    const stageEl = document.getElementById('trnBracketStage');
    const prizeListEl = document.getElementById('trnPrizeList');
    const rosterEl = document.getElementById('trnRosterList');
    const slotsMetaEl = document.getElementById('trnSlotsMeta');
    const countMetaEl = document.getElementById('trnPlayersCountMeta');
    const genBtn = document.getElementById('trnGenerateBracketBtn');
    const enrollBtn = document.getElementById('trnEnrollSubmitBtn');

    if (!t) {
      if (headerEl) {
        headerEl.innerHTML = '<p class="trn-panel-sub">ابتدا یک تورنومنت بسازید یا از فهرست انتخاب کنید.</p>';
      }
      return;
    }

    const statusMeta = state.engine.getStatusMeta(t.status);
    const participants = Array.isArray(t.participants) ? t.participants : [];
    const selectorOptions = state.tournaments
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}" ${item.id === t.id ? 'selected' : ''}>${escapeHtml(item.title)} (${escapeHtml(item.gameName)})</option>`
      )
      .join('');

    if (headerEl) {
      headerEl.innerHTML = `
        <div class="trn-detail-top">
          <div class="trn-detail-info">
            <div class="trn-card-kicker">
              <span class="trn-status-text is-${escapeHtml(statusMeta.tone)}">${escapeHtml(statusMeta.label)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(t.gameName)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(t.platform)}</span>
              <span aria-hidden="true">·</span>
              <span>${escapeHtml(t.format)}</span>
              <span aria-hidden="true">·</span>
              <span>کد لابی: <strong class="trn-tabular">${escapeHtml(t.lobbyCode || 'GD-OPEN')}</strong></span>
            </div>
            <h2 class="trn-detail-title">${escapeHtml(t.title)}</h2>
            <p class="trn-detail-meta">
              میزبان: <strong>${escapeHtml(t.hostGamenetName)} (${escapeHtml(t.hostCity)})</strong>
              <span aria-hidden="true">·</span>
              زمان شروع: <strong>${escapeHtml(t.startDate)}</strong>
              <span aria-hidden="true">·</span>
              ورودی: <strong class="trn-tabular">${formatToman(t.entryFee)}</strong>
            </p>
            <p class="trn-detail-rules">${escapeHtml(t.rules || '')}</p>
          </div>
          <div class="trn-detail-switcher">
            <label for="trnDetailSelect" class="mg-label">تغییر تورنومنت فعال</label>
            <select id="trnDetailSelect" class="form-control mg-select">${selectorOptions}</select>
            ${
              t.hostGamenetId === state.engine.LOCAL_GAMENET_ID
                ? `<button type="button" class="btn mg-btn trn-ghost-btn mg-btn-sm trn-delete-btn" data-trn-delete="${escapeHtml(t.id)}">حذف این تورنومنت</button>`
                : ''
            }
          </div>
        </div>
      `;
    }

    if (prizeListEl) {
      prizeListEl.innerHTML = `
        <li class="trn-prize-item is-gold">
          <span class="trn-prize-rank">نفر اول</span>
          <strong class="trn-prize-desc">${escapeHtml(t.prizes?.first || 'تعیین نشده')}</strong>
        </li>
        <li class="trn-prize-item is-silver">
          <span class="trn-prize-rank">نفر دوم</span>
          <strong class="trn-prize-desc">${escapeHtml(t.prizes?.second || 'تعیین نشده')}</strong>
        </li>
        <li class="trn-prize-item is-bronze">
          <span class="trn-prize-rank">نفر سوم</span>
          <strong class="trn-prize-desc">${escapeHtml(t.prizes?.third || 'تعیین نشده')}</strong>
        </li>
      `;
    }

    if (slotsMetaEl) {
      slotsMetaEl.textContent = `${formatFaNum(participants.length)} از ${formatFaNum(t.maxSlots)}`;
    }
    if (countMetaEl) {
      countMetaEl.textContent = `${formatFaNum(participants.length)} شرکت‌کننده`;
    }

    if (enrollBtn) {
      const full = participants.length >= Number(t.maxSlots || 8) || t.status === 'completed';
      enrollBtn.disabled = full;
      enrollBtn.textContent =
        t.status === 'completed'
          ? 'تورنومنت به پایان رسیده است'
          : full
            ? 'ظرفیت تکمیل شده است'
            : 'ثبت‌نام بازیکن در تورنومنت';
    }

    if (genBtn) {
      genBtn.disabled = participants.length < 2 || t.status === 'completed';
      genBtn.textContent = t.bracket ? 'قرعه‌کشی مجدد جدول' : 'قرعه‌کشی و ساخت جدول';
    }

    if (rosterEl) {
      if (participants.length === 0) {
        rosterEl.innerHTML = '<li class="trn-roster-empty">هنوز بازیکنی ثبت‌نام نکرده است. اولین بازیکن را از فرم بالا اعزام کنید.</li>';
      } else {
        rosterEl.innerHTML = participants
          .map((p, idx) => {
            const isLocal = p.gamenetId === state.engine.LOCAL_GAMENET_ID;
            return `
              <li class="trn-roster-item ${isLocal ? 'is-local' : ''}">
                <div class="trn-roster-main">
                  <span class="trn-roster-idx trn-tabular">${formatFaNum(idx + 1)}</span>
                  <div>
                    <strong class="trn-roster-name">${escapeHtml(p.playerName)}</strong>
                    <div class="trn-roster-meta">
                      <span>${escapeHtml(p.onlineId)}</span>
                      <span aria-hidden="true">·</span>
                      <span>${escapeHtml(p.gamenetName)}${isLocal ? ' (سالن شما)' : ''}</span>
                    </div>
                  </div>
                </div>
                ${
                  t.status !== 'completed'
                    ? `<button type="button" class="trn-remove-player-btn" data-trn-remove-player="${escapeHtml(p.id)}" title="حذف از فهرست" aria-label="حذف ${escapeHtml(p.playerName)}">&times;</button>`
                    : ''
                }
              </li>
            `;
          })
          .join('');
      }
    }

    if (stageEl) {
      if (!t.bracket || !Array.isArray(t.bracket.rounds)) {
        stageEl.innerHTML = `
          <div class="trn-bracket-empty">
            <h4>جدول حذفی هنوز تولید نشده است</h4>
            <p>پس از ثبت‌نام حداقل ۲ شرکت‌کننده از گیم‌نت‌های شبکه، دکمه «قرعه‌کشی و ساخت جدول» را بزنید تا رقابت‌ها به‌صورت خودکار چیده شوند.</p>
          </div>
        `;
      } else {
        const champ = t.bracket.champion;
        const champBanner = champ
          ? `
            <div class="trn-champion-banner">
              <span class="trn-champion-kicker">قهرمان رسمی تورنومنت</span>
              <strong class="trn-champion-name">${escapeHtml(champ.playerName)}</strong>
              <span class="trn-champion-meta">${escapeHtml(champ.onlineId)} · نماینده گیم‌نت ${escapeHtml(champ.gamenetName)}</span>
            </div>
          `
          : '';

        const roundsHtml = t.bracket.rounds
          .map((round) => {
            const matchesHtml = round.matches
              .map((m) => {
                const aWin = m.winnerId && m.playerA && m.winnerId === m.playerA.id;
                const bWin = m.winnerId && m.playerB && m.winnerId === m.playerB.id;
                const canRecord = Boolean(m.playerA && m.playerB && m.status !== 'done');
                const actionLabel = m.status === 'done' ? 'ثبت شد' : m.status === 'bye' ? 'صعود خودکار' : canRecord ? 'ثبت نتیجه' : 'در انتظار حریف';

                return `
                  <div class="trn-match-card ${canRecord ? 'is-actionable' : ''} ${m.status === 'done' ? 'is-done' : ''}">
                    <div class="trn-match-head">
                      <span class="trn-match-id">${escapeHtml(round.name)} — بازی ${formatFaNum(m.matchIndex + 1)}</span>
                      ${
                        canRecord
                          ? `<button type="button" class="trn-record-btn" data-trn-record-match="${escapeHtml(m.id)}">ثبت نتیجه</button>`
                          : `<span class="trn-match-state">${escapeHtml(actionLabel)}</span>`
                      }
                    </div>
                    <div class="trn-match-slot ${aWin ? 'is-winner' : ''}">
                      <div class="trn-slot-player">
                        <strong>${escapeHtml(m.playerA ? m.playerA.playerName : '— در انتظار —')}</strong>
                        <span>${escapeHtml(m.playerA ? m.playerA.gamenetName : '')}</span>
                      </div>
                      <span class="trn-slot-score trn-tabular">${m.scoreA !== null && m.scoreA !== undefined ? formatFaNum(m.scoreA) : '–'}</span>
                    </div>
                    <div class="trn-match-slot ${bWin ? 'is-winner' : ''}">
                      <div class="trn-slot-player">
                        <strong>${escapeHtml(m.playerB ? m.playerB.playerName : m.status === 'bye' ? 'استراحت (Bye)' : '— در انتظار —')}</strong>
                        <span>${escapeHtml(m.playerB ? m.playerB.gamenetName : '')}</span>
                      </div>
                      <span class="trn-slot-score trn-tabular">${m.scoreB !== null && m.scoreB !== undefined ? formatFaNum(m.scoreB) : '–'}</span>
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

        stageEl.innerHTML = `${champBanner}<div class="trn-bracket-grid">${roundsHtml}</div>`;
      }
    }
  }

  function renderNetworkLeaderboard() {
    const tbody = document.getElementById('trnNetworkTableBody');
    if (!tbody) return;
    const summary = state.engine.computeNetworkSummary(state.tournaments);

    tbody.innerHTML = summary.partnerLeaderboard
      .map((gn, index) => {
        return `
          <tr class="${gn.isLocal ? 'trn-local-row' : ''}">
            <td class="trn-tabular">${formatFaNum(index + 1)}</td>
            <td>
              <strong>${escapeHtml(gn.name)}</strong>
              ${gn.isLocal ? '<span class="trn-local-tag">سالن شما</span>' : ''}
            </td>
            <td>${escapeHtml(gn.city)}</td>
            <td class="trn-tabular">${formatFaNum(gn.hostedCount)}</td>
            <td class="trn-tabular">${formatFaNum(gn.playersSent)}</td>
            <td class="trn-tabular">${formatFaNum(gn.championships)}</td>
            <td class="trn-tabular">${gn.prizeOffered > 0 ? formatToman(gn.prizeOffered) : '—'}</td>
          </tr>
        `;
      })
      .join('');
  }

  function switchTab(tabKey) {
    state.activeTab = tabKey;
    document.querySelectorAll('.trn-tab-btn[data-trn-tab]').forEach((btn) => {
      const isActive = btn.getAttribute('data-trn-tab') === tabKey;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.trn-tab-pane[data-trn-pane]').forEach((pane) => {
      const isActive = pane.getAttribute('data-trn-pane') === tabKey;
      pane.classList.toggle('is-active', isActive);
      if (isActive) {
        pane.removeAttribute('hidden');
      } else {
        pane.setAttribute('hidden', '');
      }
    });
    const filterBar = document.getElementById('trnDirectoryFilters');
    if (filterBar) {
      filterBar.style.display = tabKey === 'directory' ? '' : 'none';
    }
  }

  function openCreateModal() {
    const modal = document.getElementById('trnCreateModal');
    const errEl = document.getElementById('trnCreateError');
    if (errEl) errEl.hidden = true;
    if (modal) modal.removeAttribute('hidden');
    const titleInput = document.getElementById('trnInputTitle');
    if (titleInput) titleInput.focus();
  }

  function closeModal(type) {
    const modalId = type === 'match' ? 'trnMatchModal' : 'trnCreateModal';
    const modal = document.getElementById(modalId);
    if (modal) modal.setAttribute('hidden', '');
  }

  function openMatchModal(matchId) {
    const t = getSelectedTournament();
    if (!t || !t.bracket) return;
    let found = null;
    for (const r of t.bracket.rounds || []) {
      const m = r.matches.find((item) => item.id === matchId);
      if (m) {
        found = m;
        break;
      }
    }
    if (!found || !found.playerA || !found.playerB) return;

    document.getElementById('trnMatchIdInput').value = found.id;
    document.getElementById('trnScoreALabel').textContent = `امتیاز ${found.playerA.playerName}`;
    document.getElementById('trnScoreBLabel').textContent = `امتیاز ${found.playerB.playerName}`;
    document.getElementById('trnWinnerAName').textContent = `${found.playerA.playerName} (${found.playerA.gamenetName})`;
    document.getElementById('trnWinnerBName').textContent = `${found.playerB.playerName} (${found.playerB.gamenetName})`;
    document.getElementById('trnScoreA').value = found.scoreA ?? 2;
    document.getElementById('trnScoreB').value = found.scoreB ?? 1;
    document.getElementById('trnWinnerA').checked = true;
    const errEl = document.getElementById('trnMatchError');
    if (errEl) errEl.hidden = true;

    const modal = document.getElementById('trnMatchModal');
    if (modal) modal.removeAttribute('hidden');
  }

  function renderAll() {
    populateSelectOptions();
    renderKPIsAndHero();
    renderDirectoryCards();
    renderBracketDetail();
    renderNetworkLeaderboard();
  }

  function bindEventsOnce() {
    const root = document.getElementById('mgTournamentsRoot');
    if (!root || root.dataset.trnBound === '1') return;
    root.dataset.trnBound = '1';

    const container = root.parentElement || document;

    container.addEventListener('click', async (e) => {
      const tabBtn = e.target.closest('.trn-tab-btn[data-trn-tab]');
      if (tabBtn) {
        switchTab(tabBtn.getAttribute('data-trn-tab'));
        return;
      }

      const statusBtn = e.target.closest('.trn-seg-btn[data-trn-status]');
      if (statusBtn) {
        state.filters.status = statusBtn.getAttribute('data-trn-status') || 'all';
        document.querySelectorAll('.trn-seg-btn[data-trn-status]').forEach((b) => {
          b.classList.toggle('is-active', b === statusBtn);
        });
        renderDirectoryCards();
        return;
      }

      if (e.target.closest('#trnOpenCreateBtn') || e.target.closest('[data-trn-action="open-create"]')) {
        openCreateModal();
        return;
      }

      if (e.target.closest('#trnHeroJumpBracketBtn')) {
        switchTab('bracket');
        renderBracketDetail();
        return;
      }

      const closeBtn = e.target.closest('[data-trn-close]');
      if (closeBtn) {
        closeModal(closeBtn.getAttribute('data-trn-close'));
        return;
      }

      if (e.target.classList && e.target.classList.contains('trn-modal-backdrop')) {
        e.target.setAttribute('hidden', '');
        return;
      }

      const detailBtn = e.target.closest('[data-trn-open-detail]');
      if (detailBtn) {
        state.selectedId = detailBtn.getAttribute('data-trn-open-detail');
        switchTab('bracket');
        renderBracketDetail();
        return;
      }

      const quickEnrollBtn = e.target.closest('[data-trn-quick-enroll]');
      if (quickEnrollBtn) {
        state.selectedId = quickEnrollBtn.getAttribute('data-trn-quick-enroll');
        switchTab('bracket');
        renderBracketDetail();
        const nameInput = document.getElementById('trnPlayerName');
        if (nameInput) nameInput.focus();
        return;
      }

      const recordMatchBtn = e.target.closest('[data-trn-record-match]');
      if (recordMatchBtn) {
        openMatchModal(recordMatchBtn.getAttribute('data-trn-record-match'));
        return;
      }

      const removePlayerBtn = e.target.closest('[data-trn-remove-player]');
      if (removePlayerBtn) {
        const t = getSelectedTournament();
        if (!t) return;
        const pid = removePlayerBtn.getAttribute('data-trn-remove-player');
        try {
          const resp = await postTournamentAction({
            action: 'remove_player',
            tournamentId: t.id,
            participantId: pid,
          });
          state.tournaments = resp.tournaments || state.tournaments;
          renderAll();
          showToast('شرکت‌کننده از فهرست تورنومنت حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const genBracketBtn = e.target.closest('#trnGenerateBracketBtn');
      if (genBracketBtn) {
        const t = getSelectedTournament();
        if (!t) return;
        try {
          const resp = await postTournamentAction({
            action: 'generate_bracket',
            tournamentId: t.id,
          });
          state.tournaments = resp.tournaments || state.tournaments;
          renderAll();
          showToast('جدول حذفی با موفقیت قرعه‌کشی و فعال شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const deleteBtn = e.target.closest('[data-trn-delete]');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-trn-delete');
        try {
          const resp = await postTournamentAction({
            action: 'delete',
            tournamentId: id,
          });
          state.tournaments = resp.tournaments || [];
          state.selectedId = state.tournaments[0]?.id || null;
          switchTab('directory');
          renderAll();
          showToast('تورنومنت با موفقیت حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
      }
    });

    container.addEventListener('input', (e) => {
      if (e.target.id === 'trnSearchInput') {
        state.filters.query = e.target.value || '';
        renderDirectoryCards();
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.id === 'trnGameFilter') {
        state.filters.game = e.target.value || 'all';
        renderDirectoryCards();
        return;
      }
      if (e.target.id === 'trnDetailSelect') {
        state.selectedId = e.target.value;
        renderBracketDetail();
        return;
      }
      if (e.target.id === 'trnCustomerPicker') {
        const cid = e.target.value;
        const cust = cid && state.customers ? state.customers[cid] : null;
        if (cust) {
          const nameInput = document.getElementById('trnPlayerName');
          const idInput = document.getElementById('trnOnlineId');
          if (nameInput) nameInput.value = cust.customerName || '';
          if (idInput && !idInput.value.trim()) {
            idInput.value = `GD_${cid}`;
          }
        }
        return;
      }
      if (e.target.id === 'trnInputGame') {
        const val = e.target.value;
        const customWrap = document.getElementById('trnCustomGameWrap');
        if (customWrap) customWrap.hidden = val !== 'custom';
        const game = state.engine.TOURNAMENT_GAMES.find((g) => g.id === val);
        if (game) {
          const platEl = document.getElementById('trnInputPlatform');
          const fmtEl = document.getElementById('trnInputFormat');
          if (platEl) platEl.value = game.platform;
          if (fmtEl) fmtEl.value = game.defaultFormat;
        }
      }
    });

    container.addEventListener('submit', async (e) => {
      if (e.target.id === 'trnCreateForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnCreateError');
        if (errEl) errEl.hidden = true;
        const formData = new FormData(e.target);
        const payload = { action: 'create' };
        formData.forEach((v, k) => {
          payload[k] = v;
        });

        const check = state.engine.sanitizeTournamentInput(payload);
        if (check.error) {
          if (errEl) {
            errEl.textContent = check.error;
            errEl.hidden = false;
          }
          return;
        }

        try {
          const resp = await postTournamentAction(payload);
          state.tournaments = resp.tournaments || state.tournaments;
          if (resp.tournament?.id) {
            state.selectedId = resp.tournament.id;
          }
          e.target.reset();
          closeModal('create');
          renderAll();
          showToast('تورنومنت جدید با موفقیت در شبکه گیم‌نت‌ها منتشر شد.');
        } catch (err) {
          if (errEl) {
            errEl.textContent = err.message;
            errEl.hidden = false;
          }
        }
        return;
      }

      if (e.target.id === 'trnEnrollForm') {
        e.preventDefault();
        const t = getSelectedTournament();
        if (!t) return;
        const errEl = document.getElementById('trnEnrollError');
        if (errEl) errEl.hidden = true;

        const playerName = document.getElementById('trnPlayerName')?.value || '';
        const onlineId = document.getElementById('trnOnlineId')?.value || '';
        const customerId = document.getElementById('trnCustomerPicker')?.value || '';

        const check = state.engine.validateParticipantInput({ playerName, onlineId }, t);
        if (check.error) {
          if (errEl) {
            errEl.textContent = check.error;
            errEl.hidden = false;
          }
          return;
        }

        try {
          const resp = await postTournamentAction({
            action: 'register_player',
            tournamentId: t.id,
            playerName,
            onlineId,
            customerId,
            gamenetId: state.engine.LOCAL_GAMENET_ID,
            gamenetName: state.engine.LOCAL_GAMENET_NAME,
            city: state.engine.LOCAL_GAMENET_CITY,
          });
          state.tournaments = resp.tournaments || state.tournaments;
          e.target.reset();
          renderAll();
          showToast('بازیکن با موفقیت به نمایندگی از سالن شما ثبت‌نام شد.');
        } catch (err) {
          if (errEl) {
            errEl.textContent = err.message;
            errEl.hidden = false;
          }
        }
        return;
      }

      if (e.target.id === 'trnMatchForm') {
        e.preventDefault();
        const t = getSelectedTournament();
        if (!t) return;
        const errEl = document.getElementById('trnMatchError');
        if (errEl) errEl.hidden = true;

        const matchId = document.getElementById('trnMatchIdInput')?.value || '';
        const scoreA = document.getElementById('trnScoreA')?.value || '0';
        const scoreB = document.getElementById('trnScoreB')?.value || '0';
        const winnerSide = document.querySelector('input[name="winnerSide"]:checked')?.value || 'A';

        try {
          const resp = await postTournamentAction({
            action: 'record_result',
            tournamentId: t.id,
            matchId,
            winnerSide,
            scoreA,
            scoreB,
          });
          state.tournaments = resp.tournaments || state.tournaments;
          closeModal('match');
          renderAll();
          const completed = resp.tournament?.status === 'completed';
          showToast(completed ? 'قهرمان نهایی تورنومنت ثبت شد!' : 'نتیجه ثبت شد و برنده به دور بعد صعود کرد.');
        } catch (err) {
          if (errEl) {
            errEl.textContent = err.message;
            errEl.hidden = false;
          }
        }
      }
    });
  }

  async function renderTournamentsPage() {
    if (!document.getElementById('mgTournamentsRoot')) return;
    const [engine, metrics] = await enginePromise;
    state.engine = engine;
    state.metrics = metrics;
    bindEventsOnce();
    await fetchFreshData();
    switchTab(state.activeTab || 'directory');
    renderAll();
  }

  window.renderTournamentsPage = renderTournamentsPage;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      renderTournamentsPage();
    });
  } else {
    renderTournamentsPage();
  }
})();
