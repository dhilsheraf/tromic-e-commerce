const mongoose = require('mongoose') ; 
require('dotenv').config()

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`mongoDB connected : ${conn.connection.host}`);
        
    } catch (error){
        console.error(error.message);
        process.exit(1)

    }
}

module.exports = connectDB