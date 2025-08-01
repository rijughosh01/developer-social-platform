const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test AI endpoints
async function testAI() {
  try {
    console.log('Testing AI Endpoints...\n');

    // Test 1: Get AI contexts
    console.log('1. Testing GET /ai/contexts...');
    try {
      const contextsResponse = await axios.get(`${API_URL}/ai/contexts`);
      console.log('Contexts:', contextsResponse.data.data);
    } catch (error) {
      console.log('Error getting contexts:', error.response?.data?.message || error.message);
    }

    // Test 2: Get AI stats
    console.log('\n2. Testing GET /ai/stats...');
    try {
      const statsResponse = await axios.get(`${API_URL}/ai/stats`);
      console.log('Stats:', statsResponse.data.data);
    } catch (error) {
      console.log('Error getting stats:', error.response?.data?.message || error.message);
    }

    // Test 3: Test chat endpoint (without auth - should fail)
    console.log('\n3. Testing POST /ai/chat (without auth)...');
    try {
      const chatResponse = await axios.post(`${API_URL}/ai/chat`, {
        message: 'Hello, how are you?',
        context: 'general'
      });
      console.log('Chat response:', chatResponse.data);
    } catch (error) {
      console.log('Expected auth error:', error.response?.data?.message || error.message);
    }

    console.log('\n AI Backend Tests Complete!');
    console.log('\n Note: To test authenticated endpoints, you need to:');
    console.log('1. Register/login a user');
    console.log('2. Get the JWT token');
    console.log('3. Include Authorization header: Bearer <token>');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testAI(); 