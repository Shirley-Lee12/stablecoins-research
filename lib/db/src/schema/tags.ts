import { pgTable, text, serial, timestamp, pgEnum, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resourcesTable } from "./resources";

export const tagFacetEnum = pgEnum("tag_facet", ["theme", "jurisdiction", "asset"]);
export const tagStatusEnum = pgEnum("tag_status", ["active", "candidate"]);
export const resourceTagSourceEnum = pgEnum("resource_tag_source", ["auto", "manual"]);

export const tagsTable = pgTable("tags", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh").notNull(),
  facet: tagFacetEnum("facet").notNull(),
  // Definition sentence used for embedding-similarity matching against resource abstracts
  // (theme facet). Less central for jurisdiction/asset facets, which match by entity name instead.
  definition: text("definition"),
  // Region grouping, e.g. "Americas" | "Europe" | "APAC" | "Middle East" | "Africa" | "Global".
  // Only meaningful for facet='jurisdiction'; null for theme/asset.
  region: text("region"),
  status: tagStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resourceTagsTable = pgTable("resource_tags", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resourcesTable.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => tagsTable.id, { onDelete: "cascade" }),
  // 'auto' rows are rebuilt freely on every retagResources() rerun; 'manual' rows (admin-added)
  // are never touched by the rerun, so human corrections survive a full-library retag.
  source: resourceTagSourceEnum("source").notNull().default("auto"),
}, (table) => ({
  uniquePair: unique().on(table.resourceId, table.tagId),
}));

export const insertTagSchema = createInsertSchema(tagsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tagsTable.$inferSelect;
export type ResourceTag = typeof resourceTagsTable.$inferSelect;
