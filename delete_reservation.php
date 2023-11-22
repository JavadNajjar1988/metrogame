<?php
// خواندن داده‌ها از فایل JSON اصلی
$jsonData = file_get_contents('reservations.json');
$reservations = json_decode($jsonData, true);

// دریافت شماره میز از درخواست POST
if (isset($_POST['tableNumber'])) {
    $tableNumber = $_POST['tableNumber'];

    // تعریف تابع برای حذف رزروها از یک فایل JSON خاص
    function deleteReservations($filename, $tableNumber) {
        $jsonFileData = file_get_contents($filename);
        $reservations = json_decode($jsonFileData, true);

        // حذف تمام رزروهای مرتبط با میز از فایل JSON
        foreach ($reservations as $key => $reservation) {
            if ($reservation['tableNumber'] == $tableNumber) {
                unset($reservations[$key]);
            }
        }

        // ذخیره تغییرات در فایل JSON
        file_put_contents($filename, json_encode(array_values($reservations)));
    }

    // حذف رزروها از فایل‌های "clickTime.json" و "finishTime.json"
    deleteReservations('clickTime.json', $tableNumber);
    deleteReservations('finishTime.json', $tableNumber);

    // حذف رزروها از فایل JSON اصلی
    foreach ($reservations as $key => $reservation) {
        if ($reservation['tableNumber'] == $tableNumber) {
            unset($reservations[$key]);
        }
    }

    // ذخیره تغییرات در فایل JSON اصلی
    file_put_contents('reservations.json', json_encode(array_values($reservations)));

    header('Location: index.html');
}
?>
