import { decodeCitationBuffer } from "../citation/decode";
import { extractDocxText } from "./docxText";

export class UnsupportedListFormatError extends Error {}

/**
 * Extracts plain text from an unstructured reference-list file (docs/planning/14 §3.2/3.3) by
 * extension. .md is plain text (UTF-8 with the same GBK fallback the citation module uses — reused
 * directly rather than duplicated, since it's a generic decoder, not citation-specific). .docx goes
 * through the minimal zip+XML reader in docxText.ts. .doc (legacy binary OLE2) and .wps (proprietary
 * WPS format) have no viable dependency-free parser — rather than silently mis-decoding binary bytes
 * as "text" and feeding garbage into the LLM call, these are rejected upfront with a message asking
 * for .docx or .md instead (docs/planning/14 §3.1.1 lists .doc/.wps as "if the user actually needs
 * them," not a hard requirement — this is the honest interpretation of that when a real parser isn't
 * available).
 */
export function extractListFileText(buffer: Buffer, fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  if (ext === "md") return decodeCitationBuffer(buffer);
  if (ext === "docx") return extractDocxText(buffer);
  if (ext === "doc" || ext === "wps") {
    throw new UnsupportedListFormatError(
      `.${ext} files can't be parsed automatically (no reliable text extractor for this legacy binary format) — please save/export "${fileName}" as .docx or .md and re-upload.`,
    );
  }
  throw new UnsupportedListFormatError(`Unsupported reference-list file type: .${ext}`);
}
