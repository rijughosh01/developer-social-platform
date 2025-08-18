const rateLimit = require("express-rate-limit");

// Rate limiter for OTP requests
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message:
      "Too many OTP requests. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});

// Rate limiter for OTP verification
const otpVerificationRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message:
      "Too many OTP verification attempts. Please wait 10 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  },
  skip: (req) => {
    return process.env.NODE_ENV === "development";
  },
});

module.exports = {
  otpRateLimit,
  otpVerificationRateLimit,
};
