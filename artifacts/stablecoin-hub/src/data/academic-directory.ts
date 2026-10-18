import pack from "./academic-directory-v02.generated.json";
export { pack as directoryPackage };
export type DirectoryResource = {
  id: number;
  title: string;
  authors: string[];
  status: "approved";
  sourceType: string;
  yearLabel: string | null;
  url: string | null;
  doi: string | null;
  keywords: string[];
  evidenceType: string | null;
  venue: string | null;
  themeTerms: string[] | null;
  recordedThemes: string[];
  method: string | null;
  language: string | null;
  access: string | null;
  relevanceNote: string | null;
  verifiedOn: string | null;
  institutions: string[];
};
export type DirectoryResearcher = {
  id: number;
  name: string;
  researcherType: string;
  role: string;
  institution: string;
  institutionType: string | null;
  location: string | null;
  focus: string[];
  profileUrl: string;
  verificationType: string;
  verifiedOn: string;
  works: {
    id: number;
    title: string;
    yearLabel: string | null;
    url: string | null;
    doi: string | null;
  }[];
};
export type DirectoryData<T> = {
  version: "0.2";
  kind: "resources" | "researchers";
  records: T[];
  total: number;
};
export type QueryState<T> =
  | { state: "loading" }
  | { state: "unavailable" }
  | { state: "success"; data: DirectoryData<T> };
export const yearOf = (s: string | null) =>
  Number(s?.match(/\b(19|20)\d{2}\b/)?.[0] || 0);
export const evidence = (r: DirectoryResource) =>
  r.evidenceType ||
  {
    working_paper: "working_paper",
    dataset: "dataset_method",
    gov_document: "primary_regulation",
    report: "report",
    news: "news_commentary",
    journal_article: "journal_article",
    conference_paper: "conference_paper",
    thesis: "thesis",
    book: "book",
    book_chapter: "book_chapter",
  }[r.sourceType] ||
  "unclassified";
export const EXTRA_EVIDENCE = [
  { id: "conference_contribution", en: "Conference contribution", zh: "会议贡献" },
  {
    id: "journal_article",
    en: "Journal article · review status not recorded",
    zh: "期刊论文 · 未记录评审状态",
  },
  {
    id: "report",
    en: "Report · evidence class not recorded",
    zh: "报告 · 未记录证据分类",
  },
  { id: "conference_paper", en: "Conference paper", zh: "会议论文" },
  { id: "thesis", en: "Thesis", zh: "学位论文" },
  { id: "book", en: "Book", zh: "专著" },
  { id: "book_chapter", en: "Book chapter", zh: "书籍章节" },
  { id: "news_commentary", en: "News / commentary", zh: "新闻 / 评论" },
  {
    id: "unclassified",
    en: "Evidence type not recorded",
    zh: "未记录证据类型",
  },
];
export const EVIDENCE = [...pack.taxonomy.evidence_types, ...EXTRA_EVIDENCE];
const THEME_RULES: Record<string, RegExp> = {
  stability_arbitrage:
    /stabilit|stabili[sz]|peg|arbitrage|锚定|价格稳定|稳定机制|套利/i,
  runs_liquidity: /runs?\b|liquidity|redemption|挤兑|流动性|赎回/i,
  reserves_transparency: /reserv|collateral|transparen|backing|储备|透明|抵押/i,
  market_structure:
    /market structure|primary market|secondary market|一级|二级|市场结构/i,
  banking_monetary: /bank|deposit|monetary|treasury|银行|存款|货币政策/i,
  systemic_macro:
    /systemic|macro|financial stability|fire sales|系统|外溢|金融稳定/i,
  regulation_law: /regulat|legal|law|private money|监管|法律|私人货币/i,
  payments_adoption: /payment|adoption|支付|采用/i,
  taxonomy_design: /taxonom|design|mechanism|分类|设计|机制/i,
  data_measurement: /data|measur|method|数据|测量|方法/i,
};
// Search indexing only: existing public tags/keywords are not rewritten or treated as verified findings.
export function resourceThemes(r: DirectoryResource) {
  const text = [
    ...(r.themeTerms || []),
    ...(r.recordedThemes || []),
    ...(r.keywords || []),
  ].join(" ");
  return pack.taxonomy.research_themes
    .filter((t) => THEME_RULES[t.id]?.test(text))
    .map((t) => t.id);
}
export type ResourceFilters = {
  search: string;
  theme: string;
  evidence: string;
  year: string;
  language: string;
  access: string;
  author: string;
  institution: string;
  sort: string;
};
export const EMPTY_FILTERS: ResourceFilters = {
  search: "",
  theme: "",
  evidence: "",
  year: "",
  language: "",
  access: "",
  author: "",
  institution: "",
  sort: "year_desc",
};
export function filterResources(
  records: DirectoryResource[],
  f: ResourceFilters,
) {
  const q = f.search.trim().toLocaleLowerCase();
  return records
    .filter((r) => r.status === "approved")
    .filter((r) => {
      const themes = resourceThemes(r);
      const text = [
        r.title,
        ...r.authors,
        r.venue,
        ...r.institutions,
        ...(r.themeTerms || []),
        ...(r.recordedThemes || []),
        ...r.keywords,
        ...pack.taxonomy.research_themes
          .filter((t) => themes.includes(t.id))
          .flatMap((t) => [t.en, t.zh]),
      ]
        .join(" ")
        .toLocaleLowerCase();
      return (
        (!q || text.includes(q)) &&
        (!f.theme || themes.includes(f.theme)) &&
        (!f.evidence
          ? evidence(r) !== "news_commentary"
          : evidence(r) === f.evidence) &&
        (!f.year || yearOf(r.yearLabel) === Number(f.year)) &&
        (!f.language ||
          (f.language === "__unknown"
            ? !r.language
            : r.language === f.language)) &&
        (!f.access ||
          (f.access === "__unknown" ? !r.access : r.access === f.access)) &&
        (!f.author || r.authors.includes(f.author)) &&
        (!f.institution ||
          r.institutions.includes(f.institution) ||
          r.venue === f.institution)
      );
    })
    .sort((a, b) =>
      f.sort === "title_az"
        ? a.title.localeCompare(b.title)
        : (f.sort === "year_asc" ? 1 : -1) *
            (yearOf(a.yearLabel) - yearOf(b.yearLabel)) ||
          a.title.localeCompare(b.title),
    );
}
export function filterResearchers(
  records: DirectoryResearcher[],
  search: string,
  type: string,
  institution: string,
  theme: string,
  sort: string,
) {
  const q = search.trim().toLocaleLowerCase();
  return records
    .filter((r) => r.works.length && r.profileUrl && r.verifiedOn)
    .filter(
      (r) =>
        (!q ||
          [r.name, r.institution, ...r.focus]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)) &&
        (!type || r.researcherType === type) &&
        (!institution || r.institution === institution) &&
        (!theme || THEME_RULES[theme]?.test(r.focus.join(" "))),
    )
    .sort((a, b) =>
      sort === "name_az"
        ? a.name.localeCompare(b.name)
        : b.verifiedOn.localeCompare(a.verifiedOn) ||
          a.name.localeCompare(b.name),
    );
}
export function institutionGroups(input: DirectoryResearcher[]) {
  const records = input.filter(
    (r) => r.works.length && r.profileUrl && r.verifiedOn,
  );
  return [
    ...new Set(
      records
        .filter((r) => r.works.length && r.profileUrl && r.verifiedOn)
        .map((r) => r.institution),
    ),
  ]
    .sort()
    .map((name) => {
      const people = records.filter((r) => r.institution === name);
      return {
        name,
        type: people[0].institutionType,
        location: people[0].location,
        people,
        themes: [
          ...new Set(
            people.flatMap((r) =>
              pack.taxonomy.research_themes
                .filter((t) => THEME_RULES[t.id]?.test(r.focus.join(" ")))
                .map((t) => t.id),
            ),
          ),
        ],
        publicationTimeOnly: people.every(
          (r) => r.verificationType === "CURRENT_PUBLICATION_AFFILIATION",
        ),
      };
    });
}
export async function fetchDirectory<T>(
  kind: "resources" | "researchers",
  fetcher: typeof fetch = fetch,
): Promise<DirectoryData<T>> {
  const base = (
    import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL
  ).replace(/\/$/, "");
  const response = await fetcher(`${base}/api/public-directory/${kind}`, {
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error("DIRECTORY_UNAVAILABLE");
  const data = await response.json();
  if (
    data?.version !== "0.2" ||
    data.kind !== kind ||
    !Array.isArray(data.records) ||
    data.total !== data.records.length ||
    data.records.some((r: any) =>
      kind === "resources"
        ? r.status !== "approved" || !r.title || !Array.isArray(r.authors)
        : !r.name ||
          !r.profileUrl ||
          !r.verifiedOn ||
          !Array.isArray(r.works) ||
          !r.works.length,
    )
  )
    throw Error("INVALID_PUBLIC_DIRECTORY");
  return data;
}

/** Controlled UI vocabulary only. Unknown metadata and source text stay verbatim. */
export const DIRECTORY_UI_ZH: Record<string, string> = {
  "Academic researcher": "学术研究者",
  "Legal / academic researcher": "法律 / 学术研究者",
  "Central-bank researcher": "央行研究者",
  "Policy researcher": "政策研究者",
  "Institutional researcher": "机构研究者",
  "Abstract / subscription": "摘要 / 订阅获取",
  "Publisher access": "出版方获取",
  English: "英语",
  Chinese: "中文",
  Yes: "可公开获取全文",
  University: "高校",
  "Central bank": "中央银行",
  "International institution": "国际机构",
};
export function directoryUiLabel(value: string, language: string): string {
  return language === "zh"
    ? DIRECTORY_UI_ZH[value] || value
    : value === "Yes"
      ? "Open full text"
      : value;
}
export function librarySearchHref(query: string): string {
  const q = query.trim();
  return q
    ? `/academic-resources?q=${encodeURIComponent(q)}`
    : "/academic-resources";
}
export function libraryRequest(search: string): {
  query: string;
  resourceId: number | null;
  hasResourceId: boolean;
} {
  const params = new URL(
    `https://local.invalid/${search.startsWith("?") ? search : `?${search}`}`,
  ).searchParams;
  const raw = params.get("id");
  const id = raw !== null && /^[1-9]\d*$/.test(raw) ? Number(raw) : NaN;
  return {
    query: params.get("q") || "",
    resourceId: Number.isSafeInteger(id) ? id : null,
    hasResourceId: raw !== null,
  };
}
export function requestedPublicResources(
  records: DirectoryResource[],
  filters: ResourceFilters,
  request: ReturnType<typeof libraryRequest>,
) {
  if (request.hasResourceId)
    return records.filter(
      (r) => r.status === "approved" && r.id === request.resourceId,
    );
  return filterResources(records, filters);
}
