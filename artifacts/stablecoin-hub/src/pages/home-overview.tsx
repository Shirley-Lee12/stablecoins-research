import React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen, Globe, Users, ChevronRight, Database, Microscope,
  Target, Lightbulb, CheckCircle2, CalendarClock, GraduationCap, FlaskConical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

/* ─────── nav section cards ─────── */
const sections = [
  { href: "/about-stablecoins", icon: BookOpen, en: "About Stablecoins", zh: "关于稳定币", descEn: "Mechanisms, taxonomy, and foundational concepts.", descZh: "稳定币基本概念、运作机制与分类体系。" },
  { href: "/research", icon: Microscope, en: "Our Research", zh: "我们的研究", descEn: "Working papers and publications from ZIBS researchers.", descZh: "ZIBS研究团队发表的原创论文与工作论文。" },
  { href: "/academic-resources", icon: Database, en: "Resources", zh: "资源库", descEn: "Curated papers, reports, and data sources.", descZh: "精选学术论文、研究报告及相关数据资源。" },
  { href: "/regulatory", icon: Globe, en: "Regulatory Timeline", zh: "监管动态", descEn: "Global regulatory developments and policy milestones.", descZh: "全球稳定币监管动态与政策里程碑。" },
  { href: "/experts", icon: Users, en: "Experts & Scholars", zh: "专家学者", descEn: "Directory of researchers in the stablecoin field.", descZh: "稳定币领域研究人员与学者名录。" },
];

/* ─────── accomplishments ─────── */
const accomplished = {
  en: [
    { year: "2024", text: "Launched the ZIBS Stablecoin Research Hub as part of the FinTech initiative at Zhejiang University ZIBS." },
    { year: "2024", text: "Published foundational white paper on stablecoin taxonomy and risk classification frameworks." },
    { year: "2024", text: "Compiled a curated database of 200+ academic resources and regulatory milestones across 30 jurisdictions." },
    { year: "2025", text: "Hosted the inaugural ZIBS Stablecoin Symposium, bringing together academic and industry experts." },
    { year: "2025", text: "Established research partnerships with three leading international universities and two policy think-tanks." },
  ],
  zh: [
    { year: "2024", text: "作为浙江大学ZIBS金融科技项目的一部分，正式启动ZIBS稳定币研究中心。" },
    { year: "2024", text: "发布稳定币分类与风险识别框架基础白皮书。" },
    { year: "2024", text: "整理汇编涵盖30个司法管辖区的200余篇学术资源与监管里程碑数据库。" },
    { year: "2025", text: "举办首届ZIBS稳定币论坛，汇聚学术界与业界顶尖专家。" },
    { year: "2025", text: "与三所国际知名大学及两家政策智库建立研究合作关系。" },
  ],
};

/* ─────── research agenda ─────── */
const agenda = {
  en: [
    { icon: FlaskConical, title: "Systemic Risk Modeling", desc: "Developing quantitative models to assess contagion risks in stablecoin ecosystems and their spillover effects on traditional financial markets." },
    { icon: Globe, title: "Cross-border Regulatory Mapping", desc: "Producing a comprehensive, live regulatory atlas comparing stablecoin frameworks across the EU, US, China, Singapore, and emerging markets." },
    { icon: Lightbulb, title: "CBDC & Stablecoin Interoperability", desc: "Investigating technical and legal pathways for CBDC–stablecoin coexistence and cross-border settlement mechanisms." },
    { icon: GraduationCap, title: "Financial Inclusion Research", desc: "Studying how stablecoins can expand access to financial services in underbanked regions across Southeast Asia and Africa." },
    { icon: Target, title: "Policy Recommendations", desc: "Translating research findings into evidence-based policy briefs for Chinese regulators, central banks, and international bodies." },
  ],
  zh: [
    { icon: FlaskConical, title: "系统性风险建模", desc: "构建量化模型，评估稳定币生态系统中的传染性风险及其对传统金融市场的溢出效应。" },
    { icon: Globe, title: "跨境监管图谱", desc: "制作综合性动态监管图谱，对比欧盟、美国、中国、新加坡及新兴市场的稳定币监管框架。" },
    { icon: Lightbulb, title: "央行数字货币与稳定币互操作性", desc: "探索央行数字货币与稳定币共存的技术与法律路径，以及跨境结算机制。" },
    { icon: GraduationCap, title: "普惠金融研究", desc: "研究稳定币如何扩大东南亚及非洲欠发达地区金融服务的可及性。" },
    { icon: Target, title: "政策建议", desc: "将研究成果转化为面向中国监管机构、央行及国际机构的循证政策简报。" },
  ],
};

/* ─────── team ─────── */
const team = [
  { initials: "YL", nameEn: "Prof. Yang Liu", nameZh: "刘阳 教授", roleEn: "Director, ZIBS Stablecoin Research Hub", roleZh: "浙大ZIBS稳定币研究中心主任", areaEn: "Monetary Economics · Digital Finance", areaZh: "货币经济学 · 数字金融" },
  { initials: "WC", nameEn: "Dr. Wei Chen", nameZh: "陈威 博士", roleEn: "Senior Research Fellow", roleZh: "高级研究员", areaEn: "DeFi · Smart Contract Law", areaZh: "去中心化金融 · 智能合约法" },
  { initials: "MZ", nameEn: "Dr. Mei Zhang", nameZh: "张梅 博士", roleEn: "Research Fellow", roleZh: "研究员", areaEn: "Regulatory Frameworks · CBDC", areaZh: "监管框架 · 央行数字货币" },
  { initials: "JW", nameEn: "Dr. James Walsh", nameZh: "詹姆斯·沃尔什 博士", roleEn: "Visiting Scholar", roleZh: "访问学者", areaEn: "Systemic Risk · Financial Stability", areaZh: "系统性风险 · 金融稳定" },
  { initials: "LX", nameEn: "Lin Xu", nameZh: "徐琳", roleEn: "PhD Researcher", roleZh: "博士研究生", areaEn: "Stablecoin Adoption · Fintech Policy", areaZh: "稳定币普及 · 金融科技政策" },
  { initials: "RK", nameEn: "Riya Kumar", nameZh: "里亚·库马尔", roleEn: "Research Assistant", roleZh: "研究助理", areaEn: "Quantitative Finance · Data Analysis", areaZh: "量化金融 · 数据分析" },
];

export default function HomeOverview() {
  const { t, language } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto space-y-14 pb-12">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/8 via-background to-primary/3 px-8 py-12 md:px-14 md:py-16">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/6 px-3 py-1 text-xs font-medium text-primary">
            {t("Zhejiang University · ZIBS · FinTech Research", "浙江大学 · 国际联合商学院 · 金融科技研究")}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary leading-tight mb-4">
            {t("ZIBS Stablecoins Research Hub", "浙大ZIBS稳定币研究中心")}
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-6 max-w-2xl">
            {t(
              "An interdisciplinary research center dedicated to advancing rigorous scholarship on the economics, technology, regulation, and global impact of stablecoins — hosted by the Zhejiang University International Business School (ZIBS).",
              "浙江大学国际联合商学院（ZIBS）主办的跨学科研究中心，致力于对稳定币的经济学、技术、监管及全球影响开展系统性前沿研究。"
            )}
          </p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            {[
              t("Stablecoin Economics", "稳定币经济学"),
              t("DeFi & Monetary Policy", "DeFi与货币政策"),
              t("Regulatory Frameworks", "监管框架"),
              t("CBDC Research", "央行数字货币研究"),
              t("Financial Inclusion", "普惠金融"),
            ].map((tag) => (
              <span key={tag} className="inline-flex items-center rounded-full bg-primary/8 border border-primary/12 px-3 py-1 text-xs text-primary/80">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ABOUT / MISSION ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("About the Hub", "关于研究中心")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-serif font-semibold text-lg text-primary">{t("Our Mission", "研究使命")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "We bridge academic research and practical policy-making in the rapidly evolving stablecoin landscape. Our mission is to produce high-quality, evidence-based research that informs regulators, central banks, financial institutions, and the broader public on the opportunities and risks associated with stablecoins.",
                "我们致力于在快速演变的稳定币领域架起学术研究与实际政策制定之间的桥梁。我们的使命是产出高质量、以证据为基础的研究成果，为监管机构、中央银行、金融机构及广大公众了解稳定币相关机遇与风险提供参考。"
              )}
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-serif font-semibold text-lg text-primary">{t("Research Focus", "研究方向")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Our core research areas span stablecoin monetary economics, systemic risk, decentralized finance (DeFi), cross-border payment infrastructure, CBDC–stablecoin interplay, global regulatory frameworks, and financial inclusion in emerging economies.",
                "我们的核心研究领域涵盖稳定币货币经济学、系统性风险、去中心化金融（DeFi）、跨境支付基础设施、央行数字货币与稳定币互动、全球监管框架以及新兴经济体的普惠金融。"
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── ACCOMPLISHMENTS ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("What We Have Done", "我们做了什么")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-3">
          {(language === "zh" ? accomplished.zh : accomplished.en).map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 transition-colors">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">{item.year}</Badge>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESEARCH AGENDA ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("Research Agenda", "研究计划")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(language === "zh" ? agenda.zh : agenda.en).map((item, i) => (
            <Card key={i} className="border-border/60 hover:border-primary/20 hover:shadow-sm transition-all">
              <CardHeader className="pb-2 pt-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("Our Team", "团队成员")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {team.map((member) => (
            <div key={member.initials} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card hover:border-primary/20 hover:shadow-sm transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-serif font-bold text-sm">
                {member.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug truncate">{language === "zh" ? member.nameZh : member.nameEn}</p>
                <p className="text-xs text-primary/80 mt-0.5 leading-snug">{language === "zh" ? member.roleZh : member.roleEn}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{language === "zh" ? member.areaZh : member.areaEn}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center pt-2">
          <Link href="/experts">
            <span className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer font-medium">
              {t("View full Experts & Scholars directory", "查看完整专家学者名录")}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* ── PLATFORM MODULES ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("Platform Modules", "功能模块")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <Card className="group h-full cursor-pointer border-border/60 hover:border-primary/20 hover:shadow-md transition-all">
                <CardHeader className="pb-2 pt-5">
                  <div className="h-9 w-9 rounded-lg bg-primary/8 flex items-center justify-center mb-3">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors flex items-center justify-between">
                    {t(s.en, s.zh)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t(s.descEn, s.descZh)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="border-t border-border pt-8 pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{t("Zhejiang University International Business School (ZIBS)", "浙江大学国际联合商学院（ZIBS）")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("Haining, Zhejiang, China · intl.zju.edu.cn/zibs", "中国浙江海宁 · intl.zju.edu.cn/zibs")}</p>
          </div>
          <p className="text-xs text-muted-foreground">{t("© 2025 ZIBS Stablecoin Research Hub", "© 2025 浙大ZIBS稳定币研究中心")}</p>
        </div>
      </div>

    </div>
  );
}
