# DevLink - Developer Social Platform

A platform where developers can create profiles, showcase their projects, follow others, write posts, and collaborate via messaging.

## 🚀 Features

- **Authentication**: JWT + Role-based access (Sign up, login, forgot password)
- **Developer Profiles**: Bio, skills, social links, project showcase
- **Posts System**: CRUD operations with like and comment functionality
- **Follow System**: Follow/unfollow developers with followers/following lists
- **Real-time Chat**: Socket.IO powered messaging system

## 🛠️ Tech Stack

### Frontend
- Next.js 14
- Tailwind CSS
- Redux Toolkit
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO
- bcrypt for password hashing

## 📁 Project Structure

```
devlink/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js/Express backend API
└── README.md         # This file
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📝 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devlink
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Forgot password
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comment` - Comment on post

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings

## 🎨 Features Overview

1. **Authentication System**
   - JWT-based authentication
   - Password hashing with bcrypt
   - Role-based access control

2. **Developer Profiles**
   - Customizable profiles with bio, skills, social links
   - Project showcase with GitHub integration
   - Profile image upload

3. **Posts System**
   - Create, read, update, delete posts
   - Like and comment functionality
   - Rich text support

4. **Follow System**
   - Follow/unfollow other developers
   - View followers and following lists
   - Activity feed

5. **Real-time Chat**
   - Socket.IO powered messaging
   - Private conversations
   - Online status indicators

6. **Real-time Notifications**
   - Socket.IO real-time notifications
   - Message, like, comment, and follow notifications
   - Notification preferences and settings
   - Mark as read/unread functionality
   - Notification dropdown in header
   - Dedicated notifications page

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. 