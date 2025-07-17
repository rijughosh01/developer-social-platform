import React, { useState } from 'react'
import { FiX, FiStar, FiGithub, FiExternalLink, FiUsers, FiEdit, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

interface ProjectDetailsModalProps {
  project: any
  open: boolean
  onClose: () => void
  onProjectUpdate?: (updated: any) => void // callback to update parent state
  editMode?: boolean // new prop
}

export default function ProjectDetailsModal({ project, open, onClose, onProjectUpdate, editMode }: ProjectDetailsModalProps) {
  const [editModeState, setEditModeState] = useState(false)
  const [form, setForm] = useState<any>(project || {})
  const [saving, setSaving] = useState(false)
  const [screenshots, setScreenshots] = useState<{ url: string; caption: string }[]>(form.screenshots || [])
  const [tagsInput, setTagsInput] = useState(form.tags ? form.tags.join(', ') : '')
  const [collaboratorsInput, setCollaboratorsInput] = useState(form.collaborators ? form.collaborators.join(', ') : '')
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false)

  React.useEffect(() => {
    setForm(project || {})
    setEditModeState(!!editMode)
  }, [project, open, editMode])

  if (!open || !project) return null

  const isOwner = typeof window !== 'undefined' && project.owner?._id === JSON.parse(localStorage.getItem('user') || '{}')._id

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        screenshots,
        tags: tagsInput.split(',').map((t: string) => t.trim()).filter(Boolean),
        collaborators: collaboratorsInput.split(',').map((c: string) => c.trim()).filter(Boolean),
        technologies: typeof form.technologies === 'string' ? form.technologies.split(',').map((t: string) => t.trim()).filter(Boolean) : form.technologies
      }
      const res = await api.put(`/projects/${project._id}`, payload)
      toast.success('Project updated!')
      setEditModeState(false)
      if (onProjectUpdate) onProjectUpdate(res.data.data)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update project')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-500"
          onClick={onClose}
          aria-label="Close"
        >
          <FiX className="w-5 h-5" />
        </button>
        {editModeState ? (
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-2xl font-bold mb-2">Edit Project</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input className="w-full border rounded px-3 py-2" name="title" value={form.title || ''} onChange={handleFormChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea className="w-full border rounded px-3 py-2" name="description" value={form.description || ''} onChange={handleFormChange} rows={3} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GitHub URL</label>
              <input className="w-full border rounded px-3 py-2" name="githubUrl" value={form.githubUrl || ''} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Live URL</label>
              <input className="w-full border rounded px-3 py-2" name="liveUrl" value={form.liveUrl || ''} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Technologies (comma separated)</label>
              <input className="w-full border rounded px-3 py-2" name="technologies" value={Array.isArray(form.technologies) ? form.technologies.join(', ') : (form.technologies || '')} onChange={handleFormChange} placeholder="e.g. React, Node.js, MongoDB" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select className="w-full border rounded px-3 py-2" name="category" value={form.category || 'web'} onChange={handleFormChange}>
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
              <select className="w-full border rounded px-3 py-2" name="status" value={form.status || 'completed'} onChange={handleFormChange}>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
                <option value="planning">Planning</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input className="w-full border rounded px-3 py-2" name="image" value={form.image || ''} onChange={handleFormChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Screenshots</label>
              <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} disabled={uploadingScreenshots} />
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
              <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200" onClick={() => setEditModeState(false)} disabled={saving}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{project.title}</h2>
              {isOwner && (
                <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" onClick={() => setEditModeState(true)} title="Edit project">
                  <FiEdit className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {project.owner?.firstName?.charAt(0)}{project.owner?.lastName?.charAt(0)}
              </div>
              <span className="text-gray-700 font-medium">{project.owner?.firstName} {project.owner?.lastName}</span>
            </div>
            <p className="text-gray-700 mb-4 whitespace-pre-line">{project.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.technologies && project.technologies.map((tech: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">{tech}</span>
              ))}
            </div>
            <div className="flex gap-4 mb-4">
              <div>
                <span className="text-xs text-gray-500">Category</span>
                <div className="font-medium text-gray-800">{project.category}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Status</span>
                <div className="font-medium text-gray-800">{project.status}</div>
              </div>
            </div>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <FiStar className="w-4 h-4" />
                <span>{project.likesCount || 0} Stars</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <FiUsers className="w-4 h-4" />
                <span>{project.collaborators?.length || 0} Collaborators</span>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"
                >
                  <FiExternalLink className="w-4 h-4" /> Live
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm flex items-center gap-1"
                >
                  <FiGithub className="w-4 h-4" /> GitHub
                </a>
              )}
            </div>
            {project.screenshots && project.screenshots.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Screenshots</div>
                <div className="flex flex-wrap gap-2">
                  {project.screenshots.map((s: any) => (
                    <img key={s.url} src={s.url} alt="screenshot" className="w-24 h-24 object-cover rounded border" />
                  ))}
                </div>
              </div>
            )}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {project.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">#{tag}</span>
                ))}
              </div>
            )}
            {project.collaborators && project.collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {project.collaborators.map((c: any, i: number) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">{typeof c === 'string' ? c : c.username || c.email}</span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 