/**
 * Inter-Gamenet Competitive Network Controller ("تورنومنت")
 * Wrapped in an IIFE with dynamic ESM imports so it executes cleanly whether
 * loaded via direct page navigation or SPA injection.
 */
(function initTournamentsController() {
  const modulesPromise = Promise.all([
    import('./tournaments-engine.mjs?v=20261126-2'),
    import('./tournaments-renderers.mjs?v=20261126-2'),
    import('./tournaments-competition.mjs?v=20261126-2'),
    import('./tournaments-competition-renderers.mjs?v=20261126-2'),
    import('./dashboard-metrics.mjs?v=20261109-3'),
  ]);

  const state = {
    tournaments: [],
    teams: [],
    challenges: [],
    directChallenges: [],
    customers: {},
    activeTab: 'overview',
    selectedId: null,
    filters: {
      category: 'all',
      challengeStatus: 'all',
      directBox: 'all',
      lbTimeframe: 'all_time',
      lbGame: 'all',
      activeView: 'active',
      query: '',
    },
    engine: null,
    ui: null,
    comp: null,
    compUi: null,
    metrics: null,
  };

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

  function getFmt() {
    return { num: formatFaNum, toman: formatToman };
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
    }, 3400);
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
    if (Array.isArray(data.tournaments)) {
      state.tournaments = data.tournaments.map((t) => state.engine.normalizeTournamentRecord(t));
    }
    if (Array.isArray(data.teams)) state.teams = data.teams;
    if (Array.isArray(data.challenges)) state.challenges = data.challenges;
    if (Array.isArray(data.directChallenges)) state.directChallenges = data.directChallenges;
    return data;
  }

  async function fetchFreshData() {
    const ts = Date.now();
    const [trnRes, teamsRes, chalRes, directRes, custRes] = await Promise.all([
      fetch(`tournaments.json?_=${ts}`, { cache: 'no-store' }),
      fetch(`tournament_teams.json?_=${ts}`, { cache: 'no-store' }).catch(() => null),
      fetch(`tournament_challenges.json?_=${ts}`, { cache: 'no-store' }).catch(() => null),
      fetch(`tournament_direct_challenges.json?_=${ts}`, { cache: 'no-store' }).catch(() => null),
      fetch(`customer_data.json?_=${ts}`, { cache: 'no-store' }).catch(() => null),
    ]);

    if (trnRes.ok) {
      const list = await trnRes.json();
      state.tournaments = Array.isArray(list)
        ? list.map((t) => state.engine.normalizeTournamentRecord(t))
        : [];
    }
    if (teamsRes && teamsRes.ok) {
      const tList = await teamsRes.json();
      state.teams = Array.isArray(tList) ? tList : [];
    }
    if (chalRes && chalRes.ok) {
      const cList = await chalRes.json();
      state.challenges = Array.isArray(cList) ? cList : [];
    }
    if (directRes && directRes.ok) {
      const dList = await directRes.json();
      state.directChallenges = Array.isArray(dList) ? dList : [];
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

  function populateActivitySelect(selectEl, categoryId, includeCustom = false) {
    if (!selectEl || !state.engine) return;
    const prev = selectEl.value;
    const list = state.engine.getActivitiesByCategory(categoryId);
    selectEl.innerHTML = '';
    list.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent =
        g.category === 'video_games' ? `${g.name} (${g.platform})` : g.name;
      selectEl.appendChild(opt);
    });
    if (includeCustom) {
      const customOpt = document.createElement('option');
      customOpt.value = 'custom';
      customOpt.textContent = 'سایر بازی‌ها / رشته‌ها (ورود دستی)...';
      selectEl.appendChild(customOpt);
    }
    if (prev && Array.from(selectEl.options).some((o) => o.value === prev)) {
      selectEl.value = prev;
    }
  }

  function renderCustomerCheckboxes(containerId, checkboxName) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    const entries = Object.entries(state.customers || {}).filter(([, c]) => c && c.customerName);
    if (entries.length === 0) {
      wrap.innerHTML = '<span class="trn-muted-meta">مشتری ثبت‌نام‌شده‌ای در باشگاه یافت نشد — نام اعضا را دستی وارد کنید.</span>';
      return;
    }
    wrap.innerHTML = entries
      .map(
        ([id, cust]) => `
          <label class="trn-cust-check-pill">
            <input type="checkbox" name="${state.ui.escapeHtml(checkboxName)}" value="${state.ui.escapeHtml(id)}" data-customer-name="${state.ui.escapeHtml(cust.customerName)}">
            <span>${state.ui.escapeHtml(cust.customerName)}</span>
            <small class="trn-tabular">#${formatFaNum(id)}</small>
          </label>
        `
      )
      .join('');
  }

  function syncCreateModalMode() {
    const cat = document.getElementById('trnInputCategory')?.value || 'video_games';
    const scope = document.getElementById('trnInputScope')?.value || 'internal';
    const isPhysical = state.engine.isPhysicalCategory(cat);

    populateActivitySelect(document.getElementById('trnInputGame'), cat, true);

    const platWrap = document.getElementById('trnCreatePlatformWrap');
    const venueWrap = document.getElementById('trnCreateVenueWrap');
    const custWrap = document.getElementById('trnInternalCustomerPickerWrap');
    const customWrap = document.getElementById('trnCustomGameWrap');

    if (platWrap) platWrap.hidden = isPhysical;
    if (venueWrap) venueWrap.hidden = !isPhysical;
    if (custWrap) custWrap.hidden = scope !== 'internal';
    if (customWrap) {
      customWrap.hidden = document.getElementById('trnInputGame')?.value !== 'custom';
    }
  }

  function syncTeamModalMode() {
    const cat = document.getElementById('trnTeamCategory')?.value || 'video_games';
    const isPhysical = state.engine.isPhysicalCategory(cat);
    populateActivitySelect(document.getElementById('trnTeamGame'), cat, false);
    const tagWrap = document.getElementById('trnTeamOnlineTagWrap');
    if (tagWrap) tagWrap.hidden = isPhysical;
  }

  function syncChallengeModalMode() {
    const cat = document.getElementById('trnChCategory')?.value || 'video_games';
    const isPhysical = state.engine.isPhysicalCategory(cat);
    populateActivitySelect(document.getElementById('trnChGame'), cat, false);
    const platWrap = document.getElementById('trnChPlatformWrap');
    const venueWrap = document.getElementById('trnChVenueWrap');
    if (platWrap) platWrap.hidden = isPhysical;
    if (venueWrap) venueWrap.hidden = !isPhysical;

    const scope = document.getElementById('trnChScope')?.value || 'two_center';
    const maxSel = document.getElementById('trnChMaxCenters');
    if (maxSel && scope === 'two_center') {
      maxSel.value = '2';
    } else if (maxSel && scope === 'multi_center' && maxSel.value === '2') {
      maxSel.value = '4';
    }
  }

  function populateDynamicPickers() {
    // 1. Customer picker in Bracket quick-enroll sidebar
    const customerPicker = document.getElementById('trnCustomerPicker');
    if (customerPicker) {
      const prev = customerPicker.value;
      customerPicker.innerHTML = '<option value="">وارد کردن دستی نام بازیکن / تیم...</option>';
      Object.entries(state.customers || {}).forEach(([id, cust]) => {
        if (!cust || !cust.customerName) return;
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${cust.customerName} (کد ${formatFaNum(id)})`;
        customerPicker.appendChild(opt);
      });
      if (prev) customerPicker.value = prev;
    }

    // 2. Local representative team pickers (Bracket sidebar, Challenge modal, Accept modal)
    const localTeams = state.teams.filter((tm) => tm.gamenetId === state.engine.LOCAL_GAMENET_ID);
    const fillTeamSelect = (elId, placeholder) => {
      const sel = document.getElementById(elId);
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = `<option value="">${placeholder}</option>`;
      localTeams.forEach((tm) => {
        const opt = document.createElement('option');
        opt.value = tm.id;
        opt.textContent = `${tm.name} — ${tm.gameName} (${formatFaNum((tm.members || []).length)} نفر)`;
        sel.appendChild(opt);
      });
      if (prev && Array.from(sel.options).some((o) => o.value === prev)) {
        sel.value = prev;
      }
    };

    fillTeamSelect('trnTeamQuickPicker', 'انتخاب تیم نماینده (اختیاری)...');
    fillTeamSelect('trnChTeamSelect', 'تعریف دستی تیم یا بازیکن نماینده...');
    fillTeamSelect('trnAcceptTeamPicker', 'وارد کردن دستی نام تیم یا بازیکن...');
    fillTeamSelect('trnDcTeamPicker', 'انتخاب دستی یا از باشگاه مشتریان...');
    fillTeamSelect('trnDcAcceptTeamPicker', 'ورود دستی ترکیب...');

    // 3. Target Gaming Center picker for Direct Challenges
    const dcTargetSel = document.getElementById('trnDcTargetCenter');
    if (dcTargetSel && state.comp) {
      const prev = dcTargetSel.value;
      dcTargetSel.innerHTML = '';
      state.comp.GAMING_CENTER_DIRECTORY.filter((c) => c.id !== state.engine.LOCAL_GAMENET_ID).forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.city})`;
        dcTargetSel.appendChild(opt);
      });
      if (prev && Array.from(dcTargetSel.options).some((o) => o.value === prev)) {
        dcTargetSel.value = prev;
      }
    }

    // 4. Customer checkbox grids inside modals
    renderCustomerCheckboxes('trnInternalCustomerList', 'internalCustomerIds');
    renderCustomerCheckboxes('trnTeamCustomerChecks', 'teamCustomerIds');
    renderCustomerCheckboxes('trnDcCustomerChecklist', 'dcCustomerIds');
  }

  function computeOverallBoard(category = 'all', gameId = 'all', timeframe = 'all_time') {
    if (!state.comp) return { rows: [], leader: null, totalMatchesCounted: 0 };
    return state.comp.computeGamingCenterLeaderboard(
      state.tournaments,
      state.directChallenges,
      {
        category,
        game: gameId,
        timeframe,
      }
    );
  }

  function renderKPIsAndHero() {
    const summary = state.engine.computeNetworkSummary(state.tournaments, state.challenges, state.teams);
    const overallBoard = computeOverallBoard('all', 'all', 'all_time');
    const localRank = overallBoard.rows.find((r) => r.isLocal) || overallBoard.rows[0];
    const pendingDirect = state.directChallenges.filter(
      (dc) => dc.status === 'pending' || dc.status === 'awaiting_agreement'
    ).length;

    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    if (localRank) {
      setEl('trnKpiRank', `#${formatFaNum(localRank.rank)}`);
      setEl(
        'trnKpiRankSub',
        `${formatFaNum(localRank.points)} امتیاز رسمی · ${formatFaNum(localRank.winRate)}٪ نرخ برد`
      );
    }

    setEl('trnKpiChallenges', formatFaNum(summary.openChallenges + pendingDirect));
    setEl(
      'trnKpiChallengesSub',
      `${formatFaNum(pendingDirect)} چالش مستقیم فعال · ${formatFaNum(summary.openChallenges)} چالش باز`
    );
    setEl('trnKpiActive', formatFaNum(summary.activeTournaments));
    setEl(
      'trnKpiActiveSub',
      `${formatFaNum(summary.internalCount)} داخلی · ${formatFaNum(summary.completedCount)} پایان‌یافته`
    );
    setEl('trnKpiTeams', formatFaNum(summary.localTeamsCount));
    setEl('trnKpiTeamsSub', `${formatFaNum(summary.localPlayers)} اعزام ثبت‌شده از سالن شما`);

    const navBadge = document.getElementById('navTournamentsBadge');
    if (navBadge) {
      navBadge.textContent = formatFaNum(summary.activeTournaments);
    }

    // Hero highlight card
    const featured =
      state.tournaments.find((t) => t.status === 'live' && t.scope === 'inter_center') ||
      state.tournaments.find((t) => t.status === 'live') ||
      state.tournaments[0];
    const heroCap = document.getElementById('trnHeroHighlight');
    if (heroCap) {
      if (!featured) {
        heroCap.innerHTML =
          '<span class="trn-hero-caption-meta">هنوز رویدادی ثبت نشده است — اولین چالش یا مسابقه را بسازید</span>';
      } else {
        const statusMeta = state.engine.getStatusMeta(featured.status);
        const catMeta = state.engine.getCategoryMeta(featured.category);
        const count = Array.isArray(featured.participants) ? featured.participants.length : 0;
        heroCap.innerHTML = `
          <div class="trn-hero-caption-meta">
            <span>${state.ui.escapeHtml(catMeta.label)}</span>
            <span aria-hidden="true">·</span>
            <span>${state.ui.escapeHtml(featured.gameName)}</span>
            <span aria-hidden="true">·</span>
            <span class="trn-status-text is-${state.ui.escapeHtml(statusMeta.tone)}">${state.ui.escapeHtml(statusMeta.label)}</span>
          </div>
          <div class="trn-hero-caption-title">${state.ui.escapeHtml(featured.title)}</div>
          <div class="trn-hero-caption-prize">
            <span>جایزه: ${state.ui.escapeHtml(featured.prizeAgreement?.summary || featured.prizes?.first || 'توافقی')}</span>
            <span aria-hidden="true">·</span>
            <span class="trn-tabular">${formatFaNum(count)} از ${formatFaNum(featured.maxSlots)} شرکت‌کننده</span>
          </div>
        `;
      }
    }
  }

  function renderCategoryBar() {
    const el = document.getElementById('trnCategorySelector');
    if (!el) return;

    const allItems = [
      ...state.tournaments,
      ...state.challenges.filter((c) => c.status !== 'formed'),
      ...state.directChallenges.filter((dc) => dc.status !== 'rejected'),
    ];
    const counts = {
      all: allItems.length,
      video_games: allItems.filter((x) => x.category === 'video_games').length,
      foosball: allItems.filter((x) => x.category === 'foosball').length,
      billiards: allItems.filter((x) => x.category === 'billiards').length,
    };

    el.innerHTML = state.ui.renderCategorySelectorBar(state.filters.category, counts, getFmt());
  }

  function renderOverview() {
    const el = document.getElementById('trnOverviewRoot');
    if (!el) return;
    const cat = state.filters.category;
    const filteredTournaments = state.engine.filterTournaments(state.tournaments, { category: cat });
    const filteredChallenges = state.engine.filterChallenges(state.challenges, { category: cat });
    const filteredDirect = state.comp.filterDirectChallenges(state.directChallenges, { category: cat });
    const filteredTeams =
      cat === 'all' ? state.teams : state.teams.filter((tm) => tm.category === cat);
    const summary = state.engine.computeNetworkSummary(state.tournaments, state.challenges, state.teams);
    const leaderboard = computeOverallBoard(cat, 'all', 'all_time');

    el.innerHTML = state.ui.renderOverviewDashboard(
      {
        tournaments: filteredTournaments,
        challenges: filteredChallenges,
        directChallenges: filteredDirect,
        teams: filteredTeams,
        summary,
        leaderboard,
      },
      getFmt()
    );
  }

  function renderChallenges() {
    const el = document.getElementById('trnChallengesList');
    if (!el) return;
    const list = state.engine.filterChallenges(state.challenges, {
      category: state.filters.category,
      status: state.filters.challengeStatus,
      query: state.filters.query,
    });

    if (list.length === 0) {
      el.innerHTML = `
        <div class="trn-empty-state">
          <h3>چالشی با این فیلتر پیدا نشد</h3>
          <p>فیلتر دسته‌بندی یا جستجو را تغییر دهید یا یک چالش عمومی جدید از طرف Game District منتشر کنید.</p>
          <button type="button" class="btn mg-btn mg-btn-primary" data-trn-action="open-challenge">انتشار چالش جدید</button>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map((ch) => state.ui.renderChallengeCard(ch, getFmt())).join('');
  }

  function renderTeams() {
    const el = document.getElementById('trnTeamsGrid');
    if (!el) return;
    const q = state.filters.query.trim().toLowerCase();
    const list = state.teams.filter((tm) => {
      if (state.filters.category !== 'all' && tm.category !== state.filters.category) return false;
      if (q) {
        const hay = [tm.name, tm.gameName, tm.notes, ...(tm.members || []).map((m) => m.name)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (list.length === 0) {
      el.innerHTML = `
        <div class="trn-empty-state">
          <h3>تیم نماینده‌ای در این دسته ثبت نشده است</h3>
          <p>از مشتریان ثبت‌نام‌شده باشگاه، تیم یا بازیکن نماینده بسازید تا در چالش‌های شبکه شرکت کنید.</p>
          <button type="button" class="btn mg-btn mg-btn-primary" data-trn-action="open-create-team">ساخت تیم نماینده</button>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map((tm) => state.ui.renderTeamCard(tm, getFmt())).join('');
  }

  function renderDirectChallenges() {
    const el = document.getElementById('trnDirectChallengesList');
    if (!el || !state.comp || !state.compUi) return;

    document.querySelectorAll('[data-trn-dc-box]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-trn-dc-box') === state.filters.directBox);
    });

    const list = state.comp.filterDirectChallenges(state.directChallenges, {
      box: state.filters.directBox,
      category: state.filters.category,
      query: state.filters.query,
    });

    if (list.length === 0) {
      el.innerHTML = `
        <div class="trn-empty-state trn-glass-surface">
          <h3>چالش مستقیمی با این فیلتر پیدا نشد</h3>
          <p>می‌توانید فیلتر وضعیت دعوت‌نامه‌ها را تغییر دهید یا همین حالا یک چالش مستقیم رسمی به یکی از گیم‌نت‌های شبکه ارسال کنید.</p>
          <button type="button" class="btn mg-btn mg-btn-primary" data-trn-action="open-direct-challenge">ارسال چالش مستقیم</button>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map((dc) => state.compUi.renderDirectChallengeCard(dc, getFmt())).join('');
  }

  function renderLeaderboard() {
    const rootEl = document.getElementById('trnLeaderboardRoot');
    const gameSel = document.getElementById('trnLeaderboardGameFilter');
    if (!rootEl || !state.comp || !state.compUi) return;

    document.querySelectorAll('[data-trn-lb-timeframe]').forEach((btn) => {
      btn.classList.toggle(
        'is-active',
        btn.getAttribute('data-trn-lb-timeframe') === state.filters.lbTimeframe
      );
    });

    if (gameSel) {
      const cat = state.filters.category;
      const games = state.engine.getActivitiesByCategory(cat);
      const validIds = new Set(['all', ...games.map((g) => g.id)]);
      if (!validIds.has(state.filters.lbGame)) {
        state.filters.lbGame = 'all';
      }
      gameSel.innerHTML = '';
      const allOpt = document.createElement('option');
      allOpt.value = 'all';
      allOpt.textContent =
        cat === 'all'
          ? 'همه بازی‌ها و رشته‌ها (رتبه‌بندی کلی)'
          : `همه رشته‌های ${state.engine.getCategoryMeta(cat).label}`;
      gameSel.appendChild(allOpt);
      games.forEach((g) => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = g.name;
        gameSel.appendChild(opt);
      });
      gameSel.value = state.filters.lbGame;
    }

    const board = computeOverallBoard(
      state.filters.category,
      state.filters.lbGame,
      state.filters.lbTimeframe
    );
    rootEl.innerHTML = state.compUi.renderGamingCenterLeaderboard(
      board,
      {
        timeframe: state.filters.lbTimeframe,
        category: state.filters.category,
        gameId: state.filters.lbGame,
      },
      getFmt()
    );
  }

  function renderActiveTournaments() {
    const el = document.getElementById('trnActiveGrid');
    if (!el) return;

    const view = state.filters.activeView || 'active';
    document.querySelectorAll('[data-trn-active-view]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-trn-active-view') === view);
    });

    const fmt = getFmt();
    el.classList.toggle('is-single-col', view === 'completed');

    if (view === 'internal') {
      const list = state.engine.filterTournaments(state.tournaments, {
        scope: 'internal',
        category: state.filters.category,
        query: state.filters.query,
      });
      if (list.length === 0) {
        el.innerHTML = `
          <div class="trn-empty-state trn-glass-surface">
            <h3>مسابقه داخلی فعالی در این دسته وجود ندارد</h3>
            <p>یک مسابقه داخلی بین مشتریان ثبت‌نام‌شده سالن برگزار کنید تا برنده آن نماینده رسمی Game District شود.</p>
            <button type="button" class="btn mg-btn mg-btn-primary" data-trn-action="open-create-internal">ساخت مسابقه داخلی جدید</button>
          </div>
        `;
        return;
      }
      el.innerHTML = list.map((t) => state.ui.renderTournamentCard(t, fmt)).join('');
      return;
    }

    if (view === 'completed') {
      const list = state.engine.filterTournaments(state.tournaments, {
        status: 'completed',
        category: state.filters.category,
        query: state.filters.query,
      });
      if (list.length === 0) {
        el.innerHTML = `
          <div class="trn-empty-state trn-glass-surface">
            <h3>تورنومنت پایان‌یافته‌ای در این دسته ثبت نشده است</h3>
            <p>پس از ثبت نتیجه فینال در بخش «جدول مسابقات»، نتیجه رسمی و امتیاز آن اینجا و در جدول رتبه‌بندی ثبت می‌شود.</p>
            <button type="button" class="btn mg-btn mg-btn-primary" data-trn-jump-tab="brackets">رفتن به جدول مسابقات</button>
          </div>
        `;
        return;
      }
      el.innerHTML = list.map((t) => state.ui.renderChampionCard(t, fmt)).join('');
      return;
    }

    const list = state.engine
      .filterTournaments(state.tournaments, {
        scope: 'inter_center',
        category: state.filters.category,
        query: state.filters.query,
      })
      .filter((t) => t.status !== 'completed');

    if (list.length === 0) {
      el.innerHTML = `
        <div class="trn-empty-state trn-glass-surface">
          <h3>تورنومنت فعال بین‌گیم‌نتی با این فیلتر پیدا نشد</h3>
          <p>می‌توانید یک تورنومنت جدید ایجاد کنید یا از بخش «چالش مستقیم» و «چالش‌های باز» رقابت جدیدی آغاز کنید.</p>
          <button type="button" class="btn mg-btn mg-btn-primary" data-trn-action="open-create-network">ایجاد تورنومنت جدید</button>
        </div>
      `;
      return;
    }

    el.innerHTML = list.map((t) => state.ui.renderTournamentCard(t, fmt)).join('');
  }

  function renderBracketDetail() {
    const t = getSelectedTournament();
    const headerEl = document.getElementById('trnDetailHeader');
    const stageEl = document.getElementById('trnBracketStage');
    const prizeListEl = document.getElementById('trnPrizeList');
    const prizeStatusEl = document.getElementById('trnDetailPrizeStatus');
    const prizeActionsEl = document.getElementById('trnDetailPrizeActions');
    const rosterEl = document.getElementById('trnRosterList');
    const slotsMetaEl = document.getElementById('trnSlotsMeta');
    const countMetaEl = document.getElementById('trnPlayersCountMeta');
    const genBtn = document.getElementById('trnGenerateBracketBtn');
    const enrollBtn = document.getElementById('trnEnrollSubmitBtn');
    const onlineIdWrap = document.getElementById('trnEnrollOnlineIdWrap');
    const enrollHeading = document.getElementById('trnEnrollHeading');

    if (!t) {
      if (headerEl) {
        headerEl.innerHTML = '<p class="trn-panel-sub">ابتدا یک تورنومنت بسازید یا از فهرست انتخاب کنید.</p>';
      }
      return;
    }

    const fmt = getFmt();
    const participants = Array.isArray(t.participants) ? t.participants : [];
    const isPhysical = t.mode === 'physical';
    const prizeAgreed = t.prizeAgreement?.status === 'agreed';

    if (headerEl) {
      headerEl.innerHTML = state.ui.renderBracketHeader(t, state.tournaments, fmt);
    }

    if (prizeStatusEl) {
      prizeStatusEl.className = `trn-prize-state-inline is-${prizeAgreed ? 'agreed' : 'proposed'}`;
      prizeStatusEl.textContent =
        t.scope === 'internal'
          ? 'جایزه مصوب سالن'
          : prizeAgreed
            ? 'توافق نهایی شده'
            : 'جایزه پیشنهادی';
    }

    if (prizeListEl) {
      prizeListEl.innerHTML = `
        <li class="trn-prize-item is-gold">
          <span class="trn-prize-rank">جایزه قهرمان (${state.ui.escapeHtml(state.engine.getPrizeTypeLabel(t.prizeAgreement?.prizeType || t.prizeType))})</span>
          <strong class="trn-prize-desc">${state.ui.escapeHtml(t.prizeAgreement?.summary || t.prizes?.first || 'تعیین نشده')}</strong>
        </li>
        <li class="trn-prize-item is-silver">
          <span class="trn-prize-rank">مقام دوم</span>
          <strong class="trn-prize-desc">${state.ui.escapeHtml(t.prizes?.second || 'اعتبار بازی رایگان')}</strong>
        </li>
        <li class="trn-prize-item is-bronze">
          <span class="trn-prize-rank">مقام سوم</span>
          <strong class="trn-prize-desc">${state.ui.escapeHtml(t.prizes?.third || 'اعتبار بوفه و امتیاز باشگاه')}</strong>
        </li>
      `;
    }

    if (prizeActionsEl) {
      if (t.status === 'completed') {
        prizeActionsEl.innerHTML = '';
      } else {
        prizeActionsEl.innerHTML = `
          ${
            !prizeAgreed
              ? `<button type="button" class="trn-inline-action is-confirm" data-trn-confirm-trn-prize="${state.ui.escapeHtml(t.id)}">ثبت توافق نهایی جایزه</button>`
              : ''
          }
          <button type="button" class="trn-inline-action" data-trn-edit-trn-prize="${state.ui.escapeHtml(t.id)}">ویرایش / پیشنهاد جایزه</button>
        `;
      }
    }

    if (onlineIdWrap) {
      onlineIdWrap.hidden = isPhysical;
    }
    if (enrollHeading) {
      enrollHeading.textContent =
        t.scope === 'internal' ? 'افزودن مشتری یا تیم داخلی' : 'اعزام نماینده از سالن شما';
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
            : t.scope === 'internal'
              ? 'افزودن به مسابقه داخلی'
              : 'ثبت‌نام نماینده در تورنومنت';
    }

    const isH2H = Boolean(t.isHeadToHead || t.matchMode === 'head_to_head');
    const bracketTitleEl = document.getElementById('trnBracketPanelTitle');
    const bracketSubEl = document.getElementById('trnBracketPanelSub');
    const enrollSideBlock = document.getElementById('trnEnrollSideBlock');

    if (bracketTitleEl) {
      bracketTitleEl.textContent = isH2H
        ? 'صفحه دیدار رو‌در‌رو بین‌گیم‌نتی (Head-to-Head)'
        : 'جدول حذفی و مراحل مسابقه';
    }
    if (bracketSubEl) {
      bracketSubEl.textContent = isH2H
        ? 'پس از اتمام مسابقه، نتیجه نهایی را ثبت کنید تا برنده تایید و امتیاز در جدول رتبه‌بندی لحاظ شود.'
        : 'روی دکمه «ثبت نتیجه» در هر دیدار آماده کلیک کنید تا امتیاز ثبت شده و برنده مشخص شود.';
    }
    if (enrollSideBlock) {
      enrollSideBlock.hidden = isH2H;
    }

    if (genBtn) {
      genBtn.hidden = isH2H;
      genBtn.disabled = participants.length < 2 || t.status === 'completed';
      genBtn.textContent = t.bracket ? 'قرعه‌کشی مجدد جدول' : 'قرعه‌کشی و ساخت جدول';
    }

    if (rosterEl) {
      if (participants.length === 0) {
        rosterEl.innerHTML =
          '<li class="trn-roster-empty">هنوز شرکت‌کننده‌ای ثبت نشده است. از فرم بالا بازیکن یا تیم اضافه کنید.</li>';
      } else {
        rosterEl.innerHTML = participants
          .map((p, idx) => {
            const isLocal = p.gamenetId === state.engine.LOCAL_GAMENET_ID;
            const membersLine =
              Array.isArray(p.members) && p.members.length > 1
                ? p.members.map((m) => m.name).join('، ')
                : '';
            const subLine = isPhysical
              ? `${p.gamenetName}${isLocal ? ' (سالن شما)' : ''}${membersLine ? ` · ${membersLine}` : ''}`
              : `${p.onlineId || 'تاییدشده'} · ${p.gamenetName}${isLocal ? ' (سالن شما)' : ''}`;
            return `
              <li class="trn-roster-item ${isLocal ? 'is-local' : ''}">
                <div class="trn-roster-main">
                  <span class="trn-roster-idx trn-tabular">${formatFaNum(idx + 1)}</span>
                  <div>
                    <strong class="trn-roster-name">${state.ui.escapeHtml(p.playerName)}</strong>
                    <div class="trn-roster-meta">${state.ui.escapeHtml(subLine)}</div>
                  </div>
                </div>
                ${
                  t.status !== 'completed' && !isH2H
                    ? `<button type="button" class="trn-remove-player-btn" data-trn-remove-player="${state.ui.escapeHtml(p.id)}" title="حذف از فهرست" aria-label="حذف ${state.ui.escapeHtml(p.playerName)}">&times;</button>`
                    : ''
                }
              </li>
            `;
          })
          .join('');
      }
    }

    if (stageEl) {
      stageEl.innerHTML =
        isH2H && state.compUi
          ? state.compUi.renderHeadToHeadMatchStage(t, fmt)
          : state.ui.renderBracketStage(t, fmt);
    }
  }

  function switchTab(tabKey) {
    const resolved = tabKey === 'internal' || tabKey === 'champions' ? 'active' : tabKey;
    if (tabKey === 'internal') state.filters.activeView = 'internal';
    if (tabKey === 'champions') state.filters.activeView = 'completed';

    state.activeTab = resolved;
    document.querySelectorAll('.trn-tab-btn[data-trn-tab]').forEach((btn) => {
      const isActive = btn.getAttribute('data-trn-tab') === resolved;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    document.querySelectorAll('.trn-tab-pane[data-trn-pane]').forEach((pane) => {
      const isActive = pane.getAttribute('data-trn-pane') === resolved;
      pane.classList.toggle('is-active', isActive);
      if (isActive) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });

    const filterBar = document.getElementById('trnSearchFilterBar');
    const chStatusSel = document.getElementById('trnChallengeStatusFilter');
    const showSearch = ['challenges', 'direct', 'teams', 'active'].includes(resolved);
    if (filterBar) filterBar.hidden = !showSearch;
    if (chStatusSel) chStatusSel.hidden = resolved !== 'challenges';

    if (resolved === 'active') renderActiveTournaments();
    if (resolved === 'leaderboard') renderLeaderboard();
    if (resolved === 'direct') renderDirectChallenges();
  }

  function closeModal(type) {
    const map = {
      create: 'trnCreateModal',
      team: 'trnTeamModal',
      challenge: 'trnChallengeModal',
      accept: 'trnAcceptModal',
      prize: 'trnPrizeModal',
      'form-trn': 'trnFormTournamentModal',
      match: 'trnMatchModal',
      'direct-create': 'trnDirectCreateModal',
      'direct-accept': 'trnDirectAcceptModal',
      'direct-propose': 'trnDirectProposeModal',
      'direct-reject': 'trnDirectRejectModal',
    };
    const modal = document.getElementById(map[type] || 'trnCreateModal');
    if (modal) modal.setAttribute('hidden', '');
  }

  function openCreateModal(defaultScope = 'internal') {
    const modal = document.getElementById('trnCreateModal');
    const form = document.getElementById('trnCreateForm');
    if (form) form.reset();
    const scopeEl = document.getElementById('trnInputScope');
    if (scopeEl) scopeEl.value = defaultScope === 'inter_center' ? 'inter_center' : 'internal';
    const catEl = document.getElementById('trnInputCategory');
    if (catEl && state.filters.category !== 'all') catEl.value = state.filters.category;

    const titleHead = document.getElementById('trnCreateModalTitle');
    if (titleHead) {
      titleHead.textContent =
        defaultScope === 'internal'
          ? 'ساخت مسابقه داخلی گیم‌نت Game District'
          : 'ایجاد تورنومنت بین‌گیم‌نتی در شبکه';
    }
    const errEl = document.getElementById('trnCreateError');
    if (errEl) errEl.hidden = true;
    populateDynamicPickers();
    syncCreateModalMode();
    if (modal) modal.removeAttribute('hidden');
    document.getElementById('trnInputTitle')?.focus();
  }

  function openTeamModal() {
    const modal = document.getElementById('trnTeamModal');
    const form = document.getElementById('trnTeamForm');
    if (form) form.reset();
    const catEl = document.getElementById('trnTeamCategory');
    if (catEl && state.filters.category !== 'all') catEl.value = state.filters.category;
    const errEl = document.getElementById('trnTeamError');
    if (errEl) errEl.hidden = true;
    populateDynamicPickers();
    syncTeamModalMode();
    if (modal) modal.removeAttribute('hidden');
    document.getElementById('trnTeamName')?.focus();
  }

  function openChallengeModal(prefillTeamId = '') {
    const modal = document.getElementById('trnChallengeModal');
    const form = document.getElementById('trnChallengeForm');
    if (form) form.reset();
    const errEl = document.getElementById('trnChallengeError');
    if (errEl) errEl.hidden = true;
    populateDynamicPickers();

    if (prefillTeamId) {
      const sel = document.getElementById('trnChTeamSelect');
      if (sel) {
        sel.value = prefillTeamId;
        applyTeamToChallengeForm(prefillTeamId);
      }
    } else {
      const catEl = document.getElementById('trnChCategory');
      if (catEl && state.filters.category !== 'all') catEl.value = state.filters.category;
      syncChallengeModalMode();
    }

    if (modal) modal.removeAttribute('hidden');
    document.getElementById('trnChTeamName')?.focus();
  }

  function applyTeamToChallengeForm(teamId) {
    const team = state.teams.find((t) => t.id === teamId);
    if (!team) return;
    const catEl = document.getElementById('trnChCategory');
    if (catEl) catEl.value = team.category;
    syncChallengeModalMode();
    const gameEl = document.getElementById('trnChGame');
    if (gameEl && team.gameId) gameEl.value = team.gameId;
    const nameEl = document.getElementById('trnChTeamName');
    if (nameEl) nameEl.value = team.name;
    const memEl = document.getElementById('trnChMembers');
    if (memEl) memEl.value = (team.members || []).map((m) => m.name).join('، ');
  }

  function openAcceptChallengeModal(challengeId, asPartner = false) {
    const ch = state.challenges.find((c) => c.id === challengeId);
    if (!ch) return;

    const form = document.getElementById('trnAcceptForm');
    if (form) form.reset();
    document.getElementById('trnAcceptChallengeId').value = ch.id;
    document.getElementById('trnAcceptError').hidden = true;

    const isPhysical = ch.mode === 'physical';
    document.getElementById('trnAcceptOnlineIdWrap').hidden = isPhysical;
    document.getElementById('trnAcceptPartnerWrap').hidden = !asPartner;
    document.getElementById('trnAcceptLocalTeamWrap').hidden = asPartner;

    const titleEl = document.getElementById('trnAcceptModalTitle');
    if (titleEl) {
      titleEl.textContent = asPartner
        ? `ثبت پذیرش گیم‌نت همکار در «${ch.gameName}»`
        : `پذیرش چالش «${ch.gameName}» توسط Game District`;
    }

    if (asPartner) {
      const joinedIds = new Set((ch.participatingCenters || []).map((c) => c.gamenetId));
      const partnerSel = document.getElementById('trnAcceptGamenetSelect');
      if (partnerSel) {
        partnerSel.innerHTML = '';
        state.engine.NETWORK_PARTNER_GAMENETS.filter((g) => !joinedIds.has(g.id)).forEach((g) => {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = `${g.name} (${g.city})`;
          partnerSel.appendChild(opt);
        });
      }
      document.getElementById('trnAcceptTeamName').value = `تیم منتخب باشگاه همکار`;
      document.getElementById('trnAcceptMembers').value = 'کاپیتان باشگاه، بازیکن دوم';
    } else {
      // Pre-select matching local team if available
      populateDynamicPickers();
      const matchingTeam = state.teams.find(
        (tm) => tm.gamenetId === state.engine.LOCAL_GAMENET_ID && tm.category === ch.category
      );
      if (matchingTeam) {
        const picker = document.getElementById('trnAcceptTeamPicker');
        if (picker) picker.value = matchingTeam.id;
        document.getElementById('trnAcceptTeamName').value = matchingTeam.name;
        document.getElementById('trnAcceptMembers').value = (matchingTeam.members || [])
          .map((m) => m.name)
          .join('، ');
        if (!isPhysical) {
          document.getElementById('trnAcceptOnlineId').value = matchingTeam.onlineTag || 'Steam:GD_Rep';
        }
      }
    }

    const prizeBox = document.getElementById('trnAcceptCurrentPrizeBox');
    if (prizeBox) {
      const agreed = ch.prizeAgreement?.status === 'agreed';
      prizeBox.innerHTML = `
        <div class="trn-card-kicker">
          <span class="trn-prize-state-inline is-${agreed ? 'agreed' : 'proposed'}">${agreed ? 'جایزه توافق‌شده' : 'جایزه پیشنهادی فعلی'}</span>
          <span aria-hidden="true">·</span>
          <span>${state.ui.escapeHtml(state.engine.getPrizeTypeLabel(ch.prizeAgreement?.prizeType))}</span>
        </div>
        <strong style="display:block; margin-top:4px;">${state.ui.escapeHtml(ch.prizeAgreement?.summary || 'توافقی')}</strong>
      `;
    }

    const confirmCheck = document.getElementById('trnAcceptConfirmPrize');
    const counterWrap = document.getElementById('trnAcceptCounterWrap');
    if (confirmCheck) confirmCheck.checked = true;
    if (counterWrap) counterWrap.hidden = true;

    document.getElementById('trnAcceptModal')?.removeAttribute('hidden');
  }

  function openPrizeEditModal(targetType, targetId) {
    let current = null;
    if (targetType === 'challenge') {
      current = state.challenges.find((c) => c.id === targetId)?.prizeAgreement;
    } else {
      current = state.tournaments.find((t) => t.id === targetId)?.prizeAgreement;
    }
    document.getElementById('trnPrizeTargetType').value = targetType;
    document.getElementById('trnPrizeTargetId').value = targetId;
    document.getElementById('trnPrizeEditType').value = current?.prizeType || 'playtime';
    document.getElementById('trnPrizeEditSummary').value = current?.summary || '';
    document.getElementById('trnPrizeError').hidden = true;
    document.getElementById('trnPrizeModal')?.removeAttribute('hidden');
  }

  function openFormTournamentModal(challengeId) {
    const ch = state.challenges.find((c) => c.id === challengeId);
    if (!ch) return;
    const centers = ch.participatingCenters || [];
    const isPhysical = ch.mode === 'physical';

    document.getElementById('trnFormChId').value = ch.id;
    document.getElementById('trnFormTitle').value = ch.title.replace(/^چالش\s+/u, 'تورنومنت ');
    document.getElementById('trnFormDate').value = ch.preferredDate || 'پنج‌شنبه ساعت ۲۱:۰۰';
    document.getElementById('trnFormPrizeSummary').value = ch.prizeAgreement?.summary || '';
    document.getElementById('trnFormVenueWrap').hidden = !isPhysical;
    document.getElementById('trnFormPlatformWrap').hidden = isPhysical;
    document.getElementById('trnFormVenue').value = ch.venue || state.engine.LOCAL_GAMENET_VENUE;
    document.getElementById('trnFormPlatform').value = ch.platform || 'PC';

    const maxSel = document.getElementById('trnFormMaxSlots');
    if (maxSel) {
      const targetCap = centers.length <= 2 && ch.competitionScope === 'two_center'
        ? '2'
        : centers.length <= 4
          ? '4'
          : '8';
      maxSel.value = targetCap;
    }

    const summaryBox = document.getElementById('trnFormSummaryBox');
    if (summaryBox) {
      const centerNames = centers.map((c) => `${c.gamenetName} (${c.teamName})`).join(' · ');
      summaryBox.innerHTML = `
        <div class="trn-card-kicker">
          <span class="trn-status-text is-emerald">${formatFaNum(centers.length)} گیم‌نت تاییدشده</span>
          <span aria-hidden="true">·</span>
          <span>${state.ui.escapeHtml(ch.gameName)}</span>
          <span aria-hidden="true">·</span>
          <span>${isPhysical ? 'حضوری' : 'آنلاین'}</span>
        </div>
        <div style="margin-top:6px; font-size:13px;">شرکت‌کنندگان قطعی: <strong>${state.ui.escapeHtml(centerNames)}</strong></div>
      `;
    }

    document.getElementById('trnFormTrnError').hidden = true;
    document.getElementById('trnFormTournamentModal')?.removeAttribute('hidden');
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

    const unitLabel =
      t.category === 'billiards'
        ? 'گیم / فریم'
        : t.category === 'foosball'
          ? 'گل / ست'
          : 'امتیاز';

    document.getElementById('trnMatchIdInput').value = found.id;
    document.getElementById('trnScoreALabel').textContent = `${unitLabel} ${found.playerA.playerName}`;
    document.getElementById('trnScoreBLabel').textContent = `${unitLabel} ${found.playerB.playerName}`;
    document.getElementById('trnWinnerAName').textContent = `${found.playerA.playerName} (${found.playerA.gamenetName})`;
    document.getElementById('trnWinnerBName').textContent = `${found.playerB.playerName} (${found.playerB.gamenetName})`;
    document.getElementById('trnScoreA').value = found.scoreA ?? (t.category === 'foosball' ? 10 : 3);
    document.getElementById('trnScoreB').value = found.scoreB ?? (t.category === 'foosball' ? 6 : 1);
    document.getElementById('trnWinnerA').checked = true;
    document.getElementById('trnMatchError').hidden = true;

    document.getElementById('trnMatchModal')?.removeAttribute('hidden');
  }

  function syncDirectCreateModalMode() {
    const cat = document.getElementById('trnDcCategory')?.value || 'billiards';
    const isPhysCat = state.engine.isPhysicalCategory(cat);
    populateActivitySelect(document.getElementById('trnDcGame'), cat, false);

    const modeWrap = document.getElementById('trnDcModeWrap');
    const modeSel = document.getElementById('trnDcMode');
    if (modeWrap) modeWrap.hidden = isPhysCat;
    const effectiveMode = isPhysCat ? 'physical' : modeSel?.value || 'online';

    const venueWrap = document.getElementById('trnDcVenueWrap');
    const onlineWrap = document.getElementById('trnDcOnlineIdWrap');
    if (venueWrap) venueWrap.hidden = effectiveMode !== 'physical';
    if (onlineWrap) onlineWrap.hidden = effectiveMode === 'physical';

    const gameId = document.getElementById('trnDcGame')?.value;
    const game = state.engine.TOURNAMENT_GAMES.find((g) => g.id === gameId);
    const fmtEl = document.getElementById('trnDcFormat');
    if (fmtEl && game && !fmtEl.dataset.userEdited) {
      fmtEl.value = game.defaultFormat;
    }

    syncDirectVenuePreset();
  }

  function syncDirectVenuePreset() {
    const preset = document.getElementById('trnDcVenuePreset')?.value || 'local';
    const venueInput = document.getElementById('trnDcVenue');
    if (!venueInput) return;
    if (preset === 'local') {
      venueInput.value = state.engine.LOCAL_GAMENET_VENUE;
    } else if (preset === 'target') {
      const targetId = document.getElementById('trnDcTargetCenter')?.value;
      const targetInfo = state.comp?.getGamingCenterInfo(targetId);
      venueInput.value = targetInfo
        ? `سالن گیم‌نت ${targetInfo.name} — ${targetInfo.city}`
        : 'سالن گیم‌نت مقصد';
    }
  }

  function openDirectCreateModal() {
    const modal = document.getElementById('trnDirectCreateModal');
    const form = document.getElementById('trnDirectCreateForm');
    if (form) form.reset();
    const fmtEl = document.getElementById('trnDcFormat');
    if (fmtEl) delete fmtEl.dataset.userEdited;
    const errEl = document.getElementById('trnDcCreateError');
    if (errEl) errEl.hidden = true;

    populateDynamicPickers();
    const catEl = document.getElementById('trnDcCategory');
    if (catEl && state.filters.category !== 'all') {
      catEl.value = state.filters.category;
    }
    const dateEl = document.getElementById('trnDcDate');
    if (dateEl && !dateEl.value) dateEl.value = 'پنج‌شنبه ۶ آذر ۱۴۰۵';

    syncDirectCreateModalMode();
    if (modal) modal.removeAttribute('hidden');
    document.getElementById('trnDcTargetCenter')?.focus();
  }

  function openDirectAcceptModal(directId) {
    const dc = state.directChallenges.find((item) => item.id === directId);
    if (!dc) return;

    const form = document.getElementById('trnDirectAcceptForm');
    if (form) form.reset();
    document.getElementById('trnDcAcceptId').value = dc.id;
    document.getElementById('trnDcAcceptError').hidden = true;
    populateDynamicPickers();

    const isPhysical = dc.mode === 'physical';
    const onlineWrap = document.getElementById('trnDcAcceptOnlineWrap');
    if (onlineWrap) onlineWrap.hidden = isPhysical;

    const isIncoming = dc.targetGamenetId === state.engine.LOCAL_GAMENET_ID;
    const summaryEl = document.getElementById('trnDcAcceptSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="trn-card-kicker">
          <strong>${state.ui.escapeHtml(dc.challengerGamenetName)} VS ${state.ui.escapeHtml(dc.targetGamenetName)}</strong>
          <span aria-hidden="true">·</span>
          <span>${state.ui.escapeHtml(dc.gameName)}</span>
        </div>
        <div style="margin-top:6px; font-size:12.5px;">
          زمان: <strong>${state.ui.escapeHtml(dc.proposedDate)} ${dc.proposedTime ? `ساعت ${state.ui.escapeHtml(dc.proposedTime)}` : ''}</strong>
          · جایزه: <strong>${state.ui.escapeHtml(dc.prizeSummary)}</strong>
        </div>
      `;
    }

    const teamNameEl = document.getElementById('trnDcAcceptTeamName');
    const membersEl = document.getElementById('trnDcAcceptMembers');
    const onlineEl = document.getElementById('trnDcAcceptOnlineId');

    if (isIncoming) {
      const matchTeam = state.teams.find(
        (tm) => tm.gamenetId === state.engine.LOCAL_GAMENET_ID && tm.category === dc.category
      );
      if (matchTeam) {
        document.getElementById('trnDcAcceptTeamPicker').value = matchTeam.id;
        if (teamNameEl) teamNameEl.value = matchTeam.name;
        if (membersEl) membersEl.value = (matchTeam.members || []).map((m) => m.name).join('، ');
        if (onlineEl && !isPhysical) onlineEl.value = matchTeam.onlineTag || 'Steam:GD_Squad';
      } else if (teamNameEl) {
        teamNameEl.value = 'نماینده Game District';
      }
    } else {
      if (teamNameEl) teamNameEl.value = dc.targetRoster?.teamName || `نماینده ${dc.targetGamenetName}`;
      if (membersEl) {
        membersEl.value =
          (dc.targetRoster?.members || []).map((m) => m.name).join('، ') || 'نماینده تاییدشده حریف';
      }
      if (onlineEl && !isPhysical) onlineEl.value = dc.targetRoster?.onlineId || 'Match_Rep';
    }

    document.getElementById('trnDirectAcceptModal')?.removeAttribute('hidden');
  }

  function openDirectProposeModal(directId) {
    const dc = state.directChallenges.find((item) => item.id === directId);
    if (!dc) return;

    const form = document.getElementById('trnDirectProposeForm');
    if (form) form.reset();
    document.getElementById('trnDcProposeId').value = dc.id;
    document.getElementById('trnDcProposeError').hidden = true;

    const activeTerms = dc.pendingProposal?.terms || dc;
    document.getElementById('trnDcPropDate').value = activeTerms.proposedDate || dc.proposedDate || '';
    document.getElementById('trnDcPropTime').value = activeTerms.proposedTime || dc.proposedTime || '';
    document.getElementById('trnDcPropFormat').value = activeTerms.format || dc.format || '';
    document.getElementById('trnDcPropVenue').value = activeTerms.venue || dc.venue || '';
    document.getElementById('trnDcPropVenueWrap').hidden = dc.mode !== 'physical';
    document.getElementById('trnDcPropPrizeType').value = activeTerms.prizeType || dc.prizeType || 'vip_session';
    document.getElementById('trnDcPropPrizeSummary').value = activeTerms.prizeSummary || dc.prizeSummary || '';
    document.getElementById('trnDcPropNotes').value = activeTerms.notes || dc.notes || '';

    const summaryEl = document.getElementById('trnDcProposeSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="trn-card-kicker">
          <strong>${state.ui.escapeHtml(dc.challengerGamenetName)} VS ${state.ui.escapeHtml(dc.targetGamenetName)}</strong>
          <span aria-hidden="true">·</span>
          <span>${state.ui.escapeHtml(dc.gameName)}</span>
        </div>
        <div style="margin-top:4px; font-size:12.5px;">شرایط فعلی: ${state.ui.escapeHtml(dc.proposedDate)} ${dc.proposedTime ? `(${state.ui.escapeHtml(dc.proposedTime)})` : ''} · جایزه: ${state.ui.escapeHtml(dc.prizeSummary)}</div>
      `;
    }

    document.getElementById('trnDirectProposeModal')?.removeAttribute('hidden');
  }

  function openDirectRejectModal(directId) {
    const dc = state.directChallenges.find((item) => item.id === directId);
    if (!dc) return;
    const form = document.getElementById('trnDirectRejectForm');
    if (form) form.reset();
    document.getElementById('trnDcRejectId').value = dc.id;
    document.getElementById('trnDcRejectError').hidden = true;
    document.getElementById('trnDirectRejectModal')?.removeAttribute('hidden');
  }

  function renderAll() {
    populateDynamicPickers();
    renderKPIsAndHero();
    renderCategoryBar();
    renderOverview();
    renderChallenges();
    renderDirectChallenges();
    renderLeaderboard();
    renderTeams();
    renderActiveTournaments();
    renderBracketDetail();
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

      const jumpTabBtn = e.target.closest('[data-trn-jump-tab]');
      if (jumpTabBtn) {
        switchTab(jumpTabBtn.getAttribute('data-trn-jump-tab'));
        return;
      }

      const catBtn = e.target.closest('[data-trn-category]');
      if (catBtn) {
        state.filters.category = catBtn.getAttribute('data-trn-category') || 'all';
        renderCategoryBar();
        renderOverview();
        renderChallenges();
        renderDirectChallenges();
        renderLeaderboard();
        renderTeams();
        renderActiveTournaments();
        return;
      }

      const dcBoxBtn = e.target.closest('[data-trn-dc-box]');
      if (dcBoxBtn) {
        state.filters.directBox = dcBoxBtn.getAttribute('data-trn-dc-box') || 'all';
        renderDirectChallenges();
        return;
      }

      const lbTimeBtn = e.target.closest('[data-trn-lb-timeframe]');
      if (lbTimeBtn) {
        state.filters.lbTimeframe = lbTimeBtn.getAttribute('data-trn-lb-timeframe') || 'all_time';
        renderLeaderboard();
        return;
      }

      const activeViewBtn = e.target.closest('[data-trn-active-view]');
      if (activeViewBtn) {
        state.filters.activeView = activeViewBtn.getAttribute('data-trn-active-view') || 'active';
        renderActiveTournaments();
        return;
      }

      if (e.target.closest('[data-trn-action="open-direct-challenge"]')) {
        openDirectCreateModal();
        return;
      }
      if (e.target.closest('[data-trn-action="open-create-internal"]')) {
        openCreateModal('internal');
        return;
      }
      if (e.target.closest('[data-trn-action="open-create-network"]')) {
        openCreateModal('inter_center');
        return;
      }
      if (e.target.closest('[data-trn-action="open-create-team"]')) {
        openTeamModal();
        return;
      }
      if (e.target.closest('[data-trn-action="open-challenge"]')) {
        openChallengeModal('');
        return;
      }

      const dcAcceptBtn = e.target.closest('[data-trn-dc-accept]');
      if (dcAcceptBtn) {
        openDirectAcceptModal(dcAcceptBtn.getAttribute('data-trn-dc-accept'));
        return;
      }

      const dcProposeBtn = e.target.closest('[data-trn-dc-propose]');
      if (dcProposeBtn) {
        openDirectProposeModal(dcProposeBtn.getAttribute('data-trn-dc-propose'));
        return;
      }

      const dcRejectBtn = e.target.closest('[data-trn-dc-reject]');
      if (dcRejectBtn) {
        openDirectRejectModal(dcRejectBtn.getAttribute('data-trn-dc-reject'));
        return;
      }

      const dcConfirmBtn = e.target.closest('[data-trn-dc-confirm]');
      if (dcConfirmBtn) {
        try {
          const resp = await postTournamentAction({
            action: 'confirm_direct_terms',
            directId: dcConfirmBtn.getAttribute('data-trn-dc-confirm'),
            gamenetId: state.engine.LOCAL_GAMENET_ID,
          });
          if (resp.tournament?.id) state.selectedId = resp.tournament.id;
          renderAll();
          showToast(
            resp.bothAgreed
              ? 'توافق دوطرفه نهایی شد و دیدار رو‌در‌رو آماده برگزاری است!'
              : 'تایید شما ثبت شد؛ در انتظار تایید گیم‌نت مقابل.'
          );
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const dcConfirmBothBtn = e.target.closest('[data-trn-dc-confirm-both]');
      if (dcConfirmBothBtn) {
        try {
          const resp = await postTournamentAction({
            action: 'confirm_direct_terms',
            directId: dcConfirmBothBtn.getAttribute('data-trn-dc-confirm-both'),
            confirmBoth: '1',
          });
          if (resp.tournament?.id) state.selectedId = resp.tournament.id;
          renderAll();
          showToast('توافق دوطرفه ثبت شد و دیدار رو‌در‌رو ایجاد گردید!');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const dcDeleteBtn = e.target.closest('[data-trn-dc-delete]');
      if (dcDeleteBtn) {
        try {
          await postTournamentAction({
            action: 'delete_direct_challenge',
            directId: dcDeleteBtn.getAttribute('data-trn-dc-delete'),
          });
          renderAll();
          showToast('چالش مستقیم حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const challengeFromTeamBtn = e.target.closest('[data-trn-challenge-from-team]');
      if (challengeFromTeamBtn) {
        openChallengeModal(challengeFromTeamBtn.getAttribute('data-trn-challenge-from-team'));
        return;
      }

      const acceptBtn = e.target.closest('[data-trn-open-accept]');
      if (acceptBtn) {
        openAcceptChallengeModal(acceptBtn.getAttribute('data-trn-open-accept'), false);
        return;
      }

      const acceptPartnerBtn = e.target.closest('[data-trn-open-accept-partner]');
      if (acceptPartnerBtn) {
        openAcceptChallengeModal(acceptPartnerBtn.getAttribute('data-trn-open-accept-partner'), true);
        return;
      }

      const confirmPrizeBtn = e.target.closest('[data-trn-confirm-prize]');
      if (confirmPrizeBtn) {
        const chId = confirmPrizeBtn.getAttribute('data-trn-confirm-prize');
        const finalizeAll = confirmPrizeBtn.getAttribute('data-finalize-all') || '0';
        try {
          await postTournamentAction({
            action: 'confirm_prize',
            challengeId: chId,
            finalizeAll,
          });
          renderAll();
          showToast('توافق جایزه با موفقیت ثبت شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const editPrizeBtn = e.target.closest('[data-trn-open-prize-edit]');
      if (editPrizeBtn) {
        openPrizeEditModal('challenge', editPrizeBtn.getAttribute('data-trn-open-prize-edit'));
        return;
      }

      const confirmTrnPrizeBtn = e.target.closest('[data-trn-confirm-trn-prize]');
      if (confirmTrnPrizeBtn) {
        try {
          await postTournamentAction({
            action: 'update_tournament_prize',
            tournamentId: confirmTrnPrizeBtn.getAttribute('data-trn-confirm-trn-prize'),
            modeAction: 'finalize_all',
          });
          renderAll();
          showToast('توافق نهایی جایزه تورنومنت ثبت شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const editTrnPrizeBtn = e.target.closest('[data-trn-edit-trn-prize]');
      if (editTrnPrizeBtn) {
        openPrizeEditModal('tournament', editTrnPrizeBtn.getAttribute('data-trn-edit-trn-prize'));
        return;
      }

      const formTrnBtn = e.target.closest('[data-trn-open-form-tournament]');
      if (formTrnBtn) {
        openFormTournamentModal(formTrnBtn.getAttribute('data-trn-open-form-tournament'));
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
        switchTab('brackets');
        renderBracketDetail();
        return;
      }

      const quickEnrollBtn = e.target.closest('[data-trn-quick-enroll]');
      if (quickEnrollBtn) {
        state.selectedId = quickEnrollBtn.getAttribute('data-trn-quick-enroll');
        switchTab('brackets');
        renderBracketDetail();
        document.getElementById('trnPlayerName')?.focus();
        return;
      }

      const promoteBtn = e.target.closest('[data-trn-promote-winner]');
      if (promoteBtn) {
        try {
          await postTournamentAction({
            action: 'promote_winner_to_team',
            tournamentId: promoteBtn.getAttribute('data-trn-promote-winner'),
          });
          switchTab('teams');
          renderAll();
          showToast('برنده مسابقه با موفقیت به تیم‌های نماینده Game District اضافه شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const deleteTeamBtn = e.target.closest('[data-trn-delete-team]');
      if (deleteTeamBtn) {
        try {
          await postTournamentAction({
            action: 'delete_team',
            teamId: deleteTeamBtn.getAttribute('data-trn-delete-team'),
          });
          renderAll();
          showToast('تیم نماینده حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const deleteChallengeBtn = e.target.closest('[data-trn-delete-challenge]');
      if (deleteChallengeBtn) {
        try {
          await postTournamentAction({
            action: 'delete_challenge',
            challengeId: deleteChallengeBtn.getAttribute('data-trn-delete-challenge'),
          });
          renderAll();
          showToast('فراخوان چالش حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
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
        try {
          await postTournamentAction({
            action: 'remove_player',
            tournamentId: t.id,
            participantId: removePlayerBtn.getAttribute('data-trn-remove-player'),
          });
          renderAll();
          showToast('شرکت‌کننده از فهرست حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      if (e.target.closest('#trnGenerateBracketBtn')) {
        const t = getSelectedTournament();
        if (!t) return;
        try {
          await postTournamentAction({
            action: 'generate_bracket',
            tournamentId: t.id,
          });
          renderAll();
          showToast('جدول حذفی با موفقیت قرعه‌کشی و فعال شد.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const deleteTrnBtn = e.target.closest('[data-trn-delete]');
      if (deleteTrnBtn) {
        try {
          await postTournamentAction({
            action: 'delete',
            tournamentId: deleteTrnBtn.getAttribute('data-trn-delete'),
          });
          state.selectedId = state.tournaments[0]?.id || null;
          switchTab('active');
          renderAll();
          showToast('تورنومنت حذف شد.');
        } catch (err) {
          showToast(err.message);
        }
      }
    });

    container.addEventListener('input', (e) => {
      if (e.target.id === 'trnSearchInput') {
        state.filters.query = e.target.value || '';
        renderChallenges();
        renderDirectChallenges();
        renderTeams();
        renderActiveTournaments();
        return;
      }
      if (e.target.id === 'trnDcFormat') {
        e.target.dataset.userEdited = '1';
      }
    });

    container.addEventListener('change', (e) => {
      if (e.target.id === 'trnChallengeStatusFilter') {
        state.filters.challengeStatus = e.target.value || 'all';
        renderChallenges();
        return;
      }
      if (e.target.id === 'trnLeaderboardGameFilter') {
        state.filters.lbGame = e.target.value || 'all';
        renderLeaderboard();
        return;
      }
      if (e.target.id === 'trnDetailSelect') {
        state.selectedId = e.target.value;
        renderBracketDetail();
        return;
      }
      if (e.target.id === 'trnDcCategory' || e.target.id === 'trnDcMode') {
        syncDirectCreateModalMode();
        return;
      }
      if (e.target.id === 'trnDcGame') {
        const game = state.engine.TOURNAMENT_GAMES.find((g) => g.id === e.target.value);
        const fmtEl = document.getElementById('trnDcFormat');
        if (fmtEl && game && !fmtEl.dataset.userEdited) {
          fmtEl.value = game.defaultFormat;
        }
        return;
      }
      if (e.target.id === 'trnDcVenuePreset' || e.target.id === 'trnDcTargetCenter') {
        syncDirectVenuePreset();
        return;
      }
      if (e.target.id === 'trnDcTeamPicker') {
        const tm = state.teams.find((x) => x.id === e.target.value);
        if (tm) {
          const catEl = document.getElementById('trnDcCategory');
          if (catEl) catEl.value = tm.category;
          syncDirectCreateModalMode();
          const gameEl = document.getElementById('trnDcGame');
          if (gameEl && tm.gameId) gameEl.value = tm.gameId;
          document.getElementById('trnDcTeamName').value = tm.name;
          document.getElementById('trnDcEntryType').value = tm.entryType === 'individual' ? 'individual' : 'team';
          document.getElementById('trnDcManualMembers').value = (tm.members || []).map((m) => m.name).join('، ');
          if (tm.onlineTag) document.getElementById('trnDcOnlineId').value = tm.onlineTag;
        }
        return;
      }
      if (e.target.id === 'trnDcAcceptTeamPicker') {
        const tm = state.teams.find((x) => x.id === e.target.value);
        if (tm) {
          document.getElementById('trnDcAcceptTeamName').value = tm.name;
          document.getElementById('trnDcAcceptMembers').value = (tm.members || []).map((m) => m.name).join('، ');
          if (tm.onlineTag) document.getElementById('trnDcAcceptOnlineId').value = tm.onlineTag;
        }
        return;
      }
      if (e.target.id === 'trnInputCategory' || e.target.id === 'trnInputScope') {
        syncCreateModalMode();
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
          if (platEl && game.category === 'video_games') platEl.value = game.platform;
          if (fmtEl) fmtEl.value = game.defaultFormat;
        }
        return;
      }
      if (e.target.id === 'trnTeamCategory') {
        syncTeamModalMode();
        return;
      }
      if (e.target.id === 'trnChCategory' || e.target.id === 'trnChScope') {
        syncChallengeModalMode();
        return;
      }
      if (e.target.id === 'trnChTeamSelect') {
        if (e.target.value) applyTeamToChallengeForm(e.target.value);
        return;
      }
      if (e.target.id === 'trnAcceptTeamPicker') {
        const tm = state.teams.find((x) => x.id === e.target.value);
        if (tm) {
          document.getElementById('trnAcceptTeamName').value = tm.name;
          document.getElementById('trnAcceptMembers').value = (tm.members || [])
            .map((m) => m.name)
            .join('، ');
          if (tm.onlineTag) {
            document.getElementById('trnAcceptOnlineId').value = tm.onlineTag;
          }
        }
        return;
      }
      if (e.target.id === 'trnAcceptConfirmPrize') {
        const counterWrap = document.getElementById('trnAcceptCounterWrap');
        if (counterWrap) counterWrap.hidden = e.target.checked;
        return;
      }
      if (e.target.id === 'trnTeamQuickPicker') {
        const tm = state.teams.find((x) => x.id === e.target.value);
        if (tm) {
          const nameInput = document.getElementById('trnPlayerName');
          const idInput = document.getElementById('trnOnlineId');
          if (nameInput) nameInput.value = tm.name;
          if (idInput) idInput.value = tm.onlineTag || `GD_${tm.id.slice(-4)}`;
        }
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
      }
    });

    container.addEventListener('submit', async (e) => {
      // 1. Create Tournament / Internal Competition
      if (e.target.id === 'trnCreateForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnCreateError');
        if (errEl) errEl.hidden = true;
        const formData = new FormData(e.target);
        const payload = { action: 'create' };
        formData.forEach((v, k) => {
          if (k !== 'internalCustomerIds') payload[k] = v;
        });

        // Gather checked club customers if creating an internal competition
        const checkedCusts = Array.from(
          e.target.querySelectorAll('input[name="internalCustomerIds"]:checked')
        ).map((inp) => ({
          playerName: inp.getAttribute('data-customer-name') || '',
          onlineId: `GD_${inp.value}`,
          customerId: inp.value,
          gamenetId: state.engine.LOCAL_GAMENET_ID,
          gamenetName: state.engine.LOCAL_GAMENET_NAME,
          city: state.engine.LOCAL_GAMENET_CITY,
        }));
        if (checkedCusts.length > 0) {
          payload.initialParticipants = JSON.stringify(checkedCusts);
          if (checkedCusts.length >= 2) payload.autoGenerateBracket = '1';
        }

        const check = state.engine.sanitizeTournamentInput(payload);
        if (check.error) {
          errEl.textContent = check.error;
          errEl.hidden = false;
          return;
        }

        try {
          const resp = await postTournamentAction(payload);
          if (resp.tournament?.id) state.selectedId = resp.tournament.id;
          closeModal('create');
          switchTab(payload.scope === 'internal' ? 'internal' : 'active');
          renderAll();
          showToast(
            payload.scope === 'internal'
              ? 'مسابقه داخلی سالن با موفقیت ایجاد شد.'
              : 'تورنومنت بین‌گیم‌نتی با موفقیت ثبت شد.'
          );
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 2. Create Representative Team
      if (e.target.id === 'trnTeamForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnTeamError');
        errEl.hidden = true;

        const checkedMembers = Array.from(
          e.target.querySelectorAll('input[name="teamCustomerIds"]:checked')
        ).map((inp) => ({
          name: inp.getAttribute('data-customer-name') || '',
          customerId: inp.value,
          role: 'عضو باشگاه مشتریان',
        }));
        const extraRaw = document.getElementById('trnTeamExtraMembers')?.value || '';
        const extraMembers = state.engine.parseMembersList(extraRaw);
        const allMembers = [...checkedMembers, ...extraMembers];

        const payload = {
          action: 'create_team',
          name: document.getElementById('trnTeamName')?.value || '',
          category: document.getElementById('trnTeamCategory')?.value || 'video_games',
          gameId: document.getElementById('trnTeamGame')?.value || '',
          entryType: document.getElementById('trnTeamEntryType')?.value || 'team',
          onlineTag: document.getElementById('trnTeamOnlineTag')?.value || '',
          notes: document.getElementById('trnTeamNotes')?.value || '',
          members: JSON.stringify(allMembers),
        };

        const check = state.engine.sanitizeTeamInput({ ...payload, members: allMembers });
        if (check.error) {
          errEl.textContent = check.error;
          errEl.hidden = false;
          return;
        }

        try {
          await postTournamentAction(payload);
          closeModal('team');
          switchTab('teams');
          renderAll();
          showToast('تیم نماینده جدید با موفقیت ثبت شد.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 3. Publish Public Challenge Announcement
      if (e.target.id === 'trnChallengeForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnChallengeError');
        errEl.hidden = true;
        const formData = new FormData(e.target);
        const payload = { action: 'create_challenge' };
        formData.forEach((v, k) => {
          payload[k] = v;
        });
        const memList = state.engine.parseMembersList(payload.members);
        payload.entryType = memList.length <= 1 ? 'individual' : 'team';

        const check = state.engine.sanitizeChallengeInput(payload);
        if (check.error) {
          errEl.textContent = check.error;
          errEl.hidden = false;
          return;
        }

        try {
          await postTournamentAction(payload);
          closeModal('challenge');
          switchTab('challenges');
          renderAll();
          showToast('فراخوان چالش عمومی در شبکه گیم‌نت‌ها منتشر شد.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 4. Accept Challenge & Review/Agree Prize
      if (e.target.id === 'trnAcceptForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnAcceptError');
        errEl.hidden = true;

        const isPartnerMode = !document.getElementById('trnAcceptPartnerWrap').hidden;
        let gamenetId = state.engine.LOCAL_GAMENET_ID;
        let gamenetName = state.engine.LOCAL_GAMENET_NAME;
        let city = state.engine.LOCAL_GAMENET_CITY;

        if (isPartnerMode) {
          const pId = document.getElementById('trnAcceptGamenetSelect')?.value;
          const partner = state.engine.NETWORK_PARTNER_GAMENETS.find((g) => g.id === pId);
          if (partner) {
            gamenetId = partner.id;
            gamenetName = partner.name;
            city = partner.city;
          }
        }

        const confirmPrize = document.getElementById('trnAcceptConfirmPrize')?.checked;
        const counterPrize = confirmPrize
          ? ''
          : document.getElementById('trnAcceptCounterPrize')?.value || '';

        const payload = {
          action: 'accept_challenge',
          challengeId: document.getElementById('trnAcceptChallengeId')?.value || '',
          gamenetId,
          gamenetName,
          city,
          teamId: isPartnerMode ? '' : document.getElementById('trnAcceptTeamPicker')?.value || '',
          teamName: document.getElementById('trnAcceptTeamName')?.value || '',
          onlineId: document.getElementById('trnAcceptOnlineId')?.value || '',
          members: document.getElementById('trnAcceptMembers')?.value || '',
          confirmPrize: confirmPrize ? '1' : '0',
          counterPrize,
        };

        try {
          const resp = await postTournamentAction(payload);
          closeModal('accept');
          renderAll();
          const ready = resp.challenge && state.engine.canFormTournamentFromChallenge(resp.challenge);
          showToast(
            ready
              ? 'پذیرش ثبت شد! اکنون می‌توانید تورنومنت و جدول حذفی را به‌صورت خودکار تشکیل دهید.'
              : 'پذیرش چالش با موفقیت ثبت شد.'
          );
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 5. Propose / Edit Prize Agreement
      if (e.target.id === 'trnPrizeForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnPrizeError');
        errEl.hidden = true;
        const targetType = document.getElementById('trnPrizeTargetType').value;
        const targetId = document.getElementById('trnPrizeTargetId').value;
        const summary = document.getElementById('trnPrizeEditSummary').value;
        const prizeType = document.getElementById('trnPrizeEditType').value;

        try {
          if (targetType === 'challenge') {
            await postTournamentAction({
              action: 'propose_prize',
              challengeId: targetId,
              prizeType,
              summary,
            });
          } else {
            await postTournamentAction({
              action: 'update_tournament_prize',
              tournamentId: targetId,
              modeAction: 'propose',
              prizeType,
              summary,
            });
          }
          closeModal('prize');
          renderAll();
          showToast('پیشنهاد جدید جایزه ثبت شد و در انتظار توافق طرفین است.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 6. Auto-Form Tournament from Accepted Challenge
      if (e.target.id === 'trnFormTournamentForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnFormTrnError');
        errEl.hidden = true;
        const formData = new FormData(e.target);
        const payload = { action: 'form_tournament' };
        formData.forEach((v, k) => {
          payload[k] = v;
        });
        payload.confirmPrizeNow = document.getElementById('trnFormConfirmPrizeNow')?.checked ? '1' : '0';

        try {
          const resp = await postTournamentAction(payload);
          if (resp.tournament?.id) state.selectedId = resp.tournament.id;
          closeModal('form-trn');
          switchTab('brackets');
          renderAll();
          showToast('تورنومنت و جدول مسابقات با موفقیت تشکیل شد!');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 7. Quick Enroll Participant in Bracket Sidebar
      if (e.target.id === 'trnEnrollForm') {
        e.preventDefault();
        const t = getSelectedTournament();
        if (!t) return;
        const errEl = document.getElementById('trnEnrollError');
        errEl.hidden = true;

        const teamId = document.getElementById('trnTeamQuickPicker')?.value || '';
        const pickedTeam = teamId ? state.teams.find((x) => x.id === teamId) : null;
        const playerName = document.getElementById('trnPlayerName')?.value || '';
        const onlineId = document.getElementById('trnOnlineId')?.value || '';
        const customerId = document.getElementById('trnCustomerPicker')?.value || '';

        const check = state.engine.validateParticipantInput({ playerName, onlineId }, t);
        if (check.error) {
          errEl.textContent = check.error;
          errEl.hidden = false;
          return;
        }

        try {
          await postTournamentAction({
            action: 'register_player',
            tournamentId: t.id,
            playerName,
            onlineId,
            customerId,
            members: pickedTeam ? JSON.stringify(pickedTeam.members || []) : '',
            gamenetId: state.engine.LOCAL_GAMENET_ID,
            gamenetName: state.engine.LOCAL_GAMENET_NAME,
            city: state.engine.LOCAL_GAMENET_CITY,
          });
          e.target.reset();
          renderAll();
          showToast('شرکت‌کننده با موفقیت به تورنومنت اضافه شد.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 8. Record Match Score & Advance / Crown Champion
      if (e.target.id === 'trnMatchForm') {
        e.preventDefault();
        const t = getSelectedTournament();
        if (!t) return;
        const errEl = document.getElementById('trnMatchError');
        errEl.hidden = true;

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
          closeModal('match');
          renderAll();
          const completed = resp.tournament?.status === 'completed';
          const isH2H = Boolean(resp.tournament?.isHeadToHead);
          showToast(
            completed
              ? isH2H
                ? 'نتیجه دیدار رو‌در‌رو ثبت شد و +۲۰ امتیاز در جدول رتبه‌بندی اعمال گردید!'
                : 'قهرمان رسمی تورنومنت ثبت شد و امتیازات در جدول رتبه‌بندی به‌روزرسانی شد!'
              : 'نتیجه ثبت شد و برنده به مرحله بعد صعود کرد.'
          );
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 9. Send Direct Gaming Center Challenge
      if (e.target.id === 'trnDirectCreateForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnDcCreateError');
        errEl.hidden = true;

        const checkedMembers = Array.from(
          e.target.querySelectorAll('input[name="dcCustomerIds"]:checked')
        ).map((inp) => ({
          name: inp.getAttribute('data-customer-name') || '',
          customerId: inp.value,
          role: 'عضو باشگاه مشتریان',
        }));
        const manualRaw = document.getElementById('trnDcManualMembers')?.value || '';
        const manualMembers = state.engine.parseMembersList(manualRaw);
        const allMembers = [...checkedMembers, ...manualMembers];

        const cat = document.getElementById('trnDcCategory')?.value || 'billiards';
        const isPhysCat = state.engine.isPhysicalCategory(cat);
        const mode = isPhysCat ? 'physical' : document.getElementById('trnDcMode')?.value || 'online';
        const targetId = document.getElementById('trnDcTargetCenter')?.value || '';
        const targetInfo = state.comp.getGamingCenterInfo(targetId);

        const payload = {
          action: 'create_direct_challenge',
          targetGamenetId: targetId,
          targetGamenetName: targetInfo.name,
          category: cat,
          gameId: document.getElementById('trnDcGame')?.value || '',
          mode,
          entryType: document.getElementById('trnDcEntryType')?.value || 'individual',
          format: document.getElementById('trnDcFormat')?.value || '',
          venue: mode === 'physical' ? document.getElementById('trnDcVenue')?.value || '' : '',
          proposedDate: document.getElementById('trnDcDate')?.value || '',
          proposedTime: document.getElementById('trnDcTime')?.value || '',
          prizeType: document.getElementById('trnDcPrizeType')?.value || 'vip_session',
          prizeSummary: document.getElementById('trnDcPrizeSummary')?.value || '',
          notes: document.getElementById('trnDcNotes')?.value || '',
          teamId: document.getElementById('trnDcTeamPicker')?.value || '',
          teamName: document.getElementById('trnDcTeamName')?.value || '',
          onlineId: document.getElementById('trnDcOnlineId')?.value || '',
          members: JSON.stringify(allMembers),
        };

        const check = state.comp.sanitizeDirectChallengeInput({
          ...payload,
          members: allMembers,
        });
        if (check.error) {
          errEl.textContent = check.error;
          errEl.hidden = false;
          return;
        }

        try {
          await postTournamentAction(payload);
          closeModal('direct-create');
          state.filters.directBox = 'all';
          switchTab('direct');
          renderAll();
          showToast(`چالش مستقیم با موفقیت برای «${targetInfo.name}» ارسال شد.`);
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 10. Accept Direct Challenge & Auto-create Head-to-Head Match
      if (e.target.id === 'trnDirectAcceptForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnDcAcceptError');
        errEl.hidden = true;
        try {
          const resp = await postTournamentAction({
            action: 'accept_direct_challenge',
            directId: document.getElementById('trnDcAcceptId')?.value || '',
            teamId: document.getElementById('trnDcAcceptTeamPicker')?.value || '',
            teamName: document.getElementById('trnDcAcceptTeamName')?.value || '',
            onlineId: document.getElementById('trnDcAcceptOnlineId')?.value || '',
            members: document.getElementById('trnDcAcceptMembers')?.value || '',
          });
          closeModal('direct-accept');
          if (resp.tournament?.id) {
            state.selectedId = resp.tournament.id;
            switchTab('brackets');
          }
          renderAll();
          showToast('چالش مستقیم تایید شد و صفحه دیدار رو‌در‌رو آماده ثبت نتیجه است!');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 11. Propose Changes to Direct Challenge Terms
      if (e.target.id === 'trnDirectProposeForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnDcProposeError');
        errEl.hidden = true;
        try {
          await postTournamentAction({
            action: 'propose_direct_changes',
            directId: document.getElementById('trnDcProposeId')?.value || '',
            proposerGamenetId: state.engine.LOCAL_GAMENET_ID,
            proposedDate: document.getElementById('trnDcPropDate')?.value || '',
            proposedTime: document.getElementById('trnDcPropTime')?.value || '',
            format: document.getElementById('trnDcPropFormat')?.value || '',
            venue: document.getElementById('trnDcPropVenue')?.value || '',
            prizeType: document.getElementById('trnDcPropPrizeType')?.value || '',
            prizeSummary: document.getElementById('trnDcPropPrizeSummary')?.value || '',
            notes: document.getElementById('trnDcPropNotes')?.value || '',
          });
          closeModal('direct-propose');
          renderAll();
          showToast('پیشنهاد تغییر شرایط ثبت شد و برای توافق دوطرفه نمایش داده می‌شود.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
        return;
      }

      // 12. Reject Direct Challenge
      if (e.target.id === 'trnDirectRejectForm') {
        e.preventDefault();
        const errEl = document.getElementById('trnDcRejectError');
        errEl.hidden = true;
        try {
          await postTournamentAction({
            action: 'reject_direct_challenge',
            directId: document.getElementById('trnDcRejectId')?.value || '',
            reason: document.getElementById('trnDcRejectReason')?.value || '',
          });
          closeModal('direct-reject');
          renderAll();
          showToast('دعوت‌نامه چالش مستقیم رد شد.');
        } catch (err) {
          errEl.textContent = err.message;
          errEl.hidden = false;
        }
      }
    });
  }

  async function renderTournamentsPage() {
    if (!document.getElementById('mgTournamentsRoot')) return;
    const [engine, ui, comp, compUi, metrics] = await modulesPromise;
    state.engine = engine;
    state.ui = ui;
    state.comp = comp;
    state.compUi = compUi;
    state.metrics = metrics;
    bindEventsOnce();
    await fetchFreshData();
    switchTab(state.activeTab || 'overview');
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
