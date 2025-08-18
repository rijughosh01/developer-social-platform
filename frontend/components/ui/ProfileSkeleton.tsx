import React from "react";

export function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-pulse">
      {/* Header with background */}
      <div className="relative mb-8">
        <div className="h-40 w-full rounded-2xl bg-gray-200"></div>

        {/* Avatar skeleton */}
        <div className="absolute left-1/2 -bottom-20 transform -translate-x-1/2 z-20 flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg"></div>
          <div className="w-16 h-4 bg-gray-200 rounded mt-2"></div>
        </div>
      </div>

      {/* Profile card skeleton */}
      <div className="bg-white rounded-2xl shadow-xl pt-14 pb-8 px-6 flex flex-col items-center relative -mt-8">
        {/* Name */}
        <div className="w-48 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="w-32 h-6 bg-gray-200 rounded mb-3"></div>

        {/* Bio */}
        <div className="w-96 h-4 bg-gray-200 rounded mb-3"></div>
        <div className="w-80 h-4 bg-gray-200 rounded mb-3"></div>

        {/* Location and company */}
        <div className="flex gap-4 mb-3">
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
          <div className="w-28 h-4 bg-gray-200 rounded"></div>
        </div>

        {/* Skills */}
        <div className="flex gap-2 mb-4">
          <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
          <div className="w-14 h-6 bg-gray-200 rounded-full"></div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-4">
          <div className="text-center">
            <div className="w-8 h-6 bg-gray-200 rounded mb-1"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
          <div className="text-center">
            <div className="w-8 h-6 bg-gray-200 rounded mb-1"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Social links */}
        <div className="flex gap-3 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <div className="w-24 h-8 bg-gray-200 rounded"></div>
          <div className="w-20 h-8 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Achievements skeleton */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mt-6">
        <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-2"></div>
              <div className="w-20 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex border-b mb-4 mt-6">
        <div className="w-16 h-8 bg-gray-200 rounded mr-4"></div>
        <div className="w-20 h-8 bg-gray-200 rounded mr-4"></div>
        <div className="w-24 h-8 bg-gray-200 rounded"></div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
            <div className="w-3/4 h-6 bg-gray-200 rounded mb-3"></div>
            <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
            <div className="w-2/3 h-4 bg-gray-200 rounded mb-3"></div>
            <div className="flex gap-2 mb-3">
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
