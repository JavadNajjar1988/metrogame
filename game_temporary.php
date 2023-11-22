<?php

// دریافت داده های POST
$gameCost = $_POST['gameCost'];
$consoleType = $_POST['consoleType'];
$priceType = $_POST['priceType'];
$tableNumber = $_POST['tableNumber'];

// خواندن اطلاعات فایل data.json
$consoleData = json_decode(file_get_contents('./data.json'), true);

// یافتن اطلاعات محصول با توجه به نوع کنسول
$selectedConsole = array_filter($consoleData['consoles'], function($console) use ($consoleType) {
    return $console['name'] === $consoleType;
});

if (!empty($selectedConsole)) {
    // اگر کنسول با مشخصات داده شده یافت شد
    $selectedConsole = reset($selectedConsole);

    // حالا می‌توانید بر اساس نوع قیمت مورد نظر، قیمت واحد را استخراج کنید
    $unitPrice = null;

if ($priceType === 'one_player_price') {
    $unitPrice = $selectedConsole['one_player_price'];
} elseif ($priceType === 'two_player_price') {
    $unitPrice = $selectedConsole['two_player_price'];
} elseif ($priceType === 'three_player_price') {
    $unitPrice = $selectedConsole['three_player_price'];
} elseif ($priceType === 'four_player_price') {
    $unitPrice = $selectedConsole['four_player_price'];
} else {
    echo "نوع قیمت معتبر نیست.";
    // در اینجا می‌توانید مناسبترین رفتار را برای نوع قیمت نامعتبر تعیین کنید.
}


}

// خواندن داده‌های قبلی
$previousData = json_decode(file_get_contents('game_temporary.json'), true); 

// بررسی وجود سفارشات قبلی برای این میز
if (isset($previousData[$tableNumber])) {

  // اضافه کردن سفارش جدید
  $previousData[$tableNumber][] = [
    "cosoleprice" => $unitPrice,
    "gameCost" => $gameCost,
    "consoleType" => $consoleType,
    "priceType" => $priceType
  ];

} else {

  // ایجاد آرایه جدید برای این میز
  $previousData[$tableNumber] = [
    [
      "cosoleprice" => $unitPrice,
      "gameCost" => $gameCost,
      "consoleType" => $consoleType,
      "priceType" => $priceType
    ]
  ];

}

// ذخیره داده ها
file_put_contents('game_temporary.json', json_encode($previousData, JSON_UNESCAPED_UNICODE));

// برگرداندن موفقیت
echo json_encode(['status' => 'ok']);


?>