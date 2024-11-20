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


const aiProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        product.isActive = !product.isActive; // Toggle the active state
        await product.save();

        res.redirect('/admin/products'); // Redirect back to the product page
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

const loadProduct = async (req,res) => {
    try {
        const products = await Product.find({isActive: true}); // Fetch all products from the database
        res.render('shop', { products });  // Send the products to the EJS template
      } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
      }
}
 
const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send("Product not found");
        }
        
        // Fetch related products by category or other criteria 
        const relatedProducts = await Product.find({  
            _id: { $ne: productId }  // Exclude the main product
        }).limit(4).lean();

        res.render("single-product", { product , relatedProducts });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send("Server Error");
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