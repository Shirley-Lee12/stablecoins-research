import { pgTable, text, serial, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resourcesTable } from "./resources";

export const institutionsTable = pgTable("institutions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  country: text("country"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authorsTable = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  institutionId: integer("institution_id").references(() => institutionsTable.id, { onDelete: "set null" }),
  researchInterests: text("research_interests").array().notNull().default([]),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueNamePerInstitution: unique().on(table.name, table.institutionId),
}));

export const resourceAuthorsTable = pgTable("resource_authors", {
  id: serial("id").primaryKey(),
  resourceId: integer("resource_id").notNull().references(() => resourcesTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => authorsTable.id, { onDelete: "cascade" }),
}, (table) => ({
  uniquePair: unique().on(table.resourceId, table.authorId),
}));

export const insertInstitutionSchema = createInsertSchema(institutionsTable).omit({
  id: true,
  createdAt: true,
});
export const insertAuthorSchema = createInsertSchema(authorsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInstitution = z.infer<typeof insertInstitutionSchema>;
export type Institution = typeof institutionsTable.$inferSelect;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authorsTable.$inferSelect;
export type ResourceAuthor = typeof resourceAuthorsTable.$inferSelect;
