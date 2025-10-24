"use client";

// T015, T047-T050: MessageList component with polish features

import React, { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, User, Bot } from "lucide-react";
import type { Message } from "@/lib/types";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // T049: Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // T047: Empty state
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-4 py-6 w-full">
      <div className="space-y-6 max-w-4xl mx-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"} items-start animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>

            {/* Message bubble */}
            <div className={`flex-1 max-w-[85%] ${message.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
              <div
                className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted rounded-tl-sm"
                }`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>

              {/* Status indicators */}
              {message.status === "error" && (
                <p className="text-xs text-destructive px-2">Failed to send</p>
              )}
              {message.status === "cancelled" && (
                <p className="text-xs text-muted-foreground px-2">Cancelled</p>
              )}
              {message.status === "sending" && (
                <div className="flex items-center gap-1.5 px-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Sending...</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* T048: Loading spinner while waiting for response */}
        {isLoading && (
          <div className="flex gap-3 items-start animate-in fade-in duration-300">
            {/* Assistant avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
              <Bot className="h-4 w-4" />
            </div>

            {/* Thinking indicator */}
            <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-muted shadow-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-base text-muted-foreground">Thinking...</p>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
