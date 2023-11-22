<?php

$factor_name = $_POST['factor_name']; // فرضاً که شماره فاکتور مورد نظر "3" باشد
// خواندن محتوای فایل JSON
$data = file_get_contents('buffet_temporary.json');

// تبدیل محتوا به آرایه‌ای از شیء stdClass
$products = json_decode($data);

// حذف محصول با شماره "3"
if (isset($products->$factor_name)) {
    unset($products->$factor_name);
}

// ذخیره داده‌های به‌روزشده به فایل JSON
file_put_contents('buffet_temporary.json', json_encode($products, JSON_UNESCAPED_UNICODE));

// انجام هر عملیات دیگر یا بازگشت به صفحه مورد نظر
// مثلاً:
header('Location: index.html');
?>

