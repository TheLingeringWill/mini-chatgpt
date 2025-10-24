"use client";

// T017-T026: ChatInterface component integrating MessageList and MessageInput
// with full send/cancel/timeout/retry logic and localStorage persistence

import React, { useState, useCallback, useRef, useEffect } from "react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConversation } from "@/components/providers/conversation-provider";
import { sendMessage } from "@/lib/llm-client";
import type { Message, RequestStatus } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export function ChatInterface() {
  const {
    activeConversation,
    addMessage,
    updateMessageStatus,
  } = useConversation();

  const [requestStatus, setRequestStatus] = useState<RequestStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isLoading = requestStatus === "loading";
  const isDisabled = isLoading;

  // T019: Implement message send logic
  const handleSend = useCallback(
    async (content: string) => {
      if (!activeConversation) return;

      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: Date.now(),
        status: "sending",
      };

      // T025: Add to conversation (triggers localStorage save via provider)
      addMessage(userMessage);
      setRequestStatus("loading");
      setError(null);

      // T020: Create AbortController for cancellation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // T021, T022: Send with timeout and retry logic from llm-client
        const completion = await sendMessage(content, abortController.signal);

        // Success - update user message status
        updateMessageStatus(userMessage.id, "sent");

        // Create assistant message
        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: completion,
          timestamp: Date.now(),
          status: "sent",
        };

        // T025: Add assistant message (triggers localStorage save)
        addMessage(assistantMessage);
        setRequestStatus("success");

        // Reset to idle
        setTimeout(() => setRequestStatus("idle"), 100);
      } catch (err) {
        // T023: Handle errors with user-friendly messages
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        if (errorMessage === "Request cancelled") {
          updateMessageStatus(userMessage.id, "cancelled");
          setRequestStatus("cancelled");
          setError("Request cancelled");
        } else if (errorMessage.includes("timed out")) {
          updateMessageStatus(userMessage.id, "error");
          setRequestStatus("timeout");
          setError("Request took too long. Please try again.");
        } else if (errorMessage.includes("temporarily unavailable")) {
          updateMessageStatus(userMessage.id, "error");
          setRequestStatus("error");
          setError("Service temporarily unavailable. Please try again.");
        } else {
          updateMessageStatus(userMessage.id, "error");
          setRequestStatus("error");
          setError(errorMessage);
        }

        // Reset to idle after showing error
        setTimeout(() => {
          setRequestStatus("idle");
          setError(null);
        }, 5000);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [activeConversation, addMessage, updateMessageStatus]
  );

  // T020: Implement cancel button functionality
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // T024: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!activeConversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No conversation selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
      {/* Chat Header */}
      <div className="border-b bg-background/50 backdrop-blur-sm px-6 py-4">
        <h1 className="text-lg font-semibold truncate">
          {activeConversation.title}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {activeConversation.messages.length} {activeConversation.messages.length === 1 ? "message" : "messages"}
        </p>
      </div>

      {/* T023: Display error messages */}
      {error && (
        <Alert variant="destructive" className="m-4 shadow-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* T015, T048: Message list with loading state */}
      <MessageList messages={activeConversation.messages} isLoading={isLoading} />

      {/* T016: Message input with T024: input disable logic */}
      <MessageInput
        onSend={handleSend}
        onCancel={handleCancel}
        disabled={isDisabled}
        isLoading={isLoading}
      />
    </div>
  );
}
