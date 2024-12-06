const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: ObjectId , ref: 'Category', required: true },
    images: { type: [String], required: true },  
    stock: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }, // Soft delete flag,
    offer: { type:ObjectId,
        ref:'Offer'
    },
    originalPrice: {
        type:Number
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;