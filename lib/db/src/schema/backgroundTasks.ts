import { pgTable, serial, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/** Durable server-side work that must outlive the page which started it. */
export const backgroundTasksTable = pgTable("background_tasks", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("queued"),
  payload: jsonb("payload").notNull(),
  result: jsonb("result"),
  error: text("error"),
  total: integer("total").notNull().default(0),
  processed: integer("processed").notNull().default(0),
  createdBy: integer("created_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type BackgroundTask = typeof backgroundTasksTable.$inferSelect;
