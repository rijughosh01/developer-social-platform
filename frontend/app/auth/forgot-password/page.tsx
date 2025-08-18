"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { requestOTP, verifyOTPResetPassword } from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import { FiMail, FiArrowLeft, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import toast from "react-hot-toast";

interface RequestOTPForm {
  email: string;
}

interface VerifyOTPForm {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ForgotPasswordPage() {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RequestOTPForm>();

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify },
    watch: watchVerify,
  } = useForm<VerifyOTPForm>();

  const onSubmitRequest = async (data: RequestOTPForm) => {
    try {
      await dispatch(requestOTP(data.email)).unwrap();
      setEmail(data.email);
      setStep("verify");
      toast.success(
        "OTP sent successfully! Check your email for the 6-digit code."
      );
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
    }
  };

  const onSubmitVerify = async (data: VerifyOTPForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await dispatch(
        verifyOTPResetPassword({
          email: data.email,
          otp: data.otp,
          newPassword: data.newPassword,
        })
      ).unwrap();
      toast.success(
        "Password reset successful! You can now log in with your new password."
      );
      // Redirect to login page
      window.location.href = "/auth/login";
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to reset password. Please try again.";
      toast.error(errorMessage);
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <FiLock className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Enter OTP & New Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the 6-digit OTP sent to {email} and your new password.
            </p>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmitVerify(onSubmitVerify)}
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                {...registerVerify("email", {
                  required: "Email is required",
                  value: email,
                })}
                type="email"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Email address"
                readOnly
              />
            </div>

            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                OTP Code
              </label>
              <input
                {...registerVerify("otp", {
                  required: "OTP is required",
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: "OTP must be 6 digits",
                  },
                })}
                type="text"
                maxLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                autoComplete="one-time-code"
              />
              {errorsVerify.otp && (
                <p className="mt-1 text-sm text-red-600">
                  {errorsVerify.otp.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  {...registerVerify("newPassword", {
                    required: "New password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errorsVerify.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errorsVerify.newPassword.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  {...registerVerify("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) =>
                      value === watchVerify("newPassword") ||
                      "Passwords do not match",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errorsVerify.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errorsVerify.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Resetting password...</span>
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>

              <Button
                type="button"
                onClick={() => setStep("request")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              >
                Back to Request OTP
              </Button>
            </div>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiMail className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">OTP Sent</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Check your email for the 6-digit OTP. It will expire in 10
                    minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <span className="text-2xl font-bold text-primary-600">DL</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot your password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a 6-digit OTP to reset
            your password.
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmitRequest)}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address",
                  },
                })}
                id="email"
                type="email"
                className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending OTP...</span>
                </div>
              ) : (
                "Send OTP"
              )}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="flex items-center justify-center text-sm text-primary-600 hover:text-primary-500"
            >
              <FiArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </form>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiMail className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Secure Password Reset
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  We'll send a 6-digit OTP to your email. This code will expire
                  in 10 minutes for your security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
