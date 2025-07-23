'use client'
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usersAPI, postsAPI, projectsAPI } from '@/lib/api';
import { useAppSelector } from '@/hooks/useAppDispatch';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { chatAPI } from '@/lib/api';
import { PostCard } from '@/components/posts/PostCard'
import ProjectDetailsModal from '@/app/projects/ProjectDetailsModal'
import { getAvatarUrl } from '@/lib/utils'
import { FiMapPin, FiBriefcase, FiGithub, FiLinkedin, FiGlobe, FiTwitter, FiAward, FiMessageSquare, FiGitBranch, FiUserCheck, FiCheckCircle, FiStar, FiZap, FiThumbsUp, FiUsers, FiHeart, FiUserPlus } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface ProfilePageProps {
  params: { username: string }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = params;
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'Posts' | 'Projects'>('Posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await usersAPI.getUserByUsername(username);
        setUser(res.data.data);
      } catch {
        setUser(null);
      }
      setLoading(false);
    };
    fetchUser();
  }, [username]);

  useEffect(() => {
    if (!user) return;
    setLoadingTab(true);
    if (tab === 'Posts') {
      postsAPI.getUserPosts(user._id).then(res => {
        setPosts(res.data.data || []);
        setLoadingTab(false);
      });
    } else {
      projectsAPI.getUserProjects(user._id).then(res => {
        setProjects(res.data.data || []);
        setLoadingTab(false);
      });
    }
  }, [tab, user]);

  useEffect(() => {
    if (!user || !currentUser) return;
    setIsFollowing(!!user.isFollowing);
  }, [user, currentUser]);

  useEffect(() => {
    if (user) {
      console.log('User object:', user);
    }
  }, [user]);

  const handleFollow = async () => {
    if (!user || !currentUser) return;
    setFollowLoading(true);
    try {
      let res;
      if (isFollowing) {
        res = await usersAPI.unfollowUser(user._id);
      } else {
        res = await usersAPI.followUser(user._id);
      }
      setUser(res.data.data);
      setIsFollowing(!!res.data.data.isFollowing);
      toast.success(isFollowing ? 'Unfollowed' : 'Followed');
    } catch {
      toast.error('Failed to update follow status');
    }
    setFollowLoading(false);
  };

  const openFollowers = async () => {
    setShowFollowers(true);
    try {
      const res = await usersAPI.getFollowers(user._id);
      setFollowers(res.data.data || []);
    } catch {
      setFollowers([]);
    }
  };
  const openFollowing = async () => {
    setShowFollowing(true);
    try {
      const res = await usersAPI.getFollowing(user._id);
      setFollowing(res.data.data || []);
    } catch {
      setFollowing([]);
    }
  };

  const handleMessage = async () => {
    if (!user || !currentUser) return;
    try {
      const res = await chatAPI.startChat({ userId: user._id });
      const chatId = res.data.data._id;
      router.push(`/messages?chatId=${chatId}`);
    } catch {
      // Optionally show error
    }
  };

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!user) return <div style={{ padding: 32 }}>User not found.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Modern Profile Header with Banner */}
      <div className="relative mb-8" style={{overflow: 'visible'}}>
        {/* Banner */}
        <div className="h-40 w-full rounded-2xl bg-gradient-to-r from-primary-600 to-blue-400 shadow-lg" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80)', backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'visible'}}></div>
        {/* Avatar with Circular Progress */}
        <div className="absolute left-1/2 -bottom-20 transform -translate-x-1/2 z-20 flex flex-col items-center" style={{overflow: 'visible'}}>
          <div style={{ width: 150, height: 150, position: 'relative' }}>
            <CircularProgressbar
              value={user.profileCompletion || 0}
              strokeWidth={4}
              styles={buildStyles({
                pathColor: '#3b82f6', 
                trailColor: '#e5e7eb',
                strokeLinecap: 'round',
              })}
            />
            <img
              src={getAvatarUrl(user)}
              alt="Profile Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white absolute top-1/2 left-1/2"
              style={{ transform: 'translate(-50%, -50%)', zIndex: 2 }}
            />
          </div>
          <div className="text-blue-600 font-bold text-lg mt-1 mb-2">{user.profileCompletion || 0}%</div>
        </div>
      </div>
      {/* Profile Card Modernized */}
      <div className="bg-white rounded-2xl shadow-xl pt-14 pb-8 px-6 flex flex-col items-center relative -mt-8" style={{overflow: 'visible'}}>
        <h2 className="text-3xl font-bold mb-1 mt-3">{user.firstName} {user.lastName}</h2>
        <div className="text-gray-500 text-lg mb-2">@{user.username}</div>
        <div className="mb-3 text-center text-gray-700 max-w-xl">{user.bio}</div>
        <div className="flex flex-wrap gap-4 text-gray-600 text-sm mb-3 justify-center">
          {user.location && <span className="flex items-center gap-1"><FiMapPin className="inline" /> {user.location}</span>}
          {user.company && <span className="flex items-center gap-1"><FiBriefcase className="inline" /> {user.company}</span>}
        </div>
        {user.skills && user.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 justify-center">
            {user.skills.map((skill: string) => (
              <span key={skill} className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">{skill}</span>
            ))}
          </div>
        )}
        <div className="flex gap-6 text-center mb-4">
          <button onClick={openFollowers} className="hover:underline">
            <div className="text-xl font-bold">{user.followersCount}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </button>
          <button onClick={openFollowing} className="hover:underline">
            <div className="text-xl font-bold">{user.followingCount}</div>
            <div className="text-xs text-gray-500">Following</div>
          </button>
        </div>
        <div className="flex gap-3 mb-4">
          {user.socialLinks?.github && <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-black"><FiGithub size={22} /></a>}
          {user.socialLinks?.linkedin && <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-700"><FiLinkedin size={22} /></a>}
          {user.socialLinks?.twitter && <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400"><FiTwitter size={22} /></a>}
          {user.socialLinks?.website && <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-700"><FiGlobe size={22} /></a>}
        </div>
        <div className="flex gap-3 mt-2">
          {currentUser?.username === user.username && (
            <Link href="/settings">
              <Button size="sm">Edit Profile</Button>
            </Link>
          )}
          {currentUser && currentUser.username !== user.username && (
            <>
              <Button
                size="sm"
                variant={isFollowing ? 'secondary' : 'default'}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMessage}
              >
                Message
              </Button>
            </>
          )}
        </div>
      </div>
      {/* Achievements Section */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
        <h3 className="text-xl font-bold mb-4">Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {/* Badges */}
          {user.badges && user.badges.length > 0 ? (
            <>
              {user.badges.includes('first_post') && (
                <div title="First Post: Create your first post on the platform." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiAward className="text-yellow-600" />
                  </div>
                  <span className="text-xs font-semibold text-yellow-800">First Post</span>
                </div>
              )}
              {user.badges.includes('top_commenter') && (
                <div title="Top Commenter: Write 10 comments on posts." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiMessageSquare className="text-blue-600" />
                  </div>
                  <span className="text-xs font-semibold text-blue-800">Top Commenter</span>
                </div>
              )}
              {user.badges.includes('forked_10') && (
                <div title="Code Forked 10+: Have one of your code posts forked 10 or more times." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiGitBranch className="text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-800">Forked 10+</span>
                </div>
              )}
              {user.badges.includes('streak_master') && (
                <div title="Streak Master: Log in 7 days in a row." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiZap className="text-orange-600" />
                  </div>
                  <span className="text-xs font-semibold text-orange-800">Streak Master</span>
                </div>
              )}
              {user.badges.includes('helper') && (
                <div title="Helper: Answer 5+ questions/comments from others." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiUsers className="text-cyan-600" />
                  </div>
                  <span className="text-xs font-semibold text-cyan-800">Helper</span>
                </div>
              )}
              {user.badges.includes('popular_post') && (
                <div title="Popular Post: A post received 50+ likes." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiThumbsUp className="text-pink-600" />
                  </div>
                  <span className="text-xs font-semibold text-pink-800">Popular Post</span>
                </div>
              )}
              {user.badges.includes('project_creator') && (
                <div title="Project Creator: Create 3+ projects." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiStar className="text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-800">Project Creator</span>
                </div>
              )}
              {user.badges.includes('collaborator') && (
                <div title="Collaborator: Collaborate on 2+ projects." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-lime-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiUserPlus className="text-lime-600" />
                  </div>
                  <span className="text-xs font-semibold text-lime-800">Collaborator</span>
                </div>
              )}
              {user.badges.includes('first_like') && (
                <div title="First Like: Receive your first like on a post." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiHeart className="text-red-600" />
                  </div>
                  <span className="text-xs font-semibold text-red-800">First Like</span>
                </div>
              )}
              {user.badges.includes('milestone_100_followers') && (
                <div title="Milestone: Reach 100 followers." className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2 shadow-lg text-3xl">
                    <FiUserCheck className="text-green-600" />
                  </div>
                  <span className="text-xs font-semibold text-green-800">Milestone</span>
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-400 col-span-4 text-center">No badges earned yet.</span>
          )}
        </div>
      </div>
      {/* Followers Modal */}
      {showFollowers && (
        <Modal onClose={() => setShowFollowers(false)} title="Followers">
          {followers.length === 0 ? <div className="text-gray-500">No followers yet.</div> : (
            <ul>
              {followers.map((f) => (
                <li key={f._id} className="py-2 border-b last:border-b-0 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                    {f.firstName?.charAt(0)}{f.lastName?.charAt(0)}
                  </div>
                  <span>{f.firstName} {f.lastName} <span className="text-gray-500">@{f.username}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
      {/* Following Modal */}
      {showFollowing && (
        <Modal onClose={() => setShowFollowing(false)} title="Following">
          {following.length === 0 ? <div className="text-gray-500">Not following anyone yet.</div> : (
            <ul>
              {following.map((f) => (
                <li key={f._id} className="py-2 border-b last:border-b-0 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                    {f.firstName?.charAt(0)}{f.lastName?.charAt(0)}
                  </div>
                  <span>{f.firstName} {f.lastName} <span className="text-gray-500">@{f.username}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'Posts' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-primary-600'}`}
          onClick={() => setTab('Posts')}
        >
          Posts
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${tab === 'Projects' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-600 hover:text-primary-600'}`}
          onClick={() => setTab('Projects')}
        >
          Projects
        </button>
      </div>
      {/* Tab Content */}
      <div>
        {loadingTab ? (
          <div>Loading...</div>
        ) : tab === 'Posts' ? (
          posts.length === 0 ? <div className="text-gray-500">No posts yet.</div> : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )
        ) : (
          projects.length === 0 ? <div className="text-gray-500">No projects yet.</div> : (
            <>
              <div className="grid grid-cols-1 gap-6">
                {projects.map((project) => (
                  <div
                    key={project._id}
                    className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-100 relative"
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('button')) return
                      setSelectedProject(project)
                      setModalOpen(true)
                    }}
                  >
                    <div className="text-xl font-bold text-gray-900 mb-2">{project.title}</div>
                    <div className="text-gray-600 mb-2 line-clamp-2 min-h-[32px]">{project.shortDescription || project.description}</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {project.technologies && project.technologies.map((tech: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">{tech}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <div>Category: <span className="font-medium text-gray-800">{project.category}</span></div>
                      <div>Status: <span className="font-medium text-gray-800">{project.status}</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <ProjectDetailsModal 
                project={selectedProject} 
                open={modalOpen} 
                onClose={() => setModalOpen(false)}
                onProjectUpdate={updated => setProjects(projects => projects.map(p => p._id === updated._id ? { ...p, ...updated } : p))}
              />
            </>
          )
        )}
      </div>
    </div>
  );
}

// Simple Modal component
function Modal({ onClose, title, children }: { onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">✕</button>
        <div className="text-lg font-bold mb-4">{title}</div>
        {children}
      </div>
    </div>
  );
} 