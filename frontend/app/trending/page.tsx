"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function TrendingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <DashboardSidebar />
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Trending Content */}
            <div className="lg:col-span-2">
              <div className="max-w-5xl mx-auto py-10 px-2 sm:px-4">
                <h1 className="text-4xl font-extrabold mb-10 text-left text-gray-900 tracking-tight ml-2">
                  Trending
                </h1>
                <div className="grid gap-12">
                  {/* Trending Posts */}
                  <section>
                    <div className="flex items-center mb-4 gap-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-500 text-xl">
                        🔥
                      </span>
                      <h2 className="text-2xl font-semibold">Trending Posts</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
                      {data.posts.length === 0 && (
                        <div className="text-gray-500">No trending posts.</div>
                      )}
                      {data.posts.map((post: any) => (
                        <div
                          key={post._id}
                          className="bg-white rounded-2xl shadow-md flex flex-col border border-gray-100 overflow-hidden transition-transform duration-200 hover:scale-[1.025] hover:shadow-xl h-[420px] max-w-md mx-auto"
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
                            {/* Tags (max 3, +N if more) */}
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
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <span role="img" aria-label="likes">
                                  👍
                                </span>{" "}
                                {post.likesCount || 0}
                              </span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <span role="img" aria-label="comments">
                                  💬
                                </span>{" "}
                                {post.commentsCount || 0}
                              </span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <span role="img" aria-label="followers">
                                  👥
                                </span>{" "}
                                {post.author?.followersCount || 0}
                              </span>
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
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  {/* Trending Projects */}
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
                      {data.projects.length === 0 && (
                        <div className="text-gray-500">
                          No trending projects.
                        </div>
                      )}
                      {data.projects.map((project: any) => (
                        <div
                          key={project._id}
                          className="bg-white rounded-2xl shadow-md flex flex-col border border-gray-100 overflow-hidden transition-transform duration-200 hover:scale-[1.025] hover:shadow-xl h-[420px] max-w-md mx-auto"
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
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <span role="img" aria-label="likes">
                                  👍
                                </span>{" "}
                                {project.likesCount || 0}
                              </span>
                              <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                                <span role="img" aria-label="followers">
                                  👥
                                </span>{" "}
                                {project.owner?.followersCount || 0}
                              </span>
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
                    </div>
                  </section>
                  {/* Trending Developers */}
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
                      {data.developers.length === 0 && (
                        <div className="text-gray-500">
                          No trending developers.
                        </div>
                      )}
                      {data.developers.map((dev: any) => (
                        <div
                          key={dev._id}
                          className="bg-white rounded-2xl shadow-md p-5 flex flex-col items-center gap-2 border border-gray-100 transition-transform duration-200 hover:scale-[1.025] hover:shadow-xl"
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
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                            <span role="img" aria-label="followers">
                              👥
                            </span>{" "}
                            {dev.followersCount || 0} Followers
                          </div>
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
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
