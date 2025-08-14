const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const Post = require("../models/Post");
const Project = require("../models/Project");
const User = require("../models/User");
const Comment = require("../models/Comment");

const router = express.Router();

// Get trending posts, projects, and developers
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Trending posts: most liked + commented in last 7 days
    const postsRaw = await Post.find({ createdAt: { $gte: since } })
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(5)
      .select("title content author likes createdAt image tags")
      .populate({
        path: "author",
        select: "username firstName lastName avatar followersCount followers",
        options: { virtuals: true },
      });

    // Get comment counts for each post from the separate Comment model
    const postsWithCommentCounts = await Promise.all(
      postsRaw.map(async (post) => {
        const commentCount = await Comment.countDocuments({ post: post._id });
        const obj = post.toObject({ virtuals: true });
        obj.likesCount = post.likesCount;
        obj.commentsCount = commentCount;
        if (
          obj.author &&
          post.author &&
          post.author.followersCount !== undefined
        ) {
          obj.author.followersCount = post.author.followersCount;
        }
        return obj;
      })
    );

    // Sort by likes and comment counts
    const posts = postsWithCommentCounts.sort((a, b) => {
      const aScore = (a.likesCount || 0) + (a.commentsCount || 0) * 0.5;
      const bScore = (b.likesCount || 0) + (b.commentsCount || 0) * 0.5;
      return bScore - aScore;
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
      .select(
        "username firstName lastName avatar bio followers lastSeen createdAt isActive"
      )
      .populate("followers", "username");

    // Sort by actual followers count
    console.log("Raw developers count:", developersRaw.length);
    const developers = developersRaw
      .map((dev) => dev.toObject({ virtuals: true }))
      .filter(dev => dev.isActive !== false) 
      .sort((a, b) => {
       
        const aFollowers = a.followersCount || 0;
        const bFollowers = b.followersCount || 0;
        
        if (aFollowers !== bFollowers) {
          return bFollowers - aFollowers;
        }
        
        const aLastSeen = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bLastSeen = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        
        if (aLastSeen !== bLastSeen) {
          return bLastSeen - aLastSeen;
        }
        
        // Tertiary sort: most recently created
        const aCreated = new Date(a.createdAt).getTime();
        const bCreated = new Date(b.createdAt).getTime();
        return bCreated - aCreated;
      })
      .slice(0, 10);
    
    console.log("Final developers count:", developers.length);
    console.log("Developers data:", developers.map(d => ({
      username: d.username,
      name: `${d.firstName} ${d.lastName}`,
      followersCount: d.followersCount
    })));

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

// Debug endpoint to check follower counts
router.get("/debug-developers", asyncHandler(async (req, res) => {
  const developersRaw = await User.find()
    .select("username firstName lastName followers lastSeen createdAt isActive")
    .populate("followers", "username");

  const developers = developersRaw
    .map((dev) => dev.toObject({ virtuals: true }))
    .filter(dev => dev.isActive !== false) 
    .sort((a, b) => {
      const aFollowers = a.followersCount || 0;
      const bFollowers = b.followersCount || 0;
      return bFollowers - aFollowers;
    })
    .slice(0, 10)
    .map(dev => ({
      username: dev.username,
      name: `${dev.firstName} ${dev.lastName}`,
      followersCount: dev.followersCount,
      followers: dev.followers.map(f => f.username),
      lastSeen: dev.lastSeen,
      createdAt: dev.createdAt
    }));

  res.json({
    success: true,
    data: developers
  });
}));

module.exports = router;
