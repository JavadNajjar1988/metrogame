<?php
// تعریف تابع برای تولید شناسه فقط با اعداد
function generateNumericId($length) {
    $characters = '0123456789';
    $numericId = '';
    for ($i = 0; $i < $length; $i++) {
        $numericId .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $numericId;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $customerName = isset($_POST['costomerName']) ? $_POST['costomerName'] : '';
    $accountCharge = isset($_POST['acountCharge']) ? $_POST['acountCharge'] : 0;

    // خواندن اطلاعات از فایل JSON
    $jsonData = file_get_contents('customer_data.json');
    $data = json_decode($jsonData, true);

    // ایجاد شناسه یا کد منحصر به فرد برای مشتری
    $customerId = generateNumericId(5); // ایجاد یک شناسه 5 رقمی

    // ایجاد داده جدید با شناسه مشتری
    $newData = array(
        'customerId' => $customerId,
        'customerName' => $customerName,
        'accountCharge' => $accountCharge,
    );

    // اضافه کردن داده جدید به آرایه داده‌ها
    $data[$customerId] = $newData;

    // ذخیره کردن تمام داده‌ها (شامل داده‌های جدید و داده‌های قبلی) در فایل JSON
    file_put_contents('customer_data.json', json_encode($data, JSON_UNESCAPED_UNICODE));
    header("Location: acounts.html");
}
?>
