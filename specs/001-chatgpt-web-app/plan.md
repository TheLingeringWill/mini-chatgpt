# Implementation Plan: Minimal ChatGPT Web Application

**Branch**: `001-chatgpt-web-app` | **Date**: 2025-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-chatgpt-web-app/spec.md`

## Summary

Build a minimal ChatGPT-style web application with:
- **Core functionality (P1)**: Single conversation chat with send/cancel/timeout/retry
- **Conversation management (P2)**: Sidebar for create/delete/switch conversations with persistent history
- **Error handling (P3)**: Robust handling of mock backend errors, timeouts, and cancellations

**Technical Approach**:
- Frontend: Next.js 16 (App Router) + React 19 + shadcn/ui + Vercel AI SDK
- Backend: Existing mock-llm Express.js service (no changes needed)
- Storage: Browser localStorage (client-side only, no server persistence)
- Package Manager: pnpm

**Key Technical Decisions** (from research.md):
- Use shadcn/ui for all UI components (copy-paste, no runtime overhead)
- Use Vercel AI SDK for LLM integration (built-in state management, retry, cancellation)
- Use React hooks + Context for state (no Redux/Zustand - KISS principle)
- Use native fetch + AbortController for timeout/cancel (no axios - YAGNI)
- Skip automated tests for MVP (manual testing sufficient - ship fast)

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16 default), Node.js 18+
**Primary Dependencies**:
- Frontend: Next.js 16, React 19, TailwindCSS v4, shadcn/ui, Vercel AI SDK
- Backend: Express.js (existing, no changes)

**Storage**: Browser localStorage (client-side only)
**Testing**: Manual testing (no automated tests for MVP per YAGNI principle)
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (frontend + backend services)
**Performance Goals**:
- Message send/receive in <15 seconds under normal conditions
- Cancel response in <1 second
- Conversation switch with no perceptible lag
- Handle mock backend's 10% hang rate + 20% error rate gracefully

**Constraints**:
- 12-second timeout for LLM requests
- Max 3 retry attempts on HTTP 500 errors
- Max 100 conversations
- Max 4000 characters per message
- localStorage ~5-10 MB limit (sufficient for 50 conversations)

**Scale/Scope**:
- Single user per browser
- Up to 100 conversations
- Up to 100 messages per conversation
- Text-only (no media)
- No server-side persistence

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### KISS (Keep It Simple, Stupid) ✅

- ✅ **No state management library**: Using React hooks + Context instead of Redux/Zustand
- ✅ **No complex HTTP client**: Using native fetch instead of axios
- ✅ **Inline retry/timeout logic**: No external retry library (simple exponential backoff)
- ✅ **Copy-paste UI components**: shadcn/ui has no runtime dependency
- ✅ **No abstractions**: Direct localStorage access, no ORM or abstraction layer

**Verdict**: PASS - Solution is maximally simple for requirements

### DRY (Don't Repeat Yourself) ✅

- ✅ **Shared types**: Single TypeScript definitions for Message, Conversation, RequestState
- ✅ **Reusable localStorage utilities**: Single module for save/load operations
- ✅ **Single API client**: One module handles all retry/timeout logic
- ✅ **shadcn components**: Reused across chat UI, sidebar, error displays

**Verdict**: PASS - No unnecessary duplication, appropriate code reuse

### YAGNI (You Aren't Gonna Need It) ✅

- ✅ **No tests**: Spec doesn't require them, manual testing sufficient for MVP
- ✅ **No auth system**: Single user per browser assumption
- ✅ **No server-side database**: localStorage meets persistence requirement
- ✅ **No message editing/deletion**: Not in spec
- ✅ **No streaming**: Full responses only (simpler)
- ✅ **No conversation search/filtering**: Not required for 100-conversation limit
- ✅ **No export/import**: Not in spec
- ✅ **No analytics/logging**: Not required

**Verdict**: PASS - Building only what's specified, nothing more

### Ship Fast, Iterate Later ✅

- ✅ **P1 (MVP) defined**: Basic chat is independently shippable
- ✅ **P2 separate**: Conversation management can ship after P1
- ✅ **P3 polish**: Error handling can be refined post-launch
- ✅ **Manual testing**: Faster than writing automated tests for MVP
- ✅ **No over-engineering**: Direct implementation, no premature optimization

**Verdict**: PASS - Implementation plan supports rapid delivery

### Product Delivery Over Perfect Code ✅

- ✅ **Working feature prioritized**: Focus on P1 MVP completion
- ✅ **Tests skipped**: Not blocking delivery (can add later if needed)
- ✅ **Documentation minimal**: Just-enough quickstart guide
- ✅ **No premature refactoring**: Ship, gather feedback, improve

**Verdict**: PASS - Plan prioritizes shipping working software

### Overall Gate Status: ✅ PASS

All constitution principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-chatgpt-web-app/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technical decisions)
├── data-model.md        # Phase 1 output (entities & storage)
├── quickstart.md        # Phase 1 output (setup guide)
├── contracts/           # Phase 1 output (API contracts)
│   └── api-contract.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (existing)
│   │   ├── page.tsx                # Main chat page (NEW)
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts        # API proxy to mock-llm (NEW)
│   ├── components/
│   │   ├── ui/                     # shadcn components (NEW)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── card.tsx
│   │   │   └── alert.tsx
│   │   ├── chat/                   # Chat feature components (NEW)
│   │   │   ├── chat-interface.tsx  # Main component
│   │   │   ├── message-list.tsx    # Message display
│   │   │   ├── message-input.tsx   # Input + send/cancel
│   │   │   └── conversation-sidebar.tsx
│   │   └── providers/              # State management (NEW)
│   │       └── conversation-provider.tsx
│   └── lib/
│       ├── storage.ts              # localStorage utilities (NEW)
│       ├── llm-client.ts           # API calls + retry/timeout (NEW)
│       ├── types.ts                # TypeScript definitions (NEW)
│       └── utils.ts                # shadcn utils (existing)
├── .env.local                      # Environment config (NEW)
└── package.json                    # Updated with new deps

mock-llm/
└── server.js                       # Existing mock backend (NO CHANGES)

compose.yml                         # Docker setup (NO CHANGES)
```

**Structure Decision**: Web application (Option 2) - Frontend and backend are already separated in the existing project. Frontend uses Next.js App Router structure. Backend is existing Express.js service requiring no modifications.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations - this section intentionally left empty.

## Phase 0: Research Summary

See [research.md](./research.md) for complete details.

**Key Decisions Made**:

1. **UI Components**: shadcn/ui (user requirement, KISS principle - copy-paste components)
2. **AI Integration**: Vercel AI SDK (user requirement, simplifies state management)
3. **State Management**: React hooks + Context (no Redux - KISS)
4. **HTTP Client**: Native fetch + AbortController (no axios - YAGNI)
5. **Testing**: Manual testing only for MVP (no automated tests - ship fast)
6. **Storage**: localStorage with simple save/load utilities (no abstraction layer)

**All "NEEDS CLARIFICATION" items resolved** - ready for implementation.

## Phase 1: Design Artifacts

### Data Model

See [data-model.md](./data-model.md) for complete details.

**Core Entities**:

1. **Message**: `{id, role, content, timestamp, status}`
   - Role: "user" | "assistant"
   - Status: "sending" | "sent" | "error" | "cancelled"
   - Max content length: 4000 chars

2. **Conversation**: `{id, title, messages[], createdAt}`
   - Title format: "Conversation {N}"
   - Max 100 conversations
   - Persisted in localStorage

3. **AppState**: `{conversations[], activeConversationId}`
   - Root state structure
   - Synced to localStorage on every change

4. **RequestState**: `{status, error, abortController, retryCount, startTime}`
   - Transient state (not persisted)
   - Tracks current LLM request
   - Handles timeout/retry/cancel logic

### API Contracts

See [contracts/api-contract.yaml](./contracts/api-contract.yaml) for complete OpenAPI spec.

**Endpoints**:

1. `POST /api/chat` (Next.js API route)
   - Request: `{message: string}`
   - Response: `{completion: string}` or `{error: string}`
   - Proxies to mock-llm backend

2. `POST /complete` (existing mock-llm backend)
   - Request: `{content: string}`
   - Response: `{completion: string}` or `{error: string}`
   - Simulates 10% hang, 20% error rate

### Quickstart Guide

See [quickstart.md](./quickstart.md) for complete setup instructions.

**Key Setup Steps**:
1. Install shadcn/ui components: `pnpm dlx shadcn@latest add button input textarea scroll-area card alert`
2. Install Vercel AI SDK: `pnpm add ai`
3. Create `.env.local` with `MOCK_LLM_API_URL=http://localhost:8080`
4. Run both services: `docker compose up` or separate `node server.js` + `pnpm dev`

## Re-evaluation: Constitution Check ✅

After completing design phase, re-checking constitution compliance:

### KISS ✅
- Data model is simple (4 entities, direct localStorage)
- No complex abstractions or patterns
- Inline business logic, no service layers

### DRY ✅
- Shared TypeScript types across components
- Single storage module for all localStorage operations
- Single API client with retry/timeout logic
- Reusable shadcn components

### YAGNI ✅
- No features beyond spec requirements
- No server-side persistence (localStorage sufficient)
- No tests (manual testing for MVP)
- No advanced features (search, export, etc.)

### Ship Fast ✅
- P1 (MVP) is clearly scoped and shippable
- P2, P3 are separate increments
- No blocking dependencies on perfect implementation

### Product Delivery Over Perfect Code ✅
- Focus on working software
- Skip tests for speed
- Minimal documentation (just quickstart)

**Final Verdict**: ✅ PASS - Ready for task generation (`/speckit.tasks`)

## Next Steps

1. Run `/speckit.tasks` to generate implementation task list
2. Implement tasks in priority order (P1 → P2 → P3)
3. Test manually using quickstart.md checklist
4. Ship P1 MVP
5. Gather feedback
6. Iterate with P2, P3

## Risks & Mitigations

| Risk | Impact | Mitigation | Status |
|------|--------|------------|--------|
| localStorage quota exceeded | Cannot save conversations | Enforce 100-conversation limit, show clear error | Designed |
| Race conditions on conversation switch | Wrong messages in conversation | Cancel previous request on switch | Designed |
| Browser compatibility | Feature doesn't work | Target modern browsers only (ES6+, fetch, AbortController) | Documented |
| Mock backend hang rate (10%) | Poor UX | 12-second timeout catches hangs | Designed |
| Mock backend error rate (20%) | Failures | Retry up to 3 times with exponential backoff | Designed |

## Dependencies

**External**:
- Next.js 16 (already in project)
- React 19 (already in project)
- TailwindCSS v4 (already in project)
- shadcn/ui (to be installed)
- Vercel AI SDK (to be installed)

**Internal**:
- mock-llm service (already exists, no changes)

**Blockers**: None - all dependencies available or in-project.

---

**Plan Status**: ✅ COMPLETE

Ready for `/speckit.tasks` command to generate task breakdown.
