import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User, ApiResponse } from "@/types";
import { api } from "@/lib/api";

const initialState: AuthState = {
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isAuthenticated:
    typeof window !== "undefined" ? !!localStorage.getItem("token") : false,
  isLoading: false,
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  "auth/register",
  async (
    userData: {
      username: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // Step 1: Request email verification
      await api.post<ApiResponse>("/auth/request-email-verification", {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });

      return {
        success: true,
        message: "Please check your email for verification code",
        step: "verification_sent",
        email: userData.email,
      };
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 400) {
        return rejectWithValue("Please check your input data");
      } else if (error.response?.status === 409) {
        return rejectWithValue("User already exists");
      } else if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait before trying again."
        );
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection");
      } else {
        return rejectWithValue("Registration failed. Please try again");
      }
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<ApiResponse<User>>(
        "/auth/login",
        credentials
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 401) {
        return rejectWithValue("Invalid email or password");
      } else if (error.response?.status === 400) {
        return rejectWithValue("Please check your email format");
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection");
      } else {
        return rejectWithValue("Login failed. Please try again");
      }
    }
  }
);

export const getProfile = createAsyncThunk("auth/getProfile", async () => {
  const response = await api.get<ApiResponse<User>>("/auth/profile");
  return response.data;
});

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData: Partial<User>) => {
    const response = await api.put<ApiResponse<User>>(
      "/auth/profile",
      profileData
    );
    return response.data;
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData: { currentPassword: string; newPassword: string }) => {
    const response = await api.put<ApiResponse>(
      "/auth/change-password",
      passwordData
    );
    return response.data;
  }
);

export const requestOTP = createAsyncThunk(
  "auth/requestOTP",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse>("/auth/request-otp", {
        email,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 404) {
        return rejectWithValue(
          "Email not found. Please check your email address."
        );
      } else if (error.response?.status === 400) {
        return rejectWithValue("Please enter a valid email address.");
      } else if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait before trying again."
        );
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later.");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection.");
      } else {
        return rejectWithValue("Failed to send OTP. Please try again.");
      }
    }
  }
);

export const verifyOTPResetPassword = createAsyncThunk(
  "auth/verifyOTPResetPassword",
  async (
    {
      email,
      otp,
      newPassword,
    }: { email: string; otp: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<ApiResponse>(
        "/auth/verify-otp-reset-password",
        {
          email,
          otp,
          newPassword,
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 400) {
        return rejectWithValue("Invalid OTP or password. Please try again.");
      } else if (error.response?.status === 404) {
        return rejectWithValue("User not found.");
      } else if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many attempts. Please wait before trying again."
        );
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later.");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection.");
      } else {
        return rejectWithValue("Failed to reset password. Please try again.");
      }
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse>("/auth/forgot-password", {
        email,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 404) {
        return rejectWithValue(
          "Email not found. Please check your email address."
        );
      } else if (error.response?.status === 400) {
        return rejectWithValue("Please enter a valid email address.");
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later.");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection.");
      } else {
        return rejectWithValue("Failed to send reset email. Please try again.");
      }
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({
    resetToken,
    password,
  }: {
    resetToken: string;
    password: string;
  }) => {
    const response = await api.put<ApiResponse>(
      `/auth/reset-password/${resetToken}`,
      {
        password,
      }
    );
    return response.data;
  }
);

// Request email verification for registration
export const requestEmailVerification = createAsyncThunk(
  "auth/requestEmailVerification",
  async (
    userData: {
      username: string;
      email: string;
      firstName: string;
      lastName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<ApiResponse>(
        "/auth/request-email-verification",
        userData
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 400) {
        return rejectWithValue("Please check your input data");
      } else if (error.response?.status === 409) {
        return rejectWithValue("User already exists");
      } else if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many requests. Please wait before trying again."
        );
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection");
      } else {
        return rejectWithValue(
          "Failed to send verification email. Please try again"
        );
      }
    }
  }
);

// Verify email OTP for registration
export const verifyEmailOTP = createAsyncThunk(
  "auth/verifyEmailOTP",
  async (
    { email, otp }: { email: string; otp: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<ApiResponse>("/auth/verify-email-otp", {
        email,
        otp,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 400) {
        return rejectWithValue("Invalid OTP. Please try again.");
      } else if (error.response?.status === 429) {
        return rejectWithValue(
          "Too many attempts. Please wait before trying again."
        );
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection");
      } else {
        return rejectWithValue("Failed to verify OTP. Please try again");
      }
    }
  }
);

// Complete registration after email verification
export const completeRegistration = createAsyncThunk(
  "auth/completeRegistration",
  async (
    userData: {
      username: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<ApiResponse<User>>(
        "/auth/complete-registration",
        userData
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        return rejectWithValue(error.response.data.message);
      } else if (error.response?.status === 400) {
        return rejectWithValue(
          "Please verify your email first or check your input data"
        );
      } else if (error.response?.status === 409) {
        return rejectWithValue("User already exists");
      } else if (error.response?.status === 500) {
        return rejectWithValue("Server error. Please try again later");
      } else if (error.code === "NETWORK_ERROR") {
        return rejectWithValue("Network error. Please check your connection");
      } else {
        return rejectWithValue("Registration failed. Please try again");
      }
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.data.token);
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Registration failed";
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.data.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Login failed";
      });

    // Get Profile
    builder
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.isAuthenticated = true;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to get profile";
        state.isAuthenticated = false;
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
        }
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update profile";
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to change password";
      });

    // Request OTP
    builder
      .addCase(requestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOTP.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to send OTP";
      });

    // Verify OTP Reset Password
    builder
      .addCase(verifyOTPResetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTPResetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyOTPResetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to reset password";
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) || "Failed to send reset email";
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to reset password";
      });

    // Request Email Verification
    builder
      .addCase(requestEmailVerification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestEmailVerification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestEmailVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) || "Failed to send verification email";
      });

    // Verify Email OTP
    builder
      .addCase(verifyEmailOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmailOTP.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyEmailOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to verify OTP";
      });

    // Complete Registration
    builder
      .addCase(completeRegistration.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeRegistration.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.token = action.payload.data.token;
        state.isAuthenticated = true;
        if (typeof window !== "undefined") {
          localStorage.setItem("token", action.payload.data.token);
        }
      })
      .addCase(completeRegistration.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) || "Failed to complete registration";
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
