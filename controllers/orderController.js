const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Address = require('../models/addressModel');
const User = require('../models/userModel')
const Cart = require('../models/cartModel')
const razorpay = require('razorpay')
const env = require('dotenv').config()
const crypto = require('crypto');
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')

const getCheckout = async (req, res) => {
    try {

        const user = await User.findById(req.session.user);
      
        const currentDate = new Date();
        const coupons = await Coupon.find({
            activeAt: { $lte: currentDate }, // Coupon is active if current date is after activeAt
            expiresAt: { $gte: currentDate }  // Coupon is valid if current date is before expiresAt
        });


        const userAddresses = await Address.find({ userId: req.session.user })

        const cart = await Cart.findOne({ userId: req.session.user }).populate('items.productId', 'name price');

        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart')
        }

        const cartItems = cart.items.map(item => ({
            productId: item.productId,
            name: item.productId.name,
            price: item.productId.price,
            quantity: item.quantity,
            total: item.productId.price * item.quantity
        }))

        const wallet = await Wallet.findOne({ userId:req.session.user });


        cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const isWalletAvailable = wallet.balance >= cartTotal
        res.render('checkout', {
            userAddresses,
            cartItems,
            cartTotal,
            user,
            coupons,
            wallet:wallet.balance,
            isWalletAvailable
        })


    } catch (error) {
        console.error('Error while feth products : ', error);
        res.status(500).render('error')
    }
}

const RazorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const checkout = async (req, res) => {
    try {

        const { addressId, paymentMethod, cartItems , couponCode} = req.body;


        if (!addressId || !paymentMethod || !cartItems || cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid order data' })
        }
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        let totalPrice = 0;
        let totalPriceWithoutCouponOffer = 0 ;
        const orderProducts = [];

        

        for (const item of cartItems) {
            const product = await Product.findById(item.productId).populate('category');

            if (!product) {
                return res.status(404).json({ success: false, message: `Product with invalid Id ${item.productId} not found` })
            }

            if ( !product.isActive || product.category.isActive === false) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Product "${product?.name || 'Unknown'}" is inactive or unavailable.\n Please remove it from cart` 
                });
            }

            if (product.stock < item.quantity) {
                console.log(`Product: ${product.name}, Stock: ${product.stock}, Quantity: ${item.quantity}`);
                return res.status(400).json({ success: false, message: `Insuffiecient stock for ${product.name}
                    available stock ${product.stock}` })

            }

            totalPriceWithoutCouponOffer += product.price * item.quantity;

            orderProducts.push({
                product: product._id,
                price: product.price,
                quantity: item.quantity

            })

            product.stock -= item.quantity;

            await product.save();
        }

        let coupon = null ;

        if(couponCode){
            coupon = await Coupon.findOne({code:couponCode});
            if(!coupon){
                return res.status(400).json({success:false , message: 'Invalid coupon code'});
            }
            if(coupon.expiresAt < Date.now()) return res.status(400).json({ success:false , message:'Coupon has expired'})

            if(totalPriceWithoutCouponOffer < coupon.minAmount) return res.status(400).json({ success:false , message:`Minimun purchase of ₹${coupon.minAmount} required for this coupon`})

            const discount = coupon.discount;
            totalPrice = totalPriceWithoutCouponOffer - discount ;
        }else{
            totalPrice = totalPriceWithoutCouponOffer;
        }


        let razorpayOrderId = '';
        if(paymentMethod === 'razorpay'){
            const options = {
                amount: totalPrice * 100, 
                currency:'INR',
                receipt:`order_rcptid_${new Date().getTime()}`,
                payment_capture: 1 
            };
        
            const razorpayOrder = await RazorpayInstance.orders.create(options);
            razorpayOrderId = razorpayOrder.id;  
        }
        

        const newOrder = new Order({
            userId: req.session.user,
            addressId: addressId,
            payment: paymentMethod,
            products: orderProducts,
            totalPrice,
            totalPriceWithoutCouponOffer,
            paymentStatus: paymentMethod === 'razorpay' ? 'Pending' : paymentMethod === 'COD' ?'Pending':'completed' ,
            razorpayOrderId,
            status: 'Pending',
            coupon: coupon ? { code: coupon.code , discount: coupon.discount , minAmount:coupon.minAmount} :null
        })

        await newOrder.save();
        console.log(newOrder)
        await Cart.findOneAndUpdate({ userId: req.session.user }, { $set: { items: [] } })

        res.status(201).json({ success: true, message: `Order placed successfully`, orderId: newOrder._id , razorpayOrderId:razorpayOrderId,totalPrice })


    } catch (error) {
        console.error("Error during checkout", error);
        res.status(500).json({ success: false, message: 'An error occurred while placing the order',orderId:newOrder._id,razorpayOrderId:razorpayOrderId });
    }
}


const verifyPayment = async (req, res) => {
    try {
        console.log("Working verifyPayment");

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', RazorpayInstance.key_secret)
            .update(body)
            .digest('hex');

        

        if (expectedSignature === razorpay_signature) {
            // Payment is successful, update the order status
            const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
            if (order) {
                order.paymentStatus = 'completed';
                order.status = 'Pending';
                await order.save();
                await Cart.findOneAndUpdate({ userId: req.session.user }, { $set: { items: [] } })
                // Optional: Update inventory or trigger other actions here.

                res.status(200).json({ success: true, orderId: order._id });
            } else {
                console.log('Order not found for Razorpay Order ID:', razorpay_order_id);
                res.status(404).json({ success: false, message: 'Order not found' });
            }
        } else {
            console.log('Signature mismatch.');
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying Razorpay payment', error);
        res.status(500).json({ success: false, message: 'An error occurred while verifying payment' });
    }
};



const orderConfirm = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId).populate('products.product').exec()
        res.render('orderConfirm', { order })
    } catch (error) {
        console.error("Error ocured while order confirm", error)
        res.render('error')
    }
}

const detailOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;


        const order = await Order.findById(orderId).populate('products.product')
            .populate('userId')
            .populate('addressId');

        
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        
        res.render('orderDetail', { order });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error' });
    }
}

//Admin Side 
const showOrder = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;



        const skip = (page - 1) * limit;

        
        const orders = await Order.find()
            .populate('userId').populate('products.product').populate('addressId')
            .skip(skip)
            .limit(Number(limit))
            .lean();

        
        const totalOrders = await Order.countDocuments();
        const totalPages = Math.ceil(totalOrders / limit);
          
        res.render('admin/orders', {
            orders,
            totalPages,
            currentPage: Number(page),
            limit:Number(limit)
        });
    } catch (error) {
        console.error('Error occurred:', error);
        res.render('admin/404');
    }
};



const orderAction = async (req, res) => {
    try {

        const { orderId } = req.params

        const order = await Order.findById(orderId)
            .populate('products.product', '')
            .populate('userId',)
            .populate('addressId');
        if (!order) {
            console.log('ordernot found')
            return res.status(404).render('error')
        }
        res.render('admin/orderAction', { order });
    } catch (error) {
        console.error("Error occured while order ordert", error)
        res.render('admin/404')
    }
}

const orderStatus = async (req, res) => {
    const { orderId, productId } = req.params;
    const { status } = req.body;
    try {

        const validStatus = ['Pending', 'shipped', 'on delivery', 'delivered', 'cancelled', 'return']

        if (!validStatus.includes(status)) {
            return res.status(404).json({ succes: false, message: 'Invalid status error' })
        }



        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'order not found' });
        }

        const productItem = order.products.find(p => p.product.toString() === productId);

        if (!productItem) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        productItem.status = status;

        if(status === 'cancelled')  {
            const product = await Product.findById(productId);
            if(!product){
                return res.status(404).json({message:"Product not found"})
            }
            product.stock += productItem.quantity;
           
            await product.save();
        }
        if(productItem.status === 'delivered')
        order.paymentStatus = 'completed';
        await order.save();

        res.json({ success: true, message: 'Product status update successfull', order })

    } catch (error) {
        console.error("Error occure while updateing the product status", error.message);
        res.status(500).json({ success: false, message: 'Internal server errore' })
    }
}

const cancelOrder = async (req, res) => {
    const { orderId, productId } = req.body;
    try {

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        const productIndex = order.products.findIndex(p => p.product._id.toString() === productId)

        if (productIndex <= -1) return res.status(404).json({ message: "Product not found in the order" })

        const productItem = order.products[productIndex];
        
        if (productItem.status !== 'Pending') return res.status(400).json({ message: "Product cannot be cancelled" })

        const product = await Product.findById( productId );
        if (!product) return res.status(404).json({ message: "Product not found " });

        product.stock += productItem.quantity;

        await product.save();
        productItem.status = 'cancelled';
        const refundAmount = productItem.price * productItem.quantity;


        if (isNaN(refundAmount) || refundAmount < 0) {
            console.error("Invalid refundAmount", refundAmount);
            return res.status(500).json({ message: "Invalid refund amount calculated" });
        }

        order.totalPriceWithoutCouponOffer -= refundAmount;


        if(order.coupon && order.totalPriceWithoutCouponOffer < order.coupon.minAmount){
            order.totalPrice += order.discount;
            order.coupon = null;
        }else {
            order.totalPrice -= refundAmount;
        }

        order.totalPrice = Math.max(0,order.totalPrice);
        order.totalPriceWithoutCouponOffer = Math.max(0,order.totalPriceWithoutCouponOffer)
        if(order.totalPrice === 0) order.paymentStatus = 'cancelled'

        await order.save();


        if(order.payment === 'razorpay' || order.payment === 'wallet'){
            if(order.payment === 'razorpay' && order.paymentStatus !== 'completed'){
                return res.status(400).json({ message: 'Payment not completed, refund cannot be procced'})
            }
            let wallet = await Wallet.findOne({ userId: order.userId});
            if(!wallet){
                wallet =  new Wallet({ userId:order.userId });
            }
            wallet.balance += refundAmount;
            wallet.transactions.push({
                type:'Credit',
                amount:refundAmount,
                description:`Cancelled product refund ${product.name}`,
                orderId:order._id
            })
            await wallet.save();
        }
        

        res.status(200).json({ message: "Order item cancelled successfully" });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "An error occurred while cancelling the order" });
    }
}

const returnOrder = async (req,res) => {
    try {
        const { orderId, productId, reason } = req.body;

        if (!orderId || !productId || !reason) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, 'products.product': productId }, 
            {
                $set: {
                    'products.$.reasonForReturn': reason, 
                },
            },
            { new: true } 
        );

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order or product not found.' })
        }

        res.status(200).json({ success: true, message: 'Return reason updated successfully.', order })
    } catch (error) {
        console.error('Error processing return request:', error);
        res.status(500).json({ success: false, message: 'An error occurred while processing your request.' });
    }
}



const approveReturn = async (req, res) => {
    const { orderId, productId } = req.params;
    
    try {

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const productItem = order.products.find(p => p.product.toString() === productId);
        if (!productItem) {
            return res.status(404).json({ success: false, message: 'Product not found in the order' });
        }

        const refundAmount = productItem.price * productItem.quantity;

        const user = await User.findById(order.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let wallet = await Wallet.findOne({ userId: user._id });
        if (!wallet) {

            wallet = new Wallet({ userId: user._id })
        }

        wallet.balance += refundAmount

        wallet.transactions.push({
            type: 'Credit',
            amount: refundAmount,
            description: `Refund for returned product `,
            orderId: order._id,
        });

        await wallet.save()

        order.totalPrice -= refundAmount;
        if(order.totalPrice < 0) order.totalPrice = 0;


        productItem.status = 'return'
        await order.save();

        res.json({ success: true, message: 'Return approved and money credited to wallet successfully' });
    } catch (error) {
        console.error("Error while approving return:", error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



const rejectReturn = async (req, res) => {
    const { orderId, productId } = req.params;

    try {
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' })
        }

        const productItem = order.products.find(p => p.product.toString() === productId);
        if (!productItem) {
            return res.status(404).json({ success: false, message: 'Product not found in the order' })
        }
        productItem.status = 'return reject'

        await order.save()

        res.json({ success: true, message: 'Return rejected successfully' });
    } catch (error) {
        console.error("Error while rejecting return:", error.message)
        res.status(500).json({ success: false, message: 'Internal server error' })
    }
};

module.exports = {
    getCheckout,
    checkout,
    orderConfirm,
    detailOrder,
    showOrder,
    orderAction,
    orderStatus,
    cancelOrder,
    verifyPayment,
    returnOrder,
    approveReturn,
    rejectReturn
}