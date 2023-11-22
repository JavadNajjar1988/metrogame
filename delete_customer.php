
<?php

// دریافت شناسه 
$customerId = isset($_POST['customerId']) ? $_POST['customerId'] : '';

// خواندن فایل JSON
$data = file_get_contents('customer_data.json');
$customers = json_decode($data, true);

// حذف آیتم مورد نظر از آرایه
foreach ($customers as $i => $customer) {
  if ($customer['customerId'] == $customerId) {
    unset($customers[$i]);
    break;
  }
}

// بازسازی اندیس‌ها


// ذخیره داده‌های جدید
file_put_contents('customer_data.json', json_encode($customers)); 

// بازگشت به صفحه اصلی
header('Location: acounts.html');

?>