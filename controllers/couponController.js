const Coupon = require('../models/couponModel');

const getCoupon = async (req,res) => {
    try {
        res.render('admin/coupon')
    } catch (error) {
        console.error("Error occured while rendering the coupon page",error)
        res.status(500).render('admin/404')
    }
}

module.exports = {
    getCoupon
}