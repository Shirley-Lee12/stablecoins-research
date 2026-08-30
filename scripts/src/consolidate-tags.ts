import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { db, pool, resourceTagsTable, tagsTable } from "@workspace/db";

const MERGES: Record<string, string> = {
  // Theme vocabulary consolidation: 37 public themes -> 30.
  "shadow-banking": "tokenized-deposits-mmf",
  "money-market-funds": "tokenized-deposits-mmf",
  "crypto-asset-foundations": "trading-market-structure",
  "blockchain-foundations": "blockchain-chains",
  "licensing-supervision": "regulatory-frameworks",
  "disclosure-accounting": "reserve-quality-transparency",
  "dollarization-substitution": "capital-flows-sovereignty",

  // Candidate aliases created by earlier free-form entity extraction.
  china: "china-mainland",
  eu: "european-union",
  korea: "south-korea",
  us: "united-states",
  "u-s": "united-states",
  "new-york-state": "united-states",
  uk: "united-kingdom",
  tether: "usdt",
  "usd-coin": "usdc",
  terrausd: "ust",
  "iron-finance": "iron",
};

const UNUSED_INVALID_CANDIDATES = [
  "bitcoin",
  "ethereum",
  "luna",
  "terra-luna",
  "wbtc",
  "iron-titan",
  "imf",
  "oecd",
  "g10",
  "north-america",
  "asia-and-pacific",
  "africa-and-the-middle-east",
  "latin-america-and-the-caribbean",
];

const RETIRED_TAGS = ["global-international", "international"];

async function mergeTag(sourceSlug: string, targetSlug: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [source, target] = await Promise.all([
      tx.select().from(tagsTable).where(eq(tagsTable.slug, sourceSlug)).limit(1).then((rows) => rows[0]),
      tx.select().from(tagsTable).where(eq(tagsTable.slug, targetSlug)).limit(1).then((rows) => rows[0]),
    ]);
    if (!source) return false;
    if (!target) throw new Error(`Cannot merge ${sourceSlug}: target ${targetSlug} does not exist. Run seed-tags first.`);
    if (source.facet !== target.facet) throw new Error(`Cannot merge ${sourceSlug} into a different facet`);

    const sourceLinks = await tx.select().from(resourceTagsTable).where(eq(resourceTagsTable.tagId, source.id));
    for (const sourceLink of sourceLinks) {
      const [targetLink] = await tx
        .select()
        .from(resourceTagsTable)
        .where(and(eq(resourceTagsTable.resourceId, sourceLink.resourceId), eq(resourceTagsTable.tagId, target.id)))
        .limit(1);
      if (!targetLink) {
        await tx.insert(resourceTagsTable).values({
          resourceId: sourceLink.resourceId,
          tagId: target.id,
          source: sourceLink.source,
          score: sourceLink.score,
        });
      } else if (sourceLink.source === "manual" && targetLink.source !== "manual") {
        await tx
          .update(resourceTagsTable)
          .set({ source: "manual", score: targetLink.score ?? sourceLink.score })
          .where(eq(resourceTagsTable.id, targetLink.id));
      }
    }
    await tx.delete(resourceTagsTable).where(eq(resourceTagsTable.tagId, source.id));
    await tx.delete(tagsTable).where(eq(tagsTable.id, source.id));
    return true;
  });
}

async function main() {
  let merged = 0;
  for (const [source, target] of Object.entries(MERGES)) {
    if (await mergeTag(source, target)) merged++;
  }

  let removed = 0;
  for (const slug of RETIRED_TAGS) {
    const [tag] = await db.select().from(tagsTable).where(eq(tagsTable.slug, slug)).limit(1);
    if (!tag) continue;
    await db.delete(resourceTagsTable).where(eq(resourceTagsTable.tagId, tag.id));
    await db.delete(tagsTable).where(eq(tagsTable.id, tag.id));
    removed++;
  }

  for (const slug of UNUSED_INVALID_CANDIDATES) {
    const [tag] = await db.select().from(tagsTable).where(and(eq(tagsTable.slug, slug), eq(tagsTable.status, "candidate"))).limit(1);
    if (!tag) continue;
    const links = await db.select({ id: resourceTagsTable.id }).from(resourceTagsTable).where(eq(resourceTagsTable.tagId, tag.id)).limit(1);
    if (links.length === 0) {
      await db.delete(tagsTable).where(eq(tagsTable.id, tag.id));
      removed++;
    }
  }

  console.log(`Merged ${merged} legacy/alias tags and removed ${removed} retired or unused invalid tags.`);
  await pool.end();
}

main().catch(async (error) => {
  console.error("Tag consolidation failed:", error);
  await pool.end();
  process.exit(1);
});
