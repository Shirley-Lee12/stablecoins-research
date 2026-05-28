---
name: DB composite lib rebuild
description: After adding schema to lib/db, must rebuild libs before API server typecheck or new exports won't resolve.
---

**Rule:** Any time new tables are added to `lib/db/src/schema/`, run `pnpm run typecheck:libs` first, then run the API server typecheck. Skipping this causes TS2305 "Module has no exported member" errors.

**Why:** `lib/db` is a composite TypeScript project. The API server resolves its types from the emitted declarations, not from source. Without a rebuild, the declarations are stale and the new exports don't exist.

**How to apply:**
1. Add table file to `lib/db/src/schema/<name>.ts`
2. Re-export from `lib/db/src/schema/index.ts`
3. Run `pnpm run typecheck:libs` (builds all composite libs)
4. Then run `pnpm --filter @workspace/api-server run typecheck`
