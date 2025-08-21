const OpenAI = require("openai");
const NodeCache = require("node-cache");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const axios = require("axios");
const DailyTokenUsage = require("../models/DailyTokenUsage");
const User = require("../models/User");

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

let openRouterAPI = null;
if (process.env.OPENROUTER_API_KEY) {
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
    requiresPremium: false,
  },
  "gpt-4o": {
    provider: "openai",
    name: "GPT-4o",
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    maxTokens: 4096,
    contextWindow: 128000,
    requiresPremium: true,
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    name: "GPT-3.5 Turbo",
    costPer1kInput: 0.0005,
    costPer1kOutput: 0.0015,
    maxTokens: 4096,
    contextWindow: 16385,
    requiresPremium: false,
  },
  "deepseek-r1": {
    provider: "openrouter",
    name: "DeepSeek R1",
    modelId: "deepseek/deepseek-r1-0528:free",
    costPer1kInput: 0,
    costPer1kOutput: 0,
    maxTokens: 4096,
    contextWindow: 163840,
    requiresPremium: false,
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
  },
};

// Daily token limits for different subscription plans
const DAILY_TOKEN_LIMITS = {
  free: {
    "gpt-4o": 0,
    "gpt-4o-mini": 10000,
    "gpt-3.5-turbo": 15000,
    "deepseek-r1": 20000,
    "qwen3-coder": 25000,
  },
  premium: {
    "gpt-4o": 50000,
    "gpt-4o-mini": 50000,
    "gpt-3.5-turbo": 100000,
    "deepseek-r1": 100000,
    "qwen3-coder": 150000,
  },
  pro: {
    "gpt-4o": 200000,
    "gpt-4o-mini": 200000,
    "gpt-3.5-turbo": 500000,
    "deepseek-r1": 500000,
    "qwen3-coder": 750000,
  },
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

  // Get cached response if available
  getCachedResponse(cacheKey) {
    return aiCache.get(cacheKey);
  }

  cacheResponse(cacheKey, response) {
    aiCache.set(cacheKey, response);
  }

  // Get available models
  getAvailableModels() {
    const availableModels = [];

    Object.keys(AI_MODELS).forEach((modelKey) => {
      const model = AI_MODELS[modelKey];

      // Check if the required API key is available for this model
      let isAvailable = false;
      if (model.provider === "openai" && openai) {
        isAvailable = true;
      } else if (model.provider === "openrouter" && openRouterAPI) {
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
  async makeOpenAIRequest(model, messages, maxTokens = 1000) {
    if (!openai) {
      throw new Error("OpenAI API key not configured.");
    }
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
      model: model,
    };
  }

  // Make request to OpenRouter (DeepSeek R1)
  async makeOpenRouterRequest(model, messages, maxTokens = 1000) {
    if (!openRouterAPI) {
      throw new Error("OpenRouter API key not configured.");
    }
    const modelConfig = AI_MODELS[model];

    try {
      console.log(
        `Making OpenRouter request for ${model} with modelId: ${modelConfig.modelId}`
      );

      // Additional debugging for Qwen3 Coder
      if (model === "qwen3-coder") {
        console.log(
          `Qwen3 Coder specific debug - API Key configured: ${!!process.env
            .OPENROUTER_API_KEY}`
        );
        console.log(
          `Qwen3 Coder specific debug - OpenRouter API instance: ${!!openRouterAPI}`
        );
      }

      const actualMaxTokens =
        model === "deepseek-r1" || model === "qwen3-coder"
          ? Math.max(maxTokens, 2000)
          : maxTokens;

      const response = await openRouterAPI.post("/chat/completions", {
        model: modelConfig.modelId,
        messages: messages,
        max_tokens: actualMaxTokens,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      console.log(`📡 OpenRouter response status: ${response.status}`);
      console.log(
        `📡 OpenRouter response data:`,
        JSON.stringify(response.data, null, 2)
      );

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
        console.log(
          `⚠️ ${model} returned empty content but has reasoning: ${choice.message.reasoning.substring(
            0,
            100
          )}...`
        );
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

  // Main chat method
  async chat(
    userId,
    message,
    context = "general",
    userContext = {},
    model = "gpt-4o-mini",
    conversationHistory = []
  ) {
    if (!this.validateModel(model)) {
      throw new Error(`Invalid model: ${model}`);
    }

    await this.checkModelAccess(userId, model);

    const estimatedTokens = Math.ceil((message.length + 500) / 4);
    await this.checkDailyTokenLimit(userId, model, estimatedTokens);

    const cacheKey = this.generateCacheKey(userId, message, context, model);

    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return { ...cachedResponse, cached: true };
    }

    let systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;

    // Use special prompt for Qwen3 Coder model
    if (model === "qwen3-coder") {
      systemPrompt = SYSTEM_PROMPTS.qwen3Coder;
    }

    if (userContext.skills && userContext.skills.length > 0) {
      systemPrompt += `\n\nThe user has experience with: ${userContext.skills.join(
        ", "
      )}. Adjust your explanations accordingly.`;
    }

    if (userContext.level) {
      systemPrompt += `\n\nThe user's skill level is: ${userContext.level}. Provide appropriate guidance.`;
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

    try {
      let aiResponse;
      const modelConfig = AI_MODELS[model];
      let usedFallback = false;
      let fallbackModel = null;

      try {
        if (modelConfig.provider === "openai") {
          aiResponse = await this.makeOpenAIRequest(model, messages);
        } else if (modelConfig.provider === "openrouter") {
          aiResponse = await this.makeOpenRouterRequest(model, messages);
        } else {
          throw new Error(`Unsupported provider: ${modelConfig.provider}`);
        }
      } catch (primaryError) {
        // Fallback mechanism for OpenRouter models
        if (model === "deepseek-r1" || model === "qwen3-coder") {
          console.warn(
            `${model} failed, attempting fallback to GPT-4o Mini: ${primaryError.message}`
          );

          try {
            // Check if user can access fallback model
            await this.checkModelAccess(userId, "gpt-4o-mini");
            await this.checkDailyTokenLimit(
              userId,
              "gpt-4o-mini",
              estimatedTokens
            );

            aiResponse = await this.makeOpenAIRequest("gpt-4o-mini", messages);
            usedFallback = true;
            fallbackModel = "gpt-4o-mini";

            console.log("Successfully used fallback model: GPT-4o Mini");
          } catch (fallbackError) {
            console.error("Fallback model also failed:", fallbackError);
            throw new Error(
              `Primary model (${model}) failed: ${primaryError.message}. Fallback model also failed: ${fallbackError.message}`
            );
          }
        } else {
          throw primaryError;
        }
      }

      // Calculate cost
      const cost = this.calculateCost(
        usedFallback ? fallbackModel : model,
        aiResponse.usage.prompt_tokens,
        aiResponse.usage.completion_tokens
      );

      const response = {
        content: aiResponse.content,
        tokens: aiResponse.usage.total_tokens,
        cost: cost,
        model: usedFallback ? fallbackModel : model,
        modelName: usedFallback
          ? AI_MODELS[fallbackModel].name
          : modelConfig.name,
        timestamp: new Date().toISOString(),
        context: context,
        usedFallback: usedFallback,
        originalModel: usedFallback ? model : null,
      };

      await this.recordTokenUsage(
        userId,
        usedFallback ? fallbackModel : model,
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

  // Method to check model health/availability
  async checkModelHealth(model) {
    const modelConfig = AI_MODELS[model];
    if (!modelConfig) {
      return { healthy: false, error: "Invalid model" };
    }

    // Check if required API client is available
    if (modelConfig.provider === "openai" && !openai) {
      return {
        healthy: false,
        error: "OpenAI API key not configured",
        model: model,
        provider: modelConfig.provider,
      };
    }

    if (modelConfig.provider === "openrouter" && !openRouterAPI) {
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
  DAILY_TOKEN_LIMITS,
  // Explicitly export all methods to ensure they're available
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
};
