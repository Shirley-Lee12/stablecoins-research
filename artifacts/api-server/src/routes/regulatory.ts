import { Router } from "express";
import { db, regulatoryEntriesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import {
  ListRegulatoryEntriesQueryParams,
  CreateRegulatoryEntryBody,
  GetRegulatoryEntryParams,
  GetRegulatoryTimelineQueryParams,
} from "@workspace/api-zod";

const router = Router();

function mapEntry(e: typeof regulatoryEntriesTable.$inferSelect) {
  return {
    id: e.id,
    country: e.country,
    region: e.region,
    authority: e.authority,
    title: e.title,
    title_zh: e.titleZh,
    summary: e.summary,
    summary_zh: e.summaryZh,
    document_url: e.documentUrl,
    effective_date: e.effectiveDate,
    category: e.category,
    created_at: e.createdAt.toISOString(),
  };
}

router.get("/regulatory-entries/timeline", async (req, res) => {
  try {
    const params = GetRegulatoryTimelineQueryParams.parse(req.query);
    const results = await db.select().from(regulatoryEntriesTable).orderBy(desc(regulatoryEntriesTable.effectiveDate));
    const grouped: Record<number, ReturnType<typeof mapEntry>[]> = {};
    for (const entry of results) {
      const year = parseInt(entry.effectiveDate.split("-")[0] ?? "0");
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(mapEntry(entry));
    }
    const timeline = Object.entries(grouped)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, entries]) => ({ year: parseInt(year), entries }));
    res.json(timeline);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get regulatory timeline" });
  }
});

router.get("/regulatory-entries/country-stats", async (req, res) => {
  try {
    const results = await db
      .select({ country: regulatoryEntriesTable.country, count: sql<number>`count(*)::int` })
      .from(regulatoryEntriesTable)
      .groupBy(regulatoryEntriesTable.country)
      .orderBy(desc(sql`count(*)`));
    res.json(results);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get country stats" });
  }
});

router.get("/regulatory-entries", async (req, res) => {
  try {
    const params = ListRegulatoryEntriesQueryParams.parse(req.query);
    let query = db.select().from(regulatoryEntriesTable).$dynamic();

    const conditions = [];
    if (params.country) {
      conditions.push(ilike(regulatoryEntriesTable.country, `%${params.country}%`));
    }
    if (params.category) {
      conditions.push(ilike(regulatoryEntriesTable.category ?? regulatoryEntriesTable.title, `%${params.category}%`));
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(regulatoryEntriesTable.title, `%${params.search}%`),
          ilike(regulatoryEntriesTable.summary ?? regulatoryEntriesTable.title, `%${params.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      const { and } = await import("drizzle-orm");
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(regulatoryEntriesTable.effectiveDate));
    const results = await query;
    res.json(results.map(mapEntry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list regulatory entries" });
  }
});

router.get("/regulatory-entries/:id", async (req, res): Promise<void> => {
  try {
    const { id } = GetRegulatoryEntryParams.parse({ id: parseInt(req.params.id) });
    const [entry] = await db.select().from(regulatoryEntriesTable).where(eq(regulatoryEntriesTable.id, id));
    if (!entry) { res.status(404).json({ error: "Regulatory entry not found" }); return; }
    res.json(mapEntry(entry));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get regulatory entry" });
  }
});

router.post("/regulatory-entries", async (req, res) => {
  try {
    const body = CreateRegulatoryEntryBody.parse(req.body);
    const [created] = await db.insert(regulatoryEntriesTable).values({
      country: body.country,
      region: body.region,
      authority: body.authority,
      title: body.title,
      titleZh: body.title_zh,
      summary: body.summary,
      summaryZh: body.summary_zh,
      documentUrl: body.document_url,
      effectiveDate: body.effective_date,
      category: body.category,
    }).returning();
    res.status(201).json(mapEntry(created));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create regulatory entry" });
  }
});

export default router;
