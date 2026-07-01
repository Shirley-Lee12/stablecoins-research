import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/** Controlled single-select list of reasons an admin can cite when rejecting a resource (docs/planning/12). */
export const rejectionReasonsTable = pgTable("rejection_reasons", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  nameZh: text("name_zh").notNull(),
  nameEn: text("name_en").notNull(),
});

export const insertRejectionReasonSchema = createInsertSchema(rejectionReasonsTable).omit({
  id: true,
});

export type InsertRejectionReason = z.infer<typeof insertRejectionReasonSchema>;
export type RejectionReason = typeof rejectionReasonsTable.$inferSelect;
