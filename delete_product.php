<?php

// دریافت شناسه محصول
$productId = $_POST['id'];

// خواندن فایل JSON
$data = file_get_contents('products.json');
$products = json_decode($data, true);

// حذف آیتم مورد نظر از آرایه
foreach ($products as $i => $product) {
  if ($product['productCode'] == $productId) {
    unset($products[$i]);
    break;
  }
}

// بازسازی اندیس‌ها
$products = array_values($products);

// ذخیره داده‌های جدید
file_put_contents('products.json', json_encode($products)); 

// بازگشت به صفحه اصلی
header('Location: buffet.html');

?>