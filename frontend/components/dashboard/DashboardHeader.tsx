"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { logout } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { SearchBar } from "@/components/search/SearchBar";
import {
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
  FiMenu,
  FiLink,
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
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isUserMenuOpen && !target.closest(".user-menu-container")) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setIsUserMenuOpen(false);
    router.push("/auth/login");
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleProfileClick = () => {
    setIsUserMenuOpen(false);
    if (user?.username) {
      router.push(`/profile/${user.username}`);
    } else {
      router.push("/profile");
    }
  };

  const handleSettingsClick = () => {
    setIsUserMenuOpen(false);
    router.push("/settings");
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Section */}
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <FiMenu className="h-5 w-5" />
              </button>
            </div>

            
            <SearchBar />

            {/* Right Section - Actions & User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:block">
                <NotificationDropdown />
              </div>

              <Link
                href="/notifications"
                className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 relative"
              >
                <FiBell className="h-5 w-5" />
                {/* Unread count badge for mobile */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  1
                </span>
              </Link>

              {/* Messages */}
              <Link
                href="/messages"
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <FiMessageSquare className="h-5 w-5" />
              </Link>

              {/* User Menu */}
              <div className="relative user-menu-container">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                    {user?.avatar ? (
                      <img
                        src={getAvatarUrl(user)}
                        alt="User Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-semibold">
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">@{user?.username}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <FiUser className="mr-3 h-4 w-4" />
                        Profile
                      </button>
                      <button
                        onClick={handleSettingsClick}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <FiSettings className="mr-3 h-4 w-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                      >
                        <FiLogOut className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
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
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={closeMobileMenu}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 flex w-80 max-w-xs flex-col bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute top-6 right-3 w-0.5 h-0.5 bg-white rounded-full"></div>
                <div className="absolute bottom-4 left-4 w-0.75 h-0.75 bg-white rounded-full"></div>
                <div className="absolute bottom-8 right-2 w-0.5 h-0.5 bg-white rounded-full"></div>
              </div>

              <Logo variant="compact" className="relative z-10" onClick={closeMobileMenu} />
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 relative z-10"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary-100 text-primary-900 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={closeMobileMenu}
                  >
                    <item.icon
                      className={`mr-4 h-5 w-5 transition-colors duration-200 ${
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

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user)}
                      alt="User Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{user?.username}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
