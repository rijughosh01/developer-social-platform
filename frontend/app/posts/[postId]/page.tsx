"use client";
import { useEffect, useState } from "react";
import { postsAPI } from "@/lib/api";
import { Post } from "@/types";
import { PostCard } from "@/components/posts/PostCard";

export default function PostDetailPage({ params }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (params?.postId) {
        const res = await postsAPI.getPost(params.postId);
        setPost(res.data.data);
        setLoading(false);
      }
    };
    fetchPost();
  }, [params?.postId]);

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading post...</div>;
  if (!post)
    return <div className="p-8 text-center text-red-500">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <PostCard post={post} />
    </div>
  );
}
