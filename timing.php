<?php
$clickTime = isset($_POST['clickTime']) ? $_POST['clickTime'] : 0;
$tableNumber = isset($_POST['tableNumber']) ? $_POST['tableNumber'] : 0;

// خواندن اطلاعات از فایل JSON
$jsonData = file_get_contents('clickTime.json');
$data = json_decode($jsonData, true);

// بررسی تکراری بودن شماره میز
$isTableNumberDuplicate = false;
foreach ($data as $item) {
    if ($item['tableNumber'] == $tableNumber) {
        $isTableNumberDuplicate = true;
        break;
    }
}

if (!$isTableNumberDuplicate) {
    // اضافه کردن داده جدید به آرایه موجود
    $newData = array(
        'clickTime' => $clickTime,
        'tableNumber' => $tableNumber
    );
    $data[] = $newData;

    // ذخیره آرایه به عنوان JSON در فایل
    file_put_contents('clickTime.json', json_encode($data));

    // ...

    // ارسال زمان به عنوان JSON پاسخ به درخواست
    $response = array('clickTime' => $clickTime);
    header('Location: index.html');
} 

?>
