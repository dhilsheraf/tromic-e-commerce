(function ($) {
    "use strict";

    /*Sale statistics Chart*/
    if ($('#myChart').length) {
        var ctx = document.getElementById('myChart').getContext('2d');
        var chart = new Chart(ctx, {

            type: 'line',
            

            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                        label: 'Sales',
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(44, 120, 220, 0.2)',
                        borderColor: 'rgba(44, 120, 220)',
                        data: [18, 17, 4, 3, 2, 20, 25, 31, 25, 22, 20, 9]
                    },
                 


                ]
            },
            options: {
                plugins: {
                legend: {
                    labels: {
                    usePointStyle: true,
                    },
                }
                }
            }
        });
    } //End if

    if ($('#myChart2').length) {
        var ctx = document.getElementById("myChart2");
        var myChart = new Chart(ctx, {
            type: 'bar', 
            data: {
                labels: ["900", "1200", "1400", "1600"], 
                datasets: [
                    {
                        label: "Razorpay",
                        backgroundColor: "#5897fb",
                        barThickness: 10, 
                        data: [308, 447, 575, 634] // Dataset values
                    },
                    {
                        label: "COD",
                        backgroundColor: "#7bcf86",
                        barThickness: 10,
                        data: [408, 547, 675, 734]
                    },
                    {
                        label: "Wallet",
                        backgroundColor: "#ff9076",
                        barThickness: 10,
                        data: [208, 447, 575, 634]
                    },
                ]
            },
            options: {
                responsive: true, // Makes the chart responsive
                plugins: {
                    legend: {
                        display: true, // Show legend
                        position: 'top', // Legend position
                        labels: {
                            usePointStyle: true, // Use circle points in legend
                            font: {
                                size: 14 // Adjust font size
                            }
                        }
                    },
                   
                },
                scales: {
                    x: {
                        stacked: false, // Group bars by category
                        title: {
                            display: true,
                            text: 'Order Amount (₹)', // X-axis title
                            font: {
                                size: 14
                            }
                        }
                    },
                    y: {
                        stacked: false, // Separate bars for each dataset
                        beginAtZero: true, // Start Y-axis at zero
                        title: {
                            display: true,
                            text: 'Payment Count', // Y-axis title
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }
    
    
})(jQuery);