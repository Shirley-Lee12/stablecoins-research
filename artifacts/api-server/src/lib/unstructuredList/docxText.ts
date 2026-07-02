import zlib from "node:zlib";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIR_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;

interface ZipEntry {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

/** .docx is a zip archive — EOCD sits at the end, but a trailing comment (rare, but legal) can push it back further, so scan backward for the signature instead of assuming a fixed offset. */
function findEndOfCentralDirectory(buffer: Buffer): number {
  const minEocdSize = 22;
  for (let i = buffer.length - minEocdSize; i >= 0; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) return i;
  }
  throw new Error("Not a valid .docx file (zip End Of Central Directory record not found)");
}

function readCentralDirectory(buffer: Buffer): Map<string, ZipEntry> {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buffer.readUInt32LE(eocdOffset + 16);

  const entries = new Map<string, ZipEntry>();
  let offset = centralDirOffset;
  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIR_SIGNATURE) break;
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const fileCommentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);
    entries.set(fileName, { compressionMethod, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }
  return entries;
}

function readZipEntryData(buffer: Buffer, entry: ZipEntry): Buffer {
  const offset = entry.localHeaderOffset;
  if (buffer.readUInt32LE(offset) !== LOCAL_FILE_SIGNATURE) {
    throw new Error("Not a valid .docx file (corrupt zip local file header)");
  }
  const fileNameLength = buffer.readUInt16LE(offset + 26);
  const extraFieldLength = buffer.readUInt16LE(offset + 28);
  const dataStart = offset + 30 + fileNameLength + extraFieldLength;
  const compressedData = buffer.subarray(dataStart, dataStart + entry.compressedSize);
  if (entry.compressionMethod === 0) return compressedData; // stored (no compression)
  if (entry.compressionMethod === 8) return zlib.inflateRawSync(compressedData); // deflate
  throw new Error(`Unsupported .docx internal compression method: ${entry.compressionMethod}`);
}

/**
 * Extracts plain text from a .docx file's word/document.xml. A .docx is just a zip of XML parts —
 * this reads the zip's central directory and inflates that one part manually instead of pulling in
 * a docx-parsing dependency (mammoth et al.), since the sandbox this was built in can't reach the
 * pnpm registry to install anything new. Deliberately narrow: only handles standard, uncorrupted
 * OOXML packages (what Word/WPS/Google Docs actually produce), not every edge case a general zip
 * library would.
 */
export function extractDocxText(buffer: Buffer): string {
  const entries = readCentralDirectory(buffer);
  const docEntry = entries.get("word/document.xml");
  if (!docEntry) throw new Error("Not a valid .docx file (missing word/document.xml)");
  const xml = readZipEntryData(buffer, docEntry).toString("utf8");
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}
