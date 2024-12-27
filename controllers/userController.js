const User = require("../models/userModel");
const nodemailer = require('nodemailer')
const bcrypt = require("bcrypt");
const env = require('dotenv');
const { json } = require("express");
const Product = require("../models/productModel")
const Address = require('../models/addressModel')
const crypto = require('crypto')
const Order = require('../models/orderModel')
const Wishlist = require('../models/wishlistModel')
const Coupon = require('../models/couponModel')
const Wallet = require('../models/walletModel')


//route to home 

// to load the home pages and others
const loadHome = async (req, res) => {
    try {

        const products = await Product.find({}).limit(10).lean();
        const coupons = Coupon.find()

        res.render('home', { products, coupons })
    } catch (error) {
        console.error("Home page not loading", error);
        res.status(500).redirect("error")
    }
}

const loadAbout = async (req, res) => {
    try {
        res.render("about")
    } catch (error) {
        console.error(error);
        res.status(500).render("error")
    }
}

const loadContact = async (req, res) => {
    try {
        res.render('contact');
    } catch (error) {
        console.error(error);
        res.status(500).render("error")
    }
}
const loadBlog = async (req, res) => {
    try {
        res.render('blog');
    } catch (error) {
        console.error(error)
        res.status(500).render("error")
    }
}

//signup for user login
const loadSignup = async (req, res) => {
    try {
        if (req.session.user) {
            return res.redirect('/');
        }
        return res.render("signup", { message: "" });
    } catch (error) {
        console.log("Error loading signup page", error);
        res.render("error")
    }
}

//user profile and account details
const loadMyAccount = async (req, res) => {
    try {
        const userId = req.session.user
        const user = await User.findById(req.session.user)
        const addresses = await Address.find({ userId: req.session.user })
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).populate('products.product', 'name price')
            .populate('addressId', 'addressLine city');

        const wallet = await Wallet.findOne({ userId }) || { balance: 0, transactions: [] }

        res.render("my-account", { user, addresses, orders, wallet })
    } catch (error) {
        console.log(error)
        res.status(500).render("error")
    }
}

//wishlist
const loadWishlist = async (req, res) => {
    try {
        const userId = req.session.user;
        const wishlist = await Wishlist.findOne({ userId }).populate('items.productId')
        res.render("wishlist", { wishlist: wishlist ? wishlist.items : [] })
    } catch (error) {
        console.log("Error while rendering wishlist", error)
        res.status(500).render('error');
    }
}

//add to wishlist and remove 
const toggleWishlist = async (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user;

    if (!userId) return res.status(401).json({ message: "Please log in to manage your Wishlist" });

    try {
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist)
            wishlist = new Wishlist({ userId, items: [] });
        const itemIndex = wishlist.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex !== -1) {

            wishlist.items.splice(itemIndex, 1);
            await wishlist.save();
            return res.status(200).json({ success: true, message: "Product removed from Wishlist" })
        } else {
            wishlist.items.push({ productId });
            await wishlist.save();
            return res.status(200).json({ success: true, message: "Product added to Wishlist" })
        }
    } catch (error) {
        console.error("Error while toggling wishlist:", error);
        res.status(500).json({ success: false, message: "An error occurred while managing the Wishlist" });
    }
};

//remove from the wishlist
const removeWishlist = async (req, res) => {
    const userId = req.session.user;
    const { productId } = req.params;
    try {
        const wishlist = await Wishlist.findOne({ userId });
        if (wishlist) {
            wishlist.items = wishlist.items.filter(item => item.productId.toString() !== productId);
            await wishlist.save();
            return res.redirect('/wishlist')
        }
    } catch (error) {
        console.error("Error removing item from wishlist:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


// function for creating otp
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

//email send function
async function sendVerificationEmail(email, otp) {
    try {

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
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
        console.error("Error sending email", error);
        return false;
    }
}

//user signup 
const signUp = async (req, res) => {
    try {
        const { email, password, cpassword, number, username } = req.body;

        if (password !== cpassword) return res.render('signup', { message: "Passwords doesn't match" })

        const findUser = await User.findOne({ email });

        if (findUser) {
            return res.render('signup', { message: "User already exist" })

        }
        const otp = generateOTP()
        const emailSent = await sendVerificationEmail(email, otp)

        console.log("Email sent Status", emailSent)

        if (!emailSent) {
            return res.json("email-error")
        }

        // let referredBy = null;
        // if (referralCode) {
        //     const referrer = await User.findOne({ referral: referralCode });
        //     if (!referrer) {
        //         return res.render('signup', { message: "Invalid referral code" });
        //     }
        //     referredBy = referrer._id
        // }

        req.session.userOtp = otp;
        req.session.userData = { email, password, number, username, };

        res.render('verify-otp');
        console.log("OTP Send", otp)

    } catch (error) {
        console.error("signup error", error);
        res.render("error")
    }

}

//password hashing
const securePassword = async (password) => {
    try {

        const passwordHash = await bcrypt.hash(password, 10)

        return passwordHash;

    } catch (error) {
        console.error("error ocured while hasing password")

    }
}

//verifying the user otp
const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body
        console.log(otp)

        if (otp === req.session.userOtp) {
            const user = req.session.userData
            const passwordHash = await securePassword(user.password);
            console.log("assigning the user data");

            // let referrerWallet = await Wallet.findOne({ userId: user.referredBy });
            // if (!referrerWallet)
            //     referrerWallet = await Wallet.create({ userId: referrerId, balance: 0, transactions: [] });

            // referrerWallet.balance += bonusAmount;
            // referrerWallet.transactions.push({
            //     type: 'Credit',
            //     amount: 250,
            //     description: `Referral bonus for referring user `,
            // });
            // await referrerWallet.save();

            const saveUserData = new User({
                username: user.username,
                email: user.email,
                number: user.number,
                password: passwordHash,
            })


            await saveUserData.save();
            console.log("user data is saved");

            req.session.user = saveUserData._id

            return res.json({ success: true, redirectUrl: "/" })
        } else {
            //invalid otp
            res.status(400).json({ success: false, message: "Invalid OTP, Please try again" })

        }
    } catch (error) {

        console.error("Error while verifying the otp", error)
        res.status(500).json({ success: false, message: "An error occured" })

    }
}


// function generateReferral(name) {
//     return name.slice(0, 4).toUpperCase() + Math.floor(1000 + Math.random() * 9000); 
// }



//n otp resending
const resendOTP = async (req, res) => {
    try {
        const { email } = req.session.userData;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email not found in session" })
        }

        const otp = generateOTP();

        req.session.userOtp = otp;

        const emailSent = await sendVerificationEmail(email, otp);

        if (emailSent) {
            console.log("Resend OTP :", otp);
            res.status(200).json({ success: true, message: "OTP resent susscessfully" })

        }
        else {
            res.status(500).json({ success: false, message: "Failed to resend OTP . Please try again" });
        }
    } catch (error) {
        console.error("error occured while resending otp", error);
        res.status(500).json({ success: false, message: "Internal Server error please try again later" })
    }
}

// login page 
const loadLogin = async (req, res) => {
    try {
        res.render('login', { message: "" })
    } catch (error) {
        res.render("error")
    }
}


// user login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const findUser = await User.findOne({ email: email })

        if (!findUser) {
            return res.render("login", { message: "User not found" })
        }

        if (findUser.isBlocked) {
            return res.render("login", { message: "User is blocked by admin" })
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password)

        if (!passwordMatch) return res.render("login", { message: "Incorrect Password" })


        req.session.user = findUser._id

        res.redirect("/");
    } catch (error) {

        console.error("Login error ", error);
        res.render("error", { message: "login failed please try again later" })
    }
}

// user logiout
const logout = async (req, res) => {
    try {
        delete req.session.user;
        res.redirect('/my-account')
    } catch (error) {
        console.log("Logout error", error);
        res.render("error")
    }
};


// user profer updating
const profileUpdate = async (req, res) => {
    try {
        const { username, number } = req.body;
        const userId = req.session.user;


        if (!userId) {
            return res.status(401).send({ message: 'Unauthorized' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { username, number },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        res.status(200).send({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while updating the profile' });
    }
}

// forgot pawword loading
const forgotPasswordLoad = async (req, res) => {
    try {
        res.render('forgotPassword')
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'An error occurred while forgot password loading' });
    }
}

// working with the forgot password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.send("If this email exists, a reset link has been sent.");
        }


        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetToken = resetToken;
        user.resetTokenExpires = Date.now() + 3600000;
        await user.save();


        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const resetUrl = `http://localhost:${process.env.PORT}/reset-password/${resetToken}`;
        const mailOptions = {
            to: user.email,
            subject: "Password Reset",
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f7f7f7; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
              <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">
                Hello, <br />
                You requested a password reset for your account. Please click the button below to reset your password. 
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 14px 25px; text-decoration: none; font-size: 16px; border-radius: 5px; transition: background-color 0.3s;">
                  Reset Password
                </a>
              </div>
              <p style="font-size: 14px; color: #777; text-align: center;">
                If you did not request this, please ignore this email.
              </p>
              <p style="font-size: 14px; color: #777; text-align: center;">
                This link will expire in 1 hour.
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        res.redirect('/forgot-password?status=sent')
    } catch (err) {
        console.error(err);
        res.status(500).send("Something went wrong.");
    }
}


// doing it through the token
const resetPasswordLoad = async (req, res) => {
    try {
        const { token } = req.params;

        const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
        if (!user) {
            return res.send("Expired the time");
        }

        res.render("resetPassword", { token });
    } catch (error) {
        console.error(error);
        res.status(500).render("error")
    }
}

//changin the password after the token
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
        if (!user) {
            return res.send("Invalid or expired reset token.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpires = null;
        await user.save();

        res.render('passchange-effect');
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
}
//user profiler password chagnign
const changePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
    }

    try {
        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error.' });
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
    login,
    logout,
    profileUpdate,
    forgotPasswordLoad,
    forgotPassword,
    resetPasswordLoad,
    resetPassword,
    changePassword,
    toggleWishlist,
    removeWishlist
} 