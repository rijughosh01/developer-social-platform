"use client";

import React from "react";
import { Flag, AlertTriangle, Info } from "lucide-react";
import { Discussion, DiscussionComment } from "@/types";

interface FlagStatusProps {
  content: Discussion | DiscussionComment;
  contentType: "discussion" | "comment";
  className?: string;
}

export function FlagStatus({ content, contentType, className = "" }: FlagStatusProps) {
  if (!content.flags || content.flags.length === 0) {
    return null;
  }

  const flagCount = content.flags.length;
  const reasons = content.flags.map(flag => flag.reason);
  const uniqueReasons = [...new Set(reasons)];
  
  const getFlagSeverity = (reasons: string[]) => {
    if (reasons.includes("offensive")) return "high";
    if (reasons.includes("inappropriate")) return "medium";
    if (reasons.includes("spam")) return "low";
    return "medium";
  };

  const severity = getFlagSeverity(uniqueReasons);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "low":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Flag className="w-4 h-4" />;
      case "low":
        return <Info className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  const formatReason = (reason: string) => {
    return reason.charAt(0).toUpperCase() + reason.slice(1).replace(/_/g, ' ');
  };

  return (
    <div className={`rounded-lg border p-3 ${getSeverityColor(severity)} ${className}`}>
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(severity)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="text-sm font-semibold">
              {contentType === "discussion" ? "Discussion" : "Comment"} Flagged
            </h4>
            <span className="text-xs px-2 py-1 rounded-full bg-white/50 font-medium">
              {flagCount} {flagCount === 1 ? "flag" : "flags"}
            </span>
          </div>
          <p className="text-sm mb-2">
            This {contentType} has been flagged by community members for the following reasons:
          </p>
          <div className="space-y-1">
            {uniqueReasons.map((reason, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
                <span className="text-sm font-medium">
                  {formatReason(reason)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-2 opacity-75">
            Community moderators will review this content and take appropriate action if necessary.
          </p>
        </div>
      </div>
    </div>
  );
}
