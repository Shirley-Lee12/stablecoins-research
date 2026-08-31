import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const AUDIT_ROOT = path.resolve("output/import-audit-20260825");
const OUTPUT_ROOT = path.join(AUDIT_ROOT, "import-ready");

type PdfCandidate = {
  relevance: "direct" | "background";
  primaryFile: string;
  fileName: string;
  duplicateCopies: number;
  allPaths: string[];
  sizeMb: number;
  doi: string | null;
  titleEvidence: string[];
  extractionError: string | null;
};

type ReferenceCandidate = {
  relevance: "direct" | "background";
  doi: string | null;
  citation: string;
};

type ExcludedCandidate = {
  kind: "pdf" | "reference";
  label: string;
  reason: string;
};

const CRYPTO_SCOPE = /\b(?:stable\s*coins?|cryptocurrenc\w*|crypto[- ]?assets?|crypto\b|defi|decentralized finance|bitcoin|ethereum|ether\b|erc[- ]?20|tokenomics|makerdao|dai\b|tether\b|usdt\b|usdc\b|usde\b|libra\b|diem\b|blockchain|smart contracts?|cross[- ]?chain|flash loans?|dao\b|decentralized autonomous|automated market makers?|on[- ]?chain|oracles?)\b|稳定币|穩定幣|加密货币|加密資產|加密资产|比特币|以太坊|区块链|區塊鏈|去中心化金融|智能合约|ステーブルコイン/iu;
const NON_FINANCIAL_BLOCKCHAIN = /legal documents?|teaching blockchain|metaverse|human[- ]centric dimensions|interface experimentation|application development at university|design challenges of blockchain-based applications|blueprint for a new economy|potenzial der blockchain/iu;
const ATTACHMENT_OR_SERIES = /(?:^|[_\s-])(?:security[_\s-]?incident|stablecoin[_\s-]?list)(?:[_.\s-]|$)|(?:^|[/_\s-])(?:附录|附錄|附件|附表|appendix|supplement(?:ary)?)(?:[/_\s-]|$)|usdc[\s_-].*(?:grant[\s_-]+thornton|examination[\s_-]+report)|(?:circle[\s_-]+grant[\s_-]+thornton[\s_-]+report)/iu;
const CBDC_ONLY = /\b(?:cbdc|digital rmb|e-cny|mbridge)\b|数字人民币|數字人民幣|央行数字货币|央行數字貨幣/iu;
const UNVERIFIED_SECTION = /^以下条目仅出现在/u;
const KNOWN_EXISTING_OR_BAD_REFERENCE = /par for the course: public information and stable coin runs|what keeps stable coins stable|money creation in decentralized finance: a dynamic model of stablecoins and crypto shadow banking|decentralization illusion in defi: evidence from makerdao|leveraging large language models to bridge cross-domain transparency in stablecoins|the hybrid future - how stablecoins will complement existing payment systems|bitcoin: a peer-to-peer electronic cash system/iu;

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase()
    .replace(/https?:\/\/\S+/giu, " ")
    .replace(/10\.\d{4,9}\/\S+/giu, " ")
    .replace(/\barxiv:\s*\d{4}\.\d+(?:v\d+)?\b/giu, " ")
    .replace(/\.(?:pdf|docx)$/iu, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function pdfTitle(candidate: PdfCandidate): string {
  const useful = candidate.titleEvidence.slice(1).find((value) => {
    const normalized = normalize(value);
    return normalized.length >= 12
      && !/^(?:researchpaper|whitepaperdocument|article not peer reviewed|title|no project)/iu.test(normalized)
      && !/^(?:vol|doi|gt com|independent accountants? report)/iu.test(normalized);
  });
  const fileTitle = path.basename(candidate.fileName, path.extname(candidate.fileName));
  const fileLooksDescriptive = normalize(fileTitle).length >= 14
    && !/^(?:researchpaper|p\d+|state of crypto|usdc whitepaper)/iu.test(normalize(fileTitle));
  return fileLooksDescriptive ? fileTitle : useful ?? fileTitle;
}

function titleFromCitation(citation: string): string {
  const withoutLinks = citation.replace(/https?:\/\/\S+/giu, " ").replace(/\bDOI\s*:\s*10\.\S+/giu, " ");
  const apa = withoutLinks.match(/\((?:19|20)\d{2}[^)]*\)[.,]?\s+(.+?)(?=\.\s+(?:[A-Z\p{Script=Han}]|$)|$)/iu);
  if (apa?.[1]) return apa[1].trim();
  const gbt = withoutLinks.match(/(?:19|20)\d{2}[a-z]?[.,]?\s+(.+?)(?=\[[A-Z/]+\]|\.\s+https?:|$)/iu);
  if (gbt?.[1]) return gbt[1].trim();
  return withoutLinks.trim();
}

function titleKey(value: string): string {
  return normalize(value)
    .replace(/\b(?:arxiv|preprint|working paper|electronic journal|null)\b/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function titleTokens(value: string): Set<string> {
  const stop = new Set(["a", "an", "and", "as", "for", "in", "of", "on", "the", "to", "with"]);
  return new Set(titleKey(value).split(" ").filter((token) => token.length > 1 && !stop.has(token)));
}

function titleOverlap(left: string, right: string): number {
  const a = titleTokens(left);
  const b = titleTokens(right);
  if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.min(a.size, b.size);
}

function doiRank(doi: string | null): number {
  if (!doi) return 0;
  if (/10\.48550\/arxiv|10\.36227\/techrxiv/iu.test(doi)) return 1;
  if (/10\.2139\/ssrn/iu.test(doi)) return 2;
  return 3;
}

function chunks<T>(values: T[], size: number): T[][] {
  const output: T[][] = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

const pdfCandidates = JSON.parse(await readFile(path.join(AUDIT_ROOT, "missing-pdf-candidates.json"), "utf8")) as PdfCandidate[];
const referenceCandidates = JSON.parse(await readFile(path.join(AUDIT_ROOT, "missing-reference-candidates.json"), "utf8")) as ReferenceCandidate[];
const excluded: ExcludedCandidate[] = [];

const scopedPdfs = pdfCandidates.filter((candidate) => {
  const searchable = [candidate.fileName, ...candidate.titleEvidence].join(" ");
  if (ATTACHMENT_OR_SERIES.test(searchable)) {
    excluded.push({ kind: "pdf", label: candidate.primaryFile, reason: "attachment_or_periodic_attestation" });
    return false;
  }
  if (CBDC_ONLY.test(searchable) && !/stable\s*coin|稳定币|穩定幣|ステーブルコイン/iu.test(searchable)) {
    excluded.push({ kind: "pdf", label: candidate.primaryFile, reason: "cbdc_only_without_stablecoin_or_crypto_focus" });
    return false;
  }
  if (!CRYPTO_SCOPE.test(searchable)) {
    excluded.push({ kind: "pdf", label: candidate.primaryFile, reason: "outside_stablecoin_or_crypto_scope" });
    return false;
  }
  return true;
});

const pdfGroups = new Map<string, PdfCandidate[]>();
for (const candidate of scopedPdfs) {
  const key = titleKey(pdfTitle(candidate));
  const group = pdfGroups.get(key) ?? [];
  group.push(candidate);
  pdfGroups.set(key, group);
}

const titleDeduplicatedPdfs: PdfCandidate[] = [];
for (const group of pdfGroups.values()) {
  const selected = group.sort((left, right) => {
    const doiDifference = doiRank(right.doi) - doiRank(left.doi);
    if (doiDifference) return doiDifference;
    return right.titleEvidence.length - left.titleEvidence.length;
  })[0];
  titleDeduplicatedPdfs.push(selected);
  for (const duplicate of group.slice(1)) {
    excluded.push({ kind: "pdf", label: duplicate.primaryFile, reason: `alternate_version_of:${selected.primaryFile}` });
  }
}

const doiGroups = new Map<string, PdfCandidate[]>();
for (const candidate of titleDeduplicatedPdfs) {
  const key = candidate.doi?.toLocaleLowerCase() ?? `title:${titleKey(pdfTitle(candidate))}`;
  const group = doiGroups.get(key) ?? [];
  group.push(candidate);
  doiGroups.set(key, group);
}
const selectedPdfs: Array<PdfCandidate & { title: string }> = [];
for (const group of doiGroups.values()) {
  const selected = group.sort((left, right) => right.titleEvidence.length - left.titleEvidence.length)[0];
  const title = pdfTitle(selected);
  const correctedDoi = /monetary stabilization in cryptocurrencies/iu.test(title)
    ? "10.1109/CVCBT.2019.00011"
    : selected.doi;
  selectedPdfs.push({ ...selected, doi: correctedDoi, title });
  for (const duplicate of group.slice(1)) {
    excluded.push({ kind: "pdf", label: duplicate.primaryFile, reason: `same_doi_as:${selected.primaryFile}` });
  }
}
selectedPdfs.sort((left, right) => left.title.localeCompare(right.title, "en"));

const selectedPdfDois = new Set(selectedPdfs.map((candidate) => candidate.doi?.toLocaleLowerCase()).filter(Boolean));
const selectedPdfTitles = selectedPdfs.map((candidate) => titleKey(candidate.title)).filter((value) => value.length >= 12);
const verifiedReferenceSection: ReferenceCandidate[] = [];
for (const candidate of referenceCandidates) {
  if (UNVERIFIED_SECTION.test(candidate.citation)) break;
  verifiedReferenceSection.push(candidate);
}

const scopedReferences = verifiedReferenceSection.filter((candidate) => {
  if (!CRYPTO_SCOPE.test(candidate.citation)) {
    excluded.push({ kind: "reference", label: candidate.citation, reason: "outside_stablecoin_or_crypto_scope" });
    return false;
  }
  if (NON_FINANCIAL_BLOCKCHAIN.test(candidate.citation)) {
    excluded.push({ kind: "reference", label: candidate.citation, reason: "non_financial_blockchain_application" });
    return false;
  }
  if (KNOWN_EXISTING_OR_BAD_REFERENCE.test(candidate.citation)) {
    excluded.push({ kind: "reference", label: candidate.citation, reason: "known_existing_alternate_version_or_bad_citation" });
    return false;
  }
  if (!candidate.doi) {
    excluded.push({ kind: "reference", label: candidate.citation, reason: "no_verified_doi_for_automatic_batch" });
    return false;
  }
  const title = titleKey(titleFromCitation(candidate.citation));
  if ((candidate.doi && selectedPdfDois.has(candidate.doi.toLocaleLowerCase()))
    || selectedPdfTitles.some((pdf) => title.includes(pdf) || pdf.includes(title) || titleOverlap(pdf, title) >= 0.75)) {
    excluded.push({ kind: "reference", label: candidate.citation, reason: "local_pdf_preferred" });
    return false;
  }
  return true;
});

const referenceGroups = new Map<string, ReferenceCandidate[]>();
for (const candidate of scopedReferences) {
  const key = titleKey(titleFromCitation(candidate.citation));
  const group = referenceGroups.get(key) ?? [];
  group.push(candidate);
  referenceGroups.set(key, group);
}

const selectedReferences: ReferenceCandidate[] = [];
for (const group of referenceGroups.values()) {
  const selected = group.sort((left, right) => doiRank(right.doi) - doiRank(left.doi))[0];
  selectedReferences.push(selected);
  for (const duplicate of group.slice(1)) {
    excluded.push({ kind: "reference", label: duplicate.citation, reason: `alternate_version_of:${selected.doi ?? titleFromCitation(selected.citation)}` });
  }
}
selectedReferences.sort((left, right) => titleFromCitation(left.citation).localeCompare(titleFromCitation(right.citation), "en"));

const manualImports = [
  {
    title: "The hybrid future: How stablecoins will complement existing payment systems",
    url: "https://www.qedinvestors.com/blog/the-hybrid-future-how-stablecoins-will-complement-existing-payment-systems",
    reason: "Verified official QED Investors article; prepared in the browser for final confirmation.",
  },
  {
    title: "Regulating LIBRA: The Transformative Potential of Facebook's Cryptocurrency and Possible Regulatory Responses",
    doi: "10.1093/ojls/gqaa036",
    url: "https://doi.org/10.1093/ojls/gqaa036",
    reason: "Corrected and verified published-version DOI for the incomplete Word citation.",
  },
];

await rm(OUTPUT_ROOT, { recursive: true, force: true });
await mkdir(OUTPUT_ROOT, { recursive: true });
await writeFile(path.join(OUTPUT_ROOT, "selected-pdfs.json"), `${JSON.stringify(selectedPdfs, null, 2)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "pdf-batches.json"), `${JSON.stringify(chunks(selectedPdfs.map((candidate) => candidate.primaryFile), 5), null, 2)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "selected-references.json"), `${JSON.stringify(selectedReferences, null, 2)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "manual-url-imports.json"), `${JSON.stringify(manualImports, null, 2)}\n`);
await writeFile(path.join(OUTPUT_ROOT, "excluded-candidates.json"), `${JSON.stringify(excluded, null, 2)}\n`);

const referenceBatches = chunks(selectedReferences, 20);
for (const [index, batch] of referenceBatches.entries()) {
  const header = `Stablecoin / crypto reference import batch ${index + 1}\n\n`;
  await writeFile(path.join(OUTPUT_ROOT, `reference-batch-${String(index + 1).padStart(2, "0")}.md`), `${header}${batch.map((item) => item.citation).join("\n\n")}\n`);
}

const summary = {
  generatedAt: new Date().toISOString(),
  selectedPdfCount: selectedPdfs.length,
  pdfBatchCount: Math.ceil(selectedPdfs.length / 5),
  selectedReferenceCount: selectedReferences.length,
  referenceBatchCount: referenceBatches.length,
  manualUrlCount: manualImports.length,
  excludedCount: excluded.length,
};
await writeFile(path.join(OUTPUT_ROOT, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
