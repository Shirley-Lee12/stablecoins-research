import type { VerifyReport } from "./verify";

export type DeterminedStatus = "pending" | "approved" | "needs_review";

export interface HardRequiredInput {
  title: string;
  authors: string[];
  year: number | null;
}

/**
 * Hard-required completeness check (title, >=1 author, year) — separate from determineResourceStatus
 * so the caller can reject the confirmation outright (no resources row at all) when something's
 * missing, instead of inserting one with a "failed" status. `resources.status` should never be
 * 'failed' — that state belongs to upload_jobs (extraction-level failures, a separate earlier point
 * in the pipeline that never reaches this far). Returns the list of missing field names; empty
 * means everything required is present.
 */
export function missingHardRequiredFields(input: HardRequiredInput): string[] {
  const missing: string[] = [];
  if (!input.title.trim()) missing.push("title");
  if (input.authors.length === 0) missing.push("authors");
  if (input.year === null) missing.push("year");
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
