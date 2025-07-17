const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({
    recipient: req.user._id,
    isDeleted: false
  })
    .populate('sender', 'username firstName lastName avatar')
    .populate('data.postId', 'title')
    .populate('data.projectId', 'title')
    .populate('data.commentId', 'content')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({
    recipient: req.user._id,
    isDeleted: false
  });

  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    }
  });
}));

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const unreadCount = await Notification.getUnreadCount(req.user._id);

  res.json({
    success: true,
    data: { unreadCount }
  });
}));

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await notification.markAsRead();

  res.json({
    success: true,
    data: notification
  });
}));

// @desc    Mark multiple notifications as read
// @route   PUT /api/notifications/mark-read
// @access  Private
router.put('/mark-read', protect, asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({
      success: false,
      message: 'Notification IDs array is required'
    });
  }

  const result = await Notification.markAsRead(notificationIds, req.user._id);

  res.json({
    success: true,
    data: { updatedCount: result.modifiedCount }
  });
}));

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
router.put('/mark-all-read', protect, asyncHandler(async (req, res) => {
  const result = await Notification.markAllAsRead(req.user._id);

  res.json({
    success: true,
    data: { updatedCount: result.modifiedCount }
  });
}));

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found'
    });
  }

  await notification.deleteNotification();

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

// @desc    Delete multiple notifications
// @route   DELETE /api/notifications
// @access  Private
router.delete('/', protect, asyncHandler(async (req, res) => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({
      success: false,
      message: 'Notification IDs array is required'
    });
  }

  const result = await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: req.user._id
    },
    { isDeleted: true }
  );

  res.json({
    success: true,
    data: { deletedCount: result.modifiedCount }
  });
}));

// @desc    Get notification settings
// @route   GET /api/notifications/settings
// @access  Private
router.get('/settings', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('notificationPrefs');

  res.json({
    success: true,
    data: user.notificationPrefs
  });
}));

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
router.put('/settings', protect, asyncHandler(async (req, res) => {
  const { email, push, marketing } = req.body;

  const updateData = {};
  if (typeof email === 'boolean') updateData['notificationPrefs.email'] = email;
  if (typeof push === 'boolean') updateData['notificationPrefs.push'] = push;
  if (typeof marketing === 'boolean') updateData['notificationPrefs.marketing'] = marketing;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true }
  ).select('notificationPrefs');

  res.json({
    success: true,
    data: user.notificationPrefs
  });
}));

module.exports = router; 