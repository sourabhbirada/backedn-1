const { Router } = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Blog = require('../model/blog');

const router = Router();

// Log Cloudinary configuration (for debugging)
console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set',
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blog_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});



// Get all blogs
router.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({}).populate('createby', 'name email');
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get a single blog
router.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('createby', 'name email')
      .populate('comments.createby', 'name');
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/api/blogs', upload.single('imageUrl'), async (req, res) => {
  try {
    console.log('Received POST /api/blogs:', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path, // Cloudinary URL
      } : 'No file uploaded',
    });

    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Cover photo is required' });
    }

    const blog = await Blog.create({
      title,
      body,
      imageUrl: req.file.path, // Store Cloudinary URL
      // createby: req.user.id // Uncomment when authentication is implemented
    });

    const populatedBlog = await Blog.findById(blog._id);
    res.status(201).json(populatedBlog);
  } catch (error) {
    console.error('Error creating blog:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    if (error.message.includes('Cloudinary')) {
      return res.status(500).json({ error: 'Failed to upload image to Cloudinary' });
    }
    res.status(500).json({ error: `Internal Server Error: ${error.message}` });
  }
});

// Add a comment to a blog
router.post('/api/blogs/comments/:id', async (req, res) => {
  try {
    const { body } = req.body;  
    if (!body) {
      return res.status(400).json({ error: 'Comment body is required' });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const comment = {
      body,
      // createby: req.user.id, // Uncomment when you have authentication
      createdAt: new Date(),
    };

    blog.comments.push(comment);
    await blog.save();
    
    const populatedBlog = await Blog.findById(req.params.id)
      .populate('createby', 'name email')
      .populate('comments.createby', 'name');
      
    res.status(201).json(populatedBlog.comments[populatedBlog.comments.length - 1]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a blog
router.delete('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Delete image from Cloudinary first
    if (blog.coverPhoto) {
      const publicId = blog.coverPhoto.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`blog_uploads/${publicId}`);
    }

    // Then delete from database
    await Blog.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Blog deleted' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;