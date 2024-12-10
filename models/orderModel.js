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
                    enum: ['Pending','shipped','on delivery', 'delivered', 'cancelled', 'return','return reject'],
                    default: 'Pending',
                },    
                
                reasonForReturn: {
                    type:String
                }            
            },
        ],
        totalPrice: {
            type: Number,
            required: true,
        },
        coupon:{
            code:{
                type:String,
            },
            discount:{
                type:Number
            },
            minAmount:{
                type:Number
            }
        }
        ,
        totalPriceWithoutCouponOffer: {
            type:Number,
            required:true
        },
        paymentStatus: {
            type: String,
            enum : ['Pending','failed','completed',],
            default:'Pending'
        }
        ,
        status: {
            type: String,
            enum: ['Pending', 'cancelled','delivered' ],
            default: 'Pending',
        },
        payment: {
            type: String,
            enum: ['wallet', 'COD', 'razorpay'], 
            required: true,
        },
        addressId: {
            type: ObjectId,
            ref: 'Address', 
            required: true,
        },
        razorpayOrderId: { type: String },  
        razorpayPaymentId: { type: String }, 
    },
    {
        timestamps: true, 
    }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
