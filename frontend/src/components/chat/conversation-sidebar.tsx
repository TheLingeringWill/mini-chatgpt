"use client";

// T027-T034: ConversationSidebar component for conversation management

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversation } from "@/components/providers/conversation-provider";
import { Trash2, MessageSquare, Plus } from "lucide-react";

export function ConversationSidebar() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    switchConversation,
  } = useConversation();

  return (
    <div className="w-64 md:w-72 lg:w-80 border-r flex flex-col h-full bg-muted/20 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Conversations
        </h2>
        {/* T028: New Conversation button */}
        <Button
          onClick={createConversation}
          className="w-full gap-2 shadow-sm"
          size="default"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* T027: Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`relative group rounded-lg transition-all duration-200 ${
                conversation.id === activeConversationId
                  ? "bg-accent shadow-sm ring-1 ring-border"
                  : "hover:bg-accent/50"
              }`}
            >
              {/* T031: Click to switch conversation */}
              <div
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => switchConversation(conversation.id)}
              >
                <MessageSquare className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  conversation.id === activeConversationId
                    ? "text-primary"
                    : "text-muted-foreground"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    conversation.id === activeConversationId
                      ? "text-foreground"
                      : "text-foreground/90"
                  }`}>
                    {conversation.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {conversation.messages.length} {conversation.messages.length === 1 ? "message" : "messages"}
                  </p>
                </div>

                {/* T033: Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100 hover:text-destructive transition-all flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${conversation.title}"?`)) {
                      deleteConversation(conversation.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* T030: Show conversation count and limit */}
      <div className="p-4 border-t bg-background/50">
        <div className="text-xs text-muted-foreground text-center">
          <span className="font-medium">{conversations.length}</span> / 100 conversations
        </div>
      </div>
    </div>
  );
}
