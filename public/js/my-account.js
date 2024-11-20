document.getElementById('addressForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/add-address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            // Optionally append the new address to the UI
            const addressHtml = `
                <div class="col-12 col-md-6 mb-3">
                    <div class="address-card p-3 border rounded">
                        <h4 class="small-title">${data.addressType}</h4>
                        <address>
                            ${data.addressLine}, ${data.city}, ${data.state}, ${data.country}, ${data.pincode}
                        </address>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-primary btn-sm edit-address-btn">Edit</button>
                            <button class="btn btn-danger btn-sm delete-address-btn">Delete</button>
                        </div>
                    </div>
                </div>`;
            document.getElementById('address-list').innerHTML += addressHtml;
            document.getElementById('addressModal').reset();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred. Please try again.');
    }
});


document.getElementById('editProfileForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/profile-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            // Optionally, update the profile details on the page without a reload
            document.querySelector('#account-dashboard li:nth-child(1)').textContent = `Username: ${data.username}`;
            document.querySelector('#account-dashboard li:nth-child(3)').textContent = `Phone Number: ${data.number}`;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred. Please try again.');
    }
});

