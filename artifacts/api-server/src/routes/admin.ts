import { Router } from "express";
import { db, usersTable, resourcesTable, rejectionReasonsTable, tagsTable, resourceTagsTable, backgroundTasksTable } from "@workspace/db";
import { eq, desc, asc, and, gte, lte, isNotNull, inArray, count } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { requireAuth, requireAdmin } from "./auth";
import { env } from "../config";
import { invalidateTagVocabularyCache, retagResources } from "../lib/tagging";
import { verifyResource } from "../lib/verify";
import { AI_REVIEW_TERMINAL_STATUSES, resetAndEnqueueAiPreReviews } from "../lib/aiPreReview";
import { APPLY_LATEST_RULES_TASK, RETAG_RESOURCES_TASK, enqueueBackgroundTask } from "../lib/backgroundTasks";
import { notifyFollowersForApprovedResources } from "../lib/followNotifications";

const router = Router();
const THEME_CATEGORIES = ["types_mechanisms", "stability_risk", "regulation_policy", "monetary_macro", "markets_adoption", "tech_infrastructure"] as const;

/** Shows only that a secret is set, plus its last 4 characters — never the full value. */
function maskSecret(value: string): string {
  if (!value) return "not configured";
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
      provider: env.EMAIL_PROVIDER,
      from: env.EMAIL_PROVIDER === "microsoft_graph" ? env.MICROSOFT_FROM_EMAIL : env.BREVO_FROM_EMAIL,
      credential: env.EMAIL_PROVIDER === "microsoft_graph"
        ? maskSecret(env.MICROSOFT_CLIENT_ID)
        : maskSecret(env.BREVO_API_KEY),
    },
    frontendUrl: env.FRONTEND_URL,
  });
});

/** Admin vocabulary view. A tag name is stored once, so renaming it updates every linked resource. */
router.get("/admin/tags", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [tags, usageRows] = await Promise.all([
      db.select().from(tagsTable).orderBy(asc(tagsTable.facet), asc(tagsTable.nameEn)),
      db.select({ tagId: resourceTagsTable.tagId, usageCount: count() })
        .from(resourceTagsTable)
        .groupBy(resourceTagsTable.tagId),
    ]);
    const usage = new Map(usageRows.map((row) => [row.tagId, row.usageCount]));
    res.json(tags.map((tag) => ({ ...tag, usageCount: usage.get(tag.id) ?? 0 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch tag vocabulary" });
  }
});

const tagUpdateSchema = z.object({
  nameEn: z.string().trim().min(1).max(120).optional(),
  nameZh: z.string().trim().min(1).max(120).optional(),
  definition: z.string().trim().max(1_000).nullable().optional(),
  region: z.string().trim().max(120).nullable().optional(),
  category: z.enum(THEME_CATEGORIES).nullable().optional(),
  status: z.enum(["active", "candidate"]).optional(),
}).refine((value) => Object.keys(value).length > 0, "No tag fields supplied");

/** Rename or reconfigure one controlled tag. Resource links remain intact. */
router.patch("/admin/tags/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = tagUpdateSchema.safeParse(req.body);
  if (!Number.isInteger(id) || id <= 0 || !parsed.success) {
    res.status(400).json({ error: "Invalid tag update" });
    return;
  }
  try {
    const [existing] = await db.select().from(tagsTable).where(eq(tagsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Tag not found" }); return; }
    if (existing.facet !== "theme" && parsed.data.category != null) {
      res.status(400).json({ error: "Only theme tags can have a category" });
      return;
    }
    const [updated] = await db.update(tagsTable).set(parsed.data).where(eq(tagsTable.id, id)).returning();
    invalidateTagVocabularyCache();
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update tag" });
  }
});

/** Merge a duplicate/synonym tag into an existing tag in the same facet. */
router.post("/admin/tags/:id/merge", requireAuth, requireAdmin, async (req, res) => {
  const sourceTagId = Number(req.params.id);
  const targetTagId = Number(req.body?.targetTagId);
  if (!Number.isInteger(sourceTagId) || !Number.isInteger(targetTagId) || sourceTagId <= 0 || targetTagId <= 0 || sourceTagId === targetTagId) {
    res.status(400).json({ error: "Choose a different target tag" });
    return;
  }
  try {
    const [source, target] = await Promise.all([
      db.select().from(tagsTable).where(eq(tagsTable.id, sourceTagId)).limit(1).then((rows) => rows[0]),
      db.select().from(tagsTable).where(eq(tagsTable.id, targetTagId)).limit(1).then((rows) => rows[0]),
    ]);
    if (!source || !target) { res.status(404).json({ error: "Tag not found" }); return; }
    if (source.facet !== target.facet) { res.status(400).json({ error: "Tags can only be merged within the same facet" }); return; }

    const moved = await db.transaction(async (tx) => {
      const sourceLinks = await tx.select().from(resourceTagsTable).where(eq(resourceTagsTable.tagId, sourceTagId));
      for (const sourceLink of sourceLinks) {
        const [targetLink] = await tx.select().from(resourceTagsTable)
          .where(and(eq(resourceTagsTable.resourceId, sourceLink.resourceId), eq(resourceTagsTable.tagId, targetTagId)))
          .limit(1);
        if (!targetLink) {
          await tx.insert(resourceTagsTable).values({
            resourceId: sourceLink.resourceId,
            tagId: targetTagId,
            source: sourceLink.source,
            score: sourceLink.score,
          });
        } else if (sourceLink.source === "manual" && targetLink.source !== "manual") {
          await tx.update(resourceTagsTable).set({ source: "manual" }).where(eq(resourceTagsTable.id, targetLink.id));
        }
      }
      await tx.delete(resourceTagsTable).where(eq(resourceTagsTable.tagId, sourceTagId));
      await tx.delete(tagsTable).where(eq(tagsTable.id, sourceTagId));
      return sourceLinks.length;
    });
    invalidateTagVocabularyCache();
    res.json({ mergedFrom: sourceTagId, mergedInto: targetTagId, resourceLinksMoved: moved });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to merge tags" });
  }
});

/**
 * POST /api/admin/tags/retag — admin only.
 * Body (optional): { resourceIds?: number[] } — omit to rerun against the whole library.
 * Rebuilds auto-generated tag links from the current tag vocabulary; manual links are untouched.
 * Persisted background task — safe to leave the page, close the browser, or restart the service.
 */
router.post("/admin/tags/retag", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { resourceIds, replaceManualThemeTags } = req.body as { resourceIds?: number[]; replaceManualThemeTags?: boolean };
    if (resourceIds !== undefined && (!Array.isArray(resourceIds) || resourceIds.some((id) => typeof id !== "number"))) {
      res.status(400).json({ error: "resourceIds must be an array of numbers if provided" });
      return;
    }
    if (replaceManualThemeTags !== undefined && typeof replaceManualThemeTags !== "boolean") {
      res.status(400).json({ error: "replaceManualThemeTags must be a boolean if provided" });
      return;
    }
    const [activeTask] = await db.select().from(backgroundTasksTable).where(and(
      eq(backgroundTasksTable.type, RETAG_RESOURCES_TASK),
      eq(backgroundTasksTable.createdBy, req.user.userId),
      inArray(backgroundTasksTable.status, ["queued", "processing", "waiting_external"]),
    )).orderBy(desc(backgroundTasksTable.createdAt)).limit(1);
    if (activeTask) {
      res.status(202).json({ task: activeTask, reused: true });
      return;
    }
    const rows = await db.select({ id: resourcesTable.id }).from(resourcesTable)
      .where(resourceIds?.length ? inArray(resourcesTable.id, [...new Set(resourceIds)]) : undefined);
    if (rows.length === 0) { res.status(409).json({ error: "No resources are available to reclassify" }); return; }
    invalidateTagVocabularyCache();
    const [task] = await db.insert(backgroundTasksTable).values({
      type: RETAG_RESOURCES_TASK,
      status: "queued",
      payload: { resourceIds: rows.map((row) => row.id), replaceManualThemeTags: !!replaceManualThemeTags },
      total: rows.length,
      createdBy: req.user.userId,
    }).returning();
    enqueueBackgroundTask(task.id);
    res.status(202).json({ task, reused: false });
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
 * Pure DB read (docs/planning/16 §16.1) — the report is computed once, at persist/resubmit time
 * (upload.ts's persistConfirmedDraft, resources.ts's owner-resubmission path) and cached on
 * `resources.verificationReport`. Previously this route re-ran verifyResource() live on every call,
 * burning a DOI-resolution + URL-reachability round trip every single time an admin opened (or
 * re-opened) the same resource's detail view — pure waste, since the report can't have changed
 * between two views of the same unedited row. Null only for rows that predate this column, or that
 * somehow haven't been through a persist/reverify pass yet.
 */
router.get("/admin/resources/:id/verify-report", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [r] = await db.select({ verificationReport: resourcesTable.verificationReport, verifiedAt: resourcesTable.verifiedAt }).from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!r) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ report: r.verificationReport ?? null, verifiedAt: r.verifiedAt ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch verify report" });
  }
});

/**
 * POST /api/admin/resources/:id/reverify — admin only (docs/planning/16 §16.1).
 * Explicit, admin-triggered re-run of verifyResource() against the resource's current stored data —
 * the only place this route's network calls (DOI resolution, URL reachability) happen outside of
 * persist/resubmit time. Does not touch status/tags — this is a read recheck, not a reclassification
 * (an admin who wants the full pipeline rerun, including retagging, should edit-and-save instead).
 */
router.post("/admin/resources/:id/reverify", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!r) { res.status(404).json({ error: "Not found" }); return; }
    const year = r.publishedDate?.match(/^\d{4}/)?.[0] ? Number(r.publishedDate.match(/^\d{4}/)![0]) : null;
    const report = await verifyResource({ title: r.title, authors: r.authors, year, doi: r.doi, url: r.url, abstract: r.abstract, keywords: r.keywords });
    const verifiedAt = new Date();
    await db.update(resourcesTable).set({ verificationReport: report, verifiedAt }).where(eq(resourcesTable.id, id));
    res.json({ report, verifiedAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reverify resource" });
  }
});

const preReviewSchema = z.object({
  resourceIds: z.array(z.number().int().positive()).min(1).max(100),
  force: z.boolean().optional().default(false),
});

/** Queue the public-link + AI pre-review pass for selected pending resources. */
router.post("/admin/resources/pre-review", requireAuth, requireAdmin, async (req: any, res) => {
  const parsed = preReviewSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Select between 1 and 100 resources" }); return; }
  try {
    const queuedIds = await resetAndEnqueueAiPreReviews(parsed.data.resourceIds, parsed.data.force);
    res.status(202).json({ queuedIds });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to queue AI pre-review" });
  }
});

const applyLatestRulesSchema = z.object({
  resourceIds: z.array(z.number().int().positive()).min(1).max(100),
});

/** Persist and queue a rule refresh so it survives navigation, page closure, and server restarts. */
router.post("/admin/resources/apply-latest-rules", requireAuth, requireAdmin, async (req: any, res) => {
  const parsed = applyLatestRulesSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Select between 1 and 100 pending resources" }); return; }
  const requestedIds = [...new Set(parsed.data.resourceIds)];
  try {
    const [activeTask] = await db.select().from(backgroundTasksTable).where(and(
      eq(backgroundTasksTable.type, APPLY_LATEST_RULES_TASK),
      eq(backgroundTasksTable.createdBy, req.user.userId),
      inArray(backgroundTasksTable.status, ["queued", "processing", "waiting_external"]),
    )).orderBy(desc(backgroundTasksTable.createdAt)).limit(1);
    if (activeTask) {
      res.status(202).json({ task: activeTask, reused: true, skippedIds: [] });
      return;
    }
    const pendingRows = await db
      .select({ id: resourcesTable.id })
      .from(resourcesTable)
      .where(and(eq(resourcesTable.status, "pending"), inArray(resourcesTable.id, requestedIds)));
    const pendingIds = pendingRows.map((row) => row.id);
    if (pendingIds.length === 0) { res.status(409).json({ error: "None of the selected resources are still pending" }); return; }
    const [task] = await db.insert(backgroundTasksTable).values({
      type: APPLY_LATEST_RULES_TASK,
      status: "queued",
      payload: { resourceIds: pendingIds },
      total: pendingIds.length,
      createdBy: req.user.userId,
    }).returning();
    enqueueBackgroundTask(task.id);
    res.status(202).json({ task, skippedIds: requestedIds.filter((id) => !pendingIds.includes(id)) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to apply the latest rules" });
  }
});

router.post("/admin/background-tasks/:id/retry", requireAuth, requireAdmin, async (req: any, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "Invalid task id" }); return; }
  try {
    const [task] = await db.update(backgroundTasksTable).set({
      status: "queued",
      error: null,
      completedAt: null,
      updatedAt: new Date(),
    }).where(and(
      eq(backgroundTasksTable.id, id),
      eq(backgroundTasksTable.createdBy, req.user.userId),
      inArray(backgroundTasksTable.status, ["failed", "waiting_external"]),
    )).returning();
    if (!task) { res.status(409).json({ error: "This task cannot be retried" }); return; }
    enqueueBackgroundTask(task.id);
    res.status(202).json({ task });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to retry background task" });
  }
});

router.get("/admin/background-tasks", requireAuth, requireAdmin, async (req: any, res) => {
  const type = typeof req.query.type === "string" ? req.query.type : null;
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  try {
    const conditions = [eq(backgroundTasksTable.createdBy, req.user.userId)];
    if (type) conditions.push(eq(backgroundTasksTable.type, type));
    const rows = await db.select().from(backgroundTasksTable)
      .where(and(...conditions)).orderBy(desc(backgroundTasksTable.createdAt)).limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list background tasks" });
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

    const [existing] = await db.select({ status: resourcesTable.status, aiReviewStatus: resourcesTable.aiReviewStatus }).from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    // Only 'pending' is admin-reviewable now (docs/planning/15 §1.1/§0.9) — the four self-service
    // states (incomplete/disputed/off_topic/duplicate) are caught and bounced back to the submitter
    // earlier, before ever reaching the admin queue.
    if (existing.status !== "pending") {
      res.status(400).json({ error: `This resource is not awaiting review (status: ${existing.status})` });
      return;
    }
    if (action === "approve" && !AI_REVIEW_TERMINAL_STATUSES.includes(existing.aiReviewStatus as any)) {
      res.status(409).json({ error: "AI pre-review must finish before approval" });
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

    if (action === "approve") await notifyFollowersForApprovedResources([updated.id]);

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to review resource" });
  }
});

const bulkReviewSchema = z.object({
  resourceIds: z.array(z.number().int().positive()).min(1).max(100),
  action: z.enum(["approve", "reject"]),
  rejectionReasonId: z.number().int().positive().optional(),
  rejectionNote: z.string().trim().max(2000).optional(),
});

/** Apply one explicit administrator decision to up to 100 pending resources. */
router.post("/admin/resources/bulk-review", requireAuth, requireAdmin, async (req: any, res) => {
  const parsed = bulkReviewSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid bulk review request" }); return; }
  const { action, rejectionReasonId, rejectionNote } = parsed.data;
  const requestedIds = [...new Set(parsed.data.resourceIds)];

  try {
    if (action === "reject") {
      if (!rejectionReasonId) { res.status(400).json({ error: "rejectionReasonId is required when rejecting" }); return; }
      const [reason] = await db.select({ id: rejectionReasonsTable.id }).from(rejectionReasonsTable).where(eq(rejectionReasonsTable.id, rejectionReasonId)).limit(1);
      if (!reason) { res.status(400).json({ error: "Unknown rejectionReasonId" }); return; }
    }

    const conditions = [eq(resourcesTable.status, "pending"), inArray(resourcesTable.id, requestedIds)];
    if (action === "approve") conditions.push(inArray(resourcesTable.aiReviewStatus, [...AI_REVIEW_TERMINAL_STATUSES]));

    const updated = await db.update(resourcesTable).set({
      status: action === "approve" ? "approved" : "rejected",
      rejectionReasonId: action === "reject" ? rejectionReasonId! : null,
      rejectionNote: action === "reject" ? (rejectionNote || null) : null,
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
    }).where(and(...conditions)).returning({ id: resourcesTable.id, status: resourcesTable.status });

    if (action === "approve") await notifyFollowersForApprovedResources(updated.map((row) => row.id));

    const updatedIds = new Set(updated.map((row) => row.id));
    res.json({ updated, skippedIds: requestedIds.filter((id) => !updatedIds.has(id)) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to review selected resources" });
  }
});

/**
 * GET /api/admin/review-log — admin only (docs/planning/15 §2.3).
 * Every resource that's been through an admin decision (reviewedBy IS NOT NULL) — approved or
 * rejected. No separate audit-log table: `resources` itself already carries one review outcome per
 * row (reviewedBy/reviewedAt/rejectionReasonId/rejectionNote), and there's no "resubmit and get
 * reviewed again" flow yet for this to need to be a append-only history — see doc for when that'd
 * change.
 * Optional filters: ?status=approved|rejected, ?reviewedBy=<userId>, ?from=<ISO date>, ?to=<ISO date>,
 * ?order=asc|desc
 * (filtered on reviewedAt).
 */
router.get("/admin/review-log", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const submitter = alias(usersTable, "submitter");
    const reviewer = alias(usersTable, "reviewer");

    const { status, reviewedBy, from, to, order } = req.query as { status?: string; reviewedBy?: string; from?: string; to?: string; order?: string };
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
      .orderBy(order === "asc" ? asc(resourcesTable.reviewedAt) : desc(resourcesTable.reviewedAt));

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch review log" });
  }
});

export default router;
