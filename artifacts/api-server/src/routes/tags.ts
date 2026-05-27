import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/tags", async (req, res) => {
  try {
    const results = await db
      .select({ tag: sql<string>`unnest(${resourcesTable.tags})` })
      .from(resourcesTable);

    const counts: Record<string, number> = {};
    for (const row of results) {
      const t = row.tag;
      counts[t] = (counts[t] ?? 0) + 1;
    }

    const tags = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, name_zh: null, count }));

    res.json(tags);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list tags" });
  }
});

export default router;
