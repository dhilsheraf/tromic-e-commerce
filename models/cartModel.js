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
    totalQuantity: {
        type: Number,
        default: 0,
    },
    totalPrice: {
        type: Number,
        default: 0.0,
    },
});



CartSchema.pre('save', function (next) {
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalPrice = this.items.reduce((sum, item) => sum + item.total, 0);
    next();
}); 

module.exports = mongoose.model('Cart', CartSchema);
