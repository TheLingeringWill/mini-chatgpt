// T011: localStorage utilities for conversation persistence

import type { Conversation, AppState } from "./types";

const STORAGE_KEY = "mini-chatgpt-app-state";
const STORAGE_VERSION = 1;

/**
 * Load conversations from localStorage
 * Returns empty array if no data exists or if parsing fails
 */
export function loadConversations(): AppState | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data) as AppState;

    // Validate version for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(`Storage version mismatch: expected ${STORAGE_VERSION}, got ${parsed.version}`);
      // For v1, we'll just accept it. Future versions might need migration logic.
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load conversations from localStorage:", error);
    // Clear corrupted data
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Save conversations to localStorage
 * Includes error handling for quota exceeded
 */
export function saveConversations(state: AppState): boolean {
  if (typeof window === "undefined") return false;

  try {
    const data = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, data);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      console.error("localStorage quota exceeded. Please delete old conversations.");
      return false;
    }
    console.error("Failed to save conversations to localStorage:", error);
    return false;
  }
}

/**
 * Clear all conversation data from localStorage
 */
export function clearConversations(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
