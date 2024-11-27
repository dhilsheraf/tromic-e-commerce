const Product = require('../models/productModel');
const Category = require('../models/categoryModel')

const getProduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; 
        const limit = 10; 
        const skip = (page - 1) * limit;


        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);


        const products = await Product.find({}).skip(skip).limit(limit).populate('category');


            res.render('admin/product', {
            products,
            currentPage: page,
            totalPages,
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

        const categories = await Category.find(); // Fetch all categories

        // Render the editProduct view
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
                category,
                images: updatedImages.filter((url) => url), // Remove any undefined URLs
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

        const {search = '' , sort = '' , page = 1 , limit = 12 } = req.query;
        
        
        const skip = (page - 1 ) * limit ;

        const searchFilter = search 
          ? { name : {$regex: search , $options: 'i'}} : {} ;


          let sortOption = {} ;
          if(sort === 'price-asc' ) sortOption.price = 1 ;
          else if(sort === 'price-desc' ) sortOption.price = -1 ;
          else if(sort === 'new-arrivals' ) sortOption.createdAt = 1 ;
          else if(sort === 'a-z' ) sortOption.name = 1 ;
          else if(sort === 'z-a' ) sortOption.name = -1 ;


          
        const category = await Category.find({isActive:true});
        

        const products = await Product.find({ isActive: true , ...searchFilter}) 
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit));
        
        const totalProducts = await Product.countDocuments({ isActive:true,...searchFilter})
      
        res.render('shop', { 
            products,
            currentPage: Number(page),
            totalPages: Math.ceil(totalProducts/ limit),
            totalProducts,
            search,
            sort,
            category
         });  
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).send("Product not found");
        }

        

        const relatedProducts = await Product.find({
            _id: { $ne: productId }  // Exclude the main product
        }).limit(4).lean();

        res.render("single-product", { product, relatedProducts });
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