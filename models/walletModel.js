const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: ObjectId,
            ref: 'User',
            required: true,
            unique: true, 
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
            min: 0, 
        },
        transactions: [
            {
                type: {
                    type: String,
                    enum: ['Credit', 'Debit'], 
                    required: true,
                },
                amount: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                date: {
                    type: Date,
                    default: Date.now,
                },
                description: {
                    type: String,
                },
                orderId: {
                    type: ObjectId,
                    ref: 'Order', 
                },
            },
        ],
    },
    { timestamps: true }
);

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;
