

            //edit profile
            document.getElementById("editProfileForm").addEventListener("submit", function(event) {
                event.preventDefault();  // Prevent the default form submission

                // Prepare the form data
                const username = document.getElementById("username").value;
                const number = document.getElementById("number").value;

                // Send the form data to the backend using fetch
                fetch('/profile-update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',  // Ensure the backend can read the data as JSON
                    },
                    body: JSON.stringify({ username, number }), // Send data as JSON
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message === 'Profile updated successfully') {
                        window.location.href = '/my-account'
                    } else {
                        alert(data.message);  // Display an error message if the update fails
                    }
                })
                .catch(error => {
                    console.error("Error:", error);
                    alert("An error occurred while updating your profile.");
                });
            });


            document.getElementById("addAddressForm").addEventListener("submit", function(event) {
                event.preventDefault();  // Prevent form from submitting the default way

                const formData = {
                    name: document.getElementById("name").value,
                    phone: document.getElementById("phone").value,
                    addressType: document.getElementById("addressType").value,
                    pincode: document.getElementById("pincode").value,
                    addressLine: document.getElementById("addressLine").value,
                    city: document.getElementById("city").value,
                    state: document.getElementById("state").value,
                    country: document.getElementById("country").value
                };

                // Send data to the backend
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
                        // Close the modal
                        $('#addAddressModal').modal('hide');
                        
                        // Optionally, reload the page or update the UI
                        alert('Address added successfully!');
                        window.location.reload();  // Reload the page to reflect changes
                    } else {
                        alert('Failed to add address');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('There was an error while adding the address');
                });
            });



            document.addEventListener("DOMContentLoaded", function () {
                const editAddressButtons = document.querySelectorAll("[data-bs-target='#editAddressModal']");
            
                editAddressButtons.forEach(button => {
                    button.addEventListener('click', function() {
                        const addressId = button.getAttribute("data-id");
                        const name = button.getAttribute("data-name");
                        const phone = button.getAttribute("data-phone");
                        const addressLine = button.getAttribute("data-address-line");
                        const city = button.getAttribute("data-city");
                        const state = button.getAttribute("data-state");
                        const country = button.getAttribute("data-country");
                        const pincode = button.getAttribute("data-pincode");
                        const addressType = button.getAttribute("data-address-type");
            
                        // Populate the modal form fields with the address data
                        document.getElementById("editAddressId").value = addressId;
                        document.getElementById("editName").value = name;
                        document.getElementById("editPhone").value = phone;
                        document.getElementById("editAddressLine").value = addressLine;
                        document.getElementById("editCity").value = city;
                        document.getElementById("editState").value = state;
                        document.getElementById("editCountry").value = country;
                        document.getElementById("editPincode").value = pincode;
                        document.getElementById("editAddressType").value = addressType;
                    });
                });
            });
            
            document.getElementById('editAddressForm').addEventListener('submit', function(event) {
                event.preventDefault();  // Prevent the form from reloading the page
            
                const addressId = document.getElementById('editAddressId').value;
                const formData = {
                    addressId: addressId,
                    name: document.getElementById('editName').value,
                    phone: document.getElementById('editPhone').value,
                    addressLine: document.getElementById('editAddressLine').value,
                    city: document.getElementById('editCity').value,
                    state: document.getElementById('editState').value,
                    country: document.getElementById('editCountry').value,
                    pincode: document.getElementById('editPincode').value,
                    addressType: document.getElementById('editAddressType').value,
                };
            
                // Send data to the server
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
                        // Show error alert
                        alert(`Error updating address: ${data.error}`);
                    } else if (data._id) {
                        // Successfully updated
                        alert('Address updated successfully!');
                        location.reload(); // Optionally reload the page or update the UI
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An unexpected error occurred while updating the address. Please try again.');
                });
            });
            
            // address delete


            document.addEventListener('DOMContentLoaded', () => {
                // Event delegation for dynamically loaded delete buttons
                document.addEventListener('click', function (event) {
                    if (event.target.classList.contains('delete-address-btn')) {
                        const addressId = event.target.getAttribute('data-id');
            
                        // Confirm the deletion action with the user
                        if (confirm('Are you sure you want to delete this address?')) {
                            // Send the delete request to the server
                            fetch(`/delete-address/${addressId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })
                            .then(response => response.json())
                            .then(data => {
                                if (data.success) {
                                    alert('Address deleted successfully!');
                                    // Remove the address card from the DOM
                                    const addressCard = event.target.closest('.address-card');
                                    if (addressCard) {
                                        addressCard.remove();
                                    }
                                } else {
                                    alert(`Error deleting address: ${data.error}`);
                                }
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                alert('An error occurred while deleting the address. Please try again.');
                            });
                        }
                    }
                });
            });
            

            
            document.getElementById('changePasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    try {
        const response = await fetch('/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Password updated successfully.');
            document.getElementById('changePasswordForm').reset();
        } else {
            alert(result.error || 'An error occurred while changing the password.');
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
});

