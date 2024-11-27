const adminController = require("../controllers/adminController");
const Admin = require("../models/adminModel")
const express = require('express');
const router = express.Router()
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const upload = require('../middleware/upload')
const admin = require('../middleware/authMiddleware')
const orderController = require('../controllers/orderController')


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
router.get('/orders',orderController.showOrder)
router.get('/orders/:orderId',orderController.orderAction)
router.put('/order/:orderId/product/:productId/status',orderController.orderStatus)



module.exports = router