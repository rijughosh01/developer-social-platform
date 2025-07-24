"use client";

import { useEffect, useState } from "react";
import { postsAPI } from "@/lib/api";
import { PostCard } from "@/components/posts/PostCard";
import Link from "next/link";

export function RecentActivityFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const res = await postsAPI.getPosts({ limit: 1 });
        setPosts(res.data.data);
      } catch (e) {
        setPosts([]);
      }
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <Link
            href="/code-feed"
            className="text-primary-600 hover:underline text-sm font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-6">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : posts.length === 0 ? (
            <div className="text-gray-500">No recent posts yet.</div>
          ) : (
            posts.map((post) => <PostCard key={post._id} post={post} />)
          )}
        </div>
      </div>
    </section>
  );
}
