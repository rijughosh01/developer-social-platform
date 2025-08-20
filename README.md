# DevLink (Developer Social Platform)

A modern social platform for developers to connect, collaborate, and showcase their work. DevLink enables developers to create rich profiles, share projects, write posts, follow others, and communicate in real-time.

---

## 🆕 What's New / Advanced Features

- **🤖 Multi-Model AI Assistant**: Choose from 4 different AI models (GPT-4o Mini, GPT-4o, GPT-3.5 Turbo, DeepSeek R1) based on your needs
- **💳 Subscription-Based AI Access**: Different AI models available based on subscription plans (Free, Premium, Pro)
- **📊 Daily Token Limits**: Intelligent usage management with plan-based daily token limits and real-time tracking
- **🎯 Context-Aware AI**: Specialized AI assistance for different coding scenarios (General, Code Review, Debugging, Learning, Project Help)
- **🧠 AI Conversation Management**: Pin important messages, delete conversations, and track AI usage analytics
- **📈 AI Analytics Dashboard**: Track AI usage, response times, conversation history, and token consumption
- **🔗 Draggable AI Interface**: Floating AI button that can be moved anywhere on the page
- **💬 Real-time AI Chat**: Instant responses with modern UI/UX and code syntax highlighting
- **📌 Message Pinning System**: Pin and organize important AI responses for future reference
- **🗑️ Conversation Management**: Delete entire AI conversations with confirmation dialogs
- **🔔 AI Notifications**: Toast notifications for all AI interactions and actions
- **⚡ Enhanced Error Handling**: Contextual error messages with suggestions for model switching and plan upgrades
- **Collaboration Analytics Dashboard**: Track reviews, forks, collaboration score, badges, and more.
- **Trending Feed**: Discover trending posts, projects, and developers based on recent activity.
- **Project Collaboration**: Add collaborators with roles, fork projects, and manage collaboration history.
- **Review Requests**: Request and provide code reviews with ratings and threaded responses.
- **Advanced Notifications**: Get notified for mentions, invites, review requests, forks, and more.
- **Saved Items**: Save posts and projects for later.
- **Professional Networking**: Earn badges, discover developers, and grow your network.
- **💬 Discussion Forums**: Create and participate in threaded discussions with categories, tags, voting, and moderation.
- **🏆 Badge & Achievement System**: Earn badges for key actions, see your progress in the Badge Gallery, and get real-time notifications when you earn a badge.
- **📸 Image Upload**: Cloudinary integration for profile pictures, post images, and project screenshots.
- **🔒 Advanced Security**: Rate limiting, input validation, and secure authentication.

---

## 🏗️ Project Architecture

DevLink uses a modern full-stack architecture:
- **Frontend:** Next.js 14 (React), connects to backend via REST API and WebSockets
- **Backend:** Node.js/Express, handles API requests, authentication, analytics, and real-time events
- **Database:** MongoDB (Mongoose)
- **Caching:** Redis (Traditional + Upstash) for performance optimization
- **Real-time:** Socket.IO for chat and notifications
- **AI Integration:** OpenAI API with LangChain for intelligent coding assistance
- **Image Storage:** Cloudinary for image uploads and management
- **Static Assets:** Served from the public/uploads directory

---

## 🚀 Features

### Core Features
- **Authentication**: JWT, role-based, secure password reset
- **Developer Profiles**: Bio, skills, social links, project showcase
- **Posts System**: CRUD, likes, comments, rich text, categories
- **Follow System**: Follow/unfollow, followers/following lists
- **Real-time Chat**: Socket.IO messaging, online status
- **Notifications**: Real-time, mark as read/unread, preferences
- **Responsive UI**: Modern design with Tailwind CSS
- **Discussion Forums**: Threaded discussions with categories, tags, voting, and moderation

### 🤖 AI-Powered Features
- **Multi-Model AI Assistant**: Choose from multiple AI models based on your needs
  - **GPT-4o Mini** (OpenAI): Fast, efficient coding assistance
  - **GPT-4o** (OpenAI): Advanced reasoning and complex problem solving
  - **GPT-3.5 Turbo** (OpenAI): Balanced performance and cost
  - **DeepSeek R1** (OpenRouter): Specialized coding and development tasks
- **Subscription-Based Access**: Different models available based on subscription plans
  - **Free Plan**: Access to GPT-4o Mini, GPT-3.5 Turbo, and DeepSeek R1
  - **Premium Plan**: Access to all models with higher daily limits
  - **Pro Plan**: Unlimited access to all models with maximum daily limits
- **Daily Token Limits**: Intelligent usage management with plan-based limits
  - **Free**: 10K-20K tokens per day depending on model
  - **Premium**: 50K-100K tokens per day depending on model  
  - **Pro**: 200K-500K tokens per day depending on model
  - **Real-time tracking**: See remaining tokens and usage statistics
- **Context-Aware AI Assistant**: 5 specialized modes for different coding scenarios
  - **General**: General coding assistance and questions
  - **Code Review**: Code analysis, improvements, and best practices
  - **Debugging**: Bug fixing, troubleshooting, and error resolution
  - **Learning**: Educational content, tutorials, and explanations
  - **Project Help**: Project planning, architecture, and guidance
- **AI Conversation Management**: 
  - Pin important messages for quick access
  - Delete entire conversations with confirmation
  - View conversation history and analytics
  - Track AI usage and response times
  - Model-specific conversation tracking
- **Enhanced AI Interface**:
  - Draggable floating AI button
  - Real-time chat with syntax highlighting
  - Model selection dropdown with availability indicators
  - Token usage display with progress tracking
  - Toast notifications for all actions
  - Responsive design with glassmorphism effects
  - Error handling with contextual suggestions
- **AI Analytics & Usage Tracking**: 
  - Daily token usage per model
  - Usage breakdown and statistics
  - Response analytics and performance metrics
  - Subscription plan integration
  - Reset time tracking for daily limits

### Collaboration & Projects
- **Project Collaboration**: Add collaborators (developer, designer, tester, manager)
- **Forking**: Fork projects and posts, view fork history
- **Review Requests**: Request and provide code reviews, ratings, and responses
- **Project Metadata**: Screenshots, tags, categories, status, featured flag, view count

### Analytics & Trending
- **Collaboration Analytics**: Dashboard for reviews, forks, collaboration score, badges, top collaborators, language stats, and activity over time
- **Trending Feed**: Trending posts, projects, and developers (last 7 days)
- **Monthly/Weekly/Yearly Activity Tracking**

### Professional Networking
- **Developer Discovery**: Find and follow developers
- **Profile Badges**: Earn badges for collaboration and engagement
- **Achievement System**: Track progress and earn badges for various activities

### Discussion Forums
- **Threaded Discussions**: Create and participate in deep technical discussions
- **Categories & Tags**: Organize discussions by topics (General, Help, Showcase, Tutorial, etc.)
- **Voting System**: Upvote/downvote discussions and comments
- **Polls System**: Create polls within discussions for quick community feedback
  - Multiple choice and single choice polls
  - Poll expiration dates
  - Real-time vote tracking and results
  - Vote change functionality
  - Poll deletion for authors
- **Rich Text Editor**: Create formatted content with markdown support
- **Moderation Tools**: Flag inappropriate content, sticky discussions, and moderation features
- **Search & Filters**: Advanced search with category, tag, and status filters
- **Discussion Analytics**: Track views, replies, and engagement metrics
- **Mention System**: Tag users with @mentions for notifications
- **Saved Discussions**: Save important discussions for later reference

### Saved & Personalized Content
- **Saved Posts/Projects**: Save items for later
- **Personalized Feeds**: Code feed, trending, and more

### 🏆 Badge & Achievement System
- **First Post**: Create your first post on the platform
- **Top Commenter**: Write 10 comments on posts
- **Code Forked 10+**: Have one of your code posts forked 10 or more times
- **Streak Master**: Log in 7 days in a row
- **Helper**: Answer 5+ questions/comments from others
- **Popular Post**: A post received 50+ likes
- **Project Creator**: Create 3+ projects
- **Collaborator**: Collaborate on 2+ projects
- **First Like**: Receive your first like on a post
- **Milestone**: Reach 100 followers

---

## 🤖 AI Models & Capabilities

### Available AI Models
- **GPT-4o Mini** (OpenAI)
  - Fast and efficient for general coding tasks
  - Available on all subscription plans
  - Daily limits: Free (10K), Premium (50K), Pro (200K) tokens

- **GPT-4o** (OpenAI)
  - Advanced reasoning and complex problem solving
  - Premium and Pro plans only
  - Daily limits: Premium (50K), Pro (200K) tokens

- **GPT-3.5 Turbo** (OpenAI)
  - Balanced performance and cost
  - Available on all subscription plans
  - Daily limits: Free (15K), Premium (100K), Pro (500K) tokens

- **DeepSeek R1** (OpenRouter)
  - Specialized coding and development tasks
  - Available on all subscription plans
  - Daily limits: Free (20K), Premium (100K), Pro (500K) tokens

### AI Features
- **Smart Model Selection**: Choose the best model for your specific task
- **Usage Tracking**: Real-time monitoring of token consumption
- **Plan-Based Access**: Different models available based on subscription
- **Context Switching**: Seamlessly switch between different AI contexts
- **Error Recovery**: Intelligent suggestions when limits are reached

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- Redux Toolkit
- Socket.IO Client
- React Hook Form
- React Hot Toast
- Framer Motion
- React Syntax Highlighter
- React Quill (Rich Text Editor)

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Auth
- Socket.IO
- bcrypt
- OpenAI API
- OpenRouter API (DeepSeek R1)
- LangChain
- Cloudinary
- Rate Limiting
- AI Middleware
- Express Validator
- Multer (File Upload)
- Axios (HTTP client for AI APIs)
- Rate Limiter Flexible (Token limit management)
- Node Cache (Caching for AI responses)

---

## 📁 Project Structure

```text
developer-social-platform/
├── frontend/   # Next.js frontend
│   ├── app/    # Next.js app router pages
│   ├── components/ # React components
│   ├── store/  # Redux store and slices
│   ├── hooks/  # Custom React hooks
│   ├── lib/    # Utility libraries
│   └── types/  # TypeScript type definitions
├── backend/    # Node.js/Express backend
│   ├── models/ # MongoDB schemas
│   ├── routes/ # API routes
│   ├── middleware/ # Custom middleware
│   ├── utils/  # Utility functions
│   ├── socket/ # Socket.IO setup
│   └── server.js # Express server
└── README.md   # Project documentation
```

---

## 🏁 Getting Started

For detailed setup instructions, see [setup.md](./setup.md).

### Quick Start

#### 1. Backend Setup
```bash
cd backend
npm install
cp env-template.txt .env
# Configure your .env file with Redis settings
npm run dev
```

#### 2. Redis Database Setup
```bash
# Configure Redis in your .env file
# See env-template.txt for Redis configuration options
```

#### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 Environment Variables

See [setup.md](./setup.md#environment-variables) for full details.

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devlink
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
DEFAULT_AI_MODEL=gpt-4o-mini

# AI Rate Limiting
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=60000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🔗 API Endpoints

See [setup.md](./setup.md#api-endpoints) for a full list of backend API endpoints including AI endpoints.

---

## 🧑‍💻 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📚 Documentation

- **[AI Documentation](./AI_DOCUMENTATION.md)** - Complete AI chatbot features, models, middleware, and implementation guide
- **[System Design](./SYSTEM_DESIGN.md)** - Complete system architecture and scalability guide
- **[Setup Guide](./setup.md)** - Detailed installation and configuration instructions


## 🛟 Troubleshooting

For common issues and solutions, see [setup.md](./setup.md#troubleshooting).

---

## 📄 License

This project is licensed under the MIT License. 