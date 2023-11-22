<?php
$gameTotal = isset($_POST['gameTotal']) ? $_POST['gameTotal'] : 0;
$BuffetPrice = isset($_POST['BuffetPrice']) ? $_POST['BuffetPrice'] : 0;
$consoleType = isset($_POST['consoleType']) ? $_POST['consoleType'] : 0;
$paydate = isset($_POST['paydate']) ? $_POST['paydate'] : 0;

// خواندن اطلاعات از فایل JSON
$jsonData = file_get_contents('customerPay.json');
$data = json_decode($jsonData, true);

// ایجاد داده جدید
$newData = array(
    'gameTotal' => $gameTotal,
    'Buffet' => $BuffetPrice,
    'consoleType' => $consoleType,
    'paydate' => $paydate,
);

// اضافه کردن داده جدید به آرایه داده‌ها
$data[] = $newData;

// ذخیره کردن تمام داده‌ها در فایل JSON
file_put_contents('customerPay.json', json_encode($data));

// ارسال پاسخ به درخواست به صورت JSON
header('Content-Type: application/json');

