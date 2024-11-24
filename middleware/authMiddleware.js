// Example of checkUserSession middleware
const checkUserSession = (req, res, next) => {
    if (!req.session.user ) {
        return res.redirect('/login');  // Redirect to login if user is not logged in
    }
    next();  // Proceed if user is logged in
};

const existUser = (req,res,next) => {
        if(req.session.user ){
            return res.redirect('/')
        }
        next()
}


function checkAdminSession(req, res, next) {
    if (req.session.adminId) {
        next();
    } else {
        res.redirect('/admin');
    }
}

const existAdmin = (req,res,next) => {
    if(req.session.adminId){
        return res.redirect('/admin/dashboard')
    }
    next()
}




module.exports = {
    checkUserSession,
    checkAdminSession,
    existUser,
    existAdmin
};
