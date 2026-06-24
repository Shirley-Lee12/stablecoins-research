import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// ── Gemini client (lazy, only when GOOGLE_API_KEY is present) ─────────────────
function getGemini() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY is not set");
  return new GoogleGenerativeAI(key);
}

/**
 * GET /api/resources
 * Query params:
 *   source_type  — exact enum match (Paper | Report | Gov Document | News | Experts & Scholars)
 *   tags         — comma-separated OR repeated: ?tags=A&tags=B or ?tags=A,B
 *   search       — case-insensitive substring match on title + abstract + authors + tags
 */
router.get("/resources", async (req, res) => {
  try {
    const { source_type, search } = req.query as Record<string, string>;

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
 * POST /api/resources/import
 * Body: { url: string, source_type?: string }
 * Calls Gemini to extract title / authors / abstract / tags from the URL.
 * Returns the parsed metadata WITHOUT saving — the frontend confirms before POST /api/resources.
 */
router.post("/resources/import", async (req, res) => {
  try {
    const { url, source_type } = req.body as { url?: string; source_type?: string };
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      res.status(400).json({ error: "A valid URL is required" });
      return;
    }

    // Fetch page content (plain text, capped to avoid token overflow)
    let pageText = "";
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ZIBSBot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });
      const html = await response.text();
      // Strip tags, collapse whitespace, cap at ~8 000 chars
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
    } catch {
      // If fetch fails, instruct Gemini to rely only on the URL itself
      pageText = "(Page could not be fetched. Infer from the URL and your training knowledge.)";
    }

    const sourceTypeHint = source_type ?? "Paper";

    const prompt = `You are an academic librarian assistant. Given the following web page content (and URL), extract structured bibliographic metadata.

URL: ${url}
Source type hint: ${sourceTypeHint}

Page content (may be truncated):
---
${pageText}
---

Return a JSON object with exactly these fields:
- "title": string — the document's full title
- "authors": string[] — list of author names (empty array if none found)
- "abstract": string — a concise English abstract/summary (2–4 sentences, generate one if not present)
- "tags": string[] — 4 to 8 short topical keywords relevant to stablecoin research (e.g. "Regulation", "DeFi", "USDC", "Monetary Policy")
- "sourceType": one of exactly: "Paper", "Report", "Gov Document", "News", "Experts & Scholars"

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

    const gemini = getGemini();
    const model = gemini.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let parsed: {
      title: string;
      authors: string[];
      abstract: string;
      tags: string[];
      sourceType: string;
    };

    try {
      parsed = JSON.parse(raw);
    } catch {
      req.log.error({ raw }, "Gemini returned non-JSON");
      res.status(502).json({ error: "AI returned invalid JSON", raw });
      return;
    }

    // Validate / sanitise
    const VALID_TYPES = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];
    res.json({
      title:      typeof parsed.title === "string"     ? parsed.title     : "",
      authors:    Array.isArray(parsed.authors)        ? parsed.authors   : [],
      abstract:   typeof parsed.abstract === "string"  ? parsed.abstract  : "",
      tags:       Array.isArray(parsed.tags)           ? parsed.tags      : [],
      sourceType: VALID_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint,
      url,
    });
  } catch (err: any) {
    req.log.error(err);
    if (err.message?.includes("GOOGLE_API_KEY")) {
      res.status(503).json({ error: "AI service not configured — GOOGLE_API_KEY missing" });
    } else {
      res.status(500).json({ error: "Import failed", detail: err.message });
    }
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
        authors:    authors    ?? [],
        sourceType: sourceType ?? "Paper",
        url:        url        ?? null,
        doi:        doi        ?? null,
        abstract:   abstract   ?? null,
        tags:       tags       ?? [],
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
        ...(title      !== undefined && { title }),
        ...(authors    !== undefined && { authors }),
        ...(sourceType !== undefined && { sourceType }),
        ...(url        !== undefined && { url }),
        ...(doi        !== undefined && { doi }),
        ...(abstract   !== undefined && { abstract }),
        ...(tags       !== undefined && { tags }),
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
