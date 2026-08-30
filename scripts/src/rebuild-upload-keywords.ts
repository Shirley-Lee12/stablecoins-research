import { db, pool, uploadJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const uploadRouteUrl = new URL("../../artifacts/api-server/src/routes/upload.ts", import.meta.url).href;
const { runStoredUploadJob } = await import(uploadRouteUrl) as {
  runStoredUploadJob(jobId: number): Promise<void>;
};

type StoredResult = {
  draft?: { title?: string; keywordsSource?: string | null };
  missingRequired?: string[];
};

const allRows = await db.select().from(uploadJobsTable);
const targets = allRows.filter((row) => {
  const result = row.result as StoredResult | null;
  return row.status === "ready_for_review"
    && !!result?.draft?.title?.trim()
    && result.draft.keywordsSource !== "manual";
});

const summary = { selected: targets.length, processed: 0, completed: 0, missingKeywords: [] as number[], failed: [] as number[] };
let cursor = 0;

async function worker(): Promise<void> {
  while (cursor < targets.length) {
    const row = targets[cursor++];
    const result = row.result as StoredResult;
    await db.update(uploadJobsTable).set({
      status: "queued",
      attempts: 0,
      nextAttemptAt: null,
      completedAt: null,
      error: "Rebuilding automatic keywords from the source abstract",
      updatedAt: new Date(),
    }).where(eq(uploadJobsTable.id, row.id));

    await runStoredUploadJob(row.id);
    const [updated] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, row.id)).limit(1);
    const missing = ((updated?.result as StoredResult | null)?.missingRequired ?? []);
    summary.processed += 1;
    if (updated?.status === "failed") summary.failed.push(row.id);
    else if (missing.includes("keywords")) summary.missingKeywords.push(row.id);
    else summary.completed += 1;
    if (summary.processed % 5 === 0 || summary.processed === targets.length) {
      console.log(JSON.stringify({ progress: `${summary.processed}/${targets.length}`, lastId: row.id, status: updated?.status, missing }));
    }
  }
}

await Promise.all(Array.from({ length: Math.min(3, Math.max(1, targets.length)) }, () => worker()));
console.log(JSON.stringify({ summary }, null, 2));
await pool.end();
