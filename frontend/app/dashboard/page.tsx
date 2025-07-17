'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/hooks/useAppDispatch'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Feed } from '@/components/dashboard/Feed'
import { TrendingDevelopers } from '@/components/dashboard/TrendingDevelopers'
import { SuggestedProjects } from '@/components/dashboard/SuggestedProjects'

export default function DashboardPage() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2">
              <Feed />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <TrendingDevelopers />
              <SuggestedProjects />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 