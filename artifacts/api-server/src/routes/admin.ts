import { Router } from "express";
import { db, usersTable, resourcesTable, rejectionReasonsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { requireAuth, requireAdmin } from "./auth";
import { env } from "../config";
import { retagResources } from "../lib/tagging";
import { verifyResource } from "../lib/verify";

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
 * GET /api/admin/resources/:id/verify-report — admin only (docs/planning/15 §2.2 point 2).
 * Re-runs verifyResource() live against the resource's current stored data — not persisted
 * anywhere, purely for the admin detail view before approving. For a 'pending' resource this
 * should always come back clean (hasFailure/hasWarning both false), since a resource can't reach
 * 'pending' at all unless it already passed every check the state machine runs (docs/planning/15
 * §0.6) — showing it here is reassurance for the admin, not something they're expected to act on.
 */
router.get("/admin/resources/:id/verify-report", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!r) { res.status(404).json({ error: "Not found" }); return; }
    const year = r.publishedDate?.match(/^\d{4}/)?.[0] ? Number(r.publishedDate.match(/^\d{4}/)![0]) : null;
    const report = await verifyResource({ title: r.title, authors: r.authors, year, doi: r.doi, url: r.url, abstract: r.abstract });
    res.json(report);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to compute verify report" });
  }
});

/**
 * PATCH /api/admin/resources/:id/review — admin only.
 * Body: { action: 'approve' | 'reject', rejectionReasonId?, rejectionNote? } — rejectionReasonId is
 * required when action='reject'. Only acts on 'pending' resources (docs/planning/15 §1.1) — a
 * resource that's already been approved/rejected isn't re-reviewable through this route. Rejecting doesn't delete
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
    // Only 'pending' is admin-reviewable now (docs/planning/15 §1.1/§0.9) — the four self-service
    // states (incomplete/disputed/off_topic/duplicate) are caught and bounced back to the submitter
    // earlier, before ever reaching the admin queue.
    if (existing.status !== "pending") {
      res.status(400).json({ error: `This resource is not awaiting review (status: ${existing.status})` });
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

/**
 * GET /api/admin/review-log — admin only (docs/planning/15 §2.3).
 * Every resource that's been through an admin decision (reviewedBy IS NOT NULL) — approved or
 * rejected. No separate audit-log table: `resources` itself already carries one review outcome per
 * row (reviewedBy/reviewedAt/rejectionReasonId/rejectionNote), and there's no "resubmit and get
 * reviewed again" flow yet for this to need to be a append-only history — see doc for when that'd
 * change.
 * Optional filters: ?status=approved|rejected, ?reviewedBy=<userId>, ?from=<ISO date>, ?to=<ISO date>
 * (filtered on reviewedAt).
 */
router.get("/admin/review-log", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const submitter = alias(usersTable, "submitter");
    const reviewer = alias(usersTable, "reviewer");

    const { status, reviewedBy, from, to } = req.query as { status?: string; reviewedBy?: string; from?: string; to?: string };
    const conditions = [isNotNull(resourcesTable.reviewedBy)];
    if (status === "approved" || status === "rejected") conditions.push(eq(resourcesTable.status, status));
    if (reviewedBy && !isNaN(parseInt(reviewedBy))) conditions.push(eq(resourcesTable.reviewedBy, parseInt(reviewedBy)));
    if (from) conditions.push(gte(resourcesTable.reviewedAt, new Date(from)));
    if (to) conditions.push(lte(resourcesTable.reviewedAt, new Date(to)));

    const rows = await db
      .select({
        id: resourcesTable.id,
        title: resourcesTable.title,
        status: resourcesTable.status,
        submitterEmail: submitter.email,
        createdAt: resourcesTable.createdAt,
        reviewedAt: resourcesTable.reviewedAt,
        reviewerEmail: reviewer.email,
        rejectionReasonId: resourcesTable.rejectionReasonId,
        rejectionNote: resourcesTable.rejectionNote,
      })
      .from(resourcesTable)
      .leftJoin(submitter, eq(resourcesTable.createdBy, submitter.id))
      .leftJoin(reviewer, eq(resourcesTable.reviewedBy, reviewer.id))
      .where(and(...conditions))
      .orderBy(desc(resourcesTable.reviewedAt));

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch review log" });
  }
});

export default router;
