const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const auth = require("../middleware/auth");
const NotificationService = require("../utils/notificationService");

// Get all comments for a post with nested replies
router.get("/:postId", async (req, res) => {
  try {
    const topLevelComments = await Comment.find({
      post: req.params.postId,
      $or: [{ parentComment: { $exists: false } }, { parentComment: null }],
    })
      .populate("author", "firstName lastName avatar")
      .populate({
        path: "replies",
        populate: [
          {
            path: "author",
            select: "firstName lastName avatar",
          },
          {
            path: "replies",
            populate: [
              {
                path: "author",
                select: "firstName lastName avatar",
              },
              {
                path: "replies",
                populate: {
                  path: "author",
                  select: "firstName lastName avatar",
                },
              },
            ],
          },
        ],
      })
      .sort({ createdAt: -1 });

    // Get all replies for this post
    const replies = await Comment.find({
      post: req.params.postId,
      parentComment: { $exists: true, $ne: null },
    })
      .populate("author", "firstName lastName avatar")
      .populate({
        path: "replies",
        populate: [
          {
            path: "author",
            select: "firstName lastName avatar",
          },
          {
            path: "replies",
            populate: {
              path: "author",
              select: "firstName lastName avatar",
            },
          },
        ],
      })
      .sort({ createdAt: 1 });

    console.log("Top-level comments found:", topLevelComments.length);
    console.log("Replies found:", replies.length);
    console.log(
      "Top-level comments:",
      topLevelComments.map((c) => ({
        id: c._id,
        content: c.content,
        author: c.author?.firstName,
        repliesCount: c.replies?.length || 0,
        nestedReplies:
          c.replies?.map((r) => ({
            id: r._id,
            author: r.author?.firstName,
            repliesCount: r.replies?.length || 0,
            nestedNestedReplies:
              r.replies?.map((nr) => ({
                id: nr._id,
                author: nr.author?.firstName,
              })) || [],
          })) || [],
      }))
    );
    console.log(
      "Replies:",
      replies.map((r) => ({
        id: r._id,
        content: r.content,
        parentComment: r.parentComment,
        author: r.author?.firstName,
        repliesCount: r.replies?.length || 0,
      }))
    );

    res.json({
      data: {
        comments: topLevelComments,
        replies: replies,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Add a comment to a post (supports nested replies)
router.post("/:postId", auth.protect, async (req, res) => {
  try {
    console.log("Comments route hit!");
    console.log("User ID:", req.user._id);
    console.log("Post ID:", req.params.postId);
    console.log("Content:", req.body.content);
    console.log("Parent Comment ID:", req.body.parentCommentId);

    const { content, parentCommentId } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log("Post not found");
      return res.status(404).json({ error: "Post not found" });
    }

    // If this is a reply, verify the parent comment exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found" });
      }
      if (parentComment.post.toString() !== req.params.postId) {
        return res
          .status(400)
          .json({ error: "Parent comment does not belong to this post" });
      }
    }

    console.log("Post found:", post.title);
    console.log("Post author:", post.author);
    console.log("Current user:", req.user._id);
    console.log(
      "Are they the same?",
      post.author.toString() === req.user._id.toString()
    );

    const comment = new Comment({
      post: req.params.postId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
    });

    await comment.save();
    console.log("Comment saved with data:", {
      _id: comment._id,
      content: comment.content,
      author: comment.author,
      parentComment: comment.parentComment,
      post: comment.post,
    });

    // If this is a reply, add it to the parent comment's replies array
    if (parentCommentId) {
      console.log("Adding reply to parent comment:", parentCommentId);
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id },
      });
      console.log("Reply added to parent comment successfully");
    }

    const totalComments = await Comment.countDocuments({
      post: req.params.postId,
    });
    await Post.findByIdAndUpdate(req.params.postId, {
      commentsCount: totalComments,
    });
    console.log("Updated post comment count to:", totalComments);

    // Centralized badge evaluation for all badges
    const User = require("../models/User");
    await User.evaluateAndAwardBadges(req.user._id, req);

    console.log("Comment saved successfully");

    // Create notification for post author if they are not the commenter
    if (post.author.toString() !== req.user._id.toString()) {
      console.log("Creating comment notification...");
      console.log("Commenter ID:", req.user._id);
      console.log("Post Author ID:", post.author);
      console.log("Post ID:", post._id);
      console.log("Post Title:", post.title);

      try {
        const notificationService = new NotificationService(req.app.get("io"));
        const notification =
          await notificationService.createCommentPostNotification(
            req.user._id,
            post.author,
            post._id,
            post.title,
            content
          );
        console.log("Comment notification created:", notification._id);
      } catch (error) {
        console.error("Error creating comment notification:", error);
      }
    } else {
      console.log("User commenting on their own post - no notification needed");
    }

    // Populate the author field before sending response
    await comment.populate("author", "firstName lastName avatar");

    res.status(201).json({ comment });
  } catch (err) {
    console.error("Error in comments route:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Like/unlike a comment
router.post("/:commentId/like", auth.protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const userLiked = comment.likes.includes(req.user._id);

    if (userLiked) {
      // Unlike
      comment.likes = comment.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.json({
      success: true,
      liked: !userLiked,
      likesCount: comment.likes.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update like" });
  }
});

// Delete a comment
router.delete("/:commentId", auth.protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    // If this comment has replies, delete them first
    if (comment.replies && comment.replies.length > 0) {
      await Comment.deleteMany({ _id: { $in: comment.replies } });
    }

    // If this is a reply, remove it from parent's replies array
    if (comment.parentComment) {
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id },
      });
    }

    await comment.deleteOne();

    // Post's comment count after deletion
    const totalComments = await Comment.countDocuments({ post: comment.post });
    await Post.findByIdAndUpdate(comment.post, {
      commentsCount: totalComments,
    });
    console.log("Updated post comment count to:", totalComments);

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

module.exports = router;
