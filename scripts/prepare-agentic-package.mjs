import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

// Mechanical adapter only. Never fetch facts or mutate the extracted package.
// The explicit user-authorized FINAL CONTENT QA addendum is applied separately.
const root = resolve(import.meta.dirname, "..");
const source = resolve(
  root,
  "docs/source-packages/agentic_payments_codex_ready_v0.2",
);
const target = resolve(root, "artifacts/stablecoin-hub/src/data");
const read = (path) => readFile(resolve(source, path), "utf8");
function csv(text) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift().map((x) => x.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(headers.map((key, i) => [key, r[i] ?? ""])));
}
const payload = {
  version: "0.2",
  protocols: JSON.parse(await read("cards/PROTOCOL_CARDS.json")),
  ecosystem: JSON.parse(await read("cards/ECOSYSTEM_CARDS.json")),
  timeline: JSON.parse(await read("visuals/TIMELINE_DATA.json")),
  labels: JSON.parse(await read("FACT_LABELS.json")),
  sources: csv(await read("manifests/SOURCE_MANIFEST.csv")),
  pages: csv(await read("manifests/PAGE_MANIFEST.csv")),
  assets: csv(await read("manifests/ASSET_MANIFEST.csv")),
  copy: {
    zh: await read("content/CONTENT_MASTER.zh-CN.md"),
    en: await read("content/CONTENT_MASTER.en.md"),
  },
  visualScripts: await read("visuals/VISUAL_SCRIPTS.md"),
  svg: {},
  hashes: {},
};
const finalContentQA = JSON.parse(
  await readFile(
    resolve(
      root,
      "docs/source-packages/agentic-payments-final-content-qa.json",
    ),
    "utf8",
  ),
);
for (const record of finalContentQA.additional_sources) {
  if (payload.sources.some((s) => s.source_id === record.source_id))
    throw new Error(`Duplicate source: ${record.source_id}`);
  if (
    !["www.ant-intl.com", "www.cac.gov.cn"].includes(
      new URL(record.url).hostname,
    )
  )
    throw new Error(`Unapproved source host: ${record.url}`);
  payload.sources.push(record);
}
for (const update of finalContentQA.timeline_source_updates) {
  const event = payload.timeline.find(
    (e) => e.date === update.date && e.title === update.title,
  );
  if (!event || event.source_id)
    throw new Error(`Invalid timeline source update: ${update.title}`);
  if (
    update.source_id &&
    !payload.sources.some((s) => s.source_id === update.source_id)
  )
    throw new Error(`Missing source: ${update.source_id}`);
  event.source_id = update.source_id;
}
const apop = payload.protocols.find((p) => p.id === "apop");
const apopEvent = payload.timeline.find(
  (e) => e.source_id === finalContentQA.apop_dates.source_id,
);
const apopSource = payload.sources.find(
  (s) => s.source_id === finalContentQA.apop_dates.source_id,
);
if (
  apop.first_release !== finalContentQA.apop_dates.event_date ||
  apopEvent.date !== finalContentQA.apop_dates.event_date ||
  apopSource.date !== finalContentQA.apop_dates.publication_date
)
  throw new Error("APOP event / publication date boundary drift");
payload.finalContentQA = finalContentQA;
const assetDir = resolve(
  root,
  "artifacts/stablecoin-hub/public/agentic-payments/v0.2",
);
await mkdir(assetDir, { recursive: true });
for (const file of (await readdir(resolve(source, "visuals/final"))).sort()) {
  const content = await read(`visuals/final/${file}`);
  payload.svg[file.slice(0, 7)] = content;
  payload.hashes[file] = createHash("sha256").update(content).digest("hex");
  await copyFile(
    resolve(source, "visuals/final", file),
    resolve(assetDir, file),
  );
}
await writeFile(
  resolve(target, "agentic-payments-v02.generated.json"),
  JSON.stringify(payload, null, 2) + "\n",
);
console.info(
  `Adapted V${payload.version}: ${payload.protocols.length} entries, ${payload.sources.length} sources, ${Object.keys(payload.svg).length} frozen SVGs.`,
);
