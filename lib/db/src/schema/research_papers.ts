import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const researchPapersTable = pgTable("research_papers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleZh: text("title_zh"),
  abstract: text("abstract"),
  abstractZh: text("abstract_zh"),
  keyInnovations: text("key_innovations").array().notNull().default([]),
  keyInnovationsZh: text("key_innovations_zh").array().notNull().default([]),
  authors: text("authors").array().notNull().default([]),
  publishedDate: text("published_date"),
  pdfUrl: text("pdf_url"),
  keywords: text("keywords").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertResearchPaperSchema = createInsertSchema(researchPapersTable).omit({ id: true, createdAt: true });
export type InsertResearchPaper = z.infer<typeof insertResearchPaperSchema>;
export type ResearchPaper = typeof researchPapersTable.$inferSelect;
