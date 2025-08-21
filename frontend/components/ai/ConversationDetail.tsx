"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import toast from "react-hot-toast";
import {
  fetchConversation,
  updateConversation,
  sendAIMessage,
  clearResponses,
  pinMessage,
  unpinMessage,
  fetchPinnedMessages,
  deleteConversation,
  clearError,
} from "@/store/slices/aiSlice";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Send,
  Copy,
  Check,
  MessageCircle,
  Clock,
  Tag,
  DollarSign,
  BarChart3,
  Pin,
  PinOff,
  Trash2,
  Settings,
  Crown,
  Cpu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";
import PinnedMessagesSection from "./PinnedMessagesSection";
import { formatCost, parseAIError } from "@/lib/utils";

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

interface ConversationDetailProps {
  conversationId: string;
  onBack: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversationId,
  onBack,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentConversation, isLoading, error, currentModel } = useSelector(
    (state: RootState) => state.ai
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    dispatch(fetchConversation(conversationId));
    dispatch(clearResponses());
    dispatch(fetchPinnedMessages(conversationId));
  }, [conversationId, dispatch]);

  useEffect(() => {
    if (currentConversation) {
      setEditTitle(currentConversation.title);
      setEditTags(currentConversation.tags?.join(", ") || "");

      const pinned =
        currentConversation.messages?.filter((msg: any) => msg.pinned) || [];
      setPinnedMessages(pinned);
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePinMessage = async (messageIndex: number) => {
    try {
      await dispatch(pinMessage({ conversationId, messageIndex })).unwrap();

      dispatch(fetchConversation(conversationId));
      toast.success("Message pinned successfully!");
    } catch (error) {
      console.error("Failed to pin message:", error);
      toast.error("Failed to pin message");
    }
  };

  const handleUnpinMessage = async (messageIndex: number) => {
    try {
      await dispatch(unpinMessage({ conversationId, messageIndex })).unwrap();

      dispatch(fetchConversation(conversationId));
      toast.success("Message unpinned successfully!");
    } catch (error) {
      console.error("Failed to unpin message:", error);
      toast.error("Failed to unpin message");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;
    setMessage("");

    try {
      await dispatch(
        sendAIMessage({
          message: currentMessage,
          context: currentConversation?.context || "general",
          model: currentModel,
          conversationId: conversationId,
        })
      ).unwrap();
    } catch (error: any) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!currentConversation) return;

    const tags = editTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    await dispatch(
      updateConversation({
        conversationId: currentConversation._id,
        title: editTitle,
        tags,
      })
    );

    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Message copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy message");
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentConversation) return;

    if (
      window.confirm(
        `Are you sure you want to delete the conversation "${currentConversation.title}"? This action cannot be undone.`
      )
    ) {
      try {
        await dispatch(deleteConversation(conversationId)).unwrap();
        toast.success("Conversation deleted successfully!");
        onBack();
      } catch (error) {
        console.error("Failed to delete conversation:", error);
        toast.error("Failed to delete conversation");
      }
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

  if (isLoading && !currentConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !currentConversation) {
    const errorMessage = error
      ? parseAIError(error)
      : "The conversation could not be loaded. It may have been deleted.";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <X className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? "Error Loading Conversation" : "Conversation Not Found"}
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">{errorMessage}</p>

          {/* Error-specific actions */}
          {error && error.includes("Daily token limit exceeded") && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-700 mb-3">
                ⏰ <strong>Daily Limit Reached:</strong> You've used all your
                daily tokens. Limits reset at midnight.
              </p>
              <p className="text-sm text-orange-600">
                💡 <strong>Tip:</strong> Switch models in the main AI Chatbot to
                continue your conversation.
              </p>
            </div>
          )}

          {error && error.includes("Authentication required") && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-sm text-indigo-700 mb-3">
                🔐 <strong>Authentication Required:</strong> Please log in to
                access this conversation.
              </p>
              <button
                onClick={() => (window.location.href = "/auth/login")}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          )}

          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors hover:bg-blue-700 shadow-lg"
          >
            Back to Conversations
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 mb-6">
            <div className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-3 sm:space-y-0">
                <button
                  onClick={onBack}
                  className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-all duration-200 bg-gray-100 hover:bg-gray-200 px-3 sm:px-4 py-2 rounded-xl"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">
                    Back to Conversations
                  </span>
                </button>
                <button
                  onClick={handleDeleteConversation}
                  className="flex items-center gap-3 text-red-600 hover:text-red-700 transition-all duration-200 bg-red-50 hover:bg-red-100 px-3 sm:px-4 py-2 rounded-xl"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-medium text-sm sm:text-base">
                    Delete
                  </span>
                </button>
              </div>

              {/* Title and Context */}
              <div className="mb-6">
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      aria-label="Conversation Title"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 text-lg sm:text-2xl font-bold text-gray-900 border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="p-2 sm:p-3 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200"
                      >
                        <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditTitle(currentConversation.title);
                          setEditTags(
                            currentConversation.tags?.join(", ") || ""
                          );
                        }}
                        className="p-2 sm:p-3 text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200"
                      >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {currentConversation.title}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
                  <span
                    className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl shadow-sm ${getContextColor(
                      currentConversation.context
                    )}`}
                  >
                    {currentConversation.context}
                  </span>
                  {currentConversation.project && (
                    <span className="px-3 sm:px-4 py-2 text-sm font-semibold rounded-xl shadow-sm bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800">
                      {currentConversation.project.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {isEditing ? (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Enter tags separated by commas"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              ) : (
                currentConversation.tags &&
                currentConversation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {currentConversation.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 sm:px-3 py-1 text-sm bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg shadow-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-blue-900">
                      {currentConversation.messageCount}
                    </div>
                    <div className="text-xs text-blue-700">messages</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-green-900">
                      {currentConversation.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-700">tokens</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-purple-900">
                      {formatCost(currentConversation.totalCost)}
                    </div>
                    <div className="text-xs text-purple-700">cost</div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-orange-900">
                      {formatDistanceToNow(
                        new Date(currentConversation.lastActivity),
                        { addSuffix: true }
                      )}
                    </div>
                    <div className="text-xs text-orange-700">last activity</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pinned Messages Section */}
          <PinnedMessagesSection
            conversationId={conversationId}
            pinnedMessages={pinnedMessages}
            onUnpin={handleUnpinMessage}
          />

          {/* Messages */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 mb-6">
            <div className="p-4 sm:p-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Conversation History
              </h2>

              {!currentConversation?.messages ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">
                    Loading messages...
                  </p>
                </div>
              ) : currentConversation.messages.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium text-sm sm:text-base">
                    No messages in this conversation yet.
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-2">
                    Start the conversation below!
                  </p>
                </div>
              ) : (
                <>
                  {/* Regular Messages */}
                  <div className="space-y-6 sm:space-y-10 max-h-96 overflow-y-auto pr-2 sm:pr-4">
                    {currentConversation.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        } animate-fade-in`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div
                          className={`max-w-full sm:max-w-3xl relative group ${
                            msg.role === "user" ? "order-2" : "order-1"
                          }`}
                        >
                          {/* Message Bubble */}
                          <div
                            className={`relative rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-soft border ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-500/20"
                                : "bg-gradient-to-r from-gray-50 to-white text-gray-900 border-gray-200/50"
                            } transition-all duration-300 hover:shadow-glow ${
                              msg.pinned ? "ring-2 ring-yellow-400/50" : ""
                            }`}
                          >
                            {/* Pinned Indicator */}
                            {msg.pinned && (
                              <div className="absolute -top-1 sm:-top-2 -left-1 sm:-left-2 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg z-10">
                                <Pin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              </div>
                            )}

                            {/* Message Content */}
                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex-1">
                                <ReactMarkdown
                                  components={{
                                    code({
                                      node,
                                      inline,
                                      className,
                                      children,
                                      ...props
                                    }) {
                                      const match = /language-(\w+)/.exec(
                                        className || ""
                                      );
                                      return !inline && match ? (
                                        <div className="relative my-4">
                                          <SyntaxHighlighter
                                            style={tomorrow}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-xl shadow-inner"
                                            {...props}
                                          >
                                            {String(children).replace(
                                              /\n$/,
                                              ""
                                            )}
                                          </SyntaxHighlighter>
                                          <button
                                            onClick={() =>
                                              copyToClipboard(
                                                String(children),
                                                `code-${index}`
                                              )
                                            }
                                            className="absolute top-3 right-3 p-2 bg-gray-800/90 backdrop-blur-sm text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-700 shadow-lg"
                                          >
                                            {copiedId === `code-${index}` ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <Copy className="w-4 h-4" />
                                            )}
                                          </button>
                                        </div>
                                      ) : (
                                        <code
                                          className={`${className} bg-gray-800/10 px-2 py-1 rounded-md text-sm`}
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </div>

                              {/* Message Footer */}
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-gray-200/30 space-y-2 sm:space-y-0">
                                <div
                                  className={`text-xs flex items-center gap-2 ${
                                    msg.role === "user"
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(
                                    new Date(msg.timestamp),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </div>

                                {/* Action Buttons and Metadata */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                  {msg.role === "assistant" && msg.metadata && (
                                    <div className="flex items-center gap-2 text-xs bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 shadow-sm">
                                      <div className="font-semibold text-gray-900">
                                        {msg.metadata.tokens} tokens
                                      </div>
                                      {msg.metadata.processingTime && (
                                        <>
                                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                          <div className="text-gray-600 font-medium">
                                            {msg.metadata.processingTime}ms
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-300 shadow-sm">
                                    <button
                                      onClick={() =>
                                        copyToClipboard(
                                          msg.content,
                                          `msg-${index}`
                                        )
                                      }
                                      className="p-1.5 sm:p-2 rounded-md transition-all duration-200 hover:bg-blue-50 text-gray-600 hover:text-blue-700"
                                      title="Copy message"
                                    >
                                      {copiedId === `msg-${index}` ? (
                                        <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                      ) : (
                                        <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        msg.pinned
                                          ? handleUnpinMessage(index)
                                          : handlePinMessage(index)
                                      }
                                      className={`p-1.5 sm:p-2 rounded-md transition-all duration-200 ${
                                        msg.pinned
                                          ? "text-yellow-600 hover:bg-yellow-50"
                                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                      }`}
                                      title={
                                        msg.pinned
                                          ? "Unpin message"
                                          : "Pin message"
                                      }
                                    >
                                      {msg.pinned ? (
                                        <PinOff className="w-3 h-3 sm:w-4 sm:h-4" />
                                      ) : (
                                        <Pin className="w-3 h-3 sm:w-4 sm:h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Continue Conversation */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20">
            <div className="p-4 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Continue Conversation
              </h3>

              {/* Error Display */}
              {error && (
                <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl sm:rounded-2xl shadow-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">
                          Error Occurred
                        </h4>
                        <p className="text-sm text-red-700 leading-relaxed">
                          {parseAIError(error)}
                        </p>

                        {/* Error-specific actions */}
                        {error.includes("Daily token limit exceeded") && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-xs text-orange-700 mb-2">
                              ⏰ <strong>Daily Limit Reached:</strong> You've
                              used all your daily tokens for this model. Limits
                              reset at midnight.
                            </p>
                            <p className="text-xs text-orange-600">
                              💡 <strong>Tip:</strong> Switch models in the main
                              AI Chatbot to continue your conversation.
                            </p>
                          </div>
                        )}

                        {error.includes("Rate limit exceeded") && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-700 mb-2">
                              ⚡ <strong>Rate Limit:</strong> You're sending
                              messages too quickly. Please wait a moment before
                              trying again.
                            </p>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => dispatch(clearError())}
                                className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors"
                              >
                                Try Again Later
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch(clearError())}
                      className="flex-shrink-0 p-1 hover:bg-red-200 rounded-lg transition-colors duration-200"
                      aria-label="Dismiss error"
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="space-y-4 sm:space-y-6"
              >
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... Ask me anything about programming, code review, debugging, or project help!"
                    className="w-full border-2 border-gray-200 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white/80 backdrop-blur-sm transition-all duration-200 placeholder-gray-500 text-sm sm:text-base"
                    rows={4}
                    disabled={isLoading}
                  />
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 text-xs text-gray-400">
                    {message.length}/4000
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 sm:gap-3 shadow-lg hover:shadow-glow hover:scale-105 transform text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium">Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConversationDetail;
