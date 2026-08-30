import { db, pool, uploadJobsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const uploadRouteUrl = new URL("../../artifacts/api-server/src/routes/upload.ts", import.meta.url).href;
const { parseConfirmInput, validateConfirmedTags, persistConfirmedDraft, computedTagScores } = await import(uploadRouteUrl) as {
  parseConfirmInput(value: unknown): any;
  validateConfirmedTags(requestedIds: number[], allowedIds: number[], serverScores: Record<number, number>): Promise<{ tagIds: number[]; tagScores: Record<number, number> }>;
  persistConfirmedDraft(input: any, userId: number, skipNetworkVerification?: boolean, jobId?: number, verifiedReport?: any): Promise<{ id: number; status: string }>;
  computedTagScores(tags: Array<{ id: number; score?: number }>): Record<number, number>;
};
const duplicatesUrl = new URL("../../artifacts/api-server/src/lib/duplicateCheck.ts", import.meta.url).href;
const { findDuplicateCandidates } = await import(duplicatesUrl) as {
  findDuplicateCandidates(input: { title: string; authors: string[]; doi: string | null; url: string | null; year: number | null }): Promise<unknown[]>;
};
type StoredResult = {
  draft?: any;
  tags?: Array<{ id: number; facet?: string; score?: number }>;
  report?: { hasFailure?: boolean };
  missingRequired?: string[];
};

const rows = (await db.select().from(uploadJobsTable)).filter((job) => job.status === "ready_for_review");
const summary = { selected: rows.length, submitted: [] as Array<{ jobId: number; resourceId: number; status: string }>, skipped: [] as Array<{ jobId: number; reason: string }> };

for (const job of rows) {
  const result = job.result as StoredResult | null;
  const draft = result?.draft;
  const tags = result?.tags ?? [];
  if (!draft || (result?.missingRequired?.length ?? 0) > 0 || result?.report?.hasFailure || !tags.some((tag) => tag.facet === "theme")) {
    summary.skipped.push({ jobId: job.id, reason: "not_complete" });
    continue;
  }
  const duplicates = await findDuplicateCandidates({
    title: draft.title,
    authors: draft.authors,
    doi: draft.doi ?? null,
    url: draft.url ?? null,
    year: draft.year ?? null,
  });
  if (duplicates.length > 0) {
    summary.skipped.push({ jobId: job.id, reason: "duplicate" });
    continue;
  }
  try {
    const input = parseConfirmInput({ ...draft, tagIds: tags.map((tag) => tag.id) });
    const validated = await validateConfirmedTags(input.tagIds ?? [], tags.map((tag) => tag.id), computedTagScores(tags));
    input.tagIds = validated.tagIds;
    input.tagScores = validated.tagScores;
    const inserted = await persistConfirmedDraft(input, job.createdBy, job.type === "citation", job.id, result?.report);
    summary.submitted.push({ jobId: job.id, resourceId: inserted.id, status: inserted.status });
  } catch (error) {
    summary.skipped.push({ jobId: job.id, reason: error instanceof Error ? error.message : "confirmation_failed" });
  }
}

console.log(JSON.stringify({
  selected: summary.selected,
  submitted: summary.submitted.length,
  submittedResources: summary.submitted,
  skipped: summary.skipped,
}, null, 2));
await pool.end();
