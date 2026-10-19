import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const root = resolve(import.meta.dirname, "../..");
const prefix = "artifacts/stablecoin-hub/";
const source = "docs/source-packages/about_stablecoins_codex_package_v0.2/";
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const raw = (path: string) => read(source + path);
const data = JSON.parse(
  read(prefix + "src/data/about-stablecoins-v02.generated.json"),
);
const adapter = read(prefix + "src/data/about-stablecoins.ts");
const ui = read(prefix + "src/components/about-stablecoins-ui.tsx");
const page = read(prefix + "src/pages/about-stablecoins-v02.tsx");
const nav = read(prefix + "src/components/about-section-nav.tsx");
const layout = read(prefix + "src/components/layout.tsx");
const app = read(prefix + "src/App.tsx");
const compiled = ts.transpileModule(adapter, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
}).outputText;
const context = {
  exports: {} as Record<string, any>,
  require: (id: string) => {
    assert.equal(id, "./about-stablecoins-v02.generated.json");
    return data;
  },
};
runInNewContext(compiled, context);
const presentation = JSON.parse(JSON.stringify(context.exports));
const keys = [
  "overview",
  "history",
  "types",
  "applications",
  "regulatory-evolution",
  "fiat-backed",
  "crypto-backed",
  "synthetic",
  "algorithmic",
  "other",
];

test("About source archive: all 39 extracted files remain byte-identical", () => {
  const zip = resolve(root, "About_Stablecoins_Codex_Ready_Package_V0.2.zip");
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => !f.endsWith("/"));
  assert.equal(files.length, 39);
  for (const file of files)
    assert.deepEqual(
      readFileSync(
        resolve(
          root,
          source,
          file.replace(/^about_stablecoins_codex_package_v0\.2\//, ""),
        ),
      ),
      execFileSync("unzip", ["-p", zip, file]),
    );
});
test("structured navigation, timelines, matrices and bilingual masters are mechanically imported", () => {
  assert.equal(data.version, "0.2");
  assert.equal(data.baseline, "2026-10-16");
  for (const [field, name] of [
    ["nav", "ABOUT_NAV"],
    ["history", "HISTORY_TIMELINE"],
    ["regulatory", "REGULATORY_EVOLUTION"],
  ])
    assert.deepEqual(data[field], JSON.parse(raw(`data/${name}.json`)));
  assert.equal(data.copy.en, raw("content/CONTENT_MASTER.en.md"));
  assert.equal(data.copy.zh, raw("content/CONTENT_MASTER.zh-CN.md"));
  assert.equal(data.pages.length, 10);
  assert.equal(data.sources.length, 26);
  assert.equal(data.types.length, 5);
  assert.equal(data.applications.length, 7);
  assert.equal(data.assets.length, 11);
  const generator = read("scripts/prepare-about-package.mjs");
  for (const csv of [
    "APPLICATION_MATRIX.csv",
    "TYPE_MECHANISM_MATRIX.csv",
    "SOURCE_MANIFEST.csv",
    "PAGE_MANIFEST.csv",
    "ASSET_MANIFEST.csv",
  ])
    assert.ok(generator.includes(csv));
  const csvParser = generator.slice(
    generator.indexOf("function csv("),
    generator.indexOf("const data ="),
  );
  const parseCsv = runInNewContext(`(${csvParser.trim()})`);
  for (const [field, path] of [
    ["applications", "data/APPLICATION_MATRIX.csv"],
    ["types", "data/TYPE_MECHANISM_MATRIX.csv"],
    ["sources", "manifests/SOURCE_MANIFEST.csv"],
    ["pages", "manifests/PAGE_MANIFEST.csv"],
    ["assets", "manifests/ASSET_MANIFEST.csv"],
  ])
    assert.deepEqual(
      data[field],
      JSON.parse(JSON.stringify(parseCsv(raw(path)))),
    );
  assert.doesNotMatch(generator, /fetch\(|https:\/\/|stablecoin-mechanisms/);
});
test("frozen ten-page plan preserves module order and approved Friday routes use their real default components", () => {
  assert.deepEqual(Object.keys(presentation.ABOUT_PAGES), keys);
  for (const [i, manifest] of data.pages.entries()) {
    const p = presentation.ABOUT_PAGES[keys[i]];
    assert.deepEqual(
      ["hero", ...p.modules.map((m: any) => m.id)],
      manifest.module_order.split(">"),
    );
    assert.ok(p.title[0] && p.title[1]);
  }
  for (const file of ["about","about-history","about-types","about-applications","about-regulatory-evolution","stablecoin-mechanism"]){
    const actual=read(prefix+`src/pages/${file}.tsx`);
    assert.match(actual,/export default function/);
    assert.ok(app.includes(`@/pages/${file}`));
  }
  for (const route of data.nav.section_top_nav.map((n: any) => n.route))
    assert.ok(app.includes(`path="${route}"`));
  assert.match(app, /path="\/about-stablecoins\/types\/:mechanism"/);
  assert.match(page, /ABOUT.nav.type_nav.some/);
});
test("approved Friday sidebar keeps one About entry; regulatory stays reachable in top navigation", () => {
  const tree = layout.slice(
    layout.indexOf("const NAV_ITEMS"),
    layout.indexOf("// ── Breadcrumb"),
  );
  const about = tree.slice(
    tree.indexOf('href: "/about-stablecoins"'),
    tree.indexOf('href: "/regional-developments"'),
  );
  assert.equal((tree.match(/href: "\/about-stablecoins"/g) || []).length, 1);
  assert.doesNotMatch(
    about,
    /children:|history|types/,
  );
  assert.equal((tree.match(/href: "\/regulatory"/g) || []).length, 0);
  assert.match(about,/activeAliases: \["\/regulatory"\]/);
  assert.match(nav,/href: "\/regulatory"/);
  assert.match(read(prefix + "src/pages/regulatory.tsx"),/AboutSectionNav/);
  assert.equal(data.nav.sidebar.length, 1);
});
test("frozen five-entry plan and approved six-entry Friday top nav are distinct; retained TypeNav stays scrollable", () => {
  assert.deepEqual(
    data.nav.section_top_nav.map((n: any) => n.label_en),
    ["Overview", "History", "Types", "Applications", "Regulatory Evolution"],
  );
  assert.ok(
    !data.nav.section_top_nav.some((n: any) => n.route === "/regulatory"),
  );
  assert.match(nav, /SectionTopNav/);
  const items=[...nav.matchAll(/href: "([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(items,[...data.nav.section_top_nav.map((n:any)=>n.route),"/regulatory"]);
  assert.match(nav,/href: "\/about-stablecoins\/types"[^\n]*matchPrefix: true/);
  assert.match(ui, /types && <TypeNav/);
  assert.match(ui, /data-about-type-nav/);
  assert.match(ui, /overflow-x-auto/);
  assert.match(ui, /aria-current=/);
});
test("nine frozen SVGs are byte-identical, used once, and contain no substituted images", () => {
  const dir = resolve(root, prefix, "public/about-stablecoins/v0.2");
  const files = readdirSync(dir);
  assert.equal(files.length, 9);
  const used = keys.flatMap((k) =>
    presentation.ABOUT_PAGES[k].modules.flatMap((m: any) =>
      m.figure ? [m.figure.id] : [],
    ),
  );
  assert.equal(used.length, 9);
  assert.equal(new Set(used).size, 9);
  for (const file of files) {
    const bytes = readFileSync(resolve(root, source, "visuals/final", file));
    assert.deepEqual(readFileSync(resolve(dir, file)), bytes);
    const id = file.match(/^STB-D\d+/)![0];
    assert.equal(data.svg[id], bytes.toString());
    assert.equal(
      data.hashes[file],
      createHash("sha256").update(bytes).digest("hex"),
    );
    assert.ok(used.includes(id));
    assert.doesNotMatch(
      bytes.toString(),
      /<image|<script|<foreignObject|\son\w+=/i,
    );
  }
  assert.doesNotMatch(
    page + adapter + ui,
    /<img|\.png|\.jpg|raster|placeholder/i,
  );
  assert.match(ui, /hsl\(var\(--background\)\)/);
  assert.match(ui, /hsl\(var\(--foreground\)\)/);
  assert.match(ui, /min-w-\[900px\]/);
  assert.match(ui, /closeLabel=/);
});
test("history is causal, sourced and data-driven, with nine distinct milestones", () => {
  assert.equal(data.history.length, 9);
  assert.equal(presentation.HISTORY_CHANGE_EN.length, 9);
  assert.equal(new Set(data.history.map((e: any) => e.date)).size, 9);
  assert.match(page, /ABOUT.history.map/);
  assert.match(page, /what_changed_zh/);
  assert.match(page, /What changed:/);
  assert.match(page, /event.source_ids/);
  for (const e of data.history)
    assert.ok(e.what_changed_zh && e.source_ids.length);
  assert.equal(
    data.history.find((e: any) => e.title_en === "USDC launches").date,
    "2018-09-26",
  );
});
test("applications preserve tasks, evidence states and constraints without claiming mass adoption", () => {
  assert.match(page, /ABOUT.applications.map/);
  for (const field of [
    "task",
    "why_stablecoin_may_help",
    "evidence_state",
    "constraint",
    "source_ids_or_link",
  ])
    assert.ok(page.includes(`row.${field}`));
  assert.equal(presentation.APPLICATION_ZH.length, 7);
  assert.match(ui + page, /lg:hidden/);
  assert.match(adapter, /Capability does not equal market adoption/);
  assert.match(
    adapter,
    /Actual volumes, user numbers, geography and channel adoption/,
  );
  assert.ok(adapter.includes('"/market-data/adoption"'));
  assert.match(page, /not a prerequisite/);
  assert.match(page, /Internal link:/);
});
test("all source references resolve only to untouched manifest URLs", () => {
  const ids = new Set(data.sources.map((s: any) => s.source_id));
  for (const s of data.sources) assert.match(s.url, /^https:\/\//);
  const refs = (adapter + page).match(/SRC-STB-\d+/g) || [];
  for (const e of data.history) refs.push(...e.source_ids);
  for (const row of data.types) refs.push(...row.source_ids.split(";"));
  for (const row of data.applications)
    if (!row.source_ids_or_link.startsWith("Internal link:"))
      refs.push(...row.source_ids_or_link.split(";"));
  for (const id of refs) assert.ok(ids.has(id), id);
  assert.match(ui, /TooltipTrigger asChild/);
  assert.match(ui, /PopoverTrigger asChild/);
  assert.match(ui, /source.last_verified/);
  assert.match(ui, /rel="noopener noreferrer"/);
  assert.doesNotMatch(
    adapter + page + ui,
    /https:\/\/[^`'"\s]+\.(?:com|org)|\/Users\/|file:\/\//,
  );
});
test("mechanism, redemption, adjacent-money and historical-classification boundaries remain explicit", () => {
  for (const phrase of [
    "Mechanism before taxonomy",
    "Attestation ≠ audit",
    "Reserve backing does not mean every holder",
    "not the same as a classic endogenous algorithmic",
    "Algorithmic ≠ decentralised",
    "Classify today's mechanism",
    "not the stablecoin itself",
    "This historical mechanism does not determine the current system's classification",
  ])
    assert.ok(adapter.includes(phrase), phrase);
  assert.match(adapter, /not for individuals or small businesses/);
  assert.match(adapter, /KYC\/KYB and whitelisting/);
  assert.match(adapter, /historical failure case/);
  assert.match(adapter, /frxUSD as fiat-redeemable and fully collateralised/);
  assert.doesNotMatch(
    page + ui,
    /fetch\(|useQuery|stablecoin-mechanisms|currentMarketCapUsd|BarChart|risk score/,
  );
  for (const route of [
    "/regulatory",
    "/regional-developments",
    "/agentic-payments",
    "/market-data/adoption",
  ])
    assert.ok(adapter.includes(`"${route}"`));
});
