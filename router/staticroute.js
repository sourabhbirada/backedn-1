const express = require('express');
const Blog = require('../model/blog');


const router = express.Router();




router.get("/error", (req, res) => {
    return res.render('errorpage')
})


router.get('/setting', async (req, res) => {

    return res.render('setting',
        {
            user: req.user
        }
    )
})



module.exports = router