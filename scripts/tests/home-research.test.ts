import { renderModule } from "./helpers/render-module";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, "../.."),
  hub = resolve(root, "artifacts/stablecoin-hub/src");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const pack = JSON.parse(
  read("artifacts/stablecoin-hub/src/data/home-research-v02.generated.json"),
);
const conference = JSON.parse(
  read(
    "artifacts/stablecoin-hub/src/data/conference-risk-framework-v02.generated.json",
  ),
);
const req = createRequire(
  resolve(root, "artifacts/stablecoin-hub/package.json"),
);
const React = req("react"),
  { renderToStaticMarkup } = req("react-dom/server");
function load(path: string, overrides: Record<string, any> = {}) {
  const source = readFileSync(path, "utf8").replaceAll(
    "import.meta.env",
    '({BASE_URL:"/"})',
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports: any = {};
  vm.runInNewContext(code, {
    exports,
    require: (id: string) => {
      if(id in overrides)return overrides[id];
      const target=id.startsWith("@/")?resolve(hub,id.slice(2)):resolve(path,"..",id);
      const candidate=[target,target+".tsx",target+".ts",target+".json"].find(p=>existsSync(p));
      if(candidate)return renderModule(root,candidate,overrides);
      throw Error("Unexpected import "+id);
    },
  });
  return exports;
}
const confData = load(resolve(hub, "data/conference-risk-framework.ts"), {
  "./conference-risk-framework-v02.generated.json": conference,
});
const data = load(resolve(hub, "data/home-research.ts"), {
  "./home-research-v02.generated.json": pack,
  "./conference-risk-framework": confData,
});
const brand = load(resolve(hub, "lib/brand.ts"));
let language = "en";
let mappingMode = "lifecycle";
const common: any = {
  "react/jsx-runtime": req("react/jsx-runtime"),
  react: {...React,useState:(initial:any)=>React.useState(initial==="lifecycle"?mappingMode:initial)},
  "lucide-react": req("lucide-react"),
  wouter: {
    Link: ({ children, ...props }: any) =>
      React.createElement("a", props, children),
  },
  "@/lib/language-context": {
    useLanguage: () => ({
      language,
      t: (en: string, zh: string) => (language === "en" ? en : zh),
    }),
  },
  "@/data/home-research": data,
};
// Render all source popovers/tooltips and dialog bodies, including responsive copies.
// This deliberately scans more than the closed-dialog DOM so concealment cannot pass.
for (const [part, names] of Object.entries({
  tooltip: ["Tooltip", "TooltipContent", "TooltipTrigger"],
  popover: ["Popover", "PopoverContent", "PopoverTrigger"],
  dialog: [
    "Dialog",
    "DialogContent",
    "DialogDescription",
    "DialogHeader",
    "DialogTitle",
    "DialogTrigger",
  ],
}))
  common[`@/components/ui/${part}`] = Object.fromEntries(
    names.map((name) => [
      name,
      ({ children, asChild, ...props }: any) =>
        React.createElement(
          "div",
          Object.fromEntries(
            Object.entries(props).filter(
              ([k]) => k === "className" || k.startsWith("data-"),
            ),
          ),
          children,
        ),
    ]),
  );
const ui = load(resolve(hub, "components/home-research-ui.tsx"), common);
const home = load(resolve(hub, "pages/home-overview.tsx"), {
  ...common,
  "@/lib/brand": brand,
  "@/components/home-research-ui": ui,
  "@/data/conference-risk-framework": confData,
}).default;
const research = load(resolve(hub, "pages/research.tsx"), {
  ...common,
  "@/components/home-research-ui": ui,
  "@/data/conference-risk-framework": confData,
}).default;
function render(page: any, lang = "en") {
  language = lang;
  return renderToStaticMarkup(React.createElement(page));
}
const strip = (s: string) =>
  s
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
const METHOD =
  /Transfer Entropy|\bTE\b|conditional TE|group transfer entropy|\bEGTE\b|Hawkes|\bBOCD\b|\bGNN\b|\bXPENN\b|\bPCA\b|转移熵|传递熵|条件熵|霍克斯|自激模型|互激模型/i;
const THESIS_STATUS =
  /empirical network results|event extraction results|model estimates|model validation|measurement validation|robustness testing|thesis.stage|Stage 3[AB]|measurement specification|candidate indicator screening|Tier [123].*measurement|中期实证|阶段性实证|模型拟合|模型验证|测量验证|稳健性检验|样本外验证|已建立研究数据链|候选指标筛选|量化节点筛选/i;
const CASE =
  /stress testing|stress.test(?:ing)? results|historical event case analysis|Treasury.yield shock|redemption.rate simulation|liquidation.loss simulation|\b(?:LCR|NSFR|VaR|CoVaR)\b|压力测试|压力情景.*结果|历史.*案例.*(?:结果|验证)|赎回率模拟|清算损失模拟/i;
const LEGACY =
  /stablecoin de.?peg risk index|real.time (?:de.?peg|risk) probability|model calibrat|calibrated model|Q3 2024|2024年第三季度|adoption turnover rate|payment.gateway (?:partnership|cooperation)|operational early.warning system|production monitoring system|live risk engine|脱锚概率|脱锚风险指数|模型校准|支付网关合作|风险预警平台|可运行的预警系统|全球采用流转率/i;
for (const [name, page] of [
  ["home", home],
  ["research", research],
] as const)
  for (const lang of ["en", "zh"]) {
    test(`${name} ${lang} actual rendered body and all popup variants exclude thesis-only methods`, () =>
      assert.doesNotMatch(strip(render(page, lang)), METHOD));
    test(`${name} ${lang} actual rendered body excludes thesis empirical status, stress and case claims`, () => {
      const html = render(page, lang);
      assert.doesNotMatch(strip(html), THESIS_STATUS);
      assert.doesNotMatch(strip(html), CASE);
    });
    test(`${name} ${lang} actual rendered body excludes legacy product claims while retaining explicit future directions`, () => {
      const text=strip(render(page,lang));
      for(const match of text.matchAll(new RegExp(LEGACY.source,"gi"))){
        const context=text.slice(Math.max(0,match.index!-250),match.index!+350);
        assert.match(context,/future|proposed|not (?:an? |existing |completed |operational)|no operational|未来|不声称|计划|拟开展/i,match[0]);
      }
    });
    test(`${name} ${lang} preserves the approved conference summary and its page-specific mapping scope`, () => {
      let text=strip(render(page,lang));
      if(name==="research"){
        assert.ok(text.includes(pack.study.title));
        try{mappingMode="amplification";text+=" "+strip(render(page,lang));}finally{mappingMode="lifecycle";}
      }else assert.match(render(page,lang),/href="\/research"/);
      assert.match(text, /AI-DEFIT/);
      assert.match(text, /2026/);
      assert.match(
        text,
        lang === "en"
          ? (name === "home" ? /paper[^.]{0,100}accepted by AI-DEFIT/i : /accepted conference paper/i)
          : (name === "home" ? /论文获AI-DEFIT 2026会议接收/ : /已接收会议论文|会议论文已接收/),
      );
      assert.match(text,/55/);
      assert.match(text,lang==="en"?/submitted.framework|representative/i:/已提交框架|代表性/);
      if(name==="research")for(const label of ["T0","T1","T2","T3","L0","L1","L2","L3"])assert.ok(text.includes(label),label);
    });
  }
test("word-boundary method detection does not flag ordinary words or conference names", () => {
  assert.doesNotMatch(
    "Stablecoin research, completed framework, institution and AI-DEFIT",
    METHOD,
  );
  assert.match("TE / Hawkes", METHOD);
  assert.match("conditional TE", METHOD);
});
test("current study is only the framework and its accepted conference paper; future has a separate state", () => {
  assert.deepEqual(
    Array.from(data.RESEARCH_RECORDS, (r: any) => r.id),
    ["risk-framework", "conference-paper"],
  );
  assert.deepEqual(Object.keys(pack.labels), [
    "CURRENT_STUDY",
    "ACCEPTED_CONFERENCE_PAPER",
    "FUTURE_RESEARCH",
  ]);
  for (const page of [home, research]) {
    const html = render(page);
    assert.match(html, /data-home-current-study/);
    assert.match(html, /data-home-future-research/);
    assert.match(html, /not existing results and are not yet implemented/);
    assert.match(
      html,
      /not constitute a validated model or a live monitoring product/,
    );
    assert.equal((html.match(/data-future-direction=/g) || []).length, 7);
  }
});
test("approved Home and Research preserve visible current/future sections in both languages",()=>{
 for(const lang of ["en","zh"]){const h=render(home,lang),r=render(research,lang);
  assert.match(h,/id="hub-work"/);assert.match(h,/id="hub-agenda"/);assert.match(r,/id="outputs"/);
  for(const html of [h,r]){assert.match(strip(html),lang==="en"?/Future research|Research Agenda/:/未来研究|研究计划/);assert.match(strip(html),/AI-DEFIT/);assert.doesNotMatch(html,/<section[^>]*(?:id="hub-work"|id="hub-agenda"|id="outputs")[^>]*class="[^"]*(?:hidden|sr-only)/);}
  assert.match(r,/Submitted anonymised manuscript|匿名送审稿/);
 }
});
test("shared active metadata and constants are clean; retired English overrides cannot reintroduce claims", () => {
  const content =
    JSON.stringify(pack) +
    JSON.stringify(data.RESEARCH_RECORDS) +
    JSON.stringify(data.FRAMEWORK_STEPS) +
    JSON.stringify(data.CONTRIBUTIONS);
  assert.doesNotMatch(content, METHOD);
  assert.doesNotMatch(content, THESIS_STATUS);
  assert.doesNotMatch(content, LEGACY);
  assert.equal(
    existsSync(resolve(hub, "data/home-research-english-copy.ts")),
    false,
  );
  for (const name of [
    "HOME-D02",
    "RES-D01",
    "RES-D02",
    "RES-D03",
    "PROJECT_RESEARCH_BASELINE",
    "INTERIM_EMPIRICAL_RESULTS",
  ])
    assert.ok(!content.includes(name));
});
test("runtime generator cannot reimport old research statuses, masters or empirical diagrams", () => {
  const source = read("scripts/prepare-home-research-package.mjs");
  assert.match(source, /conference_risk_framework_routes_v0\.2/);
  assert.doesNotMatch(
    source,
    /read\("data\/RESEARCH_STATUS|read\("data\/STATUS_LABELS|CONTENT_MASTER|readdir\(/,
  );
  assert.match(source, /Framework · atomic risks/);
  assert.match(source, /Lifecycle · transmission mapping/);
  assert.deepEqual(pack.study, conference.study);
  assert.deepEqual(pack.lifecycle, conference.lifecycle);
  assert.deepEqual(pack.amplification, conference.amplification);
  assert.deepEqual(pack.modules, conference.modules);
  assert.deepEqual(pack.future, conference.future);
});
test("original home archive and source SVGs remain unchanged; old public diagram copies are retired", () => {
  const zip = resolve(root, "Homepage_Research_Codex_Ready_Package_V0.2.zip");
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((p) => !p.endsWith("/"));
  assert.equal(files.length, 29);
  for (const file of files) {
    const rel = file.replace(/^home_research_codex_package_v0\.2\//, "");
    assert.deepEqual(
      readFileSync(
        resolve(
          root,
          "docs/source-packages/home_research_codex_package_v0.2",
          rel,
        ),
      ),
      execFileSync("unzip", ["-p", zip, file]),
    );
  }
  for (const file of [
    "HOME-D01-research-hub-map.svg",
    "HOME-D02-research-maturity.svg",
    "RES-D01-research-pipeline-status.svg",
    "RES-D02-quantitative-research-map.svg",
    "RES-D03-taxonomy-to-measurement.svg",
  ])
    assert.equal(
      existsSync(
        resolve(
          root,
          "artifacts/stablecoin-hub/public/home-research/v0.2",
          file,
        ),
      ),
      false,
    );
});
test("approved Home navigation and retained source diagram exclude thesis-only research claims", () => {
  const html = render(home);
  assert.match(html, /id="hub-modules"/);
  assert.doesNotMatch(strip(html), METHOD);
  assert.match(pack.navigation_svg, /Framework · atomic risks/);
  assert.match(pack.navigation_svg, /Lifecycle · transmission mapping/);
  assert.doesNotMatch(
    pack.navigation_svg,
    /<script|<image|<foreignObject|\son\w+=/i,
  );
  assert.match(
    read("artifacts/stablecoin-hub/src/components/home-research-ui.tsx"),
    /hsl\(var\(--background\)\)/,
  );
});
test("existing public paper and official programme remain accessible without private file links", () => {
  assert.equal(
    pack.paper.url,
    "/media/research/ai-defit-2026-stablecoin-risk-framework.pdf",
  );
  const bytes = readFileSync(
    resolve(root, "artifacts/stablecoin-hub/public" + pack.paper.url),
  );
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    pack.paper.sha256,
  );
  const h = render(research);
  assert.match(
    h,
    /href="\/media\/research\/ai-defit-2026-stablecoin-risk-framework\.pdf"/,
  );
  assert.match(
    h,
    /https:\/\/www\.lait\.fe\.uni-lj\.si\/AI-DEFIT\/program\.html/,
  );
  assert.doesNotMatch(
    h,
    /\/Users\/|file:\/\/|submission-orignal|\.docx|PROJECT_INTERNAL/,
  );
  assert.deepEqual(
    pack.sources.map((s: any) => s.source_id),
    ["SRC-HR-02", "SRC-HR-03", "SRC-HR-04"],
  );
});
test("approved Friday research section order and existing mappings anchor remain intact", () => {
  const h = render(research);
  let position = -1;
  for (const id of ["research-question","research-logic","risk-atlas","analytical-views","transmission-path","outputs"  ]) {
    const next = h.indexOf(`id="${id}"`);
    assert.ok(next > position, id);
    position = next;
  }
  assert.match(
    read("artifacts/stablecoin-hub/src/components/content-edge-nav.tsx"),
    /scrollIntoView/,
  );
  for (const r of [
    "/quantitative",
    "/quantitative/dimension-a",
    "/quantitative/dimension-b",
  ])
    assert.ok(read("artifacts/stablecoin-hub/src/App.tsx").includes(`path="${r}"`));
});
test("framework logic and atomic interactions remain; representative examples are source-provided", () => {
  const text = strip(render(research));
  assert.match(
    text,
    /minimum useful risk unit for identification and measurement/,
  );
  assert.match(
    text,
    /Atomic does not mean causally or statistically independent/,
  );
  assert.match(text, /common financial risks from stablecoin-specific risks/);
  for (const d of ["L0 ≠ L1", "L1 ≠ L2", "T0 ≠ L1", "T3 ≠ L3"])
    assert.ok(text.includes(d));
  const ids = [
    ...render(research).matchAll(/data-conference-example="([^"]+)"/g),
  ].map((m) => m[1]);
  assert.deepEqual(ids, ["C5", "C26", "U18"]);
  assert.equal(new Set(ids).size, 3);
});
test("homepage keeps mission, support, question entries and evidence links outside completed research", () => {
  const text = strip(render(home));
  assert.match(text, /Stablecoin Research Hub/);
  assert.match(
    text,
    /Sponsored by the Academy of Internet Finance \(AIF\), Zhejiang University/,
  );
  const links = [...render(home).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const sidebar=read("artifacts/stablecoin-hub/src/components/layout.tsx");
  for (const href of [
    "/about-stablecoins",
    "/regional-developments",
    "/agentic-payments",
    "/market-data",
    "/research",
    "/regulatory",
    "/academic-resources",
    "/experts",
  ])
    assert.ok(links.includes(href)||sidebar.includes(`href: "${href}"`),href);
  const current = render(home)
    .split('id="hub-work"')[1]
    .split("</section>")[0];
  assert.doesNotMatch(
    current,
    /asia-research|agentic-payments|evidence module complete|data-home-future-research/i,
  );
});
test("conference routes and conceptual mappings stay unchanged while approved programme metadata is corrected", () => {
  for(const file of ["pages/quantitative.tsx","pages/placeholder.tsx","pages/risk-framework.tsx"]){
    const path="artifacts/stablecoin-hub/src/"+file;
    assert.equal(read(path),execFileSync("git",["show","632a7e383e5dfd78ef49cead12d829fe807e1526:"+path],{cwd:root,encoding:"utf8"}));
  }
  const original = JSON.parse(execFileSync("git", ["show", "cb879f55e29c8f3b206a19d862bf19fdc62d00d2:artifacts/stablecoin-hub/src/data/conference-risk-framework-v02.generated.json"], {cwd: root, encoding:"utf8"}));
  for(const key of ["nav","modules","lifecycle","amplification","future","hashes"]) assert.deepEqual(conference[key],original[key]);
  assert.equal(conference.study.presentation_date,null);
  assert.equal(conference.study.programme_date,"2026-09-30");
});

for (const lang of ["en", "zh"]) test(`research ${lang} displays the approved preliminary programme and anonymised download without stale presentation claims`, () => {
  const html=render(research,lang);
  assert.match(html,lang==="en"?/Listed in the preliminary programme:/:/初步节目表所列场次：/);
  assert.match(html,lang==="en"?/30 September 2026 · Online Session 1/:/2026年9月30日 · 线上第1场/);
  assert.match(html,lang==="en"?/Submitted anonymised manuscript/:/匿名送审稿/);
  assert.doesNotMatch(html,/Conference presentation, October 2026|会议报告，2026年10月|Published September 2026/);
});
