import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { NotificationState, Notification, ApiResponse } from '@/types'
import { api } from '@/lib/api'

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
}

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<{
      notifications: Notification[]
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
      unreadCount: number
    }>>(`/notifications?page=${page}&limit=${limit}`)
    return response.data
  }
)

export const getUnreadCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async () => {
    const response = await api.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count')
    return response.data
  }
)

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string) => {
    const response = await api.put<ApiResponse<Notification>>(`/notifications/${notificationId}/read`)
    return response.data
  }
)

export const markMultipleNotificationsAsRead = createAsyncThunk(
  'notifications/markMultipleAsRead',
  async (notificationIds: string[]) => {
    const response = await api.put<ApiResponse<{ updatedCount: number }>>('/notifications/mark-read', {
      notificationIds
    })
    return response.data
  }
)

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async () => {
    const response = await api.put<ApiResponse<{ updatedCount: number }>>('/notifications/mark-all-read')
    return response.data
  }
)

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId: string) => {
    await api.delete(`/notifications/${notificationId}`)
    return notificationId
  }
)

export const deleteMultipleNotifications = createAsyncThunk(
  'notifications/deleteMultipleNotifications',
  async (notificationIds: string[]) => {
    const response = await api.delete<ApiResponse<{ deletedCount: number }>>('/notifications', {
      data: { notificationIds }
    })
    return response.data
  }
)

export const getNotificationSettings = createAsyncThunk(
  'notifications/getSettings',
  async () => {
    const response = await api.get<ApiResponse<{
      email: boolean
      push: boolean
      marketing: boolean
    }>>('/notifications/settings')
    return response.data
  }
)

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings: { email?: boolean; push?: boolean; marketing?: boolean }) => {
    const response = await api.put<ApiResponse<{
      email: boolean
      push: boolean
      marketing: boolean
    }>>('/notifications/settings', settings)
    return response.data
  }
)

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      state.unreadCount += 1
    },
    updateUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n._id === action.payload)
      if (notification && !notification.isRead) {
        notification.isRead = true
        notification.readAt = new Date().toISOString()
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.isRead) {
          notification.isRead = true
          notification.readAt = new Date().toISOString()
        }
      })
      state.unreadCount = 0
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n._id === action.payload)
      if (index !== -1) {
        const notification = state.notifications[index]
        if (!notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
        state.notifications.splice(index, 1)
      }
    },
    clearNotifications: (state) => {
      state.notifications = []
      state.unreadCount = 0
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false
        state.notifications = action.payload.data.notifications
        state.unreadCount = action.payload.data.unreadCount
        state.pagination = action.payload.data.pagination
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to fetch notifications'
      })

    // Get unread count
    builder
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.data.unreadCount
      })

    // Mark notification as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n._id === action.payload.data._id)
        if (notification && !notification.isRead) {
          notification.isRead = true
          notification.readAt = action.payload.data.readAt
          state.unreadCount = Math.max(0, state.unreadCount - 1)
        }
      })

    // Mark multiple notifications as read
    builder
      .addCase(markMultipleNotificationsAsRead.fulfilled, (state, action) => {
        const updatedCount = action.payload.data.updatedCount
        state.unreadCount = Math.max(0, state.unreadCount - updatedCount)
        // Update the notifications in state
        state.notifications.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true
            notification.readAt = new Date().toISOString()
          }
        })
      })

    // Mark all notifications as read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          if (!notification.isRead) {
            notification.isRead = true
            notification.readAt = new Date().toISOString()
          }
        })
        state.unreadCount = 0
      })

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n._id === action.payload)
        if (index !== -1) {
          const notification = state.notifications[index]
          if (!notification.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1)
          }
          state.notifications.splice(index, 1)
        }
      })

    // Delete multiple notifications
    builder
      .addCase(deleteMultipleNotifications.fulfilled, (state, action) => {
        const deletedCount = action.payload.data.deletedCount
        let unreadDeleted = 0
        
        // Count how many unread notifications were deleted
        state.notifications.forEach(notification => {
          if (!notification.isRead) {
            unreadDeleted++
          }
        })
        
        state.notifications = []
        state.unreadCount = Math.max(0, state.unreadCount - unreadDeleted)
      })
  }
})

export const {
  addNotification,
  updateUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  clearError
} = notificationSlice.actions

export default notificationSlice.reducer 