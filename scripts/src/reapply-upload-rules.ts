import { db, pool, tagsTable, uploadJobsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

type StoredTag = {
  id: number;
  slug: string;
  nameEn: string;
  nameZh: string;
  facet: "theme" | "jurisdiction" | "asset";
  status: "active" | "candidate";
  score?: number;
};

type StoredResult = {
  draft?: {
    title?: string;
    authors?: string[];
    abstract?: string;
    year?: number | null;
    doi?: string | null;
    [key: string]: unknown;
  };
  tags?: StoredTag[];
  tagIds?: unknown;
  [key: string]: unknown;
};

type ComputedTags = {
  themeTagIds: number[];
  themeTagScores: Record<number, number>;
  assetTagIds: number[];
  jurisdictionTagIds: number[];
  candidateTagIds: number[];
};

const taggingUrl = new URL("../../artifacts/api-server/src/lib/tagging.ts", import.meta.url).href;
const authorNamesUrl = new URL("../../artifacts/api-server/src/lib/scholar/authorNames.ts", import.meta.url).href;
const openAlexUrl = new URL("../../artifacts/api-server/src/lib/scholar/openalex.ts", import.meta.url).href;
const matchingUrl = new URL("../../artifacts/api-server/src/lib/scholar/matching.ts", import.meta.url).href;
const resolveLinkUrl = new URL("../../artifacts/api-server/src/lib/scholar/resolveLink.ts", import.meta.url).href;

const { loadTagVocabulary, computeTagsForText } = await import(taggingUrl) as {
  loadTagVocabulary(): Promise<unknown>;
  computeTagsForText(input: { title: string; abstract?: string | null }, vocabulary: unknown): Promise<ComputedTags>;
};
const { hasAbbreviatedAuthorName, preferFullAuthorNames } = await import(authorNamesUrl) as {
  hasAbbreviatedAuthorName(authors: string[]): boolean;
  preferFullAuthorNames(current: string[], candidateLists: string[][]): string[];
};
const { resolveDoiOpenAlex, searchOpenAlex } = await import(openAlexUrl) as {
  resolveDoiOpenAlex(doi: string): Promise<{ authors: string[] } | null>;
  searchOpenAlex(title: string): Promise<Array<{ title: string; authors: string[] }>>;
};
const { titleOverlapScore } = await import(matchingUrl) as {
  titleOverlapScore(left: string, right: string): number;
};
const { resolveLink } = await import(resolveLinkUrl) as {
  resolveLink(input: { title: string; authors: string[]; year: number | null; doi?: string | null }): Promise<{
    found: boolean;
    authors: string[];
  }>;
};

function hasThemeTag(result: StoredResult): boolean {
  return (result.tags ?? []).some((tag) => tag.facet === "theme");
}

function changedAuthors(before: string[], after: string[]): boolean {
  return before.length === after.length && before.some((name, index) => name !== after[index]);
}

function normalizedDoi(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//iu, "");
}

async function mapStoredTags(computed: ComputedTags): Promise<StoredTag[]> {
  const ids = [...new Set([
    ...computed.themeTagIds,
    ...computed.assetTagIds,
    ...computed.jurisdictionTagIds,
    ...computed.candidateTagIds,
  ])];
  if (ids.length === 0) return [];
  const rows = await db.select().from(tagsTable).where(inArray(tagsTable.id, ids));
  return rows.map((tag) => ({
    id: tag.id,
    slug: tag.slug,
    nameEn: tag.nameEn,
    nameZh: tag.nameZh,
    facet: tag.facet,
    status: tag.status,
    score: computed.themeTagScores[tag.id],
  }));
}

const requestedIds = process.argv.slice(2).map(Number).filter((id) => Number.isInteger(id) && id > 0);
const allRows = requestedIds.length > 0
  ? (await Promise.all(requestedIds.map(async (id) => {
      const [row] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, id)).limit(1);
      return row;
    }))).filter((row): row is NonNullable<typeof row> => !!row)
  : (await db.select().from(uploadJobsTable)).filter((row) => row.status === "ready_for_review");

const targets = allRows.filter((row) => {
  const result = row.result as StoredResult | null;
  const title = result?.draft?.title?.trim();
  const authors = Array.isArray(result?.draft?.authors) ? result.draft.authors : [];
  return !!title && (!hasThemeTag(result ?? {}) || hasAbbreviatedAuthorName(authors));
});

const vocabulary = await loadTagVocabulary();
const summary = {
  selected: targets.length,
  processed: 0,
  gainedTheme: 0,
  stillWithoutTheme: 0,
  authorsExpanded: 0,
  authorsStillAbbreviated: 0,
  failed: 0,
};

let cursor = 0;
const concurrency = Math.min(3, Math.max(1, targets.length));

async function worker(): Promise<void> {
  while (cursor < targets.length) {
    const row = targets[cursor++];
    const result = row.result as StoredResult;
    const draft = result.draft!;
    const title = draft.title!.trim();
    const previousAuthors = Array.isArray(draft.authors) ? draft.authors : [];
    const previouslyHadTheme = hasThemeTag(result);

    try {
      let authors = previousAuthors;
      if (hasAbbreviatedAuthorName(previousAuthors)) {
        const doi = normalizedDoi(draft.doi);
        const openAlex = doi
          ? await resolveDoiOpenAlex(doi)
          : (await searchOpenAlex(title)).find((candidate) => titleOverlapScore(title, candidate.title) >= 0.7) ?? null;
        if (openAlex?.authors.length) authors = preferFullAuthorNames(previousAuthors, [openAlex.authors]);
        if (hasAbbreviatedAuthorName(authors)) {
          const linked = await resolveLink({
            title,
            authors: previousAuthors,
            year: Number.isInteger(draft.year) ? draft.year as number : null,
            doi,
          });
          if (linked.found && linked.authors.length > 0) authors = preferFullAuthorNames(authors, [linked.authors]);
        }
      }

      const computed = await computeTagsForText({
        title,
        abstract: typeof draft.abstract === "string" ? draft.abstract : "",
      }, vocabulary);
      const tags = await mapStoredTags(computed);
      const hasTheme = tags.some((tag) => tag.facet === "theme");
      const expanded = changedAuthors(previousAuthors, authors);

      await db.update(uploadJobsTable).set({
        result: {
          ...result,
          draft: { ...draft, authors },
          tagIds: computed,
          tags,
        },
        updatedAt: new Date(),
      }).where(eq(uploadJobsTable.id, row.id));

      summary.processed += 1;
      if (!previouslyHadTheme && hasTheme) summary.gainedTheme += 1;
      if (!hasTheme) summary.stillWithoutTheme += 1;
      if (expanded) summary.authorsExpanded += 1;
      if (hasAbbreviatedAuthorName(authors)) summary.authorsStillAbbreviated += 1;
      console.log(JSON.stringify({
        id: row.id,
        title,
        themes: tags.filter((tag) => tag.facet === "theme").map((tag) => tag.slug),
        authorUpdate: expanded ? { from: previousAuthors, to: authors } : null,
      }));
    } catch (error) {
      summary.failed += 1;
      console.error(JSON.stringify({ id: row.id, title, error: error instanceof Error ? error.message : String(error) }));
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
console.log(JSON.stringify({ summary }, null, 2));
await pool.end();
