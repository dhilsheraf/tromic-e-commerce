const Category = require('../models/categoryModel');


const loadCategory = async (rreq,res)=> {

    try {
        const categories = await Category.find();
       
        if(!categories || categories.length === 0){
            return res.render('admin/category',{category:[],message:"No Categories"})
        }
        res.render("admin/category",{categories});
    } catch (error) {
        console.log(error.message);
        res.render('admin/404')
    }
}


const addCategoryLoad = (req,res) =>{
    try {
        res.render("admin/addCategory")
    } catch (error) {
        console.error(error.message);
        res.render("admin/404");
    }
}

const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validate the data
        if (!name || !description) {
            return res.render("admin/addcategory",{ message: 'Both name and description are required.' });
        }

        // Check if a category with the same name already exists
        const existingCategory = await Category.findOne({ name: name });
        if (existingCategory) {
            return res.render("admin/addcategory",{ message: 'Category name already exists.' });
        }

        // Create a new category if name is unique
        const newCategory = new Category({
            name,
            description
        });

        // Save the category to the database
        await newCategory.save();

        res.redirect("/admin/category");
    } catch (error) {
        res.status(500).json({ message: 'There was an error adding the category.' });
    }
};

const activeInactive = async (req, res) => {
    const categoryId = req.params.id;
    
    // Find the category by ID and toggle its status
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            console.log("category not found")
            return res.status(404).send("Category not found");
        }

        // Toggle the status (Active <-> Inactive)
        category.isActive = !category.isActive;
        await category.save();


        res.json({ status: category.isActive ? 'Active' : 'Inactive' });
    } catch (error) {
        console.error('Error updating category status:', error);
        res.status(500).send("Error updating category status");
    }
}

const editCategoryLoad = async (req,res) =>{
    const categoryId = req.params.id;
    try {
        const category = await Category.findById(categoryId)
        res.render('admin/editCategory',{category})
    } catch (error) {
        console.log(error.message);
        res.render('admin/404')
    }
}

const editCategory = async (req, res) => {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    try {
        const category = await Category.findById(categoryId)
        const existCategory = await Category.findOne({name:name});
        if(existCategory) return res.render('admin/editCategory',{category,message:"Category with this name already exist"})
        
        const categorys = await Category.findByIdAndUpdate(
            categoryId,
            { name, description },
            { new: true }  // This option returns the updated document
        );

        if (!categorys) return res.status(404).send("Category not found");
        res.redirect('/admin/category'); // Redirect to the category list page after updating
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).send("Server Error");
    }
}

module.exports = {
    addCategoryLoad, 
    loadCategory,
    addCategory,
    activeInactive,
    editCategoryLoad,
    editCategory
}