const Address = require('../models/addressModel');

const addAddress = async (req,res) => {
    try {
        const userId = req.session.user ;

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

const editAddress = async (req,res) => {
    try {
        
    } catch (error) {
        
    }
}

module.exports = {
    addAddress,
    editAddress
}