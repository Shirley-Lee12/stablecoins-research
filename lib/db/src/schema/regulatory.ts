import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { resourcesTable } from "./resources";
import { usersTable } from "./users";

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
  effectiveDate: date("effective_date").notNull(),
  category: text("category"),
  createdBy: integer("created_by").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const regulatoryResourcesTable = pgTable(
  "regulatory_resources",
  {
    id: serial("id").primaryKey(),
    regulatoryEntryId: integer("regulatory_entry_id")
      .notNull()
      .references(() => regulatoryEntriesTable.id, { onDelete: "cascade" }),
    resourceId: integer("resource_id")
      .notNull()
      .references(() => resourcesTable.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniquePair: unique().on(table.regulatoryEntryId, table.resourceId),
  }),
);

export const insertRegulatoryEntrySchema = createInsertSchema(
  regulatoryEntriesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRegulatoryEntry = z.infer<typeof insertRegulatoryEntrySchema>;
export type RegulatoryEntry = typeof regulatoryEntriesTable.$inferSelect;
