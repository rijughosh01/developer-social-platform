"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import {
  fetchUsers,
  followUser,
  unfollowUser,
} from "@/store/slices/usersSlice";
import {
  FiMapPin,
  FiBriefcase,
  FiGithub,
  FiLinkedin,
  FiGlobe,
  FiUserPlus,
  FiUsers,
  FiSearch,
  FiFilter,
  FiChevronDown,
} from "react-icons/fi";
import { formatDistanceToNow } from "date-fns";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  skills?: string[];
  location?: string;
  company?: string;
  followersCount?: number;
  lastSeen?: string;
  socialLinks?: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
  bio?: string;
  isFollowing?: boolean;
}

export default function DevelopersPage() {
  const dispatch = useAppDispatch();
  const { users, isLoading, error } = useAppSelector((state) => state.users);
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"popular" | "active" | "a-z">(
    "popular"
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Initialize from URL
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const sk = params.get("skill") || "";
    const sort = (params.get("sort") as any) || "popular";
    const p = parseInt(params.get("page") || "1", 10);
    setSearch(q);
    setSkill(sk);
    if (["popular", "active", "a-z"].includes(sort)) setSortBy(sort);
    setPage(isNaN(p) || p < 1 ? 1 : p);
  }, []);

  useEffect(() => {
    dispatch(fetchUsers({ limit: 24, page }));
  }, [dispatch, page]);

  useEffect(() => {
    // Collect all unique skills for filter dropdown
    const skillsSet = new Set<string>();
    users.forEach((user) => {
      user.skills?.forEach((skill: string) => skillsSet.add(skill));
    });
    // Add common skills
    const commonSkills = [
      "React",
      "Node.js",
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "C++",
      "C#",
      "Go",
      "Ruby",
      "PHP",
      "Swift",
      "Kotlin",
      "HTML",
      "CSS",
      "Tailwind CSS",
      "Next.js",
      "Express",
      "MongoDB",
      "SQL",
      "GraphQL",
      "Docker",
      "AWS",
      "Firebase",
      "Redux",
      "Sass",
      "Vue",
      "Angular",
      "Flutter",
      "Dart",
      "Rust",
      "Spring",
      "Laravel",
      "Bootstrap",
      "jQuery",
      "MySQL",
      "PostgreSQL",
      "Figma",
      "UI/UX",
      "Machine Learning",
      "AI",
      "Data Science",
      "DevOps",
      "Testing",
      "Jest",
      "Cypress",
      "Jenkins",
      "CI/CD",
      "Linux",
      "Shell",
      "Matlab",
      "R",
      "Scala",
      "Perl",
      "Elixir",
      "Haskell",
      "Unity",
      "Unreal Engine",
      "Game Dev",
      "Blockchain",
      "Solidity",
      "Web3",
      "SEO",
      "Content Writing",
      "Project Management",
      "Agile",
      "Scrum",
      "Leadership",
      "Communication",
    ];
    commonSkills.forEach((skill) => skillsSet.add(skill));
    setAllSkills(Array.from(skillsSet).sort());
  }, [users]);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (skill) params.set("skill", skill);
    if (sortBy !== "popular") params.set("sort", sortBy);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const url = qs ? `/developers?${qs}` : "/developers";
    window.history.replaceState(null, "", url);
  }, [search, skill, sortBy, page]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let res = users.filter((u) => {
      const matchesSearch =
        !q ||
        u.firstName?.toLowerCase().includes(q) ||
        u.lastName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        (u.skills || []).some((s) => s.toLowerCase().includes(q));
      const matchesSkill = skill ? u.skills?.includes(skill) : true;
      return matchesSearch && matchesSkill;
    });
    res = res.sort((a, b) => {
      if (sortBy === "popular")
        return (b.followersCount || 0) - (a.followersCount || 0);
      if (sortBy === "active")
        return (
          new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime()
        );
      return `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`
      );
    });
    return res;
  }, [users, search, skill, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        {/* Hero */}
        <div className="bg-gradient-to-r from-indigo-600 to-sky-500 text-white">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">All Developers</h1>
            <p className="text-white/90 mt-2">Discover and connect with developers by skill, location, and activity.</p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
            <div className="relative w-full md:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, username, or skill"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-gray-700 bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by skill"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-44 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-gray-700 bg-white"
              >
                <option value="">All Skills</option>
                {allSkills.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
                >
                  <option value="popular">Most followed</option>
                  <option value="active">Recently active</option>
                  <option value="a-z">A → Z</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              {skill && (
                <button
                  onClick={() => setSkill("")}
                  className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  title="Clear skill filter"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-[160px]" />)
              )}
            </div>
          )}
          {error && <div className="text-red-500">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredUsers.map((user) => (
              <div
                key={user._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-lg transition"
              >
                <div>
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/profile/${user.username}`}
                          className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                        >
                          {user.firstName} {user.lastName}
                        </Link>
                        <div className="text-gray-500 text-sm">
                          @{user.username}
                        </div>
                      </div>
                      {currentUser?._id !== user._id && (
                        <button
                          className={`ml-2 px-3 py-1.5 rounded text-xs flex items-center gap-1 transition font-semibold border ${
                            user.isFollowing
                              ? "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                              : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                          }`}
                          onClick={async () => {
                            if (user.isFollowing) {
                              await dispatch(unfollowUser(user._id));
                            } else {
                              await dispatch(followUser(user._id));
                            }
                          }}
                        >
                          <FiUserPlus className="h-4 w-4" />{" "}
                          {user.isFollowing ? "Unfollow" : "Follow"}
                        </button>
                      )}
                    </div>
                    {user.skills && user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {user.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-xs font-medium">
                            +{user.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                    {user.bio && (
                      <div className="text-gray-700 text-sm mt-2 line-clamp-2">
                        {user.bio}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      {user.location && (
                        <span className="flex items-center gap-1">
                          <FiMapPin className="h-4 w-4" />
                          {user.location}
                        </span>
                      )}
                      {user.company && (
                        <span className="flex items-center gap-1">
                          <FiBriefcase className="h-4 w-4" />
                          {user.company}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FiUsers className="h-4 w-4" />
                        {user.followersCount || 0} followers
                      </span>
                      {user.lastSeen && (
                        <span>
                          Active{" "}
                          {formatDistanceToNow(new Date(user.lastSeen), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3 justify-end">
                    {user.socialLinks?.github && (
                      <a
                        href={user.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <FiGithub className="h-5 w-5" />
                      </a>
                    )}
                    {user.socialLinks?.linkedin && (
                      <a
                        href={user.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <FiLinkedin className="h-5 w-5" />
                      </a>
                    )}
                    {user.socialLinks?.website && (
                      <a
                        href={user.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-gray-900"
                      >
                        <FiGlobe className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Load more
            </button>
          </div>
          {!isLoading && filteredUsers.length === 0 && (
            <div className="mt-10 flex flex-col items-center justify-center text-center bg-white border border-gray-200 rounded-2xl p-10">
              <div className="text-5xl mb-3">🔎</div>
              <h3 className="text-lg font-semibold mb-1">No developers match your filters</h3>
              <p className="text-gray-600 mb-2 max-w-md">Try adjusting search or selecting a different skill.</p>
              {skill && (
                <button
                  onClick={() => setSkill("")}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Clear skill filter
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
