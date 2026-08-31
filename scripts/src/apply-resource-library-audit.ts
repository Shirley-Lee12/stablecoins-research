import { eq } from "drizzle-orm";
import { db, pool, resourcesTable } from "@workspace/db";

type SourceType = typeof resourcesTable.$inferInsert.sourceType;

type Correction = {
  id: number;
  expectedDoi?: string;
  sourceType?: SourceType;
  keywords?: string[];
  keywordsSource?: "extracted" | "generated" | "manual";
};

// Each change has been checked against a publisher, repository, or issuing-agency record.
// Keep this list deliberately small: it is an evidence-backed correction pass, not an LLM rewrite.
const corrections: Correction[] = [
  // Preprints and working-paper versions identified by their DOI landing records.
  ...[54, 79, 109, 112, 114, 116, 117, 163, 338, 343, 421, 423, 424].map((id) => ({ id, sourceType: "working_paper" as const })),
  // Institutionally published notes and formally published journal articles.
  { id: 51, sourceType: "news" },
  { id: 91, sourceType: "gov_document" },
  { id: 111, expectedDoi: "10.17016/2380-7172.3970", sourceType: "report" },
  { id: 354, expectedDoi: "10.1016/j.jksuci.2022.10.028", sourceType: "journal_article" },
  { id: 384, expectedDoi: "10.1016/J.IPM.2021.102584", sourceType: "journal_article" },
  // IGI Global identifies each .ch DOI as a chapter in an edited book.
  ...[411, 412, 413, 414, 416, 417, 418, 419, 420, 425, 426, 427, 431].map((id) => ({ id, sourceType: "book_chapter" as const })),
  { id: 428, expectedDoi: "10.5281/zenodo.22046755", sourceType: "book" },
  // Mendeley Data supplies this record's own categories; the description is intentionally short.
  {
    id: 433,
    expectedDoi: "10.17632/x2rs7br94g",
    sourceType: "dataset",
    keywords: ["Quantile Regression", "Wavelet", "Price Volatility"],
    keywordsSource: "extracted",
  },
  // The original Chinese keyword field was malformed. These are a conservative, source-grounded
  // fallback from the article's title and abstract, and are visibly labeled as generated.
  {
    id: 25,
    expectedDoi: "10.16494/j.cnki.1002-3933.2026.08.007",
    keywords: ["数字人民币", "稳定币", "金融安全", "制度应对"],
    keywordsSource: "generated",
  },
];

const summary = { checked: 0, updated: 0, skipped: [] as string[] };

for (const correction of corrections) {
  const [row] = await db.select({ id: resourcesTable.id, doi: resourcesTable.doi })
    .from(resourcesTable)
    .where(eq(resourcesTable.id, correction.id))
    .limit(1);
  summary.checked += 1;

  if (!row) {
    summary.skipped.push(`#${correction.id}: resource no longer exists`);
    continue;
  }
  if (correction.expectedDoi && row.doi?.toLowerCase() !== correction.expectedDoi.toLowerCase()) {
    summary.skipped.push(`#${correction.id}: DOI changed; refusing stale correction`);
    continue;
  }

  await db.update(resourcesTable).set({
    ...(correction.sourceType ? { sourceType: correction.sourceType } : {}),
    ...(correction.keywords ? { keywords: correction.keywords } : {}),
    ...(correction.keywordsSource ? { keywordsSource: correction.keywordsSource } : {}),
    adminEdited: true,
  }).where(eq(resourcesTable.id, correction.id));
  summary.updated += 1;
}

console.log(JSON.stringify(summary, null, 2));
await pool.end();
