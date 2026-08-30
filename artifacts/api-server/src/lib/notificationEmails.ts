import { and, asc, eq, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";
import { logger } from "./logger";
import { sendPublicationDigestEmail, sendPublicationNotificationEmail, type PublicationNotificationMail } from "./mailer";

const MAX_ATTEMPTS = 5;
const HOUR_MS = 60 * 60_000;

interface PendingNotification extends PublicationNotificationMail {
  id: number;
  userId: number;
  email: string;
  locale: string;
  digest: string;
  createdAt: Date;
}

function pendingEmailRows() {
  return db.select({
    id: notificationsTable.id,
    userId: notificationsTable.userId,
    title: notificationsTable.title,
    titleZh: notificationsTable.titleZh,
    body: notificationsTable.body,
    bodyZh: notificationsTable.bodyZh,
    href: notificationsTable.href,
    createdAt: notificationsTable.createdAt,
    email: usersTable.email,
    locale: usersTable.locale,
    digest: usersTable.notificationDigest,
  }).from(notificationsTable)
    .innerJoin(usersTable, eq(notificationsTable.userId, usersTable.id));
}

async function markDelivered(ids: number[]): Promise<void> {
  if (!ids.length) return;
  await db.update(notificationsTable).set({
    emailSentAt: new Date(),
    emailAttemptedAt: new Date(),
    emailLastError: null,
  }).where(inArray(notificationsTable.id, ids));
}

async function markFailed(ids: number[], error: unknown): Promise<void> {
  if (!ids.length) return;
  const message = error instanceof Error ? error.message.slice(0, 1000) : "Unknown email delivery error";
  await db.update(notificationsTable).set({
    emailAttemptedAt: new Date(),
    emailAttempts: sql`${notificationsTable.emailAttempts} + 1`,
    emailLastError: message,
  }).where(inArray(notificationsTable.id, ids));
}

export async function deliverInstantNotificationEmail(notificationId: number): Promise<void> {
  try {
    const [row] = await pendingEmailRows().where(and(
      eq(notificationsTable.id, notificationId),
      isNull(notificationsTable.emailSentAt),
      eq(usersTable.emailVerified, true),
      eq(usersTable.notificationEmail, true),
      eq(usersTable.notificationDigest, "instant"),
      lt(notificationsTable.emailAttempts, MAX_ATTEMPTS),
    )).limit(1);
    if (!row) return;
    await sendPublicationNotificationEmail(row.email, row, row.locale);
    await markDelivered([row.id]);
  } catch (error) {
    await markFailed([notificationId], error).catch((markError) => logger.error({ error: markError, notificationId }, "Failed to record notification email error"));
    logger.error({ error, notificationId }, "Instant notification email failed");
  }
}

async function deliverDigest(frequency: "daily" | "weekly", now: Date): Promise<void> {
  const minimumAge = frequency === "daily" ? 24 * HOUR_MS : 7 * 24 * HOUR_MS;
  const rows = await pendingEmailRows().where(and(
    isNull(notificationsTable.emailSentAt),
    eq(usersTable.emailVerified, true),
    eq(usersTable.notificationEmail, true),
    eq(usersTable.notificationDigest, frequency),
    lte(notificationsTable.createdAt, new Date(now.getTime() - minimumAge)),
    lt(notificationsTable.emailAttempts, MAX_ATTEMPTS),
  )).orderBy(asc(notificationsTable.createdAt)).limit(500);

  const groups = new Map<number, PendingNotification[]>();
  for (const row of rows) groups.set(row.userId, [...(groups.get(row.userId) ?? []), row]);
  for (const items of groups.values()) {
    const ids = items.map((item) => item.id);
    try {
      await sendPublicationDigestEmail(items[0].email, items, items[0].locale, frequency);
      await markDelivered(ids);
    } catch (error) {
      await markFailed(ids, error);
      logger.error({ error, userId: items[0].userId, frequency, notificationIds: ids }, "Notification digest email failed");
    }
  }
}

export async function runDueNotificationEmails(): Promise<void> {
  const retryBefore = new Date(Date.now() - HOUR_MS);
  const instant = await pendingEmailRows().where(and(
    isNull(notificationsTable.emailSentAt),
    eq(usersTable.emailVerified, true),
    eq(usersTable.notificationEmail, true),
    eq(usersTable.notificationDigest, "instant"),
    lt(notificationsTable.emailAttempts, MAX_ATTEMPTS),
    or(isNull(notificationsTable.emailAttemptedAt), lte(notificationsTable.emailAttemptedAt, retryBefore)),
  )).orderBy(asc(notificationsTable.createdAt)).limit(100);
  for (const row of instant) await deliverInstantNotificationEmail(row.id);
  const now = new Date();
  await deliverDigest("daily", now);
  await deliverDigest("weekly", now);
}

export function startNotificationEmailScheduler(): void {
  const initial = setTimeout(() => void runDueNotificationEmails().catch((error) => logger.error({ error }, "Notification email scheduler failed")), 30_000);
  initial.unref();
  const timer = setInterval(() => void runDueNotificationEmails().catch((error) => logger.error({ error }, "Notification email scheduler failed")), HOUR_MS);
  timer.unref();
}
