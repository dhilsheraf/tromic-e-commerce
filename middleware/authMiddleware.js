const User = require('../models/userModel')

// user check middleware
const checkUserSession = async (req, res, next) => {
    if(req.session.user){
        try {
            const user = await User.findById(req.session.user)
            if(user &&  !user.isBlocked){
                next();
            }else{
                delete req.session.user
                res.redirect('/login');
            } 
        }catch (error) {
            console.log('user auth error', error.message);
            res.status(500).send('server error');
        }
    }else{
        res.redirect('/login');
    }

};

// if user in session redirected to home page
const existUser = (req,res,next) => {
    if(req.session.user ){
        return res.redirect('/')
    }
    next()
}

// checking admin session
function checkAdminSession(req, res, next) {

    if (req.session.adminId) {
        next();
    } else {
        res.redirect('/admin');
    }
}
// admin i sin session redirected to dashboard
const existAdmin = (req,res,next) => {
    if(req.session.adminId){
        return res.redirect('/admin/dashboard')
    }
    next()
}




module.exports = {
    checkUserSession,
    checkAdminSession,
    existAdmin,
    existUser
};
