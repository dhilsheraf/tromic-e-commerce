const express = require('express');
// const User = require('../models/userModel') ;
const userController = require('../controllers/userController')
const passport = require("passport")
const router = express();
const session = require('../middleware/authMiddleware');
const productController = require('../controllers/productController')
const addressController = require('../controllers/addressController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController');

router.set("view engine", "ejs");
router.set("views", "./views/user");

//otp routes




//home about etc
router.get("/", userController.loadHome);

router.get("/about", userController.loadAbout)

router.get("/blog", userController.loadBlog);

router.get("/contact", userController.loadContact);

router.get("/my-account", session.checkUserSession, userController.loadMyAccount)
//wishlist
router.get("/wishlist", session.checkUserSession, userController.loadWishlist)
router.get("/wishlist", session.checkUserSession, userController.loadWishlist)
router.post("/toggle-wishlist",userController.toggleWishlist)
router.get("/wishlist-remove/:productId",session.checkUserSession,userController.removeWishlist)

// sign up
router.get("/signup",session.existUser, userController.loadSignup)
router.post("/signup",session.existUser, userController.signUp)

//login
router.get("/login",session.existUser, userController.loadLogin);
router.post("/login",session.existUser, userController.login)

//google authentication
router.get("/auth/google" ,passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
    req.session.user = req.user._id
    res.redirect('/');
})
//otp
router.post("/verify-otp", userController.verifyOTP)
router.post("/resend-otp", userController.resendOTP)

//page not found
router.get("/pageNotFound", userController.pageNotFound)

//logout
router.get("/logout", userController.logout)

router.get("/products", productController.loadProduct)
router.get('/product/:id', productController.getProductDetails);


//profile 
router.post("/profile-update",session.checkUserSession, userController.profileUpdate)

//address
router.post('/add-address',session.checkUserSession, addressController.addAddress)
router.post("/edit-address",session.checkUserSession, addressController.editAddress);
router.delete('/delete-address/:id',session.checkUserSession, addressController.deleteAddress);


//password
router.get('/forgot-password',session.checkUserSession, userController.forgotPasswordLoad)
router.post('/forgot-password', userController.forgotPassword)
router.get("/reset-password/:token",userController.resetPasswordLoad)
router.post("/reset-password/:token", userController.resetPassword)
router.post('/change-password', userController.changePassword)
 
//cart
router.get('/cart',session.checkUserSession,session.checkUserSession,cartController.listCart)
router.post('/add-cart',cartController.addToCart)
router.post('/update-cart',session.checkUserSession,cartController.updateCartQuantity)
router.delete('/delete-cart',session.checkUserSession,cartController.deleteCart) 

//checkout
router.get('/checkout',session.checkUserSession,orderController.getCheckout)
router.post('/checkout',session.checkUserSession,orderController.checkout)
router.get('/order-confirm/:orderId',session.checkUserSession,orderController.orderConfirm)
router.post('/verify-payment',session.checkUserSession, orderController.verifyPayment);
router.post('/continue-payment',orderController.continuePayment)

//order detail
router.get('/order/:orderId',session.checkUserSession,orderController.detailOrder)
router.post('/cancel-order',session.checkUserSession,orderController.cancelOrder)
router.patch('/return-order',session.checkUserSession,orderController.returnOrder)
router.get('/download-invoice/:orderId',session.checkUserSession,orderController.invoice)


module.exports = router;
