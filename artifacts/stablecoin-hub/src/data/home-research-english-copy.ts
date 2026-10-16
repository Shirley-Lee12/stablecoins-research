// Approved final English copy only. Source-package records and statuses stay frozen.
type EnglishRecordCopy = Partial<{
  title_en: string;
  summary_en: string;
  important_boundary_en: string;
}>;

export const RESEARCH_RECORD_ENGLISH: Record<string, EnglishRecordCopy> = {
  "risk-framework": {
    title_en: "Full-lifecycle stablecoin risk framework",
    important_boundary_en:
      "The number 55 refers to the conceptual taxonomy. It does not imply that 55 variables are entered directly into a single empirical model.",
  },
  "quantitative-te-hawkes": {
    summary_en:
      "Interim empirical results have been produced for directed risk-signal transmission and self-/cross-excitation of extreme events.",
    important_boundary_en:
      "Reproducibility, robustness and interpretation validation remain in progress; this is not a production-grade real-time prediction model.",
  },
  "stress-cases": {
    summary_en:
      "Interim stress-scenario and historical case-study results have been produced; reproducibility and integrated validation remain in progress.",
    important_boundary_en:
      "These are research-stage results, not a deployed stress-testing service or automated risk platform.",
  },
};

// Literal text-node replacements only: no attributes, nodes, relations or status changes.
export const FIGURE_ENGLISH_REPLACEMENTS = [
  [">Stress / case result packages<", ">Interim stress / case results<"],
  [">Integrated research +<", ">Integrated research and<"],
  [
    ">No live depeg probability or production-grade early-warning score.<",
    ">No real-time depeg-probability estimates or production-grade early-warning score.<",
  ],
] as const;

export function applyFigureEnglishCopy(svg: string): string {
  return FIGURE_ENGLISH_REPLACEMENTS.reduce(
    (copy, [before, after]) => copy.replaceAll(before, after),
    svg,
  );
}
