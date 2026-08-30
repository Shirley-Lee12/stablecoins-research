import { boolean, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userFollowsTable = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetKey: text("target_key").notNull(),
  targetLabel: text("target_label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueFollow: unique().on(table.userId, table.targetType, table.targetKey),
}));

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("resource_update"),
  title: text("title").notNull(),
  titleZh: text("title_zh"),
  body: text("body"),
  bodyZh: text("body_zh"),
  href: text("href"),
  read: boolean("read").notNull().default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  emailAttemptedAt: timestamp("email_attempted_at", { withTimezone: true }),
  emailAttempts: integer("email_attempts").notNull().default(0),
  emailLastError: text("email_last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserFollow = typeof userFollowsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
