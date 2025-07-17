"use client";
import { useEffect, useState } from 'react';
import { postsAPI } from '@/lib/api';
import { Post } from '@/types';

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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading post...</div>;
  if (!post) return <div className="p-8 text-center text-red-500">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6 mt-8">
      <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
      <div className="mb-4 text-gray-700 whitespace-pre-line">{post.content}</div>
      {post.image && (
        <img src={post.image} alt="Post" className="w-full rounded-lg object-cover max-h-96 mb-4" />
      )}
      <div className="flex items-center gap-6 text-gray-500 text-sm border-t pt-4 mt-4">
        <span>👍 {post.likesCount || 0}</span>
        <span>💬 {post.commentsCount || 0}</span>
      </div>
    </div>
  );
} 