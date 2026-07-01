import { env } from "../../config";
import type { ScholarResult } from "./types";

function semanticScholarPaperToResult(paper: any): ScholarResult {
  const authors = Array.isArray(paper.authors)
    ? paper.authors.map((a: any) => a?.name).filter((n: unknown): n is string => typeof n === "string")
    : [];
  const doi = typeof paper.externalIds?.DOI === "string" ? paper.externalIds.DOI : null;
  const fulltextUrl = typeof paper.openAccessPdf?.url === "string" ? paper.openAccessPdf.url : null;
  return {
    title: typeof paper.title === "string" ? paper.title : "",
    authors,
    year: typeof paper.year === "number" ? paper.year : null,
    doi,
    canonicalUrl: doi ? `https://doi.org/${doi}` : typeof paper.url === "string" ? paper.url : null,
    fulltextUrl,
    accessStatus: fulltextUrl ? "open_access" : "unknown",
    venue: typeof paper.venue === "string" ? paper.venue : null,
    source: "semanticscholar",
  };
}

/** No key required (low rate limit); strongest coverage for working papers/preprints. One retry on 429. */
export async function searchSemanticScholar(title: string, attempt = 1): Promise<ScholarResult[]> {
  if (!title.trim()) return [];
  try {
    const headers: Record<string, string> = {};
    if (env.SEMANTIC_SCHOLAR_API_KEY) headers["x-api-key"] = env.SEMANTIC_SCHOLAR_API_KEY;
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&fields=title,authors,year,externalIds,openAccessPdf,venue,url`,
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
