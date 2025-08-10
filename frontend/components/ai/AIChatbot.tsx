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
  Sparkles,
  Zap,
  Brain,
  Cpu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import Image from "next/image";

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

  // Context configurations with enhanced styling
  const contextConfigs = {
    general: {
      icon: Brain,
      label: "General",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      description: "General coding assistance",
    },
    codeReview: {
      icon: Code,
      label: "Code Review",
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      description: "Code analysis and improvements",
    },
    debugging: {
      icon: Bug,
      label: "Debugging",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-700",
      description: "Bug fixing and troubleshooting",
    },
    learning: {
      icon: BookOpen,
      label: "Learning",
      color: "from-purple-500 to-indigo-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      description: "Educational content and tutorials",
    },
    projectHelp: {
      icon: Lightbulb,
      label: "Project Help",
      color: "from-orange-500 to-amber-500",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-700",
      description: "Project planning and guidance",
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
    contextConfigs[currentContext as keyof typeof contextConfigs]?.icon ||
    Brain;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Main Modal - Mobile Responsive */}
      <div className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
        <div className="relative p-3 sm:p-6 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            {/* Logo and Title - Mobile Stacked */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  DevLink AI Assistant
                </h2>
                <p className="text-xs sm:text-sm text-blue-200 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Powered by GPT-4o-mini
                </p>
              </div>
            </div>

            {/* Context Selector and Close - Mobile Responsive */}
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3">
              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setShowContexts(!showContexts)}
                  className="w-full sm:w-auto flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200 group"
                >
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r ${
                      contextConfigs[
                        currentContext as keyof typeof contextConfigs
                      ]?.color
                    } rounded-lg flex items-center justify-center`}
                  >
                    <CurrentContextIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="text-left flex-1 sm:flex-none">
                    <span className="text-xs sm:text-sm font-medium block sm:hidden">
                      {contextConfigs[
                        currentContext as keyof typeof contextConfigs
                      ]?.label || "General"}
                    </span>
                    <div className="hidden sm:block">
                      <span className="text-sm font-medium">
                        {contextConfigs[
                          currentContext as keyof typeof contextConfigs
                        ]?.label || "General"}
                      </span>
                      <p className="text-xs text-blue-200">
                        {
                          contextConfigs[
                            currentContext as keyof typeof contextConfigs
                          ]?.description
                        }
                      </p>
                    </div>
                  </div>
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-blue-200 group-hover:rotate-90 transition-transform duration-200" />
                </button>

                {/* Context Dropdown  */}
                {showContexts && (
                  <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-10 overflow-hidden">
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Choose Context
                      </h3>
                      {Object.entries(contextConfigs).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => handleContextChange(key)}
                            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 mb-2 ${
                              currentContext === key
                                ? `${config.bgColor} ${config.borderColor} border-2`
                                : "hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${config.color} rounded-xl flex items-center justify-center`}
                            >
                              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                            <div className="text-left flex-1">
                              <span
                                className={`text-sm font-semibold ${
                                  currentContext === key
                                    ? config.textColor
                                    : "text-gray-700"
                                }`}
                              >
                                {config.label}
                              </span>
                              <p className="text-xs text-gray-500 hidden sm:block">
                                {config.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="p-2 sm:p-2.5 hover:bg-white/10 rounded-xl transition-all duration-200 group"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area  */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {responses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 px-2 sm:px-0">
              <div className="relative mb-6 sm:mb-8">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full flex items-center justify-center">
                  <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent text-center">
                Welcome to DevLink AI!
              </h3>
              <p className="text-center max-w-lg text-gray-600 leading-relaxed text-sm sm:text-base px-2">
                I'm your intelligent coding companion. Choose a context below
                and let's build something amazing together!
              </p>

              {/* Quick Actions Grid  */}
              <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg px-2 sm:px-0">
                {Object.entries(contextConfigs).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => handleContextChange(key)}
                      className="group relative p-3 sm:p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-200`}
                      />
                      <div className="relative flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${config.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left flex-1">
                          <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                            {config.label}
                          </span>
                          <p className="text-xs text-gray-500 hidden sm:block">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            responses.map((response, index) => (
              <div key={response.timestamp} className="space-y-4">
                <div className="flex space-x-3 sm:space-x-4 group">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                      <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-gray-700">
                          DevLink AI
                        </span>
                        {response.cached && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full font-medium">
                            Cached Response
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTimestamp(response.timestamp)}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              response.content,
                              response.timestamp
                            )
                          }
                          className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-xl transition-all duration-200 group/copy"
                        >
                          {copiedId === response.timestamp ? (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 group-hover/copy:text-gray-700" />
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
                              <div className="relative group/code">
                                <SyntaxHighlighter
                                  style={tomorrow}
                                  language={match[1]}
                                  PreTag="div"
                                  className="rounded-xl border border-gray-200 text-xs sm:text-sm"
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
                                  className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-gray-800/80 text-white rounded-lg opacity-0 group-hover/code:opacity-100 transition-opacity duration-200"
                                >
                                  {copiedId === `code-${index}` ? (
                                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                  ) : (
                                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <code
                                className={`${className} bg-gray-100 px-2 py-1 rounded-md text-xs sm:text-sm`}
                                {...props}
                              >
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
            <div className="flex space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    AI is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="mx-3 sm:mx-6 mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="p-3 sm:p-6 bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Ask me anything about ${contextConfigs[
                    currentContext as keyof typeof contextConfigs
                  ]?.label.toLowerCase()}...`}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white/80 backdrop-blur-sm text-sm sm:text-base"
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
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Enhanced Stats */}
            {stats && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Cpu className="w-4 h-4" />
                    <span className="font-medium text-xs sm:text-sm">
                      Today: {stats.requestsToday}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium text-xs sm:text-sm">
                      Total: {stats.totalRequests}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center sm:text-right">
                  Press Enter to send • Shift+Enter for new line
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
