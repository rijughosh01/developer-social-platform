const mongoose = require("mongoose");

// Nested comment schema for threaded discussions
const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      maxlength: [10000, "Comment cannot exceed 10000 characters"],
    },
    richContent: {
      type: String,
      default: "",
    },
    contentType: {
      type: String,
      enum: ["plain", "rich"],
      default: "plain",
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    flags: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
          enum: ["spam", "inappropriate", "offensive", "duplicate", "other"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Discussion thread schema
const discussionSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Discussion title is required"],
      trim: true,
      maxlength: [300, "Title cannot exceed 300 characters"],
    },
    content: {
      type: String,
      required: [true, "Discussion content is required"],
      maxlength: [10000, "Content cannot exceed 10000 characters"],
    },
    category: {
      type: String,
      enum: [
        "general",
        "help",
        "discussion",
        "showcase",
        "question",
        "tutorial",
        "news",
        "meta",
        "off-topic",
      ],
      default: "general",
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    status: {
      type: String,
      enum: ["open", "closed", "locked", "archived"],
      default: "open",
    },
    isSticky: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [commentSchema],
    acceptedAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    lastCommentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    flags: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: {
          type: String,
          enum: ["spam", "inappropriate", "offensive", "duplicate", "other"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
discussionSchema.index({ category: 1, createdAt: -1 });
discussionSchema.index({ tags: 1 });
discussionSchema.index({ status: 1 });
discussionSchema.index({ isSticky: 1, lastActivity: -1 });
discussionSchema.index({ author: 1, createdAt: -1 });
discussionSchema.index({ title: "text", content: "text" });

// Virtual for vote score
discussionSchema.virtual("voteScore").get(function () {
  return (this.upvotes?.length || 0) - (this.downvotes?.length || 0);
});

// Virtual for comment count
discussionSchema.virtual("commentCount").get(function () {
  return this.comments?.length || 0;
});

// Virtual for total replies count (including nested)
discussionSchema.virtual("totalRepliesCount").get(function () {
  let count = 0;
  const countReplies = (comments) => {
    comments.forEach((comment) => {
      count++;
      if (comment.replies && comment.replies.length > 0) {
        countReplies(comment.replies);
      }
    });
  };
  countReplies(this.comments || []);
  return count;
});

// Method to add comment with rich text support
discussionSchema.methods.addComment = function (
  authorId,
  content,
  parentCommentId = null,
  richContent = null,
  contentType = "plain"
) {
  if (parentCommentId) {
    const parentComment = this.findCommentById(parentCommentId);
    if (parentComment) {
      const newReply = this.comments.create({
        author: authorId,
        content,
        contentType,
        parentComment: parentCommentId,
        replies: [],
        upvotes: [],
        downvotes: [],
      });

      if (richContent && contentType === "rich") {
        newReply.richContent = richContent;
      }

      parentComment.replies.push(newReply._id);

      this.comments.push(newReply);
    }
  } else {
    // Add as top-level comment
    const comment = {
      author: authorId,
      content,
      contentType,
      parentComment: parentCommentId,
      replies: [],
      upvotes: [],
      downvotes: [],
    };

    if (richContent && contentType === "rich") {
      comment.richContent = richContent;
    }

    this.comments.push(comment);
  }

  this.lastActivity = new Date();
  this.lastCommentBy = authorId;
  return this.save();
};

// Helper method to find comment by ID in nested structure
discussionSchema.methods.findCommentById = function (commentId) {
  const findComment = (comments) => {
    for (const comment of comments) {
      if (comment._id.toString() === commentId.toString()) {
        return comment;
      }
      if (comment.replies && comment.replies.length > 0) {
        const found = findComment(comment.replies);
        if (found) return found;
      }
    }
    return null;
  };
  return findComment(this.comments);
};

// Method to vote on discussion
discussionSchema.methods.vote = function (userId, voteType) {
  const upvoteIndex = this.upvotes.indexOf(userId);
  const downvoteIndex = this.downvotes.indexOf(userId);

  if (voteType === "upvote") {
    if (upvoteIndex === -1) {
      this.upvotes.push(userId);
    }
    if (downvoteIndex !== -1) {
      this.downvotes.splice(downvoteIndex, 1);
    }
  } else if (voteType === "downvote") {
    if (downvoteIndex === -1) {
      this.downvotes.push(userId);
    }
    if (upvoteIndex !== -1) {
      this.upvotes.splice(upvoteIndex, 1);
    }
  } else if (voteType === "remove") {
    if (upvoteIndex !== -1) {
      this.upvotes.splice(upvoteIndex, 1);
    }
    if (downvoteIndex !== -1) {
      this.downvotes.splice(downvoteIndex, 1);
    }
  }

  return this.save();
};

// Method to vote on comment
discussionSchema.methods.voteComment = function (commentId, userId, voteType) {
  const comment = this.comments.id(commentId);
  if (!comment) return null;

  const upvoteIndex = comment.upvotes.indexOf(userId);
  const downvoteIndex = comment.downvotes.indexOf(userId);

  if (voteType === "upvote") {
    if (upvoteIndex === -1) {
      comment.upvotes.push(userId);
    }
    if (downvoteIndex !== -1) {
      comment.downvotes.splice(downvoteIndex, 1);
    }
  } else if (voteType === "downvote") {
    if (downvoteIndex === -1) {
      comment.downvotes.push(userId);
    }
    if (upvoteIndex !== -1) {
      comment.upvotes.splice(upvoteIndex, 1);
    }
  } else if (voteType === "remove") {
    if (upvoteIndex !== -1) {
      comment.upvotes.splice(upvoteIndex, 1);
    }
    if (downvoteIndex !== -1) {
      comment.downvotes.splice(downvoteIndex, 1);
    }
  }

  return this.save();
};

// Method to mark answer as accepted
discussionSchema.methods.acceptAnswer = function (commentId) {
  this.acceptedAnswer = commentId;
  return this.save();
};

// Static method to get discussions with filters
discussionSchema.statics.getDiscussions = function (filters = {}) {
  const {
    category,
    tags,
    status = "open",
    sort = "lastActivity",
    order = "desc",
    page = 1,
    limit = 20,
    search,
    author,
    isSticky,
  } = filters;

  const query = {};

  if (category) query.category = category;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  if (status) query.status = status;
  if (author) query.author = author;
  if (isSticky !== undefined) query.isSticky = isSticky;

  if (search) {
    query.$text = { $search: search };
  }

  const sortObj = {};
  sortObj[sort] = order === "desc" ? -1 : 1;

  return this.find(query)
    .populate("author", "username firstName lastName avatar")
    .populate("lastCommentBy", "username firstName lastName avatar")
    .sort(sortObj)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit));
};

module.exports = mongoose.model("Discussion", discussionSchema);
