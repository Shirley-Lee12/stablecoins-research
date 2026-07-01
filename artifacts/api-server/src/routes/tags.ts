import { Router } from "express";
import { db, tagsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

/**
 * GET /api/tags — public, read-only reference data for the facet filter sidebar.
 * Only returns status='active' tags — candidate tags are admin-review-only, not for public browsing.
 */
router.get("/tags", async (req, res) => {
  try {
    const rows = await db
      .select({ id: tagsTable.id, slug: tagsTable.slug, nameEn: tagsTable.nameEn, nameZh: tagsTable.nameZh, facet: tagsTable.facet, region: tagsTable.region })
      .from(tagsTable)
      .where(eq(tagsTable.status, "active"));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

export default router;
