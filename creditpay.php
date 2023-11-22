<?php
$gameTotal = isset($_POST['gameTotal']) ? $_POST['gameTotal'] : 0;
$BuffetPrice = isset($_POST['BuffetPrice']) ? $_POST['BuffetPrice'] : 0;
$consoleType = isset($_POST['consoleType']) ? $_POST['consoleType'] : 0;
$paydate = isset($_POST['paydate']) ? $_POST['paydate'] : 0;


// خواندن اطلاعات از فایل JSON
$jsonData = file_get_contents('creditpay.json');
$data = json_decode($jsonData, true);





    $newData = array(
        'gameTotal' => $gameTotal,
        'Buffet' => $BuffetPrice,
        'consoleType' => $consoleType,
        'paydate' => $paydate,
    );

    $data[] = $newData;
    file_put_contents('creditpay.json', json_encode($data));

    // ارسال پاسخ به درخواست به صورت JSON
    header('Content-Type: application/json');
  
