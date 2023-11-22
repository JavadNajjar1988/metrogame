$('#datarangepicker').daterangepicker({
  autoUpdateInput: false,
    startDate: moment().startOf('day'), 
    endDate: moment().endOf('day'),
    maxDate: moment(),
  // فعال کردن حالت تقویم شمسی
  jalaali: true,
  language:'fa',
  showDropdowns: true,
  // ترجمه رشته ها به فارسی
  locale: {
    
    direction: 'rtl',
    format: 'jYYYY/jMM/jDD',
    applyLabel: "اعمال",
    cancelLabel: "لغو",
    customRangeLabel: "دلخواه",
    daysOfWeek: ["یك", "دو", "سه", "چهار", "پنج", "جمعه", "شنبه"],  
  },

  ranges: {
    'امروز': [moment(), moment()],
    'دیروز': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    '۷ روز اخیر': [moment().subtract(6, 'days'), moment()],
    '۳۰ روز اخیر': [moment().subtract(29, 'days'), moment()], 
    'این ماه': [moment().startOf('jMonth'), moment().endOf('jMonth')],
    'ماه گذشته': [moment().subtract(1, 'jMonth').startOf('jMonth'), moment().subtract(1, 'jMonth').endOf('jMonth')]  
  }

});
$('#datarangepicker').on('apply.daterangepicker', function(ev, picker) {
    var start = picker.startDate.format();
    var end = picker.endDate.format();
  
    // ارسال اطلاعات به یک URL مشخص
    $.ajax({
        type: 'POST', // یا 'GET' بسته به نیاز شما
        url: './Calender.php',
        data: {
            start: start,
            end: end
        },
        success: function(response) {
            console.log('درخواست با موفقیت ارسال شد. پاسخ سرور: ', response);
            // انجام دیگر عملیات با پاسخ دریافتی از سرور
        },
        error: function(error) {
        }
    });
    location.reload();

});
