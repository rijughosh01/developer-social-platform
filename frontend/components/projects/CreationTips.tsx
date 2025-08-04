"use client";

import React from "react";
import { FiInfo } from "react-icons/fi";

interface CreationTipsProps {
  step: number;
}

const TIPS = {
  1: [
    "Be specific and descriptive in your project title",
    "Include key features and technologies in your description",
    "A good description helps others understand your project quickly",
  ],
  2: [
    "Choose the category that best represents your project type",
    "Set the status to reflect your current development stage",
    "You can always update the status later as your project progresses",
  ],
  3: [
    "List the main technologies and frameworks you used",
    "Include both frontend and backend technologies",
    "Add relevant tags to help others discover your project",
  ],
  4: [
    "Add a high-quality project image to make it stand out",
    "Include screenshots to showcase your project's features",
    "Invite collaborators if you worked with a team",
  ],
};

export default function CreationTips({ step }: CreationTipsProps) {
  const currentTips = TIPS[step as keyof typeof TIPS] || [];

  if (currentTips.length === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Pro Tips for Step {step}
          </h4>
          <ul className="space-y-1">
            {currentTips.map((tip, index) => (
              <li
                key={index}
                className="text-sm text-blue-800 flex items-start gap-2"
              >
                <FiInfo className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
