import { date, integer, jsonb, numeric, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export type ReserveComponent = { asset: string; amountUsd?: number; sharePct?: number; maturityBucket?: string };

export const issuerDisclosuresTable = pgTable("issuer_disclosures", {
  id: serial("id").primaryKey(),
  issuerSlug: text("issuer_slug").notNull(),
  issuerName: text("issuer_name").notNull(),
  productSymbols: text("product_symbols").array().notNull().default([]),
  reportPeriodEnd: date("report_period_end").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  sourceUrl: text("source_url").notNull(),
  sourceType: text("source_type").notNull(),
  reserveTotalUsd: numeric("reserve_total_usd", { precision: 24, scale: 2, mode: "number" }),
  reserveComponents: jsonb("reserve_components").$type<ReserveComponent[]>().notNull().default([]),
  maturityProfile: text("maturity_profile"),
  custodians: text("custodians").array().notNull().default([]),
  counterparties: text("counterparties").array().notNull().default([]),
  redemptionTerms: text("redemption_terms"),
  assuranceProvider: text("assurance_provider"),
  assuranceType: text("assurance_type"),
  assuranceLagDays: integer("assurance_lag_days"),
  revenueStructure: text("revenue_structure"),
  reportedEarningsUsd: numeric("reported_earnings_usd", { precision: 24, scale: 2, mode: "number" }),
  notes: text("notes"),
  reviewStatus: text("review_status").notNull().default("draft"),
  createdBy: integer("created_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedBy: integer("reviewed_by").references(() => usersTable.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertIssuerDisclosureSchema = createInsertSchema(issuerDisclosuresTable).omit({
  id: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIssuerDisclosure = z.infer<typeof insertIssuerDisclosureSchema>;
export type IssuerDisclosure = typeof issuerDisclosuresTable.$inferSelect;
