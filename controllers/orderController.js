const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
const User = require('../models/userModel')
const Cart = require('../models/cartModel')

const getCheckout = async (req,res) => {
    try {

        const user = await User.findById(req.session.user) ;
        
        

        const userAddresses = await Address.find({userId:req.session.user})

        const cart = await Cart.findOne({userId : req.session.user}).populate('items.productId','name price');

        if(!cart || cart.items.length === 0 ){
            return res.redirect('/cart')
        }

        const cartItems = cart.items.map(item => ({
            name: item.productId.name,
            price: item.productId.price,
            quantity: item.quantity,
            total: item.productId.price * item.quantity
        }))

        cartTotal = cartItems.reduce((sum,item)=> sum + item.total , 0 );
        
        res.render('checkout', {
            userAddresses,
            cartItems,
            cartTotal
        })

        
    } catch (error) {
        console.error('Error while feth products : ',error);
        res.status(500).render('error')
    }
}

const checkout = async (params) => {
    try {
        
    } catch (error) {
        
    }
}


module.exports = {
    getCheckout,
    checkout
}