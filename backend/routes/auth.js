const express = require("express");
const { body } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const generateToken = require("../utils/generateToken");
const User = require("../models/User");

const router = express.Router();

// Register user
router.post(
  "/register",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be between 3 and 30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("firstName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage(
        "First name is required and must be less than 50 characters"
      ),
    body("lastName")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name is required and must be less than 50 characters"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "This email is already registered. Please try logging in instead."
            : "This username is already taken. Please choose a different username.",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          skills: user.skills,
          socialLinks: user.socialLinks,
          location: user.location,
          company: user.company,
          role: user.role,
          isVerified: user.isVerified,
          followersCount: user.followersCount,
          followingCount: user.followingCount,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid user data",
      });
    }
  })
);

// Login user
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email not found. Please check your email address or create a new account.",
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // --- LOGIN STREAK LOGIC ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streakUpdated = false;
    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.loginStreak += 1;
        streakUpdated = true;
      } else if (diffDays > 1) {
        user.loginStreak = 1;
        streakUpdated = true;
      }
    } else {
      user.loginStreak = 1;
      streakUpdated = true;
    }
    if (streakUpdated || !user.lastLoginDate) {
      user.lastLoginDate = today;
      await user.save();
    }
    // Award Streak Master badge if streak is 7 or more
    if (user.loginStreak >= 7) {
      await user.addBadge("streak_master", req);
    }
    // Centralized badge evaluation for all badges
    await User.evaluateAndAwardBadges(user._id, req);

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        skills: user.skills,
        socialLinks: user.socialLinks,
        location: user.location,
        company: user.company,
        role: user.role,
        isVerified: user.isVerified,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        token: generateToken(user._id),
      },
    });
  })
);

// Get current user profile
router.get(
  "/profile",
  auth.protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate("followers", "username firstName lastName avatar")
      .populate("following", "username firstName lastName avatar");

    res.json({
      success: true,
      data: user,
    });
  })
);

// Update user profile
router.put(
  "/profile",
  auth.protect,
  [
    body("firstName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("First name must be between 1 and 50 characters"),
    body("lastName")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Last name must be between 1 and 50 characters"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Bio cannot exceed 500 characters"),
    body("location")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Location cannot exceed 100 characters"),
    body("company")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Company cannot exceed 100 characters"),
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("socialLinks.github")
      .optional()
      .isURL()
      .withMessage("GitHub URL must be valid"),
    body("socialLinks.linkedin")
      .optional()
      .isURL()
      .withMessage("LinkedIn URL must be valid"),
    body("socialLinks.twitter")
      .optional()
      .isURL()
      .withMessage("Twitter URL must be valid"),
    body("socialLinks.website")
      .optional()
      .isURL()
      .withMessage("Website URL must be valid"),
  ],
  validate,
  asyncHandler(async (req, res) => {
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

    res.json({
      success: true,
      data: updatedUser,
    });
  })
);

// Change password
router.put(
  "/change-password",
  auth.protect,
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters long"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  })
);

// Forgot password
router.post(
  "/forgot-password",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address. Please check your email or create a new account.",
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save();

    // TODO: Send email with reset token
    // For now, just return the token
    res.json({
      success: true,
      message: "Password reset email sent successfully! Check your inbox for the reset link.",
      resetToken:
        process.env.NODE_ENV === "development" ? resetToken : undefined,
    });
  })
);

// Reset password
router.put(
  "/reset-password/:resetToken",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = password;
    user.clearResetPasswordToken();
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  })
);

module.exports = router;
