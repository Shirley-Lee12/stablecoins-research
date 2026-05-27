import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleZh: text("title_zh"),
  abstract: text("abstract"),
  abstractZh: text("abstract_zh"),
  keywords: text("keywords").array().notNull().default([]),
  authors: text("authors").array().notNull().default([]),
  url: text("url"),
  doi: text("doi"),
  resourceType: text("resource_type").notNull().default("paper"),
  tags: text("tags").array().notNull().default([]),
  publishedDate: text("published_date"),
  journal: text("journal"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true, createdAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
