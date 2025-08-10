"use client";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { savedAPI } from "@/lib/api";
import { PostCard } from "@/components/posts/PostCard";
import { SavedDiscussionCard } from "@/components/discussions/SavedDiscussionCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { FiSearch, FiChevronDown } from "react-icons/fi";

export default function SavedPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | "post" | "discussion">("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "a-z">(
    "recent"
  );

  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await savedAPI.getSavedPosts(user._id);
        const items = Array.isArray(res.data.data) ? res.data.data : [];
        setSavedItems(items);
      } catch {
        setSavedItems([]);
      }
      setLoading(false);
    };
    fetchSaved();
  }, [user]);

  const handleUnsave = (itemId: string) => {
    setSavedItems((prev) => prev.filter((item) => item._id !== itemId));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = savedItems.filter((i) => {
      const matchesType = type === "all" || i.type === type || (!i.type && type === "post");
      const title = (i.title || i.question || "").toLowerCase();
      const body = (i.content || i.description || i.body || "").toLowerCase();
      const tags = (i.tags || []).map((t: string) => (t || "").toLowerCase());
      const matchesSearch = !q || title.includes(q) || body.includes(q) || tags.some((t: string) => t.includes(q));
      return matchesType && matchesSearch;
    });
    res = res.sort((a, b) => {
      if (sortBy === "popular")
        return (b.likesCount || 0) - (a.likesCount || 0);
      if (sortBy === "a-z")
        return (a.title || a.question || "").localeCompare(b.title || b.question || "");
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return res;
  }, [savedItems, query, type, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-0">
        {/* Hero */}
        <div className="bg-gradient-to-r from-amber-500 to-pink-500 text-white">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Saved Items</h1>
            <p className="text-white/90 mt-2">Your bookmarked posts and discussions in one place.</p>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-6">
          {!user && (
            <div className="mb-4 text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Please log in to view and manage your saved items.
            </div>
          )}
          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
            <div className="relative w-full md:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
              >
                <option value="all">All types</option>
                <option value="post">Posts</option>
                <option value="discussion">Discussions</option>
              </select>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-amber-200 focus:border-amber-500"
                >
                  <option value="recent">Most recent</option>
                  <option value="popular">Most liked</option>
                  <option value="a-z">A → Z</option>
                </select>
                <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>
          </div>
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No saved items yet
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Start saving posts and discussions to see them here!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((item) => (
                <div key={item._id}>
                  {item.type === "discussion" ? (
                    <SavedDiscussionCard
                      discussion={item}
                      onUnsave={() => handleUnsave(item._id)}
                    />
                  ) : (
                    <PostCard
                      post={item}
                      onUnsave={() => handleUnsave(item._id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
