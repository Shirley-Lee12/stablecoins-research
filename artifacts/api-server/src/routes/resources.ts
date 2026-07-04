import { Router } from "express";
import { db, resourcesTable, resourceTagsTable, tagsTable } from "@workspace/db";
import { eq, desc, ilike, or, sql, and, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth } from "./auth";
import { syncResourceAuthors } from "./authors";
import { verifyResource } from "../lib/verify";
import { missingSixElements, classifyStatus } from "../lib/resourceStatus";
import { checkDuplicate } from "../lib/duplicateCheck";
import { retagResources, attachFacetedTags } from "../lib/tagging";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
/**
 * GET /api/resources
 * Visibility rules:
 *   - unauthenticated → status = 'approved' only
 *   - user            → status = 'approved' OR created_by = req.user.userId
 *   - admin           → all rows (optional ?status filter)
 */
router.get("/resources", optionalAuth, async (req: any, res) => {
  try {
    const { source_type, search } = req.query as Record<string, string>;

    const conditions: ReturnType<typeof eq>[] = [];

    // ── Visibility ──
    if (!req.user) {
      conditions.push(eq(resourcesTable.status, "approved"));
    } else if (req.user.role !== "admin") {
      conditions.push(
        or(
          eq(resourcesTable.status, "approved"),
          eq(resourcesTable.createdBy, req.user.userId),
        ) as any,
      );
    } else {
      // Admin: optional status filter
      const statusFilter = req.query["status"] as string | undefined;
      if (statusFilter && ["incomplete", "disputed", "off_topic", "duplicate", "pending", "approved", "rejected"].includes(statusFilter)) {
        conditions.push(eq(resourcesTable.status, statusFilter as any));
      }
    }

    // ── Domain filters ──
    if (source_type) conditions.push(eq(resourcesTable.sourceType, source_type as any));
    const facetTagSlug = req.query["facetTag"] as string | undefined;
    if (facetTagSlug) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM resource_tags rt JOIN tags t ON t.id = rt.tag_id
        WHERE rt.resource_id = ${resourcesTable.id} AND t.slug = ${facetTagSlug}
      )` as any);
    }
    if (search) {
      const like = `%${search}%`;
      conditions.push(
        or(
          ilike(resourcesTable.title, like),
          ilike(resourcesTable.abstract, like),
          sql`EXISTS (SELECT 1 FROM unnest(${resourcesTable.authors}) a WHERE a ILIKE ${like})`,
          sql`EXISTS (SELECT 1 FROM unnest(${resourcesTable.keywords}) k WHERE k ILIKE ${like})`,
        ) as any,
      );
    }

    const rows = await db
      .select()
      .from(resourcesTable)
      .where(conditions.length > 0 ? and(...(conditions as any[])) : undefined)
      .orderBy(desc(resourcesTable.createdAt));

    res.json(await attachFacetedTags(rows));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

router.get("/resources/recent", optionalAuth, async (req: any, res) => {
  try {
    const limit = Number(req.query.limit ?? 5);

    const rows = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.status, "approved"))
      .orderBy(desc(resourcesTable.createdAt))
      .limit(limit);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch recent resources" });
  }
});

/** GET /api/resources/:id */
router.get("/resources/:id", optionalAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid resource id" }); return; }
    const [row] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    // Non-admin can only see approved or their own
    if (!req.user) {
      if (row.status !== "approved") { res.status(404).json({ error: "Not found" }); return; }
    } else if (req.user.role !== "admin") {
      if (row.status !== "approved" && row.createdBy !== req.user.userId) {
        res.status(404).json({ error: "Not found" }); return;
      }
    }

    res.json((await attachFacetedTags([row]))[0]);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});


/**
 * PATCH /api/resources/:id
 * Admin or owner only. Body may include `tagIds` (facet tag ids — admin only, see below).
 *
 * Admin edits (docs/planning/15 §2.4): status is left untouched — an admin's judgment is
 * authoritative, so there's no "re-check" step like the owner path below. `tagIds`, if present,
 * replaces the resource's facet tags and marks every kept/added one `source: 'manual'` (so a future
 * retagResources() rerun — which only ever touches source='auto' rows — won't silently undo an
 * admin's tag choices, per T.4's protection mechanism). `adminEdited` is set true on any admin PATCH
 * through this route, as a coarse "an admin has touched this resource's content" marker.
 *
 * Owner (non-admin) edits (docs/planning/15 §0.7): this is the resubmission flow — the whole check
 * pipeline (six-elements completeness, verify/cross-check, duplicate, topic-relevance-via-tags)
 * reruns against the edited content, and the resulting status is whichever of
 * incomplete/disputed/off_topic/duplicate/pending the checks land on, same as a brand-new
 * submission — NOT a blind reset to 'pending' like the old behavior. Tags aren't editable by a
 * non-admin owner here; they're recomputed automatically (via retagResources) from the edited
 * title/abstract, same as any other auto-tagging path.
 */
router.patch("/resources/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const isAdmin = req.user.role === "admin";
    const isOwner = existing.createdBy === req.user.userId;
    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: "You do not have permission to edit this resource" });
      return;
    }

    const { title, authors, sourceType, url, doi, abstract, publishedDate, tagIds, keywords } = req.body as {
      title?: string; authors?: string[]; sourceType?: string; url?: string | null; doi?: string | null;
      abstract?: string; publishedDate?: string | null; tagIds?: number[]; keywords?: string[];
    };

    const [updated] = await db
      .update(resourcesTable)
      .set({
        ...(title         !== undefined && { title }),
        ...(authors       !== undefined && { authors }),
        ...(sourceType    !== undefined && { sourceType: sourceType as any }),
        ...(url           !== undefined && { url }),
        ...(doi           !== undefined && { doi }),
        ...(abstract      !== undefined && { abstract }),
        // Editing this field is inherently a human act, whether the editor is the owner or an admin
        // (docs/planning/15 §5.3's "manual" source) — not re-derived from wherever it started.
        ...(keywords      !== undefined && { keywords, keywordsSource: keywords.length > 0 ? "manual" as const : null }),
        ...(publishedDate !== undefined && { publishedDate }),
        ...(isAdmin && { adminEdited: true }),
      })
      .where(eq(resourcesTable.id, id))
      .returning();

    if (authors !== undefined) await syncResourceAuthors(id, updated.authors);

    if (isAdmin) {
      if (tagIds !== undefined) {
        const currentLinks = await db.select({ tagId: resourceTagsTable.tagId }).from(resourceTagsTable).where(eq(resourceTagsTable.resourceId, id));
        const currentIds = new Set(currentLinks.map((l) => l.tagId));
        const newIds = new Set(tagIds);
        const toRemove = [...currentIds].filter((tagId) => !newIds.has(tagId));
        if (toRemove.length > 0) {
          await db.delete(resourceTagsTable).where(and(eq(resourceTagsTable.resourceId, id), inArray(resourceTagsTable.tagId, toRemove)));
        }
        if (newIds.size > 0) {
          await db
            .insert(resourceTagsTable)
            .values([...newIds].map((tagId) => ({ resourceId: id, tagId, source: "manual" as const })))
            .onConflictDoUpdate({ target: [resourceTagsTable.resourceId, resourceTagsTable.tagId], set: { source: "manual" as const } });
        }
      }
      res.json(updated);
      return;
    }

    // Owner resubmission — rerun the full check pipeline (docs/planning/15 §0.7).
    const contentChanged = title !== undefined || authors !== undefined || url !== undefined || doi !== undefined || abstract !== undefined || publishedDate !== undefined || keywords !== undefined;
    if (contentChanged) {
      const year = updated.publishedDate?.match(/^\d{4}/)?.[0] ? Number(updated.publishedDate.match(/^\d{4}/)![0]) : null;
      const missingFields = missingSixElements({ title: updated.title, authors: updated.authors, year, abstract: updated.abstract, url: updated.url, doi: updated.doi, keywords: updated.keywords });
      const report = await verifyResource({ title: updated.title, authors: updated.authors, year, doi: updated.doi, url: updated.url, abstract: updated.abstract, keywords: updated.keywords });
      const duplicateSignal = await checkDuplicate({ title: updated.title, doi: updated.doi, url: updated.url, year }, id);
      await retagResources([id]);
      const themeRows = await db
        .select({ facet: tagsTable.facet })
        .from(resourceTagsTable)
        .innerJoin(tagsTable, eq(resourceTagsTable.tagId, tagsTable.id))
        .where(eq(resourceTagsTable.resourceId, id));
      const hasThemeTag = themeRows.some((t) => t.facet === "theme");
      const newStatus = classifyStatus({ duplicateSignal, missingFields, hasThemeTag, report });
      const [reclassified] = await db
        .update(resourcesTable)
        // docs/planning/16 §16.1 — cache the report computed above (the same reasoning as
        // persistConfirmedDraft: this resubmission recheck already has to compute it fresh).
        .set({ status: newStatus, rejectionReasonId: null, rejectionNote: null, reviewedBy: null, reviewedAt: null, verificationReport: report, verifiedAt: new Date() })
        .where(eq(resourcesTable.id, id))
        .returning();
      res.json(reclassified);
      return;
    }

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

/** DELETE /api/resources/:id — admin or owner */
router.delete("/resources/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const isAdmin = req.user.role === "admin";
    const isOwner = existing.createdBy === req.user.userId;
    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: "You do not have permission to delete this resource" });
      return;
    }

    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
