"use client";
import { useEffect, useState, useRef } from "react";
import { chatAPI, usersAPI } from "@/lib/api";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useSwipeable } from "react-swipeable";
import { 
  FaUsers, 
  FaSearch, 
  FaSmile
} from "react-icons/fa";
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading emoji picker...</div>
});
import { 
  FiEdit, 
  FiCheck, 
  FiX, 
  FiTrash2, 
  FiSend
} from "react-icons/fi";
import Image from "next/image";
import toast from "react-hot-toast";

export default function MessagesPage() {
  const { user, token } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupUsers, setGroupUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string>("");
  const [editInput, setEditInput] = useState("");
  const [deletingMessageId, setDeletingMessageId] = useState<string>("");
  const [hoveredMessageId, setHoveredMessageId] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);
  const [showListMobile, setShowListMobile] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const selectedChatRef = useRef(selectedChat);
  const messagesRef = useRef(messages);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    const update = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (isMobile && selectedChat) setShowListMobile(false);
  }, [isMobile, selectedChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Socket hook
  const { joinChat, leaveChat, sendMessage, startTyping, stopTyping, socket } =
    useSocket({
      token: token || "",
      onMessage: (data) => {
        if (data.chatId === selectedChatRef.current?._id) {
          setMessages((prev) => {
            if (
              data.message &&
              data.message.sender &&
              data.message.sender._id &&
              user &&
              user._id &&
              data.message.sender._id === user._id
            ) {
              const now = Date.now();
              const filtered = messagesRef.current.filter(
                (msg) =>
                  !(
                    msg.sender &&
                    msg.sender._id === user._id &&
                    msg.content === data.message.content &&
                    Math.abs(new Date(msg.createdAt).getTime() - now) < 60000 &&
                    pendingMessageIds.includes(msg._id)
                  )
              );
              return [...filtered, data.message];
            } else if (data.message) {
              return [...messagesRef.current, data.message];
            } else {
              return messagesRef.current;
            }
          });
          setTimeout(
            () =>
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
            100
          );
        }
      },
      onTyping: (data) => {
        if (
          selectedChatRef.current &&
          selectedChatRef.current._id &&
          data.chatId === selectedChatRef.current._id
        ) {
          setOtherTyping(true);
        }
      },
      onStopTyping: (data) => {
        if (
          selectedChatRef.current &&
          selectedChatRef.current._id &&
          data.chatId === selectedChatRef.current._id
        ) {
          setOtherTyping(false);
        }
      },
    });

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      if (selectedChat) {
        joinChat(selectedChat._id);
      }
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, [socket, selectedChat, joinChat]);

  useEffect(() => {
    if (selectedChat) {
      joinChat(selectedChat._id);
      setOtherTyping(false);
      return () => {
        leaveChat(selectedChat._id);
      };
    }
  }, [selectedChat]);

  // Listen for 'message-sent' event for sender
  useEffect(() => {
    if (!socket) return;
    const handler = (data: any) => {
      if (data.chatId === selectedChatRef.current?._id) {
        setMessages((prev) => {
          const now = Date.now();
          const filtered = messagesRef.current.filter(
            (msg) =>
              !(
                msg.sender &&
                msg.sender._id === user?._id &&
                msg.content === data.message.content &&
                Math.abs(new Date(msg.createdAt).getTime() - now) < 60000 &&
                pendingMessageIds.includes(msg._id)
              )
          );
          return [...filtered, data.message];
        });
        setPendingMessageIds((ids) =>
          ids.filter((id) => id !== data.message._id)
        );
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      }
    };
    socket.on("message-sent", handler);
    return () => {
      socket.off("message-sent", handler);
    };
  }, [socket, user, pendingMessageIds]);

  // Listen for message-edited event
  useEffect(() => {
    if (!socket) return;
    const handleEdited = (data: any) => {
      if (data.chatId === selectedChatRef.current?._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.message._id
              ? { ...msg, content: data.message.content }
              : msg
          )
        );
      }
    };
    socket.on("message-edited", handleEdited);
    return () => {
      socket.off("message-edited", handleEdited);
    };
  }, [socket, selectedChat, joinChat]);

  // Listen for message-deleted event
  useEffect(() => {
    if (!socket) return;
    const handleDeleted = (data: any) => {
      if (data.chatId === selectedChatRef.current?._id) {
        setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
      }
    };
    socket.on("message-deleted", handleDeleted);
    return () => {
      socket.off("message-deleted", handleDeleted);
    };
  }, [socket]);

  // Typing indicator logic
  useEffect(() => {
    if (!selectedChat) return;
    if (isTyping) {
      startTyping(selectedChat._id);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(selectedChat._id);
      }, 1500);
    }
  }, [isTyping, selectedChat]);

  useEffect(() => {
    if (!user) return;
    setLoadingChats(true);
    chatAPI.getChats().then((res) => {
      const chatList = res.data.data || [];
      setChats(chatList);
      setLoadingChats(false);
      const chatId = searchParams.get("chatId");
      if (chatId) {
        const found = chatList.find((c: any) => c._id === chatId);
        if (found) setSelectedChat(found);
      }
    });
  }, [user]);

  useEffect(() => {
    const userId = searchParams.get("userId");
    if (user && userId && userId !== user._id) {
      const existingChat = chats.find(
        (chat) =>
          !chat.isGroupChat &&
          chat.participants.some((p: any) => p._id === userId)
      );
      if (existingChat) {
        setSelectedChat(existingChat);
      } else {
        chatAPI.startChat({ userId }).then((res) => {
          const newChat = res.data.data;
          setChats((prev) => [newChat, ...prev]);
          setSelectedChat(newChat);
        });
      }
      router.replace("/messages");
    }
  }, [user, chats, searchParams]);

  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    chatAPI.getChat(selectedChat._id).then((res) => {
      setMessages(res.data.data.messages || []);
      setLoadingMessages(false);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    });
  }, [selectedChat]);

  // Fetch all users for group selection
  useEffect(() => {
    if (showGroupModal || showManageModal) {
      usersAPI.getUsers().then((res) => {
        setAllUsers(res.data.data.filter((u: any) => u._id !== user?._id));
      });
    }
  }, [showGroupModal, showManageModal, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    setIsTyping(true);
  };

  const onEmojiClick = (emojiObject: any) => {
    console.log('Emoji clicked:', emojiObject);
    setMessageInput((prevInput) => prevInput + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const emojiButton = target.closest('button[type="button"]');
      const emojiPicker = target.closest('.emoji-picker-container');
      
      if (!emojiButton && !emojiPicker) {
        console.log('Clicking outside, closing emoji picker');
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;
    setSending(true);
    try {
      const tempId = Date.now().toString();
      sendMessage({ chatId: selectedChat._id, content: messageInput });
      setMessages((prev) => [
        ...prev,
        {
          _id: tempId,
          sender: { _id: user?._id },
          content: messageInput,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPendingMessageIds((ids) => [...ids, tempId]);
      setMessageInput("");
      setIsTyping(false);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupUsers.length === 0) return;
    setCreatingGroup(true);
    try {
      const res = await chatAPI.createGroupChat({
        name: groupName,
        participants: groupUsers,
      });
      setChats((prev) => [res.data.data, ...prev]);
      setShowGroupModal(false);
      setGroupName("");
      setGroupUsers([]);
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleAddParticipant = async (userId: string) => {
    if (!selectedChat) return;
    setManageLoading(true);
    try {
      const res = await chatAPI.addParticipant(selectedChat._id, { userId });
      setSelectedChat(res.data.data);
      setChats((prev) =>
        prev.map((c) => (c._id === res.data.data._id ? res.data.data : c))
      );
    } finally {
      setManageLoading(false);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedChat) return;
    setManageLoading(true);
    try {
      const res = await chatAPI.removeParticipant(selectedChat._id, userId);
      setSelectedChat(res.data.data);
      setChats((prev) =>
        prev.map((c) => (c._id === res.data.data._id ? res.data.data : c))
      );
    } finally {
      setManageLoading(false);
    }
  };

  // Edit message handlers
  const startEditMessage = (msg: any) => {
    setEditingMessageId(msg._id);
    setEditInput(msg.content);
  };
  
  const cancelEditMessage = () => {
    setEditingMessageId("");
    setEditInput("");
  };
  
  const saveEditMessage = () => {
    if (!selectedChat || !editingMessageId) return;
    socket?.emit("edit-message", {
      chatId: selectedChat._id,
      messageId: editingMessageId,
      newContent: editInput,
    });
    setEditingMessageId("");
    setEditInput("");
    toast.success("Message edited");
  };

  const handleDeleteMessage = async (msg: any) => {
    if (!selectedChat) return;
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    setDeletingMessageId(msg._id);
    try {
      if (socket && socket.connected) {
        socket.emit("delete-message", {
          chatId: selectedChat._id,
          messageId: msg._id,
        });
      } else {
        await chatAPI.deleteMessage(selectedChat._id, msg._id);
        setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      }
      toast.success("Message deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete message");
    } finally {
      setDeletingMessageId("");
    }
  };

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedRight: (eventData) => {
      if (isMobile && !showListMobile && eventData.deltaX > 50) {
        setShowListMobile(true);
      }
    },
    trackMouse: false,
    delta: 50,
    swipeDuration: 500,
  });

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    
    if (chat.isGroupChat) {
      return chat.groupName.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const other = chat.participants.find((p: any) => p._id !== user?._id);
      return (
        other?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        other?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Chat List Sidebar */}
      <div className={`${(!isMobile || showListMobile) ? "block" : "hidden"} md:block md:w-96 w-full bg-white shadow-lg border-r border-gray-200`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowGroupModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <FaUsers className="inline mr-2" />
              New Group
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm">Start a chat to connect with others</p>
            </div>
          ) : (
            <div className="p-2 sm:p-4">
              {filteredChats
                .filter(
                  (chat) =>
                    chat.isGroupChat ||
                    (chat.messages && chat.messages.length > 0)
                )
                .map((chat) => {
                  if (chat.isGroupChat) {
                    return (
                      <div
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 sm:p-4 rounded-xl cursor-pointer mb-2 transition-all duration-200 ${
                          selectedChat?._id === chat._id
                            ? "bg-blue-50 border-2 border-blue-200 shadow-md"
                            : "hover:bg-gray-50 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <FaUsers className="text-white text-lg" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-semibold text-gray-900 truncate text-left leading-tight">
                              {chat.groupName}
                            </h3>
                            <p className="text-sm text-gray-500 truncate text-left leading-tight mt-0.5">
                              {chat.participants.length} members
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const other = chat.participants.find(
                      (p: any) => p._id !== user?._id
                    );
                    return (
                      <div
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 sm:p-4 rounded-xl cursor-pointer mb-2 transition-all duration-200 ${
                          selectedChat?._id === chat._id
                            ? "bg-blue-50 border-2 border-blue-200 shadow-md"
                            : "hover:bg-gray-50 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className="flex-shrink-0">
                            {other?.avatar ? (
                              <Image
                                src={other.avatar}
                                alt={other.firstName}
                                width={48}
                                height={48}
                                className="rounded-full object-cover w-12 h-12"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {other?.firstName?.[0]}
                                  {other?.lastName?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 className="font-semibold text-gray-900 truncate text-left leading-tight">
                              {other?.firstName} {other?.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 truncate text-left leading-tight mt-0.5">
                              @{other?.username}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div 
        className={`${(!isMobile || !showListMobile) ? "flex" : "hidden"} md:flex flex-1 flex-col bg-white shadow-lg`}
        {...swipeHandlers}
      >
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Back button for mobile */}
                  {isMobile && (
                    <button
                      onClick={() => setShowListMobile(true)}
                      className="md:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {selectedChat.isGroupChat ? (
                    <>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <FaUsers className="text-white text-lg" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedChat.groupName}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedChat.participants.length} members
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      {(() => {
                        const other = selectedChat.participants.find(
                          (p: any) => p._id !== user?._id
                        );
                        return other?.avatar ? (
                          <Image
                            src={other.avatar}
                            alt={other.firstName}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {other?.firstName?.[0]}
                              {other?.lastName?.[0]}
                            </span>
                          </div>
                        );
                      })()}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedChat.participants.find(
                            (p: any) => p._id !== user?._id
                          )?.firstName}{" "}
                          {selectedChat.participants.find(
                            (p: any) => p._id !== user?._id
                          )?.lastName}
                        </h2>
                        <p className="text-sm text-gray-500">
                          @{selectedChat.participants.find(
                            (p: any) => p._id !== user?._id
                          )?.username}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                

              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = !!user && msg.sender && user?._id === msg.sender._id;
                    const canDelete = isMe;
                    const sender = selectedChat.participants.find(
                      (p: any) => p._id === msg.sender._id
                    ) || msg.sender;
                    
                    return (
                      <div
                        key={msg._id}
                        className={`flex items-end ${isMe ? "justify-end" : "justify-start"} gap-3`}
                        onMouseEnter={() => setHoveredMessageId(msg._id)}
                        onMouseLeave={() => setHoveredMessageId("")}
                      >
                        {!isMe && (
                          <div className="flex-shrink-0">
                            {sender.avatar ? (
                              <Image
                                src={sender.avatar}
                                alt={sender.firstName}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {sender.firstName?.[0]}
                                  {sender.lastName?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-xs lg:max-w-md`}>
                          {!isMe && selectedChat.isGroupChat && (
                            <span className="text-xs font-medium text-gray-600 mb-1">
                              {sender.firstName} {sender.lastName}
                            </span>
                          )}
                          
                          <div className="flex items-end gap-2">
                            {editingMessageId === msg._id ? (
                              <div className="bg-white border border-gray-300 rounded-2xl px-4 py-2 shadow-lg">
                                <input
                                  className="border-none outline-none bg-transparent text-gray-900 min-w-[200px]"
                                  value={editInput}
                                  onChange={(e) => setEditInput(e.target.value)}
                                  autoFocus
                                  placeholder="Edit your message..."
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={saveEditMessage}
                                    className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-50"
                                  >
                                    <FiCheck size={16} />
                                  </button>
                                  <button
                                    onClick={cancelEditMessage}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50"
                                  >
                                    <FiX size={16} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                className={`px-4 py-3 rounded-2xl shadow-sm relative ${
                                  isMe
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-900 border border-gray-200"
                                }`}
                              >
                                <p className="text-sm leading-relaxed break-words">
                                  {msg.content}
                                </p>
                                <div className={`flex items-center justify-end gap-1 mt-2 ${
                                  isMe ? "text-blue-100" : "text-gray-400"
                                }`}>
                                  <span className="text-xs">
                                    {formatTime(msg.createdAt)}
                                  </span>
                                  {isMe && (
                                    <FiCheck size={12} className="text-blue-200" />
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Action buttons */}
                            {canDelete && hoveredMessageId === msg._id && editingMessageId !== msg._id && (
                              <div className="flex items-center gap-1 bg-white rounded-full shadow-lg px-2 py-1">
                                <button
                                  onClick={() => startEditMessage(msg)}
                                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                                  title="Edit message"
                                >
                                  <FiEdit size={14} className="text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteMessage(msg)}
                                  className="p-1 rounded-full hover:bg-red-50 transition-colors"
                                  title="Delete message"
                                  disabled={deletingMessageId === msg._id}
                                >
                                  <FiTrash2 size={14} className="text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isMe && (
                          <div className="flex-shrink-0">
                            {user?.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.firstName || "User"}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user?.firstName?.[0]}
                                  {user?.lastName?.[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {otherTyping && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm">Typing...</span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={handleSend} className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    type="button"
                    className={`p-2 rounded-full transition-colors ${
                      showEmojiPicker 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    onClick={() => {
                      console.log('Emoji button clicked, current state:', showEmojiPicker);
                      setShowEmojiPicker(!showEmojiPicker);
                    }}
                  >
                    <FaSmile className="text-current" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50 emoji-picker-container bg-white rounded-lg shadow-2xl border border-gray-200">
                      <div className="p-2 text-xs text-gray-500 border-b border-gray-200">
                        Emoji Picker
                      </div>
                      <EmojiPicker 
                        onEmojiClick={onEmojiClick}
                        width={350}
                        height={400}
                        searchPlaceholder="Search emojis..."
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className={`p-3 rounded-full transition-all duration-200 ${
                    messageInput.trim()
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <FiSend className="text-lg" />
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Create Group Chat</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Group Name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <div className="mb-4">
                <div className="font-medium mb-2 text-gray-700">Add Participants:</div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-xl p-3">
                  {allUsers.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={groupUsers.includes(u._id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setGroupUsers((prev) => [...prev, u._id]);
                          else
                            setGroupUsers((prev) =>
                              prev.filter((id) => id !== u._id)
                            );
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {u.firstName} {u.lastName} (@{u.username})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
                  onClick={() => setShowGroupModal(false)}
                  disabled={creatingGroup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={
                    creatingGroup ||
                    !groupName.trim() ||
                    groupUsers.length === 0
                  }
                >
                  {creatingGroup ? "Creating..." : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Participants Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              Manage Group Participants
            </h3>
            <div className="mb-4">
              <div className="font-medium mb-2 text-gray-700">Current Members:</div>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-xl p-3 mb-4">
                {selectedChat.participants.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between mb-2 p-2 hover:bg-gray-50 rounded-lg">
                    <span className="text-sm">
                      {p.firstName} {p.lastName} (@{p.username})
                    </span>
                    {p._id !== user?._id && (
                      <button
                        className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        onClick={() => handleRemoveParticipant(p._id)}
                        disabled={manageLoading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="font-medium mb-2 text-gray-700">Add Users:</div>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-xl p-3">
                {allUsers
                  .filter(
                    (u) =>
                      !selectedChat.participants.some(
                        (p: any) => p._id === u._id
                      )
                  )
                  .map((u) => (
                    <div key={u._id} className="flex items-center justify-between mb-2 p-2 hover:bg-gray-50 rounded-lg">
                      <span className="text-sm">
                        {u.firstName} {u.lastName} (@{u.username})
                      </span>
                      <button
                        className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        onClick={() => handleAddParticipant(u._id)}
                        disabled={manageLoading}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                {allUsers.filter(
                  (u) =>
                    !selectedChat.participants.some((p: any) => p._id === u._id)
                ).length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-2">No users to add.</div>
                )}
              </div>
            </div>
            <button
              type="button"
              className="w-full px-4 py-3 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors"
              onClick={() => setShowManageModal(false)}
              disabled={manageLoading}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
