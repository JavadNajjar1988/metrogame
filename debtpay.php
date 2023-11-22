<?php
$gameTotal = isset($_POST['gameTotal']) ? $_POST['gameTotal'] : 0;
$consoleType = isset($_POST['consoleType']) ? $_POST['consoleType'] : 0;
$totalBuffetPrice = isset($_POST['totalBuffetPrice']) ? $_POST['totalBuffetPrice'] : 0;
$BuffetPrice = isset($_POST['BuffetPrice']) ? $_POST['BuffetPrice'] : 0;
$paydate = isset($_POST['paydate']) ? $_POST['paydate'] : 0;
$debtorname = isset($_POST['debtorname']) ? $_POST['debtorname'] : 0;

// فرض می‌شود که debtpay.json یک فایل JSON است که باید محتوای آن خوانده شود.
$debtpayData = json_decode(file_get_contents('debtpay.json'), true);

// بررسی اینکه آیا debtorname در debtpay.json وجود دارد یا خیر
if (isset($debtpayData[$debtorname]['debtorId'])) {
    // اگر debtorname وجود داشت، از آن به عنوان شناسه عددی استفاده شود
    $numericId = $debtpayData[$debtorname]['debtorId'];
} else {
    // اگر نبود، یک شناسه عددی جدید ایجاد شود
    function generateNumericId($length) {
        $characters = '0123456789';
        $numericId = '';
        for ($i = 0; $i < $length; $i++) {
            $numericId .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $numericId;
    }

    $numericId = generateNumericId(5);
}

// استفاده از $numericId در ادامه کد

$debtorId = generateNumericId(5);
// خواندن اطلاعات از فایل JSON
$jsonData = file_get_contents('debtpay.json');
$data = json_decode($jsonData, true);

// ایجاد داده جدید
$newData = array(
    'gameTotal' => $gameTotal,
    'consoleType' => $consoleType,
    'totalBuffetPrice' => $totalBuffetPrice,
    'BuffetPrice' => $BuffetPrice,
    'paydate' => $paydate,
    'debtorname' => $debtorname,
    'debtorId' => $debtorId
);

// اضافه کردن داده جدید به آرایه داده‌ها
$data[] = array($debtorId => $newData);

// ذخیره کردن تمام داده‌ها (شامل داده‌های جدید و داده‌های قبلی) در فایل JSON
file_put_contents('debtpay.json', json_encode($data, JSON_UNESCAPED_UNICODE));

// ارسال پاسخ به درخواست به صورت JSON
header('Content-Type: application/json');
