var factor_name = ""
let buffetPayment = [];

         fetch('game_temporary.json')
  .then(response => response.json())
  .then(jsonData => {
    const tableBody = document.getElementById('invoicegameTable').getElementsByTagName('tbody')[0];
    let rowNumber = 1;
    // ایجاد یک حلقه برای پیمایش دسته‌ها
    for (const categoryName in jsonData) {
        factor_name = categoryName
      if (jsonData.hasOwnProperty(categoryName)) {
        // دریافت داده‌های مرتبط با دسته
        const categoryData = jsonData[categoryName];
        // ایجاد حلقه دیگر برای پیمایش داده‌های هر دسته
        for (const key in categoryData) {
                    

          if (categoryData.hasOwnProperty(key)) {
            const consoleData = categoryData[key];
            const newRow = tableBody.insertRow();
            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            const cell4 = newRow.insertCell(3);
            const cell5 = newRow.insertCell(4);
            
            cell1.innerHTML = rowNumber.toLocaleString('fa-IR');
            cell2.innerHTML = `<i class="demo-icon icon-${consoleData.consoleType.toLowerCase()}" style="font-size: 30px;"></i>`;
        if (consoleData.priceType === 'one_player_price') {
            cell3.innerHTML ='<td>یک نفره</td>';
          } else if (consoleData.priceType === 'two_player_price') {
              cell3.innerHTML ='<td>دو نفره</td>';
          } else if (consoleData.priceType === 'three_player_price') {
              cell3.innerHTML ='<td>سه نفره</td>';
          } else if (consoleData.priceType === 'four_player_price') {
              cell3.innerHTML ='<td>چهار نفره</td>';
          }
      
            cell4.innerHTML = consoleData.unitprice !== null ? parseFloat(consoleData.cosoleprice).toLocaleString('fa-IR') + ' تومان' : '';
            cell5.innerHTML = consoleData.gameCost !== null ? parseFloat(consoleData.gameCost).toLocaleString('fa-IR') + ' تومان' : '';
            
            rowNumber++;
            var gameTotal = consoleData.gameCost
            var consoleType = consoleData.consoleType
          }
        }
      }
    }
    let seenItems = [];


    fetch('buffet_temporary.json')
  .then(response => response.json())
  .then(jsonData => {
    const tableBody = document.getElementById('invoicebuffetTable').getElementsByTagName('tbody')[0];
    let rowNumber = 1;
    
    let totalBuffetPrice = 0; // متغیر برای نگهداری مجموع محاسبات
    
    // ایجاد یک حلقه برای پیمایش دسته‌ها
    for (const categoryName in jsonData) {
      if (jsonData.hasOwnProperty(categoryName)) {
        // دریافت داده‌های مرتبط با دسته
        const categoryData = jsonData[factor_name];
        
        // ایجاد حلقه دیگر برای پیمایش داده‌های هر دسته
        for (const key in categoryData) {
          if (categoryData.hasOwnProperty(key)) {
            const buffetData = categoryData[key];
            const itemKey = buffetData.productType + '-' + (buffetData.unitPrice * buffetData.quantity);
            if (seenItems.includes(itemKey)) {
              continue; // اگر تکراری بود، به ردیف بعدی برو
            } else {
              seenItems.push(itemKey);
            }
            const newRow = tableBody.insertRow();
            const cell1 = newRow.insertCell(0);
            const cell2 = newRow.insertCell(1);
            const cell3 = newRow.insertCell(2);
            const cell4 = newRow.insertCell(3);
            const cell5 = newRow.insertCell(4);
            
            cell1.innerHTML = rowNumber.toLocaleString('fa-IR');
            cell2.innerHTML = buffetData.title;
            cell3.innerHTML = parseFloat(buffetData.quantity).toLocaleString('fa-IR');
            cell4.innerHTML = buffetData.unitPrice !== null ? parseFloat(buffetData.unitPrice).toLocaleString('fa-IR') + ' تومان' : '';
            
            // محاسبه مقدار واحد بوفه برای ردیف فعلی
            const rowBuffetPrice = (buffetData.unitPrice * buffetData.quantity) || 0;
            cell5.innerHTML = rowBuffetPrice !== null ? parseFloat(rowBuffetPrice).toLocaleString('fa-IR') + ' تومان' : '';
            
            totalBuffetPrice += rowBuffetPrice; // اضافه کردن مقدار واحد به مجموع کل
            buffetPayment.push([
              buffetData.productType,
              buffetData.unitPrice * buffetData.quantity,
          ]);
            rowNumber++;
           
          }
        }
      }
    }
const date = new Date();
const options = {
    weekday: "long",
    day: "numeric",
    month: "numeric",
    year: "numeric"
};

// دریافت المان هدر
var invoiceHeader = document.getElementById('invoiceHeader');

// تنظیم متن هدر با استفاده از factor_name و تاریخ
invoiceHeader.innerHTML = `
  <h2>
    <i class="fa fa-file-invoice"></i>
    صورت حساب میز شماره ${parseFloat(factor_name).toLocaleString('fa-IR')}
    <small class="pull-left">تاریخ: ${date.toLocaleDateString("fa-IR", options)}</small>
  </h2>
`;



//مجموع فاکتورها


// محاسبه و نمایش مجموع بازی‌ها و بوفه
document.querySelector('#invoiceTotalTable tbody tr:nth-child(1) td').textContent = parseFloat(gameTotal).toLocaleString('fa-IR') + ' تومان';
document.querySelector('#invoiceTotalTable tbody tr:nth-child(2) td').textContent = totalBuffetPrice.toLocaleString('fa-IR') + ' تومان';

// محاسبه و نمایش مجموع کل
const total = parseFloat(gameTotal) + parseFloat(totalBuffetPrice);
document.querySelector('#invoiceTotalTable tbody tr:nth-child(3) td').textContent = total.toLocaleString('fa-IR') + ' تومان';

// قابل پرداخت برابر با مجموع کل است
document.querySelector('#invoiceTotalTable tbody tr:nth-child(4) td').textContent = (Math.round(total / 1000) * 1000).toLocaleString('fa-IR') + ' تومان';
// تعریف مقدار پیش‌فرض برای payWay
var totalcost = (Math.round(total / 1000) * 1000)
var paydate = new Date();
// دستور العمل کلید پرداخت
const paymentButton = document.getElementById('paymentButton');

paymentButton.addEventListener('click', function () {
    payWay = document.querySelector('input[name="options"]:checked').id;
    if (payWay === 'cash') {
      $.ajax({
        type: 'POST',
        url: './cashPay.php', // آدرس کد PHP برای حذف ردیف
        data: {gameTotal: gameTotal,consoleType:consoleType, BuffetPrice: buffetPayment,paydate : paydate},
        
        done: function(response) {
        alert('response');
        },
        error: function() {
        }
        
    });
  
          fetch('./delete_game_temperory.php', {
method: 'POST',
body: `factor_name=${factor_name}`,
headers: {
  'Content-Type': 'application/x-www-form-urlencoded',
}
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.text();
})
.then(data => {
  var newPageUrl = 'index.html'; 
   window.open(newPageUrl, '_self');
})
.catch(error => {
  console.error('خطا در ارتباط با سرور:', error);
  alert('خطا در ارتباط با سرور');
});

fetch('./delete_buffet_temperory.php', {   
  method: 'POST',
  body: `factor_name=${factor_name}`,
headers: {
  'Content-Type': 'application/x-www-form-urlencoded',
}
})
.then(response => {
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.text();
})
.then(data => {
  // عملیات مورد نظر پس از حذف انجام داده شود
})
.catch(error => {
  console.error('خطا در ارتباط با سرور:', error);
  alert('خطا در ارتباط با سرور');
}); 
       
      
       
    } else if (payWay === 'pos') {
     
        

        $.ajax({
          type: 'POST',
          url: './creditpay.php', // آدرس کد PHP برای حذف ردیف
          data: {gameTotal: gameTotal,consoleType:consoleType, BuffetPrice: buffetPayment,paydate : paydate},
          
          done: function(response) {
          
          },
          error: function() {
             
          }
          
      });
    
            fetch('./delete_game_temperory.php', {
  method: 'POST',
  body: `factor_name=${factor_name}`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    var newPageUrl = 'index.html'; 
     window.open(newPageUrl, '_self');
  })
  .catch(error => {
    console.error('خطا در ارتباط با سرور:', error);
    alert('خطا در ارتباط با سرور');
  });

fetch('./delete_buffet_temperory.php', {   
    method: 'POST',
    body: `factor_name=${factor_name}`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    // عملیات مورد نظر پس از حذف انجام داده شود
  })
  .catch(error => {
    console.error('خطا در ارتباط با سرور:', error);
    alert('خطا در ارتباط با سرور');
  }); 
        
        
} else if (payWay === 'acount') {

    $.ajax({
      type: 'POST',
      url: './customerpay.php', // آدرس کد PHP برای حذف ردیف
      data: { gameTotal: gameTotal,consoleType:consoleType, BuffetPrice: buffetPayment,paydate : paydate},
      
      done: function(response) {
      
      },
      error: function() {
         
      }
      
  });

    let  customerModal = document.getElementById('customerModal');
    customerModal.style.display = 'block';
          
            // بستن مودال  با کلیک بیرون از مودال
            window.addEventListener('click', function(event) {
                if (event.target == customerModal) {
                    customerModal.style.display = 'none';
                    location.reload();
                }
            });
        
            // بستن مودال  با کلید ESC
            window.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    customerModal.style.display = 'none';
                    location.reload();
                }
            });
        
        
            // اضافه کردن تگ بستن به مودال 
            let closeSpan = document.createElement('span');
            closeSpan.classList.add('close');
            closeSpan.textContent = '';
        
            closeSpan.addEventListener('click', function() {
                customerModal.style.display = 'none';
                location.reload();
            });
        
            customerModal.querySelector('.customer-modal-content').appendChild(closeSpan);
            const form = document.getElementById('customerForm');
            // اضافه کردن event listener به форм برای submit
            form.addEventListener('submit', e => {
    e.preventDefault();

    const customerId = document.getElementById('customerId').value;

    $.ajax({
        type: 'POST',
        url: './costumercharge.php',
        data: { totalcost: totalcost, customerId: customerId },
        dataType: 'json', // افزودن این خط برای اطمینان از دریافت JSON به صورت صحیح
        success: function (response) {
            if (response.error) {
                alert(response.error);
            } else if (response && response.message === 'عملیات موفقیت‌آمیز') {
                alert('عملیات موفقیت‌آمیز! نام مشتری: ' + response.customerName);
                fetch('./delete_game_temperory.php', {
  method: 'POST',
  body: `factor_name=${factor_name}`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    var newPageUrl = 'index.html'; 
     window.open(newPageUrl, '_self');
  })
  .catch(error => {
    console.error('خطا در ارتباط با سرور:', error);
    alert('خطا در ارتباط با سرور');
  });

fetch('./delete_buffet_temperory.php', {   
    method: 'POST',
    body: `factor_name=${factor_name}`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    // عملیات مورد نظر پس از حذف انجام داده شود
  })
  .catch(error => {
    console.error('خطا در ارتباط با سرور:', error);
    alert('خطا در ارتباط با سرور');
  });
            }
        },
        error: function (xhr, status, error) {
          
            console.log('Response Text:', status.responseText); // نمایش متن پاسخ در کنسول
            alert("خطا: " + status.responseText);
        }
    });
});


                                
            
  
                                
                     
} else if (payWay === 'debt') {
       
           
            let  debtModal = document.getElementById('debtModal');
            debtModal.style.display = 'block';
          
            // بستن مودال  با کلیک بیرون از مودال
            window.addEventListener('click', function(event) {
                if (event.target == debtModal) {
                    debtModal.style.display = 'none';
                    location.reload();
                }
            });
        
            // بستن مودال  با کلید ESC
            window.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                    debtModal.style.display = 'none';
                    location.reload();
                }
            });
        
            // اضافه کردن دکمه بستن به مودال 
        
            // اضافه کردن تگ بستن به مودال 
            let closeSpan = document.createElement('span');
            closeSpan.classList.add('close');
            closeSpan.textContent = '';
        
            closeSpan.addEventListener('click', function() {
                debtModal.style.display = 'none';
                location.reload();
            });
        
            debtModal.querySelector('.debt-modal-content').appendChild(closeSpan);
            const form = document.getElementById('debtForm');
            // اضافه کردن event listener به форм برای submit
            form.addEventListener('submit', e => {
            
              // متوقف کردن ارسال پیش‌فرض форм
              e.preventDefault();
            
             // دسترسی به ورودی‌های فرم با استفاده از document.getElementById
             const debtorname = document.getElementById('debtName').value;
                      
      
              
      
              $.ajax({
                type: 'POST',
                url: './debtpay.php', // آدرس کد PHP برای حذف ردیف
                data: { gameTotal: gameTotal,consoleType:consoleType,totalBuffetPrice: totalBuffetPrice ,BuffetPrice: buffetPayment,paydate : paydate,debtorname :debtorname},
                
                done: function(response) {
                
                },
                error: function() {
                   
                }
                
            });
          
            debtModal.style.display = 'none';
            fetch('./delete_game_temperory.php', {
  method: 'POST',
  body: `factor_name=${factor_name}`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    var newPageUrl = 'index.html'; 
     window.open(newPageUrl, '_self');
  })
  .catch(error => {
    console.error('خطا در ارتباط با سرور:', error);
   
  });

fetch('./delete_buffet_temperory.php', {   
    method: 'POST',
    body: `factor_name=${factor_name}`,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
})
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text();
  })
  .then(data => {
    // عملیات مورد نظر پس از حذف انجام داده شود
  })
  .catch(error => {
    console.error('خطا در ارتباط با سرور:', error);
   
  });
                          
                            });
                                
            
    } 
});



})
})
  .catch(error => console.error('خطا در دریافت و پردازش داده: ', error));