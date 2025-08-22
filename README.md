# DevLink - Developer Social Platform

A comprehensive, AI-powered social platform designed specifically for developers to connect, collaborate, showcase their work, and get intelligent coding assistance. DevLink combines the best of social networking with advanced AI capabilities, project collaboration, and professional development tools.

![DevLink Platform](https://img.shields.io/badge/DevLink-Platform-blue?style=for-the-badge&logo=github)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-18-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)

---

## 🚀 Key Features

### 🤖 **Advanced AI Assistant System**
- **Multi-Model AI Support**: Choose from 5 different AI models (GPT-4o Mini, GPT-4o, GPT-3.5 Turbo, DeepSeek R1, Qwen3 Coder)
- **Subscription-Based Access**: Different AI models available based on subscription plans (Free, Premium, Pro)
- **Context-Aware AI**: 5 specialized modes for different coding scenarios:
  - **General**: General coding assistance and questions
  - **Code Review**: Code analysis, improvements, and best practices
  - **Debugging**: Bug fixing, troubleshooting, and error resolution
  - **Learning**: Educational content, tutorials, and explanations
  - **Project Help**: Project planning, architecture, and guidance
- **Daily Token Limits**: Intelligent usage management with plan-based limits and real-time tracking
- **AI Conversation Management**: Pin important messages, delete conversations, track usage analytics
- **Draggable AI Interface**: Floating AI button that can be moved anywhere on the page
- **Real-time AI Chat**: Instant responses with modern UI/UX and code syntax highlighting
- **AI Analytics Dashboard**: Track AI usage, response times, conversation history, and token consumption

### 👥 **Social Networking & Community**
- **Developer Profiles**: Rich profiles with bio, skills, social links, project showcase, and badges
- **Follow System**: Follow/unfollow developers, view followers/following lists
- **Posts System**: Create regular and code posts with rich text, categories, tags, and difficulty levels
- **Comments & Interactions**: Nested comments, likes, replies, and threaded discussions
- **Real-time Chat**: Socket.IO messaging with online status, file sharing, and group chats
- **Notifications**: Real-time notifications for all interactions with mark as read/unread
- **Mentions System**: Tag users with @mentions for notifications
- **Developer Discovery**: Find and connect with developers based on skills and interests

### 🏗️ **Project Collaboration & Management**
- **Project Showcase**: Create and showcase projects with screenshots, descriptions, and live links
- **Collaboration System**: Add collaborators with roles (developer, designer, tester, manager)
- **Forking System**: Fork projects and posts, view fork history and analytics
- **Review Requests**: Request and provide code reviews with ratings and threaded responses
- **Project Templates**: Pre-built templates for different project types
- **Project Analytics**: Track views, likes, forks, and collaboration metrics
- **Project Status Management**: Track project status (planning, in-progress, completed, archived)

### 💬 **Discussion Forums & Community**
- **Threaded Discussions**: Create and participate in deep technical discussions
- **Categories & Tags**: Organize discussions by topics (General, Help, Showcase, Tutorial, etc.)
- **Voting System**: Upvote/downvote discussions and comments
- **Polls System**: Create polls within discussions for community feedback
  - Multiple choice and single choice polls
  - Poll expiration dates and real-time vote tracking
  - Vote change functionality and poll deletion for authors
- **Rich Text Editor**: Create formatted content with markdown support
- **Moderation Tools**: Flag inappropriate content, sticky discussions, and moderation features
- **Search & Filters**: Advanced search with category, tag, and status filters
- **Discussion Analytics**: Track views, replies, and engagement metrics

### 🏆 **Badge & Achievement System**
- **Earnable Badges**: 10+ badges for various achievements:
  - First Post, Top Commenter, Code Forked 10+, Streak Master
  - Helper, Popular Post, Project Creator, Collaborator, First Like, Milestone
- **Badge Gallery**: View all available badges and your progress
- **Real-time Notifications**: Get notified when you earn a badge
- **Achievement Tracking**: Track progress towards earning badges

### 📊 **Analytics & Insights**
- **Collaboration Analytics**: Dashboard for reviews, forks, collaboration score, badges, top collaborators
- **Trending Feed**: Discover trending posts, projects, and developers based on recent activity
- **Activity Tracking**: Monthly/weekly/yearly activity tracking
- **Language Statistics**: Track programming languages and technologies used
- **Performance Metrics**: Response times, engagement rates, and user analytics

### 🔍 **Search & Discovery**
- **Advanced Search**: Search across posts, projects, discussions, and users
- **Filtering Options**: Filter by category, tags, difficulty, date range
- **Trending Content**: Discover trending posts, projects, and developers
- **Personalized Feeds**: Code feed, trending, and personalized recommendations
- **Saved Items**: Save posts and projects for later reference

### 🛡️ **Security & Performance**
- **JWT Authentication**: Secure authentication with role-based access control
- **Rate Limiting**: Advanced rate limiting for API endpoints and AI usage
- **Input Validation**: Comprehensive validation and sanitization
- **File Upload Security**: Secure image uploads with Cloudinary integration
- **Caching System**: Redis caching for improved performance
- **Error Handling**: Comprehensive error handling with contextual messages

---

## 🏗️ Architecture & Tech Stack

### **Frontend Architecture**
- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Redux Toolkit with RTK Query
- **Real-time**: Socket.IO Client for live updates
- **Forms**: React Hook Form with validation
- **Rich Text**: React Quill with markdown support
- **Code Highlighting**: React Syntax Highlighter with Prism.js
- **Animations**: Framer Motion for smooth interactions
- **Notifications**: React Hot Toast for user feedback

### **Backend Architecture**
- **Runtime**: Node.js 18+ with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis (Traditional + Upstash) for performance optimization
- **Real-time**: Socket.IO with Redis adapter for scalability
- **AI Integration**: OpenAI API and OpenRouter API for multi-model support
- **File Storage**: Cloudinary for image uploads and management
- **Email Service**: Nodemailer for transactional emails
- **Authentication**: JWT with bcrypt for password hashing
- **Validation**: Express Validator with custom middleware
- **Rate Limiting**: Rate Limiter Flexible with Redis storage
- **Logging**: Winston for structured logging

### **AI & Machine Learning**
- **AI Models**: GPT-4o, GPT-4o Mini, GPT-3.5 Turbo, DeepSeek R1, Qwen3 Coder
- **AI Framework**: LangChain for AI orchestration
- **Token Management**: Intelligent token usage tracking and limits
- **Context Management**: Conversation history and context preservation
- **Response Caching**: Node Cache for AI response optimization
- **Error Recovery**: Intelligent fallback and error handling

### **Infrastructure & DevOps**
- **Environment**: Development, staging, and production configurations
- **API Documentation**: Comprehensive API endpoints with examples
- **Health Checks**: System health monitoring and status endpoints
- **Error Monitoring**: Structured error handling and logging
- **Performance**: Caching strategies and optimization techniques

---

## 📁 Project Structure

```
developer-social-platform/
├── frontend/                          # Next.js frontend application
│   ├── app/                          # Next.js app router pages
│   │   ├── ai/                       # AI assistant pages
│   │   ├── auth/                     # Authentication pages
│   │   ├── badges/                   # Badge gallery and achievements
│   │   ├── collaboration/            # Project collaboration features
│   │   ├── conversations/            # AI conversation history
│   │   ├── dashboard/                # User dashboard and analytics
│   │   ├── developers/               # Developer profiles and discovery
│   │   ├── discussions/              # Discussion forums
│   │   ├── messages/                 # Real-time chat system
│   │   ├── notifications/            # Notification center
│   │   ├── posts/                    # Posts and content management
│   │   ├── profile/                  # User profile management
│   │   ├── projects/                 # Project showcase and management
│   │   ├── search/                   # Advanced search functionality
│   │   ├── settings/                 # User settings and preferences
│   │   ├── trending/                 # Trending content and analytics
│   │   └── saved/                    # Saved items management
│   ├── components/                   # Reusable React components
│   │   ├── ai/                       # AI assistant components
│   │   ├── dashboard/                # Dashboard and analytics components
│   │   ├── discussions/              # Discussion forum components
│   │   ├── notifications/            # Notification components
│   │   ├── posts/                    # Post and content components
│   │   ├── projects/                 # Project management components
│   │   ├── search/                   # Search and filter components
│   │   └── ui/                       # Base UI components
│   ├── store/                        # Redux store and slices
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # Utility libraries and helpers
│   └── types/                        # TypeScript type definitions
├── backend/                          # Node.js/Express backend API
│   ├── models/                       # MongoDB schemas and models
│   │   ├── User.js                   # User model with subscription plans
│   │   ├── Post.js                   # Post and comment models
│   │   ├── Project.js                # Project and collaboration models
│   │   ├── Discussion.js             # Discussion and poll models
│   │   ├── Chat.js                   # Chat and message models
│   │   ├── Notification.js           # Notification model
│   │   ├── AIConversation.js         # AI conversation tracking
│   │   ├── AIUsage.js                # AI usage analytics
│   │   └── DailyTokenUsage.js        # Daily token usage tracking
│   ├── routes/                       # API route handlers
│   │   ├── auth.js                   # Authentication routes
│   │   ├── users.js                  # User management routes
│   │   ├── posts.js                  # Post management routes
│   │   ├── projects.js               # Project management routes
│   │   ├── discussions.js            # Discussion forum routes
│   │   ├── chat.js                   # Real-time chat routes
│   │   ├── ai.js                     # AI assistant routes
│   │   ├── notifications.js          # Notification routes
│   │   ├── analytics.js              # Analytics and insights routes
│   │   ├── trending.js               # Trending content routes
│   │   └── search.js                 # Search functionality routes
│   ├── middleware/                   # Custom middleware
│   │   ├── auth.js                   # Authentication middleware
│   │   ├── aiRateLimit.js            # AI usage rate limiting
│   │   ├── aiValidation.js           # AI request validation
│   │   ├── cache.js                  # Caching middleware
│   │   └── errorHandler.js           # Error handling middleware
│   ├── utils/                        # Utility functions and services
│   │   ├── aiService.js              # AI service integration
│   │   ├── notificationService.js    # Notification service
│   │   ├── emailService.js           # Email service
│   │   ├── redisService.js           # Redis caching service
│   │   └── cloudinary.js             # File upload service
│   ├── socket/                       # Socket.IO configuration
│   ├── config/                       # Configuration files
│   └── server.js                     # Express server setup
├── docs/                             # Documentation
│   ├── SYSTEM_DESIGN.md              # System architecture documentation
│   ├── setup.md                      # Setup and installation guide
│   └── API_DOCUMENTATION.md          # API documentation
└── README.md                         # Project overview and features
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Redis (local or cloud)
- OpenAI API Key
- Cloudinary Account
- Git

### Quick Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd developer-social-platform
```

2. **Backend Setup**
```bash
cd backend
npm install
cp env-template.txt .env
# Configure your .env file with all required variables
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install
cp .env.example .env.local
# Configure your .env.local file
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

### Environment Variables

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/devlink

# Authentication
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
DEFAULT_AI_MODEL=gpt-4o-mini

# AI Rate Limiting
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=60000

# File Upload
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Redis Configuration
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `POST /api/auth/verify-email` - Email verification

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/search` - Search users
- `POST /api/users/follow/:id` - Follow user
- `DELETE /api/users/follow/:id` - Unfollow user

### Posts & Content
- `GET /api/posts` - Get posts with filters
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/fork` - Fork post

### Projects
- `GET /api/projects` - Get projects with filters
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/collaborators` - Add collaborator
- `POST /api/projects/:id/reviews` - Request code review

### AI Assistant
- `GET /api/ai/models` - Get available AI models
- `GET /api/ai/token-limits` - Get token limits and usage
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/conversations` - Get AI conversations
- `POST /api/ai/conversations` - Create new conversation
- `PUT /api/ai/conversations/:id` - Update conversation
- `DELETE /api/ai/conversations/:id` - Delete conversation
- `POST /api/ai/messages/:id/pin` - Pin AI message

### Discussions
- `GET /api/discussions` - Get discussions with filters
- `POST /api/discussions` - Create new discussion
- `GET /api/discussions/:id` - Get discussion by ID
- `PUT /api/discussions/:id` - Update discussion
- `DELETE /api/discussions/:id` - Delete discussion
- `POST /api/discussions/:id/vote` - Vote on discussion
- `POST /api/discussions/:id/polls` - Create poll

### Chat & Messaging
- `GET /api/chat/conversations` - Get chat conversations
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/:id/messages` - Get chat messages
- `POST /api/chat/:id/messages` - Send message

### Analytics & Trending
- `GET /api/analytics/collaboration` - Get collaboration analytics
- `GET /api/analytics/ai-usage` - Get AI usage analytics
- `GET /api/trending/posts` - Get trending posts
- `GET /api/trending/projects` - Get trending projects
- `GET /api/trending/developers` - Get trending developers

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📚 Documentation

- **[System Design](./SYSTEM_DESIGN.md)** - Complete system architecture and scalability guide
- **[Setup Guide](./setup.md)** - Detailed installation and configuration instructions
- **[API Documentation](./docs/API_DOCUMENTATION.md)** - Complete API reference

---

## 🛟 Support & Troubleshooting

For common issues and solutions, see [setup.md](./setup.md#troubleshooting).

### Common Issues
- **AI Rate Limiting**: Check your subscription plan and daily token limits
- **File Upload Issues**: Verify Cloudinary configuration
- **Database Connection**: Ensure MongoDB is running and accessible
- **Redis Connection**: Check Redis configuration and connectivity

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- OpenAI for providing the AI models and APIs
- MongoDB for the database solution
- Redis for caching and real-time features
- Cloudinary for file storage and management
- The open-source community for the amazing tools and libraries

---

**Built with ❤️ for the developer community** 