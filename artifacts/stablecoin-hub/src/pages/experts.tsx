import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, User, ChevronRight } from "lucide-react";

interface ApiAuthor {
  id: number;
  name: string;
  researchInterests: string[] | null;
  bio: string | null;
  institutionId: number | null;
  institutionName: string | null;
  resourceCount: number | string;
  publicationYears: Array<number | string> | null;
  chineseResourceCount: number | string;
  englishResourceCount: number | string;
}

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

type ExpertSort = "countDesc" | "nameAsc" | "nameDesc";
type LanguageFilter = "all" | "zh" | "en";

export default function Experts({
  embedded = false,
  searchValue,
  onSearchChange,
}: {
  embedded?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}) {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const [localSearch, setLocalSearch] = useState("");
  const search = searchValue ?? localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;
  const [authors, setAuthors] = useState<ApiAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<ExpertSort>("countDesc");
  const [languageFilter, setLanguageFilter] = useState<LanguageFilter>("all");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase()}/api/authors`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setAuthors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAuthors([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const availableYears = useMemo(() => [...new Set(authors.flatMap((author) =>
    (author.publicationYears ?? []).map(Number).filter(Number.isFinite),
  ))].sort((a, b) => b - a), [authors]);

  const filtered = useMemo(() => {
    const query = search.toLocaleLowerCase().trim();
    const from = yearFrom ? Number(yearFrom) : null;
    const to = yearTo ? Number(yearTo) : null;
    // Pinyin collation keeps Chinese names in their expected initial-letter order while retaining
    // normal A-Z behavior for Latin names, regardless of the interface language.
    const collator = new Intl.Collator("zh-CN-u-co-pinyin", { sensitivity: "base" });

    const list = authors.filter((author) => {
      const years = (author.publicationYears ?? []).map(Number).filter(Number.isFinite);
      const matchesSearch = !query || author.name.toLocaleLowerCase().includes(query)
        || (author.institutionName ?? "").toLocaleLowerCase().includes(query);
      const matchesLanguage = languageFilter === "all"
        || (languageFilter === "zh" ? Number(author.chineseResourceCount) > 0 : Number(author.englishResourceCount) > 0);
      const matchesYear = (!from && !to) || years.some((year) => (!from || year >= from) && (!to || year <= to));
      return matchesSearch && matchesLanguage && matchesYear;
    });

    return [...list].sort((a, b) => {
      if (sortOrder === "nameAsc") return collator.compare(a.name, b.name);
      if (sortOrder === "nameDesc") return collator.compare(b.name, a.name);
      return Number(b.resourceCount) - Number(a.resourceCount) || collator.compare(a.name, b.name);
    });
  }, [authors, languageFilter, search, sortOrder, yearFrom, yearTo, zh]);

  return (
    <div className={`space-y-5 ${embedded ? "" : "max-w-7xl mx-auto"}`}>
      {!embedded && (
        <div className="border-b border-border pb-5">
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
            {t("Experts & Institutions", "专家与机构")}
          </h1>
        </div>
      )}

      {!embedded && (
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder={t("Search names or institutions...", "搜索姓名或机构...")}
            className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="block">{zh ? "文献语言" : "Publication language"}</span>
          <select value={languageFilter} onChange={(event) => setLanguageFilter(event.target.value as LanguageFilter)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground">
            <option value="all">{zh ? "全部语言" : "All languages"}</option>
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="block">{zh ? "起始年份" : "From"}</span>
          <select value={yearFrom} onChange={(event) => setYearFrom(event.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground">
            <option value="">{zh ? "不限" : "Any"}</option>
            {[...availableYears].reverse().map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span className="block">{zh ? "结束年份" : "To"}</span>
          <select value={yearTo} onChange={(event) => setYearTo(event.target.value)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground">
            <option value="">{zh ? "不限" : "Any"}</option>
            {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="ml-auto space-y-1 text-xs text-muted-foreground">
          <span className="block">{zh ? "排序" : "Sort"}</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as ExpertSort)}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground">
            <option value="countDesc">{zh ? "文章数：多到少" : "Most publications"}</option>
            <option value="nameAsc">{zh ? "姓名：A 到 Z" : "Name: A to Z"}</option>
            <option value="nameDesc">{zh ? "姓名：Z 到 A" : "Name: Z to A"}</option>
          </select>
        </label>
      </div>

      {!isLoading && (
        <p className="text-sm text-muted-foreground">
          {zh ? `共 ${filtered.length} 位专家学者` : `${filtered.length} expert${filtered.length === 1 ? "" : "s"}`}
        </p>
      )}

      {isLoading ? (
        <div className="overflow-hidden rounded-md border border-border">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1.4fr_1fr_90px_110px] gap-4 border-b border-border p-4 last:border-0">
              <Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-10" /><Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-md bg-muted/20">
          <User className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-20" />
          <p className="text-sm font-medium text-muted-foreground">{t("No matching experts found", "未找到符合条件的专家学者")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <div className="hidden grid-cols-[minmax(180px,1.35fr)_minmax(140px,1fr)_80px_120px_minmax(150px,1.2fr)_24px] gap-4 border-b border-border bg-muted/60 px-4 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
            <span>{zh ? "姓名" : "Name"}</span><span>{zh ? "机构" : "Institution"}</span>
            <span>{zh ? "文章数" : "Articles"}</span><span>{zh ? "时间跨度" : "Year span"}</span>
            <span>{zh ? "研究方向" : "Research interests"}</span><span />
          </div>
          {filtered.map((author) => {
            const years = (author.publicationYears ?? []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
            const span = years.length === 0 ? "—" : years[0] === years.at(-1) ? String(years[0]) : `${years[0]}–${years.at(-1)}`;
            return (
              <Link key={author.id} href={`/authors/${encodeURIComponent(author.name)}`}>
                <div className="group border-b border-border px-4 py-4 transition-colors last:border-0 hover:bg-muted/40 md:grid md:grid-cols-[minmax(180px,1.35fr)_minmax(140px,1fr)_80px_120px_minmax(150px,1.2fr)_24px] md:items-start md:gap-4">
                  <span className="font-semibold text-sm text-foreground group-hover:text-primary group-hover:underline">{author.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground md:mt-0"><span className="md:hidden">{zh ? "机构：" : "Institution: "}</span>{author.institutionName || "—"}</span>
                  <span className="mt-2 mr-4 inline-block text-xs tabular-nums text-muted-foreground md:mt-0 md:mr-0"><span className="md:hidden">{zh ? "文章：" : "Articles: "}</span>{Number(author.resourceCount)}</span>
                  <span className="mt-2 mr-4 inline-block text-xs tabular-nums text-muted-foreground md:mt-0 md:mr-0"><span className="md:hidden">{zh ? "跨度：" : "Years: "}</span>{span}</span>
                  <span className="mt-2 block text-xs leading-5 text-muted-foreground md:mt-0">
                    <span className="md:hidden">{zh ? "研究方向：" : "Interests: "}</span>{author.researchInterests?.slice(0, 3).join("; ") || "—"}
                  </span>
                  <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
