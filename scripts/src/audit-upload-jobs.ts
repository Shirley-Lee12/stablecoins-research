import { db, pool, uploadJobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const resolveLinkUrl = new URL("../../artifacts/api-server/src/lib/scholar/resolveLink.ts", import.meta.url).href;
const { resolveLink } = await import(resolveLinkUrl) as {
  resolveLink(input: { title: string; authors: string[]; year: number | null; doi?: string | null }): Promise<any>;
};

const requestedIds = process.argv.slice(2).map(Number).filter(Number.isFinite);
const rows = requestedIds.length > 0
  ? (await Promise.all(requestedIds.map(async (id) => {
      const [row] = await db.select().from(uploadJobsTable).where(eq(uploadJobsTable.id, id)).limit(1);
      return row;
    }))).filter(Boolean)
  : (await db.select().from(uploadJobsTable)).filter((row) => row.status === "ready_for_review");

for (const row of rows) {
  const result = row.result as any;
  const draft = result?.draft;
  if (!draft?.title) continue;
  const resolved = await resolveLink({
    title: draft.title,
    authors: Array.isArray(draft.authors) ? draft.authors : [],
    year: Number.isFinite(draft.year) ? draft.year : null,
    doi: typeof draft.doi === "string" ? draft.doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "") : null,
  });
  console.log(JSON.stringify({
    id: row.id,
    title: draft.title,
    current: {
      authors: draft.authors,
      year: draft.year,
      doi: draft.doi,
      url: draft.url,
      abstractLength: draft.abstract?.length ?? 0,
      sourceType: draft.sourceType,
    },
    resolved,
  }));
}

await pool.end();
