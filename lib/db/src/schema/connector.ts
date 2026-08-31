import { index, integer, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Long-lived, narrowly scoped browser connections. The plaintext token is never persisted here;
 * tokenHash is an HMAC used only by the connector authentication middleware.
 */
export const connectorSessionsTable = pgTable("connector_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  clientId: text("client_id").notNull(),
  clientName: text("client_name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  tokenPrefix: text("token_prefix").notNull(),
  scope: text("scope").notNull().default("resource:capture"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("connector_sessions_user_idx").on(table.userId),
  index("connector_sessions_client_idx").on(table.clientId),
]);

/**
 * Ten-minute device authorization handshakes. encryptedToken exists only between website approval
 * and the extension's first successful poll, then is cleared and the row becomes unusable.
 */
export const connectorPairingsTable = pgTable("connector_pairings", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  pollSecretHash: text("poll_secret_hash").notNull(),
  clientId: text("client_id").notNull(),
  clientName: text("client_name").notNull(),
  status: text("status").notNull().default("pending"),
  authorizedBy: integer("authorized_by").references(() => usersTable.id, { onDelete: "cascade" }),
  sessionId: integer("session_id").references(() => connectorSessionsTable.id, { onDelete: "set null" }),
  encryptedToken: text("encrypted_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("connector_pairings_expiry_idx").on(table.expiresAt),
]);

export type ConnectorSession = typeof connectorSessionsTable.$inferSelect;
export type ConnectorPairing = typeof connectorPairingsTable.$inferSelect;
