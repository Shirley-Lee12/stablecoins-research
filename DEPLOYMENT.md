# Render Deployment Runbook

The production site already uses two Render services:

| Service | Runtime | Purpose |
| --- | --- | --- |
| [`stablecoins hub`](https://stablecoins-hub.onrender.com) | Static | React/Vite frontend |
| [`stablecoins research hub`](https://stablecoins-research-hub.onrender.com) | Node | Express API and background jobs |

Do not deploy ongoing work until the My Contributions and admin review queues have been checked and cleared.

Both services currently deploy the `main` branch automatically with `Auto-Deploy: On Commit`.

## Information to record before the next release

No passwords or secret values should be copied into an issue, commit, or chat. Record only:

- The public frontend URL and backend URL.
- The GitHub repository and production branch connected to each Render service.
- Whether Auto-Deploy is enabled for each service.
- The current Build Command, Publish Directory, Start Command, and Health Check Path shown in Render.
- The names of configured environment variables and whether each is present.

## Expected service configuration

### Static frontend

```text
Root Directory: artifacts/stablecoin-hub
Build Command: corepack enable && corepack prepare pnpm@11.9.0 --activate && pnpm install --frozen-lockfile && pnpm run build
Publish Directory: dist/public
```

Current included build-filter paths:

```text
artifacts/stablecoin-hub/**
lib/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
```

No ignored paths are configured.

Required frontend environment variable:

```text
VITE_API_BASE_URL=https://<backend-service>.onrender.com
```

Current frontend environment-variable keys:

```text
BASE_PATH
NODE_VERSION
PORT
SKIP_INSTALL_DEPS
VITE_API_BASE_URL
```

The static service also needs its existing SPA rewrite so client-side routes resolve to `index.html`.

### Node backend

```text
Root Directory: artifacts/api-server
Build Command: corepack enable && corepack prepare pnpm@11.9.0 --activate && pnpm install --frozen-lockfile && pnpm run build
Start Command: node --enable-source-maps dist/index.mjs
Health Check Path: currently blank; use /api/healthz at release time
```

Current included build-filter paths:

```text
artifacts/api-server/**
lib/**
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
tsconfig.base.json
```

No ignored paths are configured.

Required backend environment variables:

```text
NODE_ENV
DATABASE_URL
JWT_SECRET
LLM_API_KEY
BREVO_API_KEY
BREVO_FROM_EMAIL
FRONTEND_URL
CORS_ORIGIN
SCHOLAR_CONTACT_EMAIL
```

Variables with defaults or optional values:

```text
JWT_EXPIRES_IN
LLM_PROVIDER
LLM_MODEL
ADMIN_BOOTSTRAP_EMAILS
LOG_LEVEL
SEMANTIC_SCHOLAR_API_KEY
PORT
```

Current backend environment-variable keys confirmed in Render:

```text
ADMIN_BOOTSTRAP_EMAILS
BREVO_API_KEY
BREVO_FROM_EMAIL
CORS_ORIGIN
DATABASE_URL
FRONTEND_URL
JWT_SECRET
LLM_API_KEY
LLM_MODEL
LLM_PROVIDER
LOG_LEVEL
NODE_ENV
NODE_VERSION
SCHOLAR_CONTACT_EMAIL
SEMANTIC_SCHOLAR_API_KEY
```

`FRONTEND_URL` and `CORS_ORIGIN` must contain the deployed static-site origin. `SEMANTIC_SCHOLAR_API_KEY` is optional but helps reduce rate-limit failures during subscription discovery.

## Release sequence

1. Finish and verify the My Contributions and admin review queues.
2. Back up the production database before migrations or bulk data correction.
3. Run type checks, builds, and focused tests locally.
4. Review the pending Git diff and commit only the intended release changes.
5. Push the production branch. If Auto-Deploy is disabled, deploy the backend first and the frontend second from Render.
6. Confirm `/api/healthz`, authentication, resource browsing, My Contributions, admin review, file upload, and background-job progress in production.
7. Review Render logs and roll back the release if a production-only regression appears.
