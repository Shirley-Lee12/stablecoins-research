import { Router } from "express";
import { db, authorsTable, institutionsTable, resourceAuthorsTable, resourcesTable } from "@workspace/db";
import { and, eq, ilike, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "./auth";
import { attachFacetedTags } from "../lib/tagging";

const router = Router();

/**
 * GET /api/authors
 * Returns every author with their institution name and a count of
 * approved resources linked to them.
 */
router.get("/authors", async (req, res) => {
  try {
    const { search } = req.query as Record<string, string>;

    const rows = await db
      .select({
        id: authorsTable.id,
        name: authorsTable.name,
        researchInterests: authorsTable.researchInterests,
        bio: authorsTable.bio,
        institutionId: authorsTable.institutionId,
        institutionName: institutionsTable.name,
        resourceCount: sql<number>`count(distinct ${resourceAuthorsTable.resourceId})`.as("resource_count"),
        publicationYears: sql<number[]>`array_remove(array_agg(distinct nullif(substring(${resourcesTable.publishedDate} from '^[0-9]{4}'), '')::integer), null)`.as("publication_years"),
        chineseResourceCount: sql<number>`count(distinct case when ${resourcesTable.title} ~ '[一-龥]' then ${resourcesTable.id} end)`.as("chinese_resource_count"),
        englishResourceCount: sql<number>`count(distinct case when ${resourcesTable.title} !~ '[一-龥]' then ${resourcesTable.id} end)`.as("english_resource_count"),
      })
      .from(authorsTable)
      .leftJoin(institutionsTable, eq(authorsTable.institutionId, institutionsTable.id))
      .innerJoin(resourceAuthorsTable, eq(resourceAuthorsTable.authorId, authorsTable.id))
      .innerJoin(resourcesTable, eq(resourceAuthorsTable.resourceId, resourcesTable.id))
      .where(and(
        eq(resourcesTable.status, "approved"),
        search ? ilike(authorsTable.name, `%${search}%`) : undefined,
      ))
      .groupBy(authorsTable.id, institutionsTable.name)
      .orderBy(authorsTable.name);

    res.json(rows.map((row) => ({
      ...row,
      resourceCount: Number(row.resourceCount),
      publicationYears: (row.publicationYears ?? []).map(Number).filter(Number.isFinite),
      chineseResourceCount: Number(row.chineseResourceCount),
      englishResourceCount: Number(row.englishResourceCount),
    })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
});

/** GET /api/authors/:name — profile + linked approved resources */
router.get("/authors/:name", async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);

    const [author] = await db
      .select({
        id: authorsTable.id,
        name: authorsTable.name,
        researchInterests: authorsTable.researchInterests,
        bio: authorsTable.bio,
        institutionId: authorsTable.institutionId,
        institutionName: institutionsTable.name,
        institutionCountry: institutionsTable.country,
      })
      .from(authorsTable)
      .leftJoin(institutionsTable, eq(authorsTable.institutionId, institutionsTable.id))
      .where(eq(authorsTable.name, name))
      .limit(1);

    if (!author) { res.status(404).json({ error: "Author not found" }); return; }

    const resources = await db
      .select({
        id: resourcesTable.id,
        title: resourcesTable.title,
        authors: resourcesTable.authors,
        sourceType: resourcesTable.sourceType,
        url: resourcesTable.url,
        doi: resourcesTable.doi,
        abstract: resourcesTable.abstract,
        publishedDate: resourcesTable.publishedDate,
        createdAt: resourcesTable.createdAt,
      })
      .from(resourceAuthorsTable)
      .innerJoin(resourcesTable, eq(resourceAuthorsTable.resourceId, resourcesTable.id))
      .where(sql`${resourceAuthorsTable.authorId} = ${author.id} AND ${resourcesTable.status} = 'approved'`)
      .orderBy(sql`${resourcesTable.publishedDate} DESC NULLS LAST`, sql`${resourcesTable.createdAt} DESC`);

    res.json({ ...author, resources: await attachFacetedTags(resources) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch author" });
  }
});

/** PATCH /api/authors/:name — admin only: update institution / interests / bio */
router.patch("/authors/:name", requireAuth, requireAdmin, async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const { institutionName, researchInterests, bio } = req.body as {
      institutionName?: string;
      researchInterests?: string[];
      bio?: string;
    };

    const [author] = await db.select().from(authorsTable).where(eq(authorsTable.name, name)).limit(1);
    if (!author) { res.status(404).json({ error: "Author not found" }); return; }

    let institutionId = author.institutionId;
    if (institutionName !== undefined) {
      if (institutionName === "") {
        institutionId = null;
      } else {
        const [existing] = await db.select().from(institutionsTable).where(eq(institutionsTable.name, institutionName)).limit(1);
        institutionId = existing ? existing.id : (await db.insert(institutionsTable).values({ name: institutionName }).returning())[0].id;
      }
    }

    const [updated] = await db
      .update(authorsTable)
      .set({
        institutionId,
        ...(researchInterests !== undefined && { researchInterests }),
        ...(bio !== undefined && { bio }),
      })
      .where(eq(authorsTable.id, author.id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update author" });
  }
});

export default router;
