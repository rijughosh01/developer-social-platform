"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { api } from "@/lib/api";
import {
  FiMessageSquare,
  FiGitBranch,
  FiStar,
  FiCheck,
  FiX,
  FiUsers,
  FiTrendingUp,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface CollaborationNotification {
  _id: string;
  type:
    | "review_request"
    | "review_response"
    | "fork_created"
    | "fork_received"
    | "collaboration_invite";
  title: string;
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
}

export function CollaborationNotifications() {
  const { user } = useAppSelector((state) => state.auth);
  const [notifications, setNotifications] = useState<
    CollaborationNotification[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/collaboration");
      setNotifications(response.data.data);
      setUnreadCount(response.data.data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch collaboration notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClasses = "h-6 w-6";
    switch (type) {
      case "review_request":
        return <FiMessageSquare className={`${iconClasses} text-blue-600`} />;
      case "review_response":
        return <FiCheck className={`${iconClasses} text-green-600`} />;
      case "fork_created":
        return <FiGitBranch className={`${iconClasses} text-purple-600`} />;
      case "fork_received":
        return <FiUsers className={`${iconClasses} text-orange-600`} />;
      case "collaboration_invite":
        return <FiTrendingUp className={`${iconClasses} text-indigo-600`} />;
      default:
        return <FiMessageSquare className={`${iconClasses} text-gray-600`} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "review_request":
        return "border-l-blue-500 bg-blue-50";
      case "review_response":
        return "border-l-green-500 bg-green-50";
      case "fork_created":
        return "border-l-purple-500 bg-purple-50";
      case "fork_received":
        return "border-l-orange-500 bg-orange-50";
      case "collaboration_invite":
        return "border-l-indigo-500 bg-indigo-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/collaboration/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/collaboration/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleNotificationClick = (notification: CollaborationNotification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "review_request":
        window.location.href = `/collaboration?tab=reviews`;
        break;
      case "fork_created":
      case "fork_received":
        window.location.href = `/collaboration?tab=forks`;
        break;
      case "collaboration_invite":
        window.location.href = `/collaboration`;
        break;
      default:
        window.location.href = `/collaboration`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Collaboration Notifications
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <FiMessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No notifications
            </h4>
            <p className="text-gray-500">
              You're all caught up! No collaboration notifications yet.
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md ${
                notification.isRead ? "opacity-75" : ""
              } ${getNotificationColor(notification.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {notification.message}
                  </p>
                  {notification.sender && (
                    <p className="mt-1 text-xs text-gray-500">
                      From: {notification.sender.firstName}{" "}
                      {notification.sender.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {notifications.length > 0 && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => (window.location.href = "/collaboration")}
            className="flex-1 px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            View All Collaboration
          </button>
          <button
            onClick={() =>
              (window.location.href = "/collaboration?tab=reviews")
            }
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Reviews
          </button>
          <button
            onClick={() => (window.location.href = "/collaboration?tab=forks")}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Forks
          </button>
        </div>
      )}
    </div>
  );
}
