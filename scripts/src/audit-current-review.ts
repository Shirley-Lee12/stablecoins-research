import { db, pool, resourcesTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const ids = process.argv.slice(2).map(Number).filter((id) => Number.isInteger(id) && id > 0);
if (ids.length === 0) throw new Error("Pass one or more resource ids");

const rows = await db.select().from(resourcesTable).where(inArray(resourcesTable.id, ids));
for (const row of rows.sort((a, b) => a.id - b.id)) {
  const report = row.verificationReport as {
    hasFailure?: boolean;
    hasWarning?: boolean;
    checks?: Array<{ field?: string; kind?: string; message?: string }>;
  } | null;
  console.log(JSON.stringify({
    id: row.id,
    title: row.title,
    status: row.status,
    aiReviewStatus: row.aiReviewStatus,
    aiReviewSummary: row.aiReviewSummary,
    hasFailure: !!report?.hasFailure,
    hasWarning: !!report?.hasWarning,
    checks: report?.checks ?? [],
    authors: row.authors,
    keywords: row.keywords,
    doi: row.doi,
    url: row.url,
  }));
}

await pool.end();
