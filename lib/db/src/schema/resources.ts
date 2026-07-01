import { pgTable, text, serial, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { rejectionReasonsTable } from "./rejectionReasons";

// Language-independent slugs (see docs/planning/08-sourceType最终枚举.md) — the frontend maps
// each slug to nameZh/nameEn for display. "Experts & Scholars" was removed: experts are their own
// module (authors), not a resource source type.
export const sourceTypeEnum = pgEnum("source_type", [
  "journal_article",
  "working_paper",
  "conference_paper",
  "thesis",
  "report",
  "gov_document",
  "news",
]);

export const resourceStatusEnum = pgEnum("resource_status", [
  "pending",
  "approved",
  "rejected",
  // Added for the upload pipeline (U.5): verification found issues or incomplete required fields —
  // routed to the admin review queue instead of being silently dropped.
  "needs_review",
  // Defined here but the app never actually assigns it: completeness failures (missing title/
  // author/year) are now rejected outright at confirm time (see missingHardRequiredFields() in
  // lib/resourceStatus.ts) instead of being persisted with this status. "failed" belongs to
  // upload_jobs.status — that's the one place extraction-level failures live.
  "failed",
]);

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors").array().notNull().default([]),
  sourceType: sourceTypeEnum("source_type").notNull().default("journal_article"),
  url: text("url"),
  doi: text("doi"),
  abstract: text("abstract"),
  tags: text("tags").array().notNull().default([]),
  status: resourceStatusEnum("status").notNull().default("pending"),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  // The document's own publication date (e.g. "2021" or "2021-07-20"), distinct from createdAt
  // (when it was added to this library). Free-text since precision varies by source.
  publishedDate: text("published_date"),
  // Review trail (docs/planning/12) — only set when an admin acts via PATCH /admin/resources/:id/review.
  // Rejecting doesn't delete the row: the reason/note stay attached so the original uploader can see
  // why, and so a future "edit and resubmit" flow has something to show.
  rejectionReasonId: integer("rejection_reason_id").references(() => rejectionReasonsTable.id, { onDelete: "set null" }),
  rejectionNote: text("rejection_note"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
