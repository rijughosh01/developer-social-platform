const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");
const Discussion = require("../models/Discussion");
const User = require("../models/User");
const NotificationService = require("../utils/notificationService");

// Initialize notification service
const notificationService = new NotificationService();

// Get all discussions with filters
router.get(
  "/",
  asyncHandler(async (req, res) => {
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
    } = req.query;

    const filters = {
      category,
      tags: tags ? tags.split(",") : undefined,
      status,
      sort,
      order,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      author,
      isSticky: isSticky === "true",
    };

    const discussions = await Discussion.getDiscussions(filters);
    const total = await Discussion.countDocuments(filters);

    // Add vote status for authenticated users
    if (req.user) {
      discussions.forEach((discussion) => {
        discussion.userVote = discussion.upvotes.includes(req.user._id)
          ? "upvote"
          : discussion.downvotes.includes(req.user._id)
          ? "downvote"
          : null;
      });
    }

    res.json({
      success: true,
      data: {
        discussions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  })
);

// Get discussion categories
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const categories = [
      { id: "general", name: "General", description: "General discussions" },
      { id: "help", name: "Help", description: "Help and support" },
      { id: "discussion", name: "Discussion", description: "Open discussions" },
      { id: "showcase", name: "Showcase", description: "Project showcases" },
      {
        id: "question",
        name: "Question",
        description: "Questions and answers",
      },
      { id: "tutorial", name: "Tutorial", description: "Tutorials and guides" },
      { id: "news", name: "News", description: "Latest news and updates" },
      { id: "meta", name: "Meta", description: "Platform-related discussions" },
      {
        id: "off-topic",
        name: "Off Topic",
        description: "Off-topic discussions",
      },
    ];

    res.json({
      success: true,
      data: categories,
    });
  })
);

// Get popular tags
router.get(
  "/tags",
  asyncHandler(async (req, res) => {
    const tags = await Discussion.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ]);

    res.json({
      success: true,
      data: tags,
    });
  })
);

// Create new discussion
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { title, content, category, tags } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // Process tags
    const processedTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0)
      : [];

    const discussion = new Discussion({
      author: req.user._id,
      title,
      content,
      category: category || "general",
      tags: processedTags,
    });

    await discussion.save();

    // Populate author info
    await discussion.populate("author", "username firstName lastName avatar");

    res.status(201).json({
      success: true,
      data: discussion,
    });
  })
);

// Get single discussion with comments
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id)
      .populate("author", "username firstName lastName avatar")
      .populate("lastCommentBy", "username firstName lastName avatar")
      .populate("acceptedAnswer", "author content createdAt")
      .populate("comments.author", "username firstName lastName avatar")
      .populate(
        "comments.replies.author",
        "username firstName lastName avatar"
      );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Increment view count
    discussion.views += 1;
    await discussion.save();

    // Add vote status for authenticated users
    if (req.user) {
      discussion.userVote = discussion.upvotes.includes(req.user._id)
        ? "upvote"
        : discussion.downvotes.includes(req.user._id)
        ? "downvote"
        : null;

      // Recursive function to add vote status for all comments and their replies
      const addVoteStatusToComments = (comments) => {
        comments.forEach((comment) => {
          comment.userVote = comment.upvotes.includes(req.user._id)
            ? "upvote"
            : comment.downvotes.includes(req.user._id)
            ? "downvote"
            : null;
          comment.canEdit =
            comment.author._id.toString() === req.user._id.toString();

          if (comment.replies && comment.replies.length > 0) {
            addVoteStatusToComments(comment.replies);
          }
        });
      };

      // Add vote status for all comments and their nested replies
      addVoteStatusToComments(discussion.comments);
    }

    res.json({
      success: true,
      data: discussion,
    });
  })
);

// Update discussion
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const { title, content, category, tags } = req.body;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Check if user is author or admin
    if (
      discussion.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this discussion",
      });
    }

    // Process tags
    const processedTags = tags
      ? tags
          .split(",")
          .map((tag) => tag.trim().toLowerCase())
          .filter((tag) => tag.length > 0)
      : discussion.tags;

    discussion.title = title || discussion.title;
    discussion.content = content || discussion.content;
    discussion.category = category || discussion.category;
    discussion.tags = processedTags;

    await discussion.save();

    res.json({
      success: true,
      data: discussion,
    });
  })
);

// Delete discussion
router.delete(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Check if user is author or admin
    if (
      discussion.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this discussion",
      });
    }

    await discussion.remove();

    res.json({
      success: true,
      message: "Discussion deleted successfully",
    });
  })
);

// Vote on discussion
router.post(
  "/:id/vote",
  protect,
  asyncHandler(async (req, res) => {
    const { voteType } = req.body;

    if (!["upvote", "downvote", "remove"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type",
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    await discussion.vote(req.user._id, voteType);

    res.json({
      success: true,
      data: {
        voteScore: discussion.voteScore,
        userVote: voteType === "remove" ? null : voteType,
      },
    });
  })
);

// Add comment to discussion
router.post(
  "/:id/comments",
  protect,
  asyncHandler(async (req, res) => {
    const {
      content,
      parentCommentId,
      richContent,
      contentType = "plain",
    } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Check if discussion is locked
    if (discussion.status === "locked") {
      return res.status(403).json({
        success: false,
        message: "This discussion is locked",
      });
    }

    await discussion.addComment(
      req.user._id,
      content,
      parentCommentId,
      richContent,
      contentType
    );

    const notifyUsers = new Set();
    if (discussion.author.toString() !== req.user._id.toString()) {
      notifyUsers.add(discussion.author.toString());
    }

    // Send notifications
    notifyUsers.forEach((userId) => {
      notificationService.createNotification({
        recipient: userId,
        sender: req.user._id,
        type: "comment_discussion",
        title: "New comment on discussion",
        message: `${req.user.firstName} commented on "${discussion.title}"`,
        data: {
          discussionId: discussion._id,
          commentId: discussion.comments[discussion.comments.length - 1]._id,
        },
      });
    });

    // Populate all comments and their nested replies with author information
    await discussion.populate([
      { path: "comments.author", select: "username firstName lastName avatar" },
      {
        path: "comments.replies.author",
        select: "username firstName lastName avatar",
      },
    ]);

    // Find the newly added comment
    let newComment = null;
    if (parentCommentId) {
      const replyComments = discussion.comments.filter(
        (comment) =>
          comment.parentComment &&
          comment.parentComment.toString() === parentCommentId.toString()
      );
      if (replyComments.length > 0) {
        newComment = replyComments[replyComments.length - 1];
      }
    } else {
      const mainComments = discussion.comments.filter(
        (comment) => !comment.parentComment
      );
      if (mainComments.length > 0) {
        newComment = mainComments[mainComments.length - 1];
      }
    }

    if (!newComment) {
      newComment = discussion.comments[discussion.comments.length - 1];
    }

    res.json({
      success: true,
      data: newComment,
    });
  })
);

// Vote on comment
router.post(
  "/:id/comments/:commentId/vote",
  protect,
  asyncHandler(async (req, res) => {
    const { voteType } = req.body;

    if (!["upvote", "downvote", "remove"].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type",
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    await discussion.voteComment(req.params.commentId, req.user._id, voteType);

    res.json({
      success: true,
      message: "Vote recorded successfully",
    });
  })
);

// Edit comment
router.put(
  "/:id/comments/:commentId",
  protect,
  asyncHandler(async (req, res) => {
    const { content, richContent, contentType } = req.body;

    let isValidContent = false;
    if (contentType === "rich") {
      isValidContent = richContent && richContent.trim().length > 0;
    } else {
      isValidContent = content && content.trim().length > 0;
    }

    if (!isValidContent) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const comment = discussion.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is comment author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment",
      });
    }

    // Update comment fields
    if (content !== undefined) comment.content = content;
    if (richContent !== undefined) comment.richContent = richContent;
    if (contentType !== undefined) comment.contentType = contentType;

    comment.isEdited = true;
    comment.editedAt = new Date();

    await discussion.save();

    res.json({
      success: true,
      data: comment,
    });
  })
);

// Accept answer for question discussions
router.post(
  "/:id/accept-answer",
  protect,
  asyncHandler(async (req, res) => {
    const { commentId } = req.body;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Check if user is discussion author
    if (discussion.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the discussion author can accept answers",
      });
    }

    // Check if comment exists
    const comment = discussion.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    discussion.acceptedAnswer = commentId;
    await discussion.save();

    // Notify comment author
    notificationService.createNotification({
      recipient: comment.author,
      sender: req.user._id,
      type: "answer_accepted",
      title: "Your answer was accepted",
      message: `Your answer to "${discussion.title}" was accepted as the best answer`,
      data: {
        discussionId: discussion._id,
        commentId: commentId,
      },
    });

    res.json({
      success: true,
      data: discussion,
    });
  })
);

// Flag discussion
router.post(
  "/:id/flag",
  protect,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (
      !["spam", "inappropriate", "offensive", "duplicate", "other"].includes(
        reason
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid flag reason",
      });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    // Check if user already flagged
    const existingFlag = discussion.flags.find(
      (flag) => flag.user.toString() === req.user._id.toString()
    );

    if (existingFlag) {
      return res.status(400).json({
        success: false,
        message: "You have already flagged this discussion",
      });
    }

    discussion.flags.push({
      user: req.user._id,
      reason,
    });

    await discussion.save();

    res.json({
      success: true,
      message: "Discussion flagged successfully",
    });
  })
);

// Admin: Moderate discussion
router.patch(
  "/:id/moderate",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { status, isSticky, isFeatured } = req.body;

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (status) discussion.status = status;
    if (isSticky !== undefined) discussion.isSticky = isSticky;
    if (isFeatured !== undefined) discussion.isFeatured = isFeatured;

    await discussion.save();

    res.json({
      success: true,
      data: discussion,
    });
  })
);

// Save a discussion
router.post(
  "/:id/save",
  protect,
  asyncHandler(async (req, res) => {
    const discussionId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.savedDiscussions.includes(discussionId)) {
      user.savedDiscussions.push(discussionId);
      await user.save();
    }

    res.json({ success: true, message: "Discussion saved" });
  })
);

// Unsave a discussion
router.delete(
  "/:id/save",
  protect,
  asyncHandler(async (req, res) => {
    const discussionId = req.params.id;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.savedDiscussions = user.savedDiscussions.filter(
      (id) => id.toString() !== discussionId.toString()
    );
    await user.save();

    res.json({ success: true, message: "Discussion unsaved" });
  })
);

module.exports = router;
