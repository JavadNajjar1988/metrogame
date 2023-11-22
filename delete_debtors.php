<?php
// دریافت شناسه
$debtorId = isset($_POST['debtorId']) ? $_POST['debtorId'] : '';


// خواندن فایل JSON
$data = file_get_contents('debtpay.json');
$debtors = json_decode($data, true);

// حذف آیتم مورد نظر از آرایه بر اساس مقدار دریافتی از کلاینت
foreach ($debtors as $key => $debtor) {
    // چک کردن برابری مقدار دریافتی با کلید عددی در المان
    if (key($debtor) == $debtorId) {
        unset($debtors[$key]);
        break;
    }
}

// بازسازی اندیس‌ها
$debtors = array_values($debtors);

// ذخیره داده‌های جدید
file_put_contents('debtpay.json', json_encode($debtors));

// بازگشت به صفحه اصلی
header('Location: debtors.html');
?>
