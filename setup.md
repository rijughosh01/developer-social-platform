# DevLink Setup Guide

> For an overview and features, see [README.md](./README.md)

---

## Table of Contents
- [DevLink Setup Guide](#devlink-setup-guide)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
    - [1. Clone the repository](#1-clone-the-repository)
    - [2. Backend Setup](#2-backend-setup)
    - [3. Frontend Setup](#3-frontend-setup)
    - [4. Access the Application](#4-access-the-application)
  - [Environment Variables](#environment-variables)
    - [Backend (.env)](#backend-env)
    - [Frontend (.env.local)](#frontend-envlocal)
  - [Features Available](#features-available)
  - [API Endpoints](#api-endpoints)
    - [🔐 Authentication Endpoints](#-authentication-endpoints)
    - [👥 User Management Endpoints](#-user-management-endpoints)
    - [📝 Posts Endpoints](#-posts-endpoints)
    - [💬 Comments Endpoints](#-comments-endpoints)
    - [🚀 Projects Endpoints](#-projects-endpoints)
    - [💬 Chat Endpoints](#-chat-endpoints)
    - [🔔 Notifications Endpoints](#-notifications-endpoints)
    - [🤖 AI Endpoints](#-ai-endpoints)
    - [📊 Analytics Endpoints](#-analytics-endpoints)
    - [🔥 Trending Endpoints](#-trending-endpoints)
    - [📤 Upload Endpoints](#-upload-endpoints)
    - [💬 Discussions Endpoints](#-discussions-endpoints)
    - [🏥 Health Check](#-health-check)
  - [Development](#development)
    - [Backend Scripts](#backend-scripts)
    - [Frontend Scripts](#frontend-scripts)
  - [Project Structure](#project-structure)
  - [Troubleshooting](#troubleshooting)
    - [Common Issues](#common-issues)
  - [Contributing](#contributing)
  - [License](#license)

---

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git
- OpenAI API Key (for AI features)
- Cloudinary Account (for image uploads)

---

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd developer-social-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create environment file
cp env.example .env
# Edit .env with your configuration:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/devlink
# JWT_SECRET=your_super_secret_jwt_key_here
# NODE_ENV=development
# JWT_EXPIRE=7d
# FRONTEND_URL=http://localhost:3000
# OPENAI_API_KEY=your_openai_api_key_here
# AI_RATE_LIMIT=10
# AI_RATE_LIMIT_WINDOW=60000
# CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
# CLOUDINARY_API_KEY=your_cloudinary_api_key
# CLOUDINARY_API_SECRET=your_cloudinary_api_secret
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create environment file
cp env.example .env.local
# Edit .env.local with your configuration:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

---

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devlink
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=60000
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Features Available

- User registration, login, and JWT authentication
- Developer profiles (bio, skills, social links)
- Follow/unfollow system
- Post creation, editing, deletion, likes, comments
- Project showcase and collaboration (add collaborators, roles, forking, review requests)
- **🤖 AI-Powered Chatbot** (intelligent coding assistant with 5 contexts: General, Code Review, Debugging, Learning, Project Help)
- **🧠 AI Conversation Management** (pin messages, delete conversations, track usage analytics)
- **🔗 Draggable AI Interface** (floating AI button that can be moved anywhere)
- **💬 Real-time AI Chat** (instant responses with syntax highlighting)
- **📌 Message Pinning System** (organize important AI responses)
- **🗑️ Conversation Management** (delete conversations with confirmation)
- **🔔 AI Notifications** (toast notifications for all AI actions)
- **Collaboration Analytics Dashboard** (track reviews, forks, badges, and more)
- **Trending Feed** (discover trending posts, projects, and developers)
- **Advanced Notifications** (mentions, invites, review requests, forks, etc.)
- **Saved Items** (save posts and projects for later)
- **Real-time chat and notifications (Socket.IO)**
- **🏆 Badge & Achievement System** (earn badges for key actions, see your progress in the Badge Gallery, and get real-time notifications when you earn a badge)
- **💬 Discussion Forums** (threaded discussions with categories, tags, voting, and moderation)
- **📸 Image Upload** (Cloudinary integration for profile pictures, post images, and project screenshots)
- **🔒 Advanced Security** (rate limiting, input validation, and secure authentication)
- **Responsive UI with Tailwind CSS**

> For a full and up-to-date list of features and all available badges, see [README.md](./README.md#badges--achievements)

---

## API Endpoints

### 🔐 Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `PUT /api/auth/reset-password` - Reset password with token

### 👥 User Management Endpoints
- `GET /api/users` - Get all users (with pagination and search)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/follow` - Follow a user
- `DELETE /api/users/:id/follow` - Unfollow a user
- `GET /api/users/:id/followers` - Get user's followers
- `GET /api/users/:id/following` - Get users that this user follows
- `POST /api/users/:id/save-post/:postId` - Save a post
- `DELETE /api/users/:id/save-post/:postId` - Unsave a post
- `GET /api/users/:id/saved` - Get user's saved posts
- `PUT /api/users/:id/avatar` - Update user avatar
- `PUT /api/users/:id/bio` - Update user bio
- `GET /api/users/:id/badges` - Get user's badges
- `PUT /api/users/:id/badges` - Update user badges
- `GET /api/users/:id/activity` - Get user's activity
- `PUT /api/users/:id/settings` - Update user settings
- `DELETE /api/users/:id` - Delete user account
- `POST /api/users/:id/verify` - Verify user account

### 📝 Posts Endpoints
- `GET /api/posts` - Get all posts (with pagination and filters)
- `GET /api/posts/:postId` - Get specific post
- `POST /api/posts` - Create a new post
- `PUT /api/posts/:postId` - Update a post
- `DELETE /api/posts/:postId` - Delete a post
- `POST /api/posts/:postId/like` - Like a post
- `DELETE /api/posts/:postId/like` - Unlike a post
- `GET /api/posts/:postId/likes` - Get post likes
- `POST /api/posts/:postId/share` - Share a post
- `GET /api/posts/:postId/shares` - Get post shares
- `POST /api/posts/:postId/fork` - Fork a post
- `GET /api/posts/:postId/forks` - Get post forks
- `POST /api/posts/:postId/review-request` - Request review for a post
- `GET /api/posts/:postId/reviews` - Get post reviews
- `DELETE /api/posts/:postId/review/:reviewId` - Delete a review

### 💬 Comments Endpoints
- `GET /api/comments/:postId` - Get comments for a post
- `POST /api/comments/:postId` - Add a comment to a post
- `DELETE /api/comments/:commentId` - Delete a comment

### 🚀 Projects Endpoints
- `GET /api/projects` - Get all projects (with pagination and filters)
- `GET /api/projects/:projectId` - Get specific project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:projectId` - Update a project
- `DELETE /api/projects/:projectId` - Delete a project
- `POST /api/projects/:projectId/collaborators` - Add collaborator to project
- `POST /api/projects/:projectId/fork` - Fork a project
- `DELETE /api/projects/:projectId/collaborators/:collaboratorId` - Remove collaborator
- `GET /api/projects/:projectId/collaborators` - Get project collaborators

### 💬 Chat Endpoints
- `GET /api/chat/conversations` - Get user's conversations
- `GET /api/chat/conversations/:conversationId` - Get specific conversation
- `POST /api/chat/conversations` - Create new conversation
- `POST /api/chat/conversations/:conversationId/messages` - Send message
- `PUT /api/chat/conversations/:conversationId/read` - Mark conversation as read
- `GET /api/chat/conversations/:conversationId/messages` - Get conversation messages
- `POST /api/chat/conversations/:conversationId/typing` - Send typing indicator

### 🔔 Notifications Endpoints
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread` - Get unread notifications count
- `PUT /api/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete a notification
- `DELETE /api/notifications` - Delete all notifications
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings
- `GET /api/notifications/types` - Get notification types
- `PUT /api/notifications/types/:type` - Update notification type settings

### 🤖 AI Endpoints
- `POST /api/ai/chat` - Send message to AI chatbot with context
- `GET /api/ai/conversations` - Get user's AI conversation history
- `GET /api/ai/conversations/:id` - Get specific conversation details
- `POST /api/ai/conversations/:id/pin/:messageIndex` - Pin an important message
- `DELETE /api/ai/conversations/:id/pin/:messageIndex` - Unpin a message
- `GET /api/ai/conversations/:id/pinned` - Get all pinned messages from conversation
- `DELETE /api/ai/conversations/:id` - Delete entire conversation
- `GET /api/ai/stats` - Get AI usage statistics and analytics
- `GET /api/ai/contexts` - Get available AI contexts (General, Code Review, etc.)

### 📊 Analytics Endpoints
- `GET /api/analytics/collaboration` - Get collaboration analytics (requires authentication)

### 🔥 Trending Endpoints
- `GET /api/trending` - Get trending posts, projects, and developers

### 📤 Upload Endpoints
- `POST /api/upload` - Upload an image file

### 💬 Discussions Endpoints
- `GET /api/discussions` - Get all discussions (with filters and pagination)
- `GET /api/discussions/categories` - Get available discussion categories
- `GET /api/discussions/tags` - Get popular discussion tags
- `POST /api/discussions` - Create a new discussion
- `GET /api/discussions/:id` - Get specific discussion with comments
- `PUT /api/discussions/:id` - Update a discussion
- `DELETE /api/discussions/:id` - Delete a discussion
- `POST /api/discussions/:id/vote` - Vote on a discussion
- `POST /api/discussions/:id/comments` - Add comment to discussion
- `PUT /api/discussions/:id/comments/:commentId` - Update a comment
- `DELETE /api/discussions/:id/comments/:commentId` - Delete a comment
- `POST /api/discussions/:id/comments/:commentId/vote` - Vote on a comment
- `POST /api/discussions/:id/flag` - Flag a discussion
- `POST /api/discussions/:id/comments/:commentId/flag` - Flag a comment

### 🏥 Health Check
- `GET /api/health` - API health check endpoint

---

## Development

### Backend Scripts
```bash
npm run dev      # Start development server
npm start        # Start production server
npm test         # Run tests
```

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

---

## Project Structure

```text
developer-social-platform/
├── backend/
│   ├── models/          # MongoDB schemas
│   │   ├── User.js      # User model with badges and reputation
│   │   ├── Post.js      # Post model with likes, comments, forks
│   │   ├── Project.js   # Project model with collaborators
│   │   ├── Chat.js      # Chat model for messaging
│   │   ├── Discussion.js # Discussion model for forums
│   │   ├── Comment.js   # Comment model
│   │   ├── Notification.js # Notification model
│   │   ├── AIConversation.js # AI conversation model
│   │   └── AIUsage.js   # AI usage tracking model
│   ├── routes/          # API routes
│   │   ├── auth.js      # Authentication routes
│   │   ├── users.js     # User management routes
│   │   ├── posts.js     # Post management routes
│   │   ├── projects.js  # Project management routes
│   │   ├── chat.js      # Chat routes
│   │   ├── discussions.js # Discussion forum routes
│   │   ├── comments.js  # Comment routes
│   │   ├── notifications.js # Notification routes
│   │   ├── ai.js        # AI chatbot routes
│   │   ├── analytics.js # Analytics routes
│   │   ├── trending.js  # Trending routes
│   │   └── upload.js    # File upload routes
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js      # JWT authentication middleware
│   │   ├── validate.js  # Input validation middleware
│   │   ├── errorHandler.js # Error handling middleware
│   │   ├── aiRateLimit.js # AI rate limiting middleware
│   │   └── aiValidation.js # AI input validation middleware
│   ├── utils/           # Utility functions
│   │   ├── asyncHandler.js # Async error handler
│   │   ├── generateToken.js # JWT token generation
│   │   ├── cloudinary.js # Cloudinary configuration
│   │   ├── aiService.js # AI service integration
│   │   └── notificationService.js # Notification service
│   ├── socket/          # Socket.IO setup
│   │   └── socket.js    # Real-time communication
│   └── server.js        # Express server
├── frontend/
│   ├── app/             # Next.js app router
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   ├── posts/       # Post pages
│   │   ├── projects/    # Project pages
│   │   ├── discussions/ # Discussion forum pages
│   │   ├── ai/          # AI chatbot pages
│   │   ├── messages/    # Chat pages
│   │   ├── notifications/ # Notification pages
│   │   ├── badges/      # Badge gallery page
│   │   ├── profile/     # Profile pages
│   │   └── settings/    # Settings pages
│   ├── components/      # React components
│   │   ├── ui/          # UI components
│   │   ├── posts/       # Post components
│   │   ├── projects/    # Project components
│   │   ├── discussions/ # Discussion components
│   │   ├── ai/          # AI chatbot components
│   │   ├── chat/        # Chat components
│   │   ├── notifications/ # Notification components
│   │   └── dashboard/   # Dashboard components
│   ├── store/           # Redux store
│   │   ├── slices/      # Redux slices
│   │   └── index.ts     # Store configuration
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript types
│   └── public/          # Static assets
└── README.md
```

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity
   - For MongoDB Atlas: Check IP whitelist and connection string

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on the port
   - Use `lsof -i :5000` (Linux/Mac) or `netstat -ano | findstr :5000` (Windows)

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration settings
   - Verify JWT_EXPIRE format (e.g., "7d", "24h")

4. **Frontend API Errors**
   - Verify NEXT_PUBLIC_API_URL in .env.local
   - Check CORS settings in backend
   - Ensure backend is running on the correct port

5. **AI Features Not Working**
   - Verify OPENAI_API_KEY is set correctly
   - Check AI rate limiting settings
   - Ensure sufficient OpenAI API credits

6. **Image Upload Issues**
   - Verify Cloudinary credentials in .env
   - Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   - Ensure Cloudinary account is active

7. **Socket.IO Connection Issues**
   - Verify NEXT_PUBLIC_SOCKET_URL in .env.local
   - Check CORS settings in backend socket configuration
   - Ensure JWT token is valid for socket authentication

8. **Windows-specific Issues**
   - Use PowerShell or Git Bash for commands
   - If `cp` fails, use `copy` (Windows) or manually create .env files
   - Ensure Node.js is properly installed and in PATH

9. **npm install errors**
   - Delete node_modules and package-lock.json, then retry
   - Ensure Node.js version is >= 18
   - Clear npm cache: `npm cache clean --force`
   - Try using yarn instead: `yarn install`

10. **Build Errors**
    - Check TypeScript compilation errors
    - Verify all required environment variables are set
    - Ensure all dependencies are properly installed

11. **Performance Issues**
    - Check MongoDB indexes are properly set
    - Monitor API response times
    - Verify rate limiting is not too restrictive
    - Check for memory leaks in long-running processes

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## License

This project is licensed under the MIT License. 