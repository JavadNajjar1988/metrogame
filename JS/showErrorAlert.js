function showErrorAlert() {
    // بررسی شماره میز قبل از ارسال درخواست
    const tableNumber = document.getElementById("tableNumber").value;

    if (tableNumber) {
        // ارسال درخواست به process.php
        fetch("./process.php", {
            method: "POST",
            body: new FormData(document.getElementById("reservation-form"))
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // نمایش پیغام خطا به کاربر به صورت آلرت
                alert(data.error);
                window.location.href = "index.html";
            } else {
                // در صورت موفقیت، انتقال به صفحه دیگر یا انجام عملیات مورد نیاز
                window.location.href = "index.html";
            }
        })
        .catch(error => {
            console.error("خطا در ارتباط با سرور:", error);
            window.location.href = "index.html";
        });
    }
}