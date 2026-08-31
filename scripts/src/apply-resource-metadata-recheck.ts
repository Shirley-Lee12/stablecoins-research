import { eq } from "drizzle-orm";
import { db, pool, resourcesTable } from "@workspace/db";

type SourceType = typeof resourcesTable.$inferInsert.sourceType;

type Correction = {
  id: number;
  expectedDoi: string;
  title?: string;
  sourceType?: SourceType;
  publishedDate?: string;
  doi?: string;
  url?: string;
  abstract?: string;
  keywords?: string[];
  keywordsSource?: "extracted" | "generated" | "manual";
};

// Checked against the DOI registrar record plus the publisher or repository landing page.
// These are evidence-backed corrections from the second full-catalogue pass.
const corrections: Correction[] = [
  { id: 445, expectedDoi: "10.1016/j.econlet.2025.112720", publishedDate: "2025" },
  {
    id: 404,
    expectedDoi: "10.2139/ssrn.3940678",
    doi: "10.48550/arXiv.2203.14601",
    keywords: ["Ethereum", "miner bribery", "transaction fees", "London Fork", "blockchain security"],
    keywordsSource: "extracted",
  },
  {
    id: 403,
    expectedDoi: "10.2139/ssrn.3264448",
    title: "Bitcoin as Decentralized Money: Prices, Mining Rewards, and Network Security",
  },
  { id: 396, expectedDoi: "10.1007/978-3-662-54970-4_33", publishedDate: "2017" },
  { id: 381, expectedDoi: "10.1109/ICBC59979.2024.10634404", publishedDate: "2024" },
  { id: 377, expectedDoi: "10.48550/arXiv.2305.17655", publishedDate: "2023" },
  { id: 360, expectedDoi: "10.19153/cleiej.25.3.4", publishedDate: "2023" },
  {
    id: 346,
    expectedDoi: "10.1007/978-3-030-43725-1_13",
    title: "SoK: Transparent Dishonesty: Front-Running Attacks on Blockchain",
    sourceType: "conference_paper",
    publishedDate: "2020",
    url: "https://doi.org/10.1007/978-3-030-43725-1_13",
    abstract: "We define front-running as benefiting from privileged knowledge of upcoming transactions and trades. The paper surveys front-running in the 25 most active Ethereum decentralised applications, analyses the Status.im initial coin offering for abnormal miner behaviour, and organises proposed mitigations into practical categories.",
    keywords: ["front-running", "Ethereum", "decentralized applications", "initial coin offering", "blockchain transparency"],
    keywordsSource: "extracted",
  },
  { id: 343, expectedDoi: "10.2139/ssrn.3189051", publishedDate: "2018" },
  { id: 338, expectedDoi: "10.2139/ssrn.4038788", publishedDate: "2022" },
  {
    id: 317,
    expectedDoi: "10.22541/au.168568220.09436681/v1",
    title: "SoK: Decentralized Finance (DeFi) - Fundamentals, Taxonomy and Risks",
    sourceType: "working_paper",
  },
  { id: 310, expectedDoi: "10.1109/DAPPS52256.2021.00010", publishedDate: "2021" },
  {
    id: 285,
    expectedDoi: "10.48550/arXiv.2109.08939",
    title: "Decentralized Governance of Stablecoins with Closed Form Valuation",
    abstract: "We model incentive security in non-custodial stablecoins and derive conditions for participation across risk absorbers, including vaults and CDPs, and governance-token holders. Using option-pricing theory, we derive closed-form stakeholder valuations, an incentive-compatible interest rate, and conditions for equilibria without governance attacks.",
    keywords: ["stablecoins", "decentralized governance", "closed-form valuation", "option pricing", "incentive security"],
    keywordsSource: "extracted",
  },
  {
    id: 155,
    expectedDoi: "10.48550/arXiv.2512.02418",
    title: "Leveraging Large Language Models to Bridge Cross-Domain Transparency in Stablecoins",
    abstract: "Stablecoin transparency is fragmented across issuer disclosures, circulation data, and reserve evidence. This paper introduces an LLM-based framework that aligns disclosure documents with multi-chain issuance evidence, retrieves and compares information across these data domains, and supports automated auditing of discrepancies between reported and observable stablecoin data.",
    keywords: ["large language models", "stablecoins", "cross-domain transparency", "automated auditing", "model context protocol"],
    keywordsSource: "extracted",
  },
];

const summary = { checked: 0, updated: 0, skipped: [] as string[] };

for (const correction of corrections) {
  const [row] = await db.select({ id: resourcesTable.id, doi: resourcesTable.doi })
    .from(resourcesTable)
    .where(eq(resourcesTable.id, correction.id))
    .limit(1);
  summary.checked += 1;

  if (!row) {
    summary.skipped.push(`#${correction.id}: resource no longer exists`);
    continue;
  }
  if (row.doi?.toLowerCase() !== correction.expectedDoi.toLowerCase()) {
    summary.skipped.push(`#${correction.id}: DOI changed; refusing stale correction`);
    continue;
  }

  await db.update(resourcesTable).set({
    ...(correction.title ? { title: correction.title } : {}),
    ...(correction.sourceType ? { sourceType: correction.sourceType } : {}),
    ...(correction.publishedDate ? { publishedDate: correction.publishedDate } : {}),
    ...(correction.doi ? { doi: correction.doi } : {}),
    ...(correction.url ? { url: correction.url } : {}),
    ...(correction.abstract ? { abstract: correction.abstract } : {}),
    ...(correction.keywords ? { keywords: correction.keywords } : {}),
    ...(correction.keywordsSource ? { keywordsSource: correction.keywordsSource } : {}),
    adminEdited: true,
  }).where(eq(resourcesTable.id, correction.id));
  summary.updated += 1;
}

console.log(JSON.stringify(summary, null, 2));
await pool.end();
