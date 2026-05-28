import React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { useGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, FileText, Globe, Users, BarChart3, LineChart, ChevronRight, Database, Microscope } from "lucide-react";

const sections = [
  {
    href: "/about-stablecoins",
    icon: BookOpen,
    en: "About Stablecoins",
    zh: "关于稳定币",
    descEn: "Foundational concepts, mechanisms, and taxonomy of stablecoins.",
    descZh: "稳定币的基本概念、运作机制与分类体系。",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    href: "/research",
    icon: Microscope,
    en: "Our Research",
    zh: "我们的研究",
    descEn: "Original papers and working papers from ZIBS researchers.",
    descZh: "ZIBS研究团队发表的原创论文与工作论文。",
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    href: "/academic-resources",
    icon: Database,
    en: "Resources",
    zh: "资源库",
    descEn: "Curated papers, reports, and data sources on stablecoin research.",
    descZh: "精选学术论文、研究报告及相关数据资源。",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    href: "/regulatory",
    icon: Globe,
    en: "Regulatory Timeline",
    zh: "监管动态",
    descEn: "Global regulatory developments and policy milestones for stablecoins.",
    descZh: "全球稳定币监管动态与政策里程碑。",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/30",
  },
  {
    href: "/experts",
    icon: Users,
    en: "Experts & Scholars",
    zh: "专家学者",
    descEn: "Directory of researchers and scholars in the stablecoin field.",
    descZh: "稳定币领域研究人员与学者名录。",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
  },
  {
    href: "/market-data",
    icon: LineChart,
    en: "Market Data",
    zh: "市场数据",
    descEn: "Real-time and historical stablecoin market indicators.",
    descZh: "稳定币实时与历史市场指标数据。",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
  },
];

export default function HomeOverview() {
  const { t } = useLanguage();
  const { data: stats, isLoading } = useGetStats();

  return (
    <div className="max-w-7xl mx-auto space-y-12">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-8 py-12 md:px-14 md:py-16">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            {t("Zhejiang University · ZIBS", "浙江大学 · 国际联合商学院")}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary leading-tight mb-4">
            {t("ZIBS Stablecoins Research Hub", "稳定币研究中心")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
            {t(
              "An interdisciplinary research platform advancing scholarship on stablecoin economics, technology, and regulation — hosted by the Zhejiang University International Business School (ZIBS).",
              "浙江大学国际联合商学院（ZIBS）主办的跨学科研究平台，致力于推动稳定币经济学、技术与监管领域的前沿研究。"
            )}
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
            {[
              t("Stablecoin Economics", "稳定币经济学"),
              t("DeFi & Monetary Policy", "DeFi与货币政策"),
              t("Regulatory Frameworks", "监管框架"),
              t("CBDC Research", "央行数字货币研究"),
            ].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t("Platform Statistics", "平台数据")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="pt-5">
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))
            : [
                { label: t("Resources", "资源"), value: stats?.total_resources ?? 0, icon: Database },
                { label: t("Research Papers", "研究论文"), value: stats?.total_research_papers ?? 0, icon: FileText },
                { label: t("Regulatory Entries", "监管条目"), value: stats?.total_regulatory_entries ?? 0, icon: Globe },
                { label: t("Resource Types", "资源类型"), value: stats?.resources_by_type?.length ?? 0, icon: BarChart3 },
              ].map(({ label, value, icon: Icon }) => (
                <Card key={label} className="border-border/50 hover:border-primary/20 transition-colors">
                  <CardContent className="pt-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold font-serif text-primary">{value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                      </div>
                      <Icon className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Section Cards */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t("Research Areas", "研究板块")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="group h-full cursor-pointer border-border/50 hover:border-primary/20 hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors flex items-center justify-between">
                    {t(s.en, s.zh)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(s.descEn, s.descZh)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Affiliation */}
      <div className="border-t border-border pt-8 pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("Zhejiang University International Business School (ZIBS)", "浙江大学国际联合商学院（ZIBS）")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("Haining, Zhejiang, China · zju.edu.cn", "中国浙江海宁 · zju.edu.cn")}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t("© 2025 ZIBS Stablecoin Research Hub. All rights reserved.", "© 2025 浙大ZIBS稳定币研究中心 版权所有。")}</p>
        </div>
      </div>
    </div>
  );
}
