import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

const router = Router();

router.get("/resources", async (req, res) => {
  try {
    const { source_type, tag, search } = req.query as Record<string, string>;

    let query = db.select().from(resourcesTable).$dynamic();

    if (source_type) {
      query = query.where(eq(resourcesTable.sourceType, source_type as any));
    }
    if (tag) {
      query = query.where(sql`${tag} = ANY(${resourcesTable.tags})`);
    }
    if (search) {
      query = query.where(
        or(
          ilike(resourcesTable.title, `%${search}%`),
          ilike(resourcesTable.abstract, `%${search}%`),
        ),
      );
    }

    const rows = await query.orderBy(desc(resourcesTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

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
