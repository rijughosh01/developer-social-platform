const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
      maxlength: [30, "Username cannot exceed 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    socialLinks: {
      github: {
        type: String,
        default: "",
      },
      linkedin: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
    },
    location: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    // Privacy
    isPrivate: {
      type: Boolean,
      default: false,
    },
    allowMessagesFrom: {
      type: String,
      enum: ["everyone", "followers", "noone"],
      default: "everyone",
    },
    allowFollowsFrom: {
      type: String,
      enum: ["everyone", "noone"],
      default: "everyone",
    },
    // Notifications
    notificationPrefs: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    // Theme
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // --- BADGES & REPUTATION ---
    badges: [
      {
        type: String,
      },
    ],
    reputation: {
      type: Number,
      default: 0,
    },

    loginStreak: {
      type: Number,
      default: 0,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for followers count
userSchema.virtual("followersCount").get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual("followingCount").get(function () {
  return this.following ? this.following.length : 0;
});

// Virtual for profile completion percentage
userSchema.virtual("profileCompletion").get(function () {
  let completed = 0;
  let total = 7;
  if (this.username) completed++;
  if (this.email) completed++;
  if (this.firstName) completed++;
  if (this.lastName) completed++;
  if (this.bio && this.bio.length > 0) completed++;
  if (this.avatar && this.avatar.length > 0) completed++;
  if (this.skills && this.skills.length > 0) completed++;

  return Math.round((completed / total) * 100);
});

// Helper: Add badge if not already present
userSchema.methods.addBadge = async function (badge, req = null) {
  if (!this.badges.includes(badge)) {
    this.badges.push(badge);
    await this.save();
    // Send notification if req (with app/io) is provided
    if (req && req.app && req.app.get && req.app.get("io")) {
      const NotificationService = require("../utils/notificationService");
      const notificationService = new NotificationService(req.app.get("io"));
      // Badge details
      const BADGE_DETAILS = {
        first_post: {
          title: "First Post!",
          message: "Congratulations! You earned the First Post badge.",
        },
        top_commenter: {
          title: "Top Commenter!",
          message:
            "You earned the Top Commenter badge for writing 10 comments.",
        },
        forked_10: {
          title: "Code Forked 10+ times!",
          message: "Your code was forked 10 or more times! You earned a badge.",
        },
        streak_master: {
          title: "Streak Master!",
          message:
            "You logged in 7 days in a row and earned the Streak Master badge!",
        },
        helper: {
          title: "Helper!",
          message:
            "You answered 5+ questions/comments and earned the Helper badge!",
        },
        popular_post: {
          title: "Popular Post!",
          message:
            "One of your posts received 50+ likes! You earned the Popular Post badge.",
        },
        project_creator: {
          title: "Project Creator!",
          message:
            "You created 3+ projects and earned the Project Creator badge!",
        },
        collaborator: {
          title: "Collaborator!",
          message:
            "You collaborated on 2+ projects and earned the Collaborator badge!",
        },
        first_like: {
          title: "First Like!",
          message:
            "You received your first like on a post and earned the First Like badge!",
        },
        milestone_100_followers: {
          title: "Milestone!",
          message: "You reached 100 followers and earned the Milestone badge!",
        },
      };
      const badgeInfo = BADGE_DETAILS[badge] || {
        title: "Badge Earned!",
        message: "You earned a new badge.",
      };
      await notificationService.createNotification({
        recipient: this._id,
        sender: this._id,
        type: "badge_earned",
        title: badgeInfo.title,
        message: badgeInfo.message,
        data: { badge },
      });
    }
  }
};

// Centralized badge evaluation and awarding
userSchema.statics.evaluateAndAwardBadges = async function (userId, req) {
  const User = this;
  const user = await User.findById(userId);
  if (!user) return;

  // Helper functions to check badge conditions
  const Post = require("./Post");
  const Comment = require("./Comment");
  const Project = require("./Project");

  // 1. Streak Master: 7+ day login streak
  if (user.loginStreak >= 7) {
    await user.addBadge("streak_master", req);
  }

  // 2. Helper: Answered 5+ questions/comments
  const helperCount = await Comment.countDocuments({ author: user._id });
  if (helperCount >= 5) {
    await user.addBadge("helper", req);
  }

  // 3. Popular Post: Any post with 50+ likes
  const popularPost = await Post.findOne({
    author: user._id,
    likes: { $size: 50 },
  });
  if (popularPost) {
    await user.addBadge("popular_post", req);
  }

  // 4. Project Creator: Created 3+ projects
  const projectCount = await Project.countDocuments({ owner: user._id });
  if (projectCount >= 3) {
    await user.addBadge("project_creator", req);
  }

  // 5. Collaborator: Collaborated on 2+ projects
  const collabCount = await Project.countDocuments({
    "collaborators.user": user._id,
  });
  if (collabCount >= 2) {
    await user.addBadge("collaborator", req);
  }

  // 6. First Like: Received first like on any post
  const firstLikedPost = await Post.findOne({
    author: user._id,
    "likes.0": { $exists: true },
  });
  if (firstLikedPost) {
    await user.addBadge("first_like", req);
  }

  // 7. Milestone: 100+ followers
  if ((user.followers ? user.followers.length : 0) >= 100) {
    await user.addBadge("milestone_100_followers", req);
  }
};

// Index for search
userSchema.index({
  username: "text",
  firstName: "text",
  lastName: "text",
  skills: "text",
});
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

// Clear reset password token
userSchema.methods.clearResetPasswordToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpire = undefined;
};

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
