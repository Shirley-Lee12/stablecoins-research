import zlib from "node:zlib";

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

export interface ArchiveEntry { name: string; data: Buffer }

/** Narrow, bounded ZIP reader for upload bundles. ZIP64/encrypted archives are rejected. */
export function readUploadArchive(buffer: Buffer, limits = { maxEntries: 500, maxExpandedBytes: 250 * 1024 * 1024 }): ArchiveEntry[] {
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === EOCD) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Invalid ZIP archive");
  const count = buffer.readUInt16LE(eocd + 10);
  if (count > limits.maxEntries) throw new Error(`ZIP contains more than ${limits.maxEntries} files`);
  let offset = buffer.readUInt32LE(eocd + 16);
  let expanded = 0;
  const output: ArchiveEntry[] = [];

  for (let i = 0; i < count; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL) throw new Error("Corrupt ZIP directory");
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength).replace(/\\/g, "/");
    offset += 46 + nameLength + extraLength + commentLength;
    if (flags & 1) throw new Error("Encrypted ZIP archives are not supported");
    if (!name || name.endsWith("/") || name.startsWith("__MACOSX/") || name.split("/").some((part) => part === "..")) continue;
    expanded += uncompressedSize;
    if (expanded > limits.maxExpandedBytes) throw new Error("ZIP expands beyond the 250MB safety limit");
    if (buffer.readUInt32LE(localOffset) !== LOCAL) throw new Error("Corrupt ZIP file entry");
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(start, start + compressedSize);
    let data: Buffer;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = zlib.inflateRawSync(compressed, { maxOutputLength: Math.min(uncompressedSize + 1, limits.maxExpandedBytes) });
    else throw new Error(`Unsupported ZIP compression method (${method})`);
    if (data.length !== uncompressedSize) throw new Error(`Corrupt ZIP entry: ${name}`);
    output.push({ name, data });
  }
  return output;
}
