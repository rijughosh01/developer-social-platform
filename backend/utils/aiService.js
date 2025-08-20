const OpenAI = require("openai");
const NodeCache = require("node-cache");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const axios = require("axios");
const DailyTokenUsage = require("../models/DailyTokenUsage");
const User = require("../models/User");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize OpenRouter for DeepSeek R1
const openRouterAPI = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
    "X-Title": "DevLink AI Assistant"
  }
});

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

// Available AI Models Configuration
const AI_MODELS = {
  "gpt-4o-mini": {
    provider: "openai",
    name: "GPT-4o Mini",
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
    maxTokens: 16384,
    contextWindow: 128000,
    requiresPremium: false
  },
  "gpt-4o": {
    provider: "openai", 
    name: "GPT-4o",
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    maxTokens: 4096,
    contextWindow: 128000,
    requiresPremium: true
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    name: "GPT-3.5 Turbo",
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
    maxTokens: 4096,
    contextWindow: 16385,
    requiresPremium: false
  },
  "deepseek-r1": {
    provider: "openrouter",
    name: "DeepSeek R1",
    modelId: "deepseek/deepseek-r1-0528:free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 4096,
    contextWindow: 163840,
    requiresPremium: false
  }
};

// Daily token limits for different subscription plans
const DAILY_TOKEN_LIMITS = {
  free: {
    "gpt-4o": 0,
    "gpt-4o-mini": 10000,
    "gpt-3.5-turbo": 15000,
    "deepseek-r1": 20000
  },
  premium: {
    "gpt-4o": 50000,
    "gpt-4o-mini": 50000,
    "gpt-3.5-turbo": 100000,
    "deepseek-r1": 100000
  },
  pro: {
    "gpt-4o": 200000,
    "gpt-4o-mini": 200000,
    "gpt-3.5-turbo": 500000,
    "deepseek-r1": 500000
  }
};

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

  // Get cached response if available
  getCachedResponse(cacheKey) {
    return aiCache.get(cacheKey);
  }

  cacheResponse(cacheKey, response) {
    aiCache.set(cacheKey, response);
  }

  // Get available models
  getAvailableModels() {
    return Object.keys(AI_MODELS).map(modelKey => ({
      id: modelKey,
      ...AI_MODELS[modelKey]
    }));
  }

  // Validate model
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
    const dailyLimit = DAILY_TOKEN_LIMITS[userPlan]?.[model];
    
    if (dailyLimit === undefined) {
      throw new Error("Invalid model or plan configuration");
    }

    // If limit is 0, no access allowed
    if (dailyLimit === 0) {
      throw new Error("This model is not available for your subscription plan");
    }

    // Get current daily usage
    const today = new Date();
    const currentUsage = await DailyTokenUsage.getDailyUsage(userId, model, today);
    const tokensUsed = currentUsage ? currentUsage.tokensUsed : 0;

    // Check if adding estimated tokens would exceed limit
    if (tokensUsed + estimatedTokens > dailyLimit) {
      const remaining = Math.max(0, dailyLimit - tokensUsed);
      throw new Error(`Daily token limit exceeded. You have ${remaining} tokens remaining for ${model} today.`);
    }

    return {
      tokensUsed,
      dailyLimit,
      remaining: dailyLimit - tokensUsed
    };
  }

  // Method to record token usage
  async recordTokenUsage(userId, model, tokens, cost) {
    try {
      await DailyTokenUsage.createOrUpdateUsage(userId, model, tokens, cost);
    } catch (error) {
      console.error("Error recording token usage:", error);
      // Don't throw error as this shouldn't break the main functionality
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
  async makeOpenAIRequest(model, messages, maxTokens = 1000) {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: model
    };
  }

  // Make request to OpenRouter (DeepSeek R1)
  async makeOpenRouterRequest(model, messages, maxTokens = 1000) {
    const modelConfig = AI_MODELS[model];
    
    const response = await openRouterAPI.post("/chat/completions", {
      model: modelConfig.modelId,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      model: model
    };
  }

  // Main chat method
  async chat(
    userId,
    message,
    context = "general",
    userContext = {},
    model = "gpt-4o-mini"
  ) {
    // Validate model
    if (!this.validateModel(model)) {
      throw new Error(`Invalid model: ${model}`);
    }

    // Check model access and token limits
    await this.checkModelAccess(userId, model);
    
    // Estimate tokens for the request (rough estimation)
    const estimatedTokens = Math.ceil((message.length + 500) / 4); // Rough token estimation
    await this.checkDailyTokenLimit(userId, model, estimatedTokens);

    const cacheKey = this.generateCacheKey(userId, message, context, model);

    // Check cache first
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return { ...cachedResponse, cached: true };
    }

    // Prepare system prompt with user context
    let systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;

    // Add user-specific context
    if (userContext.skills && userContext.skills.length > 0) {
      systemPrompt += `\n\nThe user has experience with: ${userContext.skills.join(
        ", "
      )}. Adjust your explanations accordingly.`;
    }

    if (userContext.level) {
      systemPrompt += `\n\nThe user's skill level is: ${userContext.level}. Provide appropriate guidance.`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    try {
      let aiResponse;
      const modelConfig = AI_MODELS[model];

      if (modelConfig.provider === "openai") {
        aiResponse = await this.makeOpenAIRequest(model, messages);
      } else if (modelConfig.provider === "openrouter") {
        aiResponse = await this.makeOpenRouterRequest(model, messages);
      } else {
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
      }

      // Calculate cost
      const cost = this.calculateCost(
        model,
        aiResponse.usage.prompt_tokens,
        aiResponse.usage.completion_tokens
      );

      const response = {
        content: aiResponse.content,
        tokens: aiResponse.usage.total_tokens,
        cost: cost,
        model: model,
        modelName: modelConfig.name,
        timestamp: new Date().toISOString(),
        context: context,
      };

      // Record token usage
      await this.recordTokenUsage(
        userId,
        model,
        aiResponse.usage.total_tokens,
        cost
      );

      // Cache the response
      this.cacheResponse(cacheKey, response);

      return response;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  // Code review specific method
  async codeReview(userId, code, language, userContext = {}, focus = "all", model = "gpt-4o-mini") {
    const focusPrompt =
      focus !== "all" ? `Focus specifically on ${focus} aspects.` : "";
    const message = `Please review this ${language} code:\n\n${code}\n\n${focusPrompt}Provide a comprehensive code review with specific suggestions for improvement.`;
    return this.chat(userId, message, "codeReview", userContext, model);
  }

  // Debugging specific method
  async debugCode(userId, code, error, language, userContext = {}, model = "gpt-4o-mini") {
    const message = `I'm getting this error in my ${language} code:\n\nCode:\n${code}\n\nError:\n${error}\n\nPlease help me debug this issue.`;
    return this.chat(userId, message, "debugging", userContext, model);
  }

  // Learning assistance method
  async learningHelp(
    userId,
    topic,
    userContext = {},
    level = null,
    focus = "all",
    model = "gpt-4o-mini"
  ) {
    const levelPrompt = level ? `The user's level is ${level}.` : "";
    const focusPrompt = focus !== "all" ? `Focus on ${focus}.` : "";
    const message = `I want to learn about ${topic}. ${levelPrompt} ${focusPrompt}Please provide a comprehensive explanation with examples and resources.`;
    return this.chat(userId, message, "learning", userContext, model);
  }

  // Project advice method
  async projectAdvice(
    userId,
    projectDescription,
    userContext = {},
    projectId = null,
    aspect = "all",
    model = "gpt-4o-mini"
  ) {
    const projectPrompt = projectId
      ? `This is for project ID: ${projectId}.`
      : "";
    const aspectPrompt = aspect !== "all" ? `Focus on ${aspect} aspects.` : "";
    const message = `I'm working on this project: ${projectDescription}. ${projectPrompt} ${aspectPrompt}Please provide advice on architecture, best practices, and potential challenges.`;
    return this.chat(userId, message, "projectHelp", userContext, model);
  }

  // Get available contexts
  getAvailableContexts() {
    return Object.keys(SYSTEM_PROMPTS);
  }

  // Get available models
  getAvailableModels() {
    return Object.keys(AI_MODELS).map(modelKey => ({
      id: modelKey,
      ...AI_MODELS[modelKey]
    }));
  }

  // Get user's AI usage statistics
  async getUserStats(userId) {
    return {
      totalRequests: 0,
      requestsToday: 0,
      favoriteContext: "general",
      lastUsed: null,
    };
  }

  clearCache() {
    aiCache.flushAll();
  }
}

module.exports = new AIService();
