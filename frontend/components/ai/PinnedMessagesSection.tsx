"use client";

import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { unpinMessage } from "@/store/slices/aiSlice";
import toast from "react-hot-toast";
import { AIConversationMessage } from "@/types";
import { Pin, X, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { formatDistanceToNow } from "date-fns";

interface PinnedMessagesSectionProps {
  conversationId: string;
  pinnedMessages: AIConversationMessage[];
  onUnpin: (messageIndex: number) => void;
}

const PinnedMessagesSection: React.FC<PinnedMessagesSectionProps> = ({
  conversationId,
  pinnedMessages,
  onUnpin,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Message copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast.error("Failed to copy message");
    }
  };

  const handleUnpin = async (messageIndex: number) => {
    try {
      await dispatch(unpinMessage({ conversationId, messageIndex })).unwrap();
      toast.success("Message unpinned successfully!");
      onUnpin(messageIndex);
    } catch (error) {
      console.error("Failed to unpin message:", error);
      toast.error("Failed to unpin message");
    }
  };

  if (pinnedMessages.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Pin className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-yellow-800">
          Pinned Messages ({pinnedMessages.length})
        </h3>
      </div>

      <div className="space-y-3">
        {pinnedMessages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className="bg-white border border-yellow-200 rounded-lg p-3 relative"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      message.role === "user"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.timestamp), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="relative">
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  String(children),
                                  `pinned-code-${index}`
                                )
                              }
                              className="absolute top-2 right-2 p-1 bg-gray-800 text-white rounded opacity-0 transition-opacity"
                            >
                              {copiedId === `pinned-code-${index}` ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(message.content, `pinned-${index}`)
                  }
                  className="p-1 text-gray-400 rounded transition-colors"
                  title="Copy message"
                >
                  {copiedId === `pinned-${index}` ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleUnpin(index)}
                  className="p-1 text-yellow-600 rounded transition-colors"
                  title="Unpin message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinnedMessagesSection;
