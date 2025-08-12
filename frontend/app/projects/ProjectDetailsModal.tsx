import React, { useState, useEffect } from "react";
import {
  FiX,
  FiStar,
  FiGithub,
  FiExternalLink,
  FiUsers,
  FiEdit,
  FiUpload,
  FiCalendar,
  FiTag,
  FiCode,
  FiEye,
  FiHeart,
  FiShare2,
  FiDownload,
  FiPlay,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiArchive,
  FiTarget,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { uploadImage, validateImageFile } from "@/lib/uploadUtils";

interface ProjectDetailsModalProps {
  project: any;
  open: boolean;
  onClose: () => void;
  onProjectUpdate?: (updated: any) => void;
  editMode?: boolean;
}

export default function ProjectDetailsModal({
  project,
  open,
  onClose,
  onProjectUpdate,
  editMode,
}: ProjectDetailsModalProps) {
  const [editModeState, setEditModeState] = useState(false);
  const [form, setForm] = useState<any>(project || {});
  const [saving, setSaving] = useState(false);
  const [screenshots, setScreenshots] = useState<
    { url: string; caption: string }[]
  >(form.screenshots || []);
  const [tagsInput, setTagsInput] = useState(
    form.tags ? form.tags.join(", ") : ""
  );
  const [collaboratorsInput, setCollaboratorsInput] = useState(
    form.collaborators ? form.collaborators.join(", ") : ""
  );
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(
    null
  );
  const [isStarred, setIsStarred] = useState(false);
  const [starring, setStarring] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [freshProjectData, setFreshProjectData] = useState<any>(null);
  const [loadingFreshData, setLoadingFreshData] = useState(false);
  const [viewCountUpdated, setViewCountUpdated] = useState(false);

  const fetchFreshProjectData = async () => {
    if (!project?._id) return;

    const viewedProjects = JSON.parse(
      sessionStorage.getItem("viewedProjects") || "[]"
    );
    const hasViewed = viewedProjects.includes(project._id);

    console.log("Fetching fresh project data for:", project._id);
    console.log("Original views:", project.views);
    console.log("Has viewed in session:", hasViewed);

    try {
      setLoadingFreshData(true);
      const res = await api.get(`/projects/${project._id}`);
      setFreshProjectData(res.data.data);

      console.log("Fresh data views:", res.data.data.views);

      // Show view count update animation only if this is a new view
      if (!hasViewed && res.data.data.views > (project.views || 0)) {
        console.log("View count updated! Showing animation.");
        setViewCountUpdated(true);
        setTimeout(() => setViewCountUpdated(false), 2000);

        // Mark this project as viewed in this session
        if (!viewedProjects.includes(project._id)) {
          viewedProjects.push(project._id);
          sessionStorage.setItem(
            "viewedProjects",
            JSON.stringify(viewedProjects)
          );
        }
      }

      // Update the parent component with fresh data
      if (onProjectUpdate) {
        onProjectUpdate(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch fresh project data:", err);

      setFreshProjectData(project);
    } finally {
      setLoadingFreshData(false);
    }
  };

  const displayProject = freshProjectData || project;

  React.useEffect(() => {
    setForm(project || {});
    setEditModeState(!!editMode);
  }, [project, open, editMode]);

  // Fetch fresh data when modal opens
  React.useEffect(() => {
    if (open && project?._id) {
      fetchFreshProjectData();
    }
  }, [open, project?._id]);

  // Check if user has starred the project
  React.useEffect(() => {
    if (open && displayProject) {
      setIsStarred(displayProject.isLiked || false);
    }
  }, [displayProject?.isLiked, open]);

  if (!open || !project) return null;

  // Show loading indicator if fresh data is being fetched
  if (loadingFreshData && !freshProjectData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            <span className="text-gray-700">Loading project details...</span>
          </div>
        </div>
      </div>
    );
  }

  const isOwner =
    typeof window !== "undefined" &&
    displayProject.owner?._id ===
      JSON.parse(localStorage.getItem("user") || "{}")._id;

  const statusConfig = {
    "in-progress": {
      icon: FiClock,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      bg: "bg-blue-500",
      label: "In Progress",
    },
    completed: {
      icon: FiCheckCircle,
      color: "bg-green-50 text-green-700 border-green-200",
      bg: "bg-green-500",
      label: "Completed",
    },
    archived: {
      icon: FiArchive,
      color: "bg-gray-50 text-gray-700 border-gray-200",
      bg: "bg-gray-500",
      label: "Archived",
    },
    planning: {
      icon: FiTarget,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      bg: "bg-yellow-500",
      label: "Planning",
    },
  };

  const currentStatus =
    statusConfig[displayProject.status as keyof typeof statusConfig] ||
    statusConfig.completed;

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleScreenshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;
    setUploadingScreenshots(true);
    try {
      const files = Array.from(e.target.files);
      const uploaded: { url: string; caption: string }[] = [];

      for (const file of files) {
        try {
          validateImageFile(file, 5);
          const url = await uploadImage(file);
          uploaded.push({ url, caption: "" });
        } catch (error) {
          toast.error(
            `Failed to upload ${file.name}: ${
              error instanceof Error ? error.message : "Invalid file"
            }`
          );
        }
      }

      if (uploaded.length > 0) {
        setScreenshots((prev) => [...prev, ...uploaded]);
        toast.success(`${uploaded.length} screenshot(s) uploaded!`);
      }
    } catch (err) {
      toast.error("Failed to upload screenshots");
    }
    setUploadingScreenshots(false);
  };

  const handleRemoveScreenshot = (url: string) => {
    setScreenshots((prev) => prev.filter((s) => s.url !== url));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        screenshots,
        tags: tagsInput
          .split(",")
          .map((t: string) => t.trim())
          .filter(Boolean),
        collaborators: collaboratorsInput
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean),
        technologies:
          typeof form.technologies === "string"
            ? form.technologies
                .split(",")
                .map((t: string) => t.trim())
                .filter(Boolean)
            : form.technologies,
      };
      const res = await api.put(`/projects/${displayProject._id}`, payload);
      toast.success("Project updated!");
      setEditModeState(false);
      if (onProjectUpdate) onProjectUpdate(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update project");
    }
    setSaving(false);
  };

  const openScreenshotFullscreen = (url: string) => {
    console.log("Opening screenshot fullscreen:", url);
    setSelectedScreenshot(url);
  };

  const closeScreenshotFullscreen = () => {
    console.log("Closing screenshot fullscreen");
    setSelectedScreenshot(null);
  };

  // Star/Unstar Project Function
  const handleStarProject = async () => {
    if (starring) return;
    setStarring(true);
    try {
      const res = await api.post(`/projects/${displayProject._id}/like`);

      setIsStarred(res.data.data.isLiked);

      // Update project data and notify parent component
      if (onProjectUpdate) {
        const updatedProject = {
          ...displayProject,
          likesCount: res.data.data.likesCount,
          isLiked: res.data.data.isLiked,
        };
        onProjectUpdate(updatedProject);
      }

      toast.success(
        res.data.data.isLiked ? "Project starred!" : "Project unstarred!"
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to update star status"
      );
    } finally {
      setStarring(false);
    }
  };

  // Share Project Function
  const handleShareProject = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const shareData = {
        title: displayProject.title,
        text: displayProject.shortDescription || displayProject.description,
        url: `${window.location.origin}/projects/${displayProject._id}`,
      };

      // Try native sharing first
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Project shared!");
      } else {
        // Fallback to clipboard
        const shareUrl = `${window.location.origin}/projects/${displayProject._id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Project link copied to clipboard!");
      }
    } catch (err: any) {
      console.error("Share failed:", err);

      try {
        const shareUrl = `${window.location.origin}/projects/${displayProject._id}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Project link copied to clipboard!");
      } catch (clipboardErr) {
        toast.error("Failed to share project");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl relative max-h-[95vh] overflow-hidden border border-gray-200/50">
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-blue-600 text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
            </div>

            {/* Header Content */}
            <div className="relative p-6 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                      <currentStatus.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {currentStatus.label}
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        onClick={() => setEditModeState(true)}
                        title="Edit project"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    {displayProject.title}
                  </h1>
                  {displayProject.shortDescription && (
                    <p className="text-white/90 text-lg leading-relaxed">
                      {displayProject.shortDescription}
                    </p>
                  )}
                </div>
                <button
                  className="p-3 rounded-full hover:bg-white/20 transition-colors ml-4"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
            {editModeState ? (
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <FiEdit className="w-6 h-6 text-primary-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Project
                  </h2>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      name="title"
                      value={form.title || ""}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      name="status"
                      value={form.status || "completed"}
                      onChange={handleFormChange}
                    >
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    name="shortDescription"
                    value={form.shortDescription || ""}
                    onChange={handleFormChange}
                    rows={2}
                    placeholder="A brief summary of your project..."
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    name="description"
                    value={form.description || ""}
                    onChange={handleFormChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      GitHub URL
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      name="githubUrl"
                      value={form.githubUrl || ""}
                      onChange={handleFormChange}
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Live URL
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      name="liveUrl"
                      value={form.liveUrl || ""}
                      onChange={handleFormChange}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Technologies
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    name="technologies"
                    value={
                      Array.isArray(form.technologies)
                        ? form.technologies.join(", ")
                        : form.technologies || ""
                    }
                    onChange={handleFormChange}
                    placeholder="e.g. React, Node.js, MongoDB"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Tags
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      name="tags"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="e.g. open source, video, editor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Collaborators
                    </label>
                    <input
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      name="collaborators"
                      value={collaboratorsInput}
                      onChange={(e) => setCollaboratorsInput(e.target.value)}
                      placeholder="e.g. alice, bob@example.com"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-medium"
                    onClick={() => setEditModeState(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all font-medium disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-8">
                {/* Project Image */}
                {displayProject.image && (
                  <div className="relative w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
                    <img
                      src={displayProject.image}
                      alt={displayProject.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                )}

                {/* Project Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Description */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiEye className="w-5 h-5 text-primary-600" />
                        About This Project
                      </h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {displayProject.description}
                      </p>
                    </div>

                    {/* Technologies */}
                    {displayProject.technologies &&
                      displayProject.technologies.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FiCode className="w-5 h-5 text-primary-600" />
                            Technologies Used
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {displayProject.technologies.map(
                              (tech: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-4 py-2 bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700 rounded-xl text-sm font-medium border border-primary-100"
                                >
                                  {tech}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Screenshots */}
                    {displayProject.screenshots &&
                      displayProject.screenshots.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FiUpload className="w-5 h-5 text-primary-600" />
                            Project Screenshots (
                            {displayProject.screenshots.length})
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayProject.screenshots.map(
                              (s: any, index: number) => (
                                <div key={s.url} className="group relative">
                                  <div
                                    className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 transition-all cursor-pointer"
                                    onClick={() =>
                                      openScreenshotFullscreen(s.url)
                                    }
                                    title="Click to view fullscreen"
                                  >
                                    <img
                                      src={s.url}
                                      alt={
                                        s.caption || `Screenshot ${index + 1}`
                                      }
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FiEye className="w-8 h-8 text-white drop-shadow-lg" />
                                      </div>
                                    </div>
                                  </div>
                                  {s.caption && (
                                    <p className="mt-2 text-sm text-gray-600 font-medium">
                                      {s.caption}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Project Stats */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Project Stats
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiStar className="w-4 h-4 text-yellow-500" />
                            <span className="text-gray-600">Stars</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {displayProject.likesCount || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiUsers className="w-4 h-4 text-blue-500" />
                            <span className="text-gray-600">Collaborators</span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {displayProject.collaborators?.length || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiEye className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600">Views</span>
                          </div>
                          <span
                            className={`font-semibold text-gray-900 transition-all duration-300 ${
                              viewCountUpdated ? "text-green-600 scale-110" : ""
                            }`}
                          >
                            {displayProject.views || 0}
                            {viewCountUpdated && (
                              <span className="ml-1 text-xs text-green-500 animate-pulse">
                                +1
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Quick Actions
                      </h3>
                      <div className="space-y-3">
                        {displayProject.liveUrl && (
                          <a
                            href={displayProject.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium"
                          >
                            <FiPlay className="w-4 h-4" />
                            View Live
                          </a>
                        )}
                        {displayProject.githubUrl && (
                          <a
                            href={displayProject.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all font-medium"
                          >
                            <FiGithub className="w-4 h-4" />
                            View Code
                          </a>
                        )}
                        <button
                          onClick={handleStarProject}
                          disabled={starring}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all font-medium ${
                            isStarred
                              ? "bg-yellow-500 text-white hover:bg-yellow-600"
                              : "bg-primary-600 text-white hover:bg-primary-700"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {starring ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <FiHeart
                              className={`w-4 h-4 ${
                                isStarred ? "fill-current" : ""
                              }`}
                            />
                          )}
                          {isStarred ? "Starred" : "Star Project"}
                        </button>
                        <button
                          onClick={handleShareProject}
                          disabled={sharing}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {sharing ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <FiShare2 className="w-4 h-4" />
                          )}
                          {sharing ? "Sharing..." : "Share"}
                        </button>
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Project Owner
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
                          {displayProject.owner?.avatar ? (
                            <img
                              src={displayProject.owner.avatar}
                              alt={`${displayProject.owner.firstName} ${displayProject.owner.lastName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                target.nextElementSibling?.classList.remove(
                                  "hidden"
                                );
                              }}
                            />
                          ) : null}
                          <div
                            className={`${
                              displayProject.owner?.avatar ? "hidden" : ""
                            } w-full h-full flex items-center justify-center`}
                          >
                            {displayProject.owner?.firstName?.charAt(0)}
                            {displayProject.owner?.lastName?.charAt(0)}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {displayProject.owner?.firstName}{" "}
                            {displayProject.owner?.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{displayProject.owner?.username}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {displayProject.tags && displayProject.tags.length > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <FiTag className="w-5 h-5 text-primary-600" />
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {displayProject.tags.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collaborators Section */}
                {displayProject.collaborators &&
                  displayProject.collaborators.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUsers className="w-5 h-5 text-primary-600" />
                        Team Members ({displayProject.collaborators.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayProject.collaborators.map(
                          (c: any, i: number) => {
                            const collaborator = c.user || c;
                            const role = c.role || "developer";
                            const roleColors = {
                              developer:
                                "bg-blue-50 text-blue-700 border-blue-200",
                              designer:
                                "bg-purple-50 text-purple-700 border-purple-200",
                              tester:
                                "bg-green-50 text-green-700 border-green-200",
                              manager:
                                "bg-orange-50 text-orange-700 border-orange-200",
                            };

                            return (
                              <div
                                key={i}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-300 transition-all cursor-pointer group"
                                onClick={() => {
                                  window.location.href = `/profile/${collaborator.username}`;
                                }}
                              >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                                  {collaborator.avatar ? (
                                    <img
                                      src={collaborator.avatar}
                                      alt={`${collaborator.firstName} ${collaborator.lastName}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Fallback to initials if image fails to load
                                        const target =
                                          e.target as HTMLImageElement;
                                        target.style.display = "none";
                                        target.nextElementSibling?.classList.remove(
                                          "hidden"
                                        );
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className={`${
                                      collaborator.avatar ? "hidden" : ""
                                    } w-full h-full flex items-center justify-center text-xs`}
                                  >
                                    {collaborator.firstName?.charAt(0)}
                                    {collaborator.lastName?.charAt(0)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                                    {collaborator.firstName}{" "}
                                    {collaborator.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500 truncate">
                                    @{collaborator.username}
                                  </p>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                                    roleColors[
                                      role as keyof typeof roleColors
                                    ] || roleColors.developer
                                  }`}
                                >
                                  {role}
                                </span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshot Fullscreen Modal */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          onClick={closeScreenshotFullscreen}
        >
          <div className="relative max-w-6xl max-h-[95vh] p-6">
            <button
              className="absolute top-6 right-6 p-3 bg-black/50 rounded-full hover:bg-black/70 transition-colors z-10 text-white"
              onClick={closeScreenshotFullscreen}
            >
              <FiX className="w-6 h-6" />
            </button>
            <img
              src={selectedScreenshot}
              alt="Screenshot"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
