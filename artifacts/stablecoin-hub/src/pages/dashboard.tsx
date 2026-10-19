import { FridayDataNotice } from "@/components/friday-data-notice";
import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { FileText, Globe, BookOpen, BarChart3, Clock, ChevronRight, Tags, Users, Network, Layers3, ShieldCheck, ArrowRight, Activity } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, AreaChart, Area,
} from "recharts";
import { OFFICIAL_DOCUMENTS, PRIMARY_FRAMEWORKS } from "@/pages/regulatory";
import { sourceTypeLabel } from "@/lib/source-types";
import { compactUsd, useMarketSnapshot } from "@/pages/market-data-shared";

interface ApiResource {
  id: number;
  title: string;
  authors?: string[];
  sourceType?: string;
  tags?: string[];
  createdAt?: string;
}

interface ApiAuthor {
  id: number;
  name: string;
  resourceCount: number | string;
}

interface DashboardStats {
  total_resources: number;
  total_authors: number;
  total_regulatory_entries: number;
  countries_covered: number;
  top_tags: { name: string; count: number }[];
  by_type: { type: string; count: number }[];
  growth_trend: { month: string; count: number }[];
  top_authors: { name: string; count: number }[];
}

const CHART_COLOR = "hsl(var(--chart-1))";

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { snapshot: market, loading: marketLoading } = useMarketSnapshot();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentResources, setRecentResources] = useState<ApiResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [resourcesRes, authorsRes, regulatoryRes, countriesRes] = await Promise.all([
          fetch(`${apiBase()}/api/resources`),
          fetch(`${apiBase()}/api/authors`),
          fetch(`${apiBase()}/api/regulatory-entries`),
          fetch(`${apiBase()}/api/regulatory-entries/country-stats`),
        ]);

        const resourcesJson = resourcesRes.ok ? await resourcesRes.json() : [];
        const authorsJson = authorsRes.ok ? await authorsRes.json() : [];
        const regulatoryJson = regulatoryRes.ok ? await regulatoryRes.json() : [];
        const countriesJson = countriesRes.ok ? await countriesRes.json() : [];
        const resources: ApiResource[] = Array.isArray(resourcesJson) ? resourcesJson : [];
        const authors: ApiAuthor[] = Array.isArray(authorsJson) ? authorsJson : [];

        if (cancelled) return;

        const tagCounts = new Map<string, number>();
        const typeCounts = new Map<string, number>();
        const monthCounts = new Map<string, number>();

        for (const resource of resources) {
          for (const tag of resource.tags ?? []) {
            if (typeof tag === "string" && tag.trim()) {
              tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
            }
          }
          const sourceType = resource.sourceType ? sourceTypeLabel(resource.sourceType, language === "zh") : t("Unknown", "未分类");
          typeCounts.set(sourceType, (typeCounts.get(sourceType) ?? 0) + 1);

          if (resource.createdAt) {
            const monthKey = format(new Date(resource.createdAt), "MMM yyyy");
            monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
          }
        }

        const top_tags = [...tagCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));

        const by_type = [...typeCounts.entries()].map(([type, count]) => ({ type, count }));

        // Last 6 calendar months, oldest to newest, zero-filled.
        const now = new Date();
        const growth_trend = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          const key = format(d, "MMM yyyy");
          return { month: format(d, "MMM"), count: monthCounts.get(key) ?? 0 };
        });

        const top_authors = [...authors]
          .sort((a, b) => Number(b.resourceCount) - Number(a.resourceCount))
          .slice(0, 5)
          .map((a) => ({ name: a.name, count: Number(a.resourceCount) }));

        const recent = [...resources]
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
          )
          .slice(0, 5);

        setStats({
          total_resources: resources.length,
          total_authors: authors.length,
          total_regulatory_entries: Array.isArray(regulatoryJson) && regulatoryJson.length > 0
            ? regulatoryJson.length
            : OFFICIAL_DOCUMENTS.reduce((total, group) => total + group.documents.length, 0),
          countries_covered: Array.isArray(countriesJson) && countriesJson.length > 0
            ? countriesJson.length
            : PRIMARY_FRAMEWORKS.length,
          top_tags,
          by_type,
          growth_trend,
          top_authors,
        });
        setRecentResources(recent);
      } catch {
        if (!cancelled) {
          setStats(null);
          setRecentResources([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language, t]);

  const maxAuthorCount = useMemo(
    () => Math.max(1, ...(stats?.top_authors.map((a) => a.count) ?? [1])),
    [stats],
  );
  const marketHistory = useMemo(() => market?.history.slice(-185) ?? [], [market]);
  const leadingChain = market?.chains[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <FridayDataNotice />
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{t("Research and market intelligence", "研究与市场观察")}</p>
        <h1 className="text-3xl font-serif font-semibold text-foreground">
          {t("Stablecoin Data Dashboard", "稳定币数据仪表盘")}
        </h1>
        <p className="max-w-3xl editorial-copy">
          {t("Start with dated market observations, then move into the research, regulation and source material behind them.", "先看带日期的市场观测，再进入相关研究、监管进展与一手资料。")}
        </p>
      </div>

      {(marketLoading || market) && <section className="border-b border-border pb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{t("Market pulse", "市场脉搏")}</p><h2 className="mt-2 font-serif text-3xl font-semibold text-primary">{t("What matters now", "当前最重要的市场信号")}</h2></div>
          {market && <div className="text-right text-xs text-muted-foreground"><a href={market.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">DefiLlama</a><span className="mt-1 block">{t("Updated", "更新于")} · {new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(market.refreshedAt))}</span></div>}
        </div>
        {marketLoading ? <Skeleton className="mt-7 h-[430px] w-full" /> : market && <>
          <div className="mt-7 grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: t("Total stablecoin supply", "稳定币总供应量"), value: compactUsd(market.summary.totalUsd), note: t("Tracked across chains", "跨链汇总") },
              { label: t("30-day supply change", "30 日供应变化"), value: market.summary.change30dPct == null ? "—" : `${market.summary.change30dPct >= 0 ? "+" : ""}${market.summary.change30dPct.toFixed(1)}%`, note: t("Change in aggregate supply", "总供应规模变化"), change: market.summary.change30dPct },
              { label: t("Top-two share", "前两大项目供应占比"), value: `${market.summary.bellwetherDominancePct.toFixed(1)}%`, note: t("Share of tracked supply", "占追踪供应总量") },
              { label: t("Largest chain", "最大供应链"), value: leadingChain?.name ?? "—", note: leadingChain ? `${leadingChain.sharePct.toFixed(1)}% ${t("of global supply", "占全球供应")}` : "" },
            ].map((metric) => <article key={metric.label} className="bg-background p-5"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</p><strong className={`mt-4 block text-3xl font-semibold tabular-nums ${metric.change == null ? "text-primary" : metric.change >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{metric.value}</strong><p className="mt-2 text-xs text-muted-foreground">{metric.note}</p></article>)}
          </div>
          <div className="mt-9 grid gap-9 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,.6fr)]">
            <div className="min-w-0"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{t("Total supply trend", "总供应趋势")}</p><p className="mt-1 text-xs text-muted-foreground">{t("Latest six months", "最近六个月")}</p></div><Link href="/market-data" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">{t("Open market overview", "查看市场概览")}<ArrowRight className="h-4 w-4" /></Link></div><div className="mt-4 h-[260px] border-y border-border py-4"><ResponsiveContainer width="100%" height="100%"><AreaChart data={marketHistory}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" minTickGap={45} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: string) => value.slice(0, 7)} /><YAxis width={74} domain={["auto", "auto"]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => compactUsd(value)} /><Tooltip labelFormatter={(value: string) => value} formatter={(value: number) => [compactUsd(value), t("Supply", "供应量")]} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Area type="monotone" dataKey="totalUsd" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.08} strokeWidth={2.5} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></div>
            <div><div className="flex items-center justify-between"><p className="text-sm font-semibold">{t("Leading chains", "主要区块链")}</p><span className="text-xs text-muted-foreground">{t("Supply share", "供应份额")}</span></div><div className="mt-4 divide-y divide-border border-y border-border">{market.chains.slice(0, 5).map((chain, index) => <div key={chain.name} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-4"><span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><strong className="block truncate text-sm">{chain.name}</strong><div className="mt-2 h-1.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, chain.sharePct * 2)}%` }} /></div></div><div className="text-right"><strong className="block text-sm tabular-nums">{compactUsd(chain.totalUsd)}</strong><span className="text-xs tabular-nums text-muted-foreground">{chain.sharePct.toFixed(1)}%</span></div></div>)}</div><Link href="/market-data/on-chain" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">{t("Compare chains", "比较各链数据")}<ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </>}
      </section>}

      <div className="flex items-center gap-2 pt-2"><Activity className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t("Research coverage", "研究内容覆盖")}</h2></div>

      {loading ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t-4 border-primary/20 pt-5">
              <div className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <div>
                <Skeleton className="h-8 w-1/3 mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t("Total Resources", "总资源数"), value: stats.total_resources, note: t("Across all categories", "跨所有类别"), icon: BookOpen, color: "bg-chart-1", iconColor: "text-chart-1" },
            { label: t("Authors & Scholars", "作者与学者"), value: stats.total_authors, note: t("Contributing to the library", "收录于资源库"), icon: Users, color: "bg-chart-2", iconColor: "text-chart-2" },
            { label: t("Regulatory Entries", "监管条目"), value: stats.total_regulatory_entries, note: t("Official and policy records", "官方与政策记录"), icon: Globe, color: "bg-chart-3", iconColor: "text-chart-3" },
            { label: t("Countries Covered", "覆盖国家"), value: stats.countries_covered, note: t("With regulatory data", "包含监管数据"), icon: BarChart3, color: "bg-chart-4", iconColor: "text-chart-4" },
          ].map((metric) => <div key={metric.label} className="relative min-h-32 border-t-4 pt-5" style={{ borderTopColor: `hsl(var(--${metric.color.replace("bg-", "")}))` }}>
            <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-muted-foreground">{metric.label}</p><metric.icon className={`h-4 w-4 ${metric.iconColor}`} /></div>
            <p className="mt-6 text-3xl font-semibold tabular-nums text-foreground">{metric.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
          </div>)}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">{t("Failed to load statistics.", "加载统计数据失败。")}</div>
      )}

      <section className="border-y border-border py-9">
        <div className="grid gap-8 md:grid-cols-[1.2fr_repeat(3,0.6fr)] md:items-center">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Research in context", "研究进展")}</p><h2 className="mt-2 font-serif text-2xl font-semibold text-primary">{t("A connected view of mechanisms, risk and regulation", "把机制、风险与监管放在同一研究框架中")}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-foreground/68">{t("Move from the public dashboard into the underlying research, project taxonomy and verified regulatory sources.", "从公开数据概览进一步进入研究框架、稳定币分类与经核验的监管一手来源。")}</p></div>
          {[{ n: "55", label: t("atomic risks", "项原子风险"), icon: Network, href: "/research" }, { n: "4", label: t("core mechanisms", "类核心机制"), icon: Layers3, href: "/about-stablecoins/types" }, { n: String(stats?.countries_covered ?? 7), label: t("jurisdictions mapped", "个监管辖区"), icon: ShieldCheck, href: "/regulatory" }].map((item) => <Link key={item.label} href={item.href} className="group border-l-2 border-primary/25 pl-5"><item.icon className="h-5 w-5 text-primary" /><strong className="mt-3 block text-4xl font-semibold tabular-nums text-foreground group-hover:text-primary">{item.n}</strong><span className="mt-1 block text-sm text-foreground/62">{item.label}</span></Link>)}
        </div>
      </section>

      {!loading && stats && (
        <div className="grid grid-cols-1 gap-10 border-t border-border pt-8 lg:grid-cols-2">
          <section>
            <div className="pb-2">
              <h2 className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                {t("Resource Distribution by Type", "资源类型分布")}
              </h2>
            </div>
            <div>
              {stats.by_type.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.by_type} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="type" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLOR} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">{t("No data yet.", "暂无数据。")}</p>
              )}
            </div>
          </section>

          <section>
            <div className="pb-2">
              <h2 className="text-lg font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                {t("Resource Growth Trend (6 months)", "资源增长趋势（近6个月）")}
              </h2>
            </div>
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.growth_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t("Recently Added Resources", "最新添加的资源")}</h2>
            <Link href="/academic-resources" className="text-sm text-primary font-medium hover:underline flex items-center">
              {t("View All", "查看全部")} <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))
            ) : recentResources.length > 0 ? (
              recentResources.map((resource) => (
                <article key={resource.id} className="flex gap-4 py-5">
                    <div className="mt-1 h-fit bg-primary/8 p-2">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/academic-resources?id=${resource.id}`}>
                        <h4 className="text-base font-semibold hover:text-primary transition-colors cursor-pointer truncate">
                          {resource.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center rounded-sm bg-secondary/20 px-2 py-0.5 text-secondary-foreground font-medium uppercase tracking-wider">
                          {resource.sourceType ? sourceTypeLabel(resource.sourceType, language === "zh") : t("Resource", "资源")}
                        </span>
                        {Array.isArray(resource.authors) && resource.authors.length > 0 && (
                          <span className="truncate max-w-[200px]">{resource.authors.join(", ")}</span>
                        )}
                        {resource.createdAt && (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />{" "}
                            {format(new Date(resource.createdAt), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                    </div>
                </article>
              ))
            ) : (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                  <p>{t("No resources found.", "暂无资源。")}</p>
                </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!loading && stats && stats.top_authors.length > 0 && (
            <section className="border-t-2 border-primary/25 pt-5">
              <div className="pb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  {t("Author Statistics", "作者统计")}
                </h2>
              </div>
              <div className="space-y-3">
                {stats.top_authors.map((author) => (
                  <Link key={author.name} href={`/authors/${encodeURIComponent(author.name)}`}>
                    <div className="space-y-1 cursor-pointer group">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {author.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{author.count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary/70 group-hover:bg-primary transition-colors"
                          style={{ width: `${(author.count / maxAuthorCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {Array.isArray(stats?.top_tags) && stats.top_tags.length > 0 && (
            <section className="border-t-2 border-chart-2 pt-5">
              <div className="pb-3">
                <h2 className="text-lg font-semibold flex items-center">
                  <Tags className="h-4 w-4 mr-2 text-primary" />
                  {t("Popular Topics", "热门话题")}
                </h2>
              </div>
              <div>
                <div className="flex flex-wrap gap-2">
                  {stats.top_tags.map((tag) => (
                    <Link key={tag.name} href={`/academic-resources?tag=${encodeURIComponent(tag.name)}`}>
                      <span className="inline-flex items-center border-b border-border px-1 py-1 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
                        {tag.name}
                        <span className="ml-1 opacity-50 text-[10px]">({tag.count})</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
