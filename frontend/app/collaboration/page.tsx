"use client";

import { useEffect, useMemo, useState } from "react";
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

  // Restore active tab from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as any;
    if (tab === "forks" || tab === "analytics" || tab === "reviews")
      setActiveTab(tab);
  }, []);
  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("tab", activeTab);
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `/collaboration?${qs}` : "/collaboration"
    );
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 pt-0 pb-0 overflow-y-auto border-r border-gray-200 bg-white z-10">
        <DashboardSidebar />
      </aside>
      <main className="lg:ml-64 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-1">
                  Collaboration Hub
                </h1>
                <p className="text-white/90">
                  Manage code reviews, track forks, and collaborate with
                  developers.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-2">
              <nav className="flex gap-2">
                <TabButton
                  label="Code Reviews"
                  icon={<FiMessageSquare className="h-4 w-4" />}
                  active={activeTab === "reviews"}
                  onClick={() => setActiveTab("reviews")}
                />
                <TabButton
                  label="Fork History"
                  icon={<FiGitBranch className="h-4 w-4" />}
                  active={activeTab === "forks"}
                  onClick={() => setActiveTab("forks")}
                />
                <TabButton
                  label="Analytics"
                  icon={<FiBarChart className="h-4 w-4" />}
                  active={activeTab === "analytics"}
                  onClick={() => setActiveTab("analytics")}
                />
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
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
          <div className="mt-8 bg-gradient-to-r from-indigo-50 to-sky-50 rounded-xl p-6 border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💡 Collaboration Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Code Reviews</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be constructive and specific in your feedback</li>
                  <li>• Focus on code quality and best practices</li>
                  <li>• Respond promptly to review requests</li>
                  <li>• Use the rating system to indicate priority</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Forking Code</h4>
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
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
