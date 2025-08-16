"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiX, FiUsers, FiFolder, FiFileText, FiMessageSquare } from "react-icons/fi";
import { searchAPI } from "@/lib/api";
import { getAvatarUrl } from "@/lib/utils";

interface SearchSuggestion {
  type: "user" | "project" | "post" | "discussion";
  id: string;
  title: string;
  subtitle: string;
  avatar?: string;
  url: string;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search suggestions
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Show loading state for suggestions
    setIsSuggestionsLoading(true);
    setShowSuggestions(true);
    setSuggestions([]);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await searchAPI.getSuggestions({ q: searchQuery });
        if (response.data.success) {
          setSuggestions(response.data.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Failed to get search suggestions:", error);
        setShowSuggestions(false);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Navigate to the appropriate page
    switch (suggestion.type) {
      case "user":
        router.push(`/profile/${suggestion.subtitle.replace("@", "")}`);
        break;
      case "project":
        router.push(`/projects/${suggestion.id}`);
        break;
      case "post":
        router.push(`/posts/${suggestion.id}`);
        break;
      case "discussion":
        router.push(`/discussions/${suggestion.id}`);
        break;
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle focus and blur
  const handleFocus = () => {
    setIsFocused(true);
    if (query.length >= 1) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const getIcon = (type: string) => {
    switch (type) {
      case "user":
        return <FiUsers className="h-4 w-4 text-blue-500" />;
      case "project":
        return <FiFolder className="h-4 w-4 text-green-500" />;
      case "post":
        return <FiFileText className="h-4 w-4 text-purple-500" />;
      case "discussion":
        return <FiMessageSquare className="h-4 w-4 text-orange-500" />;
      default:
        return <FiSearch className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "user":
        return "Developer";
      case "project":
        return "Project";
      case "post":
        return "Post";
      case "discussion":
        return "Discussion";
      default:
        return "Result";
    }
  };

  return (
    <div ref={searchRef} className="flex-1 max-w-2xl mx-4 lg:mx-8 relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <FiSearch
            className={`h-5 w-5 ${
              isFocused ? "text-primary-500" : "text-gray-400"
            }`}
          />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Search developers, projects, posts..."
          className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all duration-200 ${
            isFocused
              ? "border-primary-500 bg-white shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        />
        
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <FiX className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </form>

      {/* Search Suggestions */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {isSuggestionsLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center space-x-3 ${
                    index === selectedIndex ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex-shrink-0">
                    {suggestion.type === "user" && suggestion.avatar ? (
                      <img
                        src={getAvatarUrl({ avatar: suggestion.avatar })}
                        alt={suggestion.title}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getIcon(suggestion.type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {getTypeLabel(suggestion.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {suggestion.subtitle}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <FiSearch className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <FiSearch className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
