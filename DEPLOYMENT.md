# ZIBS Stablecoin Research Hub — Deployment Guide

> This guide covers deploying the codebase from Replit to your own infrastructure: Vercel (frontend), Render (backend), and Neon/Supabase (database).

## Project Structure

```
zibs-stablecoin-research-hub/
├── artifacts/
│   ├── api-server/          # Express 5 + Node.js backend
│   └── stablecoin-hub/      # React + Vite frontend
├── lib/
│   ├── api-client-react/    # Orval-generated React Query hooks
│   ├── api-zod/             # Zod schemas from OpenAPI
│   ├── db/                  # Drizzle ORM schema + connection
│   └── integrations/        # (optional) third-party integrations
├── pnpm-workspace.yaml      # pnpm workspace config
├── package.json             # root scripts
└── .local/                  # Replit-specific configs (skip when deploying)
```

| Component | Location | Deployment Target |
|-----------|----------|-------------------|
| Frontend (React) | `artifacts/stablecoin-hub/` | Vercel |
| Backend (Express) | `artifacts/api-server/` | Render / Zeabur |
| Database (PostgreSQL) | `lib/db/` | Neon / Supabase |

---

## Part 1: Export the Code from Replit

### Option A: Download ZIP
1. In your Replit project, click **... (More)** on the left sidebar → **Download as ZIP**
2. Unzip the file on your local machine.

### Option B: Git Clone
1. If the project is connected to a Git repository, use the git clone URL.
2. If not, run `git init` in the Replit shell, add a remote, and push.

### Files to Remove (Replit-specific)
After downloading, remove these files/folders — they are not needed for production:

```bash
rm -rf .local/              # Replit skill files
rm -rf .replit/              # Replit config
rm -rf .upm/                 # Replit package manager
rm artifacts/mockup-sandbox/ # design sandbox (not needed for prod)
```

---

## Part 2: Set Up Your PostgreSQL Database

### Option A: Neon (Recommended)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project → copy the **Connection String**
3. The connection string looks like:
   ```
   postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
   ```

### Option B: Supabase
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project → Settings → Database → copy the **Connection string** (URI tab)
3. The connection string looks like:
   ```
   postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

### Run Drizzle Migrations (Standard Workflow)

This project uses **Drizzle Kit's standard generate + migrate** workflow (not `push`).

```bash
# Install Node.js 24+ and pnpm
npm install -g pnpm

# Install all dependencies
pnpm install

# Set the DATABASE_URL
export DATABASE_URL="postgresql://...your-neon-or-supabase-url..."

# Step 1: Generate migration files (creates SQL in lib/db/drizzle/)
pnpm --filter @workspace/db run generate

# Step 2: Apply migrations to the database
pnpm --filter @workspace/db run migrate
```

> **What this does**: `generate` creates SQL files (e.g., `0000_xxx.sql`) in `lib/db/drizzle/` based on schema changes. `migrate` runs those SQL files against your database. This is the production-safe way to manage schema changes.

### Schema Files Created

This creates all tables:
- `resources`
- `research_papers`
- `regulatory_entries`
- `author_profiles`
- `users`
- `password_reset_tokens`

### Future Schema Changes

Whenever you modify `lib/db/src/schema/*.ts`, always run the same two commands:

```bash
pnpm --filter @workspace/db run generate
pnpm --filter @workspace/db run migrate
```

> **Never** use `push` in production — it silently drops data. `generate` + `migrate` is the only safe approach.

---

## Part 3: Deploy the Backend (Render)

### 1. Create a Render account
Go to [render.com](https://render.com) and sign up.

### 2. Create a new Web Service
Import your GitHub repo (or upload manually). Configure:

| Setting | Value |
|---------|-------|
| **Runtime** | Node.js |
| **Build Command** | `pnpm --filter @workspace/api-server run build` |
| **Start Command** | `pnpm --filter @workspace/api-server run start` |

### 3. Enable pnpm on Render

Instead of adding `npm install -g pnpm` to the Build Command, add this **Environment Variable** in Render Dashboard → Environment:

| Key | Value |
|-----|-------|
| `PNPM_VERSION` | `9.0.0` |

> Render's modern build system detects `pnpm-lock.yaml` and this `PNPM_VERSION` variable, then automatically switches to high-speed pnpm mode without any manual installation.

### 4. Environment Variables

Set these in Render Dashboard → Environment:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Neon/Supabase connection string | Yes |
| `JWT_SECRET` | A strong random string (e.g., `openssl rand -base64 64`) | Yes |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` (or any port Render assigns) | Yes |
| `CORS_ORIGIN` | Your Vercel frontend URL (e.g., `https://zibs-research.vercel.app`) | Yes |

> **Note**: The auth system uses **JWT (JSON Web Tokens)**, not session cookies. The `JWT_SECRET` is used to sign/verify tokens. This is intentional and avoids all cross-domain cookie issues.

### 5. CORS Configuration

The backend currently uses `app.use(cors())` (open to all). For production, **restrict it**.

Edit `artifacts/api-server/src/app.ts`:

```typescript
import cors from "cors";

// Replace the open CORS with:
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://your-frontend.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

> **Important**: Do NOT set `credentials: true` here. The auth system uses **JWT Bearer tokens** sent in the `Authorization` header, not cookies. Cross-domain cookie problems don't apply because there are no cookies involved.

### 6. Root `.nvmrc` (recommended)

Create a `.nvmrc` file in the project root:
```
24
```

---

## Part 4: Deploy the Frontend (Vercel)

### 1. Create a Vercel account
Go to [vercel.com](https://vercel.com) and sign up.

### 2. Import the Repository
- Connect your GitHub repo (or upload the folder directly)
- Select the project root.

### 3. Configure Vercel Settings

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `pnpm --filter @workspace/stablecoin-hub run build` |
| **Output Directory** | `artifacts/stablecoin-hub/dist/public` |
| **Root Directory** | `artifacts/stablecoin-hub` (or leave as project root) |

> **Note**: If you set Root Directory to `artifacts/stablecoin-hub`, Vercel will run the build command from that folder. If Root Directory is the project root, Vercel will run from the project root. Both work — just be consistent.

### 4. Environment Variables

Add these to Vercel Settings → Environment Variables:

| Variable | Value | Target |
|----------|-------|--------|
| `VITE_API_BASE_URL` | Your Render backend URL (e.g., `https://zibs-api.onrender.com`) | Production |
| `VITE_API_BASE_URL` | Your Render backend URL | Preview |

> `VITE_` prefix is required for Vite to expose the env var to the frontend code.

### 5. Initialize the API Base URL

The frontend needs to know where the backend API is. The best approach is to call `setBaseUrl()` before the app mounts.

**In `artifacts/stablecoin-hub/src/main.tsx`**:

```typescript
import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Set the backend API URL
setBaseUrl(import.meta.env.VITE_API_BASE_URL || "https://your-api.onrender.com");

createRoot(document.getElementById("root")!).render(<App />);
```

**Also update `auth-context.tsx`** (the auth endpoints use direct fetch, not the generated client):

```typescript
// In artifacts/stablecoin-hub/src/lib/auth-context.tsx
// Replace this:
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// With this:
const BASE = (import.meta.env.VITE_API_BASE_URL || "https://your-api.onrender.com").replace(/\/$/, '');
```

### 6. Add `vercel.json` for SPA Routing

Create `artifacts/stablecoin-hub/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Part 5: Python Backend Engine (Literature Extractor)

You mentioned a **Python/FastAPI backend** for the **literature extraction engine**. This is not currently in the codebase. Here's the recommended architecture:

```
Frontend (React) → Node API (Express) → Python FastAPI (extractor)
                     ↓
                  PostgreSQL (Neon/Supabase)
```

The Express API acts as the **gateway** — the frontend calls the Express API, and the Express API delegates the extraction work to the Python FastAPI service.

### FastAPI Service (to be created)

Create a new folder `python-extractor/` at the project root:

```python
# python-extractor/main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class ExtractRequest(BaseModel):
    url: str

@app.post("/extract")
async def extract_paper(request: ExtractRequest):
    # TODO: implement PDF extraction logic
    # This is where you'd use libraries like:
    # - scholarly (for Google Scholar)
    # - arxiv (for arXiv API)
    # - pypdf / pdfplumber (for PDF parsing)
    return {"title": "", "authors": [], "abstract": "", "url": request.url}
```

### Deploy Python FastAPI

**Option A: Render**
- Create a new Web Service on Render
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port 10000`

**Option B: Zeabur**
- Push `python-extractor/` to a GitHub repo
- Connect to Zeabur, it auto-detects Python FastAPI

### Connect Express to FastAPI

In the Express backend, add a route that calls the Python service:

```typescript
// In artifacts/api-server/src/routes/extractor.ts
import axios from "axios";

router.post("/extract", async (req, res) => {
  const pythonUrl = process.env.PYTHON_API_URL;
  const response = await axios.post(`${pythonUrl}/extract`, req.body);
  res.json(response.data);
});
```

---

## Part 6: Environment Variables Summary

### Backend (Render)

```env
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require

# Auth — JWT signing key
JWT_SECRET=your-super-strong-random-secret

# Server
PORT=10000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# Python Extractor (optional)
PYTHON_API_URL=https://your-python-api.onrender.com

# pnpm (render auto-detects)
PNPM_VERSION=9.0.0
```

### Frontend (Vercel)

```env
# API
VITE_API_BASE_URL=https://your-api.onrender.com
```

---

## Part 7: Build & Deploy Checklist

### Before First Deploy

- [ ] Export code from Replit
- [ ] Remove `.local/`, `.replit/`, `.upm/` folders
- [ ] Create Neon/Supabase database
- [ ] Run `generate` + `migrate` to create tables
- [ ] Set `JWT_SECRET` (generate a strong random string)
- [ ] Set `CORS_ORIGIN` to match Vercel domain
- [ ] Set `VITE_API_BASE_URL` in Vercel
- [ ] Call `setBaseUrl()` in `main.tsx`
- [ ] Update `auth-context.tsx` BASE constant

### Backend Deploy

- [ ] Set `PNPM_VERSION=9.0.0` in Render Environment
- [ ] Create `.nvmrc` with `24`
- [ ] Deploy to Render
- [ ] Verify API health: `GET /api/healthz`
- [ ] Test auth: `POST /api/auth/register`, `POST /api/auth/login`

### Frontend Deploy

- [ ] Connect GitHub repo to Vercel
- [ ] Set Vite framework preset
- [ ] Set `VITE_API_BASE_URL` env var
- [ ] Add `vercel.json` for SPA routing
- [ ] Deploy and test

---

## Part 8: Common Issues

### Issue: `pnpm install` fails on Render

**Fix**: Do not add `npm install -g pnpm` to the Build Command. Instead, add the environment variable `PNPM_VERSION=9.0.0`. Render will auto-detect `pnpm-lock.yaml` and switch to pnpm.

### Issue: Database SSL error

**Fix**: Add `?sslmode=require` to your `DATABASE_URL`.

### Issue: CORS errors in the browser

**Fix**: Make sure the `CORS_ORIGIN` on the backend matches the exact Vercel domain (including `https://`).

### Issue: Auth works on login but fails on refresh (if using session cookies)

**Fix**: This project uses **JWT Bearer tokens**, not session cookies. The token is stored in `localStorage` on the frontend and sent in every request header as `Authorization: Bearer <token>`. No cookie configuration is needed. If you see this issue, it means the frontend is not sending the `Authorization` header — check `auth-context.tsx`.

---

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `artifacts/api-server/src/app.ts` | Express app setup (CORS, middleware) |
| `artifacts/api-server/src/routes/index.ts` | Route registration |
| `artifacts/api-server/src/routes/auth.ts` | Auth endpoints (JWT, bcrypt) |
| `artifacts/stablecoin-hub/src/main.tsx` | Frontend entry point (set `setBaseUrl` here) |
| `artifacts/stablecoin-hub/src/lib/auth-context.tsx` | Auth state management (needs API URL fix) |
| `lib/db/src/schema/index.ts` | All database tables |
| `lib/api-client-react/src/custom-fetch.ts` | API client with `setBaseUrl()` |
| `pnpm-workspace.yaml` | Workspace package definitions |
