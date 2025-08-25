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

// Get token limits and model availability for user
router.get(
  "/token-limits",
  protect,
  asyncHandler(async (req, res) => {
    const userPlan = req.user.subscriptionPlan || "free";
    const userId = req.user._id;

    const models = Object.keys(aiService.AI_MODELS);
    const tokenLimits = {};

    for (const modelId of models) {
      const availability = aiService.checkModelAvailability(modelId, userPlan);

      const usage = await aiService.checkTokenLimit(userId, modelId, userPlan);

      tokenLimits[modelId] = {
        modelId,
        name: aiService.AI_MODELS[modelId]?.name || modelId,
        available: availability.available,
        requiresPremium: availability.requiresPremium,
        currentUsage: usage.currentUsage,
        limit: usage.limit,
        remaining: usage.remaining,
        exceeded: usage.exceeded,
      };
    }

    res.json({
      success: true,
      data: {
        userPlan,
        tokenLimits,
        availableModels: Object.values(tokenLimits).filter((m) => m.available),
      },
    });
  })
);

// Get intelligent model recommendations
router.get(
  "/model-recommendations",
  protect,
  asyncHandler(async (req, res) => {
    const { context = "general", ...userContext } = req.query;

    const recommendations = await aiService.getModelRecommendations(
      req.user._id,
      context,
      userContext
    );

    res.json({
      success: true,
      data: {
        context,
        recommendations,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

// Get AI models health status
router.get(
  "/health",
  protect,
  asyncHandler(async (req, res) => {
    const healthStatus = await aiService.getAllModelsHealth();
    res.json({
      success: true,
      data: healthStatus,
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

    // Import token limits from the new configuration
    const { TOKEN_LIMITS, getTokenLimit } = require("../config/tokenLimits");
    const userLimits = TOKEN_LIMITS[userPlan] || TOKEN_LIMITS.free;

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

    // Check token limits before processing
    const userPlan = req.user.subscriptionPlan || "free";
    const tokenLimitCheck = await aiService.checkTokenLimit(
      req.user._id,
      model,
      userPlan
    );

    if (!tokenLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: "Daily token limit exceeded for this model",
        data: {
          model,
          currentUsage: tokenLimitCheck.currentUsage,
          limit: tokenLimitCheck.limit,
          remaining: tokenLimitCheck.remaining,
          exceeded: tokenLimitCheck.exceeded,
        },
      });
    }

    // Check model availability
    const modelAvailability = aiService.checkModelAvailability(model, userPlan);
    if (!modelAvailability.available) {
      return res.status(403).json({
        success: false,
        message: modelAvailability.requiresPremium
          ? "This model requires a premium subscription"
          : "This model is not available for your plan",
        data: {
          model,
          requiresPremium: modelAvailability.requiresPremium,
          availableModels: modelAvailability.availableModels,
        },
      });
    }

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

    // Get conversation history for context
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add user message to conversation
    await conversation.addMessage("user", message);

    const startTime = Date.now();

    try {
      const response = await aiService.chat(
        req.user._id,
        message,
        context,
        userContext,
        model,
        conversationHistory
      );
      const processingTime = Date.now() - startTime;

      if (response && response.content) {
        await conversation.addMessage("assistant", response.content, {
          tokens: response.tokens,
          cost: response.cost,
          model: model,
          processingTime,
        });
      }

      // Update response with conversation info
      response.conversationId = conversation._id;
      response.processingTime = processingTime;

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("AI Service Error:", error);

      res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: error.message,
      });
    }
  })
);

// Streaming chat endpoint with Server-Sent Events
router.post(
  "/chat/stream",
  [
    protect,
    aiRateLimit("general"),
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

    // Check token limits before processing
    const userPlan = req.user.subscriptionPlan || "free";
    const tokenLimitCheck = await aiService.checkTokenLimit(
      req.user._id,
      model,
      userPlan
    );

    if (!tokenLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: "Daily token limit exceeded for this model",
        data: {
          model,
          currentUsage: tokenLimitCheck.currentUsage,
          limit: tokenLimitCheck.limit,
          remaining: tokenLimitCheck.remaining,
          exceeded: tokenLimitCheck.exceeded,
        },
      });
    }

    // Check model availability
    const modelAvailability = aiService.checkModelAvailability(model, userPlan);
    if (!modelAvailability.available) {
      return res.status(403).json({
        success: false,
        message: modelAvailability.requiresPremium
          ? "This model requires a premium subscription"
          : "This model is not available for your plan",
        data: {
          model,
          requiresPremium: modelAvailability.requiresPremium,
          availableModels: modelAvailability.availableModels,
        },
      });
    }

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
      const title =
        message.length > 50 ? message.substring(0, 50) + "..." : message;
      conversation = new AIConversation({
        user: req.user._id,
        title,
        context,
      });
      await conversation.save();
    }

    // Get conversation history for context
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    await conversation.addMessage("user", message);

    // Set up SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    const startTime = Date.now();
    let fullResponse = "";
    let totalTokens = 0;
    let totalCost = 0;

    try {
      res.write(
        `data: ${JSON.stringify({
          type: "connection",
          message: "Connected to AI stream",
          conversationId: conversation._id,
        })}\n\n`
      );

      res.write(
        `data: ${JSON.stringify({
          type: "thinking",
          message: "AI is thinking...",
        })}\n\n`
      );

      // Stream the response
      const stream = await aiService.chatStream(
        req.user._id,
        message,
        context,
        userContext,
        model,
        conversationHistory
      );

      // Handle streaming response
      for await (const chunk of stream) {
        if (chunk.type === "content") {
          fullResponse += chunk.content;
          res.write(
            `data: ${JSON.stringify({
              type: "content",
              content: chunk.content,
              conversationId: conversation._id,
            })}\n\n`
          );
        } else if (chunk.type === "usage") {
          totalTokens = chunk.tokens;
          totalCost = chunk.cost;
          // console.log(
          //   `Streaming usage: ${totalTokens} tokens, $${totalCost} cost`
          // );
        } else if (chunk.type === "error") {
          res.write(
            `data: ${JSON.stringify({
              type: "error",
              error: chunk.error,
            })}\n\n`
          );
          break;
        }
      }

      // Add assistant message to conversation with usage information
      if (fullResponse) {
        // console.log(
        //   `Saving conversation with tokens: ${totalTokens}, cost: ${totalCost}`
        // );
        await conversation.addMessage("assistant", fullResponse, {
          tokens: totalTokens,
          cost: totalCost,
          model: model,
          processingTime: Date.now() - startTime,
        });

        // Track AI usage for streaming requests
        try {
          const today = new Date();
          let usage = await AIUsage.getDailyUsage(req.user._id, today);

          if (!usage) {
            usage = new AIUsage({
              user: req.user._id,
              date: today,
              context: context,
            });
          }

          await usage.incrementUsage(
            totalTokens,
            totalCost,
            Date.now() - startTime
          );

          // Also record token usage for the specific model
          await aiService.recordTokenUsage(
            req.user._id,
            model,
            totalTokens,
            totalCost
          );
        } catch (error) {
          console.error("Error tracking AI usage for streaming:", error);
        }
      } else {
        // Handle empty response with fallback
        try {
          const fallbackResponse = aiService.generateFallbackResponse(
            message,
            context,
            conversationHistory
          );

          // Send fallback response as content chunks
          const fallbackChunks = fallbackResponse
            .split(" ")
            .map((word) => word + " ");
          for (const chunk of fallbackChunks) {
            res.write(
              `data: ${JSON.stringify({
                type: "content",
                content: chunk,
                conversationId: conversation._id,
              })}\n\n`
            );

            await new Promise((resolve) => setTimeout(resolve, 50));
          }

          // Save fallback response to conversation
          await conversation.addMessage("assistant", fallbackResponse, {
            tokens: Math.ceil((fallbackResponse.length + 500) / 4),
            cost: 0,
            model: model,
            processingTime: Date.now() - startTime,
          });

          totalTokens = Math.ceil((fallbackResponse.length + 500) / 4);
          totalCost = 0;
        } catch (fallbackError) {
          console.error("Fallback response generation failed:", fallbackError);

          // Send a simple fallback message
          const simpleFallback =
            "I apologize, but I'm having trouble generating a response right now. Please try rephrasing your question or try again in a moment.";

          res.write(
            `data: ${JSON.stringify({
              type: "content",
              content: simpleFallback,
              conversationId: conversation._id,
            })}\n\n`
          );

          // Save simple fallback to conversation
          await conversation.addMessage("assistant", simpleFallback, {
            tokens: Math.ceil((simpleFallback.length + 500) / 4),
            cost: 0,
            model: model,
            processingTime: Date.now() - startTime,
          });

          totalTokens = Math.ceil((simpleFallback.length + 500) / 4);
          totalCost = 0;
        }
      }

      // Send completion event
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          conversationId: conversation._id,
          totalTokens,
          totalCost,
          processingTime: Date.now() - startTime,
        })}\n\n`
      );
    } catch (error) {
      console.error("AI Streaming Error:", error);

      // Handle specific error types
      let errorMessage = "Something went wrong!";

      if (error.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again in a moment.";
      } else if (
        error.message &&
        error.message.includes("generateFallbackResponse")
      ) {
        errorMessage = "AI service temporarily unavailable. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: errorMessage,
        })}\n\n`
      );
    } finally {
      res.end();
    }
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

    // Check token limits before processing
    const userPlan = req.user.subscriptionPlan || "free";
    const tokenLimitCheck = await aiService.checkTokenLimit(
      req.user._id,
      model,
      userPlan
    );

    if (!tokenLimitCheck.allowed) {
      return res.status(429).json({
        success: false,
        message: "Daily token limit exceeded for this model",
        data: {
          model,
          currentUsage: tokenLimitCheck.currentUsage,
          limit: tokenLimitCheck.limit,
          remaining: tokenLimitCheck.remaining,
          exceeded: tokenLimitCheck.exceeded,
        },
      });
    }

    // Check model availability
    const modelAvailability = aiService.checkModelAvailability(model, userPlan);
    if (!modelAvailability.available) {
      return res.status(403).json({
        success: false,
        message: modelAvailability.requiresPremium
          ? "This model requires a premium subscription"
          : "This model is not available for your plan",
        data: {
          model,
          requiresPremium: modelAvailability.requiresPremium,
          availableModels: modelAvailability.availableModels,
        },
      });
    }

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

    // Get conversation history for context
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add user message to conversation
    const userMessage = `Code Review Request:\nLanguage: ${language}\nFocus: ${focus}\n\nCode:\n${code}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();

    try {
      const response = await aiService.codeReview(
        req.user._id,
        code,
        language,
        userContext,
        focus,
        model,
        conversationHistory
      );
      const processingTime = Date.now() - startTime;

      if (response && response.content) {
        await conversation.addMessage("assistant", response.content, {
          tokens: response.tokens,
          cost: response.cost,
          model: model,
          processingTime,
        });
      }

      // Update response with conversation info
      response.conversationId = conversation._id;
      response.processingTime = processingTime;

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("AI Service Error:", error);

      res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: error.message,
      });
    }
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

    // Get conversation history for context
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add user message to conversation
    const userMessage = `Debug Request:\nLanguage: ${language}\n\nCode:\n${code}\n\nError:\n${error}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();

    try {
      const response = await aiService.debugCode(
        req.user._id,
        code,
        error,
        language,
        userContext,
        model,
        conversationHistory
      );
      const processingTime = Date.now() - startTime;

      if (response && response.content) {
        await conversation.addMessage("assistant", response.content, {
          tokens: response.tokens,
          cost: response.cost,
          model: model,
          processingTime,
        });
      }

      response.conversationId = conversation._id;
      response.processingTime = processingTime;

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("AI Service Error:", error);

      res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: error.message,
      });
    }
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

    // Get conversation history for context
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add user message to conversation
    const userMessage = `Learning Request:\nTopic: ${topic}\nLevel: ${
      level || "auto"
    }\nFocus: ${focus}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();

    try {
      const response = await aiService.learningHelp(
        req.user._id,
        topic,
        userContext,
        level,
        focus,
        model,
        conversationHistory
      );
      const processingTime = Date.now() - startTime;

      if (response && response.content) {
        await conversation.addMessage("assistant", response.content, {
          tokens: response.tokens,
          cost: response.cost,
          model: model,
          processingTime,
        });
      }

      response.conversationId = conversation._id;
      response.processingTime = processingTime;

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("AI Service Error:", error);

      res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: error.message,
      });
    }
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

    // Get conversation history for context
    const conversationHistory = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add user message to conversation
    const userMessage = `Project Advice Request:\nAspect: ${aspect}\nProject ID: ${
      projectId || "N/A"
    }\n\nDescription:\n${description}`;
    await conversation.addMessage("user", userMessage);

    const startTime = Date.now();

    try {
      const response = await aiService.projectAdvice(
        req.user._id,
        description,
        userContext,
        projectId,
        aspect,
        model,
        conversationHistory
      );
      const processingTime = Date.now() - startTime;

      if (response && response.content) {
        await conversation.addMessage("assistant", response.content, {
          tokens: response.tokens,
          cost: response.cost,
          model: model,
          processingTime,
        });
      }

      response.conversationId = conversation._id;
      response.processingTime = processingTime;

      res.json({
        success: true,
        data: response,
      });
    } catch (error) {
      console.error("AI Service Error:", error);

      res.status(500).json({
        success: false,
        message: "Something went wrong!",
        error: error.message,
      });
    }
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
