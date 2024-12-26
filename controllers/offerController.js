const Offer = require('../models/offerModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const cron = require('node-cron');

const getOffer = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalOffers = await Offer.countDocuments();
        const offers = await Offer.find().skip(skip).limit(limit);

        const totalPages = Math.ceil(totalOffers / limit);

        res.render('admin/offer', {
            offers,
            currentPage: page,
            totalPages,
            limit,
        });
    } catch (error) {
        console.error("Error occurred while rendering the offer page", error);
        res.status(500).render('admin/404');
    }
};


const addOffer = async (req, res) => {
    try {
        const { name, discountPercentage, activationDate, expiryDate } = req.body;


        if (!name || !discountPercentage || !activationDate || !expiryDate) {
            return res.status(400).json({ success: false,message: 'All fields are required.' });
        }


        if (discountPercentage < 1 || discountPercentage > 100) {
            return res.status(400).json({ success: false,message: 'Discount percentage must be between 1 and 100.' });
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


//add and remove category offer
const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, offerId, discount } = req.body;
        const offer = await Offer.findById(offerId);

        // Check if the offer has expired or hasn't been activated yet
        const currentDate = new Date();
        if (offer.expiresAt < currentDate) {
            return res.status(400).json({ success: false, message: 'This offer has expired' });
        }

        if (offer.activeAt > currentDate) {
            return res.status(400).json({ success: false, message: 'This offer has not been activated yet' });
        }

        const products = await Product.find({ category: categoryId });

        for (const product of products) {
            const newPrice = product.originalPrice * (1 - discount / 100);
            if (product.originalPrice === undefined) {
                product.originalPrice = product.price; 
            }
            product.price = Math.floor(newPrice);
            product.offer = offerId;
            await product.save();
        }

        await Category.findByIdAndUpdate(categoryId, { offer: offerId });

        res.json({ success: true, message: 'Offer applied successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while applying the offer' });
    }
};

const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;

        const products = await Product.find({ category: categoryId });
        for (const product of products) {
            product.offer = null;
            
                product.price = product.originalPrice;

            await product.save();
        }

        await Category.findByIdAndUpdate(categoryId, { offer: null });

        return res.status(200).json({ success: true, message: "Offer removed successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Failed to remove offer", error });
    }
};
const addProductOffer = async (req, res) => {
    try {
        const { offerId, productId } = req.body;
        const offer = await Offer.findById(offerId);

        if (!offer) return res.status(400).json({ success: false, message: 'Offer not found' });

        const currentDate = new Date();

        if (offer.expiresAt < currentDate) {
            return res.status(400).json({ success: false, message: 'This offer has expired' });
        }

        if (offer.activeAt > currentDate) {
            return res.status(400).json({ success: false, message: 'This offer has not been activated yet' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(400).json({ success: false, message: 'Product not found' });

        const discountFactor = 1 - offer.discount / 100;
        const newPrice = product.originalPrice * discountFactor;

        product.offer = offerId;
        product.price = Math.floor(newPrice);
        await product.save();

        res.status(200).json({ success: true, message: 'Offer applied successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error occurred while adding product offer' });
    }
};

const removeProductOffer = async (req,res) => {
   try {

    const {productId} = req.params ;
    const product = await Product.findById(productId);

    if(!product) return res.status(404).send('not found product')

    product.offer = null ;
    product.price = product.originalPrice;

    await product.save()

    return res.redirect('/admin/products')

   } catch (error) {
    console.error(error);
    return res.status(500).send('erro while remove the offer')
   }
}

const removeExpiredOffers = async () => {
    try {
        const currentDate = new Date();
        

        const expiredOffers = await Offer.find({ expiresAt: { $lt: currentDate } });

        for (const offer of expiredOffers) {

            await Product.updateMany(
                { offer: offer._id },
                { $set: { offer: null, price: '$originalPrice' } }
            );
        }
        console.log('Expired offers have been removed from products');
    } catch (error) {
        console.error('Error occurred while removing expired offers:', error);
    }
};


cron.schedule('0 0 * * *', removeExpiredOffers);


module.exports = {
    getOffer,
    addOffer,
    deleteOffer,
    addCategoryOffer,
    removeCategoryOffer,
    addProductOffer,
    removeProductOffer
}