const Product = require('../models/productModel');
const Category = require('../models/categoryModel')

const getProduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if no page is specified
        const limit = 10; // Number of products per page
        const skip = (page - 1) * limit;

        // Fetch the total number of products
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / limit);

        // Fetch only the products for the current page
        const products = await Product.find({})
            .skip(skip)
            .limit(limit)
            .populate('category');

        // Render the products page with pagination data
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

 
const loadAddProduct = async (req,res) =>{
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

        // Retrieve image URLs from Cloudinary (from req.files)
        const images = req.files.map(file => file.path);  // Assuming multer uploads the images to Cloudinary

        // Create new product
        const newProduct = new Product({
            name,
            description,
            price,
            stock,
            category,
            images,  // Store Cloudinary image URLs
        });

        // Save the product to the database
        await newProduct.save();

        // Respond with success or redirect
        res.redirect('/admin/products');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error while adding product');
    }
};

const loadEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) return res.status(404).json({ message: 'Product not found' });

        const categories = await Category.find(); // Fetch all categories

        // Render the editProduct view, passing both product and categories
        res.render('admin/editProduct', { product, categories });
    } catch (error) {
        console.error("Error loading product for edit:", error);
        res.status(500).json({ error: "Failed to load product for editing" });
    }

}


const editProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, existingImages } = req.body;

        // Initialize an array to store the updated image URLs
        const updatedImages = existingImages ? [...existingImages] : [];

        // Check if there are new images uploaded and update them based on index
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


const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByIdAndUpdate(productId, { isDeleted: true }, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product soft deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




module.exports = {
    addProduct,
    loadEditProduct,
    editProduct,
    deleteProduct,
    getProduct,
    loadAddProduct
}