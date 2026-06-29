import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { FileText, Globe, BookOpen, BarChart3, Clock, ChevronRight, Tags, Users } from "lucide-react";
import { format } from "date-fns";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from "recharts";

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
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentResources, setRecentResources] = useState<ApiResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [resourcesRes, authorsRes] = await Promise.all([
          fetch(`${apiBase()}/api/resources`),
          fetch(`${apiBase()}/api/authors`),
        ]);

        const resourcesJson = resourcesRes.ok ? await resourcesRes.json() : [];
        const authorsJson = authorsRes.ok ? await authorsRes.json() : [];
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
          const sourceType = resource.sourceType ?? "Unknown";
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
          total_regulatory_entries: 0,
          countries_covered: 0,
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
  }, []);

  const maxAuthorCount = useMemo(
    () => Math.max(1, ...(stats?.top_authors.map((a) => a.count) ?? [1])),
    [stats],
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-serif font-bold text-primary tracking-tight">
          {t("Platform Overview", "平台概览")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("Real-time statistics and recently added resources in the research hub.", "实时统计数据和研究中心最新添加的资源。")}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-primary/10 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("Total Resources", "总资源数")}
              </CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total_resources}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Across all categories", "跨所有类别")}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/10 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("Authors & Scholars", "作者与学者")}
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total_authors}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Contributing to the library", "收录于资源库")}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/10 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("Regulatory Entries", "监管条目")}
              </CardTitle>
              <Globe className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total_regulatory_entries}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("Global regulations", "全球监管动态")}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-primary/10 hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("Countries Covered", "覆盖国家")}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.countries_covered || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("With regulatory data", "包含监管数据")}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">{t("Failed to load statistics.", "加载统计数据失败。")}</div>
      )}

      {!loading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                {t("Resource Distribution by Type", "资源类型分布")}
              </CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                {t("Resource Growth Trend (6 months)", "资源增长趋势（近6个月）")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.growth_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={CHART_COLOR} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-semibold">{t("Recently Added Resources", "最新添加的资源")}</h3>
            <Link href="/academic-resources" className="text-sm text-primary font-medium hover:underline flex items-center">
              {t("View All", "查看全部")} <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))
            ) : recentResources.length > 0 ? (
              recentResources.map((resource) => (
                <Card key={resource.id} className="hover:border-primary/30 transition-colors shadow-sm">
                  <CardContent className="p-4 flex gap-4">
                    <div className="mt-1 bg-primary/5 p-2 rounded-md h-fit">
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
                          {(resource.sourceType ?? "Resource").replace(/_/g, " ")}
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
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <BookOpen className="h-8 w-8 mb-2 opacity-20" />
                  <p>{t("No resources found.", "暂无资源。")}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {!loading && stats && stats.top_authors.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-4 w-4 mr-2 text-primary" />
                  {t("Author Statistics", "作者统计")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
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
              </CardContent>
            </Card>
          )}

          {Array.isArray(stats?.top_tags) && stats.top_tags.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Tags className="h-4 w-4 mr-2 text-primary" />
                  {t("Popular Topics", "热门话题")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.top_tags.map((tag) => (
                    <Link key={tag.name} href={`/academic-resources?tag=${encodeURIComponent(tag.name)}`}>
                      <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/20 transition-colors cursor-pointer border border-secondary/20">
                        {tag.name}
                        <span className="ml-1 opacity-50 text-[10px]">({tag.count})</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
