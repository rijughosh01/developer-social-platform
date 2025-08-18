"use client";

import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppDispatch";
import { votePoll, removePollVote } from "@/store/slices/discussionsSlice";
import { Poll as PollType } from "@/types";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, BarChart3, Clock, Trash2 } from "lucide-react";
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {poll.question}
          </h3>
        </div>
        {isAuthor && onDeletePoll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDeletePoll}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {poll.expiresAt && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Clock className="w-4 h-4" />
          <span>
            {isExpired ? "Expired" : "Expires"}{" "}
            {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
          </span>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {poll.options.map((option, index) => {
          const isSelected = selectedOptions.includes(index);
          const hasUserVoted = option.votes.includes(user?._id || "");
          const percentage = getPercentage(option.voteCount);
          const isHighest =
            option.voteCount === highestVoteCount && highestVoteCount > 0;

          return (
            <div
              key={option._id}
              className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                isActive
                  ? "hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : ""
              } ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-600"
              }`}
              onClick={() => handleOptionClick(index)}
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {poll.isMultipleChoice ? (
                    isSelected ? (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400" />
                    )
                  ) : isSelected ? (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {option.text}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                      {option.voteCount} vote{option.voteCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {poll.totalVotes > 0 && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isHighest ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {percentage}%
                    </span>
                    {hasUserVoted && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Your vote
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {poll.totalVotes} total vote{poll.totalVotes !== 1 ? "s" : ""}
          {poll.isMultipleChoice && " • Multiple choice"}
        </div>

        {user && isActive && (
          <div className="flex gap-2">
            {hasVoted ? (
              <Button
                onClick={handleRemoveVote}
                disabled={isVoting}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isVoting ? "Removing..." : "Remove Vote"}
              </Button>
            ) : (
              <Button
                onClick={handleVote}
                disabled={isVoting || selectedOptions.length === 0}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isVoting ? "Voting..." : "Submit Vote"}
              </Button>
            )}
          </div>
        )}

        {!isActive && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Poll {isExpired ? "expired" : "closed"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Poll;
