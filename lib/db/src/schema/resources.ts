import { pgTable, text, serial, timestamp, pgEnum, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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
  // docs/planning/15 §5.2 — free-text keywords from the document itself, distinct from `tags`
  // (the controlled theme/jurisdiction/asset vocabulary). keywordsSource records where they came
  // from: 'extracted' (CNKI K1 field or a "Keywords:" section the PDF/URL extractor found),
  // 'manual' (user-typed), 'generated' (LLM-derived from the abstract when neither of the above
  // exists — §5.3's last-resort, non-authoritative fallback, must stay visibly labeled in the UI).
  // Null keywordsSource only ever pairs with an empty keywords array.
  keywords: text("keywords").array().notNull().default([]),
  keywordsSource: text("keywords_source"),
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
  // docs/planning/15 §2.4 — coarse-grained marker: true if an admin has ever directly edited this
  // resource's fields (title/authors/year/abstract/url/doi/facet tags) outside the normal approve/
  // reject review action. Lets the UI/future audits distinguish "system-extracted as-is" from "an
  // admin's judgment call touched this," without needing per-field history (not required yet per the doc).
  adminEdited: boolean("admin_edited").notNull().default(false),
  // docs/planning/16 §Commit 16.1 — the field-by-field verify report (lib/verify.ts's VerifyReport)
  // computed once at persist/resubmit time and cached here, so the admin detail view is a pure DB
  // read instead of re-running DOI-resolution/URL-reachability network calls every time it's opened.
  // Null only for rows that predate this column. Refreshed by the explicit POST .../reverify action,
  // never as a side effect of merely viewing the resource.
  verificationReport: jsonb("verification_report"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  // docs/planning/19 §19.2 — a natural-language explanation of why a resource was flagged
  // off_topic (e.g. "this paper studies X, which doesn't directly engage stablecoins or their
  // underlying theory/technology"), generated once via a lightweight LLM call at the moment
  // off_topic is first determined (persistConfirmedDraft — the only place that can happen, since
  // §19.1 means resubmission never re-runs theme-relevance detection). Cached here for the same
  // reason verificationReport is: never regenerate on every view. Null for anything that was never
  // off_topic, and for off_topic rows that predate this column.
  offTopicExplanation: text("off_topic_explanation"),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;

// App-level enum for resources.keywords_source (kept as a plain `text` column, not a pg enum, per
// docs/planning/15 §5.2 — mirrors how tags.category is also plain text).
export type KeywordsSource = "extracted" | "generated" | "manual";
