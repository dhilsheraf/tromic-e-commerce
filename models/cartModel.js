const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const CartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User', 
        required: true,
    },
    items: [
        {
            productId: {
                type: ObjectId,
                ref: 'Product', 
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            total: {
                type: Number,
                required: true,
            },
        },
    ],
    totalPrice: {
        type: Number,
        default: 0,
    },
});





module.exports = mongoose.model('Cart', CartSchema);
