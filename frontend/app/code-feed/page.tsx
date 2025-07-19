"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { fetchPosts } from "@/store/slices/postsSlice";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { FiRefreshCw } from "react-icons/fi";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function CodeFeedPage() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, error } = useAppSelector((state) => state.posts);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
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

  const codePosts = posts.filter((post) => post.type === "code");

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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Code Feed</h2>
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
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-white rounded-lg shadow p-6">Loading...</div>
              ) : codePosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No code posts yet</h3>
                  <p className="text-gray-500 mb-4">
                    Be the first to share code with the developer community!
                  </p>
                </div>
              ) : (
                codePosts.map((post) => (
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