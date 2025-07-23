"use client";

import { useState } from "react";
import Link from "next/link";
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
  FiMenu,
  FiX,
} from "react-icons/fi";
import { getAvatarUrl } from "@/lib/utils";

export function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                DevLink
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search developers, projects, posts..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <NotificationDropdown />

            {/* Messages */}
            <Link
              href="/messages"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <FiMessageSquare className="h-6 w-6" />
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user)}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">
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

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isMenuOpen ? (
                <FiX className="h-6 w-6" />
              ) : (
                <FiMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              <div className="flex items-center px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user)}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">
                      {user?.firstName?.charAt(0)}
                      {user?.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <Link
                href={user ? `/profile/${user.username}` : "/profile"}
                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiUser className="mr-3 h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiSettings className="mr-3 h-4 w-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                <FiLogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
