fetch('./customer_data.json')
.then(response => response.json())
.then(jsonData => {
data = jsonData; // ذخیره داده‌های JSON در متغیر گلوبال
const tableBody = document.getElementById('customerTable').getElementsByTagName('tbody')[0];
let rowNumber = 1;

// پردازش داده‌های JSON و ایجاد ردیف‌های جدول
for (const key in data) {
if (data.hasOwnProperty(key)) {
const costomereData = data[key];
const newRow = tableBody.insertRow();
const cell1 = newRow.insertCell(0);
const cell2 = newRow.insertCell(1);
const cell3 = newRow.insertCell(2);
const cell4 = newRow.insertCell(3);
const cell5 = newRow.insertCell(4);

cell1.innerHTML = rowNumber.toLocaleString('fa-IR'); // تغییر شماره ردیف به فارسی
cell2.innerHTML = costomereData.customerId;
cell3.innerHTML = costomereData.customerName;
cell4.innerHTML = costomereData.accountCharge !== null ? parseFloat(costomereData.accountCharge).toLocaleString('fa-IR') + ' تومان' : '';
cell5.innerHTML = `

<button class="btn btn-round btn-warning btn-xs edit-button" data-customer-id="${costomereData.customerId}" data-customer-charge="${costomereData.accountCharge}" data-customer-name="${encodeURIComponent(costomereData.customerName)}">
<i class="fa fa-pen-to-square"></i> ویرایش
</button>
<button class="btn btn-round btn-danger btn-xs delete-button" data-customer-id="${costomereData.customerId}">
<i class="fa fa-trash"></i> حذف 
</button


`;
rowNumber++;
}
}
});
document.addEventListener('click', function (event) {
if (event.target.classList.contains('delete-button')) {
const customerId = event.target.getAttribute('data-customer-id');

alert('آیا مطمئن هستید؟');
// انجام عملیات حذف از جدول HTML
const rowToRemove = event.target.closest('tr');
if (rowToRemove) {
rowToRemove.remove();
}

// ایجاد درخواست با fetch API
$.ajax({
type: 'POST',
url: './delete_customer.php',
data: { customerId: customerId },
success: function (response) {
// اینجا می‌توانید هر عملیات پس از موفقیتی که نیاز دارید را انجام دهید
},
error: function (xhr, status, error) {
// اینجا می‌توانید با خطاها مدیریتی کنید
console.log('خطا در ارسال درخواست: ' + error);
}
})

}

})
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('edit-button')) {
      
        const customerId = event.target.getAttribute('data-customer-id');
        let customerModal = document.getElementById('editCustomerModal');
        const customerName = decodeURIComponent(event.target.getAttribute('data-customer-name'));

        customerModal.style.display = 'block';
        var editCustomerModalHeader = document.getElementById('editCustomerModalhesder');

        editCustomerModalHeader.innerHTML = `
            <h4>
                <i class="fa fa-file-user"></i>
                شارژ حساب  ${customerName}
            </h4>
        `;

        window.addEventListener('click', function (event) {
            if (event.target == customerModal) {
                customerModal.style.display = 'none';
                location.reload();
            }
        });

        window.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                customerModal.style.display = 'none';
                location.reload();
            }
        });

        let closeSpan = document.createElement('span');
        closeSpan.classList.add('close');
        closeSpan.textContent = '';

        closeSpan.addEventListener('click', function () {
            customerModal.style.display = 'none';
            location.reload();
        });
        customerModal.querySelector('.customer-modal-content').appendChild(closeSpan);

        const form = document.getElementById('editCustomerForm');
        form.addEventListener('submit', e => {
            e.preventDefault();
            const accountCharge = document.getElementById('editAcountCharge').value;


            $.ajax({
        type: 'POST',
        url: './editCustomerCharge.php',
        data: { accountCharge: accountCharge, customerId: customerId },
        success: function (response) {
            console.log(response);
            alert('عملیات موفقیت‌آمیز! نام مشتری: ' + response.customerName);
              location.reload();
        },
        error: function (xhr, status, error) {
            console.log('خطا در ارسال درخواست: ' + error);
        }
    })
  
        });
    }
});
