import { db, pool, resourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const verifyUrl = new URL("../../artifacts/api-server/src/lib/verify.ts", import.meta.url).href;
const { verifyResource } = await import(verifyUrl) as { verifyResource(input: any): Promise<any> };

const chapters = new Map<number, { title: string; url: string; abstract: string }>([
  [416, {
    title: "Stablecoins as Public Good: Remittances, Humanitarian Aid, and Digital ID",
    url: "https://www.igi-global.com/chapter/stablecoins-as-public-good/399706",
    abstract: "Stablecoins, digital assets designed to maintain price stability by pegging to fiat currencies or collateralized reserves, have often been examined through the lens of private finance, focusing on market speculation, systemic risk, and regulatory arbitrage. This article reframes stablecoins as potential public goods, investigating their role in advancing financial inclusion, humanitarian effectiveness, and digital identity infrastructures. Drawing on recent data from the World Bank, the World Food Programme, and case studies across the Global South, the analysis adopts a comparative methodology and applies transaction cost economics to remittances, graph theory to humanitarian aid distribution, set-theoretical analysis to digital ID integration, and game theory to governance risks between states and private issuers.",
  }],
  [418, {
    title: "How to Implement a Stablecoin Framework",
    url: "https://www.igi-global.com/chapter/how-to-implement-a-stablecoin-framework/400530",
    abstract: "This chapter outlines the legal and institutional process required to implement virtual asset legislation, including stablecoins, with a focus on jurisdictions adopting the Commonwealth Secretariat's Model Laws. It presents a modular, principle-based approach to legislative design, emphasising legal clarity, proportionality, and adaptability. Drawing on comparative practices and implementation case studies, the chapter explores how governments can translate conceptual ambition into enforceable law through legal scoping, stakeholder engagement, modular drafting, and capacity-building. The goal is to equip policymakers, legal drafters, and institutional leaders with a roadmap for embedding digital asset frameworks into domestic law while preserving sovereignty, enabling innovation, and ensuring cross-border coherence.",
  }],
  [420, {
    title: "Global Stablecoin Regulation: Where to From Here?",
    url: "https://www.igi-global.com/chapter/global-stablecoin-regulation/400531",
    abstract: "Stablecoins have firmly established themselves in the core of global digital finance. They now function as payment infrastructure, liquidity tools, and potential public-purpose digital money. Viewed through regulatory, technical, economic, and humanitarian lenses, the chapters in this volume present a consistent conclusion: stablecoins offer significant opportunities for efficiency, inclusion, and financial innovation, but these benefits can only be realised when supported by strong governance frameworks, transparent and high-quality reserves, enforceable redemption rights, and coherent cross-border oversight. At the same time, substantial differences remain in national implementation, supervisory capability, and the treatment of high-risk models such as algorithmic stablecoins.",
  }],
  [426, {
    title: "Enabling Innovation in Stablecoin Markets Through Special Jurisdictions",
    url: "https://www.igi-global.com/chapter/enabling-innovation-in-stablecoin-markets-through-special-jurisdictions/399710",
    abstract: "Once limited to crypto trading, stablecoins are now serving global roles in payments, settlements, and value storage, alongside tokenised deposits and CBDCs. As adoption grows, regulation must balance trust, stability, and innovation. This paper argues that special jurisdictions, such as city states and special economic zones, enable stablecoin innovation without risking macroeconomic stability. Through adaptive regulation, pilot programmes, sandboxes, innovation ecosystems, and specialised dispute-resolution mechanisms, they create controlled environments where stablecoin models can be tested and scaled safely. Case studies including Hong Kong, Singapore, and DIFC show how special jurisdictions can offer credible regulatory pathways to issuers while acting as evidence-generating laboratories for regulators.",
  }],
]);

for (const [id, patch] of chapters) {
  const [row] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, id)).limit(1);
  if (!row || row.status !== "pending") continue;
  const year = Number(row.publishedDate?.slice(0, 4) || 2026);
  const report = await verifyResource({
    title: patch.title,
    authors: row.authors,
    year,
    doi: row.doi,
    url: patch.url,
    abstract: patch.abstract,
    keywords: row.keywords,
  });
  await db.update(resourcesTable).set({
    title: patch.title,
    url: patch.url,
    abstract: patch.abstract,
    sourceType: "report",
    verificationReport: report,
    verifiedAt: new Date(),
    aiReviewStatus: "needs_verification",
    aiReviewSummary: "管理员已根据 IGI Global 官方章节页核对标题、完整作者、DOI、年份和摘要。",
    aiReviewDetails: { source: "igi_global_official_chapter", reconciledAt: new Date().toISOString() },
    aiReviewedAt: new Date(),
    adminEdited: true,
  }).where(eq(resourcesTable.id, id));
  console.log(JSON.stringify({ id, title: patch.title, hasFailure: !!report.hasFailure, hasWarning: !!report.hasWarning }));
}

await pool.end();
