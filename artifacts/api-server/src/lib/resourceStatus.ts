import { eq } from "drizzle-orm";
import { db, resourcesTable, resourceTagsTable, tagsTable } from "@workspace/db";
import type { VerifyReport } from "./verify";
import { checkDuplicate, type DuplicateSignal } from "./duplicateCheck";

export type SelfServiceStatus = "incomplete" | "disputed" | "off_topic" | "duplicate";
export type DeterminedStatus = SelfServiceStatus | "pending";

export interface SixElementsInput {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  url: string | null;
  doi: string | null;
  keywords: string[];
}

/**
 * Six-elements completeness check (docs/planning/15 §0.2/§0.8) — replaces the old per-entry-kind
 * missingHardRequiredFields()/requireUrlOrDoi split. That distinction is gone: EVERY entry point now
 * uses the same bar (URL-or-DOI included), and missing anything routes to 'incomplete' instead of
 * blocking the submission outright.
 *
 * keywords (docs/planning/15 §5.3): satisfied by a non-empty array regardless of source — extracted,
 * manually typed, or LLM-generated from the abstract all count equally toward completeness.
 */
export function missingSixElements(input: SixElementsInput): string[] {
  const missing: string[] = [];
  if (!input.title.trim()) missing.push("title");
  if (input.authors.length === 0) missing.push("authors");
  if (input.year === null) missing.push("year");
  if (!input.abstract || !input.abstract.trim()) missing.push("abstract");
  if (!input.url && !input.doi) missing.push("url_doi");
  if (input.keywords.length === 0) missing.push("keywords");
  return missing;
}

/** True only for checks flagged `kind: "mismatch"` (value present but disagrees with an authoritative source) — "missing" and unclassified checks (e.g. URL temporarily unreachable) don't count, since those are handled by missingSixElements() or are purely informational. */
export function hasMismatch(report: VerifyReport): boolean {
  return report.checks.some((c) => c.kind === "mismatch");
}

/**
 * Priority-ordered status determination (docs/planning/15 §0.6): a submission can trip more than
 * one condition at once (e.g. missing an abstract AND off-topic) — only the highest-priority one
 * becomes the actual status, in this order: duplicate > incomplete > off_topic > disputed > pending.
 * Callers are expected to still surface every detected issue in the UI (not just the winning one),
 * per §0.6's "list all detected problems" requirement — this function only decides the status value.
 */
export function classifyStatus(input: {
  duplicateSignal: DuplicateSignal;
  missingFields: string[];
  hasThemeTag: boolean;
  report: VerifyReport;
}): DeterminedStatus {
  if (input.duplicateSignal) return "duplicate";
  if (input.missingFields.length > 0) return "incomplete";
  if (!input.hasThemeTag) return "off_topic";
  if (hasMismatch(input.report)) return "disputed";
  return "pending";
}

/**
 * Recomputes `status` after a tag/keyword-only change — an admin's direct edit via PATCH
 * /resources/:id, or an approved non-admin suggestion (docs/planning/18 §18.4). Completeness,
 * duplicate, and theme-tag-presence are all recalculated fresh (tags/keywords can newly satisfy or
 * break any of those), but the verify agent is deliberately NOT re-run — the resource's already-
 * cached `verificationReport` (docs/planning/16 §16.1) is reused for the mismatch check instead.
 * This is the "skip re-verify" vs. "still recalc status" split §18.4 requires; the two must not be
 * conflated into one if-branch, since skipping the network verify call is not the same decision as
 * freezing status in place.
 */
export async function recomputeStatusAfterTagKeywordEdit(resourceId: number): Promise<DeterminedStatus> {
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, resourceId)).limit(1);
  if (!r) throw new Error(`Resource ${resourceId} not found`);

  const year = r.publishedDate?.match(/^\d{4}/)?.[0] ? Number(r.publishedDate.match(/^\d{4}/)![0]) : null;
  const missingFields = missingSixElements({ title: r.title, authors: r.authors, year, abstract: r.abstract, url: r.url, doi: r.doi, keywords: r.keywords });
  const duplicateSignal = await checkDuplicate({ title: r.title, doi: r.doi, url: r.url, year }, resourceId);
  const themeRows = await db
    .select({ facet: tagsTable.facet })
    .from(resourceTagsTable)
    .innerJoin(tagsTable, eq(resourceTagsTable.tagId, tagsTable.id))
    .where(eq(resourceTagsTable.resourceId, resourceId));
  const hasThemeTag = themeRows.some((t) => t.facet === "theme");
  const report = (r.verificationReport as VerifyReport | null) ?? { checks: [], hasFailure: false, hasWarning: false };

  return classifyStatus({ duplicateSignal, missingFields, hasThemeTag, report });
}
