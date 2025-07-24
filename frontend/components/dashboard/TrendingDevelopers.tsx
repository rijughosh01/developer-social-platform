"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiTrendingUp, FiMapPin, FiBriefcase } from "react-icons/fi";
import { usersAPI } from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

export function TrendingDevelopers({ limit = 5 }: { limit?: number }) {
  const [trendingUsers, setTrendingUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTrending() {
      setIsLoading(true);
      try {
        const res = await usersAPI.getUsers({ limit });
        setTrendingUsers(res.data.data);
      } catch (err) {
        setTrendingUsers([]);
      }
      setIsLoading(false);
    }
    fetchTrending();
  }, [limit]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <FiTrendingUp className="h-5 w-5 text-primary-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Trending Developers
          </h3>
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {trendingUsers.map((user) => (
            <Link
              key={user._id}
              href={`/profile/${user.username}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                <img
                  src={getAvatarUrl(user)}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  @{user.username}
                </p>
                {user.location && (
                  <div className="flex items-center mt-1">
                    <FiMapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-500">
                      {user.location}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-semibold text-xs">
                  {user.followersCount || 0}
                </div>
                <div className="text-xs">followers</div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="mt-6">
        <Link
          href="/developers"
          className="block w-full text-center px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors"
        >
          View all developers
        </Link>
      </div>
    </div>
  );
}
