    const mongoose = require('mongoose');

    const categorySchema = new mongoose.Schema({
        name: { type: String, required: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true, required: true },
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('Category',categorySchema)
     