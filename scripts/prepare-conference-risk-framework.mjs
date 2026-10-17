import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/conference_risk_framework_routes_v0.2",
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
  const keys = rows.shift().map((k) => k.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] || ""])));
}
const data = {
  version: "0.2",
  study: JSON.parse(await read("data/CONFERENCE_STUDY_STATUS.json")),
  nav: JSON.parse(await read("data/RISK_FRAMEWORK_NAV.json")).routes,
};
for (const [key, file] of [
  ["modules", "RISK_MODULES"],
  ["lifecycle", "LIFECYCLE_MAPPING"],
  ["amplification", "AMPLIFICATION_MAPPING"],
  ["future", "FUTURE_RESEARCH_ROADMAP"],
])
  data[key] = csv(await read("data/" + file + ".csv"));
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
    "artifacts/stablecoin-hub/src/data/conference-risk-framework-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.log(
  "Conference framework: " +
    data.modules.length +
    " modules, " +
    data.lifecycle.length +
    " T stages, " +
    data.amplification.length +
    " L roles.",
);
