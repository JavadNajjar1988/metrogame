function renderCustomersTable(jsonData) {
  if (!jsonData) return;
  const tableEl = document.getElementById('customerTable');
  if (!tableEl) return;
  const tableBody = tableEl.getElementsByTagName('tbody')[0];
  if (!tableBody) return;
  tableBody.innerHTML = '';
  let rowNumber = 1;

  for (const key in jsonData) {
    if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
      const costomereData = jsonData[key];
      const newRow = tableBody.insertRow();
      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);
      const cell5 = newRow.insertCell(4);

      cell1.innerHTML = rowNumber.toLocaleString('fa-IR');
      cell2.innerHTML = costomereData.customerId;
      cell3.innerHTML = costomereData.customerName;
      cell4.innerHTML =
        costomereData.accountCharge !== null
          ? parseFloat(costomereData.accountCharge).toLocaleString('fa-IR') + ' تومان'
          : '';
      cell5.innerHTML = `
        <button class="btn btn-round btn-warning btn-xs edit-button" data-customer-id="${costomereData.customerId}" data-customer-charge="${costomereData.accountCharge}" data-customer-name="${encodeURIComponent(costomereData.customerName)}">
          <i class="fa fa-pen-to-square"></i> ویرایش
        </button>
        <button class="btn btn-round btn-danger btn-xs delete-button" data-customer-id="${costomereData.customerId}">
          <i class="fa fa-trash"></i> حذف
        </button>
      `;
      rowNumber++;
    }
  }
}

window.renderAccountsPage = function renderAccountsPage() {
  try {
    const cachedBundle = sessionStorage.getItem('mg_bundle_v1');
    if (cachedBundle) {
      const parsed = JSON.parse(cachedBundle);
      if (parsed && parsed['customer_data.json']) {
        renderCustomersTable(parsed['customer_data.json']);
      }
    }
  } catch {
    // ignore cache error
  }

  fetch('./customer_data.json')
    .then((response) => response.json())
    .then((jsonData) => {
      renderCustomersTable(jsonData);
    })
    .catch(() => {});
};

window.renderAccountsPage();

if (!window.__mgAccountsEventsBound) {
  window.__mgAccountsEventsBound = true;

  document.addEventListener('click', function (event) {
    const delBtn = event.target.closest('.delete-button');
    if (delBtn && delBtn.hasAttribute('data-customer-id') && document.getElementById('customerTable')) {
      const customerId = delBtn.getAttribute('data-customer-id');
      const rowToRemove = delBtn.closest('tr');
      if (rowToRemove) {
        rowToRemove.remove();
      }
      fetch('./delete_customer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `customerId=${encodeURIComponent(customerId)}`,
      }).catch(() => {});
    }
  });

  document.addEventListener('click', function (event) {
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
            شارژ حساب ${customerName}
          </h4>
        `;
      }

      const closeBtn = customerModal.querySelector('.close');
      if (closeBtn) {
        closeBtn.onclick = function () {
          customerModal.style.display = 'none';
        };
      }

      const form = document.getElementById('editCustomerForm');
      if (form) {
        form.onsubmit = function (e) {
          e.preventDefault();
          const accountCharge = document.getElementById('editAcountCharge')?.value || '0';
          fetch('./editCustomerCharge.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `accountCharge=${encodeURIComponent(accountCharge)}&customerId=${encodeURIComponent(customerId)}`,
          })
            .then(() => {
              customerModal.style.display = 'none';
              window.renderAccountsPage();
            })
            .catch(() => {});
        };
      }
    }
  });
}
