"use client";

// T016: MessageInput component with send/cancel buttons and character limit

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  onCancel: () => void;
  disabled: boolean;
  isLoading: boolean;
}

const MAX_MESSAGE_LENGTH = 4000;

export function MessageInput({ onSend, onCancel, disabled, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed.length === 0) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) return;

    onSend(trimmed);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Cmd/Ctrl + Enter
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const remainingChars = MAX_MESSAGE_LENGTH - message.length;
  const isOverLimit = message.length > MAX_MESSAGE_LENGTH;
  const usagePercent = (message.length / MAX_MESSAGE_LENGTH) * 100;
  const showCharCounter = usagePercent >= 80 || isOverLimit;

  return (
    <div className="border-t bg-background/50 backdrop-blur-sm p-4 w-full">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Cmd/Ctrl + Enter to send)"
            disabled={disabled}
            className="min-h-[120px] resize-none w-full pr-4 focus-visible:ring-2 focus-visible:ring-primary/20 transition-shadow"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Character counter - only show when approaching limit */}
          <div className="flex-1">
            {showCharCounter && (
              <span
                className={`text-xs transition-colors ${
                  isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
                }`}
              >
                {isOverLimit ? `${-remainingChars} characters over limit` : `${remainingChars} characters remaining`}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isLoading && (
              <Button
                onClick={onCancel}
                variant="outline"
                size="default"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button
              onClick={handleSend}
              disabled={disabled || message.trim().length === 0 || isOverLimit}
              size="default"
              className="gap-2 shadow-sm"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
