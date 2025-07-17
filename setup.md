# DevLink Setup Guide

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

## Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd devlink
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
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

# Start the development server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env.local
# Edit .env.local with your configuration:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
# NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Start the development server
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/devlink
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## Features Available

### Authentication
- ✅ User registration with validation
- ✅ User login with JWT
- ✅ Password hashing with bcrypt
- ✅ Protected routes

### User Management
- ✅ User profiles with bio, skills, social links
- ✅ Follow/unfollow system
- ✅ User search and discovery

### Posts System
- ✅ Create, read, update, delete posts
- ✅ Like/unlike posts
- ✅ Image upload support
- ✅ Real-time updates

### Projects
- ✅ Project showcase
- ✅ Project collaboration
- ✅ Project likes and comments

### Real-time Chat
- ✅ Socket.IO integration
- ✅ Private messaging
- ✅ Online status indicators

### UI/UX
- ✅ Responsive design with Tailwind CSS
- ✅ Modern component library
- ✅ Loading states and error handling
- ✅ Toast notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post by ID
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Chat
- `GET /api/chat` - Get user chats
- `POST /api/chat` - Start new chat
- `GET /api/chat/:id` - Get chat messages
- `POST /api/chat/:id/messages` - Send message

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

## Project Structure

```
devlink/
├── backend/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── socket/          # Socket.IO setup
│   └── server.js        # Express server
├── frontend/
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   ├── store/           # Redux store
│   ├── hooks/           # Custom hooks
│   ├── types/           # TypeScript types
│   └── lib/             # Utility libraries
└── README.md
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in .env file
   - Verify network connectivity

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes on the port

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set
   - Check token expiration settings

4. **Frontend API Errors**
   - Verify NEXT_PUBLIC_API_URL in .env.local
   - Check CORS settings in backend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 