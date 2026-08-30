import { copyFile, readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { db, pool, uploadJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const uploadRouteUrl = new URL("../../artifacts/api-server/src/routes/upload.ts", import.meta.url).href;
const { runStoredUploadJob } = await import(uploadRouteUrl) as {
  runStoredUploadJob(jobId: number): Promise<void>;
};

const [jobIdInput, sourcePath] = process.argv.slice(2);
const jobId = Number(jobIdInput);

if (!Number.isInteger(jobId) || jobId <= 0 || !sourcePath) {
  throw new Error("Usage: restore-upload-job <failed-pdf-job-id> <original-pdf-path>");
}

try {
  const [job] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, jobId)).limit(1);
  if (!job) throw new Error(`Upload job ${jobId} was not found`);
  if (job.type !== "pdf" || !["failed", "queued"].includes(job.status)) {
    throw new Error(`Upload job ${jobId} is not a failed or queued PDF task`);
  }

  const input = job.input as Record<string, unknown>;
  const expectedHash = typeof input.sha256 === "string" ? input.sha256 : null;
  if (!expectedHash) throw new Error(`Upload job ${jobId} has no saved source hash`);
  const actualHash = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  if (actualHash !== expectedHash) throw new Error("The selected PDF does not match the original upload task");

  const stagedPath = `${tmpdir().replace(/\/$/, "")}/stablecoin-upload-restore-${jobId}-${randomUUID()}.pdf`;
  await copyFile(sourcePath, stagedPath);
  await db.update(uploadJobsTable).set({
    input: { ...input, payloadVersion: 2, tempFilePath: stagedPath },
    status: "queued",
    attempts: 0,
    nextAttemptAt: null,
    completedAt: null,
    error: "Original PDF restored for retry",
    updatedAt: new Date(),
  }).where(eq(uploadJobsTable.id, jobId));

  await runStoredUploadJob(jobId);
  const [updated] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, jobId)).limit(1);
  const result = updated?.result as { draft?: { title?: string }; missingRequired?: string[]; report?: { hasFailure?: boolean } } | null;
  console.log(JSON.stringify({
    jobId,
    status: updated?.status,
    title: result?.draft?.title ?? null,
    missingRequired: result?.missingRequired ?? [],
    verificationFailed: !!result?.report?.hasFailure,
  }, null, 2));
} finally {
  await pool.end();
}
