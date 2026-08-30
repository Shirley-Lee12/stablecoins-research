import { db, pool, uploadJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type StoredResult = {
  draft?: { title?: string };
  missingRequired?: string[];
  report?: { hasFailure?: boolean };
  duplicateCandidates?: unknown[];
  tags?: Array<{ facet?: string }>;
};

const uploadRouteUrl = new URL("../../artifacts/api-server/src/routes/upload.ts", import.meta.url).href;
const { runStoredUploadJob } = await import(uploadRouteUrl) as {
  runStoredUploadJob(jobId: number): Promise<void>;
};

function needsAction(result: StoredResult | null): boolean {
  return !!result && (
    (result.missingRequired?.length ?? 0) > 0
    || !!result.report?.hasFailure
    || !result.tags?.some((tag) => tag.facet === "theme")
    || (result.duplicateCandidates?.length ?? 0) > 0
  );
}

const requestedIds = process.argv.slice(2).map(Number).filter((id) => Number.isInteger(id) && id > 0);
const rows = (await db.select().from(uploadJobsTable)).filter((row) =>
  row.status === "ready_for_review"
  && (requestedIds.length === 0 || requestedIds.includes(row.id))
  && needsAction(row.result as StoredResult | null),
);

let cursor = 0;
const summary = { selected: rows.length, processed: 0, resolved: 0, stillNeedsAction: 0, failed: 0 };

async function worker(): Promise<void> {
  while (cursor < rows.length) {
    const row = rows[cursor++];
    const title = (row.result as StoredResult | null)?.draft?.title ?? `Job ${row.id}`;
    try {
      await db.update(uploadJobsTable).set({
        status: "queued",
        attempts: 0,
        nextAttemptAt: null,
        completedAt: null,
        error: "Applying repaired enrichment flow",
        updatedAt: new Date(),
      }).where(eq(uploadJobsTable.id, row.id));
      await runStoredUploadJob(row.id);
      const [updated] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, row.id)).limit(1);
      const unresolved = updated?.status !== "ready_for_review" || needsAction(updated.result as StoredResult | null);
      summary.processed += 1;
      if (unresolved) summary.stillNeedsAction += 1; else summary.resolved += 1;
      if (updated?.status === "failed") summary.failed += 1;
      console.log(JSON.stringify({
        id: row.id,
        title,
        status: updated?.status,
        missing: (updated?.result as StoredResult | null)?.missingRequired ?? [],
        verificationFailed: !!(updated?.result as StoredResult | null)?.report?.hasFailure,
      }));
    } catch (error) {
      summary.processed += 1;
      summary.stillNeedsAction += 1;
      summary.failed += 1;
      console.error(JSON.stringify({ id: row.id, title, error: error instanceof Error ? error.message : String(error) }));
    }
  }
}

await Promise.all(Array.from({ length: Math.min(2, Math.max(1, rows.length)) }, () => worker()));
console.log(JSON.stringify({ summary }, null, 2));
await pool.end();
