import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { discussionsAPI } from "@/lib/api";
import {
  DiscussionState,
  Discussion,
  DiscussionComment,
  DiscussionCategory,
  DiscussionTag,
  DiscussionFilters,
} from "@/types";

const initialState: DiscussionState = {
  discussions: [],
  currentDiscussion: null,
  categories: [],
  tags: [],

  filters: {
    category: "",
    tags: [],
    status: "open",
    sort: "lastActivity",
    order: "desc",
    page: 1,
    limit: 20,
  },
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const fetchDiscussions = createAsyncThunk(
  "discussions/fetchDiscussions",
  async (params?: DiscussionFilters, { rejectWithValue }) => {
    try {
      const response = await discussionsAPI.getDiscussions(params);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch discussions"
      );
    }
  }
);

export const fetchDiscussion = createAsyncThunk(
  "discussions/fetchDiscussion",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await discussionsAPI.getDiscussion(id);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch discussion"
      );
    }
  }
);

export const createDiscussion = createAsyncThunk(
  "discussions/createDiscussion",
  async (
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string;
      templateId?: string;
      templateData?: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.createDiscussion(data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create discussion"
      );
    }
  }
);

export const updateDiscussion = createAsyncThunk(
  "discussions/updateDiscussion",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        title?: string;
        content?: string;
        category?: string;
        tags?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.updateDiscussion(id, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update discussion"
      );
    }
  }
);

export const deleteDiscussion = createAsyncThunk(
  "discussions/deleteDiscussion",
  async (id: string, { rejectWithValue }) => {
    try {
      await discussionsAPI.deleteDiscussion(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete discussion"
      );
    }
  }
);

export const voteDiscussion = createAsyncThunk(
  "discussions/voteDiscussion",
  async (
    {
      id,
      voteType,
    }: { id: string; voteType: "upvote" | "downvote" | "remove" },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.voteDiscussion(id, voteType);
      return { id, ...response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to vote on discussion"
      );
    }
  }
);

export const addComment = createAsyncThunk(
  "discussions/addComment",
  async (
    {
      discussionId,
      data,
    }: {
      discussionId: string;
      data: {
        content: string;
        parentCommentId?: string;
        richContent?: string;
        contentType?: "plain" | "rich";
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.addComment(discussionId, data);
      return { discussionId, comment: response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

export const voteComment = createAsyncThunk(
  "discussions/voteComment",
  async (
    {
      discussionId,
      commentId,
      voteType,
    }: {
      discussionId: string;
      commentId: string;
      voteType: "upvote" | "downvote" | "remove";
    },
    { rejectWithValue }
  ) => {
    try {
      await discussionsAPI.voteComment(discussionId, commentId, voteType);
      return { discussionId, commentId, voteType };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to vote on comment"
      );
    }
  }
);

export const editComment = createAsyncThunk(
  "discussions/editComment",
  async (
    {
      discussionId,
      commentId,
      data,
    }: {
      discussionId: string;
      commentId: string;
      data: {
        content: string;
        richContent?: string;
        contentType?: "plain" | "rich";
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.editComment(
        discussionId,
        commentId,
        data
      );
      return { discussionId, commentId, comment: response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to edit comment"
      );
    }
  }
);

export const acceptAnswer = createAsyncThunk(
  "discussions/acceptAnswer",
  async (
    { discussionId, commentId }: { discussionId: string; commentId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.acceptAnswer(
        discussionId,
        commentId
      );
      return { discussionId, commentId, discussion: response.data.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept answer"
      );
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "discussions/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await discussionsAPI.getCategories();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

export const fetchTags = createAsyncThunk(
  "discussions/fetchTags",
  async (_, { rejectWithValue }) => {
    try {
      const response = await discussionsAPI.getTags();
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch tags"
      );
    }
  }
);

export const flagDiscussion = createAsyncThunk(
  "discussions/flagDiscussion",
  async (
    { id, reason }: { id: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.flagDiscussion(id, reason);
      return { id, reason };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to flag discussion"
      );
    }
  }
);

export const flagComment = createAsyncThunk(
  "discussions/flagComment",
  async (
    {
      discussionId,
      commentId,
      reason,
    }: { discussionId: string; commentId: string; reason: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await discussionsAPI.flagComment(
        discussionId,
        commentId,
        reason
      );
      return { discussionId, commentId, reason };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to flag comment"
      );
    }
  }
);

const discussionsSlice = createSlice({
  name: "discussions",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<DiscussionFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: "",
        tags: [],
        status: "open",
        sort: "lastActivity",
        order: "desc",
        page: 1,
        limit: 20,
      };
    },
    setCurrentDiscussion: (state, action: PayloadAction<Discussion | null>) => {
      state.currentDiscussion = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateDiscussionInList: (state, action: PayloadAction<Discussion>) => {
      const index = state.discussions.findIndex(
        (d) => d._id === action.payload._id
      );
      if (index !== -1) {
        state.discussions[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch discussions
    builder
      .addCase(fetchDiscussions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDiscussions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.discussions = action.payload.discussions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDiscussions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch single discussion
    builder
      .addCase(fetchDiscussion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDiscussion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentDiscussion = action.payload;
      })
      .addCase(fetchDiscussion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create discussion
    builder
      .addCase(createDiscussion.fulfilled, (state, action) => {
        state.discussions.unshift(action.payload);
      })
      .addCase(createDiscussion.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update discussion
    builder
      .addCase(updateDiscussion.fulfilled, (state, action) => {
        const index = state.discussions.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) {
          state.discussions[index] = action.payload;
        }
        if (state.currentDiscussion?._id === action.payload._id) {
          state.currentDiscussion = action.payload;
        }
      })
      .addCase(updateDiscussion.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete discussion
    builder
      .addCase(deleteDiscussion.fulfilled, (state, action) => {
        state.discussions = state.discussions.filter(
          (d) => d._id !== action.payload
        );
        if (state.currentDiscussion?._id === action.payload) {
          state.currentDiscussion = null;
        }
      })
      .addCase(deleteDiscussion.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Vote discussion
    builder
      .addCase(voteDiscussion.fulfilled, (state, action) => {
        const { id, voteScore, userVote } = action.payload;
        const discussion = state.discussions.find((d) => d._id === id);
        if (discussion) {
          discussion.voteScore = voteScore;
          discussion.userVote = userVote;
        }
        if (state.currentDiscussion?._id === id) {
          state.currentDiscussion.voteScore = voteScore;
          state.currentDiscussion.userVote = userVote;
        }
      })
      .addCase(voteDiscussion.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Add comment
    builder
      .addCase(addComment.fulfilled, (state, action) => {
        const { discussionId, comment } = action.payload;
        if (state.currentDiscussion?._id === discussionId) {
          state.currentDiscussion.comments.push(comment);
          state.currentDiscussion.commentCount += 1;
        }
      })
      .addCase(addComment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Vote comment
    builder
      .addCase(voteComment.fulfilled, (state, action) => {
        const { discussionId, commentId, voteType } = action.payload;
        if (state.currentDiscussion?._id === discussionId) {
          const comment = state.currentDiscussion.comments.find(
            (c) => c._id === commentId
          );
          if (comment) {
            if (voteType === "upvote") {
              comment.userVote = "upvote";
            } else if (voteType === "downvote") {
              comment.userVote = "downvote";
            } else {
              comment.userVote = null;
            }
          }
        }
      })
      .addCase(voteComment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Edit comment
    builder
      .addCase(editComment.fulfilled, (state, action) => {
        const { discussionId, commentId, comment } = action.payload;
        if (state.currentDiscussion?._id === discussionId) {
          const commentIndex = state.currentDiscussion.comments.findIndex(
            (c) => c._id === commentId
          );
          if (commentIndex !== -1) {
            state.currentDiscussion.comments[commentIndex] = comment;
          }
        }
      })
      .addCase(editComment.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Accept answer
    builder
      .addCase(acceptAnswer.fulfilled, (state, action) => {
        const { discussionId, commentId, discussion } = action.payload;
        if (state.currentDiscussion?._id === discussionId) {
          state.currentDiscussion.acceptedAnswer =
            state.currentDiscussion.comments.find((c) => c._id === commentId);
        }
        const discussionIndex = state.discussions.findIndex(
          (d) => d._id === discussionId
        );
        if (discussionIndex !== -1) {
          state.discussions[discussionIndex] = discussion;
        }
      })
      .addCase(acceptAnswer.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch categories
    builder
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch tags
    builder
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Flag discussion
    builder
      .addCase(flagDiscussion.fulfilled, (state, action) => {})
      .addCase(flagDiscussion.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Flag comment
    builder
      .addCase(flagComment.fulfilled, (state, action) => {})
      .addCase(flagComment.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setCurrentDiscussion,
  clearError,
  updateDiscussionInList,
} = discussionsSlice.actions;

export default discussionsSlice.reducer;
