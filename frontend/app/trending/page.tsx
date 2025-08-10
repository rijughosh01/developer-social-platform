"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { FiChevronDown, FiClock, FiTrendingUp, FiMessageSquare, FiThumbsUp, FiUsers } from "react-icons/fi";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { savedAPI } from "@/lib/api";

export default function TrendingPage() {
  const [data, setData] = useState<any>({ posts: [], projects: [], developers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "projects" | "developers">("all");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week");
  const [sortBy, setSortBy] = useState<"hot" | "top" | "new">("hot");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  // Pagination / infinite scroll state per section
  const POSTS_PAGE_SIZE = 6;
  const PROJECTS_PAGE_SIZE = 6;
  const DEVS_PAGE_SIZE = 9;
  const [postsPage, setPostsPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  const [devsPage, setDevsPage] = useState(1);
  const postsSentinelRef = useRef<HTMLDivElement | null>(null);
  const projectsSentinelRef = useRef<HTMLDivElement | null>(null);
  const devsSentinelRef = useRef<HTMLDivElement | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await api.get("/trending");
        setData(res.data.data);
      } catch (err: any) {
        setError("Failed to load trending content");
      }
      setLoading(false);
    };
    fetchTrending();
  }, []);

  const withinRange = (dateStr?: string) => {
    if (!dateStr || timeRange === "all") return true;
    const created = new Date(dateStr).getTime();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (timeRange === "today") return now - created <= day;
    if (timeRange === "week") return now - created <= 7 * day;
    if (timeRange === "month") return now - created <= 30 * day;
    return true;
  };

  const filterAndSort = <T extends any>(items: T[], cfg: {
    getTitle?: (i: T) => string;
    getBody?: (i: T) => string;
    getTags?: (i: T) => string[];
    getLikes?: (i: T) => number;
    getDate?: (i: T) => string;
    getExtra?: (i: T) => number;
  }) => {
    const q = (search || "").toLowerCase();
    let res = items.filter((i) => {
      const title = (cfg.getTitle?.(i) || "").toLowerCase();
      const body = (cfg.getBody?.(i) || "").toLowerCase();
      const tags = (cfg.getTags?.(i) || []).map((t) => (t || "").toLowerCase());
      const matches = !q || title.includes(q) || body.includes(q) || tags.some((t) => t.includes(q));
      const inRange = withinRange(cfg.getDate?.(i));
      return matches && inRange;
    });
    res = res.sort((a, b) => {
      const la = cfg.getLikes?.(a) || 0;
      const lb = cfg.getLikes?.(b) || 0;
      const da = new Date(cfg.getDate?.(a) || 0).getTime();
      const db = new Date(cfg.getDate?.(b) || 0).getTime();
      const ea = cfg.getExtra?.(a) || 0;
      const eb = cfg.getExtra?.(b) || 0;
      switch (sortBy) {
        case "top":
          return lb - la;
        case "new":
          return db - da;
        case "hot":
        default: {
          const decay = (age: number) => Math.max(0, 1 - age / (7 * 24 * 60 * 60 * 1000));
          const score = (likes: number, ts: number, extra: number) => likes + decay(Date.now() - ts) * 5 + extra;
          return score(lb, db, eb) - score(la, da, ea);
        }
      }
    });
    return res;
  };

  const filteredPosts = useMemo(
    () =>
      filterAndSort<any>(data.posts || [], {
        getTitle: (p) => p.title,
        getBody: (p) => p.content,
        getTags: (p) => p.tags || [],
        getLikes: (p) => p.likesCount || 0,
        getDate: (p) => p.createdAt,
        getExtra: (p) => (p.commentsCount || 0) * 0.5,
      }),
    [data.posts, search, timeRange, sortBy]
  );
  const filteredProjects = useMemo(
    () =>
      filterAndSort<any>(data.projects || [], {
        getTitle: (p) => p.title,
        getBody: (p) => p.description,
        getTags: (p) => p.tags || [],
        getLikes: (p) => p.likesCount || 0,
        getDate: (p) => p.createdAt,
        getExtra: (p) => (p.image ? 1 : 0),
      }),
    [data.projects, search, timeRange, sortBy]
  );
  const filteredDevelopers = useMemo(
    () =>
      filterAndSort<any>(data.developers || [], {
        getTitle: (d) => `${d.firstName || ""} ${d.lastName || ""}`,
        getBody: (d) => d.bio || "",
        getTags: () => [],
        getLikes: (d) => d.followersCount || 0,
        getDate: (d) => d.createdAt,
        getExtra: () => 0,
      }),
    [data.developers, search, timeRange, sortBy]
  );

  // Reset pagination when filters change
  useEffect(() => {
    setPostsPage(1);
    setProjectsPage(1);
    setDevsPage(1);
  }, [search, timeRange, sortBy, activeTab]);

  const visiblePosts = filteredPosts.slice(0, postsPage * POSTS_PAGE_SIZE);
  const hasMorePosts = visiblePosts.length < filteredPosts.length;
  const visibleProjects = filteredProjects.slice(0, projectsPage * PROJECTS_PAGE_SIZE);
  const hasMoreProjects = visibleProjects.length < filteredProjects.length;
  const visibleDevelopers = filteredDevelopers.slice(0, devsPage * DEVS_PAGE_SIZE);
  const hasMoreDevelopers = visibleDevelopers.length < filteredDevelopers.length;

  // IntersectionObservers for infinite scroll per section
  useEffect(() => {
    const createObserver = (
      el: Element | null,
      onIntersect: () => void
    ): (() => void) => {
      if (!el) return () => {};
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) onIntersect();
          });
        },
        { rootMargin: "200px" }
      );
      io.observe(el);
      return () => io.disconnect();
    };
    const cleanups: Array<() => void> = [];
    if (activeTab === "all" || activeTab === "posts") {
      cleanups.push(
        createObserver(postsSentinelRef.current, () => {
          if (hasMorePosts) setPostsPage((p) => p + 1);
        })
      );
    }
    if (activeTab === "all" || activeTab === "projects") {
      cleanups.push(
        createObserver(projectsSentinelRef.current, () => {
          if (hasMoreProjects) setProjectsPage((p) => p + 1);
        })
      );
    }
    if (activeTab === "all" || activeTab === "developers") {
      cleanups.push(
        createObserver(devsSentinelRef.current, () => {
          if (hasMoreDevelopers) setDevsPage((p) => p + 1);
        })
      );
    }
    return () => {
      cleanups.forEach((c) => c());
    };
  }, [activeTab, hasMorePosts, hasMoreProjects, hasMoreDevelopers]);

  // Top tags from posts+projects
  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    const add = (arr?: string[]) =>
      (arr || []).forEach((t) => {
        const key = (t || "").toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    filteredPosts.forEach((p: any) => add(p.tags));
    filteredProjects.forEach((p: any) => add(p.tags));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag);
  }, [filteredPosts, filteredProjects]);

  const toggleSavePost = async (postId: string) => {
    if (!user?._id) return;
    try {
      const isSaved = savedPosts.has(postId);
      if (isSaved) {
        await savedAPI.unsavePost(user._id, postId);
        const next = new Set(savedPosts);
        next.delete(postId);
        setSavedPosts(next);
      } else {
        await savedAPI.savePost(user._id, postId);
        const next = new Set(savedPosts);
        next.add(postId);
        setSavedPosts(next);
      }
    } catch (e) {
      // noop for now
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        <div className="bg-gradient-to-r from-orange-600 to-pink-500 text-white">
          <div className="max-w-7xl mx-auto px-6 py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3"><FiTrendingUp className="w-8 h-8"/>Trending</h1>
            <p className="text-white/90 mt-2">See what's hot across posts, projects, and developers.</p>
            <div className="mt-4 text-white/85 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-2"><FiClock/> Time range filters</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all","posts","projects","developers"] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-1.5 rounded-full border text-sm ${activeTab===t?"bg-white text-gray-900 border-gray-300":"bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>{t[0].toUpperCase()+t.slice(1)}</button>
            ))}
            <div className="h-6 w-px bg-gray-200 mx-1"/>
            {(["today","week","month","all"] as const).map((r) => (
              <button key={r} onClick={() => setTimeRange(r)} className={`px-3 py-1.5 rounded-full border text-sm ${timeRange===r?"bg-gray-100 text-gray-800 border-gray-300":"bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>{r==='all'?"All time":r==='week'?"This week":r==='month'?"This month":"Today"}</button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <select value={sortBy} onChange={(e)=>setSortBy(e.target.value as any)} className="appearance-none pl-3 pr-8 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-orange-200 focus:border-orange-500">
                  <option value="hot">Hot</option>
                  <option value="top">Top</option>
                  <option value="new">New</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"/>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
                <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search titles, tags, bios" className="w-64 pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500"/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Main Trending Content */}
            <div className="lg:col-span-2">
              <div className="max-w-5xl mx-auto py-2 px-2 sm:px-0">
                <div className="grid gap-12">
                  {/* Trending Posts */}
                  {(activeTab==="all"||activeTab==="posts") && (
                  <section>
                    <div className="flex items-center mb-4 gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-500 text-xl">
                        🔥
                      </span>
                      <h2 className="text-2xl font-semibold">Trending Posts</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
                      {loading && (
                        <>
                          {Array.from({length:4}).map((_,i)=> (
                            <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 shadow-sm h-[420px] max-w-md mx-auto overflow-hidden">
                              <div className="h-36 bg-gray-200"/>
                              <div className="p-4 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/2"/>
                                <div className="h-3 bg-gray-200 rounded w-3/4"/>
                                <div className="h-3 bg-gray-200 rounded w-2/3"/>
                                <div className="h-8 bg-gray-200 rounded w-full mt-6"/>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {!loading && filteredPosts.length === 0 && (
                        <div className="text-gray-500">No trending posts.</div>
                      )}
                      {!loading && visiblePosts.map((post: any) => (
                        <div
                          key={post._id}
                          className="bg-white rounded-2xl shadow-sm flex flex-col border border-gray-100 overflow-hidden transition hover:shadow-lg h-[420px] max-w-md mx-auto"
                        >
                          {/* Main Image */}
                          {post.image ? (
                            <div className="w-full h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img
                                src={post.image}
                                alt={post.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-36 bg-gray-100 flex items-center justify-center">
                              <span className="text-gray-400 text-5xl">🖼️</span>
                            </div>
                          )}
                          <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                            {/* Author and Title */}
                            <div className="flex items-center gap-3 mb-1">
                              {post.author?.avatar ? (
                                <img
                                  src={post.author.avatar}
                                  alt={post.author.firstName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-sm font-bold text-gray-600">
                                  {post.author?.firstName?.[0]}
                                  {post.author?.lastName?.[0]}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-900 text-sm">
                                  {post.author?.firstName}{" "}
                                  {post.author?.lastName}
                                </span>
                                <div className="text-xs text-gray-400">
                                  {new Date(
                                    post.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            
                            {post.tags && post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-1">
                                {post.tags.slice(0, 3).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {post.tags.length > 3 && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-xs font-medium">
                                    +{post.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="font-bold text-base text-gray-800 line-clamp-1 mb-0.5">
                              {post.title}
                            </div>
                            <div className="text-gray-700 text-sm line-clamp-2 mb-1">
                              {post.content}
                            </div>
                            <div className="flex gap-2 text-xs font-medium text-gray-600 mt-auto mb-2">
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><FiThumbsUp className="w-3.5 h-3.5"/> {post.likesCount || 0}</span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><FiMessageSquare className="w-3.5 h-3.5"/> {post.commentsCount || 0}</span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><FiUsers className="w-3.5 h-3.5"/> {post.author?.followersCount || 0}</span>
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/dashboard?postId=${post._id}`)
                              }
                              className="w-full mt-1 inline-block text-center px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors shadow-sm"
                              style={{ marginTop: "auto" }}
                            >
                              View Post
                            </button>
                            {user?._id && (
                              <button
                                onClick={() => toggleSavePost(post._id)}
                                className={`mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${savedPosts.has(post._id) ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
                              >
                                {savedPosts.has(post._id) ? "Saved" : "Save"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {!loading && hasMorePosts && (
                        <div className="col-span-full flex justify-center">
                          <button onClick={() => setPostsPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Load more</button>
                        </div>
                      )}
                      
                      <div ref={postsSentinelRef} />
                    </div>
                  </section>
                  )}
                  {/* Trending Projects */}
                  {(activeTab==="all"||activeTab==="projects") && (
                  <section>
                    <div className="flex items-center mb-4 gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-500 text-xl">
                        💜
                      </span>
                      <h2 className="text-2xl font-semibold">
                        Trending Projects
                      </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
                      {loading && (
                        <>
                          {Array.from({length:4}).map((_,i)=> (
                            <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 shadow-sm h-[420px] max-w-md mx-auto overflow-hidden">
                              <div className="h-36 bg-gray-200"/>
                              <div className="p-4 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-1/2"/>
                                <div className="h-3 bg-gray-200 rounded w-3/4"/>
                                <div className="h-3 bg-gray-200 rounded w-2/3"/>
                                <div className="h-8 bg-gray-200 rounded w-full mt-6"/>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      {!loading && filteredProjects.length === 0 && (
                        <div className="text-gray-500">
                          No trending projects.
                        </div>
                      )}
                      {!loading && visibleProjects.map((project: any) => (
                        <div
                          key={project._id}
                          className="bg-white rounded-2xl shadow-sm flex flex-col border border-gray-100 overflow-hidden transition hover:shadow-lg h-[420px] max-w-md mx-auto"
                        >
                          {/* Main Image */}
                          {project.image && (
                            <div className="w-full h-36 bg-gray-100 flex items-center justify-center overflow-hidden">
                              <img
                                src={project.image}
                                alt={project.title}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                            {/* Owner and Title */}
                            <div className="flex items-center gap-3 mb-1">
                              {project.owner?.avatar ? (
                                <img
                                  src={project.owner.avatar}
                                  alt={project.owner.firstName}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-sm font-bold text-gray-600">
                                  {project.owner?.firstName?.[0]}
                                  {project.owner?.lastName?.[0]}
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-900 text-sm">
                                  {project.owner?.firstName}{" "}
                                  {project.owner?.lastName}
                                </span>
                                <div className="text-xs text-gray-400">
                                  {new Date(
                                    project.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            {/* Tags (max 3, +N if more) */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-1">
                                {project.tags.slice(0, 3).map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                                {project.tags.length > 3 && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-xs font-medium">
                                    +{project.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="font-bold text-base text-gray-800 line-clamp-1 mb-0.5">
                              {project.title}
                            </div>
                            <div className="text-gray-700 text-sm line-clamp-2 mb-1">
                              {project.description}
                            </div>
                            <div className="flex gap-2 text-xs font-medium text-gray-600 mt-auto mb-2">
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><FiThumbsUp className="w-3.5 h-3.5"/> {project.likesCount || 0}</span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full"><FiUsers className="w-3.5 h-3.5"/> {project.owner?.followersCount || 0}</span>
                            </div>
                            <button
                              onClick={() =>
                                router.push(
                                  `/projects?projectId=${project._id}`
                                )
                              }
                              className="w-full mt-1 inline-block text-center px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors shadow-sm"
                              style={{ marginTop: "auto" }}
                            >
                              View Project
                            </button>
                          </div>
                        </div>
                      ))}
                      {!loading && hasMoreProjects && (
                        <div className="col-span-full flex justify-center">
                          <button onClick={() => setProjectsPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Load more</button>
                        </div>
                      )}
                      <div ref={projectsSentinelRef} />
                    </div>
                  </section>
                  )}
                  {/* Trending Developers */}
                  {(activeTab==="all"||activeTab==="developers") && (
                  <section>
                    <div className="flex items-center mb-4 gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-500 text-xl">
                        🌟
                      </span>
                      <h2 className="text-2xl font-semibold">
                        Trending Developers
                      </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {loading && (
                        <>
                          {Array.from({length:6}).map((_,i)=> (
                            <div key={i} className="animate-pulse bg-white rounded-2xl border border-gray-100 shadow-sm p-5" />
                          ))}
                        </>
                      )}
                      {!loading && filteredDevelopers.length === 0 && (
                        <div className="text-gray-500">
                          No trending developers.
                        </div>
                      )}
                      {!loading && visibleDevelopers.map((dev: any) => (
                        <div
                          key={dev._id}
                          className="bg-white rounded-2xl shadow-sm p-5 flex flex-col items-center gap-2 border border-gray-100 transition hover:shadow-lg"
                        >
                          {dev.avatar ? (
                            <img
                              src={dev.avatar}
                              alt={dev.firstName}
                              className="w-14 h-14 rounded-full object-cover mb-2"
                            />
                          ) : (
                            <div className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-full text-lg font-bold text-gray-600 mb-2">
                              {dev.firstName?.[0]}
                              {dev.lastName?.[0]}
                            </div>
                          )}
                          <div className="font-semibold text-lg text-gray-900 text-center">
                            {dev.firstName} {dev.lastName}
                          </div>
                          <div className="text-xs text-gray-500 text-center">
                            @{dev.username}
                          </div>
                          {dev.bio && (
                            <div className="text-xs text-gray-600 mt-1 text-center line-clamp-2">
                              {dev.bio}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-2"><FiUsers className="w-3.5 h-3.5"/> {dev.followersCount || 0} Followers</div>
                          <button
                            onClick={() =>
                              router.push(`/profile/${dev.username}`)
                            }
                            className="w-full mt-2 inline-block text-center px-4 py-2 rounded-lg bg-primary-50 text-primary-700 font-semibold text-sm hover:bg-primary-100 transition-colors shadow-sm"
                          >
                            View Profile
                          </button>
                        </div>
                      ))}
                      {!loading && hasMoreDevelopers && (
                        <div className="col-span-full flex justify-center">
                          <button onClick={() => setDevsPage((p) => p + 1)} className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Load more</button>
                        </div>
                      )}
                      <div ref={devsSentinelRef} />
                    </div>
                  </section>
                  )}
                </div>
              </div>
            </div>
            {/* Right rail */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 space-y-6">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Tags</h3>
                  {topTags.length === 0 ? (
                    <p className="text-sm text-gray-500">No tags yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {topTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSearch(tag)}
                          className="px-2 py-1 rounded-full bg-gray-50 text-gray-700 text-xs border border-gray-200 hover:bg-gray-100"
                          title={`Filter by #${tag}`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
