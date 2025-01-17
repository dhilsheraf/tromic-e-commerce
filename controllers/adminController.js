const Admin = require('../models/adminModel');
const bcrypt = require('bcrypt')
const User = require('../models/userModel')
const Order = require('../models/orderModel')
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { getProductDetails } = require('./productController');

// admin login page working
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email: email })

        if (admin) {
            
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.adminId = admin._id;
                
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


// admin login page load
const loadAdminLogin = (req, res) => {
    try {
        res.render('admin/adminlogin', { message: "" })
    } catch (error) {
        console.log("error while admin login", error)
        res.status(500).render('admin/404')
    }
}

// admin dashboard loading
const loadAdminDashboard = async (req, res) => {
    try {
        const revenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }])
        const totalOrder = await Order.countDocuments()
        const products = await Product.countDocuments();
        const categorys = await Category.countDocuments()
        const monthlyEarning = await Order.aggregate([
            { $match: {
                    createdAt: {
                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    }, }, },
            { $group: { _id: null, total: { $sum: "$totalPrice" }, }, },]);

        const monthly = monthlyEarning.length > 0 ? monthlyEarning[0].total : 0;

        const currentDate = new Date();
        const startDate = new Date(currentDate);
        startDate.setMonth(currentDate.getMonth() - 12);
    
        const revenueByMonth = await Order.aggregate([
            {
                $match: { createdAt: {
                        $gte: startDate,  
                        $lte: currentDate    }   
                }
            },
            {
                $project: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                    totalPrice: 1,
                }
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    totalRevenue: { $sum: "$totalPrice" },
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        
        const months = revenueByMonth.map(item => `${item._id.month}-${item._id.year}`);
        const revenues = revenueByMonth.map(item => item.totalRevenue);
        res.render('admin/adminDashboard', { totalOrder, revenue, products, categorys, monthly ,revenueByMonth ,months,revenues })
    } catch (error) {
        console.log("error while loading admin dashboard", error);
        res.status(500).render('admin/404')
    }
}

// users load list
const loadUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const totalUsers = await User.countDocuments();

        const users = await User.find({})
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.render('admin/adminUser', {
            users, totalUsers, currentPage: parseInt(page),
            totalPages: Math.ceil(totalUsers / limit),limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal Server Error");
    }
};

// block unblock user
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

//admin logout
const logout = async (req, res) => {
    try {
        delete req.session.adminId;
        return res.redirect('/admin')
    } catch (error) {
        console.log("Logout error", error);
        
    }
};

// sasle report page load
const salesReport = async (req, res) => {
    try {
        const { startDate, endDate, format, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        let query = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            query.createdAt = { $gte: start, $lte: end };
        }

        // Fetch all orders for Excel/PDF, or paginated data for display
        const orders = format 
            ? await Order.find(query) // Fetch all for export
            : await Order.find(query).skip(skip).limit(parseInt(limit)); // Paginated for display

        const summary = orders.reduce((acc, order) => {
            acc.totalSales += order.totalPrice;
            acc.totalOrders += 1;
            return acc;
        }, { totalSales: 0, totalOrders: 0 });

        if (format === 'pdf') {
            return generatePDF(res, orders, summary, startDate, endDate);
        }

        if (format === 'excel') {
            return generateExcel(res, orders, summary, startDate, endDate);
        }

        // Count total orders for pagination
        const totalOrders = await Order.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / limit);

        return res.render('admin/salesReport', {
            summary, orders, startDate, endDate, totalPages, currentPage: page
        });
    } catch (error) {
        console.error(error);
        res.render('admin/404');
    }
};


// excel generating sales report
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

    //  file to the user
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_report.xlsx')
    workbook.xlsx.write(res).then(() => {
        res.end();
    });
};

// pdf for the sales report
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

// admin side grapuh load
const graph = async (req, res) => {
    try {
        const { timeRange, startDate, endDate } = req.body;
        let filter = {};

        if (timeRange) {
            const now = new Date();
            const pastDate = new Date(now.getTime() - timeRange * 24 * 60 * 60 * 1000);
            filter['createdAt'] = { $gte: pastDate };
        }
        if (startDate && endDate) { filter['createdAt'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)};
        }

        const topProducts = await Order.aggregate([
            { $match: filter },{ $unwind: '$products' },
            { $group: {
                    _id: '$products.product',
                    totalQuantity: { $sum: '$products.quantity' }
                }
            },
            { $sort: { totalQuantity: -1 } },{ $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $project: { name: '$productDetails.name', totalQuantity: 1 } }
        ]);

        const topCategories = await Order.aggregate([
            { $match: filter },{ $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.product',
                    foreignField: '_id',
                    as: 'productDetails'
                } },
            { $unwind: '$productDetails' },
            {$lookup: {
                    from: 'categories',
                    localField: 'productDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                } },
            { $unwind: '$categoryDetails' },
            {$group: {
                    _id: '$categoryDetails.name',
                    totalQuantity: { $sum: '$products.quantity' }}
            },
            { $sort: { totalQuantity: -1 } }, { $limit: 10 }
        ]);


        res.json({
            productLabels: topProducts.map(p => p.name ),
            productSales: topProducts.map(p => p.totalQuantity),
            categoryLabels: topCategories.map(c => c._id),
            categorySales: topCategories.map(c => c.totalQuantity)
        });
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
};

  
  
module.exports = {
    loadAdminLogin,
    adminLogin,
    loadAdminDashboard,
    loadUsers,
    blockunblock,
    logout,
    salesReport,
    graph
}