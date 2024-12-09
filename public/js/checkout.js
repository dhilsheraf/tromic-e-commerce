console.log("checkout loaded")

function myaccount(){
    window.location.href = '/my-account'
}



function saveAddress() {
    const fullName = document.getElementById("fullName").value.trim();
const phone = document.getElementById("phone").value.trim();
const addressType = document.getElementById("addressType").value;
const pincode = document.getElementById("pincode").value.trim();
const address = document.getElementById("address").value.trim();
const city = document.getElementById("city").value.trim();
const state = document.getElementById("state").value.trim();
const country = document.getElementById("country").value.trim();
const errors = [];
if (!fullName) errors.push("Full Name is required.");
if (!phone || !/^\d{10}$/.test(phone)) errors.push("Phone must be a valid 10-digit number.");
if (!pincode || !/^\d{6}$/.test(pincode)) errors.push("Pincode must be a valid 6-digit number.");
if (!address) errors.push("Address is required.");
if (!city) errors.push("City is required.");
if (!state) errors.push("State is required.");
if (!country) errors.push("Country is required.");
if (errors.length > 0) {
    Swal.fire("Please fix :\n" + errors.join("\n"));
    return;
}
const newAddress = {
    name:fullName,
    phone,
    addressType,
    pincode,
    addressLine:address,
    city,
    state,
    country,
};
fetch('/add-address', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newAddress),
})
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            Swal.fire("Address saved successfully!").then(()=>{
                window.location.reload(); 
            })
        } else { 
            Swal.fire( data.message).then(()=>{
            window.location.reload()
            })
            
        }
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while saving the address.");
    });
}