import { Router } from "express";
import { db, resourcesTable, tagsTable, tagKeywordEditSuggestionsTable } from "@workspace/db";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

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
    const allIds = [...themeIds, ...jurisdictionIds, ...assetIds];
    if (allIds.length > 0) {
      const rows = await db.select({ id: tagsTable.id, facet: tagsTable.facet, status: tagsTable.status }).from(tagsTable).where(inArray(tagsTable.id, [...new Set(allIds)]));
      const byId = new Map(rows.map((r) => [r.id, r]));
      const isValid = (ids: number[], facet: "theme" | "jurisdiction" | "asset") =>
        ids.every((id) => byId.get(id)?.status === "active" && byId.get(id)?.facet === facet);
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

export default router;
