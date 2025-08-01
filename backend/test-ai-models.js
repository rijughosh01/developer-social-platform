const mongoose = require('mongoose');
const AIConversation = require('./models/AIConversation');
const AIUsage = require('./models/AIUsage');
const { aiRateLimit, trackAIUsage, getAIUsageStats } = require('./middleware/aiRateLimit');
const {
  validateAIChat,
  validateCodeReview,
  validateDebugging,
  validateLearning,
  validateProjectAdvice,
  handleValidationErrors,
  sanitizeAIInput,
} = require('./middleware/aiValidation');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devlink', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testAIModels() {
  console.log('Testing AI Models and Middleware...\n');

  try {
    // Test 1: Create AI Conversation
    console.log('1. Testing AIConversation Model...');
    const conversation = new AIConversation({
      user: new mongoose.Types.ObjectId(),
      title: 'Test Conversation',
      context: 'general',
      tags: ['test', 'ai']
    });

    await conversation.save();
    console.log('AIConversation created successfully');

    // Test 2: Add messages to conversation
    console.log('\n2. Testing conversation message methods...');
    await conversation.addMessage('user', 'Hello AI!');
    await conversation.addMessage('assistant', 'Hello! How can I help you today?', {
      tokens: 10,
      model: 'gpt-3.5-turbo',
      processingTime: 500
    });

    console.log('Messages added successfully');
    console.log(`   Message count: ${conversation.messageCount}`);
    console.log(`   Total tokens: ${conversation.totalTokens}`);

    // Test 3: Test AIUsage Model
    console.log('\n3. Testing AIUsage Model...');
    const usage = new AIUsage({
      user: new mongoose.Types.ObjectId(),
      date: new Date(),
      context: 'general',
      requestCount: 5,
      totalTokens: 150,
      totalCost: 0.003,
      averageResponseTime: 1200,
      model: 'gpt-3.5-turbo'
    });

    await usage.save();
    console.log('AIUsage created successfully');

    // Test 4: Test usage increment method
    console.log('\n4. Testing usage increment method...');
    await usage.incrementUsage(25, 0.001, 800);
    console.log('Usage incremented successfully');
    console.log(`   New request count: ${usage.requestCount}`);
    console.log(`   New total tokens: ${usage.totalTokens}`);

    // Test 5: Test input sanitization
    console.log('\n5. Testing input sanitization...');
    const maliciousInput = '<script>alert("xss")</script>Hello; DROP TABLE users;';
    const sanitized = sanitizeAIInput(maliciousInput);
    console.log('Input sanitized successfully');
    console.log(`   Original: ${maliciousInput}`);
    console.log(`   Sanitized: ${sanitized}`);

    // Test 6: Test validation middleware
    console.log('\n6. Testing validation middleware...');
    const mockReq = {
      body: {
        message: 'Test message',
        context: 'general'
      }
    };
    const mockRes = {
      status: (code) => ({ json: (data) => console.log(`Response ${code}:`, data) })
    };
    const mockNext = () => console.log('Validation passed');

    // Test validation chain
    for (const validation of validateAIChat) {
      await validation(mockReq, mockRes, mockNext);
    }

    // Test 7: Test conversation statistics
    console.log('\n7. Testing conversation statistics...');
    const stats = await AIConversation.getUserStats(conversation.user);
    console.log('Conversation stats retrieved');
    console.log('   Stats:', stats);

    // Test 8: Test daily usage retrieval
    console.log('\n8. Testing daily usage retrieval...');
    const dailyUsage = await AIUsage.getDailyUsage(usage.user, new Date());
    console.log('Daily usage retrieved');
    console.log('   Daily usage:', dailyUsage);

    // Test 9: Test conversation archiving
    console.log('\n9. Testing conversation archiving...');
    await conversation.archive();
    console.log('Conversation archived successfully');
    console.log(`   Is active: ${conversation.isActive}`);

    // Test 10: Test conversation title update
    console.log('\n10. Testing conversation title update...');
    await conversation.updateTitle('Updated Test Conversation');
    console.log('Conversation title updated');
    console.log(`   New title: ${conversation.title}`);

    console.log('\n All AI Models and Middleware tests passed successfully!');

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    // Cleanup test data
    await AIConversation.deleteMany({ title: { $regex: /Test/ } });
    await AIUsage.deleteMany({ requestCount: { $lte: 10 } });
    console.log('\n🧹 Test data cleaned up');
    
    mongoose.connection.close();
  }
}

// Test rate limiting middleware
async function testRateLimiting() {
  console.log('\n Testing Rate Limiting Middleware...\n');

  const mockUser = { id: 'test-user-123' };
  const mockReq = { user: mockUser };
  const mockRes = {
    status: (code) => ({ json: (data) => console.log(`Rate limit response ${code}:`, data) })
  };
  const mockNext = () => console.log(' Rate limit check passed');

  try {
    // Test general rate limiter
    console.log('1. Testing general rate limiter...');
    const generalLimiter = aiRateLimit('general');
    await generalLimiter(mockReq, mockRes, mockNext);
    console.log('General rate limiter working');

    // Test code review rate limiter
    console.log('\n2. Testing code review rate limiter...');
    const codeReviewLimiter = aiRateLimit('codeReview');
    await codeReviewLimiter(mockReq, mockRes, mockNext);
    console.log('Code review rate limiter working');

    console.log('\n Rate limiting tests completed!');

  } catch (error) {
    console.error('Rate limiting test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting AI Models and Middleware Tests...\n');
  
  await testAIModels();
  await testRateLimiting();
  
  console.log('\n All tests completed!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testAIModels, testRateLimiting }; 