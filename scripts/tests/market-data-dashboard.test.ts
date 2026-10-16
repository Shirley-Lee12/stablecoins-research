import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, "../..");
const hub = resolve(root, "artifacts/stablecoin-hub/src");
const api = resolve(root, "artifacts/api-server/src/lib");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const clone = (v: any) => JSON.parse(JSON.stringify(v));
function moduleAt(
  path: string,
  overrides: Record<string, any> = {},
  globals: Record<string, any> = {},
) {
  const source = readFileSync(path, "utf8").replaceAll(
    "import.meta.env",
    '({BASE_URL:"/",VITE_API_BASE_URL:""})',
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exp: any = {};
  vm.runInNewContext(
    code,
    {
      exports: exp,
      require: (id: string) => {
        assert.ok(id in overrides, `Unexpected import: ${id}`);
        return overrides[id];
      },
      Date,
      Map,
      Set,
      URL,
      URLSearchParams,
      AbortSignal,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      ...globals,
    },
    { filename: path },
  );
  return exp;
}
const gov = moduleAt(resolve(api, "dataGovernance.ts"));
const model = moduleAt(resolve(hub, "data/market-data-model.ts"));
const packageData = JSON.parse(
  read("artifacts/stablecoin-hub/src/data/market-data-v02.generated.json"),
);
const market = moduleAt(resolve(api, "stablecoinMarket.ts"), {
  "./logger": { logger: { warn() {} } },
  "./dataGovernance": gov,
});
const macro = moduleAt(resolve(api, "macroContext.ts"), {
  "./dataGovernance": gov,
});
const meta = {
  metric_id: "TEST",
  label: "Test",
  unit: "USD",
  source_id: "SRC-MD-01",
  source: "DefiLlama",
  source_url: "https://api-docs.defillama.com/",
  methodology_note: "Provider USD fields only",
  coverage_note: "Tracked universe",
  observation_time: "2026-10-15T00:00:00Z",
};
const ui = read("artifacts/stablecoin-hub/src/components/market-data-ui.tsx"),
  page = read("artifacts/stablecoin-hub/src/pages/market-data-v02.tsx"),
  route = read("artifacts/api-server/src/routes/stablecoinMarket.ts");
const hubRequire = createRequire(
  resolve(root, "artifacts/stablecoin-hub/package.json"),
);
const React = hubRequire("react"),
  { renderToStaticMarkup } = hubRequire("react-dom/server");
let lang = "en";
const language = {
  useLanguage: () => ({
    language: lang,
    t: (en: string, zh: string) => (lang === "zh" ? zh : en),
  }),
};
const common: any = {
  react: React,
  "react/jsx-runtime": hubRequire("react/jsx-runtime"),
  wouter: {
    Link: ({ href, children, ...rest }: any) =>
      React.createElement("a", { href, ...rest }, children),
  },
  recharts: hubRequire("recharts"),
  "@/lib/language-context": language,
  "@/data/market-data-model": model,
  "@/data/market-data-v02.generated.json": packageData,
  "@/pages/market-data-shared": { MarketSectionNav: () => null },
};
for (const part of ["tooltip", "popover"]) {
  const mod = hubRequire("react");
  common[`@/components/ui/${part}`] = Object.fromEntries(
    (part === "tooltip"
      ? ["Tooltip", "TooltipTrigger", "TooltipContent"]
      : ["Popover", "PopoverTrigger", "PopoverContent"]
    ).map((name) => [
      name,
      ({ children }: any) => mod.createElement("span", null, children),
    ]),
  );
}
const component = moduleAt(
  resolve(hub, "components/market-data-ui.tsx"),
  common,
);
const adapter = moduleAt(resolve(hub, "data/market-data.ts"), {
  "./market-data-v02.generated.json": packageData,
  "./market-data-model": model,
});
let dataset: any = {};
const pages = moduleAt(resolve(hub, "pages/market-data-v02.tsx"), {
  "react/jsx-runtime": hubRequire("react/jsx-runtime"),
  "@/lib/language-context": language,
  "@/hooks/use-market-data": {
    useDataset: (id: string) => ({ data: dataset[id] ?? null }),
  },
  "@/data/market-data-model": model,
  "@/data/market-data": adapter,
  "@/components/market-data-ui": component,
});
const render = (C: any, props: any = {}) =>
  renderToStaticMarkup(React.createElement(C, props));

test("sole source ZIP: all 31 files and generated hashes remain byte-identical", () => {
  const zip = resolve(
    root,
    "Market_Data_Dashboard_Codex_Ready_Package_V0.2.zip",
  );
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((f) => !f.endsWith("/"));
  assert.equal(files.length, 31);
  for (const file of files) {
    const rel = file.split("/").slice(1).join("/");
    const bytes = readFileSync(
      resolve(
        root,
        "docs/source-packages/market_data_dashboard_package_v0.2",
        rel,
      ),
    );
    assert.deepEqual(bytes, execFileSync("unzip", ["-p", zip, file]));
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      packageData.hashes[rel],
    );
  }
  assert.equal(packageData.pages.length, 7);
  assert.equal(packageData.sources.length, 24);
  assert.equal(packageData.signals.length, 6);
});
test("null, missing, empty string, parse failure and non-finite values never become zero", () => {
  for (const value of [
    null,
    undefined,
    "",
    " ",
    "not a number",
    NaN,
    Infinity,
    {},
    [],
    false,
  ]) {
    assert.equal(gov.numeric(value), null);
    assert.equal(gov.metric({ ...meta, value }).value, null);
    assert.equal(model.finite(value), null);
  }
  assert.equal(gov.strictSum([]), null);
  assert.equal(gov.strictSum([1, null]), null);
  assert.equal(gov.strictSum([0, 0]), 0);
});
test("an explicitly observed zero stays zero; rendered missing values contain no numeric placeholder", () => {
  const zero = gov.metric({ ...meta, value: 0 });
  assert.equal(zero.value, 0);
  assert.equal(
    model.readMetric(
      zero,
      model.unavailable("TEST", "Test", "SRC-MD-01", "DefiLlama", "USD"),
    ).value,
    0,
  );
  const missing = render(component.MetricCard, {
    metric: gov.metric({ ...meta, value: null }),
    title: ["Tracked value", "追踪价值"],
  });
  assert.match(missing, /Data currently unavailable/);
  assert.doesNotMatch(missing, /data-metric-value|\$0|>0</);
  const observed = render(component.MetricValue, { metric: zero });
  assert.match(observed, /data-metric-value/);
  assert.match(observed, /0/);
});
test("failed fetch, rate limit, empty and malformed responses preserve the prior observation", async () => {
  for (const problem of [
    new Error("429 rate limit"),
    new Error("parse error"),
    new Error("empty response"),
    new Error("credential unavailable"),
  ]) {
    let failed = false;
    const first = gov.metric({ ...meta, value: 42 });
    const load = gov.createSnapshotCache(async () => {
      if (failed) throw problem;
      return { metric: first };
    }, 86400000);
    await load();
    failed = true;
    const last = await load(true);
    assert.equal(last.metric.value, 42);
    assert.equal(last.metric.observation_time, first.observation_time);
    assert.equal(last.metric.freshness_state, "LAST_SUCCESSFUL_SNAPSHOT");
    assert.notEqual(last.metric.observation_time, new Date().toISOString());
    assert.equal(
      (await load()).metric.freshness_state,
      "LAST_SUCCESSFUL_SNAPSHOT",
    );
  }
  const noPrior = gov.createSnapshotCache(async () => {
    throw new Error("No data");
  }, 0);
  await assert.rejects(noPrior());
});
test("freshness is based on observation time, not fetch time; aging and future dates are explicit", () => {
  const old = gov.metric({
    ...meta,
    value: 10,
    observation_time: "2020-01-01",
    last_successful_fetch: new Date().toISOString(),
  });
  assert.equal(old.freshness_state, "DELAYED");
  const future = gov.metric({
    ...meta,
    value: 10,
    observation_time: "2099-01-01",
  });
  assert.equal(future.value, null);
  assert.equal(future.freshness_state, "UNKNOWN_TO_VERIFY");
  const aged = gov.ageSnapshot({ ...old, freshness_state: "FRESH" });
  assert.equal(aged.freshness_state, "DELAYED");
});
test("DefiLlama USD history never falls back to token amounts or assumed par prices", () => {
  const date = String(Math.floor(Date.parse("2026-10-15") / 1000));
  assert.equal(
    market.parseSupplyHistory([
      { date, totalCirculating: { peggedJPY: 1000000 } },
    ])[0].value,
    null,
  );
  assert.equal(
    market.parseSupplyHistory([
      { date, totalCirculatingUSD: { peggedUSD: null } },
    ])[0].value,
    null,
  );
  assert.equal(
    market.parseSupplyHistory([
      { date, totalCirculatingUSD: { peggedUSD: 0 } },
    ])[0].value,
    0,
  );
  assert.equal(
    market.parseSupplyHistory([
      { date, totalCirculatingUSD: { peggedUSD: 12, peggedEUR: 3 } },
    ])[0].value,
    15,
  );
});
test("30-day change is unavailable when no comparable prior date exists", async () => {
  const current = Math.floor(Date.now() / 86400000) * 86400;
  const supplied = [
    { date: String(current), totalCirculatingUSD: { peggedUSD: 100 } },
  ];
  const m = moduleAt(
    resolve(api, "stablecoinMarket.ts"),
    { "./logger": { logger: { warn() {} } }, "./dataGovernance": gov },
    {
      fetch: async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes("stablecoins?")
            ? {
                peggedAssets: [
                  {
                    id: "a",
                    pegType: "peggedUSD",
                    price: null,
                    circulating: { peggedUSD: 100 },
                  },
                ],
              }
            : url.endsWith("stablecoinchains")
              ? []
              : supplied,
      }),
    },
  );
  const data = await m.getStablecoinMarketSnapshot();
  assert.equal(data.total.value, 100);
  assert.equal(data.change30d.value, null);
  assert.equal(data.top2.value, null);
  assert.equal(data.ranked.length, 0);
});
test("FRED parser preserves zero and null gaps; rejects HTML and does not interpolate holidays", () => {
  const rows = macro.parseFredCsv(
    "observation_date,RRP\n2026-10-12,.\n2026-10-13,0\n2026-10-14,\n2026-10-15,2.5\n",
  );
  assert.deepEqual(clone(rows.map((r: any) => r.value)), [null, 0, null, 2.5]);
  assert.throws(() => macro.parseFredCsv("<html>error</html>"));
  assert.match(ui, /connectNulls=\{false\}/);
});
test("report sample has its own period and can never acquire a live state", () => {
  const report = model.PAYMENT_REPORT.runrate;
  assert.equal(report.value, 122e9);
  assert.equal(report.report_period_end, "2025-08");
  assert.equal(report.freshness_state, "REPORT_SNAPSHOT");
  assert.equal(
    model.markLastSuccessful(report).freshness_state,
    "REPORT_SNAPSHOT",
  );
  const html = render(component.MetricCard, {
    metric: report,
    title: ["Dated payments", "报告支付"],
  });
  assert.match(html, /Report snapshot/);
  assert.match(html, /Jan 2023–Aug 2025/);
  assert.match(html, /22 surveyed/);
  assert.doesNotMatch(html, /Live \/ fresh/);
});
test("CEX and DEX have separate units, sides and labels; missing pool fields stay null", async () => {
  const persisted = new Map();
  const module = moduleAt(
    resolve(api, "stablecoinLiquidity.ts"),
    {
      "./logger": { logger: { warn() {} } },
      "./dataGovernance": gov,
      "./persistentSnapshot": {
        writePersistentSnapshot: async (k: any, _s: any, p: any) =>
          persisted.set(k, p),
        readPersistentSnapshot: async (k: any) =>
          persisted.has(k)
            ? { ...persisted.get(k), dataStatus: { state: "current" } }
            : null,
      },
    },
    {
      fetch: async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes("depth?")
            ? { bids: [["0.999", "10000000"]], asks: [["1.001", "10000000"]] }
            : url.includes("ticker/24hr")
              ? {}
              : [
                  {
                    chainId: "ethereum",
                    dexId: "test-dex",
                    pairAddress: "0xpool",
                    url: "https://dexscreener.com/ethereum/test",
                    baseToken: { symbol: "USDC" },
                    quoteToken: { symbol: "USDT" },
                    liquidity: { usd: null },
                    volume: { h24: null },
                    priceUsd: "1",
                  },
                ],
      }),
    },
  );
  await module.refreshStablecoinLiquidity();
  const payload = await module.getStablecoinLiquidity();
  const cex = payload.venues.find((v: any) => v.kind === "CEX"),
    dex = payload.venues.find((v: any) => v.kind === "DEX");
  assert.ok(cex.metrics.some((m: any) => m.unit === "USDT"));
  assert.ok(
    cex.metrics.some((m: any) => m.label.includes("buy · 100,000 USDT")),
  );
  assert.ok(
    cex.metrics.some((m: any) => m.label.includes("sell · 100,000 USDT")),
  );
  assert.equal(
    dex.metrics.find((m: any) => m.metric_id === "MKT_DEX_POOL_LIQ").value,
    null,
  );
  assert.equal(
    dex.metrics.find((m: any) => m.metric_id === "MKT_DEX_VOL_24H").value,
    null,
  );
  assert.ok(
    dex.metrics.every(
      (m: any) => !m.label.includes("depth") && !m.label.includes("slippage"),
    ),
  );
});
test("Dashboard renders five signals without liquidity or research-count KPIs", () => {
  dataset = {};
  lang = "en";
  const html = render(pages.DashboardV02);
  assert.equal((html.match(/data-metric="/g) || []).length, 5);
  assert.doesNotMatch(
    html,
    /55|atomic risks|Total Resources|jurisdictions mapped|depeg KPI/,
  );
  assert.match(html, /Report snapshot/);
});
test("all seven existing routes retain their module boundaries and empty charts stay compact", () => {
  const names = [
    "DashboardV02",
    "MarketDataV02",
    "MarketStructureV02",
    "MarketOnChainV02",
    "MarketIssuersV02",
    "MarketMacroV02",
    "MarketAdoptionV02",
  ];
  for (const name of names) {
    const html = render(pages[name]);
    assert.match(html, /data-market-v02/);
    assert.doesNotMatch(html, /data-valid-chart|\$0|market cap|active users/);
  }
  assert.match(page, /id="supply"/);
  assert.match(page, /id="payment-sample"/);
});
test("holder concentration and unvalidated Ethereum events are not public", () => {
  assert.doesNotMatch(
    render(pages.MarketOnChainV02),
    /adjustedTop10Pct|Top-holder concentration|holderCount|data-holder/,
  );
  assert.doesNotMatch(route, /getStablecoinOnchain\(\)/);
  assert.match(route, /tokens: \[\]/);
  assert.match(
    read("artifacts/api-server/src/lib/stablecoinDataScheduler.ts"),
    /enabled: \(\) => false/,
  );
});
test("public depeg route projects current price only and never returns detector history", () => {
  assert.match(route, /res.json\(await getObservedPrices\(\)\)/);
  assert.doesNotMatch(route, /getDepegSnapshot/);
  const code = read("artifacts/api-server/src/lib/depegEvents.ts").split(
    "export async function getObservedPrices",
  )[1];
  assert.doesNotMatch(
    code,
    /events:|methodology:|START_THRESHOLD|durationHours:/,
  );
  assert.match(code, /freshness\(token.latestAt/);
  assert.match(code, /depegRefreshFailed/);
  assert.match(code, /target:1|target: 1/);
});
test("Tether reserve attestation and company financial-statement audit are separate records", () => {
  const rows = adapter.ISSUER_DISCLOSURES;
  const reserve = rows.find((r: any) => r.id === "tether-reserve"),
    audit = rows.find((r: any) => r.id === "tether-audit");
  assert.match(reserve.scope[0], /attestation/);
  assert.match(reserve.period[0], /30 Jun 2026/);
  assert.match(reserve.publication[0], /31 Jul 2026/);
  assert.equal(reserve.provider[0], "BDO");
  assert.match(audit.period[0], /31 Dec 2025/);
  assert.match(audit.publication[0], /13 Aug 2026/);
  assert.equal(audit.provider[0], "KPMG U.S.");
  assert.notDeepEqual(reserve.sources, audit.sources);
});
test("Circle company reporting, Paxos self-report and FDUSD composition limits remain explicit", () => {
  const rows = adapter.ISSUER_DISCLOSURES;
  assert.ok(rows.find((r: any) => r.id === "paxos-self"));
  assert.ok(rows.find((r: any) => r.id === "paxos-attestation"));
  assert.match(
    rows.find((r: any) => r.id === "fdusd").composition[0],
    /not reproduced/,
  );
  assert.doesNotMatch(
    render(pages.MarketIssuersV02),
    /reserve quality score|\d+(?:\.\d+)?%/,
  );
  assert.match(
    render(pages.MarketIssuersV02),
    /Company-level financial result/,
  );
});
test("adoption does not add raw/adjusted/P2P or issuer-defined figures to the report sample", () => {
  const html = render(pages.MarketAdoptionV02);
  assert.match(html, /Jan 2023–Aug 2025/);
  assert.match(html, /22 surveyed firms \+ 11 estimated firms/);
  assert.match(html, /never added together/);
  assert.doesNotMatch(
    html,
    /7\.0M|14\.8T|14\.7B|live adoption|current stablecoin payments market/,
  );
  assert.match(html, /Read category estimates in the report/);
});
test("mobile issuer cards and all metric components retain unit, source, time, state and method", () => {
  const html = render(pages.MarketIssuersV02);
  assert.equal((html.match(/data-issuer-mobile=/g) || []).length, 6);
  assert.match(html, /Publication date/);
  assert.match(html, /Direct redemption eligibility/);
  for (const locale of ["en", "zh"]) {
    lang = locale;
    const html = render(component.Metadata, {
      metric: model.PAYMENT_REPORT.runrate,
    });
    assert.match(html, /Artemis/);
    assert.match(html, /USD\/year/);
    assert.match(html, /2025/);
    assert.match(html, locale === "en" ? /Report snapshot/ : /报告快照/);
    assert.match(
      html,
      locale === "en" ? /Definition &amp; methodology/ : /定义与方法/,
    );
  }
  lang = "en";
});
test("frontend rejects missing timestamps and retains last-successful observation metadata", () => {
  const fallback = model.unavailable(
    "TEST",
    "Test",
    "SRC-MD-01",
    "DefiLlama",
    "USD",
  );
  assert.equal(
    model.readMetric(
      { ...meta, value: 5, freshness_state: "FRESH", observation_time: null },
      fallback,
    ).value,
    null,
  );
  const data = model.markLastSuccessful({
    metric: gov.metric({ ...meta, value: 12 }),
    report: model.PAYMENT_REPORT.cumulative,
  });
  assert.equal(
    Date.parse(data.metric.observation_time),
    Date.parse(meta.observation_time),
  );
  assert.equal(data.metric.freshness_state, "LAST_SUCCESSFUL_SNAPSHOT");
  assert.equal(data.report.freshness_state, "REPORT_SNAPSHOT");
});
test("public copy excludes internal governance codes and all frontend citations resolve", () => {
  for (const name of [
    "DashboardV02",
    "MarketDataV02",
    "MarketStructureV02",
    "MarketOnChainV02",
    "MarketIssuersV02",
    "MarketMacroV02",
    "MarketAdoptionV02",
  ]) {
    const html = render(pages[name]);
    assert.doesNotMatch(
      html,
      /READY_IF_COLLECTOR|LICENSE_REQUIRED|collector QA|source registry|package|baseline|manifest|METHOD UNDER VALIDATION/,
    );
  }
  const ids = new Set(packageData.sources.map((s: any) => s.source_id));
  for (const id of (
    page + read("artifacts/stablecoin-hub/src/data/market-data.ts")
  ).match(/SRC-MD-\d+/g) || [])
    assert.ok(ids.has(id), id);
});

test("client fetch errors, rate limits and malformed/empty payloads retain valid prior data", async () => {
  const sourceMetric = gov.metric({ ...meta, value: 0 });
  for (const bad of [
    async () => ({ ok: false, status: 429 }),
    async () => ({
      ok: true,
      json: async () => {
        throw new Error("parse error");
      },
    }),
    async () => ({
      ok: true,
      json: async () => ({ version: "0.2", history: [] }),
    }),
    async () => ({
      ok: true,
      json: async () => ({
        version: "0.2",
        history: [{ date: "2026-10-15", value: null }],
        total: { ...sourceMetric, value: null },
      }),
    }),
  ]) {
    const hook = moduleAt(resolve(hub, "hooks/use-market-data.ts"), {
      react: React,
      "@/data/market-data-model": model,
    });
    const good = {
      version: "0.2",
      history: [{ date: "2026-10-15", value: 0 }],
      total: sourceMetric,
    };
    await hook.fetchDataset("stablecoin-market", async () => ({
      ok: true,
      json: async () => good,
    }));
    const result = await hook.fetchDataset("stablecoin-market", bad);
    assert.equal(result.total.value, 0);
    assert.equal(result.total.freshness_state, "LAST_SUCCESSFUL_SNAPSHOT");
    assert.equal(result.total.observation_time, sourceMetric.observation_time);
  }
});
test("public current-price projection excludes unknown targets, wrappers, stale values and all events", async () => {
  const fresh = new Date().toISOString();
  const depeg = moduleAt(resolve(api, "depegEvents.ts"), {
    "./logger": { logger: { warn() {} } },
    "./dataGovernance": gov,
    "./persistentSnapshot": {
      readPersistentSnapshot: async () => ({
        refreshedAt: fresh,
        sourceUrl: "https://www.coingecko.com/",
        dataStatus: { state: "current" },
        tokens: [
          {
            symbol: "USDC",
            latestPriceUsd: 1.002,
            latestAt: fresh,
            events: [{ token: "USDC", durationHours: 20 }],
          },
          {
            symbol: "wrapper",
            latestPriceUsd: 1.2,
            latestAt: fresh,
            events: [],
          },
          {
            symbol: "USDT",
            latestPriceUsd: 1,
            latestAt: "2020-01-01",
            events: [],
          },
          {
            symbol: "PYUSD",
            latestPriceUsd: null,
            latestAt: fresh,
            events: [],
          },
        ],
      }),
      writePersistentSnapshot: async () => {},
    },
  });
  const result = await depeg.getObservedPrices();
  assert.equal(result.tokens.length, 1);
  assert.equal(result.tokens[0].symbol, "USDC");
  assert.ok(Math.abs(result.tokens[0].deviation.value - 20) < 1e-8);
  assert.doesNotMatch(
    JSON.stringify(result),
    /"(?:events|durationHours|threshold|probability)"\s*:/,
  );
});
