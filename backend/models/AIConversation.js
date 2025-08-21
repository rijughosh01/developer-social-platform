const mongoose = require("mongoose");

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    context: {
      type: String,
      enum: ["general", "codeReview", "debugging", "learning", "projectHelp"],
      default: "general",
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        pinned: {
          type: Boolean,
          default: false,
        },
        pinnedAt: {
          type: Date,
        },
        metadata: {
          tokens: Number,
          model: String,
          processingTime: Number,
        },
      },
    ],
    totalTokens: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    pinnedMessagesCount: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    tags: [String],
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
aiConversationSchema.index({ user: 1, createdAt: -1 });
aiConversationSchema.index({ user: 1, context: 1 });
aiConversationSchema.index({ lastActivity: -1 });

// Virtual for message count
aiConversationSchema.virtual("messageCount").get(function () {
  return this.messages.length;
});

// Virtual for pinned message count
aiConversationSchema.virtual("pinnedCount").get(function () {
  return this.messages.filter((msg) => msg.pinned).length;
});

// Method to add a message
aiConversationSchema.methods.addMessage = function (
  role,
  content,
  metadata = {}
) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    pinned: false,
    metadata,
  });

  if (metadata.tokens) {
    this.totalTokens += metadata.tokens;
  }

  if (metadata.cost) {
    this.totalCost += metadata.cost;
  }

  this.lastActivity = new Date();
  return this.save();
};

// Method to pin a message
aiConversationSchema.methods.pinMessage = function (messageIndex) {
  if (messageIndex >= 0 && messageIndex < this.messages.length) {
    this.messages[messageIndex].pinned = true;
    this.messages[messageIndex].pinnedAt = new Date();
    this.pinnedMessagesCount = this.messages.filter((msg) => msg.pinned).length;
    this.lastActivity = new Date();
    return this.save();
  }
  throw new Error("Invalid message index");
};

// Method to unpin a message
aiConversationSchema.methods.unpinMessage = function (messageIndex) {
  if (messageIndex >= 0 && messageIndex < this.messages.length) {
    this.messages[messageIndex].pinned = false;
    this.messages[messageIndex].pinnedAt = undefined;
    this.pinnedMessagesCount = this.messages.filter((msg) => msg.pinned).length;
    this.lastActivity = new Date();
    return this.save();
  }
  throw new Error("Invalid message index");
};

// Method to get pinned messages
aiConversationSchema.methods.getPinnedMessages = function () {
  return this.messages.filter((msg) => msg.pinned);
};

// Method to update conversation title
aiConversationSchema.methods.updateTitle = function (title) {
  this.title = title;
  return this.save();
};

// Method to archive conversation
aiConversationSchema.methods.archive = function () {
  this.isActive = false;
  return this.save();
};

// Static method to get user's active conversations
aiConversationSchema.statics.getActiveConversations = function (userId) {
  return this.find({ user: userId, isActive: true })
    .sort({ lastActivity: -1 })
    .populate("project", "title");
};

// Static method to get conversation statistics
aiConversationSchema.statics.getUserStats = function (userId) {
  return this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        totalMessages: { $sum: { $size: "$messages" } },
        totalTokens: { $sum: "$totalTokens" },
        totalCost: { $sum: "$totalCost" },
        averageMessagesPerConversation: {
          $avg: { $size: "$messages" },
        },
      },
    },
  ]);
};

module.exports = mongoose.model("AIConversation", aiConversationSchema);
