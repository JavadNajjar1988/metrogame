(function () {
  const DEFAULT_LOYALTY_CONFIG = { milestoneHours: 24, discountPercent: 20 };

  let loyaltyEnginePromise = null;
  function getLoyaltyEngine() {
    if (!loyaltyEnginePromise) {
      loyaltyEnginePromise = import('./loyalty-engine.mjs?v=20261124-8').catch(() => null);
    }
    return loyaltyEnginePromise;
  }

  let currentLoyaltyConfig = { ...DEFAULT_LOYALTY_CONFIG };
  let currentCustomersData = {};

  function sanitizeConfigFallback(raw) {
    const h = Number(raw?.milestoneHours);
    const d = Number(raw?.discountPercent);
    return {
      milestoneHours: Number.isFinite(h) ? Math.max(1, Math.min(200, Math.round(h))) : 24,
      discountPercent: Number.isFinite(d) ? Math.max(1, Math.min(90, Math.round(d))) : 20,
    };
  }

  function computeLoyaltyFallback(customer, rawConfig) {
    const cfg = sanitizeConfigFallback(rawConfig);
    const milestoneSeconds = cfg.milestoneHours * 3600;
    const totalPlaySeconds = Math.max(0, Math.floor(Number(customer?.totalPlaySeconds) || 0));
    const totalPlayHours = Math.round((totalPlaySeconds / 3600) * 10) / 10;
    const earnedRewards = Math.floor(totalPlaySeconds / milestoneSeconds);
    const usedRewards = Math.min(Math.max(0, Math.floor(Number(customer?.usedRewards) || 0)), earnedRewards);
    const availableRewards = Math.max(0, earnedRewards - usedRewards);
    const secondsInCycle = totalPlaySeconds % milestoneSeconds;
    const hoursInCurrentCycle = Math.round((secondsInCycle / 3600) * 10) / 10;
    const hoursRemainingToNext = Math.max(
      0,
      Math.round(((milestoneSeconds - secondsInCycle) / 3600) * 10) / 10
    );
    const progressPercent = Math.min(100, Math.max(0, Math.round((secondsInCycle / milestoneSeconds) * 100)));
    return {
      totalPlaySeconds,
      totalPlayHours,
      milestoneHours: cfg.milestoneHours,
      discountPercent: cfg.discountPercent,
      earnedRewards,
      usedRewards,
      availableRewards,
      hoursInCurrentCycle,
      hoursRemainingToNext,
      progressPercent,
      hasRewardReady: availableRewards > 0,
    };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toFaNum(val) {
    const num = Number(val);
    if (!Number.isFinite(num)) return String(val ?? '۰');
    return num.toLocaleString('fa-IR');
  }

  function invalidateSessionBundle() {
    try {
      sessionStorage.removeItem('mg_bundle_v1');
      sessionStorage.removeItem('mg_sidebar_badges');
    } catch {
      // ignore storage errors
    }
  }

  function syncLoyaltyConfigInputs(config, engine) {
    const sanitize = engine?.sanitizeLoyaltyConfig || sanitizeConfigFallback;
    const safe = sanitize(config);
    currentLoyaltyConfig = safe;
    const hoursInput = document.getElementById('loyaltyMilestoneHours');
    const pctInput = document.getElementById('loyaltyDiscountPercent');
    if (hoursInput) hoursInput.value = String(safe.milestoneHours);
    if (pctInput) pctInput.value = String(safe.discountPercent);
  }

  function renderCustomersTable(jsonData, engine) {
    if (!jsonData || typeof jsonData !== 'object') return;
    currentCustomersData = jsonData;

    const tableEl = document.getElementById('customerTable');
    if (!tableEl) return;
    const tableBody = tableEl.getElementsByTagName('tbody')[0];
    if (!tableBody) return;
    tableBody.innerHTML = '';

    const entries = Object.values(jsonData);
    if (entries.length === 0) {
      const emptyRow = tableBody.insertRow();
      const cell = emptyRow.insertCell(0);
      cell.colSpan = 7;
      cell.style.textAlign = 'center';
      cell.style.padding = '20px';
      cell.textContent = 'هنوز مشتری در باشگاه ثبت نشده است.';
      return;
    }

    const computeLoyalty = engine?.computeCustomerLoyalty || computeLoyaltyFallback;
    let rowNumber = 1;
    entries.forEach((customerData) => {
      const safeId = escapeHtml(customerData.customerId || '');
      const chargeVal =
        customerData.accountCharge !== null && customerData.accountCharge !== undefined
          ? `${toFaNum(parseFloat(customerData.accountCharge))} تومان`
          : '۰ تومان';

      const loyalty = computeLoyalty(customerData, currentLoyaltyConfig);
      const barPct = loyalty.hasRewardReady && loyalty.progressPercent === 0 ? 100 : loyalty.progressPercent;

      const progressHtml = `
        <div class="mg-loyalty-progress-wrap">
          <div class="mg-loyalty-progress-head">
            <strong>${toFaNum(loyalty.totalPlayHours)} ساعت کل</strong>
            <span>${toFaNum(loyalty.hoursInCurrentCycle)} / ${toFaNum(loyalty.milestoneHours)} ساعت</span>
          </div>
          <div class="mg-loyalty-progress-track" role="progressbar" aria-valuenow="${barPct}" aria-valuemin="0" aria-valuemax="100">
            <div class="mg-loyalty-progress-fill ${loyalty.hasRewardReady ? 'is-ready' : ''}" style="width: ${barPct}%;"></div>
          </div>
        </div>
      `;

      const rewardBadgeHtml = loyalty.hasRewardReady
        ? `<span class="mg-loyalty-reward-badge is-ready">🎁 ${toFaNum(loyalty.availableRewards)} تخفیف ${toFaNum(loyalty.discountPercent)}٪ آماده</span>`
        : `<span class="mg-loyalty-reward-badge">${toFaNum(loyalty.hoursRemainingToNext)} ساعت تا تخفیف ${toFaNum(loyalty.discountPercent)}٪</span>`;

      const newRow = tableBody.insertRow();
      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);
      const cell5 = newRow.insertCell(4);
      const cell6 = newRow.insertCell(5);
      const cell7 = newRow.insertCell(6);

      cell1.textContent = toFaNum(rowNumber);
      cell2.innerHTML = `<span class="mg-customer-code-pill">${safeId}</span>`;
      cell3.textContent = customerData.customerName || 'مشتری';
      cell4.textContent = chargeVal;
      cell5.innerHTML = progressHtml;
      cell6.innerHTML = rewardBadgeHtml;
      cell7.innerHTML = `
        <div class="mg-customer-actions-row">
          <button type="button" class="btn btn-round btn-info btn-xs add-playtime-button" data-customer-id="${safeId}" data-customer-name="${encodeURIComponent(customerData.customerName || '')}">
            + ساعت بازی
          </button>
          <button type="button" class="btn btn-round btn-warning btn-xs edit-button" data-customer-id="${safeId}" data-customer-charge="${escapeHtml(customerData.accountCharge ?? 0)}" data-customer-name="${encodeURIComponent(customerData.customerName || '')}">
            <i class="fa fa-pen-to-square"></i> شارژ
          </button>
          <button type="button" class="btn btn-round btn-danger btn-xs delete-button" data-customer-id="${safeId}">
            <i class="fa fa-trash"></i> حذف
          </button>
        </div>
      `;
      rowNumber++;
    });
  }

  window.renderAccountsPage = function renderAccountsPage() {
    try {
      const cachedBundle = sessionStorage.getItem('mg_bundle_v1');
      if (cachedBundle) {
        const parsed = JSON.parse(cachedBundle);
        if (parsed && parsed['loyalty_config.json']) {
          syncLoyaltyConfigInputs(parsed['loyalty_config.json'], null);
        }
        if (parsed && parsed['customer_data.json']) {
          renderCustomersTable(parsed['customer_data.json'], null);
        }
      }
    } catch {
      // ignore cache error
    }

    Promise.allSettled([
      getLoyaltyEngine(),
      fetch('./loyalty_config.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : DEFAULT_LOYALTY_CONFIG)),
      fetch('./customer_data.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})),
    ]).then(([engRes, cfgRes, custRes]) => {
      const engine = engRes.status === 'fulfilled' ? engRes.value : null;
      if (cfgRes.status === 'fulfilled' && cfgRes.value) {
        syncLoyaltyConfigInputs(cfgRes.value, engine);
      }
      if (custRes.status === 'fulfilled' && custRes.value) {
        renderCustomersTable(custRes.value, engine);
      }
    });
  };

  window.renderAccountsPage();

  if (!window.__mgAccountsEventsBound) {
    window.__mgAccountsEventsBound = true;

    // Save loyalty config form
    document.addEventListener('submit', async (event) => {
      if (event.target && event.target.id === 'loyaltyConfigForm') {
        event.preventDefault();
        const milestoneHours = document.getElementById('loyaltyMilestoneHours')?.value || '24';
        const discountPercent = document.getElementById('loyaltyDiscountPercent')?.value || '20';
        const statusEl = document.getElementById('loyaltyConfigStatus');
        if (statusEl) {
          statusEl.textContent = 'در حال ذخیره...';
          statusEl.classList.remove('is-error', 'is-ok');
        }

        try {
          const params = new URLSearchParams();
          params.set('milestoneHours', milestoneHours);
          params.set('discountPercent', discountPercent);
          const res = await fetch('./loyalty_config.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
            body: params.toString(),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok || data.error) {
            if (statusEl) {
              statusEl.textContent = data.error || 'خطا در ذخیره تنظیمات.';
              statusEl.classList.add('is-error');
            }
            return;
          }
          invalidateSessionBundle();
          const engine = await getLoyaltyEngine();
          syncLoyaltyConfigInputs(data.config || { milestoneHours, discountPercent }, engine);
          renderCustomersTable(currentCustomersData, engine);
          if (statusEl) {
            statusEl.textContent = `ذخیره شد (هر ${toFaNum(currentLoyaltyConfig.milestoneHours)} ساعت = ${toFaNum(currentLoyaltyConfig.discountPercent)}٪ تخفیف)`;
            statusEl.classList.add('is-ok');
          }
        } catch {
          if (statusEl) {
            statusEl.textContent = 'خطا در ارتباط با سرور.';
            statusEl.classList.add('is-error');
          }
        }
      }
    });

    // Delete customer
    document.addEventListener('click', (event) => {
      const delBtn = event.target.closest('.delete-button');
      if (delBtn && delBtn.hasAttribute('data-customer-id') && document.getElementById('customerTable')) {
        const customerId = delBtn.getAttribute('data-customer-id');
        const rowToRemove = delBtn.closest('tr');
        if (rowToRemove) rowToRemove.remove();
        fetch('./delete_customer.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `customerId=${encodeURIComponent(customerId)}`,
        })
          .then(() => {
            invalidateSessionBundle();
            window.renderAccountsPage();
          })
          .catch(() => {});
      }
    });

    // Edit customer charge modal
    document.addEventListener('click', (event) => {
      const editBtn = event.target.closest('.edit-button');
      if (editBtn && editBtn.hasAttribute('data-customer-id')) {
        const customerId = editBtn.getAttribute('data-customer-id');
        const customerModal = document.getElementById('editCustomerModal');
        const customerName = decodeURIComponent(editBtn.getAttribute('data-customer-name') || '');
        if (!customerModal) return;

        customerModal.style.display = 'block';
        const editCustomerModalHeader = document.getElementById('editCustomerModalhesder');
        if (editCustomerModalHeader) {
          editCustomerModalHeader.innerHTML = `
            <h4>
              <i class="fa fa-file-user"></i>
              شارژ حساب ${escapeHtml(customerName)}
            </h4>
          `;
        }

        const closeBtn = customerModal.querySelector('.close');
        if (closeBtn) {
          closeBtn.onclick = () => {
            customerModal.style.display = 'none';
          };
        }

        const form = document.getElementById('editCustomerForm');
        if (form) {
          form.onsubmit = (e) => {
            e.preventDefault();
            const accountCharge = document.getElementById('editAcountCharge')?.value || '0';
            fetch('./editCustomerCharge.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `accountCharge=${encodeURIComponent(accountCharge)}&customerId=${encodeURIComponent(customerId)}`,
            })
              .then(() => {
                invalidateSessionBundle();
                customerModal.style.display = 'none';
                window.renderAccountsPage();
              })
              .catch(() => {});
          };
        }
      }
    });

    // Manual "+ ساعت بازی" modal
    document.addEventListener('click', (event) => {
      const playBtn = event.target.closest('.add-playtime-button');
      if (playBtn && playBtn.hasAttribute('data-customer-id')) {
        const customerId = playBtn.getAttribute('data-customer-id');
        const customerName = decodeURIComponent(playBtn.getAttribute('data-customer-name') || '');
        const modal = document.getElementById('addPlaytimeModal');
        if (!modal) return;

        modal.style.display = 'block';
        const header = document.getElementById('addPlaytimeModalHeader');
        if (header) {
          header.innerHTML = `
            <h4>ثبت ساعت بازی برای ${escapeHtml(customerName)} (کد ${escapeHtml(customerId)})</h4>
          `;
        }
        const input = document.getElementById('addPlaytimeHoursInput');
        if (input) {
          input.value = '1';
          input.focus();
        }

        const closeBtn = modal.querySelector('.close');
        if (closeBtn) {
          closeBtn.onclick = () => {
            modal.style.display = 'none';
          };
        }

        const form = document.getElementById('addPlaytimeForm');
        if (form) {
          form.onsubmit = async (e) => {
            e.preventDefault();
            const addHours = document.getElementById('addPlaytimeHoursInput')?.value || '0';
            const params = new URLSearchParams();
            params.set('customerId', customerId);
            params.set('addHours', addHours);
            try {
              const res = await fetch('./customer_loyalty.php', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  Accept: 'application/json',
                },
                body: params.toString(),
              });
              if (res.ok) {
                invalidateSessionBundle();
                modal.style.display = 'none';
                window.renderAccountsPage();
              }
            } catch {
              // ignore network error
            }
          };
        }
      }
    });
  }
})();
