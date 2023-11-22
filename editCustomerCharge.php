<?php
$customerId = isset($_POST['customerId']) ? $_POST['customerId'] : '';
$accountCharge = isset($_POST['accountCharge']) ? $_POST['accountCharge'] : '';

// خواندن فایل JSON
$data = file_get_contents('./customer_data.json');
$customers = json_decode($data, true);

// بررسی وجود مشتری با کد مشتری داده شده
if (array_key_exists($customerId, $customers)) {
    // مشتری وجود دارد
    $customer = $customers[$customerId];
    // تبدیل مبلغ حساب به عدد
    $customer['accountCharge'] = intval($customer['accountCharge']);
    
    // افزایش مبلغ حساب
    $customer['accountCharge'] += $accountCharge;

    // ذخیره کردن مقدار جدید حساب برای مشتری
    $customers[$customerId]['accountCharge'] = $customer['accountCharge'];

    // ذخیره تغییرات در فایل JSON
    $result = file_put_contents('./customer_data.json', json_encode($customers, JSON_UNESCAPED_UNICODE));

    if ($result !== false) {
        // ارسال پاسخ موفقیت‌آمیز
        $response = json_encode(['message' => 'عملیات موفقیت‌آمیز', 'customerName' => $customer['customerName']]);
    } else {
        // خطا در ذخیره فایل
        $response = json_encode(['error' => 'خطا در ذخیره فایل']);
    }

    
}
// ارسال پاسخ به درخواست کلاینت
header('Content-Type: application/json');
echo $response;

// خروج از اجرای برنامه
exit;
?>
