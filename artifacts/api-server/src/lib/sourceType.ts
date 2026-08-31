export const VALID_SOURCE_TYPES = [
  "journal_article",
  "working_paper",
  "conference_paper",
  "thesis",
  "book",
  "book_chapter",
  "dataset",
  "report",
  "gov_document",
  "news",
] as const;

export type SourceType = typeof VALID_SOURCE_TYPES[number];

export function normalizeSourceType(value: unknown): SourceType {
  return typeof value === "string" && (VALID_SOURCE_TYPES as readonly string[]).includes(value)
    ? value as SourceType
    : "journal_article";
}

/** Deterministic source signals that override an uncertain extracted/default category. */
export function refineSourceType(sourceType: unknown, sourceUrl?: string | null, title = "", sourceText = ""): SourceType {
  const normalized = normalizeSourceType(sourceType);
  const evidence = `${title}\n${sourceText.slice(0, 5_000)}`;
  // Publisher pages can mention books or chapters in references. Only use the page identity and
  // opening metadata for book classification, rather than a long body that may contain citations.
  const identityEvidence = `${title}\n${sourceUrl ?? ""}\n${sourceText.slice(0, 1_200)}`;

  // The document's own identity is stronger evidence than the website section linking to it.
  if (/\b(?:doctoral|master'?s?|undergraduate)\s+(?:thesis|dissertation)\b|\b(?:thesis|dissertation)\s+submitted\b|学位论文|博士论文|硕士论文/iu.test(evidence)) return "thesis";
  if (/\b(?:book chapter|chapter \d+|chapter in)\b|\bin\s+.+\s*\(ed(?:s)?\.\)|书章|图书章节/iu.test(identityEvidence)) return "book_chapter";
  if (/\b(?:monograph|book)\b|专著/iu.test(identityEvidence)) return "book";
  if (/\b(?:conference proceedings|proceedings of|presented at|conference paper)\b|会议论文|会议论文集/iu.test(evidence)) return "conference_paper";
  if (/\b(?:working paper|discussion paper|research paper)\s*(?:no\.?|series|\d)|\bNBER\s+working paper\b|工作论文/iu.test(evidence)) return "working_paper";
  if (/\b(?:dataset|data\s*set|data release|data repository|data snapshot)\b|数据集|数据发布|数据快照/iu.test(evidence)) return "dataset";
  if (/\b(?:regulatory|official) guideline\b|\bguideline (?:on|for)\b|\bconsultation paper\b|\b(?:final|proposed) rule\b|\bregulation \([A-Z]{2}\)|\b(?:act|ordinance) (?:of )?\d{4}\b|管理办法|实施细则|条例|法案|监管指引|征求意见稿/iu.test(title)) return "gov_document";
  if (/\b(?:independent auditors?' report|assurance report|annual report|research report|policy report|technical report|white\s*paper|whitepaper)\b|审计报告|鉴证报告|年度报告|研究报告|白皮书/iu.test(evidence)) return "report";
  if (!sourceUrl) return normalized;
  try {
    const url = new URL(sourceUrl);
    if (/(?:^|\.)arxiv\.org$|(?:^|\.)ssrn\.com$/i.test(url.hostname)) return "working_paper";
    if (/(?:^|\.)medium\.com$/i.test(url.hostname)) return "news";
    if (/(?:^|\.)forvismazars\.us$/i.test(url.hostname) && /^\/forsights\//i.test(url.pathname)) return "news";
    if (/(?:^|\.)lw\.com$/i.test(url.hostname) && /^\/en\/insights\//i.test(url.pathname)) return "news";
    if (/(?:^|\.)federalreserve\.gov$/i.test(url.hostname) && /^\/econres\/notes\/feds-notes\//i.test(url.pathname)) return "report";
    if (/\/(?:stories?|news|blog|opinion)(?:\/|$)/i.test(url.pathname)) return "news";
  } catch {
    // Preserve the existing category when no valid public URL is available.
  }
  return normalized;
}
