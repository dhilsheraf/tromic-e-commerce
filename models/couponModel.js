const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code:{ type:String , required: true ,uppercase:true, unique: true ,trim:true},
    minAmount :{
        type:Number,
        required:true,

    },
    discount:{
        type:Number,
        required:true
    },
    activeAt:{
        type:Date,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true
    }
}
)

const Coupon = mongoose.model('Coupon',couponSchema)

module.exports = Coupon