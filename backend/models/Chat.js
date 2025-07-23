const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [messageSchema],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      default: "",
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for last message content
chatSchema.virtual("lastMessageContent").get(function () {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    return lastMsg.content;
  }
  return "";
});

// Virtual for last message time
chatSchema.virtual("lastMessageTime").get(function () {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    return lastMsg.createdAt;
  }
  return this.createdAt;
});

// Method to add message
chatSchema.methods.addMessage = function (
  senderId,
  content,
  messageType = "text",
  fileUrl = "",
  fileName = ""
) {
  const message = {
    sender: senderId,
    content: content,
    messageType: messageType,
    fileUrl: fileUrl,
    fileName: fileName,
  };

  this.messages.push(message);
  this.lastMessage = this.messages[this.messages.length - 1]._id;

  // Update unread count for other participants
  this.participants.forEach((participantId) => {
    if (participantId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCount.get(participantId.toString()) || 0;
      this.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });

  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function (userId) {
  if (this.messages) {
    this.messages.forEach((message) => {
      if (message.sender.toString() !== userId.toString() && !message.isRead) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });
  }

  // Reset unread count for this user
  this.unreadCount.set(userId.toString(), 0);

  return this.save();
};

// Method to get unread count for a user
chatSchema.methods.getUnreadCount = function (userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Method to delete a message
chatSchema.methods.deleteMessage = function (messageId, userId) {
  const message = this.messages.find(
    (m) => m._id.toString() === messageId.toString()
  );
  if (!message) {
    throw new Error("Message not found");
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new Error("Not authorized to delete this message");
  }

  this.messages = this.messages.filter(
    (m) => m._id.toString() !== messageId.toString()
  );

  if (
    this.lastMessage &&
    this.lastMessage.toString() === messageId.toString()
  ) {
    this.lastMessage =
      this.messages.length > 0
        ? this.messages[this.messages.length - 1]._id
        : null;
  }
  return this.save();
};

// Static method to find or create chat between two users
chatSchema.statics.findOrCreateChat = async function (user1Id, user2Id) {
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id], $size: 2 },
    isGroupChat: false,
  }).populate("participants", "username firstName lastName avatar");

  if (!chat) {
    chat = new this({
      participants: [user1Id, user2Id],
      messages: [],
      unreadCount: new Map(),
    });
    await chat.save();
    chat = await chat.populate(
      "participants",
      "username firstName lastName avatar"
    );
  }

  return chat;
};

// Static method to get user chats
chatSchema.statics.getUserChats = async function (userId) {
  return await this.find({
    participants: { $in: [userId] },
  })
    .populate("participants", "username firstName lastName avatar")
    .populate("groupAdmin", "username firstName lastName")
    .sort({ updatedAt: -1 });
};

chatSchema.index({ participants: 1 });

module.exports = mongoose.model("Chat", chatSchema);
