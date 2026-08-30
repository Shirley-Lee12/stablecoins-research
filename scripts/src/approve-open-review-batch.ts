import { and, eq, inArray } from "drizzle-orm";
import { db, resourcesTable, usersTable } from "@workspace/db";

const resourceIds = Array.from({ length: 32 }, (_, index) => index + 297);
const terminalStatuses = ["safe", "needs_verification", "high_risk", "failed"];
const rows = await db.select({
  id: resourcesTable.id,
  status: resourcesTable.status,
  aiReviewStatus: resourcesTable.aiReviewStatus,
  verificationReport: resourcesTable.verificationReport,
}).from(resourcesTable).where(inArray(resourcesTable.id, resourceIds));

const blocked = rows.filter((row) => {
  const report = row.verificationReport as { checks?: Array<{ kind?: string }> } | null;
  return row.status !== "pending"
    || !terminalStatuses.includes(row.aiReviewStatus)
    || row.aiReviewStatus === "high_risk"
    || row.aiReviewStatus === "failed"
    || report?.checks?.some((check) => check.kind === "mismatch");
});
if (rows.length !== resourceIds.length || blocked.length > 0) {
  throw new Error(`Refusing approval: found ${rows.length}/${resourceIds.length}; blocked=${JSON.stringify(blocked.map((row) => row.id))}`);
}

const [reviewer] = await db.select({ id: usersTable.id }).from(usersTable)
  .where(eq(usersTable.role, "admin")).orderBy(usersTable.id).limit(1);
if (!reviewer) throw new Error("No administrator account is available");

const reviewedAt = new Date();
const approved = await db.update(resourcesTable).set({
  status: "approved",
  rejectionReasonId: null,
  rejectionNote: null,
  reviewedBy: reviewer.id,
  reviewedAt,
}).where(and(
  eq(resourcesTable.status, "pending"),
  inArray(resourcesTable.id, resourceIds),
  inArray(resourcesTable.aiReviewStatus, terminalStatuses),
)).returning({ id: resourcesTable.id });

if (approved.length !== resourceIds.length) throw new Error(`Approval changed ${approved.length}/${resourceIds.length} rows`);
console.log(JSON.stringify({ approved: approved.length, reviewedAt: reviewedAt.toISOString() }, null, 2));
