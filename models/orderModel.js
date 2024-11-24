const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            ref: 'User', 
            required: true,
        },
        products: [
            {
                product: {
                    type: ObjectId,
                    ref: 'Cart', 
                    required: true,
                },
                price: {
                    type: Number,
                    required: true, 
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                status: {
                    type: String,
                    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'return'],
                    default: 'pending',
                }                
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed','packed','shipped', 'delivered', 'cancelled','return' ],
            default: 'pending',
        },
        payment: {
            type: String,
            enum: ['wallet', 'COD', 'online'], 
            required: true,
        },
        addressId: {
            type: ObjectId,
            ref: 'Address', 
            required: true,
        },
    },
    {
        timestamps: true, 
    }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
