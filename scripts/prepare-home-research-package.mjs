import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/conference_risk_framework_routes_v0.2",
);
// The earlier home source archive is retained as provenance, not as current research status.
// Only the approved conference identity, mappings and roadmap feed runtime research metadata.
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
  const keys = rows.shift().map((s) => s.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, r[i] || ""])));
}
const corrections = JSON.parse(await readFile(resolve(root, "docs/content-corrections/phase-b-2026-10-18.json"), "utf8"));
const study = { ...JSON.parse(await read("data/CONFERENCE_STUDY_STATUS.json")), ...corrections.conference };
const previousSources = csv(
  await readFile(
    resolve(
      root,
      "docs/source-packages/home_research_codex_package_v0.2/manifests/SOURCE_MANIFEST.csv",
    ),
    "utf8",
  ),
);
const sources = previousSources.filter((s) =>
  ["SRC-HR-02", "SRC-HR-03", "SRC-HR-04"].includes(s.source_id),
);
const paper = "/media/research/ai-defit-2026-stablecoin-risk-framework.pdf";
const bytes = await readFile(
  resolve(root, "artifacts/stablecoin-hub/public" + paper),
);
if (!bytes.subarray(0, 5).equals(Buffer.from("%PDF-")))
  throw Error("Public conference paper unavailable");
const data = {
  version: "0.2",
  boundary_revision: "2026-10-17",
  study,
  conference: "AI-DEFIT 2026",
  acceptance: "ACCEPTED_CONFERENCE_PAPER",
  lifecycle: csv(await read("data/LIFECYCLE_MAPPING.csv")),
  amplification: csv(await read("data/AMPLIFICATION_MAPPING.csv")),
  modules: csv(await read("data/RISK_MODULES.csv")),
  future: csv(await read("data/FUTURE_RESEARCH_ROADMAP.csv")),
  sources,
  navigation_svg: await readFile(
    resolve(
      root,
      "docs/source-packages/home_research_codex_package_v0.2/visuals/final/HOME-D01-research-hub-map.svg",
    ),
    "utf8",
  ).then((svg) =>
    svg
      .replace("Framework · measurement · TE", "Framework · atomic risks")
      .replace("Hawkes · validation", "Lifecycle · transmission mapping"),
  ),
  paper: {
    ...corrections.manuscript,
    url: paper,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  },
  labels: {
    CURRENT_STUDY: { label_en: "Current study", label_zh: "当前研究" },
    ACCEPTED_CONFERENCE_PAPER: {
      label_en: "Accepted conference paper",
      label_zh: "会议论文已接收",
    },
    FUTURE_RESEARCH: { label_en: "Future research", label_zh: "未来研究" },
  },
};
await writeFile(
  resolve(
    root,
    "artifacts/stablecoin-hub/src/data/home-research-v02.generated.json",
  ),
  JSON.stringify(data, null, 2) + "\n",
);
console.info(
  "Home/Research: conference-only runtime metadata; two current-study records and future directions are separate.",
);
