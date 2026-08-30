import { env } from "../../config";
import type { ScholarResult } from "./types";

function reconstructAbstract(invertedIndex: unknown): string | null {
  if (!invertedIndex || typeof invertedIndex !== "object") return null;
  const positioned: { word: string; position: number }[] = [];
  for (const [word, positions] of Object.entries(invertedIndex as Record<string, unknown>)) {
    if (!Array.isArray(positions)) continue;
    for (const position of positions) {
      if (typeof position === "number") positioned.push({ word, position });
    }
  }
  if (positioned.length === 0) return null;
  return positioned.sort((a, b) => a.position - b.position).map((item) => item.word).join(" ");
}

export function openAlexWorkToResult(work: any): ScholarResult {
  const authorships = Array.isArray(work.authorships) ? work.authorships : [];
  const authors = authorships
    .map((a: any) => a?.author?.display_name)
    .filter((n: unknown): n is string => typeof n === "string");
  const authorAffiliations = authorships.map((a: any) => ({
    name: typeof a?.author?.display_name === "string" ? a.author.display_name : "",
    institutionId: typeof a?.institutions?.[0]?.id === "string" ? a.institutions[0].id : null,
  }));
  const doi = typeof work.doi === "string" ? work.doi.replace(/^https?:\/\/doi\.org\//, "") : null;
  const bestOa = work.best_oa_location;
  const fulltextUrl = typeof bestOa?.pdf_url === "string" ? bestOa.pdf_url : typeof bestOa?.landing_page_url === "string" ? bestOa.landing_page_url : null;
  const canonicalUrl = doi ? `https://doi.org/${doi}` : typeof work.id === "string" ? work.id : null;
  const venue = typeof work.primary_location?.source?.display_name === "string" ? work.primary_location.source.display_name : null;
  return {
    title: typeof work.title === "string" ? work.title : "",
    authors,
    year: typeof work.publication_year === "number" ? work.publication_year : null,
    abstract: reconstructAbstract(work.abstract_inverted_index),
    doi,
    canonicalUrl,
    fulltextUrl,
    accessStatus: work.open_access?.is_oa ? "open_access" : "unknown",
    venue,
    source: "openalex",
    authorAffiliations,
  };
}

/** Saved-search discovery for scheduled subscriptions. */
export async function discoverOpenAlex(query: string, since: Date, perPage = 100): Promise<Array<ScholarResult & { externalKey: string; rawMetadata: unknown }>> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    search: query.trim(),
    filter: `from_publication_date:${since.toISOString().slice(0, 10)}`,
    sort: "publication_date:desc",
    "per-page": String(Math.min(Math.max(perPage, 1), 100)),
    mailto: env.SCHOLAR_CONTACT_EMAIL,
  });
  const res = await fetch(`https://api.openalex.org/works?${params}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`OpenAlex discovery failed (${res.status})`);
  const data = (await res.json()) as any;
  const works = Array.isArray(data?.results) ? data.results : [];
  return works.map((work: any) => {
    const result = openAlexWorkToResult(work);
    const normalizedTitle = result.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    return { ...result, externalKey: result.doi?.toLowerCase() ?? `${normalizedTitle}:${result.year ?? ""}`, rawMetadata: work };
  }).filter((item: ScholarResult & { externalKey: string }) => item.title && item.externalKey !== ":");
}

/** No key — every request carries ?mailto for the polite pool. Returns authors + institution IDs for future authors/institutions syncing. */
export async function searchOpenAlex(title: string): Promise<ScholarResult[]> {
  if (!title.trim()) return [];
  try {
    const res = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=10&mailto=${encodeURIComponent(env.SCHOLAR_CONTACT_EMAIL)}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    const results = data?.results;
    return Array.isArray(results) ? results.map(openAlexWorkToResult) : [];
  } catch {
    return [];
  }
}

/** Exact DOI lookup, used before trying publisher landing pages that often block automated reads. */
export async function resolveDoiOpenAlex(doi: string): Promise<ScholarResult | null> {
  try {
    const filter = encodeURIComponent(`doi:https://doi.org/${doi}`);
    const res = await fetch(
      `https://api.openalex.org/works?filter=${filter}&per-page=1&mailto=${encodeURIComponent(env.SCHOLAR_CONTACT_EMAIL)}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return Array.isArray(data?.results) && data.results[0] ? openAlexWorkToResult(data.results[0]) : null;
  } catch {
    return null;
  }
}
