import { Router } from "express";
import { db, usersTable, resourcesTable, rejectionReasonsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { env } from "../config";
import { retagResources } from "../lib/tagging";

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
      provider: "brevo",
      from: env.BREVO_FROM_EMAIL,
      apiKey: maskSecret(env.BREVO_API_KEY),
    },
    frontendUrl: env.FRONTEND_URL,
  });
});

/**
 * POST /api/admin/tags/retag — admin only.
 * Body (optional): { resourceIds?: number[] } — omit to rerun against the whole library.
 * Rebuilds auto-generated tag links from the current tag vocabulary; manual links are untouched.
 * Synchronous — for a large library this can take a while (one LLM call pair per resource).
 */
router.post("/admin/tags/retag", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { resourceIds } = req.body as { resourceIds?: number[] };
    if (resourceIds !== undefined && (!Array.isArray(resourceIds) || resourceIds.some((id) => typeof id !== "number"))) {
      res.status(400).json({ error: "resourceIds must be an array of numbers if provided" });
      return;
    }
    const summary = await retagResources(resourceIds);
    res.json(summary);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Retag failed" });
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

/**
 * GET /api/rejection-reasons — public, read-only reference data (same pattern as GET /api/tags).
 * Not admin-gated: the reject dialog's dropdown needs it, but so does anyone viewing why their own
 * rejected resource was turned down (docs/planning/12 §2.4) — a resource's rejectionReasonId is
 * meaningless without this lookup, and rejection isn't sensitive information to hide from its owner.
 */
router.get("/rejection-reasons", async (req, res) => {
  try {
    const rows = await db.select().from(rejectionReasonsTable).orderBy(rejectionReasonsTable.id);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch rejection reasons" });
  }
});

/**
 * PATCH /api/admin/resources/:id/review — admin only.
 * Body: { action: 'approve' | 'reject', rejectionReasonId?, rejectionNote? } — rejectionReasonId is
 * required when action='reject'. Only acts on pending/needs_review resources — a resource that's
 * already been approved/rejected isn't re-reviewable through this route. Rejecting doesn't delete
 * the row (docs/planning/12 §2.4): the reason/note stay attached to it.
 */
router.patch("/admin/resources/:id/review", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, rejectionReasonId, rejectionNote } = req.body as {
      action?: string; rejectionReasonId?: number; rejectionNote?: string;
    };
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const [existing] = await db.select({ status: resourcesTable.status }).from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.status !== "pending" && existing.status !== "needs_review") {
      res.status(400).json({ error: `This resource has already been reviewed (status: ${existing.status})` });
      return;
    }

    if (action === "reject") {
      if (typeof rejectionReasonId !== "number") {
        res.status(400).json({ error: "rejectionReasonId is required when rejecting" });
        return;
      }
      const [reason] = await db.select({ id: rejectionReasonsTable.id }).from(rejectionReasonsTable).where(eq(rejectionReasonsTable.id, rejectionReasonId)).limit(1);
      if (!reason) { res.status(400).json({ error: "Unknown rejectionReasonId" }); return; }
    }

    const [updated] = await db
      .update(resourcesTable)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        rejectionReasonId: action === "reject" ? rejectionReasonId! : null,
        rejectionNote: action === "reject" ? (rejectionNote?.trim() || null) : null,
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      })
      .where(eq(resourcesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to review resource" });
  }
});

export default router;
