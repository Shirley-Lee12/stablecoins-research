import { searchCrossref } from "./crossref";
import { searchOpenAlex } from "./openalex";
import { searchSemanticScholar } from "./semanticscholar";
import { resolveDoi } from "./doi";
import { unpaywall } from "./unpaywall";
import { generateJsonWithSearch } from "../llm";
import { titleOverlapScore, authorOverlapCount, surnameOf } from "./matching";
import type { ScholarResult, AccessStatus } from "./types";

export interface ResolveLinkInput {
  title: string;
  authors: string[];
  year: number | null;
  /**
   * Optional — pass this when extraction already found a DOI printed on the document. resolveLink
   * then verifies it directly via resolveDoi() (DOI content negotiation), which is exact, instead
   * of running it through the same title-similarity waterfall as DOI-unknown inputs. Only falls
   * back to that waterfall if there's no DOI here, or the DOI fails to resolve (e.g. typo'd).
   */
  doi?: string | null;
}

export interface ResolveLinkResult {
  found: boolean;
  foundInScholarlyDb: boolean;
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  canonicalUrl: string | null;
  fulltextUrl: string | null;
  accessStatus: AccessStatus;
  venue: string | null;
  /** Set when the match came from the web-search fallback — those are usually news/opinion, not papers. */
  sourceTypeHint: "News" | null;
}

/** Strips PDF figure-caption/page-number pollution (e.g. "Image: Getty images...", trailing "1–12") before searching. */
export function cleanTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\bImage:\s*[^.]*?(getty|istock|shutterstock|reuters|afp)[^.]*\.?/gi, "")
    .replace(/\s*\b\d{1,4}\s*[–-]\s*\d{1,4}\b\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Title overlap + author surname overlap + year proximity must all line up — guards against
 * attaching the wrong paper's link. When we know the input's authors, a candidate MUST have a
 * surname match — a candidate with no listed authors no longer gets a free pass, since that's
 * exactly the gap that let an unrelated paper with topically-similar title words through.
 */
function isConfidentMatch(input: ResolveLinkInput, candidate: ScholarResult): boolean {
  if (input.year !== null && candidate.year !== null && Math.abs(input.year - candidate.year) > 2) return false;

  if (input.authors.length > 0) {
    if (candidate.authors.length === 0 || authorOverlapCount(input.authors, candidate.authors) === 0) return false;
    return titleOverlapScore(input.title, candidate.title) >= 0.4;
  }
  // No author info on our side to cross-check against — lean entirely on title precision.
  return titleOverlapScore(input.title, candidate.title) >= 0.75;
}

async function searchAcademicSources(query: string): Promise<ScholarResult[]> {
  const [cr, oa, ss] = await Promise.all([searchCrossref(query), searchOpenAlex(query), searchSemanticScholar(query)]);
  return [...cr, ...oa, ...ss];
}

/** Builds the final result from a confirmed ScholarResult match, filling in an OA fulltext link via Unpaywall when the match itself didn't already have one. Shared by the DOI-first path and the title-search waterfall below. */
async function buildResultFromMatch(input: ResolveLinkInput, match: ScholarResult): Promise<ResolveLinkResult> {
  let fulltextUrl = match.fulltextUrl;
  let accessStatus = match.accessStatus;
  if (!fulltextUrl && match.doi) {
    const oa = await unpaywall(match.doi);
    if (oa) {
      fulltextUrl = oa.fulltextUrl;
      accessStatus = oa.accessStatus;
    }
  }
  return {
    found: true,
    foundInScholarlyDb: true,
    title: match.title || input.title,
    authors: match.authors.length > 0 ? match.authors : input.authors,
    year: match.year ?? input.year,
    doi: match.doi,
    canonicalUrl: match.canonicalUrl,
    fulltextUrl,
    accessStatus,
    venue: match.venue,
    sourceTypeHint: null,
  };
}

interface WebFallbackResult {
  url: string;
  title: string | null;
  year: number | null;
}

/** Grounded calls can't use responseMimeType:"application/json", so the model sometimes wraps its answer in markdown fences despite being told not to — strip them before parsing. */
function stripJsonFences(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
}

/** Last resort when nothing in the academic indexes matches — grounded Google Search via Gemini, not training-data recall. One retry: the model is sometimes overly conservative on a single attempt and reports null even when a confident match exists. */
async function generalWebSearch(title: string, authors: string[], attempt = 1): Promise<WebFallbackResult | null> {
  const authorHint = authors.length > 0 ? ` by ${authors.join(", ")}` : "";
  const prompt = `Search the web for the article or document titled approximately "${title}"${authorHint}. It is likely a news article, opinion piece, or industry report — not necessarily an academic paper. Once you find it, report its canonical URL — the publisher's own page for it (e.g. directly on weforum.org, reuters.com, etc.), not a search results page or aggregator. If you found the piece but are unsure between a couple of URL variants, report the most likely one rather than giving up.

CRITICAL: the "url" field must be the real destination page on the publisher's own domain. Never return a vertexaisearch.cloud.google.com or other search-redirect link — resolve it to the actual underlying URL first.

Respond with ONLY a JSON object, no markdown fences: { "url": string | null, "title": string | null, "year": number | null }
Only set "url" to null if you genuinely could not find anything matching this title via search.`;
  try {
    const raw = await generateJsonWithSearch(prompt, 512);
    const parsed = JSON.parse(stripJsonFences(raw));
    if (typeof parsed.url !== "string" || !parsed.url.startsWith("http") || parsed.url.includes("vertexaisearch.cloud.google.com")) {
      if (attempt < 2) return generalWebSearch(title, authors, attempt + 1);
      return null;
    }
    return {
      url: parsed.url,
      title: typeof parsed.title === "string" ? parsed.title : null,
      year: typeof parsed.year === "number" ? parsed.year : null,
    };
  } catch {
    if (attempt < 2) return generalWebSearch(title, authors, attempt + 1);
    return null;
  }
}

/**
 * DOI-first when one is already known (exact, via resolveDoi's content negotiation), otherwise a
 * multi-source waterfall (Crossref -> OpenAlex -> Semantic Scholar) with a confidence check
 * (title overlap + author surname overlap + year proximity) to avoid attaching the wrong paper's
 * link. Falls back to a grounded web search only when no academic index has a confident match
 * (e.g. news/opinion pieces that Crossref/OpenAlex never index).
 */
export async function resolveLink(input: ResolveLinkInput): Promise<ResolveLinkResult> {
  if (input.doi) {
    const resolved = await resolveDoi(input.doi);
    if (resolved) return buildResultFromMatch(input, resolved);
  }

  const cleanedTitle = cleanTitle(input.title);

  let candidates = await searchAcademicSources(cleanedTitle);
  let match = candidates.find((c) => isConfidentMatch(input, c));

  // Title-only search found nothing confident — broaden with author surnames. Extracted titles
  // sometimes drift slightly from the published title; surnames anchor the search.
  if (!match && input.authors.length > 0) {
    const enrichedQuery = `${cleanedTitle} ${input.authors.map(surnameOf).join(" ")}`;
    const moreCandidates = await searchAcademicSources(enrichedQuery);
    candidates = [...candidates, ...moreCandidates];
    match = candidates.find((c) => isConfidentMatch(input, c));
  }

  if (match) return buildResultFromMatch(input, match);

  const webResult = await generalWebSearch(cleanedTitle, input.authors);
  if (webResult) {
    return {
      found: true,
      foundInScholarlyDb: false,
      title: webResult.title ?? input.title,
      authors: input.authors,
      year: webResult.year ?? input.year,
      doi: null,
      canonicalUrl: webResult.url,
      fulltextUrl: webResult.url,
      accessStatus: "open_access",
      venue: null,
      sourceTypeHint: "News",
    };
  }

  return {
    found: false,
    foundInScholarlyDb: false,
    title: input.title,
    authors: input.authors,
    year: input.year,
    doi: null,
    canonicalUrl: null,
    fulltextUrl: null,
    accessStatus: "unknown",
    venue: null,
    sourceTypeHint: null,
  };
}
