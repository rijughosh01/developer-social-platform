const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["password_reset", "email_verification"],
      default: "password_reset",
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 });

// Method to check if OTP is valid
otpSchema.methods.isValid = function () {
  return (
    !this.isUsed &&
    this.attempts < this.maxAttempts &&
    this.expiresAt > new Date()
  );
};

// Method to mark OTP as used
otpSchema.methods.markAsUsed = function () {
  this.isUsed = true;
  return this.save();
};

// Method to increment attempts
otpSchema.methods.incrementAttempts = function () {
  this.attempts += 1;
  return this.save();
};

// Static method to create OTP
otpSchema.statics.createOTP = async function (email, type = "password_reset") {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await this.deleteMany({ email, type });

  // Create new OTP
  const otpDoc = await this.create({
    email,
    otp,
    type,
    expiresAt,
  });

  return otpDoc;
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function (
  email,
  otp,
  type = "password_reset"
) {
  const otpDoc = await this.findOne({ email, type });

  if (!otpDoc) {
    return { valid: false, message: "OTP not found" };
  }

  if (otpDoc.isUsed) {
    return { valid: false, message: "OTP has already been used" };
  }

  if (otpDoc.attempts >= otpDoc.maxAttempts) {
    return { valid: false, message: "Maximum attempts exceeded" };
  }

  if (otpDoc.expiresAt < new Date()) {
    return { valid: false, message: "OTP has expired" };
  }

  if (otpDoc.otp !== otp) {
    await otpDoc.incrementAttempts();
    return { valid: false, message: "Invalid OTP" };
  }

  // Mark OTP as used
  await otpDoc.markAsUsed();

  return { valid: true, message: "OTP verified successfully" };
};

module.exports = mongoose.model("OTP", otpSchema);
