import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatRelativeTime(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}

export function generateInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getAvatarUrl(user?: {
  avatar?: string;
  firstName?: string;
  lastName?: string;
}) {
  if (!user) {
    return `https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=128`;
  }

  if (user.avatar) {
    return user.avatar;
  }

  const firstName = user.firstName || "User";
  const lastName = user.lastName || "";
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName
  )}&background=3b82f6&color=fff&size=128`;
}

export function isUserOnline(lastSeen: string | Date): boolean {
  if (!lastSeen) return false;

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  return diffInMinutes <= 5;
}

export const formatCost = (cost: number): string => {
  if (cost < 0.01) {
    return `$${cost.toFixed(6)}`;
  }
  return `$${cost.toFixed(2)}`;
};

export const parseAIError = (error: any): string => {
  if (typeof error === "string") {
    return error;
  }

  const errorMessage =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "An unexpected error occurred";

  if (errorMessage.includes("Daily token limit exceeded")) {
    const match = errorMessage.match(/for (\w+) today/);
    const model = match ? match[1] : "this model";
    return `Daily token limit exceeded for ${model}. Your limits reset at midnight.`;
  }

  if (errorMessage.includes("Rate limit exceeded")) {
    return "You're sending messages too quickly. Please wait a moment before trying again.";
  }

  if (errorMessage.includes("Premium subscription required")) {
    return "This model requires a premium subscription. Please upgrade or switch to a free model.";
  }

  if (errorMessage.includes("Invalid model")) {
    return "The selected AI model is not available. Please choose a different model.";
  }

  if (errorMessage.includes("Authentication required")) {
    return "Please log in to use the AI features.";
  }

  if (
    errorMessage.includes("Network Error") ||
    errorMessage.includes("Failed to fetch")
  ) {
    return "Network connection error. Please check your internet connection and try again.";
  }

  return errorMessage;
};
