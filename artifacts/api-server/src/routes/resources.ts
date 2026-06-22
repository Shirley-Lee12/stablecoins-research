import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";

const router = Router();

/**
 * GET /api/resources
 * Query params:
 *   source_type  — exact enum match (Paper | Report | Gov Document | News)
 *   tags         — comma-separated OR repeated: ?tags=A&tags=B or ?tags=A,B
 *                  returns rows that contain ALL supplied tags
 *   search       — case-insensitive substring match on title + abstract + authors
 */
router.get("/resources", async (req, res) => {
  try {
    const { source_type, search } = req.query as Record<string, string>;

    // Normalise tags: accept both ?tags=A,B and ?tags=A&tags=B
    const rawTags = req.query["tags"];
    const tagList: string[] = [];
    if (rawTags) {
      const arr = Array.isArray(rawTags) ? rawTags : [rawTags];
      arr.forEach((t) => {
        if (typeof t === "string") {
          t.split(",").forEach((s) => { const v = s.trim(); if (v) tagList.push(v); });
        }
      });
    }

    const conditions = [];

    if (source_type) {
      conditions.push(eq(resourcesTable.sourceType, source_type as any));
    }

    // Each tag must be present in the tags array column
    for (const tag of tagList) {
      conditions.push(sql`${tag} = ANY(${resourcesTable.tags})`);
    }

    if (search) {
      const like = `%${search}%`;
      conditions.push(
        or(
          ilike(resourcesTable.title, like),
          ilike(resourcesTable.abstract, like),
          sql`EXISTS (SELECT 1 FROM unnest(${resourcesTable.authors}) a WHERE a ILIKE ${like})`,
          sql`EXISTS (SELECT 1 FROM unnest(${resourcesTable.tags}) t WHERE t ILIKE ${like})`,
        ),
      );
    }

    const rows = await db
      .select()
      .from(resourcesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(resourcesTable.createdAt));

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

/** GET /api/resources/:id */
router.get("/resources/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.id, id))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

/**
 * POST /api/resources
 * Body: { title, authors?, sourceType?, url?, doi?, abstract?, tags? }
 */
router.post("/resources", async (req, res) => {
  try {
    const { title, authors, sourceType, url, doi, abstract, tags } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const [inserted] = await db
      .insert(resourcesTable)
      .values({
        title,
        authors: authors ?? [],
        sourceType: sourceType ?? "Paper",
        url: url ?? null,
        doi: doi ?? null,
        abstract: abstract ?? null,
        tags: tags ?? [],
      })
      .returning();

    res.status(201).json(inserted);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

/** PATCH /api/resources/:id */
router.patch("/resources/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, authors, sourceType, url, doi, abstract, tags } = req.body;
    const [updated] = await db
      .update(resourcesTable)
      .set({
        ...(title !== undefined && { title }),
        ...(authors !== undefined && { authors }),
        ...(sourceType !== undefined && { sourceType }),
        ...(url !== undefined && { url }),
        ...(doi !== undefined && { doi }),
        ...(abstract !== undefined && { abstract }),
        ...(tags !== undefined && { tags }),
      })
      .where(eq(resourcesTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

/** DELETE /api/resources/:id */
router.delete("/resources/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
