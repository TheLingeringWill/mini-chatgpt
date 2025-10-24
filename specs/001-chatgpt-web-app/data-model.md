# Data Model: Minimal ChatGPT Web Application

**Feature**: 001-chatgpt-web-app
**Date**: 2025-10-24
**Storage**: Browser localStorage (client-side only)

## Overview

This feature uses a simple client-side data model with no server-side persistence. All data is stored in browser localStorage and managed via React state.

## Entities

### Message

Represents a single message in a conversation (user or assistant).

**Fields**:
- `id`: string (UUID v4)
- `role`: "user" | "assistant"
- `content`: string (max 4000 characters)
- `timestamp`: number (Unix timestamp in milliseconds)
- `status`: "sending" | "sent" | "error" | "cancelled"

**Validation Rules**:
- `content` MUST NOT be empty string
- `content` MUST be ≤ 4000 characters
- `role` MUST be either "user" or "assistant"
- `timestamp` MUST be set at creation time
- User messages start with status "sending", transition to "sent" or "error"
- Assistant messages always have status "sent"

**State Transitions**:
```
User Message:
  sending → sent (on successful response)
  sending → error (on timeout/failure)
  sending → cancelled (on user cancellation)

Assistant Message:
  sent (created immediately upon receiving response)
```

**Relationships**:
- Belongs to exactly one Conversation
- Messages are immutable once created (no editing/deletion)

---

### Conversation

Represents a chat session containing multiple messages.

**Fields**:
- `id`: string (UUID v4)
- `title`: string (auto-generated: "Conversation {number}")
- `messages`: Message[] (ordered by timestamp, ascending)
- `createdAt`: number (Unix timestamp in milliseconds)

**Validation Rules**:
- `id` MUST be unique across all conversations
- `title` MUST follow format "Conversation {N}" where N is sequential
- `messages` array CAN be empty (new conversations start with no messages)
- `messages` MUST be ordered by timestamp (oldest first)
- `createdAt` MUST be set when conversation is created

**Derived Properties**:
- `messageCount`: number (computed from messages.length)
- `lastMessageAt`: number | null (timestamp of last message, null if empty)

**Business Rules**:
- Maximum 100 conversations per browser
- When 100 limit reached, user must delete conversations before creating new ones
- Deleting a conversation is permanent (no undo/trash)
- Conversations persist across browser sessions via localStorage

**Relationships**:
- Contains zero or more Messages
- Belongs to AppState (global state)

---

### AppState

Global application state (root of data model).

**Fields**:
- `conversations`: Conversation[] (ordered by createdAt, newest first)
- `activeConversationId`: string | null

**Validation Rules**:
- `conversations` array MUST NOT exceed 100 items
- `activeConversationId` MUST reference an existing conversation ID or be null
- If `conversations` is empty, `activeConversationId` MUST be null

**Business Rules**:
- On app initialization:
  - If localStorage is empty, create one default conversation
  - If localStorage has conversations, load them and set first as active
- When deleting active conversation:
  - If other conversations exist, switch to the next one
  - If no conversations remain, create a new default conversation
- When creating a new conversation:
  - If at 100-conversation limit, show error and block creation
  - Auto-increment conversation number based on existing titles

**localStorage Key**: `mini-chatgpt-app-state`

**localStorage Schema**:
```typescript
{
  conversations: Conversation[],
  activeConversationId: string | null,
  version: 1  // for future migrations
}
```

---

### RequestState

Transient state (not persisted) tracking current LLM request.

**Fields**:
- `status`: "idle" | "loading" | "error" | "success" | "cancelled" | "timeout"
- `error`: string | null (user-friendly error message)
- `abortController`: AbortController | null (for cancellation)
- `retryCount`: number (current retry attempt, 0-3)
- `startTime`: number | null (timestamp when request started)

**State Transitions**:
```
idle → loading (user sends message)
loading → success (response received)
loading → error (HTTP 500 after 3 retries)
loading → cancelled (user clicks cancel)
loading → timeout (>12 seconds elapsed)
error/cancelled/timeout/success → idle (ready for next message)
```

**Business Rules**:
- Only one request active at a time per conversation
- Retry logic: max 3 attempts with exponential backoff (1s, 2s, 4s)
- Only retry on HTTP 500 errors (not 4xx or network errors)
- Timeout: 12 seconds from initial request (including retries)
- Cancel button visible only when status === "loading"
- Input disabled when status === "loading"

**Not Persisted**: This state resets to "idle" on page refresh.

---

## Type Definitions

```typescript
// Core Types
type MessageRole = "user" | "assistant";
type MessageStatus = "sending" | "sent" | "error" | "cancelled";
type RequestStatus = "idle" | "loading" | "error" | "success" | "cancelled" | "timeout";

interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status: MessageStatus;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

interface AppState {
  conversations: Conversation[];
  activeConversationId: string | null;
  version: number;
}

interface RequestState {
  status: RequestStatus;
  error: string | null;
  abortController: AbortController | null;
  retryCount: number;
  startTime: number | null;
}
```

---

## Data Flow

### Send Message Flow

1. User types message and clicks Send
2. Create user Message with status="sending"
3. Add to active conversation's messages array
4. Update localStorage
5. Set RequestState to "loading", start 12s timeout
6. Call API with retry logic
7. On success:
   - Update user message status to "sent"
   - Create assistant Message with response
   - Add to conversation's messages array
   - Update localStorage
   - Set RequestState to "success" then "idle"
8. On error/timeout/cancel:
   - Update user message status accordingly
   - Set RequestState.error with user-friendly message
   - Update localStorage
   - Set RequestState to "error"/"timeout"/"cancelled" then "idle"

### Create Conversation Flow

1. User clicks "New Conversation"
2. Check: conversations.length < 100
3. Generate new conversation number (max existing number + 1)
4. Create Conversation with title "Conversation {number}"
5. Add to conversations array
6. Set as activeConversationId
7. Update localStorage

### Switch Conversation Flow

1. User clicks conversation in sidebar
2. If request pending: cancel it via abortController
3. Set activeConversationId to selected conversation
4. Reset RequestState to "idle"
5. UI re-renders with new conversation's messages

### Delete Conversation Flow

1. User clicks delete button
2. Remove conversation from conversations array
3. If deleted conversation was active:
   - If conversations.length > 0: set first conversation as active
   - Else: create new default conversation
4. Update localStorage

---

## Storage Strategy

### localStorage Management

**Key**: `mini-chatgpt-app-state`

**Write Operations**:
- After every message sent/received
- After creating/deleting conversations
- After switching conversations

**Read Operations**:
- On app initialization (page load)

**Size Estimation**:
- Average message: ~200 bytes
- Average conversation (100 messages): ~20 KB
- 50 conversations: ~1 MB (well within 5-10 MB localStorage limit)

**Error Handling**:
- On quota exceeded: show error, prompt user to delete old conversations
- On parse error: clear corrupted data, create fresh default state
- On read error: log to console, create fresh default state

### State Synchronization

**React State Management**:
- Use React Context for AppState (conversations, activeConversationId)
- Use local useState for RequestState (per-component)
- Context provider wraps entire app
- Components subscribe via useContext hook

**Sync Pattern**:
```
User Action → Update React State → Update localStorage → Re-render UI
```

---

## Constraints & Limits

| Constraint | Limit | Enforcement |
|------------|-------|-------------|
| Max conversations | 100 | Block creation, show error message |
| Max message length | 4000 characters | Input validation, character counter |
| Max localStorage size | ~5 MB | Monitor usage, prompt deletion if near limit |
| Request timeout | 12 seconds | AbortController + setTimeout |
| Retry attempts | 3 (for HTTP 500) | Counter in RequestState |
| Concurrent requests | 1 per conversation | Disable input while loading |

---

## Migration Strategy

**Version 1 (Initial)**:
- Schema version: 1
- No migrations needed

**Future Migrations** (if needed):
- Add `version` field to localStorage schema
- On load, check version and run migration functions
- Preserve backward compatibility or prompt user to reset

---

## Security & Privacy

**No Server Persistence**:
- All data stored locally in browser
- No user authentication
- No server-side logging of messages
- Clearing browser data deletes all conversations

**Data Exposure**:
- localStorage is plain text (not encrypted)
- Accessible via browser DevTools
- Shared across tabs (same origin)

**Assumptions** (from spec):
- Single user per browser
- User trusts their local device
- No sensitive data handling required
