'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  FiHome, 
  FiUsers, 
  FiFolder, 
  FiMessageSquare, 
  FiBookmark,
  FiTrendingUp,
  FiSettings,
  FiCode
} from 'react-icons/fi'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Developers', href: '/developers', icon: FiUsers },
  { name: 'Projects', href: '/projects', icon: FiFolder },
  { name: 'Messages', href: '/messages', icon: FiMessageSquare },
  { name: 'Saved', href: '/saved', icon: FiBookmark },
  { name: 'Trending', href: '/trending', icon: FiTrendingUp },
  { name: 'Code Feed', href: '/code-feed', icon: FiCode },
  { name: 'Settings', href: '/settings', icon: FiSettings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-0 lg:pb-0 lg:overflow-y-auto lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="flex flex-col items-center justify-center py-4 bg-gray-50 border-b border-gray-200">
        <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
          <span className="text-2xl font-bold text-primary-600 tracking-tight">DevLink</span>
        </Link>
        <span className="text-xs text-gray-400 mt-1">Connect. Collaborate. Code.</span>
      </div>
      <nav className="mt-6 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                isActive
                  ? 'bg-primary-100 text-primary-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 