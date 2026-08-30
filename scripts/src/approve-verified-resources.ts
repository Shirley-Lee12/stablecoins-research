import { db, pool, resourcesTable, usersTable } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";

const duplicateUrl = new URL("../../artifacts/api-server/src/lib/duplicateCheck.ts", import.meta.url).href;
const titleUrl = new URL("../../artifacts/api-server/src/lib/titleCase.ts", import.meta.url).href;
const notificationsUrl = new URL("../../artifacts/api-server/src/lib/followNotifications.ts", import.meta.url).href;
const { findDuplicateCandidates } = await import(duplicateUrl) as {
  findDuplicateCandidates(input: { title: string; authors: string[]; doi: string | null; url: string | null; year: number | null }, excludeResourceId?: number): Promise<unknown[]>;
};
const { normalizeResourceTitle } = await import(titleUrl) as { normalizeResourceTitle(title: string): string };
const { notifyFollowersForApprovedResources } = await import(notificationsUrl) as {
  notifyFollowersForApprovedResources(resourceIds: number[]): Promise<void>;
};

const ids = process.argv.slice(2).map(Number).filter((id) => Number.isInteger(id) && id > 0);
if (ids.length === 0) throw new Error("Pass one or more resource ids");

const rows = await db.select().from(resourcesTable).where(inArray(resourcesTable.id, ids));
const terminalStatuses = new Set(["safe", "needs_verification"]);
const approved: number[] = [];
const skipped: Array<{ id: number; reason: string }> = [];

const [reviewer] = await db.select({ id: usersTable.id }).from(usersTable)
  .where(eq(usersTable.role, "admin")).orderBy(usersTable.id).limit(1);
if (!reviewer) throw new Error("No administrator account is available");

for (const row of rows) {
  const report = row.verificationReport as {
    hasFailure?: boolean;
    checks?: Array<{ kind?: string; status?: string }>;
  } | null;
  if (row.status !== "pending") {
    skipped.push({ id: row.id, reason: `status_${row.status}` });
    continue;
  }
  if (!terminalStatuses.has(row.aiReviewStatus)) {
    skipped.push({ id: row.id, reason: `ai_${row.aiReviewStatus}` });
    continue;
  }
  if (report?.hasFailure || report?.checks?.some((check) => check.kind === "mismatch" || check.status === "❌")) {
    skipped.push({ id: row.id, reason: "verification_failure" });
    continue;
  }
  const year = row.publishedDate?.match(/^\d{4}/u)?.[0];
  const duplicates = await findDuplicateCandidates({
    title: row.title,
    authors: row.authors,
    doi: row.doi,
    url: row.url,
    year: year ? Number(year) : null,
  }, row.id);
  if (duplicates.length > 0) {
    skipped.push({ id: row.id, reason: "duplicate" });
    continue;
  }

  const title = normalizeResourceTitle(row.title.replace(/\s*\*\s*$/u, ""));
  const [updated] = await db.update(resourcesTable).set({
    title,
    status: "approved",
    rejectionReasonId: null,
    rejectionNote: null,
    reviewedBy: reviewer.id,
    reviewedAt: new Date(),
    adminEdited: row.adminEdited || title !== row.title,
  }).where(and(eq(resourcesTable.id, row.id), eq(resourcesTable.status, "pending"))).returning({ id: resourcesTable.id });
  if (updated) approved.push(updated.id);
  else skipped.push({ id: row.id, reason: "concurrent_change" });
}

if (approved.length > 0) await notifyFollowersForApprovedResources(approved);
console.log(JSON.stringify({ requested: ids.length, approved, skipped }, null, 2));
await pool.end();
