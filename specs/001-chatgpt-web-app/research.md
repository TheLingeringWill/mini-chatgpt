# Research: Minimal ChatGPT Web Application

**Feature**: 001-chatgpt-web-app
**Date**: 2025-10-24
**Purpose**: Research technical decisions and best practices for implementation

## Technology Stack Decisions

### Frontend Framework: Next.js 16

**Decision**: Use Next.js 16 (App Router) with React 19

**Rationale**:
- Already in use in the project (per CLAUDE.md and user requirements)
- App Router provides server components by default for better performance
- React 19 features (React Compiler) already enabled in project
- Built-in routing eliminates need for react-router

**Alternatives Considered**:
- Vite + React: Simpler but adds routing complexity
- Create React App: Deprecated, not recommended

**Implementation Notes**:
- Use App Router structure (`frontend/src/app/`)
- Client components only where needed (interactive chat UI)
- Server components for static layouts

---

### UI Components: shadcn/ui

**Decision**: Use shadcn/ui for all UI components

**Rationale**:
- User requirement specified shadcn/ui
- Copy-paste components (no runtime dependency overhead)
- Built on Radix UI primitives (accessible, headless)
- Works seamlessly with TailwindCSS v4 already in project
- Follows KISS principle - install only what you need

**Alternatives Considered**:
- Material UI: Heavier, more opinionated
- Chakra UI: Runtime CSS-in-JS overhead
- Headless UI: Lower-level, more implementation work

**Required Components**:
- Button (send, cancel, new conversation, delete)
- Input/Textarea (message input)
- ScrollArea (chat messages, sidebar)
- Card (message bubbles)
- Alert/Toast (error messages)
- Dialog (delete confirmation - optional for MVP)

**Installation Approach**:
```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input textarea scroll-area card alert
```

---

### AI Integration: Vercel AI SDK

**Decision**: Use Vercel AI SDK for LLM integration

**Rationale**:
- User requirement specified AI SDK
- Provides `useChat` hook with built-in state management
- Handles request cancellation via AbortController
- Error handling and retry logic utilities
- Although spec says "no streaming," AI SDK supports non-streaming mode
- Simplifies integration with custom backends

**Alternatives Considered**:
- Direct fetch calls: More manual work for error handling, retries, state
- Custom hooks: Reinventing the wheel

**Implementation Notes**:
- Use AI SDK's `useChat` hook for message state and submission
- Configure custom API endpoint to point to mock-llm service
- Disable streaming mode
- Add custom retry logic with exponential backoff
- Wrap with 12-second timeout using AbortController

---

### State Management: React Hooks + LocalStorage

**Decision**: Use React hooks (useState, useReducer) with localStorage for persistence

**Rationale**:
- KISS/YAGNI: No need for Redux/Zustand for simple conversation management
- localStorage API meets all persistence requirements
- React Context for sharing conversation state across components
- Keeps bundle size minimal

**Alternatives Considered**:
- Zustand: Adds dependency, overkill for this scope
- Redux Toolkit: Way too complex for simple CRUD operations
- IndexedDB: Over-engineered for text-only data

**Data Structure**:
```typescript
// localStorage key: 'mini-chatgpt-conversations'
{
  conversations: [
    {
      id: string,
      title: string, // "Conversation 1", "Conversation 2"
      messages: [{role: 'user' | 'assistant', content: string, timestamp: number}],
      createdAt: number
    }
  ],
  activeConversationId: string
}
```

---

### HTTP Client & Error Handling

**Decision**: Use native fetch with AbortController for timeout/cancellation

**Rationale**:
- Native browser API (no extra dependencies)
- AbortController provides clean cancellation API
- Easy to wrap with retry logic and timeout

**Retry Strategy**:
- Max 3 retry attempts for HTTP 500 errors
- Exponential backoff: 1s, 2s, 4s
- Only retry on 500 errors (not 4xx or network errors)
- Abort all retries if user cancels

**Timeout Strategy**:
- 12-second timeout using `Promise.race` with `setTimeout`
- AbortController.signal passed to fetch
- Clear timeout on success or error

**Error Classification**:
- Timeout: User-friendly "Request took too long, please try again"
- 500 after retries: "Service temporarily unavailable, please try again"
- Cancelled: "Request cancelled" (not shown as error)
- Network error: "Connection failed, check your internet"

---

### Testing Strategy

**Decision**: Skip automated tests for MVP (ship fast, test manually)

**Rationale**:
- YAGNI: Spec doesn't require tests
- Constitution prioritizes product delivery over test coverage
- Manual testing sufficient for P1 MVP
- Can add tests later if needed

**Manual Test Scenarios** (from spec):
1. Send message → receive response
2. Cancel in-flight request
3. Trigger timeout (wait > 12s)
4. Force 500 errors (mock-llm provides 20% rate)
5. Create/switch/delete conversations
6. Refresh page → verify persistence

---

### Package Manager: pnpm

**Decision**: Use pnpm (already in project)

**Rationale**:
- User requirement
- Already configured in project
- Faster, more efficient than npm
- Workspace support if needed later

---

## Architecture Decisions

### Component Structure

**Decision**: Colocate feature components in app directory

```
frontend/src/
├── app/
│   ├── layout.tsx              # Root layout (existing)
│   ├── page.tsx                # Main chat page
│   └── api/
│       └── chat/
│           └── route.ts        # Proxy to mock-llm
├── components/
│   ├── ui/                     # shadcn components
│   ├── chat/
│   │   ├── chat-interface.tsx  # Main chat component
│   │   ├── message-list.tsx    # Messages display
│   │   ├── message-input.tsx   # Input + send/cancel
│   │   └── conversation-sidebar.tsx
│   └── providers/
│       └── conversation-provider.tsx  # Context for state
└── lib/
    ├── storage.ts              # localStorage utilities
    ├── llm-client.ts           # API calls with retry/timeout
    └── utils.ts                # shadcn utils
```

**Rationale**:
- Follows Next.js 16 App Router conventions
- Separates UI components from business logic
- Easy to locate and modify features
- No over-abstraction (KISS)

---

### API Route Pattern

**Decision**: Create Next.js API route as proxy to mock-llm

**Rationale**:
- Avoids CORS issues in development/production
- Centralizes backend URL configuration
- Allows adding request logging/metrics later if needed
- Follows Next.js best practices

**Endpoint**:
- `POST /api/chat` → proxies to `POST http://mock-llm:8080/complete`
- Request: `{message: string}`
- Response: `{completion: string}` or `{error: string}`

---

### Environment Configuration

**Decision**: Use Next.js environment variables

```env
# .env.local (development)
NEXT_PUBLIC_MOCK_LLM_URL=http://localhost:8080

# .env.production
NEXT_PUBLIC_MOCK_LLM_URL=http://mock-llm:8080
```

**Rationale**:
- Built into Next.js
- NEXT_PUBLIC_ prefix for client-side access (though we'll use API route)
- Different URLs for dev (localhost) vs Docker (service name)

---

## Best Practices Applied

### KISS (Keep It Simple, Stupid)
- No state management library (just hooks + context)
- No complex abstractions or patterns
- Inline retry/timeout logic (no external library)
- Copy-paste UI components (no component library runtime)

### DRY (Don't Repeat Yourself)
- Shared message type across components
- Reusable localStorage utility functions
- Single API client with retry/timeout logic
- shadcn components reused across UI

### YAGNI (You Aren't Gonna Need It)
- No tests (not required)
- No auth system
- No server-side database
- No message editing/deletion
- No streaming (full responses only)
- No rich text or media support
- No conversation search/filtering
- No export/import features

### Ship Fast, Iterate Later
- P1 (MVP): Basic chat with retry/timeout/cancel
- P2: Conversation management
- P3: Error polish
- Each priority shippable independently

---

## Risk Mitigation

### localStorage Limits
**Risk**: localStorage has 5-10MB limit
**Mitigation**:
- 100 conversation limit (enforced in UI)
- 4000 char message limit
- Estimated capacity: 50 conversations with 100 messages each well within limits

### Race Conditions
**Risk**: Switching conversations during active request
**Mitigation**:
- Cancel previous request when switching conversations
- Disable conversation switching while request pending
- Use request ID to match responses to correct conversation

### Browser Compatibility
**Risk**: Older browsers may not support features
**Mitigation**:
- Target modern browsers only (stated in spec assumptions)
- ES6+, fetch, AbortController, localStorage all standard
- No polyfills needed for target audience

---

## Open Questions: NONE

All technical decisions resolved based on:
- User requirements (Next.js, shadcn/ui, AI SDK, pnpm)
- Existing project setup (Next.js 16, React 19, TailwindCSS v4)
- Constitution principles (KISS, DRY, YAGNI)
- Feature spec requirements (retry, timeout, cancel, persist)

Ready for Phase 1: Data modeling and contract design.
