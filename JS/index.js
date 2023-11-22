
$(document).ready(function() {
        // درخواست همزمان اطلاعات از هر دو فایل
        Promise.all([
            fetch('./data.json'),
            fetch('./reservations.json'),
            fetch('./products.json')
        ])
        .then(function(responses) {
            // وقتی هر دو درخواست با موفقیت انجام شد
            return Promise.all(responses.map(r => r.json()));
        })
        .then(function(data) {
            // داده های JSON را به متغیرها اختصاص می‌دهیم
            const dataJson = data[0];
            const reservationsJson = data[1];
            const productsJson = data[2];
          


            var tableBody = $('#reservationTableBody');
            var rowNumber = 1 // متغیر شماره ردیف

            $.each(reservationsJson, function(index, reservation) {
                // دریافت اطلاعات مورد نیاز از اطلاعات رزرو
                const prePaymentCost = reservation.prePaymentCost;
                const consoleType = reservation.consoleType; // نوع کنسول
                const priceType = reservation.priceType; // نوع قیمت‌گذاری

                // استفاده از اطلاعات "data.json" برای یافتن "hourlyPrice"
                const hourlyPrice = dataJson.consoles.find(c => c.name === consoleType)[`${priceType}`];

                // محاسبه زمان بر اساس فرمول
                const timeSeconds = Math.round(3600 * prePaymentCost / hourlyPrice);

                // تابع displayTime را با استفاده از تغییرات اعمال شده فراخوانی می‌کنیم
                const timeText = displayTime(reservation);

                // درج ردیف جدید در جدول
                var newRow = $('<tr></tr>');
                newRow.append('<td>' + convertToPersian(rowNumber++) + '</td>'); // شماره ردیف
                newRow.append('<td>'+  timeText +' </td>'); // زمان و وضعیت پرداخت
                newRow.append('<td><ul class="list-inline"><i class="demo-icon icon-table" style="font-size: 20px;"></i><span>' + convertToPersian(reservation.tableNumber)+ '</span></ul></td>'); // شماره میز

                // اضافه کردن آیکن مرتبط با "priceType"
                if (reservation.priceType === 'one_player_price') {
                    newRow.append('<td>یک نفره</td>');
                } else if (reservation.priceType === 'two_player_price') {
                    newRow.append('<td>دو نفره</td>');
                } else if (reservation.priceType === 'three_player_price') {
                    newRow.append('<td>سه نفره</td>');
                } else if (reservation.priceType === 'four_player_price') {
                    newRow.append('<td>چهارنفره</td>');
                } else {
                    newRow.append('<td><i class="fa fa-default" style="font-size: 30px;"></i></td>');
                }

                newRow.append('<td><i class="demo-icon icon-' + reservation.consoleType + '" style="font-size: 30px;"></i></td>'); // نوع کنسول
                newRow.append('<td><button class="btn btn-warning btn-xs bufeh-button" ><i class="fa fa-coffee"></i> بوفـه</button></td>'); // بوفه
           
                newRow.find('.bufeh-button').click(function() {
                    let modalTitle = `  بوفه برای میز ${reservation.tableNumber}`;
                    let formTitle = `خرید از بوفه برای میز ${convertToPersian(reservation.tableNumber)}`;
                    let modal = document.getElementById('myModal');
                    modal.style.display = 'block';
                    document.querySelector('.modal-content h3').textContent = modalTitle;
                    document.getElementById('formTitle').textContent = formTitle;
                    let dropdown = document.getElementById('productDropdown');
                    
                    productsJson.forEach(product => {
                        let option = document.createElement('option');
                        option.value = product.productCode;
                        option.text = product.title;
                        dropdown.appendChild(option);  
                    });

                    // بستن مودال با کلیک بیرون از مودال
                    window.addEventListener('click', function(event) {
                        if (event.target == modal) {
                            modal.style.display = 'none';
                            location.reload();
                        
                        }
                    });

                    // بستن مودال با کلید ESC
                    window.addEventListener('keydown', function(event) {
                        if (event.key === 'Escape') {
                            modal.style.display = 'none';
                            location.reload();

                        }  
                    });

                    // اضافه کردن دکمه بستن به مودال

                    // اضافه کردن تگ بستن به مودال 
                    let closeSpan = document.createElement('span');
                    closeSpan.classList.add('close'); 
                    closeSpan.textContent = '';

                    closeSpan.addEventListener('click', function(){
                        modal.style.display = 'none';
                        location.reload();

                    });

                    modal.querySelector('.modal-content').appendChild(closeSpan);
                    // دریافت element های فرم
                    const form = document.getElementById('buyForm');
                    const productSelect = document.getElementById('productDropdown');
                    const productCode = productSelect.value;

                    // اضافه کردن event listener به форм برای submit
                    form.addEventListener('submit', e => {
                    
                      // متوقف کردن ارسال پیش‌فرض форм
                      e.preventDefault();
                    
                      // ساختن یک FormData جدید از داده‌های فرم
                      const formData = new FormData(form);
                      formData.append('tableNumber', reservation.tableNumber);
                      formData.append('productCode', productSelect.value);
                   
                      // ارسال درخواست fetch به temporary.php
                      fetch('buffet_temporary.php', {
                        method: 'POST',
                        body: formData
                      })
                      .then(response => response.json()) 
                      .then(data => {
                        // موفقیت، داده ذخیره شد
                      })
                      .catch(error => {
                        // خطا در ارسال
                      });
                  
                    });
                });

                // تعریف متغیرهای برای وضعیت‌های پرداخت
                var isPostPayment = (reservation.postPayment == 'post-payment');
                var isPrePayment = (reservation.prePayment == 'pre-payment');

                // اضافه کردن دکمه "شروع" به رزروهای با وضعیت post-payment یا pre-payment
                if (isPostPayment) {
                    newRow.append('<td class="nowrap"><a href="#" class="btn btn-success btn btn-xs start-button"><i class="fa fa-play"></i>   شــروع</a></td>'); 
               
                } else if (isPrePayment) {
                    newRow.append('<td class="nowrap"><a href="#" class="btn btn-success btn btn-xs start-button"><i class="fa fa-play"></i>   شــروع</a></td>');
                } else {
                    newRow.append('<td class="nowrap">وضعیت نامعلوم</td>');
                }

                // اضافه کردن کد برای رویداد کلیک روی دکمه "شروع"
                newRow.find('.start-button').click(function() {
                    if (isPostPayment) {
                        let clickTime = null;
                        var tableNumber = reservation.tableNumber; 
                        if (clickTime === null) {
                            clickTime = Math.floor(Date.now() / 1000);}
                         $.ajax({
                                    type: 'POST',
                                    url: './timing.php', // آدرس کد PHP برای حذف ردیف
                                    data: { tableNumber: tableNumber , clickTime: clickTime},
                                    
                                    done: function(response) {
                                    
                                    },
                                    error: function() {
                                        alert('خطا در ارتباط با سرور');
                                    }
                                    
                                });
                                
                        // اگر وضعیت رزرو post-payment باشد، دکمه "شروع" به "پایان" تغییر می‌کند
                        $(this).replaceWith('<a href="#" class="btn btn-danger btn-xs end-button"><i class="fa fa-power-off"></i> پایان</a>');
                                    newRow.find('.end-button').click(function() {
                                        var tableNumber = reservation.tableNumber;
                                        let gameCost = null;
                                        let consoleType = reservation.consoleType;
                                        let priceType = reservation.priceType;
                                        gameCost = Math.round(hourlyPrice * (stopTimer() / 3600))

                                                                    
                                                                    $.ajax({
                                                                            type: 'POST',
                                                                            url: './game_temporary.php', // آدرس کد PHP برای حذف ردیف
                                                                            data: { gameCost: gameCost ,consoleType: consoleType,priceType:priceType,tableNumber:tableNumber},

                                                                            done: function(response) {
                                                                            
                                                                            },
                                                                            error: function() {
                                                                                alert('خطا در ارتباط با سرور');
                                                                            }

                                                                        });
                                                         // اضافه کردن کد برای رویداد کلیک روی دکمه "پایان"
                                                         var tableNumber = reservation.tableNumber; 
                                                                 newRow.remove();
                                                         $.ajax({
                                                                    type: 'POST',
                                                                    url: './delete_reservation.php', // آدرس کد PHP برای حذف ردیف
                                                                    data: { tableNumber: tableNumber },
                                                                    
                                                                    done: function(response) {
                                                                    
                                                                    },
                                                                    error: function() {
                                                                        alert('خطا در ارتباط با سرور');
                                                                    }
                                                                });

                                                                 var newPageUrl = 'invoice.html'; 
                                                                    window.open(newPageUrl, '_self');
                                                                  

                                                            });
                                                           

                                                        // اضافه کردن کد برای رویداد کلیک روی دکمه "شارژ مجدد"
                                

                        isPostPayment = false; // تغییر وضعیت به non-post-payment
                    } else if (isPrePayment) {

                        let startTime = null;
                        let finishTime = null;
                        let duration = timeSeconds;
                        var tableNumber = reservation.tableNumber; 
                        if (startTime === null) {
                                    startTime = Math.floor(Date.now() / 1000);
                                    finishTime = startTime + duration;}
                         $.ajax({
                                    type: 'POST',
                                    url: './timer.php', // آدرس کد PHP برای حذف ردیف
                                    data: { tableNumber: tableNumber , finishTime: finishTime,startTime:startTime},
                                    
                                    success: function(response) {
                                       
                                    },
                                    error: function() {
                                        alert('خطا در ارتباط با سرور');
                                    }
                                });
                        // اگر وضعیت رزرو pre-payment باشد، دکمه "شروع" به "پایان" و "شارژ مجدد" تغییر می‌کند
                        $(this).replaceWith('<a href="#" class="btn btn-danger btn-xs end-button"><i class="fa fa-power-off"></i> پایان</a><a href="#" class="btn btn-info btn-xs charge-button"><i class="fa fa-pencil"></i> شارژمجدد</a>');
                        newRow.find('.charge-button').click(function() {
                    // کد مربوط به عملیات شارژ مجدد رزرو را اینجا قرار دهید
                    let chargeModalTitle = `  شارژ برای میز ${reservation.tableNumber}`;
                    let chargeFormTitle = `شارژ برای میز ${convertToPersian(reservation.tableNumber)}`;
                    let chargeModal = document.getElementById('ChargeModal');
                    chargeModal.style.display = 'block';
                    document.querySelector('.charge-modal-content h3').textContent = chargeModalTitle;
                    document.getElementById('chargeFormTitle').textContent = chargeFormTitle;
                   

                    // بستن مودال شارژ با کلیک بیرون از مودال
                    window.addEventListener('click', function(event) {
                        if (event.target == chargeModal) {
                            chargeModal.style.display = 'none';
                            location.reload();
                        }
                    });

                    // بستن مودال شارژ با کلید ESC
                    window.addEventListener('keydown', function(event) {
                        if (event.key === 'Escape') {
                            chargeModal.style.display = 'none';
                            location.reload();
                        }
                    });

                    // اضافه کردن دکمه بستن به مودال شارژ

                    // اضافه کردن تگ بستن به مودال شارژ
                    let closeSpan = document.createElement('span');
                    closeSpan.classList.add('close');
                    closeSpan.textContent = '';

                    closeSpan.addEventListener('click', function() {
                        chargeModal.style.display = 'none';
                        location.reload();
                    });

                    chargeModal.querySelector('.charge-modal-content').appendChild(closeSpan);
                    const form = document.getElementById('chargeForm');
                    // اضافه کردن event listener به форм برای submit
                    form.addEventListener('submit', e => {
                    
                      // متوقف کردن ارسال پیش‌فرض форм
                      e.preventDefault();
                    
                     // دسترسی به ورودی‌های فرم با استفاده از document.getElementById
                     const chargeAmountInput = document.getElementById('chargeAmount');
                     const chargeTimeInput = document.getElementById('chargeTime');
                     // گرفتن مقادیر از ورودی‌های فرم
                     const chargeAmount = chargeAmountInput.value;
                     const charge_Time = (chargeTimeInput.value)*60 + Math.round(3600 * chargeAmount / hourlyPrice);
                        var tableNumber = reservation.tableNumber; 
                        $.ajax({
                                type: 'POST',
                                url: './charging.php',
                                data: {
                                    tableNumber: tableNumber,
                                    charge_Time: charge_Time
                                },
                                success: function (response) {
                                 
                                },
                                error: function () {
                                    alert('خطا در ارتباط با سرور');
                                }
                            });
                          
                                                     
                      chargeModal.style.display = 'none';
                      location.reload();
                  
                    });
             
                });

                                     newRow.find('.end-button').click(function() {
                                        
                                        function gameCost(tableNumber) {
return new Promise((resolve, reject) => {
fetch('./finishTime.json')
.then(response => response.json())
.then(data => {
const table = data.find(item => item.tableNumber === tableNumber);

if (table) {
  const finish = parseInt(table.finishTime);
  const start = parseInt(table.startTime);
  const gameCost = (Math.round((((finish - start) / 3600) * parseInt(hourlyPrice)) / 1000) * 1000);
  resolve(gameCost);
} else {
  reject('شماره میز یافت نشد');
}
})
.catch(error => {
reject('خطا در خواندن مقدار اولیه از فایل JSON');
});
});
}

// درخواست اطلاعات gameCost از سرور
const gameCostPromise = gameCost(reservation.tableNumber);

// داخل تابع then، ارسال درخواست POST به سرور
gameCostPromise.then(cost => {
const gameCost = cost
const tableNumber = reservation.tableNumber;
const consoleType = reservation.consoleType;
const priceType = reservation.priceType;

$.ajax({
                                                        type: 'POST',
                                                        url: './game_temporary.php', // آدرس کد PHP برای حذف ردیف
                                                        data: { gameCost: gameCost ,consoleType: consoleType,priceType:priceType,tableNumber:tableNumber},
                                                
                                                        done: function(response) {
                                                        
                                                        },
                                                        error: function() {
                                                            alert('خطا در ارتباط با سرور');
                                                        }
                                                    
                                                    });
                                                    

                                                    newRow.remove();
                                                         $.ajax({
                                                                    type: 'POST',
                                                                    url: './delete_reservation.php', // آدرس کد PHP برای حذف ردیف
                                                                    data: { tableNumber: tableNumber },
                                                                    
                                                                    done: function(response) {
                                                                    
                                                                    },
                                                                    error: function() {
                                                                       
                                                                    }
                                                                });

                                                                var newPageUrl = 'invoice.html'; 
                                                                 window.open(newPageUrl, '_self');
                                                                

                                                            });
                                                    });
                                          
                                            
                                        
                                                                
                                        
                                    
                                     // اضافه کردن کد برای رویداد کلیک روی دکمه "شارژ مجدد"
                             
                       
                     isPrePayment = false; // تغییر وضعیت به non-pre-payment
                    }
                        });
               
                // اضافه کردن ردیف به جدول
                tableBody.append(newRow);
let elapsedTime = 0;
let timerStarted = false 
let timerInterval;
let clickTime = null; 

// console.log(tableNumber);
// تابع برای به روز رسانی تایمر
function updateTimer() {
let hours = Math.floor(elapsedTime / 3600);
let minutes = Math.floor(elapsedTime % 3600 / 60);
let seconds = elapsedTime % 60;
let element = document.getElementById(`timer${reservation.tableNumber}`);

element.textContent = 
(hours < 10 ? '۰' : '') + hours.toLocaleString('fa-IR', { useGrouping: false }) + ':' +
(minutes < 10 ? '۰' : '') + minutes.toLocaleString('fa-IR', { useGrouping: false }) + ':' +
(seconds < 10 ? '۰' : '') + seconds.toLocaleString('fa-IR', { useGrouping: false });
}

// تابع برای شروع تایمر و به روز رسانی آن به صورت مداوم
function startTimer() {
timerInterval = setInterval(function() {
elapsedTime = Math.floor(Date.now() / 1000) - clickTime
updateTimer();
}, 1000);
}
// بخوانید مقدار اولیه clickTime از فایل JSON
function loadTimer(tableNumber) {
fetch('./clickTime.json')
.then(response => response.json())
.then(data => {
const tableData = data.find(item => item.tableNumber === tableNumber);
if (tableData) {
clickTime = parseInt(tableData.clickTime);
startTimer();
} else {
console.error('شماره میز یافت نشد');
}
})
.catch(error => {
console.error('خطا در خواندن مقدار اولیه از فایل JSON', error);
});
}

function stopTimer() {
clearInterval(timerInterval); // توقف تایمر
updateTimer(); // نمایش میزان زمان فعلی

 return elapsedTime; // ذخیره مقدار زمان فعلی

};
let elapesd = 0;
let finishTime = null;
let timeinterval; 
//  var table = reservation.tableNumber;
// تابع برای به روز رسانی تایمر
function updateTime() {
let hours = Math.floor(elapesd / 3600);
let minutes = Math.floor(elapesd % 3600 / 60);
let seconds = elapesd % 60;
let element = document.getElementById(`PreTime${reservation.tableNumber}`);

element.textContent = 
(hours < 10 ? '۰' : '') + hours.toLocaleString('fa-IR', { useGrouping: false }) + ':' +
(minutes < 10 ? '۰' : '') + minutes.toLocaleString('fa-IR', { useGrouping: false }) + ':' +
(seconds < 10 ? '۰' : '') + seconds.toLocaleString('fa-IR', { useGrouping: false });
}

function startTime() {
timeinterval = setInterval(function() {
elapesd = finishTime - Math.floor(Date.now() / 1000);
updateTime();

if (elapesd <= 0) {
clearInterval(timeinterval); // توقف تایمر
updateTime(); // نمایش میزان زمان فعلی
finishTime = 0;
// پخش صدا
const alarmSound = document.getElementById("alarmSound");
alarmSound.play();
alert( `  پایان زمان  میز ${reservation.tableNumber} `);
}
}, 1000);
}


// بخوانید مقدار اولیه clickTime از فایل JSON


function loadTime(tableNumber) {
fetch('./finishTime.json')
.then(response => response.json())
.then(data => {
const table = data.find(item => item.tableNumber === tableNumber);
if (table) {
finishTime = parseInt(table.finishTime);
startTime(); // شروع تایمر بلافاصله بعد از بارگذاری فایل JSON
} else {
console.error('شماره میز یافت نشد');
}
})
.catch(error => {
console.error('خطا در خواندن مقدار اولیه از فایل JSON', error);
});
};
          function displayTime(reservation) {
               
                if (reservation.postPayment === 'post-payment') {
                              loadTimer(reservation.tableNumber);
                              
                    return `<div class="timer" id="timer${reservation.tableNumber}">۰۰:۰۰:۰۰</div>`;
                } else if (reservation.prePayment === 'pre-payment') {
                                     loadTime(reservation.tableNumber);
                                    
                    return  `<div class="timer2" id="PreTime${reservation.tableNumber}">۰۰:۰۰:۰۰</div>`;
                } else {
                    return 'زمان نامشخص';
                }
            }
        }) 
        });
                       
        });
