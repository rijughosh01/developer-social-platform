const { RateLimiterRedis } = require("rate-limiter-flexible");
const AIUsage = require("../models/AIUsage");
const redisService = require("../utils/redisService");

// Rate limiters for different contexts - using Redis for distributed rate limiting
const createRateLimiters = () => {
  const redisClient = redisService.getSocketIOClient();
  
  if (!redisClient) {
    console.warn("Redis not available for rate limiting, falling back to in-memory");
    return {
      general: new (require("rate-limiter-flexible").RateLimiterMemory)({
        keyGenerator: (req) => req.user.id,
        points: 50,
        duration: 3600,
        blockDuration: 1800,
      }),
      codeReview: new (require("rate-limiter-flexible").RateLimiterMemory)({
        keyGenerator: (req) => req.user.id,
        points: 20,
        duration: 3600,
        blockDuration: 1800,
      }),
      debugging: new (require("rate-limiter-flexible").RateLimiterMemory)({
        keyGenerator: (req) => req.user.id,
        points: 30,
        duration: 3600,
        blockDuration: 1800,
      }),
      learning: new (require("rate-limiter-flexible").RateLimiterMemory)({
        keyGenerator: (req) => req.user.id,
        points: 40,
        duration: 3600,
        blockDuration: 1800,
      }),
      projectHelp: new (require("rate-limiter-flexible").RateLimiterMemory)({
        keyGenerator: (req) => req.user.id,
        points: 25,
        duration: 3600,
        blockDuration: 1800,
      }),
    };
  }

  return {
    general: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ai_rate_limit_general",
      keyGenerator: (req) => req.user.id,
      points: 50,
      duration: 3600,
      blockDuration: 1800,
    }),
    codeReview: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ai_rate_limit_code_review",
      keyGenerator: (req) => req.user.id,
      points: 20,
      duration: 3600,
      blockDuration: 1800,
    }),
    debugging: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ai_rate_limit_debugging",
      keyGenerator: (req) => req.user.id,
      points: 30,
      duration: 3600,
      blockDuration: 1800,
    }),
    learning: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ai_rate_limit_learning",
      keyGenerator: (req) => req.user.id,
      points: 40,
      duration: 3600,
      blockDuration: 1800,
    }),
    projectHelp: new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: "ai_rate_limit_project_help",
      keyGenerator: (req) => req.user.id,
      points: 25,
      duration: 3600,
      blockDuration: 1800,
    }),
  };
};

const rateLimiters = createRateLimiters();

// Daily usage limits
const dailyLimits = {
  general: 200,
  codeReview: 50,
  debugging: 100,
  learning: 150,
  projectHelp: 75,
};

// Check daily usage limit
const checkDailyLimit = async (userId, context) => {
  const today = new Date();
  const usage = await AIUsage.getDailyUsage(userId, today);

  if (usage && usage.requestCount >= dailyLimits[context]) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      limit: dailyLimits[context],
    };
  }

  return {
    allowed: true,
    remaining: usage
      ? dailyLimits[context] - usage.requestCount
      : dailyLimits[context],
    resetTime: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    limit: dailyLimits[context],
  };
};

// Main rate limiting middleware
const aiRateLimit = (context = "general") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required for AI features",
        });
      }

      // Get the appropriate rate limiter
      const limiter = rateLimiters[context];
      if (!limiter) {
        return res.status(400).json({
          success: false,
          message: "Invalid AI context",
        });
      }

      const rateLimitResult = await limiter.consume(req.user.id);

      const dailyLimitResult = await checkDailyLimit(req.user.id, context);

      if (!dailyLimitResult.allowed) {
        const usage = await AIUsage.getDailyUsage(req.user.id, new Date());
        if (usage) {
          await usage.recordRateLimit();
        }

        return res.status(429).json({
          success: false,
          message: "Daily usage limit exceeded",
          limit: dailyLimitResult.limit,
          resetTime: dailyLimitResult.resetTime,
          retryAfter: Math.ceil(
            (dailyLimitResult.resetTime - new Date()) / 1000
          ),
        });
      }

      // Add rate limit info to response headers
      res.set({
        "X-RateLimit-Limit": rateLimitResult.totalPoints,
        "X-RateLimit-Remaining": rateLimitResult.remainingPoints,
        "X-RateLimit-Reset": new Date(
          Date.now() + rateLimitResult.msBeforeNext
        ),
        "X-DailyLimit-Limit": dailyLimitResult.limit,
        "X-DailyLimit-Remaining": dailyLimitResult.remaining,
        "X-DailyLimit-Reset": dailyLimitResult.resetTime,
      });

      req.aiUsage = {
        context,
        rateLimit: rateLimitResult,
        dailyLimit: dailyLimitResult,
      };

      next();
    } catch (error) {
      if (error instanceof Error && error.message === "RateLimiterRes") {
        const usage = await AIUsage.getDailyUsage(req.user.id, new Date());
        if (usage) {
          await usage.recordRateLimit();
        }

        return res.status(429).json({
          success: false,
          message: "Rate limit exceeded",
          retryAfter: Math.ceil(error.msBeforeNext / 1000),
          limit: error.totalPoints,
          remaining: error.remainingPoints,
        });
      }

      console.error("AI Rate limit error:", error);
      return res.status(500).json({
        success: false,
        message: "Rate limiting error",
      });
    }
  };
};

// Middleware to track AI usage after successful request
const trackAIUsage = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    if (res.statusCode === 200 && req.aiUsage) {
      try {
        const responseData = JSON.parse(data);

        setImmediate(async () => {
          try {
            const today = new Date();
            let usage = await AIUsage.getDailyUsage(req.user.id, today);

            if (!usage) {
              usage = new AIUsage({
                user: req.user.id,
                date: today,
                context: req.aiUsage.context,
              });
            }

            const tokens = responseData.data?.tokens || 0;
            const cost = responseData.data?.cost || 0;
            const responseTime = responseData.data?.processingTime || 0;

            await usage.incrementUsage(tokens, cost, responseTime);
          } catch (error) {
            console.error("Error tracking AI usage:", error);
          }
        });
      } catch (error) {
        setImmediate(async () => {
          try {
            const today = new Date();
            let usage = await AIUsage.getDailyUsage(req.user.id, today);

            if (!usage) {
              usage = new AIUsage({
                user: req.user.id,
                date: today,
                context: req.aiUsage.context,
              });
            }

            await usage.incrementUsage(0, 0, 0);
          } catch (error) {
            console.error("Error tracking AI usage:", error);
          }
        });
      }
    }

    originalSend.call(this, data);
  };

  next();
};

// Middleware to get user's AI usage statistics
const getAIUsageStats = async (req, res, next) => {
  try {
    const today = new Date();
    const usage = await AIUsage.getDailyUsage(req.user.id, today);

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const monthlyUsage = await AIUsage.getMonthlyUsage(
      req.user.id,
      currentYear,
      currentMonth
    );

    const favoriteContext =
      monthlyUsage[0]?.contextBreakdown?.[0]?.context || "general";

    const hasUsedToday = usage && usage.requestCount > 0;

    req.aiStats = {
      totalRequests: monthlyUsage[0]?.totalRequests || 0,
      requestsToday: usage?.requestCount || 0,
      favoriteContext: favoriteContext,
      lastUsed: hasUsedToday ? "Today" : "Never",
      totalTokens: monthlyUsage[0]?.totalTokens || 0,
      totalCost: monthlyUsage[0]?.totalCost || 0,
      averageResponseTime: monthlyUsage[0]?.averageResponseTime || 0,
      errors: monthlyUsage[0]?.totalErrors || 0,
      rateLimitHits: monthlyUsage[0]?.totalRateLimitHits || 0,
      daily: usage || {
        requestCount: 0,
        totalTokens: 0,
        totalCost: 0,
        errors: 0,
        rateLimitHits: 0,
      },
      monthly: monthlyUsage[0] || {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        averageResponseTime: 0,
        totalErrors: 0,
        totalRateLimitHits: 0,
        contextBreakdown: [],
      },
      limits: {
        daily: dailyLimits,
        rate: Object.fromEntries(
          Object.entries(rateLimiters).map(([key, limiter]) => [
            key,
            {
              points: limiter.points,
              duration: limiter.duration,
            },
          ])
        ),
      },
    };

    next();
  } catch (error) {
    console.error("Error getting AI usage stats:", error);
    next();
  }
};

module.exports = {
  aiRateLimit,
  trackAIUsage,
  getAIUsageStats,
  dailyLimits,
  rateLimiters,
};
