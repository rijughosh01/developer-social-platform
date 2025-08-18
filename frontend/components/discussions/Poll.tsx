"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { votePoll, removePollVote } from "@/store/slices/discussionsSlice";
import { Poll as PollType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Circle,
  BarChart3,
  Clock,
  Trash2,
  Users,
  TrendingUp,
  Award,
  Sparkles,
  Zap,
  Vote,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PollProps {
  poll: PollType;
  discussionId: string;
  isAuthor: boolean;
  onDeletePoll?: () => void;
}

const Poll: React.FC<PollProps> = ({
  poll,
  discussionId,
  isAuthor,
  onDeletePoll,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [selectedOptions, setSelectedOptions] = useState<number[]>(
    poll.userVotes || []
  );
  const [isVoting, setIsVoting] = useState(false);

  const hasVoted = poll.hasVoted || false;
  const isExpired = poll.expiresAt && new Date() > new Date(poll.expiresAt);
  const isActive = poll.isActive && !isExpired;

  const handleOptionClick = (optionIndex: number) => {
    if (!isActive || !user) return;

    if (poll.isMultipleChoice) {
      setSelectedOptions((prev) => {
        if (prev.includes(optionIndex)) {
          return prev.filter((index) => index !== optionIndex);
        } else {
          return [...prev, optionIndex];
        }
      });
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const handleVote = async () => {
    if (!user || selectedOptions.length === 0 || !isActive) return;

    setIsVoting(true);
    try {
      await dispatch(
        votePoll({
          discussionId,
          optionIndexes: selectedOptions,
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!user || !hasVoted) return;

    setIsVoting(true);
    try {
      await dispatch(removePollVote(discussionId)).unwrap();
      setSelectedOptions([]);
    } catch (error) {
      console.error("Failed to remove vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const getPercentage = (voteCount: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((voteCount / poll.totalVotes) * 100);
  };

  const getHighestVoteCount = () => {
    return Math.max(...poll.options.map((option) => option.voteCount));
  };

  const highestVoteCount = getHighestVoteCount();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1 leading-tight">
              {poll.question}
            </h3>
          </div>
        </div>

        {isAuthor && onDeletePoll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeletePoll}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg p-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Expiry info */}
      {poll.expiresAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded-lg">
          <Clock className="w-3 h-3" />
          <span>
            {isExpired ? "Poll expired" : "Expires"}{" "}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </span>
          {!isExpired && (
            <div className="ml-auto">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      )}

      {/* Poll Options */}
      <div className="space-y-2 mb-4">
        {poll.options.map((option, index) => {
          const isSelected = selectedOptions.includes(index);
          const hasUserVoted = option.votes.includes(user?._id || "");
          const percentage = getPercentage(option.voteCount);
          const isHighest =
            option.voteCount === highestVoteCount && highestVoteCount > 0;

          return (
            <div
              key={option._id}
              className={`group cursor-pointer transition-all duration-300 ${
                isActive ? "hover:scale-[1.02]" : ""
              }`}
              onClick={() => handleOptionClick(index)}
            >
              <div
                className={`relative p-3 rounded-xl transition-all duration-300 overflow-hidden ${
                  poll.totalVotes > 0
                    ? "bg-gray-100 text-gray-900"
                    : "bg-gray-50 text-gray-900"
                }`}
              >
                {/* Background progress bar */}
                {poll.totalVotes > 0 && (
                  <div
                    className={`absolute inset-0 transition-all duration-500 ease-out rounded-xl ${
                      isHighest
                        ? "bg-green-400"
                        : percentage >= 50
                        ? "bg-blue-400"
                        : percentage >= 30
                        ? "bg-purple-400"
                        : percentage >= 15
                        ? "bg-orange-400"
                        : percentage >= 5
                        ? "bg-yellow-400"
                        : "bg-red-300"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                {/* Content */}
                <div className="relative flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    {/* Selection indicator */}
                    <div className="flex-shrink-0">
                      {poll.isMultipleChoice ? (
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? "border-green-500 bg-green-500"
                              : "border-gray-400 bg-white/80"
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                      ) : (
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? "border-green-500 bg-green-500"
                              : "border-gray-400 bg-white/80"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Option text */}
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isSelected
                          ? "text-green-700 font-semibold"
                          : "text-gray-900"
                      }`}
                    >
                      {option.text}
                    </span>
                  </div>

                  {/* Vote count and percentage */}
                  <div className="flex items-center gap-2">
                    {hasUserVoted && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-600 text-white rounded-full text-xs font-medium shadow-sm">
                        <Award className="w-2.5 h-2.5" />
                        <span>Your vote</span>
                      </div>
                    )}
                    <div className="text-right">
                      <div
                        className={`text-sm font-semibold ${
                          isSelected ? "text-green-700" : "text-gray-900"
                        }`}
                      >
                        {option.voteCount}
                      </div>
                      <div
                        className={`text-xs ${
                          isSelected ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="font-medium">{poll.totalVotes} total votes</span>
          </div>
          {poll.isMultipleChoice && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Multiple choice enabled</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {user && isActive && (
          <div className="flex gap-2">
            {hasVoted ? (
              <Button
                onClick={handleRemoveVote}
                disabled={isVoting}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs px-3 py-1.5 h-8"
              >
                {isVoting ? "Removing..." : "Remove Vote"}
              </Button>
            ) : (
              <Button
                onClick={handleVote}
                disabled={isVoting || selectedOptions.length === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs px-3 py-1.5 h-8"
              >
                {isVoting ? "Voting..." : "Submit Vote"}
              </Button>
            )}
          </div>
        )}

        {!isActive && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span>Poll {isExpired ? "expired" : "closed"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Poll;
