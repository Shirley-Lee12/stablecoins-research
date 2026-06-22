import React, { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import {
  Search, ExternalLink, FileText, BookOpen,
  Building2, Newspaper, Tag, Users, ChevronRight, Loader2,
} from "lucide-react";

type SourceType = "Paper" | "Report" | "Gov Document" | "News";
type FilterType = SourceType | "Expert" | "All";

interface Resource {
  id: number;
  title: string;
  authors: string[];
  sourceType: SourceType;
  url: string | null;
  doi: string | null;
  abstract: string | null;
  tags: string[];
  createdAt: string;
}

// ── Mock data (shown when DB has no data yet) ─────────────────────────────────
const MOCK_RESOURCES: Resource[] = [
  {
    id: 1,
    title: "Stablecoins: Growth Potential and Impact on Banking",
    authors: ["International Monetary Fund", "Tobias Adrian", "Tommaso Mancini-Griffoli"],
    sourceType: "Report",
    url: "https://www.imf.org/en/Publications/staff-discussion-notes",
    doi: null,
    abstract:
      "Stablecoins could challenge existing monetary systems. Their success will depend on trust, regulation, and the ability to achieve widespread adoption. This paper explores the macroeconomic implications of stablecoin adoption.",
    tags: ["Monetary Policy", "Financial Stability", "IMF", "Regulation"],
    createdAt: "2024-11-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Stablecoin Runs and the Centralization of Arbitrage",
    authors: ["Gary B. Gorton", "Jeffery Zhang"],
    sourceType: "Paper",
    url: null,
    doi: "10.2139/ssrn.3888752",
    abstract:
      "We analyze the stability of stablecoins by studying historical run episodes. Algorithmic stablecoins are particularly vulnerable to runs. We propose regulatory frameworks analogous to money market funds.",
    tags: ["Run Risk", "Algorithmic", "Regulation", "SSRN"],
    createdAt: "2024-09-15T00:00:00Z",
  },
  {
    id: 3,
    title: "Responsible Financial Innovation Act — Stablecoin Provisions",
    authors: ["U.S. Senate Banking Committee"],
    sourceType: "Gov Document",
    url: "https://www.banking.senate.gov/",
    doi: null,
    abstract:
      "The RFIA establishes a comprehensive framework for digital asset regulation including specific provisions for payment stablecoins, reserve requirements, issuer licensing, and consumer protection.",
    tags: ["U.S. Regulation", "RFIA", "Payment Stablecoin", "Licensing"],
    createdAt: "2024-07-20T00:00:00Z",
  },
  {
    id: 4,
    title: "Circle Unveils USDC Cross-Chain Transfer Protocol for Institutional DeFi",
    authors: ["Circle Internet Financial"],
    sourceType: "News",
    url: "https://www.circle.com/blog",
    doi: null,
    abstract:
      "Circle has launched a cross-chain transfer protocol enabling USDC to move natively across multiple blockchain networks, addressing liquidity fragmentation challenges facing institutional DeFi participants.",
    tags: ["USDC", "Cross-Chain", "DeFi", "Circle"],
    createdAt: "2024-12-05T00:00:00Z",
  },
  {
    id: 5,
    title: "The Economics of Stablecoins: Price Stabilization Mechanisms",
    authors: ["Ye Li", "Simon Mayer"],
    sourceType: "Paper",
    url: null,
    doi: "10.1093/rfs/hhad012",
    abstract:
      "We develop a model comparing collateralized and algorithmic stablecoins, showing collateralized designs are stable under mild conditions while algorithmic designs face fundamental fragility.",
    tags: ["Price Stability", "Collateral", "Algorithmic", "Economic Theory"],
    createdAt: "2024-06-10T00:00:00Z",
  },
  {
    id: 6,
    title: "MiCA Regulation: Comprehensive Framework for Crypto-Asset Markets in the EU",
    authors: ["European Parliament", "European Council"],
    sourceType: "Gov Document",
    url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114",
    doi: null,
    abstract:
      "Markets in Crypto-Assets (MiCA) provides a comprehensive EU regulatory framework. Title III and IV establish specific requirements for asset-referenced tokens and e-money tokens including stablecoins.",
    tags: ["EU", "MiCA", "Regulation", "E-Money Token", "ART"],
    createdAt: "2024-05-01T00:00:00Z",
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────
const FILTER_TYPES: {
  value: FilterType;
  labelEn: string;
  labelZh: string;
  icon: React.ElementType;
}[] = [
  { value: "All",          labelEn: "All Types",          labelZh: "全部类型",  icon: BookOpen   },
  { value: "Paper",        labelEn: "Paper",              labelZh: "学术论文",  icon: FileText   },
  { value: "Report",       labelEn: "Report",             labelZh: "行业报告",  icon: BookOpen   },
  { value: "Gov Document", labelEn: "Gov Document",       labelZh: "监管法案",  icon: Building2  },
  { value: "News",         labelEn: "News",               labelZh: "行业资讯",  icon: Newspaper  },
  { value: "Expert",       labelEn: "Experts & Scholars", labelZh: "专家学者",  icon: Users      },
];

const BADGE_COLORS: Record<SourceType, string> = {
  Paper:           "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  Report:          "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  "Gov Document":  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  News:            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

const BADGE_ICONS: Record<SourceType, React.ElementType> = {
  Paper:          FileText,
  Report:         BookOpen,
  "Gov Document": Building2,
  News:           Newspaper,
};

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ r, language }: { r: Resource; language: string }) {
  const Icon  = BADGE_ICONS[r.sourceType];
  const color = BADGE_COLORS[r.sourceType];
  const href  = r.url ?? (r.doi ? `https://doi.org/${r.doi}` : null);
  const date  = new Date(r.createdAt).toLocaleDateString(
    language === "zh" ? "zh-CN" : "en-US",
    { year: "numeric", month: "short" },
  );

  return (
    <div className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200">
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/70 to-primary/10" />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* badge + date */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
            <Icon className="h-3 w-3" />
            {r.sourceType}
          </span>
          <span className="text-xs text-muted-foreground tabular-nums">{date}</span>
        </div>

        {/* title */}
        <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
          {r.title}
        </h3>

        {/* authors */}
        {r.authors.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
            {r.authors.join("; ")}
          </p>
        )}

        {/* abstract */}
        {r.abstract && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {r.abstract}
          </p>
        )}

        {/* tags */}
        {r.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {r.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border/60">
                {tag}
              </span>
            ))}
            {r.tags.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-muted-foreground">+{r.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* footer link */}
      {href && (
        <div className="border-t border-border px-5 py-2.5">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            {r.doi ? `DOI: ${r.doi}` : language === "zh" ? "查看原文" : "View Source"}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

// ── Expert Redirect Panel ─────────────────────────────────────────────────────
function ExpertPanel({ language }: { language: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="font-semibold text-foreground">
          {language === "zh" ? "专家学者名录" : "Experts & Scholars Directory"}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {language === "zh"
            ? "访问专家学者数据库，浏览全球稳定币领域顶级研究人员的学术主页与研究方向。"
            : "Browse the directory of leading global stablecoin researchers, their profiles, and areas of expertise."}
        </p>
      </div>
      <Link href="/experts">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
          {language === "zh" ? "浏览专家学者" : "Browse Experts"}
          <ChevronRight className="h-4 w-4" />
        </span>
      </Link>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AcademicResources() {
  const { t, language } = useLanguage();
  const [searchQuery,  setSearchQuery]  = useState("");
  const [selectedType, setSelectedType] = useState<FilterType>("All");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [apiResources, setApiResources] = useState<Resource[] | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);

  // Fetch from API on mount; fall back to mock data if empty
  useEffect(() => {
    setIsLoading(true);
    fetch(`${import.meta.env.BASE_URL}api/resources`.replace("//", "/"))
      .then((r) => r.json())
      .then((data: Resource[]) => {
        setApiResources(Array.isArray(data) && data.length > 0 ? data : null);
      })
      .catch(() => setApiResources(null))
      .finally(() => setIsLoading(false));
  }, []);

  const resources = apiResources ?? MOCK_RESOURCES;
  const usingMock = apiResources === null && !isLoading;

  // All unique tags from current data set
  const allTags = useMemo(
    () => Array.from(new Set(resources.flatMap((r) => r.tags))).sort(),
    [resources],
  );

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const filtered = useMemo(() => {
    if (selectedType === "Expert") return [];
    return resources.filter((r) => {
      const matchType = selectedType === "All" || r.sourceType === selectedType;
      const matchTags = selectedTags.size === 0 || [...selectedTags].every((t) => r.tags.includes(t));
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.abstract ?? "").toLowerCase().includes(q) ||
        r.authors.some((a) => a.toLowerCase().includes(q)) ||
        r.tags.some((tg) => tg.toLowerCase().includes(q));
      return matchType && matchTags && matchSearch;
    });
  }, [resources, searchQuery, selectedType, selectedTags]);

  const showExperts = selectedType === "Expert";
  const hasActiveFilters = selectedType !== "All" || selectedTags.size > 0 || searchQuery;

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      {/* ── Page header ── */}
      <div className="space-y-1.5 border-b border-border pb-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-widest">
          <ChevronRight className="h-3.5 w-3.5" />
          {t("Research Hub", "研究中心")}
        </div>
        <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Cutting-Edge Academic Research", "前沿学术资源库")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {t(
            "A curated collection of global academic papers, industry reports, regulatory documents, and news on stablecoin research. Maintained continuously by the ZIBS research team.",
            "汇集全球顶级学术论文、行业研究报告、监管法案原文及行业资讯，由浙大国际商学院稳定币课题组持续维护更新。",
          )}
        </p>
        {usingMock && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-1.5 inline-block">
            {t("Showing sample data — connect the database to display live content.", "当前显示示例数据，连接数据库后将展示真实内容。")}
          </p>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search by title, abstract, author or tag…", "按标题、摘要、作者或标签搜索…")}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-52 shrink-0 space-y-6">

          {/* Resource Type */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
              {t("Resource Type", "资源类型")}
            </p>
            <div className="flex flex-col gap-0.5">
              {FILTER_TYPES.map(({ value, labelEn, labelZh, icon: Icon }) => {
                const active = selectedType === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      setSelectedType(value);
                      if (value !== "All") setSearchQuery("");
                    }}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {language === "zh" ? labelZh : labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags — hidden in Expert view */}
          {!showExperts && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("Filter by Tags", "按标签筛选")}
                </p>
                {selectedTags.size > 0 && (
                  <button onClick={() => setSelectedTags(new Set())} className="text-xs text-primary hover:underline">
                    {t("Clear", "清除")}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      selectedTags.has(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── Results ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Expert panel */}
          {showExperts && <ExpertPanel language={language} />}

          {!showExperts && (
            <>
              {/* Result header */}
              <div className="flex items-center justify-between h-6">
                {isLoading ? (
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("Loading…", "加载中…")}
                  </span>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {language === "zh"
                      ? `共 ${filtered.length} 条结果`
                      : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
                  </p>
                )}
                {hasActiveFilters && (
                  <button
                    onClick={() => { setSelectedType("All"); setSelectedTags(new Set()); setSearchQuery(""); }}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("Reset filters", "重置筛选")}
                  </button>
                )}
              </div>

              {/* Grid */}
              {!isLoading && filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                  <Search className="h-10 w-10 text-muted-foreground/30" />
                  <p className="font-medium text-muted-foreground">
                    {t("No resources found", "未找到相关资源")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t("Try adjusting your search or filters.", "请尝试调整搜索词或筛选条件。")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((r) => (
                    <ResourceCard key={r.id} r={r} language={language} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
