const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email: email })

        if (admin) {
            req.session.adminId = admin._id;
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                res.redirect('/admin/dashboard');
            } else {
                res.render('admin/adminlogin', { message: "Incorrect password" })
            }
        }
        else {
            res.render('admin/adminlogin', { message: "You are not admin" })
        }
    } catch (error) {
        console.log(error);
        res.status(500).render('admin/adminlogin', { message: "try again later serever down" })
    }
}

const loadAdminLogin = (req, res) => {
    try {
        res.render('admin/adminlogin', { message: "" })
    } catch (error) {
        console.log("error while admin login", error)
        res.status(500).render('admin/404')
    }
}

const loadAdminDashboard = async (req, res) => {
    try {
        const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }])
        const totalOrder = await Order.countDocuments()
        const products = await Product.countDocuments();
        const categorys = await Category.countDocuments()
        const monthlyEarning = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            },
            { $group: { _id: null, total: { $sum: "$totalPrice" }, }, },]);

        const monthly = monthlyEarning.length > 0 ? monthlyEarning[0].total : 0;



        res.render('admin/adminDashboard', { totalOrder, revenue, products, categorys, monthly })
    } catch (error) {
        console.log("error while loading admin dashboard", error);
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
    const { action } = req.body;  

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (action === 'block') {
            user.isBlocked = true;  
        } else if (action === 'unblock') {
            user.isBlocked = false;  
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        await user.save();  

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'An error occurred while updating block status' });
    }
};

const logout = async (req, res) => {
    try {
        delete req.session.admin;
    } catch (error) {
        console.log("Logout error", error);
        
    }
};


const salesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let orders;

        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            orders = await Order.find({
                createdAt: { $gte: start, $lte: end }
            });
        } else {
            orders = await Order.find()
        }

        const summary = orders.reduce((acc, order) => {
            acc.totalSales += order.totalPrice;
            acc.totalOrders += 1;
            return acc;
        }, { totalSales: 0, totalOrders: 0 })

        if (req.query.format === 'pdf') {
            return generatePDF(res, orders, summary, startDate, endDate);
        }

        if (req.query.format === 'excel') {
            return generateExcel(res, orders, summary, startDate, endDate)
        }

        return res.render('admin/salesReport', { summary, orders, startDate, endDate })
    } catch (error) {
        console.error(error);
        res.render('admin/404');
    }
};

const generateExcel = (res, orders, summary, startDate, endDate) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    
    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total Price', key: 'totalPrice', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 20 },
        { header: 'Total Items', key: 'totalItems', width: 15 }
    ];

    orders.forEach(order => {
        worksheet.addRow({
            orderId: order._id,
            date: new Date(order.createdAt).toLocaleDateString(),
            totalPrice: order.totalPrice,
            paymentStatus: order.paymentStatus,
            totalItems: order.products.length
        });
    });

    worksheet.addRow([]);
    worksheet.addRow(['Total Sales', summary.totalSales])
    worksheet.addRow(['Total Orders', summary.totalOrders]);

    // Send the Excel file to the user
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx')
    workbook.xlsx.write(res).then(() => {
        res.end();
    });
};

const generatePDF = (res, orders, summary, startDate, endDate) => {
    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(16).text('Sales Report', { align: 'center' })

    doc.fontSize(12).text(`Date Range: ${startDate} to ${endDate}`, { align: 'center' });
    doc.text(`Total Sales: ₹${summary.totalSales}`);
    doc.text(`Total Orders: ${summary.totalOrders}`)
    doc.text('\n');

    doc.fontSize(12).text('Order Details:');
    orders.forEach(order => {
        doc.text(`Order ID: ${order._id}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Total Price: ₹${order.totalPrice}`);
        doc.text(`Payment Status: ${order.paymentStatus}`)
        doc.text(`Total Items: ${order.products.length}`);
        doc.text('-------------------------')
    });

    doc.end()
};

  
module.exports = {
    loadAdminLogin,
    adminLogin,
    loadAdminDashboard,
    loadUsers,
    blockunblock,
    logout,
    salesReport
}