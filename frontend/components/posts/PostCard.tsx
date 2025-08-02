"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { likePost, deletePost } from "@/store/slices/postsSlice";
import { Button } from "@/components/ui/button";
import {
  FiHeart,
  FiMessageCircle,
  FiShare,
  FiMoreVertical,
  FiTrash2,
  FiEdit,
  FiMapPin,
  FiBriefcase,
  FiBookmark,
  FiEye,
  FiSend,
  FiX,
  FiCopy,
  FiCode,
  FiEyeOff,
  FiSettings,
  FiGitBranch,
  FiUsers,
  FiMessageSquare,
  FiStar,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { commentsAPI, savedAPI, api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  atomOneLight,
  atomOneDark,
  vs2015,
  dracula,
} from "react-syntax-highlighter/dist/esm/styles/hljs";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import ts from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import php from "react-syntax-highlighter/dist/esm/languages/hljs/php";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import { getAvatarUrl } from "@/lib/utils";

SyntaxHighlighter.registerLanguage("javascript", js);
SyntaxHighlighter.registerLanguage("typescript", ts);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("markup", xml);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("php", php);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("bash", bash);

// Language color mapping
const languageColors: { [key: string]: string } = {
  javascript: "bg-yellow-100 text-yellow-800",
  typescript: "bg-blue-100 text-blue-800",
  python: "bg-green-100 text-green-800",
  java: "bg-orange-100 text-orange-800",
  cpp: "bg-purple-100 text-purple-800",
  css: "bg-pink-100 text-pink-800",
  php: "bg-indigo-100 text-indigo-800",
  sql: "bg-teal-100 text-teal-800",
  bash: "bg-gray-100 text-gray-800",
  html: "bg-red-100 text-red-800",
  react: "bg-cyan-100 text-cyan-800",
  node: "bg-emerald-100 text-emerald-800",
};

// Theme options
const themes: { [key: string]: any } = {
  light: atomOneLight,
  dark: atomOneDark,
  vs2015: vs2015,
  dracula: dracula,
};

interface PostCardProps {
  post: any;
  onUnsave?: () => void;
  onPostUpdate?: () => void;
}

export function PostCard({ post, onUnsave, onPostUpdate }: PostCardProps) {
  console.log("POSTCARD POST DATA:", post);
  const [showMenu, setShowMenu] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editLoading, setEditLoading] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const startYRef = useRef<number | null>(null);
  const threshold = 60;
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null
  );
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showInternalShare, setShowInternalShare] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  // Code display enhancements
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState("dark");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyCount, setCopyCount] = useState(post.copies || 0);

  // Collaboration features
  const [showForkModal, setShowForkModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [forkTitle, setForkTitle] = useState("");
  const [forkDescription, setForkDescription] = useState("");
  const [forkCode, setForkCode] = useState(post.code || "");
  const [forkCodeTab, setForkCodeTab] = useState<"edit" | "preview">("edit");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [isForking, setIsForking] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const router = useRouter();

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const isOwnPost = user?._id === post.author?._id;

  useEffect(() => {
    if (showComments) fetchComments();
    if (user && post._id) {
      setIsSaved(Boolean(post.isSaved));
    }
    if (showComments && commentInputRef.current) {
      commentInputRef.current.focus();
    }
  }, [post._id, showComments, user]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await commentsAPI.getComments(post._id);
      setComments(res.data.data.comments || []);
    } catch (err) {
      setComments([]);
    }
    setLoadingComments(false);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setSubmitting(true);
    try {
      await commentsAPI.addComment(post._id, { content: commentInput });
      setCommentInput("");
      fetchComments();
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to add comment");
    }
    setSubmitting(false);
  };

  const handleToggleComments = () => {
    setShowComments((prev) => !prev);
  };

  const handleLike = async () => {
    try {
      await dispatch(likePost(post._id)).unwrap();
    } catch (error: any) {
      toast.error(error.message || "Failed to update like");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await dispatch(deletePost(post._id)).unwrap();
        toast.success("Post deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete post");
      }
    }
    setShowMenu(false);
  };

  const handleSave = async () => {
    if (!user) return;

    // Set loading state
    setUnsaving(true);

    try {
      if (isSaved) {
        // Unsave the post
        await savedAPI.unsavePost(user._id, post._id);
        setIsSaved(false);
        toast.success("Post unsaved");

        if (onUnsave) onUnsave();
      } else {
        // Save the post
        await savedAPI.savePost(user._id, post._id);
        setIsSaved(true);
        toast.success("Post saved");
      }
    } catch (err) {
      toast.error("Failed to update saved status");
      setIsSaved(isSaved);
    } finally {
      setUnsaving(false);
    }
  };

  const handleEdit = () => {
    setEditContent(post.content);
    setEditTitle(post.title || "");
    setEditing(true);
    setShowMenu(false);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const res = await api.put(`/posts/${post._id}`, {
        content: editContent,
        title: editTitle,
      });
      setEditing(false);
      setEditLoading(false);
      if (typeof onPostUpdate === "function") onPostUpdate();
    } catch (err) {
      toast.error("Failed to update post");
      setEditLoading(false);
    }
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startYRef.current !== null) {
      const endY = e.changedTouches[0].clientY;
      if (Math.abs(endY - startYRef.current) > threshold) {
        setIsImageModalOpen(false);
      }
      startYRef.current = null;
    }
  };
  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    startYRef.current = e.clientY;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (startYRef.current !== null) {
      const endY = e.clientY;
      if (Math.abs(endY - startYRef.current) > threshold) {
        setIsImageModalOpen(false);
      }
      startYRef.current = null;
    }
  };

  const handleCommentInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleCommentSubmit(e as any);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    setDeletingCommentId(commentId);
    try {
      await commentsAPI.deleteComment(commentId);
      setComments(comments.filter((comment) => comment._id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error("Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Native share/copy link
  const postUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/posts/${post._id}`
      : "";

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt || post.content,
        url: postUrl,
      });
    } else {
      navigator.clipboard.writeText(postUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
    postUrl
  )}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(postUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    postUrl
  )}`;

  const handleUserSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchUser(query);
    if (query.length > 1) {
      try {
        const res = await api.get(`/users/search?q=${query}`);
        setSearchResults(res.data.data.users || []);
      } catch (err) {
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSendToUser = async (userId: string) => {
    setSending(true);
    try {
      await api.post("/chat/send", {
        recipientId: userId,
        message: `Check out this post: ${post.title}`,
        postId: post._id,
      });
      toast.success("Post shared successfully!");
      setShowInternalShare(false);
    } catch (err) {
      toast.error("Failed to share post");
    } finally {
      setSending(false);
    }
  };

  // Code copy functionality
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(post.code || "");
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      // Track copy count
      trackCopyCount();
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  // Get language color
  const getLanguageColor = (language: string) => {
    const lang = language?.toLowerCase() || "code";
    return languageColors[lang] || "bg-gray-100 text-gray-800";
  };

  // Get display language name
  const getDisplayLanguage = (language: string) => {
    const lang = language?.toLowerCase() || "code";
    const languageMap: { [key: string]: string } = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      java: "Java",
      cpp: "C++",
      css: "CSS",
      php: "PHP",
      sql: "SQL",
      bash: "Bash",
      html: "HTML",
      react: "React",
      node: "Node.js",
    };
    return languageMap[lang] || language || "Code";
  };

  // Track copy count
  const trackCopyCount = async () => {
    try {
      console.log("Sending copy request for post:", post._id);
      const response = await api.post(`/posts/${post._id}/copy`);
      console.log("Copy response:", response.data);
      setCopyCount(response.data.copies);
    } catch (err) {
      console.error("Copy count error:", err);
    }
  };

  // Fork code post
  const handleFork = async () => {
    if (!forkTitle.trim()) {
      toast.error("Please enter a title for your fork");
      return;
    }
    if (!forkCode.trim()) {
      toast.error("Please enter or modify the code for your fork");
      return;
    }
    setIsForking(true);
    try {
      const response = await api.post(`/posts/${post._id}/fork`, {
        title: forkTitle,
        description: forkDescription,
        code: forkCode,
        codeLanguage: post.codeLanguage,
      });
      toast.success("Code forked successfully!");
      setShowForkModal(false);
      setForkTitle("");
      setForkDescription("");
      setForkCode(post.code || "");
      // Redirect to the new forked post
      if (response.data && response.data.data && response.data.data._id) {
        window.location.href = `/posts/${response.data.data._id}`;
      }
    } catch (err) {
      toast.error(err.message || "Failed to fork code");
    }
    setIsForking(false);
  };

  // Request code review
  const handleRequestReview = async () => {
    if (!reviewComment.trim()) {
      toast.error("Please add a comment for your review request");
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post(`/posts/${post._id}/review-request`, {
        comment: reviewComment,
        rating: reviewRating,
      });

      toast.success("Review request submitted!");
      setShowReviewModal(false);
      setReviewComment("");
      setReviewRating(5);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review request");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Get difficulty level
  const getDifficultyLevel = (post: any) => {
    console.log("Post difficulty from DB:", post.difficulty);
    console.log("Post object:", post);

    if (post.difficulty) {
      console.log("Using user-selected difficulty:", post.difficulty);
      return post.difficulty;
    }

    const code = post.code || "";
    const lines = code.split("\n").length;
    const hasFunctions = /function|=>|class/.test(code);
    const hasLoops = /for|while|forEach|map/.test(code);
    const hasConditionals = /if|else|switch/.test(code);

    const autoDetected =
      lines > 50 || (hasFunctions && hasLoops && hasConditionals)
        ? "advanced"
        : lines > 20 || hasFunctions || hasLoops
        ? "intermediate"
        : "beginner";

    console.log("Auto-detected difficulty:", autoDetected);
    return autoDetected;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get difficulty icon
  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "🌱";
      case "intermediate":
        return "🚀";
      case "advanced":
        return "⚡";
      default:
        return "📝";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4 border border-gray-100 transition-shadow hover:shadow-lg">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.author?.username}`}>
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
              <img
                src={getAvatarUrl(post.author)}
                alt="Author Avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Link
                href={`/profile/${post.author?.username}`}
                className="font-medium text-gray-900 hover:text-primary-600"
              >
                {post.author?.firstName} {post.author?.lastName}
              </Link>
              {post.forkedFrom && post.forkedFrom.author && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-xs text-gray-500">Forked from </span>
                  <Link
                    href={`/profile/${post.forkedFrom.author.username}`}
                    className="text-xs text-primary-600 font-semibold hover:underline"
                  >
                    {post.forkedFrom.author.firstName}{" "}
                    {post.forkedFrom.author.lastName}
                  </Link>
                </>
              )}
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {post.author?.location && (
                <div className="flex items-center">
                  <FiMapPin className="h-3 w-3 mr-1" />
                  <span>{post.author.location}</span>
                </div>
              )}
              {post.author?.company && (
                <div className="flex items-center">
                  <FiBriefcase className="h-3 w-3 mr-1" />
                  <span>{post.author.company}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Menu */}
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <FiMoreVertical className="h-5 w-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleEdit}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <FiEdit className="mr-3 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-gray-100"
                >
                  <FiTrash2 className="mr-3 h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content or Edit Form */}
      {editing ? (
        <form onSubmit={handleEditSave} className="space-y-3 mb-4">
          {post.title !== undefined && (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border rounded px-3 py-2 text-lg font-bold"
              placeholder="Title"
              required
            />
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full border rounded px-3 py-2 text-base"
            rows={3}
            required
          />
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              disabled={editLoading}
              className="px-4 py-2 rounded bg-primary-600 text-white font-semibold hover:bg-primary-700"
            >
              {editLoading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {post.title && (
            <div className="text-xl font-bold text-gray-900 mb-1">
              {post.title}
            </div>
          )}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {post.type === "code" ? (
            <div className="mb-4">
              {/* Code Header with Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 p-3 bg-gray-50 rounded-t-lg border-b">
                {/* Badges Group */}
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getLanguageColor(
                      post.codeLanguage
                    )}`}
                  >
                    {getDisplayLanguage(post.codeLanguage)}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-1 font-medium">
                    Code Post
                  </span>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                      getDifficultyLevel(post)
                    )}`}
                  >
                    {getDifficultyIcon(getDifficultyLevel(post))}{" "}
                    {getDifficultyLevel(post).charAt(0).toUpperCase() +
                      getDifficultyLevel(post).slice(1)}
                  </span>
                  {post.forkedFrom && (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <FiGitBranch className="inline-block h-3 w-3 mr-1" />{" "}
                      Forked Code
                    </span>
                  )}
                </div>
                {/* Analytics & Controls Group */}
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                  {/* Analytics */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                    <FiCopy className="h-3 w-3" />
                    <span>{copyCount} copies</span>
                  </div>
                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      title="Copy code"
                    >
                      <FiCopy className="h-3 w-3" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => setShowForkModal(true)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      title="Fork this code"
                    >
                      <FiGitBranch className="h-3 w-3" />
                      Fork
                    </button>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      title="Request code review"
                    >
                      <FiMessageSquare className="h-3 w-3" />
                      Review
                    </button>
                    <button
                      onClick={() => setShowLineNumbers(!showLineNumbers)}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                      title={
                        showLineNumbers
                          ? "Hide line numbers"
                          : "Show line numbers"
                      }
                    >
                      {showLineNumbers ? (
                        <FiEyeOff className="h-3 w-3" />
                      ) : (
                        <FiEye className="h-3 w-3" />
                      )}{" "}
                      Lines
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Change theme"
                      >
                        <FiSettings className="h-3 w-3" />
                        Theme
                      </button>
                      {showThemeMenu && (
                        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          {Object.keys(themes).map((theme) => (
                            <button
                              key={theme}
                              onClick={() => {
                                setSelectedTheme(theme);
                                setShowThemeMenu(false);
                              }}
                              className={`w-full text-left px-3 py-1 text-xs hover:bg-gray-50 ${
                                selectedTheme === theme
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Code Display */}
              <div className="relative">
                <SyntaxHighlighter
                  language={post.codeLanguage || "javascript"}
                  style={themes[selectedTheme]}
                  customStyle={{
                    borderRadius: "0 0 0.5rem 0.5rem",
                    fontSize: 14,
                    padding: 16,
                    margin: 0,
                    background:
                      selectedTheme === "dark" ? "#1e1e1e" : "#f8f9fa",
                  }}
                  showLineNumbers={showLineNumbers}
                >
                  {post.code || ""}
                </SyntaxHighlighter>
              </div>
              {/* Description Display */}
              {post.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-primary-500">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    📝 Description
                  </div>
                  <div className="text-gray-600 whitespace-pre-line">
                    {post.description}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-lg text-gray-800 mb-4 whitespace-pre-line">
              {post.content}
            </div>
          )}
        </>
      )}

      {/* Post Image */}
      {post.image && (
        <>
          <div
            className="mt-4 cursor-pointer"
            onClick={() => setIsImageModalOpen(true)}
          >
            <img
              src={post.image}
              alt="Post"
              className="w-full rounded-lg object-cover max-h-96 hover:opacity-80 transition"
            />
          </div>
          {isImageModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70"
              onClick={() => setIsImageModalOpen(false)}
            >
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <img
                  src={post.image}
                  alt="Full Post"
                  className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg border-4 border-white"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  draggable={false}
                />
                <button
                  className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 text-gray-800 hover:bg-opacity-100 transition"
                  onClick={() => setIsImageModalOpen(false)}
                  title="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-10">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
                post.isLiked
                  ? "text-red-600 bg-red-50"
                  : "text-gray-500 hover:text-red-600 hover:bg-red-50"
              }`}
            >
              <FiHeart
                className={`h-6 w-6 ${post.isLiked ? "fill-current" : ""}`}
              />
              <span className="text-sm font-medium">
                {post.likesCount || 0}
              </span>
            </button>

            <button
              onClick={handleToggleComments}
              className="flex items-center space-x-2 px-3 py-1 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <FiMessageCircle className="h-6 w-6" />
              <span className="text-sm font-medium">
                {post.commentsCount || 0}
              </span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowShareMenu((prev) => !prev)}
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <FiShare className="h-6 w-6" />
                <span className="text-sm font-medium">Share</span>
              </button>
              {showShareMenu && (
                <div className="absolute z-20 mt-2 w-56 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-2">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary-600"
                  >
                    <FiShare className="w-4 h-4" />
                    <span>Copy link / Native share</span>
                  </button>
                  <a
                    href={twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:underline"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.92 4.92 0 0 0-8.384 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.116 2.813 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.058 0 14.009-7.513 14.009-14.009 0-.213-.005-.425-.014-.636A10.012 10.012 0 0 0 24 4.557z" />
                    </svg>
                    <span>Share on Twitter</span>
                  </a>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:underline"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.52 3.48A11.93 11.93 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.85 0-3.68-.5-5.25-1.44l-.37-.22-3.67.97.98-3.58-.24-.37A9.94 9.94 0 0 1 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.6c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.28.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.48-.84-2.03-.22-.53-.45-.46-.62-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-.97 2.43.03 1.43 1.03 2.81 1.18 3.01.15.2 2.03 3.1 4.93 4.23.69.3 1.23.48 1.65.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" />
                    </svg>
                    <span>Share on WhatsApp</span>
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-700 hover:underline"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.326 24H12.82v-9.294H9.692v-3.622h3.127V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0" />
                    </svg>
                    <span>Share on Facebook</span>
                  </a>
                  <button
                    onClick={() => {
                      setShowShareMenu(false);
                      setShowInternalShare(true);
                    }}
                    className="flex items-center gap-2 text-purple-600 hover:underline"
                  >
                    <FiSend className="w-4 h-4" />
                    <span>Share in message</span>
                  </button>
                  <button
                    onClick={() => setShowShareMenu(false)}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mt-2"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
              )}
            </div>

            {onUnsave ? (
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 px-3 py-1 rounded-full text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                disabled={unsaving}
              >
                <span className="text-sm font-medium">Unsave</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full transition-colors ${
                  isSaved
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                <FiBookmark
                  className={`h-6 w-6 ${isSaved ? "fill-current" : ""}`}
                />
                <span className="text-sm font-medium">
                  {isSaved ? "Saved" : "Save"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Comments Section */}
      {showComments && (
        <div className="px-4 pb-4">
          {user && (
            <form
              onSubmit={handleCommentSubmit}
              className="flex items-center space-x-2 mt-2"
            >
              <input
                ref={commentInputRef}
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={handleCommentInputKeyDown}
                placeholder="Write a comment... (Ctrl+Enter to submit)"
                className="flex-1 border rounded px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 transition"
                disabled={submitting}
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={submitting || !commentInput.trim()}
                size="sm"
              >
                {submitting ? "Posting..." : "Comment"}
              </Button>
            </form>
          )}
          <div className="mt-3 space-y-2">
            {loadingComments ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="h-3 w-32 bg-gray-200 rounded" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center text-gray-400 text-sm gap-1">
                <span className="text-2xl">💬</span>
                <span>No comments yet. Be the first to comment!</span>
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment._id}
                  className={`flex items-start space-x-2 group transition-opacity duration-200 ${
                    deletingCommentId === comment._id
                      ? "opacity-50"
                      : "opacity-100"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    <img
                      src={getAvatarUrl(comment.author)}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-xs">
                        {comment.author?.firstName} {comment.author?.lastName}
                      </span>
                      <span className="text-xs text-gray-400">
                        ·{" "}
                        {comment.createdAt
                          ? formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                      {(user?._id === comment.author?._id ||
                        user?.role === "admin") && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          disabled={deletingCommentId === comment._id}
                          className="ml-2 text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
                          title="Delete comment"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          {deletingCommentId === comment._id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-700 break-words">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Internal Share Modal */}
      {showInternalShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowInternalShare(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-2">Share post in message</h3>
            <input
              type="text"
              value={searchUser}
              onChange={handleUserSearch}
              placeholder="Search users..."
              className="w-full border rounded px-3 py-2 mb-3"
            />
            <div className="max-h-48 overflow-y-auto">
              {searchResults.length === 0 && searchUser.length > 1 && (
                <div className="text-gray-500 text-sm">No users found.</div>
              )}
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        `${u.firstName[0]}${u.lastName[0]}`
                      )}
                    </div>
                    <span className="font-medium text-gray-900">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-xs text-gray-500">@{u.username}</span>
                  </div>
                  <button
                    onClick={() => handleSendToUser(u._id)}
                    disabled={sending}
                    className="px-3 py-1 rounded bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-50"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Fork Modal */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowForkModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Fork Code</h3>
            <input
              type="text"
              className="w-full mb-3 px-3 py-2 rounded border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-base"
              value={forkTitle}
              onChange={(e) => setForkTitle(e.target.value)}
              placeholder="Enter title for your fork..."
            />
            <textarea
              className="w-full mb-3 px-3 py-2 rounded border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-base resize-none"
              value={forkDescription}
              onChange={(e) => setForkDescription(e.target.value)}
              placeholder="Describe your changes or improvements..."
              rows={2}
            />
            {/* Code Editor Tabs */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                  forkCodeTab === "edit"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
                onClick={() => setForkCodeTab("edit")}
              >
                Edit
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                  forkCodeTab === "preview"
                    ? "bg-primary-600 text-white"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
                onClick={() => setForkCodeTab("preview")}
              >
                Preview
              </button>
            </div>
            {forkCodeTab === "edit" && (
              <textarea
                value={forkCode}
                onChange={(e) => setForkCode(e.target.value)}
                className="w-full h-40 font-mono text-sm rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white p-3 resize-none mb-3"
                style={{
                  fontFamily: "Fira Mono, monospace",
                  fontSize: 14,
                  minHeight: 0,
                  height: "10rem",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: "#111",
                  background: "#fff",
                }}
                placeholder="Paste or write your code here..."
              />
            )}
            {forkCodeTab === "preview" && (
              <div
                className="w-full border border-gray-200 rounded-lg overflow-hidden mb-3"
                style={{
                  maxWidth: "100%",
                  wordWrap: "break-word",
                  minWidth: 0,
                }}
              >
                {forkCode ? (
                  <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
                    <SyntaxHighlighter
                      language={post.codeLanguage || "javascript"}
                      style={atomOneDark}
                      customStyle={{
                        borderRadius: "0.5rem",
                        fontSize: 14,
                        padding: 16,
                        margin: 0,
                        background: "#1e1e1e",
                        minHeight: "160px",
                        maxHeight: "300px",
                        overflowY: "auto",
                        overflowX: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxWidth: "100%",
                        minWidth: 0,
                      }}
                      showLineNumbers
                    >
                      {forkCode}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-50 text-gray-500">
                    <div className="text-center">
                      <div className="text-lg mb-2">📝</div>
                      <div className="text-sm">No code to preview</div>
                      <div className="text-xs mt-1">
                        Switch to Edit tab to write code
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              className="w-full mt-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base shadow-sm transition"
              onClick={handleFork}
              disabled={isForking || !forkTitle.trim() || !forkCode.trim()}
            >
              {isForking ? "Forking..." : "Fork Code"}
            </button>
            <button
              className="w-full mt-2 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-base shadow-sm transition"
              onClick={() => setShowForkModal(false)}
              disabled={isForking}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Review Request Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowReviewModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Request Code Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl ${
                        star <= reviewRating
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      <FiStar
                        className={star <= reviewRating ? "fill-current" : ""}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Review Comment
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What specific feedback are you looking for?"
                  rows={4}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestReview}
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  {isSubmittingReview
                    ? "Submitting..."
                    : "Submit Review Request"}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
