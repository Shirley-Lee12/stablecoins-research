import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { usePublicDirectory } from "@/hooks/use-public-directory";
import {
  directoryPackage as pack,
  EMPTY_FILTERS,
  libraryRequest,
  requestedPublicResources,
  directoryUiLabel,
  EVIDENCE,
  evidence,
  filterResearchers,
  institutionGroups,
  yearOf,
  type DirectoryResource,
  type DirectoryResearcher,
} from "@/data/academic-directory";
import {
  control,
  DirectorySelect,
  FilterPanel,
  DirectoryMessage,
  ResourceCard,
  ResearcherCard,
} from "@/components/directory-ui";
export function LibraryPage() {
  const { t, language } = useLanguage();
  const search = useSearch();
  const [, navigate] = useLocation();
  const request = useMemo(() => libraryRequest(search), [search]);
  const { result, retry } = usePublicDirectory<DirectoryResource>("resources");
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    search: request.query,
  }));
  const [page, setPage] = useState(1);
  useEffect(() => {
    setFilters({ ...EMPTY_FILTERS, search: request.query });
    setPage(1);
  }, [search, request.query]);
  const records = result.state === "success" ? result.data.records : [];
  const filtered = useMemo(
    () => requestedPublicResources(records, filters, request),
    [records, filters, request],
  );
  const update = (key: string, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };
  const options = (values: (string | null)[]) => [
    { value: "", label: t("All", "全部") },
    ...[...new Set(values.filter((s): s is string => Boolean(s)))]
      .sort()
      .map((s) => ({ value: s, label: s })),
  ];
  const facets = [
    {
      key: "evidence",
      label: t("Evidence type", "证据类型"),
      options: [
        {
          value: "",
          label: t("Research evidence · exclude news", "研究证据 · 不含新闻"),
        },
        ...EVIDENCE.filter((e) =>
          records.some((r) => evidence(r) === e.id),
        ).map((e) => ({ value: e.id, label: t(e.en, e.zh) })),
      ],
    },
    {
      key: "year",
      label: t("Year", "年份"),
      options: [
        { value: "", label: t("All years", "全部年份") },
        ...[...new Set(records.map((r) => yearOf(r.yearLabel)).filter(Boolean))]
          .sort((a, b) => b - a)
          .map((y) => ({ value: String(y), label: String(y) })),
      ],
    },
    {
      key: "language",
      label: t("Language", "语言"),
      options: [
        ...options(records.map((r) => r.language)).map((o) => ({
          ...o,
          label: directoryUiLabel(o.label, language),
        })),
        ...(records.some((r) => !r.language)
          ? [
              {
                value: "__unknown",
                label: t("Language not recorded", "未记录语言"),
              },
            ]
          : []),
      ],
    },
    {
      key: "access",
      label: t("Access", "获取方式"),
      options: [
        ...options(records.map((r) => r.access)),
        ...(records.some((r) => !r.access)
          ? [
              {
                value: "__unknown",
                label: t("Access not recorded", "未记录获取方式"),
              },
            ]
          : []),
      ].map((o) => ({ ...o, label: directoryUiLabel(o.label, language) })),
    },
    {
      key: "author",
      label: t("Author", "作者"),
      options: options(records.flatMap((r) => r.authors)),
    },
    {
      key: "institution",
      label: t("Institution / venue", "机构 / 出版物"),
      options: options(records.flatMap((r) => [r.venue, ...r.institutions])),
    },
    {
      key: "sort",
      label: t("Sort", "排序"),
      options: [
        {
          value: "year_desc",
          label: t("Year · newest first", "年份 · 新到旧"),
        },
        { value: "year_asc", label: t("Year · oldest first", "年份 · 旧到新") },
        { value: "title_az", label: t("Title A–Z", "标题 A–Z") },
      ],
    },
  ];
  return (
    <div
      data-directory-v02="resources"
      className="mx-auto w-full min-w-0 max-w-6xl pb-8"
    >
      <header className="pb-8">
        <h1 className="font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {t("Stablecoin Research Library", "稳定币研究资源库")}
        </h1>
        <p className="mt-4 text-lg leading-8">
          {t(
            "Find the evidence behind stablecoin research questions.",
            "从研究问题出发，找到稳定币证据。",
          )}
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "A curated, non-exhaustive library of papers, institutional research, legal scholarship, regulatory sources and data/methodology. Evidence types remain distinct.",
            "这是精选而非穷尽的研究目录，收录论文、机构研究、法律研究、监管原文与数据 / 方法资料，并区分不同证据类型。",
          )}
        </p>
      </header>
      {request.hasResourceId && (
        <div
          className="mb-6 border-l-2 border-primary pl-4 text-sm leading-7"
          role="status"
        >
          <p>
            {t(
              "Showing the requested public resource. Other library filters are not applied.",
              "正在定位指定的公开资源，不叠加其他资源库筛选。",
            )}
          </p>
          <button
            className="min-h-11 text-primary underline"
            onClick={() => navigate("/academic-resources")}
          >
            {t("Browse all resources", "浏览全部资源")}
          </button>
        </div>
      )}
      {!request.hasResourceId && (
        <>
          <section aria-label={t("Research themes", "研究主题")}>
            <h2 className="mb-3 text-lg font-semibold">
              {t(
                "Browse by research question / theme",
                "按研究问题 / 主题浏览",
              )}
            </h2>
            <div className="flex max-w-full gap-2 overflow-x-auto pb-3 lg:flex-wrap">
              {[
                { id: "", en: "All themes", zh: "全部主题" },
                ...pack.taxonomy.research_themes,
              ].map((theme) => (
                <button
                  key={theme.id}
                  aria-pressed={filters.theme === theme.id}
                  onClick={() => update("theme", theme.id)}
                  className={`min-h-11 shrink-0 rounded-sm border px-3 py-2 text-left text-sm ${filters.theme === theme.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  {t(theme.en, theme.zh)}
                </button>
              ))}
            </div>
          </section>
          <section className="border-t border-border py-6">
            <label className="block text-sm font-semibold">
              {t("Search the library", "搜索资源库")}
              <input
                type="search"
                className={control + " mt-3 mb-5"}
                placeholder={t(
                  "Title, author, institution, theme or keyword",
                  "标题、作者、机构、主题或关键词",
                )}
                value={filters.search}
                onChange={(e) => update("search", e.target.value)}
              />
            </label>
            <FilterPanel>
              {facets.map((f) => (
                <DirectorySelect
                  key={f.key}
                  label={f.label}
                  value={filters[f.key as keyof typeof filters]}
                  options={f.options}
                  onChange={(v) => update(f.key, v)}
                />
              ))}
            </FilterPanel>
            {Object.entries(filters).some(([k, v]) => k !== "sort" && v) && (
              <button
                className="mt-4 min-h-11 text-sm text-primary underline"
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(1);
                }}
              >
                {t("Clear filters", "清除筛选")}
              </button>
            )}
          </section>
        </>
      )}
      {result.state !== "success" ? (
        <DirectoryMessage kind="resource" state={result.state} retry={retry} />
      ) : (
        <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {t(
              "Public resources matching these filters",
              "符合当前筛选的公开资源",
            )}
            : {filtered.length}
          </p>
          {request.hasResourceId && !filtered.length ? (
            <p
              role="status"
              className="border-t border-border py-8 text-sm text-muted-foreground"
            >
              {t(
                "The requested public resource is unavailable. It may not exist or may not be approved for public display.",
                "指定的公开资源不可用，可能不存在或尚未获准公开展示。",
              )}
            </p>
          ) : !filtered.length ? (
            <DirectoryMessage
              kind="resource"
              state={records.length ? "zero" : "empty"}
            />
          ) : (
            <section aria-label={t("Public resources", "公开资源")}>
              {filtered.slice((page - 1) * 20, page * 20).map((r) => (
                <ResourceCard key={r.id} resource={r} />
              ))}
            </section>
          )}
          {filtered.length > 20 && (
            <nav
              aria-label={t("Resource pages", "资源分页")}
              className="flex flex-wrap items-center justify-between gap-4 border-t border-border py-5"
            >
              <button
                className="min-h-11 px-3 text-primary disabled:opacity-40"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("Previous", "上一页")}
              </button>
              <span className="text-sm">
                {page} / {Math.ceil(filtered.length / 20)}
              </span>
              <button
                className="min-h-11 px-3 text-primary disabled:opacity-40"
                disabled={page * 20 >= filtered.length}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("Next", "下一页")}
              </button>
            </nav>
          )}
        </>
      )}
      <section className="mt-8 border-t border-border pt-7">
        <h2 className="text-xl font-semibold">
          {t(
            "Read evidence labels before comparing findings",
            "比较结论前，先看证据类型",
          )}
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Peer-reviewed articles, working papers, institutional research, primary law, datasets and industry research answer different questions. A journal entry without recorded review status is labelled separately. News/commentary is excluded from the default view.",
            "同行评审论文、工作论文、机构研究、法律原文、数据及行业研究回答不同问题。未记录评审状态的期刊条目单独标注。新闻 / 评论不进入默认视图。",
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-xs text-muted-foreground">
          {pack.taxonomy.evidence_types.map((e) => (
            <span key={e.id}>{t(e.en, e.zh)}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
export function ResearchersPage() {
  const { t, language } = useLanguage();
  const { result, retry } =
    usePublicDirectory<DirectoryResearcher>("researchers");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [institution, setInstitution] = useState("");
  const [theme, setTheme] = useState("");
  const [sort, setSort] = useState("recently_verified");
  const records = result.state === "success" ? result.data.records : [];
  const filtered = filterResearchers(
    records,
    search,
    type,
    institution,
    theme,
    sort,
  );
  const groups = institutionGroups(filtered);
  const opts = (values: string[]) => [
    { value: "", label: t("All", "全部") },
    ...[...new Set(values)].sort().map((s) => ({ value: s, label: s })),
  ];
  return (
    <div
      data-directory-v02="researchers"
      className="mx-auto w-full min-w-0 max-w-6xl pb-8"
    >
      <header className="pb-7">
        <h1 className="font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          {t("Researchers & Institutions", "研究者与机构")}
        </h1>
        <p className="mt-4 text-lg leading-8">
          {t(
            "Trace stablecoin research through verified publications and affiliations.",
            "沿着可核验的研究成果与机构记录找到稳定币研究者。",
          )}
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Profiles require an unambiguous identity, directly relevant public research and an authoritative profile or publication source. Publication-time affiliation is labelled separately. This directory is curated and is not a ranking.",
            "档案须有明确身份、直接相关的公开研究及权威档案或出版来源。论文发表时机构单独标记。这是精选研究目录，不作排名。",
          )}
        </p>
      </header>
      <section className="border-t border-border py-6">
        <label className="block text-sm font-semibold">
          {t("Search researchers", "搜索研究者")}
          <input
            type="search"
            className={control + " mt-3 mb-5"}
            value={search}
            placeholder={t(
              "Name, institution or research focus",
              "姓名、机构或研究方向",
            )}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <FilterPanel>
          <DirectorySelect
            label={t("Researcher type", "研究者类型")}
            value={type}
            options={opts(records.map((r) => r.researcherType)).map((o) => ({
              ...o,
              label: directoryUiLabel(o.label, language),
            }))}
            onChange={setType}
          />
          <DirectorySelect
            label={t("Institution", "机构")}
            value={institution}
            options={opts(records.map((r) => r.institution))}
            onChange={setInstitution}
          />
          <DirectorySelect
            label={t("Research theme", "研究主题")}
            value={theme}
            options={[
              { value: "", label: t("All themes", "全部主题") },
              ...pack.taxonomy.research_themes.map((x) => ({
                value: x.id,
                label: t(x.en, x.zh),
              })),
            ]}
            onChange={setTheme}
          />
          <DirectorySelect
            label={t("Sort", "排序")}
            value={sort}
            options={[
              {
                value: "recently_verified",
                label: t("Recently verified", "最近核验"),
              },
              { value: "name_az", label: t("Name A–Z", "姓名 A–Z") },
            ]}
            onChange={setSort}
          />
        </FilterPanel>
      </section>
      {result.state !== "success" ? (
        <DirectoryMessage
          kind="researcher"
          state={result.state}
          retry={retry}
        />
      ) : (
        <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            {t(
              "Public researcher profiles matching these filters",
              "符合当前筛选的公开研究者档案",
            )}
            : {filtered.length}
          </p>
          {!filtered.length ? (
            <DirectoryMessage kind="researcher" state="zero" />
          ) : (
            <div className="grid gap-x-10 lg:grid-cols-2">
              {filtered.map((r) => (
                <ResearcherCard key={r.id} researcher={r} />
              ))}
            </div>
          )}
          <section className="mt-8 border-t border-border pt-7">
            <h2 className="font-serif text-2xl font-bold text-primary">
              {t(
                "Institutions represented in this directory",
                "本目录中出现的机构",
              )}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {t(
                "Aggregated from the verified public profiles and their linked research shown above. Representation does not imply a partnership or endorsement.",
                "仅汇总上方已核验公开档案及其关联研究；收录不代表合作或背书。",
              )}
            </p>
            <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {groups.map((g) => (
                <article
                  key={g.name}
                  className="min-w-0 border-t border-border py-5"
                >
                  <h3 className="text-lg font-semibold text-primary">
                    {g.name}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {g.type ? directoryUiLabel(g.type, language) : g.type} ·{" "}
                    {g.location}
                  </p>
                  {g.publicationTimeOnly && (
                    <p className="mt-2 text-xs font-medium">
                      {t("Publication-time affiliation", "论文发表时机构")}
                    </p>
                  )}
                  <p className="mt-3 text-sm leading-7">
                    {t("Researchers represented", "收录研究者")}:{" "}
                    {g.people.map((p) => p.name).join("; ")}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-muted-foreground">
                    {g.themes
                      .map((id) => {
                        const x = pack.taxonomy.research_themes.find(
                          (t) => t.id === id,
                        )!;
                        return t(x.en, x.zh);
                      })
                      .join(" · ")}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
