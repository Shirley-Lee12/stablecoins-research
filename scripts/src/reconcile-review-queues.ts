import { and, eq, inArray } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";

type SourceType = "journal_article" | "working_paper" | "conference_paper" | "thesis" | "report" | "gov_document" | "news";
type ScholarResult = {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string | null;
};

const doiUrl = new URL("../../artifacts/api-server/src/lib/scholar/doi.ts", import.meta.url).href;
const namesUrl = new URL("../../artifacts/api-server/src/lib/scholar/authorNames.ts", import.meta.url).href;
const matchingUrl = new URL("../../artifacts/api-server/src/lib/scholar/matching.ts", import.meta.url).href;
const verifyUrl = new URL("../../artifacts/api-server/src/lib/verify.ts", import.meta.url).href;
const resourceStatusUrl = new URL("../../artifacts/api-server/src/lib/resourceStatus.ts", import.meta.url).href;
const resourceAuthorsUrl = new URL("../../artifacts/api-server/src/lib/resourceAuthors.ts", import.meta.url).href;

const { resolveDoi } = await import(doiUrl) as { resolveDoi(doi: string): Promise<ScholarResult | null> };
const { preferFullAuthorNames } = await import(namesUrl) as { preferFullAuthorNames(current: string[], candidates: string[][]): string[] };
const { titleOverlapScore } = await import(matchingUrl) as { titleOverlapScore(a: string, b: string): number };
const { verifyResource } = await import(verifyUrl) as { verifyResource(input: any): Promise<any> };
const { computeMissingFields, hasMismatch } = await import(resourceStatusUrl) as {
  computeMissingFields(row: any): string[];
  hasMismatch(report: any): boolean;
};
const { syncResourceAuthors } = await import(resourceAuthorsUrl) as { syncResourceAuthors(resourceId: number, authors: string[]): Promise<void> };

const SOURCE_TYPE_OVERRIDES = new Map<number, SourceType>([
  [24, "working_paper"],
  [29, "gov_document"],
  [122, "working_paper"],
  [127, "news"],
  [140, "working_paper"],
  [143, "working_paper"],
  [148, "report"],
  [153, "working_paper"],
  [159, "working_paper"],
  [160, "working_paper"],
  [163, "journal_article"],
  [165, "journal_article"],
  [168, "working_paper"],
  [169, "working_paper"],
  [170, "working_paper"],
  [171, "working_paper"],
  [173, "working_paper"],
  [174, "working_paper"],
  [175, "report"],
  [177, "working_paper"],
  [179, "working_paper"],
  [180, "report"],
  [181, "gov_document"],
  [183, "working_paper"],
  [188, "working_paper"],
  [191, "working_paper"],
  [192, "conference_paper"],
  [193, "working_paper"],
  [194, "report"],
  [196, "report"],
  [198, "working_paper"],
  [204, "working_paper"],
  [206, "working_paper"],
]);

const FIELD_OVERRIDES = new Map<number, Partial<{
  doi: string;
  url: string;
  publishedDate: string;
  sourceType: SourceType;
}>>([
  [165, { doi: "10.1111/jofi.12903", url: "https://doi.org/10.1111/jofi.12903", publishedDate: "2020", sourceType: "journal_article" }],
]);

function sourceTypeFor(id: number, doi: string | null, current: SourceType): SourceType {
  const explicit = SOURCE_TYPE_OVERRIDES.get(id);
  if (explicit) return explicit;
  if (!doi) return current;
  if (/^10\.(?:2139\/ssrn|48550\/arxiv|59576\/sr\.|17016\/ifdp|34989\/sdp)/i.test(doi)) return "working_paper";
  return current;
}

function cleanAbstract(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/<\/?(?:jats:)?p[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;\/?p&gt;|&amp;lt;\/?p&amp;gt;/gi, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

const rows = await db.select().from(resourcesTable).where(and(
  inArray(resourcesTable.status, ["pending", "disputed", "incomplete", "off_topic"]),
));

const summary = { checked: 0, updated: 0, movedToPending: 0, unresolvedDoi: [] as number[], titleMismatch: [] as number[] };

for (const row of rows) {
  const override = FIELD_OVERRIDES.get(row.id) ?? {};
  const doi = override.doi ?? row.doi;
  let resolved: ScholarResult | null = null;
  if (doi) {
    try { resolved = await resolveDoi(doi); }
    catch { summary.unresolvedDoi.push(row.id); }
  }
  summary.checked += 1;

  if (resolved && titleOverlapScore(row.title, resolved.title) < 0.45) {
    summary.titleMismatch.push(row.id);
    resolved = null;
  }

  const authors = resolved?.authors.length
    ? preferFullAuthorNames(row.authors, [resolved.authors])
    : row.authors;
  const currentYear = Number.parseInt(row.publishedDate ?? "", 10) || null;
  const publishedDate = override.publishedDate
    ?? ((!currentYear && resolved?.year) || (currentYear && resolved?.year && Math.abs(currentYear - resolved.year) > 1)
      ? String(resolved.year)
      : row.publishedDate);
  const sourceType = override.sourceType ?? sourceTypeFor(row.id, doi, row.sourceType as SourceType);
  const url = override.url ?? (doi ? `https://doi.org/${doi}` : row.url);
  const abstract = cleanAbstract(row.abstract) ?? cleanAbstract(resolved?.abstract ?? null);

  const candidate = { ...row, authors, publishedDate, sourceType, url, doi, abstract };
  const changed = authors.join("\u0000") !== row.authors.join("\u0000")
    || publishedDate !== row.publishedDate
    || sourceType !== row.sourceType
    || url !== row.url
    || doi !== row.doi
    || abstract !== row.abstract;

  let report = row.verificationReport;
  if (doi && ["disputed", "incomplete"].includes(row.status)) {
    const year = publishedDate?.match(/^\d{4}/)?.[0] ? Number(publishedDate.slice(0, 4)) : null;
    report = await verifyResource({
      title: row.title,
      authors,
      year,
      doi,
      url,
      abstract,
      keywords: row.keywords,
    });
  }

  const missingFields = computeMissingFields(candidate);
  const canMoveToPending = ["disputed", "incomplete"].includes(row.status)
    && missingFields.length === 0
    && report
    && !hasMismatch(report);
  const nextStatus = canMoveToPending ? "pending" : row.status;

  if (changed || report !== row.verificationReport || nextStatus !== row.status) {
    await db.update(resourcesTable).set({
      authors,
      publishedDate,
      sourceType,
      url,
      doi,
      abstract,
      verificationReport: report,
      verifiedAt: report !== row.verificationReport ? new Date() : row.verifiedAt,
      status: nextStatus as any,
      ...(changed && {
        aiReviewStatus: "needs_verification" as const,
        aiReviewSummary: "Authoritative metadata reconciled; administrator verification required.",
        aiReviewDetails: { source: "maintenance_reconciliation", reconciledAt: new Date().toISOString() },
        aiReviewedAt: new Date(),
      }),
    }).where(eq(resourcesTable.id, row.id));
    if (authors.join("\u0000") !== row.authors.join("\u0000")) await syncResourceAuthors(row.id, authors);
    summary.updated += 1;
    if (nextStatus !== row.status) summary.movedToPending += 1;
    console.log(`Updated #${row.id} (${row.status} -> ${nextStatus})`);
  }
}

console.log(JSON.stringify(summary, null, 2));
process.exit(0);
