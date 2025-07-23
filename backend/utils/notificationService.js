const Notification = require("../models/Notification");
const User = require("../models/User");

class NotificationService {
  constructor(io = null) {
    this.io = io;
  }

  // Create and send notification
  async createNotification(data) {
    try {
      console.log(
        " createNotification: Creating notification with data:",
        data
      );

      const notification = await Notification.createNotification(data);
      console.log(
        " createNotification: Notification created in database:",
        notification._id
      );

      // Populate sender info for real-time emission
      await notification.populate(
        "sender",
        "username firstName lastName avatar"
      );
      console.log(
        " createNotification: Sender populated:",
        notification.sender
      );

      // Send real-time notification to recipient if IO is available
      if (this.io) {
        console.log(
          " createNotification: Sending real-time notification to:",
          data.recipient.toString()
        );
        this.io.to(data.recipient.toString()).emit("new-notification", {
          notification,
          unreadCount: await Notification.getUnreadCount(data.recipient),
        });
        console.log(" createNotification: Real-time notification sent");
      } else {
        console.log(
          " createNotification: No IO instance available for real-time notification"
        );
      }

      return notification;
    } catch (error) {
      console.error(" createNotification: Error creating notification:", error);
      throw error;
    }
  }

  // Message notification
  async createMessageNotification(
    senderId,
    recipientId,
    chatId,
    messageId,
    messageContent
  ) {
    const sender = await User.findById(senderId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: recipientId,
      sender: senderId,
      type: "message",
      title: `New message from ${sender.firstName} ${sender.lastName}`,
      message:
        messageContent.length > 50
          ? `${messageContent.substring(0, 50)}...`
          : messageContent,
      data: {
        chatId,
        messageId,
        url: `/messages?chat=${chatId}`,
      },
    });
  }

  // Like post notification
  async createLikePostNotification(likerId, postAuthorId, postId, postTitle) {
    const liker = await User.findById(likerId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: postAuthorId,
      sender: likerId,
      type: "like_post",
      title: `${liker.firstName} ${liker.lastName} liked your post`,
      message: `"${postTitle}"`,
      data: {
        postId,
        url: `/posts/${postId}`,
      },
    });
  }

  // Like project notification
  async createLikeProjectNotification(
    likerId,
    projectOwnerId,
    projectId,
    projectTitle
  ) {
    const liker = await User.findById(likerId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: projectOwnerId,
      sender: likerId,
      type: "like_project",
      title: `${liker.firstName} ${liker.lastName} liked your project`,
      message: `"${projectTitle}"`,
      data: {
        projectId,
        url: `/projects/${projectId}`,
      },
    });
  }

  // Comment post notification
  async createCommentPostNotification(
    commenterId,
    postAuthorId,
    postId,
    postTitle,
    commentContent
  ) {
    console.log(" NotificationService: Creating comment notification...");
    console.log("Commenter ID:", commenterId);
    console.log("Post Author ID:", postAuthorId);
    console.log("Post ID:", postId);
    console.log("Post Title:", postTitle);
    console.log("Comment Content:", commentContent);

    try {
      const commenter = await User.findById(commenterId).select(
        "username firstName lastName"
      );
      console.log("Commenter found:", commenter);

      const notification = await this.createNotification({
        recipient: postAuthorId,
        sender: commenterId,
        type: "comment_post",
        title: `${commenter.firstName} ${commenter.lastName} commented on your post`,
        message:
          commentContent.length > 50
            ? `${commentContent.substring(0, 50)}...`
            : commentContent,
        data: {
          postId,
          url: `/posts/${postId}`,
        },
      });

      console.log(
        " NotificationService: Comment notification created successfully:",
        notification._id
      );
      return notification;
    } catch (error) {
      console.error(
        " NotificationService: Error creating comment notification:",
        error
      );
      throw error;
    }
  }

  // Comment project notification
  async createCommentProjectNotification(
    commenterId,
    projectOwnerId,
    projectId,
    projectTitle,
    commentContent
  ) {
    const commenter = await User.findById(commenterId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: projectOwnerId,
      sender: commenterId,
      type: "comment_project",
      title: `${commenter.firstName} ${commenter.lastName} commented on your project`,
      message:
        commentContent.length > 50
          ? `${commentContent.substring(0, 50)}...`
          : commentContent,
      data: {
        projectId,
        url: `/projects/${projectId}`,
      },
    });
  }

  // Follow notification
  async createFollowNotification(followerId, followedId) {
    const follower = await User.findById(followerId).select(
      "username firstName lastName avatar"
    );

    return await this.createNotification({
      recipient: followedId,
      sender: followerId,
      type: "follow",
      title: `${follower.firstName} ${follower.lastName} started following you`,
      message: `You now have a new follower!`,
      data: {
        url: `/profile/${follower.username}`,
        image: follower.avatar,
      },
    });
  }

  // Unfollow notification
  async createUnfollowNotification(followerId, followedId) {
    const follower = await User.findById(followerId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: followedId,
      sender: followerId,
      type: "unfollow",
      title: `${follower.firstName} ${follower.lastName} unfollowed you`,
      message: `You lost a follower`,
      data: {
        url: `/profile/${follower.username}`,
      },
    });
  }

  // Mention notification
  async createMentionNotification(
    mentionerId,
    mentionedUserId,
    postId,
    postTitle,
    mentionContent
  ) {
    const mentioner = await User.findById(mentionerId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: mentionedUserId,
      sender: mentionerId,
      type: "mention",
      title: `${mentioner.firstName} ${mentioner.lastName} mentioned you in a post`,
      message:
        mentionContent.length > 50
          ? `${mentionContent.substring(0, 50)}...`
          : mentionContent,
      data: {
        postId,
        url: `/posts/${postId}`,
      },
    });
  }

  // Project invite notification
  async createProjectInviteNotification(
    inviterId,
    inviteeId,
    projectId,
    projectTitle
  ) {
    const inviter = await User.findById(inviterId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: inviteeId,
      sender: inviterId,
      type: "project_invite",
      title: `${inviter.firstName} ${inviter.lastName} invited you to collaborate`,
      message: `Project: "${projectTitle}"`,
      data: {
        projectId,
        url: `/projects/${projectId}`,
      },
    });
  }

  // Collaboration request notification
  async createCollaborationRequestNotification(
    requesterId,
    projectOwnerId,
    projectId,
    projectTitle
  ) {
    const requester = await User.findById(requesterId).select(
      "username firstName lastName"
    );

    return await this.createNotification({
      recipient: projectOwnerId,
      sender: requesterId,
      type: "collaboration_request",
      title: `${requester.firstName} ${requester.lastName} wants to collaborate`,
      message: `Project: "${projectTitle}"`,
      data: {
        projectId,
        url: `/projects/${projectId}`,
      },
    });
  }

  // System notification
  async createSystemNotification(recipientId, title, message, data = {}) {
    return await this.createNotification({
      recipient: recipientId,
      sender: recipientId,
      type: "system",
      title,
      message,
      data,
    });
  }

  // Bulk notifications
  async createBulkNotifications(recipientIds, title, message, data = {}) {
    const notifications = [];

    for (const recipientId of recipientIds) {
      try {
        const notification = await this.createNotification({
          recipient: recipientId,
          sender: recipientId,
          type: "system",
          title,
          message,
          data,
        });
        notifications.push(notification);
      } catch (error) {
        console.error(
          `Error creating notification for user ${recipientId}:`,
          error
        );
      }
    }

    return notifications;
  }

  // Update unread count for a user
  async updateUnreadCount(userId) {
    const unreadCount = await Notification.getUnreadCount(userId);
    if (this.io) {
      this.io
        .to(userId.toString())
        .emit("unread-count-update", { unreadCount });
    }
    return unreadCount;
  }

  // Mark notifications as read and update count
  async markNotificationsAsRead(userId, notificationIds) {
    await Notification.markAsRead(notificationIds, userId);
    return await this.updateUnreadCount(userId);
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    await Notification.markAllAsRead(userId);
    return await this.updateUnreadCount(userId);
  }
}

module.exports = NotificationService;