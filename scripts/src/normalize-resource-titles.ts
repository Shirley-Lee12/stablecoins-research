import { eq, ne } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";

const titleUrl = new URL("../../artifacts/api-server/src/lib/titleCase.ts", import.meta.url).href;
const { normalizeResourceTitle } = await import(titleUrl) as { normalizeResourceTitle(title: string): string };
const rows = await db.select({ id: resourcesTable.id, title: resourcesTable.title }).from(resourcesTable)
  .where(ne(resourcesTable.status, "withdrawn"));
const updated: number[] = [];
for (const row of rows) {
  const title = normalizeResourceTitle(row.title);
  if (title === row.title) continue;
  await db.update(resourcesTable).set({ title, adminEdited: true }).where(eq(resourcesTable.id, row.id));
  updated.push(row.id);
}
console.log(JSON.stringify({ updated: updated.length, resourceIds: updated }, null, 2));
