import { generateJson } from "../llm";

export interface DecomposedEntry {
  title: string;
  authors: string[];
  year: number | null;
  sourceType: "journal_article" | "working_paper" | "conference_paper" | "thesis" | "report" | "gov_document" | "news";
  /** Either a URL or a bare DOI (e.g. "10.1016/j.frl.2020.101867") — normalized to a fetchable URL by the caller before routing, since this is exactly what's printed in a reference list and callers shouldn't have to re-derive it. */
  urlOrDoi: string | null;
}

/**
 * One LLM call that turns a free-text reference list (docs/planning/14 §3.3) into a structured
 * array. This is the "AI parses, human confirms" step doc 3.3 point 3 requires before anything
 * downstream — the caller must show `entries` to the user for editing/confirmation and must NOT
 * route any entry into a pipeline before that happens.
 */
export async function decomposeReferenceList(text: string): Promise<DecomposedEntry[]> {
  const prompt = `You are extracting a structured list of academic/institutional references from the text below. The text is a human-written reference list — it may include section headers, numbering, explanatory notes (e.g. lines starting with ">" or "注:"), and mixed citation styles. Extract ONLY the actual reference entries; skip headers, notes, and any commentary that isn't itself a citation.

For each reference entry, extract:
- "title": string — the work's title
- "authors": string[] — copy author names exactly as the citation prints them. Never guess or expand initials into names. Use the issuing institution's name as the sole entry only when the citation identifies it as the author (e.g. a government body, standards organization, or company report), not merely because the institution is discussed in the title.
- "year": number | null — publication year if shown
- "sourceType": one of exactly "journal_article", "working_paper", "conference_paper", "thesis", "report", "gov_document", or "news". Journal title/volume/issue/pages means journal_article; an explicitly numbered preprint or working-paper series means working_paper; proceedings or a presented paper means conference_paper; a degree dissertation means thesis; a standalone institutional/audit/research publication means report; legislation, regulations, rules, official guidelines or consultations mean gov_document; a dated web story, press release, commentary or blog post means news.
- "urlOrDoi": string | null — a URL if one is printed, otherwise a bare DOI (e.g. "10.1016/j.frl.2020.101867") if one is printed, otherwise null. Never invent one.

Text:
---
${text.slice(0, 12000)}
---

Respond with ONLY a JSON object: { "entries": [ { "title": string, "authors": string[], "year": number | null, "sourceType": string, "urlOrDoi": string | null }, ... ] }. No markdown fences, no extra text.`;

  // A real 16-entry list already needed >4096 tokens to avoid truncating mid-response (see commit
  // history); response length also varies run-to-run for the same input (LLM output isn't fully
  // deterministic), so 8192 still wasn't a safe margin — one real run got cut off mid-string
  // ("Unterminated string in JSON") even on a list this size. Doubled for real headroom.
  const raw = await generateJson(prompt, 16384);
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  return entries
    .filter((e: unknown): e is Record<string, unknown> => !!e && typeof e === "object")
    .map((e: Record<string, unknown>) => ({
      title: typeof e.title === "string" ? e.title.trim() : "",
      authors: Array.isArray(e.authors) ? e.authors.filter((a: unknown): a is string => typeof a === "string") : [],
      year: typeof e.year === "number" ? e.year : null,
      sourceType: (["journal_article", "working_paper", "conference_paper", "thesis", "report", "gov_document", "news"] as const).includes(e.sourceType as any)
        ? e.sourceType as DecomposedEntry["sourceType"]
        : "journal_article",
      urlOrDoi: typeof e.urlOrDoi === "string" && e.urlOrDoi.trim() ? e.urlOrDoi.trim() : null,
    }))
    .filter((e: DecomposedEntry) => e.title.length > 0);
}

/** Parses long Word bibliographies in bounded chunks while preserving paragraph boundaries. */
export async function decomposeReferenceListInChunks(text: string): Promise<DecomposedEntry[]> {
  const paragraphs = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 1 > 8_000) {
      chunks.push(current);
      current = "";
    }
    current += `${current ? "\n" : ""}${paragraph}`;
  }
  if (current) chunks.push(current);
  const all: DecomposedEntry[] = [];
  const inputs = chunks.length > 0 ? chunks : [text];
  for (let i = 0; i < inputs.length; i += 2) {
    const results = await Promise.all(inputs.slice(i, i + 2).map(decomposeReferenceList));
    results.forEach((entries) => all.push(...entries));
  }
  const seen = new Set<string>();
  return all.filter((entry) => {
    const key = `${entry.title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()}:${entry.year ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
