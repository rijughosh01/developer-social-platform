export interface User {
  _id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  bio: string
  avatar: string
  skills: string[]
  socialLinks: {
    github: string
    linkedin: string
    twitter: string
    website: string
  }
  location: string
  company: string
  role: 'user' | 'admin'
  isVerified: boolean
  followers: User[]
  following: User[]
  followersCount: number
  followingCount: number
  lastSeen: string
  createdAt: string
  updatedAt: string
}

export interface Post {
  _id: string
  author: User
  title: string
  content: string
  excerpt: string
  tags: string[]
  category: 'general' | 'tutorial' | 'project' | 'news' | 'opinion' | 'review'
  image: string
  likes: User[]
  comments: Comment[]
  isPublished: boolean
  readTime: number
  views: number
  likesCount: number
  commentsCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  user: User
  content: string
  likes: User[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  _id: string
  owner: User
  title: string
  description: string
  shortDescription: string
  image: string
  githubUrl: string
  liveUrl: string
  technologies: string[]
  category: 'web' | 'mobile' | 'desktop' | 'api' | 'library' | 'tool' | 'game' | 'other'
  status: 'in-progress' | 'completed' | 'archived' | 'planning'
  isPublic: boolean
  likes: User[]
  views: number
  featured: boolean
  collaborators: Collaborator[]
  screenshots: Screenshot[]
  tags: string[]
  likesCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
}

export interface Collaborator {
  user: User
  role: 'developer' | 'designer' | 'tester' | 'manager'
}

export interface Screenshot {
  url: string
  caption: string
}

export interface Chat {
  _id: string
  participants: User[]
  messages: Message[]
  lastMessage: Message
  isGroupChat: boolean
  groupName: string
  groupAdmin: User
  unreadCount: Map<string, number>
  lastMessageContent: string
  lastMessageTime: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  sender: User
  content: string
  messageType: 'text' | 'image' | 'file'
  fileUrl: string
  fileName: string
  isRead: boolean
  readAt: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: string
  author?: string
  owner?: string
  technologies?: string
  featured?: boolean
  skills?: string
  tags?: string
}

export interface SocketEvents {
  'join-chat': (chatId: string) => void
  'leave-chat': (chatId: string) => void
  'send-message': (data: {
    chatId: string
    content: string
    messageType?: string
    fileUrl?: string
    fileName?: string
  }) => void
  'typing-start': (chatId: string) => void
  'typing-stop': (chatId: string) => void
  'mark-read': (chatId: string) => void
  'set-online-status': (status: string) => void
}

export interface Notification {
  _id: string
  recipient: string
  sender: User
  type: 'message' | 'like_post' | 'like_project' | 'comment_post' | 'comment_project' | 'follow' | 'unfollow' | 'mention' | 'project_invite' | 'collaboration_request' | 'system'
  title: string
  message: string
  data: {
    postId?: string
    projectId?: string
    commentId?: string
    chatId?: string
    messageId?: string
    url?: string
    image?: string
  }
  isRead: boolean
  readAt: string | null
  timeAgo: string
  createdAt: string
  updatedAt: string
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  marketing: boolean
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface SocketListeners {
  'chat-joined': (data: { chatId: string }) => void
  'chat-left': (data: { chatId: string }) => void
  'new-message': (data: { chatId: string; message: Message; sender: User }) => void
  'message-sent': (data: { chatId: string; message: Message }) => void
  'user-typing': (data: { chatId: string; userId: string; username: string }) => void
  'user-stop-typing': (data: { chatId: string; userId: string }) => void
  'messages-read': (data: { chatId: string; userId: string }) => void
  'user-status-change': (data: { userId: string; status: string; lastSeen: string }) => void
  'new-notification': (data: { notification: Notification; unreadCount: number }) => void
  'unread-count-update': (data: { unreadCount: number }) => void
  'error': (data: { message: string }) => void
} 