import { Router } from "express";
import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod/v4";
import { db, notificationsTable, userFollowsTable, usersTable } from "@workspace/db";
import { requireAuth } from "./auth";

const router = Router();

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
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
  const email = data.email.toLowerCase();
  const [duplicate] = await db.select({ id: usersTable.id }).from(usersTable)
    .where(and(eq(usersTable.email, email), ne(usersTable.id, req.user.userId))).limit(1);
  if (duplicate) { res.status(409).json({ error: "This email is already in use" }); return; }
  const [profile] = await db.update(usersTable).set({
    ...data,
    email,
    institution: data.institution || null,
    title: data.title || null,
    bio: data.bio || null,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, req.user.userId)).returning(profileFields);
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
  const rows = await db.select().from(notificationsTable)
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
