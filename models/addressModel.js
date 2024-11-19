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
    mobile: { 
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
    district: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String, 
        required: true 
    },
    address_line: {  
        type: String, 
        required: true 
    },
    address_type: {
        type: String,
        enum: ['Home', 'Work', 'Other'],  
        required: true
    }
}, 
{
    timestamps: true 
});

module.exports = mongoose.model('Address', AddressSchema);