import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

// Deterministic import of the supplied source package; no old page content or network.
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/home_research_codex_package_v0.2",
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
  const headers = rows.shift().map((h) => h.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}
const data = {
  version: "0.2",
  baseline: "2026-10-16",
  research: JSON.parse(await read("data/RESEARCH_STATUS.json")),
  labels: JSON.parse(await read("data/STATUS_LABELS.json")),
  pages: csv(await read("manifests/PAGE_MANIFEST.csv")),
  sources: csv(await read("manifests/SOURCE_MANIFEST.csv")),
  assets: csv(await read("manifests/ASSET_MANIFEST.csv")),
  copy: {
    home: {
      zh: await read("content/HOME_CONTENT_MASTER.zh-CN.md"),
      en: await read("content/HOME_CONTENT_MASTER.en.md"),
    },
    research: {
      zh: await read("content/RESEARCH_CONTENT_MASTER.zh-CN.md"),
      en: await read("content/RESEARCH_CONTENT_MASTER.en.md"),
    },
  },
  svg: {},
  hashes: {},
};
const dest = resolve(
  root,
  "artifacts/stablecoin-hub/public/home-research/v0.2",
);
await mkdir(dest, { recursive: true });
for (const filename of (
  await readdir(resolve(source, "visuals/final"))
).sort()) {
  const raw = await read(`visuals/final/${filename}`);
  const id = filename.match(/^(HOME-D\d+|RES-D\d+)/)[0];
  data.svg[id] = raw;
  data.hashes[filename] = createHash("sha256").update(raw).digest("hex");
  await copyFile(
    resolve(source, "visuals/final", filename),
    resolve(dest, filename),
  );
}
await writeFile(
  resolve(
    root,
    "artifacts/stablecoin-hub/src/data/home-research-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.info(
  `Home/Research V${data.version}: ${data.research.length} research records, ${data.sources.length} source records, ${Object.keys(data.svg).length} frozen SVGs.`,
);
