'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch'
import { 
  fetchNotifications, 
  markAllNotificationsAsRead,
  deleteMultipleNotifications,
  getUnreadCount,
  addNotification,
  updateUnreadCount
} from '@/store/slices/notificationSlice'
import { NotificationItem } from './NotificationItem'
import { useSocket } from '@/hooks/useSocket'
import { Bell, Check, Trash2, Loader2 } from 'lucide-react'

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const dispatch = useAppDispatch()
  const { notifications, unreadCount, isLoading: notificationsLoading } = useAppSelector(
    (state) => state.notifications
  )
  const { token } = useAppSelector((state) => state.auth)

  // Socket connection for real-time notifications
  const { markAllNotificationsRead } = useSocket({
    token: token || '',
    onNewNotification: (data) => {
      // Handle new notification from socket
      console.log('New notification received:', data)
      dispatch(addNotification(data.notification))
      dispatch(updateUnreadCount(data.unreadCount))
    },
    onUnreadCountUpdate: (data) => {
      // Handle unread count update from socket
      console.log('Unread count updated:', data)
      dispatch(updateUnreadCount(data.unreadCount))
    }
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      dispatch(fetchNotifications({ page: 1, limit: 20 }))
    }
  }, [isOpen, dispatch, notifications.length])

  // Fetch unread count on mount
  useEffect(() => {
    dispatch(getUnreadCount())
  }, [dispatch])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleMarkAllAsRead = async () => {
    setIsLoading(true)
    try {
      await dispatch(markAllNotificationsAsRead())
      markAllNotificationsRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (notifications.length === 0) return
    
    setIsLoading(true)
    try {
      const notificationIds = notifications.map(n => n._id)
      await dispatch(deleteMultipleNotifications(notificationIds))
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              
              <div className="flex items-center space-x-2">
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isLoading}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                    title="Mark all as read"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    disabled={isLoading}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Clear all notifications"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notificationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs text-gray-400">We'll notify you when something happens</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  // Navigate to full notifications page
                  window.location.href = '/notifications'
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 