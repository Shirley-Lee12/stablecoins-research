---
  name: Gemini import route
  description: How POST /api/resources/import works — Gemini-powered metadata extraction for literature ingestion
  ---

  ## Rule
  POST /api/resources/import does NOT save to DB — it returns parsed metadata only. The frontend modal lets users edit before calling POST /api/resources to actually persist.

  ## How it works
  1. Accept { url, source_type? } in body
  2. Server-side fetch of the URL (stripped of HTML tags, capped at 8000 chars)
  3. Call gemini-2.5-flash with responseMimeType: "application/json" — structured prompt extracts title/authors/abstract/tags/sourceType
  4. Return sanitised JSON to frontend
  5. Frontend ImportModal renders editable fields + tag chip editor
  6. On confirm, POST /api/resources writes to Supabase

  ## Key dependencies
  - @google/generative-ai (added to @workspace/api-server)
  - GOOGLE_API_KEY Replit Secret
  - Drizzle resourcesTable with sourceTypeEnum including "Experts & Scholars"

  **Why:** Two-step (parse → confirm) prevents bad AI output from polluting the DB without human review.

  **How to apply:** If adding other AI-powered ingestion flows, keep the same parse-then-confirm pattern.
  