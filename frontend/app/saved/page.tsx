'use client'
import { useEffect, useState } from 'react'
import { useAppSelector } from '@/hooks/useAppDispatch'
import { savedAPI } from '@/lib/api'
import { PostCard } from '@/components/posts/PostCard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

export default function SavedPage() {
  const { user } = useAppSelector((state) => state.auth)
  const [savedPosts, setSavedPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) return
      setLoading(true)
      try {
        const res = await savedAPI.getSavedPosts(user._id)
        const posts = Array.isArray(res.data.data) ? res.data.data : []
        setSavedPosts(posts)
      } catch {
        setSavedPosts([])
      }
      setLoading(false)
    }
    fetchSaved()
  }, [user])

  if (!user) return <div className="max-w-2xl mx-auto py-8 px-4">Please log in to view your saved posts.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-2xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-4">Saved</h1>
          {loading ? (
            <div>Loading...</div>
          ) : savedPosts.length === 0 ? (
            <div className="text-gray-600">You have no saved posts.</div>
          ) : (
            <div className="space-y-4">
              {savedPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUnsave={() => setSavedPosts((prev) => prev.filter((p) => p._id !== post._id))}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
