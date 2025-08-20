const express = require("express");
const router = express.Router();
const asyncHandler = require("../utils/asyncHandler");
const { protect } = require("../middleware/auth");
const aiService = require("../utils/aiService");
const User = require("../models/User");
const AIConversation = require("../models/AIConversation");
const AIUsage = require("../models/AIUsage");
const DailyTokenUsage = require("../models/DailyTokenUsage");
const {
  aiRateLimit,
  trackAIUsage,
  getAIUsageStats,
} = require("../middleware/aiRateLimit");
const {
  validateAIChat,
  validateCodeReview,
  validateDebugging,
  validateLearning,
  validateProjectAdvice,
  validateConversationId,
  validateCreateConversation,
  validateUpdateConversation,
  validateQueryParams,
  handleValidationErrors,
  sanitizeRequestBody,
} = require("../middleware/aiValidation");

// Get available AI contexts
router.get(
  "/contexts",
  protect,
  asyncHandler(async (req, res) => {
    const contexts = aiService.getAvailableContexts();
    res.json({
      success: true,
      data: contexts,
    });
  })
);

// Get available AI models
router.get(
  "/models",
  protect,
  asyncHandler(async (req, res) => {
    const models = aiService.getAvailableModels();
    res.json({
      success: true,
      data: models,
    });
  })
);

// Get user's AI usage statistics
router.get(
  "/stats",
  [protect, getAIUsageStats],
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: req.aiStats,
    });
  })
);

// Get user's daily token usage and limits
router.get(
  "/token-usage",
  protect,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const today = new Date();

    // Get user's subscription plan
    const user = await User.findById(userId).select("subscription");
    const userPlan = user.subscription.plan;

    // Get daily usage for all models
    const dailyUsage = await DailyTokenUsage.getTotalDailyUsage(userId, today);
    const usageData = dailyUsage[0] || {
      totalTokens: 0,
      totalRequests: 0,
      totalCost: 0,
      modelBreakdown: [],
    };

    // Get limits for user's plan
    const limits = {
      free: {
        "gpt-4o": 0,
        "gpt-4o-mini": 10000,
        "gpt-3.5-turbo": 15000,
        "deepseek-r1": 20000,
      },
      premium: {
        "gpt-4o": 50000,
        "gpt-4o-mini": 50000,
        "gpt-3.5-turbo": 100000,
        "deepseek-r1": 100000,
      },
      pro: {
        "gpt-4o": 200000,
        "gpt-4o-mini": 200000,
        "gpt-3.5-turbo": 500000,
        "deepseek-r1": 500000,
      },
    };

    const userLimits = limits[userPlan];

    // Calculate remaining tokens for each model
    const modelBreakdown = Object.keys(userLimits).map((model) => {
      const modelUsage = usageData.modelBreakdown.find(
        (m) => m.model === model
      );
      const tokensUsed = modelUsage ? modelUsage.tokens : 0;
      const limit = userLimits[model];

      return {
        model,
        tokensUsed,
        limit,
        remaining: Math.max(0, limit - tokensUsed),
        percentageUsed: limit > 0 ? Math.round((tokensUsed / limit) * 100) : 0,
      };
    });

    res.json({
      success: true,
      data: {
        userPlan,
        totalTokensUsed: usageData.totalTokens,
        totalRequests: usageData.totalRequests,
        totalCost: usageData.totalCost,
        modelBreakdown,
        resetTime: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        ).toISOString(),
      },
    });
  })
);

// Get user's conversations with search and filtering
router.get(
  "/conversations",
  [protect, validateQueryParams, handleValidationErrors],
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      context,
      sort = "lastActivity",
      order = "desc",
      search,
      hasPinned,
    } = req.query;

    const query = { user: req.user._id };
    if (context) query.context = context;

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { "messages.content": { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Add pinned filter
    if (hasPinned === "true") {
      query.pinnedMessagesCount = { $gt: 0 };
    }

    const sortObj = {};
    sortObj[sort] = order === "desc" ? -1 : 1;

    const conversations = await AIConversation.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("project", "title")
      .select("-messages");

    const total = await AIConversation.countDocuments(query);

    res.json({
      success: true,
      data: {
        conversations,
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

// Get conversation statistics
router.get(
  "/conversations/stats",
  [protect],
  asyncHandler(async (req, res) => {
    try {
      const stats = await AIConversation.getUserStats(req.user._id);
      const result = stats[0] || {
        totalConversations: 0,
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        averageMessagesPerConversation: 0,
      };

      // Get context distribution
      const contextStats = await AIConversation.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: "$context",
            count: { $sum: 1 },
            totalMessages: { $sum: { $size: "$messages" } },
          },
        },
        { $sort: { count: -1 } },
      ]);

      // Get recent activity
      const recentActivity = await AIConversation.find({ user: req.user._id })
        .sort({ lastActivity: -1 })
        .limit(5)
        .select("title context lastActivity messageCount");

      res.json({
        success: true,
        data: {
          ...result,
          contextStats,
          recentActivity,
        },
      });
    } catch (error) {
      console.error("Error fetching conversation stats:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching conversation statistics",
      });
    }
  })
);

// Pin a message in a conversation
router.post(
  "/conversations/:conversationId/pin/:messageIndex",
  protect,
  asyncHandler(async (req, res) => {
    const { conversationId, messageIndex } = req.params;
    const index = parseInt(messageIndex);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message index",
      });
    }

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await conversation.pinMessage(index);

    res.json({
      success: true,
      message: "Message pinned successfully",
      data: {
        conversationId,
        messageIndex: index,
        pinnedMessagesCount: conversation.pinnedMessagesCount,
      },
    });
  })
);

// Unpin a message in a conversation
router.delete(
  "/conversations/:conversationId/pin/:messageIndex",
  protect,
  asyncHandler(async (req, res) => {
    const { conversationId, messageIndex } = req.params;
    const index = parseInt(messageIndex);

    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message index",
      });
    }

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    await conversation.unpinMessage(index);

    res.json({
      success: true,
      message: "Message unpinned successfully",
      data: {
        conversationId,
        messageIndex: index,
        pinnedMessagesCount: conversation.pinnedMessagesCount,
      },
    });
  })
);

// Get pinned messages for a conversation
router.get(
  "/conversations/:conversationId/pinned",
  protect,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const pinnedMessages = conversation.getPinnedMessages();

    res.json({
      success: true,
      data: {
        conversationId,
        pinnedMessages,
        pinnedCount: conversation.pinnedMessagesCount,
      },
    });
  })
);

// Get specific conversation
router.get(
  "/conversations/:conversationId",
  [protect, validateConversationId, handleValidationErrors],
  asyncHandler(async (req, res) => {
    const conversation = await AIConversation.findOne({
      _id: req.params.conversationId,
      user: req.user._id,
    }).populate("project", "title");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  })
);

// Create new conversation
router.post(
  "/conversations",
  [protect, validateCreateConversation, handleValidationErrors],
  asyncHandler(async (req, res) => {
    const { title, context, projectId, tags } = req.body;

    const conversation = new AIConversation({
      user: req.user._id,
      title,
      context,
      project: projectId,
      tags: tags || [],
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      data: conversation,
    });
  })
);

// Update conversation
router.put(
  "/conversations/:conversationId",
  [
    protect,
    validateConversationId,
    validateUpdateConversation,
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const { title, tags } = req.body;

    const conversation = await AIConversation.findOneAndUpdate(
      { _id: req.params.conversationId, user: req.user._id },
      { title, tags },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      data: conversation,
    });
  })
);

// Delete conversation
router.delete(
  "/conversations/:conversationId",
  [protect, validateConversationId, handleValidationErrors],
  asyncHandler(async (req, res) => {
    const conversation = await AIConversation.findOneAndDelete({
      _id: req.params.conversationId,
      user: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    res.json({
      success: true,
      message: "Conversation deleted successfully",
      data: {
        conversationId: req.params.conversationId,
      },
    });
  })
);

// Search conversations
router.get(
  "/conversations/search",
  [protect, validateQueryParams, handleValidationErrors],
  asyncHandler(async (req, res) => {
    const { q, context, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const query = {
      user: req.user._id,
      $or: [
        { title: { $regex: q, $options: "i" } },
        { "messages.content": { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ],
    };

    if (context) query.context = context;

    const conversations = await AIConversation.find(query)
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .populate("project", "title")
      .select("title context lastActivity messageCount tags project");

    res.json({
      success: true,
      data: conversations,
    });
  })
);

// General chat endpoint
router.post(
  "/chat",
  [
    protect,
    aiRateLimit("general"),
    trackAIUsage,
    sanitizeRequestBody,
    validateAIChat,
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const {
      message,
      context = "general",
      conversationId,
      model = "gpt-4o-mini",
    } = req.body;

    const user = await User.findById(req.user._id).select(
      "skills level experience"
    );
    const userContext = {
      skills: user.skills || [],
      level: user.level || "beginner",
      experience: user.experience || 0,
    };

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      // Create new conversation with auto-generated title
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      conversation = new AIConversation({
        user: req.user._id,
        title,
        context,
      });
      await conversation.save();
    }

    // Add user message to conversation
    await conversation.addMessage("user", message);

    const startTime = Date.now();
    const response = await aiService.chat(
      req.user._id,
      message,
      context,
      userContext,
      model
    );
    const processingTime = Date.now() - startTime;

    // Add AI response to conversation
    await conversation.addMessage("assistant", response.content, {
      tokens: response.tokens,
      model: model,
      processingTime,
    });

    // Update response with conversation info
    response.conversationId = conversation._id;
    response.processingTime = processingTime;

    res.json({
      success: true,
      data: response,
    });
  })
);

// Code review endpoint
router.post(
  "/code-review",
  [
    protect,
    aiRateLimit("codeReview"),
    trackAIUsage,
    sanitizeRequestBody,
    validateCodeReview,
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const {
      code,
      language,
      focus = "all",
      conversationId,
      model = "gpt-4o-mini",
    } = req.body;

    // Get user context
    const user = await User.findById(req.user._id).select(
      "skills level experience"
    );
    const userContext = {
      skills: user.skills || [],
      level: user.level || "beginner",
      experience: user.experience || 0,
    };

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      const title = `Code Review: ${language}`;
      conversation = new AIConversation({
        user: req.user._id,
        title,
        context: "codeReview",
      });
      await conversation.save();
    }

    // Add user message to conversation
    const userMessage = `Code Review Request:\nLanguage: ${language}\nFocus: ${focus}\n\nCode:\n${code}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();
    const response = await aiService.codeReview(
      req.user._id,
      code,
      language,
      userContext,
      focus,
      model
    );
    const processingTime = Date.now() - startTime;

    // Add AI response to conversation
    await conversation.addMessage("assistant", response.content, {
      tokens: response.tokens,
      model: model,
      processingTime,
    });

    // Update response with conversation info
    response.conversationId = conversation._id;
    response.processingTime = processingTime;

    res.json({
      success: true,
      data: response,
    });
  })
);

// Debugging endpoint
router.post(
  "/debug",
  [
    protect,
    aiRateLimit("debugging"),
    trackAIUsage,
    sanitizeRequestBody,
    validateDebugging,
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const {
      code,
      error,
      language,
      conversationId,
      model = "gpt-4o-mini",
    } = req.body;

    // Get user context
    const user = await User.findById(req.user._id).select(
      "skills level experience"
    );
    const userContext = {
      skills: user.skills || [],
      level: user.level || "beginner",
      experience: user.experience || 0,
    };

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      const title = `Debug: ${language}`;
      conversation = new AIConversation({
        user: req.user._id,
        title,
        context: "debugging",
      });
      await conversation.save();
    }

    // Add user message to conversation
    const userMessage = `Debug Request:\nLanguage: ${language}\n\nCode:\n${code}\n\nError:\n${error}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();
    const response = await aiService.debugCode(
      req.user._id,
      code,
      error,
      language,
      userContext,
      model
    );
    const processingTime = Date.now() - startTime;

    // Add AI response to conversation
    await conversation.addMessage("assistant", response.content, {
      tokens: response.tokens,
      model: model,
      processingTime,
    });

    // Update response with conversation info
    response.conversationId = conversation._id;
    response.processingTime = processingTime;

    res.json({
      success: true,
      data: response,
    });
  })
);

// Learning assistance endpoint
router.post(
  "/learn",
  [
    protect,
    aiRateLimit("learning"),
    trackAIUsage,
    sanitizeRequestBody,
    validateLearning,
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const {
      topic,
      level,
      focus = "all",
      conversationId,
      model = "gpt-4o-mini",
    } = req.body;

    // Get user context
    const user = await User.findById(req.user._id).select(
      "skills level experience"
    );
    const userContext = {
      skills: user.skills || [],
      level: user.level || "beginner",
      experience: user.experience || 0,
    };

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      const title = `Learning: ${topic}`;
      conversation = new AIConversation({
        user: req.user._id,
        title,
        context: "learning",
      });
      await conversation.save();
    }

    // Add user message to conversation
    const userMessage = `Learning Request:\nTopic: ${topic}\nLevel: ${
      level || "auto"
    }\nFocus: ${focus}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();
    const response = await aiService.learningHelp(
      req.user._id,
      topic,
      userContext,
      level,
      focus,
      model
    );
    const processingTime = Date.now() - startTime;

    // Add AI response to conversation
    await conversation.addMessage("assistant", response.content, {
      tokens: response.tokens,
      model: model,
      processingTime,
    });

    // Update response with conversation info
    response.conversationId = conversation._id;
    response.processingTime = processingTime;

    res.json({
      success: true,
      data: response,
    });
  })
);

// Project advice endpoint
router.post(
  "/project-advice",
  [
    protect,
    aiRateLimit("projectHelp"),
    trackAIUsage,
    sanitizeRequestBody,
    validateProjectAdvice,
    handleValidationErrors,
  ],
  asyncHandler(async (req, res) => {
    const {
      description,
      projectId,
      aspect = "all",
      conversationId,
      model = "gpt-4o-mini",
    } = req.body;

    // Get user context
    const user = await User.findById(req.user._id).select(
      "skills level experience"
    );
    const userContext = {
      skills: user.skills || [],
      level: user.level || "beginner",
      experience: user.experience || 0,
    };

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await AIConversation.findOne({
        _id: conversationId,
        user: req.user._id,
      });
    }

    if (!conversation) {
      const title = `Project Advice: ${aspect}`;
      conversation = new AIConversation({
        user: req.user._id,
        title,
        context: "projectHelp",
        project: projectId,
      });
      await conversation.save();
    }

    // Add user message to conversation
    const userMessage = `Project Advice Request:\nAspect: ${aspect}\nProject ID: ${
      projectId || "N/A"
    }\n\nDescription:\n${description}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();
    const response = await aiService.projectAdvice(
      req.user._id,
      description,
      userContext,
      projectId,
      aspect,
      model
    );
    const processingTime = Date.now() - startTime;

    // Add AI response to conversation
    await conversation.addMessage("assistant", response.content, {
      tokens: response.tokens,
      model: model,
      processingTime,
    });

    // Update response with conversation info
    response.conversationId = conversation._id;
    response.processingTime = processingTime;

    res.json({
      success: true,
      data: response,
    });
  })
);

// Clear AI cache (admin only)
router.delete(
  "/cache",
  protect,
  asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    aiService.clearCache();

    res.json({
      success: true,
      message: "AI cache cleared successfully",
    });
  })
);

module.exports = router;
