const adminController = require("../controllers/adminController");
const Admin = require("../models/adminModel")
const express = require('express');
const router = express.Router()
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const  upload  = require('../middleware/upload')



router.get("/", adminController.loadAdminLogin)
router.post("/", adminController.adminLogin)
router.get("/dashboard", adminController.loadAdminDashboard)

// users 
router.get("/users", adminController.loadUsers)
router.post('/users/block-unblock/:userId', adminController.blockunblock)

//category

router.get("/category", categoryController.loadCategory)
router.get("/category/add", categoryController.addCategoryLoad);
router.post("/category/add", categoryController.addCategory)

router.post('/category/:id/toggle-status', categoryController.activeInactive)

router.get("/category/edit/:id", categoryController.editCategoryLoad)
router.post('/category/edit/:id', categoryController.editCategory);

//product 
router.get("/products", productController.getProduct)
router.get("/products/add", productController.loadAddProduct)
router.post("/products/add", upload.array('images',4), productController.addProduct);

router.get('/products/edit/:id', productController.loadEditProduct)
router.post('/products/edit/:id', upload.array("images", 4),productController.editProduct);

router.post('/products/delete/:id',productController.deleteProduct)


module.exports = router