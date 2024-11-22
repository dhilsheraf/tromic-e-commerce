const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const wishlistSchema = new mongoose.Schema({
    userId:{
        type: ObjectId,
        required: true
    },
    items:[{productId:{
        type: ObjectId,
        required:true,
        ref:'Product'
    }}]
},
        { timestamps:true }
)


module.exports = mongoose.model('Wishlist',wishlistSchema)