"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import toast from "react-hot-toast";
import {
  fetchConversations,
  fetchConversationStats,
  setCurrentConversation,
  deleteConversation,
} from "@/store/slices/aiSlice";
import { getProfile } from "@/store/slices/authSlice";
import {
  Search,
  Filter,
  MessageCircle,
  Clock,
  Tag,
  Plus,
  Calendar,
  BarChart3,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Pin,
  Trash2,
  Sparkles,
  Zap,
  Brain,
  Code,
  Bug,
  BookOpen,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
import ConversationDetail from "@/components/ai/ConversationDetail";
import { formatCost } from "@/lib/utils";

// Dynamic imports to prevent hydration errors
const DashboardHeader = dynamic(
  () =>
    import("@/components/dashboard/DashboardHeader").then((mod) => ({
      default: mod.DashboardHeader,
    })),
  {
    ssr: false,
  }
);

const DashboardSidebar = dynamic(
  () =>
    import("@/components/dashboard/DashboardSidebar").then((mod) => ({
      default: mod.DashboardSidebar,
    })),
  {
    ssr: false,
  }
);

const ConversationsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    conversations,
    conversationStats,
    currentConversation,
    pagination,
    isLoading,
  } = useSelector((state: RootState) => state.ai);
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedContext, setSelectedContext] = useState("");
  const [sortBy, setSortBy] = useState("lastActivity");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isMounted, setIsMounted] = useState(false);

  const contexts = [
    {
      value: "",
      label: "All Contexts",
      icon: MessageCircle,
      color: "from-gray-500 to-gray-600",
    },
    {
      value: "general",
      label: "General",
      icon: Brain,
      color: "from-blue-500 to-cyan-500",
    },
    {
      value: "codeReview",
      label: "Code Review",
      icon: Code,
      color: "from-emerald-500 to-teal-500",
    },
    {
      value: "debugging",
      label: "Debugging",
      icon: Bug,
      color: "from-red-500 to-pink-500",
    },
    {
      value: "learning",
      label: "Learning",
      icon: BookOpen,
      color: "from-purple-500 to-indigo-500",
    },
    {
      value: "projectHelp",
      label: "Project Help",
      icon: Lightbulb,
      color: "from-orange-500 to-amber-500",
    },
  ];

  const sortOptions = [
    { value: "lastActivity", label: "Last Activity" },
    { value: "createdAt", label: "Created Date" },
    { value: "messageCount", label: "Message Count" },
    { value: "title", label: "Title" },
  ];

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getProfile());
    } else if (isAuthenticated && user) {
      loadConversations();
      dispatch(fetchConversationStats());
    }
  }, [isAuthenticated, user, dispatch]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  }, [
    selectedContext,
    sortBy,
    sortOrder,
    showOnlyPinned,
    pagination.page,
    debouncedSearchQuery,
    isAuthenticated,
    user,
  ]);

  const loadConversations = () => {
    const params: any = {
      page: pagination.page,
      limit: pagination.limit,
      sort: sortBy,
      order: sortOrder,
    };

    if (selectedContext) {
      params.context = selectedContext;
    }

    if (showOnlyPinned) {
      params.hasPinned = true;
    }

    if (debouncedSearchQuery.trim()) {
      params.search = debouncedSearchQuery.trim();
    }

    dispatch(fetchConversations(params));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadConversations();
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    dispatch(setCurrentConversation(conversationId));
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    dispatch(setCurrentConversation(null));
  };

  const handleDeleteConversation = async (
    conversationId: string,
    conversationTitle: string
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete the conversation "${conversationTitle}"? This action cannot be undone.`
      )
    ) {
      try {
        await dispatch(deleteConversation(conversationId)).unwrap();
        toast.success("Conversation deleted successfully!");

        loadConversations();

        dispatch(fetchConversationStats());
      } catch (error) {
        console.error("Failed to delete conversation:", error);
        toast.error("Failed to delete conversation");
      }
    }
  };

  const getContextIcon = (context: string) => {
    const contextConfig = contexts.find((c) => c.value === context);
    if (contextConfig) {
      const Icon = contextConfig.icon;
      return <Icon className="w-4 h-4" />;
    }
    return <MessageCircle className="w-4 h-4" />;
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case "general":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "codeReview":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "debugging":
        return "bg-red-50 text-red-700 border-red-200";
      case "learning":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "projectHelp":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getContextGradient = (context: string) => {
    const contextConfig = contexts.find((c) => c.value === context);
    return contextConfig ? contextConfig.color : "from-gray-500 to-gray-600";
  };

  // Show loading state while checking authentication
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // Show authentication required only if we're sure user is not authenticated
  if (isMounted && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Please log in to view your conversation history and manage your AI
            interactions.
          </p>
        </div>
      </div>
    );
  }

  if (selectedConversationId && currentConversation) {
    return (
      <ConversationDetail
        conversationId={selectedConversationId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  AI Conversations
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and review your past AI chat conversations
                </p>
              </div>
            </div>
          </div>

          {/*Stats Cards */}
          {conversationStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-slide-in-up">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 p-6 hover-lift">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Conversations
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {conversationStats.totalConversations}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 p-6 hover-lift">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {conversationStats.totalMessages}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 p-6 hover-lift">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Avg Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {conversationStats.averageMessagesPerConversation.toFixed(
                        1
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 p-6 hover-lift">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Cost
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCost(conversationStats.totalCost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/*Filters and Search */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 mb-6 animate-slide-in-up">
            <div className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Search
                    </button>

                    <select
                      aria-label="Select Context"
                      value={selectedContext}
                      onChange={(e) => setSelectedContext(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      {contexts.map((context) => (
                        <option key={context.value} value={context.value}>
                          {context.label}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Sort By"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                      }
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-blue-300 transition-all duration-200 bg-white/50 backdrop-blur-sm flex items-center gap-2"
                    >
                      {sortOrder === "desc" ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Desc
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Asc
                        </>
                      )}
                    </button>

                    <label className="flex items-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-all duration-200 bg-white/50 backdrop-blur-sm">
                      <input
                        type="checkbox"
                        checked={showOnlyPinned}
                        onChange={(e) => setShowOnlyPinned(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">With Pinned</span>
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Conversations List */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 animate-slide-in-up">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
                <p className="text-gray-600 font-medium">
                  Loading conversations...
                </p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {searchQuery
                    ? "No search results found"
                    : "No conversations found"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchQuery
                    ? `No conversations found matching "${searchQuery}". Try adjusting your search criteria or try a different search term.`
                    : "Start a conversation with AI to see it appear here. Your chat history will be saved for future reference."}
                </p>
              </div>
            ) : (
              <div>
                {searchQuery && (
                  <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <p className="text-sm text-blue-700">
                      Found {conversations.length} conversation
                      {conversations.length !== 1 ? "s" : ""} matching "
                      {searchQuery}"
                    </p>
                  </div>
                )}
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation, index) => (
                    <div
                      key={conversation._id}
                      className="p-6 hover:bg-white/50 transition-all duration-200 group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div
                          onClick={() =>
                            handleConversationSelect(conversation._id)
                          }
                          className="cursor-pointer flex-1 min-w-0 group-hover:scale-[1.02] transition-transform duration-200"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-10 h-10 bg-gradient-to-r ${getContextGradient(
                                conversation.context
                              )} rounded-xl flex items-center justify-center shadow-md`}
                            >
                              {getContextIcon(conversation.context)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-200">
                                {conversation.title}
                              </h3>
                            </div>
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full border ${getContextColor(
                                conversation.context
                              )}`}
                            >
                              {conversation.context}
                            </span>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-medium">
                                {conversation.messageCount} messages
                              </span>
                            </div>
                            {conversation.pinnedMessagesCount > 0 && (
                              <div className="flex items-center gap-2">
                                <Pin className="w-4 h-4 text-yellow-500" />
                                <span className="font-medium">
                                  {conversation.pinnedMessagesCount} pinned
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                {formatDistanceToNow(
                                  new Date(conversation.lastActivity),
                                  { addSuffix: true }
                                )}
                              </span>
                            </div>
                            {conversation.project && (
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                <span>{conversation.project.title}</span>
                              </div>
                            )}
                          </div>

                          {conversation.tags &&
                            conversation.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {conversation.tags
                                  .slice(0, 3)
                                  .map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg border border-gray-200 font-medium"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {conversation.tags.length > 3 && (
                                  <span className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg border border-gray-200 font-medium">
                                    +{conversation.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="ml-6 flex-shrink-0 flex items-start gap-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCost(conversation.totalCost)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {conversation.totalTokens.toLocaleString()} tokens
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConversation(
                                conversation._id,
                                conversation.title
                              );
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 group/delete"
                            title="Delete conversation"
                          >
                            <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform duration-200" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center animate-fade-in">
              <nav className="flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 p-2">
                <button
                  onClick={() =>
                    dispatch(
                      fetchConversations({
                        ...pagination,
                        page: pagination.page - 1,
                      })
                    )
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-300 transition-all duration-200 bg-white/50 backdrop-blur-sm font-medium"
                >
                  Previous
                </button>

                <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl">
                  Page {pagination.page} of {pagination.pages}
                </span>

                <button
                  onClick={() =>
                    dispatch(
                      fetchConversations({
                        ...pagination,
                        page: pagination.page + 1,
                      })
                    )
                  }
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-300 transition-all duration-200 bg-white/50 backdrop-blur-sm font-medium"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ConversationsPage;
