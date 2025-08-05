"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { voteDiscussion } from "@/store/slices/discussionsSlice";
import { Discussion } from "@/types";
import { Button } from "@/components/ui/button";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Pin,
  Star,
  Clock,
  User,
  Tag,
  TrendingUp,
  Hash,
  Sparkles,
  BookOpen,
  Zap,
  Users as UsersIcon,
  ArrowRight,
  Award,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";

interface DiscussionCardProps {
  discussion: Discussion;
}

export function DiscussionCard({ discussion }: DiscussionCardProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isVoting, setIsVoting] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleVote = async (voteType: "upvote" | "downvote" | "remove") => {
    if (!user) return;

    setIsVoting(true);
    try {
      await dispatch(voteDiscussion({ id: discussion._id, voteType })).unwrap();
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const getVoteButtonClass = (voteType: "upvote" | "downvote") => {
    const isActive = discussion.userVote === voteType;
    return `flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? voteType === "upvote"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
          : "bg-red-50 text-red-700 border border-red-200 shadow-sm"
        : "text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
    }`;
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
    <div className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
      {/* Header with Status Badges */}
      <div className="p-4 sm:p-6 border-b border-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {discussion.isSticky && (
                <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200">
                  <Pin className="h-3 w-3" />
                  <span>Pinned</span>
                </div>
              )}
              {discussion.isFeatured && (
                <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                  <Star className="h-3 w-3" />
                  <span>Featured</span>
                </div>
              )}
              <div
                className={`inline-flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold border ${getCategoryColor(
                  discussion.category
                )}`}
              >
                <CategoryIcon className="h-3 w-3" />
                <span className="capitalize">{discussion.category}</span>
              </div>
              {discussion.acceptedAnswer && (
                <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
                  <Award className="h-3 w-3" />
                  <span>Answered</span>
                </div>
              )}
            </div>

            {/* Title */}
            <Link
              href={`/discussions/${discussion._id}`}
              className="block group"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 line-clamp-2 leading-tight mb-3">
                {discussion.title}
              </h3>
            </Link>

            {/* Content Preview */}
            <p className="text-gray-600 line-clamp-3 leading-relaxed text-sm">
              {discussion.content}
            </p>
          </div>
        </div>

        {/* Tags */}
        {discussion.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {discussion.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
              >
                <Tag className="h-3 w-3" />
                <span>{tag}</span>
              </span>
            ))}
            {discussion.tags.length > 4 && (
              <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                +{discussion.tags.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats and Actions */}
      <div className="px-4 sm:px-6 py-4 bg-gray-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Vote Score */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() =>
                  handleVote(
                    discussion.userVote === "upvote" ? "remove" : "upvote"
                  )
                }
                disabled={isVoting}
                className={getVoteButtonClass("upvote")}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="font-semibold">
                  {discussion.upvotes.length}
                </span>
              </button>
              <div className="px-2 sm:px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  {discussion.voteScore}
                </span>
              </div>
              <button
                onClick={() =>
                  handleVote(
                    discussion.userVote === "downvote" ? "remove" : "downvote"
                  )
                }
                disabled={isVoting}
                className={getVoteButtonClass("downvote")}
              >
                <ThumbsDown className="h-4 w-4" />
                <span className="font-semibold">
                  {discussion.downvotes.length}
                </span>
              </button>
            </div>

            {/* Comments */}
            <div className="flex items-center space-x-2 text-gray-600 bg-white px-2 sm:px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-semibold">
                {discussion.comments?.length || 0}
              </span>
            </div>

            {/* Views */}
            <div className="flex items-center space-x-2 text-gray-600 bg-white px-2 sm:px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-semibold">{discussion.views}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-50 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-sm">
                {discussion.author ? (
                  <img
                    src={getAvatarUrl(discussion.author)}
                    alt="User Avatar"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                )}
              </div>
              <span className="font-medium text-gray-700 text-sm sm:text-base">
                {discussion.author
                  ? `${discussion.author.firstName || "Unknown"} ${
                      discussion.author.lastName || "User"
                    }`
                  : "Unknown User"}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {formatDistanceToNow(new Date(discussion.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {discussion.lastCommentBy && (
              <div className="flex items-center space-x-1.5">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">
                  Last reply by{" "}
                  {discussion.lastCommentBy.firstName || "Unknown"}{" "}
                  {discussion.lastCommentBy.lastName || "User"}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/discussions/${discussion._id}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 group-hover:underline transition-all duration-200 self-start sm:self-auto"
          >
            <span>View Discussion</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>
      </div>
    </div>
  );
}
