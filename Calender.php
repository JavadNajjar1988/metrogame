<?php
$start = isset($_POST['start']) ? $_POST['start'] : 0;
$end = isset($_POST['end']) ? $_POST['end'] : 0;
// خواندن اطلاعات از فایل 
    $newData = array(
        'start' => $start,
        'end' => $end   
    );

    // جایگزینی میز قبلی با میز جدید
    $data[] = $newData;
    file_put_contents('Calender.json', json_encode($data));

    // ارسال پاسخ به درخواست به صورت JSON
    header('Content-Type: application/json');
  

