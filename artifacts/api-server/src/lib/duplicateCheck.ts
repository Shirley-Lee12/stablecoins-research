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
export async function checkDuplicate(
  input: { title: string; doi: string | null; url: string | null; year: number | null },
  excludeResourceId?: number,
): Promise<DuplicateSignal> {
  if (input.doi || input.url) {
    const linkConditions = [];
    if (input.doi) linkConditions.push(eq(resourcesTable.doi, input.doi));
    if (input.url) linkConditions.push(eq(resourcesTable.url, input.url));
    const conditions = excludeResourceId
      ? [or(...linkConditions), ne(resourcesTable.id, excludeResourceId)]
      : [or(...linkConditions)];
    const [exactMatch] = await db.select({ id: resourcesTable.id }).from(resourcesTable).where(and(...conditions)).limit(1);
    if (exactMatch) return "exact";
  }

  const candidates = await db
    .select({ id: resourcesTable.id, title: resourcesTable.title, publishedDate: resourcesTable.publishedDate })
    .from(resourcesTable);
  for (const c of candidates) {
    if (excludeResourceId && c.id === excludeResourceId) continue;
    if (titleOverlapScore(input.title, c.title) < FUZZY_TITLE_THRESHOLD) continue;
    const candidateYear = yearOf(c.publishedDate);
    if (input.year !== null && candidateYear !== null && Math.abs(input.year - candidateYear) > FUZZY_YEAR_TOLERANCE) continue;
    return "fuzzy";
  }

  return null;
}
