import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import {
  applyAsiaEnglishSvgCopy,
  englishVerificationText,
  FINAL_ENGLISH_COPY_QA,
} from "../../artifacts/stablecoin-hub/src/data/asia-english-copy-qa.ts";

const root = resolve(import.meta.dirname, "../..");
const source = resolve(
  root,
  "docs/source-packages/asia_stablecoin_codex_package_v0.2",
);
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const data = JSON.parse(
  read("artifacts/stablecoin-hub/src/data/asia-development-v02.generated.json"),
);
const page = read("artifacts/stablecoin-hub/src/pages/asia-development.tsx");
const ui = read(
  "artifacts/stablecoin-hub/src/components/asia-development-ui.tsx",
);
const adapter = read("artifacts/stablecoin-hub/src/data/asia-developments.ts");

function csv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [],
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
  const header = rows.shift()!.map((c) => c.replace(/^\uFEFF/, ""));
  return rows
    .filter((r) => r.some(Boolean))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

test("all 27 extracted package files match the supplied ZIP byte-for-byte", () => {
  const zip = resolve(
    root,
    "Asia_Stablecoin_Development_Codex_Ready_Package_V0.2.zip",
  );
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => !f.endsWith("/"));
  assert.equal(files.length, 27);
  for (const file of files)
    assert.deepEqual(
      readFileSync(
        resolve(
          source,
          file.replace(/^asia_stablecoin_codex_package_v0\.2\//, ""),
        ),
      ),
      execFileSync("unzip", ["-p", zip, file]),
    );
});

test("matrices, manifests, timeline and masters are mechanically imported without old facts", () => {
  assert.equal(data.version, "0.2");
  assert.equal(data.baseline, "2026-10-16");
  for (const [key, path] of [
    ["regulatory", "matrices/REGULATORY_MATRIX.csv"],
    ["products", "matrices/PRODUCT_AVAILABILITY.csv"],
    ["pages", "manifests/PAGE_MANIFEST.csv"],
    ["sources", "manifests/SOURCE_MANIFEST.csv"],
    ["assets", "manifests/ASSET_MANIFEST.csv"],
  ])
    assert.deepEqual(
      data[key],
      csv(readFileSync(resolve(source, path), "utf8")),
    );
  assert.deepEqual(
    data.timeline,
    JSON.parse(
      readFileSync(resolve(source, "visuals/TIMELINE_DATA.json"), "utf8"),
    ),
  );
  for (const [language, filename] of [
    ["zh", "zh-CN"],
    ["en", "en"],
  ])
    assert.equal(
      data.copy[language],
      readFileSync(
        resolve(source, `content/CONTENT_MASTER.${filename}.md`),
        "utf8",
      ),
    );
  assert.equal(
    data.researchBaseline,
    readFileSync(resolve(source, "RESEARCH_BASELINE_V0.1.md"), "utf8"),
  );
  assert.equal(data.regulatory.length, 7);
  assert.equal(data.products.length, 13);
  assert.equal(data.sources.length, 36);
  assert.equal(data.timeline.length, 10);
});

test("five frozen SVGs are unchanged; source-only screenshots are not substituted", () => {
  const dir = resolve(
    root,
    "artifacts/stablecoin-hub/public/asia-development/v0.2",
  );
  const files = readdirSync(dir);
  assert.equal(files.length, 5);
  for (const file of files) {
    assert.match(file, /^REG-[MD]0[123].*\.svg$/);
    const original = readFileSync(resolve(source, "visuals/final", file));
    assert.deepEqual(readFileSync(resolve(dir, file)), original);
    assert.equal(
      data.hashes[file],
      createHash("sha256").update(original).digest("hex"),
    );
    assert.equal(data.svg[file.slice(0, 7)], original.toString());
    assert.doesNotMatch(
      original.toString(),
      /<script|<image|<foreignObject|\son\w+=/i,
    );
  }
  assert.equal(
    data.assets.filter((a: { status: string }) => a.status === "SOURCE_ONLY")
      .length,
    5,
  );
  assert.doesNotMatch(page + ui, /<img|placeholder|https:\/\/images\./i);
});

test("every data and inline citation resolves to an unmodified source URL", () => {
  const ids = new Set(
    data.sources.map((s: { source_id: string }) => s.source_id),
  );
  const refs = [...data.regulatory, ...data.products].flatMap(
    (r: { source_ids: string }) => r.source_ids.split(";"),
  );
  refs.push(
    ...data.timeline.flatMap((r: { source_ids: string[] }) => r.source_ids),
  );
  const literals = (page + adapter).match(/SRC-(?:CN|HK|SG|UAE)-\d+/g) ?? [];
  for (const id of [...refs, ...literals]) assert.ok(ids.has(id), id);
  for (const s of data.sources) {
    assert.match(s.url, /^https:\/\//);
    assert.equal(s.last_verified, "2026-10-16");
  }
});

test("licence, launch, access and UNKNOWN boundaries remain separate", () => {
  const product = (name: string) =>
    data.products.find((p: { product: string }) => p.product === name);
  assert.equal(product("HKDAP").status, "BETA_LIVE");
  assert.equal(product("HKDAP").current_access, "Institutional/corporate");
  assert.equal(product("HSBC RedCoin").status, "FORTHCOMING_NOT_ISSUED");
  for (const token of ["XSGD", "XUSD"])
    assert.equal(product(token).critical_note, "Not MAS-SCS-labelled token");
  assert.equal(product("e-CNY").regulatory_basis, "CBDC");
  assert.equal(product("Private stablecoin").status, "NOT_PERMITTED");
  assert.equal(product("AEDC token").current_access, "UNKNOWN");
  assert.equal(product("AEDC token").channel_or_chain, "UNKNOWN");
  assert.equal(product("Universal Digital FRT").reference_currency, "UNKNOWN");
  assert.equal(product("JD Coinlink FRT").reference_currency, "UNKNOWN");
  assert.equal(product("JD Coinlink FRT").status, "PRODUCT_DETAILS_UNKNOWN");
  assert.equal(product("USDL").current_access, "No retail clients");
  assert.match(adapter, /actual Full Launch date/);
  assert.match(adapter, /implementation date remains UNKNOWN/);
  assert.match(
    ui,
    /regulatory_basis.*status.*current_access.*channel_or_chain.*critical_note/s,
  );
  assert.doesNotMatch(page + ui, /status\s*===?\s*["']LIVE["']\s*\?/);
});

test("ten events retain dates and classifications; consultation is not enactment", () => {
  const closing = data.timeline.find(
    (e: { date: string; jurisdiction: string }) =>
      e.date === "2026-10-16" && e.jurisdiction === "Singapore",
  );
  assert.equal(closing.type, "CONSULTATION");
  assert.equal(
    data.timeline.find((e: { date: string }) => e.date === "2026-04-10").type,
    "LICENCE",
  );
  assert.equal(
    data.timeline.find((e: { date: string }) => e.date === "2026-08-12").type,
    "BETA_ROLLOUT",
  );
  assert.match(page, /does not establish a final implementation date/);
});

test("five canonical pages and four compatibility redirects are wired", () => {
  const app = read("artifacts/stablecoin-hub/src/App.tsx");
  const layout = read("artifacts/stablecoin-hub/src/components/layout.tsx");
  const routes = [
    "/regional-developments",
    "/mainland-china",
    "/hong-kong",
    "/singapore",
    "/uae",
  ];
  for (const route of routes) {
    assert.ok(app.includes(`path="${route}"`));
    assert.ok(adapter.includes(`href: "${route}"`));
  }
  for (const suffix of ["mainland-china", "hong-kong", "singapore", "uae"])
    assert.ok(
      app.includes(
        `<Route path="/regional-developments/${suffix}"><Redirect replace to="/${suffix}" /></Route>`,
      ),
    );
  assert.match(layout, /child\.aliases\?\.includes\(location\)/);
  assert.equal(
    (page.match(/export function \w+Development\w*Page/g) ?? []).length,
    5,
  );
});

test("required modules are ordered, mobile equivalents and bilingual accessible sources exist", () => {
  const blocks = page.split(/export function /).slice(1);
  const orders = [
    [
      "four-paths",
      "regulatory-matrix",
      "product-availability",
      "misconceptions",
      "timeline",
    ],
    ["2026-rule", "boundary-diagram", "e-cny", "user-meaning"],
    ["licensees", "hkdap", "redcoin", "licence-vs-availability"],
    ["two-tracks", "xsgd-xusd", "circle", "framework-labels"],
    ["four-perimeters", "cbuae", "ae-coin", "aedz", "vara-adgm-difc"],
  ];
  orders.forEach((ids, i) => {
    let previous = -1;
    for (const id of ids) {
      const index = blocks[i].indexOf(`id="${id}"`);
      assert.ok(index > previous, `${i}: ${id}`);
      previous = index;
    }
  });
  assert.match(ui, /TooltipTrigger asChild/);
  assert.match(ui, /PopoverTrigger asChild/);
  assert.match(ui, /closeLabel=/);
  assert.match(ui, /aria-live="polite"/);
  assert.match(ui, /fallback/);
  assert.match(ui, /md:hidden/);
  assert.match(ui, /lg:hidden/);
  assert.doesNotMatch(
    page + ui,
    /fetch\(|useQuery\(|ASIA_DEVELOPMENTS|asia-development-research/,
  );
});

test("final English copy uses the authorised wording without changing Chinese strings", () => {
  const qa = JSON.parse(
    read("docs/source-packages/asia-development-final-english-copy-qa.json"),
  );
  for (const baseline of qa.chinese_copy_baseline) {
    const tree = ts.createSourceFile(
      baseline.path,
      read(baseline.path),
      ts.ScriptTarget.Latest,
      true,
    );
    const strings: string[] = [];
    function walk(node: ts.Node) {
      if (
        (ts.isStringLiteralLike(node) ||
          ts.isTemplateHead(node) ||
          ts.isTemplateMiddle(node) ||
          ts.isTemplateTail(node) ||
          ts.isJsxText(node)) &&
        /\p{Script=Han}/u.test(node.text)
      )
        strings.push(node.text);
      ts.forEachChild(node, walk);
    }
    walk(tree);
    assert.equal(strings.length, baseline.strings, baseline.path);
    assert.equal(
      createHash("sha256").update(JSON.stringify(strings)).digest("hex"),
      baseline.sha256,
      baseline.path,
    );
  }
  for (const text of [
    "Mainland China follows a CBDC-led digital-money path rather than a private-stablecoin licensing model.",
    "offshore issuance of RMB-referenced stablecoins",
    "Anchorpoint (FRS01) and HSBC (FRS02) hold active stablecoin issuer licences.",
    "Beta Access for institutional and corporate users",
    "the dedicated MAS-SCS regime has not yet completed legislative implementation",
    "the existing PSA framework for Major Payment Institutions and DPT services",
    "The UAE does not have a single stablecoin licensing regime.",
    "CBUAE regulates onshore Payment Token Services outside the Financial Free Zones.",
  ])
    assert.ok(adapter.includes(text), text);
  assert.ok(
    page.includes(
      "Do not describe them as “MAS-regulated stablecoins” under the future MAS-SCS framework.",
    ),
  );
  assert.ok(page.includes(FINAL_ENGLISH_COPY_QA.timelineTitle));
  assert.equal(
    englishVerificationText(data.baseline),
    "Last verified: 16 Oct 2026",
  );
  assert.match(ui, /EnglishVerification date=\{row.last_verified\}/);
  assert.match(ui, /EnglishVerification date=\{p.last_verified\}/);
});

test("English token status stays separate from access; British licence terminology is consistent", () => {
  assert.match(adapter, /BETA_LIVE: "Beta live"/);
  assert.doesNotMatch(
    adapter + page + ui,
    /Beta live · not retail|institutional\/corporate Beta Access|existing PSA\/DPT\/MPI environment/,
  );
  const englishSpelling = (adapter + page + ui).replace(
    /"[^"\n]*\p{Script=Han}[^"\n]*"/gu,
    "",
  );
  // Archive field keys and exact official source titles stay unchanged, including “Licenses”.
  assert.doesNotMatch(englishSpelling, /\b(?:license|licenses)\b/i);
  assert.match(adapter, /Firm authorisation \+ suitability assessment/);
  assert.match(ui, /"status",\s*"current_access"/);
});

test("English SVG correction changes only the authorised text node, not research geometry", () => {
  const fix = FINAL_ENGLISH_COPY_QA.svgCorrection;
  for (const [id, original] of Object.entries(data.svg) as [string, string][]) {
    const displayed = applyAsiaEnglishSvgCopy(original, id);
    if (id !== fix.id) {
      assert.equal(displayed, original);
      continue;
    }
    assert.ok(original.includes(fix.original));
    assert.ok(displayed.includes(fix.replacement));
    assert.equal(displayed.replace(fix.replacement, fix.original), original);
    assert.match(
      displayed.replace(/<[^>]*>/g, ""),
      /Private stablecoin issuance\/business: prohibited or strictly restricted/,
    );
    assert.deepEqual(
      displayed.match(
        /<(?:rect|line|path|polyline|polygon|circle|ellipse|marker)\b[^>]*>/g,
      ),
      original.match(
        /<(?:rect|line|path|polyline|polygon|circle|ellipse|marker)\b[^>]*>/g,
      ),
    );
  }
});
