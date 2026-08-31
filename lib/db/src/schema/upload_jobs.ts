import { pgTable, text, serial, timestamp, pgEnum, integer, jsonb, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// "citation" = the 4th entry point (docs/planning/06/14): one citation-export file (RefWorks/
// EndNote/NoteExpress) fans out into one job per parsed record, sharing a batchId like PDF/url-batch.
// "title" = either a no-URL reference that needs title search, or a short-lived Word/Markdown
// parent task marked by input.taskKind="reference_list". The worker atomically replaces the latter
// with one url/title child job per parsed reference, avoiding a database enum migration.
export const uploadJobTypeEnum = pgEnum("upload_job_type", ["pdf", "url", "citation", "title", "browser_capture"]);
export const uploadJobStatusEnum = pgEnum("upload_job_status", ["queued", "processing", "ready_for_review", "failed"]);

/**
 * Tracks PDF/Word/citation/batch upload progress so it survives a closed tab (resumable, pollable) —
 * NOT a place AI-parsed resource content becomes visible/queryable as a real resource. Only once
 * the user reviews a 'ready_for_review' job's `result` and explicitly confirms does a real row get
 * written to `resources` (see CLAUDE.md's parse -> confirm -> persist rule). Single DOI/URL uploads
 * skip this table entirely — that pipeline runs synchronously in one request/response.
 */
export const uploadJobsTable = pgTable("upload_jobs", {
  id: serial("id").primaryKey(),
  // Shared by every job created from the same batch submission (null for none, since a batch of
  // one is still possible) — lets the frontend resume "which jobs were in my last batch" from the
  // server after closing the tab, instead of relying on jobIds kept only in page memory.
  batchId: uuid("batch_id"),
  // Groups every sub-batch (pdf/citation/url/title) spun up from one folder-import submission
  // (docs/planning/14 §3.4) — a single folder can fan out into several batchIds (one per
  // classification bucket), and this is the higher-level id the frontend polls to show one combined
  // "this folder import" progress view instead of several disconnected batch progress bars. Null for
  // every other entry point (direct PDF/URL/citation submissions never had a "folder" to begin with).
  folderImportId: uuid("folder_import_id"),
  type: uploadJobTypeEnum("type").notNull(),
  status: uploadJobStatusEnum("status").notNull().default("queued"),
  // Original input, e.g. URL, parsed citation, or bounded extracted text. PDF/Word bytes are never
  // persisted here; reference-list parents keep only extracted text until they fan out.
  input: jsonb("input").notNull(),
  // Populated once the pipeline finishes: extracted six-elements + resolveLink result + computed
  // tags + verify report. Null while queued/processing.
  result: jsonb("result"),
  error: text("error"),
  // Retry bookkeeping is persisted so transient AI/scholar-API failures can be resumed after a
  // server restart. The original PDF/archive is deliberately not retained; `input` contains only
  // the bounded extracted text or parsed citation payload needed to continue.
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdBy: integer("created_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UploadJob = typeof uploadJobsTable.$inferSelect;
