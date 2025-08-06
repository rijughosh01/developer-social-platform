"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FiCode,
  FiBookOpen,
  FiTarget,
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiEye,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import {
  uploadImage,
  uploadMultipleImages,
  validateImageFile,
} from "@/lib/uploadUtils";

interface EnhancedCreateProjectModalProps {
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
  visibility: "public" | "private";
  featured: boolean;
}

interface Screenshot {
  file: File;
  preview: string;
  caption: string;
}

const STEPS = [
  { id: 1, title: "Basic Info", icon: FiInfo, description: "Project details and description" },
  { id: 2, title: "Tech Stack", icon: FiCode, description: "Technologies and tools used" },
  { id: 3, title: "Media", icon: FiImage, description: "Images and screenshots" },
  { id: 4, title: "Links & Settings", icon: FiExternalLink, description: "URLs and project settings" },
];

const CATEGORIES = [
  { value: "web", label: "Web Application", icon: "🌐", description: "Frontend, fullstack web apps" },
  { value: "mobile", label: "Mobile App", icon: "📱", description: "iOS, Android, React Native apps" },
  { value: "desktop", label: "Desktop App", icon: "💻", description: "Windows, Mac, Linux applications" },
  { value: "api", label: "API/Backend", icon: "🔌", description: "REST APIs, GraphQL, microservices" },
  { value: "library", label: "Library/Package", icon: "📦", description: "NPM packages, SDKs, frameworks" },
  { value: "tool", label: "Tool/Utility", icon: "🛠️", description: "CLI tools, productivity apps" },
  { value: "game", label: "Game", icon: "🎮", description: "Video games, game engines" },
  { value: "other", label: "Other", icon: "📂", description: "Other types of projects" },
];

const STATUS_OPTIONS = [
  {
    value: "planning",
    label: "Planning",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: "📋",
    description: "Project is in planning phase",
  },
  {
    value: "in-progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: "⚡",
    description: "Currently being developed",
  },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: "✅",
    description: "Project is finished and deployed",
  },
  {
    value: "archived",
    label: "Archived",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: "📦",
    description: "No longer actively maintained",
  },
];

const COMMON_TECHNOLOGIES = [
  // Frontend
  "React", "Vue.js", "Angular", "Svelte", "Next.js", "Nuxt.js", "Gatsby",
  // Backend
  "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Ruby on Rails",
  // Languages
  "JavaScript", "TypeScript", "Python", "Java", "C#", "Go", "Rust", "PHP", "Ruby",
  // Databases
  "MongoDB", "PostgreSQL", "MySQL", "Redis", "Firebase", "Supabase",
  // Mobile
  "React Native", "Flutter", "Swift", "Kotlin", "Ionic",
  // DevOps
  "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Vercel", "Netlify",
  // Other
  "GraphQL", "REST API", "Socket.IO", "Three.js", "D3.js", "Electron",
];

export default function EnhancedCreateProjectModal({
  open,
  onClose,
  onProjectCreated,
}: EnhancedCreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    shortDescription: "",
    category: "",
    status: "planning",
    technologies: [],
    githubUrl: "",
    liveUrl: "",
    image: "",
    tags: [],
    collaborators: [],
    screenshots: [],
    visibility: "public",
    featured: false,
  });

  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [techInput, setTechInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = "Project title is required";
        if (!formData.description.trim()) newErrors.description = "Project description is required";
        if (!formData.category) newErrors.category = "Please select a category";
        break;
      case 2:
        if (formData.technologies.length === 0) {
          newErrors.technologies = "Please add at least one technology";
        }
        break;
      case 4:
        if (formData.githubUrl && !isValidUrl(formData.githubUrl)) {
          newErrors.githubUrl = "Please enter a valid GitHub URL";
        }
        if (formData.liveUrl && !isValidUrl(formData.liveUrl)) {
          newErrors.liveUrl = "Please enter a valid URL";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addTechnology = () => {
    const tech = techInput.trim();
    if (tech && !formData.technologies.includes(tech)) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, tech],
      }));
      setTechInput("");
    }
  };

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech),
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      validateImageFile(file, 5);
      const imageUrl = await uploadImage(file);
      setFormData(prev => ({ ...prev, image: imageUrl }));
      toast.success("Project image uploaded successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleScreenshotUpload = async (files: FileList) => {
    if (files.length === 0) return;
    
    setUploadingScreenshots(true);
    try {
      const newScreenshots: Screenshot[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        validateImageFile(file, 5);
        const preview = URL.createObjectURL(file);
        newScreenshots.push({ file, preview, caption: "" });
      }
      
      setScreenshots(prev => [...prev, ...newScreenshots]);
      toast.success(`${files.length} screenshot(s) added!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add screenshots");
    } finally {
      setUploadingScreenshots(false);
    }
  };

  const uploadScreenshots = async (): Promise<{ url: string; caption: string }[]> => {
    const uploadedScreenshots: { url: string; caption: string }[] = [];
    
    for (const screenshot of screenshots) {
      try {
        const url = await uploadImage(screenshot.file);
        uploadedScreenshots.push({ url, caption: screenshot.caption });
      } catch (error) {
        console.error("Failed to upload screenshot:", error);
      }
    }
    
    return uploadedScreenshots;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (currentStep === 3) {
        handleScreenshotUpload(e.dataTransfer.files);
      } else {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    }
  }, [currentStep]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;

    try {
      setUploading(true);
      
      // Upload screenshots
      const uploadedScreenshots = await uploadScreenshots();
      
      const projectData = {
        ...formData,
        screenshots: uploadedScreenshots,
      };

      const response = await api.post("/projects", projectData);
      onProjectCreated(response.data.data);
      toast.success("Project created successfully!");
      onClose();
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        shortDescription: "",
        category: "",
        status: "planning",
        technologies: [],
        githubUrl: "",
        liveUrl: "",
        image: "",
        tags: [],
        collaborators: [],
        screenshots: [],
        visibility: "public",
        featured: false,
      });
      setScreenshots([]);
      setCurrentStep(1);
      setErrors({});
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to create project");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
            <p className="text-gray-600 mt-1">Share your amazing work with the community</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {isCompleted ? <FiCheck className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium ${
                        isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"
                      }`}>
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-4 ${
                      isCompleted ? "bg-green-300" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter your project title..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.title ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      placeholder="Brief one-line description..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      maxLength={120}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.shortDescription.length}/120 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Detailed Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Describe your project in detail..."
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        errors.description ? "border-red-300 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <div className="space-y-2">
                        {CATEGORIES.map((category) => (
                          <label
                            key={category.value}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                              formData.category === category.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={category.value}
                              checked={formData.category === category.value}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className="text-2xl mr-3">{category.icon}</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{category.label}</div>
                              <div className="text-sm text-gray-500">{category.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="space-y-2">
                        {STATUS_OPTIONS.map((status) => (
                          <label
                            key={status.value}
                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                              formData.status === status.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="status"
                              value={status.value}
                              checked={formData.status === status.value}
                              onChange={handleInputChange}
                              className="sr-only"
                            />
                            <div className="text-xl mr-3">{status.icon}</div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{status.label}</div>
                              <div className="text-sm text-gray-500">{status.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Tech Stack */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technologies Used *
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={techInput}
                        onChange={(e) => setTechInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                        placeholder="Add a technology..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addTechnology}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Common Technologies */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Popular technologies:</p>
                      <div className="flex flex-wrap gap-2">
                        {COMMON_TECHNOLOGIES.slice(0, 15).map((tech) => (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => {
                              if (!formData.technologies.includes(tech)) {
                                setFormData(prev => ({
                                  ...prev,
                                  technologies: [...prev.technologies, tech],
                                }));
                              }
                            }}
                            disabled={formData.technologies.includes(tech)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${
                              formData.technologies.includes(tech)
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Technologies */}
                    {formData.technologies.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Selected technologies:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {tech}
                              <button
                                type="button"
                                onClick={() => removeTechnology(tech)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {errors.technologies && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.technologies}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (Optional)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        placeholder="Add a tag..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FiTag className="w-4 h-4" />
                      </button>
                    </div>

                    {formData.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                            >
                              #{tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-green-600 hover:text-green-800"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Media */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Project Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Image
                    </label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {formData.image ? (
                        <div className="relative">
                          <img
                            src={formData.image}
                            alt="Project"
                            className="max-w-full h-48 mx-auto object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-8">
                          <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="mt-4">
                            <p className="text-sm text-gray-600">
                              Drag and drop an image here, or{" "}
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                browse
                              </button>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              PNG, JPG, GIF up to 5MB
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                        className="hidden"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                          <FiLoader className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screenshots */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Screenshots (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => screenshotInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Upload screenshots
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Multiple images allowed
                        </p>
                      </div>
                      <input
                        ref={screenshotInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handleScreenshotUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>

                    {screenshots.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                          Screenshots ({screenshots.length})
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {screenshots.map((screenshot, index) => (
                            <div key={index} className="relative">
                              <img
                                src={screenshot.preview}
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border"
                              />
                              <button
                                type="button"
                                onClick={() => setScreenshots(prev => prev.filter((_, i) => i !== index))}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <FiX className="w-3 h-3" />
                              </button>
                              <input
                                type="text"
                                placeholder="Caption..."
                                value={screenshot.caption}
                                onChange={(e) => {
                                  const newScreenshots = [...screenshots];
                                  newScreenshots[index].caption = e.target.value;
                                  setScreenshots(newScreenshots);
                                }}
                                className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Links & Settings */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub URL
                      </label>
                      <div className="relative">
                        <FiGithub className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="url"
                          name="githubUrl"
                          value={formData.githubUrl}
                          onChange={handleInputChange}
                          placeholder="https://github.com/username/repo"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.githubUrl ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.githubUrl && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" />
                          {errors.githubUrl}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Live Demo URL
                      </label>
                      <div className="relative">
                        <FiExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="url"
                          name="liveUrl"
                          value={formData.liveUrl}
                          onChange={handleInputChange}
                          placeholder="https://yourproject.com"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.liveUrl ? "border-red-300 bg-red-50" : "border-gray-300"
                          }`}
                        />
                      </div>
                      {errors.liveUrl && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" />
                          {errors.liveUrl}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Project Settings</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="visibility"
                          value="public"
                          checked={formData.visibility === "public"}
                          onChange={handleInputChange}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">Public</div>
                          <div className="text-sm text-gray-500">Anyone can view this project</div>
                        </div>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="visibility"
                          value="private"
                          checked={formData.visibility === "private"}
                          onChange={handleInputChange}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">Private</div>
                          <div className="text-sm text-gray-500">Only you can view this project</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FiArrowLeft className="w-4 h-4" />
                Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Create Project
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}