"use client";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { voteDiscussion, addComment, flagDiscussion } from "@/store/slices/discussionsSlice";
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
  Copy,
  X,
  ExternalLink,
  Mail,
  Twitter,
  Facebook,
  Linkedin,
  Link,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";
import { savedAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { EnhancedComment } from "./EnhancedComment";
import { RichTextEditor } from "./RichTextEditor";
import { FlagStatus } from "./FlagStatus";

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);

  // Generate share URL when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/discussions/${discussion._id}`;
      setShareUrl(url);
    }
  }, [discussion._id]);

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showShareModal) {
          setShowShareModal(false);
        }
        if (showFlagModal) {
          setShowFlagModal(false);
        }
      }
    };

    if (showShareModal || showFlagModal) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showShareModal, showFlagModal]);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const copyToClipboard = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link");
    } finally {
      setIsCopying(false);
    }
  };

  const shareOnSocialMedia = (platform: string) => {
    const title = encodeURIComponent(discussion.title);
    const url = encodeURIComponent(shareUrl);
    const text = encodeURIComponent(
      `Check out this discussion: ${discussion.title}`
    );

    let socialShareUrl = "";
    let platformName = "";

    switch (platform) {
      case "twitter":
        socialShareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        platformName = "Twitter";
        break;
      case "facebook":
        socialShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        platformName = "Facebook";
        break;
      case "linkedin":
        socialShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        platformName = "LinkedIn";
        break;
      case "email":
        socialShareUrl = `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
        platformName = "Email";
        break;
      default:
        return;
    }

    const popup = window.open(socialShareUrl, "_blank", "width=600,height=400");

    toast.success(`Opening ${platformName}...`);

    setTimeout(() => {
      setShowShareModal(false);
    }, 1000);
  };

  const shareViaNativeAPI = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: discussion.title,
          text: `Check out this discussion: ${discussion.title}`,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
        setShowShareModal(false);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error);
          toast.error("Failed to share");
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowShareModal(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error("Please log in to bookmark discussions");
      return;
    }

    setIsBookmarking(true);
    try {
      if (!discussion.isSaved) {
        await savedAPI.saveDiscussion(discussion._id);
        toast.success("Discussion saved to your bookmarks!");
      } else {
        await savedAPI.unsaveDiscussion(discussion._id);
        toast.success("Discussion removed from bookmarks!");
      }
    } catch (error) {
      console.error("Failed to bookmark discussion:", error);
      toast.error("Failed to bookmark discussion");
    } finally {
      setIsBookmarking(false);
    }
  };

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

  const handleFlagDiscussion = () => {
    if (!user) {
      toast.error("Please log in to flag discussions");
      return;
    }
    setShowFlagModal(true);
  };

  const handleSubmitFlag = async () => {
    if (!flagReason) {
      toast.error("Please select a reason for flagging");
      return;
    }

    setIsFlagging(true);
    try {
      await dispatch(
        flagDiscussion({
          id: discussion._id,
          reason: flagReason,
        })
      ).unwrap();

      toast.success("Discussion flagged successfully");
      setShowFlagModal(false);
      setFlagReason("");
      setFlagDescription("");
    } catch (error) {
      console.error("Failed to flag discussion:", error);
      toast.error("Failed to flag discussion. Please try again.");
    } finally {
      setIsFlagging(false);
    }
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
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-gray-200 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              <Button
                onClick={handleBookmark}
                disabled={isBookmarking}
                variant="outline"
                size="sm"
                className={`flex items-center space-x-2 ${
                  discussion.isSaved
                    ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Bookmark
                  className={`h-4 w-4 ${
                    discussion.isSaved ? "fill-current" : ""
                  }`}
                />
                <span className="hidden sm:inline">
                  {isBookmarking
                    ? "..."
                    : discussion.isSaved
                    ? "Saved"
                    : "Bookmark"}
                </span>
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
          {/* Flag Status */}
          <FlagStatus 
            content={discussion} 
            contentType="discussion" 
            className="mb-6"
          />
          
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

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleModalClick}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                Share Discussion
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Discussion Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {discussion.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {discussion.content.substring(0, 150)}
                  {discussion.content.length > 150 && "..."}
                </p>
                <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                  <span>
                    By{" "}
                    {discussion.author
                      ? `${discussion.author.firstName || "Unknown"} ${
                          discussion.author.lastName || "User"
                        }`
                      : "Unknown User"}
                  </span>
                  <span>•</span>
                  <span>{discussion.views} views</span>
                </div>
              </div>

              {/* Share URL */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Share this link
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                  />
                  <Button
                    onClick={copyToClipboard}
                    disabled={isCopying}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {isCopying ? "Copied!" : "Copy"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Social Media Buttons */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Share on social media
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => shareOnSocialMedia("twitter")}
                    variant="outline"
                    className="flex items-center space-x-2 border-blue-200 hover:bg-blue-50"
                  >
                    <Twitter className="h-4 w-4 text-blue-500" />
                    <span>Twitter</span>
                  </Button>
                  <Button
                    onClick={() => shareOnSocialMedia("facebook")}
                    variant="outline"
                    className="flex items-center space-x-2 border-blue-600 hover:bg-blue-50"
                  >
                    <Facebook className="h-4 w-4 text-blue-600" />
                    <span>Facebook</span>
                  </Button>
                  <Button
                    onClick={() => shareOnSocialMedia("linkedin")}
                    variant="outline"
                    className="flex items-center space-x-2 border-blue-700 hover:bg-blue-50"
                  >
                    <Linkedin className="h-4 w-4 text-blue-700" />
                    <span>LinkedIn</span>
                  </Button>
                  <Button
                    onClick={() => shareOnSocialMedia("email")}
                    variant="outline"
                    className="flex items-center space-x-2 border-gray-300 hover:bg-gray-50"
                  >
                    <Mail className="h-4 w-4 text-gray-600" />
                    <span>Email</span>
                  </Button>
                </div>
              </div>

              {/* Native Share Button */}
              <div className="pt-4 border-t border-gray-100">
                <Button
                  onClick={shareViaNativeAPI}
                  className="w-full bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share via System</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFlagModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                Flag Discussion
              </h3>
              <button
                onClick={() => setShowFlagModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Discussion Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {discussion.title}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {discussion.content.substring(0, 150)}
                  {discussion.content.length > 150 && "..."}
                </p>
              </div>

              {/* Flag Reason Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for flagging *
                </label>
                <div className="space-y-2">
                  {[
                    { value: "spam", label: "Spam", description: "Unwanted promotional content" },
                    { value: "inappropriate", label: "Inappropriate", description: "Content that violates community guidelines" },
                    { value: "offensive", label: "Offensive", description: "Hate speech or offensive language" },
                    { value: "duplicate", label: "Duplicate", description: "This discussion already exists" },
                    { value: "other", label: "Other", description: "Other reasons not listed above" },
                  ].map((reason) => (
                    <label
                      key={reason.value}
                      className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="flagReason"
                        value={reason.value}
                        checked={flagReason === reason.value}
                        onChange={(e) => setFlagReason(e.target.value)}
                        className="text-red-600 mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {reason.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reason.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Description */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Additional details (optional)
                </label>
                <textarea
                  value={flagDescription}
                  onChange={(e) => setFlagDescription(e.target.value)}
                  placeholder="Please provide any additional context..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => {
                    setShowFlagModal(false);
                    setFlagReason("");
                    setFlagDescription("");
                  }}
                  variant="outline"
                  className="flex-1 border-gray-200 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitFlag}
                  disabled={isFlagging || !flagReason}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                >
                  {isFlagging ? "Flagging..." : "Flag Discussion"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
