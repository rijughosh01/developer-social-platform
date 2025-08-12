"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FiX,
  FiImage,
  FiUpload,
  FiLoader,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiGithub,
  FiExternalLink,
  FiUsers,
  FiTag,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import {
  uploadImage,
  uploadMultipleImages,
  validateImageFile,
} from "@/lib/uploadUtils";
import ProjectTemplates from "./ProjectTemplates";
import CreationTips from "./CreationTips";
import CollaboratorInput from "./CollaboratorInput";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

interface FormData {
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  status: string;
  technologies: string[];
  githubUrl: string;
  liveUrl: string;
  image: string;
  tags: string[];
  collaborators: string[];
  screenshots: { url: string; caption: string }[];
}

interface Screenshot {
  file: File;
  preview: string;
  caption: string;
}

interface Collaborator {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: "developer" | "designer" | "tester" | "manager";
}

const CATEGORIES = [
  { value: "web", label: "Web Application", icon: "🌐" },
  { value: "mobile", label: "Mobile App", icon: "📱" },
  { value: "desktop", label: "Desktop App", icon: "💻" },
  { value: "api", label: "API/Backend", icon: "🔌" },
  { value: "library", label: "Library/Package", icon: "📦" },
  { value: "tool", label: "Tool/Utility", icon: "🛠️" },
  { value: "game", label: "Game", icon: "🎮" },
  { value: "other", label: "Other", icon: "📁" },
];

const STATUS_OPTIONS = [
  {
    value: "planning",
    label: "Planning",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "in-progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800",
  },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-800" },
];

const COMMON_TECHNOLOGIES = [
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "C++",
  "C#",
  "JavaScript",
  "TypeScript",
  "PHP",
  "Ruby",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "Firebase",
];

export default function CreateProjectModal({
  open,
  onClose,
  onProjectCreated,
}: CreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    shortDescription: "",
    category: "web",
    status: "completed",
    technologies: [],
    githubUrl: "",
    liveUrl: "",
    image: "",
    tags: [],
    collaborators: [],
    screenshots: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);
  const totalSteps = 4;

  // Keyboard shortcuts for better UX
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      if (e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target && target.tagName === "TEXTAREA") return;
        if (currentStep < totalSteps && isStepValid(currentStep)) {
          e.preventDefault();
          handleNext();
        } else if (currentStep === totalSteps && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          void handleSubmit({ preventDefault: () => {} } as any);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, currentStep]);

  const handleTemplateSelect = (template: any) => {
    setFormData({
      ...formData,
      ...template.template,
    });
    setShowTemplates(false);
    setCurrentStep(1);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = "Project title is required";
        }
        if (!formData.description.trim()) {
          newErrors.description = "Project description is required";
        }
        break;
      case 2:
        if (!formData.category) {
          newErrors.category = "Please select a category";
        }
        if (!formData.status) {
          newErrors.status = "Please select a status";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = Math.min(currentStep + 1, totalSteps);
      setCurrentStep(nextStep);
    }
  };

  const handlePrevious = () => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTechnologiesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const technologies = e.target.value
      .split(",")
      .map((tech) => tech.trim())
      .filter((tech) => tech.length > 0);
    setFormData((prev) => ({ ...prev, technologies }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleCollaboratorsChange = (newCollaborators: Collaborator[]) => {
    setCollaborators(newCollaborators);

    setFormData((prev) => ({
      ...prev,
      collaborators: newCollaborators.map((c) => c.username),
    }));
  };

  // Lightweight validation for disabling buttons
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.title.trim().length > 0 &&
          formData.description.trim().length > 0
        );
      case 2:
        return Boolean(formData.category) && Boolean(formData.status);
      default:
        return true;
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        validateImageFile(file, 5);
        setImageFile(file);
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
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleScreenshotSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        try {
          validateImageFile(file, 5);

          const reader = new FileReader();
          reader.onload = (e) => {
            const newScreenshot: Screenshot = {
              file,
              preview: e.target?.result as string,
              caption: "",
            };
            setScreenshots((prev) => [...prev, newScreenshot]);
          };
          reader.readAsDataURL(file);
        } catch (error) {
          toast.error(
            `Screenshot ${file.name}: ${
              error instanceof Error ? error.message : "Invalid file"
            }`
          );
        }
      });
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScreenshotCaption = (index: number, caption: string) => {
    setScreenshots((prev) =>
      prev.map((screenshot, i) =>
        i === index ? { ...screenshot, caption } : screenshot
      )
    );
  };

  const uploadScreenshots = async (
    screenshots: Screenshot[]
  ): Promise<{ url: string; caption: string }[]> => {
    const uploadedScreenshots = [];

    for (const screenshot of screenshots) {
      try {
        const url = await uploadImage(screenshot.file);
        uploadedScreenshots.push({
          url,
          caption: screenshot.caption,
        });
      } catch (error) {
        toast.error(`Failed to upload screenshot: ${screenshot.file.name}`);
      }
    }

    return uploadedScreenshots;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    setIsCreating(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Upload screenshots
      let uploadedScreenshots = formData.screenshots;
      if (screenshots.length > 0) {
        uploadedScreenshots = await uploadScreenshots(screenshots);
      }

      // Prepare collaborators data for backend
      const collaboratorsData = collaborators.map((collaborator) => ({
        username: collaborator.username,
        role: collaborator.role,
      }));

      const payload = {
        ...formData,
        image: imageUrl,
        screenshots: uploadedScreenshots,
        collaborators: collaboratorsData,
        shortDescription:
          formData.shortDescription || formData.description.substring(0, 200),
      };

      const response = await api.post("/projects", payload);

      // Enhanced success feedback
      const project = response.data.data;
      toast.success(`🎉 "${project.title}" created successfully!`, {
        duration: 4000,
        icon: "🎉",
      });

      // Show additional success information
      setTimeout(() => {
        toast.success(
          `Your project is now live! Share it with the community.`,
          {
            duration: 3000,
          }
        );
      }, 1000);

      onProjectCreated(response.data.data);
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setShowTemplates(true);
    setFormData({
      title: "",
      description: "",
      shortDescription: "",
      category: "web",
      status: "completed",
      technologies: [],
      githubUrl: "",
      liveUrl: "",
      image: "",
      tags: [],
      collaborators: [],
      screenshots: [],
    });
    setErrors({});
    setImageFile(null);
    setImagePreview(null);
    setScreenshots([]);
    setCollaborators([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Project
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {showTemplates
                ? "Choose Template"
                : `Step ${currentStep} of ${totalSteps}`}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        {!showTemplates && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? "bg-primary-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step < currentStep ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      step
                    )}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step < currentStep ? "bg-primary-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {showTemplates ? (
            <ProjectTemplates onSelectTemplate={handleTemplateSelect} />
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <CreationTips step={1} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your project title"
                      maxLength={100}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {formData.title.length}/100
                    </div>
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.description
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Describe your project in detail..."
                      maxLength={1000}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/1000
                    </div>
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <textarea
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="A brief summary of your project (optional)"
                      maxLength={200}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Category & Status */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <CreationTips step={2} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Project Category *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              category: category.value,
                            }));
                            setErrors((prev) => ({ ...prev, category: "" }));
                          }}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            formData.category === category.value
                              ? "border-primary-500 bg-primary-50 text-primary-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-2xl mb-2">{category.icon}</div>
                          <div className="text-sm font-medium">
                            {category.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Project Status *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              status: status.value,
                            }));
                            setErrors((prev) => ({ ...prev, status: "" }));
                          }}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            formData.status === status.value
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div
                            className={`text-sm font-medium px-2 py-1 rounded-full ${status.color}`}
                          >
                            {status.label}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.status && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.status}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Technologies & Links */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <CreationTips step={3} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technologies Used
                    </label>
                    <input
                      type="text"
                      value={formData.technologies.join(", ")}
                      onChange={handleTechnologiesChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., React, Node.js, MongoDB"
                    />
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Quick add:</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_TECHNOLOGIES.slice(0, 12).map((tech) => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => {
                              if (!formData.technologies.includes(tech)) {
                                setFormData((prev) => ({
                                  ...prev,
                                  technologies: [...prev.technologies, tech],
                                }));
                              }
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            + {tech}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiGithub className="inline w-4 h-4 mr-1" />
                        GitHub Repository
                      </label>
                      <input
                        type="url"
                        name="githubUrl"
                        value={formData.githubUrl}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiExternalLink className="inline w-4 h-4 mr-1" />
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        name="liveUrl"
                        value={formData.liveUrl}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="https://your-project.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiTag className="inline w-4 h-4 mr-1" />
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags.join(", ")}
                      onChange={handleTagsChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., open source, video editor, productivity"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Media & Collaboration */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <CreationTips step={4} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiImage className="inline w-4 h-4 mr-1" />
                      Project Image
                    </label>
                    {imagePreview ? (
                      <div className="relative group">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors"
                      >
                        <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-gray-600">
                          Click to upload project image
                        </p>
                        <p className="text-sm text-gray-500">Max 5MB</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiImage className="inline w-4 h-4 mr-1" />
                      Project Screenshots
                    </label>
                    <div
                      onClick={() => screenshotsInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors mb-4"
                    >
                      <FiUpload className="w-6 h-6 text-gray-400 mb-2" />
                      <p className="text-gray-600 text-sm">
                        Click to upload screenshots
                      </p>
                      <p className="text-xs text-gray-500">
                        Max 5MB per image, up to 10 screenshots
                      </p>
                    </div>
                    <input
                      ref={screenshotsInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleScreenshotSelect}
                      className="hidden"
                    />

                    {/* Screenshots Preview */}
                    {screenshots.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700">
                          Uploaded Screenshots ({screenshots.length}/10)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {screenshots.map((screenshot, index) => (
                            <div
                              key={index}
                              className="relative group border border-gray-200 rounded-lg overflow-hidden"
                            >
                              <img
                                src={screenshot.preview}
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeScreenshot(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                              <div className="p-3">
                                <input
                                  type="text"
                                  value={screenshot.caption}
                                  onChange={(e) =>
                                    updateScreenshotCaption(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  placeholder="Add caption (optional)"
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                  maxLength={100}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <CollaboratorInput
                    collaborators={collaborators}
                    onChange={handleCollaboratorsChange}
                    className="mb-6"
                  />
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!showTemplates && (
          <div className="flex items-center justify-between p-6 border-t-2 border-primary-200 bg-gradient-to-r from-gray-50 to-primary-50 sticky bottom-0 shadow-lg">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center gap-3">
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 || currentStep === 2) &&
                    !isStepValid(currentStep)
                  }
                  className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <FiArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isCreating}
                  className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
