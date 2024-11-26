const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
const User = require('../models/userModel')
const Cart = require('../models/cartModel')

const getCheckout = async (req, res) => {
    try {

        const user = await User.findById(req.session.user);



        const userAddresses = await Address.find({ userId: req.session.user })

        const cart = await Cart.findOne({ userId: req.session.user }).populate('items.productId', 'name price');

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart')
        }

        const cartItems = cart.items.map(item => ({
            productId : item.productId,
            name: item.productId.name,
            price: item.productId.price,
            quantity: item.quantity,
            total: item.productId.price * item.quantity
        }))

        cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

        res.render('checkout', {
            userAddresses,
            cartItems,
            cartTotal
        })


    } catch (error) {
        console.error('Error while feth products : ', error);
        res.status(500).render('error')
    }
}

const checkout = async (req,res) => {
    try {
        
        const {addressId,paymentMethod,cartItems} = req.body ;
        

        if(!addressId || !paymentMethod || !cartItems || !cartItems.length ===0 ){
            return res.status(400).json({success:false , message: 'Invalid order data'})
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }
        
        let totalPrice = 0 ;

        const orderProducts = [] ;

        console.log(cartItems)

        for(const item of cartItems ) {
            const product = await Product.findById (item.productId);

            if(!product) {
                return res.status(404).json({success:false , message: `Product with invalid Id ${item.productId} not found`})
            }

            if(product.stock < item.quantity){
                return res.status(400).json({ success: false , message:`Insuffiecient stock for ${product.name}`})
                console.log(`Product: ${product.name}, Stock: ${product.stock}, Quantity: ${item.quantity}`);

            }

            totalPrice += product.price * item.quantity ;

            orderProducts.push({
                product: product._id,
                price: product.price,
                quantity: item.quantity

            })

            product.stock -= item.quantity;

            await product.save();
        }

        const newOrder = new Order ({
            userId: req.session.user,
            addressId:addressId,
            payment:paymentMethod,
            products:orderProducts,
            totalPrice,
            status:'Pending'
        })

        await newOrder.save();

        await Cart.findOneAndUpdate({userId:req.session.user},{$set:{items:[]}})
        
        res.status(201).json({success:true , message: `Order placed successfully`,orderId:newOrder._id})


    } catch (error) {
        console.error("Error during checkout",error);
        res.status(500).json({ success: false, message: 'An error occurred while placing the order' });
    }
}

const orderConfirm = async (req,res) => {
    try {
        const {orderId} = req.params ;
        const order = await Order.findById(orderId).populate('products.product').exec()  
        res.render('orderConfirm',{ order })
    } catch (error) {
        console.error("Error ocured while order confirm",error)
        res.render('error')
    }
}

const orderDetail = async (req,res) => {
    try {

        const { id } = req.params

        const order = await Order.findById(id)
            .populate('products.product', 'name price')
            .populate('userId',)
            .populate('addressId');

        if(!order){
            console.log('ordernot found')
            return res.status(404).render('error')
        }
         res.render('orderDetail',{order});
    } catch (error) {
        console.error("Error occured while order ordert",error)
        res.render('error')
    }
}


//Admin Side 

const showOrder = async (req,res) => {
    try {

        const {page = 1 , limit = 10 , search = '' , status } = req.query ;

        const query = {};

        if(status && status != 'all') query.status = status ;
        if(search) query['$or'] = [
            {'userId.username':{$regex:search , $options: ' i' }},
            {'userId.number': { $regex:search , $options: 'i' }},
            {'products.product.name': {$regex: search , $options: 'i' }}
        ];


        const skip = (page -1) * limit ;

        const orders = await Order.find(query).populate('userId').populate('products.product').populate('addressId').lean();

       const totalOrders = await Order.countDocuments(query);

        res.render('admin/orders',{ orders });

    } catch (error) {
        console.log("Error occured while ",error)
        res.render('admin/404')
    }
}


module.exports = {
    getCheckout,
    checkout,
    orderConfirm,
    orderDetail,
    showOrder
}