const OpenAI = require("openai");
const NodeCache = require("node-cache");
const { RateLimiterMemory } = require("rate-limiter-flexible");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
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
  generateCacheKey(userId, message, context) {
    return `ai_${userId}_${context}_${Buffer.from(message)
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

  // Main chat method
  async chat(
    userId,
    message,
    context = "general",
    userContext = {},
    model = "gpt-3.5-turbo"
  ) {
    const cacheKey = this.generateCacheKey(userId, message, context);

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

    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 1000,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      // Calculate cost based on model and tokens
      const costPer1kTokens = {
        "gpt-4o-mini": 0.00015,
        "gpt-4o": 0.005,
        "gpt-3.5-turbo": 0.0005,
        "gpt-4": 0.03,
      };

      const cost =
        (completion.usage.total_tokens / 1000) *
        (costPer1kTokens[model] || costPer1kTokens["gpt-3.5-turbo"]);

      const response = {
        content: completion.choices[0].message.content,
        tokens: completion.usage.total_tokens,
        cost: cost,
        model: model,
        timestamp: new Date().toISOString(),
        context: context,
      };

      // Cache the response
      this.cacheResponse(cacheKey, response);

      return response;
    } catch (error) {
      console.error("AI Service Error:", error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  // Code review specific method
  async codeReview(userId, code, language, userContext = {}, focus = "all") {
    const focusPrompt =
      focus !== "all" ? `Focus specifically on ${focus} aspects.` : "";
    const message = `Please review this ${language} code:\n\n${code}\n\n${focusPrompt}Provide a comprehensive code review with specific suggestions for improvement.`;
    return this.chat(userId, message, "codeReview", userContext);
  }

  // Debugging specific method
  async debugCode(userId, code, error, language, userContext = {}) {
    const message = `I'm getting this error in my ${language} code:\n\nCode:\n${code}\n\nError:\n${error}\n\nPlease help me debug this issue.`;
    return this.chat(userId, message, "debugging", userContext);
  }

  // Learning assistance method
  async learningHelp(
    userId,
    topic,
    userContext = {},
    level = null,
    focus = "all"
  ) {
    const levelPrompt = level ? `The user's level is ${level}.` : "";
    const focusPrompt = focus !== "all" ? `Focus on ${focus}.` : "";
    const message = `I want to learn about ${topic}. ${levelPrompt} ${focusPrompt}Please provide a comprehensive explanation with examples and resources.`;
    return this.chat(userId, message, "learning", userContext);
  }

  // Project advice method
  async projectAdvice(
    userId,
    projectDescription,
    userContext = {},
    projectId = null,
    aspect = "all"
  ) {
    const projectPrompt = projectId
      ? `This is for project ID: ${projectId}.`
      : "";
    const aspectPrompt = aspect !== "all" ? `Focus on ${aspect} aspects.` : "";
    const message = `I'm working on this project: ${projectDescription}. ${projectPrompt} ${aspectPrompt}Please provide advice on architecture, best practices, and potential challenges.`;
    return this.chat(userId, message, "projectHelp", userContext);
  }

  // Get available contexts
  getAvailableContexts() {
    return Object.keys(SYSTEM_PROMPTS);
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
