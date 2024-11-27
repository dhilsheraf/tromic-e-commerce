const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt')
const User = require('../models/userModel')


const adminLogin = async (req,res) => {
    try {
        const {email,password} = req.body ;
        const admin = await Admin.findOne({ email:email })

        if(admin){
            req.session.adminId = admin._id;
            const passwordMatch = await bcrypt.compare(password,admin.password) ;
            if(passwordMatch){
                res.redirect('/admin/dashboard');
            }else{
                res.render('admin/adminlogin',{message: "Incorrect password"})
            }
        }
        else {
            res.render('admin/adminlogin',{message:"You are not admin"})
        }
    } catch (error) {
        console.log(error);
        res.status(500).render('admin/adminlogin',{message:"try again later serever down"})
    }
}

const loadAdminLogin = (req,res) =>{
    try {
        res.render('admin/adminlogin',{message:""})
    } catch (error) {
        console.log("error while admin login",error)
        res.status(500).render('admin/404')
    }
}

const loadAdminDashboard = async (req,res) =>{
    try {
        res.render('admin/adminDashboard')
    } catch (error) {
        console.log("error while loading admin dashboard");
        res.status(500).render('admin/404')
    }
}

const loadUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; 
        const totalUsers = await User.countDocuments();

        const users = await User.find({})
            .skip((page - 1) * limit) 
            .limit(parseInt(limit)); 

        // Render the EJS view and pass the user data
        res.render('admin/adminUser', {
            users,
            totalUsers,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / limit),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
};


const blockunblock = async (req, res) => {
    const userId = req.params.userId;
    const { action } = req.body;  // 'block' or 'unblock'

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (action === 'block') {
            user.isBlocked = true;  // Set the user as blocked
        } else if (action === 'unblock') {
            user.isBlocked = false;  // Set the user as unblocked
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await user.save();  // Save the updated user status

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while updating block status' });
    }
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Session destruction error", err.message);
                res.status(500).render('admin/404')
            } else {
                return res.redirect("/admin");
            }
        });
    } catch (error) {
        console.log("Logout error", error);
        res.redirect("");
    }
};


module.exports = {
    loadAdminLogin,
    adminLogin,
    loadAdminDashboard,
    loadUsers,
    blockunblock,
    logout
}