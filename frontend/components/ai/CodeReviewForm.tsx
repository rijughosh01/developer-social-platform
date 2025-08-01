"use client";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import { codeReview } from "@/store/slices/aiSlice";
import { Code, Send, FileText, Languages, X } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeReviewFormProps {
  onClose: () => void;
}

const CodeReviewForm: React.FC<CodeReviewFormProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.ai);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [showPreview, setShowPreview] = useState(false);

  const languages = [
    { value: "javascript", label: "JavaScript", extension: ".js" },
    { value: "typescript", label: "TypeScript", extension: ".ts" },
    { value: "python", label: "Python", extension: ".py" },
    { value: "java", label: "Java", extension: ".java" },
    { value: "cpp", label: "C++", extension: ".cpp" },
    { value: "csharp", label: "C#", extension: ".cs" },
    { value: "php", label: "PHP", extension: ".php" },
    { value: "ruby", label: "Ruby", extension: ".rb" },
    { value: "go", label: "Go", extension: ".go" },
    { value: "rust", label: "Rust", extension: ".rs" },
    { value: "swift", label: "Swift", extension: ".swift" },
    { value: "kotlin", label: "Kotlin", extension: ".kt" },
    { value: "scala", label: "Scala", extension: ".scala" },
    { value: "html", label: "HTML", extension: ".html" },
    { value: "css", label: "CSS", extension: ".css" },
    { value: "sql", label: "SQL", extension: ".sql" },
    { value: "bash", label: "Bash", extension: ".sh" },
    { value: "json", label: "JSON", extension: ".json" },
    { value: "yaml", label: "YAML", extension: ".yml" },
    { value: "markdown", label: "Markdown", extension: ".md" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || isLoading) return;

    await dispatch(codeReview({ code: code.trim(), language }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Code className="w-5 h-5 sm:w-6 sm:h-6" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">AI Code Review</h2>
            <p className="text-xs sm:text-sm opacity-90">
              Get expert feedback on your code
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
        >
          <span className="sr-only">Close</span>
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 space-y-4 sm:space-y-6"
      >
        {/* Language Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Languages className="w-4 h-4 inline mr-2" />
            Programming Language *
          </label>
          <select
            aria-label="Programming Language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Upload Code File (Optional)
          </label>
          <input
            aria-label="Upload Code File"
            type="file"
            onChange={handleFileUpload}
            accept=".js,.ts,.py,.java,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.sql,.sh,.json,.yml,.md"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Code className="w-4 h-4 inline mr-2" />
            Code to Review *
          </label>
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Paste your ${
                languages.find((l) => l.value === language)?.label
              } code here...`}
              className="w-full h-40 sm:h-64 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              required
            />
            <div className="absolute top-2 right-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                {showPreview ? "Hide Preview" : "Show Preview"}
              </button>
            </div>
          </div>
        </div>

        {/* Code Preview */}
        {showPreview && code && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code Preview
            </label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <SyntaxHighlighter
                language={language}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                }}
              >
                {code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!code.trim() || isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Reviewing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Get Code Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CodeReviewForm;
