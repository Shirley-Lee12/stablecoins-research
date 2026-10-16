import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import {
  RESEARCH_RECORD_ENGLISH,
  FIGURE_ENGLISH_REPLACEMENTS,
  applyFigureEnglishCopy,
} from "../../artifacts/stablecoin-hub/src/data/home-research-english-copy.ts";

const root = resolve(import.meta.dirname, "../..");
const source = resolve(
  root,
  "docs/source-packages/home_research_codex_package_v0.2",
);
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const original = (path: string) => readFileSync(resolve(source, path), "utf8");
const data = JSON.parse(
  read("artifacts/stablecoin-hub/src/data/home-research-v02.generated.json"),
);
const home = read("artifacts/stablecoin-hub/src/pages/home-overview.tsx");
const research = read("artifacts/stablecoin-hub/src/pages/research.tsx");
const adapter = read("artifacts/stablecoin-hub/src/data/home-research.ts");
const ui = read("artifacts/stablecoin-hub/src/components/home-research-ui.tsx");

test("the original 29-file source package remains unchanged", () => {
  const zip = resolve(root, "Homepage_Research_Codex_Ready_Package_V0.2.zip");
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => !f.endsWith("/"));
  assert.equal(files.length, 29);
  for (const file of files)
    assert.deepEqual(
      readFileSync(
        resolve(
          source,
          file.replace(/^home_research_codex_package_v0\.2\//, ""),
        ),
      ),
      execFileSync("unzip", ["-p", zip, file]),
    );
});
test("research statuses, bilingual masters and labels are copied without inferred facts", () => {
  assert.equal(data.version, "0.2");
  assert.equal(data.baseline, "2026-10-16");
  assert.deepEqual(
    data.research,
    JSON.parse(original("data/RESEARCH_STATUS.json")),
  );
  assert.deepEqual(
    data.labels,
    JSON.parse(original("data/STATUS_LABELS.json")),
  );
  for (const page of ["home", "research"])
    for (const [language, suffix] of [
      ["en", "en"],
      ["zh", "zh-CN"],
    ])
      assert.equal(
        data.copy[page][language],
        original(`content/${page.toUpperCase()}_CONTENT_MASTER.${suffix}.md`),
      );
  assert.equal(data.research.length, 7);
  assert.equal(data.sources.length, 9);
  assert.equal(data.pages.length, 2);
  assert.equal(data.assets.length, 6);
});
test("five frozen SVGs are byte-identical and the old screenshot is not used", () => {
  const dir = resolve(
    root,
    "artifacts/stablecoin-hub/public/home-research/v0.2",
  );
  const files = readdirSync(dir);
  assert.equal(files.length, 5);
  for (const file of files) {
    const before = readFileSync(resolve(source, "visuals/final", file));
    assert.deepEqual(readFileSync(resolve(dir, file)), before);
    assert.equal(
      data.hashes[file],
      createHash("sha256").update(before).digest("hex"),
    );
    const id = file.match(/^(HOME-D\d+|RES-D\d+)/)![0];
    assert.equal(data.svg[id], before.toString());
    assert.doesNotMatch(
      before.toString(),
      /<script|<image|<foreignObject|\son\w+=/i,
    );
  }
  assert.doesNotMatch(
    home + research + ui,
    /current-homepage|<img|risk-lifecycle\.jpg|risk-amplification-pyramid|placeholder/i,
  );
});
test("homepage follows question-first hierarchy and Research follows the page manifest", () => {
  const orders = [
    [
      home,
      [
        "hero",
        "question-entry",
        "current-research",
        "research-status",
        "evidence-principles",
        "about-platform",
      ],
    ],
    [
      research,
      [
        "hero",
        "pipeline",
        "55-risk-framework",
        "quantitative-research",
        "evidence-modules",
        "outputs",
        "not-live",
        "next-stage",
      ],
    ],
  ] as const;
  for (const [copy, ids] of orders) {
    let previous = -1;
    for (const id of ids) {
      const index = copy.indexOf(`id="${id}"`);
      assert.ok(index > previous, id);
      previous = index;
    }
  }
  const destinations = [...adapter.matchAll(/href: "(\/[^\"]*)"/g)]
    .slice(0, 5)
    .map((m) => m[1]);
  assert.deepEqual(destinations, [
    "/about-stablecoins",
    "/regional-developments",
    "/agentic-payments",
    "/market-data",
    "/research",
  ]);
  assert.doesNotMatch(home, /team|resource-count|partner.logo|progressbar/i);
  assert.match(home, /Start with stablecoins/);
  assert.match(home, /Explore our research/);
  assert.match(research, /window.location.hash === "#55-risk-framework"/);
  assert.match(research, /requestAnimationFrame/);
});
test("55 is a conceptual taxonomy, while TE/Hawkes are interim and validation is ongoing", () => {
  const item = (id: string) =>
    data.research.find((r: { id: string }) => r.id === id);
  assert.equal(item("risk-framework").status, "COMPLETED_CONCEPTUAL_OUTPUT");
  assert.equal(
    item("quantitative-te-hawkes").status,
    "INTERIM_EMPIRICAL_RESULTS",
  );
  assert.equal(item("stress-cases").status, "INTERIM_RESEARCH_RESULTS");
  assert.equal(item("monitoring-platform").status, "PLANNED");
  assert.equal(
    data.labels.VALIDATION_IN_PROGRESS.label_en,
    "Validation in progress",
  );
  assert.match(
    adapter,
    /does not imply that 55 variables are entered directly into a single empirical model/,
  );
  assert.match(research, /55 ≠ 55 direct model nodes/);
  assert.match(research, /ResearchState status="VALIDATION_IN_PROGRESS"/);
  assert.match(
    research,
    /Continuous monitoring and early warning remain future objectives, not deployed products/,
  );
  assert.match(
    adapter,
    /does not currently provide real-time depeg-probability estimates or a production-grade early-warning score/,
  );
  assert.doesNotMatch(
    home + research + adapter,
    /55.{0,10}(?:live model nodes|direct model inputs)|calibrated probability:\s*[\d.]|depeg probability:\s*[\d.]/i,
  );
});

test("final English copy preserves Chinese literals and page layout attributes", () => {
  const baselines = [
    [
      "src/pages/home-overview.tsx",
      "a548a840586ad44b2e248c3ddd68ae1da48bb7a1548b914579ba401121de3d23",
      "580659e11c19c32284c6b3e09bc4c174d836427f8e94f4c6fa25d762b625cf0d",
    ],
    [
      "src/pages/research.tsx",
      "2e1e5861e101d3487b4056338fb002cf61c4c852f501ed6e175c946564f71489",
      "bb4e464a9daeab6e02d16791fa61f4b308783acd1a4e1aafbb107127cda6dd77",
    ],
    [
      "src/data/home-research.ts",
      "3d6c9caac28a728b47c1ecb823abc1cdef254f9fc10ac8e96044767b152d2efd",
      "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
    ],
    [
      "src/components/home-research-ui.tsx",
      "5adeb73760354f3e55758e3099d0874d7a2b055350e67273b04eabb4097bbff3",
      "7dc717fae4308653c6d055bc20521bcb1302574d0b3ae046e66ea69ed08a2212",
    ],
  ];
  const hash = (value: unknown) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  for (const [file, chineseHash, layoutHash] of baselines) {
    const text = read(`artifacts/stablecoin-hub/${file}`);
    const ast = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const chinese: string[] = [];
    function visit(node: ts.Node) {
      if (
        (ts.isStringLiteral(node) ||
          ts.isNoSubstitutionTemplateLiteral(node) ||
          ts.isJsxText(node)) &&
        /\p{Script=Han}/u.test(node.text)
      )
        chinese.push(node.text);
      ts.forEachChild(node, visit);
    }
    visit(ast);
    assert.equal(hash(chinese), chineseHash, `${file}: Chinese unchanged`);
    assert.equal(
      hash(
        [
          ...text.matchAll(
            /\b(?:className|id|data-[\w-]+)=(?:"[^"]*"|\{[^\n]*\})/g,
          ),
        ].map((m) => m[0]),
      ),
      layoutHash,
      `${file}: layout unchanged`,
    );
  }
});

test("approved English corrections are public-facing and overrides cannot change research statuses", () => {
  assert.match(home, /mechanisms, live products, regulation/);
  assert.match(
    research,
    /From a conceptual risk framework to empirical risk-transmission analysis/,
  );
  assert.match(
    research,
    /identifying the structural risks stablecoins may face/,
  );
  assert.match(research, /What is not yet live/);
  assert.match(research, /a deployed TE\/Hawkes risk engine/);
  assert.match(adapter, /Core design established; refinement ongoing/);
  assert.match(adapter, /Audited research data pipeline established/);
  assert.match(
    adapter,
    /Interim results have been produced for directed, time-varying transmission among measured risk signals\./,
  );
  assert.match(
    adapter,
    /Interim model fits and cross-excitation patterns have been obtained, while out-of-sample performance and interpretation still require further validation\./,
  );
  assert.match(
    adapter,
    /Interim stress-scenario and historical case-study results have been produced; reproducibility and integrated validation remain in progress\./,
  );
  assert.match(adapter, /Regulatory coverage mapping/);
  assert.match(adapter, /Integrated research and market data/);
  assert.equal(
    RESEARCH_RECORD_ENGLISH["risk-framework"].title_en,
    "Full-lifecycle stablecoin risk framework",
  );
  for (const copy of Object.values(RESEARCH_RECORD_ENGLISH)) {
    assert.ok(
      Object.keys(copy).every((key) =>
        ["title_en", "summary_en", "important_boundary_en"].includes(key),
      ),
    );
    assert.doesNotMatch(
      JSON.stringify(copy),
      /result packages|stage results exist|validated findings/i,
    );
  }
  assert.doesNotMatch(
    home + research + adapter,
    /result packages|stage results exist|real products|regulatory-coverage|integrated research\/market data|deployed live TE\/Hawkes/i,
  );
  assert.match(ui, /RESEARCH_RECORD_ENGLISH\[id\]/);
  assert.match(ui, /applyFigureEnglishCopy\(raw\)/);
});

test("figure English corrections are reversible text-only substitutions", () => {
  const unchangedMarkup = (svg: string) => svg.replace(/>([^<]*)</g, "><");
  let changed = 0;
  for (const svg of Object.values(data.svg) as string[]) {
    const copy = applyFigureEnglishCopy(svg);
    assert.equal(unchangedMarkup(copy), unchangedMarkup(svg));
    assert.equal(
      FIGURE_ENGLISH_REPLACEMENTS.reduce(
        (text, [before, after]) => text.replaceAll(after, before),
        copy,
      ),
      svg,
    );
    assert.doesNotMatch(copy, /result packages|Integrated research \+/i);
    if (copy !== svg) changed++;
  }
  assert.equal(changed, 1);
});
test("approved evidence modules are linked and remain independent of empirical risk scores", () => {
  for (const id of ["asia-research", "agentic-payments"]) {
    const item = data.research.find((r: { id: string }) => r.id === id);
    assert.equal(item.status, "COMPLETED_EVIDENCE_MODULE");
    assert.equal(item.public, true);
  }
  assert.match(adapter, /"asia-research": "\/regional-developments"/);
  assert.match(adapter, /"agentic-payments": "\/agentic-payments"/);
  assert.match(research, /rather than being forced into one risk score/);
  assert.match(ui, /item.public &&/);
  for (const item of data.research.filter(
    (r: { public: boolean }) => !r.public,
  ))
    assert.ok(!new RegExp(`"${item.id}": "\/`).test(adapter));
});
test("public citations are restricted to manifest URLs and private records have no downloads", () => {
  const external = data.sources.filter((s: { url: string }) =>
    /^https:\/\//.test(s.url),
  );
  assert.deepEqual(
    external.map((s: { source_id: string }) => s.source_id),
    ["SRC-HR-02", "SRC-HR-03", "SRC-HR-04"],
  );
  const refs = [...(home + research + ui).matchAll(/SRC-HR-\d+/g)].map(
    (m) => m[0],
  );
  const ids = new Set(external.map((s: { source_id: string }) => s.source_id));
  for (const id of refs) assert.ok(ids.has(id));
  assert.match(ui, /source_id === id && \/\^https/);
  assert.doesNotMatch(
    home + research + ui + adapter,
    /\/Users\/|file:\/\/|\.docx|\.pdf|download=|href=.*PROJECT_INTERNAL/,
  );
  assert.match(ui, /TooltipTrigger asChild/);
  assert.match(ui, /PopoverTrigger asChild/);
});
test("institutional wording, bilingual support and theme-aware frozen figures are preserved", () => {
  assert.match(
    adapter,
    /Sponsored by the Academy of Internet Finance \(AIF\), Zhejiang University\./,
  );
  assert.match(home, /BRAND.name.en, BRAND.name.zh/);
  assert.match(ui, /hsl\(var\(--background\)\)/);
  assert.match(ui, /hsl\(var\(--foreground\)\)/);
  assert.match(ui, /closeLabel=/);
  assert.match(ui, /mobileSummary/);
  assert.match(home, /HOME-D01/);
  assert.match(home, /HOME-D02/);
  for (const id of ["RES-D01", "RES-D02", "RES-D03"])
    assert.ok(research.includes(id));
  assert.doesNotMatch(
    home + research + ui,
    /useQuery|fetch\(|researchRisks|lifecycleRiskCodes|setTheme/,
  );
});
