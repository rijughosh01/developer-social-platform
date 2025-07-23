# DevLink Setup Guide

> For an overview and features, see [README.md](./README.md)

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
   - [Clone the Repository](#1-clone-the-repository)
   - [Backend Setup](#2-backend-setup)
   - [Frontend Setup](#3-frontend-setup)
   - [Access the Application](#4-access-the-application)
3. [Environment Variables](#environment-variables)
4. [Features Available](#features-available)
5. [API Endpoints](#api-endpoints)
6. [Development Scripts](#development)
7. [Project Structure](#project-structure)
8. [Troubleshooting](#troubleshooting)
9. [Contributing](#contributing)
10. [License](#license)

---

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

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
- **Collaboration Analytics Dashboard** (track reviews, forks, badges, and more)
- **Trending Feed** (discover trending posts, projects, and developers)
- **Advanced Notifications** (mentions, invites, review requests, forks, etc.)
- **Saved Items** (save posts and projects for later)
- **Real-time chat and notifications (Socket.IO)**
- **Badge & Achievement System** (earn badges for key actions, see your progress in the Badge Gallery, and get real-time notifications when you earn a badge)
- **Responsive UI with Tailwind CSS**

> For a full and up-to-date list of features and all available badges, see [README.md](./README.md#badges--achievements)

---

## API Endpoints

See [README.md](./README.md#api-endpoints) for a summary. Main endpoints include:

### Analytics
- `GET /api/analytics/collaboration` - Get collaboration analytics (requires authentication)

### Trending
- `GET /api/trending` - Get trending posts, projects, and developers

### Collaboration & Review
- `POST /api/projects/:id/collaborators` - Add collaborator to a project
- `POST /api/posts/:id/review-request` - Request a review on a post

### (Other endpoints unchanged...)

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

---

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

5. **Windows-specific Issues**
   - Use PowerShell or Git Bash for commands
   - If `cp` fails, use `copy` (Windows) or manually create .env files

6. **npm install errors**
   - Delete node_modules and package-lock.json, then retry
   - Ensure Node.js version is >= 18

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