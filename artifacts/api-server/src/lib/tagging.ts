import { and, eq, inArray } from "drizzle-orm";
import { db, resourcesTable, tagsTable, resourceTagsTable, type Tag } from "@workspace/db";
import { embedText, generateJson } from "./llm";

const THEME_MATCH_LIMIT = 4;
const THEME_SIMILARITY_THRESHOLD = 0.5;

// Common abbreviations the literature uses instead of the seeded canonical name — alias matching
// alone would otherwise miss most real mentions ("the US Treasury", not "the United States Treasury").
const JURISDICTION_ALIASES: Record<string, string[]> = {
  "united-states": ["US", "U.S.", "USA", "U.S.A."],
  "european-union": ["EU", "E.U."],
  "united-kingdom": ["UK", "U.K."],
  uae: ["UAE", "U.A.E.", "Emirates"],
  "hong-kong": ["HK"],
  "china-mainland": ["PRC", "Mainland China"],
  "south-korea": ["Korea"],
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary match — plain substring search would let "UST" match inside "trust"/"robust". */
function textMentions(text: string, candidate: string): boolean {
  if (candidate.length < 2) return false;
  return new RegExp(`\\b${escapeRegex(candidate)}\\b`, "i").test(text);
}

function tagAliases(tag: Tag): string[] {
  const aliases = [tag.nameEn, tag.slug];
  // "USDC (USD Coin)" -> also try "USDC" and "USD Coin" individually.
  const paren = tag.nameEn.match(/^(.+?)\s*\((.+?)\)\s*$/);
  if (paren) aliases.push(paren[1].trim(), paren[2].trim());
  aliases.push(...(JURISDICTION_ALIASES[tag.slug] ?? []));
  return aliases;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface NamedEntities {
  assets: string[];
  jurisdictions: string[];
}

/**
 * Asks the LLM which stablecoin tickers / jurisdictions are explicitly named in the text — used
 * only to discover terms missing from the controlled vocabulary (candidate queue), not for theme
 * tagging, which relies on embedding similarity instead.
 */
async function extractNamedEntities(text: string): Promise<NamedEntities> {
  if (!text.trim()) return { assets: [], jurisdictions: [] };
  const prompt = `Read the following academic/research text about stablecoins and list:
- "assets": specific stablecoin names or tickers explicitly mentioned (e.g. "USDT", "DAI") — skip generic terms like "stablecoin"
- "jurisdictions": specific countries, regions, or jurisdictions explicitly named in a regulatory/policy context

Text:
---
${text.slice(0, 4000)}
---

Return ONLY a JSON object: { "assets": string[], "jurisdictions": string[] }`;
  try {
    const raw = await generateJson(prompt, 512);
    const parsed = JSON.parse(raw);
    return {
      assets: Array.isArray(parsed.assets) ? parsed.assets.filter((s: unknown): s is string => typeof s === "string") : [],
      jurisdictions: Array.isArray(parsed.jurisdictions) ? parsed.jurisdictions.filter((s: unknown): s is string => typeof s === "string") : [],
    };
  } catch {
    return { assets: [], jurisdictions: [] };
  }
}

/**
 * Resolves extracted entity names against known tags (creating a status='candidate' tag for any
 * name that doesn't match an existing slug yet). Shared by the asset and jurisdiction facets.
 * Writing a new candidate *tag definition* here is vocabulary maintenance, not writing the
 * resource itself — it's a separate concern from the two-step "parse -> confirm -> persist" rule
 * that governs resources/resource_tags.
 */
async function resolveCandidates(
  names: string[],
  facet: "asset" | "jurisdiction",
  tagsBySlug: Map<string, Tag>,
  alreadyMatchedIds: Set<number>,
  onCandidateCreated?: () => void,
): Promise<number[]> {
  const result: number[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const existing = tagsBySlug.get(slug);
    if (existing) {
      if (!alreadyMatchedIds.has(existing.id)) result.push(existing.id);
      continue;
    }
    const [created] = await db
      .insert(tagsTable)
      .values({ slug, nameEn: name, nameZh: name, facet, status: "candidate" })
      .onConflictDoNothing({ target: tagsTable.slug })
      .returning();
    if (created) {
      tagsBySlug.set(slug, created);
      result.push(created.id);
      onCandidateCreated?.();
    } else {
      // Lost a race with another insert in this same run — look up what landed.
      const [row] = await db.select().from(tagsTable).where(eq(tagsTable.slug, slug)).limit(1);
      if (row) {
        tagsBySlug.set(slug, row);
        result.push(row.id);
      }
    }
  }
  return result;
}

export interface TagVocabulary {
  tagsBySlug: Map<string, Tag>;
  themeTagEmbeddings: { id: number; embedding: number[] }[];
  activeAssetTags: Tag[];
  activeJurisdictionTags: Tag[];
}

/**
 * Loads the current tag vocabulary and pre-computes theme tag definition embeddings once —
 * reused across every computeTagsForText() call in the same retag run or upload batch, since the
 * vocabulary doesn't change mid-run.
 */
export async function loadTagVocabulary(): Promise<TagVocabulary> {
  const allTags = await db.select().from(tagsTable);
  const tagsBySlug = new Map(allTags.map((t) => [t.slug, t]));
  const activeThemeTags = allTags.filter((t) => t.facet === "theme" && t.status === "active");
  const activeAssetTags = allTags.filter((t) => t.facet === "asset" && t.status === "active");
  const activeJurisdictionTags = allTags.filter((t) => t.facet === "jurisdiction" && t.status === "active");
  const themeTagEmbeddings = await Promise.all(
    activeThemeTags.map(async (tag) => ({ id: tag.id, embedding: await embedText(tag.definition ?? tag.nameEn) })),
  );
  return { tagsBySlug, themeTagEmbeddings, activeAssetTags, activeJurisdictionTags };
}

export interface ComputedTags {
  themeTagIds: number[];
  assetTagIds: number[];
  jurisdictionTagIds: number[];
  candidateTagIds: number[];
}

/**
 * Core matcher — shared by retagResources() (existing DB rows, see below) and the upload pipeline
 * (in-memory drafts that haven't been persisted yet, see lib/scholar and the import routes). Takes
 * a pre-loaded TagVocabulary so callers can batch many texts against one vocabulary snapshot.
 */
export async function computeTagsForText(text: string, vocab: TagVocabulary, onCandidateCreated?: () => void): Promise<ComputedTags> {
  if (!text.trim()) return { themeTagIds: [], assetTagIds: [], jurisdictionTagIds: [], candidateTagIds: [] };

  const textEmbedding = await embedText(text);
  const themeTagIds = vocab.themeTagEmbeddings
    .map((t) => ({ id: t.id, score: cosineSimilarity(textEmbedding, t.embedding) }))
    .filter((t) => t.score >= THEME_SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, THEME_MATCH_LIMIT)
    .map((t) => t.id);

  const assetTagIds = vocab.activeAssetTags.filter((tag) => tagAliases(tag).some((alias) => textMentions(text, alias))).map((t) => t.id);
  const jurisdictionTagIds = vocab.activeJurisdictionTags.filter((tag) => tagAliases(tag).some((alias) => textMentions(text, alias))).map((t) => t.id);

  const { assets: extractedAssets, jurisdictions: extractedJurisdictions } = await extractNamedEntities(text);
  const assetCandidates = await resolveCandidates(extractedAssets, "asset", vocab.tagsBySlug, new Set(assetTagIds), onCandidateCreated);
  const jurisdictionCandidates = await resolveCandidates(extractedJurisdictions, "jurisdiction", vocab.tagsBySlug, new Set(jurisdictionTagIds), onCandidateCreated);

  return {
    themeTagIds,
    assetTagIds,
    jurisdictionTagIds,
    candidateTagIds: [...assetCandidates, ...jurisdictionCandidates],
  };
}

export interface RetagSummary {
  resourcesProcessed: number;
  themeTagsLinked: number;
  assetTagsLinked: number;
  jurisdictionTagsLinked: number;
  candidatesCreated: number;
}

/**
 * Rebuilds the auto-generated (resource_tags.source='auto') tag links for the given resources,
 * or the whole library when resourceIds is omitted. Idempotent and safe to rerun after the tag
 * vocabulary changes — manually-added (source='manual') links are never touched, since the unique
 * (resourceId, tagId) constraint means an auto-insert for an already-manual pair is just skipped.
 */
export async function retagResources(resourceIds?: number[]): Promise<RetagSummary> {
  const vocab = await loadTagVocabulary();

  const resources = await db
    .select({ id: resourcesTable.id, title: resourcesTable.title, abstract: resourcesTable.abstract })
    .from(resourcesTable)
    .where(resourceIds ? inArray(resourcesTable.id, resourceIds) : undefined);

  const summary: RetagSummary = {
    resourcesProcessed: 0,
    themeTagsLinked: 0,
    assetTagsLinked: 0,
    jurisdictionTagsLinked: 0,
    candidatesCreated: 0,
  };

  for (const resource of resources) {
    const text = [resource.title, resource.abstract].filter(Boolean).join("\n\n");
    const computed = await computeTagsForText(text, vocab, () => summary.candidatesCreated++);
    const autoTagIds = [...new Set([...computed.themeTagIds, ...computed.assetTagIds, ...computed.jurisdictionTagIds, ...computed.candidateTagIds])];

    await db.transaction(async (tx) => {
      await tx.delete(resourceTagsTable).where(and(eq(resourceTagsTable.resourceId, resource.id), eq(resourceTagsTable.source, "auto")));
      if (autoTagIds.length > 0) {
        await tx
          .insert(resourceTagsTable)
          .values(autoTagIds.map((tagId) => ({ resourceId: resource.id, tagId, source: "auto" as const })))
          .onConflictDoNothing({ target: [resourceTagsTable.resourceId, resourceTagsTable.tagId] });
      }
    });

    summary.resourcesProcessed++;
    summary.themeTagsLinked += computed.themeTagIds.length;
    summary.assetTagsLinked += computed.assetTagIds.length;
    summary.jurisdictionTagsLinked += computed.jurisdictionTagIds.length;

    // Kind to LLM rate limits on a full-library rerun, mirrors the delay used by the batch import endpoints.
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return summary;
}
