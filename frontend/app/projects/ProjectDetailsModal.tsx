import React, { useState } from "react";
import {
  FiX,
  FiStar,
  FiGithub,
  FiExternalLink,
  FiUsers,
  FiEdit,
  FiUpload,
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

  React.useEffect(() => {
    setForm(project || {});
    setEditModeState(!!editMode);
  }, [project, open, editMode]);

  if (!open || !project) return null;

  const isOwner =
    typeof window !== "undefined" &&
    project.owner?._id === JSON.parse(localStorage.getItem("user") || "{}")._id;

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
      const res = await api.put(`/projects/${project._id}`, payload);
      toast.success("Project updated!");
      setEditModeState(false);
      if (onProjectUpdate) onProjectUpdate(res.data.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update project");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Sticky top bar with close button (always visible while scrolling) */}
        <div className="sticky top-0 z-20 flex items-center justify-end p-3 bg-white/80 backdrop-blur border-b border-gray-200">
          <button
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        {editModeState ? (
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <h2 className="text-2xl font-bold">Edit Project</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                aria-label="Project Title"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="title"
                value={form.title || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Short Description
              </label>
              <textarea
                aria-label="Project Short Description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="shortDescription"
                value={form.shortDescription || ""}
                onChange={handleFormChange}
                rows={2}
                placeholder="A brief summary of your project (optional)"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                A concise summary that appears before the full description
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                aria-label="Project Description"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="description"
                value={form.description || ""}
                onChange={handleFormChange}
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                GitHub URL
              </label>
              <input
                aria-label="Project GitHub URL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="githubUrl"
                value={form.githubUrl || ""}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Live URL</label>
              <input
                aria-label="Project Live URL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="liveUrl"
                value={form.liveUrl || ""}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Technologies (comma separated)
              </label>
              <input
                aria-label="Project Technologies"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
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
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                aria-label="Project Category"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="category"
                value={form.category || "web"}
                onChange={handleFormChange}
              >
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="api">API</option>
                <option value="library">Library</option>
                <option value="tool">Tool</option>
                <option value="game">Game</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                aria-label="Project Status"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Image URL
              </label>
              <input
                aria-label="Project Image URL"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="image"
                value={form.image || ""}
                onChange={handleFormChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <FiUpload className="inline w-4 h-4 mr-1" />
                Project Screenshots
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-400 transition-colors">
                <input
                  aria-label="Project Screenshots"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleScreenshotUpload}
                  disabled={uploadingScreenshots}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-1">
                    Click to upload screenshots
                  </p>
                  <p className="text-xs text-gray-500">
                    Max 5MB per image, up to 10 screenshots
                  </p>
                </label>
              </div>
              {uploadingScreenshots && (
                <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Uploading screenshots...
                </div>
              )}

              {/* Screenshots Preview */}
              {screenshots.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Uploaded Screenshots ({screenshots.length}/10)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {screenshots.map((s, index) => (
                      <div
                        key={s.url}
                        className="relative group border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <img
                          src={s.url}
                          alt={`Screenshot ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveScreenshot(s.url)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove screenshot"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                        <div className="p-3">
                          <input
                            type="text"
                            value={s.caption}
                            onChange={(e) => {
                              const updatedScreenshots = [...screenshots];
                              updatedScreenshots[index].caption =
                                e.target.value;
                              setScreenshots(updatedScreenshots);
                            }}
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Tags (comma separated)
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. open source, video, editor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Collaborators (comma separated usernames or emails)
              </label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500"
                name="collaborators"
                value={collaboratorsInput}
                onChange={(e) => setCollaboratorsInput(e.target.value)}
                placeholder="e.g. alice, bob@example.com"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setEditModeState(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Cover / Image */}
            {project.image && (
              <div className="relative w-full h-48 bg-gray-100 overflow-hidden rounded-t-2xl">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{project.title}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                      {project.owner?.firstName?.charAt(0)}
                      {project.owner?.lastName?.charAt(0)}
                    </div>
                    <span className="text-gray-700 font-medium">
                      {project.owner?.firstName} {project.owner?.lastName}
                    </span>
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${statusBadgeStyle(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
                {isOwner && (
                  <button
                    className="p-2 rounded-full hover:bg-blue-50 text-blue-600"
                    onClick={() => setEditModeState(true)}
                    title="Edit project"
                  >
                    <FiEdit className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {/* Short Description */}
            {project.shortDescription && (
              <div className="px-6 mt-4">
                <p className="text-gray-700 text-sm italic bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {project.shortDescription}
                </p>
              </div>
            )}

            {/* Full Description */}
            <div className="px-6 mt-4">
              <p className="text-gray-800 whitespace-pre-line">
                {project.description}
              </p>
            </div>
            <div className="px-6 mt-4 flex flex-wrap gap-2">
              {project.technologies &&
                project.technologies.map((tech: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700"
                  >
                    {tech}
                  </span>
                ))}
            </div>
            <div className="px-6 mt-3 flex gap-4">
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <FiStar className="w-4 h-4" />
                <span>{project.likesCount || 0} Stars</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <FiUsers className="w-4 h-4" />
                <span>{project.collaborators?.length || 0} Collaborators</span>
              </div>
            </div>
            <div className="px-6 mt-3 flex gap-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 text-sm flex items-center gap-1"
                >
                  <FiExternalLink className="w-4 h-4" /> Live
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 text-sm flex items-center gap-1"
                >
                  <FiGithub className="w-4 h-4" /> GitHub
                </a>
              )}
            </div>
            {project.screenshots && project.screenshots.length > 0 && (
              <div className="px-6 mt-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiUpload className="w-5 h-5" />
                  Project Screenshots ({project.screenshots.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.screenshots.map((s: any, index: number) => (
                    <div key={s.url} className="group relative">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-300 transition-colors">
                        <img
                          src={s.url}
                          alt={s.caption || `Screenshot ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onClick={() => {
                            // Open image in full screen
                            const newWindow = window.open(s.url, "_blank");
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>${
                                      s.caption || `Screenshot ${index + 1}`
                                    }</title>
                                    <style>
                                      body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                      img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; }
                                      .caption { color: white; text-align: center; margin-top: 10px; font-size: 16px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div>
                                      <img src="${s.url}" alt="${
                                s.caption || `Screenshot ${index + 1}`
                              }" />
                                      ${
                                        s.caption
                                          ? `<div class="caption">${s.caption}</div>`
                                          : ""
                                      }
                                    </div>
                                  </body>
                                </html>
                              `);
                            }
                          }}
                        />
                      </div>
                      {s.caption && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 font-medium">
                            {s.caption}
                          </p>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Click to view
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Click on any screenshot to view it in full size
                </p>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="px-6 flex flex-wrap gap-2 mb-2">
                {project.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {project.collaborators && project.collaborators.length > 0 && (
              <div className="px-6 pb-6 flex flex-wrap gap-2">
                {project.collaborators.map((c: any, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium"
                  >
                    {typeof c === "string" ? c : c.username || c.email}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
