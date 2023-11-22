<?php
$customerId = isset($_POST['customerId']) ? $_POST['customerId'] : '';
$totalcost = isset($_POST['totalcost']) ? $_POST['totalcost'] : '';

// خواندن فایل JSON
$data = file_get_contents('./customer_data.json');
$customers = json_decode($data, true);

// بررسی وجود مشتری با کد مشتری داده شده
if (array_key_exists($customerId, $customers)) {
    // مشتری وجود دارد
    $customer = $customers[$customerId];
    
    // تبدیل مبلغ حساب به عدد
    $customer['accountCharge'] = intval($customer['accountCharge']);
    
    // کاهش مبلغ حساب
    $customer['accountCharge'] -= $totalcost;

    // بررسی مقدار باقی‌مانده حساب
    if ($customer['accountCharge'] < 0) {
        // اگر مقدار منفی شد، پیام خطا را به عنوان JSON ارسال کنید
        $response = json_encode(['error' => 'حساب را شارژ کنید.']);
        header('Content-Type: application/json');
        echo $response;
        exit; // اجتناب از ادامه اجرای کد
    } else {
        // ذخیره کردن مقدار جدید حساب برای مشتری
        $customers[$customerId]['accountCharge'] = $customer['accountCharge'];

        // آرایه بازسازی شده را به عنوان JSON ارسال کنید
        $response = json_encode(['message' => 'عملیات موفقیت‌آمیز', 'customerName' => $customer['customerName']]);
        header('Content-Type: application/json');
        echo $response;
// ذخیره تغییرات در فایل JSON
file_put_contents('./customer_data.json', json_encode($customers));
exit; // اجتناب از ادامه اجرای کد

    }
} else {
    // مشتری وجود ندارد، پیام خطا را به عنوان JSON ارسال کنید
    $response = json_encode(['error' => 'مشتری وجود ندارد.']);
    header('Content-Type: application/json');
    echo $response;
    exit;
}


?>
