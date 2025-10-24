# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mini ChatGPT is a containerized application consisting of two services:
- **frontend**: Next.js 16 application (React 19, TypeScript) with TailwindCSS v4 and React Compiler enabled
- **mock-llm**: Express.js mock LLM API server that simulates language model responses with random delays and failures

## Development Commands

### Frontend (Next.js)
Uses **pnpm** as the package manager.

```bash
cd frontend
pnpm install      # Install dependencies
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build production bundle
pnpm start        # Start production server
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
```

### Mock LLM Server
```bash
cd mock-llm
npm install       # Install dependencies
node server.js    # Start server on port 8080
```

### Docker Compose
```bash
docker compose up          # Start both services
docker compose up --build  # Rebuild and start
docker compose down        # Stop all services
```

## Architecture

### Service Communication
The frontend expects to communicate with the mock-llm service. In Docker, the mock-llm service is accessible at `http://mock-llm:8080`. The frontend depends on mock-llm starting first.

### Mock LLM Behavior
The mock-llm server (`mock-llm/server.js:10-20`) intentionally simulates real-world LLM API behavior:
- 10% chance of hanging (no response)
- 20% chance of returning HTTP 500 error
- Random response delay between 500-2000ms
- Accepts POST requests to `/complete` with `{content: string}` body
- Returns `{completion: string}` on success or `{error: string}` on failure

### Frontend Configuration
- **Next.js config** (`frontend/next.config.ts:3-7`): React Compiler enabled, standalone output for Docker
- **Biome config** (`frontend/biome.json`): Configured for Next.js and React with recommended rules
- **Fonts**: Uses Geist Sans and Geist Mono via next/font/google
- **Styling**: TailwindCSS v4 with PostCSS

## Key Files
- `frontend/src/app/page.tsx` - Main page component
- `frontend/src/app/layout.tsx` - Root layout with font configuration
- `mock-llm/server.js` - Mock LLM API endpoint
- `compose.yml` - Docker Compose configuration for both services
- `frontend/Dockerfile` - Multi-stage build using standalone Next.js output
- `mock-llm/Dockerfile` - Simple Node.js production container

## Recent Changes
- 001-chatgpt-web-app: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]
