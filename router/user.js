const { Router } = require('express');
const User = require('../model/user');
const Blog = require('../model/blog');
const Comment = require('../model/comment');
const router = Router();

router.get('/userprofile', async (req, res) => {
    const blogs = await Blog.find({ createby: req.user._id }).populate("createby");
    const comment = await Comment.find({ createby: req.user._id }).populate("createby")
    console.log(blogs);

    return res.render('userprofile', {
        user: req.user,
        blogs,
        comment
    })
})


module.exports = router;