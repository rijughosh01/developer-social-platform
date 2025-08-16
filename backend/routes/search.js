const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { protect, optionalAuth } = require("../middleware/auth");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");
const User = require("../models/User");
const Project = require("../models/Project");
const Post = require("../models/Post");
const Discussion = require("../models/Discussion");

// Global search endpoint
router.get(
  "/",
  optionalAuth,
  cacheMiddleware(900), // Cache for 15 minutes
  asyncHandler(async (req, res) => {
    const { q, type, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const searchQuery = q.trim();
    const searchLimit = Math.min(parseInt(limit), 20); // Max 20 results per type
    const results = {};

    try {
      // Search users
      if (!type || type === "users") {
        const users = await User.find({
          $text: { $search: searchQuery },
        })
          .select("_id username firstName lastName avatar bio skills location company followersCount")
          .sort({ score: { $meta: "textScore" } })
          .limit(searchLimit);

        // Add isFollowing field for authenticated users
        if (req.user) {
          users.forEach((user) => {
            user.isFollowing = user.followers.some(
              (f) => f.toString() === req.user._id.toString()
            );
          });
        }

        results.users = users;
      }

      // Search projects
      if (!type || type === "projects") {
        const projects = await Project.find({
          $text: { $search: searchQuery },
          isPublic: true,
        })
          .populate("owner", "username firstName lastName avatar")
          .select("_id title description category status technologies featured createdAt")
          .sort({ score: { $meta: "textScore" } })
          .limit(searchLimit);

        results.projects = projects;
      }

      // Search posts
      if (!type || type === "posts") {
        const posts = await Post.find({
          $text: { $search: searchQuery },
          isPublished: true,
        })
          .populate("author", "username firstName lastName avatar")
          .select("_id title content category tags createdAt likesCount commentsCount")
          .sort({ score: { $meta: "textScore" } })
          .limit(searchLimit);

        results.posts = posts;
      }

      // Search discussions
      if (!type || type === "discussions") {
        const discussions = await Discussion.find({
          $text: { $search: searchQuery },
        })
          .populate("author", "username firstName lastName avatar")
          .select("_id title content category tags status createdAt upvotesCount downvotesCount commentsCount")
          .sort({ score: { $meta: "textScore" } })
          .limit(searchLimit);

        results.discussions = discussions;
      }

      // Get total counts for each type
      const counts = {};
      if (!type || type === "users") {
        counts.users = await User.countDocuments({ $text: { $search: searchQuery } });
      }
      if (!type || type === "projects") {
        counts.projects = await Project.countDocuments({ 
          $text: { $search: searchQuery },
          isPublic: true 
        });
      }
      if (!type || type === "posts") {
        counts.posts = await Post.countDocuments({ 
          $text: { $search: searchQuery },
          isPublished: true 
        });
      }
      if (!type || type === "discussions") {
        counts.discussions = await Discussion.countDocuments({ $text: { $search: searchQuery } });
      }

      res.json({
        success: true,
        data: {
          results,
          counts,
          query: searchQuery,
        },
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({
        success: false,
        message: "Search failed",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  })
);

// Search suggestions/autocomplete
router.get(
  "/suggestions",
  optionalAuth,
  cacheMiddleware(600), // Cache for 10 minutes
  asyncHandler(async (req, res) => {
    const { q, type } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const searchQuery = q.trim();
    const suggestions = [];

    try {
      if (!type || type === "users") {
        const users = await User.find({
          $or: [
            { username: { $regex: searchQuery, $options: "i" } },
            { firstName: { $regex: searchQuery, $options: "i" } },
            { lastName: { $regex: searchQuery, $options: "i" } },
          ],
        })
          .select("_id username firstName lastName avatar")
          .limit(5);

        suggestions.push(
          ...users.map((user) => ({
            type: "user",
            id: user._id,
            title: `${user.firstName} ${user.lastName}`,
            subtitle: `@${user.username}`,
            avatar: user.avatar,
            url: `/profile/${user.username}`,
          }))
        );
      }

      if (!type || type === "projects") {
        const projects = await Project.find({
          title: { $regex: searchQuery, $options: "i" },
          isPublic: true,
        })
          .populate("owner", "username")
          .select("_id title category owner")
          .limit(5);

        suggestions.push(
          ...projects.map((project) => ({
            type: "project",
            id: project._id,
            title: project.title,
            subtitle: `by @${project.owner.username} • ${project.category}`,
            url: `/projects/${project._id}`,
          }))
        );
      }

      if (!type || type === "posts") {
        const posts = await Post.find({
          title: { $regex: searchQuery, $options: "i" },
          isPublished: true,
        })
          .populate("author", "username")
          .select("_id title category author")
          .limit(5);

        suggestions.push(
          ...posts.map((post) => ({
            type: "post",
            id: post._id,
            title: post.title,
            subtitle: `by @${post.author.username} • ${post.category}`,
            url: `/posts/${post._id}`,
          }))
        );
      }

      if (!type || type === "discussions") {
        const discussions = await Discussion.find({
          title: { $regex: searchQuery, $options: "i" },
        })
          .populate("author", "username")
          .select("_id title category author")
          .limit(5);

        suggestions.push(
          ...discussions.map((discussion) => ({
            type: "discussion",
            id: discussion._id,
            title: discussion.title,
            subtitle: `by @${discussion.author.username} • ${discussion.category}`,
            url: `/discussions/${discussion._id}`,
          }))
        );
      }

      // Sort suggestions by relevance (exact matches first)
      suggestions.sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(searchQuery.toLowerCase());
        const bExact = b.title.toLowerCase().startsWith(searchQuery.toLowerCase());
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      res.json({
        success: true,
        data: suggestions.slice(0, 10), // Limit to 10 total suggestions
      });
    } catch (error) {
      console.error("Search suggestions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get search suggestions",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  })
);

module.exports = router;
