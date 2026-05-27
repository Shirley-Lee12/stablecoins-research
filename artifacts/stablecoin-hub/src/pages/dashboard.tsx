import React from "react";
import { useLanguage } from "@/lib/language-context";
import { useGetStats, useListRecentResources } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { FileText, Globe, BookOpen, BarChart3, Clock, ChevronRight, Tags } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: recentResources, isLoading: recentLoading } = useListRecentResources({ limit: 5 });

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

      {statsLoading ? (
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
                {t("Research Papers", "研究论文")}
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total_research_papers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("From ZIBS researchers", "来自ZIBS研究人员")}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-semibold">{t("Recently Added Resources", "最新添加的资源")}</h3>
            <Link href="/academic-resources" className="text-sm text-primary font-medium hover:underline flex items-center">
              {t("View All", "查看全部")} <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))
            ) : recentResources?.length ? (
              recentResources.map((resource) => (
                <Card key={resource.id} className="hover:border-primary/30 transition-colors shadow-sm">
                  <CardContent className="p-4 flex gap-4">
                    <div className="mt-1 bg-primary/5 p-2 rounded-md h-fit">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/academic-resources?id=${resource.id}`}>
                        <h4 className="text-base font-semibold hover:text-primary transition-colors cursor-pointer truncate">
                          {language === 'zh' && resource.title_zh ? resource.title_zh : resource.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center rounded-sm bg-secondary/20 px-2 py-0.5 text-secondary-foreground font-medium uppercase tracking-wider">
                          {resource.resource_type.replace('_', ' ')}
                        </span>
                        {resource.authors && resource.authors.length > 0 && (
                          <span className="truncate max-w-[200px]">{resource.authors.join(', ')}</span>
                        )}
                        <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {format(new Date(resource.created_at), "MMM d, yyyy")}</span>
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
          <Card className="shadow-sm bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-lg text-primary-foreground/90">{t("Quick Actions", "快速操作")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/research" className="flex items-center justify-between p-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-md transition-colors text-sm font-medium cursor-pointer">
                <span className="flex items-center"><FileText className="h-4 w-4 mr-2" /> {t("Submit Research Paper", "提交研究论文")}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
              <Link href="/academic-resources" className="flex items-center justify-between p-3 bg-primary-foreground/10 hover:bg-primary-foreground/20 rounded-md transition-colors text-sm font-medium cursor-pointer">
                <span className="flex items-center"><BookOpen className="h-4 w-4 mr-2" /> {t("Add Resource via AI", "通过AI提取添加资源")}</span>
                <ChevronRight className="h-4 w-4 opacity-50" />
              </Link>
            </CardContent>
          </Card>

          {stats?.top_tags && stats.top_tags.length > 0 && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Tags className="h-4 w-4 mr-2 text-primary" /> 
                  {t("Popular Topics", "热门话题")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.top_tags.map(tag => (
                    <Link key={tag.name} href={`/academic-resources?tag=${encodeURIComponent(tag.name)}`}>
                      <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground hover:bg-secondary/20 transition-colors cursor-pointer border border-secondary/20">
                        {language === 'zh' && tag.name_zh ? tag.name_zh : tag.name}
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
