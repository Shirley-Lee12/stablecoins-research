import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { db, resourcesTable, uploadJobsTable, resourceTagsTable, tagsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { requireAuth } from "./auth";
import { syncResourceAuthors } from "./authors";
import { generateJson } from "../lib/llm";
import { resolveLink } from "../lib/scholar";
import { extractPdfText } from "../lib/pdfExtract";
import { loadTagVocabulary, computeTagsForText, type TagVocabulary, type ComputedTags } from "../lib/tagging";
import { verifyResource, verifyCitationRecord, type VerifyReport } from "../lib/verify";
import { determineResourceStatus, missingHardRequiredFields } from "../lib/resourceStatus";
import { parseCitationFile, UnsupportedCitationFormatError, type CitationRecord } from "../lib/citation";

const router = Router();

const VALID_SOURCE_TYPES = ["journal_article", "working_paper", "conference_paper", "thesis", "report", "gov_document", "news"];

// ── PDF upload (memory only — the binary is never persisted to disk or DB, mirrors /import/pdf) ──
const PDF_MAX_SIZE_MB = 50;
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: PDF_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported"));
  },
});

function handleUpload(mw: any) {
  return (req: any, res: any, next: any) => {
    mw(req, res, (err: any) => {
      if (err) {
        // multer's own message for this case doesn't mention the actual limit — give the user a
        // specific, actionable number instead of a generic "File too large".
        const message = err.code === "LIMIT_FILE_SIZE" ? `File too large — the limit is ${PDF_MAX_SIZE_MB}MB per PDF.` : (err.message || "Upload failed");
        res.status(400).json({ error: message });
        return;
      }
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
- "authors": string[] — list of author full names. If no individual person is named as author (common
  for laws, regulations, and government/institutional publications), use the issuing body's name
  instead (e.g. "European Parliament", "United States Congress", "HKMA") — do not return an empty
  array just because no individual person is credited.
- "year": number | null — the publication year if shown
- "abstract": string — if the text has its own "Abstract" section, copy it verbatim; otherwise write a concise 2-4 sentence summary
- "doi": string | null — the document's DOI if printed in the text, else null
- "sourceType": one of exactly: "journal_article", "working_paper", "conference_paper", "thesis", "report", "gov_document", "news"

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

/**
 * Fetches a URL's page text — mirrors the existing /api/resources/import fetch/strip pattern.
 * Detects a direct PDF link via Content-Type (falling back to a ".pdf" URL check for servers that
 * mislabel it) and routes those through the same local text extraction PDF uploads use, instead of
 * running PDF bytes through the HTML tag-stripper, which would only produce binary garbage.
 */
export async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZIBSBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const { text } = await extractPdfText(buffer);
      return text.length >= 200 ? text.slice(0, 8000) : null;
    }

    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    return text.length >= 200 ? text : null;
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
  /**
   * Informational only (never blocks this preview response) — which of title/authors/year/url_doi
   * are absent, always computed as if URL/DOI were required. Lets the confirm dialog and admin
   * queue flag "missing a link" specifically (docs/planning/12 §1) instead of a generic warning;
   * whether that's actually enforced at confirm time depends on the entry kind (see persistConfirmedDraft).
   */
  missingRequired: string[];
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
  const linked = await resolveLink({ title: extracted.title, authors: extracted.authors, year: extracted.year, doi: extracted.doi });

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
  const missingRequired = missingHardRequiredFields(
    { title: draft.title, authors: draft.authors, year: draft.year, url: draft.url, doi: draft.doi },
    { requireUrlOrDoi: true },
  );

  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb, missingRequired };
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
    const missingRequired = missingHardRequiredFields(
      { title, authors: authors ?? [], year: year ?? null, url: url ?? null, doi: doi ?? null },
      { requireUrlOrDoi: true },
    );

    res.json({
      draft: { title, authors: authors ?? [], year: year ?? null, abstract: abstract ?? "", doi: doi ?? null, url: url ?? null, sourceType: sourceType ?? "journal_article" },
      tagIds,
      tags,
      report,
      foundInScholarlyDb: false,
      missingRequired,
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
    const result = await runAutoPipeline(pageText, sourceType ?? "journal_article", vocab);
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
  const sourceTypeHint = (req.body.sourceType as string) ?? "journal_article";
  const batchId = randomUUID();

  const jobs = await db
    .insert(uploadJobsTable)
    .values(files.map((f) => ({ batchId, type: "pdf" as const, status: "queued" as const, input: { fileName: f.originalname, sourceTypeHint }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ batchId, jobIds: jobs.map((j) => j.id) });

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
  const sourceTypeHint = sourceType ?? "journal_article";
  const batchId = randomUUID();

  const jobs = await db
    .insert(uploadJobsTable)
    .values(urls.map((url) => ({ batchId, type: "url" as const, status: "queued" as const, input: { url, sourceTypeHint }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ batchId, jobIds: jobs.map((j) => j.id) });

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

// ── Citation import (4th entry point: RefWorks/EndNote/NoteExpress exports — docs/planning/06/14) ──

const citationUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

interface CitationJobResult {
  draft: PipelineDraft;
  tagIds: ComputedTags;
  tags: TagSummary[];
  report: VerifyReport;
  missingRequired: string[];
  /** Shown in the confirm dialog (docs/planning/06 §4) — "cnki" means the record came with its own abstract; "generated_from_fulltext" means tier-2 fetched the real article and an LLM summarized it; null means neither worked and it's genuinely missing. */
  abstractSource: "cnki" | "generated_from_fulltext" | null;
}

/**
 * Two-tier abstract backfill for citation records with no abstract of their own (mainly newspaper
 * entries — docs/planning/06 §4). Tier 1 (using keywords instead of a missing abstract) happens
 * naturally below since the tagging input already falls back to title+keywords. This is tier 2:
 * only fires when there's no abstract AND a link to try; only ever summarizes text it actually
 * fetched — never fabricates a summary from the title alone. Leaves it blank on any failure,
 * routing to needs_review via the empty-abstract warning in verifyCitationRecord() rather than
 * silently making something up.
 */
async function backfillAbstractFromFulltext(record: CitationRecord): Promise<{ abstract: string; abstractSource: "cnki" | "generated_from_fulltext" | null }> {
  if (record.abstract) return { abstract: record.abstract, abstractSource: "cnki" };
  if (!record.url) return { abstract: "", abstractSource: null };

  const fullText = await fetchPageText(record.url);
  if (!fullText) return { abstract: "", abstractSource: null };

  try {
    const prompt = `The following is the full text of a news article (in Chinese). Write a concise 2-4 sentence summary of it, in Chinese, based only on what's actually in the text below — do not add anything not present in it.

Text:
---
${fullText.slice(0, 6000)}
---

Respond with ONLY a JSON object: { "abstract": string }`;
    const raw = await generateJson(prompt, 512);
    const parsed = JSON.parse(raw);
    const abstract = typeof parsed.abstract === "string" ? parsed.abstract.trim() : "";
    return abstract ? { abstract, abstractSource: "generated_from_fulltext" } : { abstract: "", abstractSource: null };
  } catch {
    return { abstract: "", abstractSource: null };
  }
}

/** Shared per-record processing: tag + completeness-check a single parsed citation record. No resolveLink/network verification (docs/planning/06 §3 — CNKI's own metadata, including its DOI, is trusted as-is). */
async function processCitationRecord(record: CitationRecord, vocab: TagVocabulary): Promise<CitationJobResult> {
  const { abstract, abstractSource } = await backfillAbstractFromFulltext(record);

  const draft: PipelineDraft = {
    title: record.title, authors: record.authors, year: record.year, abstract,
    doi: record.doi, url: record.url, sourceType: record.sourceType,
  };

  // Tier 1 (docs/planning/06 §4): tagging input falls back to title+keywords when there's still no
  // abstract, instead of tagging on title alone.
  const taggingText = [draft.title, draft.abstract || record.keywords.join(" ")].filter(Boolean).join("\n\n");
  const tagIds = await computeTagsForText(taggingText, vocab);
  const tags = await enrichTags(tagIds);
  const report = verifyCitationRecord({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract });
  const missingRequired = missingHardRequiredFields(
    { title: draft.title, authors: draft.authors, year: draft.year, url: draft.url, doi: draft.doi },
    { requireUrlOrDoi: true },
  );

  return { draft, tagIds, tags, report, missingRequired, abstractSource };
}

/**
 * POST /api/resources/upload/jobs/citation — must be logged in.
 * multipart/form-data, field "file" — one RefWorks/EndNote/NoteExpress export, auto-detected
 * (docs/planning/06 §2). Fans out into one upload_jobs row per parsed record, sharing a batchId
 * like the PDF/url-batch routes. 知网研学's own export format is encrypted and can't be parsed —
 * rejected upfront with a clear message asking for one of the other three formats instead.
 */
router.post("/resources/upload/jobs/citation", requireAuth, handleUpload(citationUpload.single("file")), async (req: any, res) => {
  if (!req.file) { res.status(400).json({ error: "A citation export file is required" }); return; }

  let records: CitationRecord[];
  try {
    records = parseCitationFile(req.file.buffer).records;
  } catch (err: any) {
    if (err instanceof UnsupportedCitationFormatError) { res.status(400).json({ error: err.message }); return; }
    req.log.error(err);
    res.status(500).json({ error: "Failed to parse citation file", detail: err.message });
    return;
  }
  if (records.length === 0) { res.status(400).json({ error: "No citation records found in this file" }); return; }

  const batchId = randomUUID();
  const jobs = await db
    .insert(uploadJobsTable)
    .values(records.map(() => ({ batchId, type: "citation" as const, status: "queued" as const, input: { fileName: req.file.originalname }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ batchId, jobIds: jobs.map((j) => j.id) });

  const vocab = await loadTagVocabulary();
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const jobId = jobs[i].id;
    void (async () => {
      try {
        await db.update(uploadJobsTable).set({ status: "processing", updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
        const result = await processCitationRecord(record, vocab);
        await db.update(uploadJobsTable).set({ status: "ready_for_review", result, updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
      } catch (err: any) {
        await db.update(uploadJobsTable).set({ status: "failed", error: err.message ?? "Processing failed", updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
      }
    })();
  }
});

/**
 * GET /api/resources/upload/jobs — must be logged in. Lists the current user's own jobs, newest
 * first. Optional ?batchId= narrows to one batch — this is how the frontend resumes progress for
 * a specific submission after a closed/refreshed tab, instead of relying on jobIds kept only in
 * page memory.
 */
router.get("/resources/upload/jobs", requireAuth, async (req: any, res) => {
  try {
    const batchId = req.query.batchId as string | undefined;
    const conditions = [eq(uploadJobsTable.createdBy, req.user.userId)];
    if (batchId) conditions.push(eq(uploadJobsTable.batchId, batchId));
    const rows = await db.select().from(uploadJobsTable).where(and(...conditions)).orderBy(desc(uploadJobsTable.createdAt));
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

/** Thrown by persistConfirmedDraft() when a hard-required field is missing — callers turn this into a 400, not a 500. */
class MissingRequiredFieldsError extends Error {
  constructor(public readonly missingFields: string[]) {
    super(`Missing required field(s): ${missingFields.join(", ")}`);
  }
}

/**
 * Shared persist step for both confirm routes below — this is the explicit user confirmation the
 * two-step AI-import rule requires. Rejects outright (throws, no insert at all) if a hard-required
 * field is missing — resources.status is never 'failed'; that state belongs to upload_jobs.
 *
 * requireUrlOrDoi distinguishes entry kind (docs/planning/12 §1): true for manual entry and DOI/URL
 * import (the link was supplied directly, so a gap is real), false for PDF import (the link comes
 * from an automated lookup that can legitimately turn up nothing — that routes to needs_review via
 * determineResourceStatus's verify-report check instead of blocking the confirm).
 *
 * skipNetworkVerification is for citation-import entries (docs/planning/14 §2): CNKI's own metadata
 * is trusted as-is, so re-running the network-based verifyResource() here (DOI resolution + URL
 * reachability) would just be re-verifying CNKI against itself — and does so badly, since CNKI's
 * Chinese-journal DOIs mostly aren't in Crossref/OpenAlex and link.cnki.net blocks bot HEAD/GET
 * requests, so every citation entry would spuriously fail verification and land in needs_review
 * regardless of how complete the record actually is.
 */
async function persistConfirmedDraft(
  input: ConfirmInput,
  userId: number,
  isAdmin: boolean,
  requireUrlOrDoi: boolean,
  skipNetworkVerification: boolean = false,
) {
  const authors = input.authors ?? [];
  const year = input.year ?? null;
  const url = input.url ?? null;
  const doi = input.doi ?? null;

  const missing = missingHardRequiredFields({ title: input.title, authors, year, url, doi }, { requireUrlOrDoi });
  if (missing.length > 0) throw new MissingRequiredFieldsError(missing);

  const verifyInput = { title: input.title, authors, year, doi, url, abstract: input.abstract ?? null };
  const report = skipNetworkVerification ? verifyCitationRecord(verifyInput) : await verifyResource(verifyInput);
  const status = determineResourceStatus(report, isAdmin);

  const [inserted] = await db
    .insert(resourcesTable)
    .values({
      title: input.title,
      authors,
      sourceType: (VALID_SOURCE_TYPES.includes(input.sourceType) ? input.sourceType : "journal_article") as any,
      url,
      doi,
      abstract: input.abstract ?? null,
      // Six-elements "year" — resources has no dedicated year column, so it goes in the free-text
      // publishedDate the legacy import routes already use (which also stores full dates like
      // "2021-07-20"; here we only ever have a bare year).
      publishedDate: year !== null ? String(year) : null,
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

/** Shared error handling for both confirm routes below — a missing hard-required field is a 400 (caller's fault), anything else is a 500. */
function handleConfirmError(err: any, req: any, res: any) {
  if (err instanceof MissingRequiredFieldsError) {
    res.status(400).json({ error: err.message, missingFields: err.missingFields });
    return;
  }
  req.log.error(err);
  res.status(500).json({ error: "Failed to confirm upload", detail: err.message });
}

/**
 * POST /api/resources/upload/confirm — must be logged in.
 * Body: the (possibly user-edited) final draft + tag ids, from the synchronous manual/single-URL
 * preview (POST /upload/manual or /upload/url). No upload_jobs row involved — this is the
 * confirm step for the in-memory pipeline. Both entries this route serves (manual, single URL/DOI)
 * require a URL or DOI (docs/planning/12 §1).
 */
router.post("/resources/upload/confirm", requireAuth, async (req: any, res) => {
  try {
    const input = req.body as ConfirmInput;
    if (!input.title) { res.status(400).json({ error: "title is required" }); return; }
    const inserted = await persistConfirmedDraft(input, req.user.userId, req.user.role === "admin", true);
    res.status(201).json(inserted);
  } catch (err: any) {
    handleConfirmError(err, req, res);
  }
});

/**
 * POST /api/resources/upload/jobs/:id/confirm — must be logged in, owner only.
 * Body: the (possibly user-edited) final draft + tag ids. Persists the real resources row here —
 * this is the explicit user confirmation the two-step AI-import rule requires. This route serves
 * both PDF and URL-batch jobs; only the latter requires a URL/DOI (docs/planning/12 §1) — a PDF
 * whose link resolveLink couldn't find is expected to reach needs_review, not get rejected.
 */
router.post("/resources/upload/jobs/:id/confirm", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(uploadJobsTable).where(and(eq(uploadJobsTable.id, id), eq(uploadJobsTable.createdBy, req.user.userId))).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.status !== "ready_for_review") { res.status(400).json({ error: `Job is not ready for review (status: ${job.status})` }); return; }

    const input = req.body as ConfirmInput;
    if (!input.title) { res.status(400).json({ error: "title is required" }); return; }

    const inserted = await persistConfirmedDraft(
      input,
      req.user.userId,
      req.user.role === "admin",
      job.type === "url",
      job.type === "citation",
    );
    await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, id));
    res.status(201).json(inserted);
  } catch (err: any) {
    handleConfirmError(err, req, res);
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
