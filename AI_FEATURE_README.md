# 🤖 DevLink AI Chatbot Feature

## Overview

The DevLink AI Chatbot is a comprehensive AI-powered development assistant integrated into the DevLink platform. It provides developers with instant help for coding questions, debugging, learning, and project guidance.

## 🚀 Features

### Core AI Features
- **General Chat Assistant**: Ask any programming-related questions
- **Code Review**: Get expert feedback on your code
- **Debugging Assistant**: Help fix errors and debug issues
- **Learning Assistant**: Learn new concepts and technologies
- **Project Advice**: Get guidance on architecture and best practices

### Technical Features
- **Rate Limiting**: Prevents abuse with configurable limits
- **Response Caching**: Improves performance and reduces API costs
- **Context Switching**: Different AI personalities for different use cases
- **Code Highlighting**: Syntax highlighting for code responses
- **File Upload**: Upload code files for review
- **Real-time Chat**: Interactive chat interface
- **Usage Statistics**: Track your AI usage

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── utils/
│   └── aiService.js          # Core AI service with OpenAI integration
├── routes/
│   └── ai.js                 # AI API endpoints
└── server.js                 # Main server with AI routes
```

### Frontend (Next.js/React)
```
frontend/
├── components/ai/
│   ├── AIChatbot.tsx         # Main chat interface
│   ├── AIChatButton.tsx      # Floating chat button
│   ├── CodeReviewForm.tsx    # Code review form
│   └── DebugForm.tsx         # Debugging form
├── store/slices/
│   └── aiSlice.ts            # Redux state management
├── lib/
│   └── api.ts                # API functions
├── types/
│   └── index.ts              # TypeScript types
└── app/
    └── ai/
        └── page.tsx          # AI features page
```

## 🛠️ Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# AI Rate Limiting
AI_RATE_LIMIT=100
AI_CACHE_TTL=3600
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install openai node-cache rate-limiter-flexible
```

#### Frontend Dependencies
```bash
cd frontend
npm install react-markdown react-syntax-highlighter @types/react-syntax-highlighter
```

### 3. Start the Application

```bash
# Start backend
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## 📡 API Endpoints

### Authentication Required
All AI endpoints require JWT authentication.

### Available Endpoints

#### GET `/api/ai/contexts`
Get available AI contexts.

#### GET `/api/ai/stats`
Get user's AI usage statistics.

#### POST `/api/ai/chat`
Send a message to the AI assistant.
```json
{
  "message": "How do I implement authentication?",
  "context": "general"
}
```

#### POST `/api/ai/code-review`
Submit code for review.
```json
{
  "code": "function example() { ... }",
  "language": "javascript"
}
```

#### POST `/api/ai/debug`
Submit code with error for debugging.
```json
{
  "code": "function example() { ... }",
  "error": "TypeError: Cannot read property...",
  "language": "javascript"
}
```

#### POST `/api/ai/learn`
Get learning assistance.
```json
{
  "topic": "React Hooks"
}
```

#### POST `/api/ai/project-advice`
Get project advice.
```json
{
  "description": "I'm building a social media app..."
}
```

## 🎯 Usage Examples

### 1. General Chat
```javascript
// Ask any programming question
const response = await aiAPI.chat({
  message: "How do I implement JWT authentication?",
  context: "general"
});
```

### 2. Code Review
```javascript
// Submit code for review
const response = await aiAPI.codeReview({
  code: `
    function calculateTotal(items) {
      return items.reduce((sum, item) => sum + item.price, 0);
    }
  `,
  language: "javascript"
});
```

### 3. Debugging
```javascript
// Get help with errors
const response = await aiAPI.debugCode({
  code: "const result = await fetch('/api/data');",
  error: "TypeError: fetch is not defined",
  language: "javascript"
});
```

## 🔧 Configuration

### Rate Limiting
Configure rate limits in your `.env`:
```env
AI_RATE_LIMIT=100  # requests per hour per user
```

### Caching
Configure cache TTL:
```env
AI_CACHE_TTL=3600  # cache responses for 1 hour
```

### OpenAI Model
Choose your preferred model:
```env
OPENAI_MODEL=gpt-4o-mini  # or gpt-4-turbo, gpt-3.5-turbo
```

## 🎨 UI Components

### AIChatbot
The main chat interface with:
- Real-time messaging
- Context switching
- Code syntax highlighting
- Response copying
- Usage statistics

### AIChatButton
Floating button available throughout the app:
- Positioned bottom-right by default
- Only visible to authenticated users
- Opens the main chat interface

### CodeReviewForm
Specialized form for code review:
- Language selection
- File upload support
- Code preview
- Syntax highlighting

### DebugForm
Specialized form for debugging:
- Code and error input
- Language detection
- Error message highlighting

## 🔒 Security Features

- **JWT Authentication**: All endpoints require valid tokens
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **Error Handling**: Graceful error responses
- **CORS Protection**: Configured for production

## 📊 Monitoring

### Usage Statistics
Track user AI usage:
- Total requests
- Daily requests
- Favorite contexts
- Last usage time

### Error Monitoring
Monitor AI service errors:
- OpenAI API errors
- Rate limit violations
- Validation errors

## 🚀 Deployment

### Backend Deployment
1. Set environment variables
2. Install dependencies
3. Start the server

### Frontend Deployment
1. Build the application
2. Deploy to your hosting platform
3. Configure API endpoints

## 🧪 Testing

Run the AI test script:
```bash
cd backend
node test-ai.js
```

## 🔮 Future Enhancements

- **Vector Database**: Store and retrieve code examples
- **Document Processing**: Upload and analyze documents
- **Voice Input**: Speech-to-text for questions
- **Code Generation**: Generate code from descriptions
- **Integration**: Connect with GitHub, GitLab
- **Collaboration**: Share AI conversations
- **Custom Models**: Fine-tuned models for specific domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

---

**Happy Coding with DevLink AI! 🤖✨** 