"use client";

import { useState } from "react";
import Link from "next/link";
import { Discussion } from "@/types";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Tag,
  Hash,
  Sparkles,
  BookOpen,
  Zap,
  TrendingUp,
  Users as UsersIcon,
  Award,
  Clock,
  User,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";
import { savedAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface SavedDiscussionCardProps {
  discussion: Discussion;
  onUnsave?: () => void;
}

export function SavedDiscussionCard({ discussion, onUnsave }: SavedDiscussionCardProps) {
  const [isBookmarking, setIsBookmarking] = useState(false);

  const handleBookmark = async () => {
    setIsBookmarking(true);
    try {
      await savedAPI.unsaveDiscussion(discussion._id);
      toast.success("Discussion removed from bookmarks!");
      if (onUnsave) {
        onUnsave();
      }
    } catch (error) {
      console.error("Failed to unsave discussion:", error);
      toast.error("Failed to remove discussion from bookmarks");
    } finally {
      setIsBookmarking(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-slate-100 text-slate-700 border-slate-200",
      help: "bg-blue-100 text-blue-700 border-blue-200",
      discussion: "bg-purple-100 text-purple-700 border-purple-200",
      showcase: "bg-emerald-100 text-emerald-700 border-emerald-200",
      question: "bg-amber-100 text-amber-700 border-amber-200",
      tutorial: "bg-indigo-100 text-indigo-700 border-indigo-200",
      news: "bg-red-100 text-red-700 border-red-200",
      meta: "bg-pink-100 text-pink-700 border-pink-200",
      "off-topic": "bg-orange-100 text-orange-700 border-orange-200",
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      general: Hash,
      help: BookOpen,
      discussion: MessageSquare,
      showcase: Sparkles,
      question: Zap,
      tutorial: BookOpen,
      news: TrendingUp,
      meta: UsersIcon,
      "off-topic": Hash,
    };
    return icons[category as keyof typeof icons] || Hash;
  };

  const CategoryIcon = getCategoryIcon(discussion.category);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-sm">
            {discussion.author ? (
              <img
                src={getAvatarUrl(discussion.author)}
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">
              {discussion.author
                ? `${discussion.author.firstName || "Unknown"} ${
                    discussion.author.lastName || "User"
                  }`
                : "Unknown User"}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                {formatDistanceToNow(new Date(discussion.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleBookmark}
          disabled={isBookmarking}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2 border-red-200 hover:bg-red-50 text-red-600"
        >
          <Bookmark className="h-4 w-4 fill-current" />
          <span className="hidden sm:inline">
            {isBookmarking ? "..." : "Unsave"}
          </span>
        </Button>
      </div>

      {/* Category and Status */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div
          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-semibold border ${getCategoryColor(
            discussion.category
          )}`}
        >
          <CategoryIcon className="h-4 w-4" />
          <span className="capitalize">{discussion.category}</span>
        </div>
        {discussion.isSticky && (
          <div className="flex items-center space-x-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold border border-amber-200">
            <span>📌 Pinned</span>
          </div>
        )}
        {discussion.isFeatured && (
          <div className="flex items-center space-x-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
            <span>⭐ Featured</span>
          </div>
        )}
        {discussion.acceptedAnswer && (
          <div className="flex items-center space-x-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200">
            <Award className="h-4 w-4" />
            <span>Answered</span>
          </div>
        )}
      </div>

      {/* Title and Full Content */}
      <div className="mb-4">
        <h3 
          className="text-lg font-bold text-gray-900 mb-3 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => window.location.href = `/discussions/${discussion._id}`}
        >
          {discussion.title}
        </h3>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
            {discussion.content}
          </p>
        </div>
      </div>

      {/* Tags */}
      {discussion.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {discussion.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200"
            >
              <Tag className="h-3 w-3" />
              <span>{tag}</span>
            </span>
          ))}
        </div>
      )}

      {/* Stats and Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="h-4 w-4" />
            <span>{discussion.upvotes?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageSquare className="h-4 w-4" />
            <span>{discussion.comments?.length || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{discussion.views}</span>
          </div>
        </div>

        <Button
          onClick={() => window.location.href = `/discussions/${discussion._id}`}
          variant="outline"
          size="sm"
          className="border-gray-200 hover:bg-gray-50"
        >
          View Discussion
        </Button>
      </div>
    </div>
  );
} 