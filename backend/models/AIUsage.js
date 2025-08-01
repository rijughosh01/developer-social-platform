const mongoose = require("mongoose");

const aiUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    context: {
      type: String,
      enum: ["general", "codeReview", "debugging", "learning", "projectHelp"],
      required: true,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    averageResponseTime: {
      type: Number,
      default: 0,
    },
    errors: {
      type: Number,
      default: 0,
    },
    rateLimitHits: {
      type: Number,
      default: 0,
    },
    model: {
      type: String,
      default: "gpt-3.5-turbo",
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIConversation",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
aiUsageSchema.index({ user: 1, date: 1 });
aiUsageSchema.index({ user: 1, context: 1, date: 1 });
aiUsageSchema.index({ date: 1 });

// Method to increment usage
aiUsageSchema.methods.incrementUsage = function (
  tokens,
  cost,
  responseTime,
  hasError = false
) {
  this.requestCount += 1;
  this.totalTokens += tokens || 0;
  this.totalCost += cost || 0;

  // Update average response time
  const totalTime =
    this.averageResponseTime * (this.requestCount - 1) + (responseTime || 0);
  this.averageResponseTime = totalTime / this.requestCount;

  if (hasError) {
    this.errors += 1;
  }

  return this.save();
};

// Method to record rate limit hit
aiUsageSchema.methods.recordRateLimit = function () {
  this.rateLimitHits += 1;
  return this.save();
};

// Static method to get user's daily usage
aiUsageSchema.statics.getDailyUsage = function (userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    user: userId,
    date: { $gte: startOfDay, $lte: endOfDay },
  });
};

// Static method to get user's monthly usage
aiUsageSchema.statics.getMonthlyUsage = function (userId, year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startOfMonth, $lte: endOfMonth },
      },
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: "$requestCount" },
        totalTokens: { $sum: "$totalTokens" },
        totalCost: { $sum: "$totalCost" },
        averageResponseTime: { $avg: "$averageResponseTime" },
        totalErrors: { $sum: "$errors" },
        totalRateLimitHits: { $sum: "$rateLimitHits" },
        contextBreakdown: {
          $push: {
            context: "$context",
            requests: "$requestCount",
            tokens: "$totalTokens",
            cost: "$totalCost",
          },
        },
      },
    },
  ]);
};

// Static method to get global usage statistics
aiUsageSchema.statics.getGlobalStats = function (startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalUsers: { $addToSet: "$user" },
        totalRequests: { $sum: "$requestCount" },
        totalTokens: { $sum: "$totalTokens" },
        totalCost: { $sum: "$totalCost" },
        averageResponseTime: { $avg: "$averageResponseTime" },
        totalErrors: { $sum: "$errors" },
        totalRateLimitHits: { $sum: "$rateLimitHits" },
        contextUsage: {
          $push: {
            context: "$context",
            requests: "$requestCount",
            tokens: "$totalTokens",
            cost: "$totalCost",
          },
        },
      },
    },
    {
      $project: {
        totalUsers: { $size: "$totalUsers" },
        totalRequests: 1,
        totalTokens: 1,
        totalCost: 1,
        averageResponseTime: 1,
        totalErrors: 1,
        totalRateLimitHits: 1,
        contextUsage: 1,
      },
    },
  ]);
};

// Static method to get top users by usage
aiUsageSchema.statics.getTopUsers = function (limit = 10, startDate, endDate) {
  const matchStage = {};
  if (startDate && endDate) {
    matchStage.date = { $gte: startDate, $lte: endDate };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$user",
        totalRequests: { $sum: "$requestCount" },
        totalTokens: { $sum: "$totalTokens" },
        totalCost: { $sum: "$totalCost" },
        averageResponseTime: { $avg: "$averageResponseTime" },
      },
    },
    { $sort: { totalRequests: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        user: {
          _id: 1,
          username: 1,
          email: 1,
          avatar: 1,
        },
        totalRequests: 1,
        totalTokens: 1,
        totalCost: 1,
        averageResponseTime: 1,
      },
    },
  ]);
};

module.exports = mongoose.model("AIUsage", aiUsageSchema);
