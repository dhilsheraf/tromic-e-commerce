  // Select all main product images for zoom functionality
// Select all main product images for zoom functionality


document.querySelectorAll('.single-product-img .swiper-slide img').forEach(img => {
    img.addEventListener('mousemove', (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100; // x position as percentage
        const y = ((e.clientY - rect.top) / rect.height) * 100; // y position as percentage
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = "scale(1.5)";
    });

    img.addEventListener('mouseleave', () => {
        img.style.transform = "scale(1)";
        img.style.transformOrigin = "center center";
    });
});



document.querySelectorAll('.cart-plus-minus').forEach(cartControl => {
    const minusButton = cartControl.querySelector('.minus-btn');
    const plusButton = cartControl.querySelector('.plus-btn');
    const inputField = cartControl.querySelector('.cart-plus-minus-box');
    const maxStock = parseInt(inputField.dataset.stock); // Get stock value from data attribute

    // Minus Button Logic
    minusButton.addEventListener('click', () => {
        console.log('Minus button clicked'); // Debugging log
        let currentQuantity = parseInt(inputField.value);
        if (currentQuantity > 1) {
            currentQuantity--;
            inputField.value = currentQuantity;
            console.log('Quantity decreased to:', currentQuantity); // Debugging log
        } else {
            console.log('Quantity is already at minimum (1).'); // Debugging log
        }
    });

    // Plus Button Logic
    plusButton.addEventListener('click', () => {
        console.log('Plus button clicked'); // Debugging log
        let currentQuantity = parseInt(inputField.value);
        if (currentQuantity < maxStock) {
            currentQuantity++;
            inputField.value = currentQuantity;
            console.log('Quantity increased to:', currentQuantity); // Debugging log
        } else {
            console.log('Quantity reached maximum stock:', maxStock); // Debugging log
        }
    });
});

