"use client";

import React, { useState } from "react";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import CreatePollModal from "./CreatePollModal";

interface AddPollButtonProps {
  discussionId: string;
  hasPoll: boolean;
}

const AddPollButton: React.FC<AddPollButtonProps> = ({ discussionId, hasPoll }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentDiscussion } = useAppSelector((state) => state.discussions);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAuthor = currentDiscussion?.author._id === user?._id;
  const canAddPoll = isAuthor && !hasPoll;

  if (!canAddPoll) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
      >
        <BarChart3 className="w-4 h-4" />
        Add Poll
      </Button>

      <CreatePollModal
        discussionId={discussionId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default AddPollButton;
