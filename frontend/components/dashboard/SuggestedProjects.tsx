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
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <FiFolder className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Suggested Projects
          </h3>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="flex space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestedProjects.map((project) => (
              <div
                key={project._id}
                className="p-0 rounded-xl border border-gray-100 shadow group hover:shadow-lg hover:-translate-y-1 transition-all bg-white relative cursor-pointer overflow-hidden"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setSelectedProject(project);
                  setModalOpen(true);
                }}
              >
                {/* Main Image */}
                {project.image && (
                  <div className="w-full h-32 bg-gray-100 flex items-center justify-center overflow-hidden border-b rounded-t-xl">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900 truncate max-w-[60%]">
                      {project.title}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold border ${
                          project.isLiked
                            ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        } hover:bg-yellow-200 hover:text-yellow-800 transition`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStar(project._id);
                        }}
                        title={project.isLiked ? "Unstar" : "Star"}
                      >
                        <FiStar
                          className={project.isLiked ? "fill-yellow-400" : ""}
                        />
                        <span>{project.likesCount || 0}</span>
                      </button>
                      {user?._id === (project as any).owner?._id && (
                        <button
                          className="p-1 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition"
                          title="Delete project"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project._id);
                          }}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mb-2 line-clamp-2 min-h-[32px]">
                    {project.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {project.liveUrl && (
                      <button
                        className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-xs flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.liveUrl, "_blank");
                        }}
                      >
                        <FiExternalLink className="w-4 h-4" /> Live
                      </button>
                    )}
                    {project.githubUrl && (
                      <button
                        className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(project.githubUrl, "_blank");
                        }}
                      >
                        <FiGithub className="w-4 h-4" /> GitHub
                      </button>
                    )}
                  </div>
                  {/* Owner row */}
                  <div className="flex items-center mt-3">
                    <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden mr-2">
                      <img
                        src={getAvatarUrl(project.owner)}
                        alt="Owner Avatar"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {project.owner?.firstName} {project.owner?.lastName}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/projects"
            className="block w-full text-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
          >
            View all projects
          </Link>
        </div>
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
