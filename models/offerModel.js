const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    discount:{
        type:Number,
        required:true
    },

    expiresAt:{
        type:Date,
        required:true
    },
    activeAt:{
        type:Date,
        required:true
    },
    isActive:{
        type:Boolean
    }
})

const Offer = mongoose.model('Offer',offerSchema);

module.exports  = Offer;