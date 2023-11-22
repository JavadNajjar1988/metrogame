  // تابعی برای درخواست اطلاعات از فایل JSON و نمایش آنها در جدول
  function loadData() {
  
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "products.json", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);

            var tableBody = document.querySelector("#buffetTable tbody");
            tableBody.innerHTML = ""; // پاک کردن داده‌های قبلی در جدول
            
            for (var i = 0; i < data.length; i++) {
                const productId = data[i].productCode;
                var row = document.createElement("tr");
                var formattedPrice = parseFloat(data[i].unitPrice).toLocaleString("fa-IR");
                // اعداد فارسی شده به جای قیمت واحد
                row.innerHTML = `
                    <td>${data[i].productCode}</td>
                    <td><i class="fa-light ${data[i].iconName}" style="font-size: 25px;" title="${data[i].title}"></i></td>
                    <td>${data[i].title}</td>
                    <td>${formattedPrice} تومان</td>
                    <td><button class="btn btn-danger btn-xs" data-product-id="${productId}" onclick="deleteProduct(this)"><i class="fa fa-trash-o"></i> حذف</button></td>
                `;
                tableBody.appendChild(row);
            }
        }
    };
    setTimeout(function () {
        xhr.send();
    }, 500);
   
}

    
            // فراخوانی تابع loadData برای بارگیری اطلاعات از فایل JSON
            loadData();
            

            // تابعی برای حذف ردیف انتخاب شده از جدول
            function deleteRow(button) {
                var row = button.parentNode.parentNode;
                row.parentNode.removeChild(row);
            }




            function deleteProduct(button) {
                const productId = button.dataset.productId;
              $.ajax({
                url: 'delete_product.php',
                type: 'POST',
                data: {id: productId}
              })
              .done(function() {
                location.reload();              })
            }
           