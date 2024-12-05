const Offer = require('../models/offerModel')

const getOffer = async (req,res) => {
    try {
        res.render('admin/offer')
    } catch (error) {
        console.error("Error occured whilerendering the offer page",error)
        res.status(500).render('admin/404')
    }
}



module.exports = {
    getOffer
}