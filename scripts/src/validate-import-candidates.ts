import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const INPUT_ROOT = path.resolve("output/import-audit-20260825/import-ready");
const OUTPUT_ROOT = path.join(INPUT_ROOT, "validated");

type ReferenceCandidate = { relevance: string; doi: string; citation: string };
type PdfCandidate = { primaryFile: string; fileName: string; doi: string | null; title: string };
type DoiMetadata = { DOI?: string; title?: string; author?: Array<{ given?: string; family?: string }>; issued?: { "date-parts"?: number[][] } };

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase()
    .replace(/\bstable\s+coins?\b/giu, "stablecoin")
    .replace(/https?:\/\/\S+/giu, " ")
    .replace(/\b(?:doi|arxiv)\s*:?\s*10?\.?\S+/giu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  const stop = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "of", "on", "the", "to", "using", "with"]);
  return new Set(normalize(value).split(" ").filter((word) => word.length > 1 && !stop.has(word)));
}

function titleScore(candidateText: string, resolvedTitle: string): number {
  const candidate = normalize(candidateText);
  const resolved = normalize(resolvedTitle);
  if (!candidate || !resolved) return 0;
  if (candidate.includes(resolved) || resolved.includes(candidate)) return 1;
  const left = tokens(candidateText);
  const right = tokens(resolvedTitle);
  const overlap = [...right].filter((word) => left.has(word)).length;
  return right.size ? overlap / right.size : 0;
}

async function resolveDoi(doi: string): Promise<{ metadata: DoiMetadata | null; error: string | null }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`https://doi.org/${encodeURIComponent(doi)}`, {
        headers: {
          Accept: "application/vnd.citationstyles.csl+json",
          "User-Agent": "Stablecoin-Research-Hub-Import-Audit/1.0 (mailto:research@example.invalid)",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(20_000),
      });
      if (response.status === 429 || response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1_500));
        continue;
      }
      if (!response.ok) return { metadata: null, error: `HTTP ${response.status}` };
      return { metadata: await response.json() as DoiMetadata, error: null };
    } catch (error) {
      if (attempt === 2) return { metadata: null, error: error instanceof Error ? error.message : String(error) };
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1_500));
    }
  }
  return { metadata: null, error: "unresolved" };
}

async function concurrentMap<T, R>(values: T[], concurrency: number, mapper: (value: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(values.length);
  let next = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= values.length) return;
      output[index] = await mapper(values[index]);
      if ((index + 1) % 10 === 0) console.log(`Validated ${index + 1}/${values.length}`);
    }
  });
  await Promise.all(workers);
  return output;
}

const references = JSON.parse(await readFile(path.join(INPUT_ROOT, "selected-references.json"), "utf8")) as ReferenceCandidate[];
const pdfs = JSON.parse(await readFile(path.join(INPUT_ROOT, "selected-pdfs.json"), "utf8")) as PdfCandidate[];
const inputs = [
  ...references.map((item) => ({ kind: "reference" as const, doi: item.doi, candidateText: item.citation, item })),
  ...pdfs.filter((item): item is PdfCandidate & { doi: string } => !!item.doi)
    .map((item) => ({ kind: "pdf" as const, doi: item.doi, candidateText: item.title, item })),
];

const results = await concurrentMap(inputs, 5, async (input) => {
  const resolved = await resolveDoi(input.doi);
  const resolvedTitle = resolved.metadata?.title?.trim() ?? "";
  const score = resolvedTitle ? titleScore(input.candidateText, resolvedTitle) : 0;
  const status = !resolved.metadata ? "unresolved" : score >= 0.55 ? "verified" : score >= 0.3 ? "review" : "mismatch";
  return { ...input, resolvedTitle, score: Number(score.toFixed(3)), status, error: resolved.error, metadata: resolved.metadata };
});

const verifiedReferenceDois = new Set(results
  .filter((result) => result.kind === "reference" && result.status === "verified")
  .map((result) => result.doi.toLocaleLowerCase()));
const verifiedReferences = references.filter((reference) => verifiedReferenceDois.has(reference.doi.toLocaleLowerCase()));

await mkdir(OUTPUT_ROOT, { recursive: true });
await writeFile(path.join(OUTPUT_ROOT, "doi-validation.json"), `${JSON.stringify(results, null, 2)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "verified-references.json"), `${JSON.stringify(verifiedReferences, null, 2)}\n`);
for (let index = 0; index < verifiedReferences.length; index += 20) {
  const batch = verifiedReferences.slice(index, index + 20);
  await writeFile(
    path.join(OUTPUT_ROOT, `reference-batch-${String(index / 20 + 1).padStart(2, "0")}.md`),
    `Verified stablecoin / crypto reference import batch ${index / 20 + 1}\n\n${batch.map((item) => item.citation).join("\n\n")}\n`,
  );
}

const summary = {
  generatedAt: new Date().toISOString(),
  doiCandidates: results.length,
  verified: results.filter((result) => result.status === "verified").length,
  review: results.filter((result) => result.status === "review").length,
  mismatch: results.filter((result) => result.status === "mismatch").length,
  unresolved: results.filter((result) => result.status === "unresolved").length,
  verifiedReferences: verifiedReferences.length,
  verifiedReferenceBatches: Math.ceil(verifiedReferences.length / 20),
};
await writeFile(path.join(OUTPUT_ROOT, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
