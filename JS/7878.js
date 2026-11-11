window.convertToPersian = function convertToPersian(number) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(number ?? '').replace(/\d/g, (digit) => persianDigits[Number(digit)]);
};

$(document).ready(function () {
  // Bind post-payment vs pre-payment radio toggle
  const postRadio = document.getElementById('post-payment');
  const preRadio = document.getElementById('pre-payment');
  const preCostInput = document.getElementById('pre-payment-cost');

  if (postRadio && preRadio && preCostInput) {
    postRadio.addEventListener('change', function () {
      if (this.checked) {
        preRadio.checked = false;
        preCostInput.disabled = true;
        preCostInput.value = '';
        postRadio.closest('.mg-radio-card')?.classList.add('is-selected');
        preRadio.closest('.mg-radio-card')?.classList.remove('is-selected');
      }
    });
    preRadio.addEventListener('change', function () {
      if (this.checked) {
        postRadio.checked = false;
        preCostInput.disabled = false;
        preCostInput.focus();
        preRadio.closest('.mg-radio-card')?.classList.add('is-selected');
        postRadio.closest('.mg-radio-card')?.classList.remove('is-selected');
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

  function highlightCard(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    const card = container.querySelector('.charge-modal-content, .modal-content') || container;
    card.classList.add('card-highlight');
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => card.classList.remove('card-highlight'), 1800);
  }

  const getBundleMap = () => {
    if (!window.__mgBundlePromise) {
      window.__mgBundlePromise = fetch('./bundle.json')
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
          return fetch(url).then((r) => (r.ok ? r.json() : fallback));
        })
        .catch(() => fallback);
    }
    return window.__mgJsonPromises[url];
  };

  Promise.all([
    fetchSharedJson('./data.json', { consoles: [] }),
    fetchSharedJson('./reservations.json', []),
    fetchSharedJson('./products.json', []),
    fetchSharedJson('./clickTime.json', []),
    fetchSharedJson('./finishTime.json', []),
    fetchSharedJson('./buffet_temporary.json', []),
  ])
    .then(function ([dataJson, reservationsJson, productsJson, clickTimesJson, finishTimesJson, buffetTempJson]) {
      const consolesList = Array.isArray(dataJson?.consoles) ? dataJson.consoles : [];
      const reservations = Array.isArray(reservationsJson) ? reservationsJson : [];
      const products = Array.isArray(productsJson) ? productsJson : [];
      const clickTimes = Array.isArray(clickTimesJson) ? clickTimesJson : [];
      const finishTimes = Array.isArray(finishTimesJson) ? finishTimesJson : [];
      const buffetTemp = Array.isArray(buffetTempJson) ? buffetTempJson : [];

      function getHourlyPrice(consoleType, priceType) {
        const found = consolesList.find((c) => c.name === consoleType);
        const rate = found ? Number(found[priceType]) : 0;
        return rate > 0 ? rate : 60000;
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
      if (chargeTableSelect) {
        chargeTableSelect.addEventListener('change', function () {
          const tNum = this.value;
          const titleEl = document.getElementById('chargeFormTitle');
          if (titleEl && tNum) {
            titleEl.textContent = `شارژ زمان و اعتبار برای میز ${convertToPersian(tNum)}`;
          }
        });
      }

      if (buffetTableSelect) {
        buffetTableSelect.addEventListener('change', function () {
          const tNum = this.value;
          const titleEl = document.getElementById('formTitle');
          if (titleEl && tNum) {
            titleEl.textContent = `ثبت سفارش بوفه برای میز ${convertToPersian(tNum)}`;
          }
        });
      }

      // 3. Bind Dedicated Buffet Form Submit (#buyForm)
      const buyForm = document.getElementById('buyForm');
      if (buyForm && !buyForm.dataset.bound) {
        buyForm.dataset.bound = 'true';
        buyForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const targetTable =
            (buffetTableSelect && buffetTableSelect.value) ||
            buyForm.dataset.selectedTable ||
            (reservations[0] && reservations[0].tableNumber);

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
            body: formData,
          })
            .then((response) => response.json())
            .then(() => {
              showToast(`سفارش بوفه برای میز ${convertToPersian(targetTable)} با موفقیت ثبت شد.`);
              setTimeout(() => location.reload(), 600);
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
        chargeForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const targetTable =
            (chargeTableSelect && chargeTableSelect.value) ||
            chargeForm.dataset.selectedTable ||
            (reservations[0] && reservations[0].tableNumber);

          if (!targetTable) {
            showToast('ابتدا یک میز فعال برای شارژ انتخاب کنید.');
            return;
          }

          const targetRes = reservations.find((r) => String(r.tableNumber) === String(targetTable));
          const hourlyPrice = targetRes
            ? getHourlyPrice(targetRes.consoleType, targetRes.priceType)
            : 60000;

          const chargeAmountInput = document.getElementById('chargeAmount');
          const chargeTimeInput = document.getElementById('chargeTime');
          const chargeAmount = Number(chargeAmountInput ? chargeAmountInput.value : 0) || 0;
          const chargeMinutes = Number(chargeTimeInput ? chargeTimeInput.value : 0) || 0;
          const charge_Time = chargeMinutes * 60 + Math.round((3600 * chargeAmount) / hourlyPrice);

          if (charge_Time <= 0) {
            showToast('لطفاً مبلغ شارژ یا زمان (دقیقه) را وارد نمایید.');
            return;
          }

          $.ajax({
            type: 'POST',
            url: './charging.php',
            data: {
              tableNumber: targetTable,
              charge_Time: charge_Time,
            },
            success: function () {
              showToast(`شارژ میز ${convertToPersian(targetTable)} با موفقیت اعمال شد.`);
              setTimeout(() => location.reload(), 600);
            },
            error: function () {
              showToast('خطا در ارتباط با سرور هنگام شارژ میز.');
            },
          });
        });
      }

      // 5. Render Active Tables Rows inside #reservationTableBody
      const tableBody = $('#reservationTableBody');
      tableBody.empty();

      if (reservations.length === 0) {
        tableBody.append(
          `<tr class="mg-empty-row">
            <td colspan="7" class="mg-empty-state">
              هیچ میز فعالی در حال حاضر ثبت نشده است. از فرم «ثبت و راه‌اندازی میز» برای شروع سشن جدید استفاده کنید.
            </td>
          </tr>`
        );
        return;
      }

      let rowNumber = 1;

      $.each(reservations, function (index, reservation) {
        const prePaymentCost = Number(reservation.prePaymentCost) || 0;
        const consoleType = reservation.consoleType;
        const priceType = reservation.priceType;
        const hourlyPrice = getHourlyPrice(consoleType, priceType);
        const timeSeconds = Math.round((3600 * prePaymentCost) / hourlyPrice);

        const isPostPayment = reservation.postPayment === 'post-payment';
        const isPrePayment = reservation.prePayment === 'pre-payment';
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

        const timeText = displayTime(reservation);
        const consoleLabel = CONSOLE_LABELS[consoleType] || consoleType;
        const priceLabel = PRICE_LABELS[priceType] || 'استاندارد';
        const payModeLabel = isPrePayment ? 'پیش‌پرداخت' : 'پس‌کرایه';

        const newRow = $('<tr></tr>');
        newRow.attr('data-table', String(reservation.tableNumber));
        newRow.attr('data-console', String(consoleType));
        newRow.attr('data-payment', paymentModeKey);
        newRow.attr('data-search', `${reservation.tableNumber} ${consoleLabel} ${priceLabel} ${consoleType}`);

        newRow.append('<td><span class="mg-row-index">' + convertToPersian(rowNumber++) + '</span></td>');
        newRow.append(
          '<td><div class="mg-timer-wrap">' +
            timeText +
            '<span class="mg-pay-mode-tag">' +
            payModeLabel +
            '</span></div></td>'
        );
        newRow.append(
          '<td><ul class="list-inline mg-station-badge"><i class="demo-icon icon-table" style="font-size: 18px;"></i><span>میز ' +
            convertToPersian(reservation.tableNumber) +
            '</span></ul></td>'
        );

        newRow.append('<td><span class="mg-player-badge">' + priceLabel + '</span></td>');

        newRow.append(
          '<td><div class="mg-console-cell"><i class="demo-icon icon-' +
            consoleType +
            '" style="font-size: 22px;"></i><span>' +
            consoleLabel +
            '</span></div></td>'
        );

        const buffetBadgeHtml =
          tableBuffetCount > 0
            ? ` <span class="mg-nav-badge badge-Highlight">${convertToPersian(tableBuffetCount)}</span>`
            : '';

        newRow.append(
          '<td><button type="button" class="btn btn-warning btn-xs bufeh-button">بوفـه' +
            buffetBadgeHtml +
            '</button></td>'
        );

        // Buffet button focuses the dedicated Buffet Purchase card for this table
        newRow.find('.bufeh-button').click(function () {
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

        // Session Action Buttons (Start, End, Recharge)
        if (isPostPayment) {
          newRow.append(
            '<td class="nowrap"><div class="mg-actions-cell">' +
              '<a href="#" class="btn btn-success btn-xs start-button">▶ شــروع</a>' +
              '<a href="#" class="btn btn-danger btn-xs end-button">■ پایان و فاکتور</a>' +
              '</div></td>'
          );
        } else if (isPrePayment) {
          newRow.append(
            '<td class="nowrap"><div class="mg-actions-cell">' +
              '<a href="#" class="btn btn-success btn-xs start-button">▶ شــروع</a>' +
              '<a href="#" class="btn btn-danger btn-xs end-button">■ پایان و فاکتور</a>' +
              '<a href="#" class="btn btn-info btn-xs charge-button">⚡ شارژ مجدد</a>' +
              '</div></td>'
          );
        } else {
          newRow.append('<td class="nowrap">وضعیت نامعلوم</td>');
        }

        // Start timer handler
        let sessionPostPayment = isPostPayment;
        let sessionPrePayment = isPrePayment;

        newRow.find('.start-button').click(function (e) {
          e.preventDefault();
          const tableNumber = reservation.tableNumber;
          if (sessionPostPayment) {
            const clickTimeNow = Math.floor(Date.now() / 1000);
            $.ajax({
              type: 'POST',
              url: './timing.php',
              data: { tableNumber: tableNumber, clickTime: clickTimeNow },
              success: function () {
                location.reload();
              },
              error: function () {
                showToast('خطا در شروع زمان‌سنج میز.');
              },
            });
            sessionPostPayment = false;
          } else if (sessionPrePayment) {
            const startTimeNow = Math.floor(Date.now() / 1000);
            const finishTimeNow = startTimeNow + (timeSeconds > 0 ? timeSeconds : 3600);
            $.ajax({
              type: 'POST',
              url: './timer.php',
              data: {
                tableNumber: tableNumber,
                finishTime: finishTimeNow,
                startTime: startTimeNow,
              },
              success: function () {
                location.reload();
              },
              error: function () {
                showToast('خطا در شروع تایمر میز.');
              },
            });
            sessionPrePayment = false;
          }
        });

        // End session handler -> saves game_temporary.php, deletes reservation, redirects to invoice.html
        newRow.find('.end-button').click(async function (event) {
          event.preventDefault();
          const button = $(this);
          if (button.data('closing')) return;
          button.data('closing', true);
          try {
            let gameCost = 0;
            if (isPostPayment) {
              const elapsedSec = Math.max(60, stopTimer());
              gameCost = Math.round(hourlyPrice * (elapsedSec / 3600));
            } else if (isPrePayment) {
              const response = await fetch('./finishTime.json');
              const timers = response.ok ? await response.json() : [];
              const timer = Array.isArray(timers)
                ? timers.find((item) => String(item.tableNumber) === String(reservation.tableNumber))
                : null;
              if (timer && timer.finishTime && timer.startTime) {
                gameCost =
                  Math.round((((timer.finishTime - timer.startTime) / 3600) * hourlyPrice) / 1000) *
                  1000;
              } else {
                gameCost = prePaymentCost || Math.round(hourlyPrice);
              }
            } else {
              return;
            }

            if (!button.data('gameSaved')) {
              await $.post('./game_temporary.php', {
                gameCost,
                consoleType,
                priceType,
                tableNumber: reservation.tableNumber,
              });
              button.data('gameSaved', true);
            }
            await $.post('./delete_reservation.php', { tableNumber: reservation.tableNumber });
            location.href = 'invoice.html?table=' + encodeURIComponent(reservation.tableNumber);
          } catch {
            showToast('پایان بازی ثبت نشد. دوباره تلاش کنید.');
          } finally {
            button.data('closing', false);
          }
        });

        // Charge button focuses the dedicated Table Charging Card
        newRow.find('.charge-button').click(function (e) {
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

        tableBody.append(newRow);

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
        }

        function loadTime(tableNumber) {
          const table = finishTimes.find((item) => String(item.tableNumber) === String(tableNumber));
          if (table && Number(table.finishTime) > 0) {
            finishTime = parseInt(table.finishTime, 10);
            startTime();
          }
        }

        function displayTime(res) {
          if (res.postPayment === 'post-payment') {
            setTimeout(() => loadTimer(res.tableNumber), 0);
            return `<div class="timer" id="timer${res.tableNumber}">۰۰:۰۰:۰۰</div>`;
          } else if (res.prePayment === 'pre-payment') {
            setTimeout(() => loadTime(res.tableNumber), 0);
            return `<div class="timer2" id="PreTime${res.tableNumber}">۰۰:۰۰:۰۰</div>`;
          } else {
            return 'زمان نامشخص';
          }
        }
      });
    });
});
