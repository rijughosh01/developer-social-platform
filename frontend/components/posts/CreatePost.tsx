'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch'
import { createPost } from '@/store/slices/postsSlice'
import { Button } from '@/components/ui/button'
import { FiImage, FiX, FiSend, FiLoader } from 'react-icons/fi'
import toast from 'react-hot-toast'
import Editor from 'react-simple-code-editor'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import ts from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import xml from 'react-syntax-highlighter/dist/esm/languages/hljs/xml'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'
import php from 'react-syntax-highlighter/dist/esm/languages/hljs/php'
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql'
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash'
import { getAvatarUrl } from '@/lib/utils'

SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('typescript', ts)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('markup', xml)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('php', php)
SyntaxHighlighter.registerLanguage('sql', sql)
SyntaxHighlighter.registerLanguage('bash', bash)

interface CreatePostForm {
  content: string
}

export function CreatePost() {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [tagsInput, setTagsInput] = useState('')
  const [postType, setPostType] = useState<'regular' | 'code'>('regular')
  const [code, setCode] = useState('')
  const [codeLanguage, setCodeLanguage] = useState('javascript')
  const [codeDifficulty, setCodeDifficulty] = useState('beginner')
  const [codeDescription, setCodeDescription] = useState('')
  const [codeTab, setCodeTab] = useState<'edit' | 'preview'>('edit')
  
  const dispatch = useAppDispatch()
  const { user } = useAppSelector((state) => state.auth)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePostForm>()

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postType === 'regular') {
    if (!content.trim() && !selectedImage) {
      toast.error('Please write something or add an image');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
      }
    } else if (postType === 'code') {
      if (!title.trim()) {
        toast.error('Please enter a title');
        return;
      }
      if (!code.trim()) {
        toast.error('Please enter some code');
        return;
      }
    }
    setIsCreating(true);
    let imageUrl = '';
    try {
      if (postType === 'regular' && selectedImage) {
        imageUrl = await uploadImageToBackend(selectedImage);
      }
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      if (postType === 'regular') {
        await dispatch(createPost({ title, content, image: imageUrl, tags, type: 'regular' }));
      } else {
        console.log('Creating code post with difficulty:', codeDifficulty);
        await dispatch(createPost({ title, code, codeLanguage, difficulty: codeDifficulty, description: codeDescription, tags, type: 'code' }));
      }
      setTitle('');
      setContent('');
      setTagsInput('');
      setSelectedImage(null);
      setImagePreview(null);
      setCode('');
      setCodeLanguage('javascript');
      setCodeDifficulty('beginner');
      setCodeDescription('');
      setPostType('regular');
      toast.success('Post created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create post');
    } finally {
      setIsCreating(false);
    }
  }

  // Move uploadImageToBackend inside the component
  async function uploadImageToBackend(file: File): Promise<string> {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
      const data = await response.json();
      return data.url;
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
          <img
            src={getAvatarUrl(user)}
            alt="User Avatar"
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        <form onSubmit={onSubmit} className="flex-1 min-w-0">
          {/* Post type toggle */}
          <div className="flex gap-2 mb-2">
            <button type="button" className={`px-3 py-1 rounded-lg text-sm font-medium border ${postType === 'regular' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => setPostType('regular')}>Regular Post</button>
            <button type="button" className={`px-3 py-1 rounded-lg text-sm font-medium border ${postType === 'code' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border-gray-200'}`} onClick={() => setPostType('code')}>Code Post</button>
          </div>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full mb-2 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-base font-semibold placeholder-gray-400 transition"
          />
          <input
            type="text"
            placeholder="Tags (comma separated, e.g. react, nodejs, api)"
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            className="w-full mb-2 px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-base placeholder-gray-400 transition"
          />
          {postType === 'regular' && (
          <textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-base resize-none placeholder-gray-400 transition"
          />
          )}
          {postType === 'code' && (
            <>
              <div className="flex gap-2 mb-2">
                <select
                  value={codeLanguage}
                  onChange={e => setCodeLanguage(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="css">CSS</option>
                  <option value="php">PHP</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                  <option value="markup">HTML</option>
                  <option value="react">React</option>
                  <option value="node">Node.js</option>
                </select>
                <span className="text-xs text-gray-400 self-center">Select language</span>
              </div>
              
              {/* Difficulty Level Selector */}
              <div className="flex gap-2 mb-2">
                <select
                  value={codeDifficulty}
                  onChange={e => setCodeDifficulty(e.target.value)}
                  className="px-3 py-1 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm"
                >
                  <option value="beginner">🌱 Beginner</option>
                  <option value="intermediate">🚀 Intermediate</option>
                  <option value="advanced">⚡ Advanced</option>
                </select>
                <span className="text-xs text-gray-400 self-center">Select difficulty</span>
              </div>
              
              {/* Description Field */}
              <div className="mb-2">
                <textarea
                  placeholder="Describe your code, explain what it does, or add any context..."
                  value={codeDescription}
                  onChange={e => setCodeDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-base resize-none placeholder-gray-400 transition"
                />
              </div>
              
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg text-sm font-medium border ${codeTab === 'edit' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border-gray-200'}`}
                  onClick={() => setCodeTab('edit')}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded-lg text-sm font-medium border ${codeTab === 'preview' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 border-gray-200'}`}
                  onClick={() => setCodeTab('preview')}
                >
                  Preview
                </button>
              </div>
              {codeTab === 'edit' && (
                <div className="w-full max-w-full" style={{ height: 240 }}>
                  <textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full h-full font-mono text-sm rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 bg-white p-3 resize-none"
                    style={{
                      fontFamily: 'Fira Mono, monospace',
                      fontSize: 14,
                      minHeight: 0,
                      height: '100%',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      color: '#111',
                      background: '#fff',
                    }}
                    placeholder="Paste or write your code here..."
                  />
                </div>
              )}
              {codeTab === 'preview' && (
                <div className="w-full border border-gray-200 rounded-lg overflow-hidden" style={{ maxWidth: '100%', wordWrap: 'break-word', minWidth: 0 }}>
                  {code ? (
                    <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
                      <SyntaxHighlighter
                        language={codeLanguage || 'javascript'}
                        style={atomOneDark}
                        customStyle={{
                          borderRadius: '0.5rem',
                          fontSize: 14,
                          padding: 16,
                          margin: 0,
                          background: '#1e1e1e',
                          minHeight: '240px',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          maxWidth: '100%',
                          minWidth: 0,
                        }}
                        showLineNumbers
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-60 bg-gray-50 text-gray-500">
                      <div className="text-center">
                        <div className="text-lg mb-2">📝</div>
                        <div className="text-sm">No code to preview</div>
                        <div className="text-xs mt-1">Switch to Edit tab to write code</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}

          {/* Image Preview */}
          {postType === 'regular' && imagePreview && (
            <div className="mt-3 relative group w-fit">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-56 rounded-lg object-cover border border-gray-200 shadow"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-gray-900 bg-opacity-60 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                title="Remove image"
                disabled={isCreating || isUploading}
              >
                <FiX className="h-4 w-4" />
              </button>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                  <FiLoader className="animate-spin h-8 w-8 text-primary-600" />
                  <span className="ml-2 text-primary-600 font-medium">Uploading...</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            {postType === 'regular' && (
            <label className="cursor-pointer flex items-center gap-2 text-gray-500 hover:text-primary-600">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="p-2 hover:bg-primary-50 rounded-full transition-colors">
                <FiImage className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Add image</span>
            </label>
            )}
            <Button
              type="submit"
              disabled={isCreating || isUploading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-base shadow-sm transition"
            >
              {(isCreating || isUploading) ? (
                <FiLoader className="h-4 w-4 animate-spin" />
              ) : (
                <FiSend className="h-4 w-4" />
              )}
              <span>{isCreating ? 'Posting...' : isUploading ? 'Uploading...' : 'Post'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 