fetch('./console_costs.php')
  .then(response => response.json())
  .then(data => {
    setTimeout(function () {
      location.reload();
  }, 500);
    
    if (data.error) {
        // نمایش پیغام خطا در المان با id="error-message"
        document.getElementById('error-message').innerHTML = data.error;
    } else {
        // در صورت موفقیت، انتقال به صفحه دیگر یا انجام عملیات مورد نیاز
        window.location.href = "console.html";
    }
  })
  .catch(error => {
    console.error('خطا در درخواست fetch:', error);
  });



fetch('data.json')
.then(response => response.json())
.then(jsonData => {
  data = jsonData; // ذخیره داده‌های JSON در متغیر گلوبال
  const tableBody = document.getElementById('consoleTable').getElementsByTagName('tbody')[0];
  let rowNumber = 1;

  // پردازش داده‌های JSON و ایجاد ردیف‌های جدول
  for (const key in data.consoles) {
    if (data.consoles.hasOwnProperty(key)) {
      const consoleData = data.consoles[key];
      const newRow = tableBody.insertRow();
      const cell1 = newRow.insertCell(0);
      const cell2 = newRow.insertCell(1);
      const cell3 = newRow.insertCell(2);
      const cell4 = newRow.insertCell(3);
      const cell5 = newRow.insertCell(4);
      const cell6 = newRow.insertCell(5);
      const cell7 = newRow.insertCell(6);

      cell1.innerHTML = rowNumber.toLocaleString('fa-IR'); // تغییر شماره ردیف به فارسی
      cell2.innerHTML = `<i class="demo-icon icon-${consoleData.name.toLowerCase()}" style="font-size: 30px;"></i>`;
     
      // ...
// ...
cell3.innerHTML = consoleData.one_player_price !== null ? parseFloat(consoleData.one_player_price).toLocaleString('fa-IR') + ' تومان' : '';
cell4.innerHTML = consoleData.two_player_price !== null ? parseFloat(consoleData.two_player_price).toLocaleString('fa-IR') + ' تومان' : '';
cell5.innerHTML = consoleData.three_player_price !== null ? parseFloat(consoleData.three_player_price).toLocaleString('fa-IR') + ' تومان' : '';
cell6.innerHTML = consoleData.four_player_price !== null ? parseFloat(consoleData.four_player_price).toLocaleString('fa-IR') + ' تومان' : '';
// ...

// ...

      cell7.innerHTML = `
       
        <button class="btn btn-danger btn-xs delete-button" data-console-id="${consoleData.name}">
<i class="fa fa-trash-o"></i> حذف
</button>


      `;

      rowNumber++;
    }
  }
})
.catch(error => console.error('خطا در دریافت و پردازش داده: ', error));
document.addEventListener('click', function (event) {
if (event.target.classList.contains('delete-button')) {
  const consoleId = event.target.getAttribute('data-console-id');

// انجام عملیات حذف از جدول HTML
    const rowToRemove = event.target.closest('tr');
    if (rowToRemove) {
      rowToRemove.remove();
    }

  // ایجاد درخواست با fetch API
  fetch('./delete_console.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `consoleId=${consoleId}`,
  })
  .then(response => response.text())
  .then(result => {
  })
  .catch(error => console.error('خطا در ارسال درخواست: ', error));
}
});