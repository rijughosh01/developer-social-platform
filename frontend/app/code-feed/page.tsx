"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { fetchPosts } from "@/store/slices/postsSlice";
import { PostCard } from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { FiRefreshCw, FiFilter, FiArrowDown, FiSearch, FiChevronDown, FiX } from "react-icons/fi";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

// Language options for filtering
const languageOptions = [
  { value: "all", label: "All Languages" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "css", label: "CSS" },
  { value: "php", label: "PHP" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "html", label: "HTML" },
  { value: "react", label: "React" },
  { value: "node", label: "Node.js" },
];

// Difficulty options for filtering
const difficultyOptions = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "🌱 Beginner" },
  { value: "intermediate", label: "🚀 Intermediate" },
  { value: "advanced", label: "⚡ Advanced" },
];

// Sort options
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "mostLiked", label: "Most Liked" },
  { value: "mostCommented", label: "Most Commented" },
  { value: "trending", label: "Trending" },
];

export default function CodeFeedPage() {
  const dispatch = useAppDispatch();
  const { posts, isLoading, error } = useAppSelector((state) => state.posts);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const router = useRouter();

  // Filter and sort state
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchPosts());
    }
  }, [dispatch, isAuthenticated]);

  // Initialize from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const lang = params.get("lang") || "all";
    const diff = params.get("diff") || "all";
    const sort = params.get("sort") || "newest";
    const lay = (params.get("layout") as any) || "list";
    const p = parseInt(params.get("page") || "1", 10);
    setSearchQuery(q);
    setSelectedLanguage(languageOptions.some(l=>l.value===lang)?lang:"all");
    setSelectedDifficulty(difficultyOptions.some(d=>d.value===diff)?diff:"all");
    setSelectedSort(sortOptions.some(s=>s.value===sort)?sort:"newest");
    setLayout(lay === "grid" ? "grid" : "list");
    setPage(isNaN(p) || p < 1 ? 1 : p);
  }, []);

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLanguage !== "all") params.set("lang", selectedLanguage);
    if (selectedDifficulty !== "all") params.set("diff", selectedDifficulty);
    if (selectedSort !== "newest") params.set("sort", selectedSort);
    if (layout !== "list") params.set("layout", layout);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    const url = qs ? `/code-feed?${qs}` : "/code-feed";
    window.history.replaceState(null, "", url);
  }, [searchQuery, selectedLanguage, selectedDifficulty, selectedSort, layout, page]);

  const handleRefresh = () => {
    dispatch(fetchPosts());
  };

  // Filter and sort code posts
  const filteredPosts = useMemo(() => {
    let filteredPosts = posts.filter((post: any) => post.type === "code");

    if (selectedLanguage !== "all") {
      filteredPosts = filteredPosts.filter(
        (post: any) =>
          post.codeLanguage?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }
    if (selectedDifficulty !== "all") {
      filteredPosts = filteredPosts.filter((post: any) => {
        const difficulty = getDifficultyLevel(post);
        return difficulty === selectedDifficulty;
      });
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(
        (post: any) =>
          post.title?.toLowerCase().includes(query) ||
          post.content?.toLowerCase().includes(query) ||
          post.code?.toLowerCase().includes(query) ||
          post.tags?.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    switch (selectedSort) {
      case "oldest":
        filteredPosts = filteredPosts.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "mostLiked":
        filteredPosts = filteredPosts.sort(
          (a, b) => (b.likesCount || 0) - (a.likesCount || 0)
        );
        break;
      case "mostCommented":
        filteredPosts = filteredPosts.sort(
          (a, b) => (b.commentsCount || 0) - (a.commentsCount || 0)
        );
        break;
      case "trending": {
        const score = (p: any) => {
          const ageDays = Math.floor(
            (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return (p.likesCount || 0) + (p.commentsCount || 0) * 2 + Math.max(0, 7 - ageDays);
        };
        filteredPosts = filteredPosts.sort((a, b) => score(b) - score(a));
        break;
      }
      case "newest":
      default:
        filteredPosts = filteredPosts.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }
    return filteredPosts;
  }, [posts, selectedLanguage, selectedDifficulty, searchQuery, selectedSort]);

  // Get difficulty level function
  const getDifficultyLevel = (post: any) => {
    if (post.difficulty) return post.difficulty;

    // Auto-detect difficulty based on code complexity
    const code = post.code || "";
    const lines = code.split("\n").length;
    const hasFunctions = /function|=>|class/.test(code);
    const hasLoops = /for|while|forEach|map/.test(code);
    const hasConditionals = /if|else|switch/.test(code);

    if (lines > 50 || (hasFunctions && hasLoops && hasConditionals))
      return "advanced";
    if (lines > 20 || hasFunctions || hasLoops) return "intermediate";
    return "beginner";
  };

  const visiblePosts = filteredPosts.slice(0, page * PAGE_SIZE);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setPage((p) => p + 1);
      });
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [filteredPosts.length]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        {/* Hero */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Code Feed</h1>
                <p className="text-white/90 mt-2">Explore code snippets shared by the community. Filter by language, difficulty and more.</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <Button onClick={handleRefresh} variant="secondary" size="sm" className="flex items-center gap-2">
                  <FiRefreshCw className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="space-y-6">
            {/* Search + Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search code posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm" className="flex items-center gap-2">
                  <FiFilter className="h-4 w-4" /> Filters
                </Button>
                <div className="relative">
                  <select
                    aria-label="Sort by"
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Programming language"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Difficulty level"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-sky-200 focus:border-sky-500"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Active filter chips */}
            {(selectedLanguage !== "all" || selectedDifficulty !== "all" || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    q: {searchQuery}
                    <button onClick={() => setSearchQuery("")} className="ml-1">
                      <FiX />
                    </button>
                  </span>
                )}
                {selectedLanguage !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs">
                    {languageOptions.find((l)=>l.value===selectedLanguage)?.label}
                    <button onClick={() => setSelectedLanguage("all")} className="ml-1 text-blue-700">
                      <FiX />
                    </button>
                  </span>
                )}
                {selectedDifficulty !== "all" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs">
                    {difficultyOptions.find((d)=>d.value===selectedDifficulty)?.label}
                    <button onClick={() => setSelectedDifficulty("all")} className="ml-1 text-purple-700">
                      <FiX />
                    </button>
                  </span>
                )}
                <Button
                  onClick={() => { setSearchQuery(""); setSelectedLanguage("all"); setSelectedDifficulty("all"); }}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            )}

            {/* Results Summary */}
            {filteredPosts.length > 0 && (
              <div className="text-sm text-gray-600">
                Showing {filteredPosts.length} code post
                {filteredPosts.length !== 1 ? "s" : ""}
                {selectedLanguage !== "all" &&
                  ` in ${
                    languageOptions.find((l) => l.value === selectedLanguage)
                      ?.label
                  }`}
                {selectedDifficulty !== "all" &&
                  ` at ${
                    difficultyOptions.find(
                      (d) => d.value === selectedDifficulty
                    )?.label
                  }`}
                {searchQuery && ` matching "${searchQuery}"`}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main list */}
              <div className="lg:col-span-2 space-y-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    {Array.from({length:4}).map((_,i)=> (
                      <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-[200px]" />
                    ))}
                  </div>
                ) : visiblePosts.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery || selectedLanguage !== "all"
                      ? "No matching code posts"
                      : "No code posts yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || selectedLanguage !== "all"
                      ? "Try adjusting your search or filters."
                      : "Be the first to share code with the developer community!"}
                  </p>
                  {(searchQuery ||
                    selectedLanguage !== "all" ||
                    selectedDifficulty !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedLanguage("all");
                        setSelectedDifficulty("all");
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
                ) : (
                  visiblePosts.map((post) => (
                    <PostCard key={post._id} post={post} />
                  ))
                )}
                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} />
              </div>

              {/* Right rail */}
              <aside className="hidden lg:block">
                <div className="sticky top-20 space-y-6">
                  <PopularLanguages posts={posts} onPick={(lang)=> { setSelectedLanguage(lang); setShowFilters(true); }} />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Popular languages widget
function PopularLanguages({ posts, onPick }: { posts: any[]; onPick: (lang: string)=>void }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    posts.filter((p:any)=>p.type==="code").forEach((p:any)=>{
      const lang = (p.codeLanguage || "").toLowerCase();
      if (!lang) return;
      map[lang] = (map[lang] || 0) + 1;
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10);
  }, [posts]);
  if (counts.length===0) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Popular Languages</h3>
      <div className="flex flex-wrap gap-2">
        {counts.map(([lang, count]) => (
          <button key={lang} onClick={()=>onPick(lang)} className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs border border-gray-200 hover:bg-gray-100" title={`Filter by ${lang}`}>
            {lang} <span className="text-gray-400">({count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
