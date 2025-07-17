'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch'
import { fetchUsers } from '@/store/slices/usersSlice'
import { FiMapPin, FiBriefcase, FiGithub, FiLinkedin, FiGlobe, FiUserPlus, FiUsers } from 'react-icons/fi'
import { formatDistanceToNow } from 'date-fns'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

interface User {
  _id: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  skills?: string[]
  location?: string
  company?: string
  followersCount?: number
  lastSeen?: string
  socialLinks?: {
    github?: string
    linkedin?: string
    website?: string
  }
  bio?: string
}

export default function DevelopersPage() {
  const dispatch = useAppDispatch()
  const { users, isLoading, error } = useAppSelector((state) => state.users)
  const { user: currentUser } = useAppSelector((state) => state.auth)
  const [search, setSearch] = useState('')
  const [skill, setSkill] = useState('')
  const [allSkills, setAllSkills] = useState<string[]>([])

  useEffect(() => {
    dispatch(fetchUsers({ limit: 50 }))
  }, [dispatch])

  useEffect(() => {
    // Collect all unique skills for filter dropdown
    const skillsSet = new Set<string>()
    users.forEach((user) => {
      user.skills?.forEach((skill: string) => skillsSet.add(skill))
    })
    // Add common skills
    const commonSkills = [
      'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'HTML', 'CSS', 'Tailwind CSS', 'Next.js', 'Express', 'MongoDB', 'SQL', 'GraphQL', 'Docker', 'AWS', 'Firebase', 'Redux', 'Sass', 'Vue', 'Angular', 'Flutter', 'Dart', 'Rust', 'Spring', 'Laravel', 'Bootstrap', 'jQuery', 'MySQL', 'PostgreSQL', 'Figma', 'UI/UX', 'Machine Learning', 'AI', 'Data Science', 'DevOps', 'Testing', 'Jest', 'Cypress', 'Jenkins', 'CI/CD', 'Linux', 'Shell', 'Matlab', 'R', 'Scala', 'Perl', 'Elixir', 'Haskell', 'Unity', 'Unreal Engine', 'Game Dev', 'Blockchain', 'Solidity', 'Web3', 'SEO', 'Content Writing', 'Project Management', 'Agile', 'Scrum', 'Leadership', 'Communication'
    ];
    commonSkills.forEach(skill => skillsSet.add(skill));
    setAllSkills(Array.from(skillsSet).sort())
  }, [users])

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
    const matchesSkill = skill ? user.skills?.includes(skill) : true
    return matchesSearch && matchesSkill
  })
  console.log('Filtered users:', filteredUsers)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-6">All Developers</h1>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by name or username"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/2"
            />
            <select
              value={skill}
              onChange={e => setSkill(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full md:w-1/4"
            >
              <option value="">All Skills</option>
              {allSkills.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {isLoading && <div>Loading developers...</div>}
          {error && <div className="text-red-500">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUsers.map(user => (
              <div key={user._id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                <div>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Link href={`/profile/${user.username}`} className="text-lg font-semibold hover:text-blue-600">
                          {user.firstName} {user.lastName}
                        </Link>
                        <div className="text-gray-500 text-sm">@{user.username}</div>
                      </div>
                      {currentUser?._id !== user._id && (
                        <button className="ml-2 px-3 py-1 rounded bg-primary-600 text-white text-xs flex items-center gap-1 hover:bg-primary-700 transition">
                          <FiUserPlus className="h-4 w-4" /> Follow
                        </button>
                      )}
                    </div>
                    {user.skills && user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.skills.map(skill => (
                          <span key={skill} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{skill}</span>
                        ))}
                      </div>
                    )}
                    {user.bio && <div className="text-gray-600 text-sm mt-2 line-clamp-2">{user.bio}</div>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      {user.location && (
                        <span className="flex items-center gap-1"><FiMapPin className="h-4 w-4" />{user.location}</span>
                      )}
                      {user.company && (
                        <span className="flex items-center gap-1"><FiBriefcase className="h-4 w-4" />{user.company}</span>
                      )}
                      <span className="flex items-center gap-1"><FiUsers className="h-4 w-4" />{user.followersCount || 0} followers</span>
                      {user.lastSeen && (
                        <span>Active {formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 justify-end">
                    {user.socialLinks?.github && (
                      <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900"><FiGithub className="h-5 w-5" /></a>
                    )}
                    {user.socialLinks?.linkedin && (
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900"><FiLinkedin className="h-5 w-5" /></a>
                    )}
                    {user.socialLinks?.website && (
                      <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900"><FiGlobe className="h-5 w-5" /></a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!isLoading && filteredUsers.length === 0 && (
            <div className="text-gray-500 mt-8 text-center">No developers found.</div>
          )}
        </div>
      </main>
    </div>
  )
}
