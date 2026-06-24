# ZIBS Stablecoins Research Hub — Agent Reference

> Quick-start reference for AI agents working on this codebase. Read this before making any changes.

---

## What this project is

A bilingual (Chinese/English) academic research platform for **Zhejiang University ZIBS Stablecoin Research Center**. It lets the team publish research, curate global literature, and present regulatory/market data to academic visitors.

---

## Monorepo layout

```
artifacts/
  api-server/       Express 5 backend  →  /api/*
  stablecoin-hub/   React + Vite frontend  →  /
  mockup-sandbox/   Design sandbox (ignore in prod)
lib/
  db/               Drizzle ORM schema + Supabase connection
  api-client-react/ Orval-generated React Query hooks (from OpenAPI spec)
  api-zod/          Zod schemas auto-generated from OpenAPI spec
scripts/            Utility scripts
```

---

## Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 24, pnpm workspaces |
| Backend | Express 5, TypeScript 5.9, esbuild |
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Wouter (routing) |
| Database | PostgreSQL (Supabase) via Drizzle ORM |
| Auth | JWT (jose) + bcrypt — Bearer token, no cookies |
| Codegen | Orval (OpenAPI → React Query hooks + Zod schemas) |

---

## Database (Supabase)

Connection via `DATABASE_URL` secret (already set in Replit Secrets).

### Core tables

#### `resources` — global literature library
```sql
id          serial PRIMARY KEY
title       text NOT NULL
authors     text[]           DEFAULT '{}'
source_type source_type_enum DEFAULT 'Paper'   -- enum: Paper | Report | Gov Document | News
url         text
doi         text
abstract    text
tags        text[]           DEFAULT '{}'
created_at  timestamptz      DEFAULT now()
```

#### `our_research` — ZIBS team's own publications
```sql
id              serial PRIMARY KEY
title           text NOT NULL
file_url        text
abstract        text
key_innovations text[]  DEFAULT '{}'
tags            text[]  DEFAULT '{}'
uploaded_at     timestamptz DEFAULT now()
```

#### `users`
```sql
id            serial PRIMARY KEY
email         text UNIQUE NOT NULL
name          text NOT NULL
password_hash text NOT NULL
created_at    timestamptz DEFAULT now()
updated_at    timestamptz DEFAULT now()
```

#### `password_reset_tokens`
```sql
id         serial PRIMARY KEY
user_id    integer REFERENCES users(id) ON DELETE CASCADE
token      text UNIQUE NOT NULL
expires_at timestamptz NOT NULL
used       boolean DEFAULT false
created_at timestamptz DEFAULT now()
```

### Schema files
- `lib/db/src/schema/resources.ts` — resources table + sourceTypeEnum
- `lib/db/src/schema/our_research.ts` — our_research table
- `lib/db/src/schema/users.ts` — users + password_reset_tokens
- `lib/db/src/schema/index.ts` — barrel: exports all three above

### DB commands
```bash
# After ANY schema change — always run typecheck:libs first
pnpm run typecheck:libs

# Generate migration SQL (creates files in lib/db/drizzle/)
pnpm --filter @workspace/db run generate

# Apply migrations (production-safe)
pnpm --filter @workspace/db run migrate

# push (dev only, needs TTY — use generate+migrate in Replit shell)
pnpm --filter @workspace/db run push
```

> **Replit shell gotcha**: `push` and `migrate` require TTY. Run direct SQL via a Node script in `lib/db/` where `pg` is available, or use Supabase dashboard SQL editor.

---

## API routes (`artifacts/api-server/src/routes/`)

### Auth (`auth.ts`) — no authentication required
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Returns JWT token |
| POST | `/api/auth/forgot-password` | Returns reset token (dev: in response body) |
| POST | `/api/auth/reset-password` | Consume token, set new password |

JWT secret: reads `JWT_SECRET` env, falls back to `SESSION_SECRET`.

### Resources (`resources.ts`)
| Method | Path | Params / Body |
|--------|------|---------------|
| GET | `/api/resources` | `source_type`, `tags` (array or comma-separated), `search` |
| GET | `/api/resources/:id` | — |
| POST | `/api/resources/import` | `{ url: string, source_type?: string }` — calls Gemini, returns parsed metadata (does NOT save) |
| POST | `/api/resources` | `{ title, authors?, sourceType?, url?, doi?, abstract?, tags? }` |
| PATCH | `/api/resources/:id` | any subset of above fields |
| DELETE | `/api/resources/:id` | — |

> **Import flow:** `POST /api/resources/import` fetches the URL, passes page text to `gemini-2.5-flash` with `responseMimeType: "application/json"`, and returns `{ title, authors, abstract, tags, sourceType, url }`. The frontend shows these in an editable modal; the user confirms before `POST /api/resources` actually writes to Supabase. Requires `GOOGLE_API_KEY` secret.

### Our Research (`our_research.ts`)
| Method | Path | Params / Body |
|--------|------|---------------|
| GET | `/api/our-research` | `tag`, `search` |
| GET | `/api/our-research/:id` | — |
| POST | `/api/our-research` | `{ title, fileUrl?, abstract?, keyInnovations?, tags? }` |
| DELETE | `/api/our-research/:id` | — |

### Health
| Method | Path |
|--------|------|
| GET | `/api/healthz` |

### Route registration
`artifacts/api-server/src/routes/index.ts` — only register: health, auth, resources, our_research.

---

## Frontend pages (`artifacts/stablecoin-hub/src/pages/`)

| Route | File | Description |
|-------|------|-------------|
| `/` | `home-overview.tsx` | Mission, team, platform modules |
| `/dashboard` | `dashboard.tsx` | Data dashboard |
| `/about-stablecoins` | `about.tsx` | Educational content |
| `/research` | `research.tsx` | Our Research (ZIBS publications) |
| `/academic-resources` | `academic-resources.tsx` | **Main resource library** |
| `/experts` | `experts.tsx` | Expert profiles |
| `/regulatory` | `regulatory.tsx` | Regulatory status |
| `/quantitative` | `quantitative.tsx` | Quantitative indicators |
| `/market-data` | `market-data.tsx` | Market data |
| `/reset-password` | `reset-password.tsx` | Password reset |

### Sidebar nav (`components/layout.tsx`)
Current items: Overview, Dashboard, About Stablecoins, Our Research, Resources, Regulatory Status, Quantitative Indicators, Market Data.

> "Experts & Scholars" was **removed from the sidebar** and is now a Resource Type filter inside the `/academic-resources` page.

---

## Key frontend patterns

### API calls
- Generated Orval hooks live in `lib/api-client-react/` — use them for existing OpenAPI-spec'd endpoints.
- For newer endpoints (`/api/resources`, `/api/our-research`) not yet in the OpenAPI spec, use direct `fetch()` in `useEffect` or React Query's `useQuery`.
- Base URL: `import.meta.env.BASE_URL` in dev (Replit proxy path). `VITE_API_BASE_URL` in production (Vercel → Render).

### Auth
- `useAuth()` hook from `@/lib/auth-context` — exposes `{ user, token, login, register, logout }`.
- JWT token stored in `localStorage`, sent as `Authorization: Bearer <token>`.

### Language / i18n
- `useLanguage()` from `@/lib/language-context` — exposes `{ language, t(en, zh) }`.
- Always wrap user-visible strings with `t("English", "中文")`.

### Theme
- `useTheme()` from `@/lib/theme-context` — light/dark toggle, stored in localStorage.

---

## Dev workflow

```bash
# Typecheck everything
pnpm run typecheck

# Typecheck only libs (after schema changes)
pnpm run typecheck:libs

# Regenerate API hooks + Zod schemas (after OpenAPI spec changes)
pnpm --filter @workspace/api-spec run codegen

# Do NOT run pnpm dev at the root — use Replit workflows
```

### After changing `lib/db/src/schema/`
1. Run `pnpm run typecheck:libs` (rebuilds composite lib declarations)
2. Then `pnpm --filter @workspace/api-server run typecheck` to verify API server

### Adding a new API route
1. Create route file in `artifacts/api-server/src/routes/`
2. Register it in `artifacts/api-server/src/routes/index.ts`
3. Add the endpoint to `lib/api-spec/openapi.yaml` if it needs generated hooks
4. Run codegen if spec changed

---

## Environment variables

| Variable | Where set | Purpose |
|----------|-----------|---------|
| `DATABASE_URL` | Replit Secret | Supabase PostgreSQL connection string |
| `SESSION_SECRET` | Replit Secret | JWT signing (production: set `JWT_SECRET` instead) |
| `GOOGLE_API_KEY` | Replit Secret | Google Gemini API key for `/api/resources/import` |
| `CORS_ORIGIN` | Render env | Allowed frontend origin in production |
| `VITE_API_BASE_URL` | Vercel env | Backend URL for production frontend |
| `PNPM_VERSION` | Render env | Set to `9.0.0` so Render auto-detects pnpm |

---

## Important rules

1. **Never use `console.log` in server code** — use `req.log` in route handlers, `logger` singleton elsewhere.
2. **Always run `typecheck:libs` before leaf package typechecks** after any `lib/db` schema change.
3. **No gold color** — primary palette is ocean blue only.
4. **No emojis in UI** — unless the user explicitly requests.
5. **JWT, not session cookies** — do not add `credentials: true` to CORS; do not use `cookie-session`.
6. **`source_type` enum values** are `Paper`, `Report`, `Gov Document`, `News`, `Experts & Scholars` — use exactly these strings.
7. **Mock data fallback** — `academic-resources.tsx` shows 6 hardcoded items when the API returns an empty array; this is intentional.
