import axios from 'axios'
import { ApiResponse } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// API functions
export const authAPI = {
  register: (data: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => api.post<ApiResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse>('/auth/login', data),

  getProfile: () => api.get<ApiResponse>('/auth/profile'),

  updateProfile: (data: any) => api.put<ApiResponse>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse>('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (resetToken: string, password: string) =>
    api.put<ApiResponse>(`/auth/reset-password/${resetToken}`, { password }),
}

export const usersAPI = {
  getUsers: (params?: any) => api.get<ApiResponse>('/users', { params }),

  getUser: (id: string) => api.get<ApiResponse>(`/users/${id}`),

  getUserByUsername: (username: string) => api.get<ApiResponse>(`/users/username/${username}`),

  updateUser: (id: string, data: any) => api.put<ApiResponse>(`/users/${id}`, data),

  followUser: (id: string) => api.post<ApiResponse>(`/users/${id}/follow`),

  unfollowUser: (id: string) => api.delete<ApiResponse>(`/users/${id}/follow`),

  getFollowers: (id: string, params?: any) =>
    api.get<ApiResponse>(`/users/${id}/followers`, { params }),

  getFollowing: (id: string, params?: any) =>
    api.get<ApiResponse>(`/users/${id}/following`, { params }),

  getSuggestions: (params?: any) =>
    api.get<ApiResponse>('/users/suggestions', { params }),
}

export const postsAPI = {
  getPosts: (params?: any) => api.get<ApiResponse>('/posts', { params }),

  getPost: (id: string) => api.get<ApiResponse>(`/posts/${id}`),

  createPost: (data: any) => api.post<ApiResponse>('/posts', data),

  updatePost: (id: string, data: any) => api.put<ApiResponse>(`/posts/${id}`, data),

  deletePost: (id: string) => api.delete<ApiResponse>(`/posts/${id}`),

  likePost: (id: string) => api.post<ApiResponse>(`/posts/${id}/like`),

  addComment: (id: string, data: { content: string }) =>
    api.post<ApiResponse>(`/posts/${id}/comment`, data),

  removeComment: (id: string, commentId: string) =>
    api.delete<ApiResponse>(`/posts/${id}/comment/${commentId}`),

  getUserPosts: (userId: string, params?: any) =>
    api.get<ApiResponse>(`/posts/user/${userId}`, { params }),

  incrementView: (id: string) => api.post<ApiResponse>(`/posts/${id}/view`),
}

export const projectsAPI = {
  getProjects: (params?: any) => api.get<ApiResponse>('/projects', { params }),

  getProject: (id: string) => api.get<ApiResponse>(`/projects/${id}`),

  createProject: (data: any) => api.post<ApiResponse>('/projects', data),

  updateProject: (id: string, data: any) => api.put<ApiResponse>(`/projects/${id}`, data),

  deleteProject: (id: string) => api.delete<ApiResponse>(`/projects/${id}`),

  likeProject: (id: string) => api.post<ApiResponse>(`/projects/${id}/like`),

  addCollaborator: (id: string, data: { userId: string; role?: string }) =>
    api.post<ApiResponse>(`/projects/${id}/collaborators`, data),

  removeCollaborator: (id: string, userId: string) =>
    api.delete<ApiResponse>(`/projects/${id}/collaborators/${userId}`),

  getUserProjects: (userId: string, params?: any) =>
    api.get<ApiResponse>(`/projects/user/${userId}`, { params }),
}

export const chatAPI = {
  getChats: () => api.get<ApiResponse>('/chat'),

  getChat: (id: string) => api.get<ApiResponse>(`/chat/${id}`),

  startChat: (data: { userId: string }) => api.post<ApiResponse>('/chat/start', data),

  sendMessage: (id: string, data: any) =>
    api.post<ApiResponse>(`/chat/${id}/messages`, data),

  markAsRead: (id: string) => api.put<ApiResponse>(`/chat/${id}/read`),

  getUnreadCount: () => api.get<ApiResponse>('/chat/unread/count'),

  createGroupChat: (data: { name: string; participants: string[] }) =>
    api.post<ApiResponse>('/chat/group', data),

  addParticipant: (id: string, data: { userId: string }) =>
    api.post<ApiResponse>(`/chat/${id}/participants`, data),

  removeParticipant: (id: string, userId: string) =>
    api.delete<ApiResponse>(`/chat/${id}/participants/${userId}`),

  leaveGroup: (id: string) => api.delete<ApiResponse>(`/chat/${id}/leave`),

  deleteMessage: (chatId: string, messageId: string) =>
    api.delete<ApiResponse>(`/chat/${chatId}/messages/${messageId}`),
}

export const commentsAPI = {
  getComments: (postId: string) => api.get<ApiResponse>(`/comments/${postId}`),
  addComment: (postId: string, data: { content: string }) => api.post<ApiResponse>(`/comments/${postId}`, data),
  deleteComment: (commentId: string) => api.delete<ApiResponse>(`/comments/${commentId}`),
}

export const savedAPI = {
  savePost: (userId: string, postId: string) => api.post<ApiResponse>(`/users/${userId}/save`, { postId }),
  unsavePost: (userId: string, postId: string) => api.delete<ApiResponse>(`/users/${userId}/save/${postId}`),
  getSavedPosts: (userId: string) => api.get<ApiResponse>(`/users/${userId}/saved`),
}

export const settingsAPI = {
  // Privacy
  getPrivacy: (userId: string) => api.get<ApiResponse>(`/users/${userId}/privacy`),
  updatePrivacy: (userId: string, data: any) => api.put<ApiResponse>(`/users/${userId}/privacy`, data),
  // Notifications
  getNotifications: (userId: string) => api.get<ApiResponse>(`/users/${userId}/notifications`),
  updateNotifications: (userId: string, data: any) => api.put<ApiResponse>(`/users/${userId}/notifications`, data),
  // Connected Accounts
  getConnectedAccounts: (userId: string) => api.get<ApiResponse>(`/users/${userId}/connected-accounts`),
  updateConnectedAccounts: (userId: string, data: any) => api.put<ApiResponse>(`/users/${userId}/connected-accounts`, data),
  // Theme
  getTheme: (userId: string) => api.get<ApiResponse>(`/users/${userId}/theme`),
  updateTheme: (userId: string, data: any) => api.put<ApiResponse>(`/users/${userId}/theme`, data),
  // Account Deletion
  deleteAccount: (userId: string) => api.delete<ApiResponse>(`/users/${userId}`),
}