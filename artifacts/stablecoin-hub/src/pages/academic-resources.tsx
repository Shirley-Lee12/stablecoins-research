import React, { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { Search, ExternalLink, FileText, BookOpen, Building2, Newspaper, Tag, ChevronRight } from "lucide-react";

type SourceType = "Paper" | "Report" | "Gov Document" | "News";

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

const MOCK_RESOURCES: Resource[] = [
  {
    id: 1,
    title: "Stablecoins: Growth Potential and Impact on Banking",
    authors: ["International Monetary Fund", "Tobias Adrian", "Tommaso Mancini-Griffoli"],
    sourceType: "Report",
    url: "https://www.imf.org/en/Publications/staff-discussion-notes",
    doi: null,
    abstract:
      "Stablecoins could challenge existing monetary systems. Their success will depend on trust, regulation, and the ability to achieve widespread adoption. This paper explores the macroeconomic implications of stablecoin adoption and the conditions under which they may succeed or fail.",
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
      "We analyze the stability of stablecoins by studying historical run episodes. We find that algorithmic stablecoins are particularly vulnerable to runs and propose regulatory frameworks analogous to money market funds to ensure stability and investor protection.",
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
      "The RFIA establishes a comprehensive framework for digital asset regulation in the United States, including specific provisions for payment stablecoins, reserve requirements, issuer licensing, and consumer protection measures applicable to stablecoin operators.",
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
      "Circle has launched a cross-chain transfer protocol enabling USDC to move natively across multiple blockchain networks without wrapped tokens, addressing liquidity fragmentation challenges facing institutional decentralized finance participants.",
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
      "We develop a model comparing collateralized and algorithmic stablecoins, showing collateralized designs are stable under mild conditions while algorithmic designs face fundamental fragility. Optimal reserve policy and the role of smart contracts in maintaining the peg are analyzed.",
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
      "Markets in Crypto-Assets (MiCA) provides a comprehensive EU regulatory framework covering issuance, public offering, and trading of crypto-assets. Title III and IV establish specific requirements for asset-referenced tokens and e-money tokens including stablecoins.",
    tags: ["EU", "MiCA", "Regulation", "E-Money Token", "ART"],
    createdAt: "2024-05-01T00:00:00Z",
  },
];

const ALL_TAGS = Array.from(new Set(MOCK_RESOURCES.flatMap((r) => r.tags))).sort();

const SOURCE_TYPES: { value: SourceType | "All"; label: string; labelZh: string; icon: React.ElementType }[] = [
  { value: "All", label: "All Types", labelZh: "全部类型", icon: BookOpen },
  { value: "Paper", label: "Paper", labelZh: "学术论文", icon: FileText },
  { value: "Report", label: "Report", labelZh: "行业报告", icon: BookOpen },
  { value: "Gov Document", label: "Gov Document", labelZh: "监管法案", icon: Building2 },
  { value: "News", label: "News", labelZh: "行业资讯", icon: Newspaper },
];

const SOURCE_TYPE_COLORS: Record<SourceType, string> = {
  Paper: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  Report: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  "Gov Document": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800",
  News: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
};

const SOURCE_TYPE_ICONS: Record<SourceType, React.ElementType> = {
  Paper: FileText,
  Report: BookOpen,
  "Gov Document": Building2,
  News: Newspaper,
};

function ResourceCard({ resource, language }: { resource: Resource; language: string }) {
  const Icon = SOURCE_TYPE_ICONS[resource.sourceType];
  const colorClass = SOURCE_TYPE_COLORS[resource.sourceType];
  const href = resource.url ?? (resource.doi ? `https://doi.org/${resource.doi}` : null);
  const dateStr = new Date(resource.createdAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200">
      {/* Card header stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-primary/20" />

      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Type badge + date */}
        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
            <Icon className="h-3 w-3" />
            {resource.sourceType}
          </span>
          <span className="text-xs text-muted-foreground">{dateStr}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-3">
          {resource.title}
        </h3>

        {/* Authors */}
        {resource.authors.length > 0 && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {resource.authors.join("; ")}
          </p>
        )}

        {/* Abstract */}
        {resource.abstract && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
            {resource.abstract}
          </p>
        )}

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {resource.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground border border-border"
              >
                {tag}
              </span>
            ))}
            {resource.tags.length > 4 && (
              <span className="text-xs px-2 py-0.5 text-muted-foreground">+{resource.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer link */}
      {href && (
        <div className="border-t border-border px-5 py-3">
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            {resource.doi ? `DOI: ${resource.doi}` : language === "zh" ? "查看原文" : "View Source"}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

export default function AcademicResources() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<SourceType | "All">("All");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return MOCK_RESOURCES.filter((r) => {
      const matchType = selectedType === "All" || r.sourceType === selectedType;
      const matchTags =
        selectedTags.size === 0 || [...selectedTags].every((t) => r.tags.includes(t));
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.abstract ?? "").toLowerCase().includes(q) ||
        r.authors.some((a) => a.toLowerCase().includes(q)) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return matchType && matchTags && matchSearch;
    });
  }, [searchQuery, selectedType, selectedTags]);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
      {/* Page header */}
      <div className="space-y-2 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-widest">
          <ChevronRight className="h-3.5 w-3.5" />
          {t("Research Hub", "研究中心")}
        </div>
        <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Cutting-Edge Academic Research", "前沿学术资源库")}
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          {t(
            "A curated collection of global academic papers, industry reports, regulatory documents, and news on stablecoin research. Updated continuously by the ZIBS research team.",
            "汇集全球顶级学术论文、行业研究报告、监管法案原文及行业资讯，由浙大国际商学院稳定币课题组持续维护更新。"
          )}
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("Search by title, abstract, author or tag...", "按标题、摘要、作者或标签搜索...")}
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-56 shrink-0 space-y-6">
          {/* Resource Type filter */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("Resource Type", "资源类型")}
            </p>
            <div className="flex flex-col gap-1">
              {SOURCE_TYPES.map(({ value, label, labelZh, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setSelectedType(value)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left w-full ${
                    selectedType === value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {language === "zh" ? labelZh : label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("Filter by Tags", "按标签筛选")}
              </p>
              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="text-xs text-primary hover:underline"
                >
                  {t("Clear", "清除")}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
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
        </aside>

        {/* Results area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {language === "zh"
                ? `共 ${filtered.length} 条结果`
                : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
            </p>
            {(selectedType !== "All" || selectedTags.size > 0 || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedType("All");
                  setSelectedTags(new Set());
                  setSearchQuery("");
                }}
                className="text-xs text-primary hover:underline"
              >
                {t("Reset all filters", "重置所有筛选")}
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Search className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground font-medium">
                {t("No resources found", "未找到相关资源")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("Try adjusting your search or filters.", "请尝试调整搜索词或筛选条件。")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} language={language} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
