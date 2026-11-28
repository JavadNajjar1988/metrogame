window.convertToPersian = function convertToPersian(number) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(number ?? '').replace(/\d/g, (digit) => persianDigits[Number(digit)]);
};

function toEnglishDigits(str) {
  return String(str ?? '')
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .trim();
}

function escapeHtmlSafe(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function invalidateTablesCache() {
  window.__mgBundlePromise = null;
  window.__mgJsonPromises = {};
  try {
    sessionStorage.removeItem('mg_bundle_v1');
    sessionStorage.removeItem('mg_sidebar_badges');
    sessionStorage.setItem('mg_return_to_tables', '1');
  } catch {
    // ignore storage errors
  }
}

window.renderTablesWorkspace = function renderTablesWorkspace() {
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

  function setFieldError(inputEl, errorElId, message) {
    const errEl = document.getElementById(errorElId);
    if (errEl) errEl.textContent = message || '';
    if (inputEl) {
      if (message) {
        inputEl.classList.add('is-invalid');
        inputEl.setAttribute('aria-invalid', 'true');
        if (typeof inputEl.setCustomValidity === 'function') {
          inputEl.setCustomValidity(message);
        }
      } else {
        inputEl.classList.remove('is-invalid');
        inputEl.removeAttribute('aria-invalid');
        if (typeof inputEl.setCustomValidity === 'function') {
          inputEl.setCustomValidity('');
        }
      }
    }
  }

  function clearRegistrationErrors() {
    setFieldError(document.getElementById('tableNumber'), 'tableNumberError', '');
    setFieldError(document.getElementById('consoleType'), 'consoleTypeError', '');
    setFieldError(document.getElementById('priceType'), 'priceTypeError', '');
    setFieldError(document.getElementById('pre-payment-cost'), 'prePaymentCostError', '');
  }

  function syncPrePaymentState(isPrePay) {
    if (!postRadio || !preRadio || !preCostInput) return;
    postRadio.checked = !isPrePay;
    preRadio.checked = isPrePay;
    preCostInput.disabled = !isPrePay;
    preCostInput.required = isPrePay;
    if (isPrePay) {
      preCostInput.setAttribute('aria-required', 'true');
      if (prepayCostGroup) prepayCostGroup.style.display = '';
      preRadio.closest('.mg-radio-card')?.classList.add('is-selected');
      postRadio.closest('.mg-radio-card')?.classList.remove('is-selected');
    } else {
      preCostInput.removeAttribute('aria-required');
      preCostInput.value = '';
      setFieldError(preCostInput, 'prePaymentCostError', '');
      if (prepayCostGroup) prepayCostGroup.style.display = 'none';
      postRadio.closest('.mg-radio-card')?.classList.add('is-selected');
      preRadio.closest('.mg-radio-card')?.classList.remove('is-selected');
    }
  }

  // Bind post-payment vs pre-payment radio toggle
  const postRadio = document.getElementById('post-payment');
  const preRadio = document.getElementById('pre-payment');
  const preCostInput = document.getElementById('pre-payment-cost');
  const prepayCostGroup = document.getElementById('prepayCostGroup');

  if (postRadio && preRadio && preCostInput && !postRadio.dataset.bound) {
    postRadio.dataset.bound = 'true';
    syncPrePaymentState(Boolean(preRadio.checked));
    postRadio.addEventListener('change', function () {
      if (this.checked) {
        syncPrePaymentState(false);
      }
    });
    preRadio.addEventListener('change', function () {
      if (this.checked) {
        syncPrePaymentState(true);
        preCostInput.focus();
      }
    });
  }

  // Bind live validation clearing on registration form inputs
  const tableInputEl = document.getElementById('tableNumber');
  const consoleSelectEl = document.getElementById('consoleType');
  const priceSelectEl = document.getElementById('priceType');

  if (tableInputEl && !tableInputEl.dataset.boundValidation) {
    tableInputEl.dataset.boundValidation = 'true';
    tableInputEl.addEventListener('input', () => {
      if (toEnglishDigits(tableInputEl.value)) {
        setFieldError(tableInputEl, 'tableNumberError', '');
      }
    });
  }
  if (consoleSelectEl && !consoleSelectEl.dataset.boundValidation) {
    consoleSelectEl.dataset.boundValidation = 'true';
    consoleSelectEl.addEventListener('change', () => {
      if (consoleSelectEl.value.trim()) {
        setFieldError(consoleSelectEl, 'consoleTypeError', '');
      }
    });
  }
  if (priceSelectEl && !priceSelectEl.dataset.boundValidation) {
    priceSelectEl.dataset.boundValidation = 'true';
    priceSelectEl.addEventListener('change', () => {
      if (priceSelectEl.value.trim()) {
        setFieldError(priceSelectEl, 'priceTypeError', '');
      }
    });
  }
  if (preCostInput && !preCostInput.dataset.boundValidation) {
    preCostInput.dataset.boundValidation = 'true';
    preCostInput.addEventListener('input', () => {
      const cleaned = toEnglishDigits(preCostInput.value).replace(/[,٬\s]/g, '');
      if (cleaned && Number.isFinite(Number(cleaned)) && Number(cleaned) > 0) {
        setFieldError(preCostInput, 'prePaymentCostError', '');
      }
    });
  }

  function validateRegistrationFields() {
    clearRegistrationErrors();
    const tableInput = document.getElementById('tableNumber');
    const consoleSelect = document.getElementById('consoleType');
    const priceSelect = document.getElementById('priceType');

    const tableNumberVal = toEnglishDigits(tableInput ? tableInput.value : '');
    const consoleTypeVal = consoleSelect ? consoleSelect.value.trim() : '';
    const priceTypeVal = priceSelect ? priceSelect.value.trim() : '';
    const isPrePay = Boolean(preRadio && preRadio.checked);
    const preCostVal = toEnglishDigits(preCostInput ? preCostInput.value : '').replace(/[,٬\s]/g, '');
    const preCostNum = Number(preCostVal);

    let firstInvalidEl = null;
    let firstMessage = '';

    if (!tableNumberVal) {
      const msg = 'لطفاً شماره میز را وارد کنید.';
      setFieldError(tableInput, 'tableNumberError', msg);
      if (!firstInvalidEl) {
        firstInvalidEl = tableInput;
        firstMessage = msg;
      }
    }
    if (!consoleTypeVal) {
      const msg = 'لطفاً کنسول بازی را انتخاب کنید.';
      setFieldError(consoleSelect, 'consoleTypeError', msg);
      if (!firstInvalidEl) {
        firstInvalidEl = consoleSelect;
        firstMessage = msg;
      }
    }
    if (!priceTypeVal) {
      const msg = 'لطفاً تعداد دسته / تعرفه را انتخاب کنید.';
      setFieldError(priceSelect, 'priceTypeError', msg);
      if (!firstInvalidEl) {
        firstInvalidEl = priceSelect;
        firstMessage = msg;
      }
    }
    if (isPrePay) {
      if (!preCostVal) {
        const msg = 'در حالت پیش‌پرداخت، وارد کردن مبلغ پیش‌پرداخت الزامی است.';
        setFieldError(preCostInput, 'prePaymentCostError', msg);
        if (!firstInvalidEl) {
          firstInvalidEl = preCostInput;
          firstMessage = msg;
        }
      } else if (!Number.isFinite(preCostNum) || preCostNum <= 0) {
        const msg = 'مبلغ پیش‌پرداخت باید عددی معتبر و بزرگ‌تر از صفر باشد.';
        setFieldError(preCostInput, 'prePaymentCostError', msg);
        if (!firstInvalidEl) {
          firstInvalidEl = preCostInput;
          firstMessage = msg;
        }
      }
    }

    return {
      valid: !firstInvalidEl,
      firstInvalidEl,
      firstMessage,
      values: {
        tableNumberVal,
        consoleTypeVal,
        priceTypeVal,
        isPrePay,
        preCostVal,
      },
    };
  }

  // Bind Table Registration Form (#reservationForm / form[action="process.php"])
  const reservationForm =
    document.getElementById('reservationForm') ||
    document.querySelector('form[action="process.php"]');
  if (reservationForm && !reservationForm.dataset.boundSubmit) {
    reservationForm.dataset.boundSubmit = 'true';
    reservationForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      e.stopPropagation();

      const submitBtn = document.getElementById('startReservationButton');
      const validation = validateRegistrationFields();

      if (!validation.valid) {
        showToast(validation.firstMessage);
        if (validation.firstInvalidEl) validation.firstInvalidEl.focus();
        return;
      }

      const { tableNumberVal, consoleTypeVal, priceTypeVal, isPrePay, preCostVal } =
        validation.values;

      const customerSelectEl = document.getElementById('reservationCustomerSelect');
      const selectedCustomerId = customerSelectEl ? customerSelectEl.value.trim() : '';

      const formData = new FormData();
      formData.set('tableNumber', tableNumberVal);
      formData.set('table-number', tableNumberVal);
      formData.set('consoleType', consoleTypeVal);
      formData.set('priceType', priceTypeVal);
      if (selectedCustomerId) {
        formData.set('customerId', selectedCustomerId);
      }
      if (isPrePay) {
        formData.set('pre-payment', 'pre-payment');
        formData.set('paymentType', 'pre-payment');
        formData.set('pre-payment-cost', preCostVal);
      } else {
        formData.set('post-payment', 'post-payment');
        formData.set('paymentType', 'post-payment');
      }

      if (submitBtn) submitBtn.disabled = true;
      try {
        const response = await fetch('./process.php', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: formData,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.error) {
          showToast(data.error || 'خطا در ثبت میز. لطفاً مقادیر را بررسی کنید.');
          return;
        }

        showToast(`میز ${convertToPersian(tableNumberVal)} با موفقیت ثبت شد.`);
        reservationForm.reset();
        clearRegistrationErrors();
        syncPrePaymentState(false);

        // Reset any active table payment filter so the newly added table is always visible
        const allFilterBtn = document.querySelector('[data-table-filter="all"]');
        if (allFilterBtn && !allFilterBtn.classList.contains('active')) {
          allFilterBtn.click();
        }
        const searchInput = document.getElementById('dashboardSearch');
        if (searchInput && searchInput.value) {
          searchInput.value = '';
        }

        invalidateTablesCache();
        await window.renderTablesWorkspace({ forceFresh: true });
        window.dispatchEvent(new CustomEvent('mg:tables-updated'));
      } catch {
        showToast('خطا در ارتباط با سرور هنگام ثبت میز.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  const CONSOLE_LABELS = {
    ps50: 'پلی‌استیشن ۵',
    ps4: 'پلی‌استیشن ۴',
    xbox: 'ایکس‌باکس',
    computer: 'سیستم PC',
    'pool-table': 'بیلیارد',
    foosball: 'فوتبال دستی',
    jewelry: 'وی‌آر / VIP',
  };

  const PRICE_LABELS = {
    one_player_price: 'یک نفره',
    two_player_price: 'دو نفره',
    three_player_price: 'سه نفره',
    four_player_price: 'چهار نفره',
  };

  function highlightCard(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    const card = container.querySelector('.charge-modal-content, .modal-content') || container;
    card.classList.add('card-highlight');
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => card.classList.remove('card-highlight'), 1800);
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

  const opts = arguments[0] && typeof arguments[0] === 'object' ? arguments[0] : {};
  const forceFresh = Boolean(opts.forceFresh);

  if (forceFresh) {
    window.__mgBundlePromise = null;
    window.__mgJsonPromises = {};
  }

  const getBundleMap = () => {
    if (!window.__mgBundlePromise) {
      const cacheBust = forceFresh ? `?_=${Date.now()}` : '';
      window.__mgBundlePromise = fetch(`./bundle.json${cacheBust}`, { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((bundle) => {
          if (bundle && typeof bundle === 'object') {
            try {
              sessionStorage.setItem('mg_bundle_v1', JSON.stringify(bundle));
            } catch {
              // ignore storage quota errors
            }
          }
          return bundle;
        })
        .catch(() => null);
    }
    return window.__mgBundlePromise;
  };

  const fetchSharedJson = (url, fallback) => {
    const cleanKey = String(url).replace(/^\.\//, '');
    window.__mgJsonPromises = window.__mgJsonPromises || {};
    if (!window.__mgJsonPromises[url]) {
      window.__mgJsonPromises[url] = getBundleMap()
        .then((bundle) => {
          if (bundle && cleanKey in bundle) return bundle[cleanKey];
          return fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : fallback));
        })
        .catch(() => fallback);
    }
    return window.__mgJsonPromises[url];
  };

  return Promise.all([
    fetchSharedJson('./data.json', { consoles: [] }),
    fetchSharedJson('./reservations.json', []),
    fetchSharedJson('./products.json', []),
    fetchSharedJson('./clickTime.json', []),
    fetchSharedJson('./finishTime.json', []),
    fetchSharedJson('./buffet_temporary.json', []),
    fetchSharedJson('./gamenet_layout.json', null),
    fetchSharedJson('./customer_data.json', {}),
    fetchSharedJson('./loyalty_config.json', { milestoneHours: 24, discountPercent: 20 }),
    import('./gamenet-3d-engine.mjs?v=20261126-8').catch(() => null),
    import('./loyalty-engine.mjs?v=20261124-7').catch(() => null),
  ])
    .then(function ([
      dataJson,
      reservationsJson,
      productsJson,
      clickTimesJson,
      finishTimesJson,
      buffetTempJson,
      layoutJson,
      customersJson,
      loyaltyConfigJson,
      engine3dMod,
      loyaltyMod,
    ]) {
      // Clear any previously running row timer intervals before re-rendering
      if (Array.isArray(window.__mgTableTimerIntervals)) {
        window.__mgTableTimerIntervals.forEach((id) => clearInterval(id));
      }
      window.__mgTableTimerIntervals = [];

      const consolesList = Array.isArray(dataJson?.consoles) ? dataJson.consoles : [];
      const reservations = Array.isArray(reservationsJson) ? reservationsJson : [];
      const products = Array.isArray(productsJson) ? productsJson : [];
      const clickTimes = Array.isArray(clickTimesJson) ? clickTimesJson : [];
      const finishTimes = Array.isArray(finishTimesJson) ? finishTimesJson : [];
      const customersMap = customersJson && typeof customersJson === 'object' ? customersJson : {};
      const loyaltyConfig =
        loyaltyMod && typeof loyaltyMod.sanitizeLoyaltyConfig === 'function'
          ? loyaltyMod.sanitizeLoyaltyConfig(loyaltyConfigJson)
          : { milestoneHours: 24, discountPercent: 20 };

      const effectiveLayout =
        layoutJson && Array.isArray(layoutJson.items)
          ? layoutJson
          : engine3dMod && typeof engine3dMod.createStarterLayout === 'function'
            ? engine3dMod.createStarterLayout('pro-arena')
            : { items: [] };

      const mergedTables =
        engine3dMod && typeof engine3dMod.mergeTablesWith3DStations === 'function'
          ? engine3dMod.mergeTablesWith3DStations(reservations, effectiveLayout)
          : {
              activeRows: reservations.map((res) => ({
                status: 'active',
                tableNumber: String(res.tableNumber),
                reservation: res,
                from3D: false,
                station3D: null,
              })),
              idleRows: [],
              allRows: reservations.map((res) => ({
                status: 'active',
                tableNumber: String(res.tableNumber),
                reservation: res,
                from3D: false,
                station3D: null,
              })),
              totalStations3D: 0,
            };

      // Populate optional registered club customer selector inside registration form
      const resCustomerSelect = document.getElementById('reservationCustomerSelect');
      if (resCustomerSelect) {
        const prevVal = resCustomerSelect.value;
        resCustomerSelect.innerHTML = '<option value="">مشتری مهمان (بدون اشتراک)</option>';
        Object.values(customersMap).forEach((cust) => {
          if (!cust || !cust.customerId) return;
          const opt = document.createElement('option');
          opt.value = String(cust.customerId);
          const loyalty =
            loyaltyMod && typeof loyaltyMod.computeCustomerLoyalty === 'function'
              ? loyaltyMod.computeCustomerLoyalty(cust, loyaltyConfig)
              : null;
          const rewardHint =
            loyalty && loyalty.availableRewards > 0
              ? ` · 🎁 تخفیف ${convertToPersian(loyalty.discountPercent)}٪ آماده`
              : loyalty
                ? ` · ${convertToPersian(loyalty.totalPlayHours)}/${convertToPersian(loyalty.milestoneHours)} ساعت`
                : '';
          opt.textContent = `${cust.customerName} (کد ${convertToPersian(cust.customerId)})${rewardHint}`;
          resCustomerSelect.appendChild(opt);
        });
        if (prevVal && Object.prototype.hasOwnProperty.call(customersMap, prevVal)) {
          resCustomerSelect.value = prevVal;
        }
      }

      function getHourlyPrice(consoleType, priceType) {
        const found = consolesList.find((c) => c.name === consoleType);
        const rate = found ? Number(found[priceType]) : 0;
        return rate > 0 ? rate : 60000;
      }

      // Immediately sync active tables badge counters in header/sidebar/section
      const countTag = document.getElementById('activeTableFilteredCount');
      if (countTag) {
        const totalAll = mergedTables.allRows.length;
        countTag.textContent =
          mergedTables.idleRows.length > 0
            ? `${convertToPersian(reservations.length)} فعال · ${convertToPersian(totalAll)} ایستگاه سالن`
            : `${convertToPersian(reservations.length)} میز فعال`;
      }
      const navTablesBadge = document.getElementById('navTablesBadge');
      if (navTablesBadge) {
        navTablesBadge.textContent = convertToPersian(reservations.length);
      }

      // 1. Populate Buffet Product Dropdown immediately
      const productDropdown = document.getElementById('productDropdown');
      if (productDropdown) {
        productDropdown.innerHTML = '';
        if (products.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'محصولی ثبت نشده است';
          productDropdown.appendChild(opt);
        } else {
          products.forEach((product) => {
            const option = document.createElement('option');
            option.value = product.productCode;
            const priceVal = Number(product.unitPrice ?? product.price ?? 0);
            const priceFormatted = priceVal.toLocaleString('fa-IR');
            option.textContent = `${product.title} — ${priceFormatted} تومان`;
            productDropdown.appendChild(option);
          });
        }
      }

      // 2. Populate Table Selectors inside Dedicated Charge & Buffet Cards
      const chargeTableSelect = document.getElementById('chargeTableSelect');
      const buffetTableSelect = document.getElementById('buffetTableSelect');

      function populateTableSelectors() {
        [chargeTableSelect, buffetTableSelect].forEach((selectEl) => {
          if (!selectEl) return;
          selectEl.innerHTML = '';
          if (reservations.length === 0) {
            const emptyOpt = document.createElement('option');
            emptyOpt.value = '';
            emptyOpt.textContent = 'میز فعالی وجود ندارد';
            selectEl.appendChild(emptyOpt);
            return;
          }
          reservations.forEach((res) => {
            const opt = document.createElement('option');
            opt.value = res.tableNumber;
            const cLabel = CONSOLE_LABELS[res.consoleType] || res.consoleType;
            const pMode = res.prePayment === 'pre-payment' ? 'پیش‌پرداخت' : 'پس‌کرایه';
            opt.textContent = `میز ${convertToPersian(res.tableNumber)} (${cLabel} - ${pMode})`;
            selectEl.appendChild(opt);
          });
        });
      }
      populateTableSelectors();

      // Update card titles when dropdown changes
      if (chargeTableSelect && !chargeTableSelect.dataset.boundChange) {
        chargeTableSelect.dataset.boundChange = 'true';
        chargeTableSelect.addEventListener('change', function () {
          const tNum = this.value;
          const titleEl = document.getElementById('chargeFormTitle');
          if (titleEl && tNum) {
            titleEl.textContent = `شارژ زمان و اعتبار برای میز ${convertToPersian(tNum)}`;
          }
        });
      }

      if (buffetTableSelect && !buffetTableSelect.dataset.boundChange) {
        buffetTableSelect.dataset.boundChange = 'true';
        buffetTableSelect.addEventListener('change', function () {
          const tNum = this.value;
          const titleEl = document.getElementById('formTitle');
          if (titleEl && tNum) {
            titleEl.textContent = `ثبت سفارش بوفه برای میز ${convertToPersian(tNum)}`;
          }
        });
      }

      // Keep latest data accessible to bound form submit handlers
      window.__mgLatestReservations = reservations;
      window.__mgLatestConsoles = consolesList;

      // 3. Bind Dedicated Buffet Form Submit (#buyForm)
      const buyForm = document.getElementById('buyForm');
      if (buyForm && !buyForm.dataset.bound) {
        buyForm.dataset.bound = 'true';
        buyForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const currentReservations = window.__mgLatestReservations || reservations;
          const targetTable =
            (buffetTableSelect && buffetTableSelect.value) ||
            buyForm.dataset.selectedTable ||
            (currentReservations[0] && currentReservations[0].tableNumber);

          if (!targetTable) {
            showToast('ابتدا یک میز فعال ثبت یا انتخاب کنید.');
            return;
          }

          const formData = new FormData(buyForm);
          formData.set('tableNumber', targetTable);
          if (productDropdown) {
            formData.set('productCode', productDropdown.value);
          }

          fetch('buffet_temporary.php', {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: formData,
          })
            .then((response) => response.json())
            .then(async (resData) => {
              if (resData && resData.error) {
                showToast(resData.error);
                return;
              }
              showToast(`سفارش بوفه برای میز ${convertToPersian(targetTable)} با موفقیت ثبت شد.`);
              invalidateTablesCache();
              await window.renderTablesWorkspace({ forceFresh: true });
              window.dispatchEvent(new CustomEvent('mg:tables-updated'));
            })
            .catch(() => {
              showToast('خطا در ثبت سفارش بوفه.');
            });
        });
      }

      // 4. Bind Dedicated Charge Form Submit (#chargeForm)
      const chargeForm = document.getElementById('chargeForm');
      if (chargeForm && !chargeForm.dataset.bound) {
        chargeForm.dataset.bound = 'true';
        chargeForm.addEventListener('submit', async function (e) {
          e.preventDefault();
          const currentReservations = window.__mgLatestReservations || reservations;
          const currentConsoles = window.__mgLatestConsoles || consolesList;
          const targetTable =
            (chargeTableSelect && chargeTableSelect.value) ||
            chargeForm.dataset.selectedTable ||
            (currentReservations[0] && currentReservations[0].tableNumber);

          if (!targetTable) {
            showToast('ابتدا یک میز فعال برای شارژ انتخاب کنید.');
            return;
          }

          const targetRes = currentReservations.find(
            (r) => String(r.tableNumber) === String(targetTable)
          );
          const foundConsole = targetRes
            ? currentConsoles.find((c) => c.name === targetRes.consoleType)
            : null;
          const hourlyPrice =
            foundConsole && Number(foundConsole[targetRes.priceType]) > 0
              ? Number(foundConsole[targetRes.priceType])
              : 60000;

          const chargeAmountInput = document.getElementById('chargeAmount');
          const chargeTimeInput = document.getElementById('chargeTime');
          const chargeAmount = Number(toEnglishDigits(chargeAmountInput ? chargeAmountInput.value : 0)) || 0;
          const chargeMinutes = Number(toEnglishDigits(chargeTimeInput ? chargeTimeInput.value : 0)) || 0;
          const charge_Time = chargeMinutes * 60 + Math.round((3600 * chargeAmount) / hourlyPrice);

          if (charge_Time <= 0) {
            showToast('لطفاً مبلغ شارژ یا زمان (دقیقه) را وارد نمایید.');
            return;
          }

          try {
            const resp = await postFormUrlEncoded('./charging.php', {
              tableNumber: targetTable,
              charge_Time: charge_Time,
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok || data.error) {
              showToast(data.error || 'خطا در ارتباط با سرور هنگام شارژ میز.');
              return;
            }
            showToast(`شارژ میز ${convertToPersian(targetTable)} با موفقیت اعمال شد.`);
            invalidateTablesCache();
            await window.renderTablesWorkspace({ forceFresh: true });
            window.dispatchEvent(new CustomEvent('mg:tables-updated'));
          } catch {
            showToast('خطا در ارتباط با سرور هنگام شارژ میز.');
          }
        });
      }

      // 5. Render Active Tables & Synced 3D Floor Plan Stations inside #reservationTableBody
      const tableBody = document.getElementById('reservationTableBody');
      if (!tableBody) return;
      tableBody.innerHTML = '';

      if (mergedTables.allRows.length === 0) {
        tableBody.innerHTML = `
          <tr class="mg-empty-row">
            <td colspan="7" class="mg-empty-state">
              هیچ میز فعال یا ایستگاه سه‌بعدی‌ای ثبت نشده است. از فرم «ثبت و راه‌اندازی میز» یا بخش «گیم نت من» استفاده کنید.
            </td>
          </tr>
        `;
        return;
      }

      let rowNumber = 1;

      mergedTables.activeRows.forEach(function (activeMeta) {
        const reservation = activeMeta.reservation;
        const prePaymentCost = Number(reservation.prePaymentCost) || 0;
        const consoleType = reservation.consoleType;
        const priceType = reservation.priceType;
        const hourlyPrice = getHourlyPrice(consoleType, priceType);
        const timeSeconds = Math.round((3600 * prePaymentCost) / hourlyPrice);

        const isPrePayment =
          reservation.prePayment === 'pre-payment' || reservation.paymentType === 'pre-payment';
        const isPostPayment =
          !isPrePayment &&
          (reservation.postPayment === 'post-payment' || reservation.paymentType === 'post-payment' || !reservation.prePayment);
        const paymentModeKey = isPrePayment ? 'pre-payment' : 'post-payment';

        // Calculate buffet items count for this table (supports both object map and array)
        const tableBuffetItems = Array.isArray(buffetTempJson)
          ? buffetTempJson.filter((b) => String(b.tableNumber) === String(reservation.tableNumber))
          : buffetTempJson && Array.isArray(buffetTempJson[String(reservation.tableNumber)])
          ? buffetTempJson[String(reservation.tableNumber)]
          : [];
        const tableBuffetCount = tableBuffetItems.reduce(
          (sum, item) => sum + (Number(item.quantity) || 1),
          0
        );

        // Live Timer Logic for Post-Payment (Count Up)
        let elapsedTime = 0;
        let timerInterval = null;
        let clickTime = null;

        function updateTimer() {
          const safeElapsed = Math.max(0, elapsedTime);
          const hours = Math.floor(safeElapsed / 3600);
          const minutes = Math.floor((safeElapsed % 3600) / 60);
          const seconds = safeElapsed % 60;
          const element = document.getElementById(`timer${reservation.tableNumber}`);
          if (!element) return;
          element.textContent =
            (hours < 10 ? '۰' : '') +
            hours.toLocaleString('fa-IR', { useGrouping: false }) +
            ':' +
            (minutes < 10 ? '۰' : '') +
            minutes.toLocaleString('fa-IR', { useGrouping: false }) +
            ':' +
            (seconds < 10 ? '۰' : '') +
            seconds.toLocaleString('fa-IR', { useGrouping: false });
        }

        function startTimer() {
          elapsedTime = Math.max(0, Math.floor(Date.now() / 1000) - clickTime);
          updateTimer();
          timerInterval = setInterval(function () {
            elapsedTime = Math.max(0, Math.floor(Date.now() / 1000) - clickTime);
            updateTimer();
          }, 1000);
          window.__mgTableTimerIntervals.push(timerInterval);
        }

        function loadTimer(tableNumber) {
          const tableData = clickTimes.find((item) => String(item.tableNumber) === String(tableNumber));
          if (tableData && Number(tableData.clickTime) > 0) {
            clickTime = parseInt(tableData.clickTime, 10);
            startTimer();
          }
        }

        function stopTimer() {
          if (timerInterval) clearInterval(timerInterval);
          updateTimer();
          return elapsedTime;
        }

        // Live Timer Logic for Pre-Payment (Countdown)
        let elapesd = 0;
        let finishTime = null;
        let timeinterval = null;

        function updateTime() {
          const safeRemaining = Math.max(0, elapesd);
          const hours = Math.floor(safeRemaining / 3600);
          const minutes = Math.floor((safeRemaining % 3600) / 60);
          const seconds = safeRemaining % 60;
          const element = document.getElementById(`PreTime${reservation.tableNumber}`);
          if (!element) return;
          element.textContent =
            (hours < 10 ? '۰' : '') +
            hours.toLocaleString('fa-IR', { useGrouping: false }) +
            ':' +
            (minutes < 10 ? '۰' : '') +
            minutes.toLocaleString('fa-IR', { useGrouping: false }) +
            ':' +
            (seconds < 10 ? '۰' : '') +
            seconds.toLocaleString('fa-IR', { useGrouping: false });
        }

        function startTime() {
          elapesd = finishTime - Math.floor(Date.now() / 1000);
          updateTime();
          timeinterval = setInterval(function () {
            elapesd = finishTime - Math.floor(Date.now() / 1000);
            updateTime();

            if (elapesd <= 0) {
              clearInterval(timeinterval);
              elapesd = 0;
              updateTime();
              finishTime = 0;
              const alarmSound = document.getElementById('alarmSound');
              if (alarmSound && typeof alarmSound.play === 'function') {
                alarmSound.play().catch(() => {});
              }
              showToast(`پایان زمان میز ${convertToPersian(reservation.tableNumber)}`);
            }
          }, 1000);
          window.__mgTableTimerIntervals.push(timeinterval);
        }

        function loadTime(tableNumber) {
          const table = finishTimes.find((item) => String(item.tableNumber) === String(tableNumber));
          if (table && Number(table.finishTime) > 0) {
            finishTime = parseInt(table.finishTime, 10);
            startTime();
          }
        }

        function displayTime(res) {
          if (isPostPayment) {
            setTimeout(() => loadTimer(res.tableNumber), 0);
            return `<div class="timer" id="timer${res.tableNumber}">۰۰:۰۰:۰۰</div>`;
          } else if (isPrePayment) {
            setTimeout(() => loadTime(res.tableNumber), 0);
            return `<div class="timer2" id="PreTime${res.tableNumber}">۰۰:۰۰:۰۰</div>`;
          } else {
            return 'زمان نامشخص';
          }
        }

        const timeText = displayTime(reservation);
        const consoleLabel = CONSOLE_LABELS[consoleType] || consoleType;
        const priceLabel = PRICE_LABELS[priceType] || 'استاندارد';
        const payModeLabel = isPrePayment ? 'پیش‌پرداخت' : 'پس‌کرایه';
        const buffetBadgeHtml =
          tableBuffetCount > 0
            ? ` <span class="mg-nav-badge badge-Highlight">${convertToPersian(tableBuffetCount)}</span>`
            : '';

        const actionsHtml = isPostPayment
          ? '<td class="nowrap"><div class="mg-actions-cell">' +
            '<a href="#" class="btn btn-success btn-xs start-button">▶ شــروع</a>' +
            '<a href="#" class="btn btn-danger btn-xs end-button">■ پایان و فاکتور</a>' +
            '</div></td>'
          : isPrePayment
          ? '<td class="nowrap"><div class="mg-actions-cell">' +
            '<a href="#" class="btn btn-success btn-xs start-button">▶ شــروع</a>' +
            '<a href="#" class="btn btn-danger btn-xs end-button">■ پایان و فاکتور</a>' +
            '<a href="#" class="btn btn-info btn-xs charge-button">⚡ شارژ مجدد</a>' +
            '</div></td>'
          : '<td class="nowrap">وضعیت نامعلوم</td>';

        const linkedCust =
          reservation.customerId && Object.prototype.hasOwnProperty.call(customersMap, String(reservation.customerId))
            ? customersMap[String(reservation.customerId)]
            : null;
        const customerBadgeHtml = linkedCust
          ? `<span class="mg-table-member-pill" title="مشتری عضو باشگاه">${escapeHtmlSafe(linkedCust.customerName)}</span>`
          : '';
        const sync3dPillHtml = activeMeta.from3D
          ? '<span class="mg-table-3d-pill" title="متصل به نقشه سه‌بعدی گیم‌نت من">3D</span>'
          : '';

        const newRow = document.createElement('tr');
        newRow.setAttribute('data-table', String(reservation.tableNumber));
        newRow.setAttribute('data-console', String(consoleType));
        newRow.setAttribute('data-payment', paymentModeKey);
        newRow.setAttribute('data-status', 'active');
        newRow.setAttribute(
          'data-search',
          `${reservation.tableNumber} ${consoleLabel} ${priceLabel} ${consoleType} ${linkedCust ? linkedCust.customerName : ''}`
        );

        newRow.innerHTML =
          `<td><span class="mg-row-index">${convertToPersian(rowNumber++)}</span></td>` +
          `<td><div class="mg-timer-wrap">${timeText}<span class="mg-pay-mode-tag">${payModeLabel}</span></div></td>` +
          `<td><ul class="list-inline mg-station-badge"><i class="demo-icon icon-table" style="font-size: 18px;"></i><span>میز ${convertToPersian(reservation.tableNumber)}</span>${sync3dPillHtml}${customerBadgeHtml}</ul></td>` +
          `<td><span class="mg-player-badge">${priceLabel}</span></td>` +
          `<td><div class="mg-console-cell"><i class="demo-icon icon-${escapeHtmlSafe(consoleType)}" style="font-size: 22px;"></i><span>${escapeHtmlSafe(consoleLabel)}</span></div></td>` +
          `<td><button type="button" class="btn btn-warning btn-xs bufeh-button">بوفـه${buffetBadgeHtml}</button></td>` +
          actionsHtml;

        // Buffet button focuses the dedicated Buffet Purchase card for this table
        const bufehBtn = newRow.querySelector('.bufeh-button');
        if (bufehBtn) {
          bufehBtn.addEventListener('click', function () {
            const modalTitle = `بوفه برای میز ${convertToPersian(reservation.tableNumber)}`;
            const formTitle = `خرید از بوفه برای میز ${convertToPersian(reservation.tableNumber)}`;
            const modal = document.getElementById('myModal');
            if (modal) {
              modal.style.display = 'flex';
              const h3 = modal.querySelector('.modal-content h3');
              if (h3) h3.textContent = modalTitle;
            }
            const formTitleEl = document.getElementById('formTitle');
            if (formTitleEl) formTitleEl.textContent = formTitle;
            if (buffetTableSelect) {
              buffetTableSelect.value = String(reservation.tableNumber);
            }
            if (buyForm) {
              buyForm.dataset.selectedTable = String(reservation.tableNumber);
            }
            highlightCard('myModal');
          });
        }

        // Start timer handler
        let sessionPostPayment = isPostPayment;
        let sessionPrePayment = isPrePayment;

        const startBtn = newRow.querySelector('.start-button');
        if (startBtn) {
          startBtn.addEventListener('click', async function (e) {
            e.preventDefault();
            const tableNumber = reservation.tableNumber;
            try {
              if (sessionPostPayment) {
                const clickTimeNow = Math.floor(Date.now() / 1000);
                const resp = await postFormUrlEncoded('./timing.php', {
                  tableNumber: tableNumber,
                  clickTime: clickTimeNow,
                });
                if (!resp.ok && resp.status !== 303) {
                  showToast('خطا در شروع زمان‌سنج میز.');
                  return;
                }
                showToast(`تایمر میز ${convertToPersian(tableNumber)} شروع شد.`);
                sessionPostPayment = false;
                invalidateTablesCache();
                await window.renderTablesWorkspace({ forceFresh: true });
                window.dispatchEvent(new CustomEvent('mg:tables-updated'));
              } else if (sessionPrePayment) {
                const startTimeNow = Math.floor(Date.now() / 1000);
                const finishTimeNow = startTimeNow + (timeSeconds > 0 ? timeSeconds : 3600);
                const resp = await postFormUrlEncoded('./timer.php', {
                  tableNumber: tableNumber,
                  finishTime: finishTimeNow,
                  startTime: startTimeNow,
                });
                if (!resp.ok && resp.status !== 303) {
                  showToast('خطا در شروع تایمر میز.');
                  return;
                }
                showToast(`تایمر میز ${convertToPersian(tableNumber)} شروع شد.`);
                sessionPrePayment = false;
                invalidateTablesCache();
                await window.renderTablesWorkspace({ forceFresh: true });
                window.dispatchEvent(new CustomEvent('mg:tables-updated'));
              }
            } catch {
              showToast('خطا در شروع زمان‌سنج میز.');
            }
          });
        }

        // End session handler -> saves game_temporary.php, deletes reservation, redirects to invoice.html
        const endBtn = newRow.querySelector('.end-button');
        if (endBtn) {
          endBtn.addEventListener('click', async function (event) {
            event.preventDefault();
            if (endBtn.dataset.closing === '1') return;
            endBtn.dataset.closing = '1';
            try {
              let gameCost = 0;
              let playedSeconds = 0;
              if (isPostPayment) {
                const elapsedSec = Math.max(60, stopTimer());
                playedSeconds = elapsedSec;
                gameCost = Math.round(hourlyPrice * (elapsedSec / 3600));
              } else if (isPrePayment) {
                const response = await fetch('./finishTime.json', { cache: 'no-store' });
                const timers = response.ok ? await response.json() : [];
                const timer = Array.isArray(timers)
                  ? timers.find((item) => String(item.tableNumber) === String(reservation.tableNumber))
                  : null;
                if (timer && timer.finishTime && timer.startTime) {
                  playedSeconds = Math.max(60, Math.round(Number(timer.finishTime) - Number(timer.startTime)));
                  gameCost =
                    Math.round((((timer.finishTime - timer.startTime) / 3600) * hourlyPrice) / 1000) *
                    1000;
                } else {
                  gameCost = prePaymentCost || Math.round(hourlyPrice);
                  playedSeconds = hourlyPrice > 0 ? Math.max(60, Math.round((gameCost / hourlyPrice) * 3600)) : 3600;
                }
              } else {
                return;
              }

              if (endBtn.dataset.gameSaved !== '1') {
                const saveResp = await postFormUrlEncoded('./game_temporary.php', {
                  gameCost,
                  consoleType,
                  priceType,
                  tableNumber: reservation.tableNumber,
                  playedSeconds,
                  customerId: reservation.customerId || '',
                });
                if (!saveResp.ok) throw new Error('save_failed');
                endBtn.dataset.gameSaved = '1';
              }
              const delResp = await postFormUrlEncoded('./delete_reservation.php', {
                tableNumber: reservation.tableNumber,
              });
              if (!delResp.ok && delResp.status !== 303) throw new Error('delete_failed');
              location.href = 'invoice.html?table=' + encodeURIComponent(reservation.tableNumber);
            } catch {
              showToast('پایان بازی ثبت نشد. دوباره تلاش کنید.');
            } finally {
              endBtn.dataset.closing = '0';
            }
          });
        }

        // Charge button focuses the dedicated Table Charging Card
        const chargeBtn = newRow.querySelector('.charge-button');
        if (chargeBtn) {
          chargeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const chargeModalTitle = `شارژ برای میز ${convertToPersian(reservation.tableNumber)}`;
            const chargeFormTitle = `شارژ برای میز ${convertToPersian(reservation.tableNumber)}`;
            const chargeModal = document.getElementById('ChargeModal');
            if (chargeModal) {
              chargeModal.style.display = 'block';
              const h3 = chargeModal.querySelector('.charge-modal-content h3');
              if (h3) h3.textContent = chargeModalTitle;
            }
            const titleEl = document.getElementById('chargeFormTitle');
            if (titleEl) titleEl.textContent = chargeFormTitle;
            if (chargeTableSelect) {
              chargeTableSelect.value = String(reservation.tableNumber);
            }
            if (chargeForm) {
              chargeForm.dataset.selectedTable = String(reservation.tableNumber);
            }
            highlightCard('ChargeModal');
          });
        }

        tableBody.appendChild(newRow);
      });

      // Render Idle 3D Floor-Plan Stations (PCs, Consoles, Billiard, Foosball, VIP/VR) synced from "گیم نت من"
      mergedTables.idleRows.forEach(function (idleMeta) {
        const st = idleMeta.station3D;
        if (!st) return;
        const consoleLabel = CONSOLE_LABELS[st.consoleType] || st.name;

        const idleRow = document.createElement('tr');
        idleRow.className = 'mg-idle-3d-row';
        idleRow.setAttribute('data-table', String(st.tableNumber));
        idleRow.setAttribute('data-console', String(st.consoleType));
        idleRow.setAttribute('data-payment', 'idle');
        idleRow.setAttribute('data-status', 'idle');
        idleRow.setAttribute('data-3d-station', '1');
        idleRow.setAttribute(
          'data-search',
          `${st.tableNumber} ${consoleLabel} ${st.name} ${st.consoleType} آزاد نقشه سه‌بعدی`
        );

        idleRow.innerHTML =
          `<td><span class="mg-row-index">${convertToPersian(rowNumber++)}</span></td>` +
          `<td><div class="mg-timer-wrap"><div class="mg-idle-timer-pill">۰۰:۰۰:۰۰</div><span class="mg-pay-mode-tag is-idle">آزاد · آماده</span></div></td>` +
          `<td><ul class="list-inline mg-station-badge"><i class="demo-icon icon-table" style="font-size: 18px;"></i><span>میز ${convertToPersian(st.tableNumber)}</span><span class="mg-table-3d-pill" title="همگام‌سازی‌شده با نقشه سه‌بعدی گیم‌نت من">3D</span></ul></td>` +
          `<td><span class="mg-player-badge is-idle">آماده رزرو</span></td>` +
          `<td><div class="mg-console-cell"><i class="demo-icon icon-${escapeHtmlSafe(st.consoleType)}" style="font-size: 22px;"></i><span>${escapeHtmlSafe(consoleLabel)}</span></div></td>` +
          `<td><span class="mg-idle-muted">—</span></td>` +
          `<td class="nowrap"><div class="mg-actions-cell">` +
          `<button type="button" class="btn btn-success btn-xs mg-quick-start-3d-btn" data-table-number="${escapeHtmlSafe(st.tableNumber)}" data-console-type="${escapeHtmlSafe(st.consoleType)}">▶ شروع سریع</button>` +
          `<button type="button" class="btn btn-info btn-xs mg-prefill-3d-btn" data-table-number="${escapeHtmlSafe(st.tableNumber)}" data-console-type="${escapeHtmlSafe(st.consoleType)}">تنظیم فرم</button>` +
          `</div></td>`;

        const quickStartBtn = idleRow.querySelector('.mg-quick-start-3d-btn');
        if (quickStartBtn) {
          quickStartBtn.addEventListener('click', async function () {
            if (quickStartBtn.disabled) return;
            quickStartBtn.disabled = true;
            try {
              const regResp = await postFormUrlEncoded('./process.php', {
                tableNumber: st.tableNumber,
                'table-number': st.tableNumber,
                consoleType: st.consoleType,
                priceType: 'one_player_price',
                'post-payment': 'post-payment',
                paymentType: 'post-payment',
              });
              const regData = await regResp.json().catch(() => ({}));
              if (!regResp.ok || regData.error) {
                showToast(regData.error || 'خطا در شروع سریع میز.');
                quickStartBtn.disabled = false;
                return;
              }
              await postFormUrlEncoded('./timing.php', {
                tableNumber: st.tableNumber,
                clickTime: Math.floor(Date.now() / 1000),
              });
              showToast(`میز ${convertToPersian(st.tableNumber)} (${consoleLabel}) راه‌اندازی و تایمر شروع شد.`);
              invalidateTablesCache();
              await window.renderTablesWorkspace({ forceFresh: true });
              window.dispatchEvent(new CustomEvent('mg:tables-updated'));
            } catch {
              showToast('خطا در ارتباط با سرور هنگام راه‌اندازی میز.');
              quickStartBtn.disabled = false;
            }
          });
        }

        const prefillBtn = idleRow.querySelector('.mg-prefill-3d-btn');
        if (prefillBtn) {
          prefillBtn.addEventListener('click', function () {
            const tblInput = document.getElementById('tableNumber');
            const conSelect = document.getElementById('consoleType');
            const prcSelect = document.getElementById('priceType');
            if (tblInput) tblInput.value = String(st.tableNumber);
            if (conSelect) conSelect.value = String(st.consoleType);
            if (prcSelect && !prcSelect.value) prcSelect.value = 'one_player_price';
            clearRegistrationErrors();
            highlightCard('register-section');
            if (tblInput) tblInput.focus();
            showToast(`اطلاعات میز ${convertToPersian(st.tableNumber)} (${consoleLabel}) در فرم قرار گرفت.`);
          });
        }

        tableBody.appendChild(idleRow);
      });
    })
    .catch((err) => {
      console.error('Failed to render active tables:', err);
    });
};

if (!window.__mgTablesLayoutSyncBound) {
  window.__mgTablesLayoutSyncBound = true;
  window.addEventListener('mg:layout-updated', () => {
    invalidateTablesCache();
    if (typeof window.renderTablesWorkspace === 'function') {
      window.renderTablesWorkspace({ forceFresh: true });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.renderTablesWorkspace());
} else {
  window.renderTablesWorkspace();
}

