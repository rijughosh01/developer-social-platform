'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { AppDispatch } from '@/store';
import { 
  fetchAIContexts, 
  fetchAIStats,
  setCurrentContext 
} from '@/store/slices/aiSlice';
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
  ArrowRight
} from 'lucide-react';
import AIChatbot from '@/components/ai/AIChatbot';
import CodeReviewForm from '@/components/ai/CodeReviewForm';
import DebugForm from '@/components/ai/DebugForm';

const AIPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { contexts, stats, isLoading } = useSelector((state: RootState) => state.ai);
  const { user, isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  


  const [showChatbot, setShowChatbot] = useState(false);
  const [showCodeReview, setShowCodeReview] = useState(false);
  const [showDebugForm, setShowDebugForm] = useState(false);

  useEffect(() => {
    dispatch(fetchAIContexts());
    if (isAuthenticated) {
      dispatch(fetchAIStats());
    }
  }, [dispatch, isAuthenticated]);

  // Refresh stats when they become null (after AI interactions)
  useEffect(() => {
    if (stats === null && isAuthenticated) {
      dispatch(fetchAIStats());
    }
  }, [stats, dispatch, isAuthenticated]);

  const aiFeatures = [
    {
      id: 'chat',
      icon: MessageCircle,
      title: 'AI Chat Assistant',
      description: 'Get instant help with coding questions, explanations, and guidance',
      color: 'from-blue-500 to-purple-600',
      action: () => setShowChatbot(true)
    },
    {
      id: 'codeReview',
      icon: Code,
      title: 'Code Review',
      description: 'Get expert feedback on your code for bugs, performance, and best practices',
      color: 'from-green-500 to-emerald-600',
      action: () => setShowCodeReview(true)
    },
    {
      id: 'debug',
      icon: Bug,
      title: 'Debug Code',
      description: 'Get help fixing errors and debugging issues in your code',
      color: 'from-red-500 to-pink-600',
      action: () => setShowDebugForm(true)
    },
    {
      id: 'learn',
      icon: BookOpen,
      title: 'Learning Assistant',
      description: 'Learn new programming concepts, frameworks, and technologies',
      color: 'from-purple-500 to-indigo-600',
      action: () => {
        dispatch(setCurrentContext('learning'));
        setShowChatbot(true);
      }
    },
    {
      id: 'project',
      icon: Lightbulb,
      title: 'Project Advice',
      description: 'Get guidance on project architecture, tech stack, and best practices',
      color: 'from-orange-500 to-yellow-600',
      action: () => {
        dispatch(setCurrentContext('projectHelp'));
        setShowChatbot(true);
      }
    }
  ];

  const quickPrompts = [
    "How do I implement authentication in React?",
    "What's the difference between let, const, and var?",
    "How to optimize database queries?",
    "Best practices for API design",
    "How to handle errors in async functions?",
    "What is dependency injection?"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">DevLink AI</h1>
                <p className="text-lg text-gray-600">Your AI-powered development assistant</p>
              </div>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get instant help with coding, debugging, learning, and project guidance. 
              Powered by advanced AI to accelerate your development journey.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.requestsToday}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Favorite Context</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{stats.favoriteContext}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.lastUsed ? 'Today' : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Features Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={feature.action}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${feature.color} rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Start */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Quick Chat */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Chat</h3>
            <p className="text-gray-600 mb-4">
              Start a conversation with our AI assistant for instant help.
            </p>
            <button
              onClick={() => setShowChatbot(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Start Chat</span>
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Prompts</h3>
            <p className="text-gray-600 mb-4">
              Try these common questions to get started:
            </p>
            <div className="space-y-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    dispatch(setCurrentContext('general'));
                    setShowChatbot(true);
                  }}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg p-8 shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Need</h3>
              <p className="text-gray-600">
                Select from code review, debugging, learning, or general assistance
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ask Your Question</h3>
              <p className="text-gray-600">
                Describe your problem or paste your code for analysis
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Instant Help</h3>
              <p className="text-gray-600">
                Receive detailed explanations, code examples, and solutions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AIChatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
      
      {showCodeReview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-4">
            <CodeReviewForm onClose={() => setShowCodeReview(false)} />
          </div>
        </div>
      )}
      
      {showDebugForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-4">
            <DebugForm onClose={() => setShowDebugForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPage; 