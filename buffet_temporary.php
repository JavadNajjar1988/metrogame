<?php

// دریافت داده های POST
$productCode = $_POST['productCode'];
$quantity = $_POST['quantity']; 
$tableNumber = $_POST['tableNumber'];


// خواندن اطلاعات فایل products.json
$productsData = json_decode(file_get_contents('./products.json'), true);

// یافتن اطلاعات محصول با توجه به کد دریافتی
$productData = array_filter($productsData, function($product) use ($productCode) {
  return $product['productCode'] === $productCode; 
});
$productData = reset($productData);

// خواندن داده‌های قبلی
$previousData = json_decode(file_get_contents('buffet_temporary.json'), true); 

// بررسی وجود سفارشات قبلی برای این میز
if (isset($previousData[$tableNumber])) {

  // اضافه کردن سفارش جدید
  $previousData[$tableNumber][] = [
    "productCode" => $productCode,
    "title" => $productData['title'],
    "quantity" => $quantity,
    "unitPrice" => $productData['unitPrice'],
    "productType" => $productData['productType'],
    
  ];

} else {

  // ایجاد آرایه جدید برای این میز
  $previousData[$tableNumber] = [
    [
      "productCode" => $productCode,
      "title" => $productData['title'],
      "quantity" => $quantity,
      "unitPrice" => $productData['unitPrice'],
      "productType" => $productData['productType'],

 
    ]
  ];

}

// ذخیره داده ها
file_put_contents('buffet_temporary.json', json_encode($previousData, JSON_UNESCAPED_UNICODE));

// برگرداندن موفقیت
echo json_encode(['status' => 'ok']);


?>