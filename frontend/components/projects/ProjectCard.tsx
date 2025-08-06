"use client";
import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiStar,
  FiExternalLink,
  FiGithub,
  FiEdit,
  FiTrash2,
  FiMessageSquare,
  FiClock,
  FiHeart,
  FiEye,
  FiCode,
  FiUsers,
  FiTrendingUp,
  FiAward,
  FiBookmark,
  FiShare2,
  FiMoreHorizontal,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import { getAvatarUrl } from "@/lib/utils";
import toast from "react-hot-toast";

interface Project {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  githubUrl?: string;
  liveUrl?: string;
  likesCount?: number;
  isLiked?: boolean;
  image?: string;
  owner?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    avatar?: string;
  };
  tags?: string[];
  category: string;
  status: string;
  technologies?: string[];
  screenshots?: { url: string; caption: string }[];
  viewsCount?: number;
  forksCount?: number;
  collaboratorsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  featured?: boolean;
}

interface User {
  _id: string;
  username: string;
}

interface ProjectCardProps {
  project: Project;
  user?: User | null;
  index?: number;
  viewMode?: "grid" | "list";
  onStar: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onEdit: (project: Project) => void;
  onView: (project: Project) => void;
  className?: string;
}

const CATEGORIES = [
  { value: "web", label: "Web App", icon: "🌐", color: "bg-blue-100 text-blue-700" },
  { value: "mobile", label: "Mobile", icon: "📱", color: "bg-green-100 text-green-700" },
  { value: "desktop", label: "Desktop", icon: "💻", color: "bg-purple-100 text-purple-700" },
  { value: "api", label: "API/Backend", icon: "🔌", color: "bg-orange-100 text-orange-700" },
  { value: "library", label: "Library", icon: "📦", color: "bg-indigo-100 text-indigo-700" },
  { value: "tool", label: "Tool", icon: "🛠️", color: "bg-yellow-100 text-yellow-700" },
  { value: "game", label: "Game", icon: "🎮", color: "bg-red-100 text-red-700" },
  { value: "other", label: "Other", icon: "📂", color: "bg-gray-100 text-gray-700" },
];

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning", color: "bg-yellow-100 text-yellow-800", icon: "📝" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-800", icon: "⚡" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800", icon: "✅" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-800", icon: "📦" },
];

export default function ProjectCard({
  project,
  user,
  index = 0,
  viewMode = "grid",
  onStar,
  onDelete,
  onEdit,
  onView,
  className = "",
}: ProjectCardProps) {
  const isOwner = user?._id === project.owner?._id;
  const categoryData = CATEGORIES.find(cat => cat.value === project.category);
  const statusData = STATUS_OPTIONS.find(status => status.value === project.status);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: project.title,
          text: project.shortDescription || project.description,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Project link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
        className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-gray-200 overflow-hidden cursor-pointer ${className}`}
        onClick={() => onView(project)}
      >
        <div className="flex">
          {/* Project Image */}
          <div className="relative w-48 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex-shrink-0">
            {project.image ? (
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-3xl opacity-30">
                  {categoryData?.icon || "📁"}
                </div>
              </div>
            )}
            
            {/* Featured Badge */}
            {project.featured && (
              <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                <FiAward className="w-3 h-3" />
                Featured
              </div>
            )}

            {/* Quick Actions Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-1">
                {project.liveUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(project.liveUrl, "_blank");
                    }}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-1.5 rounded-full transition-all"
                    title="View Live Demo"
                  >
                    <FiExternalLink className="w-3 h-3" />
                  </button>
                )}
                {project.githubUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(project.githubUrl, "_blank");
                    }}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-1.5 rounded-full transition-all"
                    title="View on GitHub"
                  >
                    <FiGithub className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img
                    src={getAvatarUrl(project.owner)}
                    alt="Owner"
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-white shadow-sm"
                  />
                  <Link
                    href={`/profile/${project.owner?.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    {project.owner?.firstName} {project.owner?.lastName}
                  </Link>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {formatDate(project.createdAt)}
                  </span>
                </div>
                
                {/* Category & Status */}
                <div className="flex items-center gap-1">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${categoryData?.color || 'bg-gray-100 text-gray-700'}`}>
                    {categoryData?.icon} {categoryData?.label || project.category}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusData?.color || 'bg-gray-100 text-gray-700'}`}>
                    {statusData?.icon} {statusData?.label || project.status}
                  </span>
                </div>
              </div>

              {/* Title and Description */}
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">
                {project.shortDescription || project.description}
              </p>

              {/* Technologies */}
              {project.technologies && project.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.technologies.slice(0, 4).map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">
                      +{project.technologies.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FiHeart className="w-4 h-4" />
                  {project.likesCount || 0}
                </div>
                {project.viewsCount && (
                  <div className="flex items-center gap-1">
                    <FiEye className="w-4 h-4" />
                    {project.viewsCount}
                  </div>
                )}
                {project.forksCount && (
                  <div className="flex items-center gap-1">
                    <FiCode className="w-4 h-4" />
                    {project.forksCount}
                  </div>
                )}
                {project.collaboratorsCount && (
                  <div className="flex items-center gap-1">
                    <FiUsers className="w-4 h-4" />
                    {project.collaboratorsCount}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Star Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStar(project._id);
                  }}
                  className={`p-1.5 rounded-full transition-all ${
                    project.isLiked
                      ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                  title={project.isLiked ? "Unstar" : "Star"}
                >
                  <FiStar className={`w-4 h-4 ${project.isLiked ? "fill-current" : ""}`} />
                </button>

                {/* Share Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                  }}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  title="Share Project"
                >
                  <FiShare2 className="w-4 h-4" />
                </button>

                {/* Message Button (for non-owners) */}
                {!isOwner && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/messages?userId=${project.owner?._id}`;
                    }}
                    className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                    title="Message Owner"
                  >
                    <FiMessageSquare className="w-4 h-4" />
                  </button>
                )}

                {/* Owner Actions */}
                {isOwner && (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(project);
                      }}
                      className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                      title="Edit Project"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(project._id);
                      }}
                      className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                      title="Delete Project"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 overflow-hidden cursor-pointer ${className}`}
      onClick={() => onView(project)}
    >
      {/* Featured Badge */}
      {project.featured && (
        <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FiAward className="w-3 h-3" />
          Featured
        </div>
      )}

      {/* Trending Badge */}
      {project.likesCount && project.likesCount > 10 && (
        <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-pink-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FiTrendingUp className="w-3 h-3" />
          Hot
        </div>
      )}

      {/* Project Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-20">
              {categoryData?.icon || "📁"}
            </div>
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            {project.liveUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(project.liveUrl, "_blank");
                }}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all transform hover:scale-110"
                title="View Live Demo"
              >
                <FiExternalLink className="w-4 h-4" />
              </button>
            )}
            {project.githubUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(project.githubUrl, "_blank");
                }}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full transition-all transform hover:scale-110"
                title="View on GitHub"
              >
                <FiGithub className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Screenshots Preview */}
        {project.screenshots && project.screenshots.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {project.screenshots.slice(0, 3).map((screenshot, screenshotIndex) => (
              <div
                key={screenshotIndex}
                className="w-8 h-6 rounded border-2 border-white shadow-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
              >
                <img
                  src={screenshot.url}
                  alt={`Screenshot ${screenshotIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {project.screenshots.length > 3 && (
              <div className="w-8 h-6 rounded border-2 border-white shadow-sm bg-black bg-opacity-50 flex items-center justify-center text-white text-xs font-bold">
                +{project.screenshots.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Content */}
      <div className="p-6">
        {/* Owner Info */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={getAvatarUrl(project.owner)}
            alt="Owner"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
          />
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${project.owner?.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors truncate block"
            >
              {project.owner?.firstName} {project.owner?.lastName}
            </Link>
            <p className="text-xs text-gray-500 truncate">@{project.owner?.username}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <FiClock className="w-3 h-3" />
            {formatDate(project.createdAt)}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {project.shortDescription || project.description}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                #{tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Technologies */}
        {project.technologies && project.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {project.technologies.slice(0, 4).map((tech, techIndex) => (
              <span
                key={techIndex}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                {tech}
              </span>
            ))}
            {project.technologies.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-medium">
                +{project.technologies.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Category & Status */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${categoryData?.color || 'bg-gray-100 text-gray-700'}`}>
            {categoryData?.icon} {categoryData?.label || project.category}
          </span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusData?.color || 'bg-gray-100 text-gray-700'}`}>
            {statusData?.icon} {statusData?.label || project.status}
          </span>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1 hover:text-red-500 transition-colors">
              <FiHeart className="w-4 h-4" />
              {project.likesCount || 0}
            </div>
            {project.viewsCount && (
              <div className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                <FiEye className="w-4 h-4" />
                {project.viewsCount}
              </div>
            )}
            {project.forksCount && (
              <div className="flex items-center gap-1 hover:text-green-500 transition-colors">
                <FiCode className="w-4 h-4" />
                {project.forksCount}
              </div>
            )}
            {project.collaboratorsCount && (
              <div className="flex items-center gap-1 hover:text-purple-500 transition-colors">
                <FiUsers className="w-4 h-4" />
                {project.collaboratorsCount}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Star Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStar(project._id);
              }}
              className={`p-2 rounded-full transition-all transform hover:scale-110 ${
                project.isLiked
                  ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={project.isLiked ? "Unstar" : "Star"}
            >
              <FiStar className={`w-4 h-4 ${project.isLiked ? "fill-current" : ""}`} />
            </button>

            {/* Share Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all transform hover:scale-110"
              title="Share Project"
            >
              <FiShare2 className="w-4 h-4" />
            </button>

            {/* Message Button (for non-owners) */}
            {!isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/messages?userId=${project.owner?._id}`;
                }}
                className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all transform hover:scale-110"
                title="Message Owner"
              >
                <FiMessageSquare className="w-4 h-4" />
              </button>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all transform hover:scale-110"
                  title="Edit Project"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project._id);
                  }}
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all transform hover:scale-110"
                  title="Delete Project"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}