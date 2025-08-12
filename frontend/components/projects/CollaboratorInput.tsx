"use client";

import React, { useState, useEffect, useRef } from "react";
import { FiUsers, FiSearch, FiX, FiUser, FiMail } from "react-icons/fi";
import { usersAPI } from "@/lib/api";

import toast from "react-hot-toast";

interface Collaborator {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: "developer" | "designer" | "tester" | "manager";
}

interface CollaboratorInputProps {
  collaborators: Collaborator[];
  onChange: (collaborators: Collaborator[]) => void;
  disabled?: boolean;
  className?: string;
}

interface UserSuggestion {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  displayText: string;
}

export default function CollaboratorInput({
  collaborators,
  onChange,
  disabled = false,
  className = "",
}: CollaboratorInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        searchUsers(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);
      const excludeIds = collaborators.map(c => c._id);
      const response = await usersAPI.searchCollaborators(query, excludeIds);
      setSuggestions(response.data.data);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const addCollaborator = (user: UserSuggestion, role: Collaborator["role"] = "developer") => {
    const newCollaborator: Collaborator = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      role,
    };

    const updatedCollaborators = [...collaborators, newCollaborator];
    onChange(updatedCollaborators);
    setInputValue("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeCollaborator = (collaboratorId: string) => {
    const updatedCollaborators = collaborators.filter(c => c._id !== collaboratorId);
    onChange(updatedCollaborators);
  };

  const updateCollaboratorRole = (collaboratorId: string, role: Collaborator["role"]) => {
    const updatedCollaborators = collaborators.map(c =>
      c._id === collaboratorId ? { ...c, role } : c
    );
    onChange(updatedCollaborators);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addCollaborator(suggestions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "developer": return "bg-blue-100 text-blue-800";
      case "designer": return "bg-purple-100 text-purple-800";
      case "tester": return "bg-green-100 text-green-800";
      case "manager": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "developer": return "💻";
      case "designer": return "🎨";
      case "tester": return "🔍";
      case "manager": return "👑";
      default: return "👤";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <FiUsers className="inline w-4 h-4 mr-1" />
        Collaborators
      </label>
      
      {/* Selected Collaborators */}
      {collaborators.length > 0 && (
        <div className="mb-3 space-y-2">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={collaborator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(collaborator.fullName)}&background=3b82f6&color=fff&size=128`}
                  alt={collaborator.fullName}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-medium text-sm">{collaborator.fullName}</div>
                  <div 
                    className="text-xs text-gray-500 hover:text-primary-600 hover:underline cursor-pointer transition-colors"
                    onClick={() => {
                      // Navigate to collaborator's profile
                      window.location.href = `/profile/${collaborator.username}`;
                    }}
                    title={`View ${collaborator.username}'s profile`}
                  >
                    @{collaborator.username}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={collaborator.role}
                  onChange={(e) => updateCollaboratorRole(collaborator._id, e.target.value as Collaborator["role"])}
                  className={`text-xs px-2 py-1 rounded border ${getRoleColor(collaborator.role)}`}
                  disabled={disabled}
                >
                  <option value="developer">Developer</option>
                  <option value="designer">Designer</option>
                  <option value="tester">Tester</option>
                  <option value="manager">Manager</option>
                </select>
                
                {!disabled && (
                  <button
                    onClick={() => removeCollaborator(collaborator._id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove collaborator"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="Search users by username, email, or name..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            disabled={disabled}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion._id}
                className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? "bg-primary-50 border-l-4 border-primary-500" : ""
                }`}
                onClick={() => addCollaborator(suggestion)}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={suggestion.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.fullName)}&background=3b82f6&color=fff&size=128`}
                    alt={suggestion.fullName}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{suggestion.fullName}</div>
                    <div className="text-xs text-gray-500">
                      @{suggestion.username} • {suggestion.email}
                    </div>
                    {suggestion.bio && (
                      <div className="text-xs text-gray-600 mt-1 truncate">
                        {suggestion.bio}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Click to add
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && suggestions.length === 0 && inputValue.trim().length >= 2 && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
            No users found. Try a different search term.
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-2">
        Search and add collaborators by username, email, or full name. You can assign different roles to each collaborator.
      </p>
    </div>
  );
}
