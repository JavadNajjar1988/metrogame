<?php
// در فایل process.php
// بررسی می‌کنیم که آیا فرم ارسال شده یا نه
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // بررسی می‌کنیم که آیا هر فیلد در $_POST وجود دارد یا نه
    $tableNumber = isset($_POST['tableNumber']) ? $_POST['tableNumber'] : null;
    $consoleType = isset($_POST['consoleType']) ? $_POST['consoleType'] : null;
    $priceTypeValue = isset($_POST['priceType']) ? $_POST['priceType'] : null;
    $paymentType = isset($_POST['paymentType']) ? $_POST['paymentType'] : null;
    $prePaymentCost = isset($_POST['pre-payment-cost']) ? $_POST['pre-payment-cost'] : null;
    $postPayment = isset($_POST['post-payment']) ? $_POST['post-payment'] : null;
    $prePayment = isset($_POST['pre-payment']) ? $_POST['pre-payment'] : null;

    // اطلاعات را به شکل یک آرایه ذخیره می‌کنیم
    $data = [
        'tableNumber' => $tableNumber,
        'consoleType' => $consoleType,
        'priceType' => $priceTypeValue,
        'paymentType' => $paymentType,
        'prePaymentCost' => $prePaymentCost,
        'postPayment' => $postPayment,
        'prePayment' => $prePayment,
    ];

    // خواندن اطلاعات موجود در فایل JSON (اگر وجود دارد)
    $jsonData = [];
    if (file_exists('reservations.json')) {
        $jsonData = json_decode(file_get_contents('reservations.json'), true);
    }

    // بررسی تکراری بودن شماره میز
    $isTableNumberDuplicate = false;
    foreach ($jsonData as $existingData) {
        if ($existingData['tableNumber'] === $tableNumber) {
            $isTableNumberDuplicate = true;
            break;
        }
    }

    if ($isTableNumberDuplicate) {
        // در صورت تکراری بودن شماره میز، پیغام خطا را به عنوان JSON تعریف می‌کنیم
        $errorJson = json_encode(['error' => 'شماره میز تکراری است.'],JSON_UNESCAPED_UNICODE);
        
        // ارسال پیغام خطا به صفحه index.html به عنوان پاسخ JSON
        header('Content-Type: application/json');
        echo $errorJson;
        exit(); // خروج از اجرای اسکریپت PHP
    } else {
        // اضافه کردن اطلاعات جدید به آرایه
        $jsonData[] = $data;

        // ذخیره آرایه به شکل JSON در فایل
        if (file_put_contents('reservations.json', json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))) {
            // تنظیم هدر برای انتقال به صفحه index.html
            header('Location: index.html');
            exit(); // خروج از اجرای اسکریپت PHP
        } else {
            echo "خطا در ذخیره اطلاعات در فایل.";
        }
    }
} else {
    // در صورتی که فرم ارسال نشده باشد، پاسخ مناسبی را به صورت JSON ارسال می‌کنیم.
    header('Content-Type: application/json');
    echo json_encode(['error' => 'فرم ارسال نشده است.']);
}
// دریافت شماره ردیف مورد نظر برای حذف (این مقدار را از فرم یا درخواست دریافت کنید)
$rowToDelete = isset($_POST['rowToDelete']) ? intval($_POST['rowToDelete']) : null;

if ($rowToDelete !== null) {
    // خواندن اطلاعات موجود در فایل JSON (اگر وجود دارد)
    $jsonData = [];
    if (file_exists('reservations.json')) {
        $jsonData = json_decode(file_get_contents('reservations.json'), true);
    }

    // از آرایه اطلاعات مورد نظر حذف کنید (اگر وجود داشته باشد)
    if (isset($jsonData[$rowToDelete])) {
        unset($jsonData[$rowToDelete]);

        // بازنمایی مجدد آرایه به شکل فهرست شماره‌گذاری نشده
        $jsonData = array_values($jsonData);

        // ذخیره آرایه به شکل JSON در فایل
        if (file_put_contents('reservations.json', json_encode($jsonData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))) {
            // ارسال پیام موفقیت
            echo "اطلاعات با موفقیت حذف شدند.";
        } else {
            echo "خطا در حذف اطلاعات از فایل.";
        }
    }
}
?>
