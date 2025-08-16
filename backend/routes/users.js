const express = require("express");
const { query } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { cacheMiddleware, userCacheMiddleware, invalidateCache } = require("../middleware/cache");
const User = require("../models/User");
const NotificationService = require("../utils/notificationService");
const multer = require("multer");
const fs = require("fs");
const cloudinary = require("../utils/cloudinary");

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Get all users (with pagination and search)
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
    query("skills")
      .optional()
      .isString()
      .withMessage("Skills must be a string"),
  ],
  validate,
  auth.optionalAuth,
  cacheMiddleware(1800),
  asyncHandler(async (req, res) => {
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
      const skills = req.query.skills.split(",").map((skill) => skill.trim());
      query.skills = { $in: skills };
    }

    const users = await User.find(query)
      .select(
        "username firstName lastName avatar bio skills location company followersCount followingCount followers socialLinks"
      )
      .sort(
        req.query.search ? { score: { $meta: "textScore" } } : { createdAt: -1 }
      )
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Populate followers and following for each user
    const usersWithVirtuals = users.map((u) => {
      const obj = u.toObject({ virtuals: true });
      let isFollowing = false;
      if (req.user) {
        isFollowing = u.followers.some(
          (f) => f.toString() === req.user._id.toString()
        );
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
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// Get user by ID
router.get(
  "/:id",
  auth.optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username firstName lastName avatar")
      .populate("following", "username firstName lastName avatar");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current user is following this user
    const userObj = user.toObject({ virtuals: true });

    res.json({
      success: true,
      data: {
        ...userObj,
        badges: userObj.badges || [],
        profileCompletion: userObj.profileCompletion || 0,
      },
    });
  })
);

// Update user profile
router.put(
  "/:id",
  auth.protect,
  invalidateCache(["users", "search"]),
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update fields
    const fieldsToUpdate = [
      "firstName",
      "lastName",
      "bio",
      "location",
      "company",
      "skills",
      "socialLinks",
      "avatar",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    const updatedUser = await user.save();

    // Badge: Profile Completed 100%
    if (updatedUser.profileCompletion === 100) {
      await updatedUser.addBadge("profile_complete", req);
    }

    res.json({
      success: true,
      data: updatedUser,
    });
  })
);

// Follow user
router.post(
  "/:id/follow",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User to follow not found",
      });
    }

    // Check if already following
    if (currentUser.following.includes(userToFollow._id)) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    // Add to following
    currentUser.following.push(userToFollow._id);
    await currentUser.save();

    // Add to followers
    userToFollow.followers.push(currentUser._id);
    await userToFollow.save();

    // Create notification for the followed user
    const notificationService = new NotificationService(req.app.get("io"));
    await notificationService.createFollowNotification(
      currentUser._id,
      userToFollow._id
    );
    // Centralized badge evaluation for all badges
    await User.evaluateAndAwardBadges(userToFollow._id, req);

    const updatedUserToFollow = await User.findById(userToFollow._id)
      .select("-password")
      .populate("followers", "username firstName lastName avatar")
      .populate("following", "username firstName lastName avatar");

    res.json({
      success: true,
      message: "Successfully followed user",
      data: {
        ...updatedUserToFollow.toObject({ virtuals: true }),
        isFollowing: true,
      },
    });
  })
);

// Unfollow user
router.delete(
  "/:id/follow",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        message: "User to unfollow not found",
      });
    }

    // Check if following
    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res.status(400).json({
        success: false,
        message: "Not following this user",
      });
    }

    // Remove from following
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollow._id.toString()
    );
    await currentUser.save();

    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );
    await userToUnfollow.save();

    const updatedUserToUnfollow = await User.findById(userToUnfollow._id)
      .select("-password")
      .populate("followers", "username firstName lastName avatar")
      .populate("following", "username firstName lastName avatar");

    res.json({
      success: true,
      message: "Successfully unfollowed user",
      data: {
        ...updatedUserToUnfollow.toObject({ virtuals: true }),
        isFollowing: false,
      },
    });
  })
);

// Get user's followers
router.get(
  "/:id/followers",
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

    const user = await User.findById(req.params.id).populate({
      path: "followers",
      select: "username firstName lastName avatar bio location company",
      options: {
        skip,
        limit,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// Get user's following
router.get(
  "/:id/following",
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

    const user = await User.findById(req.params.id).populate({
      path: "following",
      select: "username firstName lastName avatar bio location company",
      options: {
        skip,
        limit,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
        pages: Math.ceil(total / limit),
      },
    });
  })
);

// Get suggested users to follow
router.get(
  "/suggestions",
  auth.protect,
  [
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    // Get users that the current user is not following
    const currentUser = await User.findById(req.user._id);

    const suggestedUsers = await User.find({
      _id: {
        $nin: [...currentUser.following, currentUser._id],
      },
    })
      .select(
        "username firstName lastName avatar bio location company followersCount"
      )
      .sort({ followersCount: -1, createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: suggestedUsers,
    });
  })
);

// Save a post
router.post(
  "/:id/save",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const { postId } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
    }
    res.json({ success: true, message: "Post saved" });
  })
);

// Unsave a post
router.delete(
  "/:id/save/:postId",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id);
    user.savedPosts = user.savedPosts.filter(
      (pid) => pid.toString() !== req.params.postId
    );
    await user.save();
    res.json({ success: true, message: "Post unsaved" });
  })
);

// Get all saved posts
router.get(
  "/:id/saved",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id)
      .populate({
        path: "savedPosts",
        populate: {
          path: "author",
          select: "firstName lastName username avatar",
        },
      })
      .populate({
        path: "savedDiscussions",
        populate: {
          path: "author",
          select: "firstName lastName username avatar",
        },
      });

    // Add isSaved: true to all posts since they are from the saved posts list
    const savedPostsWithFlag = user.savedPosts.map((post) => ({
      ...post.toObject(),
      isSaved: true,
      type: "post",
    }));

    // Add isSaved: true to all discussions since they are from the saved discussions list
    const savedDiscussionsWithFlag = user.savedDiscussions.map((discussion) => ({
      ...discussion.toObject(),
      isSaved: true,
      type: "discussion",
    }));

    // Combine and sort by creation date
    const allSavedItems = [...savedPostsWithFlag, ...savedDiscussionsWithFlag].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({ success: true, data: allSavedItems });
  })
);

// SETTINGS ENDPOINTS

// Get privacy settings
router.get(
  "/:id/privacy",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id).select(
      "isPrivate allowMessagesFrom allowFollowsFrom"
    );
    res.json({ success: true, data: user });
  })
);

// Update privacy settings
router.put(
  "/:id/privacy",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const { isPrivate, allowMessagesFrom, allowFollowsFrom } = req.body;
    const user = await User.findById(req.user._id);
    if (isPrivate !== undefined) user.isPrivate = isPrivate;
    if (allowMessagesFrom) user.allowMessagesFrom = allowMessagesFrom;
    if (allowFollowsFrom) user.allowFollowsFrom = allowFollowsFrom;
    await user.save();
    res.json({ success: true, data: user });
  })
);

// Get notification preferences
router.get(
  "/:id/notifications",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id).select("notificationPrefs");
    res.json({ success: true, data: user.notificationPrefs });
  })
);

// Update notification preferences
router.put(
  "/:id/notifications",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const { email, push, marketing } = req.body;
    const user = await User.findById(req.user._id);
    if (email !== undefined) user.notificationPrefs.email = email;
    if (push !== undefined) user.notificationPrefs.push = push;
    if (marketing !== undefined) user.notificationPrefs.marketing = marketing;
    await user.save();
    res.json({ success: true, data: user.notificationPrefs });
  })
);

// Get connected accounts
router.get(
  "/:id/connected-accounts",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id).select("socialLinks");
    res.json({ success: true, data: user.socialLinks });
  })
);

// Update connected accounts
router.put(
  "/:id/connected-accounts",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const { github, linkedin, twitter, website } = req.body;
    const user = await User.findById(req.user._id);
    if (github !== undefined) user.socialLinks.github = github;
    if (linkedin !== undefined) user.socialLinks.linkedin = linkedin;
    if (twitter !== undefined) user.socialLinks.twitter = twitter;
    if (website !== undefined) user.socialLinks.website = website;
    await user.save();
    res.json({ success: true, data: user.socialLinks });
  })
);

// Get theme
router.get(
  "/:id/theme",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id).select("theme");
    res.json({ success: true, data: user.theme });
  })
);

// Update theme
router.put(
  "/:id/theme",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const { theme } = req.body;
    const user = await User.findById(req.user._id);
    if (theme) user.theme = theme;
    await user.save();
    res.json({ success: true, data: user.theme });
  })
);

// Delete/deactivate account
router.delete(
  "/:id",
  auth.protect,
  asyncHandler(async (req, res) => {
    if (req.params.id !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }
    const user = await User.findById(req.user._id);
    user.isActive = false;
    user.deletedAt = new Date();
    await user.save();
    res.json({ success: true, message: "Account deactivated/deleted" });
  })
);

// Get user by username
router.get(
  "/username/:username",
  auth.optionalAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .populate("followers", "username firstName lastName avatar")
      .populate("following", "username firstName lastName avatar");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (req.user) {
      isFollowing = user.followers.some(
        (f) => f._id.toString() === req.user._id.toString()
      );
    }

    res.json({
      success: true,
      data: {
        ...user.toObject({ virtuals: true }),
        isFollowing,
      },
    });
  })
);

// Upload and update user profile picture (avatar)
router.post(
  "/avatar",
  auth.protect,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    try {
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "devlink-avatars",
        width: 300,
        height: 300,
        crop: "fill",
        gravity: "face",
      });

      fs.unlinkSync(req.file.path);

      req.user.avatar = result.secure_url;
      await req.user.save();
      res.json({ success: true, avatar: result.secure_url });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Avatar upload failed",
        error: err.message,
      });
    }
  })
);

// Search users for collaborator suggestions
router.get(
  "/search/collaborators",
  [
    query("q")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Search query must be between 1 and 100 characters"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage("Limit must be between 1 and 20"),
    query("excludeIds")
      .optional()
      .isString()
      .withMessage("Exclude IDs must be a comma-separated string"),
  ],
  validate,
  auth.protect,
  asyncHandler(async (req, res) => {
    const { q, limit = 10, excludeIds } = req.query;
    
    // Build search query
    const searchQuery = {
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { 
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: q,
              options: "i"
            }
          }
        }
      ]
    };

    // Exclude current user and already added collaborators
    const excludeUserIds = [req.user._id.toString()];
    if (excludeIds) {
      excludeUserIds.push(...excludeIds.split(","));
    }
    
    if (excludeUserIds.length > 0) {
      searchQuery._id = { $nin: excludeUserIds };
    }

    const users = await User.find(searchQuery)
      .select("username firstName lastName email avatar bio skills")
      .limit(parseInt(limit))
      .sort({ username: 1 });

    const suggestions = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      bio: user.bio,
      skills: user.skills,
      displayText: `${user.username} (${user.firstName} ${user.lastName})`
    }));

    res.json({
      success: true,
      data: suggestions
    });
  })
);

module.exports = router;
