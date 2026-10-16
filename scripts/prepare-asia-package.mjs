import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// Mechanical import of the approved package. No network, old copy or inferred fields.
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/asia_stablecoin_codex_package_v0.2",
);
const read = (path) => readFile(resolve(source, path), "utf8");
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
  const headers = rows.shift().map((s) => s.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}
const data = {
  version: "0.2",
  baseline: "2026-10-16",
  regulatory: csv(await read("matrices/REGULATORY_MATRIX.csv")),
  products: csv(await read("matrices/PRODUCT_AVAILABILITY.csv")),
  timeline: JSON.parse(await read("visuals/TIMELINE_DATA.json")),
  sources: csv(await read("manifests/SOURCE_MANIFEST.csv")),
  pages: csv(await read("manifests/PAGE_MANIFEST.csv")),
  assets: csv(await read("manifests/ASSET_MANIFEST.csv")),
  copy: {
    zh: await read("content/CONTENT_MASTER.zh-CN.md"),
    en: await read("content/CONTENT_MASTER.en.md"),
  },
  researchBaseline: await read("RESEARCH_BASELINE_V0.1.md"),
  svg: {},
  hashes: {},
};
const assetDir = resolve(
  root,
  "artifacts/stablecoin-hub/public/asia-development/v0.2",
);
await mkdir(assetDir, { recursive: true });
for (const file of (await readdir(resolve(source, "visuals/final"))).sort()) {
  const svg = await read(`visuals/final/${file}`);
  data.svg[file.slice(0, 7)] = svg;
  data.hashes[file] = createHash("sha256").update(svg).digest("hex");
  await copyFile(
    resolve(source, "visuals/final", file),
    resolve(assetDir, file),
  );
}
await writeFile(
  resolve(
    root,
    "artifacts/stablecoin-hub/src/data/asia-development-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.info(
  `Asia V${data.version}: ${data.regulatory.length} regulatory rows, ${data.products.length} product/boundary records, ${data.sources.length} sources, ${Object.keys(data.svg).length} SVGs.`,
);
