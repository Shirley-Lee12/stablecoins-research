import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Last-known-good snapshots for externally sourced market datasets.
 *
 * Only successful collections are written. A failed refresh therefore never
 * replaces a usable snapshot with an error or an empty payload.
 */
export const marketDataSnapshotsTable = pgTable("market_data_snapshots", {
  key: text("key").primaryKey(),
  source: text("source").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MarketDataSnapshot = typeof marketDataSnapshotsTable.$inferSelect;

