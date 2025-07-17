'use client'
import { useEffect, useState, useRef } from 'react';
import { chatAPI, usersAPI } from '@/lib/api';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { FaUsers } from 'react-icons/fa';
import { FiEdit, FiCheck, FiX } from 'react-icons/fi';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { user, token } = useAppSelector((state) => state.auth);
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupUsers, setGroupUsers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string>('');
  const [editInput, setEditInput] = useState('');

  const selectedChatRef = useRef(selectedChat);
  const messagesRef = useRef(messages);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // --- SOCKET HOOK ---
  const {
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    socket,
  } = useSocket({
    token: token || '',
    onMessage: (data) => {
      console.log('Received new-message event:', data);
      if (data.chatId === selectedChatRef.current?._id) {
        setMessages((prev) => {
          // Defensive: Only check sender if present and not null
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
                  msg.sender && msg.sender._id === user._id &&
                  msg.content === data.message.content &&
                  Math.abs(new Date(msg.createdAt).getTime() - now) < 60000 &&
                  pendingMessageIds.includes(msg._id)
                )
            );
            return [...filtered, data.message];
          } else if (data.message) {
            // For receiver, just append the new message
            return [...messagesRef.current, data.message];
          } else {
            // If no message object, do nothing (for delete events, etc.)
            return messagesRef.current;
          }
        });
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
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
    console.log('Socket connected:', socket.connected);
    socket.on('connect', () => {
      console.log('Socket connected event');
      if (selectedChat) {
        console.log('Re-joining chat room after connect:', selectedChat._id);
        joinChat(selectedChat._id);
      }
    });
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, selectedChat, joinChat]);

  useEffect(() => {
    if (selectedChat) {
      console.log('Joining chat room:', selectedChat._id);
      joinChat(selectedChat._id);
      setOtherTyping(false);
      return () => {
        console.log('Leaving chat room:', selectedChat._id);
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
          // Remove optimistic message if it matches (by content and sender and recent time)
          const now = Date.now();
          const filtered = messagesRef.current.filter(
            (msg) =>
              !(
                msg.sender && msg.sender._id === user._id &&
                msg.content === data.message.content &&
                Math.abs(new Date(msg.createdAt).getTime() - now) < 60000 &&
                pendingMessageIds.includes(msg._id)
              )
          );
          return [...filtered, data.message];
        });
        setPendingMessageIds((ids) => ids.filter((id) => id !== data.message._id));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    };
    socket.on('message-sent', handler);
    return () => {
      socket.off('message-sent', handler);
    };
  }, [socket, user, pendingMessageIds]);

  // Listen for message-edited event only
  useEffect(() => {
    if (!socket) return;
    const handleEdited = (data: any) => {
      console.log('Received message-edited event', data);
      if (data.chatId === selectedChatRef.current?._id) {
        setMessages((prev) => prev.map((msg) => msg._id === data.message._id ? { ...msg, content: data.message.content } : msg));
      }
    };
    socket.on('message-edited', handleEdited);
    return () => {
      socket.off('message-edited', handleEdited);
    };
  }, [socket, selectedChat, joinChat]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTyping, selectedChat]);

  useEffect(() => {
    if (!user) return;
    setLoadingChats(true);
    chatAPI.getChats().then(res => {
      const chatList = res.data.data || [];
      setChats(chatList);
      setLoadingChats(false);
      // Auto-select chat if chatId is in query
      const chatId = searchParams.get('chatId');
      if (chatId) {
        const found = chatList.find((c: any) => c._id === chatId);
        if (found) setSelectedChat(found);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    chatAPI.getChat(selectedChat._id).then(res => {
      setMessages(res.data.data.messages || []);
      setLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
  }, [selectedChat]);

  // Fetch all users for group selection
  useEffect(() => {
    if (showGroupModal || showManageModal) {
      usersAPI.getUsers().then(res => {
        setAllUsers(res.data.data.filter((u: any) => u._id !== user._id));
      });
    }
  }, [showGroupModal, showManageModal, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    setIsTyping(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;
    setSending(true);
    try {
      // Send via socket
      const tempId = Date.now().toString();
      sendMessage({ chatId: selectedChat._id, content: messageInput });
      setMessages((prev) => [
        ...prev,
        {
          _id: tempId,
          sender: { _id: user._id },
          content: messageInput,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPendingMessageIds((ids) => [...ids, tempId]);
      setMessageInput('');
      setIsTyping(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setSending(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || groupUsers.length === 0) return;
    setCreatingGroup(true);
    try {
      const res = await chatAPI.createGroupChat({ name: groupName, participants: groupUsers });
      setChats((prev) => [res.data.data, ...prev]);
      setShowGroupModal(false);
      setGroupName('');
      setGroupUsers([]);
    } finally {
      setCreatingGroup(false);
    }
  };

  // Handler to add participant
  const handleAddParticipant = async (userId: string) => {
    if (!selectedChat) return;
    setManageLoading(true);
    try {
      const res = await chatAPI.addParticipant(selectedChat._id, { userId });
      setSelectedChat(res.data.data);
      setChats((prev) => prev.map(c => c._id === res.data.data._id ? res.data.data : c));
    } finally {
      setManageLoading(false);
    }
  };

  // Handler to remove participant
  const handleRemoveParticipant = async (userId: string) => {
    if (!selectedChat) return;
    setManageLoading(true);
    try {
      const res = await chatAPI.removeParticipant(selectedChat._id, userId);
      setSelectedChat(res.data.data);
      setChats((prev) => prev.map(c => c._id === res.data.data._id ? res.data.data : c));
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
    setEditingMessageId('');
    setEditInput('');
  };
  const saveEditMessage = () => {
    if (!selectedChat || !editingMessageId) return;
    socket?.emit('edit-message', { chatId: selectedChat._id, messageId: editingMessageId, newContent: editInput });
    setEditingMessageId('');
    setEditInput('');
  };

  return (
    <div className="flex h-screen w-screen bg-white">
      {/* Chat List */}
      <div className="w-1/3 border-r overflow-y-auto">
        <div className="flex items-center justify-between mb-4 mt-6 px-6">
          <h2 className="text-lg font-bold">Chats</h2>
          <button
            className="bg-primary-600 text-white px-3 py-1 rounded text-sm"
            onClick={() => setShowGroupModal(true)}
          >
            New Group
          </button>
        </div>
        {loadingChats ? <div>Loading...</div> : (
          chats.length === 0 ? <div className="text-gray-500">No chats yet.</div> : (
            <ul>
              {chats.map((chat) => {
                if (chat.isGroupChat) {
                  return (
                    <li
                      key={chat._id}
                      className={`p-2 rounded cursor-pointer mb-2 flex items-center gap-2 ${selectedChat?._id === chat._id ? 'bg-primary-100' : 'hover:bg-gray-100'}`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="w-10 h-10 flex items-center justify-center bg-primary-100 rounded-full mr-2">
                        <FaUsers className="text-primary-600 text-xl" />
                      </div>
                      <div>
                        <div className="font-medium">{chat.groupName}</div>
                        <div className="text-xs text-gray-500">Group chat • {chat.participants.length} members</div>
                      </div>
                    </li>
                  );
                } else {
                  const other = chat.participants.find((p: any) => p._id !== user._id);
                  return (
                    <li
                      key={chat._id}
                      className={`p-2 rounded cursor-pointer mb-2 flex items-center gap-2 ${selectedChat?._id === chat._id ? 'bg-primary-100' : 'hover:bg-gray-100'}`}
                      onClick={() => setSelectedChat(chat)}
                    >
                      {other?.avatar ? (
                        <Image src={other.avatar} alt={other.firstName} width={40} height={40} className="rounded-full w-10 h-10 object-cover mr-2" />
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full mr-2 text-lg font-bold text-gray-600">
                          {other?.firstName?.[0]}{other?.lastName?.[0]}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{other?.firstName} {other?.lastName}</div>
                        <div className="text-xs text-gray-500">@{other?.username}</div>
                      </div>
                    </li>
                  );
                }
              })}
            </ul>
          )
        )}
      </div>
      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b py-3 px-4">
              {selectedChat.isGroupChat ? (
                <>
                  <div className="w-10 h-10 flex items-center justify-center bg-primary-100 rounded-full">
                    <FaUsers className="text-primary-600 text-xl" />
                  </div>
                  <div>
                    <div className="font-bold text-lg">{selectedChat.groupName}</div>
                    <div className="text-xs text-gray-500">
                      {selectedChat.participants.map((p: any) => `${p.firstName} ${p.lastName}`).join(', ')}
                    </div>
                  </div>
                  {selectedChat.groupAdmin?._id === user._id && (
                    <button className="ml-auto px-2 py-1 text-xs rounded bg-primary-100 text-primary-700 hover:bg-primary-200" onClick={() => setShowManageModal(true)}>
                      Add/Remove Participants
                    </button>
                  )}
                </>
              ) : (
                <>
                  {(() => {
                    const other = selectedChat.participants.find((p: any) => p._id !== user._id);
                    return other?.avatar ? (
                      <Image src={other.avatar} alt={other.firstName} width={40} height={40} className="rounded-full w-10 h-10 object-cover" />
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full text-lg font-bold text-gray-600">
                        {other?.firstName?.[0]}{other?.lastName?.[0]}
                      </div>
                    );
                  })()}
                  <div className="font-bold text-lg">
                    {selectedChat.participants.find((p: any) => p._id !== user._id)?.firstName} {selectedChat.participants.find((p: any) => p._id !== user._id)?.lastName}
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {loadingMessages ? <div>Loading...</div> : (
                messages.length === 0 ? <div className="text-gray-500">No messages yet.</div> : (
                  <div className="space-y-2">
                    {messages.map((msg) => {
                      const isMe = !!user && msg.sender && user?._id === msg.sender._id;
                      const sender = selectedChat.participants.find((p: any) => p._id === msg.sender._id) || msg.sender;
                      return (
                        <div key={msg._id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                          {/* Avatar for received messages */}
                          {!isMe && (sender.avatar ? (
                            <Image src={sender.avatar} alt={sender.firstName} width={32} height={32} className="rounded-full w-8 h-8 object-cover mr-1" />
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full mr-1 text-sm font-bold text-gray-600">
                              {sender.firstName?.[0]}{sender.lastName?.[0]}
                            </div>
                          ))}
                          {/* Message bubble and edit icon for sent messages */}
                          <div className={`flex items-center ${isMe ? 'flex-row-reverse' : ''} gap-1`}>
                            <div className={`px-4 py-2 rounded-2xl max-w-xs shadow relative ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'} ${isMe ? 'ml-0' : 'mr-0'}`}
                              style={{ minWidth: '48px' }}>
                              {!isMe && selectedChat.isGroupChat && (
                                <div className="text-xs font-semibold mb-1 text-primary-700">{sender.firstName} {sender.lastName}</div>
                              )}
                              {editingMessageId === msg._id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    className="flex-1 border rounded px-2 py-1 text-black"
                                    value={editInput}
                                    onChange={e => setEditInput(e.target.value)}
                                    autoFocus
                                    placeholder="Edit your message..."
                                  />
                                  <button onClick={saveEditMessage} className="text-green-600"><FiCheck /></button>
                                  <button onClick={cancelEditMessage} className="text-gray-400"><FiX /></button>
                                </div>
                              ) : (
                                <>
                                  <div className="text-sm break-words">{msg.content}</div>
                                  <div className="text-xs text-right mt-1 opacity-70">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </>
                              )}
                            </div>
                            {/* Edit icon for sent messages, outside the bubble */}
                            {isMe && editingMessageId !== msg._id && (
                              <button
                                onClick={() => startEditMessage(msg)}
                                className="text-xs text-primary-500 hover:text-yellow-400 transition-colors duration-150 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-300"
                                title="Edit message"
                                style={{ marginLeft: '2px' }}
                              >
                                <FiEdit size={18} />
                              </button>
                            )}
                          </div>
                          {/* Avatar for sent messages */}
                          {isMe && (user?.avatar ? (
                            <Image src={user?.avatar} alt={user?.firstName || 'User'} width={32} height={32} className="rounded-full w-8 h-8 object-cover ml-1" />
                          ) : user ? (
                            <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full ml-1 text-sm font-bold text-gray-600">
                              {(user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')}
                            </div>
                          ) : null)}
                        </div>
                      );
                    })}
                    {otherTyping && (
                      <div className="text-xs text-gray-400 pl-2">Typing...</div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )
              )}
            </div>
            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
              <input
                type="text"
                className="flex-1 border rounded px-2 py-1"
                value={messageInput}
                onChange={handleInputChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend(e);
                }}
                placeholder="Type a message..."
              />
              <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded" disabled={sending || !messageInput.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">Select a chat to start messaging.</div>
        )}
      </div>
      {/* Group Chat Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Create Group Chat</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-3"
                placeholder="Group Name"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                required
              />
              <div className="mb-3">
                <div className="font-medium mb-1">Add Participants:</div>
                <div className="max-h-40 overflow-y-auto border rounded p-2">
                  {allUsers.map((u) => (
                    <label key={u._id} className="flex items-center gap-2 mb-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupUsers.includes(u._id)}
                        onChange={e => {
                          if (e.target.checked) setGroupUsers(prev => [...prev, u._id]);
                          else setGroupUsers(prev => prev.filter(id => id !== u._id));
                        }}
                      />
                      <span>{u.firstName} {u.lastName} (@{u.username})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-200"
                  onClick={() => setShowGroupModal(false)}
                  disabled={creatingGroup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary-600 text-white"
                  disabled={creatingGroup || !groupName.trim() || groupUsers.length === 0}
                >
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Manage Participants Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Manage Group Participants</h3>
            <div className="mb-4">
              <div className="font-medium mb-1">Current Members:</div>
              <div className="max-h-32 overflow-y-auto border rounded p-2 mb-2">
                {selectedChat.participants.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-2 mb-1">
                    <span>{p.firstName} {p.lastName} (@{p.username})</span>
                    {p._id !== user._id && (
                      <button
                        className="ml-auto px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200"
                        onClick={() => handleRemoveParticipant(p._id)}
                        disabled={manageLoading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="font-medium mb-1 mt-2">Add Users:</div>
              <div className="max-h-32 overflow-y-auto border rounded p-2">
                {allUsers.filter(u => !selectedChat.participants.some((p: any) => p._id === u._id)).map((u) => (
                  <div key={u._id} className="flex items-center gap-2 mb-1">
                    <span>{u.firstName} {u.lastName} (@{u.username})</span>
                    <button
                      className="ml-auto px-2 py-1 text-xs rounded bg-primary-100 text-primary-700 hover:bg-primary-200"
                      onClick={() => handleAddParticipant(u._id)}
                      disabled={manageLoading}
                    >
                      Add
                    </button>
                  </div>
                ))}
                {allUsers.filter(u => !selectedChat.participants.some((p: any) => p._id === u._id)).length === 0 && (
                  <div className="text-xs text-gray-400">No users to add.</div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setShowManageModal(false)}
                disabled={manageLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
