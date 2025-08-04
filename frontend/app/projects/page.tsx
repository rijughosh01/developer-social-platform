"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/hooks/useAppDispatch";
import {
  FiStar,
  FiTrash2,
  FiExternalLink,
  FiGithub,
  FiImage,
  FiX,
  FiLoader,
  FiEdit,
  FiMessageSquare,
} from "react-icons/fi";
import ProjectDetailsModal from "./ProjectDetailsModal";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import Link from "next/link";
import { getAvatarUrl } from "@/lib/utils";

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
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  tags?: string[];
  category: string;
  status: string;
  technologies?: string[];
  screenshots?: { url: string; caption: string }[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await api.get("/projects?limit=50");
        setProjects(res.data.data);
      } catch (err: any) {
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleStar = async (projectId: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/like`);
      setProjects((projects) =>
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
      setProjects((projects) => projects.filter((p) => p._id !== projectId));
      toast.success("Project deleted!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete project");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Projects</h1>
            <button
              className="bg-primary-600 text-white px-4 py-2 rounded shadow hover:bg-primary-700"
              onClick={() => setShowModal(true)}
            >
              New Project
            </button>
          </div>
          <div className="relative mb-6">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search projects"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition text-gray-700 bg-white"
            />
          </div>
          {loading && <div>Loading projects...</div>}
          {error && <div className="text-red-500">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                className="bg-white rounded-xl shadow-md mb-6 border border-gray-100 transition-shadow hover:shadow-lg p-0 cursor-pointer group overflow-hidden"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setSelectedProject(project);
                  setEditModal(false);
                  setModalOpen(true);
                }}
                title={project.githubUrl ? "View on GitHub" : ""}
              >
                {project.image && (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden border-b">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="p-6">
                  {/* Owner and Title */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                      <img
                        src={getAvatarUrl(project.owner)}
                        alt="Owner Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </div>
                    <div>
                      {user && user.username !== project.owner.username ? (
                        <Link href={`/profile/${project.owner.username}`}>
                          <span className="font-semibold cursor-pointer hover:underline">
                            {project.owner.firstName} {project.owner.lastName}
                          </span>
                        </Link>
                      ) : (
                        <span className="font-semibold">
                          {project.owner.firstName} {project.owner.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-gray-900 leading-tight mb-2 mt-1">
                    {project.title}
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
                  {/* Description */}
                  <div className="text-gray-700 mb-3 line-clamp-3 min-h-[48px]">
                    {project.description}
                  </div>

                  {/* Screenshots Preview */}
                  {project.screenshots && project.screenshots.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 font-medium">
                          Screenshots
                        </span>
                        <span className="text-xs text-gray-400">
                          ({project.screenshots.length})
                        </span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {project.screenshots
                          .slice(0, 3)
                          .map((screenshot: any, index: number) => (
                            <div
                              key={screenshot.url}
                              className="flex-shrink-0 relative group"
                            >
                              <img
                                src={screenshot.url}
                                alt={
                                  screenshot.caption ||
                                  `Screenshot ${index + 1}`
                                }
                                className="w-16 h-12 object-cover rounded border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open image in full screen
                                  const newWindow = window.open(
                                    screenshot.url,
                                    "_blank"
                                  );
                                  if (newWindow) {
                                    newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${
                                          screenshot.caption ||
                                          `Screenshot ${index + 1}`
                                        }</title>
                                        <style>
                                          body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                          img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; }
                                          .caption { color: white; text-align: center; margin-top: 10px; font-size: 16px; }
                                        </style>
                                      </head>
                                      <body>
                                        <div>
                                          <img src="${screenshot.url}" alt="${
                                      screenshot.caption ||
                                      `Screenshot ${index + 1}`
                                    }" />
                                          ${
                                            screenshot.caption
                                              ? `<div class="caption">${screenshot.caption}</div>`
                                              : ""
                                          }
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                  }
                                }}
                              />
                              {screenshot.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded-b opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                  {screenshot.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        {project.screenshots.length > 3 && (
                          <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                            +{project.screenshots.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.technologies.map((tech: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* Category and Status */}
                  <div className="flex gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500">Category</span>
                      <div className="font-medium text-gray-800">
                        {project.category}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Status</span>
                      <div className="font-medium text-gray-800">
                        {project.status}
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      {project.liveUrl && (
                        <button
                          className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"
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
                          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm flex items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.githubUrl, "_blank");
                          }}
                        >
                          <FiGithub className="w-4 h-4" /> GitHub
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold border ${
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
                      {/* Message Button: Only show if user is not the owner */}
                      {user?._id !== (project as any).owner?._id && (
                        <button
                          className="p-2 rounded-full hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition"
                          title="Message project owner"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/messages?userId=${
                              (project as any).owner?._id
                            }`;
                          }}
                        >
                          <FiMessageSquare className="w-5 h-5" />
                        </button>
                      )}
                      {user?._id === (project as any).owner?._id && (
                        <>
                          <button
                            className="p-2 rounded-full hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition"
                            title="Edit project"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setEditModal(true);
                              setModalOpen(true);
                            }}
                          >
                            <FiEdit className="w-5 h-5" />
                          </button>
                          <button
                            className="p-2 rounded-full hover:bg-red-100 text-red-500 hover:text-red-700 transition"
                            title="Delete project"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project._id);
                            }}
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!loading && filteredProjects.length === 0 && (
            <div className="text-gray-500 mt-8 text-center">
              No projects found.
            </div>
          )}
          {/* Enhanced Create Project Modal */}
          <CreateProjectModal
            open={showModal}
            onClose={() => setShowModal(false)}
            onProjectCreated={(newProject) => {
              setProjects([newProject, ...projects]);
              setShowModal(false);
            }}
          />
          <ProjectDetailsModal
            project={selectedProject}
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditModal(false);
            }}
            onProjectUpdate={(updated) =>
              setProjects((projects) =>
                projects.map((p) =>
                  p._id === updated._id ? { ...p, ...updated } : p
                )
              )
            }
            editMode={editModal}
          />
        </div>
      </main>
    </div>
  );
}
