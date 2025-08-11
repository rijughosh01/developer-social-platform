"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FiFolder,
  FiStar,
  FiGitBranch,
  FiTrash2,
  FiExternalLink,
  FiGithub,
  FiArrowRight,
  FiZap,
  FiEye,
  FiCode,
  FiGlobe,
  FiUsers,
  FiCalendar
} from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { fetchProjects } from "@/store/slices/projectsSlice";
import { api } from "@/lib/api";
import ProjectDetailsModal from "@/app/projects/ProjectDetailsModal";
import { getAvatarUrl } from "@/lib/utils";

export function SuggestedProjects({ limit = 5 }: { limit?: number }) {
  const dispatch = useAppDispatch();
  const { projects, isLoading } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [localProjects, setLocalProjects] = useState(projects);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects({ limit }));
  }, [dispatch, limit]);

  useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  const handleStar = async (projectId: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/like`);
      setLocalProjects((projects) =>
        projects.map((p) =>
          p._id === projectId
            ? {
                ...p,
                likesCount: res.data.data.likesCount,
                isLiked: res.data.data.isLiked,
              }
            : p
        )
      );
      toast.success(
        res.data.data.isLiked ? "Project starred!" : "Star removed!"
      );
    } catch (err: any) {
      toast.error("Failed to star project");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    )
      return;
    try {
      await api.delete(`/projects/${projectId}`);
      setLocalProjects((projects) =>
        projects.filter((p) => p._id !== projectId)
      );
      toast.success("Project deleted!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete project");
    }
  };

  const suggestedProjects = localProjects.slice(0, limit);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <FiFolder className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Suggested Projects
              </h3>
              <p className="text-sm text-gray-600">
                Discover amazing projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
            <FiZap className="w-3 h-3" />
            <span>New</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="h-32 bg-gray-200 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestedProjects.map((project) => (
              <div
                key={project._id}
                className="group cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setSelectedProject(project);
                  setModalOpen(true);
                }}
              >
                <div className="bg-gray-50 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl border border-transparent hover:border-green-200 transition-all duration-200 overflow-hidden">
                  {/* Project Image */}
                  {project.image && (
                    <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      
                      {/* Action Buttons Overlay */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border backdrop-blur-sm transition-all duration-200 ${
                            project.isLiked
                              ? "bg-yellow-500/90 text-white border-yellow-400"
                              : "bg-white/90 text-gray-700 border-white/50 hover:bg-white"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStar(project._id);
                          }}
                          title={project.isLiked ? "Unstar" : "Star"}
                        >
                          <FiStar
                            className={`w-3 h-3 ${project.isLiked ? "fill-current" : ""}`}
                          />
                          <span>{project.likesCount || 0}</span>
                        </button>
                        {user?._id === (project as any).owner?._id && (
                          <button
                            className="p-1.5 rounded-lg bg-red-500/90 text-white border border-red-400 backdrop-blur-sm hover:bg-red-600 transition-all duration-200"
                            title="Delete project"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project._id);
                            }}
                          >
                            <FiTrash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Project Content */}
                  <div className="p-4">
                    
                    <div className="mb-3">
                      <h4 className="text-base font-semibold text-gray-900 truncate mb-1 group-hover:text-green-600 transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium border border-green-200"
                          >
                            #{tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Project Links */}
                    <div className="flex items-center gap-2 mb-3">
                      {project.liveUrl && (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-medium border border-green-200 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.liveUrl, "_blank");
                          }}
                        >
                          <FiGlobe className="w-3 h-3" />
                          Live
                        </button>
                      )}
                      {project.githubUrl && (
                        <button
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium border border-gray-200 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.githubUrl, "_blank");
                          }}
                        >
                          <FiGithub className="w-3 h-3" />
                          GitHub
                        </button>
                      )}
                    </div>

                    {/* Project Owner */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                          <img
                            src={getAvatarUrl(project.owner)}
                            alt="Owner Avatar"
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {project.owner?.firstName} {project.owner?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {project.createdAt && new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* View Button */}
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 group-hover:bg-green-50 group-hover:border-green-200 transition-all duration-200">
                        <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-t border-gray-100">
        <Link
          href="/projects"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-100 rounded-xl transition-all duration-200 group"
        >
          <span>View all projects</span>
          <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <ProjectDetailsModal
        project={selectedProject}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onProjectUpdate={(updated) =>
          setLocalProjects((projects) =>
            projects.map((p) =>
              p._id === updated._id ? { ...p, ...updated } : p
            )
          )
        }
      />
    </div>
  );
}
