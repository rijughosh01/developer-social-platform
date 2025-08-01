"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import {
  fetchConversation,
  updateConversation,
  sendAIMessage,
  clearResponses,
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { formatDistanceToNow } from "date-fns";
import dynamic from "next/dynamic";

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
  const { currentConversation, isLoading, error } = useSelector(
    (state: RootState) => state.ai
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTags, setEditTags] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    dispatch(fetchConversation(conversationId));
    dispatch(clearResponses());
  }, [conversationId, dispatch]);

  useEffect(() => {
    if (currentConversation) {
      setEditTitle(currentConversation.title);
      setEditTags(currentConversation.tags?.join(", ") || "");
    }
  }, [currentConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const currentMessage = message;
    setMessage("");

    await dispatch(
      sendAIMessage({
        message: currentMessage,
        context: currentConversation?.context || "general",
        conversationId: conversationId,
      })
    );
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
    } catch (err) {
      console.error("Failed to copy text: ", err);
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Conversation Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error ||
              "The conversation could not be loaded. It may have been deleted."}
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Conversations
          </button>
        </div>
      </div>
    );
  }

  // Don't render anything until mounted to prevent hydration issues
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
      <main className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={onBack}
                  className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Conversations
                </button>
              </div>

              {/* Title and Context */}
              <div className="mb-4">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Conversation Title"
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 text-xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(currentConversation.title);
                        setEditTags(currentConversation.tags?.join(", ") || "");
                      }}
                      className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">
                      {currentConversation.title}
                    </h1>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getContextColor(
                      currentConversation.context
                    )}`}
                  >
                    {currentConversation.context}
                  </span>
                  {currentConversation.project && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {currentConversation.project.title}
                    </span>
                  )}
                </div>
              </div>

              {/* Tags */}
              {isEditing ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Enter tags separated by commas"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ) : (
                currentConversation.tags &&
                currentConversation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {currentConversation.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {currentConversation.messageCount} messages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {currentConversation.totalTokens.toLocaleString()} tokens
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    ${currentConversation.totalCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDistanceToNow(
                      new Date(currentConversation.lastActivity),
                      { addSuffix: true }
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Conversation History
              </h2>

              {!currentConversation?.messages ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading messages...</p>
                </div>
              ) : currentConversation.messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No messages in this conversation yet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Regular Messages */}
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {currentConversation.messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg p-4 relative ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
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
                                      <div className="relative">
                                        <SyntaxHighlighter
                                          style={tomorrow}
                                          language={match[1]}
                                          PreTag="div"
                                          className="rounded-lg"
                                          {...props}
                                        >
                                          {String(children).replace(/\n$/, "")}
                                        </SyntaxHighlighter>
                                        <button
                                          onClick={() =>
                                            copyToClipboard(
                                              String(children),
                                              `code-${index}`
                                            )
                                          }
                                          className="absolute top-2 right-2 p-1 bg-gray-800 text-white rounded opacity-0 hover:opacity-100 transition-opacity"
                                        >
                                          {copiedId === `code-${index}` ? (
                                            <Check className="w-3 h-3" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>

                            <div className="flex items-center gap-2">
                              {msg.role === "assistant" && msg.metadata && (
                                <div className="flex-shrink-0 text-xs opacity-75">
                                  <div>{msg.metadata.tokens} tokens</div>
                                  {msg.metadata.processingTime && (
                                    <div>{msg.metadata.processingTime}ms</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            className={`text-xs mt-2 ${
                              msg.role === "user"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {formatDistanceToNow(new Date(msg.timestamp), {
                              addSuffix: true,
                            })}
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
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Continue Conversation
              </h3>

              <form onSubmit={handleSendMessage} className="space-y-4">
                <div>
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
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
