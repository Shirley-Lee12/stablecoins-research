/**
 * Canonical resources.sourceType slugs — must stay in sync with sourceTypeEnum in
 * lib/db/src/schema/resources.ts and docs/planning/08-sourceType最终枚举.md. The slug is
 * language-independent; nameZh/nameEn are what the UI shows.
 */
export const SOURCE_TYPES = [
  { value: "journal_article", nameEn: "Journal Article", nameZh: "期刊论文" },
  { value: "working_paper", nameEn: "Working Paper / Preprint", nameZh: "工作论文 / 预印本" },
  { value: "conference_paper", nameEn: "Conference Paper", nameZh: "会议论文" },
  { value: "thesis", nameEn: "Thesis", nameZh: "学位论文" },
  { value: "report", nameEn: "Research & Industry Report", nameZh: "研究与行业报告" },
  { value: "gov_document", nameEn: "Laws & Regulatory Documents", nameZh: "法律与监管文件" },
  { value: "news", nameEn: "News & Commentary", nameZh: "新闻与评论" },
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number]["value"];

export function sourceTypeLabel(value: string, zh: boolean): string {
  const match = SOURCE_TYPES.find((t) => t.value === value);
  return match ? (zh ? match.nameZh : match.nameEn) : value;
}
