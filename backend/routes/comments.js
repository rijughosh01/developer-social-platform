const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');
const NotificationService = require('../utils/notificationService');

// Get all comments for a post
router.get('/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
    res.json({ data: { comments } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a post (protected)
router.post('/:postId', auth.protect, async (req, res) => {
  try {
    console.log('🔔 Comments route hit!');
    console.log('User ID:', req.user._id);
    console.log('Post ID:', req.params.postId);
    console.log('Content:', req.body.content);
    
    const { content } = req.body;
    
    // Get the post to check if user is commenting on their own post
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      console.log('❌ Post not found');
      return res.status(404).json({ error: 'Post not found' });
    }
    
    console.log('✅ Post found:', post.title);
    console.log('Post author:', post.author);
    console.log('Current user:', req.user._id);
    console.log('Are they the same?', post.author.toString() === req.user._id.toString());
    
    const comment = new Comment({
      post: req.params.postId,
      author: req.user._id,
      content
    });
    await comment.save();
    // Centralized badge evaluation for all badges
    const User = require('../models/User');
    await User.evaluateAndAwardBadges(req.user._id, req);
    
    console.log('✅ Comment saved successfully');
    
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
    
    res.status(201).json({ comment });
  } catch (err) {
    console.error('❌ Error in comments route:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a comment (protected)
router.delete('/:commentId', auth.protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    // Only author (or admin) can delete
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    await comment.deleteOne();
    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;