import { pgTable, text, serial, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const sourceTypeEnum = pgEnum("source_type", [
  "Paper",
  "Report",
  "Gov Document",
  "News",
  "Experts & Scholars",
]);

export const resourceStatusEnum = pgEnum("resource_status", [
  "pending",
  "approved",
  "rejected",
]);

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authors: text("authors").array().notNull().default([]),
  sourceType: sourceTypeEnum("source_type").notNull().default("Paper"),
  url: text("url"),
  doi: text("doi"),
  abstract: text("abstract"),
  tags: text("tags").array().notNull().default([]),
  status: resourceStatusEnum("status").notNull().default("pending"),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
