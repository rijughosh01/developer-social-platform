const express = require('express');
const { body, query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// @desc    Get all posts (with pagination and filters)
// @route   GET /api/posts
// @access  Public
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term must not be empty'),
  query('category')
    .optional()
    .isIn(['general', 'tutorial', 'project', 'news', 'opinion', 'review'])
    .withMessage('Invalid category'),
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string')
], validate, optionalAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = { isPublished: true };

  // Search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by author
  if (req.query.author) {
    query.author = req.query.author;
  }

  // Filter by tags
  if (req.query.tags) {
    const tags = req.query.tags.split(',').map(tag => tag.trim());
    query.tags = { $in: tags };
  }

  const posts = await Post.find(query)
    .populate('author', 'username firstName lastName avatar')
    .sort(req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments(query);

  // For each post, get the comments count from the Comment collection
  const postsWithCommentsCount = await Promise.all(posts.map(async (post) => {
    const commentsCount = await Comment.countDocuments({ post: post._id });
    return {
      ...post.toObject(),
      commentsCount,
    };
  }));

  res.json({
    success: true,
    data: postsWithCommentsCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username firstName lastName avatar bio')
    .populate('likes', 'username firstName lastName avatar');

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Increment views
  await post.incrementViews();

  // Check if current user liked the post
  let isLiked = false;
  if (req.user) {
    isLiked = post.likes.some(like => like._id.toString() === req.user._id.toString());
  }

  // Get comments count from Comment collection
  const commentsCount = await Comment.countDocuments({ post: post._id });

  res.json({
    success: true,
    data: {
      ...post.toObject(),
      isLiked,
      commentsCount,
    }
  });
}));

// @desc    Create post
// @route   POST /api/posts
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Content must be less than 10000 characters'),
  body('code')
    .optional()
    .isString()
    .withMessage('Code must be a string'),
  body('codeLanguage')
    .optional()
    .isString()
    .withMessage('Language must be a string'),
  body('type')
    .optional()
    .isIn(['regular', 'code'])
    .withMessage('Type must be either regular or code'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Excerpt cannot exceed 300 characters'),
  body('category')
    .optional()
    .isIn(['general', 'tutorial', 'project', 'news', 'opinion', 'review'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid')
], validate, asyncHandler(async (req, res) => {
  const { title, content, code, codeLanguage, type, excerpt, category, tags, image } = req.body;

  // For code posts, either content or code must be present
  if (type === 'code' && !code) {
    return res.status(400).json({
      success: false,
      message: 'Code is required for code posts'
    });
  }

  const post = await Post.create({
    author: req.user._id,
    title,
    content: content || '',
    code: code || '',
    language: codeLanguage || '',
    type: type || 'regular',
    excerpt: excerpt || (content ? content.substring(0, 300) : ''),
    category: category || 'general',
    tags: tags || [],
    image: image || ''
  });

  await post.populate('author', 'username firstName lastName avatar');

  res.status(201).json({
    success: true,
    data: post
  });
}));

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (own posts only)
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be less than 200 characters'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be less than 10000 characters'),
  body('excerpt')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Excerpt cannot exceed 300 characters'),
  body('category')
    .optional()
    .isIn(['general', 'tutorial', 'project', 'news', 'opinion', 'review'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid')
], validate, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check if user owns the post
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this post'
    });
  }

  // Update fields
  const fieldsToUpdate = ['title', 'content', 'excerpt', 'category', 'tags', 'image'];

  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      post[field] = req.body[field];
    }
  });

  // Update excerpt if content changed
  if (req.body.content && !req.body.excerpt) {
    post.excerpt = req.body.content.substring(0, 300);
  }

  const updatedPost = await post.save();
  await updatedPost.populate('author', 'username firstName lastName avatar');

  res.json({
    success: true,
    data: updatedPost
  });
}));

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (own posts only)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check if user owns the post
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this post'
    });
  }

  await post.deleteOne();

  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
}));

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const isLiked = post.likes.includes(req.user._id);

  if (isLiked) {
    // Unlike
    await post.removeLike(req.user._id);
    res.json({
      success: true,
      message: 'Post unliked',
      data: {
        isLiked: false,
        likesCount: post.likesCount
      }
    });
  } else {
    // Like
    await post.addLike(req.user._id);
    
    // Create notification for post author (if not liking own post)
    if (post.author.toString() !== req.user._id.toString()) {
      const notificationService = new NotificationService(req.app.get('io'));
      await notificationService.createLikePostNotification(
        req.user._id,
        post.author,
        post._id,
        post.title
      );
    }
    
    res.json({
      success: true,
      message: 'Post liked',
      data: {
        isLiked: true,
        likesCount: post.likesCount
      }
    });
  }
}));

// @desc    Add comment to post
// @route   POST /api/posts/:id/comment
// @access  Private
router.post('/:id/comment', protect, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content is required and must be less than 1000 characters')
], validate, asyncHandler(async (req, res) => {
  console.log('🔔 Comment route hit!');
  console.log('User ID:', req.user._id);
  console.log('Post ID:', req.params.id);
  console.log('Content:', req.body.content);
  
  const { content } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    console.log('❌ Post not found');
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  console.log('✅ Post found:', post.title);
  console.log('Post author:', post.author);
  console.log('Current user:', req.user._id);
  console.log('Are they the same?', post.author.toString() === req.user._id.toString());

  await post.addComment(req.user._id, content);
  await post.populate('comments.user', 'username firstName lastName avatar');

  const newComment = post.comments[post.comments.length - 1];
  console.log('✅ Comment added successfully');

  // Create notification for post author (if not commenting on own post)
  if (post.author.toString() !== req.user._id.toString()) {
    console.log('🔔 Creating comment notification...');
    console.log('Commenter ID:', req.user._id);
    console.log('Post Author ID:', post.author);
    console.log('Post ID:', post._id);
    console.log('Post Title:', post.title);
    
    try {
      const notificationService = new NotificationService(req.app.get('io'));
      const notification = await notificationService.createCommentPostNotification(
        req.user._id,
        post.author,
        post._id,
        post.title,
        content
      );
      console.log('✅ Comment notification created:', notification._id);
    } catch (error) {
      console.error('❌ Error creating comment notification:', error);
    }
  } else {
    console.log('ℹ️ User commenting on their own post - no notification needed');
  }

  res.status(201).json({
    success: true,
    data: newComment
  });
}));

// @desc    Remove comment from post
// @route   DELETE /api/posts/:id/comment/:commentId
// @access  Private (own comments only)
router.delete('/:id/comment/:commentId', protect, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const comment = post.comments.id(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  // Check if user owns the comment
  if (comment.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this comment'
    });
  }

  await post.removeComment(req.params.commentId);

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
}));

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public
router.get('/user/:userId', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
], validate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const posts = await Post.find({
    author: req.params.userId,
    isPublished: true
  })
  .populate('author', 'username firstName lastName avatar')
  .populate('comments.user', 'username firstName lastName avatar')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await Post.countDocuments({
    author: req.params.userId,
    isPublished: true
  });

  res.json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get post with comments
// @route   GET /api/posts/:postId
// @access  Public
router.get('/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate('author', 'firstName lastName');
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ post, comments });
  } catch (err) {
    res.status(404).json({ error: 'Post not found' });
  }
});

// Increment post views
router.post('/:id/view', asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  await post.incrementViews();
  res.json({ success: true, views: post.views });
}));

// @desc    Save a post
// @route   POST /api/posts/:id/save
// @access  Private
router.post('/:id/save', protect, asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const user = await require('../models/User').findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (!user.savedPosts.includes(postId)) {
    user.savedPosts.push(postId);
    await user.save();
  }

  res.json({ success: true, message: 'Post saved' });
}));

// @desc    Unsave a post
// @route   DELETE /api/posts/:id/save
// @access  Private
router.delete('/:id/save', protect, asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const user = await require('../models/User').findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId.toString());
  await user.save();

  res.json({ success: true, message: 'Post unsaved' });
}));

module.exports = router; 