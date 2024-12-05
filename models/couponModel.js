const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code:{ type:String , required: true , unique: true},
    minAmount :{
        type:Number,
        required:true,

    },
    discount:{
        type:Number,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true
    }

},{
    timestamps:true
}
)

const Coupon = mongoose.model('Coupon',couponSchema)

module.exports = Coupon