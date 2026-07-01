export type CitationFormat = "refworks" | "endnote" | "noteexpress";

export interface CitationRecord {
  title: string;
  authors: string[];
  /** True when `authors` fell back to the issuing institution/publisher because no individual was credited (docs/planning/06 §2 point 4). */
  authorIsInstitution: boolean;
  year: number | null;
  abstract: string;
  /** "cnki" = came with the record's own AB/%X/{Abstract} field. Null means missing — a later backfill step may fill it in and set "generated_from_fulltext". */
  abstractSource: "cnki" | null;
  keywords: string[];
  doi: string | null;
  url: string | null;
  sourceType: string;
  venue: string | null;
}

export interface CitationParseResult {
  format: CitationFormat;
  records: CitationRecord[];
}

/** Thrown when the file's content can't be recognized as one of the three supported plain-text formats (e.g. 知网研学's encrypted .es6 export — see docs/planning/10). */
export class UnsupportedCitationFormatError extends Error {}
