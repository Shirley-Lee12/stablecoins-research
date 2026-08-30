import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, resourcesTable } from "@workspace/db";

const ORGANIZED_ROOT = "/Users/shirleylee/Downloads/稳定币网站导入资料_已整理_20260822";
const DIRECT_ROOT = path.join(ORGANIZED_ROOT, "06_网站批量导入包_20260823", "00_直接相关_可上传");
const REFERENCE_ROOT = "/Users/shirleylee/Downloads/结题汇总资料/参考文献";
const MASTER_REFERENCE_DOCX = path.join(ORGANIZED_ROOT, "05_Word参考文献合并", "参考文献总目录_去重版.docx");
const OUTPUT_ROOT = path.resolve("output/import-audit-20260825");

type ResourceRow = {
  id: number;
  title: string;
  authors: string[];
  publishedDate: string | null;
  doi: string | null;
  url: string | null;
  status: string;
};

type PdfRecord = {
  sha256: string;
  sizeMb: number;
  primaryPath: string;
  paths: string[];
  titleEvidence: string[];
  doi: string | null;
  usedTextExtraction: boolean;
  extractionError: string | null;
  existing: ResourceRow | null;
  matchMethod: string | null;
  matchScore: number;
  relevance: "direct" | "background" | "unclear";
};

type ReferenceRecord = {
  sourceFile: string;
  citation: string;
  doi: string | null;
  existing: ResourceRow | null;
  matchMethod: string | null;
  matchScore: number;
};

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase()
    .replace(/\bstable\s+coins?\b/giu, "stablecoin")
    .replace(/\.(pdf|docx)$/iu, "")
    .replace(/^\s*(?:\[?\d+\]?|第?\d+[篇章]?)\s*[-_.、 ]*/u, "")
    .replace(/\b(?:final|revised|draft|copy)\b/giu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function tokens(value: string): Set<string> {
  const normalized = normalize(value);
  const result = new Set<string>();
  const cjk = [...normalized.matchAll(/[\u3400-\u9fff]+/gu)].map((match) => match[0]).join("");
  if (cjk.length === 1) result.add(cjk);
  for (let index = 0; index < cjk.length - 1; index += 1) result.add(cjk.slice(index, index + 2));
  for (const word of normalized.replace(/[\u3400-\u9fff]+/gu, " ").match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (word.length > 2 || /^\d+$/u.test(word)) result.add(word);
  }
  return result;
}

function similarity(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / new Set([...a, ...b]).size;
}

function extractDoi(value: string): string | null {
  const match = value.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/iu);
  return match ? match[0].replace(/[\s.,;:)\]>}]+$/gu, "").toLocaleLowerCase() : null;
}

async function walk(root: string, extensions: Set<string>): Promise<string[]> {
  const output: string[] = [];
  const visit = async (directory: string) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.isFile() && extensions.has(path.extname(entry.name).toLocaleLowerCase())) output.push(fullPath);
    }
  };
  await visit(root);
  return output.sort();
}

function bestTitleMatch(evidence: string[], resources: ResourceRow[]): { resource: ResourceRow; score: number; method: string } | null {
  let best: { resource: ResourceRow; score: number; method: string } | null = null;
  for (const candidate of evidence.filter((value) => normalize(value).length >= 6)) {
    const candidateNormalized = normalize(candidate);
    for (const resource of resources) {
      const titleNormalized = normalize(resource.title);
      const exactish = candidateNormalized === titleNormalized
        || (candidateNormalized.length >= 18 && titleNormalized.length >= 18
          && (candidateNormalized.includes(titleNormalized) || titleNormalized.includes(candidateNormalized)));
      const score = exactish ? 1 : similarity(candidate, resource.title);
      if (!best || score > best.score) best = { resource, score, method: exactish ? "normalized_title" : "fuzzy_title" };
    }
  }
  return best && best.score >= 0.64 ? best : null;
}

function matchRecord(doi: string | null, evidence: string[], resources: ResourceRow[]) {
  if (doi) {
    const match = resources.find((resource) => resource.doi?.toLocaleLowerCase() === doi);
    if (match) return { resource: match, score: 1, method: "doi" };
  }
  return bestTitleMatch(evidence, resources);
}

function citationTitleEvidence(citation: string): string[] {
  const withoutLinks = citation
    .replace(/https?:\/\/\S+/giu, " ")
    .replace(/\bDOI\s*:\s*10\.\S+/giu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const candidates = [citation, withoutLinks];

  // APA-style references: Authors. (2025). Title. Publisher.
  const apa = withoutLinks.match(/\((?:19|20)\d{2}[^)]*\)[.,]?\s+(.+?)(?=\.\s+(?:[A-Z\p{Script=Han}]|https?:|$)|$)/iu)
    ?? withoutLinks.match(/\(?(?:19|20)\d{2}[a-z]?\)?[.,]?\s+(.+?)(?=\.\s+(?:[A-Z\p{Script=Han}]|https?:|$)|$)/iu);
  if (apa?.[1]) candidates.push(apa[1]);

  // GB/T-style references: AUTHORS, 2025. Title[J/OL].
  const gbt = withoutLinks.match(/(?:19|20)\d{2}[a-z]?[.,]?\s+(.+?)(?=\[[A-Z/]+\]|\.\s+https?:|$)/iu);
  if (gbt?.[1]) candidates.push(gbt[1]);

  // Chinese references often place the title directly after the author and before the source.
  const chinese = withoutLinks.match(/^[^。]{1,40}[。.]\s*([^。]{6,120})(?=[。.]|$)/u);
  if (chinese?.[1]) candidates.push(chinese[1]);

  return [...new Set(candidates.map((value) => value.trim()).filter(Boolean))];
}

function cleanEvidenceLine(value: string): string {
  return value.replace(/\s+/gu, " ").replace(/^[-–—|]+|[-–—|]+$/gu, "").trim();
}

function usefulTitleLine(value: string): boolean {
  const line = cleanEvidenceLine(value);
  if (line.length < 12 || line.length > 280) return false;
  if (/^(abstract|keywords?|contents?|introduction|working paper|research paper|table of contents|摘要|关键词|目录)\b/iu.test(line)) return false;
  if (/^(https?:|doi:|www\.)/iu.test(line)) return false;
  return true;
}

async function extractPdfEvidence(filePath: string): Promise<{ evidence: string[]; doi: string | null }> {
  const moduleUrl = new URL("../../artifacts/api-server/node_modules/pdf-parse/dist/pdf-parse/esm/index.js", import.meta.url).href;
  const { PDFParse } = await import(moduleUrl) as { PDFParse: new (options: Record<string, unknown>) => any };
  const buffer = await readFile(filePath);
  const parser = new PDFParse({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
    useSystemFonts: false,
    useWorkerFetch: false,
    useWasm: false,
    stopAtErrors: true,
    maxImageSize: 10_000_000,
  });
  try {
    // pdf.js transfers the source buffer to its worker. Reusing it concurrently
    // for metadata and text extraction can fail with an unsupported object error.
    const infoResult = await parser.getInfo().catch(() => null);
    const textResult = await parser.getText({ first: 6 });
    const info = infoResult?.info as Record<string, unknown> | undefined;
    const metadataTitle = typeof info?.Title === "string" ? info.Title.trim() : "";
    const metadataSubject = typeof info?.Subject === "string" ? info.Subject.trim() : "";
    const text = String(textResult?.text ?? "").slice(0, 30_000);
    const lines = text.split(/\r?\n/u).map(cleanEvidenceLine).filter(usefulTitleLine).slice(0, 30);
    const joinedLines = lines.slice(0, 12).flatMap((line, index) => [line, index < 11 ? `${line} ${lines[index + 1] ?? ""}`.trim() : ""]);
    const evidence = [...new Set([metadataTitle, metadataSubject, ...joinedLines].filter(Boolean))];
    return { evidence, doi: extractDoi(`${metadataSubject}\n${text}`) };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}

function classifyRelevance(record: Pick<PdfRecord, "primaryPath" | "titleEvidence">): PdfRecord["relevance"] {
  const text = normalize([path.basename(record.primaryPath), ...record.titleEvidence].join(" "));
  const direct = /\b(stablecoins?|usdt|usdc|tether|dai|busd|tusd|usde|frax|pyusd|gusd|terrausd|ust|libra|diem)\b/iu.test(text)
    || /稳定币|穩定幣|ステーブルコイン/u.test(text);
  if (direct) return "direct";
  const background = /\b(defi|blockchain|cryptocurrenc|crypto asset|bitcoin|ethereum|bank run|financial contagion|shadow bank|cbdc|digital currenc|systemic risk)\b/iu.test(text)
    || /区块链|加密货币|加密资产|比特币|以太坊|銀行擠兌|银行挤兑|数字货币|金融风险|风险传染/u.test(text);
  return background ? "background" : "unclear";
}

function classifyCitationRelevance(citation: string): PdfRecord["relevance"] {
  const text = normalize(citation);
  const direct = /\b(stable\s*coins?|usdt|usdc|tether|dai|busd|tusd|usde|frax|pyusd|gusd|terrausd|ust|libra|diem)\b/iu.test(text)
    || /稳定币|穩定幣|ステーブルコイン/u.test(citation);
  if (direct) return "direct";
  const background = /\b(defi|blockchain|cryptocurrenc|crypto asset|bitcoin|ethereum|bank run|financial contagion|shadow bank|cbdc|digital currenc|systemic risk)\b/iu.test(text)
    || /区块链|加密货币|加密资产|比特币|以太坊|銀行擠兌|银行挤兑|数字货币|金融风险|风险传染/u.test(citation);
  return background ? "background" : "unclear";
}

function csvValue(value: unknown): string {
  const string = value == null ? "" : Array.isArray(value) ? value.join(" | ") : String(value);
  return `"${string.replace(/"/gu, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return `${headers.map(csvValue).join(",")}\n${rows.map((row) => headers.map((header) => csvValue(row[header])).join(",")).join("\n")}\n`;
}

const resources = (await db.select({
  id: resourcesTable.id,
  title: resourcesTable.title,
  authors: resourcesTable.authors,
  publishedDate: resourcesTable.publishedDate,
  doi: resourcesTable.doi,
  url: resourcesTable.url,
  status: resourcesTable.status,
}).from(resourcesTable)) as ResourceRow[];

const pdfPaths = [...await walk(ORGANIZED_ROOT, new Set([".pdf"])), ...await walk(REFERENCE_ROOT, new Set([".pdf"]))];
const pdfsByHash = new Map<string, { paths: string[]; sizeMb: number }>();
for (const filePath of pdfPaths) {
  const buffer = await readFile(filePath);
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const existing = pdfsByHash.get(sha256);
  if (existing) existing.paths.push(filePath);
  else pdfsByHash.set(sha256, { paths: [filePath], sizeMb: buffer.length / 1024 / 1024 });
}

const pdfRecords: PdfRecord[] = [];
let parsed = 0;
for (const [sha256, grouped] of pdfsByHash) {
  const primaryPath = grouped.paths.find((value) => value.startsWith(REFERENCE_ROOT))
    ?? grouped.paths.find((value) => !value.includes("/06_网站批量导入包_20260823/"))
    ?? grouped.paths[0];
  const filenameEvidence = grouped.paths.map((value) => path.basename(value, path.extname(value)));
  let doi = extractDoi(filenameEvidence.join("\n"));
  let match = matchRecord(doi, filenameEvidence, resources);
  let titleEvidence = [...filenameEvidence];
  let extractionError: string | null = null;
  let usedTextExtraction = false;
  if (!match) {
    try {
      const extracted = await extractPdfEvidence(primaryPath);
      parsed += 1;
      usedTextExtraction = true;
      titleEvidence = [...new Set([...titleEvidence, ...extracted.evidence])];
      doi = doi ?? extracted.doi;
      match = matchRecord(doi, titleEvidence, resources);
    } catch (error) {
      extractionError = error instanceof Error ? error.message : String(error);
    }
  }
  const record: PdfRecord = {
    sha256,
    sizeMb: Number(grouped.sizeMb.toFixed(2)),
    primaryPath,
    paths: grouped.paths,
    titleEvidence,
    doi,
    usedTextExtraction,
    extractionError,
    existing: match?.resource ?? null,
    matchMethod: match?.method ?? null,
    matchScore: match?.score ?? 0,
    relevance: "unclear",
  };
  record.relevance = classifyRelevance(record);
  pdfRecords.push(record);
  if (pdfRecords.length % 25 === 0) console.log(`Audited ${pdfRecords.length}/${pdfsByHash.size} unique PDFs`);
}

const directDocxPaths = await walk(DIRECT_ROOT, new Set([".docx"]));
const extractTextUrl = new URL("../../artifacts/api-server/src/lib/unstructuredList/docxText.ts", import.meta.url).href;
const { extractDocxText } = await import(extractTextUrl) as { extractDocxText(buffer: Buffer): string };
const referenceRecords: ReferenceRecord[] = [];
const seenReferences = new Set<string>();
for (const filePath of directDocxPaths) {
  const text = extractDocxText(await readFile(filePath));
  const lines = text.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).slice(2);
  for (const citation of lines) {
    const doi = extractDoi(citation);
    const key = doi ?? normalize(citation);
    if (!key || seenReferences.has(key)) continue;
    seenReferences.add(key);
    const evidence = citationTitleEvidence(citation);
    let match = matchRecord(doi, evidence, resources);
    if (!match) {
      const normalizedCitation = normalize(citation);
      const contained = resources
        .filter((resource) => normalize(resource.title).length >= 12 && normalizedCitation.includes(normalize(resource.title)))
        .sort((a, b) => normalize(b.title).length - normalize(a.title).length)[0];
      if (contained) match = { resource: contained, score: 1, method: "title_in_citation" };
    }
    referenceRecords.push({
      sourceFile: filePath,
      citation,
      doi,
      existing: match?.resource ?? null,
      matchMethod: match?.method ?? null,
      matchScore: match?.score ?? 0,
    });
  }
}

const masterText = extractDocxText(await readFile(MASTER_REFERENCE_DOCX));
const masterStart = masterText.indexOf("已去重参考文献");
const masterLines = masterText.slice(Math.max(0, masterStart))
  .split(/\r?\n/u)
  .map((line) => line.replace(/^[•·\s]+/u, "").trim())
  .filter((line) => line.length >= 18)
  .filter((line) => !/^(已去重参考文献|待核验参考文献|中文参考文献|英文参考文献|其他参考文献|核验提示|说明)/u.test(line))
  .filter((line) => !/^\S{0,40}[（(]\d+\s*条[）)]$/u.test(line));
const masterRecords: Array<ReferenceRecord & { relevance: PdfRecord["relevance"] }> = [];
const seenMasterReferences = new Set<string>();
for (const citation of masterLines) {
  const doi = extractDoi(citation);
  const key = doi ?? normalize(citation);
  if (!key || seenMasterReferences.has(key)) continue;
  seenMasterReferences.add(key);
  const evidence = citationTitleEvidence(citation);
  let match = matchRecord(doi, evidence, resources);
  if (!match) {
    const normalizedCitation = normalize(citation);
    const contained = resources
      .filter((resource) => normalize(resource.title).length >= 12 && normalizedCitation.includes(normalize(resource.title)))
      .sort((a, b) => normalize(b.title).length - normalize(a.title).length)[0];
    if (contained) match = { resource: contained, score: 1, method: "title_in_citation" };
  }
  masterRecords.push({
    sourceFile: MASTER_REFERENCE_DOCX,
    citation,
    doi,
    existing: match?.resource ?? null,
    matchMethod: match?.method ?? null,
    matchScore: match?.score ?? 0,
    relevance: classifyCitationRelevance(citation),
  });
}

await mkdir(OUTPUT_ROOT, { recursive: true });
await writeFile(path.join(OUTPUT_ROOT, "website-resources.csv"), toCsv(resources.map((resource) => ({
  id: resource.id,
  status: resource.status,
  title: resource.title,
  authors: resource.authors,
  published_date: resource.publishedDate,
  doi: resource.doi,
  url: resource.url,
}))));
const pdfRows = pdfRecords.map((record) => ({
  existing_id: record.existing?.id,
  existing_status: record.existing?.status,
  existing_title: record.existing?.title,
  match_method: record.matchMethod,
  match_score: record.matchScore.toFixed(3),
  relevance: record.relevance,
  doi: record.doi,
  size_mb: record.sizeMb,
  primary_file: record.primaryPath,
  duplicate_paths: record.paths.length - 1,
  sha256: record.sha256,
  extracted: record.usedTextExtraction,
  extraction_error: record.extractionError,
  title_evidence: record.titleEvidence.slice(0, 5),
}));
const referenceRows = referenceRecords.map((record) => ({
  existing_id: record.existing?.id,
  existing_status: record.existing?.status,
  existing_title: record.existing?.title,
  match_method: record.matchMethod,
  match_score: record.matchScore.toFixed(3),
  doi: record.doi,
  source_file: record.sourceFile,
  citation: record.citation,
}));
const masterRows = masterRecords.map((record) => ({
  existing_id: record.existing?.id,
  existing_status: record.existing?.status,
  existing_title: record.existing?.title,
  match_method: record.matchMethod,
  match_score: record.matchScore.toFixed(3),
  relevance: record.relevance,
  doi: record.doi,
  citation: record.citation,
}));
const summary = {
  generatedAt: new Date().toISOString(),
  websiteResources: resources.length,
  inputPdfPaths: pdfPaths.length,
  uniquePdfHashes: pdfRecords.length,
  duplicatePdfPaths: pdfPaths.length - pdfRecords.length,
  pdfsMatchedToWebsite: pdfRecords.filter((record) => record.existing).length,
  pdfsMissingFromWebsite: pdfRecords.filter((record) => !record.existing).length,
  missingDirectPdfs: pdfRecords.filter((record) => !record.existing && record.relevance === "direct").length,
  missingBackgroundPdfs: pdfRecords.filter((record) => !record.existing && record.relevance === "background").length,
  pdfsLocallyParsed: parsed,
  directWordFiles: directDocxPaths.length,
  uniqueWordReferences: referenceRecords.length,
  referencesMatchedToWebsite: referenceRecords.filter((record) => record.existing).length,
  referencesMissingFromWebsite: referenceRecords.filter((record) => !record.existing).length,
  masterReferenceLines: masterLines.length,
  uniqueMasterReferences: masterRecords.length,
  masterReferencesMatchedToWebsite: masterRecords.filter((record) => record.existing).length,
  masterReferencesMissingDirect: masterRecords.filter((record) => !record.existing && record.relevance === "direct").length,
  masterReferencesMissingCryptoBackground: masterRecords.filter((record) => !record.existing && record.relevance === "background").length,
};
await writeFile(path.join(OUTPUT_ROOT, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "pdf-audit.csv"), toCsv(pdfRows));
await writeFile(path.join(OUTPUT_ROOT, "word-reference-audit.csv"), toCsv(referenceRows));
await writeFile(path.join(OUTPUT_ROOT, "missing-direct-pdfs.csv"), toCsv(pdfRows.filter((_row, index) => !pdfRecords[index].existing && pdfRecords[index].relevance === "direct")));
await writeFile(path.join(OUTPUT_ROOT, "missing-word-references.csv"), toCsv(referenceRows.filter((_row, index) => !referenceRecords[index].existing)));
await writeFile(path.join(OUTPUT_ROOT, "master-word-audit.csv"), toCsv(masterRows));
await writeFile(path.join(OUTPUT_ROOT, "master-missing-direct.csv"), toCsv(masterRows.filter((_row, index) => !masterRecords[index].existing && masterRecords[index].relevance === "direct")));
await writeFile(path.join(OUTPUT_ROOT, "master-missing-crypto-background.csv"), toCsv(masterRows.filter((_row, index) => !masterRecords[index].existing && masterRecords[index].relevance === "background")));
await writeFile(path.join(OUTPUT_ROOT, "missing-pdf-candidates.json"), `${JSON.stringify(
  pdfRecords
    .filter((record) => !record.existing && record.relevance !== "unclear")
    .map((record) => ({
      relevance: record.relevance,
      primaryFile: record.primaryPath,
      fileName: path.basename(record.primaryPath),
      duplicateCopies: record.paths.length - 1,
      allPaths: record.paths,
      sizeMb: record.sizeMb,
      doi: record.doi,
      titleEvidence: record.titleEvidence.slice(0, 5),
      extractionError: record.extractionError,
    })),
  null,
  2,
)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "missing-reference-candidates.json"), `${JSON.stringify(
  masterRecords
    .filter((record) => !record.existing && record.relevance !== "unclear")
    .map((record) => ({
      relevance: record.relevance,
      doi: record.doi,
      citation: record.citation,
    })),
  null,
  2,
)}\n`);

console.log(JSON.stringify(summary, null, 2));
process.exit(0);
