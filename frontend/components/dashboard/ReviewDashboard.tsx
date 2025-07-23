"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { api } from "@/lib/api";
import {
  FiMessageSquare,
  FiStar,
  FiClock,
  FiCheck,
  FiX,
  FiEye,
} from "react-icons/fi";
import toast from "react-hot-toast";

interface ReviewRequest {
  _id: string;
  post: {
    _id: string;
    title: string;
    code: string;
    codeLanguage: string;
    author: {
      _id: string;
      firstName: string;
      lastName: string;
      username: string;
    };
  };
  reviewer: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  comment: string;
  rating: number;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
  response?: string;
  requesterReply?: string;
}

export function ReviewDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [reviewRequests, setReviewRequests] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "completed" | "rejected"
  >("all");
  const [selectedReview, setSelectedReview] = useState<ReviewRequest | null>(
    null
  );
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewResponse, setReviewResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requesterReply, setRequesterReply] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    fetchReviewRequests();
  }, []);

  const fetchReviewRequests = async () => {
    try {
      const response = await api.get("/posts/review-requests");
      setReviewRequests(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch review requests");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewResponse = async (
    reviewId: string,
    status: "completed" | "rejected"
  ) => {
    if (!reviewResponse.trim()) {
      toast.error("Please add a response comment");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/posts/review-requests/${reviewId}`, {
        status,
        response: reviewResponse,
      });

      toast.success(
        `Review ${
          status === "completed" ? "completed" : "rejected"
        } successfully`
      );
      setShowReviewModal(false);
      setReviewResponse("");
      setSelectedReview(null);
      fetchReviewRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to update review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequesterReply = async (reviewId: string) => {
    if (!requesterReply.trim()) {
      toast.error("Please enter your reply");
      return;
    }
    setIsReplying(true);
    try {
      await api.put(`/posts/review-requests/${reviewId}/requester-reply`, {
        requesterReply,
      });
      toast.success("Reply sent!");
      setRequesterReply("");
      fetchReviewRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FiClock className="h-4 w-4" />;
      case "completed":
        return <FiCheck className="h-4 w-4" />;
      case "rejected":
        return <FiX className="h-4 w-4" />;
      default:
        return <FiMessageSquare className="h-4 w-4" />;
    }
  };

  const filteredReviews = reviewRequests.filter((review) => {
    if (filter === "all") return true;
    return review.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Code Review Dashboard
        </h2>
        <div className="flex gap-2">
          {["all", "pending", "completed", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                filter === status
                  ? "bg-primary-600 text-white"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Review Requests */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <FiMessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No review requests
            </h3>
            <p className="text-gray-500">
              {filter === "all"
                ? "You don't have any review requests yet."
                : `No ${filter} review requests found.`}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const isPostAuthor = user?._id === review.post.author._id;
            return (
              <div
                key={review._id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {review.post.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          review.status
                        )}`}
                      >
                        {getStatusIcon(review.status)}
                        {review.status.charAt(0).toUpperCase() +
                          review.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <span>Requested by:</span>
                        <span className="font-medium">
                          {review.reviewer.firstName} {review.reviewer.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Rating:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar
                              key={star}
                              className={`h-3 w-3 ${
                                star <= review.rating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Language:</span>
                        <span className="font-medium">
                          {review.post.codeLanguage}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-700">{review.comment}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        Requested{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Response */}
                  {review.response && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                      <div className="text-xs text-blue-700 font-semibold mb-1">
                        Reviewer Response:
                      </div>
                      <div className="text-sm text-blue-900">
                        {review.response}
                      </div>
                    </div>
                  )}
                  {/* Requester Reply */}
                  {review.requesterReply && (
                    <div className="bg-green-50 rounded-lg p-3 mb-2">
                      <div className="text-xs text-green-700 font-semibold mb-1">
                        Your Reply:
                      </div>
                      <div className="text-sm text-green-900">
                        {review.requesterReply}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedReview(review);
                      setShowReviewModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                  >
                    <FiEye className="h-4 w-4" />
                    View Code
                  </button>

                  {review.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleReviewResponse(review._id, "completed")
                        }
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FiCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleReviewResponse(review._id, "rejected")
                        }
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Review Response Modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Code Review Response</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Original Request
                </h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    {selectedReview.comment}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Code to Review
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{selectedReview.post.code}</code>
                  </pre>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={reviewResponse}
                  onChange={(e) => setReviewResponse(e.target.value)}
                  placeholder="Provide your feedback, suggestions, or comments..."
                  rows={4}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleReviewResponse(selectedReview._id, "completed")
                  }
                  disabled={isSubmitting || !reviewResponse.trim()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Approve Review"}
                </button>
                <button
                  onClick={() =>
                    handleReviewResponse(selectedReview._id, "rejected")
                  }
                  disabled={isSubmitting || !reviewResponse.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Reject Review"}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
