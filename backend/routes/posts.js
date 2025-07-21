const express = require('express');
const { body, query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
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
    .populate({
      path: 'forkedFrom',
      populate: { path: 'author', select: 'username firstName lastName avatar' }
    })
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

// Get review requests for a user (both as requester and reviewer)
router.get('/review-requests', protect, asyncHandler(async (req, res) => {
  // Reviews where the user is the post author (requester)
  const postsAsAuthor = await Post.find({
    author: req.user._id,
    'reviewRequests.0': { $exists: true }
  }).populate('reviewRequests.reviewer', 'firstName lastName username');

  // Reviews where the user is the reviewer
  const postsAsReviewer = await Post.find({
    'reviewRequests.reviewer': req.user._id
  }).populate('author', 'firstName lastName username');

  // Collect review requests for both roles
  const reviewRequests = [];

  // As requester
  postsAsAuthor.forEach(post => {
    post.reviewRequests.forEach(review => {
      reviewRequests.push({
        _id: review._id,
        post: {
          _id: post._id,
          title: post.title,
          code: post.code,
          codeLanguage: post.codeLanguage,
          author: {
            _id: post.author,
            firstName: post.author.firstName,
            lastName: post.author.lastName,
            username: post.author.username
          }
        },
        reviewer: review.reviewer,
        comment: review.comment,
        rating: review.rating,
        status: review.status,
        response: review.response,
        requesterReply: review.requesterReply,
        createdAt: review.createdAt,
        role: 'requester'
      });
    });
  });

  // As reviewer
  postsAsReviewer.forEach(post => {
    post.reviewRequests.forEach(review => {
      if (review.reviewer && review.reviewer._id.toString() === req.user._id.toString()) {
        reviewRequests.push({
          _id: review._id,
          post: {
            _id: post._id,
            title: post.title,
            code: post.code,
            codeLanguage: post.codeLanguage,
            author: {
              _id: post.author._id,
              firstName: post.author.firstName,
              lastName: post.author.lastName,
              username: post.author.username
            }
          },
          reviewer: {
            _id: review.reviewer._id,
            firstName: review.reviewer.firstName,
            lastName: review.reviewer.lastName,
            username: review.reviewer.username
          },
          comment: review.comment,
          rating: review.rating,
          status: review.status,
          response: review.response,
          requesterReply: review.requesterReply,
          createdAt: review.createdAt,
          role: 'reviewer'
        });
      }
    });
  });

  res.json({
    success: true,
    data: reviewRequests
  });
}));

// Update review request status
router.put('/review-requests/:reviewId', protect, asyncHandler(async (req, res) => {
  const { status, response } = req.body;
  
  const post = await Post.findOne({
    author: req.user._id,
    'reviewRequests._id': req.params.reviewId
  });

  if (!post) {
    return res.status(404).json({ success: false, message: 'Review request not found' });
  }

  const reviewRequest = post.reviewRequests.id(req.params.reviewId);
  if (!reviewRequest) {
    return res.status(404).json({ success: false, message: 'Review request not found' });
  }

  reviewRequest.status = status;
  if (response) {
    reviewRequest.response = response;
  }

  await post.save();

  res.json({
    success: true,
    message: 'Review request updated successfully',
    data: reviewRequest
  });
}));

// Add requester reply to a review request
router.put('/review-requests/:reviewId/requester-reply', protect, asyncHandler(async (req, res) => {
  const { requesterReply } = req.body;

  // Find the post where the current user is the author and the review request exists
  const post = await Post.findOne({
    author: req.user._id,
    'reviewRequests._id': req.params.reviewId
  });

  if (!post) {
    return res.status(404).json({ success: false, message: 'Review request not found' });
  }

  const reviewRequest = post.reviewRequests.id(req.params.reviewId);
  if (!reviewRequest) {
    return res.status(404).json({ success: false, message: 'Review request not found' });
  }

  reviewRequest.requesterReply = requesterReply;
  await post.save();

  res.json({
    success: true,
    message: 'Requester reply added successfully',
    data: reviewRequest
  });
}));

// Get fork history
router.get('/fork-history', protect, asyncHandler(async (req, res) => {
  const { filter } = req.query;
  
  let query = {};
  
  switch (filter) {
    case 'my-forks':
      // Posts that the current user has forked (only code posts)
      query = { author: req.user._id, isFork: true, type: 'code' };
      break;
    case 'forks-of-mine':
      // Posts that others have forked from the current user's code posts
      query = { author: req.user._id, type: 'code', forkedFrom: { $exists: false } };
      break;
    default:
      // All fork activity related to the current user (only code posts)
      query = { 
        type: 'code',
        $or: [
          { author: req.user._id, isFork: true },
          { author: req.user._id, forkedFrom: { $exists: false } }
        ] 
      };
  }

  const posts = await Post.find(query)
    .populate('author', 'firstName lastName username')
    .populate('forkedFrom', 'title author')
    .populate('forkedFrom.author', 'firstName lastName username')
    .sort({ createdAt: -1 });

  // Get forks of each post (only code posts)
  const postsWithForks = await Promise.all(
    posts.map(async (post) => {
      const forks = await Post.find({ forkedFrom: post._id, type: 'code' })
        .populate('author', 'firstName lastName username')
        .select('title author createdAt')
        .sort({ createdAt: -1 });

      return {
        _id: post._id,
        title: post.title,
        description: post.description,
        code: post.code,
        codeLanguage: post.codeLanguage,
        difficulty: post.difficulty,
        createdAt: post.createdAt,
        forkedFrom: post.forkedFrom,
        forks: forks,
        likesCount: post.likesCount,
        copies: post.copies
      };
    })
  );

  res.json({
    success: true,
    data: postsWithForks
  });
}));

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username firstName lastName avatar bio')
    .populate('likes', 'username firstName lastName avatar')
    .populate({
      path: 'forkedFrom',
      populate: { path: 'author', select: 'username firstName lastName avatar' }
    });

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

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
  body('difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty must be beginner, intermediate, or advanced'),
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
  const { title, content, code, codeLanguage, difficulty, description, type, excerpt, category, tags, image } = req.body;
  
  console.log('Creating post with difficulty:', difficulty);
  console.log('Full request body:', req.body);

  // For code posts, either content or code must be present
  if (type === 'code' && !code) {
    return res.status(400).json({
      success: false,
      message: 'Code is required for code posts'
    });
  }

  const postData = {
    author: req.user._id,
    title,
    content: content || '',
    code: code || '',
    codeLanguage: codeLanguage || '',
    difficulty: difficulty || 'beginner',
    description: description || '',
    type: type || 'regular',
    excerpt: excerpt || (content ? content.substring(0, 300) : ''),
    category: category || 'general',
    tags: tags || [],
    image: image || ''
  };
  
  console.log('Creating post with data:', postData);
  
  const post = await Post.create(postData);
  
  console.log('Post created with difficulty:', post.difficulty);

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

// Increment post copy count
router.post('/:id/copy', asyncHandler(async (req, res) => {
  console.log('Copy count route hit for post:', req.params.id);
  const post = await Post.findById(req.params.id);
  if (!post) {
    console.log('Post not found');
    return res.status(404).json({ success: false, message: 'Post not found' });
  }
  console.log('Current copy count:', post.copies);
  await post.incrementCopies();
  console.log('Updated copy count:', post.copies);
  res.json({ success: true, copies: post.copies });
}));

// Fork a code post
router.post('/:id/fork', protect, asyncHandler(async (req, res) => {
  const { title, description, code, codeLanguage, difficulty, tags } = req.body;
  const notificationService = new NotificationService(req.app.get('io'));
  
  const originalPost = await Post.findById(req.params.id).populate('author', 'username firstName lastName avatar');
  if (!originalPost) {
    return res.status(404).json({ success: false, message: 'Original post not found' });
  }

  if (originalPost.type !== 'code') {
    return res.status(400).json({ success: false, message: 'Only code posts can be forked' });
  }

  const forkedPost = await Post.create({
    author: req.user._id,
    title: title || `Fork of ${originalPost.title}`,
    description: description || '',
    code: code || originalPost.code,
    codeLanguage: codeLanguage || originalPost.codeLanguage,
    difficulty: difficulty || originalPost.difficulty,
    type: 'code',
    tags: tags || originalPost.tags,
    forkedFrom: originalPost._id,
    isFork: true
  });

  await forkedPost.populate('author', 'username firstName lastName avatar');
  await forkedPost.populate({
    path: 'forkedFrom',
    populate: { path: 'author', select: 'username firstName lastName avatar' }
  });

  // Notify the original post author if the forker is not the owner
  if (originalPost.author && originalPost.author._id.toString() !== req.user._id.toString()) {
    await notificationService.createNotification({
      recipient: originalPost.author._id,
      sender: req.user._id,
      type: 'fork_created',
      title: `${forkedPost.author.firstName || ''} ${forkedPost.author.lastName || ''} forked your code post`.trim(),
      message: `Your code post \"${originalPost.title}\" was forked.`,
      data: {
        postId: forkedPost._id,
        url: `/posts/${forkedPost._id}`
      }
    });
  }

  res.status(201).json({
    success: true,
    data: forkedPost
  });
}));

// Request code review
router.post('/:id/review-request', protect, asyncHandler(async (req, res) => {
  const { comment, rating } = req.body;
  const notificationService = new NotificationService(req.app.get('io'));
  
  const post = await Post.findById(req.params.id).populate('author', 'username firstName lastName avatar');
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  if (post.type !== 'code') {
    return res.status(400).json({ success: false, message: 'Only code posts can have review requests' });
  }

  // Create review request
  const reviewRequest = {
    reviewer: req.user._id,
    comment: comment,
    rating: rating || 5,
    status: 'pending',
    createdAt: new Date()
  };

  // Add to post's review requests
  if (!post.reviewRequests) {
    post.reviewRequests = [];
  }
  post.reviewRequests.push(reviewRequest);
  await post.save();

  // Notify the post author if the reviewer is not the owner
  if (post.author && post.author._id.toString() !== req.user._id.toString()) {
    await notificationService.createNotification({
      recipient: post.author._id,
      sender: req.user._id,
      type: 'review_request',
      title: `${req.user.firstName || ''} ${req.user.lastName || ''} requested a review on your code post`.trim(),
      message: `Your code post \"${post.title}\" received a new review request.`,
      data: {
        postId: post._id,
        url: `/posts/${post._id}`
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Review request submitted successfully',
    data: reviewRequest
  });
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