import { pgTable, serial, integer, timestamp, jsonb, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { resourcesTable } from "./resources";

export const editSuggestionStatusEnum = pgEnum("edit_suggestion_status", ["pending", "approved", "rejected"]);

/**
 * docs/planning/20 §20.1 — generalizes doc 18.4's tag_keyword_edit_suggestions (which only covered
 * Theme/Jurisdiction/Asset tags + keywords) to any editable resource field: any logged-in user can
 * propose a change to title/authors/publishedDate/abstract/url/doi/themeTags/jurisdictionTags/
 * assetTags/keywords; a non-admin's proposal lands here as `status='pending'` instead of writing
 * directly. An admin's own edits never go through this table — they write straight through the
 * existing PATCH /resources/:id path (§18.4's "admin writes are direct" rule, unchanged by this).
 *
 * proposedFields/previousFields are a single JSONB blob per row (not one column per field) so that
 * adding another editable field later doesn't require a schema migration — only the keys actually
 * being proposed are present in either object, using the same key names for both. previousFields is
 * a snapshot of the resource's own values for exactly those keys, taken at submission time — it's
 * the basis for the review-queue diff and for §20.1b's conflict detection (comparing the snapshot
 * against the resource's actual current value at approval time).
 */
export const resourceEditSuggestionsTable = pgTable("resource_edit_suggestions", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resourcesTable.id, { onDelete: "cascade" }),
  submittedBy: integer("submitted_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  proposedFields: jsonb("proposed_fields").notNull(),
  previousFields: jsonb("previous_fields").notNull(),
  status: editSuggestionStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
});

export const insertResourceEditSuggestionSchema = createInsertSchema(resourceEditSuggestionsTable).omit({
  id: true,
  submittedAt: true,
});

export type InsertResourceEditSuggestion = z.infer<typeof insertResourceEditSuggestionSchema>;
export type ResourceEditSuggestion = typeof resourceEditSuggestionsTable.$inferSelect;

/** The field keys a suggestion's proposedFields/previousFields may contain (docs/planning/20 §20.1). */
export interface SuggestibleResourceFields {
  title?: string;
  authors?: string[];
  publishedDate?: string | null;
  abstract?: string | null;
  url?: string | null;
  doi?: string | null;
  themeTags?: number[];
  jurisdictionTags?: number[];
  assetTags?: number[];
  keywords?: string[];
}
