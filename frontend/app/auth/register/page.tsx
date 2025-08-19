"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import {
  requestEmailVerification,
  verifyEmailOTP,
  completeRegistration,
  clearError,
} from "@/store/slices/authSlice";
import { Button } from "@/components/ui/button";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiUser,
  FiUserCheck,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface OTPForm {
  otp: string;
}

type RegistrationStep = "form" | "otp" | "password";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationData, setRegistrationData] = useState<
    Partial<RegisterForm>
  >({});
  const [verifiedEmail, setVerifiedEmail] = useState("");

  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const {
    register: registerForm,
    handleSubmit: handleFormSubmit,
    watch: watchForm,
    formState: { errors: formErrors },
  } = useForm<RegisterForm>();

  const {
    register: registerOTP,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
  } = useForm<OTPForm>();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    formState: { errors: passwordErrors },
  } = useForm<{ password: string; confirmPassword: string }>();

  const password = watchPassword("password");

  // Step 1: Submit initial form and request email verification
  const onSubmitForm = async (data: RegisterForm) => {
    try {
      dispatch(clearError());
      const { password, confirmPassword, ...verificationData } = data;
      setRegistrationData(data);

      await dispatch(requestEmailVerification(verificationData)).unwrap();
      setVerifiedEmail(data.email);
      setCurrentStep("otp");
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error?.message ||
        error ||
        "Failed to send verification code. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Step 2: Verify OTP
  const onSubmitOTP = async (data: OTPForm) => {
    try {
      dispatch(clearError());
      await dispatch(
        verifyEmailOTP({ email: verifiedEmail, otp: data.otp })
      ).unwrap();
      setCurrentStep("password");
      toast.success("Email verified successfully!");
    } catch (error: any) {
      console.error("OTP verification error:", error);
      const errorMessage =
        error?.message ||
        error ||
        "Invalid verification code. Please try again.";
      toast.error(errorMessage);
    }
  };

  // Step 3: Complete registration with password
  const onSubmitPassword = async (data: {
    password: string;
    confirmPassword: string;
  }) => {
    try {
      dispatch(clearError());
      if (
        registrationData.username &&
        registrationData.email &&
        registrationData.firstName &&
        registrationData.lastName
      ) {
        const completeData = {
          username: registrationData.username,
          email: registrationData.email,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          password: data.password,
        };

        await dispatch(completeRegistration(completeData)).unwrap();
        toast.success("Account created successfully! Welcome to DevLink!");
        router.push("/dashboard");
      } else {
        toast.error("Registration data is incomplete. Please start over.");
      }
    } catch (error: any) {
      console.error("Complete registration error:", error);
      const errorMessage =
        error?.message || error || "Registration failed. Please try again.";
      toast.error(errorMessage);
    }
  };

  const handleResendOTP = async () => {
    try {
      dispatch(clearError());
      const { password, confirmPassword, ...verificationData } =
        registrationData;
      if (
        verificationData.username &&
        verificationData.email &&
        verificationData.firstName &&
        verificationData.lastName
      ) {
        await dispatch(
          requestEmailVerification({
            username: verificationData.username,
            email: verificationData.email,
            firstName: verificationData.firstName,
            lastName: verificationData.lastName,
          })
        ).unwrap();
        toast.success("New verification code sent!");
      } else {
        toast.error("Registration data is incomplete. Please start over.");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      const errorMessage =
        error?.message || error || "Failed to resend verification code.";
      toast.error(errorMessage);
    }
  };

  const goBack = () => {
    if (currentStep === "otp") {
      setCurrentStep("form");
    } else if (currentStep === "password") {
      setCurrentStep("otp");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <span className="text-2xl font-bold text-primary-600">DL</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {currentStep === "form" && "Create your account"}
            {currentStep === "otp" && "Verify your email"}
            {currentStep === "password" && "Set your password"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {currentStep === "form" && (
              <>
                Or{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  sign in to your existing account
                </Link>
              </>
            )}
            {currentStep === "otp" &&
              "Enter the 6-digit code sent to your email"}
            {currentStep === "password" &&
              "Create a secure password for your account"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Registration Form */}
        {currentStep === "form" && (
          <form
            className="mt-8 space-y-6"
            onSubmit={handleFormSubmit(onSubmitForm)}
          >
            <div className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="sr-only">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm("username", {
                      required: "Username is required",
                      minLength: {
                        value: 3,
                        message: "Username must be at least 3 characters",
                      },
                      maxLength: {
                        value: 30,
                        message: "Username must be less than 30 characters",
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_]+$/,
                        message:
                          "Username can only contain letters, numbers, and underscores",
                      },
                    })}
                    id="username"
                    type="text"
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Username"
                  />
                </div>
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.username.message}
                  </p>
                )}
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUserCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm("firstName", {
                      required: "First name is required",
                      maxLength: {
                        value: 50,
                        message: "First name must be less than 50 characters",
                      },
                    })}
                    id="firstName"
                    type="text"
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="First Name"
                  />
                </div>
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUserCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm("lastName", {
                      required: "Last name is required",
                      maxLength: {
                        value: 50,
                        message: "Last name must be less than 50 characters",
                      },
                    })}
                    id="lastName"
                    type="text"
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Last Name"
                  />
                </div>
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerForm("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    id="email"
                    type="email"
                    className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {formErrors.email.message}
                  </p>
                )}
              </div>
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
                    <span>Sending verification...</span>
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {currentStep === "otp" && (
          <div className="mt-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiMail className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    We've sent a verification code to{" "}
                    <strong>{verifiedEmail}</strong>
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleOTPSubmit(onSubmitOTP)} className="space-y-4">
              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification Code
                </label>
                <input
                  {...registerOTP("otp", {
                    required: "Verification code is required",
                    minLength: {
                      value: 6,
                      message: "Verification code must be 6 digits",
                    },
                    maxLength: {
                      value: 6,
                      message: "Verification code must be 6 digits",
                    },
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "Please enter a valid 6-digit code",
                    },
                  })}
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                  placeholder="000000"
                />
                {otpErrors.otp && (
                  <p className="mt-1 text-sm text-red-600">
                    {otpErrors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={goBack}
                  variant="outline"
                  className="flex-1"
                >
                  <FiArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-sm text-primary-600 hover:text-primary-500 disabled:opacity-50"
              >
                Didn't receive the code? Resend
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Password Setup */}
        {currentStep === "password" && (
          <div className="mt-8 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Email verified successfully! Now set your password to
                    complete registration.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit(onSubmitPassword)}
              className="space-y-4"
            >
              {/* Password */}
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerPassword("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerPassword("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value) =>
                        value === password || "Passwords do not match",
                    })}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="appearance-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Confirm Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={goBack}
                  variant="outline"
                  className="flex-1"
                >
                  <FiArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
