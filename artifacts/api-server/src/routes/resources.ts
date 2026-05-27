import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql } from "drizzle-orm";
import {
  ListResourcesQueryParams,
  ListRecentResourcesQueryParams,
  CreateResourceBody,
  UpdateResourceBody,
  UpdateResourceParams,
  DeleteResourceParams,
  GetResourceParams,
  ExtractResourceBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/resources", async (req, res) => {
  try {
    const params = ListResourcesQueryParams.parse(req.query);
    let query = db.select().from(resourcesTable).$dynamic();

    const conditions = [];
    if (params.resource_type) {
      conditions.push(eq(resourcesTable.resourceType, params.resource_type));
    }
    if (params.tag) {
      conditions.push(sql`${params.tag} = ANY(${resourcesTable.tags})`);
    }
    if (params.search) {
      conditions.push(
        or(
          ilike(resourcesTable.title, `%${params.search}%`),
          ilike(resourcesTable.abstract ?? resourcesTable.title, `%${params.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      const { and } = await import("drizzle-orm");
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(resourcesTable.createdAt));

    if (params.limit) query = query.limit(params.limit);
    if (params.offset) query = query.offset(params.offset);

    const results = await query;
    const mapped = results.map((r) => ({
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
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list resources" });
  }
});

router.get("/resources/recent", async (req, res) => {
  try {
    const params = ListRecentResourcesQueryParams.parse(req.query);
    const limit = params.limit ?? 10;
    const results = await db.select().from(resourcesTable).orderBy(desc(resourcesTable.createdAt)).limit(limit);
    const mapped = results.map((r) => ({
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
    }));
    res.json(mapped);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list recent resources" });
  }
});

router.post("/resources/extract", async (req, res) => {
  try {
    const body = ExtractResourceBody.parse(req.body);

    let title: string | null = null;
    let abstract: string | null = null;
    let keywords: string[] = [];
    let authors: string[] = [];
    let doi: string | null = body.doi ?? null;
    let publishedDate: string | null = null;
    let journal: string | null = null;

    if (body.source_type === "doi" && body.doi) {
      try {
        const doiRes = await fetch(`https://api.crossref.org/works/${encodeURIComponent(body.doi)}`);
        if (doiRes.ok) {
          const data = await doiRes.json() as Record<string, unknown>;
          const work = (data as { message: Record<string, unknown> }).message;
          const titleArr = work["title"] as string[] | undefined;
          title = titleArr?.[0] ?? null;
          const subjectArr = work["subject"] as string[] | undefined;
          keywords = subjectArr ?? [];
          const authorArr = work["author"] as Array<{ given?: string; family?: string }> | undefined;
          authors = authorArr?.map((a) => `${a.given ?? ""} ${a.family ?? ""}`.trim()) ?? [];
          const containerTitle = work["container-title"] as string[] | undefined;
          journal = containerTitle?.[0] ?? null;
          const issued = work["issued"] as { "date-parts"?: number[][] } | undefined;
          const dateParts = issued?.["date-parts"]?.[0];
          if (dateParts && dateParts.length > 0) {
            publishedDate = dateParts.join("-");
          }
        }
      } catch {
        // silent fallback
      }
    } else if (body.source_type === "text" && body.text) {
      const text = body.text;
      const lines = text.split("\n").filter((l: string) => l.trim().length > 0);
      title = lines[0]?.trim() ?? null;
      const abstractMatch = text.match(/abstract[:\s]+([^\n]{50,})/i);
      abstract = abstractMatch?.[1]?.trim() ?? null;
      const keywordMatch = text.match(/keywords?[:\s]+([^\n]+)/i);
      if (keywordMatch) {
        keywords = keywordMatch[1].split(/[,;]/).map((k: string) => k.trim()).filter(Boolean);
      }
    } else if (body.source_type === "url" && body.url) {
      title = body.url.split("/").pop()?.replace(/-/g, " ") ?? "Resource from URL";
    }

    res.json({
      title,
      abstract,
      keywords,
      authors,
      published_date: publishedDate,
      journal,
      doi,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to extract resource" });
  }
});

router.get("/resources/:id", async (req, res): Promise<void> => {
  try {
    const { id } = GetResourceParams.parse({ id: parseInt(req.params.id) });
    const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id));
    if (!resource) { res.status(404).json({ error: "Resource not found" }); return; }
    res.json({
      id: resource.id,
      title: resource.title,
      title_zh: resource.titleZh,
      abstract: resource.abstract,
      abstract_zh: resource.abstractZh,
      keywords: resource.keywords,
      authors: resource.authors,
      url: resource.url,
      doi: resource.doi,
      resource_type: resource.resourceType,
      tags: resource.tags,
      published_date: resource.publishedDate,
      journal: resource.journal,
      created_at: resource.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get resource" });
  }
});

router.post("/resources", async (req, res) => {
  try {
    const body = CreateResourceBody.parse(req.body);
    const [created] = await db.insert(resourcesTable).values({
      title: body.title,
      titleZh: body.title_zh,
      abstract: body.abstract,
      abstractZh: body.abstract_zh,
      keywords: body.keywords ?? [],
      authors: body.authors ?? [],
      url: body.url,
      doi: body.doi,
      resourceType: body.resource_type ?? "paper",
      tags: body.tags ?? [],
      publishedDate: body.published_date,
      journal: body.journal,
    }).returning();
    res.status(201).json({
      id: created.id,
      title: created.title,
      title_zh: created.titleZh,
      abstract: created.abstract,
      abstract_zh: created.abstractZh,
      keywords: created.keywords,
      authors: created.authors,
      url: created.url,
      doi: created.doi,
      resource_type: created.resourceType,
      tags: created.tags,
      published_date: created.publishedDate,
      journal: created.journal,
      created_at: created.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

router.patch("/resources/:id", async (req, res): Promise<void> => {
  try {
    const { id } = UpdateResourceParams.parse({ id: parseInt(req.params.id) });
    const body = UpdateResourceBody.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.title_zh !== undefined) updateData.titleZh = body.title_zh;
    if (body.abstract !== undefined) updateData.abstract = body.abstract;
    if (body.abstract_zh !== undefined) updateData.abstractZh = body.abstract_zh;
    if (body.keywords !== undefined) updateData.keywords = body.keywords;
    if (body.authors !== undefined) updateData.authors = body.authors;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.doi !== undefined) updateData.doi = body.doi;
    if (body.resource_type !== undefined) updateData.resourceType = body.resource_type;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.published_date !== undefined) updateData.publishedDate = body.published_date;
    if (body.journal !== undefined) updateData.journal = body.journal;

    const [updated] = await db.update(resourcesTable).set(updateData).where(eq(resourcesTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Resource not found" }); return; }
    res.json({
      id: updated.id,
      title: updated.title,
      title_zh: updated.titleZh,
      abstract: updated.abstract,
      abstract_zh: updated.abstractZh,
      keywords: updated.keywords,
      authors: updated.authors,
      url: updated.url,
      doi: updated.doi,
      resource_type: updated.resourceType,
      tags: updated.tags,
      published_date: updated.publishedDate,
      journal: updated.journal,
      created_at: updated.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

router.delete("/resources/:id", async (req, res) => {
  try {
    const { id } = DeleteResourceParams.parse({ id: parseInt(req.params.id) });
    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
