"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import {
  fetchConversations,
  fetchConversationStats,
  searchConversations,
  setCurrentConversation,
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
import ConversationDetail from "@/components/ai/ConversationDetail";

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
  const [selectedContext, setSelectedContext] = useState("");
  const [sortBy, setSortBy] = useState("lastActivity");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [isMounted, setIsMounted] = useState(false);

  const contexts = [
    { value: "", label: "All Contexts" },
    { value: "general", label: "General" },
    { value: "codeReview", label: "Code Review" },
    { value: "debugging", label: "Debugging" },
    { value: "learning", label: "Learning" },
    { value: "projectHelp", label: "Project Help" },
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

  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  }, [
    selectedContext,
    sortBy,
    sortOrder,
    pagination.page,
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

    if (searchQuery.trim()) {
      dispatch(
        searchConversations({ q: searchQuery, context: selectedContext })
      );
    } else {
      dispatch(fetchConversations(params));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(
        searchConversations({ q: searchQuery, context: selectedContext })
      );
    } else {
      loadConversations();
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    dispatch(setCurrentConversation(conversationId));
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    dispatch(setCurrentConversation(null));
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case "general":
        return <MessageCircle className="w-4 h-4" />;
      case "codeReview":
        return <MessageSquare className="w-4 h-4" />;
      case "debugging":
        return <MessageSquare className="w-4 h-4" />;
      case "learning":
        return <MessageSquare className="w-4 h-4" />;
      case "projectHelp":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case "general":
        return "bg-blue-100 text-blue-800";
      case "codeReview":
        return "bg-green-100 text-green-800";
      case "debugging":
        return "bg-red-100 text-red-800";
      case "learning":
        return "bg-purple-100 text-purple-800";
      case "projectHelp":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading state while checking authentication
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required only if we're sure user is not authenticated
  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please log in to view your conversation history.
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              AI Conversations
            </h1>
            <p className="text-gray-600">
              Manage and review your past AI chat conversations
            </p>
          </div>

          {/* Stats Cards */}
          {conversationStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-blue-600" />
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

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-green-600" />
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

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
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

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Cost
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${conversationStats.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Search */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    aria-label="Select Context"
                    value={selectedContext}
                    onChange={(e) => setSelectedContext(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {sortOrder === "desc" ? "↓" : "↑"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Conversations List */}
          <div className="bg-white rounded-lg shadow">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversations found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? "Try adjusting your search criteria."
                    : "Start a conversation with AI to see it here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      onClick={() => handleConversationSelect(conversation._id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {conversation.title}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getContextColor(
                                conversation.context
                              )}`}
                            >
                              {conversation.context}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-4 h-4" />
                              {conversation.messageCount} messages
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(
                                new Date(conversation.lastActivity),
                                { addSuffix: true }
                              )}
                            </div>
                            {conversation.project && (
                              <div className="flex items-center gap-1">
                                <Tag className="w-4 h-4" />
                                {conversation.project.title}
                              </div>
                            )}
                          </div>

                          {conversation.tags &&
                            conversation.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {conversation.tags
                                  .slice(0, 3)
                                  .map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {conversation.tags.length > 3 && (
                                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                    +{conversation.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                        </div>

                        <div className="ml-4 flex-shrink-0">
                          <div className="text-right text-sm text-gray-500">
                            <div>${conversation.totalCost.toFixed(2)}</div>
                            <div>
                              {conversation.totalTokens.toLocaleString()} tokens
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex items-center gap-2">
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
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <span className="px-3 py-2 text-sm text-gray-700">
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
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
