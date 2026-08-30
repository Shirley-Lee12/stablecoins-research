import { date, pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ourResearchTable = pgTable("our_research", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleZh: text("title_zh"),
  fileUrl: text("file_url"),
  abstract: text("abstract"),
  abstractZh: text("abstract_zh"),
  authors: text("authors").array().notNull().default([]),
  keyInnovations: text("key_innovations").array().notNull().default([]),
  keyInnovationsZh: text("key_innovations_zh").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  publishedDate: date("published_date"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertOurResearchSchema = createInsertSchema(
  ourResearchTable,
).omit({
  id: true,
  uploadedAt: true,
});
export type InsertOurResearch = z.infer<typeof insertOurResearchSchema>;
export type OurResearch = typeof ourResearchTable.$inferSelect;
