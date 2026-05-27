import { Router } from "express";
import { db, researchPapersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateResearchPaperBody,
  GetResearchPaperParams,
  DeleteResearchPaperParams,
} from "@workspace/api-zod";

const router = Router();

function mapPaper(p: typeof researchPapersTable.$inferSelect) {
  return {
    id: p.id,
    title: p.title,
    title_zh: p.titleZh,
    abstract: p.abstract,
    abstract_zh: p.abstractZh,
    key_innovations: p.keyInnovations,
    key_innovations_zh: p.keyInnovationsZh,
    authors: p.authors,
    published_date: p.publishedDate,
    pdf_url: p.pdfUrl,
    keywords: p.keywords,
    created_at: p.createdAt.toISOString(),
  };
}

router.get("/research-papers", async (req, res) => {
  try {
    const results = await db.select().from(researchPapersTable).orderBy(desc(researchPapersTable.createdAt));
    res.json(results.map(mapPaper));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list research papers" });
  }
});

router.get("/research-papers/:id", async (req, res): Promise<void> => {
  try {
    const { id } = GetResearchPaperParams.parse({ id: parseInt(req.params.id) });
    const [paper] = await db.select().from(researchPapersTable).where(eq(researchPapersTable.id, id));
    if (!paper) { res.status(404).json({ error: "Research paper not found" }); return; }
    res.json(mapPaper(paper));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get research paper" });
  }
});

router.post("/research-papers", async (req, res) => {
  try {
    const body = CreateResearchPaperBody.parse(req.body);
    const [created] = await db.insert(researchPapersTable).values({
      title: body.title,
      titleZh: body.title_zh,
      abstract: body.abstract,
      abstractZh: body.abstract_zh,
      keyInnovations: body.key_innovations ?? [],
      keyInnovationsZh: body.key_innovations_zh ?? [],
      authors: body.authors ?? [],
      publishedDate: body.published_date,
      pdfUrl: body.pdf_url,
      keywords: body.keywords ?? [],
    }).returning();
    res.status(201).json(mapPaper(created));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create research paper" });
  }
});

router.delete("/research-papers/:id", async (req, res) => {
  try {
    const { id } = DeleteResearchPaperParams.parse({ id: parseInt(req.params.id) });
    await db.delete(researchPapersTable).where(eq(researchPapersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete research paper" });
  }
});

export default router;
