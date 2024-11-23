const Address = require('../models/addressModel');

const addAddress = async (req,res) => {
    try {
        const userId = req.session.user ;

        console.log(req.body);
        

        const { name, phone, addressType, pincode, addressLine, city, state, country } = req.body;

        const newAddress = new Address({
            userId, 
            name,
            phone,
            addressType,
            pincode,
            addressLine,
            city,
            state,
            country,
        });

        await newAddress.save();
        res.status(200).json({ message: 'Address added successfully!' });
    } catch (error) {
        console.error('Error saving address:', error);
        res.status(500).json({ message: 'Failed to add address.' });
    }
}

const editAddress =  async (req, res) => {
    const { addressId, name, phone, addressLine, city, state, country, pincode, addressType } = req.body;

    // Check if all necessary fields are present
    if (!addressId || !name || !phone || !addressLine || !city || !state || !country || !pincode || !addressType) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Update the address in the database
        const updatedAddress = await Address.findByIdAndUpdate(
            addressId,
            { name, phone, addressLine, city, state, country, pincode, addressType },
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json(updatedAddress);
    } catch (error) {
        console.error('Error updating address:', error.message);
        res.status(500).json({ error: 'Error updating address' });
    }
}

const deleteAddress = async (req, res) => {
    const addressId = req.params.id;

    try {

        const deletedAddress = await Address.findByIdAndDelete(addressId);

        if (!deletedAddress) {
            return res.status(404).json({ success: false, error: 'Address not found' });
        }

        res.json({ success: true, message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, error: 'An error occurred while deleting the address' });
    }
}

module.exports = {
    addAddress,
    editAddress,
    deleteAddress
}