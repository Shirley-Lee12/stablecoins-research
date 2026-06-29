import { Router } from "express";
import { db, ourResearchTable } from "@workspace/db";
import { eq, desc, ilike, sql } from "drizzle-orm";
import { requireAdmin, requireAuth } from "./auth";

const router = Router();

router.get("/our-research", async (req, res) => {
  try {
    const { tag, search } = req.query as Record<string, string>;

    let query = db.select().from(ourResearchTable).$dynamic();

    if (tag) {
      query = query.where(sql`${tag} = ANY(${ourResearchTable.tags})`);
    }
    if (search) {
      query = query.where(ilike(ourResearchTable.title, `%${search}%`));
    }

    const rows = await query.orderBy(desc(ourResearchTable.uploadedAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch research" });
  }
});

router.get("/our-research/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select()
      .from(ourResearchTable)
      .where(eq(ourResearchTable.id, id))
      .limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch research item" });
  }
});

router.post("/our-research", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, fileUrl, abstract, keyInnovations, tags } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const [inserted] = await db
      .insert(ourResearchTable)
      .values({
        title,
        fileUrl: fileUrl ?? null,
        abstract: abstract ?? null,
        keyInnovations: keyInnovations ?? [],
        tags: tags ?? [],
      })
      .returning();

    res.status(201).json(inserted);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create research item" });
  }
});

router.delete("/our-research/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(ourResearchTable).where(eq(ourResearchTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete research item" });
  }
});

export default router;
