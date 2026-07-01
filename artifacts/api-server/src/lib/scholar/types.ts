export type AccessStatus = "open_access" | "publisher_paywalled" | "unknown";

/** Normalized shape every scholar API adapter returns, so resolveLink.ts can merge across sources. */
export interface ScholarResult {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  canonicalUrl: string | null;
  fulltextUrl: string | null;
  accessStatus: AccessStatus;
  venue: string | null;
  source: "crossref" | "openalex" | "semanticscholar" | "doi";
  /** OpenAlex-only — author name + institution ID pairs, kept for future authors/institutions syncing. */
  authorAffiliations?: { name: string; institutionId: string | null }[];
}
