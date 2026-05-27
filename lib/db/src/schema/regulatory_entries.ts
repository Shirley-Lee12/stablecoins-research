import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const regulatoryEntriesTable = pgTable("regulatory_entries", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  region: text("region"),
  authority: text("authority"),
  title: text("title").notNull(),
  titleZh: text("title_zh"),
  summary: text("summary"),
  summaryZh: text("summary_zh"),
  documentUrl: text("document_url"),
  effectiveDate: text("effective_date").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRegulatoryEntrySchema = createInsertSchema(regulatoryEntriesTable).omit({ id: true, createdAt: true });
export type InsertRegulatoryEntry = z.infer<typeof insertRegulatoryEntrySchema>;
export type RegulatoryEntry = typeof regulatoryEntriesTable.$inferSelect;
