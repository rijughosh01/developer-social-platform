"use client";

import React, { useState, useEffect } from "react";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { createPoll } from "@/store/slices/discussionsSlice";
import { Button } from "@/components/ui/button";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Zap,
} from "lucide-react";

interface CreatePollModalProps {
  discussionId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CreatePollModal: React.FC<CreatePollModalProps> = ({
  discussionId,
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isMultipleChoice, setIsMultipleChoice] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setQuestion("");
      setOptions(["", ""]);
      setIsMultipleChoice(false);
      setExpiresAt("");
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!question.trim()) {
      newErrors.question = "Question is required";
    } else if (question.trim().length < 5) {
      newErrors.question = "Question must be at least 5 characters";
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    } else {
      validOptions.forEach((option, index) => {
        if (option.trim().length < 1) {
          newErrors[`option${index}`] = "Option cannot be empty";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);

      const newErrors = { ...errors };
      delete newErrors.options;
      setErrors(newErrors);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));

      const newErrors = { ...errors };
      delete newErrors[`option${index}`];
      setErrors(newErrors);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    if (errors[`option${index}`]) {
      const newErrors = { ...errors };
      delete newErrors[`option${index}`];
      setErrors(newErrors);
    }
  };

  const handleQuestionChange = (value: string) => {
    setQuestion(value);
    if (errors.question) {
      const newErrors = { ...errors };
      delete newErrors.question;
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createPoll({
          discussionId,
          pollData: {
            question: question.trim(),
            options: options.filter((opt) => opt.trim()),
            isMultipleChoice,
            expiresAt: expiresAt || undefined,
          },
        })
      ).unwrap();

      onClose();
    } catch (error) {
      console.error("Failed to create poll:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const validOptions = options.filter((opt) => opt.trim());
  const isValid = question.trim().length >= 5 && validOptions.length >= 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 flex-shrink-0 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Poll</h2>
              <p className="text-sm text-blue-100">
                Engage your community with a quick poll
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:text-white hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Question Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <label className="text-sm font-semibold text-gray-800">
                  Poll Question
                </label>
                <span className="text-red-500">*</span>
              </div>
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  placeholder="What would you like to ask your community?"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none transition-all duration-200 ${
                    errors.question
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-gray-50"
                  } text-gray-800 placeholder-gray-500`}
                  rows={3}
                  maxLength={300}
                  required
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    {errors.question && (
                      <div className="flex items-center gap-1 text-red-500 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {errors.question}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      question.length > 280 ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {question.length}/300
                  </span>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                <label className="text-sm font-semibold text-gray-800">
                  Poll Options
                </label>
                <span className="text-red-500">*</span>
              </div>

              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="relative group">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-700">
                        {index + 1}
                      </div>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          placeholder={`Option ${index + 1}`}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all duration-200 ${
                            errors[`option${index}`]
                              ? "border-red-400 bg-red-50"
                              : "border-gray-300 bg-gray-50"
                          } text-gray-800 placeholder-gray-500`}
                          maxLength={200}
                          required
                        />
                        {option.trim() && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOption(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {errors[`option${index}`] && (
                      <div className="flex items-center gap-1 text-red-500 text-xs mt-1 ml-9">
                        <AlertCircle className="w-3 h-3" />
                        {errors[`option${index}`]}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {errors.options && (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {errors.options}
                </div>
              )}

              {options.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="w-auto px-4 py-2 border-dashed border-gray-400 text-gray-600 hover:text-blue-600 hover:border-blue-500 rounded-lg transition-all duration-200"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option ({options.length}/10)
                </Button>
              )}
            </div>

            {/* Settings Section */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <label className="text-sm font-semibold text-gray-800">
                  Poll Settings
                </label>
              </div>

              {/* Multiple Choice Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Multiple Choice
                    </label>
                    <p className="text-xs text-gray-600">
                      Allow users to select multiple options
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMultipleChoice}
                    onChange={(e) => setIsMultipleChoice(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Expiration Date */}
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-800">
                      Expiration Date
                    </label>
                    <p className="text-xs text-gray-600">
                      Optional - when the poll should close
                    </p>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50 text-gray-800"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            {/* Preview */}
            {isValid && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Poll Preview
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-800">
                    {question}
                  </p>
                  <div className="space-y-1">
                    {validOptions.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        {option}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2">
                    <span>{validOptions.length} options</span>
                    {isMultipleChoice && <span>• Multiple choice</span>}
                    {expiresAt && (
                      <span>
                        • Expires {new Date(expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer  */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0 rounded-b-3xl">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 h-12"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || !isValid}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed h-12"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Poll...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Create Poll
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePollModal;
