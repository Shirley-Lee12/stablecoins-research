import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ourResearchTable = pgTable("our_research", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  fileUrl: text("file_url"),
  abstract: text("abstract"),
  keyInnovations: text("key_innovations").array().notNull().default([]),
  tags: text("tags").array().notNull().default([]),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOurResearchSchema = createInsertSchema(ourResearchTable).omit({
  id: true,
  uploadedAt: true,
});
export type InsertOurResearch = z.infer<typeof insertOurResearchSchema>;
export type OurResearch = typeof ourResearchTable.$inferSelect;
