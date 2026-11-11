function renderDebtorsTable(jsonData) {
  if (!Array.isArray(jsonData)) return;
  const tableEl = document.getElementById('DebtorsTable');
  if (!tableEl) return;
  const tableBody = tableEl.getElementsByTagName('tbody')[0];
  if (!tableBody) return;
  tableBody.innerHTML = '';
  let rowNumber = 1;

  jsonData.forEach((debtorItem) => {
    const debtorId = Object.keys(debtorItem)[0];
    const debtorData = debtorItem[debtorId];
    if (!debtorData) return;

    const newRow = tableBody.insertRow();
    for (let i = 0; i < 7; i++) {
      newRow.insertCell(i);
    }

    const cells = newRow.cells;
    cells[0].innerHTML = rowNumber.toLocaleString('fa-IR');
    cells[1].innerHTML = debtorData.debtorname;

    const date = new Date(debtorData.paydate);
    const options = {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    };

    cells[2].innerHTML = parseFloat(debtorData.gameTotal).toLocaleString('fa-IR') + ' تومان';
    cells[3].innerHTML = parseFloat(debtorData.totalBuffetPrice).toLocaleString('fa-IR') + ' تومان';
    cells[4].innerHTML =
      (parseFloat(debtorData.totalBuffetPrice) + parseFloat(debtorData.gameTotal)).toLocaleString('fa-IR') +
      ' تومان';
    cells[5].innerHTML = date.toLocaleDateString('fa-IR', options);

    cells[6].innerHTML = `
      <button class="btn btn-round btn-warning btn-xs delete-button1" data-checkout-cash-id="${debtorData.debtorId}" data-checkout-cash-game="${debtorData.gameTotal}" data-checkout-cash-buffet="${encodeURIComponent(JSON.stringify(debtorData.BuffetPrice))}" data-checkout-cash-console="${debtorData.consoleType}">
        <i class="fa fa-wallet"></i> تسویه نقدی
      </button>
      <button class="btn btn-round btn-info btn-xs delete-button2" data-checkout-pos-id="${debtorData.debtorId}" data-checkout-pos-console="${debtorData.consoleType}" data-checkout-pos-game="${debtorData.gameTotal}" data-checkout-pos-buffet="${encodeURIComponent(JSON.stringify(debtorData.BuffetPrice))}">
        <i class="fa fa-fax"></i> تسویه کارتخوان
      </button>
    `;

    rowNumber++;
  });
}

window.renderDebtorsPage = function renderDebtorsPage() {
  try {
    const cachedBundle = sessionStorage.getItem('mg_bundle_v1');
    if (cachedBundle) {
      const parsed = JSON.parse(cachedBundle);
      if (parsed && Array.isArray(parsed['debtpay.json'])) {
        renderDebtorsTable(parsed['debtpay.json']);
      }
    }
  } catch {
    // ignore cache error
  }

  fetch('./debtpay.json')
    .then((response) => response.json())
    .then((jsonData) => {
      renderDebtorsTable(jsonData);
    })
    .catch(() => {});
};

window.renderDebtorsPage();

if (!window.__mgDebtorsEventsBound) {
  window.__mgDebtorsEventsBound = true;

  document.addEventListener('click', function (event) {
    const cashBtn = event.target.closest('.delete-button1');
    if (cashBtn) {
      const debtorId = cashBtn.getAttribute('data-checkout-cash-id');
      const gameTotal = cashBtn.getAttribute('data-checkout-cash-game');
      const consoleType = cashBtn.getAttribute('data-checkout-cash-console');
      const paydate = new Date().toISOString();
      const buffetPrices = JSON.parse(
        decodeURIComponent(cashBtn.getAttribute('data-checkout-cash-buffet') || '{}')
      );

      if (window.$ && $.ajax) {
        $.ajax({
          type: 'POST',
          url: 'cashPay.php',
          data: { gameTotal, BuffetPrice: buffetPrices, consoleType, paydate },
        });
        $.ajax({
          type: 'POST',
          url: 'delete_debtors.php',
          data: { debtorId },
        });
      }

      const rowToRemove = cashBtn.closest('tr');
      if (rowToRemove) rowToRemove.remove();
    }

    const posBtn = event.target.closest('.delete-button2');
    if (posBtn) {
      const debtorId = posBtn.getAttribute('data-checkout-pos-id');
      const gameTotal = posBtn.getAttribute('data-checkout-pos-game');
      const buffetPrices = JSON.parse(
        decodeURIComponent(posBtn.getAttribute('data-checkout-pos-buffet') || '{}')
      );
      const consoleType = posBtn.getAttribute('data-checkout-pos-console');
      const paydate = new Date().toISOString();

      if (window.$ && $.ajax) {
        $.ajax({
          type: 'POST',
          url: './creditpay.php',
          data: { gameTotal, BuffetPrice: buffetPrices, consoleType, paydate },
        });
        $.ajax({
          type: 'POST',
          url: 'delete_debtors.php',
          data: { debtorId },
        });
      }

      const rowToRemove = posBtn.closest('tr');
      if (rowToRemove) rowToRemove.remove();
    }
  });
}