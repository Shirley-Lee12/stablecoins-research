import { and, eq, inArray } from "drizzle-orm";
import { db, resourcesTable, tagsTable, resourceTagsTable, type Tag } from "@workspace/db";
import { embedText, generateJson } from "./llm";

export interface FacetedTag {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
  status: "active" | "candidate";
  /** Top-level category slug for the theme facet's folding tree (docs/planning/15 §3.2) — null for jurisdiction/asset. */
  category: string | null;
  /** AI relevance score (embedding similarity for the fallback path) — null for source='manual' rows. */
  score: number | null;
}

/**
 * Attaches each resource's structured theme/jurisdiction/asset tags from the tags/resource_tags
 * system. Shared by every route that lists resources with their tags (resources.ts, authors.ts) —
 * lives here rather than in a route file to avoid a route-importing-route circular dependency.
 */
export async function attachFacetedTags<T extends { id: number }>(rows: T[]): Promise<(T & { facetedTags: FacetedTag[] })[]> {
  if (rows.length === 0) return rows as (T & { facetedTags: FacetedTag[] })[];
  const ids = rows.map((r) => r.id);
  const linked = await db
    .select({
      resourceId: resourceTagsTable.resourceId,
      id: tagsTable.id,
      slug: tagsTable.slug,
      nameEn: tagsTable.nameEn,
      nameZh: tagsTable.nameZh,
      facet: tagsTable.facet,
      status: tagsTable.status,
      category: tagsTable.category,
      score: resourceTagsTable.score,
    })
    .from(resourceTagsTable)
    .innerJoin(tagsTable, eq(resourceTagsTable.tagId, tagsTable.id))
    .where(and(inArray(resourceTagsTable.resourceId, ids), eq(tagsTable.status, "active")));

  const byResource = new Map<number, FacetedTag[]>();
  for (const { resourceId, ...tag } of linked) {
    if (!byResource.has(resourceId)) byResource.set(resourceId, []);
    byResource.get(resourceId)!.push(tag as FacetedTag);
  }

  return rows.map((r) => ({ ...r, facetedTags: byResource.get(r.id) ?? [] }));
}

const THEME_CANDIDATE_LIMIT = 12;
const THEME_MATCH_LIMIT = 3;
const FALLBACK_PRIMARY_THRESHOLD = 0.56;
const FALLBACK_SECONDARY_THRESHOLD = 0.66;
const FALLBACK_SECONDARY_MAX_GAP = 0.025;
const AI_SECONDARY_CONFIDENCE_THRESHOLD = 0.68;

// Title vs. abstract weighting for theme-tag similarity (docs/planning/15 §3.5) — the title
// usually signals a paper's core intent even when the body touches several themes, so it counts
// for more than the abstract. Initial guess, not tuned yet; adjust here once real tagging output
// has been eyeballed against a decent-sized library.
const TITLE_WEIGHT = 0.6;
const ABSTRACT_WEIGHT = 0.4;

// Common abbreviations the literature uses instead of the seeded canonical name — alias matching
// alone would otherwise miss most real mentions ("the US Treasury", not "the United States Treasury").
const JURISDICTION_ALIASES: Record<string, string[]> = {
  "united-states": ["US", "U.S.", "USA", "U.S.A.", "New York", "New York State", "美国", "美國", "纽约州", "紐約州"],
  "european-union": ["EU", "E.U.", "欧盟", "歐盟"],
  "united-kingdom": ["UK", "U.K.", "英国", "英國"],
  uae: ["UAE", "U.A.E.", "Emirates", "阿联酋", "阿聯酋"],
  "hong-kong": ["HK", "香港", "中国香港", "中國香港"],
  "china-mainland": ["PRC", "Mainland China", "中国大陆", "中國大陸", "中国", "中國"],
  "south-korea": ["Korea", "韩国", "韓國"],
  singapore: ["新加坡"],
  japan: ["日本"],
};

const ENTITY_SLUG_ALIASES: Record<"asset" | "jurisdiction", Record<string, string>> = {
  asset: {
    tether: "usdt",
    "tether-usdt": "usdt",
    "usd-coin": "usdc",
    "circle-usdc": "usdc",
    terrausd: "ust",
    "terra-usd": "ust",
    "binance-usd": "busd",
    "gemini-dollar": "gusd",
    "paypal-usd": "pyusd",
    trueusd: "tusd",
    "pax-dollar": "usdp",
    "liquity-usd": "lusd",
    "curve-usd": "crvusd",
    "aave-gho": "gho",
    "synthetix-susd": "susd",
    "pax-gold": "paxg",
    "tether-gold": "xaut",
    "magic-internet-money": "mim",
    "iron-finance": "iron",
    diem: "libra",
  },
  jurisdiction: {
    us: "united-states",
    "u-s": "united-states",
    usa: "united-states",
    "u-s-a": "united-states",
    "united-states-of-america": "united-states",
    uk: "united-kingdom",
    "u-k": "united-kingdom",
    "great-britain": "united-kingdom",
    korea: "south-korea",
    eu: "european-union",
    "e-u": "european-union",
    china: "china-mainland",
    prc: "china-mainland",
    "mainland-china": "china-mainland",
    "hong-kong-sar": "hong-kong",
    "china-hong-kong": "hong-kong",
    "united-arab-emirates": "uae",
    "new-york": "united-states",
    "new-york-state": "united-states",
    "new-york-ny": "united-states",
  },
};

const IGNORED_ENTITY_SLUGS: Record<"asset" | "jurisdiction", Set<string>> = {
  asset: new Set(["bitcoin", "btc", "ethereum", "eth", "luna", "terra-luna", "wbtc", "wrapped-bitcoin", "iron-titan"]),
  jurisdiction: new Set([
    "global",
    "international",
    "worldwide",
    "imf",
    "oecd",
    "g10",
    "north-america",
    "asia-and-pacific",
    "africa-and-the-middle-east",
    "latin-america-and-the-caribbean",
  ]),
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Word-boundary match — plain substring search would let "UST" match inside "trust"/"robust". */
function textMentions(text: string, candidate: string): boolean {
  if (candidate.length < 2) return false;
  if (/[^\x00-\x7F]/.test(candidate)) return text.includes(candidate);
  return new RegExp(`\\b${escapeRegex(candidate)}\\b`, "i").test(text);
}

function tagAliases(tag: Tag): string[] {
  const aliases = [tag.nameEn, tag.nameZh, tag.slug];
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
    const rawSlug = slugify(name);
    if (IGNORED_ENTITY_SLUGS[facet].has(rawSlug)) continue;
    const slug = ENTITY_SLUG_ALIASES[facet][rawSlug] ?? rawSlug;
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
  themeTagIds: number[];
  themeTagEmbeddings: { tag: Tag; embedding: number[] }[];
  activeAssetTags: Tag[];
  activeJurisdictionTags: Tag[];
}

const TAG_VOCABULARY_CACHE_MS = 30 * 60_000;
let tagVocabularyCache: { expiresAt: number; promise: Promise<TagVocabulary> } | null = null;

/**
 * Loads the current tag vocabulary and pre-computes theme tag definition embeddings once —
 * reused across every computeTagsForText() call in the same retag run or upload batch, since the
 * vocabulary doesn't change mid-run.
 */
export async function loadTagVocabulary(): Promise<TagVocabulary> {
  if (tagVocabularyCache && tagVocabularyCache.expiresAt > Date.now()) return tagVocabularyCache.promise;
  const promise = (async () => {
    const allTags = await db.select().from(tagsTable);
    const tagsBySlug = new Map(allTags.map((t) => [t.slug, t]));
    const themeTagIds = allTags.filter((t) => t.facet === "theme").map((t) => t.id);
    const activeThemeTags = allTags.filter((t) => t.facet === "theme" && t.status === "active");
    const activeAssetTags = allTags.filter((t) => t.facet === "asset" && t.status === "active");
    const activeJurisdictionTags = allTags.filter((t) => t.facet === "jurisdiction" && t.status === "active");
    const themeTagEmbeddings = await Promise.all(
      activeThemeTags.map(async (tag) => ({ tag, embedding: await embedText(`${tag.nameEn}. ${tag.definition ?? ""}`) })),
    );
    return { tagsBySlug, themeTagIds, themeTagEmbeddings, activeAssetTags, activeJurisdictionTags };
  })();
  tagVocabularyCache = { expiresAt: Date.now() + TAG_VOCABULARY_CACHE_MS, promise };
  try {
    return await promise;
  } catch (error) {
    if (tagVocabularyCache?.promise === promise) tagVocabularyCache = null;
    throw error;
  }
}

/** Admin vocabulary edits must affect the very next upload/retag operation, not a cache 30 minutes old. */
export function invalidateTagVocabularyCache(): void {
  tagVocabularyCache = null;
}

export interface ComputedTags {
  themeTagIds: number[];
  /** AI relevance confidence (or embedding similarity in fallback mode), used to identify the primary theme. */
  themeTagScores: Record<number, number>;
  assetTagIds: number[];
  jurisdictionTagIds: number[];
  candidateTagIds: number[];
}

interface ScoredThemeCandidate {
  tag: Tag;
  similarity: number;
}

interface AiThemeChoice {
  slug: string;
  confidence: number;
}

interface AiThemeSelection {
  primary: AiThemeChoice | null;
  secondary: AiThemeChoice[];
}

// Most controlled themes describe stablecoin-specific questions. An LLM can still over-generalize
// from words such as "market", "payment", or "token" and attach those themes to ordinary Bitcoin
// or DeFi research. Keep a small set of genuinely cross-crypto/background themes available, and
// require direct stablecoin evidence for the rest.
const CROSS_CRYPTO_THEME_SLUGS = new Set([
  "shadow-banking",
  "money-market-funds",
  "collateral-risk",
  "smart-contract-security",
  "systemic-contagion",
  "defi-lending",
  "interoperability-bridges",
  "oracles-data-feeds",
  "privacy-compliance-tech",
  "crypto-asset-foundations",
  "blockchain-foundations",
]);

const STABLECOIN_EVIDENCE = /\b(?:stable[ -]?coins?|tether|usdt|usd[ct]|dai|terrausd|busd|frax|usde|pyusd|fdusd|rlusd|gusd|usdp|lusd|crvusd|gho|susd|eurt|libra|diem)\b|稳定币|穩定幣/iu;
const CRYPTO_EVIDENCE = /\b(?:bitcoin|btc|ethereum|ether|crypto(?:currency|currencies|asset|assets|economic|economics)?|blockchain|decentralized finance|defi|smart contracts?|web3|tokenomics|initial coin offerings?|ico|daos?|digital assets?)\b|比特币|比特幣|加密货币|加密貨幣|加密资产|加密資產|区块链|區塊鏈|去中心化金融/iu;
const BLOCKCHAIN_TECH_EVIDENCE = /\b(?:blockchain|cross[ -]?chain|interoperab|smart contracts?|key management|consensus|distributed ledger|hash address|oracle)\b|区块链|區塊鏈|跨链|跨鏈|智能合约|智能合約/iu;
const TECHNICAL_TITLE_EVIDENCE = /\b(?:cross[ -]?chain|interoperab|smart contracts?|key management|consensus|distributed (?:ledger|systems?)|hash address|oracle|sidechain|security|vulnerabilit|attacks?|protocol|architecture|cryptograph)\b|跨链|跨鏈|智能合约|智能合約|密钥|金鑰|安全|漏洞|协议|協議|架构|架構/iu;
const FINANCIAL_TITLE_EVIDENCE = /\b(?:price|market|trading|exchange|money|currency|economics?|finance|investment|securities|collateral|liquidation|leverage|lending|interest rates?|payment|portfolio|volatility|risk|tokenomics|initial coin offerings?|ico)\b|价格|價格|市场|市場|交易|货币|貨幣|金融|投资|投資|证券|證券|抵押|清算|杠杆|槓桿|借贷|借貸|支付|风险|風險/iu;
const PEG_EVIDENCE = /\b(?:peg(?:ged|ging)?|depeg(?:ged|ging)?|redemption price|price stability|stable[ -]?coins? stable|maintain(?:ing)? (?:its|the) (?:target )?value)\b|脱锚|脫錨|锚定|錨定/iu;
const TOKENIZED_DEPOSIT_EVIDENCE = /\b(?:tokeni[sz]ed deposits?|tokeni[sz]ed money market funds?|money market funds?|mmfs?)\b|代币化存款|代幣化存款|货币市场基金|貨幣市場基金|货基|貨基/iu;

function constrainThemeSelection(
  selection: { ids: number[]; scores: Record<number, number> },
  title: string,
  abstract: string,
  vocab: TagVocabulary,
): { ids: number[]; scores: Record<number, number> } {
  const text = `${title}\n${abstract}`;
  const stablecoinSpecific = STABLECOIN_EVIDENCE.test(text);
  const cryptoRelated = CRYPTO_EVIDENCE.test(text);
  const tagsById = new Map([...vocab.tagsBySlug.values()].map((tag) => [tag.id, tag]));

  // A resource with no textual stablecoin/crypto connection is outside the user's current library
  // scope. This prevents generic bank-run, CBDC, AI, or traditional-market papers from slipping in
  // merely because their embeddings resemble a stablecoin research method.
  if (!stablecoinSpecific && !cryptoRelated) return { ids: [], scores: {} };

  const kept = selection.ids.filter((id) => {
    const slug = tagsById.get(id)?.slug;
    if (!slug) return false;
    if (slug === "peg-stability-depeg" && !(stablecoinSpecific && PEG_EVIDENCE.test(text))) return false;
    if (slug === "tokenized-deposits-mmf" && !TOKENIZED_DEPOSIT_EVIDENCE.test(text)) return false;
    return stablecoinSpecific || CROSS_CRYPTO_THEME_SLUGS.has(slug);
  });

  // If every proposed stablecoin-only label was rejected but this is clearly a crypto resource,
  // retain it under one honest background category instead of mislabelling or marking it off-topic.
  if (kept.length === 0 && cryptoRelated) {
    const fallbackSlug = BLOCKCHAIN_TECH_EVIDENCE.test(text) && TECHNICAL_TITLE_EVIDENCE.test(title) && !FINANCIAL_TITLE_EVIDENCE.test(title)
      ? "blockchain-foundations"
      : "crypto-asset-foundations";
    const fallback = vocab.tagsBySlug.get(fallbackSlug);
    if (fallback) kept.push(fallback.id);
  }

  // When AI returns only generic foundation labels, choose the one that matches the title's actual
  // emphasis: technical architecture/security versus crypto markets, economics, or user research.
  const foundationIds = new Set([
    vocab.tagsBySlug.get("crypto-asset-foundations")?.id,
    vocab.tagsBySlug.get("blockchain-foundations")?.id,
  ].filter((id): id is number => id !== undefined));
  if (kept.length > 0 && kept.every((id) => foundationIds.has(id))) {
    const preferred = vocab.tagsBySlug.get(TECHNICAL_TITLE_EVIDENCE.test(title) && !FINANCIAL_TITLE_EVIDENCE.test(title)
      ? "blockchain-foundations"
      : "crypto-asset-foundations");
    if (preferred) kept.splice(0, kept.length, preferred.id);
  }

  const sourceScores = Object.values(selection.scores);
  const fallbackScore = sourceScores.length > 0 ? Math.min(0.9, Math.max(...sourceScores)) : 0.8;
  return {
    ids: [...new Set(kept)].slice(0, THEME_MATCH_LIMIT),
    scores: Object.fromEntries([...new Set(kept)].slice(0, THEME_MATCH_LIMIT).map((id) => [id, selection.scores[id] ?? fallbackScore])),
  };
}

const CATEGORY_NAMES: Record<string, string> = {
  types_mechanisms: "Types & mechanisms",
  stability_risk: "Stability & risk",
  regulation_policy: "Regulation & policy",
  monetary_macro: "Monetary & macro",
  markets_adoption: "Markets & adoption",
  tech_infrastructure: "Technology & infrastructure",
};

function normalizeTaggingText(value: string): string {
  return value
    .replace(/&lt;\/?p&gt;|&amp;lt;\/?p&amp;gt;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;apos;|&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\u00ad|(?<=\p{L})-\s*\n\s*(?=\p{L})/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function fallbackThemeSelection(candidates: ScoredThemeCandidate[]): { ids: number[]; scores: Record<number, number> } {
  const primary = candidates[0];
  if (!primary || primary.similarity < FALLBACK_PRIMARY_THRESHOLD) return { ids: [], scores: {} };

  const selected = [primary];
  for (const candidate of candidates.slice(1)) {
    if (selected.length >= THEME_MATCH_LIMIT) break;
    if (candidate.similarity < FALLBACK_SECONDARY_THRESHOLD) continue;
    if (primary.similarity - candidate.similarity > FALLBACK_SECONDARY_MAX_GAP) continue;
    selected.push(candidate);
  }
  return {
    ids: selected.map(({ tag }) => tag.id),
    scores: Object.fromEntries(selected.map(({ tag, similarity }) => [tag.id, similarity])),
  };
}

async function selectThemesWithAi(
  title: string,
  abstract: string,
  candidates: ScoredThemeCandidate[],
): Promise<{ ids: number[]; scores: Record<number, number> }> {
  const candidateList = candidates.map(({ tag, similarity }) => ({
    slug: tag.slug,
    category: CATEGORY_NAMES[tag.category ?? ""] ?? tag.category,
    label: tag.nameEn,
    definition: tag.definition,
    similarity: Number(similarity.toFixed(4)),
  }));
  const prompt = `Classify this research resource using ONLY the controlled research-library theme tags below.

Rules:
1. First decide the resource's central research question. Do not tag a topic merely because one related word is mentioned.
2. The library scope includes: (a) direct stablecoin research; (b) cryptocurrency and crypto-asset research, including Bitcoin markets and risk methods; (c) DeFi, smart-contract, oracle, liquidation, exchange and crypto-market infrastructure research; (d) blockchain foundations such as interoperability, security, key management and distributed architecture; and (e) shadow-banking or money-market-fund theory used as stablecoin/crypto background. These background resources are in scope even when the title does not mention stablecoins.
3. Choose exactly one primary tag when it directly describes the central question. For in-scope background research, prefer "crypto-asset-foundations", "blockchain-foundations", "shadow-banking", or "money-market-funds" instead of returning null. Choose null only when the resource is genuinely outside stablecoin, cryptocurrency, DeFi, blockchain, and their relevant financial-method background.
4. Add zero, one, or two secondary tags only for substantial independent themes supported by the title or abstract. Never fill a quota.
5. Use at most two tags from the same top-level category, and only when they describe clearly different mechanisms or risks.
6. Generic words such as market, risk, regulation, digital, token, platform, adoption, or blockchain are not sufficient evidence by themselves; the title or abstract must establish the actual crypto, DeFi, blockchain, stablecoin, or accepted background context.
7. "Peg stability & depeg" requires an explicit stablecoin peg, redemption-price, or depegging question. "Trading & market structure" is reserved for stablecoin-specific market structure; use "crypto-asset-foundations" for general Bitcoin/cryptocurrency trading, volatility, price, or market-risk studies. "Programmability" requires smart-contract automation or programmable-money functionality as a substantive topic.
8. Confidence is 0 to 1 and should reflect direct textual evidence, not general plausibility. A second controlled theme named explicitly in the title normally qualifies as a secondary tag; otherwise secondary confidence below 0.68 means omit it.

Resource:
${JSON.stringify({ title, abstract: abstract.slice(0, 6000) })}

Candidate tags:
${JSON.stringify(candidateList)}

The "primary" value must be either an object or null. Return ONLY JSON, for example:
{"primary":{"slug":"exact-candidate-slug","confidence":0.92},"secondary":[{"slug":"another-candidate-slug","confidence":0.78}]}`;

  const raw = await generateJson(prompt, 768);
  const parsed = JSON.parse(raw) as Partial<AiThemeSelection>;
  const candidatesBySlug = new Map(candidates.map((candidate) => [candidate.tag.slug, candidate]));
  const normalizeChoice = (choice: unknown): AiThemeChoice | null => {
    if (!choice || typeof choice !== "object") return null;
    const slug = (choice as { slug?: unknown }).slug;
    const confidence = Number((choice as { confidence?: unknown }).confidence);
    if (typeof slug !== "string" || !candidatesBySlug.has(slug) || !Number.isFinite(confidence)) return null;
    return { slug, confidence: Math.max(0, Math.min(1, confidence)) };
  };

  const primary = normalizeChoice(parsed.primary);
  if (!primary) return { ids: [], scores: {} };

  const secondary = (Array.isArray(parsed.secondary) ? parsed.secondary : [])
    .map(normalizeChoice)
    .filter((choice): choice is AiThemeChoice => choice !== null)
    .filter((choice) => choice.slug !== primary.slug && choice.confidence >= AI_SECONDARY_CONFIDENCE_THRESHOLD);

  const uniqueChoices = [primary, ...secondary.filter((choice, index, all) => all.findIndex((other) => other.slug === choice.slug) === index)]
    .slice(0, THEME_MATCH_LIMIT);
  const scored = uniqueChoices.map((choice) => {
    const candidate = candidatesBySlug.get(choice.slug)!;
    const combined = 0.7 * choice.confidence + 0.3 * candidate.similarity;
    return { id: candidate.tag.id, score: Math.max(0, Math.min(0.9999, combined)) };
  });
  if (scored.length > 1) {
    const highestSecondary = Math.max(...scored.slice(1).map((item) => item.score));
    scored[0].score = Math.min(0.9999, Math.max(scored[0].score, highestSecondary + 0.01));
  }
  return {
    ids: scored.map(({ id }) => id),
    scores: Object.fromEntries(scored.map(({ id, score }) => [id, score])),
  };
}

/**
 * Core matcher — shared by retagResources() (existing DB rows, see below) and the upload pipeline
 * (in-memory drafts that haven't been persisted yet, see lib/scholar and the import routes). Takes
 * a pre-loaded TagVocabulary so callers can batch many texts against one vocabulary snapshot.
 *
 * Title and abstract are embedded and scored against each theme tag separately, then combined with
 * TITLE_WEIGHT/ABSTRACT_WEIGHT — a single title-only entry (no fetched full text to summarize, e.g.
 * processTitleEntry) just omits `abstract` and gets scored on title alone. Asset/jurisdiction alias
 * matching and named-entity extraction aren't similarity-weighted, so they still run over the plain
 * concatenated title+abstract text.
 */
export async function computeTagsForText(
  input: { title: string; abstract?: string | null },
  vocab: TagVocabulary,
  onCandidateCreated?: () => void,
): Promise<ComputedTags> {
  const title = normalizeTaggingText(input.title?.trim() ?? "");
  const abstract = normalizeTaggingText(input.abstract?.trim() ?? "");
  const fullText = [title, abstract].filter(Boolean).join("\n\n");
  if (!fullText) return { themeTagIds: [], themeTagScores: {}, assetTagIds: [], jurisdictionTagIds: [], candidateTagIds: [] };

  const titleEmbedding = title ? await embedText(title) : null;
  const abstractEmbedding = abstract ? await embedText(abstract) : null;

  const themeCandidates = vocab.themeTagEmbeddings
    .map((t) => {
      const titleScore = titleEmbedding ? cosineSimilarity(titleEmbedding, t.embedding) : null;
      const abstractScore = abstractEmbedding ? cosineSimilarity(abstractEmbedding, t.embedding) : null;
      const score = titleScore !== null && abstractScore !== null
        ? TITLE_WEIGHT * titleScore + ABSTRACT_WEIGHT * abstractScore
        : (titleScore ?? abstractScore ?? 0);
      return { tag: t.tag, similarity: score };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, THEME_CANDIDATE_LIMIT);
  let themeSelection: { ids: number[]; scores: Record<number, number> };
  try {
    themeSelection = await selectThemesWithAi(title, abstract, themeCandidates);
  } catch {
    themeSelection = fallbackThemeSelection(themeCandidates);
  }
  themeSelection = constrainThemeSelection(themeSelection, title, abstract, vocab);
  const themeTagIds = themeSelection.ids;
  const themeTagScores = themeSelection.scores;

  const assetTagIds = vocab.activeAssetTags.filter((tag) => tagAliases(tag).some((alias) => textMentions(fullText, alias))).map((t) => t.id);
  const jurisdictionTagIds = vocab.activeJurisdictionTags.filter((tag) => tagAliases(tag).some((alias) => textMentions(fullText, alias))).map((t) => t.id);

  const { assets: extractedAssets, jurisdictions: extractedJurisdictions } = await extractNamedEntities(fullText);
  const assetCandidates = await resolveCandidates(extractedAssets, "asset", vocab.tagsBySlug, new Set(assetTagIds), onCandidateCreated);
  const jurisdictionCandidates = await resolveCandidates(extractedJurisdictions, "jurisdiction", vocab.tagsBySlug, new Set(jurisdictionTagIds), onCandidateCreated);

  return {
    themeTagIds,
    themeTagScores,
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
  manualThemeLinksReplaced: number;
}

export interface RetagOptions {
  /** One-off taxonomy reset: replace old human-confirmed theme links while preserving manual asset/jurisdiction links. */
  replaceManualThemeTags?: boolean;
  /** CLI/maintenance progress hook; intentionally not exposed as part of the HTTP response contract. */
  onProgress?: (processed: number, total: number, resourceId: number) => void;
  /** Bounded maintenance concurrency. HTTP requests keep the default of one; CLI reruns may use up to four. */
  concurrency?: number;
}

/**
 * Rebuilds the auto-generated (resource_tags.source='auto') tag links for the given resources,
 * or the whole library when resourceIds is omitted. Idempotent and safe to rerun after the tag
 * vocabulary changes. Manual links are protected by default; a deliberate taxonomy reset can
 * replace manual theme links while retaining manual asset/jurisdiction links.
 */
export async function retagResources(resourceIds?: number[], options: RetagOptions = {}): Promise<RetagSummary> {
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
    manualThemeLinksReplaced: 0,
  };

  const processResource = async (resource: (typeof resources)[number]) => {
    const computed = await computeTagsForText({ title: resource.title, abstract: resource.abstract }, vocab, () => summary.candidatesCreated++);
    const autoTagIds = [...new Set([...computed.themeTagIds, ...computed.assetTagIds, ...computed.jurisdictionTagIds, ...computed.candidateTagIds])];

    await db.transaction(async (tx) => {
      if (options.replaceManualThemeTags && vocab.themeTagIds.length > 0) {
        const deleted = await tx
          .delete(resourceTagsTable)
          .where(and(eq(resourceTagsTable.resourceId, resource.id), inArray(resourceTagsTable.tagId, vocab.themeTagIds)))
          .returning({ source: resourceTagsTable.source });
        summary.manualThemeLinksReplaced += deleted.filter((link) => link.source === "manual").length;
        await tx.delete(resourceTagsTable).where(and(eq(resourceTagsTable.resourceId, resource.id), eq(resourceTagsTable.source, "auto")));
      } else {
        await tx.delete(resourceTagsTable).where(and(eq(resourceTagsTable.resourceId, resource.id), eq(resourceTagsTable.source, "auto")));
      }
      if (autoTagIds.length > 0) {
        await tx
          .insert(resourceTagsTable)
          .values(autoTagIds.map((tagId) => ({ resourceId: resource.id, tagId, source: "auto" as const, score: computed.themeTagScores[tagId] ?? null })))
          .onConflictDoNothing({ target: [resourceTagsTable.resourceId, resourceTagsTable.tagId] });
      }
    });

    summary.resourcesProcessed++;
    summary.themeTagsLinked += computed.themeTagIds.length;
    summary.assetTagsLinked += computed.assetTagIds.length;
    summary.jurisdictionTagsLinked += computed.jurisdictionTagIds.length;
    options.onProgress?.(summary.resourcesProcessed, resources.length, resource.id);

    // Kind to LLM rate limits on a full-library rerun, mirrors the delay used by the batch import endpoints.
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  const concurrency = Math.max(1, Math.min(4, Math.floor(options.concurrency ?? 1)));
  let cursor = 0;
  const worker = async () => {
    while (cursor < resources.length) {
      const index = cursor++;
      await processResource(resources[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, resources.length) }, worker));

  return summary;
}
