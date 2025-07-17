const express = require('express');
const { query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const User = require('../models/User');
const NotificationService = require('../utils/notificationService');

const router = express.Router();

// @desc    Get all users (with pagination and search)
// @route   GET /api/users
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
  query('skills')
    .optional()
    .isString()
    .withMessage('Skills must be a string')
], validate, auth.optionalAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = {};

  // Search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by skills
  if (req.query.skills) {
    const skills = req.query.skills.split(',').map(skill => skill.trim());
    query.skills = { $in: skills };
  }

  const users = await User.find(query)
    .select('username firstName lastName avatar bio skills location company followersCount followingCount followers socialLinks')
    .sort(req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  // Ensure virtuals are included
  const usersWithVirtuals = users.map(u => {
    const obj = u.toObject({ virtuals: true });
    let isFollowing = false;
    if (req.user) {
      isFollowing = u.followers.some(f => f.toString() === req.user._id.toString());
    }
    obj.isFollowing = isFollowing;
    return obj;
  });

  res.json({
    success: true,
    data: usersWithVirtuals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Public
router.get('/:id', auth.optionalAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('followers', 'username firstName lastName avatar')
    .populate('following', 'username firstName lastName avatar');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if current user is following this user
  let isFollowing = false;
  if (req.user) {
    isFollowing = user.followers.some(f => f._id.toString() === req.user._id.toString());
  }

  res.json({
    success: true,
    data: {
      ...user.toObject({ virtuals: true }),
      isFollowing
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (own profile only)
router.put('/:id', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this profile'
    });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update fields
  const fieldsToUpdate = [
    'firstName', 'lastName', 'bio', 'location', 'company', 
    'skills', 'socialLinks', 'avatar'
  ];

  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  const updatedUser = await user.save();

  res.json({
    success: true,
    data: updatedUser
  });
}));

// @desc    Follow user
// @route   POST /api/users/:id/follow
// @access  Private
router.post('/:id/follow', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot follow yourself'
    });
  }

  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user._id);

  if (!userToFollow) {
    return res.status(404).json({
      success: false,
      message: 'User to follow not found'
    });
  }

  // Check if already following
  if (currentUser.following.includes(userToFollow._id)) {
    return res.status(400).json({
      success: false,
      message: 'Already following this user'
    });
  }

  // Add to following
  currentUser.following.push(userToFollow._id);
  await currentUser.save();

  // Add to followers
  userToFollow.followers.push(currentUser._id);
  await userToFollow.save();

  // Create notification for the followed user
  const notificationService = new NotificationService(req.app.get('io'));
  await notificationService.createFollowNotification(
    currentUser._id,
    userToFollow._id
  );

  // Fetch updated user to follow (with virtuals and population)
  const updatedUserToFollow = await User.findById(userToFollow._id)
    .select('-password')
    .populate('followers', 'username firstName lastName avatar')
    .populate('following', 'username firstName lastName avatar');

  res.json({
    success: true,
    message: 'Successfully followed user',
    data: {
      ...updatedUserToFollow.toObject({ virtuals: true }),
      isFollowing: true
    }
  });
}));

// @desc    Unfollow user
// @route   DELETE /api/users/:id/follow
// @access  Private
router.delete('/:id/follow', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot unfollow yourself'
    });
  }

  const userToUnfollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user._id);

  if (!userToUnfollow) {
    return res.status(404).json({
      success: false,
      message: 'User to unfollow not found'
    });
  }

  // Check if following
  if (!currentUser.following.includes(userToUnfollow._id)) {
    return res.status(400).json({
      success: false,
      message: 'Not following this user'
    });
  }

  // Remove from following
  currentUser.following = currentUser.following.filter(
    id => id.toString() !== userToUnfollow._id.toString()
  );
  await currentUser.save();

  // Remove from followers
  userToUnfollow.followers = userToUnfollow.followers.filter(
    id => id.toString() !== currentUser._id.toString()
  );
  await userToUnfollow.save();

  // Fetch updated user to unfollow (with virtuals and population)
  const updatedUserToUnfollow = await User.findById(userToUnfollow._id)
    .select('-password')
    .populate('followers', 'username firstName lastName avatar')
    .populate('following', 'username firstName lastName avatar');

  res.json({
    success: true,
    message: 'Successfully unfollowed user',
    data: {
      ...updatedUserToUnfollow.toObject({ virtuals: true }),
      isFollowing: false
    }
  });
}));

// @desc    Get user's followers
// @route   GET /api/users/:id/followers
// @access  Public
router.get('/:id/followers', [
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

  const user = await User.findById(req.params.id)
    .populate({
      path: 'followers',
      select: 'username firstName lastName avatar bio location company',
      options: {
        skip,
        limit
      }
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const total = user.followersCount;

  res.json({
    success: true,
    data: user.followers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get user's following
// @route   GET /api/users/:id/following
// @access  Public
router.get('/:id/following', [
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

  const user = await User.findById(req.params.id)
    .populate({
      path: 'following',
      select: 'username firstName lastName avatar bio location company',
      options: {
        skip,
        limit
      }
    });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const total = user.followingCount;

  res.json({
    success: true,
    data: user.following,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
router.get('/suggestions', auth.protect, [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
], validate, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  // Get users that the current user is not following
  const currentUser = await User.findById(req.user._id);
  
  const suggestedUsers = await User.find({
    _id: { 
      $nin: [...currentUser.following, currentUser._id] 
    }
  })
  .select('username firstName lastName avatar bio location company followersCount')
  .sort({ followersCount: -1, createdAt: -1 })
  .limit(limit);

  res.json({
    success: true,
    data: suggestedUsers
  });
}));

// Save a post
router.post('/:id/save', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }
  const { postId } = req.body
  const user = await User.findById(req.user._id)
  if (!user.savedPosts.includes(postId)) {
    user.savedPosts.push(postId)
    await user.save()
  }
  res.json({ success: true, message: 'Post saved' })
}))

// Unsave a post
router.delete('/:id/save/:postId', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }
  const user = await User.findById(req.user._id)
  user.savedPosts = user.savedPosts.filter(pid => pid.toString() !== req.params.postId)
  await user.save()
  res.json({ success: true, message: 'Post unsaved' })
}))

// Get all saved posts
router.get('/:id/saved', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' })
  }
  const user = await User.findById(req.user._id).populate({
    path: 'savedPosts',
    populate: { path: 'author', select: 'firstName lastName username avatar' }
  })
  res.json({ success: true, data: user.savedPosts })
}))

// SETTINGS ENDPOINTS

// Get privacy settings
router.get('/:id/privacy', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const user = await User.findById(req.user._id).select('isPrivate allowMessagesFrom allowFollowsFrom');
  res.json({ success: true, data: user });
}));

// Update privacy settings
router.put('/:id/privacy', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { isPrivate, allowMessagesFrom, allowFollowsFrom } = req.body;
  const user = await User.findById(req.user._id);
  if (isPrivate !== undefined) user.isPrivate = isPrivate;
  if (allowMessagesFrom) user.allowMessagesFrom = allowMessagesFrom;
  if (allowFollowsFrom) user.allowFollowsFrom = allowFollowsFrom;
  await user.save();
  res.json({ success: true, data: user });
}));

// Get notification preferences
router.get('/:id/notifications', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const user = await User.findById(req.user._id).select('notificationPrefs');
  res.json({ success: true, data: user.notificationPrefs });
}));

// Update notification preferences
router.put('/:id/notifications', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { email, push, marketing } = req.body;
  const user = await User.findById(req.user._id);
  if (email !== undefined) user.notificationPrefs.email = email;
  if (push !== undefined) user.notificationPrefs.push = push;
  if (marketing !== undefined) user.notificationPrefs.marketing = marketing;
  await user.save();
  res.json({ success: true, data: user.notificationPrefs });
}));

// Get connected accounts
router.get('/:id/connected-accounts', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const user = await User.findById(req.user._id).select('socialLinks');
  res.json({ success: true, data: user.socialLinks });
}));

// Update connected accounts
router.put('/:id/connected-accounts', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { github, linkedin, twitter, website } = req.body;
  const user = await User.findById(req.user._id);
  if (github !== undefined) user.socialLinks.github = github;
  if (linkedin !== undefined) user.socialLinks.linkedin = linkedin;
  if (twitter !== undefined) user.socialLinks.twitter = twitter;
  if (website !== undefined) user.socialLinks.website = website;
  await user.save();
  res.json({ success: true, data: user.socialLinks });
}));

// Get theme
router.get('/:id/theme', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const user = await User.findById(req.user._id).select('theme');
  res.json({ success: true, data: user.theme });
}));

// Update theme
router.put('/:id/theme', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const { theme } = req.body;
  const user = await User.findById(req.user._id);
  if (theme) user.theme = theme;
  await user.save();
  res.json({ success: true, data: user.theme });
}));

// Delete/deactivate account
router.delete('/:id', auth.protect, asyncHandler(async (req, res) => {
  if (req.params.id !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  const user = await User.findById(req.user._id);
  user.isActive = false;
  user.deletedAt = new Date();
  await user.save();
  res.json({ success: true, message: 'Account deactivated/deleted' });
}));

// @desc    Get user by username
// @route   GET /api/users/username/:username
// @access  Public
router.get('/username/:username', auth.optionalAuth, asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username })
    .select('-password')
    .populate('followers', 'username firstName lastName avatar')
    .populate('following', 'username firstName lastName avatar');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if current user is following this user
  let isFollowing = false;
  if (req.user) {
    isFollowing = user.followers.some(f => f._id.toString() === req.user._id.toString());
  }

  res.json({
    success: true,
    data: {
      ...user.toObject({ virtuals: true }),
      isFollowing
    }
  });
}));

module.exports = router; 