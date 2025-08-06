"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import {
  fetchDiscussions,
  fetchCategories,
  fetchTags,
  setFilters,
  clearFilters,
} from "@/store/slices/discussionsSlice";
import { DiscussionCard } from "@/components/discussions/DiscussionCard";
import { DiscussionFilters } from "@/components/discussions/DiscussionFilters";
import { CreateDiscussionButton } from "@/components/discussions/CreateDiscussionButton";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Clock,
  ThumbsUp,
  Search,
  Filter,
  X,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { SiXdadevelopers } from "react-icons/si";

export default function DiscussionsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { discussions, categories, tags, filters, isLoading, pagination } =
    useAppSelector((state) => state.discussions);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchTags());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDiscussions(filters));
  }, [dispatch, filters]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchQuery, page: 1 }));
  };

  const handleSortChange = (sort: string) => {
    dispatch(setFilters({ sort, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    dispatch(setFilters({ category, page: 1 }));
  };

  const handleTagChange = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    dispatch(setFilters({ tags: newTags, page: 1 }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchQuery("");
  };

  const handleRefresh = () => {
    dispatch(fetchDiscussions(filters));
  };

  const loadMore = () => {
    if (pagination.page < pagination.pages) {
      dispatch(setFilters({ page: pagination.page + 1 }));
    }
  };

  const sortOptions = [
    {
      value: "lastActivity",
      label: "Latest Activity",
      icon: Clock,
      description: "Most recent discussions",
    },
    {
      value: "voteScore",
      label: "Most Voted",
      icon: ThumbsUp,
      description: "Highest rated content",
    },
    {
      value: "commentCount",
      label: "Most Comments",
      icon: SiXdadevelopers,
      description: "Most engaging discussions",
    },
    {
      value: "views",
      label: "Most Views",
      icon: TrendingUp,
      description: "Most popular discussions",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <SiXdadevelopers className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Developer Discussions
                </h1>
              </div>
              <p className="text-blue-100 text-sm sm:text-lg max-w-2xl">
                Join the conversation with developers around the world. Share
                knowledge, ask questions, and build connections.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 pt-2">
                <div className="flex items-center space-x-2 text-blue-100">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Active Community</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm">Real-time Updates</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm">Quality Content</span>
                </div>
              </div>
            </div>
            {isClient && isAuthenticated && (
              <div className="flex-shrink-0">
                <CreateDiscussionButton />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Search */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span>Search Discussions</span>
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  />
                  <Button
                    onClick={handleSearch}
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Sort Options */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sort By
                </h3>
                <div className="space-y-2">
                  {sortOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full flex items-start space-x-3 p-3 rounded-xl text-sm transition-all duration-200 ${
                          filters.sort === option.value
                            ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                            : "text-gray-700 hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 mt-0.5 ${
                            filters.sort === option.value
                              ? "text-blue-600"
                              : "text-gray-400"
                          }`}
                        />
                        <div className="text-left">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                            {option.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Categories
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                      !filters.category
                        ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                        filters.category === category.id
                          ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                          : "text-gray-700 hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 12).map((tag) => (
                    <button
                      key={tag.tag}
                      onClick={() => handleTagChange(tag.tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        filters.tags?.includes(tag.tag)
                          ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                      }`}
                    >
                      {tag.tag} ({tag.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header with Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Discussions
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {discussions.length} discussions • {pagination.total || 0}{" "}
                    total
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 border-gray-200 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Filters Toggle */}
            <div className="lg:hidden mb-6">
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="w-full border-gray-200 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Filters
                  </h3>
                  <Button
                    onClick={() => setShowFilters(false)}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <DiscussionFilters
                  categories={categories}
                  tags={tags}
                  filters={filters}
                  onCategoryChange={handleCategoryChange}
                  onTagChange={handleTagChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            )}

            {/* Active Filters */}
            {(filters.category || filters.tags?.length || filters.search) && (
              <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <span className="text-sm font-medium text-gray-700">
                      Active filters:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {filters.category && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-700 border border-blue-200">
                          {
                            categories.find((c) => c.id === filters.category)
                              ?.name
                          }
                          <button
                            onClick={() => handleCategoryChange("")}
                            className="ml-2 hover:text-blue-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      {filters.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700 border border-green-200"
                        >
                          {tag}
                          <button
                            onClick={() => handleTagChange(tag)}
                            className="ml-2 hover:text-green-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {filters.search && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-purple-100 text-purple-700 border border-purple-200">
                          "{filters.search}"
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              dispatch(setFilters({ search: "" }));
                            }}
                            className="ml-2 hover:text-purple-900"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleClearFilters}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-800 self-start sm:self-auto"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {/* Discussions List */}
            <div className="space-y-4">
              {isLoading && pagination.page === 1 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">
                      Loading discussions...
                    </span>
                  </div>
                </div>
              ) : discussions.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <SiXdadevelopers className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No discussions found
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {filters.category || filters.tags?.length || filters.search
                      ? "Try adjusting your filters or search terms to find more discussions."
                      : "Be the first to start a discussion and help build our community!"}
                  </p>
                  {isClient && isAuthenticated && <CreateDiscussionButton />}
                </div>
              ) : (
                <>
                  {discussions.map((discussion) => (
                    <DiscussionCard
                      key={discussion._id}
                      discussion={discussion}
                    />
                  ))}

                  {/* Load More */}
                  {pagination.page < pagination.pages && (
                    <div className="text-center pt-8">
                      <Button
                        onClick={loadMore}
                        variant="outline"
                        disabled={isLoading}
                        className="px-8 py-3 border-gray-200 hover:bg-gray-50"
                      >
                        {isLoading ? "Loading..." : "Load More Discussions"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
