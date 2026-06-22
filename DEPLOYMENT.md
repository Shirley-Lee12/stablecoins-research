# ZIBS Stablecoin Research Hub — Deployment Guide

> This guide is written for deploying the codebase from Replit to your own infrastructure.

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
rm -rf .local/           # Replit skill files
rm -rf .replit/           # Replit config
rm -rf .upm/              # Replit package manager
rm artifacts/mockup-sandbox/ # design sandbox (not needed for prod)
```

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

### Migrate the Database Schema

Install dependencies and push the schema:

```bash
# Install Node.js 24+ and pnpm
npm install -g pnpm

# Install all dependencies
pnpm install

# Push the schema to your new database
# Set the DATABASE_URL first:
export DATABASE_URL="postgresql://...your-neon-or-supabase-url..."

# Push schema
pnpm --filter @workspace/db run push
```

This creates all tables:
- `resources`
- `research_papers`
- `regulatory_entries`
- `author_profiles`
- `users`
- `password_reset_tokens`

## Part 3: Deploy the Backend (Render)

### 1. Create a Render account
Go to [render.com](https://render.com) and sign up.

### 2. Create a new Web Service
- **Build Command**: `pnpm install && pnpm --filter @workspace/api-server run build`
- **Start Command**: `pnpm --filter @workspace/api-server run start`
- **Runtime**: Node.js

### 3. Environment Variables
Set these in Render Dashboard → Environment:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Neon/Supabase connection string | Yes |
| `SESSION_SECRET` | A strong random string (e.g., `openssl rand -base64 64`) | Yes |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `10000` (or any port Render assigns) | Yes |
| `CORS_ORIGIN` | Your Vercel frontend URL (e.g., `https://zibs-research.vercel.app`) | Yes |

### 4. CORS Configuration

The backend currently uses `app.use(cors())` (open to all). For production, **restrict it**.

Edit `artifacts/api-server/src/app.ts`:

```typescript
import cors from "cors";

// Replace the open CORS with:
app.use(cors({
  origin: process.env.CORS_ORIGIN || "https://your-frontend.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
```

### 5. Root `package.json` — Add Build Scripts

Render needs a root `package.json` that knows how to build the workspace. Add to the root `package.json`:

```json
{
  "scripts": {
    "build": "pnpm run build --recursive",
    "build:api-server": "pnpm --filter @workspace/api-server run build"
  }
}
```

### 6. Root `.nvmrc` (optional but recommended)
Create a `.nvmrc` file in the project root:
```
24
```

## Part 4: Deploy the Frontend (Vercel)

### 1. Create a Vercel account
Go to [vercel.com](https://vercel.com) and sign up.

### 2. Import the Repository
- Connect your GitHub repo (or upload the folder directly)
- Select the project root.

### 3. Configure Vercel Settings

In the Vercel project settings:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `pnpm install && pnpm --filter @workspace/stablecoin-hub run build` |
| **Output Directory** | `artifacts/stablecoin-hub/dist/public` |
| **Root Directory** | `artifacts/stablecoin-hub` (or leave as root) |

> **Important**: If you set Root Directory to `artifacts/stablecoin-hub`, Vercel will run the build command from that folder. If Root Directory is the project root, Vercel will run the build from there.

### 4. Environment Variables

Add these to Vercel Settings → Environment Variables:

| Variable | Value | Target |
|----------|-------|--------|
| `VITE_API_BASE_URL` | Your Render backend URL (e.g., `https://zibs-api.onrender.com/api`) | Production |
| `VITE_API_BASE_URL` | Your Render backend URL | Preview |

### 5. Update the Frontend to Use the Remote API

Currently the frontend uses `import.meta.env.BASE_URL` (which is a Replit path). For Vercel, you need to change the API client base URL.

**Option A: Set the API base URL at runtime (recommended)**

In `artifacts/stablecoin-hub/src/main.tsx` (or `App.tsx`), initialize the API client with the remote URL:

```typescript
import { setBaseUrl } from "@workspace/api-client-react";

// Before any API calls, set the remote backend URL
setBaseUrl(import.meta.env.VITE_API_BASE_URL || "https://your-api.onrender.com");
```

This is the cleanest approach — the `api-client-react` package already has a `setBaseUrl()` function.

**Option B: Modify the auth-context**

In `artifacts/stablecoin-hub/src/lib/auth-context.tsx`, change the `BASE` constant:

```typescript
// Replace this:
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

// With this:
const BASE = (import.meta.env.VITE_API_BASE_URL || "https://your-api.onrender.com").replace(/\/$/, '');
```

### 6. Add `vercel.json` (optional)

Create `artifacts/stablecoin-hub/vercel.json` to handle SPA routing:

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

## Part 5: Python Backend Engine (Future)

You mentioned a **Python/FastAPI backend** for the **literature extraction engine**. This is not currently in the codebase. Here's the recommended approach:

### Architecture

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

## Part 6: Environment Variables Summary

### Backend (Render)

```env
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/dbname?sslmode=require

# Auth
SESSION_SECRET=your-super-strong-random-secret

# Server
PORT=10000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://your-frontend.vercel.app

# Python Extractor (optional)
PYTHON_API_URL=https://your-python-api.onrender.com
```

### Frontend (Vercel)

```env
# API
VITE_API_BASE_URL=https://your-api.onrender.com
```

> **Note**: `VITE_` prefix is required for Vite to expose the env var to the frontend code.

## Part 7: Build & Deploy Checklist

### Before First Deploy

- [ ] Export code from Replit
- [ ] Remove `.local/`, `.replit/`, `.upm/` folders
- [ ] Create Neon/Supabase database
- [ ] Push schema with `pnpm --filter @workspace/db run push`
- [ ] Set `SESSION_SECRET` (generate a strong random string)
- [ ] Set `CORS_ORIGIN` to match Vercel domain
- [ ] Update `VITE_API_BASE_URL` in Vercel
- [ ] Call `setBaseUrl()` in frontend code

### Backend Deploy

- [ ] Add root `package.json` with build scripts
- [ ] Create `.nvmrc` with `24`
- [ ] Deploy to Render with build/start commands
- [ ] Verify API health: `GET /api/healthz`
- [ ] Test auth: `POST /api/auth/register`, `POST /api/auth/login`

### Frontend Deploy

- [ ] Connect GitHub repo to Vercel
- [ ] Set Vite framework preset
- [ ] Set `VITE_API_BASE_URL` env var
- [ ] Add `vercel.json` for SPA routing
- [ ] Deploy and test

## Part 8: Common Issues

### Issue: `pnpm install` fails on Render

**Fix**: Render uses npm by default. Tell it to use pnpm:
- In the service settings, set **Build Command** to:
  ```bash
  npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build
  ```

### Issue: `PORT` not found

**Fix**: Render sets the `PORT` env var automatically. If you hardcoded a port in the code, remove it. The Express server should read `process.env.PORT`.

### Issue: Database SSL error

**Fix**: Add `?sslmode=require` to your `DATABASE_URL`.

### Issue: CORS errors in the browser

**Fix**: Make sure the `CORS_ORIGIN` on the backend matches the exact Vercel domain (including `https://`).

## Quick Reference: Key Files

| File | Purpose |
|------|---------|
| `artifacts/api-server/src/app.ts` | Express app setup (CORS, middleware) |
| `artifacts/api-server/src/routes/index.ts` | Route registration |
| `artifacts/api-server/src/routes/auth.ts` | Auth endpoints (JWT, bcrypt) |
| `artifacts/stablecoin-hub/src/main.tsx` | Frontend entry point (call `setBaseUrl` here) |
| `artifacts/stablecoin-hub/src/lib/auth-context.tsx` | Auth state management (needs API URL fix) |
| `lib/db/src/schema/index.ts` | All database tables |
| `lib/api-client-react/src/custom-fetch.ts` | API client with `setBaseUrl()` |
| `pnpm-workspace.yaml` | Workspace package definitions |

---

**Questions?** The most common gotchas are: (1) `VITE_API_BASE_URL` not being set, (2) `CORS_ORIGIN` not matching the frontend domain, and (3) forgetting to call `setBaseUrl()` before the app mounts.
