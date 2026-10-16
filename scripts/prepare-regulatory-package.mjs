import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/regulatory_overview_package_v0.2",
);
const read = (p) => readFile(resolve(source, p), "utf8");
function csv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (row.length || cell) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift().map((h) => h.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

const data = { version: "0.2", lastVerified: "2026-10-16" };
data.jurisdictions = csv(await read("matrices/JURISDICTION_MATRIX.csv"));
data.sources = csv(await read("manifests/SOURCE_MANIFEST.csv"));
data.taxonomy = JSON.parse(await read("data/REGULATORY_STATUS_TAXONOMY.json"));
data.timeline = JSON.parse(await read("data/CURRENT_REGULATORY_TIMELINE.json"));
data.copy = {
  en: await read("content/CONTENT_MASTER.en.md"),
  zh: await read("content/CONTENT_MASTER.zh-CN.md"),
};
data.hashes = {};
async function walk(dir = "") {
  for (const entry of await readdir(resolve(source, dir), {
    withFileTypes: true,
  })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(rel);
    else
      data.hashes[rel] = createHash("sha256")
        .update(await readFile(resolve(source, rel)))
        .digest("hex");
  }
}
await walk();
await writeFile(
  resolve(
    root,
    "artifacts/stablecoin-hub/src/data/regulatory-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.info(
  `Regulatory V${data.version}: ${data.jurisdictions.length} jurisdictions, ${data.sources.length} sources, ${data.timeline.length} events, ${Object.keys(data.hashes).length} original files.`,
);
