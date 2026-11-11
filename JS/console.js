let data = {};

function renderConsoleTable(jsonData) {
  if (!jsonData || !jsonData.consoles) return;
  data = jsonData;
  const tableEl = document.getElementById('consoleTable');
  if (!tableEl) return;
  const tableBody = tableEl.getElementsByTagName('tbody')[0];
  if (!tableBody) return;
  tableBody.innerHTML = '';
  let rowNumber = 1;

  for (const key in data.consoles) {
    if (Object.prototype.hasOwnProperty.call(data.consoles, key)) {
      const consoleData = data.consoles[key];
      const newRow = tableBody.insertRow();
      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);
      const cell5 = newRow.insertCell(4);
      const cell6 = newRow.insertCell(5);
      const cell7 = newRow.insertCell(6);

      cell1.innerHTML = rowNumber.toLocaleString('fa-IR');
      cell2.innerHTML = `<i class="demo-icon icon-${consoleData.name.toLowerCase()}" style="font-size: 30px;"></i>`;
      cell3.innerHTML =
        consoleData.one_player_price !== null
          ? parseFloat(consoleData.one_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell4.innerHTML =
        consoleData.two_player_price !== null
          ? parseFloat(consoleData.two_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell5.innerHTML =
        consoleData.three_player_price !== null
          ? parseFloat(consoleData.three_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell6.innerHTML =
        consoleData.four_player_price !== null
          ? parseFloat(consoleData.four_player_price).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell7.innerHTML = `
        <button class="btn btn-danger btn-xs delete-button" data-console-id="${consoleData.name}">
          <i class="fa fa-trash-o"></i> حذف
        </button>
      `;
      rowNumber++;
    }
  }
}

window.setTitle = function setTitle(radio) {
  const selectedTitle = radio.getAttribute('data-title');
  const titleInput = document.getElementById('selectedTitle');
  if (titleInput && selectedTitle) titleInput.value = selectedTitle;
};

window.renderConsolePage = function renderConsolePage() {
  try {
    const cachedBundle = sessionStorage.getItem('mg_bundle_v1');
    if (cachedBundle) {
      const parsed = JSON.parse(cachedBundle);
      if (parsed && parsed['data.json']) {
        renderConsoleTable(parsed['data.json']);
      }
    }
  } catch {
    // ignore cache error
  }

  fetch('data.json')
    .then((response) => response.json())
    .then((jsonData) => {
      renderConsoleTable(jsonData);
    })
    .catch((error) => console.error('خطا در دریافت و پردازش داده: ', error));
};

window.renderConsolePage();

if (!window.__mgConsoleDeleteBound) {
  window.__mgConsoleDeleteBound = true;
  document.addEventListener('click', function (event) {
    const btn = event.target.closest('.delete-button');
    if (btn && btn.hasAttribute('data-console-id')) {
      const consoleId = btn.getAttribute('data-console-id');
      const rowToRemove = btn.closest('tr');
      if (rowToRemove) {
        rowToRemove.remove();
      }
      fetch('./delete_console.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `consoleId=${consoleId}`,
      }).catch((error) => console.error('خطا در ارسال درخواست: ', error));
    }
  });
}