"use client";

import { TrendingDevelopers } from "@/components/dashboard/TrendingDevelopers";
import { SuggestedProjects } from "@/components/dashboard/SuggestedProjects";
import Link from "next/link";

export function TrendingPreview() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Trending Developers
              </h2>
              <Link
                href="/developers"
                className="text-primary-600 hover:underline text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <TrendingDevelopers limit={3} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Suggested Projects
              </h2>
              <Link
                href="/projects"
                className="text-primary-600 hover:underline text-sm font-medium"
              >
                View all
              </Link>
            </div>
            <SuggestedProjects limit={3} />
          </div>
        </div>
      </div>
    </section>
  );
}
