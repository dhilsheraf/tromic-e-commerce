
const checkUserSession = (req, res, next) => {
    if (!req.session.user ) {
        return res.redirect('/login');  
    }
    next();  
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
