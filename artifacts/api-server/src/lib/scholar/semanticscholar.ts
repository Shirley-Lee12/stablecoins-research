import { env } from "../../config";
import type { ScholarResult } from "./types";

export function semanticScholarPaperToResult(paper: any): ScholarResult {
  const authors = Array.isArray(paper.authors)
    ? paper.authors.map((a: any) => a?.name).filter((n: unknown): n is string => typeof n === "string")
    : [];
  const doi = typeof paper.externalIds?.DOI === "string" ? paper.externalIds.DOI : null;
  const fulltextUrl = typeof paper.openAccessPdf?.url === "string" ? paper.openAccessPdf.url : null;
  return {
    title: typeof paper.title === "string" ? paper.title : "",
    authors,
    year: typeof paper.year === "number" ? paper.year : null,
    abstract: typeof paper.abstract === "string" && paper.abstract.trim() ? paper.abstract.trim() : null,
    doi,
    canonicalUrl: doi ? `https://doi.org/${doi}` : typeof paper.url === "string" ? paper.url : null,
    fulltextUrl,
    accessStatus: fulltextUrl ? "open_access" : "unknown",
    venue: typeof paper.venue === "string" ? paper.venue : null,
    source: "semanticscholar",
  };
}

/** Saved-search discovery for scheduled subscriptions. */
export async function discoverSemanticScholar(query: string, since: Date, limit = 100, attempt = 1): Promise<Array<ScholarResult & { externalKey: string; rawMetadata: unknown }>> {
  if (!query.trim()) return [];
  const headers: Record<string, string> = {};
  if (env.SEMANTIC_SCHOLAR_API_KEY) headers["x-api-key"] = env.SEMANTIC_SCHOLAR_API_KEY;
  const params = new URLSearchParams({
    query: query.trim(),
    fields: "title,authors,year,abstract,externalIds,openAccessPdf,venue,url,publicationDate,publicationTypes",
    publicationDateOrYear: `${since.toISOString().slice(0, 10)}:`,
    limit: String(Math.min(Math.max(limit, 1), 100)),
  });
  const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?${params}`, { headers, signal: AbortSignal.timeout(15_000) });
  if (res.status === 429 && attempt < 3) {
    const fallbackSeconds = 2 ** attempt;
    const retryAfterSeconds = Math.min(Number(res.headers.get("retry-after")) || fallbackSeconds, 30);
    await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
    return discoverSemanticScholar(query, since, limit, attempt + 1);
  }
  if (res.status === 429) throw new Error("Semantic Scholar is temporarily rate-limited (429)");
  if (!res.ok) throw new Error(`Semantic Scholar discovery failed (${res.status})`);
  const data = (await res.json()) as any;
  const papers = Array.isArray(data?.data) ? data.data : [];
  return papers.map((paper: any) => {
    const result = semanticScholarPaperToResult(paper);
    const normalizedTitle = result.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    return { ...result, externalKey: result.doi?.toLowerCase() ?? `${normalizedTitle}:${result.year ?? ""}`, rawMetadata: paper };
  }).filter((item: ScholarResult & { externalKey: string }) => item.title && item.externalKey !== ":");
}

/** No key required (low rate limit); strongest coverage for working papers/preprints. One retry on 429. */
export async function searchSemanticScholar(title: string, attempt = 1): Promise<ScholarResult[]> {
  if (!title.trim()) return [];
  try {
    const headers: Record<string, string> = {};
    if (env.SEMANTIC_SCHOLAR_API_KEY) headers["x-api-key"] = env.SEMANTIC_SCHOLAR_API_KEY;
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&fields=title,authors,year,abstract,externalIds,openAccessPdf,venue,url`,
      { headers, signal: AbortSignal.timeout(8_000) },
    );
    if (res.status === 429 && attempt < 2) {
      const retryAfterSeconds = Number(res.headers.get("retry-after")) || 2;
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      return searchSemanticScholar(title, attempt + 1);
    }
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    const items = data?.data;
    return Array.isArray(items) ? items.map(semanticScholarPaperToResult) : [];
  } catch {
    return [];
  }
}


/** Exact DOI lookup with abstract coverage for papers whose DOI landing page is inaccessible. */
export async function resolveDoiSemanticScholar(doi: string, attempt = 1): Promise<ScholarResult | null> {
  try {
    const headers: Record<string, string> = {};
    if (env.SEMANTIC_SCHOLAR_API_KEY) headers["x-api-key"] = env.SEMANTIC_SCHOLAR_API_KEY;
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=title,authors,year,abstract,externalIds,openAccessPdf,venue,url`,
      { headers, signal: AbortSignal.timeout(8_000) },
    );
    if (res.status === 429 && attempt < 2) {
      const retryAfterSeconds = Number(res.headers.get("retry-after")) || 2;
      await new Promise((resolve) => setTimeout(resolve, retryAfterSeconds * 1000));
      return resolveDoiSemanticScholar(doi, attempt + 1);
    }
    if (!res.ok) return null;
    return semanticScholarPaperToResult(await res.json());
  } catch {
    return null;
  }
}
