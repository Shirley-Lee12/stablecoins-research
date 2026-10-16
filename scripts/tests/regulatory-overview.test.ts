import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, "../..");
const hub = resolve(root, "artifacts/stablecoin-hub/src");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const pack = JSON.parse(
  read("artifacts/stablecoin-hub/src/data/regulatory-v02.generated.json"),
);
const requireHub = createRequire(
  resolve(root, "artifacts/stablecoin-hub/package.json"),
);
const React = requireHub("react");
const { renderToStaticMarkup } = requireHub("react-dom/server");
function moduleAt(path: string, overrides: Record<string, any>) {
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: any = {};
  vm.runInNewContext(code, {
    exports,
    require: (id: string) => {
      assert.ok(id in overrides, `Unexpected import ${id}`);
      return overrides[id];
    },
  });
  return exports;
}
const data = moduleAt(resolve(hub, "data/regulatory.ts"), {
  "./regulatory-v02.generated.json": pack,
});
let lang = "en";
const common: any = {
  "react/jsx-runtime": requireHub("react/jsx-runtime"),
  "@/lib/language-context": {
    useLanguage: () => ({
      language: lang,
      t: (en: string, zh: string) => (lang === "zh" ? zh : en),
    }),
  },
  "@/data/regulatory": data,
  wouter: {
    Link: ({ href, children, ...props }: any) =>
      React.createElement("a", { href, ...props }, children),
  },
};
for (const part of ["tooltip", "popover"])
  common[`@/components/ui/${part}`] = Object.fromEntries(
    (part === "tooltip"
      ? ["Tooltip", "TooltipTrigger", "TooltipContent"]
      : ["Popover", "PopoverTrigger", "PopoverContent"]
    ).map((n) => [
      n,
      ({ children }: any) => React.createElement("span", null, children),
    ]),
  );
const ui = moduleAt(resolve(hub, "components/regulatory-ui.tsx"), common);
const page = moduleAt(resolve(hub, "pages/regulatory.tsx"), {
  ...common,
  "@/components/regulatory-ui": ui,
  "@/components/content-edge-nav": { ContentEdgeNav: () => null },
}).default;
const render = (component: any, props: any = {}, language = "en") => {
  lang = language;
  return renderToStaticMarkup(React.createElement(component, props));
};
const html = render(page);
const strip = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
const row = (id: string) =>
  strip(html.split(`data-desktop-jurisdiction="${id}"`)[1].split("</tr>")[0]);
const card = (id: string) =>
  html.split(`data-mobile-jurisdiction="${id}"`)[1].split("</article>")[0];
const source = (id: string) => strip(render(ui.RegulatorySourceBody, { id }));
const get = (id: string) => data.JURISDICTIONS.find((j: any) => j.id === id);

test("Regulatory source archive: 19 files remain byte-identical and generated hashes are mechanical", () => {
  const zip = resolve(root, "Regulatory_Overview_Codex_Ready_Package_V0.2.zip");
  assert.equal(
    createHash("sha256").update(readFileSync(zip)).digest("hex"),
    "c2a0c1971e46a2bc0c7874ff85d4e00151c1a4d85bd2010d76241d2e2fd2da26",
  );
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((p) => !p.endsWith("/"));
  assert.equal(files.length, 19);
  for (const name of files) {
    const relative = name.replace(/^regulatory_overview_package_v0\.2\//, "");
    const bytes = readFileSync(
      resolve(
        root,
        "docs/source-packages/regulatory_overview_package_v0.2",
        relative,
      ),
    );
    assert.deepEqual(bytes, execFileSync("unzip", ["-p", zip, name]));
    assert.equal(
      pack.hashes[relative],
      createHash("sha256").update(bytes).digest("hex"),
    );
  }
});
test("eight editorial jurisdictions use the frozen combined public labels", () => {
  assert.deepEqual(
    Array.from(data.JURISDICTIONS, (j: any) => j.id),
    ["us", "eu", "uk", "hk", "sg", "jp", "uae", "cn"],
  );
  assert.equal(
    get("us").status[0],
    "Enacted — implementation rulemaking — not yet effective",
  );
  assert.equal(get("eu").status[0], "MiCA in force / applicable");
  assert.equal(
    get("uk").status[0],
    "Final rules published — full commencement 25 October 2027",
  );
  assert.equal(
    get("hk").status[0],
    "Issuer regime in force — licensed issuers exist",
  );
  assert.equal(
    get("sg").status[0],
    "Implementation consultation — dedicated MAS-SCS regime not yet in force",
  );
  assert.equal(
    get("jp").status[0],
    "Electronic Payment Instrument regime in force",
  );
  assert.equal(
    get("uae").status[0],
    "CBUAE onshore Payment Token Services Regulation in force",
  );
  assert.equal(get("cn").status[0], "Restrictive / prohibitive boundary");
});
test("US is enacted and not yet effective; enactment and conditional future effectiveness stay distinct", () => {
  assert.doesNotMatch(row("us"), /in force|effective since 2025/i);
  assert.match(row("us"), /2025-07-18/);
  assert.match(row("us"), /2027-01-18.*earlier final-rule trigger/i);
  const s = source("US-01");
  assert.match(s, /18 July 2025/);
  assert.match(s, /18 January 2027/);
  assert.match(s, /18 months.*120 days/);
});
test("EU remains applicable despite the 2026 review", () => {
  assert.match(row("eu"), /MiCA in force \/ applicable/);
  assert.match(row("eu"), /2024-06-30/);
  assert.match(row("eu"), /review does not suspend/);
});
test("UK final rules are published, not pending; full commencement is 25 October 2027", () => {
  const s = row("uk");
  assert.doesNotMatch(
    s,
    /final rules pending|fully in force|already live|final code pending/i,
  );
  assert.match(s, /Final rules published/);
  assert.match(s, /25 October 2027/);
  assert.match(s, /2026-06-30/);
  assert.match(s, /BoE.*distinct/i);
});
test("Singapore consultation dates and future dedicated regime do not convert DPT/MPI products into MAS-SCS", () => {
  const s = row("sg");
  assert.match(s, /dedicated MAS-SCS regime not yet in force/);
  assert.doesNotMatch(
    s,
    /(?<!not yet )regime in force|already (live|effective)|XSGD\/XUSD are MAS-SCS/i,
  );
  assert.match(s, /2026-09-01 to 2026-10-16/);
  assert.match(s, /Existing DPT\/MPI.*do not establish/);
  assert.match(source("SG-02"), /16 October 2026.*23:59 Singapore time/);
});
test("HK register names, licence numbers and effective dates do not imply product launch", () => {
  const s = row("hk");
  assert.match(s, /Anchorpoint Financial Limited/);
  assert.match(s, /HSBC/);
  assert.match(s, /FRS01/);
  assert.match(s, /FRS02/);
  assert.equal((s.match(/Licence effective: 10 April 2026/g) || []).length, 2);
  assert.match(s, /Issuer licence ≠ token public launch/);
  assert.match(s, /2025-08-01/);
});
test("Japan keeps its statutory Electronic Payment Instrument and intermediary terminology", () => {
  assert.match(row("jp"), /Electronic Payment Instrument regime in force/);
  assert.match(row("jp"), /2023-06-01.*2026-06-01/);
  assert.match(row("jp"), /registration/);
  assert.match(row("jp"), /no single generic Japan stablecoin licence/);
});
test("UAE row is explicitly limited to CBUAE onshore; VARA ADGM DIFC remain separate", () => {
  assert.match(row("uae"), /CBUAE onshore/);
  assert.match(row("uae"), /2024-08-31/);
  assert.match(row("uae"), /VARA, ADGM and DIFC are separate/);
  assert.equal(get("uae").deepLink, "/regional-developments/uae");
});
test("Mainland current instrument is 银发〔2026〕42号, replacing the 2021 notice", () => {
  assert.match(row("cn"), /银发〔2026〕42号/);
  assert.match(row("cn"), /2026-02-06/);
  assert.match(row("cn"), /replaces the 2021 notice/);
  assert.match(row("cn"), /Restrictive \/ prohibitive boundary/);
});
test("FSB FATF CPMI-IOSCO are separate from the eight domestic comparison rows", () => {
  for (const j of data.JURISDICTIONS)
    assert.ok(!j.sourceIds.some((id: string) => id.startsWith("INT-")));
  const section = html
    .split('id="international-standards"')[1]
    .split("</section>")[0];
  for (const name of ["FSB", "FATF", "CPMI-IOSCO"])
    assert.ok(section.includes(name));
  assert.match(section, /International standards and monitoring/);
  assert.match(section, /do not replace domestic law/);
});
test("every expandable mobile card preserves all ten comparison fields and regional link scope", () => {
  for (const j of data.JURISDICTIONS) {
    const s = card(j.id);
    assert.match(s, /<details>/);
    assert.match(s, /<summary/);
    for (const field of [
      "status",
      "stage-date",
      ...Array.from(data.FIELDS, (f: any) => f[0]),
      "official-source",
      "regional-deep-link",
    ])
      assert.ok(s.includes(`data-field="${field}"`), j.id + " " + field);
    if (j.deepLink) assert.ok(s.includes(`href="${j.deepLink}"`));
  }
  assert.equal(data.JURISDICTIONS.filter((j: any) => j.deepLink).length, 4);
  assert.match(
    read("artifacts/stablecoin-hub/src/pages/regulatory.tsx"),
    /data-mobile-comparison className="lg:hidden"/,
  );
});
test("desktop uses scrollable table with only jurisdiction and status columns sticky", () => {
  const s = read("artifacts/stablecoin-hub/src/pages/regulatory.tsx");
  assert.match(s, /data-desktop-comparison/);
  assert.match(s, /overflow-x-auto/);
  assert.match(s, /min-w-\[2248px\]/);
  assert.match(s, /sticky left-0/);
  assert.match(s, /sticky left-\[168px\]/);
  assert.equal((s.match(/sticky left-/g) || []).length, 4);
  assert.equal((html.match(/data-desktop-jurisdiction=/g) || []).length, 8);
});
test("source UI separates publication, commencement, licence and consultation dates with last verified", () => {
  const uk = source("UK-02");
  assert.match(uk, /Publication date 30 June 2026/);
  assert.match(uk, /Effective \/ commencement date 25 October 2027/);
  assert.match(source("HK-01"), /1 August 2025/);
  assert.match(source("HK-02"), /Licence effective date 10 April 2026/);
  assert.match(source("SG-02"), /Publication date 1 September 2026/);
  assert.match(source("SG-02"), /Consultation closing date 16 October 2026/);
  for (const s of pack.sources) {
    const body = source(s.source_id);
    for (const label of [
      "Authority",
      "Document",
      "Instrument type",
      "Publication date",
      "Effective / commencement date",
      "Last verified",
      "Open official source",
    ])
      assert.ok(body.includes(label), s.source_id + " " + label);
    assert.ok(body.includes("2026-10-16"));
    assert.ok(s.url.startsWith("https://"));
    assert.ok(data.INSTRUMENTS[s.instrument_type]);
  }
  const body = source("HK-02");
  assert.match(body, /Publication date Not specified/);
  assert.doesNotMatch(body, /Publication date 10 April/);
});
test("source interactions retain desktop focus tooltip and mobile tap popover at the card breakpoint", () => {
  const s = read("artifacts/stablecoin-hub/src/components/regulatory-ui.tsx");
  for (const p of [
    "TooltipTrigger asChild",
    "PopoverTrigger asChild",
    "lg:inline-flex",
    "lg:hidden",
    "max-h-[75vh]",
    "overflow-y-auto",
  ])
    assert.ok(s.includes(p));
});
test("timeline renders exactly eleven frozen JSON events with date jurisdiction type change and citation", () => {
  assert.equal((html.match(/data-regulatory-event=/g) || []).length, 11);
  assert.deepEqual(
    Array.from(data.TIMELINE, (x: any) => ({
      date: x.date,
      jurisdiction: x.jurisdiction,
      event: x.event,
      type: x.type,
      source_ids: Array.from(x.source_ids),
    })),
    pack.timeline,
  );
  for (const item of data.TIMELINE) {
    assert.ok(html.toLowerCase().includes(`datetime="${item.date}"`));
    assert.ok(data.EVENT_TYPES[item.type]);
    for (const id of item.source_ids)
      assert.ok(pack.sources.some((s: any) => s.source_id === id));
  }
  assert.match(strip(html), /Consultation closes: 16 October 2026/);
});
test("public English and Chinese copy is complete, dated and contains no construction or scoring language", () => {
  for (const language of ["en", "zh"]) {
    const s = strip(render(page, {}, language));
    assert.doesNotMatch(
      s,
      /undefined|READY_FOR_CODEX|Do not label|Do not say|source package|final rules pending|friendliness score|maturity score|strictness score|safety score|leaderboard|global regulator|global law/i,
    );
    assert.match(
      s,
      language === "en"
        ? /Regulatory status last verified: 16 October 2026/
        : /监管状态最后核验：2026年10月16日/,
    );
  }
  const statusCodes = pack.taxonomy.status_order;
  assert.equal(statusCodes.length, 7);
  assert.ok(statusCodes.includes("GUIDANCE_ONLY"));
  assert.ok(statusCodes.includes("IMPLEMENTATION_RULEMAKING"));
});
