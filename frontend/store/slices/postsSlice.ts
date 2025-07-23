import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Post, ApiResponse, PaginationParams } from "@/types";
import { postsAPI } from "@/lib/api";

interface PostsState {
  posts: Post[];
  currentPost: Post | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
}

const initialState: PostsState = {
  posts: [],
  currentPost: null,
  isLoading: false,
  error: null,
  pagination: null,
};

// Async thunks
export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (params?: PaginationParams) => {
    const response = await postsAPI.getPosts(params);
    return response.data;
  }
);

export const fetchPost = createAsyncThunk(
  "posts/fetchPost",
  async (id: string) => {
    const response = await postsAPI.getPost(id);
    return response.data;
  }
);

export const createPost = createAsyncThunk(
  "posts/createPost",
  async (postData: any) => {
    const response = await postsAPI.createPost(postData);
    return response.data;
  }
);

export const updatePost = createAsyncThunk(
  "posts/updatePost",
  async ({ id, data }: { id: string; data: any }) => {
    const response = await postsAPI.updatePost(id, data);
    return response.data;
  }
);

export const deletePost = createAsyncThunk(
  "posts/deletePost",
  async (id: string) => {
    await postsAPI.deletePost(id);
    return id;
  }
);

export const likePost = createAsyncThunk(
  "posts/likePost",
  async (id: string) => {
    const response = await postsAPI.likePost(id);
    return response.data;
  }
);

export const addComment = createAsyncThunk(
  "posts/addComment",
  async ({ id, content }: { id: string; content: string }) => {
    const response = await postsAPI.addComment(id, { content });
    return response.data;
  }
);

export const removeComment = createAsyncThunk(
  "posts/removeComment",
  async ({ id, commentId }: { id: string; commentId: string }) => {
    await postsAPI.removeComment(id, commentId);
    return { id, commentId };
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Posts
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload.data;
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch posts";
      });

    // Fetch Post
    builder
      .addCase(fetchPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload.data;
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch post";
      });

    // Create Post
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts.unshift(action.payload.data);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to create post";
      });

    // Update Post
    builder
      .addCase(updatePost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedPost = action.payload.data;
        state.posts = state.posts.map((post) =>
          post._id === updatedPost._id ? updatedPost : post
        );
        if (state.currentPost?._id === updatedPost._id) {
          state.currentPost = updatedPost;
        }
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update post";
      });

    // Delete Post
    builder
      .addCase(deletePost.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = state.posts.filter((post) => post._id !== action.payload);
        if (state.currentPost?._id === action.payload) {
          state.currentPost = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to delete post";
      });

    // Like Post
    builder.addCase(likePost.fulfilled, (state, action) => {
      const { isLiked, likesCount } = action.payload.data;
      const postId = action.meta.arg;

      // Update in posts list
      state.posts = state.posts.map((post) =>
        post._id === postId ? { ...post, isLiked, likesCount } : post
      );

      // Update current post if it's the same
      if (state.currentPost?._id === postId) {
        state.currentPost = { ...state.currentPost, isLiked, likesCount };
      }
    });

    // Add Comment
    builder.addCase(addComment.fulfilled, (state, action) => {
      const newComment = action.payload.data;
      const postId = action.meta.arg.id;

      // Update in posts list
      state.posts = state.posts.map((post) =>
        post._id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      );

      // Update current post if it's the same
      if (state.currentPost?._id === postId) {
        state.currentPost = {
          ...state.currentPost,
          comments: [...state.currentPost.comments, newComment],
        };
      }
    });

    // Remove Comment
    builder.addCase(removeComment.fulfilled, (state, action) => {
      const { id: postId, commentId } = action.payload;

      // Update in posts list
      state.posts = state.posts.map((post) =>
        post._id === postId
          ? {
              ...post,
              comments: post.comments.filter((c) => c._id !== commentId),
            }
          : post
      );

      // Update current post if it's the same
      if (state.currentPost?._id === postId) {
        state.currentPost = {
          ...state.currentPost,
          comments: state.currentPost.comments.filter(
            (c) => c._id !== commentId
          ),
        };
      }
    });
  },
});

export const { clearError, clearCurrentPost, setPosts } = postsSlice.actions;
export default postsSlice.reducer;
