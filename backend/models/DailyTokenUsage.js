const mongoose = require("mongoose");

const dailyTokenUsageSchema = new mongoose.Schema(
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
    model: {
      type: String,
      required: true,
      enum: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "deepseek-r1"],
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    requestsCount: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
dailyTokenUsageSchema.index({ user: 1, date: 1, model: 1 });
dailyTokenUsageSchema.index({ user: 1, date: 1 });

// Method to increment usage
dailyTokenUsageSchema.methods.incrementUsage = function (tokens, cost) {
  this.tokensUsed += tokens || 0;
  this.requestsCount += 1;
  this.totalCost += cost || 0;
  return this.save();
};

// Static method to get user's daily usage for a specific model
dailyTokenUsageSchema.statics.getDailyUsage = function (userId, model, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.findOne({
    user: userId,
    model: model,
    date: { $gte: startOfDay, $lte: endOfDay },
  });
};

// Static method to get user's total daily usage across all models
dailyTokenUsageSchema.statics.getTotalDailyUsage = function (userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: "$tokensUsed" },
        totalRequests: { $sum: "$requestsCount" },
        totalCost: { $sum: "$totalCost" },
        modelBreakdown: {
          $push: {
            model: "$model",
            tokens: "$tokensUsed",
            requests: "$requestsCount",
            cost: "$totalCost",
          },
        },
      },
    },
  ]);
};

// Static method to create or update daily usage
dailyTokenUsageSchema.statics.createOrUpdateUsage = async function (
  userId,
  model,
  tokens,
  cost
) {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  let usage = await this.findOne({
    user: userId,
    model: model,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (!usage) {
    usage = new this({
      user: userId,
      model: model,
      date: today,
      tokensUsed: tokens || 0,
      requestsCount: 1,
      totalCost: cost || 0,
    });
  } else {
    usage.tokensUsed += tokens || 0;
    usage.requestsCount += 1;
    usage.totalCost += cost || 0;
  }

  return usage.save();
};

module.exports = mongoose.model("DailyTokenUsage", dailyTokenUsageSchema);
