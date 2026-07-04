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

/** Shared by every call site that has a raw resources row rather than an already-parsed year — extracts the bare year from the free-text publishedDate before delegating to missingSixElements(). */
export function computeMissingFields(r: { title: string; authors: string[]; publishedDate: string | null; abstract: string | null; url: string | null; doi: string | null; keywords: string[] }): string[] {
  const year = r.publishedDate?.match(/^\d{4}/)?.[0] ? Number(r.publishedDate.match(/^\d{4}/)![0]) : null;
  return missingSixElements({ title: r.title, authors: r.authors, year, abstract: r.abstract, url: r.url, doi: r.doi, keywords: r.keywords });
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

export interface StatusRecomputeResult {
  status: SelfServiceStatus | "approved";
  missingFields: string[];
  hasThemeTag: boolean;
  duplicateSignal: DuplicateSignal;
  hasMismatch: boolean;
}

/**
 * Recomputes `status` after an admin-initiated change to any of a resource's fields — an admin's
 * direct edit via PATCH /resources/:id, or an admin approving a non-admin's edit suggestion (any
 * field, docs/planning/20 §20.1; originally tag/keyword-only per docs/planning/18 §18.4). Reads the
 * resource fresh from the DB and recalculates completeness/duplicate/theme-tag-presence regardless
 * of which specific field(s) just changed — it doesn't need to know, since it recomputes from
 * scratch either way. The verify agent is deliberately NOT re-run — the resource's already-cached
 * `verificationReport` (docs/planning/16 §16.1) is reused for the mismatch check instead. This is
 * the "skip re-verify" vs. "still recalc status" split §18.4 requires; the two must not be conflated
 * into one if-branch, since skipping the network verify call is not the same decision as freezing
 * status in place.
 *
 * Every caller of this helper is itself an admin-initiated action (a direct admin edit, or an admin
 * approving a suggestion) — the admin IS the reviewer performing this action, so "all checks pass"
 * resolves straight to 'approved', not classifyStatus()'s 'pending' fallback (which is correct for
 * the OWNER-resubmission path, where a fresh admin review is genuinely still needed, but would
 * otherwise re-queue an admin's own edit for admin review — a no-op loop).
 *
 * Returns the full check breakdown (not just the final status) so callers can tell the admin
 * *why* status changed, if it did — this must never happen silently (docs/planning/18 §18.4).
 */
export async function recomputeResourceStatus(resourceId: number): Promise<StatusRecomputeResult> {
  const [r] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, resourceId)).limit(1);
  if (!r) throw new Error(`Resource ${resourceId} not found`);

  const year = r.publishedDate?.match(/^\d{4}/)?.[0] ? Number(r.publishedDate.match(/^\d{4}/)![0]) : null;
  const missingFields = computeMissingFields(r);
  const duplicateSignal = await checkDuplicate({ title: r.title, doi: r.doi, url: r.url, year }, resourceId);
  const themeRows = await db
    .select({ facet: tagsTable.facet })
    .from(resourceTagsTable)
    .innerJoin(tagsTable, eq(resourceTagsTable.tagId, tagsTable.id))
    .where(eq(resourceTagsTable.resourceId, resourceId));
  const hasThemeTag = themeRows.some((t) => t.facet === "theme");
  const report = (r.verificationReport as VerifyReport | null) ?? { checks: [], hasFailure: false, hasWarning: false };

  const classified = classifyStatus({ duplicateSignal, missingFields, hasThemeTag, report });
  return {
    status: classified === "pending" ? "approved" : classified,
    missingFields,
    hasThemeTag,
    duplicateSignal,
    hasMismatch: hasMismatch(report),
  };
}
