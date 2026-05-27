import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { ilike, sql } from "drizzle-orm";

const router = Router();

function mapResource(r: typeof resourcesTable.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    title_zh: r.titleZh,
    abstract: r.abstract,
    abstract_zh: r.abstractZh,
    keywords: r.keywords,
    authors: r.authors,
    url: r.url,
    doi: r.doi,
    resource_type: r.resourceType,
    tags: r.tags,
    published_date: r.publishedDate,
    journal: r.journal,
    created_at: r.createdAt.toISOString(),
  };
}

function buildAuthorProfile(name: string, resources: ReturnType<typeof mapResource>[]) {
  const typeCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  for (const r of resources) {
    typeCounts[r.resource_type] = (typeCounts[r.resource_type] ?? 0) + 1;
    for (const tag of r.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }

  const resource_types = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => ({ type, count }));

  const top_tags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([tag]) => tag);

  return { name, resource_count: resources.length, resource_types, top_tags };
}

router.get("/authors", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const allResources = await db.select().from(resourcesTable);

    const authorMap: Record<string, ReturnType<typeof mapResource>[]> = {};
    for (const r of allResources) {
      for (const author of r.authors ?? []) {
        const key = author.trim();
        if (!key) continue;
        if (!authorMap[key]) authorMap[key] = [];
        authorMap[key].push(mapResource(r));
      }
    }

    let authors = Object.entries(authorMap).map(([name, resources]) =>
      buildAuthorProfile(name, resources)
    );

    if (search) {
      const lower = search.toLowerCase();
      authors = authors.filter((a) => a.name.toLowerCase().includes(lower));
    }

    authors.sort((a, b) => b.resource_count - a.resource_count);
    res.json(authors);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list authors" });
  }
});

router.get("/authors/:name", async (req, res): Promise<void> => {
  try {
    const name = decodeURIComponent(req.params.name);

    const allResources = await db.select().from(resourcesTable);
    const authorResources = allResources
      .filter((r) => (r.authors ?? []).some((a) => a.trim().toLowerCase() === name.toLowerCase()))
      .map(mapResource);

    if (authorResources.length === 0) {
      res.status(404).json({ error: "Author not found" });
      return;
    }

    const profile = buildAuthorProfile(name, authorResources);
    res.json({ ...profile, resources: authorResources });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get author" });
  }
});

export default router;
