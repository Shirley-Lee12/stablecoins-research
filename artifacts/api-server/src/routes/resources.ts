import { Router } from "express";
import multer from "multer";
import { db, resourcesTable } from "@workspace/db";
import { eq, desc, ilike, or, sql, and } from "drizzle-orm";
import { requireAuth, optionalAuth, requireAdmin } from "./auth";
import { syncResourceAuthors } from "./authors";
import { generateJson, generateJsonFromPdf } from "../lib/llm";

const router = Router();

const VALID_SOURCE_TYPES = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];

// Closed tag vocabulary — research themes, not named entities (e.g. not "USDC" or "IMF").
// Keep in sync with STABLECOIN_TAGS in academic-resources.tsx.
const STABLECOIN_TAGS = [
  "Regulation & Policy",
  "Financial Stability & Run Risk",
  "Monetary Policy",
  "CBDC",
  "DeFi & Crypto Markets",
  "Algorithmic Design & Pegging",
  "Reserves & Collateral",
  "Cross-Border Payments",
  "Consumer Protection",
  "Market Adoption",
  "Systemic Risk",
  "Technology & Infrastructure",
];

const TAG_PROMPT_BLOCK = `- "tags": string[] — pick 2 to 3 categories from this exact list that best match the document's core research focus or contribution: ${JSON.stringify(STABLECOIN_TAGS)}. You may optionally add ONE more specific keyword not on the list (e.g. a named stablecoin, jurisdiction, or institution) if it adds real specificity — but prefer the list above for most tags so the library's tag set stays consistent.`;

/**
 * Keeps up to 3 tags from the closed vocabulary (preferred, for a consistent library-wide tag
 * cloud) plus at most 1 additional free-form tag for paper-specific detail. Capped at 4 total.
 */
function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const strings = tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim());
  const fromTaxonomy = [...new Set(strings.filter((t) => STABLECOIN_TAGS.includes(t)))].slice(0, 3);
  const custom = [...new Set(strings.filter((t) => !STABLECOIN_TAGS.includes(t)))].slice(0, 1);
  return [...fromTaxonomy, ...custom].slice(0, 4);
}

/** Formats a Crossref date-parts array (e.g. [[2021,7,20]] or [[2021]]) as "2021-07-20" or "2021". */
function formatCrossrefDate(dateParts: unknown): string | null {
  const parts = (dateParts as any)?.["date-parts"]?.[0];
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const [y, m, d] = parts;
  if (!y) return null;
  if (!m) return String(y);
  if (!d) return `${y}-${String(m).padStart(2, "0")}`;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Crossref abstracts are JATS XML (e.g. <jats:p>...</jats:p>) — strip tags for plain text. */
function stripJatsTags(abstract: unknown): string {
  if (typeof abstract !== "string") return "";
  return abstract.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// ── PDF upload (memory only — the binary is never persisted to disk or DB) ────
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported"));
  },
});

/** Wraps a multer middleware so upload errors become clean JSON 400s instead of crashing the request. */
function handleUpload(mw: any) {
  return (req: any, res: any, next: any) => {
    mw(req, res, (err: any) => {
      if (err) { res.status(400).json({ error: err.message || "Upload failed" }); return; }
      next();
    });
  };
}

/** Sends a PDF directly to Gemini (native multimodal document understanding — handles scanned/image PDFs too). */
async function extractMetadataFromPdf(buffer: Buffer, sourceTypeHint: string) {
  const prompt = `You are an academic librarian assistant. Read the attached PDF document (use OCR if it is a scanned image) and extract structured bibliographic metadata.

Source type hint: ${sourceTypeHint}

Return a JSON object with exactly these fields:
- "title": string — the document's full title
- "authors": string[] — list of author names (empty array if none found)
- "abstract": string — if the document has its own "Abstract" section, copy it verbatim (do not paraphrase or shorten it); only if no abstract section exists, write a concise 2–4 sentence summary instead
${TAG_PROMPT_BLOCK}
- "sourceType": one of exactly: "Paper", "Report", "Gov Document", "News", "Experts & Scholars"
- "doi": string or null — the document's DOI if printed on it, else null
- "publishedDate": string or null — the publication/posted date printed on the document (e.g. "2021-07-20" or just "2021"), else null

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

  const raw = await generateJsonFromPdf(buffer, prompt);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("AI returned invalid JSON");
  }

  return {
    title:      typeof parsed.title === "string"    ? parsed.title    : "",
    authors:    Array.isArray(parsed.authors)       ? parsed.authors  : [],
    abstract:   typeof parsed.abstract === "string" ? parsed.abstract : "",
    tags:       sanitizeTags(parsed.tags),
    sourceType: VALID_SOURCE_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint,
    doi:        typeof parsed.doi === "string" && parsed.doi.trim() ? parsed.doi.trim() : null,
    publishedDate: typeof parsed.publishedDate === "string" && parsed.publishedDate.trim() ? parsed.publishedDate.trim() : null,
  };
}

/** Extracts a bare DOI (10.xxxx/yyyy) from a doi.org URL, a publisher URL containing one, or a raw DOI string. */
function extractDoi(input: string): string | null {
  const match = input.match(/10\.\d{4,9}\/\S+/);
  if (!match) return null;
  return match[0].replace(/[)\].,;]+$/, ""); // trim trailing punctuation/brackets often picked up from surrounding text
}

function crossrefTypeToSourceType(type: string | undefined, sourceTypeHint: string): string {
  if (type === "journal-article" || type === "posted-content" || type === "dataset" || type === "preprint") return "Paper";
  if (type === "report") return "Report";
  return sourceTypeHint;
}

/**
 * Looks up structured bibliographic metadata for a DOI directly via the free Crossref API —
 * no page scraping, so it works even when the publisher (e.g. SSRN, Elsevier) blocks bots.
 * Many published journal articles (less so SSRN/preprints) also carry a JATS-XML abstract and
 * an issued/published date here, which we use directly when present.
 */
async function lookupCrossrefWork(doi: string, sourceTypeHint: string, attempt = 1): Promise<{ title: string; authors: string[]; url: string | null; sourceType: string; abstract: string; publishedDate: string | null } | null> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const msg = data?.message;
    if (!msg) return null;

    const title = Array.isArray(msg.title) && msg.title[0] ? msg.title[0] : "";
    const authors = Array.isArray(msg.author)
      ? msg.author.map((a: any) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean)
      : [];
    const url = typeof msg.URL === "string" ? msg.URL : (typeof msg?.resource?.primary?.URL === "string" ? msg.resource.primary.URL : null);
    const publishedDate = formatCrossrefDate(msg.issued) ?? formatCrossrefDate(msg.published) ?? formatCrossrefDate(msg["published-print"]) ?? formatCrossrefDate(msg["published-online"]);

    if (!title) return null;
    return {
      title,
      authors,
      url,
      sourceType: crossrefTypeToSourceType(msg.type, sourceTypeHint),
      abstract: stripJatsTags(msg.abstract),
      publishedDate,
    };
  } catch {
    // Crossref's free public API is occasionally slow/flaky — one retry avoids spurious failures.
    if (attempt < 2) return lookupCrossrefWork(doi, sourceTypeHint, attempt + 1);
    return null;
  }
}

function normalizeTitleWords(title: string): Set<string> {
  return new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2));
}

/** Crude but effective: are these titles "the same paper"? Checks word overlap, not exact match. */
function titlesAreSimilar(a: string, b: string): boolean {
  const wordsA = normalizeTitleWords(a);
  const wordsB = normalizeTitleWords(b);
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
  const smaller = Math.min(wordsA.size, wordsB.size);
  return overlap / smaller >= 0.7;
}

/**
 * When a PDF has no printed DOI (common for working papers/preprints), search Crossref's
 * bibliographic search by title to try to find a matching canonical record anyway — still no
 * scraping, since this is Crossref's own public search API, not the publisher's site.
 */
async function searchCrossrefByTitle(title: string, sourceTypeHint: string): Promise<{ doi: string; work: NonNullable<Awaited<ReturnType<typeof lookupCrossrefWork>>> } | null> {
  if (!title.trim()) return null;
  try {
    const res = await fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(title)}&rows=1`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const item = data?.message?.items?.[0];
    if (!item) return null;

    const foundTitle = Array.isArray(item.title) && item.title[0] ? item.title[0] : "";
    if (!titlesAreSimilar(title, foundTitle)) return null; // avoid attaching the wrong paper's DOI

    const doi = item.DOI;
    if (!doi) return null;
    const work = await lookupCrossrefWork(doi, sourceTypeHint);
    if (!work) return null;
    return { doi, work };
  } catch {
    return null;
  }
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

router.get("/resources/recent", optionalAuth, async (req: any, res) => {
  try {
    const limit = Number(req.query.limit ?? 5);

    const rows = await db
      .select()
      .from(resourcesTable)
      .where(eq(resourcesTable.status, "approved"))
      .orderBy(desc(resourcesTable.createdAt))
      .limit(limit);

    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to fetch recent resources" });
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

    const sourceTypeHint = source_type ?? "Paper";
    const VALID_TYPES = ["Paper", "Report", "Gov Document", "News", "Experts & Scholars"];

    // DOI links (SSRN, Elsevier, etc.) are frequently blocked from scraping by the publisher.
    // Crossref's public API gives structured title/authors directly from the DOI — no scraping needed.
    const doi = extractDoi(url);
    const crossrefWork = doi ? await lookupCrossrefWork(doi, sourceTypeHint) : null;

    // Try to fetch the page too — used for abstract/tags either way, and as the sole source
    // of title/authors when there's no DOI (or Crossref has no record for it).
    let pageText = "";
    let fetchBlocked = false;
    try {
      const response = await fetch(crossrefWork?.url ?? url, {
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
      // A non-OK status or a near-empty page after stripping HTML usually means the site
      // blocked our request (bot/CAPTCHA wall) rather than that the page has no content.
      if (!response.ok || pageText.length < 200) fetchBlocked = true;
    } catch {
      fetchBlocked = true;
    }

    // No DOI fallback and the page itself is unreachable — nothing left to extract from.
    if (!crossrefWork && fetchBlocked) {
      res.status(422).json({
        error: "This page could not be read automatically — it may be blocking automated requests. Try uploading the PDF directly, or use Add Manually.",
      });
      return;
    }

    // Page was reachable (or we don't strictly need it because Crossref already has title/authors) — ask Gemini
    // for abstract/tags, and for title/authors/sourceType too when Crossref didn't already supply them.
    let abstract = "";
    let tags: string[] = [];
    let geminiTitle = "";
    let geminiAuthors: string[] = [];
    let geminiSourceType = sourceTypeHint;
    let geminiPublishedDate: string | null = null;

    if (!fetchBlocked) {
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
- "abstract": string — if the page shows the document's own "Abstract" section, copy it verbatim (do not paraphrase or shorten it); only if no abstract section exists, write a concise 2–4 sentence summary instead
${TAG_PROMPT_BLOCK}
- "sourceType": one of exactly: "Paper", "Report", "Gov Document", "News", "Experts & Scholars"
- "publishedDate": string or null — the document's publication date if shown on the page (e.g. "2021-07-20" or just "2021"), else null

Respond with ONLY the JSON object, no markdown fences, no extra text.`;

      const raw = await generateJson(prompt, 4096);
      try {
        const parsed = JSON.parse(raw);
        geminiTitle      = typeof parsed.title === "string"    ? parsed.title    : "";
        geminiAuthors    = Array.isArray(parsed.authors)       ? parsed.authors  : [];
        abstract         = typeof parsed.abstract === "string" ? parsed.abstract : "";
        tags             = sanitizeTags(parsed.tags);
        geminiSourceType = VALID_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint;
        geminiPublishedDate = typeof parsed.publishedDate === "string" && parsed.publishedDate.trim() ? parsed.publishedDate.trim() : null;
      } catch {
        req.log.error({ raw }, "Gemini returned non-JSON");
      }
    }

    res.json({
      title:      crossrefWork?.title || geminiTitle,
      authors:    crossrefWork?.authors?.length ? crossrefWork.authors : geminiAuthors,
      abstract:   abstract || crossrefWork?.abstract || "",
      tags,
      sourceType: crossrefWork?.sourceType ?? geminiSourceType,
      url:        crossrefWork?.url || url,
      doi:        doi ?? null,
      publishedDate: geminiPublishedDate ?? crossrefWork?.publishedDate ?? null,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Import failed", detail: err.message });
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

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    send({ index: i, url, status: "parsing" });
    const sourceTypeHint = source_type ?? "Paper";

    try {
      const doi = extractDoi(url);
      const crossrefWork = doi ? await lookupCrossrefWork(doi, sourceTypeHint) : null;

      let pageText = "";
      let fetchBlocked = false;
      try {
        const response = await fetch(crossrefWork?.url ?? url, {
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
        if (!response.ok || pageText.length < 200) fetchBlocked = true;
      } catch {
        fetchBlocked = true;
      }

      if (!crossrefWork && fetchBlocked) {
        send({ index: i, url, status: "error", error: "Page could not be read automatically (may be blocking automated requests)" });
        if (i < urls.length - 1) await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      let abstract = "";
      let tags: string[] = [];
      let geminiTitle = "";
      let geminiAuthors: string[] = [];
      let geminiSourceType = sourceTypeHint;
      let geminiPublishedDate: string | null = null;

      if (!fetchBlocked) {
        const prompt = `Extract bibliographic metadata from this page. URL: ${url}\nSource type hint: ${sourceTypeHint}\nPage content: ${pageText}\n\nReturn JSON with: title (string), authors (string[]), abstract (string — copy the page's own "Abstract" section verbatim if present, do not paraphrase; only write a 2-3 sentence summary if no abstract section exists), tags (string[] — pick 2-3 categories matching the document's core research focus from this list: ${JSON.stringify(STABLECOIN_TAGS)}; optionally add ONE more specific keyword not on the list if it adds real specificity), sourceType (one of: Paper|Report|Gov Document|News|Experts & Scholars), publishedDate (string or null — the document's publication date if shown, e.g. "2021-07-20" or "2021")`;
        const raw = await generateJson(prompt, 4096);
        const parsed = JSON.parse(raw);
        geminiTitle      = typeof parsed.title === "string"    ? parsed.title    : "";
        geminiAuthors    = Array.isArray(parsed.authors)       ? parsed.authors  : [];
        abstract         = typeof parsed.abstract === "string" ? parsed.abstract : "";
        tags             = sanitizeTags(parsed.tags);
        geminiSourceType = VALID_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint;
        geminiPublishedDate = typeof parsed.publishedDate === "string" && parsed.publishedDate.trim() ? parsed.publishedDate.trim() : null;
      }

      send({
        index: i,
        url,
        status: "done",
        data: {
          title:      crossrefWork?.title || geminiTitle || url,
          authors:    crossrefWork?.authors?.length ? crossrefWork.authors : geminiAuthors,
          abstract:   abstract || crossrefWork?.abstract || "",
          tags,
          sourceType: crossrefWork?.sourceType ?? geminiSourceType,
          doi:        doi ?? null,
          url:        crossrefWork?.url || url,
          publishedDate: geminiPublishedDate ?? crossrefWork?.publishedDate ?? null,
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
 * POST /api/resources/import/pdf  — must be logged in
 * Body: multipart/form-data, field "file" (single PDF, max 15MB), optional "source_type"
 * Sends the PDF to Gemini directly (no separate OCR step needed) and returns parsed
 * metadata WITHOUT saving. Resolves a canonical URL from the DOI via Crossref when possible.
 */
router.post("/resources/import/pdf", requireAuth, handleUpload(pdfUpload.single("file")), async (req: any, res) => {
  try {
    if (!req.file) { res.status(400).json({ error: "A PDF file is required" }); return; }
    const sourceTypeHint = (req.body.source_type as string) ?? "Paper";

    const parsed = await extractMetadataFromPdf(req.file.buffer, sourceTypeHint);
    // No DOI printed on the document — try a title search as a best-effort fallback so we can
    // still attach a canonical link, instead of leaving the resource with no URL at all.
    const titleMatch = !parsed.doi && parsed.title ? await searchCrossrefByTitle(parsed.title, sourceTypeHint) : null;
    const crossrefWork = parsed.doi ? await lookupCrossrefWork(parsed.doi, sourceTypeHint) : titleMatch?.work ?? null;
    res.json({
      ...parsed,
      doi: parsed.doi ?? titleMatch?.doi ?? null,
      url: crossrefWork?.url ?? null,
      abstract: parsed.abstract || crossrefWork?.abstract || "",
      publishedDate: parsed.publishedDate ?? crossrefWork?.publishedDate ?? null,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "PDF import failed", detail: err.message });
  }
});

/**
 * POST /api/resources/import/pdf/batch  — must be logged in
 * Body: multipart/form-data, field "files" (up to 20 PDFs), optional "source_type"
 * Processes each PDF sequentially and streams SSE progress, mirroring the URL batch endpoint.
 */
router.post("/resources/import/pdf/batch", requireAuth, handleUpload(pdfUpload.array("files", 20)), async (req: any, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) { res.status(400).json({ error: "At least one PDF file is required" }); return; }
  const sourceTypeHint = (req.body.source_type as string) ?? "Paper";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    send({ index: i, fileName: file.originalname, status: "parsing" });

    try {
      const parsed = await extractMetadataFromPdf(file.buffer, sourceTypeHint);
      const titleMatch = !parsed.doi && parsed.title ? await searchCrossrefByTitle(parsed.title, sourceTypeHint) : null;
      const crossrefWork = parsed.doi ? await lookupCrossrefWork(parsed.doi, sourceTypeHint) : titleMatch?.work ?? null;
      send({
        index: i,
        fileName: file.originalname,
        status: "done",
        data: {
          ...parsed,
          doi: parsed.doi ?? titleMatch?.doi ?? null,
          url: crossrefWork?.url ?? null,
          abstract: parsed.abstract || crossrefWork?.abstract || "",
          publishedDate: parsed.publishedDate ?? crossrefWork?.publishedDate ?? null,
          fileName: file.originalname,
        },
      });
    } catch (err: any) {
      send({ index: i, fileName: file.originalname, status: "error", error: err.message ?? "Failed" });
    }

    if (i < files.length - 1) await new Promise((r) => setTimeout(r, 500));
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
    const { title, authors, sourceType, url, doi, abstract, tags, publishedDate } = req.body;
    if (!title) { res.status(400).json({ error: "title is required" }); return; }

    const dupConditions = [ilike(resourcesTable.title, title.trim())];
    if (doi && doi.trim()) dupConditions.push(eq(resourcesTable.doi, doi.trim()));
    const [duplicate] = await db
      .select({ id: resourcesTable.id, title: resourcesTable.title, status: resourcesTable.status })
      .from(resourcesTable)
      .where(or(...dupConditions))
      .limit(1);
    if (duplicate) {
      res.status(409).json({
        error: "duplicate",
        message: "A resource with this title or DOI already exists in the library.",
        existing: duplicate,
      });
      return;
    }

    const isAdmin = req.user.role === "admin";

    const [inserted] = await db
      .insert(resourcesTable)
      .values({
        title,
        authors:       authors       ?? [],
        sourceType:    sourceType    ?? "Paper",
        url:           url           ?? null,
        doi:           doi           ?? null,
        abstract:      abstract      ?? null,
        tags:          sanitizeTags(tags),
        publishedDate: publishedDate ?? null,
        status:        isAdmin ? "approved" : "pending",
        createdBy:     req.user.userId,
      })
      .returning();

    await syncResourceAuthors(inserted.id, inserted.authors);
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

    const { title, authors, sourceType, url, doi, abstract, tags, publishedDate } = req.body;
    const [updated] = await db
      .update(resourcesTable)
      .set({
        ...(title         !== undefined && { title }),
        ...(authors       !== undefined && { authors }),
        ...(sourceType    !== undefined && { sourceType }),
        ...(url           !== undefined && { url }),
        ...(doi           !== undefined && { doi }),
        ...(abstract      !== undefined && { abstract }),
        ...(tags          !== undefined && { tags: sanitizeTags(tags) }),
        ...(publishedDate !== undefined && { publishedDate }),
        // Non-admin edits require re-approval
        ...(!isAdmin && { status: "pending" as const }),
      })
      .where(eq(resourcesTable.id, id))
      .returning();

    if (authors !== undefined) await syncResourceAuthors(id, updated.authors);
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
