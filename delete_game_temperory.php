<?php
$factor_name = $_POST['factor_name']; // فرضاً که شماره فاکتور مورد نظر "3" باشد

// خواندن محتوای فایل JSON
$data = file_get_contents('game_temporary.json');

// تبدیل محتوا به آرایه‌ای از شیء stdClass
$console = json_decode($data);

if (isset($console->$factor_name)) {
    // اگر شماره فاکتور وجود داشته باشد، آن را حذف کنید
    unset($console->$factor_name);
}
    // ذخیره داده‌های به‌روزشده به فایل JSON
    file_put_contents('game_temporary.json', json_encode($console, JSON_UNESCAPED_UNICODE));
    header('Location: index.html');

?>


