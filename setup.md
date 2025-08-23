# DevLink Setup Guide

> For an overview and features, see [README.md](./README.md)

A comprehensive setup guide for DevLink - the AI-powered developer social platform. This guide covers everything from initial setup to advanced configuration and troubleshooting.

![DevLink Setup](https://img.shields.io/badge/DevLink-Setup-blue?style=for-the-badge&logo=github)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cache-red?style=for-the-badge&logo=redis)

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [AI Configuration](#ai-configuration)
- [File Storage Setup](#file-storage-setup)
- [Email Configuration](#email-configuration)
- [Development Workflow](#development-workflow)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🔧 Prerequisites

### Required Software
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community) or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Redis** (v6.0 or higher) - [Download](https://redis.io/download) or [Upstash](https://upstash.com/)
- **Git** - [Download](https://git-scm.com/)

### Required Accounts & API Keys
- **OpenAI API Key** - [Get API Key](https://platform.openai.com/api-keys)
- **OpenRouter API Key** - [Get API Key](https://openrouter.ai/keys)
- **Cloudinary Account** - [Sign Up](https://cloudinary.com/users/register/free)
- **Email Service** (Gmail, SendGrid, etc.) for transactional emails

### System Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 2GB free space
- **Network**: Stable internet connection for API calls
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/rijughosh01/developer-social-platform
cd developer-social-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env-template.txt .env
# Edit .env with your configuration (see Environment Variables section)
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your configuration
npm run dev
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

---

## 📝 Detailed Setup

### Backend Configuration

#### 1. Install Dependencies
```bash
cd backend
npm install
```

#### 2. Environment Configuration
```bash
cp env-template.txt .env
```

Edit the `.env` file with your configuration (see Environment Variables section below).

#### 3. Database Setup
```bash
# For local MongoDB
mongod --dbpath /path/to/your/data/directory

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

#### 4. Redis Setup
```bash
# For local Redis
redis-server

# Or use Upstash Redis (cloud)
# Update UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
```

#### 5. Start Development Server
```bash
npm run dev
```

### Frontend Configuration

#### 1. Install Dependencies
```bash
cd frontend
npm install
```

#### 2. Environment Configuration
```bash
cp .env.example .env.local
```

Edit the `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

#### 3. Start Development Server
```bash
npm run dev
```

---

## 🔐 Environment Variables

### Backend (.env)

#### Server Configuration
```env
# Server Settings
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# CORS Settings
CORS_ORIGIN=http://localhost:3000
```

#### Database Configuration
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/devlink
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/devlink

# Redis Configuration
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

#### Authentication & Security
```env
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRE=30d

# Password Reset
PASSWORD_RESET_EXPIRE=3600000
```

#### AI Configuration
```env
# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here

# OpenRouter API (for additional AI models)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# AI Settings
DEFAULT_AI_MODEL=gpt-4o-mini
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=60000
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
```

#### File Storage (Cloudinary)
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=devlink_uploads
```

#### Email Configuration
```env
# Email Service (Gmail Example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM=DevLink <noreply@devlink.com>

# For SendGrid
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASS=your_sendgrid_api_key
```

#### Advanced Settings
```env
# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Cache Settings
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600
```

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Feature Flags
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_CHAT=true
NEXT_PUBLIC_ENABLE_DISCUSSIONS=true

# Analytics (Optional)
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

---

## 🗄️ Database Setup

### MongoDB Setup

#### Local MongoDB Installation

**Windows:**
```bash
# Download and install MongoDB Community Server
# Start MongoDB service
net start MongoDB
```

**macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux (Ubuntu):**
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Set up database access (username/password)
4. Set up network access (IP whitelist)
5. Get connection string and update `MONGODB_URI` in `.env`

### Redis Setup

#### Local Redis Installation

**Windows:**
```bash
# Download Redis for Windows
# Start Redis server
redis-server
```

**macOS:**
```bash
# Using Homebrew
brew install redis
brew services start redis
```

**Linux (Ubuntu):**
```bash
# Install Redis
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Upstash Redis (Cloud)
1. Create account at [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Get REST URL and token
4. Update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in `.env`

---

## 🤖 AI Configuration

### OpenAI Setup
1. Create account at [OpenAI](https://platform.openai.com/)
2. Generate API key in API Keys section
3. Add API key to `OPENAI_API_KEY` in `.env`
4. Ensure you have sufficient credits for API usage

### OpenRouter Setup
1. Create account at [OpenRouter](https://openrouter.ai/)
2. Generate API key
3. Add API key to `OPENROUTER_API_KEY` in `.env`

### AI Model Configuration
The platform supports multiple AI models with different capabilities:

| Model | Provider | Use Case | Daily Limits |
|-------|----------|----------|--------------|
| GPT-4o Mini | OpenAI | General coding assistance | Free: 10K, Premium: 50K, Pro: 200K |
| GPT-4o | OpenAI | Advanced reasoning | Premium: 50K, Pro: 200K |
| GPT-3.5 Turbo | OpenAI | Balanced performance | Free: 15K, Premium: 100K, Pro: 500K |
| DeepSeek R1 | OpenRouter | Specialized coding | Free: 20K, Premium: 100K, Pro: 500K |
| Qwen3 Coder | OpenRouter | Complex programming | Free: 25K, Premium: 150K, Pro: 750K |

### AI Contexts
The AI assistant supports 5 specialized contexts:
- **General**: General coding assistance and questions
- **Code Review**: Code analysis, improvements, and best practices
- **Debugging**: Bug fixing, troubleshooting, and error resolution
- **Learning**: Educational content, tutorials, and explanations
- **Project Help**: Project planning, architecture, and guidance

---

## 📁 File Storage Setup

### Cloudinary Configuration
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get your cloud name, API key, and API secret
3. Update the following in `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Upload Preset Setup
1. Go to Cloudinary Dashboard
2. Navigate to Settings > Upload
3. Create a new upload preset named `devlink_uploads`
4. Set it to "Unsigned" for client-side uploads
5. Add the preset name to your `.env`:
   ```env
   CLOUDINARY_UPLOAD_PRESET=devlink_uploads
   ```

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Maximum Size**: 5MB per file
- **Transformations**: Automatic optimization and resizing

---

## 📧 Email Configuration

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
3. Update `.env`:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_specific_password
   ```

### SendGrid Setup
1. Create account at [SendGrid](https://sendgrid.com/)
2. Generate API key
3. Update `.env`:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your_sendgrid_api_key
   ```

### Email Templates
The platform sends various transactional emails:
- Welcome emails
- Password reset
- Email verification
- Notification digests
- Collaboration invites

---

## 🔧 Development Workflow

### Backend Development

#### Available Scripts
```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

#### Development Tools
- **Nodemon**: Automatic server restart on file changes
- **ESLint**: Code linting and formatting
- **Jest**: Unit and integration testing
- **Morgan**: HTTP request logging
- **Winston**: Structured logging

### Frontend Development

#### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript type checking
```

#### Development Tools
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type safety and better development experience
- **Tailwind CSS**: Utility-first CSS framework
- **ESLint**: Code linting and formatting
- **Framer Motion**: Animation library

### Code Quality
- **Prettier**: Code formatting
- **ESLint**: Code linting
- **TypeScript**: Type checking
- **Husky**: Git hooks for pre-commit checks

---

## 🔗 API Endpoints

### Authentication Endpoints
```http
POST   /api/auth/register          # Register new user
POST   /api/auth/login             # User login
POST   /api/auth/logout            # User logout
GET    /api/auth/profile           # Get current user profile
PUT    /api/auth/profile           # Update user profile
PUT    /api/auth/password          # Change password
POST   /api/auth/forgot-password   # Request password reset
PUT    /api/auth/reset-password    # Reset password with token
POST   /api/auth/verify-email      # Verify email address
POST   /api/auth/resend-verification # Resend verification email
```

### User Management Endpoints
```http
GET    /api/users                  # Get all users (with pagination and search)
GET    /api/users/:id              # Get user by ID
PUT    /api/users/:id              # Update user profile
POST   /api/users/:id/follow       # Follow a user
DELETE /api/users/:id/follow       # Unfollow a user
GET    /api/users/:id/followers    # Get user's followers
GET    /api/users/:id/following    # Get users that this user follows
GET    /api/users/:id/badges       # Get user's badges
GET    /api/users/:id/activity     # Get user's activity
PUT    /api/users/:id/settings     # Update user settings
DELETE /api/users/:id              # Delete user account
```

### Posts Endpoints
```http
GET    /api/posts                  # Get all posts (with pagination and filters)
GET    /api/posts/:id              # Get specific post
POST   /api/posts                  # Create a new post
PUT    /api/posts/:id              # Update a post
DELETE /api/posts/:id              # Delete a post
POST   /api/posts/:id/like         # Like a post
DELETE /api/posts/:id/like         # Unlike a post
POST   /api/posts/:id/fork         # Fork a post
GET    /api/posts/:id/forks        # Get post forks
POST   /api/posts/:id/review-request # Request review for a post
GET    /api/posts/:id/reviews      # Get post reviews
```

### Projects Endpoints
```http
GET    /api/projects               # Get all projects (with pagination and filters)
GET    /api/projects/:id           # Get specific project
POST   /api/projects               # Create a new project
PUT    /api/projects/:id           # Update a project
DELETE /api/projects/:id           # Delete a project
POST   /api/projects/:id/collaborators # Add collaborator to project
DELETE /api/projects/:id/collaborators/:collaboratorId # Remove collaborator
GET    /api/projects/:id/collaborators # Get project collaborators
POST   /api/projects/:id/fork      # Fork a project
GET    /api/projects/:id/forks     # Get project forks
```

### AI Assistant Endpoints
```http
GET    /api/ai/models              # Get available AI models
GET    /api/ai/token-limits        # Get token limits and usage
POST   /api/ai/chat                # Send message to AI
GET    /api/ai/conversations       # Get AI conversations
POST   /api/ai/conversations       # Create new conversation
PUT    /api/ai/conversations/:id   # Update conversation
DELETE /api/ai/conversations/:id   # Delete conversation
POST   /api/ai/messages/:id/pin    # Pin AI message
DELETE /api/ai/messages/:id/pin    # Unpin AI message
GET    /api/ai/stats               # Get AI usage statistics
GET    /api/ai/contexts            # Get available AI contexts
```

### Discussion Forums Endpoints
```http
GET    /api/discussions            # Get all discussions (with filters and pagination)
GET    /api/discussions/categories # Get available discussion categories
GET    /api/discussions/tags       # Get popular discussion tags
POST   /api/discussions            # Create a new discussion
GET    /api/discussions/:id        # Get specific discussion with comments
PUT    /api/discussions/:id        # Update a discussion
DELETE /api/discussions/:id        # Delete a discussion
POST   /api/discussions/:id/vote   # Vote on a discussion
POST   /api/discussions/:id/comments # Add comment to discussion
PUT    /api/discussions/:id/comments/:commentId # Update a comment
DELETE /api/discussions/:id/comments/:commentId # Delete a comment
POST   /api/discussions/:id/polls  # Create poll in discussion
```

### Chat & Messaging Endpoints
```http
GET    /api/chat/conversations     # Get user's conversations
GET    /api/chat/conversations/:id # Get specific conversation
POST   /api/chat/conversations     # Create new conversation
POST   /api/chat/conversations/:id/messages # Send message
GET    /api/chat/conversations/:id/messages # Get conversation messages
PUT    /api/chat/conversations/:id/read # Mark conversation as read
POST   /api/chat/conversations/:id/typing # Send typing indicator
```

### Analytics & Trending Endpoints
```http
GET    /api/analytics/collaboration # Get collaboration analytics
GET    /api/analytics/ai-usage     # Get AI usage analytics
GET    /api/trending/posts         # Get trending posts
GET    /api/trending/projects      # Get trending projects
GET    /api/trending/developers    # Get trending developers
```

### File Upload Endpoints
```http
POST   /api/upload                 # Upload an image file
POST   /api/upload/avatar          # Upload user avatar
POST   /api/upload/project         # Upload project screenshot
```

### Health & Status Endpoints
```http
GET    /api/health                 # API health check
GET    /api/status                 # System status
GET    /api/version                # API version information
```

---

## 📁 Project Structure

```
developer-social-platform/
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
│   │   ├── DailyTokenUsage.js        # Daily token usage tracking
│   │   └── OTP.js                    # One-time password model
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
│   │   ├── search.js                 # Search functionality routes
│   │   └── upload.js                 # File upload routes
│   ├── middleware/                   # Custom middleware
│   │   ├── auth.js                   # Authentication middleware
│   │   ├── aiRateLimit.js            # AI usage rate limiting
│   │   ├── aiValidation.js           # AI request validation
│   │   ├── cache.js                  # Caching middleware
│   │   ├── errorHandler.js           # Error handling middleware
│   │   ├── otpRateLimit.js           # OTP rate limiting
│   │   └── validate.js               # Input validation
│   ├── utils/                        # Utility functions and services
│   │   ├── aiService.js              # AI service integration
│   │   ├── notificationService.js    # Notification service
│   │   ├── emailService.js           # Email service
│   │   ├── redisService.js           # Redis caching service
│   │   ├── cloudinary.js             # File upload service
│   │   ├── logger.js                 # Logging service
│   │   ├── asyncHandler.js           # Async error handler
│   │   └── generateToken.js          # JWT token generation
│   ├── socket/                       # Socket.IO configuration
│   ├── config/                       # Configuration files
│   ├── scripts/                      # Utility scripts
│   ├── logs/                         # Application logs
│   ├── uploads/                      # Local file uploads
│   ├── package.json                  # Backend dependencies
│   ├── server.js                     # Express server setup
│   └── env-template.txt              # Environment template
├── frontend/                         # Next.js frontend application
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
│   │   ├── saved/                    # Saved items management
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home page
│   ├── components/                   # Reusable React components
│   │   ├── ai/                       # AI assistant components
│   │   ├── dashboard/                # Dashboard and analytics components
│   │   ├── discussions/              # Discussion forum components
│   │   ├── notifications/            # Notification components
│   │   ├── posts/                    # Post and content components
│   │   ├── projects/                 # Project management components
│   │   ├── search/                   # Search and filter components
│   │   ├── ui/                       # Base UI components
│   │   ├── community/                # Community components
│   │   ├── features.tsx              # Features showcase
│   │   ├── footer.tsx                # Footer component
│   │   ├── hero.tsx                  # Hero section
│   │   ├── providers.tsx             # Context providers
│   │   └── testimonials.tsx          # Testimonials section
│   ├── store/                        # Redux store and slices
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # Utility libraries and helpers
│   ├── types/                        # TypeScript type definitions
│   ├── public/                       # Static assets
│   ├── package.json                  # Frontend dependencies
│   ├── next.config.js                # Next.js configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   └── postcss.config.js             # PostCSS configuration
├── docs/                             # Documentation
│   ├── SYSTEM_DESIGN.md              # System architecture documentation
│   ├── API_DOCUMENTATION.md          # Complete API reference
│   └── DEPLOYMENT.md                 # Deployment guide
├── .gitignore                        # Git ignore rules
├── README.md                         # Project overview and features
├── setup.md                          # This setup guide
└── SYSTEM_DESIGN.md                  # System design documentation
```

---

## 🛟 Troubleshooting

### Common Issues & Solutions

#### 1. MongoDB Connection Issues
**Problem**: Cannot connect to MongoDB
```bash
# Error: MongoNetworkError: connect ECONNREFUSED
```

**Solutions**:
- Ensure MongoDB is running: `sudo systemctl status mongod`
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)
- For MongoDB Atlas: Check IP whitelist and credentials

**Debug Steps**:
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/devlink"

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

#### 2. Redis Connection Issues
**Problem**: Cannot connect to Redis
```bash
# Error: Redis connection failed
```

**Solutions**:
- Ensure Redis is running: `redis-cli ping`
- Check Redis URL in `.env`
- Verify Redis port (default: 6379)
- For Upstash: Verify REST URL and token

**Debug Steps**:
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

#### 3. Port Already in Use
**Problem**: Port 5000 or 3000 is already occupied
```bash
# Error: EADDRINUSE: address already in use
```

**Solutions**:
```bash
# Find process using port
lsof -i :5000  # Linux/macOS
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5001
```

#### 4. JWT Token Issues
**Problem**: Authentication failures
```bash
# Error: JsonWebTokenError: invalid token
```

**Solutions**:
- Ensure `JWT_SECRET` is set and secure
- Check token expiration settings
- Verify JWT_EXPIRE format (e.g., "7d", "24h")
- Clear browser cookies/localStorage

#### 5. AI Features Not Working
**Problem**: AI chatbot not responding
```bash
# Error: OpenAI API error
```

**Solutions**:
- Verify `OPENAI_API_KEY` is correct
- Check OpenAI account credits
- Verify `OPENROUTER_API_KEY` for additional models
- Check AI rate limiting settings

**Debug Steps**:
```bash
# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models
```

#### 6. File Upload Issues
**Problem**: Images not uploading
```bash
# Error: Cloudinary upload failed
```

**Solutions**:
- Verify Cloudinary credentials in `.env`
- Check `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Ensure Cloudinary account is active
- Check file size limits (5MB max)

#### 7. Email Not Sending
**Problem**: Transactional emails not delivered
```bash
# Error: SMTP connection failed
```

**Solutions**:
- Verify email credentials in `.env`
- For Gmail: Use App Password, not regular password
- Check email service status
- Verify `EMAIL_FROM` address

#### 8. Frontend Build Issues
**Problem**: Next.js build fails
```bash
# Error: TypeScript compilation failed
```

**Solutions**:
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### 9. Socket.IO Connection Issues
**Problem**: Real-time features not working
```bash
# Error: Socket connection failed
```

**Solutions**:
- Verify `NEXT_PUBLIC_SOCKET_URL` in frontend `.env.local`
- Check CORS settings in backend socket configuration
- Ensure JWT token is valid for socket authentication
- Check browser console for connection errors

#### 10. Performance Issues
**Problem**: Slow response times
```bash
# High API response times
```

**Solutions**:
- Check MongoDB indexes: `db.collection.getIndexes()`
- Monitor Redis cache hit rates
- Verify rate limiting is not too restrictive
- Check for memory leaks in long-running processes
- Enable database query logging

### Windows-Specific Issues

#### 1. Command Line Issues
**Problem**: `cp` command not found
```bash
# Use Windows copy command
copy env-template.txt .env

# Or use PowerShell
Copy-Item env-template.txt .env
```

#### 2. Path Issues
**Problem**: Node.js not found
```bash
# Add Node.js to PATH
# Restart terminal after installation
```

#### 3. Permission Issues
**Problem**: Cannot create files/folders
```bash
# Run as Administrator
# Or change project location to user directory
```

### Performance Optimization

#### 1. Database Optimization
```javascript
// Add indexes for frequently queried fields
db.users.createIndex({ "email": 1 })
db.posts.createIndex({ "author": 1, "createdAt": -1 })
db.projects.createIndex({ "owner": 1, "status": 1 })
```

#### 2. Caching Strategy
```javascript
// Redis caching for frequently accessed data
// Cache user profiles, trending content, AI responses
```

#### 3. API Optimization
```javascript
// Implement pagination for large datasets
// Use aggregation pipelines for complex queries
// Enable compression middleware
```

---

## 🚀 Deployment

### Production Environment Setup

#### 1. Environment Configuration
```bash
# Set NODE_ENV to production
NODE_ENV=production

# Use production database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/devlink

# Use production Redis
REDIS_URL=redis://your-production-redis-url

# Set secure JWT secrets
JWT_SECRET=your_very_secure_production_secret
```

#### 2. Frontend Build
```bash
cd frontend
npm run build
npm start
```

#### 3. Backend Deployment
```bash
cd backend
npm start
```

#### 4. Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name devlink-backend
pm2 start npm --name devlink-frontend -- start

# Using Docker
docker-compose up -d
```

### Deployment Platforms

#### Vercel (Frontend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Railway (Backend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build commands
3. Set environment variables
4. Deploy with load balancing

### SSL/HTTPS Setup
```bash
# Using Let's Encrypt
sudo certbot --nginx -d yourdomain.com

# Using Cloudflare
# Enable SSL/TLS encryption mode
```

### Monitoring & Logging
```bash
# Application monitoring
npm install -g pm2
pm2 monit

# Log management
pm2 logs devlink-backend
pm2 logs devlink-frontend
```

---

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Standards
- Follow ESLint configuration
- Use TypeScript for frontend
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Testing
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Pull Request Guidelines
- Provide clear description of changes
- Include screenshots for UI changes
- Update documentation if needed
- Ensure all tests pass
- Follow the existing code style

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Support

If you encounter any issues or have questions:

1. **Check this setup guide** for common solutions
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our community** for discussions

### Useful Links
- [README.md](./README.md) - Project overview and features
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) - System architecture
- [API Documentation](./docs/API_DOCUMENTATION.md) - Complete API reference

---

**Happy coding with DevLink! 🚀** 