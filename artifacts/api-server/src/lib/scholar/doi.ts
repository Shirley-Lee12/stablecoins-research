import type { ScholarResult } from "./types";

/** DOI content negotiation — confirms the DOI resolves and returns its canonical CSL-JSON metadata. */
export async function resolveDoi(doi: string): Promise<ScholarResult | null> {
  try {
    const res = await fetch(`https://doi.org/${encodeURIComponent(doi)}`, {
      headers: { Accept: "application/vnd.citationstyles.csl+json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const csl = (await res.json()) as any;
    const title = Array.isArray(csl.title) ? csl.title[0] : csl.title;
    const authors = Array.isArray(csl.author)
      ? csl.author.map((a: any) => [a.given, a.family].filter(Boolean).join(" ")).filter(Boolean)
      : [];
    const year = csl.issued?.["date-parts"]?.[0]?.[0];
    const venue = typeof csl["container-title"] === "string" ? csl["container-title"] : null;
    return {
      title: typeof title === "string" ? title : "",
      authors,
      year: typeof year === "number" ? year : null,
      doi,
      canonicalUrl: `https://doi.org/${doi}`,
      fulltextUrl: null,
      accessStatus: "unknown",
      venue,
      source: "doi",
    };
  } catch {
    return null;
  }
}
