
fetch('./debtpay.json')
  .then(response => response.json())
  .then(jsonData => {
    const tableBody = document.getElementById('DebtorsTable').getElementsByTagName('tbody')[0];
    let rowNumber = 1;

    jsonData.forEach(debtorItem => {
      const debtorId = Object.keys(debtorItem)[0];
      const debtorData = debtorItem[debtorId];

      const newRow = tableBody.insertRow();

      // Insert cells and populate them with data
      for (let i = 0; i < 7; i++) {
        newRow.insertCell(i);
      }

      const cells = newRow.cells;

      cells[0].innerHTML = rowNumber.toLocaleString('fa-IR');
      cells[1].innerHTML = debtorData.debtorname;

      const date = new Date(debtorData.paydate);
      const options = {
        day: "numeric",
        month: "numeric",
        year: "numeric"
      };

      // ...
      // (populate other cells)
      // ...

      cells[2].innerHTML = parseFloat(debtorData.gameTotal).toLocaleString('fa-IR') + ' تومان';
      cells[3].innerHTML = parseFloat(debtorData.totalBuffetPrice).toLocaleString('fa-IR') + ' تومان';
      cells[4].innerHTML = (parseFloat(debtorData.totalBuffetPrice) + parseFloat(debtorData.gameTotal)).toLocaleString('fa-IR') + ' تومان';
      cells[5].innerHTML = date.toLocaleDateString("fa-IR", options);

      // ...
    
    

      cells[6].innerHTML = `
      <button class="btn btn-round btn-warning btn-xs delete-button1" data-checkout-cash-id="${debtorData.debtorId}" data-checkout-cash-game="${debtorData.gameTotal}" data-checkout-cash-buffet="${encodeURIComponent(JSON.stringify(debtorData.BuffetPrice))}" data-checkout-cash-console="${debtorData.consoleType}">
  <i class="fa fa-wallet"></i> تسویه نقدی
</button>

<button class="btn btn-round btn-info btn-xs delete-button2" data-checkout-pos-id="${debtorData.debtorId}" data-checkout-pos-console="${debtorData.consoleType}" data-checkout-pos-game="${debtorData.gameTotal}" data-checkout-pos-buffet="${encodeURIComponent(JSON.stringify(debtorData.BuffetPrice))}">
  <i class="fa fa-fax"></i> تسویه کارتخوان
</button>

      `;
      
      
      rowNumber++;
    

    })
  


document.addEventListener('click', function (event) {
if (event.target.classList.contains('delete-button1')) {
 
  const debtorId = event.target.getAttribute('data-checkout-cash-id');
  const gameTotal = event.target.getAttribute('data-checkout-cash-game');
  const consoleType = event.target.getAttribute('data-checkout-cash-console');
  const paydate = new Date()
  const buffetPrices = JSON.parse(decodeURIComponent(event.target.getAttribute('data-checkout-cash-buffet'))); 

  $.ajax({
          type: 'POST',
          url: 'cashPay.php',
          data: { gameTotal: gameTotal,BuffetPrice:buffetPrices,consoleType:consoleType,paydate:paydate },
          success: function () {
           
          },
          error: function(xhr, status, error) {
            
          }
      })

// انجام عملیات حذف از جدول HTML
    const rowToRemove = event.target.closest('tr');
    if (rowToRemove) {
      rowToRemove.remove();
    }
 alert('آیا مطمئن هستید؟'); 
  // ایجاد درخواست با fetch API
  $.ajax({
          type: 'POST',
          url: 'delete_debtors.php',
          data: { debtorId: debtorId },
          success: function () {
                        },
          error: function ( error) {
              // اینجا می‌توانید با خطاها مدیریتی کنید
              
          }
      })
  
}

})
document.addEventListener('click', function (event) {
if (event.target.classList.contains('delete-button2')) {
 
  const debtorId = event.target.getAttribute('data-checkout-pos-id');
  const gameTotal = event.target.getAttribute('data-checkout-pos-game');
  const buffetPrices = JSON.parse(decodeURIComponent(event.target.getAttribute('data-checkout-pos-buffet'))); 
  const consoleType = event.target.getAttribute('data-checkout-pos-console');
  const paydate =new Date()
  
  $.ajax({
          type: 'POST',
          url: './creditpay.php',
          data: { gameTotal: gameTotal,BuffetPrice:buffetPrices,consoleType:consoleType,paydate:paydate },
          success: function () {
           
          },
          error: function (xhr, status, error) {
              // اینجا می‌توانید با خطاها مدیریتی کنید
              console.log('خطا در ارسال درخواست: ' + error);
          }
      })

// انجام عملیات حذف از جدول HTML
    const rowToRemove = event.target.closest('tr');
    if (rowToRemove) {
      rowToRemove.remove();
    }
  // ایجاد درخواست با fetch API

  alert('آیا مطمئن هستید؟');
  $.ajax({
          type: 'POST',
          url: 'delete_debtors.php',
          data: { debtorId: debtorId },
          success: function (response) {
          
          },
          error: function (xhr, status, error) {
    
          }
      })
  
}

})


});