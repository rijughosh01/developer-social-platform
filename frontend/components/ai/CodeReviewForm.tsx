"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import { codeReview, clearError } from "@/store/slices/aiSlice";
import { parseAIError } from "@/lib/utils";
import {
  Code,
  Send,
  FileText,
  Languages,
  X,
  Upload,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  Clock,
  FileCode,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";

interface CodeReviewFormProps {
  onClose: () => void;
}

const CodeReviewForm: React.FC<CodeReviewFormProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, currentModel, tokenUsage } = useSelector(
    (state: RootState) => state.ai
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [showPreview, setShowPreview] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("Current model changed to:", currentModel);
  }, [currentModel]);

  const languages = [
    {
      value: "javascript",
      label: "JavaScript",
      icon: "⚡",
      extension: ".js",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "typescript",
      label: "TypeScript",
      icon: "🔷",
      extension: ".ts",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "python",
      label: "Python",
      icon: "🐍",
      extension: ".py",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "java",
      label: "Java",
      icon: "☕",
      extension: ".java",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "cpp",
      label: "C++",
      icon: "⚙️",
      extension: ".cpp",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "csharp",
      label: "C#",
      icon: "💜",
      extension: ".cs",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "php",
      label: "PHP",
      icon: "🐘",
      extension: ".php",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "ruby",
      label: "Ruby",
      icon: "💎",
      extension: ".rb",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "go",
      label: "Go",
      icon: "🔵",
      extension: ".go",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "rust",
      label: "Rust",
      icon: "🦀",
      extension: ".rs",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "swift",
      label: "Swift",
      icon: "🍎",
      extension: ".swift",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "kotlin",
      label: "Kotlin",
      icon: "🟠",
      extension: ".kt",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "scala",
      label: "Scala",
      icon: "🔴",
      extension: ".scala",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "html",
      label: "HTML",
      icon: "🌐",
      extension: ".html",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "css",
      label: "CSS",
      icon: "🎨",
      extension: ".css",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "sql",
      label: "SQL",
      icon: "🗄️",
      extension: ".sql",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "bash",
      label: "Bash",
      icon: "💻",
      extension: ".sh",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "json",
      label: "JSON",
      icon: "📄",
      extension: ".json",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "yaml",
      label: "YAML",
      icon: "📋",
      extension: ".yml",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "markdown",
      label: "Markdown",
      icon: "📝",
      extension: ".md",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const selectedLanguage = languages.find((lang) => lang.value === language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading) return;

    console.log("Code Review - Current Model:", currentModel);
    console.log("Code Review - Submitting with model:", currentModel);
    console.log("Code Review - Redux State currentModel:", currentModel);
    console.log("Code Review - Token Usage:", tokenUsage);

    await dispatch(
      codeReview({ code: code.trim(), language, model: currentModel })
    );
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);

      // Try to detect language from file extension
      const extension = file.name.split(".").pop()?.toLowerCase();
      const detectedLanguage = languages.find(
        (lang) => lang.extension.slice(1) === extension
      );
      if (detectedLanguage) {
        setLanguage(detectedLanguage.value);
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const clearCode = () => {
    setCode("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-auto max-h-[95vh] overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative flex items-center justify-between p-6 text-white">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center space-x-2">
                <span>AI Code Review</span>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h2>
              <p className="text-sm opacity-90 mt-1 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Get expert feedback on your code</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Language Selection */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Languages className="w-4 h-4 text-green-600" />
              <span>Programming Language</span>
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setIsLanguageDropdownOpen(!isLanguageDropdownOpen)
                }
                className="w-full flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{selectedLanguage?.icon}</span>
                  <span className="font-medium text-gray-900">
                    {selectedLanguage?.label}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${selectedLanguage?.color}`}
                  >
                    {selectedLanguage?.extension}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isLanguageDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLanguageDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                  <div className="p-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.value);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-lg">{lang.icon}</span>
                        <span className="font-medium text-gray-900">
                          {lang.label}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${lang.color}`}
                        >
                          {lang.extension}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span>Upload Code File</span>
              <span className="text-gray-500 text-xs">(Optional)</span>
            </label>

            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragOver
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept=".js,.ts,.py,.java,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.sql,.sh,.json,.yml,.md"
                className="hidden"
              />

              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {isDragOver
                      ? "Drop your file here"
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports {languages.length} programming languages
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Code Input */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Code className="w-4 h-4 text-green-600" />
                <span>Code to Review</span>
                <span className="text-red-500">*</span>
              </label>

              <div className="flex items-center space-x-2">
                {code && (
                  <>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={clearCode}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Clear code"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your ${selectedLanguage?.label} code here...\n\nExample:\nfunction example() {\n  console.log("Hello, World!");\n}`}
                className="w-full h-48 px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-gray-50"
                required
              />

              {!code && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <FileCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Start typing or upload a file</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Code Preview */}
          {showPreview && code && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Code Preview</span>
              </label>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                  <span className="text-white text-sm font-medium">
                    {selectedLanguage?.label}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {code.split("\n").length} lines
                  </span>
                </div>
                <SyntaxHighlighter
                  language={language}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    fontSize: "0.875rem",
                    lineHeight: "1.5",
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">
                    Error Occurred
                  </h4>
                  <p className="text-sm text-red-700 leading-relaxed">
                    {parseAIError(error)}
                  </p>

                  {/* Error-specific actions */}
                  {error.includes("Daily usage limit exceeded") && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-800 mb-2">
                            Daily Request Limit Reached
                          </p>
                          <p className="text-xs text-orange-700 mb-2">
                            You've reached the daily limit for Code Review
                            requests (50 per day). Limits reset at midnight.
                          </p>
                          <p className="text-xs text-orange-600 mb-2">
                            💡 <strong>Tip:</strong> Try using the "General"
                            context in the main AI Chatbot for code review
                            questions.
                          </p>
                          <p className="text-xs text-orange-600">
                            🔧 <strong>Current Model:</strong> {currentModel}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error.includes("Daily token limit exceeded") && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Zap className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-orange-800 mb-2">
                            Daily Token Limit Reached
                          </p>
                          <p className="text-xs text-orange-700 mb-2">
                            You've used all your daily tokens for the current
                            model. Limits reset at midnight.
                          </p>
                          <p className="text-xs text-orange-600 mb-2">
                            💡 <strong>Tip:</strong> Switch to a model with
                            available tokens in the main AI Chatbot.
                          </p>
                          <p className="text-xs text-orange-600">
                            🔧 <strong>Current Model:</strong> {currentModel}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {error.includes("Rate limit exceeded") && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Rate Limit Exceeded
                          </p>
                          <p className="text-xs text-yellow-700 mb-2">
                            You're sending requests too quickly. Please wait a
                            moment before trying again.
                          </p>
                          <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            Try Again Later
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim() || isLoading}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Reviewing Code...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Get Code Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CodeReviewForm;
