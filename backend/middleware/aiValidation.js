const { body, param, query, validationResult } = require("express-validator");

// Validation rules for AI chat
const validateAIChat = [
  body("message")
    .trim()
    .isLength({ min: 1, max: 4000 })
    .withMessage("Message must be between 1 and 4000 characters")
    .escape(),

  body("context")
    .optional()
    .isIn(["general", "codeReview", "debugging", "learning", "projectHelp"])
    .withMessage("Invalid context specified"),

  body("conversationId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true;
      }

      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdRegex.test(value)) {
        throw new Error("Invalid conversation ID format");
      }
      return true;
    })
    .withMessage("Invalid conversation ID"),

  body("model")
    .optional()
    .isIn(["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "deepseek-r1"])
    .withMessage("Invalid model specified"),
];

// Validation rules for code review
const validateCodeReview = [
  body("code")
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Code must be between 1 and 10000 characters")
    .escape(),

  body("language")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Language must be between 1 and 50 characters")
    .escape(),

  body("focus")
    .optional()
    .isIn(["security", "performance", "readability", "best-practices", "all"])
    .withMessage("Invalid focus area specified"),

  body("conversationId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true;
      }

      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdRegex.test(value)) {
        throw new Error("Invalid conversation ID format");
      }
      return true;
    })
    .withMessage("Invalid conversation ID"),
];

// Validation rules for debugging
const validateDebugging = [
  body("code")
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage("Code must be between 1 and 10000 characters")
    .escape(),

  body("error")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Error message must be between 1 and 2000 characters")
    .escape(),

  body("language")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Language must be between 1 and 50 characters")
    .escape(),

  body("conversationId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true;
      }

      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdRegex.test(value)) {
        throw new Error("Invalid conversation ID format");
      }
      return true;
    })
    .withMessage("Invalid conversation ID"),
];

// Validation rules for learning
const validateLearning = [
  body("topic")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Topic must be between 1 and 200 characters")
    .escape(),

  body("level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Invalid level specified"),

  body("focus")
    .optional()
    .isIn(["concepts", "examples", "exercises", "resources", "all"])
    .withMessage("Invalid focus specified"),

  body("conversationId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true;
      }

      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdRegex.test(value)) {
        throw new Error("Invalid conversation ID format");
      }
      return true;
    })
    .withMessage("Invalid conversation ID"),
];

// Validation rules for project advice
const validateProjectAdvice = [
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Project description must be between 10 and 2000 characters")
    .escape(),

  body("projectId").optional().isMongoId().withMessage("Invalid project ID"),

  body("aspect")
    .optional()
    .isIn([
      "architecture",
      "technology",
      "scalability",
      "security",
      "performance",
      "all",
    ])
    .withMessage("Invalid aspect specified"),

  body("conversationId")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true;
      }

      const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
      if (!mongoIdRegex.test(value)) {
        throw new Error("Invalid conversation ID format");
      }
      return true;
    })
    .withMessage("Invalid conversation ID"),
];

// Validation rules for conversation management
const validateConversationId = [
  param("conversationId").isMongoId().withMessage("Invalid conversation ID"),
];

// Validation rules for conversation creation
const validateCreateConversation = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters")
    .escape(),

  body("context")
    .isIn(["general", "codeReview", "debugging", "learning", "projectHelp"])
    .withMessage("Invalid context specified"),

  body("projectId").optional().isMongoId().withMessage("Invalid project ID"),

  body("tags")
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage("Tags must be an array with maximum 10 items"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Each tag must be between 1 and 20 characters")
    .escape(),
];

// Validation rules for conversation update
const validateUpdateConversation = [
  param("conversationId").isMongoId().withMessage("Invalid conversation ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters")
    .escape(),

  body("tags")
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage("Tags must be an array with maximum 10 items"),

  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Each tag must be between 1 and 20 characters")
    .escape(),
];

// Validation rules for query parameters
const validateQueryParams = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("context")
    .optional()
    .isIn(["general", "codeReview", "debugging", "learning", "projectHelp"])
    .withMessage("Invalid context specified"),

  query("sort")
    .optional()
    .isIn(["createdAt", "updatedAt", "lastActivity", "messageCount"])
    .withMessage("Invalid sort field"),

  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be 'asc' or 'desc'"),
];

// Sanitize AI input to prevent injection attacks
const sanitizeAIInput = (text) => {
  if (typeof text !== "string") return "";

  return (
    text
      .trim()

      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")

      .replace(/<[^>]*>/g, "")

      .replace(
        /('|"|;|--|\/\*|\*\/|union|select|insert|update|delete|drop|create|alter)/gi,
        ""
      )

      .replace(/(\||&|;|`|\$\(|\))/g, "")

      .replace(/\s+/g, " ")
      // Limit length
      .substring(0, 4000)
  );
};

// Custom validation for code content
const validateCodeContent = (value) => {
  if (typeof value !== "string") return false;

  const sanitized = sanitizeAIInput(value);

  // Check for potentially malicious patterns
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /document\./i,
    /window\./i,
    /process\./i,
    /require\s*\(/i,
    /import\s*\(/i,
    /exec\s*\(/i,
    /spawn\s*\(/i,
    /child_process/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error("Code contains potentially dangerous patterns");
    }
  }

  return true;
};

// Custom validation for file uploads
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  // Check file size (max 1MB)
  if (req.file.size > 1024 * 1024) {
    return res.status(400).json({
      success: false,
      message: "File size must be less than 1MB",
    });
  }

  // Check file type
  const allowedTypes = [
    "text/plain",
    "text/javascript",
    "text/typescript",
    "text/x-python",
    "text/x-java-source",
    "text/x-c++src",
    "text/x-csrc",
    "text/x-php",
    "text/x-ruby",
    "text/x-go",
    "text/x-rust",
    "text/x-swift",
    "text/x-kotlin",
    "text/x-scala",
    "text/x-clojure",
    "text/x-haskell",
    "text/x-ocaml",
    "text/x-fsharp",
    "text/x-csharp",
    "text/x-vb",
    "text/x-html",
    "text/x-css",
    "text/x-sql",
    "text/x-yaml",
    "text/x-json",
    "text/xml",
    "text/markdown",
  ];

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Only code files are allowed.",
    });
  }

  next();
};

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

// Middleware to sanitize request body
const sanitizeRequestBody = (req, res, next) => {
  if (req.body.message) {
    req.body.message = sanitizeAIInput(req.body.message);
  }

  if (req.body.code) {
    req.body.code = sanitizeAIInput(req.body.code);
  }

  if (req.body.error) {
    req.body.error = sanitizeAIInput(req.body.error);
  }

  if (req.body.topic) {
    req.body.topic = sanitizeAIInput(req.body.topic);
  }

  if (req.body.description) {
    req.body.description = sanitizeAIInput(req.body.description);
  }

  next();
};

module.exports = {
  validateAIChat,
  validateCodeReview,
  validateDebugging,
  validateLearning,
  validateProjectAdvice,
  validateConversationId,
  validateCreateConversation,
  validateUpdateConversation,
  validateQueryParams,
  validateFileUpload,
  handleValidationErrors,
  sanitizeRequestBody,
  sanitizeAIInput,
  validateCodeContent,
};
