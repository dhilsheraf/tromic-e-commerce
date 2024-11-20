const mongoose = require('mongoose') ;
const ObjectId = mongoose.Schema.ObjectId

const AddressSchema = new mongoose.Schema({
    userId: { 
        type: ObjectId, 
        ref: 'User', 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true,
    },
    pincode: { 
        type: String, 
        required: true, 
    },   
    country: { 
        type: String, 
        required: true 
    },
    city: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String, 
        required: true 
    },
    addressLine: {  
        type: String, 
        required: true 
    },
    addressType: {
        type: String,
        enum: ['Home', 'Work', 'Other'],  
        required: true
    }
}, 
{
    timestamps: true 
});

module.exports = mongoose.model('Address', AddressSchema);