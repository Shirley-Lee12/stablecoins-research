import { Router } from "express";
import { db, resourcesTable, tagsTable, resourceTagsTable, usersTable, resourceEditSuggestionsTable, type SuggestibleResourceFields } from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { attachFacetedTags } from "../lib/tagging";
import { recomputeResourceStatus } from "../lib/resourceStatus";
import { syncResourceAuthors } from "./authors";

const router = Router();

const FACET_KEYS = ["themeTags", "jurisdictionTags", "assetTags"] as const;
type FacetKey = typeof FACET_KEYS[number];
const FACET_OF: Record<FacetKey, "theme" | "jurisdiction" | "asset"> = {
  themeTags: "theme",
  jurisdictionTags: "jurisdiction",
  assetTags: "asset",
};

/** Shared shape for a resolved tag reference in the review-queue diff view. */
interface ResolvedTagRef {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
}

/**
 * docs/planning/20 §20.1 — generalizes doc 18.4's tag/keyword-only suggestion flow: any logged-in
 * user can propose a change to any of title/authors/publishedDate/abstract/url/doi/themeTags/
 * jurisdictionTags/assetTags/keywords for a resource they can see. Only the keys actually being
 * proposed are present in the body — this never requires touching every field. The proposal is
 * never applied automatically: it lands here as status='pending' for an admin to review. An admin's
 * own edits skip this table entirely and write straight through the existing PATCH /resources/:id
 * path — that branch decision is made by the frontend based on role, not by this endpoint rejecting
 * admin callers.
 */
router.post("/resources/:id/edit-suggestions", requireAuth, async (req: any, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, resourceId)).limit(1);
    if (!resource) { res.status(404).json({ error: "Not found" }); return; }
    // Same visibility rule as GET /resources/:id — can't propose an edit on a resource you can't see.
    if (resource.status !== "approved" && resource.createdBy !== req.user.userId && req.user.role !== "admin") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const proposedFields: SuggestibleResourceFields = {};
    const previousFields: SuggestibleResourceFields = {};

    if (typeof body.title === "string" && body.title.trim().length > 0) {
      proposedFields.title = body.title.trim();
      previousFields.title = resource.title;
    }
    if (Array.isArray(body.authors)) {
      proposedFields.authors = body.authors.filter((a): a is string => typeof a === "string" && a.trim().length > 0);
      previousFields.authors = resource.authors;
    }
    if (body.publishedDate === null || typeof body.publishedDate === "string") {
      proposedFields.publishedDate = body.publishedDate;
      previousFields.publishedDate = resource.publishedDate;
    }
    if (typeof body.abstract === "string") {
      proposedFields.abstract = body.abstract;
      previousFields.abstract = resource.abstract;
    }
    if (body.url === null || typeof body.url === "string") {
      proposedFields.url = body.url;
      previousFields.url = resource.url;
    }
    if (body.doi === null || typeof body.doi === "string") {
      proposedFields.doi = body.doi;
      previousFields.doi = resource.doi;
    }
    if (Array.isArray(body.keywords)) {
      proposedFields.keywords = body.keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0).map((k) => k.trim());
      previousFields.keywords = resource.keywords;
    }

    // Facet tags: need the resource's currently-attached ids (split by facet) both for
    // previousFields and for the controlled-vocabulary grandfather-clause check below.
    const anyFacetTouched = FACET_KEYS.some((k) => Array.isArray(body[k]));
    const currentLinks = anyFacetTouched
      ? await db.select({ tagId: resourceTagsTable.tagId, facet: tagsTable.facet })
          .from(resourceTagsTable).innerJoin(tagsTable, eq(resourceTagsTable.tagId, tagsTable.id))
          .where(eq(resourceTagsTable.resourceId, resourceId))
      : [];
    for (const key of FACET_KEYS) {
      if (!Array.isArray(body[key])) continue;
      const ids = (body[key] as unknown[]).filter((n): n is number => typeof n === "number");
      proposedFields[key] = ids;
      previousFields[key] = currentLinks.filter((l) => l.facet === FACET_OF[key]).map((l) => l.tagId);
    }

    // Controlled-vocabulary check: every proposed tag id must be an existing active tag in the facet
    // it's proposed under — this is a picker over lib/db's tags table, not a free-create field.
    // Exception: a tag already attached to this resource is grandfathered in even if it has since
    // been demoted to 'candidate' — a submitter re-proposing an unrelated change shouldn't have their
    // whole suggestion rejected because the picker pre-populated a legacy tag they never touched.
    const allProposedTagIds = FACET_KEYS.flatMap((k) => proposedFields[k] ?? []);
    if (allProposedTagIds.length > 0) {
      const rows = await db.select({ id: tagsTable.id, facet: tagsTable.facet, status: tagsTable.status }).from(tagsTable).where(inArray(tagsTable.id, [...new Set(allProposedTagIds)]));
      const byId = new Map(rows.map((r) => [r.id, r]));
      const currentlyAttached = new Set(currentLinks.map((l) => l.tagId));
      const isValid = (ids: number[], facet: "theme" | "jurisdiction" | "asset") =>
        ids.every((id) => byId.get(id)?.facet === facet && (byId.get(id)?.status === "active" || currentlyAttached.has(id)));
      if (!isValid(proposedFields.themeTags ?? [], "theme") || !isValid(proposedFields.jurisdictionTags ?? [], "jurisdiction") || !isValid(proposedFields.assetTags ?? [], "asset")) {
        res.status(400).json({ error: "One or more tag ids are invalid or don't belong to the stated facet" });
        return;
      }
    }

    if (Object.keys(proposedFields).length === 0) {
      res.status(400).json({ error: "No editable fields were proposed" });
      return;
    }

    const [created] = await db
      .insert(resourceEditSuggestionsTable)
      .values({ resourceId, submittedBy: req.user.userId, proposedFields, previousFields, status: "pending" })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit suggestion" });
  }
});

/**
 * GET /api/resources/:id/edit-suggestions/mine — must be logged in.
 * Lets the submitter check their own latest proposal's status on this resource ("你的编辑待审核")
 * — deliberately scoped to the caller's own submissions only; other users' pending proposals for the
 * same resource are not visible here.
 */
router.get("/resources/:id/edit-suggestions/mine", requireAuth, async (req: any, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const [latest] = await db
      .select()
      .from(resourceEditSuggestionsTable)
      .where(and(eq(resourceEditSuggestionsTable.resourceId, resourceId), eq(resourceEditSuggestionsTable.submittedBy, req.user.userId)))
      .orderBy(desc(resourceEditSuggestionsTable.submittedAt))
      .limit(1);
    res.json(latest ?? null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch suggestion status" });
  }
});

function resolveTagRefs(ids: number[] | undefined, tagById: Map<number, ResolvedTagRef>): ResolvedTagRef[] | undefined {
  if (ids === undefined) return undefined;
  return ids.map((id) => tagById.get(id)).filter((t): t is ResolvedTagRef => !!t);
}

/**
 * GET /api/admin/edit-suggestions — admin only.
 * Query: ?status=pending|approved|rejected (default 'pending'). Returns each suggestion with BOTH
 * the resource's current live field values and the proposed ones — only for the keys actually
 * present in that suggestion — so the review-queue UI can render a plain "current vs proposed" diff
 * without a second round trip. Facet tag ids are resolved to names in one batch query.
 */
router.get("/admin/edit-suggestions", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const statusFilter = (["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : "pending") as "pending" | "approved" | "rejected";

    const rows = await db
      .select({
        id: resourceEditSuggestionsTable.id,
        resourceId: resourceEditSuggestionsTable.resourceId,
        resourceTitle: resourcesTable.title,
        submittedBy: resourceEditSuggestionsTable.submittedBy,
        submitterEmail: usersTable.email,
        submittedAt: resourceEditSuggestionsTable.submittedAt,
        proposedFields: resourceEditSuggestionsTable.proposedFields,
        status: resourceEditSuggestionsTable.status,
        reviewedBy: resourceEditSuggestionsTable.reviewedBy,
        reviewedAt: resourceEditSuggestionsTable.reviewedAt,
        reviewNote: resourceEditSuggestionsTable.reviewNote,
      })
      .from(resourceEditSuggestionsTable)
      .innerJoin(resourcesTable, eq(resourceEditSuggestionsTable.resourceId, resourcesTable.id))
      .innerJoin(usersTable, eq(resourceEditSuggestionsTable.submittedBy, usersTable.id))
      .where(eq(resourceEditSuggestionsTable.status, statusFilter))
      .orderBy(desc(resourceEditSuggestionsTable.submittedAt));

    if (rows.length === 0) { res.json([]); return; }

    const resourceIds = [...new Set(rows.map((r) => r.resourceId))];
    const liveResources = await db.select().from(resourcesTable).where(inArray(resourcesTable.id, resourceIds));
    const liveById = new Map(liveResources.map((r) => [r.id, r]));

    const proposedTagIds = rows.flatMap((r) => FACET_KEYS.flatMap((k) => (r.proposedFields as SuggestibleResourceFields)[k] ?? []));
    const [tagRows, facetedByResource] = await Promise.all([
      proposedTagIds.length > 0
        ? db.select({ id: tagsTable.id, slug: tagsTable.slug, nameEn: tagsTable.nameEn, nameZh: tagsTable.nameZh, facet: tagsTable.facet }).from(tagsTable).where(inArray(tagsTable.id, [...new Set(proposedTagIds)]))
        : Promise.resolve([]),
      attachFacetedTags(resourceIds.map((id) => ({ id }))),
    ]);
    const tagById = new Map<number, ResolvedTagRef>(tagRows.map((t) => [t.id, t as ResolvedTagRef]));
    const facetedById = new Map(facetedByResource.map((r) => [r.id, r.facetedTags]));

    res.json(rows.map((r) => {
      const proposed = r.proposedFields as SuggestibleResourceFields;
      const live = liveById.get(r.resourceId);
      const liveFacets = facetedById.get(r.resourceId) ?? [];
      const current: SuggestibleResourceFields & { themeTagRefs?: ResolvedTagRef[]; jurisdictionTagRefs?: ResolvedTagRef[]; assetTagRefs?: ResolvedTagRef[] } = {};
      const proposedOut: SuggestibleResourceFields & { themeTagRefs?: ResolvedTagRef[]; jurisdictionTagRefs?: ResolvedTagRef[]; assetTagRefs?: ResolvedTagRef[] } = {};

      if (proposed.title !== undefined) { current.title = live?.title; proposedOut.title = proposed.title; }
      if (proposed.authors !== undefined) { current.authors = live?.authors; proposedOut.authors = proposed.authors; }
      if (proposed.publishedDate !== undefined) { current.publishedDate = live?.publishedDate; proposedOut.publishedDate = proposed.publishedDate; }
      if (proposed.abstract !== undefined) { current.abstract = live?.abstract; proposedOut.abstract = proposed.abstract; }
      if (proposed.url !== undefined) { current.url = live?.url; proposedOut.url = proposed.url; }
      if (proposed.doi !== undefined) { current.doi = live?.doi; proposedOut.doi = proposed.doi; }
      if (proposed.keywords !== undefined) { current.keywords = live?.keywords; proposedOut.keywords = proposed.keywords; }
      if (proposed.themeTags !== undefined) { current.themeTagRefs = liveFacets.filter((t) => t.facet === "theme"); proposedOut.themeTagRefs = resolveTagRefs(proposed.themeTags, tagById); }
      if (proposed.jurisdictionTags !== undefined) { current.jurisdictionTagRefs = liveFacets.filter((t) => t.facet === "jurisdiction"); proposedOut.jurisdictionTagRefs = resolveTagRefs(proposed.jurisdictionTags, tagById); }
      if (proposed.assetTags !== undefined) { current.assetTagRefs = liveFacets.filter((t) => t.facet === "asset"); proposedOut.assetTagRefs = resolveTagRefs(proposed.assetTags, tagById); }

      return {
        id: r.id,
        resourceId: r.resourceId,
        resourceTitle: r.resourceTitle,
        submittedBy: r.submittedBy,
        submitterEmail: r.submitterEmail,
        submittedAt: r.submittedAt,
        status: r.status,
        reviewedBy: r.reviewedBy,
        reviewedAt: r.reviewedAt,
        reviewNote: r.reviewNote,
        current,
        proposed: proposedOut,
      };
    }));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch edit suggestions" });
  }
});

/**
 * PATCH /api/admin/edit-suggestions/:id/review — admin only.
 * Body: { action: 'approve' | 'reject', reviewNote?: string }
 * Approve applies every field present in proposedFields (a full replacement per field, not a
 * merge — same semantics as the admin-direct-edit path), marks every kept/added facet tag link
 * 'manual' (T.4's protection scheme), recomputes `status` via recomputeResourceStatus()
 * (completeness/duplicate/theme-tag — NOT a fresh verify-agent run), and marks the suggestion
 * 'approved'. Reject only marks the suggestion 'rejected' — the resource's current display and
 * content are untouched either way until approval.
 */
router.patch("/admin/edit-suggestions/:id/review", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, reviewNote } = req.body as { action?: string; reviewNote?: string };
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const [suggestion] = await db.select().from(resourceEditSuggestionsTable).where(eq(resourceEditSuggestionsTable.id, id)).limit(1);
    if (!suggestion) { res.status(404).json({ error: "Not found" }); return; }
    if (suggestion.status !== "pending") { res.status(400).json({ error: "This suggestion has already been reviewed" }); return; }

    if (action === "reject") {
      const [rejected] = await db
        .update(resourceEditSuggestionsTable)
        .set({ status: "rejected", reviewedBy: req.user.userId, reviewedAt: new Date(), reviewNote: reviewNote?.trim() || null })
        .where(eq(resourceEditSuggestionsTable.id, id))
        .returning();
      res.json(rejected);
      return;
    }

    const { resourceId } = suggestion;
    const proposed = suggestion.proposedFields as SuggestibleResourceFields;
    const [beforeEdit] = await db.select({ status: resourcesTable.status }).from(resourcesTable).where(eq(resourcesTable.id, resourceId)).limit(1);
    if (!beforeEdit) { res.status(404).json({ error: "Resource not found" }); return; }
    const previousStatus = beforeEdit.status;

    const scalarUpdates: Record<string, unknown> = {};
    if (proposed.title !== undefined) scalarUpdates.title = proposed.title;
    if (proposed.authors !== undefined) scalarUpdates.authors = proposed.authors;
    if (proposed.publishedDate !== undefined) scalarUpdates.publishedDate = proposed.publishedDate;
    if (proposed.abstract !== undefined) scalarUpdates.abstract = proposed.abstract;
    if (proposed.url !== undefined) scalarUpdates.url = proposed.url;
    if (proposed.doi !== undefined) scalarUpdates.doi = proposed.doi;
    if (proposed.keywords !== undefined) {
      scalarUpdates.keywords = proposed.keywords;
      scalarUpdates.keywordsSource = proposed.keywords.length > 0 ? "manual" : null;
    }
    if (Object.keys(scalarUpdates).length > 0) {
      await db.update(resourcesTable).set(scalarUpdates).where(eq(resourcesTable.id, resourceId));
    }
    if (proposed.authors !== undefined) await syncResourceAuthors(resourceId, proposed.authors);

    // Facet tags: only touch the facet(s) actually present in this suggestion — a suggestion that
    // only proposed e.g. a title change must not disturb tags of any facet.
    for (const key of FACET_KEYS) {
      const proposedIds = proposed[key];
      if (proposedIds === undefined) continue;
      const facet = FACET_OF[key];
      const currentLinks = await db.select({ tagId: resourceTagsTable.tagId })
        .from(resourceTagsTable).innerJoin(tagsTable, eq(resourceTagsTable.tagId, tagsTable.id))
        .where(and(eq(resourceTagsTable.resourceId, resourceId), eq(tagsTable.facet, facet)));
      const currentIds = new Set(currentLinks.map((l) => l.tagId));
      const newIds = new Set(proposedIds);
      const toRemove = [...currentIds].filter((tagId) => !newIds.has(tagId));
      if (toRemove.length > 0) {
        await db.delete(resourceTagsTable).where(and(eq(resourceTagsTable.resourceId, resourceId), inArray(resourceTagsTable.tagId, toRemove)));
      }
      if (newIds.size > 0) {
        await db
          .insert(resourceTagsTable)
          .values([...newIds].map((tagId) => ({ resourceId, tagId, source: "manual" as const })))
          .onConflictDoUpdate({ target: [resourceTagsTable.resourceId, resourceTagsTable.tagId], set: { source: "manual" as const } });
      }
    }

    // Never silent — the response always says whether/why the resource's status changed as a result
    // of applying this proposal, same as the admin-direct-edit path.
    const result = await recomputeResourceStatus(resourceId);
    await db.update(resourcesTable).set({ status: result.status }).where(eq(resourcesTable.id, resourceId));

    const [approved] = await db
      .update(resourceEditSuggestionsTable)
      .set({ status: "approved", reviewedBy: req.user.userId, reviewedAt: new Date(), reviewNote: reviewNote?.trim() || null })
      .where(eq(resourceEditSuggestionsTable.id, id))
      .returning();
    res.json({
      ...approved,
      resourceStatusChanged: previousStatus !== result.status,
      previousResourceStatus: previousStatus,
      newResourceStatus: result.status,
      ...(previousStatus !== result.status && {
        resourceStatusChangeReason: { missingFields: result.missingFields, hasThemeTag: result.hasThemeTag, duplicateSignal: result.duplicateSignal, hasMismatch: result.hasMismatch },
      }),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to review suggestion" });
  }
});

export default router;
