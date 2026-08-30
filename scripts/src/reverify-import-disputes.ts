import { eq, inArray } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";

const verifyUrl = new URL("../../artifacts/api-server/src/lib/verify.ts", import.meta.url).href;
const { verifyResource } = await import(verifyUrl) as { verifyResource(input: any): Promise<any> };

await db.update(resourcesTable).set({
  url: "https://tojqi.net/index.php/journal/article/view/10024",
  abstract: "This literature review examines how blockchain-based distributed systems can improve trust and transparency across financial services, supply chains, health care, and public services. It synthesizes opportunities for accountability and traceability alongside challenges involving scalability, interoperability, regulation, and stakeholder coordination.",
  keywords: ["blockchain distributed systems", "trust and transparency", "cross-sector adoption", "interoperability challenges"],
  keywordsSource: "generated",
  aiReviewStatus: "not_started",
  aiReviewSummary: null,
  aiReviewDetails: null,
}).where(eq(resourcesTable.id, 400));

const resourceIds = [345, 373, 377, 400];
const rows = await db.select().from(resourcesTable).where(inArray(resourcesTable.id, resourceIds));
const outcomes: Array<{ id: number; status: string; hasMismatch: boolean }> = [];

for (const resource of rows) {
  const yearMatch = resource.publishedDate?.match(/^\d{4}/);
  const report = await verifyResource({
    title: resource.title,
    authors: resource.authors,
    year: yearMatch ? Number(yearMatch[0]) : null,
    doi: resource.doi,
    url: resource.url,
    abstract: resource.abstract,
    keywords: resource.keywords,
  });
  const hasMismatch = report.checks.some((check: { kind?: string }) => check.kind === "mismatch");
  const status = hasMismatch ? "disputed" : "pending";
  await db.update(resourcesTable).set({
    status,
    verificationReport: report,
    verifiedAt: new Date(),
  }).where(eq(resourcesTable.id, resource.id));
  outcomes.push({ id: resource.id, status, hasMismatch });
}

console.log(JSON.stringify({ outcomes }, null, 2));
