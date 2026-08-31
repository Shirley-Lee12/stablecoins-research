import { Router } from "express";
import multer from "multer";
import { createHash, randomUUID } from "node:crypto";
import { access, open, readFile, readdir, rm, stat } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { tmpdir } from "node:os";
import { db, resourcesTable, uploadJobsTable, resourceTagsTable, tagsTable, duplicateCandidatesTable, usersTable, type KeywordsSource } from "@workspace/db";
import { eq, and, desc, inArray, gte, count, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "./auth";
import { requireConnectorAuth } from "../lib/connectorAuth";
import { syncResourceAuthors } from "../lib/resourceAuthors";
import { generateJson } from "../lib/llm";
import { logger } from "../lib/logger";
import { hasAbbreviatedAuthorName, preferFullAuthorNames, resolveDoiOpenAlex, resolveLink, searchOpenAlex } from "../lib/scholar";
import { extractPdfText, type PdfBibliographicMetadata } from "../lib/pdfExtract";
import { loadTagVocabulary, computeTagsForText, type TagVocabulary, type ComputedTags } from "../lib/tagging";
import { verifyBrowserCapture, verifyResource, verifyCitationRecord, type VerifyReport } from "../lib/verify";
import { classifyStatus, missingSixElements } from "../lib/resourceStatus";
import { findDuplicateCandidates, type DuplicateSignal } from "../lib/duplicateCheck";
import { parseCitationFile, UnsupportedCitationFormatError, type CitationRecord } from "../lib/citation";
import { extractListFileText, UnsupportedListFormatError } from "../lib/unstructuredList/extractText";
import { decomposeReferenceListInChunks, type DecomposedEntry } from "../lib/unstructuredList/decompose";
import { titleOverlapScore } from "../lib/scholar/matching";
import { assertSafePublicHttpUrl, normalizeResourceUrlInput, readBoundedBody, safeFetch, UnsafeUrlError } from "../lib/safeUrl";
import { uploadTaskQueue } from "../lib/taskQueue";
import { consumeUploadPreview, createUploadPreview } from "../lib/uploadPreview";
import { createRateLimiter } from "../lib/rateLimit";
import { readUploadArchive } from "../lib/zipArchive";
import { normalizeKeywordList } from "../lib/keywords";
import { InvalidPublicationDateError, normalizePublicationDateInput, publicationYear } from "../lib/publicationDate";
import { VALID_SOURCE_TYPES, normalizeSourceType, refineSourceType } from "../lib/sourceType";
import { normalizeResourceTitle } from "../lib/titleCase";

const router = Router();
const uploadWorkLimiter = createRateLimiter({
  windowMs: 60 * 60_000,
  max: 30,
  key: (req) => `${req.user?.userId ?? "anonymous"}:${req.ip ?? req.socket?.remoteAddress ?? "unknown"}`,
});

// PDF bytes live only in an OS-managed temporary file until the background worker extracts text.
const PDF_MAX_SIZE_MB = 50;
const PDF_MAX_FILES = 5;
const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: tmpdir(),
    filename: (_req, _file, cb) => cb(null, `stablecoin-upload-${randomUUID()}.pdf`),
  }),
  limits: { fileSize: PDF_MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported"));
  },
});

function handleUpload(mw: any, maxSizeMb: number, fileLabel: string) {
  return (req: any, res: any, next: any) => {
    mw(req, res, (err: any) => {
      if (err) {
        // multer's own message for this case doesn't mention the actual limit — give the user a
        // specific, actionable number instead of a generic "File too large".
        const message = err.code === "LIMIT_FILE_SIZE" ? `File too large — the limit is ${maxSizeMb}MB per ${fileLabel}.` : (err.message || "Upload failed");
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  };
}

function normalizeUploadFilename(fileName: string): string {
  if (/[\u3400-\u9fff]/u.test(fileName) || !/[\u0080-\u00ff]/u.test(fileName)) return fileName;
  const decoded = Buffer.from(fileName, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? fileName : decoded;
}

interface ExtractedDraft {
  title: string;
  authors: string[];
  year: number | null;
  publishedDate: string | null;
  abstract: string;
  doi: string | null;
  sourceType: string;
  /** Terms found under an explicit "关键词:"/"Keywords:" section — empty if the text has no such section (docs/planning/15 §5.3, never fabricated here; see resolveKeywords() for the generation fallback). */
  keywords: string[];
}

/**
 * Expand bibliographic initials only from a high-confidence scholarly record. resolveLink already
 * merges several providers, but under a busy batch one provider may time out while another match is
 * sufficient for the URL. A dedicated OpenAlex retry gives author names one bounded second chance.
 */
async function resolveFullAuthorNames(
  current: string[],
  title: string,
  doi: string | null | undefined,
  candidateLists: string[][] = [],
): Promise<string[]> {
  let names = preferFullAuthorNames(current, candidateLists);
  if (!hasAbbreviatedAuthorName(names)) return names;
  try {
    const openAlex = doi
      ? await resolveDoiOpenAlex(doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, ""))
      : (await searchOpenAlex(title)).find((candidate) => titleOverlapScore(title, candidate.title) >= 0.7) ?? null;
    if (openAlex?.authors.length) names = preferFullAuthorNames(names, [openAlex.authors]);
  } catch {
    // Keep the source spelling when the trusted lookup is unavailable; never invent an expansion.
  }
  return names;
}

function decodeAndCleanField(value: unknown): string {
  if (typeof value !== "string") return "";
  const namedEntities: Record<string, string> = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " " };
  return value
    .replace(/<\/?(?:p|div|br|span|jats:[^>\s]+)[^>]*>/giu, " ")
    .replace(/&#(\d+);/gu, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/giu, (match, name) => namedEntities[name.toLowerCase()] ?? match)
    .replace(/\s+/gu, " ")
    .trim();
}

/** A 200 response can still be a host error page, not a document. Never let that text become a
 * fabricated abstract/keyword set; the job should wait for a usable source instead. */
function isServerErrorPageText(text: string): boolean {
  const normalized = text.toLocaleLowerCase();
  const signals = [
    /fatal error/.test(normalized),
    /uncaught (?:exception|error)/.test(normalized),
    /stack trace/.test(normalized),
    /unabletocreatedirectory/.test(normalized),
    /permission denied/.test(normalized),
    /call to undefined (?:method|function)/.test(normalized),
  ].filter(Boolean).length;
  return signals >= 2;
}

function pdfSourceEvidence(metadata: PdfBibliographicMetadata | null | undefined, fileName?: string): string {
  const lines = [
    fileName ? `Uploaded filename: ${fileName}` : null,
    metadata?.title ? `Embedded PDF title: ${metadata.title}` : null,
    metadata?.author ? `Embedded PDF author: ${metadata.author}` : null,
    metadata?.subject ? `Embedded PDF subject: ${metadata.subject}` : null,
    metadata?.keywords ? `Embedded PDF keywords: ${metadata.keywords}` : null,
  ].filter((line): line is string => !!line);
  return lines.join("\n");
}

function extractExplicitSourceMetadata(text: string): { abstract: string; keywords: string[] } {
  const compact = text.replace(/\s+/g, " ").trim();
  const chineseAbstract = compact.match(/(?:^|\s)摘要\s*[:：]\s*(.{40,6000}?)(?=\s*(?:更多\s*还原\s*)?(?:视频摘要|关键词|关键字|基金资助|DOI|专辑|专题|分类号|在线公开时间)\s*[:：])/u)?.[1];
  const englishAbstract = compact.match(/(?:^|\s)Abstract\s*[:：]?\s*(.{40,6000}?)(?=\s*(?:Keywords?|JEL Classification|DOI|1\.?\s+Introduction)\s*[:：]?)/i)?.[1];
  const keywordText = compact.match(/(?:关键词|关键字|Keywords?)\s*[:：]\s*(.{2,1200}?)(?=\s*(?:基金资助|DOI|专辑|专题|分类号|在线公开时间|JEL Classification)\s*[:：])/i)?.[1] ?? "";
  const keywords = keywordText.split(/[;；,，]/).map((keyword) => keyword.trim()).filter(Boolean).slice(0, 20);
  return {
    abstract: (chineseAbstract ?? englishAbstract ?? "").replace(/\s*(?:更多\s*还原)\s*$/u, "").trim(),
    keywords,
  };
}

/** Single LLM call to pull the six elements out of raw text — link resolution and tagging happen in separate, dedicated steps afterward. */
async function extractFromText(text: string, sourceTypeHint: string, sourceEvidence = ""): Promise<ExtractedDraft> {
  const explicitSourceMetadata = extractExplicitSourceMetadata(text);
  const prompt = `You are an academic librarian assistant. Extract structured bibliographic metadata from the following text.

Source type hint: ${sourceTypeHint}
${sourceEvidence ? `\nAdditional PDF evidence (may be stale; use only when consistent with the title page/byline):\n${sourceEvidence}\n` : ""}

Text:
---
${text.slice(0, 8000)}
---

Return a JSON object with exactly these fields:
- "title": string — the document's full title
- "authors": string[] — list of author full names. If no individual person is named as author (common
  for laws, regulations, and government/institutional publications), use the issuing body's name
  instead (e.g. "European Parliament", "United States Congress", "HKMA") — do not return an empty
  array just because no individual person is credited. Never treat an institution merely discussed
  in the title/body as the author or issuer. Never guess the expansion of initials: copy initials
  exactly unless the source itself prints the full name elsewhere.
- "publishedDate": string | null — the most precise publication date explicitly shown in the source,
  using YYYY, YYYY-MM, or YYYY-MM-DD. Do not invent a month or day when only a year is available.
- "abstract": string — ONLY when the source contains an explicit "摘要"/"Abstract" section, copy
  that source abstract faithfully and preserve its original language; otherwise return an empty
  string. Never translate it and never create a summary in this extraction step.
- "doi": string | null — the DOI assigned to this document itself, normally printed near the title,
  byline, page header/footer, or publication details. Never copy a DOI from the references,
  bibliography, footnotes, or a different work discussed in the body. Return null when no DOI for
  this document is explicitly identifiable.
- "sourceType": one of exactly: "journal_article", "working_paper", "conference_paper", "thesis", "dataset", "report", "gov_document", "news". Use:
  - journal_article only for an article published in an academic or professional periodical;
  - working_paper for a preprint or numbered working-paper series not yet published as a journal article;
  - conference_paper for proceedings or a paper explicitly presented at a conference;
  - thesis for a university degree thesis or dissertation;
  - dataset for a published data collection, data release, repository deposit, or recurring data snapshot whose primary research object is the downloadable data rather than an accompanying paper;
  - report for a standalone institutional research, policy, industry, audit, or technical report (normally identifiable by a report title/number, cover, contents, executive summary, or methodology);
  - gov_document for legislation, regulations, official rules, regulatory guidelines, consultations, and other authoritative public-sector instruments;
  - news for news stories, commentary, opinion, blog posts, interviews, announcements, and other web articles without a standalone report identity. A page under a site's Stories/News/Blog/Opinion section is news, not a report.
- "keywords": string[] — ONLY if the text has an explicit "关键词:"/"Keywords:" section, list those terms exactly as given; otherwise return an empty array. Do not invent keywords that aren't explicitly labeled as such in the text.

Respond with ONLY the JSON object, no markdown fences, no extra text.`;
  const raw = await generateJson(prompt, 2048);
  const parsed = JSON.parse(raw);
  let publishedDate: string | null = null;
  try {
    publishedDate = normalizePublicationDateInput(typeof parsed.publishedDate === "string"
      ? parsed.publishedDate
      : typeof parsed.year === "number" ? String(parsed.year) : null);
  } catch {
    publishedDate = typeof parsed.year === "number" ? String(parsed.year) : null;
  }
  return {
    title: normalizeResourceTitle(decodeAndCleanField(parsed.title)),
    authors: [...new Set<string>(Array.isArray(parsed.authors)
      ? parsed.authors.map((author: unknown) => decodeAndCleanField(author)).filter(Boolean)
      : [])],
    year: publicationYear(publishedDate),
    publishedDate,
    abstract: decodeAndCleanField(explicitSourceMetadata.abstract || parsed.abstract),
    doi: typeof parsed.doi === "string" ? extractDoiFromInput(parsed.doi) : null,
    sourceType: VALID_SOURCE_TYPES.includes(parsed.sourceType) ? parsed.sourceType : sourceTypeHint,
    keywords: explicitSourceMetadata.keywords.length > 0
      ? explicitSourceMetadata.keywords
      : Array.isArray(parsed.keywords) ? normalizeKeywordList(parsed.keywords.filter((k: unknown): k is string => typeof k === "string")) : [],
  };
}

/**
 * Generates a summary only after extraction has confirmed that the fetched source does not expose
 * its own abstract. The source text is mandatory: a title alone is never enough to invent one.
 */
async function generateAbstractFromSourceText(title: string, sourceText: string): Promise<string> {
  if (sourceText.trim().length < 800) return "";
  try {
    const prompt = `The following source does not contain an explicit abstract. Write a concise 2-4 sentence summary based only on the supplied source text.

Use the same language as the document itself. In particular, a Chinese document must receive a Chinese summary and must never be translated into English. Do not add facts that are not present in the text.

Title: ${title}
Source text:
---
${sourceText.slice(0, 6000)}
---

Respond with ONLY a JSON object: { "abstract": string }`;
    const raw = await generateJson(prompt, 1024);
    const parsed = JSON.parse(raw);
    return decodeAndCleanField(parsed.abstract);
  } catch (err) {
    logger.error({ err }, "generateAbstractFromSourceText failed");
    return "";
  }
}

/**
 * Produces a compact library keyword set from substantive source text. A title is supplied solely as
 * context for resolving terminology; it is never enough by itself to generate keywords. This avoids
 * entries that merely repeat their title when no source abstract has been recovered.
 */
export async function generateKeywordsFromAbstract(title: string, abstract: string, sourceKeywords: string[] = []): Promise<string[]> {
  if (!abstract.trim()) return [];
  try {
    const prompt = `Read the title and abstract below. Return 3 or 4 compact keyword phrases that are supported by the ABSTRACT, not merely words copied from the title.

Rules:
- Use the source language and lowercase Latin text.
- Order from the research object or setting to the central mechanism, risk, question, or method.
- Keep each phrase short (normally 1-4 words) and specific.
- Do not include generic field labels such as "finance" or "cryptocurrency" unless the abstract makes them the concrete research object.
- Do not repeat the title as a keyword list.
- Source-supplied keywords are hints only: keep a hint only when it accurately represents the abstract and fits these rules.

Title: ${title}
Abstract:
---
${abstract.slice(0, 3000)}
---
${sourceKeywords.length > 0 ? `
Source-supplied keyword hints: ${normalizeKeywordList(sourceKeywords).join("; ")}` : ""}

Return ONLY a JSON object: { "keywords": string[] } with 3 or 4 items.`;
    // Gemini 2.5 Flash may spend part of maxOutputTokens on internal reasoning. 512 caused short
    // keyword JSON responses to be truncated before the closing brace in real batch imports.
    const raw = await generateJson(prompt, 2048);
    const parsed = JSON.parse(raw);
    const keywords = Array.isArray(parsed.keywords)
      ? normalizeKeywordList(parsed.keywords.filter((k: unknown): k is string => typeof k === "string")).slice(0, 4)
      : [];
    if (keywords.length === 0) logger.warn({ raw }, "generateKeywordsFromContext: model returned no usable keywords");
    return keywords;
  } catch (err) {
    logger.error({ err }, "generateKeywordsFromContext failed");
    return [];
  }
}

/**
 * Manual entry is handled by callers. For all automatic paths, source terms inform the model but
 * the final small vocabulary is grounded in the abstract, keeping cards comparable across sources.
 */
async function resolveKeywords(extracted: string[], abstract: string | null, title = ""): Promise<{ keywords: string[]; keywordsSource: KeywordsSource | null }> {
  const generated = await generateKeywordsFromAbstract(title, abstract ?? "", extracted);
  if (generated.length > 0) return { keywords: generated, keywordsSource: "generated" };
  const normalizedExtracted = normalizeKeywordList(extracted).slice(0, 4);
  return normalizedExtracted.length > 0
    ? { keywords: normalizedExtracted, keywordsSource: "extracted" }
    : { keywords: [], keywordsSource: null };
}

/**
 * docs/planning/19 §19.2 — a submitter-facing explanation of why tagging found no theme-facet
 * match, since "未命中主题标签" on its own gives someone no way to judge whether to fix it or
 * withdraw. Only ever called once, right when off_topic is first determined (persistConfirmedDraft)
 * — never regenerated later, same reasoning as generateKeywordsFromAbstract. Falls back to a generic
 * (still honest) message on any failure so a submission is never blocked by this being best-effort.
 */
async function generateOffTopicExplanation(title: string, abstract: string | null): Promise<string> {
  const fallback = "This resource's topic doesn't appear to directly engage stablecoins or their underlying theory/technology.";
  if (!abstract?.trim() && !title.trim()) return fallback;
  try {
    const prompt = `Read the following academic paper's title and abstract. In one or two sentences (in the same language as the title/abstract), explain concretely what the paper actually studies, and why that doesn't appear to directly engage stablecoins or their underlying theory/technology (e.g. monetary economics, digital currency, blockchain payment rails). Be specific about the paper's actual subject — don't just say "it doesn't mention stablecoins".

Title: ${title}
Abstract:
---
${(abstract ?? "").slice(0, 3000)}
---

Return ONLY a JSON object: { "explanation": string }`;
    const raw = await generateJson(prompt, 512);
    const parsed = JSON.parse(raw);
    const explanation = typeof parsed.explanation === "string" ? parsed.explanation.trim() : "";
    return explanation || fallback;
  } catch (err) {
    logger.error({ err }, "generateOffTopicExplanation failed");
    return fallback;
  }
}

/**
 * Fetches a URL's page text (basic HTML tag-stripping fetch/strip pattern).
 * Detects a direct PDF link via Content-Type (falling back to a ".pdf" URL check for servers that
 * mislabel it) and routes those through the same local text extraction PDF uploads use, instead of
 * running PDF bytes through the HTML tag-stripper, which would only produce binary garbage.
 */
export async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await safeFetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ZIBSBot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      return null;
    }

    const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
    if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      const buffer = await readBoundedBody(response, PDF_MAX_SIZE_MB * 1024 * 1024);
      const { text, metadata } = await extractPdfText(buffer);
      const evidence = pdfSourceEvidence(metadata);
      return text.length >= 200 ? `${evidence ? `${evidence}\n\n` : ""}${text}`.slice(0, 8000) : null;
    }

    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.startsWith("text/plain")) {
      await response.body?.cancel();
      return null;
    }
    const html = (await readBoundedBody(response, 2 * 1024 * 1024)).toString("utf8");
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    if (isServerErrorPageText(text)) return null;
    return text.length >= 200 ? text : null;
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw error;
    return null;
  }
}

export interface PipelineDraft {
  title: string;
  authors: string[];
  year: number | null;
  publishedDate?: string | null;
  abstract: string;
  doi: string | null;
  url: string | null;
  sourceType: string;
  /** docs/planning/15 §5.2 — free-text keywords, distinct from the controlled tags/facetedTags system. */
  keywords: string[];
  keywordsSource: KeywordsSource | null;
  /** Tags explicitly selected by the submitter; kept separate so persistence records manual ownership. */
  manualTagIds?: number[];
}

export interface TagSummary {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
  status: "active" | "candidate";
  /** Weighted title+abstract similarity (docs/planning/15 §3.5) — only set for facet='theme'; undefined for asset/jurisdiction/candidate, which aren't similarity-scored. */
  score?: number;
}

export interface DuplicatePreview {
  candidateResourceId: number;
  matchType: "exact_doi" | "exact_url" | "fuzzy_title";
  title: string;
  authors: string[];
  publishedDate: string | null;
  status: string;
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
  /** Existing resources that already match this draft, shown before the user spends time filling gaps. */
  duplicateCandidates?: DuplicatePreview[];
  /** Last live library comparison; prevents stale empty results without rescanning on every poll. */
  duplicateCandidatesCheckedAt?: string;
  /** One-time, short-lived server-side preview reference used by synchronous confirm. */
  confirmationId?: string;
}

const browserCaptureSchema = z.object({
  pageUrl: z.string().url().max(4096),
  capturedAt: z.string().datetime().optional(),
  metadata: z.object({
    title: z.string().trim().max(1000).default(""),
    authors: z.array(z.string().trim().min(1).max(300)).max(50).default([]),
    abstract: z.string().trim().max(20_000).default(""),
    doi: z.string().trim().max(300).default(""),
    publishedDate: z.string().trim().max(100).default(""),
    keywords: z.array(z.string().trim().min(1).max(200)).max(30).default([]),
    sourceType: z.string().trim().max(80).default(""),
    publisher: z.string().trim().max(500).default(""),
    siteName: z.string().trim().max(300).default(""),
    extractionMethod: z.enum(["highwire", "json_ld", "dublin_core", "open_graph", "visible_text", "mixed"]).default("mixed"),
  }),
  visibleText: z.string().max(30_000).default(""),
});

type BrowserCapturePayload = z.infer<typeof browserCaptureSchema>;

async function findDuplicatePreviews(draft: PipelineDraft): Promise<DuplicatePreview[]> {
  const matches = await findDuplicateCandidates({
    title: draft.title,
    authors: draft.authors,
    doi: draft.doi,
    url: draft.url,
    year: draft.year,
  });
  if (matches.length === 0) return [];

  const rows = await db
    .select({
      id: resourcesTable.id,
      title: resourcesTable.title,
      authors: resourcesTable.authors,
      publishedDate: resourcesTable.publishedDate,
      status: resourcesTable.status,
    })
    .from(resourcesTable)
    .where(inArray(resourcesTable.id, matches.map((match) => match.candidateResourceId)));
  const byId = new Map(rows.map((row) => [row.id, row]));
  return matches.flatMap((match) => {
    const row = byId.get(match.candidateResourceId);
    return row ? [{ ...match, title: row.title, authors: row.authors, publishedDate: row.publishedDate, status: row.status }] : [];
  });
}

function computedTagIds(computed: ComputedTags): number[] {
  return [...new Set([...computed.themeTagIds, ...computed.assetTagIds, ...computed.jurisdictionTagIds, ...computed.candidateTagIds])];
}

export function computedTagScores(tags: TagSummary[]): Record<number, number> {
  return Object.fromEntries(tags.filter((tag) => Number.isFinite(tag.score)).map((tag) => [tag.id, tag.score as number]));
}

/** Resolves computed tag ids into displayable {slug, nameEn, nameZh, facet} rows for the confirm dialog. */
async function enrichTags(computed: ComputedTags): Promise<TagSummary[]> {
  const allIds = [...new Set([...computed.themeTagIds, ...computed.assetTagIds, ...computed.jurisdictionTagIds, ...computed.candidateTagIds])];
  if (allIds.length === 0) return [];
  const rows = await db.select().from(tagsTable).where(inArray(tagsTable.id, allIds));
  return rows.map((r) => ({ id: r.id, slug: r.slug, nameEn: r.nameEn, nameZh: r.nameZh, facet: r.facet, status: r.status, score: computed.themeTagScores[r.id] }));
}

/**
 * Shared core: extract -> resolveLink -> tag -> verify. Used by both the synchronous single
 * URL/PDF route and the async batch job processor below. Never writes to resources/resource_tags
 * — only reads, plus (via computeTagsForText) may create new candidate `tags` rows, which is
 * vocabulary maintenance, not exposing this draft resource to anyone.
 */
async function runAutoPipeline(rawText: string, sourceTypeHint: string, vocab: TagVocabulary, sourceUrl?: string | null, sourceEvidence = ""): Promise<PipelineResult> {
  const extracted = await extractFromText(rawText, sourceTypeHint, sourceEvidence);
  const linked = await resolveLink({ title: extracted.title, authors: extracted.authors, year: extracted.year, doi: extracted.doi });
  const title = normalizeResourceTitle(linked.found ? linked.title : extracted.title);
  // The fetched document is the primary source. Its verbatim abstract wins over index metadata;
  // when it has no explicit abstract, summarize the document itself before using index text.
  const generatedAbstract = extracted.abstract ? "" : await generateAbstractFromSourceText(title, rawText);
  const abstract = decodeAndCleanField(extracted.abstract || generatedAbstract || linked.abstract);
  const { keywords, keywordsSource } = await resolveKeywords(extracted.keywords, abstract, title);

  const authors = await resolveFullAuthorNames(
    extracted.authors,
    title,
    linked.doi ?? extracted.doi,
    [linked.authors],
  );
  const draft: PipelineDraft = {
    title,
    authors,
    year: linked.year ?? extracted.year,
    publishedDate: extracted.publishedDate ?? (linked.year != null ? String(linked.year) : null),
    abstract,
    doi: linked.doi ?? extracted.doi,
    url: linked.canonicalUrl ?? linked.fulltextUrl,
    // extracted.sourceType comes from the LLM reading the actual page/PDF text — trust it over
    // linked.sourceTypeHint, which only means "the academic-DB search didn't confidently match
    // this" (can happen to legitimate working papers due to search recall variance, not just
    // genuine news/opinion pieces) and would otherwise wrongly downgrade real papers to "News".
    sourceType: refineSourceType(extracted.sourceType, sourceUrl, title, rawText),
    keywords,
    keywordsSource,
  };

  const tagIds = await computeTagsForText({ title: draft.title, abstract: draft.abstract }, vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyResource({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract, keywords: draft.keywords });
  const missingRequired = missingSixElements({ title: draft.title, authors: draft.authors, year: draft.year, abstract: draft.abstract, url: draft.url, doi: draft.doi, keywords: draft.keywords });

  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb, missingRequired };
}

/** Extracts a DOI from either a bare DOI or a doi.org URL, trimming common citation punctuation. */
export function extractDoiFromInput(value: string): string | null {
  let decoded = value.trim();
  try { decoded = decodeURIComponent(decoded); } catch { /* keep the original text */ }
  const match = decoded.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
  return match ? match[0].replace(/[\s.,;:)>\]}]+$/g, "") : null;
}

function cnkiArticleUrl(doi: string | null): string | null {
  return doi && /\.cnki\./i.test(doi) ? `https://link.cnki.net/doi/${doi}` : null;
}

async function finishLinkedPipeline(
  linked: Awaited<ReturnType<typeof resolveLink>>,
  sourceTypeHint: string,
  vocab: TagVocabulary,
): Promise<PipelineResult> {
  let extracted: ExtractedDraft | null = null;
  let sourceText: string | null = null;
  // Always inspect an accessible original page, even when Crossref/OpenAlex already supplied an
  // abstract. This prevents an English index abstract from replacing a Chinese source abstract.
  const candidates = [...new Set([
    cnkiArticleUrl(linked.doi), linked.fulltextUrl, linked.canonicalUrl,
  ].filter((url): url is string => !!url))];
  for (const candidate of candidates.slice(0, 2)) {
    let text: string | null;
    try {
      text = await fetchPageText(candidate);
    } catch (error) {
      logger.warn({ error, candidate }, "Linked full-text source could not be read safely");
      continue;
    }
    if (!text) continue;
    sourceText = text;
    extracted = await extractFromText(text, sourceTypeHint);
    break;
  }

  const title = normalizeResourceTitle(linked.title || extracted?.title || "");
  const generatedAbstract = !extracted?.abstract && sourceText
    ? await generateAbstractFromSourceText(title, sourceText)
    : "";
  const abstract = decodeAndCleanField(extracted?.abstract || generatedAbstract || linked.abstract);
  const { keywords, keywordsSource } = await resolveKeywords(extracted?.keywords ?? [], abstract, title);
  const draft: PipelineDraft = {
    title,
    authors: linked.authors.length > 0 ? linked.authors : extracted?.authors ?? [],
    year: linked.year ?? extracted?.year ?? null,
    publishedDate: extracted?.publishedDate ?? (linked.year != null ? String(linked.year) : null),
    abstract,
    doi: linked.doi ?? extracted?.doi ?? null,
    url: linked.fulltextUrl ?? linked.canonicalUrl,
    sourceType: refineSourceType(
      extracted?.sourceType ?? (linked.sourceTypeHint === "News" ? "news" : sourceTypeHint),
      linked.fulltextUrl ?? linked.canonicalUrl,
      title,
      sourceText ?? "",
    ),
    keywords,
    keywordsSource,
  };
  const tagIds = await computeTagsForText({ title: draft.title, abstract: draft.abstract }, vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyResource({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract, keywords: draft.keywords });
  const missingRequired = missingSixElements({ title: draft.title, authors: draft.authors, year: draft.year, abstract: draft.abstract, url: draft.url, doi: draft.doi, keywords: draft.keywords });
  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb, missingRequired };
}

async function runUrlInputPipeline(input: string, sourceTypeHint: string, vocab: TagVocabulary): Promise<PipelineResult> {
  const doi = extractDoiFromInput(input);
  if (doi) {
    const linked = await resolveLink({ title: "", authors: [], year: null, doi });
    if (linked.found) return finishLinkedPipeline(linked, sourceTypeHint, vocab);
  }

  const normalizedUrl = doi ? `https://doi.org/${doi}` : (await assertSafePublicHttpUrl(input)).toString();
  let pageText: string | null;
  try {
    pageText = await fetchPageText(normalizedUrl);
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw new Error("PAGE_NOT_READABLE");
    throw error;
  }
  if (!pageText) throw new Error("PAGE_NOT_READABLE");
  const result = await runAutoPipeline(pageText, sourceTypeHint, vocab, normalizedUrl);
  if (!result.draft.url) result.draft.url = normalizedUrl;
  return result;
}

async function processBrowserCapture(payload: BrowserCapturePayload, vocab: TagVocabulary): Promise<PipelineResult> {
  const metadata = payload.metadata;
  const capturedDoi = extractDoiFromInput(metadata.doi || payload.pageUrl);
  let capturedDate: string | null = null;
  try {
    capturedDate = normalizePublicationDateInput(metadata.publishedDate || null);
  } catch {
    capturedDate = null;
  }
  const capturedYear = publicationYear(capturedDate);
  const capturedAuthors = [...new Set(metadata.authors.map((author) => decodeAndCleanField(author)).filter(Boolean))];
  const capturedTitle = normalizeResourceTitle(decodeAndCleanField(metadata.title));
  const sourceText = [
    capturedTitle ? `Title: ${capturedTitle}` : "",
    capturedAuthors.length ? `Authors: ${capturedAuthors.join("; ")}` : "",
    capturedDate ? `Published: ${capturedDate}` : "",
    metadata.publisher ? `Publisher: ${metadata.publisher}` : "",
    metadata.abstract ? `Abstract: ${metadata.abstract}` : "",
    metadata.keywords.length ? `Keywords: ${metadata.keywords.join("; ")}` : "",
    payload.visibleText,
  ].filter(Boolean).join("\n\n").slice(0, 30_000);

  const needsAi = !capturedTitle || capturedAuthors.length === 0 || !metadata.abstract || !capturedDate;
  const extracted = needsAi && sourceText.length >= 160
    ? await extractFromText(sourceText, normalizeSourceType(metadata.sourceType), `Browser metadata method: ${metadata.extractionMethod}`)
    : null;
  const linked = capturedDoi || capturedTitle
    ? await resolveLink({
        title: capturedTitle || extracted?.title || "",
        authors: capturedAuthors.length ? capturedAuthors : extracted?.authors ?? [],
        year: capturedYear ?? extracted?.year ?? null,
        doi: capturedDoi ?? extracted?.doi ?? null,
      })
    : {
        found: false,
        foundInScholarlyDb: false,
        title: "",
        authors: [],
        year: null,
        doi: null,
        abstract: null,
        canonicalUrl: null,
        fulltextUrl: null,
        accessStatus: "unknown",
        venue: null,
        sourceTypeHint: null,
      } as Awaited<ReturnType<typeof resolveLink>>;

  const title = normalizeResourceTitle(capturedTitle || linked.title || extracted?.title || "");
  const authors = await resolveFullAuthorNames(
    capturedAuthors.length ? capturedAuthors : linked.authors.length ? linked.authors : extracted?.authors ?? [],
    title,
    capturedDoi ?? linked.doi ?? extracted?.doi,
    [linked.authors, extracted?.authors ?? []],
  );
  const abstract = decodeAndCleanField(metadata.abstract || extracted?.abstract || linked.abstract);
  const explicitKeywords = normalizeKeywordList(metadata.keywords.length ? metadata.keywords : extracted?.keywords ?? []);
  const keywordResult = await resolveKeywords(explicitKeywords, abstract, title);
  const publishedDate = capturedDate
    ?? extracted?.publishedDate
    ?? (linked.year != null ? String(linked.year) : null);
  const year = publicationYear(publishedDate) ?? linked.year ?? extracted?.year ?? null;
  const sourceTypeHint = normalizeSourceType(metadata.sourceType || extracted?.sourceType || undefined);
  const draft: PipelineDraft = {
    title,
    authors,
    year,
    publishedDate,
    abstract,
    doi: capturedDoi ?? linked.doi ?? extracted?.doi ?? null,
    url: payload.pageUrl,
    sourceType: refineSourceType(sourceTypeHint, payload.pageUrl, title, sourceText),
    keywords: keywordResult.keywords,
    keywordsSource: metadata.keywords.length > 0 ? "extracted" : keywordResult.keywordsSource,
  };
  const tagIds = await computeTagsForText({ title: draft.title, abstract: draft.abstract }, vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyBrowserCapture({
    title: draft.title,
    authors: draft.authors,
    year: draft.year,
    doi: draft.doi,
    url: draft.url,
    abstract: draft.abstract,
    keywords: draft.keywords,
  });
  const missingRequired = missingSixElements({
    title: draft.title,
    authors: draft.authors,
    year: draft.year,
    abstract: draft.abstract,
    url: draft.url,
    doi: draft.doi,
    keywords: draft.keywords,
  });
  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb, missingRequired };
}

/**
 * POST /api/resources/upload/manual — must be logged in.
 * Body: { title, authors, year, abstract?, url?, doi?, sourceType }
 * User already typed everything (including the link) — skip extraction/resolveLink, go straight to tag + verify.
 */
router.post("/resources/upload/manual", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  try {
    const { title, authors, year, publishedDate, abstract, url, doi, sourceType, keywords: typedKeywords, tagIds: requestedTagIds } = req.body as {
      title?: string; authors?: string[]; year?: number | null; publishedDate?: string | null; abstract?: string; url?: string; doi?: string; sourceType?: string; keywords?: string[]; tagIds?: number[];
    };
    if (!title || typeof title !== "string") { res.status(400).json({ error: "title is required" }); return; }
    const normalizedTitle = normalizeResourceTitle(title);

    const normalizedUrl = typeof url === "string" && url.trim() ? normalizeResourceUrlInput(url) : null;
    let normalizedPublishedDate: string | null;
    try {
      normalizedPublishedDate = normalizePublicationDateInput(publishedDate ?? (year !== null && year !== undefined ? String(year) : null));
    } catch (error) {
      if (error instanceof InvalidPublicationDateError) { res.status(400).json({ error: error.message }); return; }
      throw error;
    }
    const normalizedYear = publicationYear(normalizedPublishedDate);
    const vocab = await loadTagVocabulary();
    const tagIds = await computeTagsForText({ title: normalizedTitle, abstract }, vocab);
    const autoTags = await enrichTags(tagIds);
    const requestedManualIds = Array.isArray(requestedTagIds)
      ? [...new Set(requestedTagIds.filter((id): id is number => Number.isInteger(id) && id > 0))].slice(0, 100)
      : [];
    const manualRows = requestedManualIds.length > 0
      ? await db.select().from(tagsTable).where(and(inArray(tagsTable.id, requestedManualIds), eq(tagsTable.status, "active")))
      : [];
    const manualTags: TagSummary[] = manualRows.map((tag) => ({
      id: tag.id, slug: tag.slug, nameEn: tag.nameEn, nameZh: tag.nameZh,
      facet: tag.facet, status: tag.status,
    }));
    const tags = [...manualTags, ...autoTags.filter((tag) => !manualRows.some((manual) => manual.id === tag.id))];
    const manualTagIds = manualRows.map((tag) => tag.id);
    // docs/planning/15 §5.3 — user-typed keywords win outright ('manual'); only fall back to
    // LLM generation from the abstract when the user left this blank.
    const manualKeywords = Array.isArray(typedKeywords) ? normalizeKeywordList(typedKeywords) : [];
    const { keywords, keywordsSource } = manualKeywords.length > 0
      ? { keywords: manualKeywords, keywordsSource: "manual" as const }
      : await resolveKeywords([], abstract ?? null, normalizedTitle);
    const report = await verifyResource({
      title: normalizedTitle, authors: authors ?? [], year: normalizedYear, doi: doi ?? null, url: normalizedUrl, abstract: abstract ?? null, keywords,
    });
    const missingRequired = missingSixElements(
      { title: normalizedTitle, authors: authors ?? [], year: normalizedYear, abstract: abstract ?? null, url: normalizedUrl, doi: doi ?? null, keywords },
    );

    const draft: PipelineDraft = { title: normalizedTitle, authors: authors ?? [], year: normalizedYear, publishedDate: normalizedPublishedDate, abstract: abstract ?? "", doi: doi ?? null, url: normalizedUrl, sourceType: refineSourceType(normalizeSourceType(sourceType), normalizedUrl, normalizedTitle), keywords, keywordsSource, manualTagIds };
    const duplicateCandidates = await findDuplicatePreviews(draft);
    const allowedTagIds = [...new Set([...computedTagIds(tagIds), ...manualTagIds])];
    const confirmationId = createUploadPreview(req.user.userId, allowedTagIds, computedTagScores(tags));
    res.json({
      draft,
      tagIds,
      tags,
      report,
      foundInScholarlyDb: false,
      missingRequired,
      duplicateCandidates,
      confirmationId,
    });
  } catch (err: any) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process manual entry" });
  }
});

/**
 * POST /api/resources/upload/url — must be logged in.
 * Body: { url, sourceType? }
 * Single URL/DOI — runs the full pipeline synchronously in one request (no upload_jobs row).
 */
router.post("/resources/upload/url", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  try {
    const { url, sourceType } = req.body as { url?: string; sourceType?: string };
    if (!url || typeof url !== "string") { res.status(400).json({ error: "A valid URL is required" }); return; }
    const vocab = await loadTagVocabulary();
    let result: PipelineResult;
    try {
      result = await runUrlInputPipeline(url, normalizeSourceType(sourceType), vocab);
    } catch (error) {
      if (!(error instanceof Error && error.message === "PAGE_NOT_READABLE")) throw error;
      res.status(422).json({ error: "This page could not be read automatically — it may be blocking automated requests. Try uploading the PDF directly, or use Add Manually." });
      return;
    }
    result.duplicateCandidates = await findDuplicatePreviews(result.draft);
    result.confirmationId = createUploadPreview(req.user.userId, computedTagIds(result.tagIds), computedTagScores(result.tags));
    res.json(result);
  } catch (err: any) {
    if (err instanceof UnsafeUrlError) { res.status(400).json({ error: err.message }); return; }
    req.log.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/**
 * POST /api/resources/upload/jobs/browser-capture
 * A Connector-only entry point. The browser has already read the page, so this route persists a
 * bounded, recoverable payload and lets the normal background worker perform enrichment, tagging,
 * duplicate detection and human-review preparation.
 */
router.post("/resources/upload/jobs/browser-capture", requireConnectorAuth, uploadWorkLimiter, async (req: any, res) => {
  const parsed = browserCaptureSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "The captured page metadata is invalid" }); return; }
  try {
    const safePageUrl = (await assertSafePublicHttpUrl(parsed.data.pageUrl)).toString();
    const payload: BrowserCapturePayload = {
      ...parsed.data,
      pageUrl: safePageUrl,
      metadata: {
        ...parsed.data.metadata,
        sourceType: normalizeSourceType(parsed.data.metadata.sourceType),
      },
    };
    const captureHash = createHash("sha256").update(JSON.stringify({
      pageUrl: payload.pageUrl,
      title: payload.metadata.title,
      doi: payload.metadata.doi,
    })).digest("hex");
    await enforceJobQuota(req.user.userId, 1);
    const hashExpression = sql<string>`${uploadJobsTable.input}->>'captureHash'`;
    const [existing] = await db.select({ id: uploadJobsTable.id, status: uploadJobsTable.status })
      .from(uploadJobsTable).where(and(
        eq(uploadJobsTable.createdBy, req.user.userId),
        eq(uploadJobsTable.type, "browser_capture"),
        eq(hashExpression, captureHash),
        inArray(uploadJobsTable.status, ["queued", "processing", "ready_for_review"]),
      )).limit(1);
    if (existing) {
      res.status(202).json({ jobId: existing.id, status: existing.status, duplicateSubmission: true });
      return;
    }
    const [job] = await db.insert(uploadJobsTable).values({
      type: "browser_capture",
      status: "queued",
      input: { payloadVersion: 1, captureHash, connectorSessionId: req.connectorSessionId, capture: payload },
      createdBy: req.user.userId,
    }).returning({ id: uploadJobsTable.id });
    enqueueStoredUploadJob(job.id);
    res.status(202).json({ jobId: job.id, status: "queued", duplicateSubmission: false });
  } catch (error) {
    sendUploadRouteError(error, req, res);
  }
});

// ── Batch / PDF jobs (upload_jobs-backed, resumable across a closed tab) ──────────────────────

async function claimQueuedJob(jobId: number): Promise<boolean> {
  const [claimed] = await db
    .update(uploadJobsTable)
    .set({ status: "processing", attempts: sql`${uploadJobsTable.attempts} + 1`, nextAttemptAt: null, error: null, updatedAt: new Date() })
    .where(and(eq(uploadJobsTable.id, jobId), eq(uploadJobsTable.status, "queued")))
    .returning({ id: uploadJobsTable.id });
  return !!claimed;
}

class UploadQuotaError extends Error {}

async function enforceJobQuota(userId: number, incomingJobs: number): Promise<void> {
  const activeSince = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const dailySince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [[active], [daily], [user]] = await Promise.all([
    db.select({ value: count() }).from(uploadJobsTable).where(and(
      eq(uploadJobsTable.createdBy, userId),
      inArray(uploadJobsTable.status, ["queued", "processing"]),
      gte(uploadJobsTable.updatedAt, activeSince),
    )),
    db.select({ value: count() }).from(uploadJobsTable).where(and(
      eq(uploadJobsTable.createdBy, userId),
      gte(uploadJobsTable.createdAt, dailySince),
    )),
    db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, userId)).limit(1),
  ]);
  const isAdmin = user?.role === "admin";
  const activeLimit = isAdmin ? 2_000 : 25;
  const dailyLimit = isAdmin ? 3_000 : 100;
  if (active.value + incomingJobs > activeLimit) throw new UploadQuotaError("Too many active upload jobs. Please wait for the current batch to finish.");
  if (daily.value + incomingJobs > dailyLimit) throw new UploadQuotaError("Daily upload limit reached. Please try again tomorrow.");
}

function sendUploadRouteError(error: unknown, req: any, res: any): void {
  if (error instanceof UploadQuotaError) { res.status(429).json({ error: error.message }); return; }
  if (error instanceof UnsafeUrlError) { res.status(400).json({ error: error.message }); return; }
  req.log.error(error);
  res.status(500).json({ error: "Failed to create upload jobs" });
}

/**
 * POST /api/resources/upload/jobs/pdf — must be logged in.
 * multipart/form-data, field "files" (1-5 PDFs), optional "sourceType".
 * Creates one upload_jobs row per file and returns immediately; processing continues server-side
 * even if the client disconnects, so progress survives a closed tab.
 */
router.post("/resources/upload/jobs/pdf", requireAuth, uploadWorkLimiter, handleUpload(pdfUpload.array("files", PDF_MAX_FILES), PDF_MAX_SIZE_MB, "PDF"), async (req: any, res) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) { res.status(400).json({ error: "At least one PDF file is required" }); return; }
  try {
    files.forEach((file) => { file.originalname = normalizeUploadFilename(file.originalname); });
    const sourceTypeHint = normalizeSourceType(req.body.sourceType);
    const folderImportId = (req.body.folderImportId as string) || null;
    const batchId = randomUUID();
    const preparedFiles: Array<{ file: Express.Multer.File; sha256: string }> = [];
    for (const file of files) {
      const handle = await open(file.path, "r");
      try {
        const header = Buffer.alloc(5);
        await handle.read(header, 0, header.length, 0);
        if (!header.equals(Buffer.from("%PDF-"))) throw new Error("The uploaded file is not a valid PDF");
      } finally {
        await handle.close();
      }
      const sha256 = createHash("sha256").update(await readFile(file.path)).digest("hex");
      preparedFiles.push({ file, sha256 });
    }

    const { jobs, duplicates, acceptedTempPaths } = await db.transaction(async (tx) => {
      const hashes = [...new Set(preparedFiles.map(({ sha256 }) => sha256))].sort();
      // Serialise identical submissions, including two clicks that arrive before React has had a
      // chance to disable the button. This keeps the check-and-insert operation genuinely atomic.
      for (const hash of hashes) {
        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${req.user.userId}:pdf:${hash}`}))`);
      }
      const hashExpression = sql<string>`${uploadJobsTable.input}->>'sha256'`;
      const existing = hashes.length > 0
        ? await tx.select({
            id: uploadJobsTable.id,
            status: uploadJobsTable.status,
            folderImportId: uploadJobsTable.folderImportId,
            hash: hashExpression,
          }).from(uploadJobsTable).where(and(
            eq(uploadJobsTable.createdBy, req.user.userId),
            eq(uploadJobsTable.type, "pdf"),
            inArray(uploadJobsTable.status, ["queued", "processing", "ready_for_review"]),
            inArray(hashExpression, hashes),
          ))
        : [];
      const existingByHash = new Map(existing.map((row) => [row.hash, row]));
      const seenThisRequest = new Set<string>();
      const fresh = preparedFiles.filter(({ sha256 }) => {
        if (existingByHash.has(sha256) || seenThisRequest.has(sha256)) return false;
        seenThisRequest.add(sha256);
        return true;
      });
      if (fresh.length > 0) await enforceJobQuota(req.user.userId, fresh.length);
      const inserted = fresh.length > 0
        ? await tx.insert(uploadJobsTable).values(fresh.map(({ file, sha256 }) => ({
            batchId,
            folderImportId,
            type: "pdf" as const,
            status: "queued" as const,
            input: { payloadVersion: 2, fileName: file.originalname, sourceTypeHint, tempFilePath: file.path, fileSize: file.size, sha256 },
            createdBy: req.user.userId,
          }))).returning({ id: uploadJobsTable.id })
        : [];
      const duplicateRows = preparedFiles.filter(({ sha256 }, index) =>
        existingByHash.has(sha256) || preparedFiles.findIndex((candidate) => candidate.sha256 === sha256) !== index,
      ).map(({ file, sha256 }) => ({
        fileName: file.originalname,
        existingJobId: existingByHash.get(sha256)?.id ?? null,
        status: existingByHash.get(sha256)?.status ?? "queued",
      }));
      return { jobs: inserted, duplicates: duplicateRows, acceptedTempPaths: new Set(fresh.map(({ file }) => file.path)) };
    });

    await Promise.all(preparedFiles
      .filter(({ file }) => !acceptedTempPaths.has(file.path))
      .map(({ file }) => rm(file.path, { force: true }).catch(() => undefined)));
    res.status(jobs.length > 0 ? 202 : 200).json({
      batchId,
      folderImportId,
      jobIds: jobs.map((j) => j.id),
      duplicates,
      acceptedCount: jobs.length,
      duplicateCount: duplicates.length,
    });
    jobs.forEach((job) => enqueueStoredUploadJob(job.id));
  } catch (error) {
    await Promise.all(files.map((file) => rm(file.path, { force: true }).catch(() => undefined)));
    sendUploadRouteError(error, req, res);
  }
});

const archiveUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.originalname.toLowerCase().endsWith(".zip")),
});

function normalizedReferenceKey(title: string, year: number | null): string {
  return `${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()}:${year ?? ""}`;
}

/** Unified ZIP import: PDF, Word/Markdown lists, and citation exports fan out into persisted jobs. */
router.post("/resources/upload/jobs/archive", requireAuth, uploadWorkLimiter, handleUpload(archiveUpload.single("file"), 100, "ZIP archive"), async (req: any, res) => {
  if (!req.file) { res.status(400).json({ error: "A ZIP archive is required" }); return; }
  try {
    const archiveEntries = readUploadArchive(req.file.buffer);
    // No archive bytes are written to disk or DB. Only bounded extracted text/parsed metadata below
    // survives this request, so releasing req.file.buffer deletes the original source immediately.
    const existing = await db.select({ title: resourcesTable.title, publishedDate: resourcesTable.publishedDate, doi: resourcesTable.doi }).from(resourcesTable);
    const existingDois = new Set(existing.map((row) => row.doi?.toLowerCase()).filter(Boolean));
    const existingTitles = new Set(existing.map((row) => normalizedReferenceKey(row.title, row.publishedDate ? Number(row.publishedDate.slice(0, 4)) : null)));
    const seen = new Set<string>();
    const seenPdfHashes = new Set<string>();
    const jobInputs: Array<{ type: "pdf" | "url" | "citation" | "title"; input: Record<string, unknown> }> = [];
    const skipped: Array<{ file: string; reason: string }> = [];
    const fallbackType = normalizeSourceType(req.body.sourceType);

    for (const entry of archiveEntries) {
      const ext = entry.name.toLowerCase().split(".").pop() ?? "";
      try {
        if (ext === "pdf") {
          if (entry.data.length > PDF_MAX_SIZE_MB * 1024 * 1024) { skipped.push({ file: entry.name, reason: `PDF exceeds ${PDF_MAX_SIZE_MB}MB` }); continue; }
          if (!entry.data.subarray(0, 5).equals(Buffer.from("%PDF-"))) { skipped.push({ file: entry.name, reason: "Invalid PDF" }); continue; }
          const hash = createHash("sha256").update(entry.data).digest("hex");
          if (seenPdfHashes.has(hash)) { skipped.push({ file: entry.name, reason: "Duplicate PDF in archive" }); continue; }
          seenPdfHashes.add(hash);
          const { text, metadata } = await extractPdfText(entry.data);
          if (text.trim().length < 100) { skipped.push({ file: entry.name, reason: "PDF has too little extractable text" }); continue; }
          jobInputs.push({ type: "pdf", input: { payloadVersion: 1, fileName: entry.name, sourceTypeHint: fallbackType, extractedText: text.slice(0, 20_000), pdfMetadata: metadata, sha256: hash } });
          continue;
        }
        if (["txt", "ent", "enw"].includes(ext)) {
          const records = parseCitationFile(entry.data).records;
          for (const record of records) {
            const key = record.doi?.toLowerCase() ?? normalizedReferenceKey(record.title, record.year);
            if (seen.has(key) || (record.doi && existingDois.has(record.doi.toLowerCase())) || existingTitles.has(normalizedReferenceKey(record.title, record.year))) continue;
            seen.add(key);
            jobInputs.push({ type: "citation", input: { payloadVersion: 1, fileName: entry.name, record } });
          }
          continue;
        }
        if (["docx", "md"].includes(ext)) {
          const text = extractListFileText(entry.data, entry.name);
          if (text.trim().length < 20) { skipped.push({ file: entry.name, reason: "Reference list has too little extractable text" }); continue; }
          if (text.length > MAX_REFERENCE_LIST_TEXT_CHARS) { skipped.push({ file: entry.name, reason: "Reference list is too long; split it into smaller Word files" }); continue; }
          jobInputs.push({
            type: "title",
            input: { payloadVersion: 1, taskKind: "reference_list", fileName: entry.name, sourceTypeHint: fallbackType, extractedText: text },
          });
          continue;
        }
        skipped.push({ file: entry.name, reason: "Unsupported file type" });
      } catch (error) {
        skipped.push({ file: entry.name, reason: error instanceof Error ? error.message : "Could not parse file" });
      }
    }

    if (jobInputs.length === 0) { res.status(422).json({ error: "No new supported resources were found", skipped }); return; }
    await enforceJobQuota(req.user.userId, jobInputs.length);
    const batchId = randomUUID();
    const folderImportId = randomUUID();
    const createdIds: number[] = [];
    for (let i = 0; i < jobInputs.length; i += 100) {
      const inserted = await db.insert(uploadJobsTable).values(jobInputs.slice(i, i + 100).map((item) => ({
        batchId, folderImportId, type: item.type, status: "queued" as const, input: item.input, createdBy: req.user.userId,
      }))).returning({ id: uploadJobsTable.id });
      createdIds.push(...inserted.map((row) => row.id));
    }
    createdIds.forEach(enqueueStoredUploadJob);
    res.status(202).json({ batchId, folderImportId, jobIds: createdIds, skipped, sourceFilesRetained: false });
  } catch (error) {
    sendUploadRouteError(error, req, res);
  }
});

/**
 * POST /api/resources/upload/jobs/url-batch — must be logged in.
 * Body: { urls: string[], sourceType? } (max 20). Same resumable-job pattern as the PDF route.
 */
const structuredReferenceSchema = z.object({
  title: z.string().trim().min(1).max(1_000),
  authors: z.array(z.string().trim().min(1).max(300)).max(100).default([]),
  year: z.number().int().min(1000).max(new Date().getFullYear() + 1).nullable().default(null),
  sourceType: z.enum(VALID_SOURCE_TYPES).default("journal_article"),
  urlOrDoi: z.string().trim().min(1).max(4_000),
});

router.post("/resources/upload/jobs/url-batch", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  try {
    const { urls, references, sourceType, folderImportId } = req.body as { urls?: string[]; references?: unknown[]; sourceType?: string; folderImportId?: string };
    const parsedReferences = Array.isArray(references)
      ? references.map((reference) => structuredReferenceSchema.safeParse(reference)).filter((result) => result.success).map((result) => result.data)
      : [];
    const plainUrls = Array.isArray(urls) ? urls.filter((url): url is string => typeof url === "string" && !!url.trim()) : [];
    if (plainUrls.length + parsedReferences.length === 0) { res.status(400).json({ error: "urls or references array is required" }); return; }
    if (plainUrls.length + parsedReferences.length > 20) { res.status(400).json({ error: "Maximum 20 URLs or references per batch" }); return; }
    const safeUrls = await Promise.all([...plainUrls, ...parsedReferences.map((reference) => reference.urlOrDoi)].map(async (url) => {
      const doi = extractDoiFromInput(url);
      return doi ? `https://doi.org/${doi}` : (await assertSafePublicHttpUrl(url)).toString();
    }));
    await enforceJobQuota(req.user.userId, safeUrls.length);
    const sourceTypeHint = normalizeSourceType(sourceType);
    const batchId = randomUUID();
    const inputs = [
      ...plainUrls.map((_url, index) => ({ payloadVersion: 1, url: safeUrls[index], sourceTypeHint })),
      ...parsedReferences.map((reference, index) => ({
        payloadVersion: 1,
        url: safeUrls[plainUrls.length + index],
        sourceTypeHint: normalizeSourceType(reference.sourceType ?? sourceType),
        reference,
      })),
    ];
    const jobs = await db
      .insert(uploadJobsTable)
      .values(inputs.map((input) => ({ batchId, folderImportId: folderImportId || null, type: "url" as const, status: "queued" as const, input, createdBy: req.user.userId })))
      .returning({ id: uploadJobsTable.id });

    res.status(202).json({ batchId, jobIds: jobs.map((j) => j.id) });
    jobs.forEach((job) => enqueueStoredUploadJob(job.id));
  } catch (error) {
    sendUploadRouteError(error, req, res);
  }
});

// ── Citation import (4th entry point: RefWorks/EndNote/NoteExpress exports — docs/planning/06/14) ──

const citationUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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
 * routing to 'incomplete' via the empty-abstract check in missingSixElements() rather than
 * silently making something up.
 */
async function backfillSourceMetadata(record: CitationRecord): Promise<{
  abstract: string;
  abstractSource: "cnki" | "generated_from_fulltext" | null;
  keywords: string[];
}> {
  // An exported abstract/keyword list is original bibliographic metadata and always wins.
  if (record.abstract && record.keywords.length > 0) {
    return { abstract: record.abstract, abstractSource: "cnki", keywords: record.keywords };
  }
  if (!record.url) {
    return {
      abstract: record.abstract || "",
      abstractSource: record.abstract ? "cnki" : null,
      keywords: record.keywords,
    };
  }

  let fullText: string | null = null;
  for (const candidate of [...new Set([cnkiArticleUrl(record.doi), record.url].filter((url): url is string => !!url))]) {
    // Source pages occasionally contain redirect loops or other unsafe redirect targets. That
    // should prevent us from trusting that page, but it must not discard an otherwise usable
    // bibliographic record or stop us from trying the next candidate source.
    fullText = await fetchPageText(candidate).catch((error) => {
      logger.warn({ error, candidate }, "Citation source text could not be fetched; continuing with available metadata");
      return null;
    });
    if (fullText) break;
  }
  if (!fullText) {
    return {
      abstract: record.abstract || "",
      abstractSource: record.abstract ? "cnki" : null,
      keywords: record.keywords,
    };
  }

  const extracted = await extractFromText(fullText, record.sourceType);
  const originalAbstract = record.abstract || extracted.abstract;
  const generatedAbstract = originalAbstract
    ? ""
    : await generateAbstractFromSourceText(record.title, fullText);
  return {
    abstract: originalAbstract || generatedAbstract,
    abstractSource: originalAbstract ? "cnki" : generatedAbstract ? "generated_from_fulltext" : null,
    keywords: record.keywords.length > 0 ? record.keywords : extracted.keywords,
  };
}

/** Shared per-record processing: tag + completeness-check a single parsed citation record. No resolveLink/network verification (docs/planning/06 §3 — CNKI's own metadata, including its DOI, is trusted as-is). */
async function processCitationRecord(record: CitationRecord, vocab: TagVocabulary): Promise<CitationJobResult> {
  // Citation exports are authoritative for the fields they contain, but often omit a link. Search
  // academic indexes using title+author+year and fill only gaps; never replace exported metadata.
  const linked = await resolveLink({ title: record.title, authors: record.authors, year: record.year, doi: record.doi });
  const enrichedRecord: CitationRecord = {
    ...record,
    authors: await resolveFullAuthorNames(record.authors, record.title, record.doi ?? linked.doi, [linked.authors]),
    year: record.year ?? linked.year,
    // Do not place index metadata ahead of the original linked page. The source backfill below
    // will inspect that page first and use linked.abstract only if the page cannot provide text.
    abstract: record.abstract || "",
    doi: record.doi ?? linked.doi,
    url: record.url ?? linked.canonicalUrl ?? linked.fulltextUrl,
  };
  const sourceMetadata = await backfillSourceMetadata(enrichedRecord);
  const abstract = decodeAndCleanField(sourceMetadata.abstract || linked.abstract);
  const abstractSource = sourceMetadata.abstractSource;
  // Source-supplied terms remain useful evidence, but the library presents the same compact
  // abstract-grounded 3-4 keyword vocabulary across CNKI, PDF, and URL import paths.
  const { keywords, keywordsSource } = await resolveKeywords(sourceMetadata.keywords, abstract, enrichedRecord.title);

  const draft: PipelineDraft = {
    title: enrichedRecord.title, authors: enrichedRecord.authors, year: enrichedRecord.year, abstract,
    publishedDate: enrichedRecord.year !== null ? String(enrichedRecord.year) : null,
    doi: enrichedRecord.doi,
    url: enrichedRecord.url,
    sourceType: refineSourceType(enrichedRecord.sourceType, enrichedRecord.url, enrichedRecord.title, abstract),
    keywords, keywordsSource,
  };

  // Tier 1 (docs/planning/06 §4): tagging input falls back to title+keywords when there's still no
  // abstract, instead of tagging on title alone.
  const tagIds = await computeTagsForText({ title: draft.title, abstract: draft.abstract || enrichedRecord.keywords.join(" ") }, vocab);
  const tags = await enrichTags(tagIds);
  const report = verifyCitationRecord({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract, keywords: draft.keywords });
  const missingRequired = missingSixElements({ title: draft.title, authors: draft.authors, year: draft.year, abstract: draft.abstract, url: draft.url, doi: draft.doi, keywords: draft.keywords });

  return { draft, tagIds, tags, report, missingRequired, abstractSource };
}

/**
 * POST /api/resources/upload/jobs/citation — must be logged in.
 * multipart/form-data, field "file" — one RefWorks/EndNote/NoteExpress export, auto-detected
 * (docs/planning/06 §2). Fans out into one upload_jobs row per parsed record, sharing a batchId
 * like the PDF/url-batch routes. 知网研学's own export format is encrypted and can't be parsed —
 * rejected upfront with a clear message asking for one of the other three formats instead.
 */
router.post("/resources/upload/jobs/citation", requireAuth, uploadWorkLimiter, handleUpload(citationUpload.single("file"), 5, "citation file"), async (req: any, res) => {
  if (!req.file) { res.status(400).json({ error: "A citation export file is required" }); return; }
  req.file.originalname = normalizeUploadFilename(req.file.originalname);

  let records: CitationRecord[];
  try {
    records = parseCitationFile(req.file.buffer).records;
  } catch (err: any) {
    if (err instanceof UnsupportedCitationFormatError) { res.status(400).json({ error: err.message }); return; }
    req.log.error(err);
    res.status(500).json({ error: "Failed to parse citation file" });
    return;
  }
  if (records.length === 0) { res.status(400).json({ error: "No citation records found in this file" }); return; }
  if (records.length > 20) { res.status(400).json({ error: "Maximum 20 citation records per file" }); return; }

  try {
    await enforceJobQuota(req.user.userId, records.length);
  } catch (error) {
    sendUploadRouteError(error, req, res);
    return;
  }

  const folderImportId = (req.body.folderImportId as string) || null;
  const batchId = randomUUID();
  const jobs = await db
    .insert(uploadJobsTable)
    .values(records.map((record) => ({ batchId, folderImportId, type: "citation" as const, status: "queued" as const, input: { payloadVersion: 1, fileName: req.file.originalname, record }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ batchId, jobIds: jobs.map((j) => j.id) });

  jobs.forEach((job) => enqueueStoredUploadJob(job.id));
});

// ── Unstructured reference-list sub-flow (docs/planning/14 §3.3) ────────────────────────────────

const listUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const MAX_REFERENCE_LIST_TEXT_CHARS = 250_000;
const MAX_REFERENCE_LIST_ENTRIES = 500;

class ReferenceListExpansionError extends Error {}

/**
 * POST /api/resources/upload/jobs/reference-list — must be logged in.
 * Accepts a Word/Markdown bibliography, persists its extracted text as one parent task, and returns
 * immediately. The queue later decomposes it and replaces the parent with one recoverable child job
 * per reference. No original document bytes are retained.
 */
router.post("/resources/upload/jobs/reference-list", requireAuth, uploadWorkLimiter, handleUpload(listUpload.single("file"), 5, "reference-list file"), async (req: any, res) => {
  if (!req.file) { res.status(400).json({ error: "A reference-list file is required" }); return; }
  try {
    req.file.originalname = normalizeUploadFilename(req.file.originalname);
    const sha256 = createHash("sha256").update(req.file.buffer).digest("hex");
    const extractedText = extractListFileText(req.file.buffer, req.file.originalname);
    if (extractedText.trim().length < 20) { res.status(422).json({ error: "This file has too little extractable text to parse" }); return; }
    if (extractedText.length > MAX_REFERENCE_LIST_TEXT_CHARS) {
      res.status(413).json({ error: "This reference list is too long. Split it into smaller Word files and upload them together." });
      return;
    }
    const batchId = randomUUID();
    const folderImportId = (req.body.folderImportId as string) || null;
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${req.user.userId}:reference-list:${sha256}`}))`);
      const ownHash = sql<string>`${uploadJobsTable.input}->>'sha256'`;
      const sourceHash = sql<string>`${uploadJobsTable.input}->>'sourceFileSha256'`;
      const [existing] = await tx.select({ id: uploadJobsTable.id, status: uploadJobsTable.status })
        .from(uploadJobsTable)
        .where(and(
          eq(uploadJobsTable.createdBy, req.user.userId),
          inArray(uploadJobsTable.status, ["queued", "processing", "ready_for_review"]),
          or(eq(ownHash, sha256), eq(sourceHash, sha256)),
        ))
        .limit(1);
      if (existing) return { job: null, duplicate: existing };
      await enforceJobQuota(req.user.userId, 1);
      const [job] = await tx.insert(uploadJobsTable).values({
        batchId,
        folderImportId,
        type: "title",
        status: "queued",
        input: {
          payloadVersion: 1,
          taskKind: "reference_list",
          fileName: req.file.originalname,
          sourceTypeHint: normalizeSourceType(req.body.sourceType),
          extractedText,
          sha256,
        },
        createdBy: req.user.userId,
      }).returning({ id: uploadJobsTable.id });
      return { job, duplicate: null };
    });

    if (!result.job) {
      res.status(200).json({
        batchId,
        folderImportId,
        jobIds: [],
        acceptedCount: 0,
        duplicateCount: 1,
        duplicates: [{ fileName: req.file.originalname, existingJobId: result.duplicate?.id, status: result.duplicate?.status }],
      });
      return;
    }
    res.status(202).json({ batchId, folderImportId, jobIds: [result.job.id], acceptedCount: 1, duplicateCount: 0, duplicates: [] });
    enqueueStoredUploadJob(result.job.id);
  } catch (error) {
    if (error instanceof UnsupportedListFormatError) { res.status(400).json({ error: error.message }); return; }
    sendUploadRouteError(error, req, res);
  }
});

/**
 * POST /api/resources/upload/jobs/unstructured-list/preview — must be logged in.
 * multipart/form-data, field "file" — one .md/.docx (see extractText.ts for why .doc/.wps are
 * rejected). Extracts text, runs the one-shot LLM decomposition, and returns the structured entries
 * for the frontend to show in an editable confirm table. No DB writes at all — this is a preview,
 * same tier as /upload/manual and /upload/url; nothing gets routed into a pipeline until the user
 * confirms the table (docs/planning/14 §3.3 point 3 — this is the "AI parses, human confirms" rule
 * applied to the new entry point, not an exception to it).
 */
router.post("/resources/upload/jobs/unstructured-list/preview", requireAuth, uploadWorkLimiter, handleUpload(listUpload.single("file"), 5, "reference-list file"), async (req: any, res) => {
  if (!req.file) { res.status(400).json({ error: "A reference-list file is required" }); return; }
  try {
    req.file.originalname = normalizeUploadFilename(req.file.originalname);
    const text = extractListFileText(req.file.buffer, req.file.originalname);
    if (text.trim().length < 20) { res.status(422).json({ error: "This file has too little extractable text to parse" }); return; }
    const entries = await decomposeReferenceListInChunks(text);
    res.json({ fileName: req.file.originalname, entries });
  } catch (err: any) {
    if (err instanceof UnsupportedListFormatError) { res.status(400).json({ error: err.message }); return; }
    req.log.error(err);
    res.status(500).json({ error: "Failed to parse reference-list file" });
  }
});

/**
 * Shared per-entry processing for title-only jobs: resolveLink()'s title-search path (no fetched
 * page text to re-extract from — the six elements already came from the list decomposition), then
 * tag + verify like every other entry point.
 *
 * sourceTypeHint is a fallback default only, same as every other entry point (PDF/URL trust the
 * LLM's read of the actual fetched text; citation trusts the file's own RT field) — it must NOT be
 * applied unconditionally. The one real signal available here is resolveLink()'s own
 * sourceTypeHint ("News" when the match came from a news-oriented search rather than a scholarly
 * DB), which takes priority when present.
 */
async function processTitleEntry(entry: { title: string; authors: string[]; year: number | null }, sourceTypeHint: string, vocab: TagVocabulary): Promise<PipelineResult> {
  const linked = await resolveLink({ title: entry.title, authors: entry.authors, year: entry.year, doi: null });
  if (linked.found) return finishLinkedPipeline(linked, sourceTypeHint, vocab);

  const { keywords, keywordsSource } = await resolveKeywords([], null, entry.title);
  const draft: PipelineDraft = {
    title: entry.title,
    authors: entry.authors,
    year: entry.year,
    publishedDate: entry.year !== null ? String(entry.year) : null,
    // No fetched page/PDF text exists for a title-search entry, so there's nothing to summarize an
    // abstract from — leaving it blank (routes to 'incomplete' via missingSixElements())
    // instead of fabricating one from the title, same rule as the citation entry's abstract backfill.
    abstract: "",
    doi: null,
    url: null,
    sourceType: sourceTypeHint,
    // When no trustworthy source can be found, keywords may still be suggested from the title and
    // remain visibly labelled as AI-generated. The abstract stays blank rather than being invented.
    keywords,
    keywordsSource,
  };
  const tagIds = await computeTagsForText({ title: draft.title }, vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyResource({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract, keywords: draft.keywords });
  const missingRequired = missingSixElements({ title: draft.title, authors: draft.authors, year: draft.year, abstract: draft.abstract, url: draft.url, doi: draft.doi, keywords: draft.keywords });
  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb, missingRequired };
}

/** Processes an editable Word/reference-list row without discarding its bibliographic identity. */
async function processStructuredReferenceEntry(entry: DecomposedEntry, vocab: TagVocabulary): Promise<PipelineResult> {
  const doi = entry.urlOrDoi ? extractDoiFromInput(entry.urlOrDoi) : null;
  const normalizedUrl = doi
    ? `https://doi.org/${doi}`
    : entry.urlOrDoi ? (await assertSafePublicHttpUrl(entry.urlOrDoi)).toString() : null;
  const linked = await resolveLink({ title: entry.title, authors: entry.authors, year: entry.year, doi });

  let extracted: ExtractedDraft | null = null;
  let sourceText: string | null = null;
  const candidates = [...new Set([
    cnkiArticleUrl(doi ?? linked.doi), linked.fulltextUrl, linked.canonicalUrl, normalizedUrl,
  ].filter((url): url is string => !!url))];
  for (const candidate of candidates.slice(0, 2)) {
    const text = await fetchPageText(candidate).catch(() => null);
    if (!text) continue;
    const candidateDraft = await extractFromText(text, entry.sourceType);
    if (!candidateDraft.title || titleOverlapScore(entry.title, candidateDraft.title) >= 0.45) {
      extracted = candidateDraft;
      sourceText = text;
      break;
    }
  }

  const generatedAbstract = !extracted?.abstract && sourceText
    ? await generateAbstractFromSourceText(entry.title, sourceText)
    : "";
  const abstract = decodeAndCleanField(extracted?.abstract || generatedAbstract || linked.abstract);
  const { keywords, keywordsSource } = await resolveKeywords(extracted?.keywords ?? [], abstract, entry.title);
  const authors = await resolveFullAuthorNames(
    entry.authors,
    entry.title,
    doi ?? linked.doi ?? extracted?.doi,
    [linked.authors, extracted?.authors ?? []],
  );
  const draft: PipelineDraft = {
    title: entry.title,
    authors,
    year: entry.year ?? linked.year ?? extracted?.year ?? null,
    publishedDate: extracted?.publishedDate ?? ((entry.year ?? linked.year) != null ? String(entry.year ?? linked.year) : null),
    abstract,
    doi: doi ?? linked.doi ?? extracted?.doi ?? null,
    url: linked.fulltextUrl ?? linked.canonicalUrl ?? normalizedUrl,
    sourceType: refineSourceType(entry.sourceType, linked.fulltextUrl ?? linked.canonicalUrl ?? normalizedUrl, entry.title, sourceText ?? ""),
    keywords,
    keywordsSource,
  };
  const tagIds = await computeTagsForText({ title: draft.title, abstract: draft.abstract }, vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyResource({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract, keywords: draft.keywords });
  const missingRequired = missingSixElements({ title: draft.title, authors: draft.authors, year: draft.year, abstract: draft.abstract, url: draft.url, doi: draft.doi, keywords: draft.keywords });
  return { draft, tagIds, tags, report, foundInScholarlyDb: linked.foundInScholarlyDb, missingRequired };
}

async function reenrichPipelineResult(stored: PipelineResult | CitationJobResult, vocab: TagVocabulary): Promise<PipelineResult> {
  const existing = stored.draft;
  let linkedResult: PipelineResult | null = null;
  const needsMetadata = !existing.url && !existing.doi || existing.authors.length === 0 || hasAbbreviatedAuthorName(existing.authors) || existing.year == null || !existing.abstract?.trim();
  if (needsMetadata && existing.title.trim()) {
    const linked = await resolveLink({ title: existing.title, authors: existing.authors, year: existing.year, doi: existing.doi });
    if (linked.found) linkedResult = await finishLinkedPipeline(linked, existing.sourceType, vocab);
  }

  const linkedDraft = linkedResult?.draft;
  let fetchedDraft: ExtractedDraft | null = null;
  let fetchedSourceText: string | null = null;
  if (!existing.abstract?.trim()) {
    const sourceCandidates = [...new Set([
      existing.url,
      linkedDraft?.url,
      existing.doi ? `https://doi.org/${existing.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, "")}` : null,
    ].filter((value): value is string => !!value))];
    for (const candidate of sourceCandidates.slice(0, 2)) {
      const sourceText = await fetchPageText(candidate).catch(() => null);
      if (!sourceText) continue;
      const extracted = await extractFromText(sourceText, existing.sourceType);
      const referenceTitle = existing.title || linkedDraft?.title || "";
      if (extracted.title && referenceTitle && titleOverlapScore(referenceTitle, extracted.title) < 0.45) continue;
      fetchedDraft = extracted;
      fetchedSourceText = sourceText;
      break;
    }
  }
  const generatedAbstract = !existing.abstract?.trim() && !fetchedDraft?.abstract && fetchedSourceText
    ? await generateAbstractFromSourceText(existing.title || linkedDraft?.title || "", fetchedSourceText)
    : "";
  const abstract = decodeAndCleanField(existing.abstract || fetchedDraft?.abstract || generatedAbstract || linkedDraft?.abstract);
  const keywordResult = existing.keywordsSource === "manual" && existing.keywords?.length
    ? { keywords: normalizeKeywordList(existing.keywords), keywordsSource: "manual" as const }
    : await resolveKeywords(
      fetchedDraft?.keywords?.length ? fetchedDraft.keywords : existing.keywords ?? [],
      abstract,
      existing.title || linkedDraft?.title || "",
    );
  const authors = await resolveFullAuthorNames(
    existing.authors,
    existing.title || linkedDraft?.title || "",
    existing.doi ?? fetchedDraft?.doi ?? linkedDraft?.doi,
    [linkedDraft?.authors ?? [], fetchedDraft?.authors ?? []],
  );
  const draft: PipelineDraft = {
    title: existing.title || linkedDraft?.title || "",
    authors,
    year: existing.year ?? fetchedDraft?.year ?? linkedDraft?.year ?? null,
    publishedDate: existing.publishedDate ?? fetchedDraft?.publishedDate ?? linkedDraft?.publishedDate ?? (existing.year !== null ? String(existing.year) : null),
    abstract,
    doi: existing.doi ?? fetchedDraft?.doi ?? linkedDraft?.doi ?? null,
    url: existing.url ?? linkedDraft?.url ?? null,
    sourceType: refineSourceType(existing.sourceType, existing.url ?? linkedDraft?.url, existing.title || linkedDraft?.title || "", fetchedSourceText ?? abstract),
    keywords: keywordResult.keywords,
    keywordsSource: keywordResult.keywordsSource,
  };
  const tagIds = await computeTagsForText({ title: draft.title, abstract: draft.abstract }, vocab);
  const tags = await enrichTags(tagIds);
  const report = await verifyResource({ title: draft.title, authors: draft.authors, year: draft.year, doi: draft.doi, url: draft.url, abstract: draft.abstract, keywords: draft.keywords });
  const missingRequired = missingSixElements({ title: draft.title, authors: draft.authors, year: draft.year, abstract: draft.abstract, url: draft.url, doi: draft.doi, keywords: draft.keywords });
  return {
    draft, tagIds, tags, report, missingRequired,
    foundInScholarlyDb: ("foundInScholarlyDb" in stored && !!stored.foundInScholarlyDb) || !!linkedResult?.foundInScholarlyDb,
  };
}

const MAX_JOB_ATTEMPTS = 5;

function managedPdfTempPath(input: Record<string, any>): string | null {
  const value = typeof input.tempFilePath === "string" ? input.tempFilePath : "";
  const prefix = `${tmpdir().replace(/\/$/, "")}/stablecoin-upload-`;
  return value.startsWith(prefix) && value.endsWith(".pdf") ? value : null;
}

async function extractStoredPdfText(jobId: number, input: Record<string, any>): Promise<{ text: string; metadata: PdfBibliographicMetadata }> {
  const tempFilePath = managedPdfTempPath(input);
  if (!tempFilePath) throw new Error("The uploaded PDF is no longer available for background processing");
  const buffer = await readFile(tempFilePath);
  if (!buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new Error("The uploaded file is not a valid PDF");
  const { text, usedOcr, metadata } = await extractPdfText(buffer);
  if (text.trim().length < 100) throw new Error("The PDF contains too little extractable text, including after OCR");
  // PDF text streams can contain NUL bytes (not valid inside PostgreSQL JSON strings). Keep the
  // readable text while removing only that unpersistable control character before retry storage.
  const extractedText = text.replace(/\u0000/g, "").slice(0, 20_000);
  const persistedInput: Record<string, any> = { ...input, payloadVersion: 2, extractedText, pdfMetadata: metadata, usedOcr };
  delete persistedInput.tempFilePath;
  await db.update(uploadJobsTable).set({ input: persistedInput, updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
  await rm(tempFilePath, { force: true }).catch(() => undefined);
  return { text: extractedText, metadata };
}

async function removeStoredPdfTempFile(input: Record<string, any>): Promise<void> {
  const tempFilePath = managedPdfTempPath(input);
  if (tempFilePath) await rm(tempFilePath, { force: true }).catch(() => undefined);
}

function mergeDrafts(primary: PipelineDraft, secondary: PipelineDraft): PipelineDraft {
  return {
    title: primary.title || secondary.title,
    authors: preferFullAuthorNames(primary.authors, [secondary.authors]),
    year: primary.year ?? secondary.year,
    publishedDate: primary.publishedDate ?? secondary.publishedDate ?? ((primary.year ?? secondary.year) != null ? String(primary.year ?? secondary.year) : null),
    abstract: primary.abstract?.trim() || secondary.abstract || "",
    doi: primary.doi ?? secondary.doi,
    url: primary.url ?? secondary.url,
    sourceType: primary.sourceType || secondary.sourceType,
    keywords: primary.keywords.length > 0 ? primary.keywords : secondary.keywords,
    keywordsSource: primary.keywords.length > 0 ? primary.keywordsSource : secondary.keywordsSource,
  };
}

async function mergeMatchingBatchJob(job: typeof uploadJobsTable.$inferSelect, result: PipelineResult, vocab: TagVocabulary): Promise<PipelineResult | null> {
  if (!job.folderImportId) return result;
  const siblings = await db.select().from(uploadJobsTable).where(and(
    eq(uploadJobsTable.folderImportId, job.folderImportId),
    eq(uploadJobsTable.status, "ready_for_review"),
  ));
  const currentKey = normalizedReferenceKey(result.draft.title, result.draft.year);
  const sibling = siblings.find((row) => {
    if (row.id === job.id || !row.result) return false;
    const other = (row.result as PipelineResult).draft;
    const exactDoi = !!result.draft.doi && !!other.doi && result.draft.doi.toLowerCase() === other.doi.toLowerCase();
    const sameTitle = currentKey === normalizedReferenceKey(other.title, other.year);
    return exactDoi || sameTitle;
  });
  if (!sibling?.result) return result;

  const siblingResult = sibling.result as PipelineResult;
  const keepSibling = sibling.type === "pdf" && job.type !== "pdf";
  const mergedDraft = keepSibling
    ? mergeDrafts(siblingResult.draft, result.draft)
    : mergeDrafts(result.draft, siblingResult.draft);
  const merged = await reenrichPipelineResult({ ...(keepSibling ? siblingResult : result), draft: mergedDraft }, vocab);
  if (keepSibling) {
    await db.update(uploadJobsTable).set({ result: merged, updatedAt: new Date() }).where(eq(uploadJobsTable.id, sibling.id));
    await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, job.id));
    return null;
  }
  await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, sibling.id));
  return merged;
}

/** Replaces one persisted Word/Markdown parent task with independently resumable reference jobs. */
async function expandReferenceListJob(job: typeof uploadJobsTable.$inferSelect, input: Record<string, any>): Promise<void> {
  const references = await decomposeReferenceListInChunks(input.extractedText);
  if (references.length === 0) throw new ReferenceListExpansionError("No references could be identified in this file.");
  if (references.length > MAX_REFERENCE_LIST_ENTRIES) {
    throw new ReferenceListExpansionError(`This file contains more than ${MAX_REFERENCE_LIST_ENTRIES} references. Split it into smaller Word files and upload them together.`);
  }
  // The parent row is replaced, not added to, so count only the net increase for quota purposes.
  await enforceJobQuota(job.createdBy, Math.max(0, references.length - 1));

  const childIds = await db.transaction(async (tx) => {
    // Deleting first makes a user cancellation win if it happened while AI parsing was in flight.
    const [removed] = await tx.delete(uploadJobsTable).where(and(
      eq(uploadJobsTable.id, job.id),
      eq(uploadJobsTable.status, "processing"),
    )).returning({ id: uploadJobsTable.id });
    if (!removed) return [] as number[];

    const values = references.map((reference) => {
      const sourceTypeHint = normalizeSourceType(reference.sourceType ?? input.sourceTypeHint);
      return {
        batchId: job.batchId,
        folderImportId: job.folderImportId,
        type: reference.urlOrDoi ? "url" as const : "title" as const,
        status: "queued" as const,
        input: reference.urlOrDoi
          ? { payloadVersion: 1, fileName: input.fileName, sourceFileSha256: input.sha256, sourceTypeHint, reference }
          : { payloadVersion: 1, fileName: input.fileName, sourceFileSha256: input.sha256, title: reference.title, authors: reference.authors, year: reference.year, sourceTypeHint },
        createdBy: job.createdBy,
      };
    });
    const ids: number[] = [];
    for (let index = 0; index < values.length; index += 100) {
      const inserted = await tx.insert(uploadJobsTable).values(values.slice(index, index + 100)).returning({ id: uploadJobsTable.id });
      ids.push(...inserted.map((row) => row.id));
    }
    return ids;
  });
  childIds.forEach(enqueueStoredUploadJob);
}

export async function runStoredUploadJob(jobId: number): Promise<void> {
  const [job] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, jobId)).limit(1);
  if (!job || job.status !== "queued" || !await claimQueuedJob(jobId)) return;
  const input = job.input as Record<string, any>;
  try {
    if (job.type === "title" && input.taskKind === "reference_list" && typeof input.extractedText === "string") {
      await expandReferenceListJob(job, input);
      return;
    }
    const vocab = await loadTagVocabulary();
    let result: PipelineResult;
    if (job.result && Array.isArray((job.result as any)?.missingRequired)) {
      result = await reenrichPipelineResult(job.result as PipelineResult, vocab);
    } else if (job.type === "browser_capture" && input.capture) {
      const parsedCapture = browserCaptureSchema.safeParse(input.capture);
      if (!parsedCapture.success) throw new Error("This browser capture has an invalid payload");
      result = await processBrowserCapture(parsedCapture.data, vocab);
    } else if (job.type === "pdf" && (typeof input.extractedText === "string" || managedPdfTempPath(input))) {
      const extracted = typeof input.extractedText === "string"
        ? { text: input.extractedText, metadata: input.pdfMetadata as PdfBibliographicMetadata | undefined }
        : await extractStoredPdfText(jobId, input);
      result = await runAutoPipeline(
        extracted.text,
        normalizeSourceType(input.sourceTypeHint),
        vocab,
        null,
        pdfSourceEvidence(extracted.metadata, typeof input.fileName === "string" ? input.fileName : undefined),
      );
    } else if (job.type === "url" && input.reference) {
      result = await processStructuredReferenceEntry(input.reference as DecomposedEntry, vocab);
    } else if (job.type === "url" && typeof input.url === "string") {
      result = await runUrlInputPipeline(input.url, normalizeSourceType(input.sourceTypeHint), vocab);
    } else if (job.type === "citation" && input.record) {
      const citationResult = await processCitationRecord(input.record as CitationRecord, vocab);
      result = { ...citationResult, foundInScholarlyDb: !!citationResult.draft.doi || !!citationResult.draft.url };
    } else if (job.type === "title" && typeof input.title === "string") {
      result = await processTitleEntry({ title: input.title, authors: Array.isArray(input.authors) ? input.authors : [], year: input.year ?? null }, normalizeSourceType(input.sourceTypeHint), vocab);
    } else {
      throw new Error("This legacy upload task has no recoverable payload");
    }

    const mergedResult = await mergeMatchingBatchJob(job, result, vocab);
    if (!mergedResult) return;
    result = mergedResult;
    result.duplicateCandidates = await findDuplicatePreviews(result.draft);
    const attempt = job.attempts + 1;
    // Keyword generation is grounded in the abstract. Retrying a record with no abstract can never
    // produce keywords, so surface it for human completion instead of leaving it in a delayed loop.
    const hasKeywordSource = Boolean(result.draft.abstract?.trim());
    if (hasKeywordSource && result.missingRequired.includes("keywords") && attempt < MAX_JOB_ATTEMPTS) {
      const delayMinutes = Math.min(30, 2 ** attempt);
      await db.update(uploadJobsTable).set({
        status: "queued", result, error: "AI keyword generation will retry automatically",
        nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000), updatedAt: new Date(),
      }).where(eq(uploadJobsTable.id, jobId));
      return;
    }
    await db.update(uploadJobsTable).set({
      status: "ready_for_review", result, error: null, completedAt: new Date(), updatedAt: new Date(),
    }).where(eq(uploadJobsTable.id, jobId));
  } catch (err: any) {
    logger.error({ err, jobId }, "Persisted upload job processing failed");
    const attempt = job.attempts + 1;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const monthlyAiCapReached = /monthly spending cap|project spend cap/i.test(errorMessage);
    const nonRetryable = err instanceof ReferenceListExpansionError || err instanceof UploadQuotaError || monthlyAiCapReached;
    if (!nonRetryable && attempt < 3) {
      await db.update(uploadJobsTable).set({
        status: "queued", error: "Temporary processing error; retry scheduled",
        nextAttemptAt: new Date(Date.now() + 2 ** attempt * 60_000), updatedAt: new Date(),
      }).where(eq(uploadJobsTable.id, jobId));
    } else {
      await db.update(uploadJobsTable).set({
        status: "failed", error: monthlyAiCapReached
          ? "Gemini monthly spending cap reached. Increase or reset the AI Studio cap, then retry this task."
          : err instanceof ReferenceListExpansionError || err instanceof UploadQuotaError || errorMessage.includes("legacy")
            ? errorMessage : "Processing failed after automatic retries. You can retry this task.",
        completedAt: new Date(), updatedAt: new Date(),
      }).where(eq(uploadJobsTable.id, jobId));
    }
  }
}

// The persisted retry scanner runs every minute. Keep one in-memory queue slot per job so a long
// backlog cannot accumulate duplicate no-op entries ahead of real work.
const scheduledUploadJobIds = new Set<number>();

export function enqueueStoredUploadJob(jobId: number): void {
  if (scheduledUploadJobIds.has(jobId)) return;
  scheduledUploadJobIds.add(jobId);
  uploadTaskQueue.enqueue(async () => {
    try {
      await runStoredUploadJob(jobId);
    } finally {
      scheduledUploadJobIds.delete(jobId);
    }
  });
}

async function hasRecoverableUploadPayload(job: typeof uploadJobsTable.$inferSelect): Promise<boolean> {
  const input = job.input as Record<string, any>;
  if (job.result && (job.result as PipelineResult).draft) return true;
  if (job.type === "pdf") {
    if (typeof input.extractedText === "string" && input.extractedText.trim().length > 0) return true;
    const tempFilePath = managedPdfTempPath(input);
    if (!tempFilePath) return false;
    return access(tempFilePath).then(() => true, () => false);
  }
  if (job.type === "url") return !!input.reference || typeof input.url === "string";
  if (job.type === "citation") return !!input.record;
  if (job.type === "browser_capture") return !!input.capture;
  if (job.type === "title" && input.taskKind === "reference_list") return typeof input.extractedText === "string";
  return job.type === "title" && typeof input.title === "string";
}

async function requeueFailedUploadJobs(jobs: (typeof uploadJobsTable.$inferSelect)[]): Promise<{ queued: number[]; skipped: { jobId: number; reason: string }[] }> {
  const queued: number[] = [];
  const skipped: { jobId: number; reason: string }[] = [];
  for (const job of jobs) {
    if (job.status !== "failed") {
      skipped.push({ jobId: job.id, reason: "not_failed" });
      continue;
    }
    if (!await hasRecoverableUploadPayload(job)) {
      skipped.push({ jobId: job.id, reason: "source_unavailable" });
      continue;
    }
    await db.update(uploadJobsTable).set({
      status: "queued", attempts: 0, nextAttemptAt: null, completedAt: null,
      error: "Retry queued", updatedAt: new Date(),
    }).where(and(eq(uploadJobsTable.id, job.id), eq(uploadJobsTable.status, "failed")));
    queued.push(job.id);
    enqueueStoredUploadJob(job.id);
  }
  return { queued, skipped };
}

/** Restores recoverable work after a deploy/restart and periodically picks up delayed retries. */
export async function resumePersistedUploadJobs(recoverInterrupted = false): Promise<void> {
  if (recoverInterrupted) {
    const processing = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.status, "processing"));
    for (const job of processing) {
      const recoverable = await hasRecoverableUploadPayload(job);
      await db.update(uploadJobsTable).set(recoverable
        ? { status: "queued", nextAttemptAt: new Date(), error: "Resumed after server restart", updatedAt: new Date() }
        : { status: "failed", error: "Legacy task was interrupted and has no recoverable payload", completedAt: new Date(), updatedAt: new Date() }
      ).where(eq(uploadJobsTable.id, job.id));
    }
  }
  const due = await db.select({ id: uploadJobsTable.id }).from(uploadJobsTable).where(and(
    eq(uploadJobsTable.status, "queued"),
    or(isNull(uploadJobsTable.nextAttemptAt), lte(uploadJobsTable.nextAttemptAt, new Date())),
  ));
  due.forEach((job) => enqueueStoredUploadJob(job.id));
}

/** Removes abandoned upload files without touching any PDF that a live/retryable job still owns. */
export async function cleanupOrphanedUploadTempFiles(): Promise<void> {
  const jobs = await db.select({ input: uploadJobsTable.input }).from(uploadJobsTable);
  const referenced = new Set(jobs
    .map((job) => managedPdfTempPath(job.input as Record<string, any>))
    .filter((path): path is string => !!path));
  const directory = tmpdir();
  const entries: Dirent[] = await readdir(directory, { withFileTypes: true }).catch(() => [] as Dirent[]);
  const staleBefore = Date.now() - 60 * 60_000;
  await Promise.all(entries
    .filter((entry) => entry.isFile() && entry.name.startsWith("stablecoin-upload-") && entry.name.endsWith(".pdf"))
    .map(async (entry) => {
      const path = `${directory.replace(/\/$/, "")}/${entry.name}`;
      if (referenced.has(path)) return;
      const details = await stat(path).catch(() => null);
      if (details && details.mtimeMs < staleBefore) await rm(path, { force: true }).catch(() => undefined);
    }));
}

/**
 * POST /api/resources/upload/jobs/title-batch — must be logged in.
 * Body: { entries: {title, authors, year}[], sourceType?, folderImportId? } — the confirmed rows
 * from the unstructured-list table that had no urlOrDoi (docs/planning/14 §3.3 point 4). Rows that
 * DID have a urlOrDoi are routed through the existing /jobs/url-batch route unchanged, not this one.
 */
router.post("/resources/upload/jobs/title-batch", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  const { entries, sourceType, folderImportId } = req.body as {
    entries?: { title?: string; authors?: string[]; year?: number | null; sourceType?: string }[];
    sourceType?: string;
    folderImportId?: string;
  };
  if (!Array.isArray(entries) || entries.length === 0) { res.status(400).json({ error: "entries array is required" }); return; }
  if (entries.length > 20) { res.status(400).json({ error: "Maximum 20 entries per batch" }); return; }
  const cleaned = entries
    .map((e) => ({
      title: (e.title ?? "").trim(),
      authors: Array.isArray(e.authors) ? e.authors : [],
      year: e.year ?? null,
      sourceTypeHint: normalizeSourceType(e.sourceType ?? sourceType),
    }))
    .filter((e) => e.title.length > 0);
  if (cleaned.length === 0) { res.status(400).json({ error: "No entries with a title" }); return; }
  const batchId = randomUUID();

  try {
    await enforceJobQuota(req.user.userId, cleaned.length);
  } catch (error) {
    sendUploadRouteError(error, req, res);
    return;
  }

  const jobs = await db
    .insert(uploadJobsTable)
    .values(cleaned.map((entry) => ({ batchId, folderImportId: folderImportId || null, type: "title" as const, status: "queued" as const, input: { payloadVersion: 1, ...entry }, createdBy: req.user.userId })))
    .returning({ id: uploadJobsTable.id });

  res.status(202).json({ batchId, jobIds: jobs.map((j) => j.id) });

  jobs.forEach((job) => enqueueStoredUploadJob(job.id));
});

/** Re-run enrichment for selected jobs. `force` reapplies the latest classification/tag rules. */
router.post("/resources/upload/jobs/reenrich", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  const parsed = z.object({
    jobIds: z.array(z.number().int().positive()).max(100).optional(),
    force: z.boolean().optional().default(false),
  }).safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: "jobIds must contain at most 100 task IDs" }); return; }
  try {
    const conditions = [eq(uploadJobsTable.createdBy, req.user.userId), inArray(uploadJobsTable.status, ["ready_for_review", "failed"] as const)];
    if (parsed.data.jobIds?.length) conditions.push(inArray(uploadJobsTable.id, parsed.data.jobIds));
    const jobs = await db.select().from(uploadJobsTable).where(and(...conditions));
    const retryable = jobs.filter((job) => !!job.result && (
      parsed.data.force || ((job.result as any).missingRequired?.length ?? 0) > 0
    ));
    for (const job of retryable) {
      await db.update(uploadJobsTable).set({
        status: "queued", attempts: 0, nextAttemptAt: null, completedAt: null,
        error: parsed.data.force ? "Applying latest classification rules" : "AI is filling missing fields",
        updatedAt: new Date(),
      }).where(eq(uploadJobsTable.id, job.id));
      enqueueStoredUploadJob(job.id);
    }
    res.status(202).json({ queued: retryable.map((job) => job.id) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to restart enrichment" });
  }
});

/** Retry one failed task using its persisted source metadata or extracted text. */
router.post("/resources/upload/jobs/:id/retry", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(uploadJobsTable).where(and(
      eq(uploadJobsTable.id, id),
      eq(uploadJobsTable.createdBy, req.user.userId),
    )).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    const result = await requeueFailedUploadJobs([job]);
    if (result.queued.length === 0) {
      const reason = result.skipped[0]?.reason;
      res.status(reason === "source_unavailable" ? 409 : 400).json({
        error: reason === "source_unavailable"
          ? "The original file is no longer available. Upload this file again."
          : "Only failed upload tasks can be retried.",
        ...result,
      });
      return;
    }
    res.status(202).json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to retry upload job" });
  }
});

/** Retry selected failed tasks, or all failed tasks owned by the user when no ids are supplied. */
router.post("/resources/upload/jobs/retry-failed", requireAuth, uploadWorkLimiter, async (req: any, res) => {
  const parsed = z.object({ jobIds: z.array(z.number().int().positive()).max(100).optional() }).safeParse(req.body ?? {});
  if (!parsed.success) { res.status(400).json({ error: "jobIds must contain at most 100 task IDs" }); return; }
  try {
    const conditions = [eq(uploadJobsTable.createdBy, req.user.userId), eq(uploadJobsTable.status, "failed")];
    if (parsed.data.jobIds?.length) conditions.push(inArray(uploadJobsTable.id, parsed.data.jobIds));
    const jobs = await db.select().from(uploadJobsTable).where(and(...conditions));
    res.status(202).json(await requeueFailedUploadJobs(jobs));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to retry upload jobs" });
  }
});

/**
 * GET /api/resources/upload/jobs — must be logged in. Lists the current user's own jobs, newest
 * first. Optional ?batchId= narrows to one batch; optional ?folderImportId= narrows to every
 * sub-batch spun up from one folder-import submission (docs/planning/14 §3.4) — this is how the
 * frontend resumes a combined "this folder import" progress view for a specific submission after a
 * closed/refreshed tab, instead of relying on ids kept only in page memory.
 */
router.get("/resources/upload/jobs", requireAuth, async (req: any, res) => {
  try {
    const batchId = req.query.batchId as string | undefined;
    const folderImportId = req.query.folderImportId as string | undefined;
    const conditions = [eq(uploadJobsTable.createdBy, req.user.userId)];
    if (batchId) conditions.push(eq(uploadJobsTable.batchId, batchId));
    if (folderImportId) conditions.push(eq(uploadJobsTable.folderImportId, folderImportId));
    const rows = await db.select().from(uploadJobsTable).where(and(...conditions)).orderBy(desc(uploadJobsTable.createdAt));
    const enriched = await Promise.all(rows.map(async (row) => {
      const result = row.result as PipelineResult | null;
      if (!result?.draft || row.status !== "ready_for_review") return row;
      const checkedAt = result.duplicateCandidatesCheckedAt ? Date.parse(result.duplicateCandidatesCheckedAt) : 0;
      if (Number.isFinite(checkedAt) && Date.now() - checkedAt < 5 * 60_000) return row;
      const enrichedResult = {
        ...result,
        duplicateCandidates: await findDuplicatePreviews(result.draft),
        duplicateCandidatesCheckedAt: new Date().toISOString(),
      };
      // Refresh at most every five minutes. This catches resources approved after a job was parsed
      // without making the queue's three-second status poll repeatedly scan the library.
      await db.update(uploadJobsTable).set({ result: enrichedResult, updatedAt: new Date() }).where(eq(uploadJobsTable.id, row.id));
      return { ...row, result: enrichedResult };
    }));
    res.json(enriched);
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
    const result = job.result as PipelineResult | null;
    const checkedAt = result?.duplicateCandidatesCheckedAt ? Date.parse(result.duplicateCandidatesCheckedAt) : 0;
    if (result?.draft && job.status === "ready_for_review" && (!Number.isFinite(checkedAt) || Date.now() - checkedAt >= 5 * 60_000)) {
      const enrichedResult = {
        ...result,
        duplicateCandidates: await findDuplicatePreviews(result.draft),
        duplicateCandidatesCheckedAt: new Date().toISOString(),
      };
      await db.update(uploadJobsTable).set({ result: enrichedResult, updatedAt: new Date() }).where(eq(uploadJobsTable.id, job.id));
      res.json({ ...job, result: enrichedResult });
      return;
    }
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
  publishedDate?: string | null;
  abstract?: string | null;
  url?: string | null;
  doi?: string | null;
  sourceType: typeof VALID_SOURCE_TYPES[number];
  tagIds?: number[];
  manualTagIds?: number[];
  /** Accepted for backwards compatibility but never trusted; scores come from the server preview/job. */
  tagScores?: Record<number, number>;
  keywords?: string[];
  keywordsSource?: KeywordsSource | null;
  confirmationId?: string;
}

const confirmInputSchema = z.object({
  title: z.string().trim().min(1).max(1_000),
  authors: z.array(z.string().trim().min(1).max(300)).max(100).default([]),
  year: z.number().int().min(1000).max(new Date().getFullYear() + 1).nullable().default(null),
  publishedDate: z.string().trim().max(10).nullable().optional().refine((value) => {
    try { normalizePublicationDateInput(value); return true; } catch { return false; }
  }, "Invalid publication date"),
  abstract: z.string().max(100_000).nullable().optional(),
  url: z.string().trim().max(4_000).nullable().optional(),
  doi: z.string().trim().max(500).nullable().optional(),
  sourceType: z.enum(VALID_SOURCE_TYPES),
  tagIds: z.array(z.number().int().positive()).max(100).optional(),
  manualTagIds: z.array(z.number().int().positive()).max(100).optional(),
  tagScores: z.record(z.string(), z.number()).optional(),
  keywords: z.array(z.string().trim().min(1).max(300)).max(50).optional(),
  keywordsSource: z.enum(["extracted", "generated", "manual"]).nullable().optional(),
  confirmationId: z.string().min(20).max(200).optional(),
});

class ConfirmValidationError extends Error {}
class ConfirmConflictError extends Error {}

export function parseConfirmInput(value: unknown): ConfirmInput {
  const parsed = confirmInputSchema.safeParse(value);
  if (!parsed.success) throw new ConfirmValidationError("The confirmation data is invalid");
  return {
    ...parsed.data,
    authors: [...new Set(parsed.data.authors.map((author) => author.trim()))],
    keywords: normalizeKeywordList(parsed.data.keywords ?? []),
    abstract: parsed.data.abstract?.trim() || null,
    publishedDate: normalizePublicationDateInput(parsed.data.publishedDate ?? (parsed.data.year !== null ? String(parsed.data.year) : null)),
    url: parsed.data.url ? normalizeResourceUrlInput(parsed.data.url) : null,
    doi: parsed.data.doi?.trim() || null,
  };
}

export async function validateConfirmedTags(requestedIds: number[], allowedIds: number[], serverScores: Record<number, number>) {
  const requested = [...new Set(requestedIds)];
  const allowed = new Set(allowedIds);
  if (requested.some((id) => !allowed.has(id))) throw new ConfirmValidationError("One or more submitted tags were not part of the server preview");
  if (requested.length === 0) return { tagIds: [] as number[], tagScores: {} as Record<number, number> };

  const activeRows = await db
    .select({ id: tagsTable.id })
    .from(tagsTable)
    .where(and(inArray(tagsTable.id, requested), eq(tagsTable.status, "active")));
  const activeIds = activeRows.map((row) => row.id);
  const scores = Object.fromEntries(activeIds.flatMap((id) => Number.isFinite(serverScores[id]) ? [[id, serverScores[id]]] : []));
  return { tagIds: activeIds, tagScores: scores };
}

/** True if any of the given tag ids is a theme-facet tag — used for the off_topic check. */
async function hasThemeFacetTag(tagIds: number[]): Promise<boolean> {
  if (tagIds.length === 0) return false;
  const [row] = await db.select({ id: tagsTable.id }).from(tagsTable).where(and(inArray(tagsTable.id, tagIds), eq(tagsTable.facet, "theme"))).limit(1);
  return !!row;
}

/**
 * Shared persist step for both confirm routes below — this is the explicit user confirmation the
 * two-step AI-import rule requires. A preview without a theme tag is persisted as off_topic so a
 * false positive can be appealed from My Contributions, but it cannot enter admin review or the
 * public library unless the owner explains and resubmits it. `resources.status` is still never
 * 'failed' — that state belongs to upload_jobs.
 *
 * skipNetworkVerification is for citation-import entries (docs/planning/14 §2): CNKI's own metadata
 * is trusted as-is, so re-running the network-based verifyResource() here (DOI resolution + URL
 * reachability) would just be re-verifying CNKI against itself — and does so badly, since CNKI's
 * Chinese-journal DOIs mostly aren't in Crossref/OpenAlex and link.cnki.net blocks bot HEAD/GET
 * requests, so every citation entry would spuriously fail verification regardless of how complete
 * the record actually is.
 */
export async function persistConfirmedDraft(
  input: ConfirmInput,
  userId: number,
  skipNetworkVerification: boolean = false,
  jobId?: number,
  verifiedReport?: VerifyReport,
) {
  const authors = input.authors ?? [];
  const year = input.year ?? null;
  const publishedDate = normalizePublicationDateInput(input.publishedDate ?? (year !== null ? String(year) : null));
  const url = input.url ? (await assertSafePublicHttpUrl(input.url)).toString() : null;
  const doi = input.doi ?? null;
  const abstract = input.abstract ?? null;
  const tagIds = input.tagIds ?? [];
  const manualTagIds = new Set((input.manualTagIds ?? []).filter((tagId) => tagIds.includes(tagId)));
  const tagScores = input.tagScores ?? {};
  const keywords = input.keywords ?? [];
  // Invariant: a non-null source only ever pairs with a non-empty array. Falls back to 'manual'
  // rather than null if the client somehow sent keywords without a source — under normal use this
  // never happens, since every code path that produces non-empty keywords also sets a source.
  const keywordsSource = keywords.length > 0 ? (input.keywordsSource ?? "manual") : null;

  const missingFields = missingSixElements({ title: input.title, authors, year, abstract, url, doi, keywords });
  const verifyInput = { title: input.title, authors, year, doi, url, abstract, keywords };
  const report = verifiedReport ?? (skipNetworkVerification ? verifyCitationRecord(verifyInput) : await verifyResource(verifyInput));
  const hasThemeTag = await hasThemeFacetTag(tagIds);
  // Generate this before opening the transaction. It is only used if duplicate/completeness checks
  // do not take priority and the record is ultimately classified as off-topic.
  const possibleOffTopicExplanation = !hasThemeTag
    ? await generateOffTopicExplanation(input.title, abstract)
    : null;

  return db.transaction(async (tx) => {
    // Serialize confirmations that share any stable identity. This closes the race where two tabs
    // both passed the pre-insert duplicate check and then inserted the same DOI/URL/title.
    const identityLocks = [
      doi ? `doi:${doi.toLowerCase()}` : null,
      url ? `url:${url.toLowerCase()}` : null,
      `title:${normalizedReferenceKey(input.title, year)}`,
    ].filter((value): value is string => !!value).sort();
    for (const identity of identityLocks) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${identity}))`);
    }

    const duplicateMatches = await findDuplicateCandidates({ title: input.title, authors, doi, url, year }, undefined, tx);
    const duplicateSignal: DuplicateSignal = duplicateMatches.some((match) => match.matchType !== "fuzzy_title")
      ? "exact"
      : duplicateMatches.length > 0 ? "fuzzy" : null;
    const status = classifyStatus({ duplicateSignal, missingFields, hasThemeTag, report });
    const offTopicExplanation = status === "off_topic" ? possibleOffTopicExplanation : null;

    if (jobId !== undefined) {
      const [claimedJob] = await tx
        .delete(uploadJobsTable)
        .where(and(
          eq(uploadJobsTable.id, jobId),
          eq(uploadJobsTable.createdBy, userId),
          eq(uploadJobsTable.status, "ready_for_review"),
        ))
        .returning({ id: uploadJobsTable.id });
      if (!claimedJob) throw new ConfirmConflictError("This upload job was already confirmed or is no longer available");
    }

    const [inserted] = await tx
      .insert(resourcesTable)
      .values({
        title: input.title,
        authors,
        sourceType: input.sourceType,
        url,
        doi,
        abstract,
        keywords,
        keywordsSource,
        publishedDate,
        status,
        createdBy: userId,
        verificationReport: report,
        verifiedAt: new Date(),
        offTopicExplanation,
      })
      .returning();

    await syncResourceAuthors(inserted.id, inserted.authors, tx);

    if (tagIds.length > 0) {
      await tx.insert(resourceTagsTable).values(tagIds.map((tagId) => ({
        resourceId: inserted.id,
        tagId,
        source: manualTagIds.has(tagId) ? "manual" as const : "auto" as const,
        score: manualTagIds.has(tagId) ? null : tagScores[tagId] ?? null,
      }))).onConflictDoNothing();
    }

    if (status === "duplicate" && duplicateMatches.length > 0) {
      await tx.insert(duplicateCandidatesTable).values(
        duplicateMatches.map((m) => ({ resourceId: inserted.id, candidateResourceId: m.candidateResourceId, matchType: m.matchType })),
      );
    }

    return inserted;
  });
}

/** Shared error handling for both confirm routes below. */
function handleConfirmError(err: any, req: any, res: any) {
  if (err instanceof ConfirmValidationError) { res.status(400).json({ error: err.message }); return; }
  if (err instanceof ConfirmConflictError) { res.status(409).json({ error: err.message }); return; }
  if (err instanceof UnsafeUrlError) { res.status(400).json({ error: err.message }); return; }
  req.log.error(err);
  res.status(500).json({ error: "Failed to confirm upload" });
}

/**
 * POST /api/resources/upload/confirm — must be logged in.
 * Body: the (possibly user-edited) final draft + tag ids, from the synchronous manual/single-URL
 * preview (POST /upload/manual or /upload/url). No upload_jobs row involved — this is the
 * confirm step for the in-memory pipeline. Always inserts (docs/planning/15 §0.8) — a missing
 * URL/DOI here now routes to 'incomplete' like any other entry point, not a rejected confirm.
 */
router.post("/resources/upload/confirm", requireAuth, async (req: any, res) => {
  try {
    const input = parseConfirmInput(req.body);
    if (!input.confirmationId) throw new ConfirmValidationError("This preview has expired. Please run the preview again.");
    const preview = consumeUploadPreview(input.confirmationId, req.user.userId);
    if (!preview) throw new ConfirmValidationError("This preview has expired or was already confirmed. Please run the preview again.");
    const validatedTags = await validateConfirmedTags(input.tagIds ?? [], preview.tagIds, preview.tagScores);
    input.tagIds = validatedTags.tagIds;
    input.tagScores = validatedTags.tagScores;
    const inserted = await persistConfirmedDraft(input, req.user.userId);
    res.status(201).json(inserted);
  } catch (err: any) {
    handleConfirmError(err, req, res);
  }
});

/**
 * POST /api/resources/upload/jobs/:id/confirm — must be logged in, owner only.
 * Body: the (possibly user-edited) final draft + tag ids. Persists the real resources row here —
 * this is the explicit user confirmation the two-step AI-import rule requires. Serves every job
 * type (pdf/url/citation/title) identically now that there's no per-entry-kind hard-required
 * distinction (docs/planning/15 §0.8) — only citation entries still skip network re-verification.
 */
router.post("/resources/upload/jobs/:id/confirm", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(uploadJobsTable).where(and(eq(uploadJobsTable.id, id), eq(uploadJobsTable.createdBy, req.user.userId))).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.status !== "ready_for_review") { res.status(400).json({ error: `Job is not ready for review (status: ${job.status})` }); return; }

    const input = parseConfirmInput(req.body);
    const jobResult = job.result as PipelineResult | null;
    if (!jobResult) throw new ConfirmValidationError("The upload job has no review result");
    const allowedTagIds = jobResult.tags.map((tag) => tag.id);
    const validatedTags = await validateConfirmedTags(input.tagIds ?? [], allowedTagIds, computedTagScores(jobResult.tags));
    input.tagIds = validatedTags.tagIds;
    input.tagScores = validatedTags.tagScores;

    const inserted = await persistConfirmedDraft(
      input,
      req.user.userId,
      job.type === "citation" || job.type === "browser_capture",
      id,
      job.type === "browser_capture" ? jobResult.report : undefined,
    );
    res.status(201).json(inserted);
  } catch (err: any) {
    handleConfirmError(err, req, res);
  }
});

const bulkConfirmSchema = z.object({
  jobIds: z.array(z.number().int().positive()).min(1).max(100),
});

/**
 * POST /api/resources/upload/jobs/confirm-complete — one human action submits every selected job
 * whose stored AI result already has all six required elements and no failed verification check.
 * Incomplete/disputed-looking rows stay in upload_jobs for individual review.
 */
router.post("/resources/upload/jobs/confirm-complete", requireAuth, async (req: any, res) => {
  const parsed = bulkConfirmSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Select between 1 and 100 upload jobs" }); return; }

  try {
    const requestedIds = [...new Set(parsed.data.jobIds)];
    const jobs = await db.select().from(uploadJobsTable).where(and(
      eq(uploadJobsTable.createdBy, req.user.userId),
      eq(uploadJobsTable.status, "ready_for_review"),
      inArray(uploadJobsTable.id, requestedIds),
    ));
    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const confirmed: { jobId: number; resourceId: number; status: string }[] = [];
    const skipped: { jobId: number; reason: string }[] = [];

    for (const jobId of requestedIds) {
      const job = jobsById.get(jobId);
      const result = job?.result as PipelineResult | null | undefined;
      if (!job || !result?.draft) { skipped.push({ jobId, reason: "not_ready" }); continue; }

      const draft = result.draft;
      const missing = missingSixElements({
        title: draft.title,
        authors: draft.authors,
        year: draft.year,
        abstract: draft.abstract,
        url: draft.url,
        doi: draft.doi,
        keywords: draft.keywords ?? [],
      });
      if (missing.length > 0) { skipped.push({ jobId, reason: `missing:${missing.join(",")}` }); continue; }
      if (result.report?.hasFailure) { skipped.push({ jobId, reason: "verification_failed" }); continue; }
      if (!result.tags.some((tag) => tag.facet === "theme")) { skipped.push({ jobId, reason: "off_topic" }); continue; }
      const duplicateMatches = await findDuplicateCandidates({
        title: draft.title,
        authors: draft.authors,
        doi: draft.doi,
        url: draft.url,
        year: draft.year,
      });
      if (duplicateMatches.length > 0) {
        const refreshedResult = {
          ...result,
          duplicateCandidates: await findDuplicatePreviews(draft),
          duplicateCandidatesCheckedAt: new Date().toISOString(),
        };
        await db.update(uploadJobsTable).set({ result: refreshedResult, updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
        skipped.push({ jobId, reason: "duplicate" });
        continue;
      }

      try {
        const input = parseConfirmInput({
          ...draft,
          tagIds: result.tags.map((tag) => tag.id),
        });
        const validatedTags = await validateConfirmedTags(input.tagIds ?? [], result.tags.map((tag) => tag.id), computedTagScores(result.tags));
        input.tagIds = validatedTags.tagIds;
        input.tagScores = validatedTags.tagScores;
        const inserted = await persistConfirmedDraft(
          input,
          req.user.userId,
          job.type === "citation" || job.type === "browser_capture",
          job.id,
          result.report,
        );
        confirmed.push({ jobId, resourceId: inserted.id, status: inserted.status });
      } catch (error) {
        req.log.error({ error, jobId }, "Bulk upload confirmation failed for one job");
        skipped.push({ jobId, reason: "confirmation_failed" });
      }
    }

    res.json({ confirmed, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit complete upload jobs" });
  }
});

const bulkJobIdsSchema = z.object({
  jobIds: z.array(z.number().int().positive()).min(1).max(100),
});

/** Delete selected review jobs only when a live library check confirms they are duplicates. */
router.post("/resources/upload/jobs/delete-duplicates", requireAuth, async (req: any, res) => {
  const parsed = bulkJobIdsSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Select between 1 and 100 upload jobs" }); return; }
  try {
    const requestedIds = [...new Set(parsed.data.jobIds)];
    const jobs = await db.select().from(uploadJobsTable).where(and(
      eq(uploadJobsTable.createdBy, req.user.userId),
      eq(uploadJobsTable.status, "ready_for_review"),
      inArray(uploadJobsTable.id, requestedIds),
    ));
    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const deleted: number[] = [];
    const skipped: { jobId: number; reason: string }[] = [];
    for (const jobId of requestedIds) {
      const job = jobsById.get(jobId);
      const result = job?.result as PipelineResult | null | undefined;
      if (!job || !result?.draft) { skipped.push({ jobId, reason: "not_ready" }); continue; }
      const duplicates = await findDuplicatePreviews(result.draft);
      if (duplicates.length === 0) {
        const refreshedResult = { ...result, duplicateCandidates: [], duplicateCandidatesCheckedAt: new Date().toISOString() };
        await db.update(uploadJobsTable).set({ result: refreshedResult, updatedAt: new Date() }).where(eq(uploadJobsTable.id, jobId));
        skipped.push({ jobId, reason: "not_duplicate" });
        continue;
      }
      if (job.type === "pdf") await removeStoredPdfTempFile(job.input as Record<string, any>);
      await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, jobId));
      deleted.push(jobId);
    }
    res.json({ deleted, skipped });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete duplicate upload jobs" });
  }
});

/** DELETE /api/resources/upload/jobs/:id — must be logged in, owner only. Discards a job without persisting. */
router.delete("/resources/upload/jobs/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [job] = await db.select().from(uploadJobsTable).where(and(eq(uploadJobsTable.id, id), eq(uploadJobsTable.createdBy, req.user.userId))).limit(1);
    if (!job) { res.status(404).json({ error: "Not found" }); return; }
    if (job.type === "pdf") await removeStoredPdfTempFile(job.input as Record<string, any>);
    await db.delete(uploadJobsTable).where(eq(uploadJobsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to discard upload job" });
  }
});

export default router;
