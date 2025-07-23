"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { api } from "@/lib/api";
import {
  FiGitBranch,
  FiEye,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiX,
} from "react-icons/fi";
import Link from "next/link";
import toast from "react-hot-toast";

interface ForkData {
  _id: string;
  title: string;
  description: string;
  code: string;
  codeLanguage: string;
  difficulty: string;
  createdAt: string;
  forkedFrom?: {
    _id: string;
    title: string;
    author: {
      firstName: string;
      lastName: string;
      username: string;
    };
  };
  forks?: {
    _id: string;
    title: string;
    author: {
      firstName: string;
      lastName: string;
      username: string;
    };
    createdAt: string;
  }[];
  likesCount: number;
  copies: number;
}

export function ForkHistory() {
  const { user } = useAppSelector((state) => state.auth);
  const [forkHistory, setForkHistory] = useState<ForkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my-forks" | "forks-of-mine">(
    "all"
  );
  const [selectedFork, setSelectedFork] = useState<ForkData | null>(null);
  const [showForkModal, setShowForkModal] = useState(false);

  useEffect(() => {
    fetchForkHistory();
  }, [filter]);

  const fetchForkHistory = async () => {
    try {
      const response = await api.get(`/posts/fork-history?filter=${filter}`);
      setForkHistory(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch fork history");
    } finally {
      setLoading(false);
    }
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      javascript: "bg-yellow-100 text-yellow-800",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-green-100 text-green-800",
      java: "bg-orange-100 text-orange-800",
      cpp: "bg-purple-100 text-purple-800",
      css: "bg-pink-100 text-pink-800",
      php: "bg-indigo-100 text-indigo-800",
      sql: "bg-teal-100 text-teal-800",
      bash: "bg-gray-100 text-gray-800",
      html: "bg-red-100 text-red-800",
      react: "bg-cyan-100 text-cyan-800",
      node: "bg-emerald-100 text-emerald-800",
    };
    return colors[language.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Fork History</h2>
        <div className="flex gap-2">
          {[
            { value: "all", label: "All Forks" },
            { value: "my-forks", label: "My Forks" },
            { value: "forks-of-mine", label: "Forks of My Code" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                filter === option.value
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Fork Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiGitBranch className="h-8 w-8 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Total Forks</p>
              <p className="text-2xl font-bold text-gray-900">
                {forkHistory.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiUsers className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Collaborators</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  new Set(
                    forkHistory.flatMap(
                      (fork) => fork.forks?.map((f) => f.author.username) || []
                    )
                  ).size
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <FiTrendingUp className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Engagement</p>
              <p className="text-2xl font-bold text-gray-900">
                {forkHistory.reduce(
                  (sum, fork) =>
                    sum + (fork.likesCount || 0) + (fork.copies || 0),
                  0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fork List */}
      <div className="space-y-4">
        {forkHistory.length === 0 ? (
          <div className="text-center py-12">
            <FiGitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No forks found
            </h3>
            <p className="text-gray-500">
              {filter === "all"
                ? "You don't have any fork activity yet."
                : `No ${filter.replace("-", " ")} found.`}
            </p>
          </div>
        ) : (
          forkHistory.map((fork) => (
            <div
              key={fork._id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {fork.title}
                    </h3>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getLanguageColor(
                        fork.codeLanguage
                      )}`}
                    >
                      {fork.codeLanguage}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                        fork.difficulty
                      )}`}
                    >
                      {fork.difficulty.charAt(0).toUpperCase() +
                        fork.difficulty.slice(1)}
                    </span>
                  </div>

                  {fork.description && (
                    <p className="text-gray-600 mb-3">{fork.description}</p>
                  )}

                  {fork.forkedFrom && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Forked from:</span>{" "}
                        {fork.forkedFrom.title} by{" "}
                        {fork.forkedFrom.author.firstName}{" "}
                        {fork.forkedFrom.author.lastName}
                      </p>
                    </div>
                  )}

                  {fork.forks && fork.forks.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-green-800 mb-2">
                        <span className="font-medium">
                          Forked by {fork.forks.length} users:
                        </span>
                      </p>
                      <div className="space-y-1">
                        {fork.forks.slice(0, 3).map((forkItem) => (
                          <p
                            key={forkItem._id}
                            className="text-xs text-green-700"
                          >
                            • {forkItem.author.firstName}{" "}
                            {forkItem.author.lastName} -{" "}
                            {new Date(forkItem.createdAt).toLocaleDateString()}
                          </p>
                        ))}
                        {fork.forks.length > 3 && (
                          <p className="text-xs text-green-700">
                            ... and {fork.forks.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiClock className="h-4 w-4" />
                      <span>
                        {new Date(fork.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>❤️ {fork.likesCount || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📋 {fork.copies || 0} copies</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedFork(fork);
                      setShowForkModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    <FiEye className="h-4 w-4" />
                    View Code
                  </button>
                  <Link
                    href={`/posts/${fork._id}`}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    View Post
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fork Code Modal */}
      {showForkModal && selectedFork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Fork Code: {selectedFork.title}
              </h3>
              <button
                onClick={() => setShowForkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Code</h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{selectedFork.code}</code>
                  </pre>
                </div>
              </div>

              {selectedFork.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700">
                      {selectedFork.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  href={`/posts/${selectedFork._id}`}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 text-center"
                >
                  View Full Post
                </Link>
                <button
                  onClick={() => setShowForkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
