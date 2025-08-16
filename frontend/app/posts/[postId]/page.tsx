"use client";
import { useEffect, useState } from "react";
import { postsAPI } from "@/lib/api";
import { Post } from "@/types";
import { PostCard } from "@/components/posts/PostCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function PostDetailPage({ params }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (params?.postId) {
        try {
          const res = await postsAPI.getPost(params.postId);
          if (res.data.success) {
            setPost(res.data.data);
          } else {
            setError("Post not found");
          }
        } catch (error) {
          console.error("Error fetching post:", error);
          setError("Failed to load post");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchPost();
  }, [params?.postId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <main className="lg:ml-64 p-0">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-2 text-gray-600">Loading post...</span>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <main className="lg:ml-64 p-0">
          <div className="max-w-6xl mx-auto px-6 py-12">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">404</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h1>
              <p className="text-gray-600">The post you're looking for doesn't exist or has been removed.</p>
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
        <div className="max-w-4xl mx-auto px-6 py-6">
          <PostCard post={post} />
        </div>
      </main>
    </div>
  );
}
