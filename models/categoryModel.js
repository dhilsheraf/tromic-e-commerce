    const mongoose = require('mongoose');

    const categorySchema = new mongoose.Schema({
        name: { type: String,
             required: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true, required: true },
        offer:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Offer'
        }
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('Category',categorySchema)
     