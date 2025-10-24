# Quickstart: Minimal ChatGPT Web Application

**Feature**: 001-chatgpt-web-app
**Date**: 2025-10-24
**Prerequisites**: Node.js 18+, pnpm, Docker (optional)

## Development Setup

### 1. Install Dependencies

```bash
# Frontend dependencies
cd frontend
pnpm install

# Install shadcn/ui
pnpm dlx shadcn@latest init
# Follow prompts: TypeScript, App Router, TailwindCSS (already configured)

# Add required shadcn components
pnpm dlx shadcn@latest add button input textarea scroll-area card alert

# Install Vercel AI SDK
pnpm add ai

# Backend (mock-llm already exists, no changes needed)
cd ../mock-llm
npm install
```

### 2. Environment Configuration

Create `frontend/.env.local`:

```env
# API endpoint for mock-llm in development
MOCK_LLM_API_URL=http://localhost:8080
```

For Docker deployment, this is automatically set to `http://mock-llm:8080`.

### 3. Run Development Servers

**Option A: Local Development** (two terminals)

```bash
# Terminal 1: Start mock-llm backend
cd mock-llm
node server.js
# Server runs on http://localhost:8080

# Terminal 2: Start Next.js frontend
cd frontend
pnpm dev
# App runs on http://localhost:3000
```

**Option B: Docker Compose** (from repository root)

```bash
docker compose up --build
# Frontend: http://localhost:3000
# Mock LLM: http://localhost:8080
```

### 4. Verify Setup

Open browser to `http://localhost:3000`:

1. ✅ You should see the chat interface
2. ✅ Default "Conversation 1" in sidebar
3. ✅ Message input field with send button
4. ✅ Type "Hello" and click send
5. ✅ Watch for loading state, then response appears
6. ✅ Try clicking cancel mid-request
7. ✅ Create a new conversation and verify it appears in sidebar

---

## Project Structure

```
mini-chatgpt/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx              # Root layout (existing)
│   │   │   ├── page.tsx                # Main chat page (NEW)
│   │   │   └── api/
│   │   │       └── chat/
│   │   │           └── route.ts        # API proxy to mock-llm (NEW)
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn components (NEW)
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   └── alert.tsx
│   │   │   ├── chat/                   # Chat feature components (NEW)
│   │   │   │   ├── chat-interface.tsx  # Main component
│   │   │   │   ├── message-list.tsx    # Message display
│   │   │   │   ├── message-input.tsx   # Input + send/cancel
│   │   │   │   └── conversation-sidebar.tsx
│   │   │   └── providers/              # State management (NEW)
│   │   │       └── conversation-provider.tsx
│   │   └── lib/
│   │       ├── storage.ts              # localStorage utilities (NEW)
│   │       ├── llm-client.ts           # API calls + retry/timeout (NEW)
│   │       └── utils.ts                # shadcn utils (existing)
│   ├── .env.local                      # Environment config (NEW)
│   └── package.json                    # Updated with new deps
│
├── mock-llm/
│   └── server.js                       # Existing mock backend (NO CHANGES)
│
├── specs/
│   └── 001-chatgpt-web-app/
│       ├── spec.md                     # Feature specification
│       ├── plan.md                     # Implementation plan
│       ├── research.md                 # Technical decisions
│       ├── data-model.md               # Data structures
│       ├── contracts/                  # API contracts
│       └── quickstart.md               # This file
│
└── compose.yml                         # Docker setup (NO CHANGES)
```

---

## Key Files to Implement

### 1. Frontend API Route: `frontend/src/app/api/chat/route.ts`

Proxies requests to mock-llm backend.

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Validate input
  if (!message || message.trim().length === 0) {
    return NextResponse.json(
      { error: 'Message cannot be empty' },
      { status: 400 }
    );
  }

  if (message.length > 4000) {
    return NextResponse.json(
      { error: 'Message too long (max 4000 characters)' },
      { status: 400 }
    );
  }

  try {
    // Proxy to mock-llm
    const backendUrl = process.env.MOCK_LLM_API_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Backend error' },
        { status: response.status }
      );
    }

    return NextResponse.json({ completion: data.completion });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reach backend service' },
      { status: 500 }
    );
  }
}
```

### 2. localStorage Utilities: `frontend/src/lib/storage.ts`

```typescript
import { Conversation } from '@/types'; // Define types

const STORAGE_KEY = 'mini-chatgpt-app-state';

export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return parsed.conversations || [];
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  if (typeof window === 'undefined') return;

  try {
    const data = JSON.stringify({ conversations, version: 1 });
    localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
}
```

### 3. LLM Client: `frontend/src/lib/llm-client.ts`

```typescript
const MAX_RETRIES = 3;
const TIMEOUT_MS = 12000;

export async function sendMessage(
  message: string,
  signal: AbortSignal
): Promise<string> {
  let retries = 0;

  while (retries <= MAX_RETRIES) {
    try {
      const response = await fetchWithTimeout(
        '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
          signal,
        },
        TIMEOUT_MS
      );

      const data = await response.json();

      if (response.ok) {
        return data.completion;
      }

      // Retry only on 500 errors
      if (response.status === 500 && retries < MAX_RETRIES) {
        retries++;
        await delay(Math.pow(2, retries - 1) * 1000); // Exponential backoff
        continue;
      }

      throw new Error(data.error || 'Request failed');
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      if (error.message === 'Timeout') {
        throw new Error('Request timed out after 12 seconds');
      }
      if (retries >= MAX_RETRIES) {
        throw error;
      }
      retries++;
      await delay(Math.pow(2, retries - 1) * 1000);
    }
  }

  throw new Error('Max retries exceeded');
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Testing Checklist

### Manual Testing Scenarios

**P1 - Basic Chat (MVP)**:
- [ ] Send a message and receive response
- [ ] Input is disabled while waiting for response
- [ ] Cancel button appears during loading
- [ ] Click cancel and verify request aborts
- [ ] Wait > 12 seconds to trigger timeout error
- [ ] Send multiple messages and verify conversation history
- [ ] Verify retry logic by observing 500 errors (mock-llm provides 20% rate)

**P2 - Conversation Management**:
- [ ] Click "New Conversation" and verify new conversation created
- [ ] Verify conversation numbered correctly ("Conversation 2")
- [ ] Switch between conversations and verify history preserved
- [ ] Delete a conversation and verify it's removed
- [ ] Delete active conversation and verify redirect to another
- [ ] Refresh page and verify all conversations persist

**P3 - Error Handling**:
- [ ] Try sending empty message (should be blocked)
- [ ] Try sending 4001+ character message (should show error)
- [ ] Trigger 500 error and verify retry behavior
- [ ] Switch conversations during active request (verify cancel)
- [ ] Create 100 conversations and verify limit enforcement

---

## Common Issues & Solutions

### Issue: "Failed to reach backend service"
**Solution**: Ensure mock-llm is running on port 8080. Check `MOCK_LLM_API_URL` env var.

### Issue: Conversations not persisting
**Solution**: Check browser localStorage isn't disabled. Open DevTools → Application → Local Storage.

### Issue: shadcn components not styling correctly
**Solution**: Verify TailwindCSS v4 is properly configured. Run `pnpm dev` and check for CSS errors.

### Issue: TypeScript errors with AI SDK
**Solution**: Ensure `ai` package is installed: `pnpm add ai`. Check import paths.

---

## Next Steps

After successful quickstart verification:

1. Run `/speckit.tasks` to generate implementation task list
2. Implement P1 (MVP) features first
3. Test manually against checklist
4. Deploy P1, gather feedback
5. Implement P2, P3 incrementally
