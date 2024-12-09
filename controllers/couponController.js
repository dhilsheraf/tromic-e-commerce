const Coupon = require('../models/couponModel');

const getCoupon = async (req, res) => {
    try {
        const coupons = await Coupon.find(); 
        res.render('admin/coupon', { coupons }); 
    } catch (error) {
        console.error("Error occurred while rendering the coupon page", error);
        res.status(500).render('admin/404');
    }
};


const addCoupon = async (req, res) => {
    const { code, discountValue, minAmount, expirationDate, activationDate } = req.body;

    if (!code || !discountValue || !minAmount || !expirationDate) {
        return res.status(400).json({success:false, message: 'All fields are required.' });
    }

    try {


        const codeCap = code.trim().toUpperCase()
        const duplicateCoupon = await Coupon.findOne({code:codeCap})
        if(duplicateCoupon){ 
            return res.status(409).json({success:false,message:'Coupon code already exist'}) }

        const newCoupon = new Coupon({
            code,
            minAmount,
            discount: discountValue,
            expiresAt: new Date(expirationDate),
            activeAt: new Date(activationDate),
        });

        await newCoupon.save();

        res.status(201).json({success:true,
            message: 'Coupon added successfully',
            coupon: newCoupon,
        });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
};

const deleteCoupon = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedCoupon = await Coupon.findByIdAndDelete(id);

        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ success: false, message: 'Server error, please try again later.' });
    }
};


module.exports = {
    getCoupon,
    addCoupon,
    deleteCoupon
}