"use client";

// T014: ConversationProvider context for global state management

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Conversation, AppState, Message } from "@/lib/types";
import { loadConversations, saveConversations } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

interface ConversationContextType {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  createConversation: () => void;
  deleteConversation: (id: string) => void;
  switchConversation: (id: string) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (messageId: string, status: Message["status"]) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    conversations: [],
    activeConversationId: null,
    version: 1,
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    const loadedState = loadConversations();

    if (loadedState && loadedState.conversations.length > 0) {
      setState(loadedState);
    } else {
      // Create default conversation
      const defaultConversation: Conversation = {
        id: uuidv4(),
        title: "Conversation 1",
        messages: [],
        createdAt: Date.now(),
      };

      const initialState: AppState = {
        conversations: [defaultConversation],
        activeConversationId: defaultConversation.id,
        version: 1,
      };

      setState(initialState);
      saveConversations(initialState);
    }
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.conversations.length > 0) {
      saveConversations(state);
    }
  }, [state]);

  const createConversation = useCallback(() => {
    if (state.conversations.length >= 100) {
      alert("Maximum of 100 conversations reached. Please delete some conversations first.");
      return;
    }

    // Find highest conversation number
    const conversationNumbers = state.conversations.map((conv) => {
      const match = conv.title.match(/Conversation (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = Math.max(0, ...conversationNumbers);
    const newNumber = maxNumber + 1;

    const newConversation: Conversation = {
      id: uuidv4(),
      title: `Conversation ${newNumber}`,
      messages: [],
      createdAt: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      conversations: [newConversation, ...prev.conversations],
      activeConversationId: newConversation.id,
    }));
  }, [state.conversations]);

  const deleteConversation = useCallback((id: string) => {
    setState((prev) => {
      const filtered = prev.conversations.filter((c) => c.id !== id);

      // If we deleted the active conversation, switch to first available or create new
      let newActiveId = prev.activeConversationId;
      if (prev.activeConversationId === id) {
        if (filtered.length > 0) {
          newActiveId = filtered[0].id;
        } else {
          // Create new default conversation
          const defaultConversation: Conversation = {
            id: uuidv4(),
            title: "Conversation 1",
            messages: [],
            createdAt: Date.now(),
          };
          filtered.push(defaultConversation);
          newActiveId = defaultConversation.id;
        }
      }

      return {
        ...prev,
        conversations: filtered,
        activeConversationId: newActiveId,
      };
    });
  }, []);

  const switchConversation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      activeConversationId: id,
    }));
  }, []);

  const addMessage = useCallback((message: Message) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv) =>
        conv.id === prev.activeConversationId
          ? { ...conv, messages: [...conv.messages, message] }
          : conv
      ),
    }));
  }, []);

  const updateMessageStatus = useCallback((messageId: string, status: Message["status"]) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv) =>
        conv.id === prev.activeConversationId
          ? {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId ? { ...msg, status } : msg
              ),
            }
          : conv
      ),
    }));
  }, []);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) || null;

  const value: ConversationContextType = {
    conversations: state.conversations,
    activeConversationId: state.activeConversationId,
    activeConversation,
    createConversation,
    deleteConversation,
    switchConversation,
    addMessage,
    updateMessageStatus,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error("useConversation must be used within ConversationProvider");
  }
  return context;
}
