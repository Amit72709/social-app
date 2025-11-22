import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import Post from '../models/Post.js';

const router = express.Router();

// CREATE POST
router.post('/', auth, upload.array('media', 2), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ msg: 'Text is required' });

    const media = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const post = new Post({ text, media, owner: req.user.id });
    await post.save();
    await post.populate('owner', 'name photo');

    res.status(201).json(post);
  } catch (err) {
    console.error('POST /api/posts error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// READ ALL POSTS
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('owner', 'name photo')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('GET /api/posts error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// UPDATE POST (owner only)
router.put('/:id', auth, upload.array('media', 2), async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, owner: req.user.id });
    if (!post) return res.status(403).json({ msg: 'Not authorized to update this post' });

    if (req.body.text) post.text = req.body.text;
    if (req.files?.length) post.media = req.files.map(f => `/uploads/${f.filename}`);

    await post.save();
    await post.populate('owner', 'name photo');

    res.json(post);
  } catch (err) {
    console.error('PUT /api/posts/:id error:', err);
    res.status(500).json({ msg: err.message });
  }
});

// DELETE POST (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!post) return res.status(404).json({ msg: 'Post not found or not authorized' });

    res.json({ msg: 'Post deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/posts/:id error:', err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
