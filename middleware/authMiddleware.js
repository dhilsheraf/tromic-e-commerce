const User = require('../models/userModel')


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
    existAdmin,
    existUser
};
