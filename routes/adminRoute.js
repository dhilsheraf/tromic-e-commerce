const adminController = require("../controllers/adminController");
const Admin = require("../models/adminModel")
const express = require('express');
const router = express.Router()
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const upload = require('../middleware/upload')
const admin = require('../middleware/authMiddleware')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const offerController = require('../controllers/offerController')

router.get("/",admin.existAdmin, adminController.loadAdminLogin)
router.post("/", adminController.adminLogin)
router.get("/dashboard", admin.checkAdminSession, adminController.loadAdminDashboard)

// users 
router.get("/users", admin.checkAdminSession, adminController.loadUsers)
router.post('/users/block-unblock/:userId', adminController.blockunblock)

//category

router.get("/category", admin.checkAdminSession, categoryController.loadCategory)
router.get("/category/add", admin.checkAdminSession, categoryController.addCategoryLoad);
router.post("/category/add", categoryController.addCategory)

router.post('/category/:id/toggle-status', categoryController.activeInactive)

router.get("/category/edit/:id", admin.checkAdminSession, categoryController.editCategoryLoad)
router.post('/category/edit/:id', categoryController.editCategory);

//product 
router.get("/products", admin.checkAdminSession, productController.getProduct)
router.get("/products/add", admin.checkAdminSession, productController.loadAddProduct)
router.post("/products/add", upload.array('images', 4), productController.addProduct);

router.get('/products/edit/:id', admin.checkAdminSession, productController.loadEditProduct)
router.post('/products/edit/:id', upload.array("images", 4), productController.editProduct);

router.post('/products/toggle/:id', productController.aiProduct)

//orders
router.get('/orders',admin.checkAdminSession,orderController.showOrder)
router.get('/orders/:orderId',admin.checkAdminSession,orderController.orderAction)
router.put('/order/:orderId/product/:productId/status',orderController.orderStatus)

//offer
router.get('/offer',offerController.getOffer);
router.post('/add-offer',offerController.addOffer)
router.delete('/delete-offer/:offerId',offerController.deleteOffer)
//category offer
router.post('/category/apply-offer',offerController.addCategoryOffer)
router.post('/category/remove-offer',offerController.removeCategoryOffer)

//product offer
router.post('/product/apply-offer',offerController.addProductOffer)
router.post('/product/remove-offer/:productId',offerController.removeProductOffer)

//coupon
router.get('/coupon',couponController.getCoupon);
router.post('/add-coupon',couponController.addCoupon)
router.delete('/delete-coupon/:id',couponController.deleteCoupon)


module.exports = router