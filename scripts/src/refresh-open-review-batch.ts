import { eq, inArray } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";

const uploadUrl = new URL("../../artifacts/api-server/src/routes/upload.ts", import.meta.url).href;
const verifyUrl = new URL("../../artifacts/api-server/src/lib/verify.ts", import.meta.url).href;
const { generateKeywordsFromAbstract } = await import(uploadUrl) as {
  generateKeywordsFromAbstract(title: string, abstract: string, sourceKeywords?: string[]): Promise<string[]>;
};
const { verifyResource } = await import(verifyUrl) as { verifyResource(input: any): Promise<any> };

const resourceIds = Array.from({ length: 32 }, (_, index) => index + 297);

await db.update(resourcesTable).set({
  doi: "10.1109/CVCBT.2019.00011",
  url: "https://doi.org/10.1109/CVCBT.2019.00011",
}).where(eq(resourcesTable.id, 319));

const rows = await db.select().from(resourcesTable).where(inArray(resourcesTable.id, resourceIds));
const refreshedKeywords: number[] = [];
const requeuedIds = new Set([306, 309, 319]);

for (const resource of rows) {
  const currentKeywords = resource.keywords;
  const needsKeywordRefresh = currentKeywords.length < 3
    || currentKeywords.length > 4
    || currentKeywords.some((keyword) => keyword !== keyword.toLocaleLowerCase());
  const keywords = needsKeywordRefresh
    ? await generateKeywordsFromAbstract(resource.title, resource.abstract ?? "", currentKeywords)
    : currentKeywords;
  if (needsKeywordRefresh && keywords.length >= 3 && keywords.length <= 4) refreshedKeywords.push(resource.id);

  const publishedYear = resource.publishedDate?.match(/^\d{4}/)?.[0];
  const report = await verifyResource({
    title: resource.title,
    authors: resource.authors,
    year: publishedYear ? Number(publishedYear) : null,
    doi: resource.id === 319 ? "10.1109/CVCBT.2019.00011" : resource.doi,
    url: resource.id === 319 ? "https://doi.org/10.1109/CVCBT.2019.00011" : resource.url,
    abstract: resource.abstract,
    keywords,
  });
  const hasMismatch = report.checks.some((check: { kind?: string }) => check.kind === "mismatch");
  await db.update(resourcesTable).set({
    ...(needsKeywordRefresh && keywords.length >= 3 && keywords.length <= 4
      ? { keywords, keywordsSource: "generated" }
      : {}),
    status: hasMismatch ? "disputed" : "pending",
    verificationReport: report,
    verifiedAt: new Date(),
    ...(requeuedIds.has(resource.id)
      ? { aiReviewStatus: "not_started", aiReviewSummary: null, aiReviewDetails: null, aiReviewedAt: null }
      : {}),
  }).where(eq(resourcesTable.id, resource.id));
}

console.log(JSON.stringify({ refreshedKeywords, requeuedIds: [...requeuedIds] }, null, 2));
