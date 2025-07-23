import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketProps {
  token: string;
  onMessage?: (data: any) => void;
  onTyping?: (data: any) => void;
  onStopTyping?: (data: any) => void;
  onRead?: (data: any) => void;
  onUserStatusChange?: (data: any) => void;
  onNewNotification?: (data: any) => void;
  onUnreadCountUpdate?: (data: any) => void;
}

export const useSocket = ({
  token,
  onMessage,
  onTyping,
  onStopTyping,
  onRead,
  onUserStatusChange,
  onNewNotification,
  onUnreadCountUpdate,
}: UseSocketProps) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;
    // Connect to backend Socket.IO server
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";
    console.log(
      "Connecting to socket server:",
      socketUrl,
      "with token:",
      token
    );
    const socket = io(socketUrl, {
      auth: { token },
    });
    socketRef.current = socket;

    // Listen for events
    socket.on("new-message", onMessage || (() => {}));
    socket.on("user-typing", onTyping || (() => {}));
    socket.on("user-stop-typing", onStopTyping || (() => {}));
    socket.on("messages-read", onRead || (() => {}));
    socket.on("user-status-change", onUserStatusChange || (() => {}));
    socket.on("new-notification", onNewNotification || (() => {}));
    socket.on("unread-count-update", onUnreadCountUpdate || (() => {}));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // Helper functions
  const joinChat = (chatId: string) => {
    socketRef.current?.emit("join-chat", chatId);
  };
  const leaveChat = (chatId: string) => {
    socketRef.current?.emit("leave-chat", chatId);
  };
  const sendMessage = (data: {
    chatId: string;
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    socketRef.current?.emit("send-message", data);
  };
  const startTyping = (chatId: string) => {
    socketRef.current?.emit("typing-start", chatId);
  };
  const stopTyping = (chatId: string) => {
    socketRef.current?.emit("typing-stop", chatId);
  };
  const markRead = (chatId: string) => {
    socketRef.current?.emit("mark-read", chatId);
  };

  const markNotificationRead = (notificationId: string) => {
    socketRef.current?.emit("mark-notification-read", notificationId);
  };

  const markAllNotificationsRead = () => {
    socketRef.current?.emit("mark-all-notifications-read");
  };

  return {
    socket: socketRef.current,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markRead,
    markNotificationRead,
    markAllNotificationsRead,
  };
};
