import { and, eq, inArray } from "drizzle-orm";
import { db, resourceTagsTable, resourcesTable } from "@workspace/db";

const verifyUrl = new URL("../../artifacts/api-server/src/lib/verify.ts", import.meta.url).href;
const authorsUrl = new URL("../../artifacts/api-server/src/lib/resourceAuthors.ts", import.meta.url).href;
const { verifyResource, verifyCitationRecord } = await import(verifyUrl) as {
  verifyResource(input: any): Promise<any>;
  verifyCitationRecord(input: any): any;
};
const { syncResourceAuthors } = await import(authorsUrl) as { syncResourceAuthors(resourceId: number, authors: string[]): Promise<void> };

const reviewerId = 10;

async function updateAndVerify(id: number, patch: Record<string, unknown>, citationRecord = false): Promise<void> {
  const [current] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
  if (!current) throw new Error(`Resource ${id} not found`);
  const next = { ...current, ...patch } as typeof current;
  const year = next.publishedDate?.match(/^\d{4}/)?.[0] ? Number(next.publishedDate.slice(0, 4)) : null;
  const verifyInput = {
    title: next.title,
    authors: next.authors,
    year,
    doi: next.doi,
    url: next.url,
    abstract: next.abstract,
    keywords: next.keywords,
  };
  const verificationReport = citationRecord ? verifyCitationRecord(verifyInput) : await verifyResource(verifyInput);
  await db.update(resourcesTable).set({
    ...patch,
    status: "pending",
    verificationReport,
    verifiedAt: new Date(),
    aiReviewStatus: "needs_verification",
    aiReviewSummary: "Administrator reconciled this record against an authoritative source.",
    aiReviewDetails: { source: "manual_source_reconciliation", reconciledAt: new Date().toISOString() },
    aiReviewedAt: new Date(),
    rejectionReasonId: null,
    rejectionNote: null,
  }).where(eq(resourcesTable.id, id));
  if (patch.authors) await syncResourceAuthors(id, patch.authors as string[]);
}

await updateAndVerify(24, {
  authors: ["Gary B. Gorton", "Jeffery Y. Zhang"],
  keywords: ["financial regulation", "stablecoins", "central bank digital currencies"],
  keywordsSource: "extracted",
});

await updateAndVerify(26, {
  publishedDate: "2026-06-10",
  abstract: "本文报道香港稳定币监管制度进入实施阶段后的最新进展。香港金融管理局总裁余伟文介绍首批持牌发行人的预计推出时间和跨境支付、零售支付等应用场景，并说明香港将先观察首批机构运营情况，再评估新增牌照。文章同时涉及跨境理财通、离岸人民币融资及香港国际金融中心建设。",
  keywords: ["香港稳定币监管", "稳定币牌照", "香港金融管理局", "跨境支付", "离岸人民币"],
  keywordsSource: "generated",
}, true);

await updateAndVerify(29, {
  abstract: "The document summarises 28 consultation responses to the Hong Kong Monetary Authority's draft supervisory guideline for licensed stablecoin issuers, explains the HKMA's responses, and sets out the conclusions and way forward. Its annex contains the finalised guideline supporting the Stablecoins Ordinance regime effective from 1 August 2025.",
  keywords: ["licensed stablecoin issuers", "supervision", "Hong Kong", "Stablecoins Ordinance", "regulatory consultation"],
  keywordsSource: "extracted",
});

await updateAndVerify(243, {
  authors: ["米晋宏", "陈雨晨", "罗佳", "葛劲峰"],
  publishedDate: "2026-05-09",
  url: "https://jiro.cbpt.cnki.net/portal/journal/portal/client/paper/aecb81ac26c7d5568a0e558f41507e3b",
}, true);

await updateAndVerify(155, {
  authors: ["Yuexin Xiang", "Yuchen Lei", "SM Mahir Shazeed Rish", "Yuanzhe Zhang", "Qin Wang", "Tsz Hon Yuen", "Jiangshan Yu"],
});

await updateAndVerify(157, { authors: ["Brian Zhu"] });

await updateAndVerify(127, { publishedDate: "2025-06-23" }, true);
await updateAndVerify(141, { title: "An Event Study on the May 2022 Stablecoin Market Crash" });
await updateAndVerify(150, { sourceType: "report" }, true);
await updateAndVerify(173, {
  doi: "10.5281/zenodo.19157481",
  url: "https://doi.org/10.5281/zenodo.19157481",
  publishedDate: "2026-03-22",
});
await updateAndVerify(179, {
  doi: "10.1080/14697688.2026.2671176",
  url: "https://doi.org/10.1080/14697688.2026.2671176",
  publishedDate: "2026",
  sourceType: "journal_article",
  authors: ["Alexander Hammerl"],
});

const [resource227] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, 227)).limit(1);
if (resource227) {
  const checks = ((resource227.verificationReport as any)?.checks ?? []).map((check: any) => check.field === "authors"
    ? { field: "authors", status: "✅", detail: "作者已依据期刊原文人工确认" }
    : check);
  await db.update(resourcesTable).set({
    status: "pending",
    verificationReport: {
      checks,
      hasFailure: checks.some((check: any) => check.status === "❌"),
      hasWarning: checks.some((check: any) => check.status === "⚠️"),
    },
    verifiedAt: new Date(),
    aiReviewStatus: "needs_verification",
    aiReviewSummary: "Authors confirmed against the journal PDF.",
    aiReviewDetails: { source: "journal_pdf_manual_confirmation", reconciledAt: new Date().toISOString() },
    aiReviewedAt: new Date(),
  }).where(eq(resourcesTable.id, 227));
}

await db.insert(resourceTagsTable).values([
  { resourceId: 132, tagId: 13, source: "manual" },
  { resourceId: 132, tagId: 23, source: "manual" },
  { resourceId: 247, tagId: 25, source: "manual" },
  { resourceId: 247, tagId: 33, source: "manual" },
]).onConflictDoUpdate({
  target: [resourceTagsTable.resourceId, resourceTagsTable.tagId],
  set: { source: "manual" },
});
await db.update(resourcesTable).set({
  status: "pending",
  aiReviewStatus: "needs_verification",
  aiReviewSummary: "Administrator confirmed direct relevance to stablecoins or MakerDAO.",
  aiReviewDetails: { source: "manual_topic_confirmation", reconciledAt: new Date().toISOString() },
  aiReviewedAt: new Date(),
}).where(inArray(resourcesTable.id, [132, 247]));

await db.update(resourcesTable).set({
  status: "rejected",
  rejectionReasonId: 9,
  rejectionNote: "The article concerns Bank of Korea monetary-policy positioning and does not substantively address stablecoins.",
  reviewedBy: reviewerId,
  reviewedAt: new Date(),
}).where(and(eq(resourcesTable.id, 28), eq(resourcesTable.status, "incomplete")));

await db.update(resourcesTable).set({
  status: "rejected",
  rejectionReasonId: 9,
  rejectionNote: "The study concerns general crypto-asset user security behaviour rather than stablecoins; retain it outside the public stablecoin library as a methodological reference.",
  reviewedBy: reviewerId,
  reviewedAt: new Date(),
}).where(and(eq(resourcesTable.id, 129), eq(resourcesTable.status, "off_topic")));

await db.update(resourcesTable).set({
  status: "rejected",
  rejectionReasonId: 8,
  rejectionNote: "No authoritative publisher, DOI, repository record, or independent bibliographic record could be found for this item; the ResearchGate-only record is insufficient to establish authenticity.",
  reviewedBy: reviewerId,
  reviewedAt: new Date(),
}).where(and(eq(resourcesTable.id, 140), eq(resourcesTable.status, "pending")));

await db.update(resourcesTable).set({
  status: "rejected",
  rejectionReasonId: 9,
  rejectionNote: "This paper concerns the mBridge multi-CBDC cross-border payment system and does not substantively study stablecoins. Retain it outside the public stablecoin library as an adjacent digital-money reference.",
  reviewedBy: reviewerId,
  reviewedAt: new Date(),
}).where(and(eq(resourcesTable.id, 167), eq(resourcesTable.status, "pending")));

console.log(JSON.stringify({
  movedToPending: [24, 26, 29, 243, 155, 157, 227, 132, 247, 127, 141, 150, 173, 179],
  rejected: [28, 129, 140, 167],
}));
process.exit(0);
