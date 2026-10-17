import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, "../.."),
  hub = resolve(root, "artifacts/stablecoin-hub/src");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const pack = JSON.parse(
  read(
    "artifacts/stablecoin-hub/src/data/conference-risk-framework-v02.generated.json",
  ),
);
const req = createRequire(
  resolve(root, "artifacts/stablecoin-hub/package.json"),
);
const React = req("react"),
  { renderToStaticMarkup } = req("react-dom/server");
function load(path: string, overrides: Record<string, any>) {
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
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
      assert.ok(id in overrides, "Unexpected import " + id);
      return overrides[id];
    },
  });
  return exports;
}
const data = load(resolve(hub, "data/conference-risk-framework.ts"), {
  "./conference-risk-framework-v02.generated.json": pack,
});
let language = "en";
const common: any = {
  "react/jsx-runtime": req("react/jsx-runtime"),
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
  "@/data/conference-risk-framework": data,
};
const ui = load(resolve(hub, "components/risk-framework-ui.tsx"), common);
const pages = load(resolve(hub, "pages/risk-framework.tsx"), {
  ...common,
  "@/components/risk-framework-ui": ui,
});
const components = [
  "RiskFramework",
  "LifecycleMapping",
  "AmplificationMapping",
];
function render(name: string, lang = "en") {
  language = lang;
  return renderToStaticMarkup(React.createElement(pages[name]));
}
const strip = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
const all = components
  .flatMap((name) => ["en", "zh"].map((lang) => strip(render(name, lang))))
  .join("\n");
const html = render("RiskFramework"),
  lifecycle = strip(render("LifecycleMapping")),
  amplification = strip(render("AmplificationMapping"));
const section = (s: string, id: string) =>
  s.split(`data-study-state="${id}"`)[1].split("</section>")[0];
test("conference package preserves 18 original entries and data derives only from this archive", () => {
  const zip = resolve(
    root,
    "Conference_Study_Risk_Framework_Codex_Ready_Package_V0.2.zip",
  );
  const integrity = JSON.parse(
    read(
      "outputs/conference-risk-framework-v02-qa-2026-10-17/package-integrity.json",
    ),
  );
  assert.equal(
    createHash("sha256").update(readFileSync(zip)).digest("hex"),
    integrity.archive_sha256,
  );
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((p) => !p.endsWith("/"));
  assert.equal(files.length, 18);
  for (const name of files) {
    const rel = name.replace(/^conference_risk_framework_routes_v0\.2\//, "");
    const raw = readFileSync(
      resolve(
        root,
        "docs/source-packages/conference_risk_framework_routes_v0.2",
        rel,
      ),
    );
    assert.deepEqual(raw, execFileSync("unzip", ["-p", zip, name]));
    assert.equal(
      pack.hashes[rel],
      createHash("sha256").update(raw).digest("hex"),
    );
  }
  assert.equal(
    pack.study.title,
    "Establishing a Multi-Dimensional Risk Framework over the Full Lifecycle of Stablecoins",
  );
});
test("three existing URLs resolve to conference pages and old quantitative placeholders are removed", () => {
  const app = read("artifacts/stablecoin-hub/src/App.tsx");
  for (const route of [
    "/quantitative",
    "/quantitative/dimension-a",
    "/quantitative/dimension-b",
  ])
    assert.ok(app.includes(`path="${route}"`));
  assert.match(app, /@\/pages\/risk-framework/);
  assert.doesNotMatch(
    read("artifacts/stablecoin-hub/src/pages/placeholder.tsx"),
    /QuantDimension|Dimension A|Dimension B/,
  );
});
test("actual rendered English and Chinese have zero Transfer Entropy or conditional TE references", () =>
  assert.doesNotMatch(all, /Transfer Entropy|Conditional TE|\bTE\b/i));
test("actual rendered English and Chinese have zero Hawkes references", () =>
  assert.doesNotMatch(all, /Hawkes/i));
test("actual routes contain no thesis node identifiers or empirical benchmark labels", () =>
  assert.doesNotMatch(
    all,
    /\bN(?:0[1-9]|1[0-3])\b|\bE[12]\b|Poisson benchmark|TE[-–]Hawkes|systemic proxy/i,
  ));
test("actual routes make no thesis stress or historical-case empirical-result claim", () =>
  assert.doesNotMatch(
    all,
    /thesis|硕士|中期报告|empirical results|empirical validation|stress.test results|historical.case results|样本窗口|模型验证结果/i,
  ));
test("old real-time depeg probability and quantitative index claims are absent", () =>
  assert.doesNotMatch(
    all,
    /de.?peg.*probabilit|脱锚概率|de.?peg risk index|脱锚风险指数|live risk score/i,
  ));
test("old model calibration and Q3 2024 release copy is absent", () =>
  assert.doesNotMatch(
    all,
    /calibrat|模型校准|Q3 2024|2024.*Q3|2024年第三季度/i,
  ));
test("payment-gateway cooperation and anonymous velocity products are absent", () =>
  assert.doesNotMatch(
    all,
    /payment.gateway|支付网关|anonymous.*(?:flow|velocity)|anonymized velocity|全球采用流转率/i,
  ));
for (const [name, en, zh] of [
  ["RiskFramework", "Stablecoin Risk Framework", "稳定币风险框架"],
  ["LifecycleMapping", "Lifecycle Mapping (T0–T3)", "生命周期映射（T0–T3）"],
  [
    "AmplificationMapping",
    "Amplification & Transmission Mapping (L0–L3)",
    "放大与传导映射（L0–L3）",
  ],
])
  test(`${name} has the correct bilingual H1`, () => {
    for (const [lang, title] of [
      ["en", en],
      ["zh", zh],
    ]) {
      const h = render(name, lang).match(/<h1[^>]*>(.*?)<\/h1>/)?.[1] || "";
      assert.equal(strip(h), title);
    }
  });
test("55 is the submitted framework count, not a model output or a fabricated list", () => {
  assert.match(strip(html), /55 atomic risks in the submitted framework/);
  assert.equal(pack.study.current_study.atomic_risks, 55);
  assert.doesNotMatch(html, /data-risk-score|data-probability|data-live/);
});
test("atomic means minimum useful identification and measurement unit and permits interactions", () => {
  const text = strip(html);
  assert.match(
    text,
    /minimum useful risk unit for identification and measurement/,
  );
  assert.match(
    text,
    /Atomic does not mean causally or statistically independent/,
  );
  assert.match(
    text,
    /interact, amplify one another and transmit across systems/,
  );
});
test("T0–T3 exact labels and representatives come from the frozen lifecycle mapping", () => {
  assert.deepEqual(
    Array.from(data.LIFECYCLE, (r: any) => r.label),
    [
      "Foundation, Backing & Issuance",
      "Circulation, Trading & Settlement",
      "Protocol Embedding & Layered Finance",
      "Redemption, Deleveraging & Liquidation",
    ],
  );
  for (const row of pack.lifecycle) {
    assert.ok(lifecycle.includes(row.label));
    for (const risk of row.representative_risks.split("; "))
      assert.ok(lifecycle.includes(risk.replace(" — ", " ")));
  }
  assert.match(lifecycle, /not a severity ranking/);
  assert.match(lifecycle, /not mean more severe than T0/);
});
test("T1/T2 boundary is protocol embedding rather than on-chain or DeFi presence", () => {
  assert.match(
    lifecycle,
    /Protocol embedding — not simply being on-chain or being in DeFi — is the boundary/,
  );
  assert.match(lifecycle, /A DEX trade can remain T1/);
  assert.match(
    lifecycle,
    /Lending, collateral, LP positions and other layered positions/,
  );
});
test("L0–L3 exact labels and representatives come from the frozen amplification mapping", () => {
  assert.deepEqual(
    Array.from(data.AMPLIFICATION, (r: any) => r.label),
    [
      "Initial Trigger",
      "Structural Vulnerability",
      "Dynamic Amplification",
      "Cross-System Transmission / Outcomes",
    ],
  );
  for (const row of pack.amplification)
    assert.ok(amplification.includes(row.label));
  assert.match(
    amplification,
    /Structural vulnerability can exist before the trigger/,
  );
});
for (const [id, left, right] of [
  ["L0 ≠ L1", "Trigger event", "Pre-existing susceptibility"],
  ["L1 ≠ L2", "Structural condition", "Activated amplification process"],
  ["T0 ≠ L1", "Lifecycle location", "Causal role"],
  [
    "T3 ≠ L3",
    "Redemption / deleveraging / liquidation / exit stage",
    "Cross-system propagation",
  ],
])
  test(`preserves ${id} and both meanings`, () => {
    assert.ok(amplification.includes(`${id} ${left} versus ${right}`));
  });
test("all quantitative, monitoring, stress detection and early-warning directions are explicitly future research", () => {
  for (const name of components) {
    const h = render(name);
    const future = strip(section(h, "FUTURE_RESEARCH"));
    assert.match(future, /Future research/);
    for (const item of pack.future) {
      assert.equal(item.status, "FUTURE_RESEARCH");
      assert.ok(future.includes(item.topic));
    }
    assert.match(future, /stress detection/);
    assert.match(future, /tiered early.warning/);
    const current = strip(
      h
        .split('data-study-state="CURRENT_STUDY"')[1]
        .split('data-study-state="FUTURE_RESEARCH"')[0],
    );
    assert.doesNotMatch(
      current,
      /monitoring|early warning|risk-specific indicator|transmission estimation/i,
    );
  }
});
test("only 19 source-provided representative risk identities are displayed; no full 55-risk list", () => {
  const known = new Set<string>();
  for (const rows of [
    pack.modules,
    pack.lifecycle,
    pack.amplification.slice(0, 3),
  ])
    for (const row of rows) {
      const value =
        row.representative_risks || row.representative_risks_or_outcomes;
      for (const r of value.split(";")) known.add(r.trim().split(" — ")[0]);
    }
  assert.equal(known.size, 19);
  for (const name of components) {
    const ids = [
      ...render(name).matchAll(/data-representative-risk="([^"]+)"/g),
    ].map((x) => x[1]);
    assert.ok(ids.length < 55);
    for (const id of ids) assert.ok(known.has(id), id);
  }
  assert.match(
    strip(html),
    /Only representative risks shown in the conference material/,
  );
});
test("mobile retains both research states and uses vertical T/L bands without fixed wide canvases", () => {
  for (const name of components) {
    const h = render(name);
    assert.match(h, /data-study-state="CURRENT_STUDY"/);
    assert.match(h, /data-study-state="FUTURE_RESEARCH"/);
    assert.doesNotMatch(h, /data-study-state="[^"]+"[^>]*hidden/);
  }
  for (const name of ["LifecycleMapping", "AmplificationMapping"]) {
    assert.match(render(name), /grid-cols-1[^\"]*lg:grid-cols-4/);
    assert.doesNotMatch(
      render(name),
      /<canvas|<svg|<img|min-w-\[[5-9]\d{2}px\]/,
    );
  }
});
test("seven exact presentation modules do not create a new formal taxonomy", () => {
  assert.equal(data.MODULES.length, 7);
  for (const row of pack.modules) {
    assert.ok(strip(html).includes(row.name));
    assert.match(html, new RegExp(`data-risk-module="${row.module}"`));
  }
  assert.match(
    strip(html),
    /Presentation-level organisation of the submitted framework — not a new formal taxonomy/,
  );
});
test("conceptual decomposition and causal-role diagrams contain no quantified edges or fabricated charts", () => {
  assert.match(html, /data-decomposition-flow/);
  assert.match(html, /data-two-dimensions/);
  assert.match(
    amplification,
    /conceptual causal-role structure, not an empirically estimated causal network/,
  );
  for (const x of [
    "Other stablecoins",
    "DeFi protocols",
    "Broader crypto markets",
    "Traditional financial markets",
  ])
    assert.ok(amplification.includes(x));
  assert.doesNotMatch(
    all,
    /\d+\s*%|coefficient|predictive accuracy|live refresh/i,
  );
});
test("navigation exposes one framework parent and lightweight exact-route links", () => {
  const h = render("LifecycleMapping");
  assert.equal((h.match(/aria-current="page"/g) || []).length, 1);
  for (const n of pack.nav) assert.ok(h.includes(`href="${n.route}"`));
  const layout = read("artifacts/stablecoin-hub/src/components/layout.tsx");
  const item = layout.split('href: "/quantitative",')[1].split("\n  },")[0];
  assert.match(item, /Risk Framework/);
  assert.doesNotMatch(item, /children:/);
  assert.doesNotMatch(
    h,
    /Quantitative Indicators|Dimension A|Dimension B|量化指标/,
  );
});
