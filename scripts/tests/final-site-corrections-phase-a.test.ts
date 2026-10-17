import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(import.meta.dirname, "../..");
const hub = resolve(root, "artifacts/stablecoin-hub/src");
const req = createRequire(resolve(hub, "../package.json"));
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
function load(
  path: string,
  overrides: Record<string, any> = {},
  globals: Record<string, any> = {},
) {
  const source = readFileSync(resolve(hub, path), "utf8").replaceAll("import.meta.env", '({BASE_URL:"/",VITE_API_BASE_URL:""})');
  const code = ts.transpileModule(source, {
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
    URL,
    encodeURIComponent,
    ...globals,
  });
  return exports;
}
const pack = JSON.parse(
  readFileSync(
    resolve(hub, "data/academic-directory-v02.generated.json"),
    "utf8",
  ),
);
const model = load("data/academic-directory.ts", {
  "./academic-directory-v02.generated.json": pack,
});
const meta = load("lib/page-metadata.ts");
const record = {
  id: 114,
  status: "approved",
  title: "Stablecoin & Liquidity",
  authors: ["Original Author"],
  keywords: [],
  institutions: [],
  recordedThemes: [],
  sourceType: "working_paper",
  yearLabel: "2026",
};
test("global search encodes Chinese and reserved characters for the existing library", () => {
  assert.equal(
    model.librarySearchHref("  稳定币 & liquidity?  "),
    "/academic-resources?q=%E7%A8%B3%E5%AE%9A%E5%B8%81%20%26%20liquidity%3F",
  );
  assert.equal(
    model.libraryRequest("?q=%E7%A8%B3%E5%AE%9A%E5%B8%81+%26+liquidity%3F")
      .query,
    "稳定币 & liquidity?",
  );
  assert.equal(model.librarySearchHref("  "), "/academic-resources");
});
test("the actual global-search form submits into library navigation", () => {
  let destination = "";
  let prevented = false;
  const fakeReact = {
    ...React,
    useState: () => ["  Stablecoin & Liquidity  ", () => {}],
    useRef: () => ({ current: null }),
    useEffect: () => {},
  };
  const Search = () => null;
  const { GlobalSearch } = load("components/global-search.tsx", {
    react: fakeReact,
    "react/jsx-runtime": req("react/jsx-runtime"),
    wouter: { useLocation: () => ["/", (p: string) => (destination = p)] },
    "lucide-react": { Search },
    "@/data/academic-directory": model,
    "@/lib/language-context": { useLanguage: () => ({ t: (en: string) => en }) },
  });
  const form = GlobalSearch();
  assert.equal(form.type, "form");
  assert.equal(form.props.role, "search");
  form.props.onSubmit({ preventDefault: () => (prevented = true) });
  assert.equal(prevented, true);
  assert.equal(
    destination,
    "/academic-resources?q=Stablecoin%20%26%20Liquidity",
  );
});
test("query search uses the existing approved-only resource filter", () => {
  const request = model.libraryRequest("?q=liquidity");
  const rows = model.requestedPublicResources(
    [
      record,
      { ...record, id: 2, title: "Different topic" },
      { ...record, id: 3, status: "pending" },
    ],
    { ...model.EMPTY_FILTERS, search: request.query },
    request,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, 114);
});
test("author publication id finds exactly the approved record despite unrelated search/default news filters", () => {
  for (const sourceType of ["working_paper", "news"]) {
    const request = model.libraryRequest("?id=114&q=unrelated");
    const rows = model.requestedPublicResources(
      [
        { ...record, sourceType },
        { ...record, id: 115 },
      ],
      { ...model.EMPTY_FILTERS, search: "unrelated", author: "Other" },
      request,
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, 114);
    assert.equal(rows[0].authors[0], "Original Author");
  }
});
test("unknown, invalid and non-public deep links never substitute another record", () => {
  for (const id of [
    "9999",
    "0",
    "-1",
    "114.5",
    "NaN",
    "114x",
    "",
    "9007199254740992",
  ])
    assert.equal(
      model.requestedPublicResources(
        [record],
        model.EMPTY_FILTERS,
        model.libraryRequest("?id=" + id),
      ).length,
      0,
    );
  for (const status of ["pending", "rejected", "incomplete"])
    assert.equal(
      model.requestedPublicResources(
        [{ ...record, status }],
        model.EMPTY_FILTERS,
        model.libraryRequest("?id=114"),
      ).length,
      0,
    );
});
test("controlled directory vocabulary is bilingual without changing unknown facts or source identities", () => {
  for (const text of [
    "Academic researcher",
    "Central-bank researcher",
    "Abstract / subscription",
    "Publisher access",
    "English",
  ]) {
    assert.notEqual(model.directoryUiLabel(text, "zh"), text);
    assert.equal(model.directoryUiLabel(text, "en"), text);
  }
  for (const text of [
    "Original Author",
    "Bank for International Settlements",
    "AP2",
    "Unknown source metadata",
    "Original Paper Title",
  ])
    assert.equal(model.directoryUiLabel(text, "zh"), text);
});
test("404 is bilingual, theme-compatible and offers working canonical return links", () => {
  for (const language of ["en", "zh"]) {
    const mod = load("pages/not-found.tsx", {
      "react/jsx-runtime": req("react/jsx-runtime"),
      wouter: {
        Link: ({ children, ...props }: any) =>
          React.createElement("a", props, children),
      },
      "@/lib/language-context": {
        useLanguage: () => ({
          t: (en: string, zh: string) => (language === "zh" ? zh : en),
        }),
      },
    });
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.match(html, language === "zh" ? /页面未找到/ : /Page not found/);
    assert.match(html, /href="\/"/);
    assert.match(html, /href="\/academic-resources"/);
    assert.match(html, /text-foreground/);
    assert.doesNotMatch(html, /bg-gray-50|text-gray-900|Did you forget/);
  }
});
test("language provider applies exact HTML language codes on switching locale", () => {
  for (const language of ["zh", "en"]) {
    const document = { documentElement: { lang: "" } };
    const localStorage = { getItem: () => language, setItem: () => {} };
    const fakeReact = {
      ...React,
      useState: (init: any) => [init(), () => {}],
      useEffect: (effect: any) => effect(),
    };
    const mod = load(
      "lib/language-context.tsx",
      { react: fakeReact, "react/jsx-runtime": req("react/jsx-runtime") },
      { localStorage, document },
    );
    mod.LanguageProvider({ children: null });
    assert.equal(
      document.documentElement.lang,
      language === "zh" ? "zh-CN" : "en",
    );
  }
});
test("every public canonical route has bilingual route metadata and non-generic titles", () => {
  const paths = [
    ...readFileSync(resolve(hub, "App.tsx"), "utf8").matchAll(
      /<Route path="([^"]+)"/g,
    ),
  ]
    .map((m) => m[1])
    .filter(
      (p) =>
        !p.startsWith("/protocols/") &&
        !p.startsWith("/regional-developments/"),
    );
  const examples = paths.flatMap((p) =>
    p.includes(":mechanism")
      ? [
          "fiat-backed",
          "crypto-backed",
          "synthetic",
          "algorithmic",
          "other",
        ].map((id) => p.replace(":mechanism", id))
      : p.includes(":id")
        ? ["ucp", "acp", "ap2", "act", "amp", "apop", "x402", "mpp"].map((id) =>
            p.replace(":id", id),
          )
        : [p.replace(":name", "Anthony%20Lee%20Zhang")],
  );
  for (const path of examples)
    for (const language of ["en", "zh"]) {
      const value = meta.pageMetadata(path, language);
      assert.equal(value.found, true, path);
      assert.notEqual(value.title, "Stablecoin Research Hub");
      assert.ok(value.description.length > 8, path);
      assert.ok(value.title.endsWith(" | Stablecoin Research Hub"));
    }
  assert.notEqual(
    meta.pageMetadata("/research", "en").title,
    meta.pageMetadata("/research", "zh").title,
  );
  assert.equal(meta.pageMetadata("/unknown", "en").found, false);
});
test("metadata effect updates title and descriptions on route and language changes", () => {
  const nodes = new Map();
  const document: any = {
    title: "",
    head: { appendChild: () => {} },
    querySelector: (q: string) => {
      if (!nodes.has(q)) nodes.set(q, { content: "" });
      return nodes.get(q);
    },
  };
  let route = "/research",
    language = "en";
  const mod = load(
    "components/page-metadata.tsx",
    {
      react: { useEffect: (effect: any) => effect() },
      wouter: { useLocation: () => [route, () => {}] },
      "@/lib/language-context": { useLanguage: () => ({ language }) },
      "@/lib/page-metadata": meta,
    },
    { document },
  );
  mod.PageMetadata();
  assert.equal(document.title, "Our Research | Stablecoin Research Hub");
  route = "/market-data/adoption";
  language = "zh";
  mod.PageMetadata();
  assert.equal(document.title, "采用 | Stablecoin Research Hub");
  assert.match(nodes.get('meta[name="description"]').content, /采用证据/);
});
test("author breadcrumb targets the verified directory and adoption has a bilingual label", () => {
  const code = readFileSync(resolve(hub, "components/layout.tsx"), "utf8");
  const branch = code.slice(
    code.indexOf('if (location.startsWith("/authors/"))'),
    code.indexOf('if (["/mainland-china"'),
  );
  assert.match(branch, /href: "\/experts"/);
  assert.doesNotMatch(branch, /href: "\/authors"/);
  assert.match(
    code,
    /"\/market-data\/adoption": \{ en: "Adoption", zh: "采用" \}/,
  );
});
test("mobile icon controls expose names, navigation relationship and expanded state", () => {
  const code = readFileSync(resolve(hub, "components/layout.tsx"), "utf8");
  for (const label of [
    "Open navigation",
    "Close navigation",
    "Sign In",
    "Account menu",
    "Messages",
  ])
    assert.ok(code.includes(`aria-label={t("${label}"`), label);
  assert.match(code, /aria-expanded=\{isSidebarOpen\}/);
  assert.match(code, /aria-controls="site-navigation"/);
  assert.match(code, /id="site-navigation"/);
});
test("market currency values avoid duplicate USD while retaining methodology unit labels", () => {
  const modelMarket = load("data/market-data-model.ts");
  const passthrough = ({ children }: any) =>
    React.createElement("div", null, children);
  const overrides: any = {
    "react/jsx-runtime": req("react/jsx-runtime"),
    react: React,
    wouter: { Link: passthrough },
    recharts: Object.fromEntries(
      [
        "LineChart",
        "Line",
        "XAxis",
        "YAxis",
        "CartesianGrid",
        "Tooltip",
        "ResponsiveContainer",
      ].map((k) => [k, passthrough]),
    ),
    "@/components/ui/tooltip": Object.fromEntries(
      ["Tooltip", "TooltipTrigger", "TooltipContent"].map((k) => [
        k,
        passthrough,
      ]),
    ),
    "@/components/ui/popover": Object.fromEntries(
      ["Popover", "PopoverTrigger", "PopoverContent"].map((k) => [
        k,
        passthrough,
      ]),
    ),
    "@/lib/language-context": {
      useLanguage: () => ({ t: (en: string) => en, language: "en" }),
    },
    "@/pages/market-data-shared": { MarketSectionNav: passthrough },
    "@/data/market-data-model": modelMarket,
    "@/data/market-data-v02.generated.json": JSON.parse(
      readFileSync(resolve(hub, "data/market-data-v02.generated.json"), "utf8"),
    ),
  };
  const ui = load("components/market-data-ui.tsx", overrides);
  for (const unit of ["USD", "USD/year"]) {
    const metric = { ...modelMarket.PAYMENT_REPORT.runrate, unit };
    const html = renderToStaticMarkup(
      React.createElement(ui.MetricValue, { metric }),
    );
    assert.doesNotMatch(html, />USD(?:\/year)?</);
    if (unit === "USD/year") assert.match(html, /\/year/);
    const metadata = renderToStaticMarkup(
      React.createElement(ui.Metadata, { metric }),
    );
    assert.match(metadata, new RegExp(`Unit.*${unit}`));
  }
});
test("controlled market methodology and coverage remain Chinese without rewriting quoted source text", () => {
  const source = readFileSync(
    resolve(hub, "data/market-data-model.ts"),
    "utf8",
  );
  assert.match(source, /DefiLlama 追踪范围/);
  assert.match(source, /可归因支付样本/);
  const ui = readFileSync(
    resolve(hub, "components/market-data-ui.tsx"),
    "utf8",
  );
  assert.match(ui, /FRED 官方逐日观测/);
  assert.match(ui, /来源覆盖与准入条件适用/);
  const card = readFileSync(
    resolve(hub, "components/directory-ui.tsx"),
    "utf8",
  );
  assert.match(card, /\{r\.method\}/);
  assert.match(card, /\{r\.relevanceNote\}/);
});
