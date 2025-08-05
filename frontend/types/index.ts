export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  bio: string;
  avatar: string;
  skills: string[];
  socialLinks: {
    github: string;
    linkedin: string;
    twitter: string;
    website: string;
  };
  location: string;
  company: string;
  role: "user" | "admin";
  isVerified: boolean;
  followers: User[];
  following: User[];
  followersCount: number;
  followingCount: number;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  author: User;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: "general" | "tutorial" | "project" | "news" | "opinion" | "review";
  image: string;
  likes: User[];
  comments: Comment[];
  isPublished: boolean;
  readTime: number;
  views: number;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  user: User;
  content: string;
  likes: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  owner: User;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  githubUrl: string;
  liveUrl: string;
  technologies: string[];
  category:
    | "web"
    | "mobile"
    | "desktop"
    | "api"
    | "library"
    | "tool"
    | "game"
    | "other";
  status: "in-progress" | "completed" | "archived" | "planning";
  isPublic: boolean;
  likes: User[];
  views: number;
  featured: boolean;
  collaborators: Collaborator[];
  screenshots: Screenshot[];
  tags: string[];
  likesCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  type?: "post";
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  user: User;
  role: "developer" | "designer" | "tester" | "manager";
}

export interface Screenshot {
  url: string;
  caption: string;
}

export interface Chat {
  _id: string;
  participants: User[];
  messages: Message[];
  lastMessage: Message;
  isGroupChat: boolean;
  groupName: string;
  groupAdmin: User;
  unreadCount: Map<string, number>;
  lastMessageContent: string;
  lastMessageTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  sender: User;
  content: string;
  messageType: "text" | "image" | "file";
  fileUrl: string;
  fileName: string;
  isRead: boolean;
  readAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  author?: string;
  owner?: string;
  technologies?: string;
  featured?: boolean;
  skills?: string;
  tags?: string;
}

export interface SocketEvents {
  "join-chat": (chatId: string) => void;
  "leave-chat": (chatId: string) => void;
  "send-message": (data: {
    chatId: string;
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => void;
  "typing-start": (chatId: string) => void;
  "typing-stop": (chatId: string) => void;
  "mark-read": (chatId: string) => void;
  "set-online-status": (status: string) => void;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type:
    | "message"
    | "like_post"
    | "like_project"
    | "comment_post"
    | "comment_project"
    | "follow"
    | "unfollow"
    | "mention"
    | "project_invite"
    | "collaboration_request"
    | "system";
  title: string;
  message: string;
  data: {
    postId?: string;
    projectId?: string;
    commentId?: string;
    chatId?: string;
    messageId?: string;
    url?: string;
    image?: string;
  };
  isRead: boolean;
  readAt: string | null;
  timeAgo: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SocketListeners {
  "chat-joined": (data: { chatId: string }) => void;
  "chat-left": (data: { chatId: string }) => void;
  "new-message": (data: {
    chatId: string;
    message: Message;
    sender: User;
  }) => void;
  "message-sent": (data: { chatId: string; message: Message }) => void;
  "user-typing": (data: {
    chatId: string;
    userId: string;
    username: string;
  }) => void;
  "user-stop-typing": (data: { chatId: string; userId: string }) => void;
  "messages-read": (data: { chatId: string; userId: string }) => void;
  "user-status-change": (data: {
    userId: string;
    status: string;
    lastSeen: string;
  }) => void;
  "new-notification": (data: {
    notification: Notification;
    unreadCount: number;
  }) => void;
  "unread-count-update": (data: { unreadCount: number }) => void;
  error: (data: { message: string }) => void;
}

// AI Types
export interface AIResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  timestamp: string;
  context: string;
  cached?: boolean;
}

export interface AIStats {
  totalRequests: number;
  requestsToday: number;
  favoriteContext: string;
  lastUsed: string | null;
}

export interface AIContext {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface AIConversation {
  _id: string;
  user: string;
  title: string;
  context: "general" | "codeReview" | "debugging" | "learning" | "projectHelp";
  messages: AIConversationMessage[];
  totalTokens: number;
  totalCost: number;
  pinnedMessagesCount: number;
  lastActivity: string;
  tags: string[];
  project?: {
    _id: string;
    title: string;
  };
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  pinned?: boolean;
  pinnedAt?: string;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

export interface AIConversationStats {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  averageMessagesPerConversation: number;
  contextStats: Array<{
    _id: string;
    count: number;
    totalMessages: number;
  }>;
  recentActivity: Array<{
    _id: string;
    title: string;
    context: string;
    lastActivity: string;
    messageCount: number;
  }>;
}

export interface AIState {
  responses: AIResponse[];
  stats: AIStats | null;
  contexts: AIContext[];
  conversations: AIConversation[];
  conversationStats: AIConversationStats | null;
  currentConversation: AIConversation | null;
  isLoading: boolean;
  error: string | null;
  currentContext: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Discussion Types
export interface DiscussionComment {
  _id: string;
  author: User;
  content: string;
  richContent?: string;
  contentType: "plain" | "rich";
  parentComment?: string;
  replies: DiscussionComment[];
  upvotes: string[];
  downvotes: string[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: User;
  flags: Array<{
    user: string;
    reason: string;
    createdAt: string;
  }>;
  mentions: string[];
  userVote?: "upvote" | "downvote" | null;
  canEdit?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Discussion {
  _id: string;
  author: User;
  title: string;
  content: string;
  category:
    | "general"
    | "help"
    | "discussion"
    | "showcase"
    | "question"
    | "tutorial"
    | "news"
    | "meta"
    | "off-topic";
  tags: string[];
  status: "open" | "closed" | "locked" | "archived";
  isSticky: boolean;
  isFeatured: boolean;
  views: number;
  upvotes: string[];
  downvotes: string[];
  comments: DiscussionComment[];
  acceptedAnswer?: DiscussionComment;
  lastActivity: string;
  lastCommentBy?: User;
  flags: Array<{
    user: string;
    reason: string;
    createdAt: string;
  }>;
  mentions: string[];
  userVote?: "upvote" | "downvote" | null;
  isSaved?: boolean;
  voteScore: number;
  commentCount: number;
  totalRepliesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionCategory {
  id: string;
  name: string;
  description: string;
}

export interface DiscussionTag {
  tag: string;
  count: number;
}

export interface DiscussionFilters {
  category?: string;
  tags?: string[];
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
  search?: string;
  author?: string;
  isSticky?: boolean;
}

export interface DiscussionState {
  discussions: Discussion[];
  currentDiscussion: Discussion | null;
  categories: DiscussionCategory[];
  tags: DiscussionTag[];

  filters: DiscussionFilters;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
