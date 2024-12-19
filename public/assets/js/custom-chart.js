document.addEventListener("DOMContentLoaded", function () {
    const ctx = document.getElementById("topProductsChart").getContext("2d");

    const productNames = [
      "Product A",
      "Product B",
      "Product C",
      "Product D",
      "Product E",
      "Product F",
      "Product G",
      "Product H",
      "Product I",
      "Product J",
    ];
    const productSales = [120, 110, 95, 85, 80, 75, 60, 55, 50, 45];

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: productNames,
        datasets: [
          {
            label: "Products",
            data: productSales,
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#FFCD56",
              "#36A2EB",
              "#FF6384",
              "#4BC0C0",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Sales",
            },
          },
          x: {
            title: {
              display: true,
              text: "Products",
            },
          },
        },
      },
    });
  });