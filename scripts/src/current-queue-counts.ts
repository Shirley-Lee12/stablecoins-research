import { db, pool, resourcesTable, uploadJobsTable } from "@workspace/db";

const resources = await db.select({ id: resourcesTable.id, status: resourcesTable.status, title: resourcesTable.title, aiReviewStatus: resourcesTable.aiReviewStatus }).from(resourcesTable);
const jobs = await db.select({ id: uploadJobsTable.id, status: uploadJobsTable.status }).from(uploadJobsTable);

const resourceCounts = Object.fromEntries([...new Set(resources.map((row) => row.status))].sort().map((status) => [status, resources.filter((row) => row.status === status).length]));
const jobCounts = Object.fromEntries([...new Set(jobs.map((row) => row.status))].sort().map((status) => [status, jobs.filter((row) => row.status === status).length]));
const pending = resources.filter((row) => row.status === "pending").map((row) => ({ id: row.id, title: row.title, aiReviewStatus: row.aiReviewStatus }));

console.log(JSON.stringify({ resourceCounts, jobCounts, pending }, null, 2));
await pool.end();
