const express = require('express');
const { body, query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Chat = require('../models/Chat');
const User = require('../models/User');

const router = express.Router();

// @desc    Get user's chats
// @route   GET /api/chat
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const chats = await Chat.getUserChats(req.user._id);

  res.json({
    success: true,
    data: chats
  });
}));

// @desc    Get chat by ID
// @route   GET /api/chat/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id)
    .populate('participants', 'username firstName lastName avatar')
    .populate('messages.sender', 'username firstName lastName avatar')
    .populate('groupAdmin', 'username firstName lastName');

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is a participant
  if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Mark messages as read
  await chat.markAsRead(req.user._id);

  res.json({
    success: true,
    data: chat
  });
}));

// @desc    Create or get chat with user
// @route   POST /api/chat/start
// @access  Private
router.post('/start', protect, [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
], validate, asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (userId === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'Cannot start chat with yourself'
    });
  }

  // Check if user exists
  const otherUser = await User.findById(userId);
  if (!otherUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Find or create chat
  const chat = await Chat.findOrCreateChat(req.user._id, userId);

  res.json({
    success: true,
    data: chat
  });
}));

// @desc    Send message to chat
// @route   POST /api/chat/:id/messages
// @access  Private
router.post('/:id/messages', protect, [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content is required and must be less than 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage('Invalid message type'),
  body('fileUrl')
    .optional()
    .isURL()
    .withMessage('File URL must be valid'),
  body('fileName')
    .optional()
    .isString()
    .withMessage('File name must be a string')
], validate, asyncHandler(async (req, res) => {
  const { content, messageType = 'text', fileUrl = '', fileName = '' } = req.body;

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is a participant
  if (!chat.participants.includes(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Add message
  await chat.addMessage(req.user._id, content, messageType, fileUrl, fileName);
  await chat.populate('messages.sender', 'username firstName lastName avatar');

  const newMessage = chat.messages[chat.messages.length - 1];

  res.status(201).json({
    success: true,
    data: newMessage
  });
}));

// @desc    Mark chat as read
// @route   PUT /api/chat/:id/read
// @access  Private
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  // Check if user is a participant
  if (!chat.participants.includes(req.user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  await chat.markAsRead(req.user._id);

  res.json({
    success: true,
    message: 'Chat marked as read'
  });
}));

// @desc    Get unread count for user
// @route   GET /api/chat/unread/count
// @access  Private
router.get('/unread/count', protect, asyncHandler(async (req, res) => {
  const chats = await Chat.find({
    participants: { $in: [req.user._id] }
  });

  let totalUnread = 0;
  const unreadCounts = {};

  for (const chat of chats) {
    const unreadCount = chat.getUnreadCount(req.user._id);
    if (unreadCount > 0) {
      unreadCounts[chat._id.toString()] = unreadCount;
      totalUnread += unreadCount;
    }
  }

  res.json({
    success: true,
    data: {
      totalUnread,
      unreadCounts
    }
  });
}));

// @desc    Create group chat
// @route   POST /api/chat/group
// @access  Private
router.post('/group', protect, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name is required and must be less than 100 characters'),
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participants.*')
    .isMongoId()
    .withMessage('All participants must be valid user IDs')
], validate, asyncHandler(async (req, res) => {
  const { name, participants } = req.body;

  // Add current user to participants if not already included
  const allParticipants = [...new Set([...participants, req.user._id.toString()])];

  // Check if all participants exist
  const users = await User.find({ _id: { $in: allParticipants } });
  if (users.length !== allParticipants.length) {
    return res.status(400).json({
      success: false,
      message: 'One or more participants not found'
    });
  }

  const chat = new Chat({
    participants: allParticipants,
    isGroupChat: true,
    groupName: name,
    groupAdmin: req.user._id,
    messages: [],
    unreadCount: new Map()
  });

  await chat.save();
  await chat.populate('participants', 'username firstName lastName avatar');
  await chat.populate('groupAdmin', 'username firstName lastName');

  res.status(201).json({
    success: true,
    data: chat
  });
}));

// @desc    Add participant to group chat
// @route   POST /api/chat/:id/participants
// @access  Private (group admin only)
router.post('/:id/participants', protect, [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
], validate, asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      success: false,
      message: 'This is not a group chat'
    });
  }

  // Check if user is group admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only group admin can add participants'
    });
  }

  // Check if user is already a participant
  if (chat.participants.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is already a participant'
    });
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  chat.participants.push(userId);
  await chat.save();
  await chat.populate('participants', 'username firstName lastName avatar');

  res.json({
    success: true,
    message: 'Participant added successfully',
    data: chat
  });
}));

// @desc    Remove participant from group chat
// @route   DELETE /api/chat/:id/participants/:userId
// @access  Private (group admin only)
router.delete('/:id/participants/:userId', protect, asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      success: false,
      message: 'This is not a group chat'
    });
  }

  // Check if user is group admin
  if (chat.groupAdmin.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Only group admin can remove participants'
    });
  }

  // Check if user is a participant
  if (!chat.participants.includes(req.params.userId)) {
    return res.status(400).json({
      success: false,
      message: 'User is not a participant'
    });
  }

  // Remove participant
  chat.participants = chat.participants.filter(
    id => id.toString() !== req.params.userId
  );

  await chat.save();
  await chat.populate('participants', 'username firstName lastName avatar');

  res.json({
    success: true,
    message: 'Participant removed successfully',
    data: chat
  });
}));

// @desc    Leave group chat
// @route   DELETE /api/chat/:id/leave
// @access  Private
router.delete('/:id/leave', protect, asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'Chat not found'
    });
  }

  if (!chat.isGroupChat) {
    return res.status(400).json({
      success: false,
      message: 'This is not a group chat'
    });
  }

  // Check if user is a participant
  if (!chat.participants.includes(req.user._id)) {
    return res.status(400).json({
      success: false,
      message: 'You are not a participant in this chat'
    });
  }

  // Remove user from participants
  chat.participants = chat.participants.filter(
    id => id.toString() !== req.user._id.toString()
  );

  // If no participants left, delete the chat
  if (chat.participants.length === 0) {
    await chat.deleteOne();
    return res.json({
      success: true,
      message: 'Chat deleted (no participants left)'
    });
  }

  // If group admin is leaving, assign admin to first remaining participant
  if (chat.groupAdmin.toString() === req.user._id.toString()) {
    chat.groupAdmin = chat.participants[0];
  }

  await chat.save();

  res.json({
    success: true,
    message: 'Left group chat successfully'
  });
}));

// @desc    Delete a message from a chat
// @route   DELETE /api/chat/:chatId/messages/:messageId
// @access  Private (sender or group admin)
router.delete('/:chatId/messages/:messageId', protect, asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }
  // Check if user is a participant
  if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  try {
    await chat.deleteMessage(messageId, req.user._id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (err) {
    res.status(403).json({ success: false, message: err.message });
  }
}));

// @desc    Get messages for a chat with pagination
// @route   GET /api/chat/:id/messages
// @access  Private
router.get('/:id/messages', protect, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const chat = await Chat.findById(req.params.id)
    .populate('messages.sender', 'username firstName lastName avatar');

  if (!chat) {
    return res.status(404).json({ success: false, message: 'Chat not found' });
  }

  // Check if user is a participant
  if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  // Sort messages by createdAt descending
  const sortedMessages = [...chat.messages].sort((a, b) => b.createdAt - a.createdAt);
  const paginatedMessages = sortedMessages.slice(skip, skip + limit);

  res.json({
    success: true,
    data: paginatedMessages,
    pagination: {
      page,
      limit,
      total: sortedMessages.length,
      pages: Math.ceil(sortedMessages.length / limit)
    }
  });
}));

module.exports = router; 