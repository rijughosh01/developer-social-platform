"use client";

import { useState } from "react";
import { ReviewDashboard } from "@/components/dashboard/ReviewDashboard";
import { ForkHistory } from "@/components/dashboard/ForkHistory";
import { CollaborationAnalytics } from "@/components/dashboard/CollaborationAnalytics";
import {
  FiMessageSquare,
  FiGitBranch,
  FiUsers,
  FiTrendingUp,
  FiBarChart,
} from "react-icons/fi";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function CollaborationPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "forks" | "analytics">(
    "reviews"
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <DashboardSidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Collaboration Hub
              </h1>
              <p className="text-gray-600">
                Manage code reviews, track fork history, and collaborate with
                other developers
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "reviews"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FiMessageSquare className="h-5 w-5" />
                      Code Reviews
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("forks")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "forks"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FiGitBranch className="h-5 w-5" />
                      Fork History
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("analytics")}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "analytics"
                        ? "border-primary-500 text-primary-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FiBarChart className="h-5 w-5" />
                      Analytics
                    </div>
                  </button>
                </nav>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow">
              {activeTab === "reviews" ? (
                <div className="p-6">
                  <ReviewDashboard />
                </div>
              ) : activeTab === "forks" ? (
                <div className="p-6">
                  <ForkHistory />
                </div>
              ) : (
                <div className="p-6">
                  <CollaborationAnalytics />
                </div>
              )}
            </div>

            {/* Collaboration Tips */}
            <div className="mt-8 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                💡 Collaboration Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Code Reviews
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Be constructive and specific in your feedback</li>
                    <li>• Focus on code quality and best practices</li>
                    <li>• Respond promptly to review requests</li>
                    <li>• Use the rating system to indicate priority</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Forking Code
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Add meaningful descriptions to your forks</li>
                    <li>• Credit the original author when appropriate</li>
                    <li>• Share improvements back to the community</li>
                    <li>• Track your fork history for learning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
