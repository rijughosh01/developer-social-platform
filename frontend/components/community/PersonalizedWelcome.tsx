"use client";

import { useAppSelector } from "@/hooks/useAppDispatch";
import { FiSmile } from "react-icons/fi";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function PersonalizedWelcome() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const greeting = getTimeOfDayGreeting();

  if (!isAuthenticated || !user) return null;

  return (
    <section className="py-8 bg-gradient-to-r from-blue-50 to-purple-50 mb-4">
      <div className="mx-auto max-w-4xl px-6 flex items-center gap-4 justify-center fade-in-welcome">
        <div className="flex items-center gap-4">
          <span className="icon-bg shadow-md">
            <FiSmile className="h-8 w-8" />
          </span>
          <div>
            <span className="text-2xl font-bold text-gray-900">
              {greeting},{" "}
              <span className="text-primary-600">
                {user.firstName || user.username}
              </span>
              !
            </span>
            <div className="text-base text-gray-600 mt-1">
              We’re glad to see you again. Dive in and connect, share, or
              discover something new today!
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
