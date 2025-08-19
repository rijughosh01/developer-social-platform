"use client";

import { useState } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { commentsAPI } from "@/lib/api";
import {
  FiHeart,
  FiMessageCircle,
  FiTrash2,
  FiCornerUpLeft,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { getAvatarUrl } from "@/lib/utils";
import toast from "react-hot-toast";
import { Comment } from "@/types";

interface NestedCommentProps {
  comment: Comment;
  postId: string;
  depth?: number;
  maxDepth?: number;
  onCommentUpdate: () => void;
  onDeleteComment: (commentId: string) => void;
}

export function NestedComment({
  comment,
  postId,
  depth = 0,
  maxDepth = 3,
  onCommentUpdate,
  onDeleteComment,
}: NestedCommentProps) {
  const { user } = useAppSelector((state) => state.auth);

  // Helper function to get user data
  const getCommentUser = () => {
    return comment.user || comment.author;
  };
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const canReply = depth < maxDepth && comment.replies?.length < 10;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isLiked = comment.likes?.some((like) => {
    if (typeof like === "string") {
      return like === user?._id;
    }
    return like._id === user?._id;
  });

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await commentsAPI.addComment(postId, {
        content: replyContent,
        parentCommentId: comment._id,
      });

      setReplyContent("");
      setIsReplying(false);
      onCommentUpdate();
      toast.success("Reply added successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add reply");
    }
    setIsSubmitting(false);
  };

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await commentsAPI.likeComment(comment._id);
      onCommentUpdate();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to like comment");
    }
    setIsLiking(false);
  };

  const handleDelete = () => {
    onDeleteComment(comment._id);
  };

  return (
    <div
      className={`transition-opacity duration-200 ${
        depth > 0 ? "ml-6 border-l-2 border-gray-100 pl-4" : ""
      }`}
    >
      <div className="flex items-start space-x-2 group">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          <img
            src={getAvatarUrl(getCommentUser())}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-xs">
              {getCommentUser()?.firstName || "Unknown"}{" "}
              {getCommentUser()?.lastName || ""}
            </span>
            <span className="text-xs text-gray-400">
              ·{" "}
              {comment.createdAt
                ? formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })
                : ""}
            </span>
            {(user?._id === getCommentUser()?._id ||
              user?.role === "admin") && (
              <button
                onClick={handleDelete}
                className="ml-2 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                title="Delete comment"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-700 break-words mt-1">
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1 text-xs transition-colors ${
                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <FiHeart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
              <span>{comment.likes?.length || 0}</span>
            </button>

            {canReply ? (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
              >
                <FiCornerUpLeft className="w-3 h-3" />
                <span>Reply</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <FiCornerUpLeft className="w-3 h-3" />
                <span>
                  {depth >= maxDepth
                    ? "Max depth reached"
                    : comment.replies?.length >= 10
                    ? "Too many replies"
                    : "Cannot reply"}
                </span>
              </span>
            )}

            {hasReplies && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiMessageCircle className="w-3 h-3" />
                <span>
                  {showReplies ? "Hide" : "Show"} {comment.replies.length}
                  {comment.replies.length === 1 ? " reply" : " replies"}
                </span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <form onSubmit={handleReply} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${
                    getCommentUser()?.firstName || "Unknown"
                  }...`}
                  className="flex-1 border rounded px-3 py-1 text-xs focus:ring-2 focus:ring-primary-500 transition"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Posting..." : "Reply"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-3 py-1 text-xs border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <NestedComment
              key={reply._id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              maxDepth={maxDepth}
              onCommentUpdate={onCommentUpdate}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
