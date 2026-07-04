import { Router } from "express";
import { db, resourcesTable, tagsTable, resourceTagsTable, usersTable, tagKeywordEditSuggestionsTable } from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { attachFacetedTags } from "../lib/tagging";
import { recomputeStatusAfterTagKeywordEdit } from "../lib/resourceStatus";

const router = Router();

/** Shared shape for a resolved tag reference in the review-queue diff view. */
interface ResolvedTagRef {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
}

/**
 * docs/planning/18 §18.4 — any logged-in user can propose a Theme/Jurisdiction/Asset tag change
 * (picked from the controlled vocabulary only — this never creates new tags) and a keyword change
 * for a resource they can see. The proposal is never applied automatically: it lands here as
 * status='pending' for an admin to review (see the review-queue endpoints, docs/planning/18 §18.4
 * step 2). An admin's own edits skip this table entirely and write straight through the existing
 * PATCH /resources/:id path — that branch decision is made by the frontend based on role, not by
 * this endpoint rejecting admin callers.
 */
router.post("/resources/:id/tag-keyword-suggestions", requireAuth, async (req: any, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const [resource] = await db
      .select({ id: resourcesTable.id, status: resourcesTable.status, createdBy: resourcesTable.createdBy })
      .from(resourcesTable)
      .where(eq(resourcesTable.id, resourceId))
      .limit(1);
    if (!resource) { res.status(404).json({ error: "Not found" }); return; }
    // Same visibility rule as GET /resources/:id — can't propose an edit on a resource you can't see.
    if (resource.status !== "approved" && resource.createdBy !== req.user.userId && req.user.role !== "admin") {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const { themeTagIds, jurisdictionTagIds, assetTagIds, keywords } = req.body as {
      themeTagIds?: number[]; jurisdictionTagIds?: number[]; assetTagIds?: number[]; keywords?: string[];
    };
    const themeIds = Array.isArray(themeTagIds) ? themeTagIds.filter((n): n is number => typeof n === "number") : [];
    const jurisdictionIds = Array.isArray(jurisdictionTagIds) ? jurisdictionTagIds.filter((n): n is number => typeof n === "number") : [];
    const assetIds = Array.isArray(assetTagIds) ? assetTagIds.filter((n): n is number => typeof n === "number") : [];
    const proposedKeywords = Array.isArray(keywords) ? keywords.filter((k): k is string => typeof k === "string" && k.trim().length > 0).map((k) => k.trim()) : [];

    // Controlled-vocabulary check: every proposed id must be an existing active tag in the facet the
    // user claims it belongs to — this is a picker over lib/db's tags table, not a free-create field.
    // Exception: a tag already attached to this resource is grandfathered in even if it has since been
    // demoted to 'candidate' (or otherwise isn't 'active') — a submitter re-proposing an unrelated
    // change (e.g. just adding keywords) shouldn't have their whole suggestion rejected because the
    // picker pre-populated a legacy tag they never touched.
    const allIds = [...themeIds, ...jurisdictionIds, ...assetIds];
    if (allIds.length > 0) {
      const [rows, currentLinks] = await Promise.all([
        db.select({ id: tagsTable.id, facet: tagsTable.facet, status: tagsTable.status }).from(tagsTable).where(inArray(tagsTable.id, [...new Set(allIds)])),
        db.select({ tagId: resourceTagsTable.tagId }).from(resourceTagsTable).where(eq(resourceTagsTable.resourceId, resourceId)),
      ]);
      const byId = new Map(rows.map((r) => [r.id, r]));
      const currentlyAttached = new Set(currentLinks.map((l) => l.tagId));
      const isValid = (ids: number[], facet: "theme" | "jurisdiction" | "asset") =>
        ids.every((id) => byId.get(id)?.facet === facet && (byId.get(id)?.status === "active" || currentlyAttached.has(id)));
      if (!isValid(themeIds, "theme") || !isValid(jurisdictionIds, "jurisdiction") || !isValid(assetIds, "asset")) {
        res.status(400).json({ error: "One or more tag ids are invalid or don't belong to the stated facet" });
        return;
      }
    }

    const [created] = await db
      .insert(tagKeywordEditSuggestionsTable)
      .values({
        resourceId,
        submittedBy: req.user.userId,
        proposedThemeTags: themeIds,
        proposedJurisdictionTags: jurisdictionIds,
        proposedAssetTags: assetIds,
        proposedKeywords,
        status: "pending",
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit suggestion" });
  }
});

/**
 * GET /api/resources/:id/tag-keyword-suggestions/mine — must be logged in.
 * Lets the submitter check their own latest proposal's status on this resource ("你的编辑待审核",
 * docs/planning/18 §18.4) — deliberately scoped to the caller's own submissions only; other users'
 * pending proposals for the same resource are not visible here.
 */
router.get("/resources/:id/tag-keyword-suggestions/mine", requireAuth, async (req: any, res) => {
  try {
    const resourceId = parseInt(req.params.id);
    const [latest] = await db
      .select()
      .from(tagKeywordEditSuggestionsTable)
      .where(and(eq(tagKeywordEditSuggestionsTable.resourceId, resourceId), eq(tagKeywordEditSuggestionsTable.submittedBy, req.user.userId)))
      .orderBy(desc(tagKeywordEditSuggestionsTable.submittedAt))
      .limit(1);
    res.json(latest ?? null);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch suggestion status" });
  }
});

/**
 * GET /api/admin/tag-suggestions — admin only (docs/planning/18 §18.4 step 2).
 * Query: ?status=pending|approved|rejected (default 'pending', mirroring how the resource approval
 * queue only ever needs to show pending by default). Returns each suggestion with BOTH the
 * resource's current tag/keyword state and the proposed one, fully resolved to tag names — so the
 * review-queue UI can render a plain "current vs proposed" diff without a second round trip.
 */
router.get("/admin/tag-suggestions", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const statusFilter = (["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : "pending") as "pending" | "approved" | "rejected";

    const rows = await db
      .select({
        id: tagKeywordEditSuggestionsTable.id,
        resourceId: tagKeywordEditSuggestionsTable.resourceId,
        resourceTitle: resourcesTable.title,
        submittedBy: tagKeywordEditSuggestionsTable.submittedBy,
        submitterEmail: usersTable.email,
        submittedAt: tagKeywordEditSuggestionsTable.submittedAt,
        proposedThemeTags: tagKeywordEditSuggestionsTable.proposedThemeTags,
        proposedJurisdictionTags: tagKeywordEditSuggestionsTable.proposedJurisdictionTags,
        proposedAssetTags: tagKeywordEditSuggestionsTable.proposedAssetTags,
        proposedKeywords: tagKeywordEditSuggestionsTable.proposedKeywords,
        status: tagKeywordEditSuggestionsTable.status,
        reviewedBy: tagKeywordEditSuggestionsTable.reviewedBy,
        reviewedAt: tagKeywordEditSuggestionsTable.reviewedAt,
        reviewNote: tagKeywordEditSuggestionsTable.reviewNote,
        currentKeywords: resourcesTable.keywords,
      })
      .from(tagKeywordEditSuggestionsTable)
      .innerJoin(resourcesTable, eq(tagKeywordEditSuggestionsTable.resourceId, resourcesTable.id))
      .innerJoin(usersTable, eq(tagKeywordEditSuggestionsTable.submittedBy, usersTable.id))
      .where(eq(tagKeywordEditSuggestionsTable.status, statusFilter))
      .orderBy(desc(tagKeywordEditSuggestionsTable.submittedAt));

    if (rows.length === 0) { res.json([]); return; }

    // Resolve every proposed tag id (across all rows) plus every currently-linked tag, in one batch.
    const proposedIds = rows.flatMap((r) => [
      ...(r.proposedThemeTags as number[]),
      ...(r.proposedJurisdictionTags as number[]),
      ...(r.proposedAssetTags as number[]),
    ]);
    const resourceIds = [...new Set(rows.map((r) => r.resourceId))];
    const [tagRows, currentRows] = await Promise.all([
      proposedIds.length > 0
        ? db.select({ id: tagsTable.id, slug: tagsTable.slug, nameEn: tagsTable.nameEn, nameZh: tagsTable.nameZh, facet: tagsTable.facet }).from(tagsTable).where(inArray(tagsTable.id, [...new Set(proposedIds)]))
        : Promise.resolve([]),
      attachFacetedTags(resourceIds.map((id) => ({ id }))),
    ]);
    const tagById = new Map<number, ResolvedTagRef>(tagRows.map((t) => [t.id, t as ResolvedTagRef]));
    const currentByResource = new Map(currentRows.map((r) => [r.id, r.facetedTags]));
    const resolve = (ids: number[]): ResolvedTagRef[] => ids.map((id) => tagById.get(id)).filter((t): t is ResolvedTagRef => !!t);

    res.json(rows.map((r) => {
      const current = currentByResource.get(r.resourceId) ?? [];
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
        current: {
          themeTags: current.filter((t) => t.facet === "theme"),
          jurisdictionTags: current.filter((t) => t.facet === "jurisdiction"),
          assetTags: current.filter((t) => t.facet === "asset"),
          keywords: r.currentKeywords,
        },
        proposed: {
          themeTags: resolve(r.proposedThemeTags as number[]),
          jurisdictionTags: resolve(r.proposedJurisdictionTags as number[]),
          assetTags: resolve(r.proposedAssetTags as number[]),
          keywords: r.proposedKeywords,
        },
      };
    }));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch tag suggestions" });
  }
});

/**
 * PATCH /api/admin/tag-suggestions/:id/review — admin only.
 * Body: { action: 'approve' | 'reject', reviewNote?: string }
 * Approve applies the FULL proposed tag/keyword set (replace, not merge — same semantics as the
 * admin-direct-edit path) to resource_tags/resources.keywords, marks every kept/added tag link
 * 'manual' (T.4's protection scheme, same as admin edits), recomputes `status` via
 * recomputeStatusAfterTagKeywordEdit() (completeness/duplicate/theme-tag — NOT a fresh verify-agent
 * run), and marks the suggestion 'approved'. Reject only marks the suggestion 'rejected' — the
 * resource's current display is untouched either way until approval.
 */
router.patch("/admin/tag-suggestions/:id/review", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action, reviewNote } = req.body as { action?: string; reviewNote?: string };
    if (action !== "approve" && action !== "reject") {
      res.status(400).json({ error: "action must be 'approve' or 'reject'" });
      return;
    }

    const [suggestion] = await db.select().from(tagKeywordEditSuggestionsTable).where(eq(tagKeywordEditSuggestionsTable.id, id)).limit(1);
    if (!suggestion) { res.status(404).json({ error: "Not found" }); return; }
    if (suggestion.status !== "pending") { res.status(400).json({ error: "This suggestion has already been reviewed" }); return; }

    if (action === "reject") {
      const [rejected] = await db
        .update(tagKeywordEditSuggestionsTable)
        .set({ status: "rejected", reviewedBy: req.user.userId, reviewedAt: new Date(), reviewNote: reviewNote?.trim() || null })
        .where(eq(tagKeywordEditSuggestionsTable.id, id))
        .returning();
      res.json(rejected);
      return;
    }

    const { resourceId } = suggestion;
    const [beforeEdit] = await db.select({ status: resourcesTable.status }).from(resourcesTable).where(eq(resourcesTable.id, resourceId)).limit(1);
    if (!beforeEdit) { res.status(404).json({ error: "Resource not found" }); return; }
    const previousStatus = beforeEdit.status;
    const proposedTagIds = [...(suggestion.proposedThemeTags as number[]), ...(suggestion.proposedJurisdictionTags as number[]), ...(suggestion.proposedAssetTags as number[])];

    await db.update(resourcesTable).set({
      keywords: suggestion.proposedKeywords as string[],
      keywordsSource: (suggestion.proposedKeywords as string[]).length > 0 ? "manual" : null,
    }).where(eq(resourcesTable.id, resourceId));

    const currentLinks = await db.select({ tagId: resourceTagsTable.tagId }).from(resourceTagsTable).where(eq(resourceTagsTable.resourceId, resourceId));
    const currentIds = new Set(currentLinks.map((l) => l.tagId));
    const newIds = new Set(proposedTagIds);
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

    // Never silent (docs/planning/18 §18.4) — the response always says whether/why the resource's
    // status changed as a result of applying this proposal, same as the admin-direct-edit path.
    const result = await recomputeStatusAfterTagKeywordEdit(resourceId);
    await db.update(resourcesTable).set({ status: result.status }).where(eq(resourcesTable.id, resourceId));

    const [approved] = await db
      .update(tagKeywordEditSuggestionsTable)
      .set({ status: "approved", reviewedBy: req.user.userId, reviewedAt: new Date(), reviewNote: reviewNote?.trim() || null })
      .where(eq(tagKeywordEditSuggestionsTable.id, id))
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
    return;
    res.json(approved);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to review suggestion" });
  }
});

export default router;
