function renderBuffetTable(data) {
  if (!Array.isArray(data)) return;
  const tableBody = document.querySelector('#buffetTable tbody');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  for (let i = 0; i < data.length; i++) {
    const productId = data[i].productCode;
    const row = document.createElement('tr');
    const formattedPrice = parseFloat(data[i].unitPrice).toLocaleString('fa-IR');
    row.innerHTML = `
      <td>${data[i].productCode}</td>
      <td><i class="fa-light ${data[i].iconName}" style="font-size: 25px;" title="${data[i].title}"></i></td>
      <td>${data[i].title}</td>
      <td>${formattedPrice} تومان</td>
      <td><button class="btn btn-danger btn-xs" data-product-id="${productId}" onclick="deleteProduct(this)"><i class="fa fa-trash-o"></i> حذف</button></td>
    `;
    tableBody.appendChild(row);
  }
}

function loadData() {
  try {
    const cachedBundle = sessionStorage.getItem('mg_bundle_v1');
    if (cachedBundle) {
      const parsed = JSON.parse(cachedBundle);
      if (parsed && Array.isArray(parsed['products.json'])) {
        renderBuffetTable(parsed['products.json']);
      }
    }
  } catch {
    // ignore cache error
  }

  fetch('products.json')
    .then((r) => (r.ok ? r.json() : []))
    .then((data) => {
      renderBuffetTable(data);
    })
    .catch(() => {});
}

window.renderBuffetPage = loadData;
loadData();

window.deleteRow = function deleteRow(button) {
  const row = button.closest('tr');
  if (row) row.remove();
};

window.deleteProduct = function deleteProduct(button) {
  const productId = button.dataset.productId;
  const row = button.closest('tr');
  if (row) row.remove();
  fetch('delete_product.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `id=${encodeURIComponent(productId)}`,
  }).catch(() => {});
};