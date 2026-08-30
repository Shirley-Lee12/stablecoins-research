import { searchCrossref } from "./crossref";
import { searchOpenAlex } from "./openalex";
import { searchSemanticScholar } from "./semanticscholar";
import { resolveDoi } from "./doi";
import { resolveDoiCrossref } from "./crossref";
import { resolveDoiOpenAlex } from "./openalex";
import { resolveDoiSemanticScholar } from "./semanticscholar";
import { unpaywall } from "./unpaywall";
import { generateJsonWithSearch } from "../llm";
import { titleOverlapScore, titleHasPhraseContainment, authorOverlapCount, surnameOf } from "./matching";
import type { ScholarResult, AccessStatus } from "./types";
import { preferExactDoiAuthorNames, preferFullAuthorNames } from "./authorNames";

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
  abstract: string | null;
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
async function buildResultFromMatch(
  input: ResolveLinkInput,
  match: ScholarResult,
  authorCandidateLists: string[][] = [match.authors],
  exactDoiMatch = false,
): Promise<ResolveLinkResult> {
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
    // Preserve full user-provided names, but expand bibliographic initials when a confirmed match
    // supplies a compatible full name.
    title: exactDoiMatch ? (match.title || input.title.trim()) : (input.title.trim() || match.title),
    authors: exactDoiMatch
      ? preferExactDoiAuthorNames(input.authors, authorCandidateLists)
      : preferFullAuthorNames(input.authors, authorCandidateLists),
    year: exactDoiMatch ? (match.year ?? input.year) : (input.year ?? match.year),
    abstract: match.abstract,
    doi: input.doi ?? match.doi,
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

/** Reject home pages and search-result URLs even when a grounded model claims they are canonical. */
export function isLikelyDirectResourceUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const path = url.pathname.toLowerCase();
    if (path === "/" || path === "") return false;
    if (/\/(?:search|searchresult|defaultresult)(?:\/|$)/u.test(path)) return false;
    if (/kns\d*\/defaultresult/u.test(path)) return false;
    const searchParams = [...url.searchParams.keys()].map((key) => key.toLowerCase());
    const hasSearchQuery = searchParams.some((key) => ["q", "query", "kw", "keyword", "search"].includes(key));
    const hasResourceIdentity = /(?:article|abstract|detail|document|paper|publication|report|news|story|doi)/u.test(path)
      || ["filename", "id", "doi"].some((key) => url.searchParams.has(key));
    return !hasSearchQuery || hasResourceIdentity;
  } catch {
    return false;
  }
}

/** Last resort when nothing in the academic indexes matches — grounded Google Search via Gemini, not training-data recall. One retry: the model is sometimes overly conservative on a single attempt and reports null even when a confident match exists. */
async function generalWebSearch(title: string, authors: string[], year: number | null, attempt = 1): Promise<WebFallbackResult | null> {
  const authorHint = authors.length > 0 ? ` by ${authors.join(", ")}` : "";
  const yearHint = year !== null ? `, published around ${year}` : "";
  const prompt = `Search the web for the article or document titled approximately "${title}"${authorHint}${yearHint}. It may be an academic article, a Chinese journal/CNKI record, a news article, an opinion piece, or an industry report. Once you find it, report its canonical URL — prefer the journal, publisher, issuing institution, CNKI, or another authoritative bibliographic page, not a search results page or aggregator. If you found the piece but are unsure between a couple of URL variants, report the most likely one rather than giving up.

CRITICAL: the "url" field must be the real destination page on the publisher's own domain. Never return a vertexaisearch.cloud.google.com or other search-redirect link — resolve it to the actual underlying URL first.

Respond with ONLY a JSON object, no markdown fences: { "url": string | null, "title": string | null, "year": number | null }
Only set "url" to null if you genuinely could not find anything matching this title via search.`;
  try {
    const raw = await generateJsonWithSearch(prompt, 512);
    const parsed = JSON.parse(stripJsonFences(raw));
    if (typeof parsed.url !== "string" || !parsed.url.startsWith("http") || parsed.url.includes("vertexaisearch.cloud.google.com")) {
      if (attempt < 2) return generalWebSearch(title, authors, year, attempt + 1);
      return null;
    }
    const result = {
      url: parsed.url,
      title: typeof parsed.title === "string" ? parsed.title : null,
      year: typeof parsed.year === "number" ? parsed.year : null,
    };
    // Grounded search is useful for Chinese journals and reports, but it is still an LLM result.
    // Require returned identity evidence before attaching its URL to the uploaded reference.
    if (!isLikelyDirectResourceUrl(result.url)
      || !result.title
      || titleOverlapScore(title, result.title) < 0.45
      || (year !== null && result.year !== null && Math.abs(year - result.year) > 2)) {
      if (attempt < 2) return generalWebSearch(title, authors, year, attempt + 1);
      return null;
    }
    return result;
  } catch {
    if (attempt < 2) return generalWebSearch(title, authors, year, attempt + 1);
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
    const exactMatches = (await Promise.all([
      resolveDoiOpenAlex(input.doi),
      resolveDoiSemanticScholar(input.doi),
      resolveDoiCrossref(input.doi),
      resolveDoi(input.doi),
    ])).filter((match): match is ScholarResult => match !== null);
    const compatibleMatches = input.title.trim()
      ? exactMatches.filter((match) => !match.title
        || titleOverlapScore(input.title, match.title) >= 0.45
        || titleHasPhraseContainment(input.title, match.title))
      : exactMatches;
    if (compatibleMatches.length > 0) {
      const richest = compatibleMatches.find((match) => !!match.abstract) ?? compatibleMatches[0];
      const merged: ScholarResult = {
        ...richest,
        title: richest.title || compatibleMatches.find((match) => !!match.title)?.title || input.title,
        authors: preferExactDoiAuthorNames(input.authors, compatibleMatches.map((match) => match.authors)),
        year: richest.year ?? compatibleMatches.find((match) => match.year !== null)?.year ?? input.year,
        abstract: richest.abstract ?? compatibleMatches.find((match) => !!match.abstract)?.abstract ?? null,
        canonicalUrl: richest.canonicalUrl ?? compatibleMatches.find((match) => !!match.canonicalUrl)?.canonicalUrl ?? `https://doi.org/${input.doi}`,
        fulltextUrl: richest.fulltextUrl ?? compatibleMatches.find((match) => !!match.fulltextUrl)?.fulltextUrl ?? null,
      };
      return buildResultFromMatch(input, merged, compatibleMatches.map((match) => match.authors), true);
    }

    // A DOI-only entry has no identity evidence for a title search. Continuing with an empty title
    // previously allowed grounded search to return an unrelated popular page.
    if (!input.title.trim()) return emptyResult(input);
  }

  const cleanedTitle = cleanTitle(input.title);

  let candidates = await searchAcademicSources(cleanedTitle);
  let matches = candidates.filter((candidate) => isConfidentMatch(input, candidate));
  let match = matches[0];

  // Title-only search found nothing confident — broaden with author surnames. Extracted titles
  // sometimes drift slightly from the published title; surnames anchor the search.
  if (!match && input.authors.length > 0) {
    const enrichedQuery = `${cleanedTitle} ${input.authors.map(surnameOf).join(" ")}`;
    const moreCandidates = await searchAcademicSources(enrichedQuery);
    candidates = [...candidates, ...moreCandidates];
    matches = candidates.filter((candidate) => isConfidentMatch(input, candidate));
    match = matches[0];
  }

  if (match) return buildResultFromMatch(input, match, matches.map((candidate) => candidate.authors));

  const webResult = await generalWebSearch(cleanedTitle, input.authors, input.year);
  if (webResult) {
    return {
      found: true,
      foundInScholarlyDb: false,
      title: input.title.trim() || (webResult.title ?? ""),
      authors: input.authors,
      year: input.year ?? webResult.year,
      abstract: null,
      doi: input.doi ?? null,
      canonicalUrl: webResult.url,
      fulltextUrl: webResult.url,
      accessStatus: "open_access",
      venue: null,
      sourceTypeHint: "News",
    };
  }

  return emptyResult(input);
}

function emptyResult(input: ResolveLinkInput): ResolveLinkResult {
  return {
    found: false,
    foundInScholarlyDb: false,
    title: input.title,
    authors: input.authors,
    year: input.year,
    abstract: null,
    doi: input.doi ?? null,
    canonicalUrl: input.doi ? `https://doi.org/${input.doi}` : null,
    fulltextUrl: null,
    accessStatus: "unknown",
    venue: null,
    sourceTypeHint: null,
  };
}
