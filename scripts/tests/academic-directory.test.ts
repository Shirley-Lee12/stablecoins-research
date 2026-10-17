import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import vm from "node:vm";
import ts from "typescript";
import {
  normaliseDoi,
  canonicalUrl,
  resourceDecision,
  researcherDecision,
  missingPublicMetadata,
} from "../lib/directory-reconciliation.mjs";
const root = resolve(import.meta.dirname, "../.."),
  hub = resolve(root, "artifacts/stablecoin-hub/src");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const pack = JSON.parse(
  read(
    "artifacts/stablecoin-hub/src/data/academic-directory-v02.generated.json",
  ),
);
const req = createRequire(
  resolve(root, "artifacts/stablecoin-hub/package.json"),
);
const React = req("react"),
  { renderToStaticMarkup } = req("react-dom/server");
function load(path: string, overrides: Record<string, any> = {}) {
  const raw = readFileSync(path, "utf8").replaceAll(
    "import.meta.env",
    '({BASE_URL:"/",VITE_API_BASE_URL:""})',
  );
  const code = ts.transpileModule(raw, {
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
    AbortSignal,
    fetch,
    URL,
  });
  return exports;
}
const model = load(resolve(hub, "data/academic-directory.ts"), {
  "./academic-directory-v02.generated.json": pack,
});
const backend = load(
  resolve(root, "artifacts/api-server/src/lib/publicDirectory.ts"),
);
let language = "en";
let result: any = { state: "unavailable" };
const common: any = {
  "react/jsx-runtime": req("react/jsx-runtime"),
  react: React,
  "@/lib/language-context": {
    useLanguage: () => ({
      t: (en: string, zh: string) => (language === "en" ? en : zh),
      language,
    }),
  },
  "@/data/academic-directory": model,
};
common["@/components/ui/sheet"] = Object.fromEntries(
  [
    "Sheet",
    "SheetTrigger",
    "SheetContent",
    "SheetHeader",
    "SheetTitle",
    "SheetDescription",
  ].map((n) => [
    n,
    ({ children }: any) => React.createElement("div", null, children),
  ]),
);
const ui = load(resolve(hub, "components/directory-ui.tsx"), common);
const pages = load(resolve(hub, "pages/academic-directory-v02.tsx"), {
  ...common,
  "@/components/directory-ui": ui,
  "@/hooks/use-public-directory": {
    usePublicDirectory: () => ({ result, retry: () => {} }),
  },
});
const render = (component: any, props: any = {}) =>
  renderToStaticMarkup(React.createElement(component, props));
const resource: any = {
  id: 1,
  title: "Stablecoin test evidence",
  authors: ["First Author"],
  status: "approved",
  sourceType: "working_paper",
  yearLabel: "2026",
  doi: "10.1/example",
  url: "https://example.org/research",
  keywords: ["runs", "payments"],
  evidenceType: "working_paper",
  venue: "Institution research series",
  themeTerms: ["arbitrage"],
  recordedThemes: [],
  method: "Theory",
  language: "English",
  access: "Yes",
  relevanceNote: "One sentence about research relevance.",
  verifiedOn: "2026-10-16",
  institutions: ["Institution"],
};
const researcher: any = {
  id: 1,
  name: "Verified Researcher",
  role: "Researcher",
  researcherType: "Policy researcher",
  institution: "Institution",
  institutionType: "University",
  location: "International",
  focus: ["stablecoin arbitrage"],
  profileUrl: "https://example.org/profile",
  verificationType: "OFFICIAL_PROFILE",
  verifiedOn: "2026-10-16",
  works: [
    { id: 1, title: resource.title, yearLabel: "2026", url: resource.url },
  ],
};
const seed = {
  resource_id: "RES-X",
  doi: "https://doi.org/10.1/ABC",
  canonical_url: "https://example.org/work/",
  title: "A Stablecoin Study",
  authors: "First Author; Other Author",
  year: "2026",
};
const row = {
  id: 4,
  doi: "10.1/abc",
  url: "https://example.org/work",
  title: seed.title,
  authors: ["First Author"],
  published_date: "2026",
  status: "approved",
};

test("sole source: 22 unchanged files and complete frozen seed candidates", () => {
  const zip = resolve(
    root,
    "Academic_Resources_Researchers_Codex_Ready_Package_V0.2.zip",
  );
  const files = execFileSync("unzip", ["-Z1", zip], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((x) => !x.endsWith("/"));
  assert.equal(files.length, 22);
  for (const file of files) {
    const p = file.split("/").slice(1).join("/");
    const bytes = readFileSync(
      resolve(
        root,
        "docs/source-packages/academic_resources_experts_package_v0.2",
        p,
      ),
    );
    assert.deepEqual(bytes, execFileSync("unzip", ["-p", zip, file]));
    assert.equal(
      pack.hashes[p],
      createHash("sha256").update(bytes).digest("hex"),
    );
  }
  assert.equal(pack.resources.length, 20);
  assert.equal(pack.researchers.length, 10);
  assert.equal(pack.institutions.length, 10);
  assert.equal(
    pack.resources[2].authors,
    "Kanis Saengchote; Krislert Samphantharak",
  );
  assert.equal(pack.resources[6].doi, "10.1016/j.econlet.2025.112720");
});
test("DB failure is unavailable, never factual zero or a fallback seed list", async () => {
  await assert.rejects(() =>
    backend.loadPublicDirectory(async () => {
      throw Error("DB failed");
    }, "resources"),
  );
  result = { state: "unavailable" };
  for (const page of [pages.LibraryPage, pages.ResearchersPage]) {
    const html = render(page);
    assert.match(html, /temporarily unavailable/);
    assert.doesNotMatch(
      html,
      /(?:matching these filters[^<]*:|0 resources|0 experts|0 researchers|data-resource=|data-researcher=)/i,
    );
  }
  for (const response of [
    { ok: false, json: async () => ({ records: [], total: 0 }) },
    {
      ok: true,
      json: async () => {
        throw Error("parse");
      },
    },
    { ok: true, json: async () => ({}) },
  ])
    await assert.rejects(() =>
      model.fetchDirectory("resources", async () => response),
    );
});
test("public count excludes pending private rejected and withdrawn records", async () => {
  const d = await backend.loadPublicDirectory(
    async () => ({
      rows: [
        resource,
        { ...resource, id: 2, status: "pending" },
        { ...resource, id: 3, status: "withdrawn" },
        { ...resource, id: 4, status: "rejected" },
      ],
    }),
    "resources",
  );
  assert.equal(d.total, 1);
  assert.equal(d.records.length, 1);
  assert.match(backend.PUBLIC_RESOURCES_SQL, /WHERE r.status='approved'/);
  assert.doesNotMatch(
    backend.PUBLIC_RESOURCES_SQL,
    /created_by|reviewed_by|rejection_note|abstract|bio/,
  );
});
test("successful empty query and zero-match differ from query failure", async () => {
  result = {
    state: "success",
    data: { version: "0.2", kind: "resources", records: [], total: 0 },
  };
  const html = render(pages.LibraryPage);
  assert.match(html, /No approved public resources are currently available/);
  assert.doesNotMatch(html, /temporarily unavailable/);
  assert.match(
    render(ui.DirectoryMessage, { kind: "resource", state: "zero" }),
    /No approved public resources match/,
  );
  const d = await model.fetchDirectory("resources", async () => ({
    ok: true,
    json: async () => ({
      version: "0.2",
      kind: "resources",
      records: [],
      total: 0,
    }),
  }));
  assert.equal(d.total, 0);
});
test("DOI exact normalisation matches without duplicate import", () => {
  assert.equal(normaliseDoi(seed.doi), "10.1/abc");
  assert.equal(resourceDecision(seed, [row]).state, "MATCH_EXISTING");
  assert.equal(resourceDecision(seed, [row]).key, "DOI");
  assert.equal(
    resourceDecision(seed, [{ ...row, title: "Existing editor title" }])
      .existingId,
    4,
  );
});
test("canonical URL matching does not duplicate and retains meaningful identifiers", () => {
  assert.equal(
    canonicalUrl("https://EXAMPLE.org/work/?utm_source=x#section"),
    "https://example.org/work",
  );
  const d = resourceDecision({ ...seed, doi: "" }, [{ ...row, doi: "" }]);
  assert.equal(d.state, "MATCH_EXISTING");
  assert.equal(d.key, "URL");
  assert.notEqual(
    canonicalUrl("https://example.org/?id=1"),
    canonicalUrl("https://example.org/?id=2"),
  );
});
test("title identity requires year and first author; contradictions remain conflicts", () => {
  assert.equal(
    resourceDecision({ ...seed, doi: "", canonical_url: "" }, [
      { ...row, doi: "", url: "" },
    ]).key,
    "TITLE_YEAR_AUTHOR",
  );
  assert.equal(
    resourceDecision({ ...seed, doi: "", canonical_url: "" }, [
      { ...row, doi: "", url: "", authors: ["Different Author"] },
    ]).state,
    "CONFLICT_REVIEW",
  );
  assert.equal(
    resourceDecision(seed, [
      { ...row, id: 5 },
      { ...row, id: 6 },
    ]).state,
    "CONFLICT_REVIEW",
  );
  assert.equal(
    resourceDecision(seed, [{ ...row, doi: "10.1/different" }]).state,
    "CONFLICT_REVIEW",
  );
});
test("private or pending matches cannot be published enriched or exposed", () => {
  for (const status of [
    "pending",
    "incomplete",
    "disputed",
    "off_topic",
    "duplicate",
    "rejected",
    "withdrawn",
  ]) {
    const d = resourceDecision(seed, [{ ...row, status }]);
    assert.equal(d.state, "PRIVATE_OR_PENDING_MATCH");
    assert.equal(d.existingId, undefined);
    assert.equal(d.existingIds, undefined);
  }
  const code = read("scripts/academic-directory-db.mjs");
  assert.match(
    code,
    /\["MATCH_EXISTING", "NEW_PUBLIC_SEED"\]\.includes\(p.state\)/,
  );
  assert.doesNotMatch(
    code,
    /UPDATE resources SET status|DELETE FROM|SET created_by|SET abstract|SET title|SET authors/i,
  );
});
test("missing metadata enrichment cannot overwrite summaries ownership or existing DOI", () => {
  assert.deepEqual(
    missingPublicMetadata({ ...row, summary: "editor text" }, seed),
    {},
  );
  assert.deepEqual(
    missingPublicMetadata({ doi: null, url: null, summary: "editor" }, seed),
    { doi: seed.doi, url: seed.canonical_url },
  );
  assert.doesNotMatch(
    read("scripts/sql/academic-directory-v02.sql"),
    /DROP |ALTER TABLE resources|DELETE /i,
  );
});
test("fuzzy researcher names never merge and ambiguous identities stay manual", () => {
  const s = {
    name: "Yiming Ma",
    institution: "Columbia",
    profile_or_verification_url: "https://official.org/person",
  };
  assert.equal(
    researcherDecision(
      s,
      [{ id: 1, name: "Y. Ma", institution: "Columbia" }],
      [],
      [],
    ).state,
    "NEW_PUBLIC_SEED",
  );
  assert.equal(
    researcherDecision(
      s,
      [{ id: 1, name: "Yiming Ma", institution: null }],
      [],
      [],
    ).state,
    "CONFLICT_REVIEW",
  );
  assert.equal(
    researcherDecision(
      s,
      [{ id: 1, name: "Yiming Ma", institution: "Columbia" }],
      [],
      [],
    ).state,
    "MATCH_EXISTING",
  );
  assert.equal(
    researcherDecision(
      s,
      [
        { id: 1, name: "Yiming Ma", institution: "Columbia" },
        { id: 2, name: "Yiming Ma", institution: "Columbia" },
      ],
      [],
      [],
    ).state,
    "CONFLICT_REVIEW",
  );
});
test("verified publication relationship requires exact full name and public work", () => {
  const s = {
    name: "Iñaki Aldasoro",
    institution: "BIS",
    profile_or_verification_url: "https://bis.org/profile",
  };
  const r = { id: 4, name: s.name, institution: null };
  assert.equal(
    researcherDecision(s, [r], [{ author_id: 4, resource_id: 9 }], [9]).key,
    "PUBLICATION_RELATIONSHIP",
  );
  assert.equal(
    researcherDecision(s, [r], [{ author_id: 4, resource_id: 10 }], [9]).state,
    "CONFLICT_REVIEW",
  );
});
test("resource filters support all facets and default to newest year", () => {
  const data = [
    resource,
    { ...resource, id: 2, yearLabel: "2024", authors: ["Other"] },
    { ...resource, id: 3, sourceType: "news", evidenceType: null },
  ];
  assert.deepEqual(
    Array.from(
      model.filterResources(data, model.EMPTY_FILTERS),
      (r: any) => r.id,
    ),
    [1, 2],
  );
  for (const f of [
    { search: "Institution" },
    { theme: "stability_arbitrage" },
    { evidence: "working_paper" },
    { year: "2026" },
    { language: "English" },
    { access: "Yes" },
    { author: "First Author" },
    { institution: "Institution" },
  ])
    assert.ok(
      model.filterResources(data, { ...model.EMPTY_FILTERS, ...f }).length,
    );
  assert.equal(
    model.filterResources(data, {
      ...model.EMPTY_FILTERS,
      search: "zzzzmissing",
    }).length,
    0,
  );
});
test("unverified journal evidence is not automatically peer-reviewed", () => {
  assert.equal(
    model.evidence({
      ...resource,
      evidenceType: null,
      sourceType: "journal_article",
    }),
    "journal_article",
  );
  assert.match(
    render(ui.EvidenceLabel, {
      resource: {
        ...resource,
        evidenceType: null,
        sourceType: "journal_article",
      },
    }),
    /review status not recorded/,
  );
});
test("researcher default sort is recent verification not article count", () => {
  const records = [
    {
      ...researcher,
      id: 1,
      verifiedOn: "2025-10-16",
      works: Array(20).fill(researcher.works[0]),
    },
    { ...researcher, id: 2, verifiedOn: "2026-10-16" },
  ];
  assert.equal(
    model.filterResearchers(records, "", "", "", "", "recently_verified")[0].id,
    2,
  );
  const code = read(
    "artifacts/stablecoin-hub/src/pages/academic-directory-v02.tsx",
  );
  assert.match(code, /useState\("recently_verified"\)/);
  assert.doesNotMatch(code, /countDesc|article_count|citation_rank/);
});
test("publication-time role and affiliation are not current affiliation", () => {
  const html = render(ui.ResearcherCard, {
    researcher: {
      ...researcher,
      verificationType: "CURRENT_PUBLICATION_AFFILIATION",
    },
  });
  assert.match(html, /Publication-time affiliation/);
  assert.match(html, /Verified role · publication-time record/);
  assert.doesNotMatch(
    html,
    /current affiliation|Affiliation verified from official profile/i,
  );
  assert.match(html, /Resources in this library/);
  assert.doesNotMatch(html, /Total publications/);
});
test("institution aggregation excludes profiles without verified public works", () => {
  const groups = model.institutionGroups([
    researcher,
    { ...researcher, id: 2, profileUrl: "", works: [] },
    { ...researcher, id: 3, institution: "Unverified Only", works: [] },
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].people.length, 1);
});
test("mobile retains evidence year source and works with sheet filters", () => {
  const html = render(ui.ResourceCard, { resource });
  assert.match(html, /data-evidence-type/);
  assert.match(html, /2026/);
  assert.match(html, /Publication \/ official source/);
  assert.match(html, /href="https:\/\/example.org\/research"/);
  assert.doesNotMatch(html, /abstract|line-clamp/);
  const source = read(
    "artifacts/stablecoin-hub/src/components/directory-ui.tsx",
  );
  assert.match(source, /SheetTrigger asChild/);
  assert.match(source, /w-\[90vw\]/);
  assert.match(
    render(ui.ResearcherCard, { researcher }),
    /Representative stablecoin research/,
  );
});
test("bilingual public titles and empty copy contain no ranking language", () => {
  result = { state: "success", data: { records: [], total: 0 } };
  for (const lang of ["en", "zh"]) {
    language = lang;
    const html = render(pages.LibraryPage) + render(pages.ResearchersPage);
    assert.doesNotMatch(
      html,
      /top expert|leading institution|expert score|authority score|citation rank|strategic partner|best paper|Total publications/i,
    );
    assert.match(
      html,
      lang === "en" ? /Stablecoin Research Library/ : /稳定币研究资源库/,
    );
    assert.match(
      html,
      lang === "en" ? /Researchers &amp; Institutions/ : /研究者与机构/,
    );
  }
  language = "en";
});
test("real reconciliation preserves nonpublic counts and repeated dry-run has no new seeds", () => {
  const p = "outputs/academic-directory-v02-qa-2026-10-16/";
  const before = JSON.parse(read(p + "db-counts-before.json")),
    after = JSON.parse(read(p + "db-counts-after.json"));
  for (const key of ["pending_private", "rejected", "withdrawn"])
    assert.equal(before.resources[key], after.resources[key]);
  const report = JSON.parse(read(p + "reconciliation-applied.json"));
  assert.equal(report.resources.PRIVATE_OR_PENDING_MATCH, 1);
  assert.equal(report.applied.new_resources, 5);
  assert.equal(after.resources.approved_public, 395);
  assert.equal(after.researchers.verified_public_profiles, 3);
  const post = JSON.parse(read(p + "reconciliation-post-dry-run.json"));
  assert.equal(post.resources.NEW_PUBLIC_SEED, 0);
  assert.equal(post.researchers.NEW_PUBLIC_SEED, 0);
});

test("a shared publication URL is not an official researcher identity match", () => {
  const seed = {
    name: "Different Researcher",
    institution: "Different Institution",
    profile_or_verification_url: "https://publisher.org/shared-paper",
    verification_type: "CURRENT_PUBLICATION_AFFILIATION",
  };
  const existing = {
    id: 1,
    name: "Other Researcher",
    institution: "Another Institution",
    profile_url: "https://publisher.org/shared-paper",
    verification_type: "CURRENT_PUBLICATION_AFFILIATION",
  };
  assert.equal(
    researcherDecision(seed, [existing], [], []).state,
    "NEW_PUBLIC_SEED",
  );
  const official = {
    ...seed,
    verification_type: "OFFICIAL_PROFILE",
    profile_or_verification_url: "https://institution.org/person",
  };
  assert.equal(
    researcherDecision(
      official,
      [
        {
          ...existing,
          name: official.name,
          institution: official.institution,
          profile_url: official.profile_or_verification_url,
          verification_type: "OFFICIAL_PROFILE",
        },
      ],
      [],
      [],
    ).key,
    "PROFILE",
  );
});

test("conflicting strong researcher identifiers cannot be overridden by a same-name institution match", () => {
  const s = {
    name: "Exact Name",
    institution: "Same Institution",
    orcid: "0000-0001",
    profile_or_verification_url: "https://official.org/a",
    verification_type: "OFFICIAL_PROFILE",
  };
  assert.equal(
    researcherDecision(
      s,
      [{ id: 1, name: s.name, institution: s.institution, orcid: "0000-0002" }],
      [],
      [],
    ).state,
    "CONFLICT_REVIEW",
  );
  assert.equal(
    researcherDecision(
      { ...s, orcid: "" },
      [
        {
          id: 1,
          name: s.name,
          institution: s.institution,
          profile_url: "https://official.org/b",
          verification_type: "OFFICIAL_PROFILE",
        },
      ],
      [],
      [],
    ).state,
    "CONFLICT_REVIEW",
  );
});
