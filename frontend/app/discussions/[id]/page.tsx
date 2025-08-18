"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { fetchDiscussion } from "@/store/slices/discussionsSlice";
import { DiscussionDetail } from "@/components/discussions/DiscussionDetail";

export default function DiscussionDetailPage() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const { currentDiscussion, isLoading, error } = useAppSelector(
    (state) => state.discussions
  );
  const [isInitialized, setIsInitialized] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (id && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchDiscussion(id as string));
      setIsInitialized(true);
    }
  }, [dispatch, id]);

  useEffect(() => {
    hasFetched.current = false;
  }, [id]);

  // Show loading while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentDiscussion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Discussion not found
          </h2>
          <p className="text-gray-600">
            The discussion you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return <DiscussionDetail discussion={currentDiscussion} />;
}