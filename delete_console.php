<?php
// فایل JSON که اطلاعات در آن ذخیره شده است
$jsonFilePath = 'data.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // درخواست POST دریافت شده است

    // دریافت شناسه کنسول از درخواست
    $consoleId = isset($_POST['consoleId']) ? $_POST['consoleId'] : '';

    if (!empty($consoleId)) {
        // خواندن محتوای JSON از فایل
        $jsonContent = file_get_contents($jsonFilePath);

        if ($jsonContent !== false) {
            // تبدیل JSON به آرایه
            $data = json_decode($jsonContent, true);

            if ($data !== null) {
                // جستجو و حذف مورد متناظر از آرایه
                foreach ($data['consoles'] as $key => $console) {
                    if ($console['name'] === $consoleId) {
                        unset($data['consoles'][$key]);
                        $data['consoles'] = array_values($data['consoles']);

                        break;
                    }
                }

                // ذخیره مجدد داده‌های به‌روز شده در فایل JSON
                file_put_contents($jsonFilePath, json_encode($data));

                // بازگشت به صفحه اصلی
                header('Location: console.html');
            }
        }
    }
}
?>
