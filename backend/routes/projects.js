const express = require('express');
const { body, query } = require('express-validator');
const asyncHandler = require('../utils/asyncHandler');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const Project = require('../models/Project');
const User = require('../models/User');

const router = express.Router();

// @desc    Get all projects (with pagination and filters)
// @route   GET /api/projects
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
    .isIn(['web', 'mobile', 'desktop', 'api', 'library', 'tool', 'game', 'other'])
    .withMessage('Invalid category'),
  query('status')
    .optional()
    .isIn(['in-progress', 'completed', 'archived', 'planning'])
    .withMessage('Invalid status'),
  query('owner')
    .optional()
    .isMongoId()
    .withMessage('Invalid owner ID'),
  query('technologies')
    .optional()
    .isString()
    .withMessage('Technologies must be a string'),
  query('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean')
], validate, optionalAuth, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = { isPublic: true };

  // Search functionality
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by owner
  if (req.query.owner) {
    query.owner = req.query.owner;
  }

  // Filter by technologies
  if (req.query.technologies) {
    const technologies = req.query.technologies.split(',').map(tech => tech.trim());
    query.technologies = { $in: technologies };
  }

  // Filter by featured
  if (req.query.featured !== undefined) {
    query.featured = req.query.featured === 'true';
  }

  const projects = await Project.find(query)
    .populate('owner', 'username firstName lastName avatar')
    .populate('collaborators.user', 'username firstName lastName avatar')
    .sort(req.query.search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Project.countDocuments(query);

  res.json({
    success: true,
    data: projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('owner', 'username firstName lastName avatar bio')
    .populate('collaborators.user', 'username firstName lastName avatar')
    .populate('likes', 'username firstName lastName avatar');

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if project is public or user has access
  if (!project.isPublic && (!req.user || project.owner._id.toString() !== req.user._id.toString())) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Increment views
  await project.incrementViews();

  // Check if current user liked the project
  let isLiked = false;
  if (req.user) {
    isLiked = project.likes.some(like => like._id.toString() === req.user._id.toString());
  }

  res.json({
    success: true,
    data: {
      ...project.toObject(),
      isLiked
    }
  });
}));

// @desc    Create project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must be less than 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and must be less than 1000 characters'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('category')
    .optional()
    .isIn(['web', 'mobile', 'desktop', 'api', 'library', 'tool', 'game', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['in-progress', 'completed', 'archived', 'planning'])
    .withMessage('Invalid status'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Live URL must be valid'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('screenshots')
    .optional()
    .isArray()
    .withMessage('Screenshots must be an array'),
  body('collaborators')
    .optional()
    .isArray()
    .withMessage('Collaborators must be an array')
], validate, asyncHandler(async (req, res) => {
  const {
    title,
    description,
    shortDescription,
    category,
    status,
    technologies,
    githubUrl,
    liveUrl,
    image,
    tags,
    screenshots,
    collaborators
  } = req.body;

  // Debug: Log received collaborators
  console.log('Received collaborators:', collaborators);

  // Prepare collaborators array for the project
  let collaboratorsArr = [];
  let addedUserIds = new Set(); // Track added user IDs
  if (Array.isArray(collaborators) && collaborators.length > 0) {
    for (const identifier of collaborators) {
      // Try to find user by username or email
      const user = await User.findOne({
        $or: [
          { username: identifier },
          { email: identifier }
        ]
      });
      if (user) {
        if (!addedUserIds.has(user._id.toString())) { // Only add if not already present
          collaboratorsArr.push({ user: user._id, role: 'developer' });
          addedUserIds.add(user._id.toString());
          // Debug: Log found user
          console.log('Added collaborator:', user.username || user.email, user._id);
        } else {
          // Debug: Log duplicate
          console.log('Duplicate collaborator skipped:', user.username || user.email, user._id);
        }
      } else {
        // Debug: Log not found
        console.log('Collaborator not found:', identifier);
      }
    }
  }

  const project = await Project.create({
    owner: req.user._id,
    title,
    description,
    shortDescription: shortDescription || description.substring(0, 200),
    category: category || 'web',
    status: status || 'completed',
    technologies: technologies || [],
    githubUrl: githubUrl || '',
    liveUrl: liveUrl || '',
    image: image || '',
    tags: tags || [],
    screenshots: screenshots || [],
    collaborators: collaboratorsArr
  });

  await project.populate('owner', 'username firstName lastName avatar');

  res.status(201).json({
    success: true,
    data: project
  });
}));

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (own projects only)
router.put('/:id', protect, [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('shortDescription')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Short description cannot exceed 200 characters'),
  body('category')
    .optional()
    .isIn(['web', 'mobile', 'desktop', 'api', 'library', 'tool', 'game', 'other'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['in-progress', 'completed', 'archived', 'planning'])
    .withMessage('Invalid status'),
  body('technologies')
    .optional()
    .isArray()
    .withMessage('Technologies must be an array'),
  body('githubUrl')
    .optional()
    .isURL()
    .withMessage('GitHub URL must be valid'),
  body('liveUrl')
    .optional()
    .isURL()
    .withMessage('Live URL must be valid'),
  body('image')
    .optional()
    .isURL()
    .withMessage('Image URL must be valid'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('screenshots')
    .optional()
    .isArray()
    .withMessage('Screenshots must be an array'),
  body('collaborators')
    .optional()
    .isArray()
    .withMessage('Collaborators must be an array')
], validate, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user owns the project
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this project'
    });
  }

  // Update fields
  const fieldsToUpdate = [
    'title', 'description', 'shortDescription', 'category', 'status',
    'technologies', 'githubUrl', 'liveUrl', 'image', 'tags', 'screenshots'
  ];

  fieldsToUpdate.forEach(field => {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  });

  // Update collaborators if provided
  if (req.body.collaborators !== undefined) {
    let collaboratorsArr = [];
    let addedUserIds = new Set();
    const collaborators = req.body.collaborators;
    if (Array.isArray(collaborators) && collaborators.length > 0) {
      for (const identifier of collaborators) {
        // Try to find user by username or email
        const user = await User.findOne({
          $or: [
            { username: identifier },
            { email: identifier }
          ]
        });
        if (user) {
          if (!addedUserIds.has(user._id.toString())) {
            collaboratorsArr.push({ user: user._id, role: 'developer' });
            addedUserIds.add(user._id.toString());
            // Debug: Log found user
            console.log('Added collaborator (update):', user.username || user.email, user._id);
          } else {
            // Debug: Log duplicate
            console.log('Duplicate collaborator skipped (update):', user.username || user.email, user._id);
          }
        } else {
          // Debug: Log not found
          console.log('Collaborator not found (update):', identifier);
        }
      }
    }
    project.collaborators = collaboratorsArr;
  }

  // Update short description if description changed
  if (req.body.description && !req.body.shortDescription) {
    project.shortDescription = req.body.description.substring(0, 200);
  }

  const updatedProject = await project.save();
  await updatedProject.populate('owner', 'username firstName lastName avatar');

  res.json({
    success: true,
    data: updatedProject
  });
}));

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (own projects only)
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user owns the project
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this project'
    });
  }

  await project.deleteOne();

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// @desc    Like/Unlike project
// @route   POST /api/projects/:id/like
// @access  Private
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  const isLiked = project.likes.includes(req.user._id);

  if (isLiked) {
    // Unlike
    await project.removeLike(req.user._id);
    res.json({
      success: true,
      message: 'Project unliked',
      data: {
        isLiked: false,
        likesCount: project.likesCount
      }
    });
  } else {
    // Like
    await project.addLike(req.user._id);
    // Create notification for project owner (if not liking own project)
    if (project.owner.toString() !== req.user._id.toString()) {
      const NotificationService = require('../utils/notificationService');
      const notificationService = new NotificationService(req.app.get('io'));
      await notificationService.createLikeProjectNotification(
        req.user._id,
        project.owner,
        project._id,
        project.title
      );
    }
    res.json({
      success: true,
      message: 'Project liked',
      data: {
        isLiked: true,
        likesCount: project.likesCount
      }
    });
  }
}));

// @desc    Add collaborator to project
// @route   POST /api/projects/:id/collaborators
// @access  Private (project owner only)
router.post('/:id/collaborators', protect, [
  body('userId')
    .isMongoId()
    .withMessage('Valid user ID is required'),
  body('role')
    .optional()
    .isIn(['developer', 'designer', 'tester', 'manager'])
    .withMessage('Invalid role')
], validate, asyncHandler(async (req, res) => {
  const { userId, role = 'developer' } = req.body;

  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user owns the project
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to manage collaborators'
    });
  }

  await project.addCollaborator(userId, role);
  await project.populate('collaborators.user', 'username firstName lastName avatar');

  // Notify the invited collaborator
  try {
    const NotificationService = require('../utils/notificationService');
    const notificationService = new NotificationService(req.app.get('io'));
    await notificationService.createProjectInviteNotification(
      req.user._id, // inviter
      userId, // invitee
      project._id,
      project.title
    );
  } catch (error) {
    console.error('Error sending project invite notification:', error);
  }

  res.json({
    success: true,
    message: 'Collaborator added successfully',
    data: project.collaborators
  });
}));

// @desc    Remove collaborator from project
// @route   DELETE /api/projects/:id/collaborators/:userId
// @access  Private (project owner only)
router.delete('/:id/collaborators/:userId', protect, asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project not found'
    });
  }

  // Check if user owns the project
  if (project.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to manage collaborators'
    });
  }

  await project.removeCollaborator(req.params.userId);
  await project.populate('collaborators.user', 'username firstName lastName avatar');

  res.json({
    success: true,
    message: 'Collaborator removed successfully',
    data: project.collaborators
  });
}));

// @desc    Get user's projects
// @route   GET /api/projects/user/:userId
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

  const projects = await Project.find({
    owner: req.params.userId,
    isPublic: true
  })
  .populate('owner', 'username firstName lastName avatar')
  .populate('collaborators.user', 'username firstName lastName avatar')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await Project.countDocuments({
    owner: req.params.userId,
    isPublic: true
  });

  res.json({
    success: true,
    data: projects,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

module.exports = router; 