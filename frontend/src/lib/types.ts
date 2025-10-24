// T010: TypeScript type definitions for the Mini ChatGPT application

// Core Types
export type MessageRole = "user" | "assistant";
export type MessageStatus = "sending" | "sent" | "error" | "cancelled";
export type RequestStatus = "idle" | "loading" | "error" | "success" | "cancelled" | "timeout";

// Message entity
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
}

// Conversation entity
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

// Application state (persisted to localStorage)
export interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  version: number;
}

// Request state (transient, not persisted)
export interface RequestState {
  status: RequestStatus;
  error: string | null;
  abortController: AbortController | null;
  retryCount: number;
  startTime: number | null;
}
