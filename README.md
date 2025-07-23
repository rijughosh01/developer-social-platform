# DevLink (Developer Social Platform)

A modern social platform for developers to connect, collaborate, and showcase their work. DevLink enables developers to create rich profiles, share projects, write posts, follow others, and communicate in real-time.

---

## 🆕 What's New / Advanced Features

- **Collaboration Analytics Dashboard**: Track reviews, forks, collaboration score, badges, and more.
- **Trending Feed**: Discover trending posts, projects, and developers based on recent activity.
- **Project Collaboration**: Add collaborators with roles, fork projects, and manage collaboration history.
- **Review Requests**: Request and provide code reviews with ratings and threaded responses.
- **Advanced Notifications**: Get notified for mentions, invites, review requests, forks, and more.
- **Saved Items**: Save posts and projects for later.
- **Professional Networking**: Earn badges, discover developers, and grow your network.

---

## 🏗️ Project Architecture

```mermaid
graph TD
  A[Frontend (Next.js 14)] -->|API| B[Backend (Node.js/Express)]
  B -->|DB| C[(MongoDB)]
  B -->|Sockets| D[Socket.IO]
  B -->|Analytics| F[Analytics/Trending]
  A -->|WebSockets| D
  A -->|Static Assets| E[Public/Uploads]
  A -->|Analytics UI| F
```

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
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 🔗 API Endpoints

See [setup.md](./setup.md#api-endpoints) for a full list of backend API endpoints.

---

## 🧑‍💻 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🛟 Troubleshooting

For common issues and solutions, see [setup.md](./setup.md#troubleshooting).

---

## 📄 License

This project is licensed under the MIT License. 