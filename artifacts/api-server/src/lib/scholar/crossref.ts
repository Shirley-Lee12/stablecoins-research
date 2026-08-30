import { env } from "../../config";
import type { ScholarResult } from "./types";

const USER_AGENT = `StablecoinHub/1.0 (mailto:${env.SCHOLAR_CONTACT_EMAIL})`;

export function crossrefItemToResult(item: any): ScholarResult {
  const title = Array.isArray(item.title) && item.title[0] ? item.title[0] : "";
  const authors = Array.isArray(item.author)
    ? item.author.map((a: any) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean)
    : [];
  const year = item.issued?.["date-parts"]?.[0]?.[0] ?? item.published?.["date-parts"]?.[0]?.[0] ?? null;
  const doi = typeof item.DOI === "string" ? item.DOI : null;
  const url = typeof item.URL === "string" ? item.URL : null;
  const venue = Array.isArray(item["container-title"]) && item["container-title"][0] ? item["container-title"][0] : null;
  const abstract = typeof item.abstract === "string"
    ? item.abstract.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : null;
  return {
    title,
    authors,
    year: typeof year === "number" ? year : null,
    abstract: abstract || null,
    doi,
    canonicalUrl: url,
    fulltextUrl: null,
    accessStatus: "unknown",
    venue,
    source: "crossref",
  };
}

/**
 * Incremental saved-search discovery. A small overlap window is supplied by the caller so an
 * interrupted run cannot create a gap; candidate uniqueness is enforced in Postgres.
 */
export async function discoverCrossref(query: string, since: Date, rows = 50): Promise<Array<ScholarResult & { externalKey: string; rawMetadata: unknown }>> {
  if (!query.trim()) return [];
  // Crossref accepts second-resolution ISO timestamps without a timezone suffix.
  const from = since.toISOString().slice(0, 19);
  const until = new Date().toISOString().slice(0, 19);
  const params = new URLSearchParams({
    "query.bibliographic": query.trim(),
    filter: `from-index-date:${from},until-index-date:${until}`,
    rows: String(Math.min(Math.max(rows, 1), 100)),
    select: "DOI,title,author,issued,published,URL,container-title,abstract,indexed,type",
  });
  const res = await fetch(`https://api.crossref.org/works?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Crossref discovery failed (${res.status})`);
  const data = (await res.json()) as any;
  const items = Array.isArray(data?.message?.items) ? data.message.items : [];
  return items.map((item: any) => {
    const result = crossrefItemToResult(item);
    const normalizedTitle = result.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    return {
      ...result,
      externalKey: result.doi?.toLowerCase() ?? `${normalizedTitle}:${result.year ?? ""}`,
      rawMetadata: item,
    };
  }).filter((item: ScholarResult & { externalKey: string }) => item.title && item.externalKey !== ":");
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
