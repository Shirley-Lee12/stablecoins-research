import { eq } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";

type Correction = {
  id: number;
  expectedTitle: string;
  authors: string[];
  title?: string;
  publishedDate?: string;
  sourceType?: "journal_article" | "working_paper" | "conference_paper" | "thesis" | "report" | "gov_document" | "news";
};

const corrections: Correction[] = [
  {
    id: 143,
    expectedTitle: "Runs and flights to safety: Are stablecoins the new money market funds?",
    authors: [
      "Kenechukwu Anadu",
      "Pablo Azar",
      "Marco Cipriani",
      "Thomas M. Eisenbach",
      "Catherine Huang",
      "Mattia Landoni",
      "Gabriele La Spada",
      "Marco Macchiavelli",
      "Antoine Malfroy-Camine",
      "J. Christina Wang",
    ],
  },
  {
    id: 156,
    expectedTitle: "Stablecoins and the emerging hybrid monetary ecosystems",
    authors: ["Hongzhe Wen", "Songbai Li", "Ronald Lau", "Jamie Zhang"],
  },
  {
    id: 218,
    expectedTitle: "What drives the (In)stability of a stablecoin?",
    authors: [
      "Yujin Potter",
      "Kornrapat Pongmala",
      "Kaihua Qin",
      "Ariah Klages-Mundt",
      "Philipp Jovanovic",
      "Christine A. Parlour",
      "Arthur Gervais",
      "Dawn Song",
    ],
    publishedDate: "2024",
  },
  {
    id: 239,
    expectedTitle: "Adoption, fragility and regulation of stablecoins*",
    title: "Adoption, Fragility and Regulation of Stablecoins",
    authors: ["Christoph Bertsch"],
    sourceType: "report",
  },
  {
    id: 274,
    expectedTitle: "Can stablecoins foster cryptocurrencies adoption?",
    authors: ["Cheuk Hang Au", "Wen Shou Hsu", "Po-Hsu Shieh", "Lin Yue"],
  },
];

const resourceAuthorsUrl = new URL("../../artifacts/api-server/src/lib/resourceAuthors.ts", import.meta.url).href;
const { syncResourceAuthors } = await import(resourceAuthorsUrl) as {
  syncResourceAuthors(resourceId: number, authors: string[], database?: unknown): Promise<void>;
};

let updated = 0;
for (const correction of corrections) {
  await db.transaction(async (tx) => {
    const [resource] = await tx.select({ title: resourcesTable.title })
      .from(resourcesTable)
      .where(eq(resourcesTable.id, correction.id))
      .limit(1);
    if (!resource) throw new Error(`Resource #${correction.id} no longer exists`);
    if (resource.title !== correction.expectedTitle && resource.title !== correction.title) {
      throw new Error(`Resource #${correction.id} title changed; refusing to apply a stale correction`);
    }

    await tx.update(resourcesTable).set({
      authors: correction.authors,
      ...(correction.title ? { title: correction.title } : {}),
      ...(correction.publishedDate ? { publishedDate: correction.publishedDate } : {}),
      ...(correction.sourceType ? { sourceType: correction.sourceType } : {}),
    }).where(eq(resourcesTable.id, correction.id));
    await syncResourceAuthors(correction.id, correction.authors, tx);
  });
  updated += 1;
  console.log(`Corrected resource #${correction.id}`);
}

console.log(JSON.stringify({ updated }, null, 2));
process.exit(0);
