import { env } from "../../config";
import type { ScholarResult } from "./types";

function openAlexWorkToResult(work: any): ScholarResult {
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
  const canonicalUrl = typeof work.id === "string" ? work.id : doi ? `https://doi.org/${doi}` : null;
  const venue = typeof work.primary_location?.source?.display_name === "string" ? work.primary_location.source.display_name : null;
  return {
    title: typeof work.title === "string" ? work.title : "",
    authors,
    year: typeof work.publication_year === "number" ? work.publication_year : null,
    doi,
    canonicalUrl,
    fulltextUrl,
    accessStatus: work.open_access?.is_oa ? "open_access" : "unknown",
    venue,
    source: "openalex",
    authorAffiliations,
  };
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
