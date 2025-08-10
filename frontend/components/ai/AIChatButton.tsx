"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, X, GripVertical, Sparkles, Zap } from "lucide-react";
import AIChatbot from "./AIChatbot";

interface AIChatButtonProps {
  className?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

interface Position {
  x: number;
  y: number;
}

const AIChatButton: React.FC<AIChatButtonProps> = ({
  className = "",
  position = "bottom-left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [showDragHint, setShowDragHint] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    // Load saved position from localStorage
    const savedPosition = localStorage.getItem("aiChatButtonPosition");
    if (savedPosition) {
      setButtonPosition(JSON.parse(savedPosition));
    } else {
      // Set default position based on prop
      const defaultPosition = getDefaultPosition(position);
      setButtonPosition(defaultPosition);
    }

    // Show drag hint for first-time users
    const hasSeenDragHint = localStorage.getItem("aiChatDragHintSeen");
    if (!hasSeenDragHint) {
      setTimeout(() => {
        setShowDragHint(true);
        localStorage.setItem("aiChatDragHintSeen", "true");
      }, 2000);
    }
  }, [position]);

  const getDefaultPosition = (pos: string): Position => {
    const padding = 24;
    const buttonSize = 72;

    switch (pos) {
      case "bottom-right":
        return {
          x: window.innerWidth - buttonSize - padding,
          y: window.innerHeight - buttonSize - padding,
        };
      case "bottom-left":
        return { x: padding, y: window.innerHeight - buttonSize - padding };
      case "top-right":
        return { x: window.innerWidth - buttonSize - padding, y: padding };
      case "top-left":
        return { x: padding, y: padding };
      default:
        return { x: padding, y: window.innerHeight - buttonSize - padding };
    }
  };

  const savePosition = (pos: Position) => {
    localStorage.setItem("aiChatButtonPosition", JSON.stringify(pos));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - 72;
    const maxY = window.innerHeight - 72;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    const newPosition = { x: constrainedX, y: constrainedY };
    setButtonPosition(newPosition);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragOffset.x;
    const newY = touch.clientY - dragOffset.y;

    const maxX = window.innerWidth - 72;
    const maxY = window.innerHeight - 72;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    const newPosition = { x: constrainedX, y: constrainedY };
    setButtonPosition(newPosition);

    if (isDragging) {
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(buttonPosition);
    }
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(buttonPosition);
    }
  };

  const handleDoubleClick = () => {
    const defaultPosition = getDefaultPosition(position);
    setButtonPosition(defaultPosition);
    savePosition(defaultPosition);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd, {
        passive: false,
      });

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const maxX = window.innerWidth - 72;
      const maxY = window.innerHeight - 72;

      const constrainedX = Math.max(0, Math.min(buttonPosition.x, maxX));
      const constrainedY = Math.max(0, Math.min(buttonPosition.y, maxY));

      const newPosition = { x: constrainedX, y: constrainedY };
      setButtonPosition(newPosition);
      savePosition(newPosition);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [buttonPosition]);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Draggable Floating Button */}
      <button
        ref={buttonRef}
        onClick={() => !isDragging && setIsOpen(true)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className={`fixed z-40 w-16 h-16 sm:w-18 sm:h-18 bg-white/90 backdrop-blur-xl border border-white/20 text-gray-700 rounded-2xl sm:rounded-3xl shadow-2xl hover:shadow-3xl transform transition-all duration-300 flex items-center justify-center group ${className} ${
          isDragging
            ? "scale-110 shadow-3xl rotate-3"
            : isHovered
            ? "scale-105 hover:shadow-3xl"
            : "hover:scale-105"
        } ${!isDragging && !isOpen ? "animate-pulse" : ""}`}
        aria-label="Open AI Chat Assistant"
        title="Drag to move • Click to open AI Assistant • Double-click to reset position"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl" />

        {/* Main content */}
        <div className="relative z-10 flex items-center justify-center">
          {isOpen ? (
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-700 group-hover:text-gray-900 transition-colors duration-200" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-gray-700 group-hover:text-gray-900 transition-colors duration-200" />

              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" />
            </div>
          )}

          {/* Drag indicator */}
          <GripVertical
            className={`absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400/60 transition-all duration-200 ${
              isDragging
                ? "opacity-100 scale-110"
                : "opacity-0 group-hover:opacity-60"
            }`}
          />
        </div>

        <div
          className={`absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl transition-opacity duration-300 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>

      {/* AI Chatbot Modal */}
      <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Modern Drag Hint Tooltip */}
      {showDragHint && (
        <div
          style={{
            left: `${buttonPosition.x + 70}px`,
            top: `${buttonPosition.y}px`,
          }}
          className="fixed z-50 bg-white/95 backdrop-blur-xl border border-white/20 text-gray-700 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl shadow-2xl max-w-[200px] sm:max-w-xs animate-fade-in"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center">
              <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800 text-xs sm:text-sm">
                Drag me anywhere!
              </div>
              <div className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                Double-click to reset position
              </div>
            </div>
            <button
              onClick={() => setShowDragHint(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </button>
          </div>

          {/* Arrow pointing to button */}
          <div className="absolute left-0 top-1/2 transform -translate-x-2 -translate-y-1/2 w-0 h-0 border-l-0 border-r-6 sm:border-r-8 border-t-3 sm:border-t-4 border-b-3 sm:border-b-4 border-transparent border-r-white/95" />
        </div>
      )}
    </>
  );
};

export default AIChatButton;
