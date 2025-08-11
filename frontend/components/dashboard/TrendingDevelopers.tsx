"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FiTrendingUp, 
  FiMapPin, 
  FiBriefcase, 
  FiUsers, 
  FiStar, 
  FiArrowRight,
  FiZap,
  FiAward,
  FiEye
} from "react-icons/fi";
import { api } from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

export function TrendingDevelopers({ limit }: { limit?: number }) {
  const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      setIsLoading(true);
      try {
        const res = await api.get("/trending");
        setTrendingUsers(res.data.data.developers);
      } catch (err) {
        setTrendingUsers([]);
      }
      setIsLoading(false);
    }
    fetchTrending();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
              <FiTrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Trending Developers
              </h3>
              <p className="text-sm text-gray-600">
                Top developers this week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
            <FiZap className="w-3 h-3" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-6 space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-16 h-8 bg-gray-200 rounded-lg flex-shrink-0"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 pt-8 space-y-3">
          {trendingUsers.slice(0, limit || 10).map((user, index) => (
            <Link
              key={user._id}
              href={`/profile/${user.username}`}
              className="group block"
            >
              <div className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200 relative shadow-sm hover:shadow-md">
                {/* Rank Badge */}
                <div className="absolute -top-1 -left-1 z-10">
                  {index < 3 ? (
                    <div className="w-7 h-7 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <FiAward className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 bg-gradient-to-r from-gray-500 to-gray-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs font-bold text-white">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                    <img
                      src={getAvatarUrl(user)}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  </div>
                  {/* Online Status */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {user.firstName} {user.lastName}
                    </h4>
                    {index < 3 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                        <FiStar className="w-3 h-3 text-white fill-current" />
                        <span className="text-xs font-bold text-white">Top</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 truncate mb-1">
                    @{user.username}
                  </p>
                  
                  {user.location && (
                    <div className="flex items-center gap-1 mb-2">
                      <FiMapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 truncate">
                        {user.location}
                      </span>
                    </div>
                  )}

                  {/* Skills/Tags */}
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FiUsers className="w-3 h-3" />
                      <span>{user.followersCount || 0} followers</span>
                    </div>
                    {user.skills && user.skills.length > 0 && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                          {user.skills.slice(0, 2).map((skill: string, skillIndex: number) => (
                            <span
                              key={skillIndex}
                              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{user.skills.length - 2}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all duration-200">
                    <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
        <Link
          href="/developers"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all duration-200 group"
        >
          <span>View all developers</span>
          <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
