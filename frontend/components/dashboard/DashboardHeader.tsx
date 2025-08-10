"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  FiSearch,
  FiBell,
  FiMessageSquare,
  FiUser,
  FiSettings,
  FiLogOut,
  FiHome,
  FiUsers,
  FiFolder,
  FiBookmark,
  FiTrendingUp,
  FiCode,
  FiGitBranch,
  FiZap,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";
import { SiXdadevelopers } from "react-icons/si";
import { getAvatarUrl } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: FiHome },
  { name: "Developers", href: "/developers", icon: FiUsers },
  { name: "Projects", href: "/projects", icon: FiFolder },
  { name: "Discussions", href: "/discussions", icon: SiXdadevelopers },
  { name: "Messages", href: "/messages", icon: FiMessageSquare },
  { name: "Saved", href: "/saved", icon: FiBookmark },
  { name: "Trending", href: "/trending", icon: FiTrendingUp },
  { name: "Code Feed", href: "/code-feed", icon: FiCode },
  { name: "Collaboration", href: "/collaboration", icon: FiGitBranch },
  { name: "AI Assistant", href: "/ai", icon: FiZap },
  { name: "Conversations", href: "/conversations", icon: FiMessageCircle },
  { name: "Settings", href: "/settings", icon: FiSettings },
];

export function DashboardHeader() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Mobile Menu Button - Left side */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-md bg-white shadow-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 border border-gray-200 mr-3"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="hidden md:flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">
                  DevLink
                </span>
              </Link>
            </div>

            <div className="flex-1 max-w-xs sm:max-w-md lg:max-w-lg mx-2 sm:mx-4 lg:mx-8">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search developers, projects, posts..."
                  className="block w-full pl-8 sm:pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>

            
            <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
              {/* Notifications */}
              <NotificationDropdown />

              {/* Messages */}
              <Link
                href="/messages"
                className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiMessageSquare className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user)}
                        alt="User Avatar"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs sm:text-sm font-medium">
                        {user?.firstName?.charAt(0)}
                        {user?.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      href={user ? `/profile/${user.username}` : "/profile"}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiUser className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <FiSettings className="mr-3 h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <FiLogOut className="mr-3 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={closeMobileMenu}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 flex w-64 max-w-xs flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <Link
                href="/"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={closeMobileMenu}
              >
                <span className="text-xl font-bold text-primary-600 tracking-tight">
                  DevLink
                </span>
              </Link>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-3 text-base font-medium rounded-md ${
                      isActive
                        ? "bg-primary-100 text-primary-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 ${
                        isActive
                          ? "text-primary-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
