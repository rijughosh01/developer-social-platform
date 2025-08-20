import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { aiAPI } from "@/lib/api";
import {
  AIState,
  AIResponse,
  AIStats,
  AIContext,
  AIConversation,
  AIConversationStats,
  DailyTokenUsage,
} from "@/types";

const initialState: AIState = {
  responses: [],
  stats: null,
  contexts: [],
  models: [],
  conversations: [],
  conversationStats: null,
  currentConversation: null,
  isLoading: false,
  error: null,
  currentContext: "general",
  currentModel: "gpt-4o-mini",
  tokenUsage: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const fetchAIContexts = createAsyncThunk(
  "ai/fetchContexts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getContexts();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch AI contexts"
      );
    }
  }
);

export const fetchAIModels = createAsyncThunk(
  "ai/fetchModels",
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getModels();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch AI models"
      );
    }
  }
);

export const fetchAIStats = createAsyncThunk(
  "ai/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getStats();
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching AI stats:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch AI stats"
      );
    }
  }
);

export const fetchTokenUsage = createAsyncThunk(
  "ai/fetchTokenUsage",
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getTokenUsage();
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching token usage:", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch token usage"
      );
    }
  }
);

export const sendAIMessage = createAsyncThunk(
  "ai/sendMessage",
  async (
    {
      message,
      context,
      model,
    }: { message: string; context?: string; model?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.chat({ message, context, model });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message to AI"
      );
    }
  }
);

export const codeReview = createAsyncThunk(
  "ai/codeReview",
  async (
    {
      code,
      language,
      model,
    }: { code: string; language: string; model?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.codeReview({ code, language, model });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to review code"
      );
    }
  }
);

export const debugCode = createAsyncThunk(
  "ai/debugCode",
  async (
    {
      code,
      error,
      language,
      model,
    }: {
      code: string;
      error: string;
      language: string;
      model?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.debugCode({ code, error, language, model });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to debug code"
      );
    }
  }
);

export const pinMessage = createAsyncThunk(
  "ai/pinMessage",
  async (
    {
      conversationId,
      messageIndex,
    }: {
      conversationId: string;
      messageIndex: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.pinMessage(conversationId, messageIndex);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to pin message"
      );
    }
  }
);

export const unpinMessage = createAsyncThunk(
  "ai/unpinMessage",
  async (
    {
      conversationId,
      messageIndex,
    }: {
      conversationId: string;
      messageIndex: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.unpinMessage(conversationId, messageIndex);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to unpin message"
      );
    }
  }
);

export const fetchPinnedMessages = createAsyncThunk(
  "ai/fetchPinnedMessages",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getPinnedMessages(conversationId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pinned messages"
      );
    }
  }
);

export const learnTopic = createAsyncThunk(
  "ai/learnTopic",
  async (
    { topic, model }: { topic: string; model?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.learn({ topic, model });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get learning help"
      );
    }
  }
);

export const getProjectAdvice = createAsyncThunk(
  "ai/projectAdvice",
  async (
    { description, model }: { description: string; model?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.projectAdvice({ description, model });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get project advice"
      );
    }
  }
);

// Conversation History Async Thunks
export const fetchConversations = createAsyncThunk(
  "ai/fetchConversations",
  async (
    params?: {
      page?: number;
      limit?: number;
      context?: string;
      sort?: string;
      order?: string;
      search?: string;
      includeArchived?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.getConversations(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversations"
      );
    }
  }
);

export const fetchConversation = createAsyncThunk(
  "ai/fetchConversation",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getConversation(id);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversation"
      );
    }
  }
);

export const createConversation = createAsyncThunk(
  "ai/createConversation",
  async (
    data: {
      title: string;
      context: string;
      projectId?: string;
      tags?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.createConversation(data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create conversation"
      );
    }
  }
);

export const updateConversation = createAsyncThunk(
  "ai/updateConversation",
  async (
    {
      conversationId,
      title,
      tags,
    }: {
      conversationId: string;
      title?: string;
      tags?: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.updateConversation(conversationId, {
        title,
        tags,
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update conversation"
      );
    }
  }
);

export const deleteConversation = createAsyncThunk(
  "ai/deleteConversation",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const response = await aiAPI.deleteConversation(conversationId);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete conversation"
      );
    }
  }
);

export const searchConversations = createAsyncThunk(
  "ai/searchConversations",
  async (
    params: {
      q: string;
      context?: string;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await aiAPI.searchConversations(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to search conversations"
      );
    }
  }
);

export const fetchConversationStats = createAsyncThunk(
  "ai/fetchConversationStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await aiAPI.getConversationStats();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch conversation stats"
      );
    }
  }
);

const aiSlice = createSlice({
  name: "ai",
  initialState,
  reducers: {
    setCurrentContext: (state, action: PayloadAction<string>) => {
      state.currentContext = action.payload;
    },
    setCurrentModel: (state, action: PayloadAction<string>) => {
      state.currentModel = action.payload;
    },
    clearResponses: (state) => {
      state.responses = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    addResponse: (state, action: PayloadAction<AIResponse>) => {
      state.responses.push(action.payload);
    },
    removeResponse: (state, action: PayloadAction<string>) => {
      state.responses = state.responses.filter(
        (response) => response.timestamp !== action.payload
      );
    },
    setCurrentConversation: (
      state,
      action: PayloadAction<AIConversation | string | null>
    ) => {
      if (typeof action.payload === "string") {
        const conversation = state.conversations.find(
          (conv) => conv._id === action.payload
        );
        state.currentConversation = conversation || null;
      } else {
        state.currentConversation = action.payload;
      }
    },
    clearConversations: (state) => {
      state.conversations = [];
      state.currentConversation = null;
    },
    updateConversationInList: (
      state,
      action: PayloadAction<AIConversation>
    ) => {
      const index = state.conversations.findIndex(
        (conv) => conv._id === action.payload._id
      );
      if (index !== -1) {
        state.conversations[index] = action.payload;
      }
    },
    removeConversationFromList: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(
        (conv) => conv._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch contexts
    builder
      .addCase(fetchAIContexts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAIContexts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contexts = action.payload;
      })
      .addCase(fetchAIContexts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch models
    builder
      .addCase(fetchAIModels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAIModels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.models = action.payload;
      })
      .addCase(fetchAIModels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch stats
    builder
      .addCase(fetchAIStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAIStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAIStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch token usage
    builder
      .addCase(fetchTokenUsage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTokenUsage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tokenUsage = action.payload;
      })
      .addCase(fetchTokenUsage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Send message
    builder
      .addCase(sendAIMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendAIMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.responses.push(action.payload);

        state.stats = null;
      })
      .addCase(sendAIMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Code review
    builder
      .addCase(codeReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(codeReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.responses.push(action.payload);

        state.stats = null;
      })
      .addCase(codeReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Debug code
    builder
      .addCase(debugCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(debugCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.responses.push(action.payload);

        state.stats = null;
      })
      .addCase(debugCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Pin message
    builder
      .addCase(pinMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(pinMessage.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(pinMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Unpin message
    builder
      .addCase(unpinMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unpinMessage.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(unpinMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch pinned messages
    builder
      .addCase(fetchPinnedMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPinnedMessages.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(fetchPinnedMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Learn topic
    builder
      .addCase(learnTopic.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(learnTopic.fulfilled, (state, action) => {
        state.isLoading = false;
        state.responses.push(action.payload);
        state.stats = null;
      })
      .addCase(learnTopic.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Project advice
    builder
      .addCase(getProjectAdvice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProjectAdvice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.responses.push(action.payload);
        state.stats = null;
      })
      .addCase(getProjectAdvice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload.conversations;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single conversation
    builder
      .addCase(fetchConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create conversation
    builder
      .addCase(createConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations.unshift(action.payload);
        state.currentConversation = action.payload;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update conversation
    builder
      .addCase(updateConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateConversation.fulfilled, (state, action) => {
        state.isLoading = false;

        const index = state.conversations.findIndex(
          (conv) => conv._id === action.payload._id
        );
        if (index !== -1) {
          state.conversations[index] = action.payload;
        }

        if (state.currentConversation?._id === action.payload._id) {
          state.currentConversation = action.payload;
        }
      })
      .addCase(updateConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete conversation
    builder
      .addCase(deleteConversation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.isLoading = false;

        state.conversations = state.conversations.filter(
          (conv) => conv._id !== action.payload.conversationId
        );

        if (state.currentConversation?._id === action.payload.conversationId) {
          state.currentConversation = null;
        }
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search conversations
    builder
      .addCase(searchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(searchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch conversation stats
    builder
      .addCase(fetchConversationStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversationStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversationStats = action.payload;
      })
      .addCase(fetchConversationStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentContext,
  setCurrentModel,
  clearResponses,
  clearError,
  addResponse,
  removeResponse,
  setCurrentConversation,
  clearConversations,
  updateConversationInList,
  removeConversationFromList,
} = aiSlice.actions;

export default aiSlice.reducer;
