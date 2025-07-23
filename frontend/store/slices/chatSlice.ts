import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Chat, Message, ApiResponse } from "@/types";
import { chatAPI } from "@/lib/api";

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  socket: any | null;
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  isLoading: false,
  error: null,
  socket: null,
};

// Async thunks
export const fetchChats = createAsyncThunk("chat/fetchChats", async () => {
  const response = await chatAPI.getChats();
  return response.data;
});

export const fetchChat = createAsyncThunk(
  "chat/fetchChat",
  async (id: string) => {
    const response = await chatAPI.getChat(id);
    return response.data;
  }
);

export const startChat = createAsyncThunk(
  "chat/startChat",
  async (userId: string) => {
    const response = await chatAPI.startChat({ userId });
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({
    chatId,
    content,
    messageType = "text",
    fileUrl = "",
    fileName = "",
  }: {
    chatId: string;
    content: string;
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
  }) => {
    const response = await chatAPI.sendMessage(chatId, {
      content,
      messageType,
      fileUrl,
      fileName,
    });
    return response.data;
  }
);

export const markAsRead = createAsyncThunk(
  "chat/markAsRead",
  async (chatId: string) => {
    await chatAPI.markAsRead(chatId);
    return chatId;
  }
);

export const getUnreadCount = createAsyncThunk(
  "chat/getUnreadCount",
  async () => {
    const response = await chatAPI.getUnreadCount();
    return response.data;
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentChat: (state) => {
      state.currentChat = null;
    },
    setSocket: (state, action: PayloadAction<any>) => {
      state.socket = action.payload;
    },
    addMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: Message }>
    ) => {
      const { chatId, message } = action.payload;

      // Update in chats list
      state.chats = state.chats.map((chat) =>
        chat._id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      );

      // Update current chat if it's the same
      if (state.currentChat?._id === chatId) {
        state.currentChat = {
          ...state.currentChat,
          messages: [...state.currentChat.messages, message],
        };
      }
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const updatedChat = action.payload;

      // Update in chats list
      state.chats = state.chats.map((chat) =>
        chat._id === updatedChat._id ? updatedChat : chat
      );

      // Update current chat if it's the same
      if (state.currentChat?._id === updatedChat._id) {
        state.currentChat = updatedChat;
      }
    },
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload.data;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch chats";
      });

    // Fetch Chat
    builder
      .addCase(fetchChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChat.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChat = action.payload.data;
      })
      .addCase(fetchChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch chat";
      });

    // Start Chat
    builder
      .addCase(startChat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startChat.fulfilled, (state, action) => {
        state.isLoading = false;
        const newChat = action.payload.data;

        // Check if chat already exists
        const existingChatIndex = state.chats.findIndex(
          (chat) => chat._id === newChat._id
        );
        if (existingChatIndex >= 0) {
          state.chats[existingChatIndex] = newChat;
        } else {
          state.chats.unshift(newChat);
        }
      })
      .addCase(startChat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to start chat";
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const newMessage = action.payload.data;
        const chatId = action.meta.arg.chatId;

        // Update in chats list
        state.chats = state.chats.map((chat) =>
          chat._id === chatId
            ? { ...chat, messages: [...chat.messages, newMessage] }
            : chat
        );

        // Update current chat if it's the same
        if (state.currentChat?._id === chatId) {
          state.currentChat = {
            ...state.currentChat,
            messages: [...state.currentChat.messages, newMessage],
          };
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to send message";
      });

    // Mark as Read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const chatId = action.payload;

      // Update in chats list
      state.chats = state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, unreadCount: new Map() } : chat
      );

      // Update current chat if it's the same
      if (state.currentChat?._id === chatId) {
        state.currentChat = {
          ...state.currentChat,
          unreadCount: new Map(),
        };
      }
    });

    // Get Unread Count
    builder.addCase(getUnreadCount.fulfilled, (state, action) => {
      // Handle unread count data as needed
    });
  },
});

export const {
  clearError,
  clearCurrentChat,
  setSocket,
  addMessage,
  updateChat,
  setChats,
} = chatSlice.actions;
export default chatSlice.reducer;
