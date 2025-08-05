"use client";

import { DiscussionCategory, DiscussionTag, DiscussionFilters } from "@/types";
import { Filter, X } from "lucide-react";

interface DiscussionFiltersProps {
  categories: DiscussionCategory[];
  tags: DiscussionTag[];
  filters: DiscussionFilters;
  onCategoryChange: (category: string) => void;
  onTagChange: (tag: string) => void;
  onClearFilters: () => void;
}

export function DiscussionFilters({
  categories,
  tags,
  filters,
  onCategoryChange,
  onTagChange,
  onClearFilters,
}: DiscussionFiltersProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Filter className="h-4 w-4 text-blue-600" />
          <span>Categories</span>
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
              !filters.category
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                : "text-gray-700 hover:bg-gray-50 border border-transparent"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                filters.category === category.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 border border-transparent"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Popular Tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {tags.slice(0, 8).map((tag) => (
            <button
              key={tag.tag}
              onClick={() => onTagChange(tag.tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                filters.tags?.includes(tag.tag)
                  ? "bg-blue-100 text-blue-700 border border-blue-200 shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
              }`}
            >
              {tag.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      {(filters.category || filters.tags?.length) && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onClearFilters}
            className="w-full px-4 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Clear All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
