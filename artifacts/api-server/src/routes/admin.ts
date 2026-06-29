import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { SETTINGS_KEYS, getAllSettings, setSetting, type SettingsKey } from "../lib/settings";

const router = Router();

const SECRET_KEYS: SettingsKey[] = ["SMTP_PASS", "GOOGLE_API_KEY"];

/** GET /api/admin/settings — admin only. Secret values are never returned in plaintext, only whether they're set. */
router.get("/admin/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const all = await getAllSettings();
    const result: Record<string, string | boolean | undefined> = {};
    for (const key of SETTINGS_KEYS) {
      result[key] = SECRET_KEYS.includes(key) ? Boolean(all[key]) : all[key];
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/** PATCH /api/admin/settings — admin only. Body: partial { [SettingsKey]: string }. Blank values are ignored (keeps existing). */
router.patch("/admin/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    for (const key of SETTINGS_KEYS) {
      const value = body[key];
      if (typeof value === "string" && value.trim()) {
        await setSetting(key, value.trim());
      }
    }
    const all = await getAllSettings();
    const result: Record<string, string | boolean | undefined> = {};
    for (const key of SETTINGS_KEYS) {
      result[key] = SECRET_KEYS.includes(key) ? Boolean(all[key]) : all[key];
    }
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/** GET /api/admin/users — admin only. Never returns passwordHash. */
router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/** PATCH /api/admin/users/:id — admin only. Body: { role: 'user' | 'admin' } */
router.patch("/admin/users/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { role } = req.body as { role?: string };
    if (!role || !["user", "admin"].includes(role)) {
      res.status(400).json({ error: "role must be 'user' or 'admin'" });
      return;
    }
    if (id === req.user.userId && role === "user") {
      res.status(400).json({ error: "You cannot demote your own account" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role: role as "user" | "admin", updatedAt: new Date() })
      .where(eq(usersTable.id, id))
      .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name, role: usersTable.role, createdAt: usersTable.createdAt });

    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

export default router;
