const mongoose = require("mongoose");

// Poll option schema
const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Poll option text is required"],
    trim: true,
    maxlength: [200, "Poll option cannot exceed 200 characters"],
  },
  votes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  voteCount: {
    type: Number,
    default: 0,
  },
});

// Poll schema
const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Poll question is required"],
      trim: true,
      maxlength: [300, "Poll question cannot exceed 300 characters"],
    },
    options: [pollOptionSchema],
    isMultipleChoice: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voters: [
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

// Method to vote on poll
pollSchema.methods.vote = function (userId, optionIndexes) {
  if (!this.isActive) {
    throw new Error("Poll is not active");
  }

  // Check if poll has expired
  if (this.expiresAt && new Date() > this.expiresAt) {
    throw new Error("Poll has expired");
  }

  // Validate option indexes
  if (!Array.isArray(optionIndexes)) {
    optionIndexes = [optionIndexes];
  }

  if (!this.isMultipleChoice && optionIndexes.length > 1) {
    throw new Error("Single choice poll allows only one option");
  }

  const hasVotedForOptions = this.options.some((option) =>
    option.votes.includes(userId)
  );

  // If user has already voted, remove their previous votes first
  if (hasVotedForOptions) {
    this.options.forEach((option) => {
      const voteIndex = option.votes.indexOf(userId);
      if (voteIndex !== -1) {
        option.votes.splice(voteIndex, 1);
        option.voteCount -= 1;
      }
    });

    // Remove user from voters
    const voterIndex = this.voters.indexOf(userId);
    if (voterIndex !== -1) {
      this.voters.splice(voterIndex, 1);
    }
    this.totalVotes -= 1;
  }

  // Add new votes to options
  optionIndexes.forEach((index) => {
    if (index >= 0 && index < this.options.length) {
      this.options[index].votes.push(userId);
      this.options[index].voteCount += 1;
    }
  });

  // Add user to voters
  if (!this.voters.includes(userId)) {
    this.voters.push(userId);
  }
  this.totalVotes += 1;

  return this.save();
};

// Method to remove vote
pollSchema.methods.removeVote = function (userId) {
  const hasVotedForOptions = this.options.some((option) =>
    option.votes.includes(userId)
  );

  if (!hasVotedForOptions) {
    throw new Error("User has not voted on this poll");
  }

  // Remove votes from options
  this.options.forEach((option) => {
    const voteIndex = option.votes.indexOf(userId);
    if (voteIndex !== -1) {
      option.votes.splice(voteIndex, 1);
      option.voteCount -= 1;
    }
  });

  // Remove user from voters
  const voterIndex = this.voters.indexOf(userId);
  if (voterIndex !== -1) {
    this.voters.splice(voterIndex, 1);
  }
  this.totalVotes -= 1;

  return this.save();
};

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
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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
    // Poll field
    poll: pollSchema,
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

// Method to add unique view
discussionSchema.methods.addUniqueView = function (userId) {
  if (!userId) {
    this.views += 1;
    return this.save();
  }

  if (!this.viewedBy) {
    this.viewedBy = [];
  }

  const hasViewed = this.viewedBy.includes(userId);

  if (!hasViewed) {
    this.views += 1;
    this.viewedBy.push(userId);
  }

  return this.save();
};

discussionSchema.methods.addViewWithSession = function (userId, sessionId) {
  if (!userId) {
    this.views += 1;
    return this.save();
  }

  if (!this.viewedBy) {
    this.viewedBy = [];
  }

  const hasViewed = this.viewedBy.includes(userId);

  if (!hasViewed) {
    this.views += 1;
    this.viewedBy.push(userId);
  }

  return this.save();
};

discussionSchema.methods.addViewWithRateLimit = function (userId) {
  if (!userId) {
    this.views += 1;
    return this.save();
  }

  if (!this.viewedBy) {
    this.viewedBy = [];
  }

  const hasViewed = this.viewedBy.includes(userId);

  if (!hasViewed) {
    this.views += 1;
    this.viewedBy.push(userId);
  }

  return this.save();
};

// Method to create poll
discussionSchema.methods.createPoll = function (pollData, userId) {
  if (this.poll) {
    throw new Error("Discussion already has a poll");
  }

  this.poll = {
    question: pollData.question,
    options: pollData.options.map((option) => ({ text: option })),
    isMultipleChoice: pollData.isMultipleChoice || false,
    expiresAt: pollData.expiresAt ? new Date(pollData.expiresAt) : null,
    createdBy: userId,
    voters: [],
    totalVotes: 0,
  };

  return this.save();
};

// Method to vote on poll
discussionSchema.methods.voteOnPoll = function (userId, optionIndexes) {
  if (!this.poll) {
    throw new Error("Discussion does not have a poll");
  }

  return this.poll.vote(userId, optionIndexes).then(() => {
    return this.save();
  });
};

// Method to remove poll vote
discussionSchema.methods.removePollVote = function (userId) {
  if (!this.poll) {
    throw new Error("Discussion does not have a poll");
  }

  return this.poll.removeVote(userId).then(() => {
    return this.save();
  });
};

// Method to delete poll
discussionSchema.methods.deletePoll = function (userId) {
  if (!this.poll) {
    throw new Error("Discussion does not have a poll");
  }

  if (this.poll.createdBy.toString() !== userId.toString()) {
    throw new Error("Only poll creator can delete the poll");
  }

  this.poll = null;
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
