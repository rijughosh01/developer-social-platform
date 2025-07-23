import { useAppSelector } from '@/hooks/useAppDispatch';
import { FiAward, FiMessageSquare, FiGitBranch, FiCheckCircle, FiUserCheck, FiZap, FiThumbsUp, FiUsers, FiStar, FiHeart, FiUserPlus } from 'react-icons/fi';

const BADGES = [
  {
    key: 'first_post',
    label: 'First Post',
    description: 'Create your first post on the platform.',
    icon: <FiAward className="text-yellow-600" />,
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    key: 'top_commenter',
    label: 'Top Commenter',
    description: 'Write 10 comments on posts.',
    icon: <FiMessageSquare className="text-blue-600" />,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    key: 'forked_10',
    label: 'Code Forked 10+',
    description: 'Have one of your code posts forked 10 or more times.',
    icon: <FiGitBranch className="text-green-600" />,
    color: 'bg-green-100 text-green-800',
  },
  
  {
    key: 'streak_master',
    label: 'Streak Master',
    description: 'Log in 7 days in a row.',
    icon: <FiZap className="text-orange-600" />,
    color: 'bg-orange-100 text-orange-800',
  },
  {
    key: 'helper',
    label: 'Helper',
    description: 'Answer 5+ questions/comments from others.',
    icon: <FiUsers className="text-cyan-600" />,
    color: 'bg-cyan-100 text-cyan-800',
  },
  {
    key: 'popular_post',
    label: 'Popular Post',
    description: 'A post received 50+ likes.',
    icon: <FiThumbsUp className="text-pink-600" />,
    color: 'bg-pink-100 text-pink-800',
  },
  {
    key: 'project_creator',
    label: 'Project Creator',
    description: 'Create 3+ projects.',
    icon: <FiStar className="text-indigo-600" />,
    color: 'bg-indigo-100 text-indigo-800',
  },
  {
    key: 'collaborator',
    label: 'Collaborator',
    description: 'Collaborate on 2+ projects.',
    icon: <FiUserPlus className="text-lime-600" />,
    color: 'bg-lime-100 text-lime-800',
  },
  {
    key: 'first_like',
    label: 'First Like',
    description: 'Receive your first like on a post.',
    icon: <FiHeart className="text-red-600" />,
    color: 'bg-red-100 text-red-800',
  },
  {
    key: 'milestone_100_followers',
    label: 'Milestone',
    description: 'Reach 100 followers.',
    icon: <FiUserCheck className="text-green-600" />,
    color: 'bg-green-100 text-green-800',
  },
];

export default function BadgeGalleryPage() {
  const { user } = useAppSelector((state) => state.auth) as { user: any };
  const userBadges = user?.badges || [];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🏅 Badge Gallery</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {BADGES.map((badge) => {
          const earned = userBadges.includes(badge.key);
          return (
            <div
              key={badge.key}
              className={`flex items-center gap-4 p-4 rounded-xl shadow-md border ${badge.color} ${earned ? 'opacity-100' : 'opacity-50'} transition`}
            >
              <div className="text-3xl">{badge.icon}</div>
              <div>
                <div className="font-semibold text-lg flex items-center gap-2">
                  {badge.label}
                  {earned && <span className="ml-1 text-green-600" title="Earned"><FiUserCheck /></span>}
                </div>
                <div className="text-sm text-gray-700">{badge.description}</div>
                {earned ? (
                  <div className="text-xs text-green-700 font-bold mt-1">Earned</div>
                ) : (
                  <div className="text-xs text-gray-500 mt-1">Not yet earned</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 