import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { uploadJobsTable } from "./upload_jobs";

/** Admin-managed saved searches for discovering newly indexed literature. */
export const resourceSubscriptionsTable = pgTable("resource_subscriptions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  query: text("query").notNull(),
  // `crossref` is implemented first; keeping this as text[] makes adding official feeds additive.
  sources: text("sources").array().notNull().default(["crossref"]),
  frequency: text("frequency").notNull().default("weekly"),
  active: boolean("active").notNull().default(true),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull().defaultNow(),
  lastError: text("last_error"),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** New works found by a subscription. They remain private until an admin sends one to upload review. */
export const subscriptionCandidatesTable = pgTable("subscription_candidates", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => resourceSubscriptionsTable.id, { onDelete: "cascade" }),
  externalKey: text("external_key").notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  authors: text("authors").array().notNull().default([]),
  year: integer("year"),
  abstract: text("abstract"),
  doi: text("doi"),
  url: text("url"),
  rawMetadata: jsonb("raw_metadata"),
  status: text("status").notNull().default("new"),
  uploadJobId: integer("upload_job_id").references(() => uploadJobsTable.id, { onDelete: "set null" }),
  discoveredAt: timestamp("discovered_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("subscription_candidates_subscription_external_unique").on(table.subscriptionId, table.externalKey),
]);

export type ResourceSubscription = typeof resourceSubscriptionsTable.$inferSelect;
export type SubscriptionCandidate = typeof subscriptionCandidatesTable.$inferSelect;
