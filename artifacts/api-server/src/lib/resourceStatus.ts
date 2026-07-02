import type { VerifyReport } from "./verify";
import type { DuplicateSignal } from "./duplicateCheck";

export type SelfServiceStatus = "incomplete" | "disputed" | "off_topic" | "duplicate";
export type DeterminedStatus = SelfServiceStatus | "pending";

export interface SixElementsInput {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
  url: string | null;
  doi: string | null;
  // keywords is intentionally NOT checked here yet — docs/planning/15 §0.2 defines the six elements
  // as title/authors/year/abstract/keywords/url-or-doi, but `resources.keywords` doesn't exist as a
  // column until docs/planning/15 §5 (group 5) lands. Completeness is 5-of-6 until then; this needs
  // a follow-up update once that column exists, or "incomplete" will under-fire (missing keywords
  // alone won't be caught) until group 5 is done.
}

/**
 * Six-elements completeness check (docs/planning/15 §0.2/§0.8) — replaces the old per-entry-kind
 * missingHardRequiredFields()/requireUrlOrDoi split. That distinction is gone: EVERY entry point now
 * uses the same bar (URL-or-DOI included), and missing anything routes to 'incomplete' instead of
 * blocking the submission outright.
 */
export function missingSixElements(input: SixElementsInput): string[] {
  const missing: string[] = [];
  if (!input.title.trim()) missing.push("title");
  if (input.authors.length === 0) missing.push("authors");
  if (input.year === null) missing.push("year");
  if (!input.abstract || !input.abstract.trim()) missing.push("abstract");
  if (!input.url && !input.doi) missing.push("url_doi");
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
