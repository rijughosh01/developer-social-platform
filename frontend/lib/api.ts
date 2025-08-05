import axios from "axios";
import { ApiResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<ApiResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse>("/auth/login", data),

  getProfile: () => api.get<ApiResponse>("/auth/profile"),

  updateProfile: (data: any) => api.put<ApiResponse>("/auth/profile", data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put<ApiResponse>("/auth/change-password", data),

  forgotPassword: (email: string) =>
    api.post<ApiResponse>("/auth/forgot-password", { email }),

  resetPassword: (resetToken: string, password: string) =>
    api.put<ApiResponse>(`/auth/reset-password/${resetToken}`, { password }),
};

export const usersAPI = {
  getUsers: (params?: any) => api.get<ApiResponse>("/users", { params }),

  getUser: (id: string) => api.get<ApiResponse>(`/users/${id}`),

  getUserByUsername: (username: string) =>
    api.get<ApiResponse>(`/users/username/${username}`),

  updateUser: (id: string, data: any) =>
    api.put<ApiResponse>(`/users/${id}`, data),

  followUser: (id: string) => api.post<ApiResponse>(`/users/${id}/follow`),

  unfollowUser: (id: string) => api.delete<ApiResponse>(`/users/${id}/follow`),

  getFollowers: (id: string, params?: any) =>
    api.get<ApiResponse>(`/users/${id}/followers`, { params }),

  getFollowing: (id: string, params?: any) =>
    api.get<ApiResponse>(`/users/${id}/following`, { params }),

  getSuggestions: (params?: any) =>
    api.get<ApiResponse>("/users/suggestions", { params }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post<ApiResponse>("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const postsAPI = {
  getPosts: (params?: any) => api.get<ApiResponse>("/posts", { params }),

  getPost: (id: string) => api.get<ApiResponse>(`/posts/${id}`),

  createPost: (data: any) => api.post<ApiResponse>("/posts", data),

  updatePost: (id: string, data: any) =>
    api.put<ApiResponse>(`/posts/${id}`, data),

  deletePost: (id: string) => api.delete<ApiResponse>(`/posts/${id}`),

  likePost: (id: string) => api.post<ApiResponse>(`/posts/${id}/like`),

  addComment: (id: string, data: { content: string }) =>
    api.post<ApiResponse>(`/posts/${id}/comment`, data),

  removeComment: (id: string, commentId: string) =>
    api.delete<ApiResponse>(`/posts/${id}/comment/${commentId}`),

  getUserPosts: (userId: string, params?: any) =>
    api.get<ApiResponse>(`/posts/user/${userId}`, { params }),

  incrementView: (id: string) => api.post<ApiResponse>(`/posts/${id}/view`),
};

export const projectsAPI = {
  getProjects: (params?: any) => api.get<ApiResponse>("/projects", { params }),

  getProject: (id: string) => api.get<ApiResponse>(`/projects/${id}`),

  createProject: (data: any) => api.post<ApiResponse>("/projects", data),

  updateProject: (id: string, data: any) =>
    api.put<ApiResponse>(`/projects/${id}`, data),

  deleteProject: (id: string) => api.delete<ApiResponse>(`/projects/${id}`),

  likeProject: (id: string) => api.post<ApiResponse>(`/projects/${id}/like`),

  addCollaborator: (id: string, data: { userId: string; role?: string }) =>
    api.post<ApiResponse>(`/projects/${id}/collaborators`, data),

  removeCollaborator: (id: string, userId: string) =>
    api.delete<ApiResponse>(`/projects/${id}/collaborators/${userId}`),

  getUserProjects: (userId: string, params?: any) =>
    api.get<ApiResponse>(`/projects/user/${userId}`, { params }),
};

export const chatAPI = {
  getChats: () => api.get<ApiResponse>("/chat"),

  getChat: (id: string) => api.get<ApiResponse>(`/chat/${id}`),

  startChat: (data: { userId: string }) =>
    api.post<ApiResponse>("/chat/start", data),

  sendMessage: (id: string, data: any) =>
    api.post<ApiResponse>(`/chat/${id}/messages`, data),

  markAsRead: (id: string) => api.put<ApiResponse>(`/chat/${id}/read`),

  getUnreadCount: () => api.get<ApiResponse>("/chat/unread/count"),

  createGroupChat: (data: { name: string; participants: string[] }) =>
    api.post<ApiResponse>("/chat/group", data),

  addParticipant: (id: string, data: { userId: string }) =>
    api.post<ApiResponse>(`/chat/${id}/participants`, data),

  removeParticipant: (id: string, userId: string) =>
    api.delete<ApiResponse>(`/chat/${id}/participants/${userId}`),

  leaveGroup: (id: string) => api.delete<ApiResponse>(`/chat/${id}/leave`),

  deleteMessage: (chatId: string, messageId: string) =>
    api.delete<ApiResponse>(`/chat/${chatId}/messages/${messageId}`),
};

export const commentsAPI = {
  getComments: (postId: string) => api.get<ApiResponse>(`/comments/${postId}`),
  addComment: (postId: string, data: { content: string }) =>
    api.post<ApiResponse>(`/comments/${postId}`, data),
  deleteComment: (commentId: string) =>
    api.delete<ApiResponse>(`/comments/${commentId}`),
};

export const savedAPI = {
  savePost: (userId: string, postId: string) =>
    api.post<ApiResponse>(`/users/${userId}/save`, { postId }),
  unsavePost: (userId: string, postId: string) =>
    api.delete<ApiResponse>(`/users/${userId}/save/${postId}`),
  getSavedPosts: (userId: string) =>
    api.get<ApiResponse>(`/users/${userId}/saved`),
  saveDiscussion: (discussionId: string) =>
    api.post<ApiResponse>(`/discussions/${discussionId}/save`),
  unsaveDiscussion: (discussionId: string) =>
    api.delete<ApiResponse>(`/discussions/${discussionId}/save`),
};

export const settingsAPI = {
  // Privacy
  getPrivacy: (userId: string) =>
    api.get<ApiResponse>(`/users/${userId}/privacy`),
  updatePrivacy: (userId: string, data: any) =>
    api.put<ApiResponse>(`/users/${userId}/privacy`, data),
  // Notifications
  getNotifications: (userId: string) =>
    api.get<ApiResponse>(`/users/${userId}/notifications`),
  updateNotifications: (userId: string, data: any) =>
    api.put<ApiResponse>(`/users/${userId}/notifications`, data),
  // Connected Accounts
  getConnectedAccounts: (userId: string) =>
    api.get<ApiResponse>(`/users/${userId}/connected-accounts`),
  updateConnectedAccounts: (userId: string, data: any) =>
    api.put<ApiResponse>(`/users/${userId}/connected-accounts`, data),
  // Theme
  getTheme: (userId: string) => api.get<ApiResponse>(`/users/${userId}/theme`),
  updateTheme: (userId: string, data: any) =>
    api.put<ApiResponse>(`/users/${userId}/theme`, data),
  // Account Deletion
  deleteAccount: (userId: string) =>
    api.delete<ApiResponse>(`/users/${userId}`),
};

export const aiAPI = {
  // Get available AI contexts
  getContexts: () => api.get<ApiResponse>("/ai/contexts"),

  // Get user's AI usage statistics
  getStats: () => api.get<ApiResponse>("/ai/stats"),

  // General chat
  chat: (data: {
    message: string;
    context?: string;
    conversationId?: string;
  }) => api.post<ApiResponse>("/ai/chat", data),

  // Code review
  codeReview: (data: { code: string; language: string }) =>
    api.post<ApiResponse>("/ai/code-review", data),

  // Debugging
  debugCode: (data: { code: string; error: string; language: string }) =>
    api.post<ApiResponse>("/ai/debug", data),

  // Learning assistance
  learn: (data: { topic: string }) => api.post<ApiResponse>("/ai/learn", data),

  // Project advice
  projectAdvice: (data: { description: string }) =>
    api.post<ApiResponse>("/ai/project-advice", data),

  // Conversation History
  getConversations: (params?: {
    page?: number;
    limit?: number;
    context?: string;
    sort?: string;
    order?: string;
    search?: string;
    includeArchived?: boolean;
  }) => api.get<ApiResponse>("/ai/conversations", { params }),

  getConversation: (id: string) =>
    api.get<ApiResponse>(`/ai/conversations/${id}`),

  createConversation: (data: {
    title: string;
    context: string;
    projectId?: string;
    tags?: string[];
  }) => api.post<ApiResponse>("/ai/conversations", data),

  updateConversation: (
    id: string,
    data: {
      title?: string;
      tags?: string[];
    }
  ) => api.put<ApiResponse>(`/ai/conversations/${id}`, data),

  searchConversations: (params: {
    q: string;
    context?: string;
    limit?: number;
  }) => api.get<ApiResponse>("/ai/conversations/search", { params }),

  getConversationStats: () => api.get<ApiResponse>("/ai/conversations/stats"),

  // Pin/Unpin Messages
  pinMessage: (conversationId: string, messageIndex: number) =>
    api.post<ApiResponse>(`/ai/conversations/${conversationId}/pin/${messageIndex}`),

  unpinMessage: (conversationId: string, messageIndex: number) =>
    api.delete<ApiResponse>(`/ai/conversations/${conversationId}/pin/${messageIndex}`),

  getPinnedMessages: (conversationId: string) =>
    api.get<ApiResponse>(`/ai/conversations/${conversationId}/pinned`),

  // Delete conversation
  deleteConversation: (conversationId: string) =>
    api.delete<ApiResponse>(`/ai/conversations/${conversationId}`),
};

// Discussions API
export const discussionsAPI = {
  getDiscussions: (params?: any) => api.get<ApiResponse>("/discussions", { params }),
  getDiscussion: (id: string) => api.get<ApiResponse>(`/discussions/${id}`),
  createDiscussion: (data: { title: string; content: string; category?: string; tags?: string; templateId?: string; templateData?: any }) => api.post<ApiResponse>("/discussions", data),
  updateDiscussion: (id: string, data: { title?: string; content?: string; category?: string; tags?: string }) => api.put<ApiResponse>(`/discussions/${id}`, data),
  deleteDiscussion: (id: string) => api.delete<ApiResponse>(`/discussions/${id}`),
  voteDiscussion: (id: string, voteType: "upvote" | "downvote" | "remove") => api.post<ApiResponse>(`/discussions/${id}/vote`, { voteType }),

  flagDiscussion: (id: string, reason: string) => api.post<ApiResponse>(`/discussions/${id}/flag`, { reason }),
  moderateDiscussion: (id: string, data: { status?: string; isSticky?: boolean; isFeatured?: boolean }) => api.patch<ApiResponse>(`/discussions/${id}/moderate`, data),
  getCategories: () => api.get<ApiResponse>("/discussions/categories"),
  getTags: () => api.get<ApiResponse>("/discussions/tags"),
  addComment: (discussionId: string, data: { content: string; parentCommentId?: string; richContent?: string; contentType?: "plain" | "rich" }) => api.post<ApiResponse>(`/discussions/${discussionId}/comments`, data),
  voteComment: (discussionId: string, commentId: string, voteType: "upvote" | "downvote" | "remove") => api.post<ApiResponse>(`/discussions/${discussionId}/comments/${commentId}/vote`, { voteType }),
  editComment: (discussionId: string, commentId: string, data: { content: string; richContent?: string; contentType?: "plain" | "rich" }) => api.put<ApiResponse>(`/discussions/${discussionId}/comments/${commentId}`, data),
  acceptAnswer: (discussionId: string, commentId: string) => api.post<ApiResponse>(`/discussions/${discussionId}/accept-answer`, { commentId }),
};


