const Offer = require('../models/offerModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')


const getOffer = async (req, res) => {
    try {
        const offer = await Offer.find();
        res.render('admin/offer',{offer})
    } catch (error) {
        console.error("Error occured whilerendering the offer page", error)
        res.status(500).render('admin/404')
    }
}

const addOffer = async (req, res) => {
    try {
        const { name, discountPercentage, activationDate, expiryDate } = req.body;


        if (!name || !discountPercentage || !activationDate || !expiryDate) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }


        if (discountPercentage < 1 || discountPercentage > 100) {
            return res.status(400).json({ success: false, message: 'Discount percentage must be between 1 and 100.' });
        }

        const activation = new Date(activationDate);
        const expiry = new Date(expiryDate);

        
        if (isNaN(activation.getTime()) || isNaN(expiry.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format.' });
        }

        if (activation >= expiry) {
            return res.status(400).json({ success: false, message: 'Expiry date must be after the activation date.' });
        }

        
        const newOffer = new Offer({
            name,
            discount: discountPercentage,
            activeAt: activation,
            expiresAt: expiry,
        });

        await newOffer.save();
        res.status(201).json({ success: true, message: 'Offer created successfully.' });
    } catch (error) {
        console.error('Error while creating the offer:', error);
        res.status(500).json({ success: false, message: 'Failed to create the offer.' });
    }
};

const deleteOffer = async (req,res) => {
    try {
        const { offerId } = req.params;
        
        const offer = await Offer.findByIdAndDelete(offerId);
        if(offer){
            return res.json({success:true , message:'Offer deleted successfull'})
        } else {
            return res.json({success:false , message :'Failed to the Offer not found'})
        }
    } catch (error) {
        console.error('Error occcured while deleting the offer',error);
        res.status(500).json({success:false , message:"error occured while deleting the offer" })
    }
}

const addCategoryOffer = async (req,res) => {
    try {
        const {categoryId, offerId, discount } = req.body;

        const offer = await Offer.findById(offerId)
        if(!offer) return res.status(400).json({success:false , message :"Offer not found"})
    } catch (error) {
        
    }
}

const removeCategoryOffer = async (req,res) => {
    try {
       

    } catch (error) {
        
    }
}


module.exports = {
    getOffer,
    addOffer,
    deleteOffer,
    addCategoryOffer,
    removeCategoryOffer,
}