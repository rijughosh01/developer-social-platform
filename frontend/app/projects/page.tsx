"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/hooks/useAppDispatch";
import {
  FiStar,
  FiTrash2,
  FiExternalLink,
  FiGithub,
  FiEdit,
  FiMessageSquare,
  FiFilter,
  FiGrid,
  FiList,
  FiChevronDown,
  FiRefreshCw,
  FiAward,
  FiTag,
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
    _id?: string;
  };
  tags?: string[];
  category: string;
  status: string;
  technologies?: string[];
  screenshots?: { url: string; caption: string }[];
  featured?: boolean;
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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [onlyMine, setOnlyMine] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<
    "trending" | "recent" | "popular" | "a-z"
  >("trending");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

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

  // Derived filtered + sorted projects
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = projects.filter((project) => {
      const matchesSearch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.description.toLowerCase().includes(q) ||
        (project.tags || []).some((t) => t.toLowerCase().includes(q)) ||
        (project.technologies || []).some((t) => t.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "all" || project.category === categoryFilter;

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;

      const matchesMine = !onlyMine || user?._id === (project as any).owner?._id;

      return matchesSearch && matchesCategory && matchesStatus && matchesMine;
    });

    // Sort
    result = result.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.likesCount || 0) - (a.likesCount || 0);
        case "a-z":
          return a.title.localeCompare(b.title);
        case "recent":
          // Assume newest first if _id timestamp-like or fallback to likes
          return (b as any).createdAt?.localeCompare?.((a as any).createdAt) || 0;
        case "trending":
        default:
          const score = (p: Project) => (p.likesCount || 0) + (p.image ? 1 : 0);
          return score(b) - score(a);
      }
    });

    return result;
  }, [projects, search, categoryFilter, statusFilter, onlyMine, user?._id, sortBy]);

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

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const res = await api.get("/projects?limit=50");
      setProjects(res.data.data);
      toast.success("Projects refreshed!");
    } catch (err: any) {
      toast.error("Failed to refresh projects");
    } finally {
      setLoading(false);
    }
  };

  // UI constants
  const CATEGORY_OPTIONS: Array<{
    value: string;
    label: string;
    emoji: string;
  }> = [
    { value: "all", label: "All", emoji: "✨" },
    { value: "web", label: "Web", emoji: "🌐" },
    { value: "mobile", label: "Mobile", emoji: "📱" },
    { value: "desktop", label: "Desktop", emoji: "💻" },
    { value: "api", label: "API", emoji: "🔌" },
    { value: "library", label: "Library", emoji: "📦" },
    { value: "tool", label: "Tool", emoji: "🛠️" },
    { value: "game", label: "Game", emoji: "🎮" },
    { value: "other", label: "Other", emoji: "📁" },
  ];

  const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
    { value: "planning", label: "Planning" },
  ];

  const statusBadgeStyle = (status?: string) => {
    switch (status) {
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "archived":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "planning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const ResultCount = (
    <div className="text-sm text-gray-500">
      {filteredProjects.length} result{filteredProjects.length !== 1 ? "s" : ""}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        {/* Hero header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Discover Projects</h1>
                <p className="text-white/90 mt-2 max-w-2xl">
                  Explore community-built projects, find inspiration, and showcase your work.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <div className="flex items-center gap-2"><FiAward /> Curated selection</div>
                  <div className="flex items-center gap-2"><FiTag /> Filter by category & status</div>
                </div>
              </div>
            <button
                className="hidden sm:inline-flex items-center bg-white text-primary-600 px-4 py-2 rounded-lg shadow hover:bg-white/90 font-semibold"
              onClick={() => setShowModal(true)}
            >
                + New Project
            </button>
          </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Top controls */}
          <div className="flex flex-col gap-4">
            {/* Search + actions row */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </span>
            <input
              type="text"
                  placeholder="Search by title, tech, or tag"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition text-gray-700 bg-white"
            />
          </div>
              <div className="flex items-center gap-2">
                <button
                  className={`hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    layout === "grid" ? "bg-gray-100 border-gray-300" : "border-gray-200"
                  }`}
                  onClick={() => setLayout("grid")}
                  title="Grid view"
                >
                  <FiGrid />
                </button>
                <button
                  className={`hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${
                    layout === "list" ? "bg-gray-100 border-gray-300" : "border-gray-200"
                  }`}
                  onClick={() => setLayout("list")}
                  title="List view"
                >
                  <FiList />
                </button>
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh projects"
                >
                  <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                  onClick={() => {
                    setCategoryFilter("all");
                    setStatusFilter("all");
                    setOnlyMine(false);
                    setSortBy("trending");
                    setSearch("");
                  }}
                  title="Reset filters"
                >
                  <FiFilter className="w-4 h-4" /> Reset
                </button>
                <button
                  className="sm:hidden inline-flex items-center bg-primary-600 text-white px-3 py-2 rounded-lg shadow hover:bg-primary-700"
                  onClick={() => setShowModal(true)}
                >
                  + New
                </button>
              </div>
            </div>

            {/* Filters row */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-gray-600">
                <FiFilter />
                <span className="text-sm font-medium">Quick filters</span>
                <div className="ml-auto hidden md:block">{ResultCount}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    className={`px-3 py-1.5 rounded-full border text-sm transition ${
                      categoryFilter === c.value
                        ? "bg-primary-50 text-primary-700 border-primary-200"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setCategoryFilter(c.value)}
                  >
                    <span className="mr-1">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    className={`px-3 py-1.5 rounded-full border text-sm transition ${
                      statusFilter === s.value
                        ? "bg-gray-100 text-gray-800 border-gray-300"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setStatusFilter(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
                {user?._id && (
                  <button
                    className={`ml-2 px-3 py-1.5 rounded-full border text-sm transition ${
                      onlyMine
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                    onClick={() => setOnlyMine((v) => !v)}
                  >
                    My projects
                  </button>
                )}
                {/* Sort */}
                <div className="ml-auto">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sort</span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                      >
                        <option value="trending">Trending</option>
                        <option value="recent">Recent</option>
                        <option value="popular">Most liked</option>
                        <option value="a-z">A → Z</option>
                      </select>
                      <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:hidden">{ResultCount}</div>
            </div>
          </div>

          {/* Grid/List */}
          {error && (
            <div className="text-red-600 mt-4">{error}</div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className={`grid ${layout === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"} gap-6 mt-6`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-36 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-5/6" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-5 bg-gray-200 rounded w-16" />
                      <div className="h-5 bg-gray-200 rounded w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className={`${layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1"} gap-6 mt-6`}>
            {filteredProjects.map((project) => (
              <div
                key={project._id}
                  className={`relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group cursor-pointer transition hover:shadow-lg ${layout === "list" ? "md:flex" : ""}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setSelectedProject(project);
                  setEditModal(false);
                  setModalOpen(true);
                }}
                title={project.githubUrl ? "View on GitHub" : ""}
              >
                  {project.featured && (
                    <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded bg-amber-100 text-amber-700">
                      <FiAward className="w-3 h-3" /> Featured
                    </div>
                  )}
                {project.image && (
                    <div className={`${layout === "list" ? "md:w-56 md:flex-shrink-0" : ""} w-full h-40 bg-gray-100 overflow-hidden`}>
                      <img src={project.image} alt={project.title} className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300" />
                  </div>
                )}
                  <div className="p-5 flex-1">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                          <img src={getAvatarUrl(project.owner)} alt="Owner Avatar" className="w-9 h-9 rounded-full object-cover" />
                    </div>
                    <div>
                          {user && project.owner?.username && user.username !== project.owner.username ? (
                        <Link href={`/profile/${project.owner.username}`}>
                              <span className="font-medium cursor-pointer hover:underline">
                                {project.owner?.firstName} {project.owner?.lastName}
                          </span>
                        </Link>
                      ) : (
                            <span className="font-medium">
                              {project.owner?.firstName} {project.owner?.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${statusBadgeStyle(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 leading-tight mb-2">
                    {project.title}
                  </div>
                    <div className="text-gray-700 mb-3 line-clamp-3 min-h-[48px]">
                      {project.shortDescription || project.description}
                    </div>
                  {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.tags.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          #{tag}
                        </span>
                      ))}
                        {project.tags.length > 4 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs font-medium">
                            +{project.tags.length - 4}
                        </span>
                        )}
                    </div>
                  )}
                  {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.technologies.slice(0, 5).map((tech: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      {project.liveUrl && (
                        <button
                            className="px-3 py-1.5 rounded bg-green-50 text-green-700 hover:bg-green-100 text-sm flex items-center gap-1 border border-green-200"
                          onClick={(e) => {
                            e.stopPropagation();
                              window.open(project.liveUrl!, "_blank");
                          }}
                        >
                          <FiExternalLink className="w-4 h-4" /> Live
                        </button>
                      )}
                      {project.githubUrl && (
                        <button
                            className="px-3 py-1.5 rounded bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm flex items-center gap-1 border border-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                              window.open(project.githubUrl!, "_blank");
                          }}
                        >
                          <FiGithub className="w-4 h-4" /> GitHub
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-semibold border ${
                          project.isLiked
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-gray-50 text-gray-600 border-gray-200"
                          } hover:bg-yellow-100 hover:text-yellow-800 transition`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStar(project._id);
                        }}
                        title={project.isLiked ? "Unstar" : "Star"}
                      >
                          <FiStar className={project.isLiked ? "fill-yellow-400" : ""} />
                        <span>{project.likesCount || 0}</span>
                      </button>
                      {user?._id !== (project as any).owner?._id && (
                        <button
                            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition"
                          title="Message project owner"
                          onClick={(e) => {
                            e.stopPropagation();
                              window.location.href = `/messages?userId=${(project as any).owner?._id}`;
                          }}
                        >
                          <FiMessageSquare className="w-5 h-5" />
                        </button>
                      )}
                      {user?._id === (project as any).owner?._id && (
                        <>
                          <button
                              className="p-2 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition"
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
                              className="p-2 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition"
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
          )}

          {!loading && filteredProjects.length === 0 && (
            <div className="mt-10 flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-2xl p-10">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold mb-1">No projects match your filters</h3>
              <p className="text-gray-600 mb-4 max-w-md">
                Try adjusting search or filters. You can also create a new project and be the first to showcase it!
              </p>
              <button
                className="inline-flex items-center bg-primary-600 text-white px-4 py-2 rounded-lg shadow hover:bg-primary-700"
                onClick={() => setShowModal(true)}
              >
                + Create Project
              </button>
            </div>
          )}

          {/* Modals */}
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
                projects.map((p) => (p._id === updated._id ? { ...p, ...updated } : p))
              )
            }
            editMode={editModal}
          />
        </div>
      </main>
    </div>
  );
}
