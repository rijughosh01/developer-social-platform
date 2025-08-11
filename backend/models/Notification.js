const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "message",
        "like_post",
        "like_project",
        "comment_post",
        "comment_project",
        "comment_discussion",
        "answer_accepted",
        "discussion_vote",
        "discussion_flagged",
        "comment_flagged",
        "follow",
        "unfollow",
        "mention",
        "project_invite",
        "collaboration_request",
        "review_request",
        "fork_created",
        "system",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      // Additional data for the notification
      postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" },
      discussionId: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion" },
      flagReason: { type: String },
      chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
      messageId: { type: mongoose.Schema.Types.ObjectId },
      url: { type: String },
      image: { type: String },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ user: 1 });

// Virtual for time ago
notificationSchema.virtual("timeAgo").get(function () {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
});

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  try {
    const notification = new this(data);
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function (
  notificationIds,
  userId
) {
  try {
    const result = await this.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
    return result;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  try {
    const result = await this.updateMany(
      {
        recipient: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );
    return result;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
  try {
    const count = await this.countDocuments({
      recipient: userId,
      isRead: false,
      isDeleted: false,
    });
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

// Method to mark single notification as read
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Method to delete notification
notificationSchema.methods.deleteNotification = async function () {
  this.isDeleted = true;
  return await this.save();
};

module.exports = mongoose.model("Notification", notificationSchema);
