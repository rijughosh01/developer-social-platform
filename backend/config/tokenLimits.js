const TOKEN_LIMITS = {
  // Free plan limits
  free: {
    "gpt-4o-mini": 3000,
    "gpt-3.5-turbo": 5000,
    "deepseek-r1": 50000,
    "qwen3-coder": 50000,
    "gpt-4o": 0,
  },

  // Premium plan limits
  premium: {
    "gpt-4o-mini": 50000,
    "gpt-3.5-turbo": 75000,
    "deepseek-r1": 200000,
    "qwen3-coder": 200000,
    "gpt-4o": 50000,
  },

  // Pro plan limits (unlimited)
  pro: {
    "gpt-4o-mini": -1,
    "gpt-3.5-turbo": -1,
    "deepseek-r1": -1,
    "qwen3-coder": -1,
    "gpt-4o": -1,
  },
};

// Helper function to get token limit for a specific model and plan
const getTokenLimit = (modelId, userPlan = "free") => {
  const plan = TOKEN_LIMITS[userPlan] || TOKEN_LIMITS.free;
  return plan[modelId] || 0;
};

// Helper function to check if model requires premium for a specific plan
const requiresPremium = (modelId, userPlan = "free") => {
  if (userPlan === "pro") return false;
  if (userPlan === "premium") return false;

  if (modelId === "gpt-4o") return true;

  return false;
};

// Helper function to get available models for a specific plan
const getAvailableModels = (userPlan = "free") => {
  const plan = TOKEN_LIMITS[userPlan] || TOKEN_LIMITS.free;
  return Object.keys(plan).filter((modelId) => plan[modelId] > 0);
};

// Helper function to check if user has exceeded daily limit
const hasExceededLimit = (currentUsage, modelId, userPlan = "free") => {
  const limit = getTokenLimit(modelId, userPlan);

  if (limit === -1) return false;

  return currentUsage >= limit;
};

// Helper function to get remaining tokens
const getRemainingTokens = (currentUsage, modelId, userPlan = "free") => {
  const limit = getTokenLimit(modelId, userPlan);

  if (limit === -1) return -1;

  const remaining = limit - currentUsage;
  return Math.max(0, remaining);
};

module.exports = {
  TOKEN_LIMITS,
  getTokenLimit,
  requiresPremium,
  getAvailableModels,
  hasExceededLimit,
  getRemainingTokens,
};
