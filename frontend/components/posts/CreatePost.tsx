"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { createPost } from "@/store/slices/postsSlice";
import { Button } from "@/components/ui/button";
import {
  FiImage,
  FiX,
  FiSend,
  FiLoader,
  FiCode,
  FiFileText,
  FiTag,
  FiEye,
  FiEdit3,
  FiPlus,
  FiZap,
  FiTrendingUp,
  FiStar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Editor from "react-simple-code-editor";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
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
import { uploadImage, validateImageFile } from "@/lib/uploadUtils";

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

interface CreatePostForm {
  content: string;
}

const languageOptions = [
  { value: "javascript", label: "JavaScript", icon: "⚡" },
  { value: "typescript", label: "TypeScript", icon: "🔷" },
  { value: "python", label: "Python", icon: "🐍" },
  { value: "java", label: "Java", icon: "☕" },
  { value: "cpp", label: "C++", icon: "⚙️" },
  { value: "css", label: "CSS", icon: "🎨" },
  { value: "php", label: "PHP", icon: "🐘" },
  { value: "sql", label: "SQL", icon: "🗄️" },
  { value: "bash", label: "Bash", icon: "💻" },
  { value: "markup", label: "HTML", icon: "🌐" },
  { value: "react", label: "React", icon: "⚛️" },
  { value: "node", label: "Node.js", icon: "🟢" },
];

const difficultyOptions = [
  { value: "beginner", label: "Beginner", icon: "🌱", color: "text-green-600" },
  {
    value: "intermediate",
    label: "Intermediate",
    icon: "🚀",
    color: "text-blue-600",
  },
  {
    value: "advanced",
    label: "Advanced",
    icon: "⚡",
    color: "text-purple-600",
  },
];

export function CreatePost() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [postType, setPostType] = useState<"regular" | "code">("regular");
  const [code, setCode] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("javascript");
  const [codeDifficulty, setCodeDifficulty] = useState("beginner");
  const [codeDescription, setCodeDescription] = useState("");
  const [codeTab, setCodeTab] = useState<"edit" | "preview">("edit");

  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostForm>();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        validateImageFile(file, 5);
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Invalid image file"
        );
      }
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTagsInput("");
    setSelectedImage(null);
    setImagePreview(null);
    setCode("");
    setCodeLanguage("javascript");
    setCodeDifficulty("beginner");
    setCodeDescription("");
    setPostType("regular");
    setCodeTab("edit");
  };

  const handleCancel = () => {
    resetForm();
    setIsVisible(false);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postType === "regular") {
      if (!content.trim() && !selectedImage) {
        toast.error("Please write something or add an image");
        return;
      }
      if (!title.trim()) {
        toast.error("Please enter a title");
        return;
      }
    } else if (postType === "code") {
      if (!title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      if (!code.trim()) {
        toast.error("Please enter some code");
        return;
      }
    }
    setIsCreating(true);
    let imageUrl = "";
    try {
      if (postType === "regular" && selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      if (postType === "regular") {
        await dispatch(
          createPost({ title, content, image: imageUrl, tags, type: "regular" })
        );
      } else {
        console.log("Creating code post with difficulty:", codeDifficulty);
        await dispatch(
          createPost({
            title,
            code,
            codeLanguage,
            difficulty: codeDifficulty,
            description: codeDescription,
            tags,
            type: "code",
          })
        );
      }
      resetForm();
      setIsVisible(false);
      toast.success("Post created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create post");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-6">
      {/* Toggle Button - Always Visible */}
      {!isVisible && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
          <button
            onClick={() => setIsVisible(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FiPlus className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                Create a Post
              </div>
              <div className="text-sm text-gray-500">
                Share your thoughts, code, or experiences with the community
              </div>
            </div>
            <FiChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-auto" />
          </button>
        </div>
      )}

      {/* Post Creation Form - Only Visible When Toggled */}
      {isVisible && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                  <img
                    src={user ? getAvatarUrl(user) : ""}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create Post
                  </h3>
                  <p className="text-sm text-gray-600">
                    Share your thoughts or code with the community
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Cancel"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={onSubmit} className="p-6">
            {/* Post Type Selector */}
            <div className="mb-6">
              <div className="flex bg-gray-50 rounded-xl p-1">
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    postType === "regular"
                      ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setPostType("regular")}
                >
                  <FiFileText className="w-4 h-4" />
                  Regular Post
                </button>
                <button
                  type="button"
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    postType === "code"
                      ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setPostType("code")}
                >
                  <FiCode className="w-4 h-4" />
                  Code Post
                </button>
              </div>
            </div>

            {/* Title Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                placeholder="Give your post a compelling title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-base font-medium placeholder-gray-400 transition-all duration-200 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Tags Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="relative">
                <FiTag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="react, nodejs, api, javascript..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-base placeholder-gray-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Separate tags with commas
              </p>
            </div>

            {/* Content Section */}
            {postType === "regular" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  placeholder="What's on your mind? Share your thoughts, ideas, or experiences..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-base resize-none placeholder-gray-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            )}

            {/* Code Post Specific Fields */}
            {postType === "code" && (
              <div className="space-y-4">
                {/* Language and Difficulty Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programming Language
                    </label>
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-base transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      {languageOptions.map((lang) => (
                        <option key={lang.value} value={lang.value}>
                          {lang.icon} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={codeDifficulty}
                      onChange={(e) => setCodeDifficulty(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-base transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      {difficultyOptions.map((diff) => (
                        <option key={diff.value} value={diff.value}>
                          {diff.icon} {diff.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Explain what your code does, the problem it solves, or any context that would help others understand..."
                    value={codeDescription}
                    onChange={(e) => setCodeDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-base resize-none placeholder-gray-400 transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Code Editor Tabs */}
                <div>
                  <div className="flex bg-gray-50 rounded-xl p-1 mb-3">
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        codeTab === "edit"
                          ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setCodeTab("edit")}
                    >
                      <FiEdit3 className="w-4 h-4" />
                      Edit Code
                    </button>
                    <button
                      type="button"
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        codeTab === "preview"
                          ? "bg-white text-blue-600 shadow-sm border border-blue-100"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setCodeTab("preview")}
                    >
                      <FiEye className="w-4 h-4" />
                      Preview
                    </button>
                  </div>

                  {codeTab === "edit" && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code
                      </label>
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-900">
                        <textarea
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          className="w-full h-64 font-mono text-sm bg-gray-900 text-gray-100 p-4 resize-none focus:outline-none focus:ring-0"
                          style={{
                            fontFamily:
                              "Fira Code, Monaco, Consolas, monospace",
                            fontSize: 14,
                            lineHeight: 1.5,
                          }}
                          placeholder="// Write your code here..."
                        />
                      </div>
                    </div>
                  )}

                  {codeTab === "preview" && (
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code Preview
                      </label>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {code ? (
                          <div className="overflow-x-auto">
                            <SyntaxHighlighter
                              language={codeLanguage || "javascript"}
                              style={atomOneDark}
                              customStyle={{
                                borderRadius: "0.75rem",
                                fontSize: 14,
                                padding: 16,
                                margin: 0,
                                background: "#1e1e1e",
                                minHeight: "256px",
                                maxHeight: "400px",
                                overflowY: "auto",
                                overflowX: "auto",
                                fontFamily:
                                  "Fira Code, Monaco, Consolas, monospace",
                              }}
                              showLineNumbers
                            >
                              {code}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-50 text-gray-500">
                            <div className="text-center">
                              <FiCode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <div className="text-sm font-medium">
                                No code to preview
                              </div>
                              <div className="text-xs mt-1 text-gray-400">
                                Switch to Edit tab to write code
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Preview for Regular Posts */}
            {postType === "regular" && imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Preview
                </label>
                <div className="relative group w-fit">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-64 rounded-xl object-cover border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                    title="Remove image"
                    disabled={isCreating || isUploading}
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FiLoader className="animate-spin h-5 w-5 text-blue-600" />
                        <span className="text-blue-600 font-medium">
                          Uploading...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                {postType === "regular" && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                      <FiImage className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Add Image
                      </span>
                    </div>
                  </label>
                )}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 text-sm"
                >
                  Cancel
                </button>
              </div>

              <Button
                type="submit"
                disabled={isCreating || isUploading}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isCreating || isUploading ? (
                  <FiLoader className="h-4 w-4 animate-spin" />
                ) : (
                  <FiSend className="h-4 w-4" />
                )}
                <span>
                  {isCreating
                    ? "Creating Post..."
                    : isUploading
                    ? "Uploading..."
                    : "Publish Post"}
                </span>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
