# Friday UI frontend restoration — 2026-10-19

This frontend-only candidate restores the actual React UI approved at local port 5300. It is an incremental commit from main `c8a7b6024c0b966781ed3aa4918e22586cacfdd8`; it does not reset the repository or redeploy the backend.

## Exact visual source

The matching historical frontend was recovered from Git tree `64b1a774c0205dec5e0bc11cb4019ca9a8a1fc3f` (frontend subtree `d1325f96881311748c482b5afe8d0d2198e30ede`). No containing commit was identified. The known full commit `5b197191ce3ca3fdf7e0ab35068fb46af43ffa25` exists but contains a different V0.2 UI; it is not falsely identified as this visual source. The matching 107 source files were the export used by port 5300.

The restored shell has one About sidebar entry, one Agentic sidebar entry, About's six top sections, Agentic's four top sections, independent protocol navigation, and the original task-oriented Agentic overview. Original CSS, typography, spacing and page structures come from that source. All 20 historical public static files remain present; current verified binary downloads and research PDF bytes are retained.

## Minimal safety changes

- Keep the backend, schema, moderation authorization, import isolation, deployment governance and all current source packages unchanged.
- Preserve existing regional public URLs as aliases alongside Friday's longer regional URLs.
- Restore the market preview through frontend-only dated snapshots: supply observed 2026-10-19; 50 returned top-50 USD-target candidates for mechanism group amounts; original provider classifications and the original explicit USDe override. This selected-project total is not the whole-market total. Prices are collection-time observations.
- Macro (11 series) and order books are preserved 2026-10-18 snapshots, not live data. Unknown observations remain null; no inferred market statistics, depeg events or chain issuance are substituted. All applicable pages disclose this boundary. Binance quote depth and slippage notionals are labelled USDT, not silently USD. The dashboard labels the concentration field as top-two, not USDT alone.
- Public resources, authors, regulations and account workflows retain their actual production API calls. No frozen copy of private resource/review queues is bundled.
- Remove the false operational quantitative-product and 2024 release-date claims. Early warning, measurement, regulatory mapping and empirical models remain future work.
- Research retains Friday's page structure but shows only conference-supplied representative risks, not the unverified complete 55-item list or the superseded full-taxonomy JPGs. Original data/images remain in Git. The supplied framework count is explicitly distinguished from a public verified full list. Manuscript download is labelled submitted anonymised manuscript.
- Do not republish A2P2 as a verified independent protocol. All approved later source packages remain archived unchanged for the next content-integration phase.
- Add accessible names to the original mobile login/menu icons and retain the existing password-toggle accessibility fix; no new visual component system is introduced.

## Exact candidate validation

- Project typecheck: PASS.
- Frontend production build: PASS with `VITE_API_BASE_URL=https://stablecoins-research-hub.onrender.com`. Existing bundler chunk-size/source-map warnings remain; no build error.
- Relevant regression: 21/21 PASS, skip=0, including seven restoration tests and fourteen governance tests with real isolated PGlite HTTP/workflow/persistence/rollback acceptance. No existing assertion was deleted. The earlier full 213-test suite includes assertions for the intentionally superseded UI; it was not represented as a full-suite pass for this restoration.
- Actual production-build browser checks: 33 routes × desktop1440/mobile390 × zh/en × light/dark = 264/264 PASS. Confirm innerWidth/clientWidth, DPR1, rendered content, no page exception, no page horizontal overflow, original sidebar/top navigation, real macro values and valid asset responses. Eight login/task interactions also pass.
- Actual language/theme/sidebar/top-nav clicks: PASS at desktop and 390px. No login credentials were submitted.
- Production API compatibility: forty unauthenticated GET checks PASS, including all 22 known pending IDs returning 404 and approved resources remaining available. Original response bodies/statuses are used for local build compatibility; local browser QA supplies local-origin CORS headers. Separate production-Origin health GET confirms `Access-Control-Allow-Origin: https://stablecoins-hub.onrender.com`.
- Production queue verification: SELECT-only transaction with read-only=on, ended with ROLLBACK. The 22 pending resources and eight ready-for-review imports retain their prior states and whole-row fingerprints. Production DML=0.
- Protected input check: no backend, lib/API/schema, frozen source-package or DEPLOYMENT.md changes. Local raw QA reports, queue records, credentials, private attachments and original repository modifications are excluded from the commit.

Detailed local evidence: `outputs/friday-ui-release-2026-10-19/` contains build/typecheck/test logs, browser results/screenshots, source hashes and read-only API/queue evidence. Queue evidence stays local and is not committed.

## Controlled frontend-only deployment

Owner-confirmed: both services' Auto-Deploy are Off. Owner screenshot shows frontend Live `542f534` after rollback, and a successful `c8a7b60` deployment with Rollback control. Owner supplied the known old successful recovery deployment:

`https://dashboard.render.com/static/srv-d92pojmh2hms73clutc0/deploys/dep-db7jt46i0phs7396fldg`

This is an OLD recovery target, not the Friday UI candidate. Backend code and schema remain unchanged; no backend deploy is required. Render browser reads timed out and were stopped; do not claim settings or Live deployment identity were independently read this run. Both-Off and recovery-target evidence is owner supplied. The backend's previously recorded successful deployment is `dep-db7jt46i0phs7396fl10`; its current live deployment ID was not newly read.

After independently checking remote main and fast-forward ancestry, push only the reviewed increment, then have the owner Manual Deploy the FRONTEND service `srv-d92pojmh2hms73clutc0` at the exact release SHA. Keep the existing production API environment value. Do not deploy the unchanged backend, apply migrations or replay data patches.

Production frontend smoke/visual QA remains pending until that manual deployment completes. If frontend production validation fails, use the verified existing successful frontend deployment's Rollback control; do not restore or change the database. Do not report the restoration as deployed merely because Git main was updated.

## Stop status at candidate preparation

FRIDAY_UI_DEPLOYED = NO
BACKEND_UNCHANGED = YES
PRODUCTION_DB_UNCHANGED = YES
LOCAL_BUILT_VISUAL_QA = PASS
LIVE_VISUAL_QA = PENDING_MANUAL_FRONTEND_DEPLOY

The exact release SHA and independent remote verification are recorded in the local release receipt after commit/push. Follow-up research, features and new visualizations are explicitly deferred to the next phase.
