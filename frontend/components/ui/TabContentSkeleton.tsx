import React from "react";

interface TabContentSkeletonProps {
  type: "posts" | "projects" | "discussions";
}

export function TabContentSkeleton({ type }: TabContentSkeletonProps) {
  const renderPostSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-3/4 h-5 bg-gray-200 rounded mb-3"></div>
              <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-2/3 h-4 bg-gray-200 rounded mb-3"></div>
              <div className="flex gap-2 mb-3">
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-14 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProjectSkeleton = () => (
    <div className="grid grid-cols-1 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="w-3/4 h-6 bg-gray-200 rounded mb-3"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
          <div className="w-2/3 h-4 bg-gray-200 rounded mb-3"></div>
          <div className="flex gap-2 mb-3">
            <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
            <div className="w-14 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="w-20 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDiscussionSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-3/4 h-5 bg-gray-200 rounded mb-3"></div>
              <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-2/3 h-4 bg-gray-200 rounded mb-3"></div>
              <div className="flex gap-2 mb-3">
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-pulse">
      {type === "posts" && renderPostSkeleton()}
      {type === "projects" && renderProjectSkeleton()}
      {type === "discussions" && renderDiscussionSkeleton()}
    </div>
  );
}
