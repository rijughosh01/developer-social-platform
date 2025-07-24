"use client";

import { useEffect, useState } from "react";
import { usersAPI, projectsAPI, postsAPI } from "@/lib/api";
import { FiUsers, FiFolder, FiFileText } from "react-icons/fi";

export function CommunityStats() {
  const [stats, setStats] = useState({
    developers: 0,
    projects: 0,
    posts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [usersRes, projectsRes, postsRes] = await Promise.all([
          usersAPI.getUsers({ limit: 1 }),
          projectsAPI.getProjects({ limit: 1 }),
          postsAPI.getPosts({ limit: 1 }),
        ]);
        setStats({
          developers: usersRes.data.pagination?.total ?? 0,
          projects: projectsRes.data.pagination?.total ?? 0,
          posts: postsRes.data.pagination?.total ?? 0,
        });
      } catch (e) {
        setStats({ developers: 0, projects: 0, posts: 0 });
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <StatCard
            icon={<FiUsers className="h-8 w-8 text-primary-600 mx-auto" />}
            label="Developers"
            value={loading ? "-" : stats.developers.toLocaleString()}
          />
          <StatCard
            icon={<FiFolder className="h-8 w-8 text-green-600 mx-auto" />}
            label="Projects"
            value={loading ? "-" : stats.projects.toLocaleString()}
          />
          <StatCard
            icon={<FiFileText className="h-8 w-8 text-purple-600 mx-auto" />}
            label="Posts"
            value={loading ? "-" : stats.posts.toLocaleString()}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-gray-50 rounded-xl shadow p-6 flex flex-col items-center transition-transform hover:scale-105">
      {icon}
      <div className="mt-4 text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-lg text-gray-600">{label}</div>
    </div>
  );
}
