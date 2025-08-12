"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { api } from "@/lib/api";
import {
  FiTrendingUp,
  FiUsers,
  FiGitBranch,
  FiMessageSquare,
  FiStar,
  FiClock,
  FiGift,
} from "react-icons/fi";


interface AnalyticsData {
  totalReviews: number;
  completedReviews: number;
  pendingReviews: number;
  totalForks: number;
  forksReceived: number;
  forksCreated: number;
  collaborationScore: number;
  averageResponseTime: number;
  topCollaborators: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    collaborationCount: number;
  }>;
  languageStats: Array<{
    language: string;
    count: number;
    percentage: number;
  }>;
  monthlyActivity: Array<{
    month: string;
    reviews: number;
    forks: number;
  }>;
  badges: Array<{
    name: string;
    description: string;
    earned: boolean;
    icon: string;
  }>;
}

export function CollaborationAnalytics() {
  const { user } = useAppSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(
        `/analytics/collaboration?timeRange=${timeRange}`
      );
      setAnalytics(response.data.data);
    } catch (err) {
      console.error("Failed to fetch collaboration analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCollaborationLevel = (score: number) => {
    if (score >= 90)
      return { level: "Expert", color: "text-purple-600", bg: "bg-purple-100" };
    if (score >= 70)
      return { level: "Advanced", color: "text-blue-600", bg: "bg-blue-100" };
    if (score >= 50)
      return {
        level: "Intermediate",
        color: "text-green-600",
        bg: "bg-green-100",
      };
    if (score >= 30)
      return {
        level: "Beginner",
        color: "text-yellow-600",
        bg: "bg-yellow-100",
      };
    return { level: "New", color: "text-gray-600", bg: "bg-gray-100" };
  };

  const getBadgeIcon = (badgeName: string) => {
    switch (badgeName.toLowerCase()) {
      case "review master":
        return <FiMessageSquare className="h-6 w-6" />;
      case "fork champion":
        return <FiGitBranch className="h-6 w-6" />;
      case "quick responder":
        return <FiClock className="h-6 w-6" />;
      case "team player":
        return <FiUsers className="h-6 w-6" />;
      case "trending":
        return <FiTrendingUp className="h-6 w-6" />;
      default:
        return <FiGift className="h-6 w-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <FiTrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No analytics available
        </h3>
        <p className="text-gray-500">
          Start collaborating to see your analytics!
        </p>
      </div>
    );
  }

  const collaborationLevel = getCollaborationLevel(
    analytics.collaborationScore
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Collaboration Analytics
        </h2>
        <div className="flex gap-2">
          {["week", "month", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                timeRange === range
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Collaboration Score */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Collaboration Score
            </h3>
            <p className="text-sm text-gray-600">
              Your overall collaboration performance
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary-600">
              {analytics.collaborationScore}
            </div>
            <div className={`text-sm font-medium ${collaborationLevel.color}`}>
              {collaborationLevel.level}
            </div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${analytics.collaborationScore}%` }}
          ></div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiMessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalReviews}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {analytics.completedReviews} completed, {analytics.pendingReviews}{" "}
            pending
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiGitBranch className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Forks</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.totalForks}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {analytics.forksCreated} created, {analytics.forksReceived} received
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiClock className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.averageResponseTime}h
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Average time to respond to reviews
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiUsers className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Collaborators</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.topCollaborators.length}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Active collaboration partners
          </div>
        </div>
      </div>

      {/* Top Collaborators */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Collaborators
        </h3>
        <div className="space-y-3">
          {analytics.topCollaborators.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No collaborators yet
            </p>
          ) : (
            analytics.topCollaborators.map((collaborator, index) => (
              <div
                key={collaborator._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                    {collaborator.avatar ? (
                      <img
                        src={collaborator.avatar}
                        alt={`${collaborator.firstName} ${collaborator.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${collaborator.avatar ? 'hidden' : ''} w-8 h-8 flex items-center justify-center text-white text-xs font-semibold`}>
                      {collaborator.firstName?.charAt(0)}
                      {collaborator.lastName?.charAt(0)}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {collaborator.firstName} {collaborator.lastName}
                    </p>
                    <p 
                      className="text-sm text-gray-500 hover:text-primary-600 hover:underline cursor-pointer transition-colors"
                      onClick={() => {
                        // Navigate to collaborator's profile
                        window.location.href = `/profile/${collaborator.username}`;
                      }}
                      title={`View ${collaborator.username}'s profile`}
                    >
                      @{collaborator.username}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {collaborator.collaborationCount}
                  </p>
                  <p className="text-xs text-gray-500">collaborations</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Language Distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Language Distribution
        </h3>
        <div className="space-y-3">
          {analytics.languageStats.map((stat) => (
            <div
              key={stat.language}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary-600 rounded"></div>
                <span className="font-medium text-gray-900">
                  {stat.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600">{stat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Collaboration Badges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.badges.map((badge) => (
            <div
              key={badge.name}
              className={`p-4 rounded-lg border-2 ${
                badge.earned
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    badge.earned
                      ? "bg-primary-600 text-white"
                      : "bg-gray-300 text-gray-500"
                  }`}
                >
                  {getBadgeIcon(badge.name)}
                </div>
                <div>
                  <h4
                    className={`font-medium ${
                      badge.earned ? "text-primary-900" : "text-gray-500"
                    }`}
                  >
                    {badge.name}
                  </h4>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
