const Product = require('../models/productModel');
const Category = require('../models/categoryModel')
const Offer = require('../models/offerModel')
const mongoose = require('mongoose');
const Wishlist = require('../models/wishlistModel')

const getProduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const searchQuery = req.query.search || '';
        const stockStatus = req.query.stock || '';

        const queryConditions = {}

        if (searchQuery) {
            queryConditions.$or = [
                { name: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        if (stockStatus) {
            if (stockStatus === 'out-of-stock') {
                queryConditions.stock = 0
            } else if (stockStatus === 'low-stock') queryConditions.stock = { $lt: 10, $gt: 0 }
            else if (stockStatus === 'in-stock') queryConditions.stock = { $gte: 50 }
        }

        const totalProducts = await Product.countDocuments(queryConditions)


        const offers = await Offer.find()

        const products = await Product.find(queryConditions).skip(skip).limit(limit).populate({ path: 'category', populate: { path: 'offer', model: 'Offer' } }).populate('offer');

        const totalPages = Math.ceil(totalProducts / limit)

        res.render('admin/product', {
            products,
            currentPage: page,
            totalPages, offers,
            stockStatus,
            searchQuery
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).render('admin/404');
    }
};


const loadAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.render('admin/addProduct', { categories });
    } catch (error) {
        console.error('Error loading add product page:', error);
        res.status(500).render('admin/404');
    }
}

const addProduct = async (req, res) => {
    try {

        const { name, description, price, stock, category } = req.body;


        if (!name || !description || !price || !stock || !category) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const existingProduct = await Product.findOne({ name: name.trim() });

        if (existingProduct) {
            return res.status(400).json({
                message: `A product with the name "${name}" already exists.`,
            });
        }

        const imagePaths = req.files.map((file) => file.path);


        const newProduct = new Product({
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            category,
            images: imagePaths, // Save image paths
            originalPrice: price
        });

        await newProduct.save();

        return res.status(201).json({ message: "Product added successfully." });
    } catch (error) {
        console.error("Error adding product:", error);
        return res.status(500).json({ message: "Server error. Please try again later." });
    }
};

const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const categories = await Category.find();

        res.render('admin/editProduct', { product, categories });
    } catch (error) {
        console.error("Error loading product for edit:", error);
        res.status(500).json({ error: "Failed to load product for editing" });
    }

}


const editProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, existingImages } = req.body;

        const updatedImages = existingImages ? [...existingImages] : [];


        if (req.files && req.files.length > 0) {
            req.files.forEach((file, index) => {
                updatedImages[index] = file.path;
            });
        }


        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                price,
                stock,
                originalPrice: price,
                category,
                images: updatedImages.filter((url) => url), 
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).send('Product not found');
        }

        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};



const aiProduct = async (req, res) => {
    try {

        const product = await Product.findById(req.params.id);
        if (!product) {
            console.log("product not found")
            return res.status(404).send('Product not found');

        }

        product.isActive = !product.isActive;
        await product.save();

        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const loadProduct = async (req, res) => {
    try {
        const { search = '', sort = '', categories = [], page = 1, limit = 12 } = req.query;

        const userId = req.session.user

        const skip = (page - 1) * limit;
        const searchFilter = search ? { name: { $regex: search, $options: 'i' } } : {};


        const categoriesArray = Array.isArray(categories)
            ? categories
            : categories
                ? [categories]
                : [];

        const validCategoryIds = categoriesArray.filter(c => mongoose.Types.ObjectId.isValid(c));

        let categoryFilter = {};
        if (validCategoryIds.length > 0) {
            categoryFilter = {
                "categoryDetails._id": {
                    $in: validCategoryIds.map(c => new mongoose.Types.ObjectId(c))
                }
            };
        }


        let sortOption = {};
        if (sort === 'price-asc') sortOption.price = 1;
        else if (sort === 'price-desc') sortOption.price = -1;
        else if (sort === 'new-arrivals') sortOption.createdAt = -1;
        else if (sort === 'a-z') sortOption.name = 1;
        else if (sort === 'z-a') sortOption.name = -1;
        else sortOption = { createdAt: -1 };

        const categoryList = await Category.find({ isActive: true });

        const wishlist = userId ? await Wishlist.findOne({ userId }) : null;
        const wishlistProductIds = wishlist ? wishlist.items.map(item => item.productId.toString()) : [];

        const products = await Product.aggregate([
            {
                $match: {
                    isActive: true,
                    ...searchFilter
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails",
                }
            },

            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isActive": true, ...categoryFilter } },
            { $sort: sortOption }, { $skip: skip }, { $limit: Number(limit) },
            {
                $lookup: {
                    from: 'offers',
                    localField: 'offer',
                    foreignField: '_id',
                    as: "offerDetails"
                }
            },
            { $unwind: { path: '$offerDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: 1,
                    price: 1,
                    description: 1,
                    images: 1,
                    stock: 1,
                    isActive: 1,
                    offer: 1,
                    category: "$categoryDetails",
                    inWishlist: {
                        $in: ["$_id", wishlistProductIds.map(id => new mongoose.Types.ObjectId(id))]
                    },
                    offerDetails: 1
                }
            }])

        const totalProducts = await Product.aggregate([
            { $match: { isActive: true, ...searchFilter, } },
            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            { $unwind: "$categoryDetails" },
            { $match: { "categoryDetails.isActive": true, ...categoryFilter } },
            { $count: "total" },
        ]);


        const totalCount = totalProducts[0]?.total || 0;

        res.render('shop', {
            products, currentPage: Number(page), totalPages: Math.ceil(totalCount / limit),
            totalProducts: totalCount, search, sort, category: categoryList, selectedCategories: categoriesArray,
        });

    } catch (err) {
        console.error(err);
        res.status(500).render('error');
    }
};



const getProductDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).send("Product not found");
        }

        let isInWishlist = false;
        if (userId) {
            const wishlist = await Wishlist.findOne({ userId });
            if (wishlist && wishlist.items.some(item => item.productId.toString() === productId)) {
                isInWishlist = true;
            }
        }

        const relatedProducts = await Product.find({ _id: { $ne: productId } }).limit(4).lean();

        res.render("single-product", { product, relatedProducts, isInWishlist });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).render('error')
    }
};





module.exports = {
    addProduct,
    loadEditProduct,
    editProduct,
    aiProduct,
    getProduct,
    loadAddProduct,
    loadProduct,
    getProductDetails,
}