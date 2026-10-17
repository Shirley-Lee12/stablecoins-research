import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/academic_resources_experts_package_v0.2",
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

const data = {
  version: "0.2",
  verified: "2026-10-16",
  seedOrigin: "ACADEMIC_RESOURCES_EXPERTS_V0_2_2026_10_16",
};
for (const [key, file] of [
  ["resources", "data/PUBLIC_RESOURCE_SEED_CANDIDATES.csv"],
  ["researchers", "data/PUBLIC_RESEARCHER_SEED_CANDIDATES.csv"],
  ["institutions", "data/PUBLIC_INSTITUTION_SEED_CANDIDATES.csv"],
  ["sources", "manifests/SOURCE_MANIFEST.csv"],
  ["pages", "manifests/PAGE_MANIFEST.csv"],
  ["assets", "manifests/ASSET_MANIFEST.csv"],
])
  data[key] = csv(await read(file));
for (const [key, file] of [
  ["taxonomy", "RESOURCE_TAXONOMY"],
  ["search", "SEARCH_FILTER_SPEC"],
  ["empty", "EMPTY_STATE_SPEC"],
])
  data[key] = JSON.parse(await read("data/" + file + ".json"));
data.copy = {
  en: await read("content/CONTENT_MASTER.en.md"),
  zh: await read("content/CONTENT_MASTER.zh-CN.md"),
};
data.hashes = {};
async function walk(dir = "") {
  for (const e of await readdir(resolve(source, dir), {
    withFileTypes: true,
  })) {
    const rel = dir ? dir + "/" + e.name : e.name;
    if (e.isDirectory()) await walk(rel);
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
    "artifacts/stablecoin-hub/src/data/academic-directory-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  "Academic directory: " +
    data.resources.length +
    " resource / " +
    data.researchers.length +
    " researcher candidates; " +
    Object.keys(data.hashes).length +
    " original files.",
);
