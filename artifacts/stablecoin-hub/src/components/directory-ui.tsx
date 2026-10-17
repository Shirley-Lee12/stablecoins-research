import { useId, type ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  directoryPackage as pack,
  EVIDENCE,
  directoryUiLabel,
  resourceThemes,
  type DirectoryResource,
  type DirectoryResearcher,
} from "@/data/academic-directory";
export const control =
  "min-h-11 min-w-0 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
export function DirectorySelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <label className="block min-w-0 text-xs font-medium" htmlFor={id}>
      {label}
      <select
        id={id}
        className={control + " mt-2"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function FilterPanel({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <>
      <div className="hidden grid-cols-3 gap-4 lg:grid xl:grid-cols-4">
        {children}
      </div>
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button className="min-h-11 border border-border px-4 py-2 text-sm font-semibold text-primary">
              {t("Filters and sorting", "筛选与排序")}
            </button>
          </SheetTrigger>
          <SheetContent className="w-[90vw] max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{t("Refine the directory", "筛选目录")}</SheetTitle>
              <SheetDescription>
                {t(
                  "Apply filters to the same public results.",
                  "筛选仅作用于同一组公开结果。",
                )}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5 pb-6">{children}</div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
export function DirectoryMessage({
  kind,
  state,
  retry,
}: {
  kind: "resource" | "researcher";
  state: "loading" | "unavailable" | "zero" | "empty";
  retry?: () => void;
}) {
  const { t } = useLanguage();
  if (state === "loading")
    return (
      <p
        role="status"
        className="border-t border-border py-8 text-sm text-muted-foreground"
      >
        {t("Loading the public directory…", "正在读取公开目录……")}
      </p>
    );
  const key =
    state === "unavailable"
      ? `${kind}_directory_unavailable`
      : kind === "resource" && state === "empty"
        ? "resource_no_approved_records"
        : `${kind}_query_success_zero`;
  const msg = pack.empty[key as keyof typeof pack.empty] as {
    en: string;
    zh: string;
  };
  return (
    <div
      role={state === "unavailable" ? "alert" : "status"}
      data-directory-state={state}
      className="border-y border-border py-8"
    >
      <p className="text-sm leading-7">{t(msg.en, msg.zh)}</p>
      {state === "unavailable" && retry && (
        <button
          onClick={retry}
          className="mt-3 min-h-11 text-sm font-semibold text-primary underline"
        >
          {t("Try again", "重新读取")}
        </button>
      )}
    </div>
  );
}
export function EvidenceLabel({
  resource: r,
}: {
  resource: DirectoryResource;
}) {
  const { t } = useLanguage();
  const id =
    r.evidenceType ||
    {
      journal_article: "journal_article",
      working_paper: "working_paper",
      report: "report",
      dataset: "dataset_method",
      gov_document: "primary_regulation",
      news: "news_commentary",
    }[r.sourceType] ||
    r.sourceType;
  const label = EVIDENCE.find((e) => e.id === id);
  return (
    <span data-evidence-type>
      {label
        ? t(label.en, label.zh)
        : t("Evidence type not recorded", "未记录证据类型")}
    </span>
  );
}
export function SafeSource({
  url,
  children,
}: {
  url: string | null | undefined;
  children: ReactNode;
}) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center break-words text-sm font-medium text-primary underline underline-offset-4"
    >
      {children}
    </a>
  );
}
export function ResourceCard({ resource: r }: { resource: DirectoryResource }) {
  const { t, language } = useLanguage();
  const themes = resourceThemes(r);
  const doi = r.doi
    ? `https://doi.org/${r.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`
    : null;
  return (
    <article
      data-resource={r.id}
      className="min-w-0 border-t border-border py-6"
    >
      <h2 className="max-w-5xl text-lg font-semibold leading-8 text-primary">
        {r.title}
      </h2>
      <p
        data-resource-metadata
        className="mt-2 text-sm leading-7 text-muted-foreground"
      >
        {r.yearLabel || t("Year not recorded", "未记录年份")} ·{" "}
        <EvidenceLabel resource={r} /> ·{" "}
        {r.venue ||
          t("Venue / institution not recorded", "未记录出版物 / 机构")}
      </p>
      <p className="mt-2 break-words text-sm leading-7">
        {r.authors.length
          ? r.authors.join("; ")
          : t("Authors not recorded", "未记录作者")}
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {themes.slice(0, 4).map((id) => {
          const theme = pack.taxonomy.research_themes.find((x) => x.id === id)!;
          return <span key={id}>{t(theme.en, theme.zh)}</span>;
        })}
        {!themes.length && (
          <span>{t("Themes not recorded", "未记录主题")}</span>
        )}
      </div>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        {t("Access", "获取方式")}:{" "}
        {r.access === "Yes"
          ? t("Open full text", "可公开获取全文")
          : (r.access ? directoryUiLabel(r.access, language) : null) ||
            t(
              "Not recorded · check the original source",
              "未记录 · 请查看原始来源",
            )}
      </p>
      {r.relevanceNote && (
        <p className="mt-3 max-w-4xl text-sm leading-7">
          <span className="font-medium">
            {t("Why relevant: ", "研究相关性：")}
          </span>
          {r.relevanceNote}
        </p>
      )}
      <div data-source-actions className="mt-2 flex flex-wrap gap-x-5">
        <SafeSource url={doi}>{t("DOI", "DOI")}</SafeSource>
        {r.url !== doi && (
          <SafeSource url={r.url}>
            {t("Publication / official source", "出版 / 官方来源")}
          </SafeSource>
        )}
        {!r.url && !doi && (
          <span className="text-xs text-muted-foreground">
            {t("Source link not recorded", "未记录来源链接")}
          </span>
        )}
      </div>
      {r.method && (
        <details className="mt-2 text-sm leading-7">
          <summary className="min-h-10 cursor-pointer text-primary">
            {t("Method / evidence", "方法 / 证据")}
          </summary>
          <p className="text-muted-foreground">{r.method}</p>
        </details>
      )}
    </article>
  );
}
const TYPE_ZH: Record<string, string> = {
  "Academic researcher": "学术研究者",
  "Legal / academic researcher": "法律 / 学术研究者",
  "Central-bank researcher": "央行研究者",
  "Policy researcher": "政策研究者",
  "Institutional researcher": "机构研究者",
};
export function ResearcherCard({
  researcher: r,
}: {
  researcher: DirectoryResearcher;
}) {
  const { t } = useLanguage();
  const publicationOnly =
    r.verificationType === "CURRENT_PUBLICATION_AFFILIATION";
  return (
    <article
      data-researcher={r.id}
      className="min-w-0 border-t border-border py-6"
    >
      <h2 className="font-serif text-2xl font-bold text-primary">{r.name}</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        {t(r.researcherType, TYPE_ZH[r.researcherType] || "研究者")}
      </p>
      <p className="mt-4 text-sm font-medium leading-7">
        {publicationOnly
          ? t(
              "Verified role · publication-time record",
              "已核验角色 · 发表时记录",
            )
          : t("Verified role", "已核验角色")}
        : {r.role}
      </p>
      <p data-affiliation className="mt-1 text-sm leading-7">
        <span className="font-medium">
          {publicationOnly
            ? t("Publication-time affiliation", "论文发表时机构")
            : t(
                "Affiliation verified from official profile",
                "官方档案核验机构",
              )}
          :
        </span>{" "}
        {r.institution}
      </p>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        {t("Research focus", "研究方向")}: {r.focus.join("; ")}
      </p>
      <h3 className="mt-5 text-sm font-semibold">
        {t("Representative stablecoin research", "代表性稳定币研究")}
      </h3>
      <ul className="mt-1 space-y-1">
        {[...r.works]
          .sort((a, b) => (b.yearLabel || "").localeCompare(a.yearLabel || ""))
          .slice(0, 3)
          .map((w) => (
            <li key={w.id}>
              <SafeSource
                url={w.url || (w.doi ? `https://doi.org/${w.doi}` : null)}
              >
                {w.title}
              </SafeSource>
              <span className="ml-2 text-xs text-muted-foreground">
                {w.yearLabel}
              </span>
            </li>
          ))}
      </ul>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        {t("Resources in this library", "本资源库收录成果")}: {r.works.length} ·{" "}
        {t("Last verified", "最后核验")}:{" "}
        <time dateTime={r.verifiedOn}>{r.verifiedOn}</time>
      </p>
      <SafeSource url={r.profileUrl}>
        {publicationOnly
          ? t("Publication / affiliation source", "出版 / 发表时机构来源")
          : t("Official profile / source", "官方档案 / 来源")}
      </SafeSource>
    </article>
  );
}
