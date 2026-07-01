import type { VerifyReport } from "./verify";

export type DeterminedStatus = "pending" | "approved" | "needs_review";

export interface HardRequiredInput {
  title: string;
  authors: string[];
  year: number | null;
  url: string | null;
  doi: string | null;
}

/**
 * Hard-required completeness check (title, >=1 author, year — plus URL/DOI when requireUrlOrDoi is
 * set) — separate from determineResourceStatus so the caller can reject the confirmation outright
 * (no resources row at all) when something's missing, instead of inserting one with a "failed"
 * status. `resources.status` should never be 'failed' — that state belongs to upload_jobs
 * (extraction-level failures, a separate earlier point in the pipeline that never reaches this far).
 *
 * URL/DOI is hard-required for manual entry and DOI/URL import (docs/planning/12 §1) — the user
 * typed or supplied the link directly, so a missing one is a real gap, not an automation limit.
 * It's NOT required for PDF/citation-batch import: those links come from an automated lookup
 * (resolveLink) that legitimately sometimes finds nothing (government sites blocking scrapers,
 * pure working papers with no public record, etc. — see docs/planning/10) and upgrading "automation
 * couldn't find it" to "reject the upload" would just push the same triage work onto the uploader
 * with worse UX, not reduce it. Callers pass requireUrlOrDoi=false for those entries so a missing
 * link routes to needs_review instead of blocking the confirm.
 *
 * Returns the list of missing field names ("url_doi" covers both — either one satisfies the
 * requirement); empty means everything required (for this entry kind) is present.
 */
export function missingHardRequiredFields(input: HardRequiredInput, opts: { requireUrlOrDoi: boolean }): string[] {
  const missing: string[] = [];
  if (!input.title.trim()) missing.push("title");
  if (input.authors.length === 0) missing.push("authors");
  if (input.year === null) missing.push("year");
  if (opts.requireUrlOrDoi && !input.url && !input.doi) missing.push("url_doi");
  return missing;
}

/**
 * Maps a verify report to a final resources.status, once the caller has already confirmed all
 * hard-required fields are present (see missingHardRequiredFields). Anything the verify report
 * flagged (missing abstract/URL, cross-check mismatches) still gets in, just routed to
 * needs_review instead of being silently dropped.
 */
export function determineResourceStatus(report: VerifyReport, isAdmin: boolean): DeterminedStatus {
  if (report.hasFailure || report.hasWarning) return "needs_review";
  return isAdmin ? "approved" : "pending";
}
