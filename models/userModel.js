const mongoose = require('mongoose') ;

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },

    email: { type: String, required: true ,unique:true},

    number: { type: String, required: false , default:null},

    googleId:{ type:String, default:null },

    password: { type: String, required: false },

    isBlocked:{type:Boolean, default:false}

  },
{
        timestamps: true
}
);

module.exports = mongoose.model('User', UserSchema);  