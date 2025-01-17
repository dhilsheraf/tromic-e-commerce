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
const PDFDocument = require('pdfkit')
const fs = require('fs')
const path = require('path');
const mongoose  = require('mongoose');

//checkout page loading
const getCheckout = async (req, res) => {
    try {

        const user = await User.findById(req.session.user);
      
        const currentDate = new Date();
        const coupons = await Coupon.find({
            activeAt: { $lte: currentDate },  expiresAt: { $gte: currentDate }   });


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

        let wallet = await Wallet.findOne({ userId:req.session.user });

        if(!wallet){
            wallet = new Wallet({userId:req.session.user ,balance:0,transactions:[]});
            await wallet.save()
        }


        cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
        const isWalletAvailable = wallet.balance >= cartTotal
        res.render('checkout', { userAddresses, cartItems, cartTotal,
            user, coupons, wallet:wallet.balance, isWalletAvailable
        })


    } catch (error) {
        console.error('Error while feth products : ', error);
        res.status(500).render('error')
    }
}


//instance of the razorpay
const RazorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})


//checkout of working post 
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

        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ userId: req.session.user });
            if (!wallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }
            if (wallet.balance < totalPrice) {
                return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
            }

            wallet.balance -= totalPrice;
            wallet.transactions.push({
                type: 'Debit',
                amount: totalPrice,
                description: 'Order payment',
            });
            await wallet.save();
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
        await Cart.findOneAndUpdate({ userId: req.session.user }, { $set: { items: [] } })

        res.status(201).json({ success: true, message: `Order placed successfully`, orderId: newOrder._id , razorpayOrderId:razorpayOrderId,totalPrice })


    } catch (error) {
        console.error("Error during checkout", error);
        res.status(500).json({ success: false, message: 'An error occurred while placing the order',orderId:newOrder._id,razorpayOrderId:razorpayOrderId });
    }
}

//razorpay payment checking if fail or not
const verifyPayment = async (req, res) => {
    try {

        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        // console.log(req.body)
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', RazorpayInstance.key_secret)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
            if (order) {
                order.paymentStatus = 'completed';
                order.status = 'Pending';
                await order.save();
                await Cart.findOneAndUpdate({ userId: req.session.user }, { $set: { items: [] } })

                res.status(200).json({ success: true, orderId: order._id });
            } else {
                res.status(404).json({ success: false, message: 'Order not found' });
            }
        } else {
            res.status(400).json({ success: false, message: 'Payment verification failed' });
        }
    } catch (error) {
        console.error('Error verifying Razorpay payment', error);
        res.status(500).json({ success: false, message: 'An error occurred while verifying payment' });
    }
};


//order confirm page user side
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
//order details user side
const detailOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;


        const order = await Order.findById(orderId).populate('products.product')
            .populate('userId')
            .populate('addressId');

        
        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }

        const date = new Date()
        const diff = ( date - order.updatedAt ) / 86_400_00
        // console.log(diff)
        res.render('orderDetail', { order,diff });
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
            .populate('userId').populate('products.product').populate('addressId').sort({'createdAt':-1})
            .skip(skip).limit(Number(limit)).lean();

        
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

//admin side order actions delivered cancel etc
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

//order status changing
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

// cancelling the product while payment if razorpay also
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
            console.error("refund amount illaa", refundAmount);
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
        console.error('error occured while cancel order Error:', error);
        res.status(500).json({ message: "An error occurred while cancelling the order" });
    }
}

//returning the order user
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

//admin approving for the return 
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

        const product = await Product.findById(productId);
        if(product){
            product.stock += productItem.quantity;
            await product.save()
        }

        res.json({ success: true, message: 'Return approved and money credited to wallet successfully' });
    } catch (error) {
        console.error("Error while approving return:", error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


//admim rejecting the return 
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

//invoice download
const invoice = async (req, res) => {
    try {
      const { orderId } = req.params;
  
      const order = await Order.findById(orderId)
        .populate('userId') 
        .populate('products.product') 
        .populate('addressId'); 

      const doc = new PDFDocument();
  
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
  
      doc.pipe(res);
  
      const logoPath = path.join(__dirname, '../public/images/logo/dark.png'); 
      doc.image(logoPath, 50, 50, { width: 100 });
  
      doc.fontSize(12).text('TROMIC', { align: 'right' });
      doc.text('India Delhi', { align: 'right' });
      doc.text('Email: tromic@gmail.com', { align: 'right' });
      doc.text('Phone: +91234567890', { align: 'right' });
  
      doc.moveDown(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
      doc.moveDown(1);
   doc.fontSize(14).text('Customer Information', { underline: true });
      doc.fontSize(12).text(`Name: ${order.userId.username}`);
      doc.text(`Email: ${order.userId.email}`);
   doc.text(`Phone: ${order.userId.number || 'N/A'}`);
  
      doc.moveDown(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
      doc.moveDown(1);
     doc.fontSize(14).text('Shipping Address', { underline: true });
      doc.fontSize(12).text(`Address: ${order.addressId.addressLine}`);
      doc.text(`City: ${order.addressId.city}`);
      doc.text(`State: ${order.addressId.state}`);
      doc.text(`Pincode: ${order.addressId.pincode}`);
      doc.text(`Country: ${order.addressId.country}`);
  
      doc.moveDown(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
      doc.moveDown(2);
  
      doc.fontSize(14).text('Ordered Products', { underline: true });
      doc.moveDown(2)
      let startY = doc.y;
      const productHeader = ['Product Name', 'Price', 'Quantity', 'Total'];
      const productWidth = [250, 100, 100, 100];
  
      doc.fontSize(12).text(productHeader[0], 50, startY);
      doc.text(productHeader[1], 300, startY, { width: productWidth[1], align: 'right' });
      doc.text(productHeader[2], 400, startY, { width: productWidth[2], align: 'right' });
      doc.text(productHeader[3], 500, startY, { width: productWidth[3], align: 'right' });
  
      startY = doc.y + 5;
      doc.moveTo(50, startY).lineTo(550, startY).stroke();
  
      order.products.forEach(product => {
        startY = doc.y + 10;
        doc.fontSize(12).text(product.product.name, 50, startY, { width: productWidth[0] });
        doc.text(`${product.price}`, 300, startY, { width: productWidth[1], align: 'right' });
        doc.text(product.quantity, 400, startY, { width: productWidth[2], align: 'right' });
        doc.text(`${product.price * product.quantity}`, 500, startY, { width: productWidth[3], align: 'right' });
  
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke();
      });
  
      const totalAmount = order.products.reduce((sum, product) => sum + product.price * product.quantity, 0);
      doc.moveDown(2);
      doc.fontSize(12).text(`Total: ${totalAmount}`, { align: 'right' });
  
      doc.moveDown(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
      doc.end();
  
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).send('Server error');
    }
  };

// payment continue after a failed payment
const continuePayment = async (req,res) => {
    try {
        const { orderId } =req.body

        const order = await Order.findById(orderId)
        if(order.paymentStatus !== 'Pending' || order.payment !== 'razorpay'||!order){
            console.log("order not found or invalid")
            return res.status(404).json({ success: false , message:'Invalid order or non Pending'})
        }
        const paymentOrder = await RazorpayInstance.orders.create({
            amount:order.totalPrice * 100,
            currency:'INR',
            receipt:`order_rcptid_${new Date().getTime()}`
        });
        order.razorpayOrderId = paymentOrder.id
        await order.save()

        res.json({success:true , razorpayOrderId:paymentOrder.id,totalPrice:order.totalPrice})
    } catch (error) {
        console.log('Error occured while continue the payment ',error);
        res.status(500).json({ success:false , message:'Error while processsing the payment '})
    }
}


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
    rejectReturn,
    invoice,
    continuePayment
}