# DevLink (Developer Social Platform)

A modern social platform for developers to connect, collaborate, and showcase their work. DevLink enables developers to create rich profiles, share projects, write posts, follow others, and communicate in real-time.

---

## 🆕 What's New / Advanced Features

- **🤖 AI-Powered Chatbot**: Intelligent coding assistant with multiple contexts (General, Code Review, Debugging, Learning, Project Help)
- **🧠 AI Conversation Management**: Pin important messages, delete conversations, and track AI usage analytics
- **🎯 Context-Aware AI**: Specialized AI assistance for different coding scenarios and learning needs
- **📊 AI Analytics Dashboard**: Track AI usage, response times, and conversation history
- **🔗 Draggable AI Interface**: Floating AI button that can be moved anywhere on the page
- **💬 Real-time AI Chat**: Instant responses with modern UI/UX and code syntax highlighting
- **📌 Message Pinning System**: Pin and organize important AI responses for future reference
- **🗑️ Conversation Management**: Delete entire AI conversations with confirmation dialogs
- **🔔 AI Notifications**: Toast notifications for all AI interactions and actions
- **Collaboration Analytics Dashboard**: Track reviews, forks, collaboration score, badges, and more.
- **Trending Feed**: Discover trending posts, projects, and developers based on recent activity.
- **Project Collaboration**: Add collaborators with roles, fork projects, and manage collaboration history.
- **Review Requests**: Request and provide code reviews with ratings and threaded responses.
- **Advanced Notifications**: Get notified for mentions, invites, review requests, forks, and more.
- **Saved Items**: Save posts and projects for later.
- **Professional Networking**: Earn badges, discover developers, and grow your network.
- **💬 Discussion Forums**: Create and participate in threaded discussions with categories, tags, voting, and moderation.

---

## 🏗️ Project Architecture

DevLink uses a modern full-stack architecture:
- **Frontend:** Next.js 14 (React), connects to backend via REST API and WebSockets
- **Backend:** Node.js/Express, handles API requests, authentication, analytics, and real-time events
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.IO for chat and notifications
- **AI Integration:** OpenAI API with LangChain for intelligent coding assistance
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
- **Intelligent Chatbot**: Context-aware AI assistant with 5 specialized modes
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
- **Modern AI Interface**:
  - Draggable floating AI button
  - Real-time chat with syntax highlighting
  - Toast notifications for all actions
  - Responsive design with glassmorphism effects
- **AI Analytics**: Usage tracking, response analytics, and performance metrics

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

### Discussion Forums
- **Threaded Discussions**: Create and participate in deep technical discussions
- **Categories & Tags**: Organize discussions by topics (General, Help, Showcase, Tutorial, etc.)
- **Voting System**: Upvote/downvote discussions and comments
- **Rich Text Editor**: Create formatted content with markdown support
- **Moderation Tools**: Flag inappropriate content, sticky discussions, and moderation features
- **Search & Filters**: Advanced search with category, tag, and status filters
- **Discussion Analytics**: Track views, replies, and engagement metrics
- **Mention System**: Tag users with @mentions for notifications
- **Saved Discussions**: Save important discussions for later reference

### Saved & Personalized Content
- **Saved Posts/Projects**: Save items for later
- **Personalized Feeds**: Code feed, trending, and more

---

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- Redux Toolkit
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Auth
- Socket.IO
- bcrypt
- OpenAI API
- LangChain
- Rate Limiting
- AI Middleware

---

## 📁 Project Structure

```text
developer-social-platform/
├── frontend/   # Next.js frontend
├── backend/    # Node.js/Express backend
└── README.md   # Project documentation
```

---

## 🏁 Getting Started

For detailed setup instructions, see [setup.md](./setup.md).

### Quick Start

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
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
OPENAI_API_KEY=your_openai_api_key_here
AI_RATE_LIMIT=10
AI_RATE_LIMIT_WINDOW=60000
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