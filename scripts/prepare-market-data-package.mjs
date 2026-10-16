import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/market_data_dashboard_package_v0.2",
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

const data = { version: "0.2", baseline: "2026-10-16" };
for (const [key, file] of [
  ["sources", "manifests/SOURCE_MANIFEST.csv"],
  ["pages", "manifests/PAGE_MANIFEST.csv"],
  ["datasets", "data/DATASET_REGISTRY.csv"],
  ["metrics", "data/METRIC_DICTIONARY.csv"],
  ["modes", "data/SOURCE_MODE_DECISIONS.csv"],
  ["charts", "visuals/CHART_SPEC.csv"],
  ["issuers", "data/ISSUER_DISCLOSURE_BASELINE.csv"],
  ["signals", "data/DASHBOARD_SIGNAL_SPEC.csv"],
  ["macro", "data/MACRO_SERIES.csv"],
])
  data[key] = csv(await read(file));
data.contract = JSON.parse(await read("data/PUBLIC_DATA_CONTRACT.json"));
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
    "artifacts/stablecoin-hub/src/data/market-data-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.info(
  `Market Data V${data.version}: ${data.pages.length} routes, ${data.sources.length} sources, ${Object.keys(data.hashes).length} untouched source files.`,
);
