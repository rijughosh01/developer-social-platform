const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const Post = require("../models/Post");
const Project = require("../models/Project");
const User = require("../models/User");

const router = express.Router();

// Get trending posts, projects, and developers
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Trending posts: most liked + commented in last 7 days
    const postsRaw = await Post.find({ createdAt: { $gte: since } })
      .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
      .limit(5)
      .select("title content author likes comments createdAt image tags")
      .populate({
        path: "author",
        select: "username firstName lastName avatar followersCount followers",
        options: { virtuals: true },
      });

    const posts = postsRaw.map((post) => {
      const obj = post.toObject({ virtuals: true });
      if (
        obj.author &&
        post.author &&
        post.author.followersCount !== undefined
      ) {
        obj.author.followersCount = post.author.followersCount;
      }
      return obj;
    });

    // Trending projects: most liked in last 7 days
    const projectsRaw = await Project.find({ createdAt: { $gte: since } })
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(5)
      .populate({
        path: "owner",
        select: "username firstName lastName avatar followersCount followers",
        options: { virtuals: true },
      });

    const projects = projectsRaw.map((project) => {
      const obj = project.toObject();
      if (
        obj.owner &&
        project.owner &&
        project.owner.followersCount !== undefined
      ) {
        obj.owner.followersCount = project.owner.followersCount;
      }
      return obj;
    });

    // Trending developers: most followers
    const developersRaw = await User.find()
      .sort({ followersCount: -1, lastSeen: -1 })
      .limit(5)
      .select(
        "username firstName lastName avatar followersCount bio followers"
      );

    const developers = developersRaw.map((dev) =>
      dev.toObject({ virtuals: true })
    );

    res.json({
      success: true,
      data: {
        posts,
        projects,
        developers,
      },
    });
  })
);

module.exports = router;
