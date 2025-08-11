"use client";

import { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import {
  voteComment,
  editComment,
  addComment,
  flagComment,
} from "@/store/slices/discussionsSlice";
import { DiscussionComment } from "@/types";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./RichTextEditor";
import { FlagStatus } from "./FlagStatus";
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Edit,
  Reply,
  MoreHorizontal,
  User,
  Clock,
  Flag,
  ChevronRight,
  ChevronDown,
  Award,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface EnhancedCommentProps {
  comment: DiscussionComment;
  discussionId: string;
  onReply: (parentCommentId: string) => void;
  depth?: number;
  maxDepth?: number;
  allComments?: DiscussionComment[];
}

export function EnhancedComment({
  comment,
  discussionId,
  onReply,
  depth = 0,
  maxDepth = 10,
  allComments = [],
}: EnhancedCommentProps) {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isVoting, setIsVoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment?.content || "");
  const [editRichContent, setEditRichContent] = useState(
    comment?.richContent || ""
  );
  const [editContentType, setEditContentType] = useState(
    comment?.contentType || "plain"
  );
  const [replyContent, setReplyContent] = useState("");
  const [replyRichContent, setReplyRichContent] = useState("");
  const [replyContentType, setReplyContentType] = useState<"plain" | "rich">(
    "plain"
  );
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Safety check for comment data
  if (!comment) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
        <div className="text-gray-500 text-center">Comment not available</div>
      </div>
    );
  }

  // Handle clicking outside the options menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper function to safely format dates
  const formatDateSafely = (dateString: string | undefined) => {
    if (!dateString) return "Unknown time";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown time";

    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  // Helper function to compare user IDs safely
  const isCommentOwner = (userId: string, authorId: string) => {
    return userId && authorId && userId.toString() === authorId.toString();
  };

  const handleVote = async (voteType: "upvote" | "downvote" | "remove") => {
    if (!user) {
      toast.error("Please log in to vote on comments");
      return;
    }

    setIsVoting(true);
    try {
      toast.loading("Recording vote...", { id: `vote-${comment._id}` });
      await dispatch(
        voteComment({ discussionId, commentId: comment._id, voteType })
      ).unwrap();

      const voteMessage =
        voteType === "remove"
          ? "Vote removed"
          : voteType === "upvote"
          ? "Comment upvoted"
          : "Comment downvoted";

      toast.success(voteMessage, { id: `vote-${comment._id}` });
    } catch (error) {
      console.error("Failed to vote:", error);
      toast.error("Failed to record vote. Please try again.", {
        id: `vote-${comment._id}`,
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleEdit = async () => {
    if (!user) {
      toast.error("Please log in to edit comments");
      return;
    }

    // Validate content based on content type
    if (editContentType === "plain") {
      if (!editContent.trim()) {
        toast.error("Comment content cannot be empty");
        return;
      }
    } else if (editContentType === "rich") {
      if (!editRichContent.trim()) {
        toast.error("Comment content cannot be empty");
        return;
      }
    }

    setIsEditing(true);
    try {
      toast.loading("Updating comment...", { id: `edit-${comment._id}` });
      await dispatch(
        editComment({
          discussionId,
          commentId: comment._id,
          data: {
            content: editContent,
            richContent: editRichContent,
            contentType: editContentType,
          },
        })
      ).unwrap();

      toast.success("Comment updated successfully", {
        id: `edit-${comment._id}`,
      });
    } catch (error) {
      console.error("Failed to edit comment:", error);
      toast.error("Failed to update comment. Please try again.", {
        id: `edit-${comment._id}`,
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to reply");
      return;
    }

    if (!replyContent.trim()) {
      toast.error("Reply content cannot be empty");
      return;
    }

    setIsSubmittingReply(true);
    try {
      toast.loading("Posting reply...", { id: `reply-${comment._id}` });
      await dispatch(
        addComment({
          discussionId,
          data: {
            content: replyContent,
            parentCommentId: comment._id,
            richContent: replyRichContent,
            contentType: replyContentType,
          },
        })
      ).unwrap();

      setReplyContent("");
      setReplyRichContent("");
      setReplyContentType("plain");
      setIsReplying(false);
      toast.success("Reply posted successfully", {
        id: `reply-${comment._id}`,
      });
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast.error("Failed to post reply. Please try again.", {
        id: `reply-${comment._id}`,
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleFlagComment = () => {
    if (!user) {
      toast.error("Please log in to flag comments");
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
        flagComment({
          discussionId,
          commentId: comment._id,
          reason: flagReason,
        })
      ).unwrap();

      toast.success("Comment flagged successfully");
      setShowFlagModal(false);
      setFlagReason("");
      setFlagDescription("");
    } catch (error) {
      console.error("Failed to flag comment:", error);
      toast.error("Failed to flag comment. Please try again.");
    } finally {
      setIsFlagging(false);
    }
  };

  const getVoteButtonClass = (voteType: "upvote" | "downvote") => {
    const isActive = comment.userVote === voteType;
    return `flex items-center space-x-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? voteType === "upvote"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm"
          : "bg-red-50 text-red-700 border border-red-200 shadow-sm"
        : "text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
    }`;
  };

  const renderContent = () => {
    if (comment.contentType === "rich" && comment.richContent) {
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: comment.richContent }}
        />
      );
    }
    return (
      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
        {comment.content}
      </p>
    );
  };

  // Find replies for this comment from the allComments array
  const replies = allComments.filter(
    (reply) =>
      reply.parentComment &&
      reply.parentComment.toString() === comment._id.toString()
  );
  const hasReplies = replies.length > 0;
  const canReply = depth < maxDepth;

  return (
    <div
      className={`${
        depth > 0
          ? "ml-4 sm:ml-6 lg:ml-8 border-l-2 border-gray-100 pl-4 sm:pl-6"
          : ""
      }`}
    >
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
        {/*  Comment Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-sm">
              {comment.author ? (
                <img
                  src={getAvatarUrl(comment.author)}
                  alt="User Avatar"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm sm:text-base">
                {comment.author
                  ? `${comment.author.firstName || "Unknown"} ${
                      comment.author.lastName || "User"
                    }`
                  : "Unknown User"}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-3 w-3" />
                <span className="text-xs sm:text-sm">
                  {formatDateSafely(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    edited
                  </span>
                )}
              </div>
            </div>
          </div>

          {/*  Options Menu */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-8 sm:top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10 min-w-[140px]">
                {comment.author &&
                  isCommentOwner(user?._id || "", comment.author._id) && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowOptionsMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  )}
                <button
                  onClick={() => {
                    handleFlagComment();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-200"
                >
                  <Flag className="h-3 w-3" />
                  <span>Flag</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/*  Comment Content */}
        <div className="mb-4 sm:mb-6">
          {/* Flag Status */}
          <FlagStatus 
            content={comment} 
            contentType="comment" 
            className="mb-4"
          />
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`edit-contentType-${comment._id}`}
                      value="plain"
                      checked={editContentType === "plain"}
                      onChange={(e) =>
                        setEditContentType(e.target.value as "plain" | "rich")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Plain Text</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`edit-contentType-${comment._id}`}
                      value="rich"
                      checked={editContentType === "rich"}
                      onChange={(e) =>
                        setEditContentType(e.target.value as "plain" | "rich")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Rich Text</span>
                  </label>
                </div>
              </div>

              {editContentType === "plain" ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50/50"
                  rows={3}
                />
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <RichTextEditor
                    value={editRichContent}
                    onChange={setEditRichContent}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                    setEditRichContent(comment.richContent || "");
                    setEditContentType(comment.contentType);
                  }}
                  className="border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={!editContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/*  Comment Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-100 space-y-3 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/*  Vote Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() =>
                  handleVote(
                    comment.userVote === "upvote" ? "remove" : "upvote"
                  )
                }
                disabled={isVoting}
                className={getVoteButtonClass("upvote")}
              >
                <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-semibold text-sm">
                  {comment.upvotes?.length || 0}
                </span>
              </button>
              <button
                onClick={() =>
                  handleVote(
                    comment.userVote === "downvote" ? "remove" : "downvote"
                  )
                }
                disabled={isVoting}
                className={getVoteButtonClass("downvote")}
              >
                <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="font-semibold text-sm">
                  {comment.downvotes?.length || 0}
                </span>
              </button>
            </div>

            {/* Reply Button */}
            {canReply && user && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                <Reply className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Reply</span>
              </button>
            )}

            {/* Show/Hide Replies */}
            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200"
              >
                {showReplies ? (
                  <>
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Hide {comment.replies.length} replies</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Show {comment.replies.length} replies</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gray-50/50 rounded-xl border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span>
                Reply to{" "}
                {comment.author
                  ? comment.author.firstName || "Unknown User"
                  : "Unknown User"}
              </span>
            </h4>
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`reply-contentType-${comment._id}`}
                      value="plain"
                      checked={replyContentType === "plain"}
                      onChange={(e) =>
                        setReplyContentType(e.target.value as "plain" | "rich")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Plain Text</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`reply-contentType-${comment._id}`}
                      value="rich"
                      checked={replyContentType === "rich"}
                      onChange={(e) =>
                        setReplyContentType(e.target.value as "plain" | "rich")
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Rich Text</span>
                  </label>
                </div>
              </div>

              {replyContentType === "plain" ? (
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  rows={3}
                  required
                />
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <RichTextEditor
                    value={replyRichContent}
                    onChange={setReplyRichContent}
                    placeholder="Write your reply..."
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent("");
                    setReplyRichContent("");
                  }}
                  className="border-gray-200 hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReply || !replyContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {isSubmittingReply ? "Posting..." : "Post Reply"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div className="mt-4 sm:mt-6 space-y-4">
          {replies.map((reply) => (
            <EnhancedComment
              key={reply._id}
              comment={reply}
              discussionId={discussionId}
              onReply={onReply}
              depth={depth + 1}
              maxDepth={maxDepth}
              allComments={allComments}
            />
          ))}
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
                Flag Comment
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
              {/* Comment Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {comment.author ? (
                      <img
                        src={getAvatarUrl(comment.author)}
                        alt="User Avatar"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {comment.author
                      ? `${comment.author.firstName || "Unknown"} ${
                          comment.author.lastName || "User"
                        }`
                      : "Unknown User"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {comment.content.substring(0, 150)}
                  {comment.content.length > 150 && "..."}
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
                    { value: "duplicate", label: "Duplicate", description: "This comment already exists" },
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
                  {isFlagging ? "Flagging..." : "Flag Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
