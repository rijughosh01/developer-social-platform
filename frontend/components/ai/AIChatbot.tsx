"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import {
  sendAIMessage,
  fetchAIContexts,
  fetchAIStats,
  setCurrentContext,
  clearResponses,
} from "@/store/slices/aiSlice";
import {
  MessageCircle,
  Bot,
  Code,
  Bug,
  BookOpen,
  Lightbulb,
  Send,
  Settings,
  X,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

interface AIChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { responses, contexts, stats, isLoading, error, currentContext } =
    useSelector((state: RootState) => state.ai);
  const { user } = useSelector((state: RootState) => state.auth);

  const [message, setMessage] = useState("");
  const [showContexts, setShowContexts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Context configurations
  const contextConfigs = {
    general: { icon: Bot, label: "General", color: "bg-blue-500" },
    codeReview: { icon: Code, label: "Code Review", color: "bg-green-500" },
    debugging: { icon: Bug, label: "Debugging", color: "bg-red-500" },
    learning: { icon: BookOpen, label: "Learning", color: "bg-purple-500" },
    projectHelp: {
      icon: Lightbulb,
      label: "Project Help",
      color: "bg-orange-500",
    },
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAIContexts());
      dispatch(fetchAIStats());
      inputRef.current?.focus();
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen && stats === null) {
      dispatch(fetchAIStats());
    }
  }, [isOpen, stats, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

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
        context: currentContext,
      })
    );
  };

  const handleContextChange = (context: string) => {
    dispatch(setCurrentContext(context));
    setShowContexts(false);
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const CurrentContextIcon =
    contextConfigs[currentContext as keyof typeof contextConfigs]?.icon || Bot;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">DevLink AI Assistant</h2>
              <p className="text-sm opacity-90">Powered by GPT-4o-mini</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Context Selector */}
            <div className="relative">
              <button
                onClick={() => setShowContexts(!showContexts)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
              >
                <CurrentContextIcon className="w-4 h-4" />
                <span className="text-sm">
                  {contextConfigs[currentContext as keyof typeof contextConfigs]
                    ?.label || "General"}
                </span>
                <Settings className="w-3 h-3" />
              </button>

              {showContexts && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                  {Object.entries(contextConfigs).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => handleContextChange(key)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                          currentContext === key
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${config.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        />
                        <span className="text-sm font-medium">
                          {config.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Bot className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                Welcome to DevLink AI!
              </h3>
              <p className="text-center max-w-md">
                I'm here to help you with coding questions, debugging, learning,
                and project advice. Choose a context above and start chatting!
              </p>

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-md">
                {Object.entries(contextConfigs).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleContextChange(key)}
                      className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Icon
                        className={`w-4 h-4 ${config.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      />
                      <span className="text-sm font-medium">
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            responses.map((response, index) => (
              <div key={response.timestamp} className="space-y-3">
                {/* AI Response */}
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          DevLink AI
                        </span>
                        {response.cached && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            Cached
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(response.timestamp)}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              response.content,
                              response.timestamp
                            )
                          }
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {copiedId === response.timestamp ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-sm max-w-none">
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
                              <SyntaxHighlighter
                                style={tomorrow}
                                language={match[1]}
                                PreTag="div"
                                {...props}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            ) : (
                              <code className={className} {...props}>
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {response.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Ask me anything about ${contextConfigs[
                  currentContext as keyof typeof contextConfigs
                ]?.label.toLowerCase()}...`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              aria-label="Send message"
              disabled={!message.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span>Requests today: {stats.requestsToday}</span>
              <span>Total requests: {stats.totalRequests}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AIChatbot;
