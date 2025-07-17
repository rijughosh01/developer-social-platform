import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { AuthState, User, ApiResponse } from '@/types'
import { api } from '@/lib/api'

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  isLoading: false,
  error: null,
}

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    username: string
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const response = await api.post<ApiResponse<User>>('/auth/register', userData)
    return response.data
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<User>>('/auth/login', credentials)
    return response.data
  }
)

export const getProfile = createAsyncThunk('auth/getProfile', async () => {
  const response = await api.get<ApiResponse<User>>('/auth/profile')
  return response.data
})

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>('/auth/profile', profileData)
    return response.data
  }
)

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<ApiResponse>('/auth/change-password', passwordData)
    return response.data
  }
)

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email })
    return response.data
  }
)

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ resetToken, password }: { resetToken: string; password: string }) => {
    const response = await api.put<ApiResponse>(`/auth/reset-password/${resetToken}`, {
      password,
    })
    return response.data
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
    },
    clearError: (state) => {
      state.error = null
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload)
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data
        state.token = action.payload.data.token
        state.isAuthenticated = true
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.data.token)
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Registration failed'
      })

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data
        state.token = action.payload.data.token
        state.isAuthenticated = true
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.data.token)
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
      })

    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data
        state.isAuthenticated = true
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to get profile'
        state.isAuthenticated = false
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      })

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.data
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to update profile'
      })

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to change password'
      })

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to send reset email'
      })

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to reset password'
      })
  },
})

export const { logout, clearError, setToken } = authSlice.actions
export default authSlice.reducer 