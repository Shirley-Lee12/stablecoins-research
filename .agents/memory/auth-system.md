---
name: Auth system
description: JWT+bcrypt custom auth; tables, routes, and frontend context locations.
---

Custom auth built without Clerk — uses bcryptjs (hashing) + jose (JWT signing/verification).

**Rule:** SESSION_SECRET env var must be set; auth routes throw if missing.

**Why:** User explicitly wanted encrypted PostgreSQL user database with their own auth.

**How to apply:**
- DB tables: `lib/db/src/schema/users.ts` — `usersTable`, `passwordResetTokensTable`
- API routes: `artifacts/api-server/src/routes/auth.ts` — register, login, me, forgot-password, reset-password
- Frontend context: `artifacts/stablecoin-hub/src/lib/auth-context.tsx` — stores JWT in localStorage
- Auth dialog: `artifacts/stablecoin-hub/src/components/auth-dialog.tsx` — login/register/forgot/reset-success views
- Reset password page: `artifacts/stablecoin-hub/src/pages/reset-password.tsx` — reads `?token=` from URL
- JWTs expire in 30 days; reset tokens expire in 1 hour
- Forgot-password returns the raw token in the response body (no email integration); production would need SMTP
