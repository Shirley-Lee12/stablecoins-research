# Render Deployment Runbook

The production site already uses two Render services:

| Service | Runtime | Purpose |
| --- | --- | --- |
| [`stablecoins hub`](https://stablecoins-hub.onrender.com) | Static | React/Vite frontend |
| [`stablecoins research hub`](https://stablecoins-research-hub.onrender.com) | Node | Express API and background jobs |

## Review queue release gate

Before a production release, inspect the My Contributions and admin review queues and verify that unapproved resources and unconfirmed imports remain non-public, durable, and accessible only through their authorized workflows.

Outstanding review items do not, by themselves, block a code-only release when public-content isolation, queue persistence, moderation permissions, schema compatibility, and rollback readiness have been verified.

A release that changes moderation semantics, import processing, resource visibility, authorization, or database schema requires additional release-specific compatibility validation.

No pending resource or import job may be approved, rejected, deleted, confirmed, or cleared merely to satisfy a deployment prerequisite.

### Scope and required evidence

- **Case A — code-only release:** retained review items are permitted only after verifying no destructive schema change, valid review-state handling, public-only resource access, durable unconfirmed imports, authorized moderation, version compatibility, and a usable recovery plan. Calling a release "code-only" does not establish these checks.
- **Case B — review-sensitive release:** changes to moderation logic, import processing, authorization, public visibility rules, database schema, or review audit storage require enhanced validation of every affected path against the existing database and review states. A failed or unknown core check blocks use of this rule.
- Verify legacy list/search/recent/detail and author aggregation as well as new public-directory resources/researchers. Test direct non-public IDs, filters/counts, and any resource download routes. Approved content must remain available.
- In an isolated database with synthetic accounts and fixtures, exercise submission, explicit confirmation for citation/URL/PDF imports, administrator approval, rejection with a reason, owner resubmission, authorization failures, restart recovery, and old/new/rollback code compatibility. Do not use production review items as writable test fixtures.
- Compare before/after queue IDs, statuses, ownership, review fields, and original-content fingerprints. Record unresolved items in the release ledger; retaining them is not an approval or a claim that the queues are empty. Production queue checks are SELECT-only unless a separate data-change task is expressly authorized.
- Verify the actual production recovery plan independently: record both services' current Live deployment IDs/commits and usable recovery targets, plus data restoration requirements if applicable. Fixture rollback compatibility does not prove Render rollback availability or deployment control.
- Record commands, versions, results, and limitations for the exact candidate. A skipped, failed, or unavailable mandatory acceptance check is not a pass. `scripts/tests/release-governance.test.ts` requires an isolated installed `@electric-sql/pglite` runtime supplied through `GOVERNANCE_PGLITE_MODULE`; its integration test must actually run for governance acceptance.

The owner-approved revision of 2026-10-18 changes the deployment prerequisite only. Resource inclusion standards, human review authority, and parse → confirm → persist remain in effect. Research deliverables retain their existing review status.


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
Build Command: corepack pnpm install --frozen-lockfile && corepack pnpm run build
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
Build Command: corepack pnpm install --frozen-lockfile && corepack pnpm run build
Start Command: node --enable-source-maps dist/index.mjs
Health Check Path: /api/healthz
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
EMAIL_PROVIDER
FRONTEND_URL
CORS_ORIGIN
SCHOLAR_CONTACT_EMAIL
```

Email-provider credentials are conditional:

```text
# EMAIL_PROVIDER=brevo
BREVO_API_KEY
BREVO_FROM_EMAIL

# EMAIL_PROVIDER=microsoft_graph
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_REFRESH_TOKEN
MICROSOFT_FROM_EMAIL
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

## Microsoft Graph mail authorization

The sender account uses delegated Microsoft Graph access. End users do not sign in to Microsoft; only the Outlook sender account completes this one-time authorization.

1. Configure these three values in the local `.env` file. Never commit or send their values in chat:

   ```text
   MICROSOFT_CLIENT_ID
   MICROSOFT_CLIENT_SECRET
   MICROSOFT_FROM_EMAIL
   ```

2. Register `http://localhost:53682/callback` as a Web redirect URI in the Microsoft app and grant delegated `Mail.Send` and `offline_access` permissions.
3. From the repository root, run:

   ```bash
   pnpm --filter @workspace/scripts microsoft-mail-oauth
   ```

4. Open the authorization URL printed by the helper and sign in with the Outlook sender account. The helper writes all production mail variables to the ignored, permission-restricted file `output/microsoft-graph.env`.
5. Confirm variable names without revealing values:

   ```bash
   sed -n -E 's/^(EMAIL_PROVIDER|MICROSOFT_[A-Z_]+)=.*/\1=CONFIGURED/p' output/microsoft-graph.env
   ```

6. Copy those five variables into the Render backend Environment page. Do not upload `output/microsoft-graph.env` or add it to Git.

Microsoft refresh tokens can be revoked by password, consent, or account-security changes. If production mail starts returning an OAuth token error, rerun the helper and replace `MICROSOFT_REFRESH_TOKEN` in Render with the newly generated value.

## Release sequence

1. Check the My Contributions and admin review queues and record unresolved IDs, statuses, ownership, and review evidence in the release ledger. Do not clear items to qualify a release.
2. Verify public-content and import isolation, queue persistence, moderation permissions, schema/version compatibility, and rollback readiness under the review queue release gate above. Run enhanced compatibility validation for a review-sensitive release. Continue only after all required gates pass; unknown or failed results block deployment.
3. Back up the production database before migrations or bulk data correction. Separate code rollback from any independently authorized data correction or restoration.
4. Run type checks, builds, and focused tests locally for the exact candidate, including the required isolated governance checks. Record before/after queue evidence without changing production review states.
5. Review the pending Git diff and commit only the intended release changes. Record the exact new candidate SHA and independently verify remote branch/main state and Render deployment control.
6. Under explicit release authorization, push the production branch only after the required gates pass and the backend → frontend deployment order is controlled. If Auto-Deploy is disabled, deploy the backend first and the frontend second from Render.
7. Confirm `/api/healthz`, authentication, approved resource browsing, My Contributions, admin review, file upload, and background-job progress in production. Recheck that retained unapproved resources and unconfirmed imports remain private and durable.
8. Review Render logs and roll back the code release if a production-only regression appears. Preserve queue and review records, verify recovery, and keep unresolved review items in the ledger; do not restore an old database image over legitimate newer review decisions.
