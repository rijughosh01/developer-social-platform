"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { voteDiscussion, addComment } from "@/store/slices/discussionsSlice";
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
  CheckCircle,
  Reply,
  Edit,
  Trash2,
  Flag,
  Hash,
  Sparkles,
  BookOpen,
  Zap,
  TrendingUp,
  Users as UsersIcon,
  Award,
  Share2,
  Bookmark,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import { EnhancedComment } from "./EnhancedComment";
import { RichTextEditor } from "./RichTextEditor";

interface DiscussionDetailProps {
  discussion: Discussion;
}

export function DiscussionDetail({ discussion }: DiscussionDetailProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isVoting, setIsVoting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [commentRichContent, setCommentRichContent] = useState("");
  const [commentContentType, setCommentContentType] = useState<
    "plain" | "rich"
  >("plain");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [parentCommentId, setParentCommentId] = useState<string | null>(null);

  const handleVote = async (voteType: "upvote" | "downvote" | "remove") => {
    if (!user) {
      toast.error("Please log in to vote on discussions");
      return;
    }

    setIsVoting(true);
    try {
      toast.loading("Recording vote...", {
        id: `discussion-vote-${discussion._id}`,
      });
      await dispatch(voteDiscussion({ id: discussion._id, voteType })).unwrap();

      const voteMessage =
        voteType === "remove"
          ? "Vote removed"
          : voteType === "upvote"
          ? "Discussion upvoted"
          : "Discussion downvoted";

      toast.success(voteMessage, { id: `discussion-vote-${discussion._id}` });
    } catch (error) {
      console.error("Failed to vote:", error);
      toast.error("Failed to record vote. Please try again.", {
        id: `discussion-vote-${discussion._id}`,
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleFlagDiscussion = async () => {
    if (!user) {
      toast.error("Please log in to flag discussions");
      return;
    }

    const reason = prompt(
      "Please provide a reason for flagging this discussion:"
    );
    if (!reason || reason.trim() === "") {
      return;
    }

    // TODO: Implement flag discussion functionality
    toast.success("Discussion flagged successfully");
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to comment");
      return;
    }

    if (!commentContent.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmittingComment(true);
    try {
      await dispatch(
        addComment({
          discussionId: discussion._id,
          data: {
            content: commentContent,
            parentCommentId: parentCommentId,
            richContent: commentRichContent,
            contentType: commentContentType,
          },
        })
      ).unwrap();

      setCommentContent("");
      setCommentRichContent("");
      setCommentContentType("plain");
      setShowCommentForm(false);
      setParentCommentId(null);
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReply = (parentCommentId: string) => {
    setParentCommentId(parentCommentId);
    setShowCommentForm(true);
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
  const commentCount = discussion.comments?.length || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/*  Discussion Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/*  Category and Status */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-50 bg-gradient-to-r from-gray-50 to-blue-50/30">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            {discussion.isSticky && (
              <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold border border-amber-200">
                <Pin className="h-4 w-4" />
                <span>Pinned</span>
              </div>
            )}
            {discussion.isFeatured && (
              <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold border border-blue-200">
                <Star className="h-4 w-4" />
                <span>Featured</span>
              </div>
            )}
            <div
              className={`inline-flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-sm font-semibold border ${getCategoryColor(
                discussion.category
              )}`}
            >
              <CategoryIcon className="h-4 w-4" />
              <span className="capitalize">{discussion.category}</span>
            </div>
            {discussion.acceptedAnswer && (
              <div className="flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold border border-emerald-200">
                <Award className="h-4 w-4" />
                <span>Answered</span>
              </div>
            )}
          </div>

          {/*  Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            {discussion.title}
          </h1>

          {/*  Meta Information */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-sm">
                  {discussion.author ? (
                    <img
                      src={getAvatarUrl(discussion.author)}
                      alt="User Avatar"
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  )}
                </div>
                <span className="font-semibold text-gray-700 text-sm sm:text-base">
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
              <div className="flex items-center space-x-1.5">
                <Eye className="h-4 w-4" />
                <span className="font-semibold text-sm">
                  {discussion.views} views
                </span>
              </div>
            </div>

            {/*  Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-gray-200 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-gray-200 hover:bg-gray-50"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Bookmark</span>
              </Button>
              <Button
                onClick={handleFlagDiscussion}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-gray-200 hover:bg-gray-50"
              >
                <Flag className="h-4 w-4" />
                <span className="hidden sm:inline">Flag</span>
              </Button>
            </div>
          </div>
        </div>

        {/*  Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="prose prose-lg max-w-none mb-6 sm:mb-8">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {discussion.content}
            </p>
          </div>

          {/*  Tags */}
          {discussion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors duration-200"
                >
                  <Tag className="h-3 w-3" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          )}

          {/*  Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 sm:pt-6 border-t border-gray-100 space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/*  Vote Score */}
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
                <div className="px-3 sm:px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
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

              {/* Comments Count */}
              <div className="flex items-center space-x-2 text-gray-600 bg-white px-3 sm:px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold text-sm sm:text-base">
                  {commentCount} comments
                </span>
              </div>
            </div>

            {/* Reply Button */}
            {user && (
              <Button
                onClick={() => setShowCommentForm(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Comment Form */}
      {showCommentForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span>
              {parentCommentId ? "Reply to Comment" : "Add a Comment"}
            </span>
          </h3>
          <form
            onSubmit={handleSubmitComment}
            className="space-y-4 sm:space-y-6"
          >
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value="plain"
                    checked={commentContentType === "plain"}
                    onChange={(e) =>
                      setCommentContentType(e.target.value as "plain" | "rich")
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">Plain Text</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="contentType"
                    value="rich"
                    checked={commentContentType === "rich"}
                    onChange={(e) =>
                      setCommentContentType(e.target.value as "plain" | "rich")
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm font-medium">Rich Text</span>
                </label>
              </div>
            </div>

            {commentContentType === "plain" ? (
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write your comment..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50/50"
                rows={4}
                required
              />
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <RichTextEditor
                  value={commentRichContent}
                  onChange={setCommentRichContent}
                  placeholder="Write your comment..."
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCommentForm(false);
                  setParentCommentId(null);
                  setCommentContent("");
                  setCommentRichContent("");
                }}
                className="border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmittingComment ||
                  (!commentContent.trim() && !commentRichContent.trim())
                }
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center space-x-3 mb-6 sm:mb-8">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Comments ({commentCount})
            </h2>
            <p className="text-gray-600 text-sm">Join the conversation</p>
          </div>
        </div>

        {commentCount === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No comments yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm sm:text-base">
              Be the first to share your thoughts on this discussion!
            </p>
            {user && (
              <Button
                onClick={() => setShowCommentForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Reply className="h-4 w-4 mr-2" />
                Add a Comment
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {discussion.comments
              ?.filter(
                (comment) => comment && comment._id && !comment.parentComment
              ) // Only show top-level comments
              .map((comment) => (
                <EnhancedComment
                  key={comment._id}
                  comment={comment}
                  discussionId={discussion._id}
                  onReply={handleReply}
                  allComments={discussion.comments || []}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
