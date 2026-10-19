import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import * as current from "../../artifacts/stablecoin-hub/src/data/agentic-payments-reconciled";
import * as friday from "../../artifacts/stablecoin-hub/src/data/friday-agentic-payments";
const root = resolve(import.meta.dirname, "../.."),
  base = "632a7e383e5dfd78ef49cead12d829fe807e1526";
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const hub = "artifacts/stablecoin-hub/src/";
test("canonical layout, theme, language and section navigation are byte-identical to the approved UI", () => {
  for (const path of [
    "components/layout.tsx",
    "components/section-top-nav.tsx",
    "lib/language-context.tsx",
    "lib/theme-context.tsx",
    "index.css",
  ]) {
    const p = hub + path;
    assert.equal(
      read(p),
      execFileSync("git", ["show", base + ":" + p], {
        cwd: root,
        encoding: "utf8",
      }),
    );
  }
});
test("eight detail protocols reconcile all six Friday records without dropping flows, risks or references", () => {
  assert.equal(current.AGENT_PROTOCOLS.length, 8);
  assert.equal(current.getProtocol("a2p2"), undefined);
  assert.equal(current.getProtocol("a402"), undefined);
  for (const old of friday.AGENT_PROTOCOLS) {
    const p = current.getProtocol(old.id)!;
    for (const key of [
      "flow",
      "controls",
      "history",
      "risks",
      "evidence",
      "actors",
    ] as const)
      assert.deepEqual(p[key], old[key]);
    for (const id of old.resources) assert.ok(p.resources.includes(id));
  }
  for (const id of ["act", "mpp"])
    assert.ok(current.getProtocol(id)?.risks.length);
});
test("every citation resolves and all 32 V0.2 manifest IDs preserve exact URLs, dates and status", () => {
  const d = JSON.parse(read(hub + "data/agentic-payments-v02.generated.json"));
  assert.equal(
    new Set(current.PAYMENT_SOURCES.map((s) => s.id)).size,
    current.PAYMENT_SOURCES.length,
  );
  for (const s of d.sources) {
    const output = current.getSource(s.source_id)!;
    assert.equal(output.url, s.url);
    assert.equal(output.date, s.date);
    assert.equal(output.status, s.status);
    assert.equal(output.sourceType, s.source_type);
    assert.equal(output.useFor, s.use_for);
  }
  for (const p of current.AGENT_PROTOCOLS)
    for (const id of [
      ...p.resources,
      ...[
        ...p.flow,
        ...p.controls,
        ...p.risks,
        ...p.history,
        ...p.evidence,
      ].flatMap((f) => f.sources),
    ])
      assert.ok(current.getSource(id), id);
  for (const e of current.ECOSYSTEM_ENTRIES)
    for (const id of e.sources) assert.ok(current.getSource(id), id);
});
test("ecosystem union preserves Visa, Mastercard, Meta-maintainer evidence and excludes invented independent JD/X protocols", () => {
  assert.equal(current.ECOSYSTEM_ENTRIES.length, 11);
  for (const name of ["Visa", "Mastercard", "JD.com", "Meta", "X / xAI"])
    assert.ok(current.ECOSYSTEM_ENTRIES.some((e) => e.name === name));
  const meta = current.ECOSYSTEM_ENTRIES.find((e) => e.name === "Meta")!;
  assert.ok(meta.sources.includes("acp-maintainers"));
  for (const name of ["JD.com", "X / xAI"])
    assert.deepEqual(
      current.ECOSYSTEM_ENTRIES.find((e) => e.name === name)!.protocols,
      [],
    );
});
test("D01 renders all concepts by default in both languages using legal, fixed-viewBox inline SVG", () => {
  const req = createRequire(
      resolve(root, "artifacts/stablecoin-hub/package.json"),
    ),
    React = req("react"),
    { renderToStaticMarkup } = req("react-dom/server");
  for (const lang of ["en", "zh"]) {
    const exports: any = {};
    const jsx = ts.transpileModule(
      read(hub + "components/agentic-payment-stack.tsx"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText;
    vm.runInNewContext(jsx, {
      exports,
      require: (id: string) =>
        id === "react/jsx-runtime"
          ? req(id)
          : {
              usePaymentText: () => ({
                t: (en: string, zh: string) => (lang === "en" ? en : zh),
              }),
              PaymentCitation: () => null,
            },
    });
    const html = renderToStaticMarkup(
      React.createElement(exports.AgenticPaymentStack),
    );
    assert.equal((html.match(/<li /g) || []).length, 5);
    assert.equal((html.match(/<svg /g) || []).length, 5);
    assert.doesNotMatch(html, /<img|<button|<details|height="auto"/);
    assert.match(html, /lg:grid-cols-5/);
    for (const word of lang === "en"
      ? [
          "Intent",
          "authorization",
          "Payment",
          "Settlement",
          "Card / bank",
          "Stablecoin",
        ]
      : [
          "用户意图",
          "信任与授权",
          "付款执行",
          "结算与证据",
          "银行卡",
          "稳定币",
        ])
      assert.ok(html.includes(word), word);
  }
});
test("immutable research inputs, public SVGs and market snapshots are untouched", () => {
  const changed = execFileSync("git", ["diff", base, "--name-only"], {
    cwd: root,
    encoding: "utf8",
  })
    .trim()
    .split("\n");
  for (const p of changed)
    assert.doesNotMatch(
      p,
      /^(artifacts\/api-server|lib\/|docs\/source-packages|artifacts\/stablecoin-hub\/public\/)|generated\.json$|friday-agentic-payments\.ts$|DEPLOYMENT\.md$/,
    );
});
