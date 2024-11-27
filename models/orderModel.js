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
                    ref: 'Product', 
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
                    enum: ['Pending','shipped','on delivery', 'delivered', 'cancelled', 'return'],
                    default: 'Pending',
                }                
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending','shipped','on delivery', 'delivered', 'cancelled','return' ],
            default: 'Pending',
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
