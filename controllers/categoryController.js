const Category = require('../models/categoryModel');
const Offer = require('../models/offerModel')

//loading the categories page
const loadCategory = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;

        const query = search 
              ? { name: { $regex: search, $options: "i" } } : {};

        const categories = await Category.find(query)
            .populate('offer', 'name discount') 
            .skip((page - 1) * limit).limit(parseInt(limit));
       
        const totalCount = await Category.countDocuments(query);

        const offers = await Offer.find() 

        const totalPages = Math.ceil(totalCount / limit);

        if (!categories || categories.length === 0) {
            return res.render('admin/category', { category: [], message: "No Categories" });
        }

        res.render("admin/category", { 
            categories,
            currentPage: parseInt(page),
            totalPages,
            limit: parseInt(limit),
            totalCount,
            offers
        });
    } catch (error) {
        console.log("Error loading category: ", error.message);
        res.render('admin/404');
    }
};


// loading the add category page
const addCategoryLoad = (req,res) =>{
    try {
        res.render("admin/addCategory")
    } catch (error) {
        console.error(error.message);
        res.render("admin/404");
    }
}

//adding a new category
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim() || !description) {
            return res.status(400).render("admin/addcategory", {message: 'Both name and description are required.'});
        }

        const existingCategory = await Category.findOne({ name: name.trim() });
        if (existingCategory) {
            return res.status(400).render("admin/addcategory", {message: 'Category name already exists.'});
        }

        const newCategory = new Category({
            name: name.trim(), description: description.trim(),
        });

        await newCategory.save();

        res.redirect("/admin/category");
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).render("admin/addcategory", { 
            message: 'There was an error adding the category. Please try again.' 
        });
    }
};


// soft delete the category
const activeInactive = async (req, res) => {
    const categoryId = req.params.id;
    
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            console.log("category not found")
            return res.status(404).send("Category not found");
        }

        category.isActive = !category.isActive;
        await category.save();


        res.json({ status: category.isActive ? 'Active' : 'Inactive' });
    } catch (error) {
        console.error('Error updating category status:', error);
        res.status(500).send("Error updating category status");
    }
}


//loading the edit category page
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
//editing the category
const editCategory = async (req, res) => {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    try {
        const category = await Category.findById(categoryId)
        const existCategory = await Category.findOne({name:name , _id:{$ne:categoryId}});
        if(existCategory) return res.render('admin/editCategory',{category,message:"Category with this name already exist"})
        
        const categorys = await Category.findByIdAndUpdate(
            categoryId,
            { name, description },
            { new: true }
        );

        if (!categorys) return res.status(404).send("Category not found");
        res.redirect('/admin/category'); 
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