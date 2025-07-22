'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAppSelector } from '@/hooks/useAppDispatch'
import { FiStar, FiTrash2, FiExternalLink, FiGithub, FiImage, FiX, FiLoader, FiEdit, FiMessageSquare } from 'react-icons/fi'
import ProjectDetailsModal from './ProjectDetailsModal'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import Link from 'next/link'
import { getAvatarUrl } from '@/lib/utils'

interface Project {
  _id: string
  title: string
  description: string
  githubUrl?: string
  liveUrl?: string
  likesCount?: number
  isLiked?: boolean
  image?: string
  owner?: {
    firstName?: string
    lastName?: string
    username?: string
  }
  tags?: string[]
  category: string
  status: string
  technologies?: string[]
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    githubUrl: '',
    liveUrl: '',
    technologies: '',
    category: 'web',
    status: 'completed',
    image: ''
  })
  const { user } = useAppSelector((state) => state.auth)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [screenshots, setScreenshots] = useState<{ url: string; caption: string }[]>([])
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [collaboratorsInput, setCollaboratorsInput] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        const res = await api.get('/projects?limit=50')
        setProjects(res.data.data)
      } catch (err: any) {
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(search.toLowerCase()) ||
    project.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  async function uploadImageToBackend(file: File): Promise<string> {
    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Image upload failed')
      }
      const data = await response.json()
      return data.url
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setUploadingScreenshots(true)
    try {
      const files = Array.from(e.target.files)
      const uploaded: { url: string; caption: string }[] = []
      for (const file of files) {
        const formData = new FormData()
        formData.append('image', file)
        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData,
        })
        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        uploaded.push({ url: data.url, caption: '' })
      }
      setScreenshots(prev => [...prev, ...uploaded])
      toast.success('Screenshots uploaded!')
    } catch (err) {
      toast.error('Failed to upload screenshots')
    }
    setUploadingScreenshots(false)
  }

  const handleRemoveScreenshot = (url: string) => {
    setScreenshots(prev => prev.filter(s => s.url !== url))
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      let imageUrl = form.image
      if (imageFile) {
        imageUrl = await uploadImageToBackend(imageFile)
      }
      const payload = {
        ...form,
        image: imageUrl,
        screenshots,
        tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
        collaborators: collaboratorsInput.split(',').map(c => c.trim()).filter(Boolean),
        technologies: form.technologies.split(',').map(t => t.trim()).filter(Boolean)
      }
      const res = await api.post('/projects', payload)
      setProjects([res.data.data, ...projects])
      setShowModal(false)
      setForm({
        title: '', description: '', githubUrl: '', liveUrl: '', technologies: '', category: 'web', status: 'completed', image: ''
      })
      setImageFile(null)
      setImagePreview(null)
      setScreenshots([])
      setTagsInput('')
      setCollaboratorsInput('')
      toast.success('Project created!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create project')
    }
    setCreating(false)
  }

  const handleStar = async (projectId: string) => {
    try {
      const res = await api.post(`/projects/${projectId}/like`)
      setProjects(projects => projects.map(p =>
        p._id === projectId
          ? { ...p, likesCount: res.data.data.likesCount, isLiked: res.data.data.isLiked }
          : p
      ))
      toast.success(res.data.data.isLiked ? 'Project starred!' : 'Star removed!')
    } catch (err: any) {
      toast.error('Failed to star project')
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    try {
      await api.delete(`/projects/${projectId}`)
      setProjects(projects => projects.filter(p => p._id !== projectId))
      toast.success('Project deleted!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete project')
    }
  }

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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search projects"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition text-gray-700 bg-white"
            />
          </div>
          {loading && <div>Loading projects...</div>}
          {error && <div className="text-red-500">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map(project => (
              <div
                key={project._id}
                className="bg-white rounded-xl shadow-md mb-6 border border-gray-100 transition-shadow hover:shadow-lg p-0 cursor-pointer group overflow-hidden"
                onClick={e => {
                  if ((e.target as HTMLElement).closest('button')) return
                  setSelectedProject(project)
                  setEditModal(false)
                  setModalOpen(true)
                }}
                title={project.githubUrl ? 'View on GitHub' : ''}
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
                  <div className="text-xl font-bold text-gray-900 leading-tight mb-2 mt-1">{project.title}</div>
                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}
                  {/* Description */}
                  <div className="text-gray-700 mb-3 line-clamp-3 min-h-[48px]">{project.description}</div>
                  {/* Technologies */}
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.technologies.map((tech: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">{tech}</span>
                      ))}
                    </div>
                  )}
                  {/* Category and Status */}
                  <div className="flex gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500">Category</span>
                      <div className="font-medium text-gray-800">{project.category}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Status</span>
                      <div className="font-medium text-gray-800">{project.status}</div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      {project.liveUrl && (
                        <button
                          className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"
                          onClick={e => { e.stopPropagation(); window.open(project.liveUrl, '_blank') }}
                        >
                          <FiExternalLink className="w-4 h-4" /> Live
                        </button>
                      )}
                      {project.githubUrl && (
                        <button
                          className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm flex items-center gap-1"
                          onClick={e => { e.stopPropagation(); window.open(project.githubUrl, '_blank') }}
                        >
                          <FiGithub className="w-4 h-4" /> GitHub
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold border ${project.isLiked ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:bg-yellow-200 hover:text-yellow-800 transition`}
                        onClick={e => { e.stopPropagation(); handleStar(project._id) }}
                        title={project.isLiked ? 'Unstar' : 'Star'}
                      >
                        <FiStar className={project.isLiked ? 'fill-yellow-400' : ''} />
                        <span>{project.likesCount || 0}</span>
                      </button>
                      {/* Message Button: Only show if user is not the owner */}
                      {user?._id !== (project as any).owner?._id && (
                        <button
                          className="p-2 rounded-full hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition"
                          title="Message project owner"
                          onClick={e => {
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
                            className="p-2 rounded-full hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition"
                            title="Edit project"
                            onClick={e => {
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
                            onClick={e => { e.stopPropagation(); handleDelete(project._id) }}
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
            <div className="text-gray-500 mt-8 text-center">No projects found.</div>
          )}
          {/* Create Project Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto my-8">
                <h2 className="text-xl font-bold mb-4">Create New Project</h2>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input className="w-full border rounded px-3 py-2" name="title" value={form.title} onChange={handleFormChange} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea className="w-full border rounded px-3 py-2" name="description" value={form.description} onChange={handleFormChange} rows={3} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">GitHub URL</label>
                    <input className="w-full border rounded px-3 py-2" name="githubUrl" value={form.githubUrl} onChange={handleFormChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Live URL</label>
                    <input className="w-full border rounded px-3 py-2" name="liveUrl" value={form.liveUrl} onChange={handleFormChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Technologies (comma separated)</label>
                    <input className="w-full border rounded px-3 py-2" name="technologies" value={form.technologies} onChange={handleFormChange} placeholder="e.g. React, Node.js, MongoDB" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select className="w-full border rounded px-3 py-2" name="category" value={form.category} onChange={handleFormChange}>
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
                    <select className="w-full border rounded px-3 py-2" name="status" value={form.status} onChange={handleFormChange}>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="planning">Planning</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Main Image</label>
                    {imagePreview && (
                      <div className="mt-2 relative group w-fit">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 rounded-lg object-cover border border-gray-200 shadow"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-60 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                          title="Remove image"
                          disabled={isUploadingImage || creating}
                        >
                          <FiX className="h-4 w-4" />
                        </button>
                        {isUploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                            <FiLoader className="animate-spin h-8 w-8 text-primary-600" />
                            <span className="ml-2 text-primary-600 font-medium">Uploading...</span>
                          </div>
                        )}
                      </div>
                    )}
                    <label className="cursor-pointer flex items-center gap-2 text-gray-500 hover:text-primary-600 mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isUploadingImage || creating}
                      />
                      <div className="p-2 hover:bg-primary-50 rounded-full transition-colors">
                        <FiImage className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium hidden sm:inline">Add main image</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Screenshots</label>
                    <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} disabled={uploadingScreenshots || creating} />
                    {uploadingScreenshots && <div className="text-xs text-blue-600 mt-1">Uploading...</div>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {screenshots.map((s) => (
                        <div key={s.url} className="relative group">
                          <img src={s.url} alt="screenshot" className="w-20 h-20 object-cover rounded border" />
                          <button type="button" onClick={() => handleRemoveScreenshot(s.url)} className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-600 group-hover:opacity-100 opacity-0 transition" title="Remove">&times;</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                    <input className="w-full border rounded px-3 py-2" name="tags" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="e.g. open source, video, editor" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Collaborators (comma separated usernames or emails)</label>
                    <input className="w-full border rounded px-3 py-2" name="collaborators" value={collaboratorsInput} onChange={e => setCollaboratorsInput(e.target.value)} placeholder="e.g. alice, bob@example.com" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button type="button" className="px-4 py-2 rounded bg-gray-200" onClick={() => setShowModal(false)} disabled={creating}>Cancel</button>
                    <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white" disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <ProjectDetailsModal 
            project={selectedProject} 
            open={modalOpen} 
            onClose={() => { setModalOpen(false); setEditModal(false); }}
            onProjectUpdate={updated => setProjects(projects => projects.map(p => p._id === updated._id ? { ...p, ...updated } : p))}
            editMode={editModal}
          />
        </div>
      </main>
    </div>
  )
}
