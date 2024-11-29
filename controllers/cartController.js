const Cart = require('../models/cartModel');
const Product = require('../models/productModel')
const mongoose = require('mongoose')


const addToCart = async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ message: "Please login" });

        const { productId, quantity } = req.body;
        const userId = req.session.user;

        
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "Invalid Product ID" });
        }

        const product = await Product.findById(productId).populate('category');
        if (!product) return res.status(404).json({ message: "Product not found" });
          
        if (!product || !product.isActive || product.category.isActive === false) {
            return res.status(400).json({ success: false, message: 'Product is inactive or unavailable.\nIf it is on cart please remove it.' });
        }
        
        if (quantity > product.stock) {
            return res.status(400).json({ message: `Only ${product.stock} items left in stock.`});
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        
        

        if (productIndex > -1) {
            const existingItem = cart.items[productIndex];
            const newQuantity = existingItem.quantity + quantity;


            if (newQuantity > product.stock) {
                return res.status(400).json({ message: `Quantity exceeds stock. Available stock: ${product.stock}` });
            }

            

            cart.items[productIndex].quantity = newQuantity;
            cart.items[productIndex].total = newQuantity * product.price;
        } else {
            cart.items.push({
                productId,
                quantity,
                total: product.price * quantity,
            });
        }

        const productIncart = cart.items.find(item => item.productId.toString() === productId);
        if(productIncart && productIncart.quantity >= 10 ){
            return res.status(429).json({ message:"Product Quantity limit exceeded"});
        }


        await cart.save();
        res.status(200).json({ message: "Product added to cart", cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred", error });
    }
};



const listCart = async (req, res) => {
    try {

        const cart = await Cart.findOne({ userId: req.session.user }).populate('items.productId');

        if (!cart) {
            return res.render('cart', { cart: { items: [] } })
        }

        cart.totalPrice = cart.items.reduce((total, item) => {
            return total += item.quantity * item.productId.price;
        }, 0)

        res.render('cart', {cart: cart})

    } catch (error) {
        console.error(error);
        res.render('error')
    }
}


const updateCartQuantity = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const product = await Product.findById(productId).populate('category');

        if ( !product.isActive || product.category.isActive === false) {
            return res.status(400).json({ success: false, message: 'Product is inactive or unavailable.\nIf it is on cart please remove it.' });
        }

        const cart = await Cart.findOne({ userId: req.session.user });

        if (!cart) return res.status(404).json({ success: false, message: "Cart not found " });

        const item = cart.items.find(item => item.productId.toString() === productId);

        if (!item) return res.status(404).json({ success: false, message: "Product not in cart " });
        if(quantity === 1){
        if(item.quantity === 10) return res.status(429).json({ success:false , message:"Product quantity limit exceed"})
        }
        item.quantity += quantity;

        if (item.quantity < 1) {
            cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        }
        if(item.quantity > product.stock) return res.status(409).json({success:false, message:`Stock exceed available stock${product.stock}`})

        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * product.price, 0);

        await cart.save();

        res.json({ success: true, message: "Cart updated Successfully" })

    } catch (error) {
        console.error(error);
        res.status(error.code).json({ success: false, message: "Internal server error" })
    }
}


const deleteCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.user;

        const cart = await Cart.findOne({ userId });
        const product = await Product.findById(productId)
        if (!cart) return res.status(404).json({ success: false, message: "Cart not found " });

        cart.items = cart.items.filter((item) => item.productId.toString() !== productId)

        cart.totalPrice = cart.items.reduce((sum, item) => {
            return sum += item.quantity * product.price;
        }, 0)

        cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        await cart.save();

        res.json({ success: true, message: "Item removed from cart " });

    } catch (error) {
        console.error("Error deleting cart item : ", error);
        res.status(500).json({ success: false, message: "Internal server error " })
    }
}

module.exports = {

    addToCart,
    listCart,
    deleteCart,
    updateCartQuantity

}