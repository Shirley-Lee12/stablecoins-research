import { Router } from "express";
import multer from "multer";
import { db, resourcesTable, uploadJobsTable, resourceTagsTable, tagsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "./auth";
import { syncResourceAuthors } from "./authors";
import { generateJson } from "../lib/llm";
import { resolveLink } from "../lib/scholar";
import { extractPdfText } from "../lib/pdfExtract";
import { loadTagVocabulary, computeTagsForText, type TagVocabulary, type ComputedTags } from "../lib/tagging";
import { verifyResource, type VerifyReport } from "../lib/verify";
import { determineResourceStatus } from "../lib/resourceStatus";

const router = Router();

const VALID_SOURCE_TYPES = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];

// ── PDF upload (memory only — the binary is never persisted to disk or DB, mirrors /import/pdf) ──
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported"));
  },
});

function handleUpload(mw: any) {
  return (req: any, res: any, next: any) => {
    mw(req, res, (err: any) => {
      if (err) { res.status(400).json({ error: err.message || "Upload failed" }); return; }
      next();
    });
  };
}

interface ExtractedDraft {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  doi: string | null;
  sourceType: string;
}

/** Single LLM call to pull the six elements out of raw text — link resolution and tagging happen in separate, dedicated steps afterward. */
async function extractFromText(text: string, sourceTypeHint: string): Promise<ExtractedDraft> {
  const prompt = `You are an academic librarian assistant. Extract structured bibliographic metadata from the following text.

Source type hint: ${sourceTypeHint}

Text:
---
${text.slice(0, 8000)}
---

Return a JSON object with exactly these fields:
- "title": string — the document's full title
- "authors": string[] — list of author full names (empty array if none found)
- "year": number | null — the publication year if shown
- "abstract": string — if the text has its own "Abstract" section, copy it verbatim; otherwise write a concise 2-4 sentence summary
- "doi": string | null — the document's DOI if printed in the text, else null
- "sourceType": one of exactly: "Paper", "Report", "Gov Document", "News", "Experts & Scholars"

Respond with ONLY the JSON object, no markdown fences, no extra text.`;
  const raw = await generateJson(prompt, 2048);
  const parsed = JSON.parse(raw);
  return {
    title: typeof parsed.title === "string" ? parsed.title : "",
    authors: Array.isArray(parsed.authors) ? parsed.authors.filter((a: unknown): a is string => typeof a === "string") : [],
    year: typeof parsed.year === "number" ? parsed.year : null,
    abstract: typeof parsed.abstract === "string" ? parsed.abstract : "",
    doi: typeof parsed.doi === "string" && parsed.doi.trim() ? parsed.doi.trim() : null,
    sourceType: VALID_SOURCE_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint,
  };
}

/** Fetches a URL's page text — mirrors the existing /api/resources/import fetch/strip pattern. */
async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZIBSBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    if (!response.ok || text.length < 200) return null;
    return text;
  } catch {
    return null;
  }
}

export interface PipelineDraft {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  doi: string | null;
  url: string | null;
  sourceType: string;
}

export interface TagSummary {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
  status: "active" | "candidate";
}

export interface PipelineResult {
  draft: PipelineDraft;
  tagIds: ComputedTags;
  /** Human-readable form of tagIds (union of all facets) — the confirm dialog has no other way to show what got tagged, since this is a separate system from the legacy resources.tags text[] array. */
  tags: TagSummary[];
  report: VerifyReport;
  foundInScholarlyDb: boolean;
}

/** Resolves computed tag ids into displayable {slug, nameEn, nameZh, facet} rows for the confirm dialog. */
async function enrichTags(computed: ComputedTags): Promise<TagSummary[]> {
  const allIds = [...new Set([...computed.themeTagIds, ...computed.assetTagIds, ...computed.jurisdictionTagIds, ...computed.candidateTagIds])];
  if (allIds.length === 0) return [];
  const rows = await db.select().from(tagsTable).where(inArray(tagsTable.id, allIds));
  return rows.map((r) => ({ id: r.id, slug: r.slug, nameEn: r.nameEn, nameZh: r.nameZh, facet: r.facet, status: r.status }));
}

/**
 * Shared core: extract -> resolveLink -> tag -> verify. Used by both the synchronous single
 * URL/PDF route and the async batch job processor below. Never writes to resources/resource_tags
 * — only reads, plus (via computeTagsForText) may create new candidate `tags` rows, which is
 * vocabulary maintenance, not exposing this draft resource to anyone.
 */
async function runAutoPipeline(rawText: string, sourceTypeHint: string, vocab: TagVocabulary): Promise<PipelineResult> {
  const extracted = await extractFromText(rawText, sourceTypeHint);
  const linked = await resolveLink({ title: extracted.title, authors: extracted.authors, year: extracted.year });

  const draft: PipelineDraft = {
    title: linked.found ? linked.title : extracted.title,
    authors: linked.authors.length > 0 ? linked.authors : extracted.authors,
    year: linked.year ?? extracted.year,
    abstract: extracted.abstract,
    doi: linked.doi ?? extracted.doi,
    url: linked.canonicalUrl ?? linked.fulltextUrl,
    // extracted.sourceType comes from the LLM reading the actual page/PDF text — trust it over
    // linked.sourceTypeHint, which only means "the academic-DB search didn't confidently match
    // this" (can happen to legitimate working papers due to search recall variance, not just
    // genuine news/opinion pieces) and would otherwise wrongly downgrade real papers to "News".
    sourceType: extracted.sourceType,
  };

  const tagIds = await computeTagsForText([draft.title, draft.abstract].filter(Boolean).join("\n\n"), vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyResource({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract });

  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb };
}

/**
 * POST /api/resources/upload/manual — must be logged in.
 * Body: { title, authors, year, abstract?, url?, doi?, sourceType }
 * User already typed everything (including the link) — skip extraction/resolveLink, go straight to tag + verify.
 */
router.post("/resources/upload/manual", requireAuth, async (req: any, res) => {
  try {
    const { title, authors, year, abstract, url, doi, sourceType } = req.body as {
      title?: string; authors?: string[]; year?: number | null; abstract?: string; url?: string; doi?: string; sourceType?: string;
    };
    if (!title || typeof title !== "string") { res.status(400).json({ error: "title is required" }); return; }

    const vocab = await loadTagVocabulary();
    const tagIds = await computeTagsForText([title, abstract].filter(Boolean).join("\n\n"), vocab);
    const tags = await enrichTags(tagIds);
    const report = await verifyResource({
      title, authors: authors ?? [], year: year ?? null, doi: doi ?? null, url: url ?? null, abstract: abstract ?? null,
    });

    res.json({
      draft: { title, authors: authors ?? [], year: year ?? null, abstract: abstract ?? "", doi: doi ?? null, url: url ?? null, sourceType: sourceType ?? "Paper" },
      tagIds,
      tags,
      report,
      foundInScholarlyDb: false,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process manual entry", detail: err.message });
  }
});

/**
 * POST /api/resources/upload/url — must be logged in.
 * Body: { url, sourceType? }
 * Single URL/DOI — runs the full pipeline synchronously in one request (no upload_jobs row).
 */
router.post("/resources/upload/url", requireAuth, async (req: any, res) => {
  try {
    const { url, sourceType } = req.body as { url?: string; sourceType?: string };
    if (!url || typeof url !== "string" || !url.startsWith("http")) { res.status(400).json({ error: "A valid URL is required" }); return; }

    const pageText = await fetchPageText(url);
    if (!pageText) {
      res.status(422).json({ error: "This page could not be read automatically — it may be blocking automated requests. Try uploading the PDF directly, or use Add Manually." });
      return;
    }

    const vocab = await loadTagVocabulary();
    const result = await runAutoPipeline(pageText, sourceType ?? "Paper", vocab);
    if (!result.draft.url) result.draft.url = url;
    res.json(result);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

// ── Batch / PDF jobs (upload_jobs-backed, resumable across a closed tab) ──────────────────────

/** Processes one job in-process (not a true background worker — see upload_jobs.ts schema comment for the tradeoff). */
async function processJob(jobId: number, rawText: string, sourceTypeHint: string, vocab: TagVocabulary) {
  try {
    await db.update(uploadJobsTable).set({ status: "processing", updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
    const result = await runAutoPipeline(rawText, sourceTypeHint, vocab);
    await db.update(uploadJobsTable).set({ status: "ready_for_review", result, updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
  } catch (err: any) {
    await db.update(uploadJobsTable).set({ status: "failed", error: err.message ?? "Processing failed", updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
  }
}

/**
 * POST /api/resources/upload/jobs/pdf — must be logged in.
 * multipart/form-data, field "files" (1-20 PDFs), optional "sourceType".
 * Creates one upload_jobs row per file and returns immediately; processing continues server-side
 * even if the client disconnects, so progress survives a closed tab.
 */
router.post("/resources/upload/jobs/pdf", requireAuth, handleUpload(pdfUpload.array("files", 20)), async (req: any, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) { res.status(400).json({ error: "At least one PDF file is required" }); return; }
  const sourceTypeHint = (req.body.sourceType as string) ?? "Paper";

  const jobs = await db
    .insert(uploadJobsTable)
    .values(files.map((f) => ({ type: "pdf" as const, status: "queued" as const, input: { fileName: f.originalname, sourceTypeHint }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ jobIds: jobs.map((j) => j.id) });

  const vocab = await loadTagVocabulary();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const jobId = jobs[i].id;
    void (async () => {
      try {
        const { text } = await extractPdfText(file.buffer);
        await processJob(jobId, text, sourceTypeHint, vocab);
      } catch (err: any) {
        await db.update(uploadJobsTable).set({ status: "failed", error: err.message ?? "PDF extraction failed", updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
      }
    })();
  }
});

/**
 * POST /api/resources/upload/jobs/url-batch — must be logged in.
 * Body: { urls: string[], sourceType? } (max 20). Same resumable-job pattern as the PDF route.
 */
router.post("/resources/upload/jobs/url-batch", requireAuth, async (req: any, res) => {
  const { urls, sourceType } = req.body as { urls?: string[]; sourceType?: string };
  if (!Array.isArray(urls) || urls.length === 0) { res.status(400).json({ error: "urls array is required" }); return; }
  if (urls.length > 20) { res.status(400).json({ error: "Maximum 20 URLs per batch" }); return; }
  const sourceTypeHint = sourceType ?? "Paper";

  const jobs = await db
    .insert(uploadJobsTable)
    .values(urls.map((url) => ({ type: "url" as const, status: "queued" as const, input: { url, sourceTypeHint }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ jobIds: jobs.map((j) => j.id) });

  const vocab = await loadTagVocabulary();
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const jobId = jobs[i].id;
    void (async () => {
      const pageText = await fetchPageText(url);
      if (!pageText) {
        await db.update(uploadJobsTable).set({ status: "failed", error: "Page could not be read automatically (may be blocking automated requests)", updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
        return;
      }
      await processJob(jobId, pageText, sourceTypeHint, vocab);
    })();
  }
});

/** GET /api/resources/upload/jobs — must be logged in. Lists the current user's own jobs, newest first. */
router.get("/resources/upload/jobs", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.createdBy, req.user.userId)).orderBy(desc(uploadJobsTable.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch upload jobs" });
  }
});

/** GET /api/resources/upload/jobs/:id — must be logged in, owner only. */
router.get("/resources/upload/jobs/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(uploadJobsTable).where(and(eq(uploadJobsTable.id, id), eq(uploadJobsTable.createdBy, req.user.userId))).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    res.json(job);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch upload job" });
  }
});

interface ConfirmInput {
  title: string;
  authors: string[];
  year: number | null;
  abstract?: string;
  url?: string;
  doi?: string;
  sourceType: string;
  tagIds?: number[];
}

/** Shared persist step for both confirm routes below — this is the explicit user confirmation the two-step AI-import rule requires. */
async function persistConfirmedDraft(input: ConfirmInput, userId: number, isAdmin: boolean) {
  const report = await verifyResource({ title: input.title, authors: input.authors ?? [], year: input.year ?? null, doi: input.doi ?? null, url: input.url ?? null, abstract: input.abstract ?? null });
  const status = determineResourceStatus(report, { title: input.title, authors: input.authors ?? [], year: input.year ?? null }, isAdmin);

  const [inserted] = await db
    .insert(resourcesTable)
    .values({
      title: input.title,
      authors: input.authors ?? [],
      sourceType: (VALID_SOURCE_TYPES.includes(input.sourceType) ? input.sourceType : "Paper") as any,
      url: input.url ?? null,
      doi: input.doi ?? null,
      abstract: input.abstract ?? null,
      status: status as any,
      createdBy: userId,
    })
    .returning();

  await syncResourceAuthors(inserted.id, inserted.authors);

  if (input.tagIds && input.tagIds.length > 0) {
    await db.insert(resourceTagsTable).values(input.tagIds.map((tagId) => ({ resourceId: inserted.id, tagId, source: "auto" as const }))).onConflictDoNothing();
  }

  return inserted;
}

/**
 * POST /api/resources/upload/confirm — must be logged in.
 * Body: the (possibly user-edited) final draft + tag ids, from the synchronous manual/single-URL
 * preview (POST /upload/manual or /upload/url). No upload_jobs row involved — this is the
 * confirm step for the in-memory pipeline.
 */
router.post("/resources/upload/confirm", requireAuth, async (req: any, res) => {
  try {
    const input = req.body as ConfirmInput;
    if (!input.title) { res.status(400).json({ error: "title is required" }); return; }
    const inserted = await persistConfirmedDraft(input, req.user.userId, req.user.role === "admin");
    res.status(201).json(inserted);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to confirm upload", detail: err.message });
  }
});

/**
 * POST /api/resources/upload/jobs/:id/confirm — must be logged in, owner only.
 * Body: the (possibly user-edited) final draft + tag ids. Persists the real resources row here —
 * this is the explicit user confirmation the two-step AI-import rule requires.
 */
router.post("/resources/upload/jobs/:id/confirm", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(uploadJobsTable).where(and(eq(uploadJobsTable.id, id), eq(uploadJobsTable.createdBy, req.user.userId))).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.status !== "ready_for_review") { res.status(400).json({ error: `Job is not ready for review (status: ${job.status})` }); return; }

    const input = req.body as ConfirmInput;
    if (!input.title) { res.status(400).json({ error: "title is required" }); return; }

    const inserted = await persistConfirmedDraft(input, req.user.userId, req.user.role === "admin");
    await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, id));
    res.status(201).json(inserted);
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to confirm upload", detail: err.message });
  }
});

/** DELETE /api/resources/upload/jobs/:id — must be logged in, owner only. Discards a job without persisting. */
router.delete("/resources/upload/jobs/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select({ id: uploadJobsTable.id }).from(uploadJobsTable).where(and(eq(uploadJobsTable.id, id), eq(uploadJobsTable.createdBy, req.user.userId))).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to discard upload job" });
  }
});

export default router;
