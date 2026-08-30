import { and, eq, inArray } from "drizzle-orm";
import { authorsTable, db, resourceAuthorsTable, resourcesTable } from "@workspace/db";

type AuthorNameHelpers = {
  hasAbbreviatedAuthorName(authors: string[]): boolean;
  preferFullAuthorNames(current: string[], candidateLists: string[][]): string[];
};

const helperUrl = new URL("../../artifacts/api-server/src/lib/scholar/authorNames.ts", import.meta.url).href;
const doiUrl = new URL("../../artifacts/api-server/src/lib/scholar/doi.ts", import.meta.url).href;
const { hasAbbreviatedAuthorName, preferFullAuthorNames } = await import(helperUrl) as AuthorNameHelpers;
const { resolveDoi } = await import(doiUrl) as { resolveDoi(doi: string): Promise<{ authors: string[] } | null> };

function normalizedTitle(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function titleScore(left: string, right: string): number {
  const a = new Set(normalizedTitle(left).split(" ").filter(Boolean));
  const b = new Set(normalizedTitle(right).split(" ").filter(Boolean));
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((word) => b.has(word)).length;
  return overlap / new Set([...a, ...b]).size;
}

async function openAlexAuthors(title: string, doi: string | null): Promise<string[]> {
  const url = doi
    ? `https://api.openalex.org/works?filter=${encodeURIComponent(`doi:https://doi.org/${doi}`)}&per-page=1`
    : `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=5`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) return [];
  const data = await response.json() as any;
  const works = Array.isArray(data?.results) ? data.results : [];
  const work = doi ? works[0] : works.find((candidate: any) => titleScore(title, candidate?.title ?? "") >= 0.7);
  if (!work || titleScore(title, work.title ?? "") < 0.45) return [];
  return (Array.isArray(work.authorships) ? work.authorships : [])
    .map((authorship: any) => authorship?.author?.display_name)
    .filter((name: unknown): name is string => typeof name === "string" && name.trim().length > 0);
}

async function syncLinks(resourceId: number, names: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(resourceAuthorsTable).where(eq(resourceAuthorsTable.resourceId, resourceId));
    for (const name of [...new Set(names)]) {
      const [existing] = await tx.select({ id: authorsTable.id }).from(authorsTable).where(eq(authorsTable.name, name)).limit(1);
      const authorId = existing?.id ?? (await tx.insert(authorsTable).values({ name }).returning({ id: authorsTable.id }))[0].id;
      await tx.insert(resourceAuthorsTable).values({ resourceId, authorId }).onConflictDoNothing();
    }
  });
}

const rows = await db.select({
  id: resourcesTable.id,
  title: resourcesTable.title,
  authors: resourcesTable.authors,
  doi: resourcesTable.doi,
}).from(resourcesTable).where(and(
  inArray(resourcesTable.status, ["approved", "pending", "disputed", "duplicate", "incomplete", "off_topic"]),
));

let updated = 0;
const unresolved: Array<{ id: number; title: string; authors: string[] }> = [];
for (const row of rows.filter((resource) => hasAbbreviatedAuthorName(resource.authors))) {
  try {
    const [doiRecord, openAlex] = await Promise.all([
      row.doi ? resolveDoi(row.doi) : Promise.resolve(null),
      openAlexAuthors(row.title, row.doi),
    ]);
    const names = preferFullAuthorNames(row.authors, [doiRecord?.authors ?? [], openAlex]);
    const changed = names.length === row.authors.length && names.some((name, index) => name !== row.authors[index]);
    if (!changed) {
      unresolved.push({ id: row.id, title: row.title, authors: row.authors });
      continue;
    }
    await db.update(resourcesTable).set({ authors: names }).where(eq(resourcesTable.id, row.id));
    await syncLinks(row.id, names);
    updated += 1;
    console.log(`Updated #${row.id}: ${row.authors.join("; ")} -> ${names.join("; ")}`);
  } catch {
    unresolved.push({ id: row.id, title: row.title, authors: row.authors });
  }
}

console.log(JSON.stringify({ updated, unresolved }, null, 2));
process.exit(0);
