import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Admin-editable runtime config (key/value). Checked before falling back to
 * process.env — see getSetting() in api-server/src/lib/settings.ts.
 * Secrets are stored here in plaintext, same trust boundary as env vars:
 * never returned in plaintext over any API response.
 */
export const appSettingsTable = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AppSetting = typeof appSettingsTable.$inferSelect;
