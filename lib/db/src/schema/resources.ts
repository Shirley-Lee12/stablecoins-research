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

// docs/planning/15 §0.9 — replaces the old pending/approved/rejected/needs_review/failed set.
// "failed" never belonged here (that's upload_jobs.status); "needs_review" was a single catch-all
// for four genuinely different problems that now get their own state, since each has a different
// answer to "can the submitter fix this themselves, or does it need an admin's judgment call"
// (docs/planning/15 §0.2):
//   - incomplete: one of the six elements (title/authors/year/abstract/keywords/url-or-doi) is
//     missing — the user can just add it.
//   - disputed: six elements present, but a field disagrees with an authoritative source (DOI
//     resolution, cross-checked authors/year) — the user can verify and correct it.
//   - off_topic: tagging found no theme-facet match at all — the user can confirm relevance or
//     withdraw.
//   - duplicate: an exact DOI/URL match, or a strong title+year fuzzy match, against an existing
//     resource (any status) — the user can confirm it's a genuinely different work or withdraw.
// None of the four above ever reach the admin queue — only pending does. rejected is the admin's
// own final call (source-quality or authenticity concerns that no self-check can resolve).
export const resourceStatusEnum = pgEnum("resource_status", [
  "incomplete",
  "disputed",
  "off_topic",
  "duplicate",
  "pending",
  "approved",
  "rejected",
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
