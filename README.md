# SvelteKit Auth + RAG Chat Application

A full-stack application built with SvelteKit 2, Auth.js, PostgreSQL (pgvector), and a Python embedding microservice. Features RAG-powered AI chat with document ingestion, tree-structured conversation branching, and role-based access control.

## Features

- **RAG-Powered AI Chat** -- Upload documents, chunk & embed them, retrieve context for grounded answers with citations
- **Python Embedding Service** -- Containerized FastAPI service using `sentence-transformers/all-MiniLM-L6-v2`
- **Tree-Structured Chat History** -- Edit messages to create branches, regenerate AI responses as new branches, navigate between branches
- **Streaming Responses** -- Real-time streaming from Gemini API via Vercel AI SDK
- **Markdown + Syntax Highlighting** -- Rich rendering of AI responses with `marked` and `highlight.js`
- **Database Sessions** -- Server-side sessions stored in PostgreSQL
- **Role-Based Access Control** -- User and Admin roles with route-level protection
- **OAuth** -- Google & GitHub login
- **Email Flows** -- Verification + password reset via SMTP

## Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (runes syntax)
- **Authentication**: Auth.js (`@auth/sveltekit`)
- **Database**: PostgreSQL + pgvector + Drizzle ORM
- **AI**: Vercel AI SDK + Google Gemini
- **Embeddings**: Python FastAPI + sentence-transformers
- **Styling**: TailwindCSS v4

## Prerequisites

- Node.js 18+ and pnpm
- Docker & Docker Compose

## Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd assignment-2
cp .env.example .env
```

Edit `.env` and set your secrets:
- `DATABASE_URL` -- Postgres connection string
- `AUTH_SECRET` -- Generate with `openssl rand -base64 32`
- `GOOGLE_GENERATIVE_AI_API_KEY` -- From https://aistudio.google.com/app/apikey
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` -- From Google Cloud Console
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` -- From GitHub Developer Settings
- `SMTP_USER` / `SMTP_PASS` -- Gmail App Password
- `EMBEDDING_API_URL` -- Default `http://localhost:8000`

### 2. Start Docker services

```bash
docker-compose up -d
```

This starts:
- **pgvector** (PostgreSQL with vector extension) on port 5432
- **embed-api** (Python embedding service) on port 8000

### 3. Install dependencies

```bash
pnpm install
```

### 4. Run database migrations

```bash
pnpm db:push
```

### 5. Seed admin user (optional)

```bash
pnpm db:seed
```

Creates: `admin@example.com` / `admin123`

### 6. Start development server

```bash
pnpm dev
```

Visit `http://localhost:5173`

### Verify setup

- `http://localhost:5173/healthz` -- Health check
- `http://localhost:5173/version` -- Version info
- `http://localhost:8000/health` -- Embedding API health

## Route Structure

| Route | Access | Description |
|---|---|---|
| `/` | Public | Landing page |
| `/auth/login` | Guest only | Login form |
| `/auth/register` | Guest only | Registration form |
| `/dashboard` | Authenticated | User dashboard |
| `/dashboard/chat` | Authenticated | RAG-powered AI chat |
| `/dashboard/documents` | Authenticated | Document upload & management |
| `/dashboard/profile` | Authenticated | Profile & password management |
| `/admin` | Admin only | Admin dashboard with user management |
| `/healthz` | Public | Health check endpoint |
| `/version` | Public | Version endpoint |

## Project Structure

```
src/
├── auth.ts                              # Auth.js configuration
├── hooks.server.ts                      # Request hooks (auth + route protection)
├── app.css                              # TailwindCSS entry
├── lib/
│   ├── components/
│   │   ├── Nav.svelte                   # Navigation bar
│   │   └── ChatMessage.svelte           # Chat message with markdown/citations
│   └── server/
│       └── db/
│           ├── index.ts                 # Drizzle client
│           └── schema.ts               # Database schema (auth + RAG + chat)
└── routes/
    ├── api/
    │   ├── chat/+server.ts              # RAG-enhanced chat API (streaming)
    │   ├── documents/+server.ts         # Document upload/ingestion API
    │   ├── conversations/+server.ts     # Conversation CRUD
    │   ├── conversations/[id]/+server.ts
    │   └── messages/+server.ts          # Message CRUD (tree structure)
    ├── dashboard/
    │   ├── chat/+page.svelte            # Chat UI with history sidebar
    │   └── documents/+page.svelte       # Document management
    ├── healthz/+server.ts               # Health check
    └── version/+server.ts               # Version info

embed-api/
├── main.py                              # FastAPI embedding service
├── Dockerfile                           # Container definition
└── requirements.txt                     # Python dependencies

docker-compose.yml                       # pgvector + embed-api services
```

## Database Schema

### Auth Tables
- **users** -- id, name, email, password, role, timestamps
- **sessions** -- sessionToken, userId, expires
- **accounts** -- OAuth provider accounts
- **verification_tokens** -- Email verification
- **password_reset_tokens** -- Password reset flow
- **email_verification_tokens** -- Email verification flow

### RAG Tables
- **documents** -- id, name, type, content, uploadedBy, createdAt
- **chunks** -- id, documentId, content, chunkIndex
- **embeddings** -- id, chunkId, embedding (vector(384))

### Chat Tables
- **conversations** -- id, userId, title, timestamps
- **messages** -- id, conversationId, parentId, role, content, citations, branchIndex

## Fresh-Clone Validation

```bash
git clone <repo-url>
cd assignment-2
cp .env.example .env          # Set required secrets
docker-compose up -d           # Start pgvector + embed-api
pnpm install
pnpm db:push
pnpm db:seed                   # Optional
pnpm dev
# Visit /healthz and /version
```
