"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { fetchPosts } from "@/store/slices/postsSlice";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { FiRefreshCw, FiFilter, FiArrowDown, FiSearch } from "react-icons/fi";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

// Language options for filtering
const languageOptions = [
  { value: "all", label: "All Languages" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "css", label: "CSS" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "html", label: "HTML" },
  { value: "react", label: "React" },
  { value: "node", label: "Node.js" },
];

// Difficulty options for filtering
const difficultyOptions = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "🌱 Beginner" },
  { value: "intermediate", label: "🚀 Intermediate" },
  { value: "advanced", label: "⚡ Advanced" },
];

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "mostLiked", label: "Most Liked" },
  { value: "mostCommented", label: "Most Commented" },
  { value: "trending", label: "Trending" },
];

export default function CodeFeedPage() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, error } = useAppSelector((state) => state.posts);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  // Filter and sort state
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPosts());
    }
  }, [dispatch, isAuthenticated]);

  const handleRefresh = () => {
    dispatch(fetchPosts());
  };

  // Filter and sort code posts
  const getFilteredAndSortedPosts = () => {
    let filteredPosts = posts.filter((post: any) => post.type === "code");

    // Filter by language
    if (selectedLanguage !== "all") {
      filteredPosts = filteredPosts.filter(
        (post: any) =>
          post.codeLanguage?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filteredPosts = filteredPosts.filter((post: any) => {
        const difficulty = getDifficultyLevel(post);
        return difficulty === selectedDifficulty;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post: any) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.code?.toLowerCase().includes(query) ||
          post.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Sort posts
    switch (selectedSort) {
      case "newest":
        filteredPosts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        filteredPosts.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "mostLiked":
        filteredPosts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case "mostCommented":
        filteredPosts.sort(
          (a, b) => (b.commentsCount || 0) - (a.commentsCount || 0)
        );
        break;
      case "trending":
        // Simple trending algorithm: likes + comments + recency
        filteredPosts.sort((a, b) => {
          const aScore =
            (a.likesCount || 0) +
            (a.commentsCount || 0) * 2 +
            Math.max(
              0,
              7 -
                Math.floor(
                  (Date.now() - new Date(a.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            );
          const bScore =
            (b.likesCount || 0) +
            (b.commentsCount || 0) * 2 +
            Math.max(
              0,
              7 -
                Math.floor(
                  (Date.now() - new Date(b.createdAt).getTime()) /
                    (1000 * 60 * 60 * 24)
                )
            );
          return bScore - aScore;
        });
        break;
    }

    return filteredPosts;
  };

  // Get difficulty level function
  const getDifficultyLevel = (post: any) => {
    if (post.difficulty) return post.difficulty;

    // Auto-detect difficulty based on code complexity
    const code = post.code || "";
    const lines = code.split("\n").length;
    const hasFunctions = /function|=>|class/.test(code);
    const hasLoops = /for|while|forEach|map/.test(code);
    const hasConditionals = /if|else|switch/.test(code);

    if (lines > 50 || (hasFunctions && hasLoops && hasConditionals))
      return "advanced";
    if (lines > 20 || hasFunctions || hasLoops) return "intermediate";
    return "beginner";
  };

  const filteredPosts = getFilteredAndSortedPosts();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Header with Search and Refresh */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Code Feed</h2>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search code posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <FiFilter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>

                {showFilters && (
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Programming language"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {languageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <select
                      aria-label="Difficulty level"
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {difficultyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <FiArrowDown className="h-4 w-4 text-gray-400" />
                <select
                  aria-label="Sort by"
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Summary */}
            {filteredPosts.length > 0 && (
              <div className="text-sm text-gray-600">
                Showing {filteredPosts.length} code post
                {filteredPosts.length !== 1 ? "s" : ""}
                {selectedLanguage !== "all" &&
                  ` in ${
                    languageOptions.find((l) => l.value === selectedLanguage)
                      ?.label
                  }`}
                {selectedDifficulty !== "all" &&
                  ` at ${
                    difficultyOptions.find(
                      (d) => d.value === selectedDifficulty
                    )?.label
                  }`}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-white rounded-lg shadow p-6">Loading...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || selectedLanguage !== "all"
                      ? "No matching code posts"
                      : "No code posts yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || selectedLanguage !== "all"
                      ? "Try adjusting your search or filters."
                      : "Be the first to share code with the developer community!"}
                  </p>
                  {(searchQuery ||
                    selectedLanguage !== "all" ||
                    selectedDifficulty !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedLanguage("all");
                        setSelectedDifficulty("all");
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}