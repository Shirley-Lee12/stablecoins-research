import { Router } from "express";
import { db, resourcesTable, researchPapersTable, regulatoryEntriesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  try {
    const [resourceCount] = await db.select({ count: sql<number>`count(*)::int` }).from(resourcesTable);
    const [paperCount] = await db.select({ count: sql<number>`count(*)::int` }).from(researchPapersTable);
    const [regulatoryCount] = await db.select({ count: sql<number>`count(*)::int` }).from(regulatoryEntriesTable);
    const [countryCount] = await db
      .select({ count: sql<number>`count(distinct country)::int` })
      .from(regulatoryEntriesTable);

    const typeStats = await db
      .select({
        type: resourcesTable.resourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(resourcesTable)
      .groupBy(resourcesTable.resourceType);

    const tagRows = await db
      .select({ tag: sql<string>`unnest(${resourcesTable.tags})` })
      .from(resourcesTable);

    const tagCounts: Record<string, number> = {};
    for (const row of tagRows) {
      tagCounts[row.tag] = (tagCounts[row.tag] ?? 0) + 1;
    }
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, name_zh: null, count }));

    res.json({
      total_resources: resourceCount?.count ?? 0,
      total_research_papers: paperCount?.count ?? 0,
      total_regulatory_entries: regulatoryCount?.count ?? 0,
      resources_by_type: typeStats.map((t) => ({ type: t.type, count: t.count })),
      countries_covered: countryCount?.count ?? 0,
      top_tags: topTags,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;
