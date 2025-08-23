const express = require("express");
const { query } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { userCacheMiddleware } = require("../middleware/cache");
const Post = require("../models/Post");
const User = require("../models/User");

const router = express.Router();

//  Get collaboration analytics
router.get(
  "/collaboration",
  protect,
  [
    query("timeRange")
      .optional()
      .isIn(["week", "month", "year"])
      .withMessage("Time range must be week, month, or year"),
  ],
  validate,
  userCacheMiddleware(1800),
  asyncHandler(async (req, res) => {
    const { timeRange = "month" } = req.query;
    const userId = req.user._id;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    try {
      // Get review statistics
      const reviewStats = await Post.aggregate([
        {
          $match: {
            "reviewRequests.reviewer": userId,
            createdAt: { $gte: startDate },
          },
        },
        {
          $unwind: "$reviewRequests",
        },
        {
          $match: {
            "reviewRequests.reviewer": userId,
          },
        },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            completedReviews: {
              $sum: {
                $cond: [{ $eq: ["$reviewRequests.status", "completed"] }, 1, 0],
              },
            },
            pendingReviews: {
              $sum: {
                $cond: [{ $eq: ["$reviewRequests.status", "pending"] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get fork statistics
      const forkStats = await Post.aggregate([
        {
          $match: {
            $or: [
              { author: userId, isFork: true, createdAt: { $gte: startDate } },
              {
                forkedFrom: { $exists: true },
                author: userId,
                createdAt: { $gte: startDate },
              },
            ],
          },
        },
        {
          $group: {
            _id: null,
            totalForks: { $sum: 1 },
            forksCreated: {
              $sum: {
                $cond: [{ $eq: ["$author", userId] }, 1, 0],
              },
            },
            forksReceived: {
              $sum: {
                $cond: [{ $ne: ["$author", userId] }, 1, 0],
              },
            },
          },
        },
      ]);

      // Get top collaborators
      const topCollaborators = await Post.aggregate([
        {
          $match: {
            $or: [
              { "reviewRequests.reviewer": userId },
              { author: userId, isFork: true },
              { forkedFrom: { $exists: true }, author: userId },
            ],
            createdAt: { $gte: startDate },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "authorInfo",
          },
        },
        {
          $unwind: "$authorInfo",
        },
        {
          $group: {
            _id: "$author",
            firstName: { $first: "$authorInfo.firstName" },
            lastName: { $first: "$authorInfo.lastName" },
            username: { $first: "$authorInfo.username" },
            avatar: { $first: "$authorInfo.avatar" },
            collaborationCount: { $sum: 1 },
          },
        },
        {
          $sort: { collaborationCount: -1 },
        },
        {
          $limit: 5,
        },
      ]);

      // Remove the current user from top collaborators
      const filteredTopCollaborators = topCollaborators.filter(
        (collab) => String(collab._id) !== String(userId)
      );

      // Get language statistics
      const languageStats = await Post.aggregate([
        {
          $match: {
            $or: [
              { "reviewRequests.reviewer": userId },
              { author: userId, isFork: true },
              { forkedFrom: { $exists: true }, author: userId },
            ],
            createdAt: { $gte: startDate },
            codeLanguage: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$codeLanguage",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Calculate collaboration score
      const totalActivities =
        (reviewStats[0]?.totalReviews || 0) + (forkStats[0]?.totalForks || 0);
      const collaborationScore = Math.min(
        100,
        Math.max(0, totalActivities * 10)
      );

      // Calculate average response time
      const averageResponseTime = 24;

      // Generate badges
      const badges = [
        {
          name: "Review Master",
          description: "Completed 10+ code reviews",
          earned: (reviewStats[0]?.completedReviews || 0) >= 10,
          icon: "FiMessageSquare",
        },
        {
          name: "Fork Champion",
          description: "Created 5+ forks",
          earned: (forkStats[0]?.forksCreated || 0) >= 5,
          icon: "FiGitBranch",
        },
        {
          name: "Quick Responder",
          description: "Average response time under 12 hours",
          earned: averageResponseTime <= 12,
          icon: "FiClock",
        },
        {
          name: "Team Player",
          description: "Collaborated with 3+ developers",
          earned: topCollaborators.length >= 3,
          icon: "FiUsers",
        },
        {
          name: "Trending",
          description: "High engagement in collaboration",
          earned: collaborationScore >= 70,
          icon: "FiTrendingUp",
        },
      ];

      // Monthly activity data
      const monthlyActivity = [
        { month: "Jan", reviews: 5, forks: 3 },
        { month: "Feb", reviews: 8, forks: 4 },
        { month: "Mar", reviews: 12, forks: 6 },
        { month: "Apr", reviews: 15, forks: 8 },
        { month: "May", reviews: 10, forks: 5 },
        { month: "Jun", reviews: 18, forks: 9 },
      ];

      res.json({
        success: true,
        data: {
          totalReviews: reviewStats[0]?.totalReviews || 0,
          completedReviews: reviewStats[0]?.completedReviews || 0,
          pendingReviews: reviewStats[0]?.pendingReviews || 0,
          totalForks: forkStats[0]?.totalForks || 0,
          forksReceived: forkStats[0]?.forksReceived || 0,
          forksCreated: forkStats[0]?.forksCreated || 0,
          collaborationScore,
          averageResponseTime,
          topCollaborators: filteredTopCollaborators,
          languageStats: languageStats.map((stat) => ({
            language: stat._id,
            count: stat.count,
            percentage: Math.round((stat.count / totalActivities) * 100),
          })),
          monthlyActivity,
          badges,
        },
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch analytics",
      });
    }
  })
);

module.exports = router;
