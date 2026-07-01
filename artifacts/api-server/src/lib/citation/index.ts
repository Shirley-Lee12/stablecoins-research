import { decodeCitationBuffer } from "./decode";
import { detectFormat, parseCitationRecords } from "./parse";
import type { CitationParseResult } from "./types";

export * from "./types";

/** Decodes, sniffs the format of, and parses a CNKI citation export (RefWorks/EndNote/NoteExpress plain text — see docs/planning/06). Throws UnsupportedCitationFormatError for anything else, notably 知网研学's encrypted export. */
export function parseCitationFile(buffer: Buffer): CitationParseResult {
  const text = decodeCitationBuffer(buffer);
  const format = detectFormat(text);
  const records = parseCitationRecords(text, format);
  return { format, records };
}
