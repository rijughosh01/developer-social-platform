"use client";
import { useEffect, useState, useMemo } from "react";
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
  FiSearch,
  FiFilter,
  FiGrid,
  FiList,
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiUsers,
  FiCode,
  FiHeart,
  FiEye,
  FiBookmark,
  FiShare2,
  FiMoreHorizontal,
  FiChevronDown,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ProjectDetailsModal from "./ProjectDetailsModal";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import ProjectCard from "@/components/projects/ProjectCard";
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

type ViewMode = "grid" | "list" | "masonry";
type SortOption = "newest" | "oldest" | "popular" | "trending" | "alphabetical";
type FilterOption = "all" | "my-projects" | "liked" | "featured";

const CATEGORIES = [
  { value: "all", label: "All Categories", icon: "📁", color: "bg-gray-100 text-gray-700" },
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
  { value: "all", label: "All Status", color: "bg-gray-100 text-gray-700" },
  { value: "planning", label: "Planning", color: "bg-yellow-100 text-yellow-800" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Completed", color: "bg-green-100 text-green-800" },
  { value: "archived", label: "Archived", color: "bg-gray-100 text-gray-800" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAppSelector((state) => state.auth);

  // Get all unique technologies from projects
  const allTechnologies = useMemo(() => {
    const techs = new Set<string>();
    projects.forEach(project => {
      project.technologies?.forEach(tech => techs.add(tech));
    });
    return Array.from(techs).sort();
  }, [projects]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      
      const res = await api.get("/projects?limit=100&sort=-createdAt");
      setProjects(res.data.data || []);
    } catch (err: any) {
      setError("Failed to load projects");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Advanced filtering and sorting logic
  useEffect(() => {
    let filtered = [...projects];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.shortDescription?.toLowerCase().includes(query) ||
        project.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        project.technologies?.some(tech => tech.toLowerCase().includes(query)) ||
        `${project.owner?.firstName} ${project.owner?.lastName}`.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(project => project.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(project => project.status === selectedStatus);
    }

    // Technology filter
    if (selectedTechnologies.length > 0) {
      filtered = filtered.filter(project =>
        project.technologies?.some(tech => selectedTechnologies.includes(tech))
      );
    }

    // Project type filter
    switch (filterBy) {
      case "my-projects":
        filtered = filtered.filter(project => project.owner?._id === user?._id);
        break;
      case "liked":
        filtered = filtered.filter(project => project.isLiked);
        break;
      case "featured":
        filtered = filtered.filter(project => project.featured);
        break;
    }

    // Sorting
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        break;
      case "popular":
        filtered.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;
      case "trending":
        // Sort by recent activity and engagement
        filtered.sort((a, b) => {
          const aScore = (a.likesCount || 0) + (a.viewsCount || 0) * 0.1;
          const bScore = (b.likesCount || 0) + (b.viewsCount || 0) * 0.1;
          return bScore - aScore;
        });
        break;
      case "alphabetical":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, selectedCategory, selectedStatus, selectedTechnologies, sortBy, filterBy, user]);

  const handleStar = async (projectId: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/like`);
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p._id === projectId
            ? {
                ...p,
                likesCount: res.data.data.likesCount,
                isLiked: res.data.data.isLiked,
              }
            : p
        )
      );
      toast.success(res.data.data.isLiked ? "Project starred!" : "Star removed!");
    } catch (err: any) {
      toast.error("Failed to star project");
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }
    
    try {
      await api.delete(`/projects/${projectId}`);
      setProjects(prevProjects => prevProjects.filter(p => p._id !== projectId));
      toast.success("Project deleted successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete project");
    }
  };

  const openProjectDetails = (project: Project, isEdit = false) => {
    setSelectedProject(project);
    setEditMode(isEdit);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <DashboardSidebar />
        <main className="lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3 text-gray-500">
                <FiRefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-lg font-medium">Loading projects...</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">
                Discover and showcase amazing developer projects
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchProjects(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg border border-gray-200 transition-all"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium"
              >
                <FiPlus className="w-4 h-4" />
                New Project
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, technologies, or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-700 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  showFilters
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filters
                <FiChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick Filters */}
              <div className="flex items-center gap-2">
                {["all", "my-projects", "liked", "featured"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterBy(filter as FilterOption)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterBy === filter
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {filter === "all" && "All Projects"}
                    {filter === "my-projects" && "My Projects"}
                    {filter === "liked" && "Liked"}
                    {filter === "featured" && "Featured"}
                  </button>
                ))}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 ml-auto">
                {(["grid", "list"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === mode
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    }`}
                    title={`${mode} view`}
                  >
                    {mode === "grid" ? <FiGrid className="w-4 h-4" /> : <FiList className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.icon} {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort By */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        <option value="newest">🕐 Newest First</option>
                        <option value="oldest">🕐 Oldest First</option>
                        <option value="popular">❤️ Most Liked</option>
                        <option value="trending">🔥 Trending</option>
                        <option value="alphabetical">🔤 A-Z</option>
                      </select>
                    </div>
                  </div>

                  {/* Technology Filter */}
                  {allTechnologies.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Technologies</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {allTechnologies.map((tech) => (
                          <button
                            key={tech}
                            onClick={() => {
                              setSelectedTechnologies(prev =>
                                prev.includes(tech)
                                  ? prev.filter(t => t !== tech)
                                  : [...prev, tech]
                              );
                            }}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                              selectedTechnologies.includes(tech)
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {tech}
                          </button>
                        ))}
                      </div>
                      {selectedTechnologies.length > 0 && (
                        <button
                          onClick={() => setSelectedTechnologies([])}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear all technologies
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredProjects.length}</span> of{" "}
              <span className="font-semibold text-gray-900">{projects.length}</span> projects
            </div>
            {(searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedTechnologies.length > 0 || filterBy !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedStatus("all");
                  setSelectedTechnologies([]);
                  setFilterBy("all");
                }}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-4 h-4" />
                Clear filters
              </button>
            )}
          </div>

          {/* Projects Grid */}
          {filteredProjects.length > 0 ? (
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {filteredProjects.map((project, index) => (
                <ProjectCard 
                  key={project._id} 
                  project={project} 
                  user={user}
                  index={index}
                  viewMode={viewMode}
                  onStar={handleStar}
                  onDelete={handleDelete}
                  onEdit={(project) => openProjectDetails(project, true)}
                  onView={(project) => openProjectDetails(project, false)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedCategory !== "all" || selectedStatus !== "all" || selectedTechnologies.length > 0
                  ? "Try adjusting your search criteria or filters"
                  : "Be the first to create a project!"}
              </p>
              {!searchQuery && selectedCategory === "all" && selectedStatus === "all" && selectedTechnologies.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all font-medium"
                >
                  <FiPlus className="w-5 h-5" />
                  Create Your First Project
                </button>
              )}
            </div>
          )}

          {/* Modals */}
          <CreateProjectModal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onProjectCreated={(newProject) => {
              setProjects(prev => [newProject, ...prev]);
              setShowCreateModal(false);
              toast.success("Project created successfully!");
            }}
          />

          <ProjectDetailsModal
            project={selectedProject}
            open={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setEditMode(false);
            }}
            onProjectUpdate={(updatedProject) => {
              setProjects(prev =>
                prev.map(p => p._id === updatedProject._id ? { ...p, ...updatedProject } : p)
              );
              toast.success("Project updated successfully!");
            }}
            editMode={editMode}
          />
        </div>
      </main>
    </div>
  );
}
