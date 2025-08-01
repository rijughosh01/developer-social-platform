"use client";

import React, { useState, useEffect } from "react";
import { Bot, X } from "lucide-react";
import AIChatbot from "./AIChatbot";

interface AIChatButtonProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const AIChatButton: React.FC<AIChatButtonProps> = ({
  className = "",
  position = "bottom-right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} z-40 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 flex items-center justify-center ${className}`}
        aria-label="Open AI Chat Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* AI Chatbot Modal */}
      <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AIChatButton;
