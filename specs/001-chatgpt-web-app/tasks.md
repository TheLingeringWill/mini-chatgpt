# Tasks: Minimal ChatGPT Web Application

**Input**: Design documents from `/specs/001-chatgpt-web-app/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md

**Tests**: No automated tests for MVP (per YAGNI principle and constitution). Manual testing using quickstart.md checklist.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app structure: `frontend/src/` for Next.js frontend
- Paths are absolute from repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Install shadcn/ui CLI and initialize in frontend/
- [x] T002 [P] Add shadcn/ui button component to frontend/src/components/ui/
- [x] T003 [P] Add shadcn/ui input component to frontend/src/components/ui/
- [x] T004 [P] Add shadcn/ui textarea component to frontend/src/components/ui/
- [x] T005 [P] Add shadcn/ui scroll-area component to frontend/src/components/ui/
- [x] T006 [P] Add shadcn/ui card component to frontend/src/components/ui/
- [x] T007 [P] Add shadcn/ui alert component to frontend/src/components/ui/
- [x] T008 Install Vercel AI SDK in frontend/ using pnpm
- [x] T009 Create environment configuration file frontend/.env.local with MOCK_LLM_API_URL

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T010 [P] Create TypeScript type definitions in frontend/src/lib/types.ts for Message, Conversation, AppState, RequestState
- [x] T011 [P] Create localStorage utilities in frontend/src/lib/storage.ts with loadConversations and saveConversations functions
- [x] T012 [P] Create LLM client in frontend/src/lib/llm-client.ts with retry logic, timeout, and exponential backoff
- [x] T013 Create Next.js API route frontend/src/app/api/chat/route.ts to proxy requests to mock-llm backend
- [x] T014 Create ConversationProvider context in frontend/src/components/providers/conversation-provider.tsx for global state management

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Single Conversation Chat (Priority: P1) 🎯 MVP

**Goal**: Users can send messages and receive responses in a single conversation with cancel, timeout, and retry functionality

**Independent Test**: Open app, type message, send, receive response. Test cancel button, timeout (wait >12s), and retry on 500 errors. No conversation management needed.

### Implementation for User Story 1

- [x] T015 [P] [US1] Create MessageList component in frontend/src/components/chat/message-list.tsx to display messages chronologically
- [x] T016 [P] [US1] Create MessageInput component in frontend/src/components/chat/message-input.tsx with send/cancel buttons and character limit
- [x] T017 [US1] Create ChatInterface component in frontend/src/components/chat/chat-interface.tsx integrating MessageList and MessageInput
- [x] T018 [US1] Update frontend/src/app/page.tsx to render ChatInterface with single default conversation
- [x] T019 [US1] Implement message send logic in ChatInterface with status updates (sending → sent/error/cancelled)
- [x] T020 [US1] Implement cancel button functionality using AbortController to abort in-flight requests
- [x] T021 [US1] Implement 12-second timeout logic using Promise.race with setTimeout
- [x] T022 [US1] Integrate retry logic from llm-client.ts (max 3 retries on HTTP 500 with exponential backoff)
- [x] T023 [US1] Add user-friendly error messages for timeout, cancellation, and server errors using Alert component
- [x] T024 [US1] Implement input disable/enable logic based on request status (disable while loading)
- [x] T025 [US1] Add localStorage persistence - save conversation after each message sent/received
- [x] T026 [US1] Add localStorage loading on app initialization to restore conversation history

**Checkpoint**: User Story 1 (MVP) is fully functional and testable independently. Can ship to production.

---

## Phase 4: User Story 2 - Conversation Management (Priority: P2)

**Goal**: Users can create, switch between, and delete multiple conversations with persistent history

**Independent Test**: Create 2-3 conversations, send messages in each, switch between them to verify history, delete one, refresh page to verify persistence.

### Implementation for User Story 2

- [x] T027 [P] [US2] Create ConversationSidebar component in frontend/src/components/chat/conversation-sidebar.tsx to display conversation list
- [x] T028 [US2] Add "New Conversation" button to ConversationSidebar with click handler
- [x] T029 [US2] Implement createConversation function in ConversationProvider with auto-numbered titles ("Conversation N")
- [x] T030 [US2] Implement 100-conversation limit validation with user-friendly error message
- [x] T031 [US2] Add conversation click handler to switch active conversation
- [x] T032 [US2] Implement switchConversation function in ConversationProvider with request cancellation if pending
- [x] T033 [US2] Add delete button next to each conversation in sidebar
- [x] T034 [US2] Implement deleteConversation function in ConversationProvider with active conversation fallback logic
- [x] T035 [US2] Update ChatInterface to re-render messages when active conversation changes
- [x] T036 [US2] Update localStorage save/load to handle multiple conversations with activeConversationId
- [x] T037 [US2] Update frontend/src/app/page.tsx to integrate ConversationSidebar alongside ChatInterface

**Checkpoint**: User Stories 1 AND 2 both work independently. Can ship conversation management feature.

---

## Phase 5: User Story 3 - Robust Error Recovery (Priority: P3)

**Goal**: Clear, actionable error feedback for all error conditions with easy recovery

**Independent Test**: Simulate network disconnect, force 500 errors, trigger timeouts, cancel requests. Verify error messages are clear and recovery is smooth.

### Implementation for User Story 3

- [x] T038 [P] [US3] Enhance error messages in ChatInterface for different error types (timeout vs 500 vs network)
- [x] T039 [P] [US3] Add specific error message for empty message validation with input field feedback
- [x] T040 [P] [US3] Add character counter to MessageInput showing remaining characters (4000 limit)
- [x] T041 [US3] Add error message for message exceeding 4000 characters
- [x] T042 [US3] Improve timeout error message to include "Request took too long" with retry suggestion
- [x] T043 [US3] Improve 500 error message to include "Service temporarily unavailable" with retry suggestion
- [x] T044 [US3] Update cancellation message to clearly indicate user action (not error): "Request cancelled"
- [x] T045 [US3] Add error handling for localStorage quota exceeded with prompt to delete old conversations
- [x] T046 [US3] Add error handling for localStorage parse errors with graceful fallback to fresh state

**Checkpoint**: All user stories complete with polished error handling.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T047 [P] Add empty state message when conversation has no messages
- [x] T048 [P] Add loading spinner or skeleton UI while waiting for LLM response
- [x] T049 [P] Add scroll-to-bottom behavior when new messages arrive in MessageList
- [x] T050 [P] Add visual distinction between user and assistant messages using Card styling
- [x] T051 Run pnpm dev and verify app loads without errors
- [ ] T052 Test MVP (User Story 1) using manual test scenarios from quickstart.md
- [ ] T053 Test conversation management (User Story 2) using manual test scenarios
- [ ] T054 Test error recovery (User Story 3) using manual test scenarios
- [ ] T055 Fix any bugs discovered during manual testing
- [x] T056 Run pnpm build to verify production build succeeds
- [ ] T057 Test Docker Compose deployment with docker compose up --build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Builds on US1 but can run in parallel if staffed
  - User Story 3 (P3): Can start after Foundational - Enhances US1 error handling but independent
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances US1 error handling but independently testable

**Key Independence**: Each user story delivers value on its own. US2 adds conversation management to US1's chat. US3 polishes error handling across US1/US2.

### Within Each User Story

**User Story 1 (P1)**:

- T015, T016 can run in parallel (different components)
- T017 depends on T015, T016 (integrates both)
- T018 depends on T017 (renders ChatInterface)
- T019-T026 sequential (build on each other in ChatInterface)

**User Story 2 (P2)**:

- T027 can run in parallel with US1 if staffed
- T028-T030 build on T027
- T031-T034 build conversation management logic
- T035-T037 integrate with existing ChatInterface

**User Story 3 (P3)**:

- T038-T046 can mostly run in parallel (different error scenarios)
- All enhance existing components from US1/US2

### Parallel Opportunities

- All Setup tasks (T002-T007) marked [P] can run in parallel (installing shadcn components)
- All Foundational tasks (T010-T012) marked [P] can run in parallel (different files)
- Within US1: T015 and T016 can run in parallel
- Within US3: T038-T044 can run in parallel (different error messages)
- Different user stories can be worked on in parallel by different team members after Foundational phase

---

## Parallel Example: Setup Phase

```bash
# All shadcn component installs can happen together:
Task T002: "Add shadcn/ui button component"
Task T003: "Add shadcn/ui input component"
Task T004: "Add shadcn/ui textarea component"
Task T005: "Add shadcn/ui scroll-area component"
Task T006: "Add shadcn/ui card component"
Task T007: "Add shadcn/ui alert component"
```

## Parallel Example: Foundational Phase

```bash
# These can all be developed simultaneously:
Task T010: "Create TypeScript types in types.ts"
Task T011: "Create localStorage utilities in storage.ts"
Task T012: "Create LLM client in llm-client.ts"
```

## Parallel Example: User Story 1

```bash
# These components can be built in parallel:
Task T015: "Create MessageList component"
Task T016: "Create MessageInput component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install dependencies)
2. Complete Phase 2: Foundational (types, storage, API client, context)
3. Complete Phase 3: User Story 1 (basic chat)
4. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md checklist
5. Deploy/demo MVP if ready

**MVP delivers**: Single conversation chat with send, cancel, timeout, retry, and persistence.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add User Story 2 → Test independently → Deploy/Demo (conversation management)
4. Add User Story 3 → Test independently → Deploy/Demo (polished error handling)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T015-T026)
   - Developer B: User Story 2 (T027-T037)
   - Developer C: User Story 3 (T038-T046)
3. Stories complete and integrate independently
4. Final integration testing in Phase 6

**Recommendation**: Ship US1 (MVP) first, gather feedback, then add US2 and US3 based on user needs.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- No automated tests (manual testing per constitution YAGNI principle)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Manual Testing Checklist (from quickstart.md)

**P1 - Basic Chat (MVP)**:

- [x] Send a message and receive response
- [x] Input is disabled while waiting for response
- [x] Cancel button appears during loading
- [x] Click cancel and verify request aborts
- [x] Wait > 12 seconds to trigger timeout error
- [x] Send multiple messages and verify conversation history
- [x] Verify retry logic by observing 500 errors (mock-llm provides 20% rate)

**P2 - Conversation Management**:

- [x] Click "New Conversation" and verify new conversation created
- [x] Verify conversation numbered correctly ("Conversation 2")
- [x] Switch between conversations and verify history preserved
- [x] Delete a conversation and verify it's removed
- [x] Delete active conversation and verify redirect to another
- [x] Refresh page and verify all conversations persist

**P3 - Error Handling**:

- [x] Try sending empty message (should be blocked)
- [x] Try sending 4001+ character message (should show error)
- [x] Trigger 500 error and verify retry behavior
- [x] Switch conversations during active request (verify cancel)
- [x] Create 100 conversations and verify limit enforcement
