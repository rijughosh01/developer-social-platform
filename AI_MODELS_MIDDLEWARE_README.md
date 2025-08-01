# AI Models and Middleware Documentation

This document provides comprehensive information about the AI models and middleware components added to the Developer Social Platform for the AI chatbot feature.

## 📋 Table of Contents

1. [Overview](#overview)
2. [AI Models](#ai-models)
3. [AI Middleware](#ai-middleware)
4. [API Routes](#api-routes)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Configuration](#configuration)
8. [Security Considerations](#security-considerations)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The AI chatbot feature includes two main models and comprehensive middleware for:
- **Conversation Management**: Track and manage AI chat conversations
- **Usage Analytics**: Monitor AI usage, costs, and performance
- **Rate Limiting**: Prevent abuse and control API costs
- **Input Validation**: Ensure data integrity and security
- **Caching**: Optimize response times and reduce API calls

## 🗄️ AI Models

### 1. AIConversation Model

**File**: `backend/models/AIConversation.js`

**Purpose**: Manages AI chat conversations, message history, and context.

#### Schema Fields

```javascript
{
  user: ObjectId,           // Reference to User
  title: String,            // Conversation title
  context: String,          // AI context (general, codeReview, etc.)
  messages: [               // Array of messages
    {
      role: String,         // user, assistant, system
      content: String,      // Message content
      timestamp: Date,      // Message timestamp
      metadata: {           // Additional info
        tokens: Number,
        model: String,
        processingTime: Number
      }
    }
  ],
  totalTokens: Number,      // Total tokens used
  totalCost: Number,        // Total cost incurred
  isActive: Boolean,        // Conversation status
  lastActivity: Date,       // Last activity timestamp
  tags: [String],           // Conversation tags
  project: ObjectId         // Optional project reference
}
```

#### Key Methods

- `addMessage(role, content, metadata)`: Add a message to conversation
- `updateTitle(title)`: Update conversation title
- `archive()`: Archive conversation
- `getActiveConversations(userId)`: Get user's active conversations
- `getUserStats(userId)`: Get conversation statistics

#### Indexes

```javascript
// Performance indexes
{ user: 1, createdAt: -1 }
{ user: 1, isActive: 1 }
{ user: 1, context: 1 }
{ lastActivity: -1 }
```

### 2. AIUsage Model

**File**: `backend/models/AIUsage.js`

**Purpose**: Tracks AI usage, costs, and performance metrics.

#### Schema Fields

```javascript
{
  user: ObjectId,           // Reference to User
  date: Date,               // Usage date
  context: String,          // AI context
  requestCount: Number,     // Number of requests
  totalTokens: Number,      // Total tokens used
  totalCost: Number,        // Total cost
  averageResponseTime: Number, // Average response time
  errors: Number,           // Error count
  rateLimitHits: Number,    // Rate limit violations
  model: String,            // AI model used
  conversationId: ObjectId  // Optional conversation reference
}
```

#### Key Methods

- `incrementUsage(tokens, cost, responseTime, hasError)`: Increment usage stats
- `recordRateLimit()`: Record rate limit violation
- `getDailyUsage(userId, date)`: Get daily usage
- `getMonthlyUsage(userId, year, month)`: Get monthly usage
- `getGlobalStats(startDate, endDate)`: Get global statistics
- `getTopUsers(limit, startDate, endDate)`: Get top users by usage

#### Indexes

```javascript
// Compound indexes for efficient queries
{ user: 1, date: 1 }
{ user: 1, context: 1, date: 1 }
{ date: 1 }
```

## 🔧 AI Middleware

### 1. Rate Limiting Middleware

**File**: `backend/middleware/aiRateLimit.js`

**Purpose**: Controls API usage and prevents abuse.

#### Features

- **Context-specific limits**: Different limits for different AI contexts
- **Daily usage limits**: Prevents excessive daily usage
- **Rate limit tracking**: Records rate limit violations
- **Usage statistics**: Provides usage analytics

#### Rate Limits

```javascript
const rateLimiters = {
  general: { points: 50, duration: 3600 },      // 50 requests/hour
  codeReview: { points: 20, duration: 3600 },   // 20 requests/hour
  debugging: { points: 30, duration: 3600 },    // 30 requests/hour
  learning: { points: 40, duration: 3600 },     // 40 requests/hour
  projectHelp: { points: 25, duration: 3600 }   // 25 requests/hour
};

const dailyLimits = {
  general: 200,
  codeReview: 50,
  debugging: 100,
  learning: 150,
  projectHelp: 75
};
```

#### Middleware Functions

- `aiRateLimit(context)`: Apply rate limiting for specific context
- `trackAIUsage()`: Track usage after successful requests
- `getAIUsageStats()`: Get user's usage statistics

### 2. Validation Middleware

**File**: `backend/middleware/aiValidation.js`

**Purpose**: Validates and sanitizes AI requests.

#### Validation Rules

```javascript
// AI Chat validation
validateAIChat: [
  body("message").trim().isLength({ min: 1, max: 4000 }),
  body("context").optional().isIn(["general", "codeReview", ...]),
  body("conversationId").optional().isMongoId(),
  body("model").optional().isIn(["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"])
]

// Code Review validation
validateCodeReview: [
  body("code").trim().isLength({ min: 1, max: 10000 }),
  body("language").trim().isLength({ min: 1, max: 50 }),
  body("focus").optional().isIn(["security", "performance", ...])
]
```

#### Security Features

- **Input sanitization**: Removes malicious content
- **Code validation**: Checks for dangerous patterns
- **File upload validation**: Validates uploaded code files
- **XSS protection**: Prevents cross-site scripting attacks

#### Sanitization Functions

```javascript
sanitizeAIInput(text) // Sanitizes user input
validateCodeContent(value) // Validates code content
validateFileUpload(req, res, next) // Validates file uploads
```

## 🛣️ API Routes

### Conversation Management

```javascript
// Get conversations
GET /api/ai/conversations?page=1&limit=10&context=general

// Get specific conversation
GET /api/ai/conversations/:conversationId

// Create conversation
POST /api/ai/conversations
{
  "title": "My Conversation",
  "context": "general",
  "projectId": "optional-project-id",
  "tags": ["tag1", "tag2"]
}

// Update conversation
PUT /api/ai/conversations/:conversationId
{
  "title": "Updated Title",
  "tags": ["new-tag"]
}

// Archive conversation
DELETE /api/ai/conversations/:conversationId
```

### AI Chat Endpoints

```javascript
// General chat
POST /api/ai/chat
{
  "message": "Hello AI!",
  "context": "general",
  "conversationId": "optional-conversation-id",
  "model": "gpt-3.5-turbo"
}

// Code review
POST /api/ai/code-review
{
  "code": "function hello() { return 'world'; }",
  "language": "javascript",
  "focus": "security",
  "conversationId": "optional-conversation-id"
}

// Debugging
POST /api/ai/debug
{
  "code": "console.log(x);",
  "error": "ReferenceError: x is not defined",
  "language": "javascript",
  "conversationId": "optional-conversation-id"
}

// Learning
POST /api/ai/learn
{
  "topic": "React Hooks",
  "level": "beginner",
  "focus": "examples",
  "conversationId": "optional-conversation-id"
}

// Project advice
POST /api/ai/project-advice
{
  "description": "Building a social media app",
  "projectId": "optional-project-id",
  "aspect": "architecture",
  "conversationId": "optional-conversation-id"
}
```

### Usage Statistics

```javascript
// Get user stats
GET /api/ai/stats

// Get available contexts
GET /api/ai/contexts
```

## 💡 Usage Examples

### Creating a Conversation

```javascript
const conversation = new AIConversation({
  user: userId,
  title: "React State Management",
  context: "learning",
  tags: ["react", "state", "hooks"]
});

await conversation.save();
```

### Adding Messages

```javascript
// Add user message
await conversation.addMessage('user', 'How do I use useState?');

// Add AI response
await conversation.addMessage('assistant', 'useState is a React Hook...', {
  tokens: 150,
  model: 'gpt-3.5-turbo',
  processingTime: 1200
});
```

### Tracking Usage

```javascript
const usage = await AIUsage.getDailyUsage(userId, new Date());
await usage.incrementUsage(200, 0.004, 1500);
```

### Rate Limiting

```javascript
// Apply rate limiting middleware
router.post('/chat', [
  auth,
  aiRateLimit('general'),
  trackAIUsage,
  validateAIChat,
  handleValidationErrors
], asyncHandler(async (req, res) => {
  // Route handler
}));
```

## 🧪 Testing

### Running Tests

```bash
# Test AI models and middleware
node backend/test-ai-models.js

# Test specific components
npm test -- --grep "AI"
```

### Test Coverage

The test suite covers:
- Model creation and operations
- Message management
- Usage tracking
- Input validation
- Rate limiting
- Error handling
- Data sanitization

### Example Test

```javascript
// Test conversation creation
const conversation = new AIConversation({
  user: new mongoose.Types.ObjectId(),
  title: 'Test Conversation',
  context: 'general'
});

await conversation.save();
expect(conversation.isActive).toBe(true);
```

## ⚙️ Configuration

### Environment Variables

```bash
# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo
AI_CACHE_TTL=3600
AI_RATE_LIMIT=100

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/devlink

# Rate Limiting
AI_DAILY_LIMIT_GENERAL=200
AI_DAILY_LIMIT_CODE_REVIEW=50
AI_DAILY_LIMIT_DEBUGGING=100
```

### Rate Limit Configuration

```javascript
// Customize rate limits
const customRateLimiters = {
  general: new RateLimiterMemory({
    points: 100,        // Requests per hour
    duration: 3600,     // Time window (seconds)
    blockDuration: 1800 // Block duration (seconds)
  })
};
```

## 🔒 Security Considerations

### Input Validation

- **Length limits**: Prevent oversized requests
- **Content filtering**: Remove malicious content
- **Code validation**: Check for dangerous patterns
- **File validation**: Validate uploaded files

### Rate Limiting

- **User-based limits**: Prevent individual abuse
- **Context-specific limits**: Different limits for different features
- **Daily limits**: Prevent excessive daily usage
- **Automatic blocking**: Block users who exceed limits

### Data Protection

- **Input sanitization**: Remove XSS and injection attempts
- **Output encoding**: Encode responses properly
- **Access control**: Ensure users can only access their data
- **Audit logging**: Track all AI interactions

## ⚡ Performance Optimization

### Caching Strategy

```javascript
// AI response caching
const aiCache = new NodeCache({ 
  stdTTL: 3600,        // 1 hour cache
  checkperiod: 600     // Check every 10 minutes
});
```

### Database Optimization

```javascript
// Efficient indexes
{ user: 1, date: 1 }           // Daily usage queries
{ user: 1, isActive: 1 }       // Active conversations
{ lastActivity: -1 }           // Recent conversations
```

### Response Optimization

- **Async processing**: Non-blocking operations
- **Batch operations**: Group database operations
- **Connection pooling**: Efficient database connections
- **Memory management**: Proper cleanup of resources

## 🐛 Troubleshooting

### Common Issues

#### Rate Limit Errors

```javascript
// Error: Rate limit exceeded
{
  "success": false,
  "message": "Rate limit exceeded",
  "retryAfter": 1800,
  "limit": 50,
  "remaining": 0
}
```

**Solution**: Wait for the rate limit to reset or upgrade user limits.

#### Validation Errors

```javascript
// Error: Validation failed
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "message",
      "message": "Message must be between 1 and 4000 characters"
    }
  ]
}
```

**Solution**: Check input validation rules and ensure data meets requirements.

#### Database Errors

```javascript
// Error: Database connection failed
{
  "success": false,
  "message": "Database connection error"
}
```

**Solution**: Check MongoDB connection and ensure database is running.

### Debug Mode

Enable debug logging:

```javascript
// Enable debug mode
process.env.DEBUG = 'ai:*';

// Debug middleware
const debug = require('debug')('ai:middleware');
debug('Processing AI request:', req.body);
```

### Monitoring

Monitor AI usage and performance:

```javascript
// Get usage statistics
const stats = await AIUsage.getGlobalStats(startDate, endDate);
console.log('Global AI usage:', stats);

// Monitor rate limits
const rateLimitStats = await AIUsage.aggregate([
  { $group: { _id: null, totalRateLimitHits: { $sum: "$rateLimitHits" } } }
]);
```

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [Express Validation](https://express-validator.github.io/docs/)
- [Rate Limiter Flexible](https://github.com/animir/node-rate-limiter-flexible)

## 🤝 Contributing

When contributing to the AI models and middleware:

1. **Follow the existing patterns** for model and middleware structure
2. **Add comprehensive tests** for new functionality
3. **Update documentation** for any changes
4. **Consider security implications** of new features
5. **Test performance impact** of changes

## 📄 License

This AI models and middleware implementation is part of the Developer Social Platform and follows the same license terms as the main project. 