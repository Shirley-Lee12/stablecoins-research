import "dotenv/config";
import { db, tagsTable, pool } from "@workspace/db";
import { eq, inArray, isNull, and } from "drizzle-orm";

// Source: docs/planning/15-用户反馈批量修复与优化.md §3.2/§3.3.
// One-off backfill for the tags.category column added by migration 0016 — seed-tags.ts's
// onConflictDoNothing skips rows that already exist, so pre-existing theme tags need an explicit
// UPDATE to pick up their category. Idempotent — only touches theme rows where category is null.

const CATEGORY_SLUGS: Record<string, string[]> = {
  types_mechanisms: ["fiat-collateralized", "crypto-collateralized", "algorithmic", "commodity-rwa-backed", "cbdc", "tokenized-deposits-mmf"],
  stability_risk: ["peg-stability-depeg", "run-liquidity-risk", "reserve-quality-transparency", "collateral-risk", "smart-contract-security", "custody-counterparty", "systemic-contagion"],
  regulation_policy: ["regulatory-frameworks", "licensing-supervision", "aml-cft", "consumer-protection", "disclosure-accounting", "cross-border-coordination"],
  monetary_macro: ["monetary-transmission", "dollarization-substitution", "bank-disintermediation", "capital-flows-sovereignty"],
  markets_adoption: ["payments-remittances", "defi-lending", "trading-market-structure", "adoption-emerging-markets", "market-data-supply"],
  tech_infrastructure: ["blockchain-chains", "interoperability-bridges", "oracles-data-feeds", "privacy-compliance-tech", "programmability"],
};

async function main() {
  let updated = 0;
  for (const [category, slugs] of Object.entries(CATEGORY_SLUGS)) {
    const rows = await db
      .update(tagsTable)
      .set({ category })
      .where(and(inArray(tagsTable.slug, slugs), isNull(tagsTable.category)))
      .returning({ slug: tagsTable.slug });
    updated += rows.length;
  }

  const stillMissing = await db
    .select({ slug: tagsTable.slug })
    .from(tagsTable)
    .where(and(eq(tagsTable.facet, "theme"), isNull(tagsTable.category)));

  console.log(`Backfilled category on ${updated} theme tag(s).`);
  if (stillMissing.length > 0) {
    console.warn(`${stillMissing.length} theme tag(s) still have no category (not in the mapping table — check for new slugs):`, stillMissing.map((r) => r.slug));
  }
  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
