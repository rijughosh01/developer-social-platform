'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { markNotificationAsRead, deleteNotification } from '@/store/slices/notificationSlice'
import { Notification } from '@/types'
import { 
  Bell, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  MessageCircle, 
  Users, 
  AtSign, 
  FolderOpen, 
  Handshake,
  Settings,
  X,
  Check
} from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onClose?: () => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return <MessageSquare className="w-5 h-5 text-blue-500" />
    case 'like_post':
    case 'like_project':
      return <Heart className="w-5 h-5 text-red-500" />
    case 'comment_post':
    case 'comment_project':
      return <MessageCircle className="w-5 h-5 text-green-500" />
    case 'follow':
      return <UserPlus className="w-5 h-5 text-purple-500" />
    case 'unfollow':
      return <UserPlus className="w-5 h-5 text-gray-500" />
    case 'mention':
      return <AtSign className="w-5 h-5 text-orange-500" />
    case 'project_invite':
      return <FolderOpen className="w-5 h-5 text-indigo-500" />
    case 'collaboration_request':
      return <Handshake className="w-5 h-5 text-teal-500" />
    case 'system':
      return <Settings className="w-5 h-5 text-gray-500" />
    default:
      return <Bell className="w-5 h-5 text-gray-500" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'message':
      return 'bg-blue-50 border-blue-200'
    case 'like_post':
    case 'like_project':
      return 'bg-red-50 border-red-200'
    case 'comment_post':
    case 'comment_project':
      return 'bg-green-50 border-green-200'
    case 'follow':
      return 'bg-purple-50 border-purple-200'
    case 'unfollow':
      return 'bg-gray-50 border-gray-200'
    case 'mention':
      return 'bg-orange-50 border-orange-200'
    case 'project_invite':
      return 'bg-indigo-50 border-indigo-200'
    case 'collaboration_request':
      return 'bg-teal-50 border-teal-200'
    case 'system':
      return 'bg-gray-50 border-gray-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onClose 
}) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const handleClick = async () => {
    if (!notification.isRead) {
      await dispatch(markNotificationAsRead(notification._id))
    }

    // Navigate to the relevant page
    if (notification.data?.url) {
      router.push(notification.data.url)
    }

    onClose?.()
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await dispatch(deleteNotification(notification._id))
  }

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.isRead) {
      await dispatch(markNotificationAsRead(notification._id))
    }
  }

  return (
    <div
      className={`
        relative p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
        ${getNotificationColor(notification.type)}
        ${notification.isRead ? 'opacity-75' : 'opacity-100'}
      `}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Delete notification"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {notification.sender.avatar ? (
            <img
              src={notification.sender.avatar}
              alt={notification.sender.fullName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
              {notification.sender.firstName?.[0]}{notification.sender.lastName?.[0]}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {getNotificationIcon(notification.type)}
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
              {notification.title}
            </h4>
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {notification.timeAgo}
            </span>
            
            {!notification.isRead && (
              <button
                onClick={handleMarkAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1 transition-colors"
                title="Mark as read"
              >
                <Check className="w-3 h-3" />
                <span>Mark read</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 