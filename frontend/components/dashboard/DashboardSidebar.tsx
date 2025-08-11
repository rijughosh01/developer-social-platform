"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiMessageSquare,
  FiBookmark,
  FiTrendingUp,
  FiSettings,
  FiCode,
  FiGitBranch,
  FiZap,
  FiMessageCircle,
  FiStar,
  FiActivity,
  FiLink,
} from "react-icons/fi";
import { SiXdadevelopers } from "react-icons/si";
import { Logo } from "@/components/ui/Logo";

const navigation = [
  { 
    name: "Dashboard", 
    href: "/dashboard", 
    icon: FiHome,
    description: "Overview and recent activity"
  },
  { 
    name: "Developers", 
    href: "/developers", 
    icon: FiUsers,
    description: "Connect with other developers"
  },
  { 
    name: "Projects", 
    href: "/projects", 
    icon: FiFolder,
    description: "Browse and create projects"
  },
  { 
    name: "Discussions", 
    href: "/discussions", 
    icon: SiXdadevelopers,
    description: "Join technical discussions"
  },
  { 
    name: "Messages", 
    href: "/messages", 
    icon: FiMessageSquare,
    description: "Chat with other developers"
  },
  { 
    name: "Saved", 
    href: "/saved", 
    icon: FiBookmark,
    description: "Your saved content"
  },
  { 
    name: "Trending", 
    href: "/trending", 
    icon: FiTrendingUp,
    description: "What's popular now"
  },
  { 
    name: "Code Feed", 
    href: "/code-feed", 
    icon: FiCode,
    description: "Latest code snippets"
  },
  { 
    name: "Collaboration", 
    href: "/collaboration", 
    icon: FiGitBranch,
    description: "Team up on projects"
  },
  { 
    name: "AI Assistant", 
    href: "/ai", 
    icon: FiZap,
    description: "Get AI-powered help"
  },
  { 
    name: "Conversations", 
    href: "/conversations", 
    icon: FiMessageCircle,
    description: "AI chat history"
  },
  { 
    name: "Settings", 
    href: "/settings", 
    icon: FiSettings,
    description: "Account preferences"
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:pt-0 lg:pb-0 lg:overflow-y-auto lg:border-r lg:border-gray-200 lg:bg-white">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-12 right-6 w-1 h-1 bg-white rounded-full"></div>
            <div className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-white rounded-full"></div>
            <div className="absolute bottom-16 right-4 w-1 h-1 bg-white rounded-full"></div>
          </div>
          
          <Logo variant="sidebar" className="relative z-10" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.slice(0, 6).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? "bg-primary-100 text-primary-900 shadow-sm border border-primary-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                  }`}
                  title={item.description}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full"></div>
                  )}
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-all duration-200 ${
                      isActive
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* Secondary Navigation */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Tools & Features
            </div>
            {navigation.slice(6, 9).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? "bg-primary-100 text-primary-900 shadow-sm border border-primary-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                  }`}
                  title={item.description}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full"></div>
                  )}
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-all duration-200 ${
                      isActive
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* AI & Settings */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              AI & Account
            </div>
            {navigation.slice(9).map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative ${
                    isActive
                      ? "bg-primary-100 text-primary-900 shadow-sm border border-primary-200"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
                  }`}
                  title={item.description}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full"></div>
                  )}
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-all duration-200 ${
                      isActive
                        ? "text-primary-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900">Pro Tips</p>
                <p className="text-xs text-gray-500">Use DevLink AI for faster coding</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
