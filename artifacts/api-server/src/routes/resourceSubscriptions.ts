import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { backgroundTasksTable, db, resourceSubscriptionsTable, subscriptionCandidatesTable, uploadJobsTable, resourcesTable } from "@workspace/db";
import { requireAdmin, requireAuth } from "./auth";
import { enqueueStoredUploadJob } from "./upload";
import { DEFAULT_DISCOVERY_SOURCES } from "../lib/subscriptionDiscovery";
import { enqueueBackgroundTask, RESOURCE_SUBSCRIPTION_TASK } from "../lib/backgroundTasks";

const router = Router();
const subscriptionInput = z.object({
  name: z.string().trim().min(1).max(200),
  query: z.string().trim().min(2).max(500),
  frequency: z.enum(["daily", "weekly"]).default("weekly"),
  active: z.boolean().default(true),
});

router.get("/admin/resource-subscriptions", requireAuth, requireAdmin, async (_req, res) => {
  const rows = await db.select().from(resourceSubscriptionsTable).orderBy(desc(resourceSubscriptionsTable.createdAt));
  res.json(rows.map((row) => ({
    ...row,
    // Present legacy Crossref-only rows according to their effective runtime behaviour. They are
    // persisted with the expanded source list on the next scheduled or manual run.
    sources: row.sources.length === 1 && row.sources[0] === "crossref" ? [...DEFAULT_DISCOVERY_SOURCES] : row.sources,
  })));
});

router.post("/admin/resource-subscriptions", requireAuth, requireAdmin, async (req: any, res) => {
  const parsed = subscriptionInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid subscription" }); return; }
  const [created] = await db.insert(resourceSubscriptionsTable).values({ ...parsed.data, sources: [...DEFAULT_DISCOVERY_SOURCES], createdBy: req.user.userId }).returning();
  res.status(201).json(created);
});

router.patch("/admin/resource-subscriptions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = subscriptionInput.partial().safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) { res.status(400).json({ error: "Invalid subscription update" }); return; }
  const [updated] = await db.update(resourceSubscriptionsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(resourceSubscriptionsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/admin/resource-subscriptions/:id", requireAuth, requireAdmin, async (req, res) => {
  await db.delete(resourceSubscriptionsTable).where(eq(resourceSubscriptionsTable.id, Number(req.params.id)));
  res.status(204).send();
});

router.post("/admin/resource-subscriptions/:id/run", requireAuth, requireAdmin, async (req: any, res) => {
  const subscriptionId = Number(req.params.id);
  if (!Number.isInteger(subscriptionId) || subscriptionId < 1) { res.status(400).json({ error: "Invalid subscription" }); return; }
  try {
    const [subscription] = await db.select({ id: resourceSubscriptionsTable.id })
      .from(resourceSubscriptionsTable).where(eq(resourceSubscriptionsTable.id, subscriptionId)).limit(1);
    if (!subscription) { res.status(404).json({ error: "Subscription not found" }); return; }
    const [task] = await db.insert(backgroundTasksTable).values({
      type: RESOURCE_SUBSCRIPTION_TASK,
      status: "queued",
      payload: { subscriptionId },
      total: 5,
      createdBy: req.user.userId,
    }).returning();
    enqueueBackgroundTask(task.id);
    res.status(202).json({ task });
  } catch (error) {
    req.log.error(error);
    res.status(500).json({ error: "Subscription task could not be created" });
  }
});

router.get("/admin/subscription-candidates", requireAuth, requireAdmin, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "new";
  const rows = await db.select().from(subscriptionCandidatesTable).where(eq(subscriptionCandidatesTable.status, status)).orderBy(desc(subscriptionCandidatesTable.discoveredAt));
  res.json(rows);
});

router.post("/admin/subscription-candidates/import", requireAuth, requireAdmin, async (req: any, res) => {
  const parsed = z.object({ candidateIds: z.array(z.number().int().positive()).min(1).max(100) }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Select between 1 and 100 candidates" }); return; }
  const candidates = await db.select().from(subscriptionCandidatesTable).where(and(
    inArray(subscriptionCandidatesTable.id, parsed.data.candidateIds), eq(subscriptionCandidatesTable.status, "new"),
  ));
  const existing = await db.select({ title: resourcesTable.title, publishedDate: resourcesTable.publishedDate, doi: resourcesTable.doi }).from(resourcesTable);
  const normalizeTitle = (title: string) => title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const existingDois = new Set(existing.map((item) => item.doi?.toLowerCase()).filter((doi): doi is string => Boolean(doi)));
  const existingTitles = new Set(existing.map((item) => `${normalizeTitle(item.title)}:${item.publishedDate?.slice(0, 4) ?? ""}`));
  const inferSourceType = (candidate: typeof candidates[number]) => {
    const raw = candidate.rawMetadata && typeof candidate.rawMetadata === "object" ? candidate.rawMetadata as Record<string, unknown> : {};
    const values = [raw.type, raw.type_crossref, ...(Array.isArray(raw.publicationTypes) ? raw.publicationTypes : [])].filter((value): value is string => typeof value === "string").map((value) => value.toLowerCase());
    if (values.some((value) => value.includes("proceedings") || value.includes("conference"))) return "conference_paper";
    if (values.some((value) => value.includes("posted-content") || value.includes("preprint") || value.includes("working"))) return "working_paper";
    if (values.some((value) => value.includes("dissertation") || value.includes("thesis"))) return "thesis";
    if (values.some((value) => value.includes("book-chapter") || value.includes("book chapter") || value.includes("chapter"))) return "book_chapter";
    if (values.some((value) => value === "book" || value.includes("monograph"))) return "book";
    if (values.some((value) => value.includes("dataset") || value.includes("data-set")) || /\bdataset\b|数据集/iu.test(candidate.title)) return "dataset";
    if (values.some((value) => value.includes("report"))) return "report";
    return "journal_article";
  };
  const queued: number[] = [];
  const skippedDuplicates: number[] = [];
  for (const candidate of candidates) {
    const duplicate = (candidate.doi && existingDois.has(candidate.doi.toLowerCase()))
      || existingTitles.has(`${normalizeTitle(candidate.title)}:${candidate.year ?? ""}`);
    if (duplicate) {
      await db.update(subscriptionCandidatesTable).set({ status: "duplicate", updatedAt: new Date() }).where(eq(subscriptionCandidatesTable.id, candidate.id));
      skippedDuplicates.push(candidate.id);
      continue;
    }
    const record = {
      title: candidate.title, authors: candidate.authors, authorIsInstitution: false, year: candidate.year,
      abstract: candidate.abstract ?? "", abstractSource: null, keywords: [], doi: candidate.doi,
      url: candidate.url, sourceType: inferSourceType(candidate), venue: null,
    };
    const [job] = await db.insert(uploadJobsTable).values({
      type: "citation", status: "queued", input: { payloadVersion: 1, fileName: `subscription:${candidate.source}`, record }, createdBy: req.user.userId,
    }).returning({ id: uploadJobsTable.id });
    await db.update(subscriptionCandidatesTable).set({ status: "imported", uploadJobId: job.id, updatedAt: new Date() }).where(eq(subscriptionCandidatesTable.id, candidate.id));
    queued.push(job.id);
    enqueueStoredUploadJob(job.id);
  }
  res.status(202).json({ queued, skippedDuplicates });
});

router.post("/admin/subscription-candidates/:id/dismiss", requireAuth, requireAdmin, async (req, res) => {
  const [candidate] = await db.update(subscriptionCandidatesTable).set({ status: "dismissed", updatedAt: new Date() }).where(eq(subscriptionCandidatesTable.id, Number(req.params.id))).returning();
  if (!candidate) { res.status(404).json({ error: "Not found" }); return; }
  res.json(candidate);
});

export default router;
