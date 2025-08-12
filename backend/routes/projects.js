const express = require("express");
const { body, query } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { protect, optionalAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const Project = require("../models/Project");
const User = require("../models/User");

const router = express.Router();

//  Get all projects (with pagination and filters)
router.get(
  "/",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
    query("search")
      .optional()
      .trim()
      .isLength({ min: 1 })
      .withMessage("Search term must not be empty"),
    query("category")
      .optional()
      .isIn([
        "web",
        "mobile",
        "desktop",
        "api",
        "library",
        "tool",
        "game",
        "other",
      ])
      .withMessage("Invalid category"),
    query("status")
      .optional()
      .isIn(["in-progress", "completed", "archived", "planning"])
      .withMessage("Invalid status"),
    query("owner").optional().isMongoId().withMessage("Invalid owner ID"),
    query("technologies")
      .optional()
      .isString()
      .withMessage("Technologies must be a string"),
    query("featured")
      .optional()
      .isBoolean()
      .withMessage("Featured must be a boolean"),
  ],
  validate,
  optionalAuth,
  asyncHandler(async (req, res) => {
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
      const technologies = req.query.technologies
        .split(",")
        .map((tech) => tech.trim());
      query.technologies = { $in: technologies };
    }

    // Filter by featured
    if (req.query.featured !== undefined) {
      query.featured = req.query.featured === "true";
    }

    const projects = await Project.find(query)
      .populate("owner", "username firstName lastName avatar")
      .populate("collaborators.user", "username firstName lastName avatar")
      .sort(
        req.query.search ? { score: { $meta: "textScore" } } : { createdAt: -1 }
      )
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
        pages: Math.ceil(total / limit),
      },
    });
  })
);

//  Get project by ID
router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate("owner", "username firstName lastName avatar bio")
      .populate("collaborators.user", "username firstName lastName avatar")
      .populate("likes", "username firstName lastName avatar");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if project is public or user has access
    if (
      !project.isPublic &&
      (!req.user || project.owner._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await project.incrementViews();

    // Check if current user liked the project
    let isLiked = false;
    if (req.user) {
      isLiked = project.likes.some(
        (like) => like._id.toString() === req.user._id.toString()
      );
    }

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        isLiked,
      },
    });
  })
);

//  Create project
router.post(
  "/",
  protect,
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title is required and must be less than 100 characters")
      .matches(/^[a-zA-Z0-9\s\-_.,!?()]+$/)
      .withMessage("Title contains invalid characters"),
    body("description")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage(
        "Description is required, must be at least 10 characters and less than 1000 characters"
      ),
    body("shortDescription")
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage("Short description must be between 5 and 200 characters"),
    body("category")
      .optional()
      .isIn([
        "web",
        "mobile",
        "desktop",
        "api",
        "library",
        "tool",
        "game",
        "other",
      ])
      .withMessage("Invalid category"),
    body("status")
      .optional()
      .isIn(["in-progress", "completed", "archived", "planning"])
      .withMessage("Invalid status"),
    body("technologies")
      .optional()
      .isArray({ min: 0, max: 20 })
      .withMessage("Technologies must be an array with maximum 20 items"),
    body("technologies.*")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Each technology must be between 1 and 50 characters"),
    body("githubUrl")
      .optional()
      .isURL()
      .matches(/^https:\/\/(www\.)?github\.com\//)
      .withMessage("Must be a valid GitHub URL"),
    body("liveUrl").optional().isURL().withMessage("Live URL must be valid"),
    body("image").optional().isURL().withMessage("Image URL must be valid"),
    body("tags")
      .optional()
      .isArray({ min: 0, max: 10 })
      .withMessage("Tags must be an array with maximum 10 items"),
    body("tags.*")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 30 })
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage(
        "Tags can only contain letters, numbers, spaces, hyphens, and underscores"
      ),
    body("screenshots")
      .optional()
      .isArray({ min: 0, max: 10 })
      .withMessage("Screenshots must be an array with maximum 10 items"),
    body("screenshots.*.url")
      .optional()
      .isURL()
      .withMessage("Screenshot URL must be valid"),
    body("screenshots.*.caption")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Screenshot caption cannot exceed 100 characters"),
    body("collaborators")
      .optional()
      .isArray({ min: 0, max: 10 })
      .withMessage("Collaborators must be an array with maximum 10 items"),
    body("collaborators.*.username")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Username must be between 1 and 100 characters"),
    body("collaborators.*.role")
      .optional()
      .isIn(["developer", "designer", "tester", "manager"])
      .withMessage("Invalid role"),
  ],
  validate,
  asyncHandler(async (req, res) => {
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
      collaborators,
    } = req.body;

    console.log("Received collaborators:", collaborators);

    // Prepare collaborators array for the project
    let collaboratorsArr = [];
    let addedUserIds = new Set();
    if (Array.isArray(collaborators) && collaborators.length > 0) {
      for (const collaborator of collaborators) {
        const user = await User.findOne({
          $or: [{ username: collaborator.username }, { email: collaborator.username }],
        });
        if (user) {
          if (!addedUserIds.has(user._id.toString())) {
            collaboratorsArr.push({ user: user._id, role: collaborator.role || "developer" });
            addedUserIds.add(user._id.toString());
            console.log(
              "Added collaborator:",
              user.username || user.email,
              user._id
            );
          } else {
            console.log(
              "Duplicate collaborator skipped:",
              user.username || user.email,
              user._id
            );
          }
        } else {
          console.log("Collaborator not found:", collaborator.username);
        }
      }
    }

    const project = await Project.create({
      owner: req.user._id,
      title,
      description,
      shortDescription: shortDescription || description.substring(0, 200),
      category: category || "web",
      status: status || "completed",
      technologies: technologies || [],
      githubUrl: githubUrl || "",
      liveUrl: liveUrl || "",
      image: image || "",
      tags: tags || [],
      screenshots: screenshots || [],
      collaborators: collaboratorsArr,
    });

    await project.populate("owner", "username firstName lastName avatar");
    await project.populate("collaborators.user", "username firstName lastName avatar");
    await User.evaluateAndAwardBadges(req.user._id);

    // Track project creation analytics
    try {
      const analyticsData = {
        userId: req.user._id,
        projectId: project._id,
        category: project.category,
        status: project.status,
        hasTechnologies: project.technologies.length > 0,
        hasCollaborators: project.collaborators.length > 0,
        hasImage: !!project.image,
        hasScreenshots: project.screenshots.length > 0,
        hasGitHubUrl: !!project.githubUrl,
        hasLiveUrl: !!project.liveUrl,
        createdAt: new Date(),
      };

      console.log("Project Creation Analytics:", analyticsData);
    } catch (error) {
      console.error("Error tracking project creation analytics:", error);
    }

    res.status(201).json({
      success: true,
      data: project,
    });
  })
);

// Update project
router.put(
  "/:id",
  protect,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be less than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("shortDescription")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Short description cannot exceed 200 characters"),
    body("category")
      .optional()
      .isIn([
        "web",
        "mobile",
        "desktop",
        "api",
        "library",
        "tool",
        "game",
        "other",
      ])
      .withMessage("Invalid category"),
    body("status")
      .optional()
      .isIn(["in-progress", "completed", "archived", "planning"])
      .withMessage("Invalid status"),
    body("technologies")
      .optional()
      .isArray()
      .withMessage("Technologies must be an array"),
    body("githubUrl")
      .optional()
      .isURL()
      .withMessage("GitHub URL must be valid"),
    body("liveUrl").optional().isURL().withMessage("Live URL must be valid"),
    body("image").optional().isURL().withMessage("Image URL must be valid"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("screenshots")
      .optional()
      .isArray()
      .withMessage("Screenshots must be an array"),
    body("collaborators")
      .optional()
      .isArray()
      .withMessage("Collaborators must be an array"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this project",
      });
    }

    // Update fields
    const fieldsToUpdate = [
      "title",
      "description",
      "shortDescription",
      "category",
      "status",
      "technologies",
      "githubUrl",
      "liveUrl",
      "image",
      "tags",
      "screenshots",
    ];

    fieldsToUpdate.forEach((field) => {
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
        for (const collaborator of collaborators) {
          const user = await User.findOne({
            $or: [{ username: collaborator.username }, { email: collaborator.username }],
          });
          if (user) {
            if (!addedUserIds.has(user._id.toString())) {
              collaboratorsArr.push({ user: user._id, role: collaborator.role || "developer" });
              addedUserIds.add(user._id.toString());

              console.log(
                "Added collaborator (update):",
                user.username || user.email,
                user._id
              );
            } else {
              console.log(
                "Duplicate collaborator skipped (update):",
                user.username || user.email,
                user._id
              );
            }
          } else {
            console.log("Collaborator not found (update):", collaborator.username);
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
    await updatedProject.populate(
      "owner",
      "username firstName lastName avatar"
    );

    await User.evaluateAndAwardBadges(req.user._id);

    res.json({
      success: true,
      data: updatedProject,
    });
  })
);

// Delete project
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this project",
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  })
);

//  Like/Unlike project
router.post(
  "/:id/like",
  protect,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const isLiked = project.likes.includes(req.user._id);

    if (isLiked) {
      await project.removeLike(req.user._id);
      res.json({
        success: true,
        message: "Project unliked",
        data: {
          isLiked: false,
          likesCount: project.likesCount,
        },
      });
    } else {
      await project.addLike(req.user._id);
      if (project.owner.toString() !== req.user._id.toString()) {
        const NotificationService = require("../utils/notificationService");
        const notificationService = new NotificationService(req.app.get("io"));
        await notificationService.createLikeProjectNotification(
          req.user._id,
          project.owner,
          project._id,
          project.title
        );
      }
      res.json({
        success: true,
        message: "Project liked",
        data: {
          isLiked: true,
          likesCount: project.likesCount,
        },
      });
    }
  })
);

// Add collaborator to project
router.post(
  "/:id/collaborators",
  protect,
  [
    body("userId").isMongoId().withMessage("Valid user ID is required"),
    body("role")
      .optional()
      .isIn(["developer", "designer", "tester", "manager"])
      .withMessage("Invalid role"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { userId, role = "developer" } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage collaborators",
      });
    }

    await project.addCollaborator(userId, role);
    await project.populate(
      "collaborators.user",
      "username firstName lastName avatar"
    );

    // Notify the invited collaborator
    try {
      const NotificationService = require("../utils/notificationService");
      const notificationService = new NotificationService(req.app.get("io"));
      await notificationService.createProjectInviteNotification(
        req.user._id,
        userId,
        project._id,
        project.title
      );
    } catch (error) {
      console.error("Error sending project invite notification:", error);
    }

    await User.evaluateAndAwardBadges(req.user._id);
    await User.evaluateAndAwardBadges(userId);

    res.json({
      success: true,
      message: "Collaborator added successfully",
      data: project.collaborators,
    });
  })
);

//  Remove collaborator from project
router.delete(
  "/:id/collaborators/:userId",
  protect,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check if user owns the project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage collaborators",
      });
    }

    await project.removeCollaborator(req.params.userId);
    await project.populate(
      "collaborators.user",
      "username firstName lastName avatar"
    );

    res.json({
      success: true,
      message: "Collaborator removed successfully",
      data: project.collaborators,
    });
  })
);

// Get user's projects
router.get(
  "/user/:userId",
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage("Limit must be between 1 and 50"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const projects = await Project.find({
      owner: req.params.userId,
      isPublic: true,
    })
      .populate("owner", "username firstName lastName avatar")
      .populate("collaborators.user", "username firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Project.countDocuments({
      owner: req.params.userId,
      isPublic: true,
    });

    res.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

module.exports = router;
