import { Router } from "express";
import { db, resourcesTable, authorProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

function buildAuthorProfile(
  name: string,
  resources: ReturnType<typeof mapResource>[],
  profileRow?: typeof authorProfilesTable.$inferSelect | null
) {
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

  return {
    name,
    institution: profileRow?.institution ?? undefined,
    bio: profileRow?.bio ?? undefined,
    resource_count: resources.length,
    resource_types,
    top_tags,
  };
}

router.get("/authors", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const [allResources, allProfiles] = await Promise.all([
      db.select().from(resourcesTable),
      db.select().from(authorProfilesTable),
    ]);

    const profileMap = new Map(allProfiles.map((p) => [p.name.toLowerCase(), p]));

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
      buildAuthorProfile(name, resources, profileMap.get(name.toLowerCase()))
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

    const [allResources, profileRows] = await Promise.all([
      db.select().from(resourcesTable),
      db.select().from(authorProfilesTable).where(eq(authorProfilesTable.name, name)),
    ]);

    const authorResources = allResources
      .filter((r) => (r.authors ?? []).some((a) => a.trim().toLowerCase() === name.toLowerCase()))
      .map(mapResource);

    if (authorResources.length === 0) {
      res.status(404).json({ error: "Author not found" });
      return;
    }

    const profile = buildAuthorProfile(name, authorResources, profileRows[0] ?? null);
    res.json({ ...profile, resources: authorResources });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get author" });
  }
});

router.patch("/authors/:name", async (req, res): Promise<void> => {
  try {
    const name = decodeURIComponent(req.params.name);
    const { institution, bio } = req.body as { institution?: string; bio?: string };

    const allResources = await db.select().from(resourcesTable);
    const authorResources = allResources
      .filter((r) => (r.authors ?? []).some((a) => a.trim().toLowerCase() === name.toLowerCase()))
      .map(mapResource);

    if (authorResources.length === 0) {
      res.status(404).json({ error: "Author not found" });
      return;
    }

    await db
      .insert(authorProfilesTable)
      .values({ name, institution: institution ?? null, bio: bio ?? null })
      .onConflictDoUpdate({
        target: authorProfilesTable.name,
        set: {
          institution: institution ?? null,
          bio: bio ?? null,
          updatedAt: new Date(),
        },
      });

    const profileRows = await db.select().from(authorProfilesTable).where(eq(authorProfilesTable.name, name));
    const profile = buildAuthorProfile(name, authorResources, profileRows[0] ?? null);
    res.json({ ...profile, resources: authorResources });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update author profile" });
  }
});

export default router;
