"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, X, GripVertical } from "lucide-react";
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
    const buttonSize = 64;

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
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;

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

    const maxX = window.innerWidth - 64;
    const maxY = window.innerHeight - 64;

    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    const newPosition = { x: constrainedX, y: constrainedY };
    setButtonPosition(newPosition);
    e.preventDefault();
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
      document.addEventListener("touchend", handleTouchEnd);

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
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

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
        style={{
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        className={`fixed z-40 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transform transition-all duration-200 flex items-center justify-center ${className} ${
          isDragging ? "scale-110 shadow-2xl" : "hover:scale-110"
        } ${!isDragging && !isOpen ? "animate-pulse" : ""}`}
        aria-label="Open AI Chat Assistant"
        title="Drag to move • Click to open AI Assistant • Double-click to reset position"
      >
        <div className="relative">
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-8 h-8" />}
          {/* Drag indicator */}
          <GripVertical
            className={`absolute -bottom-1 -right-1 w-3 h-3 text-white/70 transition-opacity ${
              isDragging ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </button>

      {/* AI Chatbot Modal */}
      <AIChatbot isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Drag Hint Tooltip */}
      {showDragHint && (
        <div
          style={{
            left: `${buttonPosition.x + 80}px`,
            top: `${buttonPosition.y}px`,
          }}
          className="fixed z-50 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-lg max-w-xs animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4" />
            <span>Drag me anywhere!</span>
            <button
              onClick={() => setShowDragHint(false)}
              className="ml-2 text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            Double-click to reset position
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatButton;
