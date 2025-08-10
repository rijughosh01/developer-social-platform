"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { fetchPosts } from "@/store/slices/postsSlice";
import { PostCard } from "@/components/posts/PostCard";
import { CreatePost } from "@/components/posts/CreatePost";
import { Button } from "@/components/ui/button";
import { FiRefreshCw } from "react-icons/fi";

export function Feed() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, error } = useAppSelector((state) => state.posts);

  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchPosts());
  };

  const handlePostUpdate = () => {
    dispatch(fetchPosts());
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <CreatePost />
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Activity</h2>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 w-auto justify-center px-3 py-1.5 text-sm"
        >
          <FiRefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <CreatePost />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12"
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
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No posts yet
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Be the first to share something with the developer community!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostUpdate={handlePostUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}
