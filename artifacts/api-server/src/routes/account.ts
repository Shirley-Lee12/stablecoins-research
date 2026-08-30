import { Router } from "express";
import crypto from "node:crypto";
import { and, desc, eq, gt, ne } from "drizzle-orm";
import { z } from "zod/v4";
import { db, emailVerificationCodesTable, notificationsTable, userFollowsTable, usersTable } from "@workspace/db";
import { requireAuth } from "./auth";
import { env } from "../config";
import { sendEmailChangeCodeEmail } from "../lib/mailer";
import { createRateLimiter, ipAndEmailKey } from "../lib/rateLimit";

const router = Router();
const emailChangeRequestLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 3, key: ipAndEmailKey });
const emailChangeConfirmLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 8, key: ipAndEmailKey });

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  institution: z.string().trim().max(180).nullable().optional(),
  title: z.string().trim().max(120).nullable().optional(),
  bio: z.string().trim().max(1200).nullable().optional(),
  locale: z.enum(["zh", "en"]),
  themePreference: z.enum(["light", "dark", "system"]),
  fontScale: z.enum(["small", "medium", "large"]),
  notificationInApp: z.boolean(),
  notificationEmail: z.boolean(),
  notificationDigest: z.enum(["instant", "daily", "weekly", "off"]),
});

const profileFields = {
  id: usersTable.id,
  email: usersTable.email,
  name: usersTable.name,
  role: usersTable.role,
  emailVerified: usersTable.emailVerified,
  institution: usersTable.institution,
  title: usersTable.title,
  bio: usersTable.bio,
  locale: usersTable.locale,
  themePreference: usersTable.themePreference,
  fontScale: usersTable.fontScale,
  notificationInApp: usersTable.notificationInApp,
  notificationEmail: usersTable.notificationEmail,
  notificationDigest: usersTable.notificationDigest,
  createdAt: usersTable.createdAt,
};

router.get("/account/profile", requireAuth, async (req: any, res) => {
  const [profile] = await db.select(profileFields).from(usersTable).where(eq(usersTable.id, req.user.userId)).limit(1);
  if (!profile) { res.status(404).json({ error: "User not found" }); return; }
  res.json(profile);
});

router.patch("/account/profile", requireAuth, async (req: any, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid profile data" }); return; }
  const data = parsed.data;
  const [profile] = await db.update(usersTable).set({
    ...data,
    institution: data.institution || null,
    title: data.title || null,
    bio: data.bio || null,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, req.user.userId)).returning(profileFields);
  res.json(profile);
});

const emailChangeRequestSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
});

const emailChangeConfirmSchema = emailChangeRequestSchema.extend({
  code: z.string().regex(/^\d{6}$/),
});

function generateSixDigitCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashEmailChangeCode(email: string, code: string): string {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(`email-change:${email}:${code}`).digest("hex");
}

router.post("/account/email-change/request", requireAuth, emailChangeRequestLimiter, async (req: any, res) => {
  const parsed = emailChangeRequestSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Please enter a valid email address." }); return; }
  const email = parsed.data.email;
  if (email === req.user.email.toLowerCase()) { res.status(400).json({ error: "This is already your current email." }); return; }

  const [duplicate] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(and(eq(usersTable.email, email), ne(usersTable.id, req.user.userId))).limit(1);
  if (duplicate) { res.status(409).json({ error: "This email is already in use." }); return; }

  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  const [codeRow] = await db.transaction(async (tx) => {
    await tx.update(emailVerificationCodesTable).set({ used: true }).where(and(
      eq(emailVerificationCodesTable.userId, req.user.userId),
      eq(emailVerificationCodesTable.used, false),
    ));
    return tx.insert(emailVerificationCodesTable).values({
      userId: req.user.userId,
      code: hashEmailChangeCode(email, code),
      expiresAt,
    }).returning({ id: emailVerificationCodesTable.id });
  });

  try {
    await sendEmailChangeCodeEmail(email, code);
  } catch (mailErr) {
    await db.update(emailVerificationCodesTable).set({ used: true }).where(eq(emailVerificationCodesTable.id, codeRow.id));
    req.log.error({ err: mailErr }, "Email change verification delivery failed");
    res.status(503).json({
      error: "Verification email could not be sent. Your current email has not changed.",
      code: "EMAIL_DELIVERY_FAILED",
    });
    return;
  }

  res.json({ message: "Verification code sent to the new email.", email });
});

router.post("/account/email-change/confirm", requireAuth, emailChangeConfirmLimiter, async (req: any, res) => {
  const parsed = emailChangeConfirmSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Enter the new email and its 6-digit verification code." }); return; }
  const { email, code } = parsed.data;
  const [codeRow] = await db.select().from(emailVerificationCodesTable).where(and(
    eq(emailVerificationCodesTable.userId, req.user.userId),
    eq(emailVerificationCodesTable.code, hashEmailChangeCode(email, code)),
    eq(emailVerificationCodesTable.used, false),
    gt(emailVerificationCodesTable.expiresAt, new Date()),
  )).limit(1);
  if (!codeRow) { res.status(400).json({ error: "Invalid or expired verification code." }); return; }

  const [duplicate] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(and(eq(usersTable.email, email), ne(usersTable.id, req.user.userId))).limit(1);
  if (duplicate) { res.status(409).json({ error: "This email is already in use." }); return; }

  const profile = await db.transaction(async (tx) => {
    const [claimed] = await tx.update(emailVerificationCodesTable).set({ used: true }).where(and(
      eq(emailVerificationCodesTable.id, codeRow.id),
      eq(emailVerificationCodesTable.used, false),
    )).returning({ id: emailVerificationCodesTable.id });
    if (!claimed) return null;
    const [updated] = await tx.update(usersTable).set({
      email,
      emailVerified: true,
      updatedAt: new Date(),
    }).where(eq(usersTable.id, req.user.userId)).returning(profileFields);
    return updated;
  });
  if (!profile) { res.status(400).json({ error: "Invalid or expired verification code." }); return; }
  res.json(profile);
});

const followSchema = z.object({
  targetType: z.enum(["author", "institution"]),
  targetKey: z.string().trim().min(1).max(80),
  targetLabel: z.string().trim().min(1).max(180),
});

router.get("/account/follows", requireAuth, async (req: any, res) => {
  const rows = await db.select().from(userFollowsTable)
    .where(eq(userFollowsTable.userId, req.user.userId))
    .orderBy(desc(userFollowsTable.createdAt));
  res.json(rows);
});

router.post("/account/follows", requireAuth, async (req: any, res) => {
  const parsed = followSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid follow target" }); return; }
  const [row] = await db.insert(userFollowsTable).values({ userId: req.user.userId, ...parsed.data })
    .onConflictDoUpdate({
      target: [userFollowsTable.userId, userFollowsTable.targetType, userFollowsTable.targetKey],
      set: { targetLabel: parsed.data.targetLabel },
    }).returning();
  res.status(201).json(row);
});

router.delete("/account/follows/:type/:key", requireAuth, async (req: any, res) => {
  if (!['author', 'institution'].includes(req.params.type)) { res.status(400).json({ error: "Invalid follow target" }); return; }
  await db.delete(userFollowsTable).where(and(
    eq(userFollowsTable.userId, req.user.userId),
    eq(userFollowsTable.targetType, req.params.type),
    eq(userFollowsTable.targetKey, req.params.key),
  ));
  res.status(204).end();
});

router.get("/account/notifications", requireAuth, async (req: any, res) => {
  const [preferences] = await db.select({ notificationInApp: usersTable.notificationInApp })
    .from(usersTable).where(eq(usersTable.id, req.user.userId)).limit(1);
  if (!preferences?.notificationInApp) { res.json([]); return; }
  const rows = await db.select({
    id: notificationsTable.id,
    type: notificationsTable.type,
    title: notificationsTable.title,
    titleZh: notificationsTable.titleZh,
    body: notificationsTable.body,
    bodyZh: notificationsTable.bodyZh,
    href: notificationsTable.href,
    read: notificationsTable.read,
    createdAt: notificationsTable.createdAt,
  }).from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user.userId))
    .orderBy(desc(notificationsTable.createdAt)).limit(50);
  res.json(rows);
});

router.patch("/account/notifications/:id/read", requireAuth, async (req: any, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) { res.status(400).json({ error: "Invalid notification" }); return; }
  const [row] = await db.update(notificationsTable).set({ read: true }).where(and(
    eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user.userId),
  )).returning();
  if (!row) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(row);
});

router.post("/account/notifications/read-all", requireAuth, async (req: any, res) => {
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, req.user.userId));
  res.status(204).end();
});

export default router;
