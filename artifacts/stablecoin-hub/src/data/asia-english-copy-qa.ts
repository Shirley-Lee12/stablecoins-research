// User-authorised English copy corrections only. Frozen package files stay intact.
export const FINAL_ENGLISH_COPY_QA = {
  verifiedDate: "16 Oct 2026",
  timelineTitle: "Recent Regulatory & Product Milestones · 2025–2026",
  svgCorrection: {
    id: "REG-M01",
    original:
      '<text x="130" y="320" class="t s" text-anchor="start" fill="#1F2937">Private stablecoin: restricted</text>',
    // Wrap the longer English label inside the existing box; no shapes or paths change.
    replacement:
      '<text x="130" y="310" class="t s" text-anchor="start" fill="#1F2937"><tspan x="130" dy="0">Private stablecoin issuance/business: </tspan><tspan x="130" dy="24">prohibited or strictly restricted</tspan></text>',
  },
} as const;

export function englishVerificationText(date = "2026-10-16") {
  const formatted = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return `Last verified: ${formatted}`;
}

export function applyAsiaEnglishSvgCopy(svg: string, id: string) {
  const correction = FINAL_ENGLISH_COPY_QA.svgCorrection;
  return id === correction.id
    ? svg.replace(correction.original, correction.replacement)
    : svg;
}
