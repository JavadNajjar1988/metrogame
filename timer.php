<?php
$finishTime = isset($_POST['finishTime']) ? $_POST['finishTime'] : 0;
$tableNumber = isset($_POST['tableNumber']) ? $_POST['tableNumber'] : 0;
$startTime = isset($_POST['startTime']) ? $_POST['startTime'] : 0;
// خواندن اطلاعات از فایل 
$jsonData = file_get_contents('finishTime.json');
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
    // فقط اگر مقدار درخواست POST معتبر باشد، آن را به عنوان مقدار جدید finishTime استفاده کن
    $newData = array(
        'startTime' => $startTime,
        'finishTime' => $finishTime,
        'tableNumber' => $tableNumber,
        
    );

    // جایگزینی میز قبلی با میز جدید
    $data[] = $newData;
    file_put_contents('finishTime.json', json_encode($data));

    // ارسال پاسخ به درخواست به صورت JSON
    header('Content-Type: application/json');
    echo json_encode(array('finishTime' => $finishTime));
}
