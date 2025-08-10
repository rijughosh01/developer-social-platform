import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { User, ApiResponse, PaginationParams } from "@/types";
import { usersAPI } from "@/lib/api";

interface UsersState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (params?: PaginationParams) => {
    const response = await usersAPI.getUsers(params);
    return response.data;
  }
);

export const fetchUser = createAsyncThunk(
  "users/fetchUser",
  async (id: string) => {
    const response = await usersAPI.getUser(id);
    return response.data;
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, data }: { id: string; data: any }) => {
    const response = await usersAPI.updateUser(id, data);
    return response.data;
  }
);

export const followUser = createAsyncThunk(
  "users/followUser",
  async (id: string) => {
    const response = await usersAPI.followUser(id);
    return response.data;
  }
);

export const unfollowUser = createAsyncThunk(
  "users/unfollowUser",
  async (id: string) => {
    const response = await usersAPI.unfollowUser(id);
    return response.data;
  }
);

export const fetchFollowers = createAsyncThunk(
  "users/fetchFollowers",
  async ({ id, params }: { id: string; params?: PaginationParams }) => {
    const response = await usersAPI.getFollowers(id, params);
    return response.data;
  }
);

export const fetchFollowing = createAsyncThunk(
  "users/fetchFollowing",
  async ({ id, params }: { id: string; params?: PaginationParams }) => {
    const response = await usersAPI.getFollowing(id, params);
    return response.data;
  }
);

export const fetchSuggestions = createAsyncThunk(
  "users/fetchSuggestions",
  async (params?: PaginationParams) => {
    const response = await usersAPI.getSuggestions(params);
    return response.data;
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        const incoming = action.payload.data as User[];
        const pagination = action.payload.pagination || null;
        const requestedPage = (action.meta.arg as any)?.page || 1;

        if (requestedPage > 1) {
          // Append while avoiding duplicates by _id
          const existingById = new Map(state.users.map((u) => [u._id, u]));
          for (const u of incoming) existingById.set(u._id, { ...existingById.get(u._id), ...u } as User);
          state.users = Array.from(existingById.values());
        } else {
          state.users = incoming;
        }
        state.pagination = pagination;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch users";
      });

    // Fetch User
    builder
      .addCase(fetchUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload.data;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch user";
      });

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload.data;
        state.users = state.users.map((user) =>
          user._id === updatedUser._id ? updatedUser : user
        );
        if (state.currentUser?._id === updatedUser._id) {
          state.currentUser = updatedUser;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update user";
      });

    // Follow User
    builder.addCase(followUser.fulfilled, (state, action) => {
      const { isFollowing, followersCount, followingCount } =
        action.payload.data;
      const userId = action.meta.arg;

      // Update in users list
      state.users = state.users.map((user) =>
        user._id === userId ? { ...user, isFollowing, followersCount } : user
      );

      // Update current user if it's the same
      if (state.currentUser?._id === userId) {
        state.currentUser = {
          ...state.currentUser,
          isFollowing,
          followersCount,
        };
      }
    });

    // Unfollow User
    builder.addCase(unfollowUser.fulfilled, (state, action) => {
      const { isFollowing, followersCount, followingCount } =
        action.payload.data;
      const userId = action.meta.arg;

      // Update in users list
      state.users = state.users.map((user) =>
        user._id === userId ? { ...user, isFollowing, followersCount } : user
      );

      // Update current user if it's the same
      if (state.currentUser?._id === userId) {
        state.currentUser = {
          ...state.currentUser,
          isFollowing,
          followersCount,
        };
      }
    });

    // Fetch Followers
    builder
      .addCase(fetchFollowers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle followers data as needed
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch followers";
      });

    // Fetch Following
    builder
      .addCase(fetchFollowing.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle following data as needed
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch following";
      });

    // Fetch Suggestions
    builder
      .addCase(fetchSuggestions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data;
      })
      .addCase(fetchSuggestions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch suggestions";
      });
  },
});

export const { clearError, clearCurrentUser, setUsers } = usersSlice.actions;
export default usersSlice.reducer;
