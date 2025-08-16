"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { searchAPI } from "@/lib/api";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { FiUsers, FiFolder, FiFileText, FiMessageSquare, FiSearch } from "react-icons/fi";
import { getAvatarUrl } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setIsLoading(true);
    setError(null);
    setResults(null);
    
    try {
      const response = await searchAPI.search({ q: query, limit: 20 });
      if (response.data.success) {
        setResults(response.data.data);
      } else {
        setError("Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <main className="lg:ml-64 p-0">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center">
              <FiSearch className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Search</h1>
              <p className="text-gray-600">Enter a search query to find developers, projects, posts, and discussions.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Search Results for "{query}"
            </h1>
            {isLoading && (
              <p className="text-gray-600">Searching...</p>
            )}
            {error && (
              <p className="text-red-600">Error: {error}</p>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2 text-gray-600">Searching...</span>
            </div>
          ) : results ? (
            <div className="space-y-8">
              {/* Users */}
              {results.users && results.users.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiUsers className="h-5 w-5 mr-2 text-blue-500" />
                      Users ({results.counts.users})
                    </h2>
                    <Link
                      href={`/developers?search=${encodeURIComponent(query)}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View all users
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.users.map((user: any) => (
                      <Link
                        key={user._id}
                        href={`/profile/${user.username}`}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={getAvatarUrl(user)}
                            alt={user.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username}
                            </div>
                            {user.skills && user.skills.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                {user.skills.slice(0, 3).join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {results.projects && results.projects.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiFolder className="h-5 w-5 mr-2 text-green-500" />
                      Projects ({results.counts.projects})
                    </h2>
                    <Link
                      href={`/projects?search=${encodeURIComponent(query)}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View all projects
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.projects.map((project: any) => (
                      <Link
                        key={project._id}
                        href={`/projects/${project._id}`}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-gray-900 mb-2">
                          {project.title}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          by @{project.owner.username}
                        </div>
                        <div className="text-xs text-gray-400">
                          {project.category} • {project.status}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts */}
              {results.posts && results.posts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiFileText className="h-5 w-5 mr-2 text-purple-500" />
                      Posts ({results.counts.posts})
                    </h2>
                    <Link
                      href={`/code-feed?search=${encodeURIComponent(query)}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View all posts
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.posts.map((post: any) => (
                      <Link
                        key={post._id}
                        href={`/posts/${post._id}`}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-gray-900 mb-2">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          by @{post.author.username}
                        </div>
                        <div className="text-xs text-gray-400">
                          {post.category} • {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussions */}
              {results.discussions && results.discussions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiMessageSquare className="h-5 w-5 mr-2 text-orange-500" />
                      Discussions ({results.counts.discussions})
                    </h2>
                    <Link
                      href={`/discussions?search=${encodeURIComponent(query)}`}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      View all discussions
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.discussions.map((discussion: any) => (
                      <Link
                        key={discussion._id}
                        href={`/discussions/${discussion._id}`}
                        className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-gray-900 mb-2">
                          {discussion.title}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">
                          by @{discussion.author.username}
                        </div>
                        <div className="text-xs text-gray-400">
                          {discussion.category} • {discussion.status}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {(!results.users || results.users.length === 0) &&
               (!results.projects || results.projects.length === 0) &&
               (!results.posts || results.posts.length === 0) &&
               (!results.discussions || results.discussions.length === 0) && (
                <div className="text-center py-12">
                  <FiSearch className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search terms or browse our categories.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
