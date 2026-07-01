import { pgTable, text, serial, timestamp, pgEnum, integer, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const uploadJobTypeEnum = pgEnum("upload_job_type", ["pdf", "url"]);
export const uploadJobStatusEnum = pgEnum("upload_job_status", ["queued", "processing", "ready_for_review", "failed"]);

/**
 * Tracks batch/PDF upload pipeline progress so it survives a closed tab (resumable, pollable) —
 * NOT a place AI-parsed resource content becomes visible/queryable as a real resource. Only once
 * the user reviews a 'ready_for_review' job's `result` and explicitly confirms does a real row get
 * written to `resources` (see CLAUDE.md's parse -> confirm -> persist rule). Single DOI/URL uploads
 * skip this table entirely — that pipeline runs synchronously in one request/response.
 */
export const uploadJobsTable = pgTable("upload_jobs", {
  id: serial("id").primaryKey(),
  type: uploadJobTypeEnum("type").notNull(),
  status: uploadJobStatusEnum("status").notNull().default("queued"),
  // Original input, e.g. { fileName, sourceTypeHint } or { url, sourceTypeHint }. PDF bytes are
  // never persisted here or anywhere (memory-only, same rule as the existing /import/pdf route).
  input: jsonb("input").notNull(),
  // Populated once the pipeline finishes: extracted six-elements + resolveLink result + computed
  // tags + verify report. Null while queued/processing.
  result: jsonb("result"),
  error: text("error"),
  createdBy: integer("created_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UploadJob = typeof uploadJobsTable.$inferSelect;
