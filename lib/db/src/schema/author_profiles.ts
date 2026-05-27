import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const authorProfilesTable = pgTable("author_profiles", {
  name: text("name").primaryKey(),
  institution: text("institution"),
  bio: text("bio"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuthorProfileSchema = createInsertSchema(authorProfilesTable).omit({ updatedAt: true });
export type InsertAuthorProfile = z.infer<typeof insertAuthorProfileSchema>;
export type AuthorProfileRow = typeof authorProfilesTable.$inferSelect;
