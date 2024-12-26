const Coupon = require('../models/couponModel');

const getCoupon = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 10; 
        const skip = (page - 1) * limit;

        const coupons = await Coupon.find().skip(skip).limit(limit);

        const totalCoupons = await Coupon.countDocuments();

        const totalPages = Math.ceil(totalCoupons / limit);

        res.render('admin/coupon', { coupons, totalPages, currentPage: page });
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
        if(duplicateCoupon)
            return res.status(409).json({success:false,message:'Coupon code already exist'}) 

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

const editCouponGet = async (req,res) => {
    try {
        const { couponId } = req.params
        const coupon = await Coupon.findById(couponId);
        if(!coupon){
            return res.json({success:true , message:'Coupon not found'})
        }
        return res.json({success:true,coupon})
    } catch (error) {
        console.error("Error occured while fetch coupon",error)
        res.status(500).json({ success:false , message:'Error occured while fetch copon'})
    }
}

const editCoupon = async (req, res) => {
    const { couponCode } = req.params;
    const { minAmount, discountValue, activationDate, expirationDate } = req.body;

    try {
        const coupon = await Coupon.findOneAndUpdate(
            {code: couponCode },
            {  minAmount,
                discount: discountValue,
                activeAt: new Date(activationDate),
                expiresAt: new Date(expirationDate),},
            {new: true}
        );
        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found.' })
        }

        return res.json({success: true, message: 'Coupon updated successfully.',coupon,})
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update the coupon.' });
    }
}

module.exports = {
    getCoupon,
    addCoupon,
    deleteCoupon,
    editCouponGet,
    editCoupon
}