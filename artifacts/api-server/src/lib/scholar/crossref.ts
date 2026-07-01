import { env } from "../../config";
import type { ScholarResult } from "./types";

const USER_AGENT = `StablecoinHub/1.0 (mailto:${env.SCHOLAR_CONTACT_EMAIL})`;

function crossrefItemToResult(item: any): ScholarResult {
  const title = Array.isArray(item.title) && item.title[0] ? item.title[0] : "";
  const authors = Array.isArray(item.author)
    ? item.author.map((a: any) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean)
    : [];
  const year = item.issued?.["date-parts"]?.[0]?.[0] ?? item.published?.["date-parts"]?.[0]?.[0] ?? null;
  const doi = typeof item.DOI === "string" ? item.DOI : null;
  const url = typeof item.URL === "string" ? item.URL : null;
  const venue = Array.isArray(item["container-title"]) && item["container-title"][0] ? item["container-title"][0] : null;
  return {
    title,
    authors,
    year: typeof year === "number" ? year : null,
    doi,
    canonicalUrl: url,
    fulltextUrl: null,
    accessStatus: "unknown",
    venue,
    source: "crossref",
  };
}

/** Bibliographic title search — no key, polite pool via User-Agent mailto. */
export async function searchCrossref(title: string, attempt = 1): Promise<ScholarResult[]> {
  if (!title.trim()) return [];
  try {
    const res = await fetch(`https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(title)}&rows=10`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    const items = data?.message?.items;
    return Array.isArray(items) ? items.map(crossrefItemToResult) : [];
  } catch {
    // Crossref's free public API is occasionally slow/flaky — one retry avoids spurious empty results.
    if (attempt < 2) return searchCrossref(title, attempt + 1);
    return [];
  }
}

/** Direct DOI lookup. */
export async function resolveDoiCrossref(doi: string, attempt = 1): Promise<ScholarResult | null> {
  try {
    const res = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const msg = data?.message;
    return msg ? crossrefItemToResult(msg) : null;
  } catch {
    if (attempt < 2) return resolveDoiCrossref(doi, attempt + 1);
    return null;
  }
}
