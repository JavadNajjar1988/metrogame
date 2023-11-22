<?php
$tableNumber = isset($_POST['tableNumber']) ? $_POST['tableNumber'] : 0;
$charge_Time = isset($_POST['charge_Time']) ? $_POST['charge_Time'] : 0;
// خواندن اطلاعات از فایل JSON
$jsonData = file_get_contents('finishTime.json');
$data = json_decode($jsonData, true);

// بررسی تکراری بودن شماره میز
$isTableFound = false;
foreach ($data as &$item) {
    if ($item['tableNumber'] == $tableNumber) {
        if ($charge_Time != 0) {
            $item['finishTime'] += $charge_Time;
        }
        $isTableFound = true;
        break; // اگر میز پیدا شد، حلقه را خروجی می‌دهیم
    }
}

// جایگزینی میز قبلی با میز جدید
if (!$isTableFound) {
    $newItem = ['tableNumber' => $tableNumber, 'finishTime' => $charge_Time];
    $data[] = $newItem;
}

file_put_contents('finishTime.json', json_encode($data));

// ارسال پاسخ به درخواست به صورت JSON
header('Content-Type: application/json');
echo json_encode(['finishTime' => $item['finishTime']]);
?>