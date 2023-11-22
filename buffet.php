<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $productType = $_POST["optionsRadios"];
    $title = $_POST["title-tag"];
    $unitPrice = $_POST["unitPrice"];
    
    // دیکشنری نوع محصول به نام آیکون مرتبط
    $productIcons = [
        "cold_drink" => "fa-whiskey-glass-ice",
        "hot_drink" => "fa-mug-hot",
        "snack" => "fa-cookie-bite",
        "fastfood" => "fa-burger",
        "other" => "fa-burrito",
    ];

    // نام آیکون بر اساس نوع محصول
    $iconName = $productIcons[$productType];

    // تعیین پیشوند بر اساس نوع محصول
    $prefix = "";
    switch ($productType) {
        case "cold_drink":
            $prefix = "100";
            break;
        case "hot_drink":
            $prefix = "200";
            break;
        case "snack":
            $prefix = "300";
            break;
        case "fastfood":
            $prefix = "400";
            break;
        case "other":
            $prefix = "500";
            break;
        default:
            $prefix = "600"; // در صورتی که نوع محصول مشخص نشده باشد
            break;
    }

    // ایجاد کد براساس پیشوند و یک عدد تصادفی
    $productCode = $prefix . rand(0, 99);

    // اطلاعات محصول را به یک آرایه اضافه کنید
    $productData = [
        "productCode" => $productCode,
        "productType" => $productType,
        "title" => $title,
        "unitPrice" => $unitPrice,
        "iconName" => $iconName, // آیکون مرتبط با نوع محصول
    ];

    // خواندن اطلاعات محصولات موجود از فایل JSON
    $existingData = json_decode(file_get_contents("products.json"), true);

    // افزودن اطلاعات جدید به آرایه موجود
    $existingData[] = $productData;

    // ذخیره اطلاعات به فایل JSON با ساپورت فارسی
    file_put_contents("products.json", json_encode($existingData, JSON_UNESCAPED_UNICODE));

    // ارجاع به صفحه اصلی پس از ثبت اطلاعات
    header("Location: buffet.html");
    exit; // قطع اجرای کد پس از ارجاع به صفحه اصلی
} else {
    echo "دسترسی غیر مجاز.";
}

?>
