import type { VerifyReport } from "./verify";

export type DeterminedStatus = "pending" | "approved" | "needs_review" | "failed";

/**
 * Maps a verify report + completeness check to a final resources.status. Two-tier completeness:
 * hard-required fields (title, >=1 author, year) missing blocks entirely (failed) — everything
 * else (abstract, direct URL, verify warnings) still gets in, just routed to needs_review instead
 * of being silently dropped. Extraction-level failures (e.g. unreadable PDF) are a separate, earlier
 * failure point in the upload pipeline and never reach this function at all.
 */
export function determineResourceStatus(
  report: VerifyReport,
  input: { title: string; authors: string[]; year: number | null },
  isAdmin: boolean,
): DeterminedStatus {
  const hasHardRequiredFields = input.title.trim().length > 0 && input.authors.length > 0 && input.year !== null;
  if (!hasHardRequiredFields) return "failed";
  if (report.hasFailure || report.hasWarning) return "needs_review";
  return isAdmin ? "approved" : "pending";
}
