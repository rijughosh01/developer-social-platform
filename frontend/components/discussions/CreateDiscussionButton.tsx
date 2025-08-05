"use client";

import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import {
  createDiscussion,
  fetchCategories,
} from "@/store/slices/discussionsSlice";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Tag,
  Sparkles,
  MessageSquare,
  BookOpen,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { RichTextEditor } from "./RichTextEditor";

export function CreateDiscussionButton() {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.discussions);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    richContent: "",
    contentType: "plain" as "plain" | "rich",
    category: "general",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      (!formData.content.trim() && !formData.richContent.trim())
    ) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const discussionData = {
        title: formData.title,
        content:
          formData.contentType === "rich"
            ? formData.richContent
            : formData.content,
        category: formData.category,
        tags: formData.tags,
      };

      await dispatch(createDiscussion(discussionData)).unwrap();
      toast.success("Discussion created successfully!");
      setIsOpen(false);
      setFormData({
        title: "",
        content: "",
        richContent: "",
        contentType: "plain",
        category: "general",
        tags: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create discussion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRichTextChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      richContent: content,
      contentType: "rich",
    }));
  };

  const handlePlainTextChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content: content,
      contentType: "plain",
    }));
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      general: MessageSquare,
      help: BookOpen,
      discussion: MessageSquare,
      showcase: Sparkles,
      question: Zap,
      tutorial: BookOpen,
      news: MessageSquare,
      meta: MessageSquare,
      "off-topic": MessageSquare,
    };
    return icons[category as keyof typeof icons] || MessageSquare;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base"
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
        New Discussion
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Create New Discussion
                  </h2>
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Share your thoughts with the community
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8"
            >
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-semibold text-gray-900 mb-3"
                >
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="What's your discussion about?"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  maxLength={300}
                />
                <p className="mt-2 text-sm text-gray-500">
                  {formData.title.length}/300 characters
                </p>
              </div>

              {/* Category and Tags Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-semibold text-gray-900 mb-3"
                  >
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all duration-200 appearance-none"
                    >
                      {categories.map((category) => {
                        const Icon = getCategoryIcon(category.id);
                        return (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        );
                      })}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label
                    htmlFor="tags"
                    className="block text-sm font-semibold text-gray-900 mb-3"
                  >
                    Tags
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      id="tags"
                      value={formData.tags}
                      onChange={(e) =>
                        handleInputChange("tags", e.target.value)
                      }
                      placeholder="react, javascript, web-development"
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Add relevant tags to help others find your discussion
                  </p>
                </div>
              </div>

              {/* Content Type Toggle */}
              <div className="bg-gray-50/50 rounded-xl p-4 sm:p-6 border border-gray-100">
                <label className="block text-sm font-semibold text-gray-900 mb-4">
                  Content Type
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      value="plain"
                      checked={formData.contentType === "plain"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          contentType: "plain",
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Plain Text</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="contentType"
                      value="rich"
                      checked={formData.contentType === "rich"}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          contentType: "rich",
                        }))
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Rich Text</span>
                  </label>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Content *
                </label>
                {formData.contentType === "rich" ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <RichTextEditor
                      value={formData.richContent}
                      onChange={handleRichTextChange}
                      placeholder="Share your thoughts, questions, or ideas..."
                    />
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={formData.content}
                      onChange={(e) => handlePlainTextChange(e.target.value)}
                      placeholder="Share your thoughts, questions, or ideas..."
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical bg-gray-50/50 transition-all duration-200"
                      maxLength={10000}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      {formData.content.length}/10,000 characters
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="border-gray-200 hover:bg-gray-50 px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !formData.title.trim() ||
                    (!formData.content.trim() && !formData.richContent.trim())
                  }
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
                >
                  {isSubmitting ? "Creating..." : "Create Discussion"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
