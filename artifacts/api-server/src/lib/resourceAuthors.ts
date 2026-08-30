import { eq } from "drizzle-orm";
import { authorsTable, db, resourceAuthorsTable } from "@workspace/db";

/** Keeps the normalized author directory in sync with resources.authors. */
export async function syncResourceAuthors(resourceId: number, authorNames: string[], database: any = db): Promise<void> {
  const names = [...new Set(authorNames.map((name) => name.trim()).filter(Boolean))];
  await database.delete(resourceAuthorsTable).where(eq(resourceAuthorsTable.resourceId, resourceId));
  for (const name of names) {
    const [existing] = await database.select({ id: authorsTable.id }).from(authorsTable).where(eq(authorsTable.name, name)).limit(1);
    const authorId = existing
      ? existing.id
      : (await database.insert(authorsTable).values({ name }).returning({ id: authorsTable.id }))[0].id;
    await database.insert(resourceAuthorsTable).values({ resourceId, authorId }).onConflictDoNothing();
  }
}
