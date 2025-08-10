"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import {
  fetchAIContexts,
  fetchAIStats,
  setCurrentContext,
} from "@/store/slices/aiSlice";
import {
  Bot,
  Code,
  Bug,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Zap,
  TrendingUp,
  Users,
  Clock,
  Star,
  ArrowRight,
  Sparkles,
  Brain,
  Cpu,
  ChevronRight,
  Play,
  Target,
  CheckCircle,
} from "lucide-react";
import AIChatbot from "@/components/ai/AIChatbot";
import CodeReviewForm from "@/components/ai/CodeReviewForm";
import DebugForm from "@/components/ai/DebugForm";

const AIPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { contexts, stats, isLoading } = useSelector(
    (state: RootState) => state.ai
  );
  const { user, isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );

  const [showChatbot, setShowChatbot] = useState(false);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [showDebugForm, setShowDebugForm] = useState(false);

  useEffect(() => {
    dispatch(fetchAIContexts());
    if (isAuthenticated) {
      dispatch(fetchAIStats());
    }
  }, [dispatch, isAuthenticated]);

  // Refresh stats when they become null
  useEffect(() => {
    if (stats === null && isAuthenticated) {
      dispatch(fetchAIStats());
    }
  }, [stats, dispatch, isAuthenticated]);

  const aiFeatures = [
    {
      id: "chat",
      icon: MessageCircle,
      title: "AI Chat Assistant",
      description:
        "Get instant help with coding questions, explanations, and guidance",
      color: "from-blue-500 to-purple-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      action: () => setShowChatbot(true),
    },
    {
      id: "codeReview",
      icon: Code,
      title: "Code Review",
      description:
        "Get expert feedback on your code for bugs, performance, and best practices",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      action: () => setShowCodeReview(true),
    },
    {
      id: "debug",
      icon: Bug,
      title: "Debug Code",
      description: "Get help fixing errors and debugging issues in your code",
      color: "from-red-500 to-pink-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      action: () => setShowDebugForm(true),
    },
    {
      id: "learn",
      icon: BookOpen,
      title: "Learning Assistant",
      description:
        "Learn new programming concepts, frameworks, and technologies",
      color: "from-purple-500 to-indigo-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      action: () => {
        dispatch(setCurrentContext("learning"));
        setShowChatbot(true);
      },
    },
    {
      id: "project",
      icon: Lightbulb,
      title: "Project Advice",
      description:
        "Get guidance on project architecture, tech stack, and best practices",
      color: "from-orange-500 to-amber-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      action: () => {
        dispatch(setCurrentContext("projectHelp"));
        setShowChatbot(true);
      },
    },
  ];

  const quickPrompts = [
    "How do I implement authentication in React?",
    "What's the difference between let, const, and var?",
    "How to optimize database queries?",
    "Best practices for API design",
    "How to handle errors in async functions?",
    "What is dependency injection?",
  ];

  const howItWorksSteps = [
    {
      number: 1,
      icon: Target,
      title: "Choose Your Need",
      description:
        "Select from code review, debugging, learning, or general assistance",
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: 2,
      icon: MessageCircle,
      title: "Ask Your Question",
      description: "Describe your problem or paste your code for analysis",
      color: "from-emerald-500 to-teal-500",
    },
    {
      number: 3,
      icon: CheckCircle,
      title: "Get Instant Help",
      description:
        "Receive detailed explanations, code examples, and solutions",
      color: "from-purple-500 to-indigo-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header  */}
      <div className="relative bg-white/80 backdrop-blur-xl shadow-soft border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6 space-y-4 sm:space-y-0">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-lg sm:mr-6">
                  <Bot className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  DevLink AI
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mt-2">
                  Your AI-powered development assistant
                </p>
              </div>
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed px-4 sm:px-0">
              Get instant help with coding, debugging, learning, and project
              guidance. Powered by advanced AI to accelerate your development
              journey.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12 animate-slide-in-up">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hover-lift">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.totalRequests}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hover-lift">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Today's Requests
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.requestsToday}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hover-lift">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Favorite Context
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 capitalize">
                    {stats.favoriteContext}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-3 sm:p-6 hover-lift">
              <div className="flex items-center">
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-2 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Last Used
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.lastUsed ? "Today" : "Never"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Features Grid  */}
        <div className="mb-12 sm:mb-16 animate-slide-in-up">
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              AI Features
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {aiFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-4 sm:p-6 hover-lift cursor-pointer group"
                  onClick={feature.action}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${feature.color} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3 group-hover:text-blue-600 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 animate-slide-in-up">
          {/* Quick Chat */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-6 sm:p-8 hover-lift">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Quick Chat
              </h3>
            </div>
            <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              Start a conversation with our AI assistant for instant help with
              any coding question or problem.
            </p>
            <button
              onClick={() => setShowChatbot(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold text-sm sm:text-base"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Start Chat</span>
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-6 sm:p-8 hover-lift">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                Quick Prompts
              </h3>
            </div>
            <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              Try these common questions to get started with AI assistance:
            </p>
            <div className="space-y-2 sm:space-y-3">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    dispatch(setCurrentContext("general"));
                    setShowChatbot(true);
                  }}
                  className="w-full text-left p-3 sm:p-4 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200 font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-soft border border-white/20 p-6 sm:p-12 animate-slide-in-up">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                How It Works
              </h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-lg max-w-2xl mx-auto px-4 sm:px-0">
              Get started with DevLink AI in just three simple steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="text-center group"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div
                    className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${step.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white font-bold text-xs sm:text-sm">
                    {step.number}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base px-2 sm:px-0">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AIChatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />

      {showCodeReview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-4">
            <CodeReviewForm onClose={() => setShowCodeReview(false)} />
          </div>
        </div>
      )}

      {showDebugForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-4">
            <DebugForm onClose={() => setShowDebugForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPage;
