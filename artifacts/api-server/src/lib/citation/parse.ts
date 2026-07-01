import type { CitationFormat, CitationRecord } from "./types";
import { UnsupportedCitationFormatError } from "./types";

/** Splits a decoded export into individual records — CNKI separates records with a blank line, and paragraph breaks inside an abstract are single newlines, never blank lines, so this never fragments an abstract. */
function splitRecords(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((r) => r.trim())
    .filter(Boolean);
}

/** Maps a CNKI "reference type" string (which varies slightly by format — "Dissertation/Thesis" vs "Thesis", "Conference Proceeding(s)") to one of the 08-final 7 slugs. Falls back to "report" for anything not recognized (books, generic records) rather than guessing. */
function mapSourceType(rawType: string): string {
  const t = rawType.toLowerCase();
  if (t.includes("thesis") || t.includes("dissertation")) return "thesis";
  if (t.includes("conference")) return "conference_paper";
  if (t.includes("newspaper")) return "news";
  if (t.includes("journal")) return "journal_article";
  return "report";
}

/** First 4 digits found in a free-text date (e.g. CNKI's "FD"/"%8"/"{Date}" newspaper date "2026-06-10") — used as the year fallback when the record has no dedicated year field (true for every newspaper record in real exports; see docs/planning/14). */
function yearFromDateString(date: string | undefined): number | null {
  const match = date?.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

/** Shared six-elements assembly + institutional-author fallback (docs/planning/06 §2 point 4, docs/planning/09 §2's policy — no individual author credited means use the issuing body's name instead of leaving authors empty). */
function buildRecord(fields: {
  type: string; title: string; authorsRaw: string | string[] | undefined; institution: string | undefined;
  venue: string | undefined; year: string | undefined; date: string | undefined; keywordsRaw: string | undefined;
  abstract: string | undefined; doi: string | undefined; url: string | undefined; publisher: string | undefined;
}): CitationRecord {
  const authors = Array.isArray(fields.authorsRaw)
    ? fields.authorsRaw.map((a) => a.trim()).filter(Boolean)
    : (fields.authorsRaw ?? "").split(";").map((a) => a.trim()).filter(Boolean);

  // No individual author credited (e.g. an institutional report with no A1/%A/{Author} line) —
  // fall back to the issuing body's name instead of leaving authors empty, same policy as the
  // LLM-extraction entries (docs/planning/09 §2). Publisher is the most direct "who issued this"
  // signal; author-affiliation and journal/venue name are progressively weaker fallbacks.
  const institutionFallback = [fields.publisher, fields.institution, fields.venue]
    .map((v) => v?.trim().replace(/;+$/, ""))
    .find((v): v is string => !!v);
  const finalAuthors = authors.length > 0 ? authors : institutionFallback ? [institutionFallback] : [];

  return {
    title: fields.title.trim(),
    authors: finalAuthors,
    authorIsInstitution: authors.length === 0 && finalAuthors.length > 0,
    year: fields.year ? Number(fields.year) : yearFromDateString(fields.date),
    abstract: fields.abstract?.trim() ?? "",
    abstractSource: fields.abstract?.trim() ? "cnki" : null,
    keywords: (fields.keywordsRaw ?? "").split(";").map((k) => k.trim()).filter(Boolean),
    doi: fields.doi?.trim() || null,
    url: fields.url?.trim() || null,
    sourceType: mapSourceType(fields.type),
    venue: fields.venue?.trim() || null,
  };
}

// ── RefWorks / 知网研学(plain-text variant) — "TAG value" lines, TAG is 2 alnum chars ─────────
const REFWORKS_TAGS = new Set(["RT", "SR", "A1", "A3", "AD", "T1", "JF", "YR", "IS", "OP", "PP", "CL", "VO", "K1", "AB", "SN", "CN", "LA", "DS", "LK", "DO", "FD", "PB"]);

function parseRefWorksRecord(record: string): CitationRecord {
  const fields: Record<string, string> = {};
  let currentTag: string | null = null;
  for (const line of record.split("\n")) {
    const match = line.match(/^([A-Za-z0-9]{2})\s(.*)$/);
    if (match && REFWORKS_TAGS.has(match[1].toUpperCase())) {
      currentTag = match[1].toUpperCase();
      fields[currentTag] = (fields[currentTag] ? fields[currentTag] + "\n" : "") + match[2];
    } else if (currentTag) {
      fields[currentTag] += "\n" + line;
    }
  }
  return buildRecord({
    type: fields.RT ?? "", title: fields.T1 ?? "", authorsRaw: fields.A1, institution: fields.AD,
    venue: fields.JF, year: fields.YR, date: fields.FD, keywordsRaw: fields.K1, abstract: fields.AB,
    doi: fields.DO, url: fields.LK, publisher: fields.PB,
  });
}

// ── EndNote — "%X value" lines, repeated %A lines = multiple authors ───────────────────────────
// Any "%" + one character is a real EndNote tag (CNKI's actual exports use tags beyond the ones
// this app reads — %B/%C/%? for conference proceedings, %L/%V, etc.) — a well-formed tag line must
// always start a new field, whether or not it's one we care about. Treating an unrecognized tag as
// "continuation of the previous field" (the bug this replaced) silently corrupts that field with
// garbage, e.g. a conference paper's title swallowing the next four lines' raw tags and values.
function parseEndNoteRecord(record: string): CitationRecord {
  const fields: Record<string, string> = {};
  const authorList: string[] = [];
  let currentTag: string | null = null;
  for (const line of record.split("\n")) {
    const match = line.match(/^%(\S)\s?(.*)$/);
    if (match) {
      currentTag = match[1];
      if (currentTag === "A") { authorList.push(match[2]); continue; }
      fields[currentTag] = (fields[currentTag] ? fields[currentTag] + "\n" : "") + match[2];
    } else if (currentTag) {
      if (currentTag === "A") { authorList[authorList.length - 1] += "\n" + line; continue; }
      fields[currentTag] += "\n" + line;
    }
  }
  return buildRecord({
    type: fields["0"] ?? "", title: fields.T ?? "", authorsRaw: authorList, institution: fields["+"],
    venue: fields.J, year: fields.D, date: fields["8"], keywordsRaw: fields.K, abstract: fields.X,
    doi: fields.R, url: fields.U, publisher: fields.I,
  });
}

// ── NoteExpress — "{Field Name}: value" lines ───────────────────────────────────────────────────
// Same reasoning as EndNote above: any "{...}: " line is a real field boundary (CNKI's actual
// exports include fields this app never reads, e.g. {Volume}, {Tertiary Title} for conference
// papers) — recognizing only a pre-enumerated subset let unmapped fields corrupt whatever field
// came before them.
function parseNoteExpressRecord(record: string): CitationRecord {
  const fields: Record<string, string> = {};
  let currentTag: string | null = null;
  for (const line of record.split("\n")) {
    const match = line.match(/^\{([^}]+)\}:\s?(.*)$/);
    if (match) {
      currentTag = match[1];
      fields[currentTag] = (fields[currentTag] ? fields[currentTag] + "\n" : "") + match[2];
    } else if (currentTag) {
      fields[currentTag] += "\n" + line;
    }
  }
  return buildRecord({
    type: fields["Reference Type"] ?? "", title: fields.Title ?? "", authorsRaw: fields.Author, institution: fields["Author Address"],
    venue: fields.Journal ?? fields["Secondary Title"], year: fields.Year, date: fields.Date, keywordsRaw: fields.Keywords,
    abstract: fields.Abstract, doi: fields.DOI, url: fields.URL, publisher: fields.Publisher,
  });
}

/** Sniffs format from the first non-empty line — CNKI's four export options use unambiguous, distinct line prefixes (docs/planning/06 §2). Throws UnsupportedCitationFormatError for anything else, notably 知网研学's actual export, which turned out to be an encrypted binary format (docs/planning/10), not the plain "RT "-prefixed text originally assumed. */
export function detectFormat(text: string): CitationFormat {
  const firstLine = text.replace(/\r\n/g, "\n").split("\n").find((l) => l.trim().length > 0) ?? "";
  if (/^RT\s/.test(firstLine)) return "refworks";
  if (/^%0/.test(firstLine)) return "endnote";
  if (/^\{Reference Type\}/.test(firstLine)) return "noteexpress";
  throw new UnsupportedCitationFormatError(
    "Unrecognized citation format. RefWorks/EndNote/NoteExpress plain-text exports are supported; " +
    "知网研学's own export format is encrypted and can't be parsed automatically — please re-export " +
    "as RefWorks, EndNote, or NoteExpress instead.",
  );
}

export function parseCitationRecords(text: string, format: CitationFormat): CitationRecord[] {
  const records = splitRecords(text);
  const parser = format === "refworks" ? parseRefWorksRecord : format === "endnote" ? parseEndNoteRecord : parseNoteExpressRecord;
  return records.map(parser);
}
