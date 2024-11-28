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
            productId: item.productId,
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

const checkout = async (req, res) => {
    try {

        const { addressId, paymentMethod, cartItems } = req.body;


        if (!addressId || !paymentMethod || !cartItems || !cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid order data' })
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        let totalPrice = 0;

        const orderProducts = [];

        console.log(cartItems)

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

            totalPrice += product.price * item.quantity;

            orderProducts.push({
                product: product._id,
                price: product.price,
                quantity: item.quantity

            })

            product.stock -= item.quantity;

            await product.save();
        }

        const newOrder = new Order({
            userId: req.session.user,
            addressId: addressId,
            payment: paymentMethod,
            products: orderProducts,
            totalPrice,
            status: 'Pending'
        })

        await newOrder.save();

        await Cart.findOneAndUpdate({ userId: req.session.user }, { $set: { items: [] } })

        res.status(201).json({ success: true, message: `Order placed successfully`, orderId: newOrder._id })


    } catch (error) {
        console.error("Error during checkout", error);
        res.status(500).json({ success: false, message: 'An error occurred while placing the order' });
    }
}

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

        const { page = 1, limit = 10, search = '', status } = req.query;

        const query = {};

        if (status && status != 'all') query.status = status;
        if (search) query['$or'] = [
            { 'userId.username': { $regex: search, $options: ' i' } },
            { 'userId.number': { $regex: search, $options: 'i' } },
            { 'products.product.name': { $regex: search, $options: 'i' } }
        ];


        const skip = (page - 1) * limit;

        const orders = await Order.find(query).populate('userId').populate('products.product').populate('addressId').lean();

        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin/orders', { orders, totalPages, currenPage: Number(page), search, status });

    } catch (error) {
        console.log("Error occured while ", error)
        res.render('admin/404')
    }
}


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

        if (order.products[productIndex].status !== 'Pending') return res.status(400).json({ message: "Product cannot be cancelled" })

        const product = await Product.findById({ _id: productId });
        if (!product) return res.status(404).json({ message: "Product not found " });

        product.stock += order.products[productIndex].quantity;

        await product.save();

        order.products[productIndex].status = 'cancelled';
        await order.save();

        res.status(200).json({ message: "Order item cancelled successfully" });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: "An error occurred while cancelling the order" });
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
    cancelOrder
}