
const options = {
  day: "numeric",
  month: "numeric",
  year: "numeric"
};

fetch('./Calender.json')
  .then(response => response.json())
  .then(jsonData => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toLocaleString('fa-IR', options);
    const start = new Date(jsonData[0].start).toLocaleString('fa-IR', options);
    const end = new Date(jsonData[0].end).toLocaleString('fa-IR', options);
    var tableHeader = document.getElementById('tableTitle');
    
      if (start == today.toLocaleString('fa-IR', options)) {
        tableHeader.innerHTML = `
          <h2>میزان درآمد :</h2>
          <h2>
            امروز 
          </h2>
        `;
      } else if (start == yesterdayFormatted) {
        tableHeader.innerHTML = `
          <h2>میزان درآمد :</h2>
          <h2>
            دیروز
          </h2>
        `;
      } else {
        tableHeader.innerHTML = `
          <h2>میزان درآمد از</h2>
          <h2>
            ${start} تا ${end}
          </h2>
        `;
      }
   


  const start_Date = new Date(jsonData[0].start); 
  const end_Date = new Date(jsonData[0].end);
console.log(end_Date);
    function isInDateRange(date) {
      const itemDate = new Date(date);
      const startDate = start_Date;
      const endDate = end_Date;

      return itemDate >= startDate && itemDate <= endDate;
    }
    console.log(isInDateRange(today));
   
Promise.all([

    fetch('./creditpay.json'),
    fetch('./cashPay.json'), 
    fetch('./customerPay.json')
])
.then(responses => Promise.all(responses.map(r => r.json())))
.then(data => {
    const credit = data[0];
    const cash = data[1];
    const customer = data[2];
    let totalCash = 0;
    let totalCredit = 0; 
    let totalAccount = 0;
    let totalIncome = 0;
    const tableBody = document.getElementById('GameIncomeTable').getElementsByTagName('tbody')[0];
    const tableBuffetBody = document.getElementById('BuffetIncomeTable').getElementsByTagName('tbody')[0];
    const IncomeBody = document.getElementById('IncomeTable').getElementsByTagName('tbody')[0];
    const rowData = {
        'کارتخوان': { ps4: 0, ps50: 0, computer: 0, xbox: 0, jewelry: 0, foosball: 0, totalItem: 0 },
        'نقدی': { ps4: 0, ps50: 0, computer: 0, xbox: 0, jewelry: 0, foosball: 0, totalItem: 0 },
        'حساب کاربری': { ps4: 0, ps50: 0, computer: 0, xbox: 0, jewelry: 0, foosball: 0, totalItem: 0 }
    };
    const rowBuffetData = {
        'کارتخوان': { cold_drink: 0, hot_drink: 0, snack: 0, fastfood: 0, other: 0,  totalBuffetItem: 0 },
        'نقدی': { cold_drink: 0, hot_drink: 0, snack: 0, fastfood: 0, other: 0, totalBuffetItem: 0 },
        'حساب کاربری': { cold_drink: 0, hot_drink: 0, snack: 0, fastfood: 0, other: 0,  totalBuffetItem: 0 }
    };
    const totalColumn = {
        ps4: 0, ps50: 0, computer: 0, xbox: 0, jewelry: 0, foosball: 0, totalItem: 0
    };
    const totalBuffetColumn = {
        cold_drink: 0, hot_drink: 0, snack: 0, fastfood: 0, other: 0,  totalBuffetItem: 0 
   };

    const updateRowData = (type, consoleType, amount) => {
        rowData[type][consoleType] += parseInt(amount);
        rowData[type]['totalItem'] += parseInt(amount);
        totalColumn[consoleType] += parseInt(amount);
        totalColumn['totalItem'] += parseInt(amount);
        totalIncome += parseInt(amount);
    };
    const updateBuffetRowData = (type, itemType, amount) => {
        rowBuffetData[type][itemType] += parseInt(amount);
        rowBuffetData[type]['totalBuffetItem'] += parseInt(amount);
        totalBuffetColumn[itemType] +=parseInt(amount);
        totalBuffetColumn['totalBuffetItem'] += parseInt(amount);
        totalIncome += parseInt(amount);
      }
  
    credit.forEach(item => {
     
      if(item.Buffet==0){
        item.Buffet =[["cold_drink","0"]];
      }
        if (isInDateRange(item.paydate)) {
            updateRowData('کارتخوان', item.consoleType, item.gameTotal);
            const buffet = item.Buffet;
            
            buffet.forEach(buffetItem => {
              updateBuffetRowData(
                'کارتخوان', 
                buffetItem[0], 
                buffetItem[1], );
            })
        };
      });
    cash.forEach(item => {
      if(item.Buffet==0){
        item.Buffet =[["cold_drink","0"]];
      }
        if (isInDateRange(item.paydate)) {
            updateRowData('نقدی', item.consoleType, item.gameTotal);
            const buffet = item.Buffet;
           if(buffet) {
             buffet.forEach(buffetItem => {
              updateBuffetRowData(
                'نقدی', 
                buffetItem[0], 
                buffetItem[1], );
            })
           }
           
        };
    });
   

    customer.forEach(item => {
      if(item.Buffet==0){
        item.Buffet =[["cold_drink","0"]];
      }
        if (isInDateRange(item.paydate)) {
            updateRowData('حساب کاربری', item.consoleType, item.gameTotal);
            const buffet = item.Buffet;
            
            buffet.forEach(buffetItem => {
              updateBuffetRowData(
                'حساب کاربری', 
                buffetItem[0], 
                buffetItem[1], );
            })
        };
    });
    

    // درج اطلاعات به جدول
    for (const type in rowData) {
        const row = tableBody.insertRow();
        row.insertCell(0).innerHTML = type;
        row.insertCell(1).innerHTML = (rowData[type]['ps4']).toLocaleString('fa-IR') + ' تومان' ;
        row.insertCell(2).innerHTML = (rowData[type]['ps50']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(3).innerHTML = (rowData[type]['computer']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(4).innerHTML = (rowData[type]['xbox']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(5).innerHTML = (rowData[type]['jewelry']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(6).innerHTML = (rowData[type]['foosball']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(7).innerHTML = (rowData[type]['totalItem']).toLocaleString('fa-IR') + ' تومان';
        if(type === 'نقدی') {
            totalCash += (rowData[type]['totalItem']); 
          }
          
          if(type === 'کارتخوان') {
            totalCredit += (rowData[type]['totalItem']);
          } 
          if(type === 'حساب کاربری') {
            totalAccount += (rowData[type]['totalItem']);
          } 
    };
    const totalRow = tableBody.insertRow();
    totalRow.insertCell(0).innerHTML = 'جمع کل';
    totalRow.insertCell(1).innerHTML = totalColumn['ps4'].toLocaleString('fa-IR') + ' تومان';
    totalRow.insertCell(2).innerHTML = totalColumn['ps50'].toLocaleString('fa-IR') + ' تومان';
    totalRow.insertCell(3).innerHTML = totalColumn['computer'].toLocaleString('fa-IR') + ' تومان';
    totalRow.insertCell(4).innerHTML = totalColumn['xbox'].toLocaleString('fa-IR') + ' تومان';
    totalRow.insertCell(5).innerHTML = totalColumn['jewelry'].toLocaleString('fa-IR') + ' تومان';
    totalRow.insertCell(6).innerHTML = totalColumn['foosball'].toLocaleString('fa-IR') + ' تومان';
    totalRow.insertCell(7).innerHTML = totalColumn['totalItem'].toLocaleString('fa-IR') + ' تومان';

    const ctx2 = document.getElementById('gameChart');        
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: [' PS4', 'PS5', 'PC', 'XBOX', 'VIP', 'فوتبال دستی'],
        datasets: [{
          label: ' درآمد کنسول ',
          data: [totalColumn['ps4'], totalColumn['ps50'],totalColumn['computer'],totalColumn['xbox'],totalColumn['jewelry'],totalColumn['foosball']],
          backgroundColor: [
            'rgb(41, 173, 178)',
            'rgb(233, 184, 36)',
            'rgb(241, 26, 123)',
          'rgb(153, 102, 255)',
          'rgb(178, 83, 62)',
          'rgb(102, 128, 106)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            display: false,
            beginAtZero: true
          }
        },
        plugins: {
            legend: {
                labels: {
                    // This more specific font property overrides the global property
                    font: {
                        size: 10,
                        family: 'Yekan',
                    }
                },
                
            }
        }
    }
    
    });
    
    for (const type in rowBuffetData) {
        const row = tableBuffetBody.insertRow();
        row.insertCell(0).innerHTML = type;
        row.insertCell(1).innerHTML = (rowBuffetData[type]['cold_drink']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(2).innerHTML = (rowBuffetData[type]['hot_drink']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(3).innerHTML = (rowBuffetData[type]['snack']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(4).innerHTML = (rowBuffetData[type]['fastfood']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(5).innerHTML = (rowBuffetData[type]['other']).toLocaleString('fa-IR') + ' تومان';
        row.insertCell(6).innerHTML = (rowBuffetData[type]['totalBuffetItem']).toLocaleString('fa-IR') + ' تومان';
        if(type === 'نقدی') {
            totalCash += (rowBuffetData[type]['totalBuffetItem']); 
          }
          
          if(type === 'کارتخوان') {
            totalCredit += (rowBuffetData[type]['totalBuffetItem']);
          } 
          if(type === 'حساب کاربری') {
            totalAccount += (rowBuffetData[type]['totalBuffetItem']);
          } 
    }
    const totalBuffetRow = tableBuffetBody.insertRow();
totalBuffetRow.insertCell(0).innerHTML = 'جمع کل';
totalBuffetRow.insertCell(1).innerHTML = totalBuffetColumn['cold_drink'].toLocaleString('fa-IR') + ' تومان';
totalBuffetRow.insertCell(2).innerHTML = totalBuffetColumn['hot_drink'].toLocaleString('fa-IR') + ' تومان';
totalBuffetRow.insertCell(3).innerHTML = totalBuffetColumn['snack'].toLocaleString('fa-IR') + ' تومان';
totalBuffetRow.insertCell(4).innerHTML = totalBuffetColumn['fastfood'].toLocaleString('fa-IR') + ' تومان';
totalBuffetRow.insertCell(5).innerHTML = totalBuffetColumn['other'].toLocaleString('fa-IR') + ' تومان';
totalBuffetRow.insertCell(6).innerHTML = totalBuffetColumn['totalBuffetItem'].toLocaleString('fa-IR') + ' تومان';



const ctx1 = document.getElementById('buffetChart');        
new Chart(ctx1, {
  type: 'doughnut',
  data: {
    labels: [' نوشیدنی سرد', 'نوشیدنی گرم', 'اسنک ','فست فود', 'سایر '],
    datasets: [{
      label: ' درآمد بوفه',
      data: [totalBuffetColumn['cold_drink'], totalBuffetColumn['hot_drink'],  totalBuffetColumn['snack'],totalBuffetColumn['fastfood'],totalBuffetColumn['other']],
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)',
      'rgb(153, 102, 255)',
      'rgb(201, 203, 207)'
      ],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
        display: false,
        beginAtZero: true
      }
    },
    plugins: {
        legend: {
            labels: {
                // This more specific font property overrides the global property
                font: {
                    size: 10,
                    family: 'Yekan',
                }
            }
        }
    }
}

});
    // درج اطلاعات به جدول درآمد
const incomeRow = IncomeBody.insertRow();
incomeRow.insertCell(0).innerHTML = totalCash.toLocaleString('fa-IR') + ' تومان';
incomeRow.insertCell(1).innerHTML = totalCredit.toLocaleString('fa-IR') + ' تومان'; 
incomeRow.insertCell(2).innerHTML = totalAccount.toLocaleString('fa-IR') + ' تومان'; 
incomeRow.insertCell(3).innerHTML = totalIncome.toLocaleString('fa-IR') + ' تومان';

 

const ctx = document.getElementById('totalChart');        
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['نقدی', 'کارتخوان', 'حساب کاربری'],
    datasets: [{
      label: 'درآمد',
      data: [totalCash, totalCredit, totalAccount],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
      'rgba(75, 192, 192, 0.2)',
      'rgba(153, 102, 255, 0.2)'
       
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',],
      borderWidth: 1
    }]
  },
  options: {
    scales: {
      y: {
       
        beginAtZero: true,
        ticks: {
          font: {
            family: 'Yekan', // یا نام فونت دلخواه خود را انتخاب کنید
          }
        }
      },
     

    },
    plugins: {
        legend: {
            labels: {
                // This more specific font property overrides the global property
                font: {
                    size: 10,
                    family: 'Yekan',
                }
            },
            
        }
    }
}

});
});
});