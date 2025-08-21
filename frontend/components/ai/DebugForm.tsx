"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import { debugCode, clearError } from "@/store/slices/aiSlice";
import { parseAIError } from "@/lib/utils";
import {
  Bug,
  Send,
  FileText,
  Languages,
  AlertTriangle,
  X,
  Settings,
  Crown,
  Cpu,
  Check,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";

interface DebugFormProps {
  onClose: () => void;
}

const DebugForm: React.FC<DebugFormProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, currentModel } = useSelector(
    (state: RootState) => state.ai
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    console.log("Current model changed to:", currentModel);
  }, [currentModel]);

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
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !errorMessage.trim() || isLoading) return;

    await dispatch(
      debugCode({
        code: code.trim(),
        error: errorMessage.trim(),
        language,
        model: currentModel,
      })
    );
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
      <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-t-lg sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Bug className="w-5 h-5 sm:w-6 sm:h-6" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">
              AI Code Debugging
            </h2>
            <p className="text-xs sm:text-sm opacity-90">
              Get help fixing your code errors
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <span className="sr-only">Close</span>
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
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
            aria-label="Select programming language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
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
            accept=".js,.ts,.py,.java,.cpp,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.html,.css,.sql,.sh"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Bug className="w-4 h-4 inline mr-2" />
            Code with Error *
          </label>
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`Paste your ${
                languages.find((l) => l.value === language)?.label
              } code that has an error...`}
              className="w-full h-32 sm:h-48 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
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

        {/* Error Message Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Error Message *
          </label>
          <textarea
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="Paste the exact error message you're getting..."
            className="w-full h-20 sm:h-24 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none bg-red-50"
            required
          />
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
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-800 mb-1">
                  Error Occurred
                </h4>
                <p className="text-sm text-red-700 leading-relaxed">
                  {parseAIError(error)}
                </p>

                {error.includes("Daily usage limit exceeded") && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 mb-2">
                      ⏰ <strong>Daily Request Limit Reached:</strong> You've
                      reached the daily limit for Debug requests (100 per day).
                      Limits reset at midnight.
                    </p>
                    <p className="text-xs text-orange-600 mb-2">
                      💡 <strong>Tip:</strong> Try using the "General" context
                      in the main AI Chatbot for debugging questions, or wait
                      until tomorrow.
                    </p>
                    <p className="text-xs text-orange-600">
                      🔧 <strong>Current Model:</strong> {currentModel} - This
                      is a request limit, not a token limit.
                    </p>
                  </div>
                )}

                {error.includes("Daily token limit exceeded") && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700 mb-2">
                      ⏰ <strong>Daily Token Limit Reached:</strong> You've used
                      all your daily tokens for the current model. Limits reset
                      at midnight.
                    </p>
                    <p className="text-xs text-orange-600 mb-2">
                      💡 <strong>Tip:</strong> Switch to a model with available
                      tokens in the main AI Chatbot to continue.
                    </p>
                    <p className="text-xs text-orange-600">
                      🔧 <strong>Current Model:</strong> {currentModel} - This
                      model has no remaining tokens for today.
                    </p>
                  </div>
                )}

                {error.includes("Rate limit exceeded") && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700 mb-2">
                      ⚡ <strong>Rate Limit:</strong> You're sending requests
                      too quickly. Please wait a moment before trying again.
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      Try Again Later
                    </button>
                  </div>
                )}
              </div>
            </div>
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
            disabled={!code.trim() || !errorMessage.trim() || isLoading}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-sm"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Debugging...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Debug Code</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DebugForm;
