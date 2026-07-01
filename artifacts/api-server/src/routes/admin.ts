import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { env } from "../config";

const router = Router();

/** Shows only that a secret is set, plus its last 4 characters — never the full value. */
function maskSecret(value: string): string {
  return value.length <= 4 ? "••••" : `••••${value.slice(-4)}`;
}

/**
 * GET /api/admin/settings/status — admin only, read-only.
 * All configuration lives in server environment variables (.env) — this endpoint only
 * surfaces what's currently loaded so admins can verify it without server access.
 * Secrets are masked; nothing here is ever editable through the API.
 */
router.get("/admin/settings/status", requireAuth, requireAdmin, (_req, res) => {
  res.json({
    database: { configured: true },
    auth: { jwtSecret: maskSecret(env.JWT_SECRET) },
    llm: {
      provider: env.LLM_PROVIDER,
      model: env.LLM_MODEL,
      apiKey: maskSecret(env.LLM_API_KEY),
    },
    email: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      user: env.SMTP_USER,
      from: env.SMTP_FROM,
      password: maskSecret(env.SMTP_PASS),
    },
    frontendUrl: env.FRONTEND_URL,
  });
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
