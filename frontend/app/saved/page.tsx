"use client";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { savedAPI } from "@/lib/api";
import { PostCard } from "@/components/posts/PostCard";
import { SavedDiscussionCard } from "@/components/discussions/SavedDiscussionCard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function SavedPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (!user)
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        Please log in to view your saved items.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <h1 className="text-2xl font-bold mb-6">Saved Items</h1>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : savedItems.length === 0 ? (
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
              {savedItems.map((item) => (
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
