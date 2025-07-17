'use client'

import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/hooks/useAppDispatch'
import { 
  fetchNotifications, 
  markAllNotificationsAsRead,
  deleteMultipleNotifications,
  getUnreadCount 
} from '@/store/slices/notificationSlice'
import { NotificationItem } from '@/components/notifications/NotificationItem'
import { useSocket } from '@/hooks/useSocket'
import { 
  Bell, 
  Check, 
  Trash2, 
  Loader2, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function NotificationsPage() {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  
  const dispatch = useAppDispatch()
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    error,
    pagination 
  } = useAppSelector((state) => state.notifications)
  const { token } = useAppSelector((state) => state.auth)

  // Socket connection for real-time notifications
  const { markAllNotificationsRead } = useSocket({
    token: token || '',
    onNewNotification: (data) => {
      // Handle new notification from socket
      console.log('New notification received:', data)
    },
    onUnreadCountUpdate: (data) => {
      // Handle unread count update from socket
      console.log('Unread count updated:', data)
    }
  })

  useEffect(() => {
    dispatch(fetchNotifications({ page: currentPage, limit: 20 }))
    dispatch(getUnreadCount())
  }, [dispatch, currentPage])

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllNotificationsAsRead())
      markAllNotificationsRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return
    
    try {
      await dispatch(deleteMultipleNotifications(selectedNotifications))
      setSelectedNotifications([])
    } catch (error) {
      console.error('Error deleting notifications:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(notifications.map(n => n._id))
    }
  }

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications

  const unreadNotifications = notifications.filter(n => !n.isRead)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount} unread • {notifications.length} total
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All notifications</option>
                <option value="unread">Unread only</option>
              </select>

              {/* Mark all as read */}
              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark all read</span>
                </button>
              )}

              {/* Delete selected */}
              {selectedNotifications.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete selected ({selectedNotifications.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* List Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  {filteredNotifications.length} notifications
                </span>
              </div>
              
              {isLoading && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                <span className="ml-3 text-gray-500">Loading notifications...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-sm text-gray-400">
                  {filter === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "No notifications yet. We'll notify you when something happens."
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div key={notification._id} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification._id)}
                    onChange={() => handleSelectNotification(notification._id)}
                    className="absolute top-4 left-4 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 z-10"
                  />
                  <div className="pl-12">
                    <NotificationItem notification={notification} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages} • {pagination.total} total
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm text-gray-600">
                    {currentPage} / {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                    disabled={currentPage === pagination.pages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 