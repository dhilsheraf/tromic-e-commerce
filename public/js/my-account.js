

//edit profile
document.getElementById("editProfileForm").addEventListener("submit", function (event) {
    event.preventDefault();


    const username = document.getElementById("username").value;
    const number = document.getElementById("number").value;

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const phoneRegex = /^[6-9]\d{9}$/;

    const isVald = true
    let errorMessage = "";

    if (!usernameRegex.test(username)) {
        isVald = false;
        errorMessage += "Username must be :\n";
        errorMessage += "- 3-20 characters long\n";
        errorMessage += "- Can contain letters, numbers, and underscore\n";
    }

    if (number && !phoneRegex.test(number)) {
        isVald = false;
        errorMessage += "Phone number must be:\n";
        errorMessage += "- A valid 10-digit Indian mobile number\n";
        errorMessage += "- Starting with 6, 7, 8, or 9\n";
    }

    if (!isVald) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Erro',
            html: errorMessage.replace(/\n/g, '<br>'),
            confirmButtonText: 'OK'
        })
        return;
    }

    fetch('/profile-update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, number }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Profile updated successfully') {
                window.location.href = '/my-account'
            } else {
                Swal.fire(data.message);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            Swal.fire("An error occurred while updating your profile.");
        });
});


// Add Address Form Validation
document.getElementById("addAddressForm").addEventListener("submit", function (event) {
    event.preventDefault();


    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const pincode = document.getElementById("pincode").value.trim();
    const addressLine = document.getElementById("addressLine").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const country = document.getElementById("country").value.trim();

    // Validation rules
    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    // Validation checks
    let isValid = true;
    let errorMessage = "";

    if (!nameRegex.test(name)) {
        isValid = false;
        errorMessage += "Name must be 2-50 characters and contain only letters.\n";
    }

    if (!phoneRegex.test(phone)) {
        isValid = false;
        errorMessage += "Phone number must be a valid 10-digit Indian mobile number.\n";
    }

    if (!pincodeRegex.test(pincode)) {
        isValid = false;
        errorMessage += "Pincode must be a 6-digit number.\n";
    }

    if (addressLine.length < 5 || addressLine.length > 100) {
        isValid = false;
        errorMessage += "Address line must be between 5 and 100 characters.\n";
    }

    if (city.length < 2 || city.length > 50) {
        isValid = false;
        errorMessage += "City name must be between 2 and 50 characters.\n";
    }

    if (state.length < 2 || state.length > 50) {
        isValid = false;
        errorMessage += "State name must be between 2 and 50 characters.\n";
    }

    if (country.length < 2 || country.length > 50) {
        isValid = false;
        errorMessage += "Country name must be between 2 and 50 characters.\n";
    }

    // If validation fails, show error message
    if (!isValid) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: errorMessage,
            confirmButtonText: 'OK'
        });
        return;
    }

    // If validation passes, proceed with form submission
    const formData = {
        name: name,
        phone: phone,
        addressType: document.getElementById("addressType").value,
        pincode: pincode,
        addressLine: addressLine,
        city: city,
        state: state,
        country: country
    };

    fetch("/add-address", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Address added successfully!') {
                $('#addAddressModal').modal('hide');
                Swal.fire('Success', 'Address added successfully!', 'success');
                window.location.reload();
            } else {
                Swal.fire('Error', data.message || 'Failed to add address', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'There was an error while adding the address', 'error');
        });
});


document.getElementById('editAddressForm').addEventListener('submit', function (event) {
    event.preventDefault();


    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const pincode = document.getElementById('editPincode').value.trim();
    const addressLine = document.getElementById('editAddressLine').value.trim();
    const city = document.getElementById('editCity').value.trim();
    const state = document.getElementById('editState').value.trim();
    const country = document.getElementById('editCountry').value.trim();


    const nameRegex = /^[A-Za-z\s]{2,50}$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;


    let isValid = true;
    let errorMessage = "";

    if (!nameRegex.test(name)) {
        isValid = false;
        errorMessage += "Name must be 2-50 characters and contain only letters.\n";
    }

    if (!phoneRegex.test(phone)) {
        isValid = false;
        errorMessage += "Phone number must be a valid 10-digit.\n";
    }

    if (!pincodeRegex.test(pincode)) {
        isValid = false;
        errorMessage += "Pincode must be a 6-digit number.\n";
    }

    if (addressLine.length < 5 || addressLine.length > 100) {
        isValid = false;
        errorMessage += "Address line must be between 5 and 100 characters.\n";
    }

    if (city.length < 2 || city.length > 50) {
        isValid = false;
        errorMessage += "City name must be between 2 and 50 characters.\n";
    }

    if (state.length < 2 || state.length > 50) {
        isValid = false;
        errorMessage += "State name must be between 2 and 50 characters.\n";
    }

    if (country.length < 2 || country.length > 50) {
        isValid = false;
        errorMessage += "Country name must be between 2 and 50 characters.\n";
    }


    if (!isValid) {
        Swal.fire({
            icon: 'error',
            title: 'Wrong address',
            text: errorMessage,
            confirmButtonText: 'OK'
        });
        return;
    }


    const addressId = document.getElementById('editAddressId').value;
    const formData = {
        addressId: addressId,
        name: name,
        phone: phone,
        addressLine: addressLine,
        city: city,
        state: state,
        country: country,
        pincode: pincode,
        addressType: document.getElementById('editAddressType').value,
    };

    fetch('/edit-address', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                Swal.fire('Error', `Error updating address: ${data.error}`, 'error');
            } else if (data._id) {
                Swal.fire('Success', 'Address updated successfully!', 'success');
                location.reload();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', 'An unexpected error occurred while updating the address. Please try again.', 'error');
        });
});
// address delete


document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('delete-address-btn')) {
            const addressId = event.target.getAttribute('data-id');

            Swal.fire({
                title: 'Are you sure?',
                text: 'Do you want to delete this address?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, delete it!',
                cancelButtonText: 'No, cancel',
            }).then((result) => {
                if (result.isConfirmed) {

                    fetch(`/delete-address/${addressId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (data.success) {

                                Swal.fire('Deleted!', 'Address deleted successfully.', 'success');


                                const addressCard = event.target.closest('.address-card');
                                if (addressCard) {
                                    addressCard.remove();
                                }
                            } else {

                                Swal.fire('Error!', `Error deleting address: ${data.error}`, 'error');
                            }
                        })
                        .catch((error) => {
                            console.error('Error:', error);


                            Swal.fire('Error!', 'An error occurred while deleting the address. Please try again.', 'error');
                        });
                } else if (result.dismiss === Swal.DismissReason.cancel) {

                    Swal.fire('Cancelled', 'Your address is safe.', 'info');
                }
            });
        }
    });
});




document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;


    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;

    if (!strongPasswordRegex.test(newPassword)) {
        Swal.fire(
            'Weak Password!',
            'Password must be at least 8 characters long,\n contain an uppercase letter,\n a lowercase letter,\n a number, and a special character.',
            'warning'
        );
        return;
    }

    if (newPassword !== confirmPassword) {
        Swal.fire('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentPassword, newPassword ,confirmPassword }),
        });

        const result = await response.json();

        if (response.ok) {
            Swal.fire(result.message || 'Password updated successfully.');
            document.getElementById('changePasswordForm').reset();
        } else {
            Swal.fire(result.error || 'An error occurred while changing the password.');
        }
    } catch (error) {
        Swal.fire('Network error: ' + error.message);
    }
});


$(document).on('click', '.edit-address-btn', function () {
    // Retrieve address details from the button's data attributes
    const addressId = $(this).data('id');
    const name = $(this).data('name');
    const phone = $(this).data('phone');
    const addressLine = $(this).data('address-line');
    const city = $(this).data('city');
    const state = $(this).data('state');
    const country = $(this).data('country');
    const pincode = $(this).data('pincode');
    const addressType = $(this).data('address-type');

    // Populate the modal fields with the address details
    $('#editAddressId').val(addressId);
    $('#editName').val(name);
    $('#editPhone').val(phone);
    $('#editAddressLine').val(addressLine);
    $('#editCity').val(city);
    $('#editState').val(state);
    $('#editCountry').val(country);
    $('#editPincode').val(pincode);
    $('#editAddressType').val(addressType);
});



