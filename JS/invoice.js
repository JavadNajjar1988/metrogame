const requestedTable = new URLSearchParams(window.location.search).get('table');

const CONSOLE_LABELS = {
  ps50: 'پلی‌استیشن ۵ (PS5)',
  ps5: 'پلی‌استیشن ۵ (PS5)',
  ps4: 'پلی‌استیشن ۴ (PS4)',
  computer: 'سیستم گیمینگ (PC)',
  xbox: 'ایکس‌باکس (Xbox)',
  jewelry: 'وی‌آر / VIP',
  vip: 'وی‌آر / VIP',
  foosball: 'فوتبال دستی / بیلیارد',
  'pool-table': 'میز بیلیارد',
};

const PRICE_TYPE_LABELS = {
  one_player_price: 'تک نفره',
  two_player_price: 'دو نفره',
  three_player_price: 'سه نفره',
  four_player_price: 'چهار نفره',
};

const PAY_METHOD_LABELS = {
  cash: 'نقدی',
  pos: 'کارتخوان (POS)',
  acount: 'کسر از حساب مشتری',
  debt: 'ثبت در بدهکاران (نسیه)',
};

const invoiceState = {
  tableNumber: requestedTable || '',
  availableTables: [],
  gameItems: [],
  buffetItems: [],
  gameTempMap: {},
  buffetTempMap: {},
  consolesCatalog: [],
  reservationsList: [],
  payMethod: 'cash',
  invoiceSerial: '',
  issuedAt: new Date(),
};

function toFaNum(val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val ?? '۰');
  return num.toLocaleString('fa-IR');
}

function toFaDigits(str) {
  return String(str ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
}

function getConsoleTitle(code) {
  const clean = String(code || '').trim().toLowerCase();
  return CONSOLE_LABELS[clean] || (code ? String(code).toUpperCase() : 'کنسول بازی');
}

function getConsoleIconClass(code) {
  const clean = String(code || 'ps50').trim().toLowerCase();
  if (clean === 'ps5') return 'icon-ps50';
  return `icon-${clean}`;
}

function getPriceTypeTitle(priceType) {
  return PRICE_TYPE_LABELS[priceType] || 'عادی (تک نفره)';
}

function getSelectedPayMethodId() {
  const checked = document.querySelector('input[name="options"]:checked');
  return checked ? checked.id : invoiceState.payMethod || 'cash';
}

function showInvoiceNotice(message, type = 'info') {
  let box = document.getElementById('mgInvoiceToast');
  if (!box) {
    box = document.createElement('div');
    box.id = 'mgInvoiceToast';
    box.className = 'mg-invoice-toast hidden-print';
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.setAttribute('data-type', type);
  box.classList.add('is-visible');
  clearTimeout(box.__hideTimer);
  box.__hideTimer = setTimeout(() => {
    box.classList.remove('is-visible');
  }, 3400);
}

function computeTotals() {
  const gameTotal = invoiceState.gameItems.reduce(
    (sum, item) => sum + (Number(item.gameCost) || 0),
    0
  );
  const buffetTotal = invoiceState.buffetItems.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
    0
  );
  const rawTotal = gameTotal + buffetTotal;
  const payable = rawTotal >= 1000 ? Math.round(rawTotal / 1000) * 1000 : rawTotal;
  const roundingDiff = rawTotal - payable;
  const totalBuffetQty = invoiceState.buffetItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  return {
    gameTotal,
    buffetTotal,
    rawTotal,
    payable,
    roundingDiff,
    totalBuffetQty,
  };
}

function buildBuffetPaymentPayload() {
  return invoiceState.buffetItems.map((item) => [
    item.productType || 'other',
    (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0),
  ]);
}

function syncTableDataForSelection(tableKey) {
  const key = String(tableKey || '').trim();
  invoiceState.tableNumber = key;
  invoiceState.issuedAt = new Date();
  const dateCompact = `${invoiceState.issuedAt.getFullYear()}${String(
    invoiceState.issuedAt.getMonth() + 1
  ).padStart(2, '0')}${String(invoiceState.issuedAt.getDate()).padStart(2, '0')}`;
  invoiceState.invoiceSerial = `MG-${key || '1'}-${dateCompact.slice(-4)}`;

  const rawGameList = Array.isArray(invoiceState.gameTempMap[key])
    ? invoiceState.gameTempMap[key]
    : [];

  if (rawGameList.length > 0) {
    invoiceState.gameItems = rawGameList.map((g, idx) => ({
      id: `g-${idx}`,
      consoleType: g.consoleType || 'ps50',
      priceType: g.priceType || 'one_player_price',
      basePrice: Number(g.cosoleprice ?? g.unitprice ?? 0) || 0,
      gameCost: Number(g.gameCost ?? 0) || 0,
    }));
  } else {
    // Fallback if table is still active in reservations.json
    const activeRes = invoiceState.reservationsList.find(
      (r) => String(r.tableNumber) === key
    );
    if (activeRes) {
      const matchedConsole = invoiceState.consolesCatalog.find(
        (c) => String(c.name).toLowerCase() === String(activeRes.consoleType).toLowerCase()
      );
      const baseRate = matchedConsole
        ? Number(matchedConsole[activeRes.priceType] || matchedConsole.one_player_price || 0)
        : 0;
      const estimatedCost = Number(activeRes.prePaymentCost) || baseRate;
      invoiceState.gameItems = [
        {
          id: 'g-res-0',
          consoleType: activeRes.consoleType || 'ps50',
          priceType: activeRes.priceType || 'one_player_price',
          basePrice: baseRate,
          gameCost: estimatedCost,
        },
      ];
    } else {
      invoiceState.gameItems = [];
    }
  }

  const rawBuffetList = Array.isArray(invoiceState.buffetTempMap[key])
    ? invoiceState.buffetTempMap[key]
    : [];

  invoiceState.buffetItems = rawBuffetList.map((b, idx) => ({
    id: `b-${idx}`,
    productCode: b.productCode || '',
    title: b.title || 'محصول بوفه',
    quantity: Number(b.quantity) || 1,
    unitPrice: Number(b.unitPrice) || 0,
    productType: b.productType || 'other',
  }));
}

function renderInvoicePageDom() {
  const tableLabel = invoiceState.tableNumber
    ? `میز شماره ${toFaDigits(invoiceState.tableNumber)}`
    : 'بدون میز انتخابی';

  const dateStr = invoiceState.issuedAt.toLocaleDateString('fa-IR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = invoiceState.issuedAt.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const invoiceHeader = document.getElementById('invoiceHeader');
  if (invoiceHeader) {
    invoiceHeader.innerHTML = `
      <div class="mg-invoice-header-main">
        <h2 class="mg-card-title">
          صورت‌حساب تسویه ${tableLabel}
        </h2>
        <div class="mg-invoice-header-meta">
          <span>شماره فاکتور: <strong>${toFaDigits(invoiceState.invoiceSerial || 'MG-101')}</strong></span>
          <span aria-hidden="true">·</span>
          <span>تاریخ: <strong>${dateStr} — ساعت ${timeStr}</strong></span>
        </div>
      </div>
    `;
  }

  // Render Game Sessions Table
  const gameTable = document.getElementById('invoicegameTable');
  const gameTbody = gameTable ? gameTable.querySelector('tbody') : null;
  if (gameTbody) {
    if (invoiceState.gameItems.length === 0) {
      gameTbody.innerHTML = `
        <tr class="mg-empty-row">
          <td colspan="6" style="text-align: center; padding: 18px; color: var(--text-secondary);">
            کارکرد بازی برای این میز ثبت نشده است (۰ تومان)
          </td>
        </tr>
      `;
    } else {
      gameTbody.innerHTML = invoiceState.gameItems
        .map((item, idx) => {
          const consoleTitle = getConsoleTitle(item.consoleType);
          const iconClass = getConsoleIconClass(item.consoleType);
          const modeTitle = getPriceTypeTitle(item.priceType);
          return `
            <tr>
              <td>${toFaNum(idx + 1)}</td>
              <td>
                <div style="display: inline-flex; align-items: center; gap: 8px;">
                  <i class="demo-icon ${iconClass}" style="font-size: 22px;"></i>
                  <strong>${consoleTitle}</strong>
                </div>
              </td>
              <td>${modeTitle}</td>
              <td>${toFaNum(item.basePrice)} تومان</td>
              <td><strong>${toFaNum(item.gameCost)} تومان</strong></td>
              <td class="hidden-print">
                <button type="button" class="btn btn-danger btn-xs mg-remove-invoice-row" data-remove-type="game" data-row-id="${item.id}">
                  حذف
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // Render Buffet Orders Table
  const buffetTable = document.getElementById('invoicebuffetTable');
  const buffetTbody = buffetTable ? buffetTable.querySelector('tbody') : null;
  if (buffetTbody) {
    if (invoiceState.buffetItems.length === 0) {
      buffetTbody.innerHTML = `
        <tr class="mg-empty-row">
          <td colspan="6" style="text-align: center; padding: 18px; color: var(--text-secondary);">
            سفارش بوفه برای این میز ثبت نشده است (۰ تومان)
          </td>
        </tr>
      `;
    } else {
      buffetTbody.innerHTML = invoiceState.buffetItems
        .map((item, idx) => {
          const rowTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
          return `
            <tr>
              <td>${toFaNum(idx + 1)}</td>
              <td><strong>${item.title}</strong></td>
              <td>${toFaNum(item.quantity)} عدد</td>
              <td>${toFaNum(item.unitPrice)} تومان</td>
              <td><strong>${toFaNum(rowTotal)} تومان</strong></td>
              <td class="hidden-print">
                <button type="button" class="btn btn-danger btn-xs mg-remove-invoice-row" data-remove-type="buffet" data-row-id="${item.id}">
                  حذف
                </button>
              </td>
            </tr>
          `;
        })
        .join('');
    }
  }

  // Update Totals & Live Status Strip
  const totals = computeTotals();
  const payMethodId = getSelectedPayMethodId();
  invoiceState.payMethod = payMethodId;
  const payMethodLabel = PAY_METHOD_LABELS[payMethodId] || 'نقدی';

  const gameTotalEl = document.getElementById('gameTotal');
  const buffetTotalEl = document.getElementById('buffetTotal');
  const totalEl = document.getElementById('total');
  const payableEl = document.getElementById('payable');

  if (gameTotalEl) gameTotalEl.textContent = `${toFaNum(totals.gameTotal)} تومان`;
  if (buffetTotalEl) buffetTotalEl.textContent = `${toFaNum(totals.buffetTotal)} تومان`;
  if (totalEl) totalEl.textContent = `${toFaNum(totals.rawTotal)} تومان`;
  if (payableEl) payableEl.textContent = `${toFaNum(totals.payable)} تومان`;

  const summaryTableNum = document.getElementById('summaryTableNum');
  const summaryGameStatus = document.getElementById('summaryGameStatus');
  const summaryBuffetStatus = document.getElementById('summaryBuffetStatus');
  const summaryPayMethod = document.getElementById('summaryPayMethod');
  const summaryPayableAmount = document.getElementById('summaryPayableAmount');

  if (summaryTableNum) {
    summaryTableNum.textContent = invoiceState.tableNumber
      ? `میز ${toFaDigits(invoiceState.tableNumber)}`
      : 'نامشخص';
  }
  if (summaryGameStatus) {
    if (invoiceState.gameItems.length > 0) {
      const firstConsole = getConsoleTitle(invoiceState.gameItems[0].consoleType);
      summaryGameStatus.textContent = `${toFaNum(invoiceState.gameItems.length)} سشن (${firstConsole})`;
    } else {
      summaryGameStatus.textContent = 'بدون کارکرد بازی';
    }
  }
  if (summaryBuffetStatus) {
    if (invoiceState.buffetItems.length > 0) {
      summaryBuffetStatus.textContent = `${toFaNum(invoiceState.buffetItems.length)} ردیف (${toFaNum(
        totals.totalBuffetQty
      )} قلم)`;
    } else {
      summaryBuffetStatus.textContent = 'بدون سفارش بوفه';
    }
  }
  if (summaryPayMethod) {
    summaryPayMethod.textContent = payMethodLabel;
  }
  if (summaryPayableAmount) {
    summaryPayableAmount.textContent = `${toFaNum(totals.payable)} تومان`;
  }

  // Keep the print summary sheet synchronized at all times
  renderPrintableReceiptSummary();
}

function buildPrintableReceiptInnerHtml() {
  const totals = computeTotals();
  const payMethodId = getSelectedPayMethodId();
  const payMethodLabel = PAY_METHOD_LABELS[payMethodId] || 'نقدی';
  const tableTitle = invoiceState.tableNumber
    ? `میز شماره ${toFaDigits(invoiceState.tableNumber)}`
    : 'تسویه عمومی';

  const dateStr = invoiceState.issuedAt.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const weekdayStr = invoiceState.issuedAt.toLocaleDateString('fa-IR', {
    weekday: 'long',
  });
  const timeStr = invoiceState.issuedAt.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const gameRowsHtml =
    invoiceState.gameItems.length > 0
      ? invoiceState.gameItems
          .map(
            (item, idx) => `
          <tr>
            <td>${toFaNum(idx + 1)}</td>
            <td><strong>${getConsoleTitle(item.consoleType)}</strong></td>
            <td>${getPriceTypeTitle(item.priceType)}</td>
            <td>${toFaNum(item.basePrice)} تومان</td>
            <td><strong>${toFaNum(item.gameCost)} تومان</strong></td>
          </tr>
        `
          )
          .join('')
      : `
        <tr>
          <td colspan="5" class="mg-receipt-empty-cell">بدون کارکرد بازی ثبت‌شده — ۰ تومان</td>
        </tr>
      `;

  const buffetRowsHtml =
    invoiceState.buffetItems.length > 0
      ? invoiceState.buffetItems
          .map((item, idx) => {
            const rowTotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
            return `
            <tr>
              <td>${toFaNum(idx + 1)}</td>
              <td><strong>${item.title}</strong></td>
              <td>${toFaNum(item.quantity)} عدد</td>
              <td>${toFaNum(item.unitPrice)} تومان</td>
              <td><strong>${toFaNum(rowTotal)} تومان</strong></td>
            </tr>
          `;
          })
          .join('')
      : `
        <tr>
          <td colspan="5" class="mg-receipt-empty-cell">بدون سفارش بوفه ثبت‌شده — ۰ تومان</td>
        </tr>
      `;

  const primaryConsoleSummary =
    invoiceState.gameItems.length > 0
      ? `${getConsoleTitle(invoiceState.gameItems[0].consoleType)} (${getPriceTypeTitle(
          invoiceState.gameItems[0].priceType
        )})`
      : 'ثبت نشده';

  return `
    <div class="mg-receipt-doc" dir="rtl">
      <!-- Receipt Official Header -->
      <header class="mg-receipt-header">
        <div class="mg-receipt-brand">
          <img src="src/assets/images/metrogame_emblem_1794207267121.jpg" alt="لوگوی Game District" class="mg-receipt-logo" onerror="this.style.display='none'">
          <div>
            <h1 class="mg-receipt-club-name">باشگاه بازی و گیم‌نت Game District</h1>
            <p class="mg-receipt-doc-subtitle">خلاصه دقیق وضعیت و صورت‌حساب رسمی تسویه میز</p>
          </div>
        </div>
        <div class="mg-receipt-meta-box">
          <div><span>شماره فاکتور:</span> <strong>${toFaDigits(invoiceState.invoiceSerial || 'MG-101')}</strong></div>
          <div><span>تاریخ صدور:</span> <strong>${weekdayStr} ${dateStr}</strong></div>
          <div><span>ساعت صدور:</span> <strong>${timeStr}</strong></div>
        </div>
      </header>

      <!-- Executive Status Summary Grid -->
      <section class="mg-receipt-status-grid" aria-label="خلاصه وضعیت ایستگاه">
        <div class="mg-receipt-status-cell">
          <span class="mg-receipt-status-kicker">ایستگاه / میز</span>
          <strong class="mg-receipt-status-value">${tableTitle}</strong>
        </div>
        <div class="mg-receipt-status-cell">
          <span class="mg-receipt-status-kicker">دستگاه و حالت بازی</span>
          <strong class="mg-receipt-status-value">${primaryConsoleSummary}</strong>
        </div>
        <div class="mg-receipt-status-cell">
          <span class="mg-receipt-status-kicker">اقلام سفارش بوفه</span>
          <strong class="mg-receipt-status-value">${toFaNum(totals.totalBuffetQty)} قلم (${toFaNum(
    invoiceState.buffetItems.length
  )} ردیف)</strong>
        </div>
        <div class="mg-receipt-status-cell">
          <span class="mg-receipt-status-kicker">روش تسویه حساب</span>
          <strong class="mg-receipt-status-value">${payMethodLabel}</strong>
        </div>
      </section>

      <!-- Section 1: Game Sessions Breakdown -->
      <section class="mg-receipt-section">
        <div class="mg-receipt-section-head">
          <h2>۱. شرح کارکرد بازی و کنسول</h2>
          <span>جمع بخش بازی: <strong>${toFaNum(totals.gameTotal)} تومان</strong></span>
        </div>
        <table class="mg-receipt-table">
          <thead>
            <tr>
              <th style="width: 9%;">ردیف</th>
              <th style="width: 33%;">شرح کنسول / دستگاه</th>
              <th style="width: 18%;">نوع بازی</th>
              <th style="width: 20%;">نرخ پایه ساعتی</th>
              <th style="width: 20%;">مبلغ کارکرد</th>
            </tr>
          </thead>
          <tbody>
            ${gameRowsHtml}
          </tbody>
        </table>
      </section>

      <!-- Section 2: Buffet Orders Breakdown -->
      <section class="mg-receipt-section">
        <div class="mg-receipt-section-head">
          <h2>۲. شرح سفارش‌های بوفه و پذیرایی</h2>
          <span>جمع بخش بوفه: <strong>${toFaNum(totals.buffetTotal)} تومان</strong></span>
        </div>
        <table class="mg-receipt-table">
          <thead>
            <tr>
              <th style="width: 9%;">ردیف</th>
              <th style="width: 36%;">نام محصول</th>
              <th style="width: 15%;">تعداد</th>
              <th style="width: 20%;">قیمت واحد</th>
              <th style="width: 20%;">قیمت کل</th>
            </tr>
          </thead>
          <tbody>
            ${buffetRowsHtml}
          </tbody>
        </table>
      </section>

      <!-- Section 3: Final Financial Summary -->
      <section class="mg-receipt-summary-wrap">
        <div class="mg-receipt-notes-col">
          <div class="mg-receipt-note-box">
            <strong>خلاصه وضعیت تسویه:</strong>
            <p>این صورت‌حساب شامل ریز کارکرد کنسول و سفارش‌های بوفه ثبت‌شده برای <strong>${tableTitle}</strong> با روش پرداخت <strong>«${payMethodLabel}»</strong> می‌باشد.</p>
            <div class="mg-receipt-sign-row">
              <span>مهر و امضای اپراتور سالن</span>
              <span>امضای مشتری</span>
            </div>
          </div>
        </div>
        <div class="mg-receipt-totals-col">
          <table class="mg-receipt-totals-table">
            <tbody>
              <tr>
                <th>جمع فاکتور بازی:</th>
                <td>${toFaNum(totals.gameTotal)} تومان</td>
              </tr>
              <tr>
                <th>جمع فاکتور بوفه:</th>
                <td>${toFaNum(totals.buffetTotal)} تومان</td>
              </tr>
              <tr>
                <th>مجموع کل فاکتور:</th>
                <td>${toFaNum(totals.rawTotal)} تومان</td>
              </tr>
              ${
                totals.roundingDiff !== 0
                  ? `
              <tr>
                <th>تعدیل / رندینگ فاکتور:</th>
                <td>${toFaNum(Math.abs(totals.roundingDiff))} تومان</td>
              </tr>`
                  : ''
              }
              <tr class="mg-receipt-grand-row">
                <th>مبلغ نهایی قابل پرداخت:</th>
                <td>${toFaNum(totals.payable)} تومان</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer class="mg-receipt-footer">
        <span>با تشکر از انتخاب باشگاه بازی Game District</span>
        <span>سامانه یکپارچه مدیریت گیم‌نت Game District</span>
      </footer>
    </div>
  `;
}

function getStandaloneReceiptDocumentHtml() {
  const receiptBody = buildPrintableReceiptInnerHtml();
  const tableTitle = invoiceState.tableNumber
    ? `میز ${toFaDigits(invoiceState.tableNumber)}`
    : 'Game District';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>صورت‌حساب رسمی ${tableTitle} | گیم‌نت Game District</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 16px;
      background: #FFFFFF;
      color: #0F172A;
      font-family: Tahoma, 'Vazirmatn', 'IRANSans', sans-serif;
      font-size: 13px;
      line-height: 1.65;
      direction: rtl;
    }
    .mg-receipt-doc {
      max-width: 780px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 2px solid #0F172A;
      border-radius: 12px;
      padding: 22px 24px;
    }
    .mg-receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-bottom: 14px;
      border-bottom: 2px solid #0F172A;
      margin-bottom: 16px;
    }
    .mg-receipt-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mg-receipt-logo {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid #CBD5E1;
    }
    .mg-receipt-club-name {
      margin: 0 0 4px 0;
      font-size: 19px;
      font-weight: 800;
      color: #0F172A;
    }
    .mg-receipt-doc-subtitle {
      margin: 0;
      font-size: 12.5px;
      color: #334155;
      font-weight: 600;
    }
    .mg-receipt-meta-box {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 12px;
      color: #1E293B;
      min-width: 210px;
    }
    .mg-receipt-meta-box > div {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 2px 0;
    }
    .mg-receipt-status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .mg-receipt-status-cell {
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mg-receipt-status-kicker {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .mg-receipt-status-value {
      font-size: 13px;
      color: #0F172A;
      font-weight: 700;
    }
    .mg-receipt-section {
      margin-bottom: 18px;
    }
    .mg-receipt-section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-bottom: none;
      border-radius: 8px 8px 0 0;
      padding: 8px 14px;
    }
    .mg-receipt-section-head h2 {
      margin: 0;
      font-size: 13.5px;
      font-weight: 700;
      color: #0F172A;
    }
    .mg-receipt-section-head span {
      font-size: 12.5px;
      color: #1E293B;
    }
    .mg-receipt-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #CBD5E1;
    }
    .mg-receipt-table th,
    .mg-receipt-table td {
      border: 1px solid #CBD5E1;
      padding: 8px 10px;
      text-align: center;
      font-size: 12.5px;
      color: #0F172A;
    }
    .mg-receipt-table thead th {
      background: #F8FAFC;
      font-weight: 700;
      color: #0F172A;
    }
    .mg-receipt-empty-cell {
      color: #475569 !important;
      padding: 12px !important;
      font-style: normal;
    }
    .mg-receipt-summary-wrap {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 16px;
      align-items: stretch;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    .mg-receipt-note-box {
      height: 100%;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 12px;
      color: #1E293B;
    }
    .mg-receipt-note-box p {
      margin: 6px 0 14px 0;
      color: #334155;
    }
    .mg-receipt-sign-row {
      display: flex;
      justify-content: space-around;
      padding-top: 22px;
      border-top: 1px dashed #94A3B8;
      font-size: 11.5px;
      color: #475569;
    }
    .mg-receipt-totals-table {
      width: 100%;
      height: 100%;
      border-collapse: collapse;
      border: 1.5px solid #0F172A;
      border-radius: 8px;
      overflow: hidden;
    }
    .mg-receipt-totals-table th,
    .mg-receipt-totals-table td {
      border: 1px solid #CBD5E1;
      padding: 8px 12px;
      font-size: 12.5px;
    }
    .mg-receipt-totals-table th {
      background: #F8FAFC;
      text-align: right;
      color: #1E293B;
      width: 52%;
    }
    .mg-receipt-totals-table td {
      text-align: left;
      font-weight: 700;
      color: #0F172A;
    }
    .mg-receipt-grand-row th,
    .mg-receipt-grand-row td {
      background: #0F172A !important;
      color: #FFFFFF !important;
      font-size: 14px !important;
      font-weight: 800 !important;
      padding: 10px 12px !important;
    }
    .mg-receipt-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #CBD5E1;
      font-size: 11.5px;
      color: #475569;
    }
  </style>
</head>
<body>
  ${receiptBody}
</body>
</html>`;
}

function renderPrintableReceiptSummary() {
  const sheet = document.getElementById('mgPrintSummarySheet');
  if (!sheet) return;
  sheet.innerHTML = buildPrintableReceiptInnerHtml();
}

function triggerDirectReceiptPrint() {
  renderPrintableReceiptSummary();
  const printFrame = document.getElementById('mgReceiptPrintFrame');
  const fullHtml = getStandaloneReceiptDocumentHtml();

  if (printFrame) {
    try {
      const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(fullHtml);
        frameDoc.close();
        setTimeout(() => {
          try {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          } catch {
            window.print();
          }
        }, 120);
        return;
      }
    } catch {
      // Fallback to window.print() which uses @media print for #mgPrintSummarySheet
    }
  }

  try {
    window.print();
  } catch {
    showInvoiceNotice('پیش‌نمایش صورت‌حساب آماده است. از دکمه ذخیره فایل می‌توانید نسخه چاپی را دریافت کنید.');
  }
}

function downloadStandaloneReceiptHtml() {
  const fullHtml = getStandaloneReceiptDocumentHtml();
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const tbl = invoiceState.tableNumber || '1';
  a.href = url;
  a.download = `invoice-table-${tbl}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  showInvoiceNotice('فایل صورت‌حساب رسمی با موفقیت ذخیره شد.', 'success');
}

window.openInvoicePrintSummary = function openInvoicePrintSummary() {
  renderPrintableReceiptSummary();
  const modal = document.getElementById('mgPrintPreviewModal');
  if (modal) {
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
  }
  triggerDirectReceiptPrint();
};

window.closeInvoicePrintSummary = function closeInvoicePrintSummary() {
  const modal = document.getElementById('mgPrintPreviewModal');
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
  }
};

async function settleInvoiceAndCleanup(factorName) {
  const cleanFactor = String(factorName || '').trim();
  if (!cleanFactor) {
    window.location.href = 'index.html#tables-section';
    return;
  }

  await Promise.allSettled([
    fetch('./delete_game_temperory.php', {
      method: 'POST',
      body: `factor_name=${encodeURIComponent(cleanFactor)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
    fetch('./delete_buffet_temperory.php', {
      method: 'POST',
      body: `factor_name=${encodeURIComponent(cleanFactor)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  ]);

  showInvoiceNotice('صورت‌حساب با موفقیت ثبت و تسویه شد.', 'success');
  setTimeout(() => {
    window.location.href = 'index.html#tables-section';
  }, 450);
}

function bindInvoiceInteractions() {
  const printBtn = document.getElementById('printInvoiceBtn');
  if (printBtn && !printBtn.dataset.bound) {
    printBtn.dataset.bound = '1';
    printBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.openInvoicePrintSummary();
    });
  }

  const confirmPrintBtn = document.getElementById('mgConfirmDirectPrintBtn');
  if (confirmPrintBtn && !confirmPrintBtn.dataset.bound) {
    confirmPrintBtn.dataset.bound = '1';
    confirmPrintBtn.addEventListener('click', (e) => {
      e.preventDefault();
      triggerDirectReceiptPrint();
    });
  }

  const downloadReceiptBtn = document.getElementById('mgDownloadReceiptBtn');
  if (downloadReceiptBtn && !downloadReceiptBtn.dataset.bound) {
    downloadReceiptBtn.dataset.bound = '1';
    downloadReceiptBtn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadStandaloneReceiptHtml();
    });
  }

  const closePrintModalBtn = document.getElementById('mgClosePrintModalBtn');
  if (closePrintModalBtn && !closePrintModalBtn.dataset.bound) {
    closePrintModalBtn.dataset.bound = '1';
    closePrintModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.closeInvoicePrintSummary();
    });
  }

  const printModalBackdrop = document.getElementById('mgPrintPreviewModal');
  if (printModalBackdrop && !printModalBackdrop.dataset.bound) {
    printModalBackdrop.dataset.bound = '1';
    printModalBackdrop.addEventListener('click', (e) => {
      if (e.target === printModalBackdrop) {
        window.closeInvoicePrintSummary();
      }
    });
  }

  window.addEventListener('beforeprint', () => {
    renderPrintableReceiptSummary();
  });

  // Payment method radio change
  document.querySelectorAll('input[name="options"]').forEach((radio) => {
    if (radio.dataset.bound) return;
    radio.dataset.bound = '1';
    radio.addEventListener('change', () => {
      document.querySelectorAll('.mg-invoice-pay-options .mg-radio-card').forEach((lbl) => {
        const inp = lbl.querySelector('input[type="radio"]');
        lbl.classList.toggle('is-selected', Boolean(inp && inp.checked));
      });
      invoiceState.payMethod = radio.id;
      renderInvoicePageDom();
    });
  });

  // Table selector dropdown change
  const tableSelector = document.getElementById('invoiceTableSelector');
  if (tableSelector && !tableSelector.dataset.bound) {
    tableSelector.dataset.bound = '1';
    tableSelector.addEventListener('change', () => {
      syncTableDataForSelection(tableSelector.value);
      renderInvoicePageDom();
    });
  }

  // Delete row buttons inside game/buffet invoice tables
  const sectionEl = document.getElementById('mgInvoiceSection');
  if (sectionEl && !sectionEl.dataset.deleteBound) {
    sectionEl.dataset.deleteBound = '1';
    sectionEl.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.mg-remove-invoice-row');
      if (!removeBtn) return;
      const type = removeBtn.getAttribute('data-remove-type');
      const rowId = removeBtn.getAttribute('data-row-id');
      if (type === 'game') {
        invoiceState.gameItems = invoiceState.gameItems.filter((item) => item.id !== rowId);
      } else if (type === 'buffet') {
        invoiceState.buffetItems = invoiceState.buffetItems.filter((item) => item.id !== rowId);
      }
      renderInvoicePageDom();
    });
  }

  // Payment settlement button
  const paymentButton = document.getElementById('paymentButton');
  if (paymentButton && !paymentButton.dataset.bound) {
    paymentButton.dataset.bound = '1';
    paymentButton.addEventListener('click', () => {
      const payWay = getSelectedPayMethodId();
      const totals = computeTotals();
      const primaryConsole =
        invoiceState.gameItems.length > 0 ? invoiceState.gameItems[0].consoleType : 'ps50';
      const buffetPayment = buildBuffetPaymentPayload();
      const paydate = new Date().toISOString();
      const factorName = invoiceState.tableNumber;

      if (payWay === 'cash') {
        $.ajax({
          type: 'POST',
          url: './cashPay.php',
          data: {
            gameTotal: totals.gameTotal,
            consoleType: primaryConsole,
            BuffetPrice: buffetPayment,
            paydate,
          },
        }).always(() => {
          settleInvoiceAndCleanup(factorName);
        });
      } else if (payWay === 'pos') {
        $.ajax({
          type: 'POST',
          url: './creditpay.php',
          data: {
            gameTotal: totals.gameTotal,
            consoleType: primaryConsole,
            BuffetPrice: buffetPayment,
            paydate,
          },
        }).always(() => {
          settleInvoiceAndCleanup(factorName);
        });
      } else if (payWay === 'acount') {
        const customerModal = document.getElementById('customerModal');
        if (customerModal) {
          customerModal.style.display = 'block';
        }
      } else if (payWay === 'debt') {
        const debtModal = document.getElementById('debtModal');
        if (debtModal) {
          debtModal.style.display = 'block';
        }
      }
    });
  }

  // Customer account settlement modal form
  const customerModal = document.getElementById('customerModal');
  const customerForm = document.getElementById('customerForm');
  if (customerModal && !customerModal.dataset.bound) {
    customerModal.dataset.bound = '1';
    customerModal.querySelectorAll('.close').forEach((btn) => {
      btn.addEventListener('click', () => {
        customerModal.style.display = 'none';
      });
    });
  }
  if (customerForm && !customerForm.dataset.bound) {
    customerForm.dataset.bound = '1';
    customerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customerId = document.getElementById('customerId')?.value;
      const totals = computeTotals();
      const primaryConsole =
        invoiceState.gameItems.length > 0 ? invoiceState.gameItems[0].consoleType : 'ps50';
      const buffetPayment = buildBuffetPaymentPayload();
      const paydate = new Date().toISOString();

      $.ajax({
        type: 'POST',
        url: './customerpay.php',
        data: {
          gameTotal: totals.gameTotal,
          consoleType: primaryConsole,
          BuffetPrice: buffetPayment,
          paydate,
        },
      });

      $.ajax({
        type: 'POST',
        url: './costumercharge.php',
        data: { totalcost: totals.payable, customerId },
        dataType: 'json',
        success(response) {
          if (response && response.error) {
            showInvoiceNotice(response.error, 'error');
          } else {
            if (customerModal) customerModal.style.display = 'none';
            settleInvoiceAndCleanup(invoiceState.tableNumber);
          }
        },
        error() {
          showInvoiceNotice('کد اشتراک معتبر نیست یا موجودی کافی نمی‌باشد.', 'error');
        },
      });
    });
  }

  // Debt settlement modal form
  const debtModal = document.getElementById('debtModal');
  const debtForm = document.getElementById('debtForm');
  if (debtModal && !debtModal.dataset.bound) {
    debtModal.dataset.bound = '1';
    debtModal.querySelectorAll('.close').forEach((btn) => {
      btn.addEventListener('click', () => {
        debtModal.style.display = 'none';
      });
    });
  }
  if (debtForm && !debtForm.dataset.bound) {
    debtForm.dataset.bound = '1';
    debtForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const debtorname = document.getElementById('debtName')?.value;
      const totals = computeTotals();
      const primaryConsole =
        invoiceState.gameItems.length > 0 ? invoiceState.gameItems[0].consoleType : 'ps50';
      const buffetPayment = buildBuffetPaymentPayload();
      const paydate = new Date().toISOString();

      $.ajax({
        type: 'POST',
        url: './debtpay.php',
        data: {
          gameTotal: totals.gameTotal,
          consoleType: primaryConsole,
          totalBuffetPrice: totals.buffetTotal,
          BuffetPrice: buffetPayment,
          paydate,
          debtorname,
        },
      }).always(() => {
        if (debtModal) debtModal.style.display = 'none';
        settleInvoiceAndCleanup(invoiceState.tableNumber);
      });
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeInvoicePrintSummary();
      if (customerModal) customerModal.style.display = 'none';
      if (debtModal) debtModal.style.display = 'none';
    }
  });
}

async function initInvoicePage() {
  bindInvoiceInteractions();

  const [gameRes, buffetRes, reservationsRes, dataRes] = await Promise.allSettled([
    fetch('game_temporary.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})),
    fetch('buffet_temporary.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : {})),
    fetch('reservations.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    fetch('data.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { consoles: [] })),
  ]);

  invoiceState.gameTempMap =
    gameRes.status === 'fulfilled' && gameRes.value && typeof gameRes.value === 'object'
      ? gameRes.value
      : {};
  invoiceState.buffetTempMap =
    buffetRes.status === 'fulfilled' && buffetRes.value && typeof buffetRes.value === 'object'
      ? buffetRes.value
      : {};
  invoiceState.reservationsList =
    reservationsRes.status === 'fulfilled' && Array.isArray(reservationsRes.value)
      ? reservationsRes.value
      : [];
  invoiceState.consolesCatalog =
    dataRes.status === 'fulfilled' && dataRes.value && Array.isArray(dataRes.value.consoles)
      ? dataRes.value.consoles
      : [];

  const tableSet = new Set([
    ...Object.keys(invoiceState.gameTempMap),
    ...Object.keys(invoiceState.buffetTempMap),
    ...invoiceState.reservationsList.map((r) => String(r.tableNumber)),
  ]);

  if (requestedTable) {
    tableSet.add(String(requestedTable));
  }

  const tables = Array.from(tableSet).filter(Boolean);
  invoiceState.availableTables = tables;

  const chosenTable =
    requestedTable && tableSet.has(String(requestedTable))
      ? String(requestedTable)
      : tables[0] || '1';

  const switcherWrap = document.getElementById('invoiceTableSwitcherWrap');
  const selector = document.getElementById('invoiceTableSelector');
  if (switcherWrap && selector && tables.length > 0) {
    switcherWrap.style.display = 'inline-flex';
    selector.innerHTML = tables
      .map(
        (t) =>
          `<option value="${t}" ${String(t) === String(chosenTable) ? 'selected' : ''}>میز شماره ${toFaDigits(
            t
          )}</option>`
      )
      .join('');
  }

  syncTableDataForSelection(chosenTable);
  renderInvoicePageDom();
}

window.renderInvoicePage = initInvoicePage;
initInvoicePage();