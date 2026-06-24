import { Router } from "express";
import { db, resourcesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth, optionalAuth, requireAdmin } from "./auth";

const router = Router();

// ── Gemini client ─────────────────────────────────────────────────────────────
function getGemini() {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) throw new Error("GOOGLE_API_KEY is not set");
  return new GoogleGenerativeAI(key);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseTagList(raw: unknown): string[] {
  const list: string[] = [];
  if (!raw) return list;
  const arr = Array.isArray(raw) ? raw : [raw];
  arr.forEach((t) => {
    if (typeof t === "string") t.split(",").forEach((s) => { const v = s.trim(); if (v) list.push(v); });
  });
  return list;
}

/**
 * GET /api/resources
 * Visibility rules:
 *   - unauthenticated → status = 'approved' only
 *   - user            → status = 'approved' OR created_by = req.user.userId
 *   - admin           → all rows (optional ?status filter)
 */
router.get("/resources", optionalAuth, async (req: any, res) => {
  try {
    const { source_type, search } = req.query as Record<string, string>;
    const tagList = parseTagList(req.query["tags"]);

    const conditions: ReturnType<typeof eq>[] = [];

    // ── Visibility ──
    if (!req.user) {
      conditions.push(eq(resourcesTable.status, "approved"));
    } else if (req.user.role !== "admin") {
      conditions.push(
        or(
          eq(resourcesTable.status, "approved"),
          eq(resourcesTable.createdBy, req.user.userId),
        ) as any,
      );
    } else {
      // Admin: optional status filter
      const statusFilter = req.query["status"] as string | undefined;
      if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
        conditions.push(eq(resourcesTable.status, statusFilter as any));
      }
    }

    // ── Domain filters ──
    if (source_type) conditions.push(eq(resourcesTable.sourceType, source_type as any));
    for (const tag of tagList) conditions.push(sql`${tag} = ANY(${resourcesTable.tags})` as any);
    if (search) {
      const like = `%${search}%`;
      conditions.push(
        or(
          ilike(resourcesTable.title, like),
          ilike(resourcesTable.abstract, like),
          sql`EXISTS (SELECT 1 FROM unnest(${resourcesTable.authors}) a WHERE a ILIKE ${like})`,
          sql`EXISTS (SELECT 1 FROM unnest(${resourcesTable.tags}) t WHERE t ILIKE ${like})`,
        ) as any,
      );
    }

    const rows = await db
      .select()
      .from(resourcesTable)
      .where(conditions.length > 0 ? and(...(conditions as any[])) : undefined)
      .orderBy(desc(resourcesTable.createdAt));

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

/** GET /api/resources/:id */
router.get("/resources/:id", optionalAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid resource id" }); return; }
    const [row] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    // Non-admin can only see approved or their own
    if (!req.user) {
      if (row.status !== "approved") { res.status(404).json({ error: "Not found" }); return; }
    } else if (req.user.role !== "admin") {
      if (row.status !== "approved" && row.createdBy !== req.user.userId) {
        res.status(404).json({ error: "Not found" }); return;
      }
    }

    res.json(row);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch resource" });
  }
});

/**
 * POST /api/resources/import  — must be logged in
 * Calls Gemini to parse URL; returns metadata WITHOUT saving.
 */
router.post("/resources/import", requireAuth, async (req: any, res) => {
  try {
    const { url, source_type } = req.body as { url?: string; source_type?: string };
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      res.status(400).json({ error: "A valid URL is required" });
      return;
    }

    // Fetch page content
    let pageText = "";
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ZIBSBot/1.0)" },
        signal: AbortSignal.timeout(10_000),
      });
      const html = await response.text();
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000);
    } catch {
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
- "abstract": string — a concise English abstract/summary (2–4 sentences)
- "tags": string[] — 4 to 8 short topical keywords relevant to stablecoin research (e.g. "Regulation", "DeFi", "USDC")
- "sourceType": one of exactly: "Paper", "Report", "Gov Document", "News", "Experts & Scholars"

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

    const gemini = getGemini();
    const model = gemini.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let parsed: { title: string; authors: string[]; abstract: string; tags: string[]; sourceType: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      req.log.error({ raw }, "Gemini returned non-JSON");
      res.status(502).json({ error: "AI returned invalid JSON", raw });
      return;
    }

    const VALID_TYPES = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];
    res.json({
      title:      typeof parsed.title === "string"    ? parsed.title    : "",
      authors:    Array.isArray(parsed.authors)       ? parsed.authors  : [],
      abstract:   typeof parsed.abstract === "string" ? parsed.abstract : "",
      tags:       Array.isArray(parsed.tags)          ? parsed.tags     : [],
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
 * POST /api/resources/import/batch  — must be logged in
 * Body: { urls: string[], source_type?: string }
 * Processes each URL sequentially (avoid Gemini rate limits) and streams SSE progress.
 */
router.post("/resources/import/batch", requireAuth, async (req: any, res) => {
  const { urls, source_type } = req.body as { urls?: string[]; source_type?: string };
  if (!Array.isArray(urls) || urls.length === 0) {
    res.status(400).json({ error: "urls array is required" });
    return;
  }
  if (urls.length > 20) {
    res.status(400).json({ error: "Maximum 20 URLs per batch" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const VALID_TYPES = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];
  const gemini = getGemini();
  const model = gemini.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
  });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    send({ index: i, url, status: "parsing" });

    try {
      let pageText = "";
      try {
        const response = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; ZIBSBot/1.0)" },
          signal: AbortSignal.timeout(10_000),
        });
        const html = await response.text();
        pageText = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 6000);
      } catch {
        pageText = "(Page could not be fetched.)";
      }

      const sourceTypeHint = source_type ?? "Paper";
      const prompt = `Extract bibliographic metadata from this page. URL: ${url}\nSource type hint: ${sourceTypeHint}\nPage content: ${pageText}\n\nReturn JSON with: title (string), authors (string[]), abstract (string, 2-3 sentences), tags (string[], 4-6 stablecoin research keywords), sourceType (one of: Paper|Report|Gov Document|News|Experts & Scholars)`;

      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const parsed = JSON.parse(raw);

      send({
        index: i,
        url,
        status: "done",
        data: {
          title:      typeof parsed.title === "string"    ? parsed.title    : url,
          authors:    Array.isArray(parsed.authors)       ? parsed.authors  : [],
          abstract:   typeof parsed.abstract === "string" ? parsed.abstract : "",
          tags:       Array.isArray(parsed.tags)          ? parsed.tags     : [],
          sourceType: VALID_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint,
          url,
        },
      });
    } catch (err: any) {
      send({ index: i, url, status: "error", error: err.message ?? "Failed" });
    }

    // Small delay to be kind to Gemini rate limits
    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 500));
  }

  send({ done: true });
  res.end();
});

/**
 * POST /api/resources  — must be logged in
 * Admin → status='approved'; others → status='pending'
 */
router.post("/resources", requireAuth, async (req: any, res) => {
  try {
    const { title, authors, sourceType, url, doi, abstract, tags } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const isAdmin = req.user.role === "admin";

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
        status:     isAdmin ? "approved" : "pending",
        createdBy:  req.user.userId,
      })
      .returning();

    res.status(201).json(inserted);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create resource" });
  }
});

/**
 * PATCH /api/resources/:id/approve  — admin only
 * Body: { status: 'approved' | 'rejected' }
 */
router.patch("/resources/:id/approve", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body as { status?: string };
    if (!status || !["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
      return;
    }

    const [updated] = await db
      .update(resourcesTable)
      .set({ status: status as "approved" | "rejected" })
      .where(eq(resourcesTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
});

/**
 * PATCH /api/resources/:id
 * Admin or owner only. Non-admin edits → status reset to 'pending'.
 */
router.patch("/resources/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const isAdmin = req.user.role === "admin";
    const isOwner = existing.createdBy === req.user.userId;
    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: "You do not have permission to edit this resource" });
      return;
    }

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
        // Non-admin edits require re-approval
        ...(!isAdmin && { status: "pending" as const }),
      })
      .where(eq(resourcesTable.id, id))
      .returning();

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update resource" });
  }
});

/** DELETE /api/resources/:id — admin or owner */
router.delete("/resources/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [existing] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }

    const isAdmin = req.user.role === "admin";
    const isOwner = existing.createdBy === req.user.userId;
    if (!isAdmin && !isOwner) {
      res.status(403).json({ error: "You do not have permission to delete this resource" });
      return;
    }

    await db.delete(resourcesTable).where(eq(resourcesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete resource" });
  }
});

export default router;
