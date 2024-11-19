const User = require("../models/userModel");
const nodemailer = require('nodemailer')
const bcrypt = require("bcrypt");
const env = require('dotenv');
const { json } = require("express");
const Product = require("../models/productModel")
 
//route to home 


const loadHome = async (req,res) =>{
    try {
        const products = await Product.find({}).limit(10).lean();

        
            res.render('home',{products})
    } catch (error) {
        console.error("Home page not loading",error);
        res.status(500).redirect("/pageNotFound")
    }
} 

const loadAbout = async (req,res) =>{
    try {
        res.render("about")
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/pageNotFound")
    }
}

const loadContact = async (req,res) =>{
    try {
        res.render('contact');
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/pageNotFound")
    }
}
const loadBlog = async (req,res)=>{
    try {
        res.render('blog');
    } catch (error) {
        console.error(error)
        res.status(500).redirect("/pageNotFound")
    }
}


const loadSignup = async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect('/');  // Redirect to home if already logged in
        }
        return res.render("signup", { message: "" });
    } catch (error) {
        console.log("Error loading signup page", error);
        res.redirect("/pageNotFound");
    }
}


const loadMyAccount = async (req,res) =>{
    try {
        res.render("my-account")
    } catch (error) {
        console.log(error)
        res.status(500).redirect("/pageNotFound")
    }
}

const loadWishlist = async (req,res) =>{
    try {
        res.render("wishlist")
    } catch (error) {
        console.log(error)
        res.status(500).render('error');
    }
}

// function for creating otp
function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString()
}

//email send function
async function sendVerificationEmail(email,otp){
    try {
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: process.env.NODEMAILER_EMAIL ,
                pass: process.env.NODEMAILER_PASSWORD 
            }
        })

        const info = await transporter.sendMail({
            from: "dhilsherafwork@gmail.com",
            to: email,
            subject: "otp test",
            text: `Your OTP is ${otp}`,
            html: `<b>your OTP :${otp}</b>`
        })

        return info.accepted.length > 0

    } catch (error) {
        console.error("Error sending email",error);
        return false;
    }
}

const signUp = async (req, res) => {
    try {
        const {email,password,cpassword,number,username} = req.body;
        
        if(password !== cpassword) return res.render('signup',{message:"Passwords doesn't match"})

        const findUser = await User.findOne({email});

        if(findUser){
            return res.render('signup',{message:"User already exist"})
        }
        const otp = generateOTP()
        const emailSent = await sendVerificationEmail(email,otp)
        
        console.log("Email sent Status",emailSent)

        if(!emailSent){
            return res.json("email-error")
        }
       
         req.session.userOtp = otp ;
         req.session.userData = {email,password,number,username};

         res.render('verify-otp');
         console.log("OTP Send",otp) 

    } catch (error) {
        console.error("signup error",error);
        res.redirect("/pageNotFound")
    }
    
}

const securePassword = async (password) => {
    try {
        
       const passwordHash = await bcrypt.hash(password,10)

       return passwordHash;

    } catch (error) {
         console.error("error ocured while hasing password")

    }
}

const verifyOTP = async (req,res)=>{
       try {
        const {otp}  = req.body
        console.log(otp)
        
        if(otp === req.session.userOtp){
            const user = req.session.userData
            const passwordHash = await securePassword(user.password);
           console.log("assigning the user data");
           
            const saveUserData = new User({
                username:user.username,
                email:user.email,
                number:user.number,
                password:passwordHash,
            })
           
            await saveUserData.save();
            console.log("user data is saved");

            req.session.user = saveUserData._id

            return res.json({success:true, redirectUrl:"/"})
        }else{
            //invalid otp
            res.status(400).json({ success: false, message:"Invalid OTP, Please try again" })
            
        }
       } catch (error) {
        
        console.error("Error while verifying the otp",error )
        res.status(500).json({ success:false , message:"An error occured" })

       } 
}

//n otp resending
const resendOTP = async (req,res)=>{
    try {
        const {email} = req.session.userData ;
        if(!email){
            return res.status(400).json({ success: false, message:"Email not found in session"})
        }

        const otp = generateOTP();

        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email,otp);

        if(emailSent){
            console.log("Resend OTP :",otp);
            res.status(200).json({ success: true,message: "OTP resent susscessfully"})
            
        }
        else{
            res.status(500).json({ success: false,message: "Failed to resend OTP . Please try again"});
        }
    } catch (error) {
        console.error("error occured while resending otp",error);
        res.status(500).json({success:false,message:"Internal Server error please try again later"})
    }
}

const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render('login',{message:""})
        }else{
            res.redirect('/')
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const pageNotFound = (req,res)=>{
    res.render("error")
}

const login = async (req,res) => {
    try {
        const {email,password} = req.body;
        
        const findUser = await User.findOne({email:email})
      
        if(!findUser){
            return res.render("login",{message:"User not found"})
        }

        if(findUser.isBlocked){
            return res.render("login",{message:"User is blocked by admin"})
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password)

        if(!passwordMatch) return res.render("login",{message:"Incorrect Password"})
         
        
        req.session.user = findUser._id
        res.redirect("/");
    } catch (error) {
        
        console.error("Login error ",error);
        res.send("login",{message:"login failed please try again later"})
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.log("Session destruction error", err.message);
                return res.redirect("/pageNotFound");
            } else {
                return res.redirect("/login");
            }
        });
    } catch (error) {
        console.log("Logout error", error);
        res.redirect("/pageNotFound");
    }
};

const loadProduct = async (req,res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
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
    loadHome,
    loadSignup,
    loadAbout,
    loadBlog,
    loadContact,
    loadMyAccount,
    loadWishlist,
    signUp,
    verifyOTP,
    resendOTP,
    loadLogin,
    pageNotFound,
    login,
    logout,
    loadProduct,
    getProductDetails
} 