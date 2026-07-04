import { pgTable, serial, integer, timestamp, jsonb, text, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { resourcesTable } from "./resources";

export const editSuggestionStatusEnum = pgEnum("edit_suggestion_status", ["pending", "approved", "rejected"]);

/**
 * docs/planning/18 §18.4 — any logged-in user can propose a tag/keyword change; a non-admin's
 * proposal lands here as `status='pending'` instead of writing to resource_tags/resources.keywords
 * directly. An admin's own edits never go through this table (they write straight through the
 * existing PATCH /resources/:id path, per §18.4's "admin writes are direct" rule) — this table only
 * ever holds non-admin proposals awaiting admin review.
 *
 * The three proposed*TagIds columns are split by facet (rather than one combined array) purely so
 * the review-queue diff view can render "current vs proposed" per facet without having to re-derive
 * which id belongs to which facet from the tags table on every render.
 */
export const tagKeywordEditSuggestionsTable = pgTable("tag_keyword_edit_suggestions", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resourcesTable.id, { onDelete: "cascade" }),
  submittedBy: integer("submitted_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  // Each is a number[] (theme/jurisdiction/asset) or string[] (keywords) — proposed full replacement
  // set for that field, not a diff/patch.
  proposedThemeTags: jsonb("proposed_theme_tags").notNull(),
  proposedJurisdictionTags: jsonb("proposed_jurisdiction_tags").notNull(),
  proposedAssetTags: jsonb("proposed_asset_tags").notNull(),
  proposedKeywords: jsonb("proposed_keywords").notNull(),
  status: editSuggestionStatusEnum("status").notNull().default("pending"),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
});

export const insertTagKeywordEditSuggestionSchema = createInsertSchema(tagKeywordEditSuggestionsTable).omit({
  id: true,
  submittedAt: true,
});

export type InsertTagKeywordEditSuggestion = z.infer<typeof insertTagKeywordEditSuggestionSchema>;
export type TagKeywordEditSuggestion = typeof tagKeywordEditSuggestionsTable.$inferSelect;
