"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import toast from "react-hot-toast";
import { parseAIError } from "@/lib/utils";
import {
  sendAIMessage,
  sendAIMessageStream,
  fetchAIContexts,
  fetchAIModels,
  fetchAIStats,
  fetchTokenUsage,
  fetchConversation,
  setCurrentContext,
  setCurrentModel,
  clearResponses,
  clearError,
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
  Crown,
  Star,
  Loader2,
  Clock,
  Search,
  Sparkles as SparklesIcon,
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
  const {
    responses,
    contexts,
    models,
    stats,
    tokenUsage,
    isLoading,
    error,
    currentContext,
    currentModel,
  } = useSelector((state: RootState) => state.ai);
  const { user } = useSelector((state: RootState) => state.auth);

  const [message, setMessage] = useState("");
  const [showContexts, setShowContexts] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const [thinkingThought, setThinkingThought] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [useStreaming, setUseStreaming] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Natural thinking thoughts that cycle through
  const thinkingThoughts = [
    "Let me think about this...",
    "Interesting question...",
    "Processing the context...",
    "Gathering relevant information...",
    "Analyzing the patterns...",
    "Formulating a response...",
    "Making sure this is helpful...",
    "Double-checking the details...",
    "Almost there...",
    "Putting it all together...",
  ];

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
      dispatch(fetchAIModels());
      dispatch(fetchAIStats());
      dispatch(fetchTokenUsage());
      inputRef.current?.focus();
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen && stats === null) {
      dispatch(fetchAIStats());
    }
  }, [isOpen, stats, dispatch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".model-selector") &&
        !target.closest(".context-selector")
      ) {
        setShowModels(false);
        setShowContexts(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  // Natural thinking process effect
  useEffect(() => {
    if (isLoading) {
      const thinkingInterval = setInterval(() => {
        setThinkingPhase((prev) => (prev + 1) % 3);
        setThinkingThought(
          thinkingThoughts[Math.floor(Math.random() * thinkingThoughts.length)]
        );
      }, 2000);

      return () => clearInterval(thinkingInterval);
    } else {
      setThinkingPhase(0);
      setThinkingThought("");
    }
  }, [isLoading, thinkingThoughts]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const isModelAvailable = (model: any) => {
    if (!user) return false;

    if (model.requiresPremium && user.subscription?.plan === "free") {
      return false;
    }

    return true;
  };

  const userPlan = user?.subscription?.plan || "free";

  // Show toast notification for errors
  useEffect(() => {
    if (error) {
      if (error.includes("Premium subscription required")) {
        toast.error(
          "Premium subscription required for this model. Please upgrade or switch to a free model.",
          {
            duration: 6000,
            icon: "🔒",
          }
        );
      } else if (error.includes("Daily token limit exceeded")) {
        toast.error(
          "Daily token limit exceeded. Please try again tomorrow or upgrade your plan.",
          {
            duration: 6000,
            icon: "⏰",
          }
        );
      } else {
        toast.error(error, {
          duration: 5000,
        });
      }
    }
  }, [error]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || isStreaming) return;

    if (error) {
      dispatch(clearError());
    }

    const currentMessage = message;
    setMessage("");

    if (useStreaming) {
      setIsStreaming(true);
      setStreamingResponse("");

      const result = await dispatch(
        sendAIMessageStream({
          message: currentMessage,
          context: currentContext,
          model: currentModel,
          conversationId: currentConversationId,
          onChunk: (chunk) => {
            if (chunk.type === "content") {
              setStreamingResponse((prev) => prev + chunk.content);
            }
          },
          onComplete: (data) => {
            setIsStreaming(false);
            setStreamingResponse("");
            if (data.conversationId && !currentConversationId) {
              setCurrentConversationId(data.conversationId);
            }

            if (data.conversationId) {
              dispatch(fetchConversation(data.conversationId));
            }
          },
          onError: (error) => {
            setIsStreaming(false);
            setStreamingResponse("");
            console.error("Streaming error:", error);
          },
        })
      );

      if (
        result.payload &&
        result.payload.conversationId &&
        !currentConversationId
      ) {
        setCurrentConversationId(result.payload.conversationId);
      }
    } else {
      const result = await dispatch(
        sendAIMessage({
          message: currentMessage,
          context: currentContext,
          model: currentModel,
          conversationId: currentConversationId,
        })
      );

      if (
        result.payload &&
        result.payload.conversationId &&
        !currentConversationId
      ) {
        setCurrentConversationId(result.payload.conversationId);
      }
    }
  };

  const handleContextChange = (context: string) => {
    dispatch(setCurrentContext(context));
    setShowContexts(false);

    setCurrentConversationId(null);
    dispatch(clearResponses());
  };

  const handleModelChange = (model: string) => {
    console.log("handleModelChange called with model:", model);
    console.log("Available models:", models);

    const selectedModel = models.find((m) => m.id === model);
    console.log("Selected model:", selectedModel);

    if (selectedModel && !isModelAvailable(selectedModel)) {
      if (userPlan === "free") {
        toast.error(
          "This model requires a premium subscription. Please upgrade your plan to access premium models.",
          {
            duration: 6000,
            icon: "🔒",
          }
        );
      } else {
        toast.error(
          "This model is not available for your current subscription plan.",
          {
            duration: 5000,
          }
        );
      }
      return;
    }

    console.log("Dispatching setCurrentModel with:", model);
    dispatch(setCurrentModel(model));
    setShowModels(false);
    dispatch(clearError());

    dispatch(fetchTokenUsage());

    // Show success toast for model change
    if (selectedModel) {
      toast.success(`Switched to ${selectedModel.name}`, {
        duration: 3000,
        icon: "🤖",
      });
    }
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

      {/* Main Modal */}
      <div className="relative w-full max-w-5xl h-[90vh] sm:h-[85vh] bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden">
        <div className="relative p-2 sm:p-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  DevLink AI Assistant
                </h2>
                <p className="text-xs text-blue-200 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Powered by{" "}
                  {models.find((m) => m.id === currentModel)?.name ||
                    "GPT-4o-mini"}
                  {userPlan !== "free" && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-xs">
                      {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Context and Model Selectors and Close */}
            <div className="flex items-center justify-between sm:justify-end space-x-1 sm:space-x-2">
              <div className="relative flex-1 sm:flex-none model-selector">
                <button
                  onClick={() => setShowModels(!showModels)}
                  className="w-full sm:w-auto flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 group"
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md flex items-center justify-center">
                    <Cpu className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <div className="text-left flex-1 sm:flex-none">
                    <div className="flex items-center space-x-1 block sm:hidden">
                      {models.find((m) => m.id === currentModel)?.provider ===
                      "openrouter" ? (
                        <Cpu className="w-3 h-3 text-blue-300" />
                      ) : (
                        <Crown className="w-3 h-3 text-purple-300" />
                      )}
                      <span className="text-xs font-medium">
                        {models.find((m) => m.id === currentModel)?.name ||
                          "GPT-4o-mini"}
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-xs font-medium">
                        {models.find((m) => m.id === currentModel)?.name ||
                          "GPT-4o-mini"}
                      </span>
                      <div className="flex items-center space-x-1">
                        {models.find((m) => m.id === currentModel)?.provider ===
                        "openrouter" ? (
                          <Cpu className="w-3 h-3 text-blue-300" />
                        ) : (
                          <Crown className="w-3 h-3 text-purple-300" />
                        )}
                        <p className="text-xs text-blue-200">
                          {models.find((m) => m.id === currentModel)
                            ?.provider === "openrouter"
                            ? "Free Model"
                            : "Premium Model"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-200 group-hover:rotate-90 transition-transform duration-200" />
                </button>

                {/* Model Dropdown */}
                {showModels && (
                  <div className="absolute right-0 top-full mt-2 w-64 sm:w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 z-10 overflow-hidden">
                    <div className="p-3 sm:p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Choose AI Model
                      </h3>
                      {models.map((model) => {
                        const isAvailable = isModelAvailable(model);
                        const isCurrent = currentModel === model.id;

                        return (
                          <button
                            key={model.id}
                            onClick={() =>
                              isAvailable ? handleModelChange(model.id) : null
                            }
                            disabled={!isAvailable}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 mb-2 ${
                              isCurrent
                                ? "bg-purple-50 border-2 border-purple-200"
                                : isAvailable
                                ? "hover:bg-gray-50 border border-transparent"
                                : "opacity-50 cursor-not-allowed bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  isAvailable
                                    ? model.provider === "openrouter"
                                      ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                                    : "bg-gray-400"
                                }`}
                              >
                                {model.provider === "openrouter" ? (
                                  <Cpu className="w-4 h-4 text-white" />
                                ) : (
                                  <Crown className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div className="text-left">
                                <span
                                  className={`text-sm font-medium ${
                                    isAvailable
                                      ? "text-gray-700"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {model.name}
                                </span>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    {model.provider === "openrouter" ? (
                                      <Cpu className="w-3 h-3 text-blue-500" />
                                    ) : (
                                      <Crown className="w-3 h-3 text-purple-500" />
                                    )}
                                    <p
                                      className={`text-xs ${
                                        isAvailable
                                          ? "text-gray-500"
                                          : "text-gray-400"
                                      }`}
                                    >
                                      {model.provider === "openrouter"
                                        ? "Free"
                                        : "Premium"}
                                    </p>
                                  </div>
                                  {!isAvailable && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                      {userPlan === "free"
                                        ? "Upgrade Required"
                                        : "Not Available"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isCurrent && (
                                <Check className="w-4 h-4 text-purple-600" />
                              )}
                              {!isAvailable && (
                                <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                                  <X className="w-3 h-3 text-gray-500" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Context Selector */}
              <div className="relative flex-1 sm:flex-none context-selector">
                <button
                  onClick={() => setShowContexts(!showContexts)}
                  className="w-full sm:w-auto flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 group"
                >
                  <div
                    className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r ${
                      contextConfigs[
                        currentContext as keyof typeof contextConfigs
                      ]?.color
                    } rounded-md flex items-center justify-center`}
                  >
                    <CurrentContextIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                  </div>
                  <div className="text-left flex-1 sm:flex-none">
                    <span className="text-xs font-medium block sm:hidden">
                      {contextConfigs[
                        currentContext as keyof typeof contextConfigs
                      ]?.label || "General"}
                    </span>
                    <div className="hidden sm:block">
                      <span className="text-xs font-medium">
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
                  <Settings className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-200 group-hover:rotate-90 transition-transform duration-200" />
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

              {/* Streaming Toggle */}
              <button
                type="button"
                onClick={() => setUseStreaming(!useStreaming)}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 group ${
                  useStreaming
                    ? "bg-green-500/20 hover:bg-green-500/30"
                    : "bg-gray-500/20 hover:bg-gray-500/30"
                }`}
                title={useStreaming ? "Disable streaming" : "Enable streaming"}
              >
                <div
                  className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    useStreaming ? "text-green-400" : "text-gray-400"
                  }`}
                >
                  {useStreaming ? (
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <div
                        className="w-1 h-1 bg-green-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-green-400 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  ) : (
                    <div className="w-full h-full border-2 border-gray-400 rounded-sm"></div>
                  )}
                </div>
              </button>

              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-all duration-200 group"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area  */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {responses.length === 0 && !isLoading ? (
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
                        {response.usedFallback && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full font-medium">
                            Fallback: {response.modelName}
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

          {(isLoading || isStreaming) && (
            <div className="flex space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white relative z-10" />

                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl sm:rounded-2xl animate-pulse opacity-75"></div>

                  <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_200%] animate-spin"></div>
                </div>
              </div>
              <div className="flex-1 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
                <div className="space-y-3">
                  {/* Header with model info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-700">
                        DevLink AI
                      </span>
                      <div className="flex items-center space-x-1">
                        {models.find((m) => m.id === currentModel)?.provider ===
                        "openrouter" ? (
                          <Cpu className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Crown className="w-3 h-3 text-purple-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {models.find((m) => m.id === currentModel)?.name ||
                            "GPT-4o-mini"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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
                    </div>
                  </div>

                  {/* Natural thinking process */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center transition-all duration-500 ${
                          thinkingPhase === 0
                            ? "scale-110 shadow-lg"
                            : "scale-100"
                        }`}
                      >
                        <Brain
                          className={`w-4 h-4 text-white transition-all duration-300 ${
                            thinkingPhase === 0 ? "animate-pulse" : ""
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            Thinking
                          </span>
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                            <div
                              className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.3s" }}
                            ></div>
                            <div
                              className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"
                              style={{ animationDelay: "0.6s" }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {thinkingThought ||
                            "Understanding your question and gathering context..."}
                        </div>
                      </div>
                    </div>

                    {/* Natural processing indicator */}
                    <div
                      className={`flex items-center space-x-3 transition-all duration-500 ${
                        thinkingPhase === 1 ? "opacity-100" : "opacity-75"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center transition-all duration-500 ${
                          thinkingPhase === 1
                            ? "scale-110 shadow-md"
                            : "scale-100"
                        }`}
                      >
                        <SparklesIcon
                          className={`w-3 h-3 text-white transition-all duration-300 ${
                            thinkingPhase === 1 ? "animate-spin" : ""
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">
                            Processing
                          </span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-green-400 rounded-full animate-bounce"></div>
                            <div
                              className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-green-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Analyzing patterns and generating insights...
                        </div>
                      </div>
                    </div>

                    {/* Natural response crafting */}
                    <div
                      className={`flex items-center space-x-3 transition-all duration-500 ${
                        thinkingPhase === 2 ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center transition-all duration-500 ${
                          thinkingPhase === 2
                            ? "scale-110 shadow-md"
                            : "scale-100"
                        }`}
                      >
                        <MessageCircle
                          className={`w-3 h-3 text-white transition-all duration-300 ${
                            thinkingPhase === 2 ? "animate-bounce" : ""
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">
                            Crafting
                          </span>
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
                            <div
                              className="w-1 h-1 bg-pink-400 rounded-full animate-ping"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-1 h-1 bg-purple-400 rounded-full animate-ping"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Formulating a helpful response for you...
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Natural typing indicator */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <Loader2 className="w-3 h-3 text-white animate-spin" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          Almost ready
                        </span>
                        <div className="flex space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="animate-pulse">Just a moment...</span>
                    </div>
                  </div>

                  {/* Natural typing cursor effect */}
                  <div className="flex items-center space-x-2 mt-2 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-4 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Typing</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-ping"></div>
                      <div
                        className="w-1 h-1 bg-gray-400 rounded-full animate-ping"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1 h-1 bg-gray-400 rounded-full animate-ping"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Streaming Response Display */}
          {isStreaming && streamingResponse && (
            <div className="space-y-4">
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
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full font-medium">
                        Streaming...
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500 font-medium">
                        {formatTimestamp(new Date().toISOString())}
                      </span>
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
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
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
                      {streamingResponse}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="mx-3 sm:mx-6 mb-3 sm:mb-4 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl sm:rounded-2xl shadow-lg">
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
                    {error}
                  </p>

                  {/* Premium Subscription Error */}
                  {error.includes("Premium subscription required") && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 mb-2">
                        💡 <strong>Tip:</strong> You can upgrade your
                        subscription to access premium models, or switch to a
                        free model like GPT-4o Mini or DeepSeek R1.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            toast("Upgrade feature coming soon!", {
                              duration: 3000,
                            });
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Upgrade Plan
                        </button>
                        <button
                          onClick={() => {
                            const freeModel = models.find(
                              (m) => !m.requiresPremium
                            );
                            if (freeModel) {
                              handleModelChange(freeModel.id);
                            }
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Switch to Free Model
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Daily Token Limit Error */}
                  {error.includes("Daily token limit exceeded") && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-700 mb-2">
                        ⏰ <strong>Daily Limit Reached:</strong> You've used all
                        your daily tokens for this model. Limits reset at
                        midnight.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            toast("Upgrade feature coming soon!", {
                              duration: 3000,
                            });
                          }}
                          className="px-3 py-1 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          Upgrade for Higher Limits
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const result = await dispatch(fetchTokenUsage());

                              const updatedTokenUsage = result.payload;
                              console.log(
                                "Updated Token Usage:",
                                updatedTokenUsage
                              );
                              console.log("Models:", models);

                              // Find a model with remaining tokens using the updated data
                              const availableModel = models.find((m) => {
                                const usage =
                                  updatedTokenUsage?.modelBreakdown?.find(
                                    (u) => u.model === m.id
                                  );
                                console.log(`Checking model ${m.id}:`, usage);
                                return usage && usage.remaining > 0;
                              });

                              if (availableModel) {
                                console.log("Switching to:", availableModel);
                                handleModelChange(availableModel.id);
                                dispatch(clearError());
                              } else {
                                const freeModel = models.find(
                                  (m) => !m.requiresPremium
                                );
                                if (freeModel) {
                                  console.log(
                                    "Falling back to free model:",
                                    freeModel
                                  );
                                  handleModelChange(freeModel.id);
                                  dispatch(clearError());
                                } else {
                                  toast.error(
                                    "No models with available tokens found. Please try again tomorrow or upgrade your plan.",
                                    {
                                      duration: 5000,
                                    }
                                  );
                                }
                              }
                            } catch (error) {
                              console.error("Error switching models:", error);
                              toast.error(
                                "Failed to switch models. Please try again.",
                                {
                                  duration: 3000,
                                }
                              );
                            }
                          }}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Switch to Available Model
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Rate Limit Error */}
                  {error.includes("Rate limit exceeded") && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700 mb-2">
                        ⚡ <strong>Rate Limit:</strong> You're sending messages
                        too quickly. Please wait a moment before trying again.
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

                  {/* Network Error */}
                  {error.includes("Network connection error") && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-purple-700 mb-2">
                        🌐 <strong>Connection Issue:</strong> Please check your
                        internet connection and try again.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => window.location.reload()}
                          className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Refresh Page
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Authentication Error */}
                  {error.includes("Please log in") && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-xs text-indigo-700 mb-2">
                        🔐 <strong>Authentication Required:</strong> Please log
                        in to use the AI features.
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => (window.location.href = "/auth/login")}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Go to Login
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
                  disabled={isLoading || isStreaming}
                />
              </div>
              <button
                type="submit"
                aria-label="Send message"
                disabled={!message.trim() || isLoading || isStreaming}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Stats */}
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
                  {/* Token Usage Display */}
                  {tokenUsage && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                      <span className="font-medium text-xs sm:text-sm">
                        {tokenUsage.modelBreakdown
                          .find((m) => m.model === currentModel)
                          ?.remaining?.toLocaleString() || 0}{" "}
                        tokens left
                      </span>
                    </div>
                  )}
                  {/* Streaming Status */}
                  <div className="flex items-center space-x-2 text-gray-600">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        useStreaming
                          ? "bg-green-400 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="font-medium text-xs sm:text-sm">
                      {useStreaming ? "Streaming ON" : "Streaming OFF"}
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
