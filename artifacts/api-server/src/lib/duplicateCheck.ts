import { db, resourcesTable } from "@workspace/db";
import { and, eq, ne, or } from "drizzle-orm";
import { titleOverlapScore } from "./scholar/matching";

export type DuplicateSignal = "exact" | "fuzzy" | null;

// Deliberately conservative — the fuzzy path is a "please confirm this isn't a duplicate" prompt,
// not an auto-reject (docs/planning/15 §0.5), so a false positive just costs the user one extra
// click, while a threshold set too low would make genuinely different papers on the same narrow
// topic (e.g. two country-specific regulation studies) constantly misflag each other.
const FUZZY_TITLE_THRESHOLD = 0.85;
const FUZZY_YEAR_TOLERANCE = 1;

function yearOf(publishedDate: string | null): number | null {
  const match = publishedDate?.match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}

/**
 * Duplicate detection (docs/planning/15 §0.5). Two tiers:
 * - exact: submitted DOI or URL matches any existing resource, in any status — a strong signal,
 *   checked against the whole library since a duplicate of a rejected/incomplete submission is
 *   still a duplicate.
 * - fuzzy: title similarity (reusing titleOverlapScore's word-Jaccard normalization — strips
 *   punctuation/case, which is what "去除标点空格后高度相似" is really asking for) plus a close
 *   publication year — a weak signal, meant to catch likely duplicates without the DOI/URL happening
 *   to differ (e.g. resubmitted under a slightly different link), NOT to auto-flag every paper that
 *   shares a research topic.
 *
 * Known, accepted false-negative: two real editions of the same work (e.g. an SSRN working-paper
 * version and its later journal publication) legitimately have different DOIs/URLs and often
 * different titles too — those are correctly NOT caught here, matching docs/planning/15 §0.5's
 * explicit "don't misjudge this as a duplicate" carve-out.
 */
export interface DuplicateCandidateMatch {
  candidateResourceId: number;
  matchType: "exact_doi" | "exact_url" | "fuzzy_title";
}

/**
 * docs/planning/19 §19.3 — like checkDuplicate()'s detection logic, but collects every matching
 * existing resource (a submission can match more than one) instead of stopping at the first hit,
 * so persistConfirmedDraft() can record them all into duplicate_candidates. checkDuplicate() below
 * is now a thin wrapper over this, kept for callers that only need the yes/no signal.
 */
export async function findDuplicateCandidates(
  input: { title: string; doi: string | null; url: string | null; year: number | null },
  excludeResourceId?: number,
): Promise<DuplicateCandidateMatch[]> {
  const matches = new Map<number, DuplicateCandidateMatch>();

  if (input.doi) {
    const conditions = excludeResourceId
      ? [eq(resourcesTable.doi, input.doi), ne(resourcesTable.id, excludeResourceId)]
      : [eq(resourcesTable.doi, input.doi)];
    const rows = await db.select({ id: resourcesTable.id }).from(resourcesTable).where(and(...conditions));
    for (const r of rows) matches.set(r.id, { candidateResourceId: r.id, matchType: "exact_doi" });
  }
  if (input.url) {
    const conditions = excludeResourceId
      ? [eq(resourcesTable.url, input.url), ne(resourcesTable.id, excludeResourceId)]
      : [eq(resourcesTable.url, input.url)];
    const rows = await db.select({ id: resourcesTable.id }).from(resourcesTable).where(and(...conditions));
    for (const r of rows) if (!matches.has(r.id)) matches.set(r.id, { candidateResourceId: r.id, matchType: "exact_url" });
  }

  const candidates = await db
    .select({ id: resourcesTable.id, title: resourcesTable.title, publishedDate: resourcesTable.publishedDate })
    .from(resourcesTable);
  for (const c of candidates) {
    if (excludeResourceId && c.id === excludeResourceId) continue;
    if (matches.has(c.id)) continue; // already recorded via a stronger (exact) match
    if (titleOverlapScore(input.title, c.title) < FUZZY_TITLE_THRESHOLD) continue;
    const candidateYear = yearOf(c.publishedDate);
    if (input.year !== null && candidateYear !== null && Math.abs(input.year - candidateYear) > FUZZY_YEAR_TOLERANCE) continue;
    matches.set(c.id, { candidateResourceId: c.id, matchType: "fuzzy_title" });
  }

  return [...matches.values()];
}

export async function checkDuplicate(
  input: { title: string; doi: string | null; url: string | null; year: number | null },
  excludeResourceId?: number,
): Promise<DuplicateSignal> {
  const matches = await findDuplicateCandidates(input, excludeResourceId);
  if (matches.some((m) => m.matchType === "exact_doi" || m.matchType === "exact_url")) return "exact";
  if (matches.length > 0) return "fuzzy";
  return null;
}
