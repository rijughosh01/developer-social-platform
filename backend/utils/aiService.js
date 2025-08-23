const OpenAI = require("openai");
const NodeCache = require("node-cache");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const axios = require("axios");
const DailyTokenUsage = require("../models/DailyTokenUsage");
const User = require("../models/User");
const {
  getTokenLimit,
  requiresPremium,
  getAvailableModels,
  hasExceededLimit,
  getRemainingTokens,
} = require("../config/tokenLimits");

// Initialize API clients lazily
let openai = null;
let openRouterAPI = null;

function initializeOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

function initializeOpenRouter() {
  if (!openRouterAPI && process.env.OPENROUTER_API_KEY) {
    openRouterAPI = axios.create({
      baseURL: "https://openrouter.ai/api/v1",
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
        "X-Title": "DevLink AI Assistant",
      },
    });
  }
  return openRouterAPI;
}

// Initialize cache for AI responses
const aiCache = new NodeCache({
  stdTTL: parseInt(process.env.AI_CACHE_TTL) || 3600,
  checkperiod: 600,
});

// Rate limiter for AI requests
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.user?.id || req.ip,
  points: parseInt(process.env.AI_RATE_LIMIT) || 100,
  duration: 3600,
});

// Enhanced AI Models Configuration with Advanced Capabilities
const AI_MODELS = {
  "gpt-4o-mini": {
    provider: "openai",
    name: "GPT-4o Mini",
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    maxTokens: 16384,
    contextWindow: 128000,
    requiresPremium: false,
    capabilities: ["reasoning", "coding", "analysis", "general"],
    fallbackModels: ["gpt-3.5-turbo", "deepseek-r1"],
    performanceMetrics: {
      accuracy: 0.88,
      speed: 0.95,
      costEfficiency: 0.85,
      reliability: 0.92,
    },
    contextSpecialties: ["general", "learning", "projectHelp"],
    codeSpecialties: ["debugging", "codeReview"],
    maxConcurrentRequests: 100,
  },
  "gpt-4o": {
    provider: "openai",
    name: "GPT-4o",
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    maxTokens: 4096,
    contextWindow: 128000,
    requiresPremium: true,
    capabilities: ["reasoning", "coding", "analysis", "complex", "creative"],
    fallbackModels: ["gpt-4o-mini", "deepseek-r1"],
    performanceMetrics: {
      accuracy: 0.95,
      speed: 0.8,
      costEfficiency: 0.6,
      reliability: 0.95,
    },
    contextSpecialties: [
      "general",
      "codeReview",
      "debugging",
      "learning",
      "projectHelp",
    ],
    codeSpecialties: ["complex", "architectural", "security"],
    maxConcurrentRequests: 50,
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    name: "GPT-3.5 Turbo",
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
    maxTokens: 4096,
    contextWindow: 16385,
    requiresPremium: false,
    capabilities: ["reasoning", "coding", "analysis", "general"],
    fallbackModels: ["deepseek-r1", "qwen3-coder"],
    performanceMetrics: {
      accuracy: 0.82,
      speed: 0.9,
      costEfficiency: 0.75,
      reliability: 0.88,
    },
    contextSpecialties: ["general", "learning"],
    codeSpecialties: ["basic", "debugging"],
    maxConcurrentRequests: 200,
  },
  "deepseek-r1": {
    provider: "openrouter",
    name: "DeepSeek R1",
    modelId: "deepseek/deepseek-r1-0528:free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    contextWindow: 163840,
    requiresPremium: false,
    capabilities: ["coding", "analysis", "reasoning", "specialized"],
    fallbackModels: ["qwen3-coder", "gpt-3.5-turbo"],
    performanceMetrics: {
      accuracy: 0.9,
      speed: 0.85,
      costEfficiency: 1.0,
      reliability: 0.85,
    },
    contextSpecialties: ["codeReview", "debugging", "projectHelp"],
    codeSpecialties: ["advanced", "optimization", "best-practices"],
    maxConcurrentRequests: 150,
  },
  "qwen3-coder": {
    provider: "openrouter",
    name: "Qwen3 Coder",
    modelId: "qwen/qwen3-coder",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 8192,
    contextWindow: 32768,
    requiresPremium: false,
    capabilities: ["coding", "function-calling", "long-context", "agentic"],
    fallbackModels: ["deepseek-r1", "gpt-3.5-turbo"],
    performanceMetrics: {
      accuracy: 0.87,
      speed: 0.75,
      costEfficiency: 1.0,
      reliability: 0.8,
    },
    contextSpecialties: ["projectHelp", "codeReview"],
    codeSpecialties: ["complex", "function-calling", "repository-analysis"],
    maxConcurrentRequests: 100,
  },
};

// Token Limit Management Functions
const checkTokenLimit = async (userId, modelId, userPlan = "free") => {
  try {
    const today = new Date();
    const usage = await DailyTokenUsage.getDailyUsage(userId, modelId, today);
    const currentUsage = usage ? usage.tokensUsed : 0;

    // Check if user has exceeded the limit
    const exceeded = hasExceededLimit(currentUsage, modelId, userPlan);
    const remaining = getRemainingTokens(currentUsage, modelId, userPlan);
    const limit = getTokenLimit(modelId, userPlan);

    return {
      allowed: !exceeded,
      currentUsage,
      limit,
      remaining,
      exceeded,
    };
  } catch (error) {
    console.error("Error checking token limit:", error);
    return {
      allowed: false,
      currentUsage: 0,
      limit: 0,
      remaining: 0,
      exceeded: true,
      error: error.message,
    };
  }
};

const checkModelAvailability = (modelId, userPlan = "free") => {
  const needsPremium = requiresPremium(modelId, userPlan);

  // Check if model is available for this plan
  const availableModels = getAvailableModels(userPlan);
  const isAvailable = availableModels.includes(modelId);

  return {
    available: isAvailable && !needsPremium,
    requiresPremium: needsPremium,
    availableModels,
  };
};

// Intelligent Model Routing System
class ModelRouter {
  constructor() {
    this.modelHealth = new Map();
    this.requestHistory = new Map();
    this.performanceMetrics = new Map();
  }

  // Calculate model score based on multiple factors
  calculateModelScore(
    modelId,
    requestType,
    userContext,
    availableTokens,
    userPlan
  ) {
    const model = AI_MODELS[modelId];
    if (!model) return 0;

    let score = 0;
    const weights = {
      capability: 0.25,
      performance: 0.2,
      cost: 0.15,
      availability: 0.15,
      userPreference: 0.1,
      context: 0.1,
      health: 0.05,
    };

    // Capability score (0-1)
    const capabilityScore = this.calculateCapabilityScore(
      model,
      requestType,
      userContext
    );
    score += capabilityScore * weights.capability;

    // Performance score (0-1)
    const performanceScore = this.calculatePerformanceScore(model, userContext);
    score += performanceScore * weights.performance;

    // Cost efficiency score (0-1)
    const costScore = this.calculateCostScore(model, userPlan, availableTokens);
    score += costScore * weights.cost;

    // Availability score (0-1)
    const availabilityScore = this.calculateAvailabilityScore(
      modelId,
      userPlan
    );
    score += availabilityScore * weights.availability;

    // User preference score (0-1)
    const preferenceScore = this.calculatePreferenceScore(modelId, userContext);
    score += preferenceScore * weights.userPreference;

    // Context match score (0-1)
    const contextScore = this.calculateContextScore(model, requestType);
    score += contextScore * weights.context;

    // Health score (0-1)
    const healthScore = this.getModelHealth(modelId);
    score += healthScore * weights.health;

    return score;
  }

  calculateCapabilityScore(model, requestType, userContext) {
    let score = 0;

    // Check if model has required capabilities
    if (requestType === "codeReview" && model.capabilities.includes("coding")) {
      score += 0.4;
    }
    if (
      requestType === "debugging" &&
      model.capabilities.includes("analysis")
    ) {
      score += 0.4;
    }
    if (
      requestType === "learning" &&
      model.capabilities.includes("reasoning")
    ) {
      score += 0.4;
    }
    if (
      requestType === "projectHelp" &&
      model.capabilities.includes("complex")
    ) {
      score += 0.4;
    }

    // Check context specialties
    if (model.contextSpecialties.includes(requestType)) {
      score += 0.3;
    }

    // Check user skill level compatibility
    const userLevel = userContext.level || "beginner";
    if (userLevel === "beginner" && model.codeSpecialties.includes("basic")) {
      score += 0.2;
    } else if (
      userLevel === "advanced" &&
      model.codeSpecialties.includes("complex")
    ) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  calculatePerformanceScore(model, userContext) {
    const metrics = model.performanceMetrics;
    let score = 0;

    // Speed preference for real-time interactions
    if (userContext.preferences?.speed === "fast") {
      score += metrics.speed * 0.4;
    } else {
      score += metrics.speed * 0.2;
    }

    // Accuracy preference for critical tasks
    if (userContext.preferences?.accuracy === "high") {
      score += metrics.accuracy * 0.4;
    } else {
      score += metrics.accuracy * 0.2;
    }

    // Reliability for consistent performance
    score += metrics.reliability * 0.2;

    return score;
  }

  calculateCostScore(model, userPlan, availableTokens) {
    // Free models get highest cost score
    if (model.costPer1kInput === 0 && model.costPer1kOutput === 0) {
      return 1.0;
    }

    // Check if user has enough tokens
    const modelLimit = getTokenLimit(model.id, userPlan);
    if (availableTokens <= 0) {
      return 0;
    }

    // Calculate cost efficiency
    const costEfficiency = model.performanceMetrics.costEfficiency;
    const tokenAvailability = Math.min(availableTokens / modelLimit, 1);

    return costEfficiency * 0.7 + tokenAvailability * 0.3;
  }

  calculateAvailabilityScore(modelId, userPlan) {
    const model = AI_MODELS[modelId];

    if (model.requiresPremium && userPlan === "free") {
      return 0;
    }

    const currentLoad = this.getCurrentLoad(modelId);
    const maxLoad = model.maxConcurrentRequests;
    const loadScore = Math.max(0, 1 - currentLoad / maxLoad);

    return loadScore;
  }

  calculatePreferenceScore(modelId, userContext) {
    const userHistory = this.requestHistory.get(userContext.userId) || {};
    const modelUsage = userHistory[modelId] || 0;
    const totalUsage = Object.values(userHistory).reduce((a, b) => a + b, 0);

    if (totalUsage === 0) return 0.5;

    return modelUsage / totalUsage;
  }

  calculateContextScore(model, requestType) {
    // Check if model specializes in this context
    if (model.contextSpecialties.includes(requestType)) {
      return 1.0;
    }

    // Check if model has general capabilities
    if (model.contextSpecialties.includes("general")) {
      return 0.7;
    }

    return 0.3;
  }

  getModelHealth(modelId) {
    return this.modelHealth.get(modelId) || 1.0;
  }

  getCurrentLoad(modelId) {
    return Math.random() * 50;
  }

  // Select optimal model based on request type and user context
  selectOptimalModel(requestType, userContext, availableTokens, userPlan) {
    const availableModels = Object.keys(AI_MODELS).filter((modelId) => {
      const model = AI_MODELS[modelId];
      return !model.requiresPremium || userPlan !== "free";
    });

    const modelScores = availableModels.map((modelId) => ({
      modelId,
      score: this.calculateModelScore(
        modelId,
        requestType,
        userContext,
        availableTokens,
        userPlan
      ),
    }));

    modelScores.sort((a, b) => b.score - a.score);

    return modelScores.slice(0, 3).map((item) => item.modelId);
  }

  // Update model health based on recent performance
  updateModelHealth(modelId, success, responseTime, errorRate) {
    const currentHealth = this.getModelHealth(modelId);
    let newHealth = currentHealth;

    if (success) {
      newHealth = Math.min(1.0, currentHealth + 0.01);
    } else {
      newHealth = Math.max(0.1, currentHealth - 0.05);
    }

    // Adjust based on response time
    const model = AI_MODELS[modelId];
    const expectedTime = 5000;
    if (responseTime > expectedTime * 2) {
      newHealth = Math.max(0.1, newHealth - 0.02);
    }

    this.modelHealth.set(modelId, newHealth);
  }

  // Record request for preference learning
  recordRequest(userId, modelId, success, responseTime) {
    if (!this.requestHistory.has(userId)) {
      this.requestHistory.set(userId, {});
    }

    const userHistory = this.requestHistory.get(userId);
    userHistory[modelId] = (userHistory[modelId] || 0) + 1;

    // Update performance metrics
    this.updateModelHealth(modelId, success, responseTime);
  }
}

const modelRouter = new ModelRouter();

// AI System Prompts for different contexts
const SYSTEM_PROMPTS = {
  general: `You are DevLink AI, a helpful AI assistant for developers on the DevLink social platform. 
  You help developers with coding questions, debugging, best practices, and learning. 
  Be concise, practical, and encouraging. Always provide code examples when relevant.`,

  codeReview: `You are a senior developer doing a code review. Analyze the code for:
  - Bugs and potential issues
  - Performance improvements
  - Security vulnerabilities
  - Code style and best practices
  - Readability and maintainability
  Provide specific, actionable feedback with examples.`,

  debugging: `You are a debugging expert. Help identify and fix issues in the code.
  - Ask clarifying questions if needed
  - Suggest debugging strategies
  - Provide step-by-step solutions
  - Explain the root cause of issues`,

  learning: `You are a programming mentor helping someone learn. 
  - Explain concepts clearly and simply
  - Provide practical examples
  - Suggest learning resources
  - Encourage questions and exploration
  - Build confidence through positive reinforcement`,

  projectHelp: `You are a project development advisor. Help with:
  - Project architecture decisions
  - Technology stack recommendations
  - Best practices for the specific domain
  - Common pitfalls to avoid
  - Resource and tool suggestions`,

  // Special prompt for Qwen3 Coder model
  qwen3Coder: `You are Qwen3 Coder, a specialized AI model optimized for coding tasks. You excel at:
  - Code generation and completion
  - Function calling and tool use
  - Long-context reasoning over repositories
  - Agentic coding tasks
  - Complex programming problems
  - Code analysis and optimization
  Provide precise, efficient, and production-ready code solutions.`,
};

class AIService {
  constructor() {
    this.defaultModel = process.env.DEFAULT_AI_MODEL || "gpt-4o-mini";
  }

  // Check rate limit for user
  async checkRateLimit(req) {
    try {
      await rateLimiter.consume(req.user?.id || req.ip);
      return { allowed: true };
    } catch (rejRes) {
      return {
        allowed: false,
        remainingTime: Math.round(rejRes.msBeforeNext / 1000) || 0,
      };
    }
  }

  // Generate cache key for request
  generateCacheKey(userId, message, context, model) {
    return `ai_${userId}_${context}_${model}_${Buffer.from(message)
      .toString("base64")
      .substring(0, 50)}`;
  }

  getCachedResponse(cacheKey) {
    return aiCache.get(cacheKey);
  }

  cacheResponse(cacheKey, response) {
    aiCache.set(cacheKey, response);
  }

  getAvailableModels() {
    const availableModels = [];

    Object.keys(AI_MODELS).forEach((modelKey) => {
      const model = AI_MODELS[modelKey];

      let isAvailable = false;
      if (model.provider === "openai" && initializeOpenAI()) {
        isAvailable = true;
      } else if (model.provider === "openrouter" && initializeOpenRouter()) {
        isAvailable = true;
      }

      if (isAvailable) {
        availableModels.push({
          id: modelKey,
          ...model,
        });
      }
    });

    return availableModels;
  }

  validateModel(model) {
    return AI_MODELS.hasOwnProperty(model);
  }

  // Method to check if user can access a model
  async checkModelAccess(userId, model) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      throw new Error("Invalid model");
    }

    // Check if model requires premium subscription
    if (modelConfig.requiresPremium && user.subscription.plan === "free") {
      throw new Error("Premium subscription required for this model");
    }

    return true;
  }

  // Method to check daily token limits
  async checkDailyTokenLimit(userId, model, estimatedTokens = 0) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const userPlan = user.subscription.plan;
    const dailyLimit = getTokenLimit(model, userPlan);

    if (dailyLimit === undefined) {
      throw new Error("Invalid model or plan configuration");
    }

    if (dailyLimit === 0) {
      throw new Error("This model is not available for your subscription plan");
    }

    // Get current daily usage
    const today = new Date();
    const currentUsage = await DailyTokenUsage.getDailyUsage(
      userId,
      model,
      today
    );
    const tokensUsed = currentUsage ? currentUsage.tokensUsed : 0;

    // Check if adding estimated tokens would exceed limit
    if (tokensUsed + estimatedTokens > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - tokensUsed);
      throw new Error(
        `Daily token limit exceeded. You have ${remaining} tokens remaining for ${model} today.`
      );
    }

    return {
      tokensUsed,
      dailyLimit,
      remaining: dailyLimit - tokensUsed,
    };
  }

  // Method to record token usage
  async recordTokenUsage(userId, model, tokens, cost) {
    try {
      await DailyTokenUsage.createOrUpdateUsage(userId, model, tokens, cost);
    } catch (error) {
      console.error("Error recording token usage:", error);
    }
  }

  // Calculate cost based on model and tokens
  calculateCost(model, inputTokens, outputTokens) {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) return 0;

    const inputCost = (inputTokens / 1000) * modelConfig.costPer1kInput;
    const outputCost = (outputTokens / 1000) * modelConfig.costPer1kOutput;

    return inputCost + outputCost;
  }

  // Make request to OpenAI
  async makeOpenAIRequest(model, messages, maxTokens = null) {
    const openaiClient = initializeOpenAI();
    if (!openaiClient) {
      throw new Error("OpenAI API key not configured.");
    }

    const modelConfig = AI_MODELS[model];
    const actualMaxTokens = Math.floor(
      maxTokens || modelConfig?.maxTokens || 4096
    );

    const completion = await openaiClient.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: actualMaxTokens,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: model,
    };
  }

  // Make request to OpenRouter (DeepSeek R1)
  async makeOpenRouterRequest(model, messages, maxTokens = null) {
    const openRouterClient = initializeOpenRouter();
    if (!openRouterClient) {
      throw new Error("OpenRouter API key not configured.");
    }
    const modelConfig = AI_MODELS[model];

    try {
      const actualMaxTokens = Math.floor(
        maxTokens || modelConfig?.maxTokens || 4096
      );

      const response = await openRouterClient.post("/chat/completions", {
        model: modelConfig.modelId,
        messages: messages,
        max_tokens: actualMaxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      // Validate response structure
      if (
        !response.data ||
        !response.data.choices ||
        !response.data.choices[0]
      ) {
        throw new Error("Invalid response structure from OpenRouter");
      }

      const choice = response.data.choices[0];

      // Handle empty content - check if there's reasoning available
      let content = choice.message?.content || "";
      if (!content && choice.message?.reasoning) {
        content = `[Response was cut off due to length limits. Partial reasoning: ${choice.message.reasoning}]`;
      }

      if (!content) {
        throw new Error("No content in OpenRouter response");
      }

      // Validate usage data
      if (!response.data.usage) {
        throw new Error("No usage data in OpenRouter response");
      }

      return {
        content: content,
        usage: response.data.usage,
        model: model,
      };
    } catch (error) {
      console.error("OpenRouter API Error:", {
        model: model,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });

      // Handle specific OpenRouter errors
      if (error.response?.status === 429) {
        throw new Error(
          "OpenRouter rate limit exceeded. Please try again later."
        );
      } else if (error.response?.status === 401) {
        throw new Error("OpenRouter API key is invalid or expired.");
      } else if (error.response?.status === 400) {
        throw new Error(
          `OpenRouter request failed: ${
            error.response.data?.error?.message || "Bad request"
          }`
        );
      } else if (error.response?.status >= 500) {
        throw new Error(
          "OpenRouter service is temporarily unavailable. Please try again later."
        );
      } else if (error.code === "ECONNABORTED" || error.code === "ENOTFOUND") {
        throw new Error(
          "Network error connecting to OpenRouter. Please check your internet connection."
        );
      } else {
        throw new Error(`OpenRouter request failed: ${error.message}`);
      }
    }
  }

  async chat(
    userId,
    message,
    context = "general",
    userContext = {},
    requestedModel = "gpt-4o-mini",
    conversationHistory = []
  ) {
    const startTime = Date.now();

    // Validate input parameters
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      throw new Error("Message cannot be empty");
    }

    if (message.trim().length > 4000) {
      throw new Error("Message cannot exceed 4000 characters");
    }

    if (requestedModel && !this.validateModel(requestedModel)) {
      throw new Error(`Invalid model: ${requestedModel}`);
    }

    // Get user plan and available tokens
    const user = await User.findById(userId).select("subscription");
    const userPlan = user?.subscription?.plan || "free";

    const tokenUsage = await DailyTokenUsage.getUserTokenUsage(userId);
    const availableTokens = {};

    Object.keys(AI_MODELS).forEach((modelId) => {
      const modelLimit = getTokenLimit(modelId, userPlan);
      const used =
        tokenUsage?.modelBreakdown?.find((m) => m.model === modelId)
          ?.tokensUsed || 0;
      availableTokens[modelId] = Math.max(0, modelLimit - used);
    });

    // Enhanced user context with preferences
    const enhancedUserContext = {
      ...userContext,
      userId,
      preferences: {
        speed: userContext.preferences?.speed || "balanced",
        accuracy: userContext.preferences?.accuracy || "balanced",
        cost: userContext.preferences?.cost || "efficient",
      },
    };

    // Intelligent model selection
    let selectedModels = [];
    let usedFallback = false;
    let fallbackModel = null;
    let aiResponse = null;
    let lastError = null;

    if (requestedModel && this.validateModel(requestedModel)) {
      selectedModels = [requestedModel];

      // Add fallback models from the intelligent router
      const fallbackCandidates = modelRouter
        .selectOptimalModel(
          context,
          enhancedUserContext,
          availableTokens[requestedModel],
          userPlan
        )
        .filter((model) => model !== requestedModel);

      selectedModels.push(...fallbackCandidates.slice(0, 2));
    } else {
      selectedModels = modelRouter.selectOptimalModel(
        context,
        enhancedUserContext,
        Math.max(...Object.values(availableTokens)),
        userPlan
      );
    }

    // Try each model in order until one succeeds
    for (let i = 0; i < selectedModels.length; i++) {
      const currentModel = selectedModels[i];
      const modelConfig = AI_MODELS[currentModel];

      try {
        await this.checkModelAccess(userId, currentModel);

        const estimatedTokens = Math.ceil((message.length + 500) / 4);
        await this.checkDailyTokenLimit(userId, currentModel, estimatedTokens);

        // Check cache first
        const cacheKey = this.generateCacheKey(
          userId,
          message,
          context,
          currentModel
        );
        const cachedResponse = this.getCachedResponse(cacheKey);
        if (cachedResponse) {
          const responseTime = Date.now() - startTime;
          modelRouter.recordRequest(userId, currentModel, true, responseTime);
          return {
            ...cachedResponse,
            cached: true,
            modelName: modelConfig.name,
          };
        }

        // Prepare system prompt
        let systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;
        if (currentModel === "qwen3-coder") {
          systemPrompt = SYSTEM_PROMPTS.qwen3Coder;
        }

        let contextAdjustedMaxTokens = modelConfig.maxTokens;
        if (context === "codeReview" || context === "projectHelp") {
          contextAdjustedMaxTokens = Math.min(
            modelConfig.maxTokens,
            Math.floor(modelConfig.maxTokens * 1.5),
            12000
          );
        } else if (context === "debugging") {
          contextAdjustedMaxTokens = Math.min(
            modelConfig.maxTokens,
            Math.floor(modelConfig.maxTokens * 1.3),
            10000
          );
        }
        contextAdjustedMaxTokens = Math.max(
          1,
          Math.floor(contextAdjustedMaxTokens)
        );

        // Enhance prompt with user context
        if (
          enhancedUserContext.skills &&
          enhancedUserContext.skills.length > 0
        ) {
          systemPrompt += `\n\nThe user has experience with: ${enhancedUserContext.skills.join(
            ", "
          )}. Adjust your explanations accordingly.`;
        }

        if (enhancedUserContext.level) {
          systemPrompt += `\n\nThe user's skill level is: ${enhancedUserContext.level}. Provide appropriate guidance.`;
        }

        // Add model-specific context
        if (modelConfig.contextSpecialties.includes(context)) {
          systemPrompt += `\n\nYou are particularly well-suited for ${context} tasks. Provide expert-level guidance.`;
        }

        const messages = [{ role: "system", content: systemPrompt }];

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
          const historyMessages = conversationHistory
            .filter((msg) => msg.role !== "system")
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            }));
          messages.push(...historyMessages);
        }

        messages.push({ role: "user", content: message });

        // Make API request
        if (modelConfig.provider === "openai") {
          aiResponse = await this.makeOpenAIRequest(
            currentModel,
            messages,
            contextAdjustedMaxTokens
          );
        } else if (modelConfig.provider === "openrouter") {
          aiResponse = await this.makeOpenRouterRequest(
            currentModel,
            messages,
            contextAdjustedMaxTokens
          );
        } else {
          throw new Error(`Unsupported provider: ${modelConfig.provider}`);
        }

        // Success! Record the successful request
        const responseTime = Date.now() - startTime;
        modelRouter.recordRequest(userId, currentModel, true, responseTime);

        usedFallback = i > 0;
        fallbackModel = usedFallback ? currentModel : null;

        break;
      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - startTime;
        modelRouter.recordRequest(userId, currentModel, false, responseTime);

        console.warn(`Model ${currentModel} failed: ${error.message}`);

        if (i === selectedModels.length - 1) {
          throw new Error(
            `All selected models failed. Last error: ${error.message}`
          );
        }

        continue;
      }
    }

    // If we get here, all models failed
    if (!aiResponse) {
      throw new Error(
        `All selected models failed. Last error: ${
          lastError?.message || "Unknown error"
        }`
      );
    }

    // Calculate cost
    const finalModel = usedFallback ? fallbackModel : selectedModels[0];
    const finalModelConfig = AI_MODELS[finalModel];
    const cost = this.calculateCost(
      finalModel,
      aiResponse.usage.prompt_tokens,
      aiResponse.usage.completion_tokens
    );

    const response = {
      content: aiResponse.content,
      tokens: aiResponse.usage.total_tokens,
      cost: cost,
      model: finalModel,
      modelName: finalModelConfig.name,
      timestamp: new Date().toISOString(),
      context: context,
      usedFallback: usedFallback,
      originalModel: usedFallback ? selectedModels[0] : null,
      routingInfo: {
        selectedModels: selectedModels,
        primaryModel: selectedModels[0],
        fallbackUsed: usedFallback,
        fallbackModel: fallbackModel,
      },
    };

    await this.recordTokenUsage(
      userId,
      finalModel,
      aiResponse.usage.total_tokens,
      cost
    );

    // Cache the response
    const cacheKey = this.generateCacheKey(
      userId,
      message,
      context,
      finalModel
    );
    this.cacheResponse(cacheKey, response);

    return response;
  }
  catch(error) {
    console.error("AI Service Error:", error);
    throw new Error(`AI request failed: ${error.message}`);
  }

  // Code review specific method
  async codeReview(
    userId,
    code,
    language,
    userContext = {},
    focus = "all",
    model = "gpt-4o-mini",
    conversationHistory = []
  ) {
    const focusPrompt =
      focus !== "all" ? `Focus specifically on ${focus} aspects.` : "";
    const message = `Please review this ${language} code:\n\n${code}\n\n${focusPrompt}Provide a comprehensive code review with specific suggestions for improvement.`;
    return this.chat(
      userId,
      message,
      "codeReview",
      userContext,
      model,
      conversationHistory
    );
  }

  // Debugging specific method
  async debugCode(
    userId,
    code,
    error,
    language,
    userContext = {},
    model = "gpt-4o-mini",
    conversationHistory = []
  ) {
    const message = `I'm getting this error in my ${language} code:\n\nCode:\n${code}\n\nError:\n${error}\n\nPlease help me debug this issue.`;
    return this.chat(
      userId,
      message,
      "debugging",
      userContext,
      model,
      conversationHistory
    );
  }

  // Learning assistance method
  async learningHelp(
    userId,
    topic,
    userContext = {},
    level = null,
    focus = "all",
    model = "gpt-4o-mini",
    conversationHistory = []
  ) {
    const levelPrompt = level ? `The user's level is ${level}.` : "";
    const focusPrompt = focus !== "all" ? `Focus on ${focus}.` : "";
    const message = `I want to learn about ${topic}. ${levelPrompt} ${focusPrompt}Please provide a comprehensive explanation with examples and resources.`;
    return this.chat(
      userId,
      message,
      "learning",
      userContext,
      model,
      conversationHistory
    );
  }

  // Project advice method
  async projectAdvice(
    userId,
    projectDescription,
    userContext = {},
    projectId = null,
    aspect = "all",
    model = "gpt-4o-mini",
    conversationHistory = []
  ) {
    const projectPrompt = projectId
      ? `This is for project ID: ${projectId}.`
      : "";
    const aspectPrompt = aspect !== "all" ? `Focus on ${aspect} aspects.` : "";
    const message = `I'm working on this project: ${projectDescription}. ${projectPrompt} ${aspectPrompt}Please provide advice on architecture, best practices, and potential challenges.`;
    return this.chat(
      userId,
      message,
      "projectHelp",
      userContext,
      model,
      conversationHistory
    );
  }

  getAvailableContexts() {
    return Object.keys(SYSTEM_PROMPTS);
  }

  async getUserStats(userId) {
    return {
      totalRequests: 0,
      requestsToday: 0,
      favoriteContext: "general",
      lastUsed: null,
    };
  }

  // Get model routing recommendations
  async getModelRecommendations(userId, context, userContext = {}) {
    const user = await User.findById(userId).select("subscription");
    const userPlan = user?.subscription?.plan || "free";

    const tokenUsage = await DailyTokenUsage.getUserTokenUsage(userId);
    const availableTokens = {};

    Object.keys(AI_MODELS).forEach((modelId) => {
      const modelLimit = getTokenLimit(modelId, userPlan);
      const used =
        tokenUsage?.modelBreakdown?.find((m) => m.model === modelId)
          ?.tokensUsed || 0;
      availableTokens[modelId] = Math.max(0, modelLimit - used);
    });

    const enhancedUserContext = {
      ...userContext,
      userId,
      preferences: {
        speed: userContext.preferences?.speed || "balanced",
        accuracy: userContext.preferences?.accuracy || "balanced",
        cost: userContext.preferences?.cost || "efficient",
      },
    };

    const recommendations = modelRouter.selectOptimalModel(
      context,
      enhancedUserContext,
      Math.max(...Object.values(availableTokens)),
      userPlan
    );

    return recommendations.map((modelId) => ({
      modelId,
      model: AI_MODELS[modelId],
      score: modelRouter.calculateModelScore(
        modelId,
        context,
        enhancedUserContext,
        availableTokens[modelId],
        userPlan
      ),
      availableTokens: availableTokens[modelId],
    }));
  }

  // Method to check model health/availability
  async checkModelHealth(model) {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      return { healthy: false, error: "Invalid model" };
    }

    // Check if required API client is available
    if (modelConfig.provider === "openai" && !initializeOpenAI()) {
      return {
        healthy: false,
        error: "OpenAI API key not configured",
        model: model,
        provider: modelConfig.provider,
      };
    }

    if (modelConfig.provider === "openrouter" && !initializeOpenRouter()) {
      return {
        healthy: false,
        error: "OpenRouter API key not configured",
        model: model,
        provider: modelConfig.provider,
      };
    }

    try {
      const testMessage =
        model === "deepseek-r1" || model === "qwen3-coder"
          ? "Hi"
          : "Hello, this is a health check.";
      const messages = [
        {
          role: "system",
          content:
            "You are a helpful assistant. Respond with 'OK' to health checks.",
        },
        { role: "user", content: testMessage },
      ];

      let response;
      if (modelConfig.provider === "openai") {
        response = await this.makeOpenAIRequest(model, messages, 10);
      } else if (modelConfig.provider === "openrouter") {
        response = await this.makeOpenRouterRequest(model, messages, 50); // Higher limit for health check
      } else {
        return { healthy: false, error: "Unsupported provider" };
      }

      return {
        healthy: true,
        responseTime: Date.now(),
        model: model,
        provider: modelConfig.provider,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        model: model,
        provider: modelConfig.provider,
      };
    }
  }

  // Streaming chat method using async generator
  async *chatStream(
    userId,
    message,
    context = "general",
    userContext = {},
    requestedModel = "gpt-4o-mini",
    conversationHistory = []
  ) {
    const startTime = Date.now();

    // Get user plan and available tokens
    const user = await User.findById(userId).select("subscription");
    const userPlan = user?.subscription?.plan || "free";

    const tokenUsage = await DailyTokenUsage.getUserTokenUsage(userId);
    const availableTokens = {};

    Object.keys(AI_MODELS).forEach((modelId) => {
      const modelLimit = getTokenLimit(modelId, userPlan);
      const used =
        tokenUsage?.modelBreakdown?.find((m) => m.model === modelId)
          ?.tokensUsed || 0;
      availableTokens[modelId] = Math.max(0, modelLimit - used);
    });

    // Enhanced user context with preferences
    const enhancedUserContext = {
      ...userContext,
      userId,
      preferences: {
        speed: userContext.preferences?.speed || "balanced",
        accuracy: userContext.preferences?.accuracy || "balanced",
        cost: userContext.preferences?.cost || "efficient",
      },
    };

    // Intelligent model selection
    let selectedModels = [];
    let usedFallback = false;
    let fallbackModel = null;
    let lastError = null;

    if (requestedModel && this.validateModel(requestedModel)) {
      selectedModels = [requestedModel];

      const fallbackCandidates = modelRouter
        .selectOptimalModel(
          context,
          enhancedUserContext,
          availableTokens[requestedModel],
          userPlan
        )
        .filter((model) => model !== requestedModel);

      selectedModels.push(...fallbackCandidates.slice(0, 2));
    } else {
      selectedModels = modelRouter.selectOptimalModel(
        context,
        enhancedUserContext,
        Math.max(...Object.values(availableTokens)),
        userPlan
      );
    }

    // Try each model in order until one succeeds
    for (let i = 0; i < selectedModels.length; i++) {
      const currentModel = selectedModels[i];
      const modelConfig = AI_MODELS[currentModel];

      try {
        await this.checkModelAccess(userId, currentModel);

        const estimatedTokens = Math.ceil((message.length + 500) / 4);
        await this.checkDailyTokenLimit(userId, currentModel, estimatedTokens);

        // Prepare system prompt
        let systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;
        if (currentModel === "qwen3-coder") {
          systemPrompt = SYSTEM_PROMPTS.qwen3Coder;
        }

        let contextAdjustedMaxTokens = modelConfig.maxTokens;
        if (context === "codeReview" || context === "projectHelp") {
          contextAdjustedMaxTokens = Math.min(
            modelConfig.maxTokens,
            Math.floor(modelConfig.maxTokens * 1.5),
            12000
          );
        } else if (context === "debugging") {
          contextAdjustedMaxTokens = Math.min(
            modelConfig.maxTokens,
            Math.floor(modelConfig.maxTokens * 1.3),
            10000
          );
        }
        contextAdjustedMaxTokens = Math.max(
          1,
          Math.floor(contextAdjustedMaxTokens)
        );

        if (
          enhancedUserContext.skills &&
          enhancedUserContext.skills.length > 0
        ) {
          systemPrompt += `\n\nThe user has experience with: ${enhancedUserContext.skills.join(
            ", "
          )}. Adjust your explanations accordingly.`;
        }

        if (enhancedUserContext.level) {
          systemPrompt += `\n\nThe user's skill level is: ${enhancedUserContext.level}. Provide appropriate guidance.`;
        }

        // Add model-specific context
        if (modelConfig.contextSpecialties.includes(context)) {
          systemPrompt += `\n\nYou are particularly well-suited for ${context} tasks. Provide expert-level guidance.`;
        }

        const messages = [{ role: "system", content: systemPrompt }];

        // Add conversation history
        if (conversationHistory && conversationHistory.length > 0) {
          const historyMessages = conversationHistory
            .filter((msg) => msg.role !== "system")
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
            }));
          messages.push(...historyMessages);
        }

        messages.push({ role: "user", content: message });

        // Stream the response based on provider
        if (modelConfig.provider === "openai") {
          yield* this.streamOpenAIResponse(
            currentModel,
            messages,
            contextAdjustedMaxTokens
          );
        } else if (modelConfig.provider === "openrouter") {
          yield* this.streamOpenRouterResponse(
            currentModel,
            messages,
            contextAdjustedMaxTokens
          );
        } else {
          throw new Error(`Unsupported provider: ${modelConfig.provider}`);
        }

        // Success! Record the successful request
        const responseTime = Date.now() - startTime;
        modelRouter.recordRequest(userId, currentModel, true, responseTime);

        usedFallback = i > 0;
        fallbackModel = usedFallback ? currentModel : null;

        break;
      } catch (error) {
        lastError = error;
        const responseTime = Date.now() - startTime;
        modelRouter.recordRequest(userId, currentModel, false, responseTime);

        console.warn(
          `Model ${currentModel} failed for streaming: ${error.message}`
        );

        // If this is the last model, throw the error
        if (i === selectedModels.length - 1) {
          yield {
            type: "error",
            error: `All selected models failed. Last error: ${error.message}`,
          };
          return;
        }

        continue;
      }
    }
  }

  // Stream OpenAI response
  async *streamOpenAIResponse(model, messages, maxTokens = null) {
    const openaiClient = initializeOpenAI();
    if (!openaiClient) {
      throw new Error("OpenAI API key not configured.");
    }

    try {
      const modelConfig = AI_MODELS[model];
      const actualMaxTokens = maxTokens || modelConfig?.maxTokens || 4096;

      const stream = await openaiClient.chat.completions.create({
        model: model,
        messages: messages,
        max_tokens: actualMaxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        stream: true,
      });

      let totalTokens = 0;
      let fullContent = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullContent += content;
          yield { type: "content", content };
        }

        if (chunk.usage) {
          totalTokens = chunk.usage.total_tokens;
        }
      }

      if (totalTokens === 0 && fullContent.length > 0) {
        totalTokens = Math.ceil((fullContent.length + 500) / 4);
      }

      // Calculate cost
      const cost = this.calculateCost(model, totalTokens, 0);
      yield { type: "usage", tokens: totalTokens, cost };
    } catch (error) {
      console.error("OpenAI Streaming Error:", error);
      yield { type: "error", error: error.message };
    }
  }

  // Stream OpenRouter response
  async *streamOpenRouterResponse(model, messages, maxTokens = null) {
    const openRouterClient = initializeOpenRouter();
    if (!openRouterClient) {
      throw new Error("OpenRouter API key not configured.");
    }

    const modelConfig = AI_MODELS[model];
    const actualMaxTokens = maxTokens || modelConfig?.maxTokens || 4096;

    try {
      const response = await openRouterClient.post(
        "/chat/completions",
        {
          model: modelConfig.modelId,
          messages: messages,
          max_tokens: actualMaxTokens,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
          stream: true,
        },
        {
          responseType: "stream",
          headers: {
            Accept: "text/event-stream",
          },
        }
      );

      let totalTokens = 0;
      let fullContent = "";

      for await (const chunk of response.data) {
        const lines = chunk.toString().split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                fullContent += content;
                yield { type: "content", content };
              }

              if (parsed.usage) {
                totalTokens = parsed.usage.total_tokens;
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      }

      if (totalTokens === 0 && fullContent.length > 0) {
        totalTokens = Math.ceil((fullContent.length + 500) / 4);
      }

      // Calculate cost
      const cost = this.calculateCost(model, totalTokens, 0);
      yield { type: "usage", tokens: totalTokens, cost };
    } catch (error) {
      console.error("OpenRouter Streaming Error:", error);
      yield { type: "error", error: error.message };
    }
  }

  async getAllModelsHealth() {
    const models = Object.keys(AI_MODELS);
    const healthChecks = await Promise.allSettled(
      models.map((model) => this.checkModelHealth(model))
    );

    const results = {};
    models.forEach((model, index) => {
      const result = healthChecks[index];
      if (result.status === "fulfilled") {
        results[model] = result.value;
      } else {
        results[model] = {
          healthy: false,
          error: result.reason?.message || "Unknown error",
          model: model,
        };
      }
    });

    return results;
  }

  clearCache() {
    aiCache.flushAll();
  }
}

const aiServiceInstance = new AIService();

module.exports = {
  ...aiServiceInstance,
  AI_MODELS,

  checkTokenLimit,
  checkModelAvailability,

  getAvailableModels:
    aiServiceInstance.getAvailableModels.bind(aiServiceInstance),
  getAvailableContexts:
    aiServiceInstance.getAvailableContexts.bind(aiServiceInstance),
  validateModel: aiServiceInstance.validateModel.bind(aiServiceInstance),
  checkModelAccess: aiServiceInstance.checkModelAccess.bind(aiServiceInstance),
  checkDailyTokenLimit:
    aiServiceInstance.checkDailyTokenLimit.bind(aiServiceInstance),
  recordTokenUsage: aiServiceInstance.recordTokenUsage.bind(aiServiceInstance),
  calculateCost: aiServiceInstance.calculateCost.bind(aiServiceInstance),
  makeOpenAIRequest:
    aiServiceInstance.makeOpenAIRequest.bind(aiServiceInstance),
  makeOpenRouterRequest:
    aiServiceInstance.makeOpenRouterRequest.bind(aiServiceInstance),
  chat: aiServiceInstance.chat.bind(aiServiceInstance),
  chatStream: aiServiceInstance.chatStream.bind(aiServiceInstance),
  codeReview: aiServiceInstance.codeReview.bind(aiServiceInstance),
  debugCode: aiServiceInstance.debugCode.bind(aiServiceInstance),
  learningHelp: aiServiceInstance.learningHelp.bind(aiServiceInstance),
  projectAdvice: aiServiceInstance.projectAdvice.bind(aiServiceInstance),
  getUserStats: aiServiceInstance.getUserStats.bind(aiServiceInstance),
  checkModelHealth: aiServiceInstance.checkModelHealth.bind(aiServiceInstance),
  getAllModelsHealth:
    aiServiceInstance.getAllModelsHealth.bind(aiServiceInstance),
  clearCache: aiServiceInstance.clearCache.bind(aiServiceInstance),
  checkRateLimit: aiServiceInstance.checkRateLimit.bind(aiServiceInstance),
  generateCacheKey: aiServiceInstance.generateCacheKey.bind(aiServiceInstance),
  getCachedResponse:
    aiServiceInstance.getCachedResponse.bind(aiServiceInstance),
  cacheResponse: aiServiceInstance.cacheResponse.bind(aiServiceInstance),
  getModelRecommendations:
    aiServiceInstance.getModelRecommendations.bind(aiServiceInstance),
};
