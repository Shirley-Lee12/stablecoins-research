import { generateJson } from "../llm";

export interface DecomposedEntry {
  title: string;
  authors: string[];
  year: number | null;
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
- "authors": string[] — list of author full names, or the issuing institution's name as the sole entry if no individual author is named (e.g. a government body, standards organization, or company report)
- "year": number | null — publication year if shown
- "urlOrDoi": string | null — a URL if one is printed, otherwise a bare DOI (e.g. "10.1016/j.frl.2020.101867") if one is printed, otherwise null. Never invent one.

Text:
---
${text.slice(0, 12000)}
---

Respond with ONLY a JSON object: { "entries": [ { "title": string, "authors": string[], "year": number | null, "urlOrDoi": string | null }, ... ] }. No markdown fences, no extra text.`;

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
      urlOrDoi: typeof e.urlOrDoi === "string" && e.urlOrDoi.trim() ? e.urlOrDoi.trim() : null,
    }))
    .filter((e: DecomposedEntry) => e.title.length > 0);
}
