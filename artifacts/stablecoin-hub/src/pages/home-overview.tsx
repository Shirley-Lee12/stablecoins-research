import React from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import { BRAND } from "@/lib/brand";
import {
  BookOpen, Globe, ChevronRight, Database, Microscope,
  Target, Lightbulb, CheckCircle2, GraduationCap, Radar, Shapes,
  Waypoints, ExternalLink, Workflow, UsersRound
} from "lucide-react";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { PUBLIC_SUPPORT_LINE, TAXONOMY_BOUNDARY, QUESTIONS, EVIDENCE_KINDS, EVIDENCE_LINKS } from "@/data/home-research";
import { HubText, HubCite, HubLink, HubBoundary, ResearchRecord, FutureResearch, NavigationFigure, ResearchSourceNote } from "@/components/home-research-ui";

/* ─────── nav section cards ─────── */
const sections = [
  { href: "/agentic-payments", icon: Workflow, en: "Agentic Payments", zh: "智能体支付", descEn: "Protocols, mechanisms, applications, risks and evidence.", descZh: "协议、机制、应用、风险与来源证据。" },
  { href: "/experts", icon: UsersRound, en: "Researchers & Institutions", zh: "研究者与机构", descEn: "Verified public-directory researcher projections.", descZh: "经核验的公开研究者目录。" },
  { href: "/about-stablecoins", icon: BookOpen, en: "About Stablecoins", zh: "关于稳定币", descEn: "Mechanisms, taxonomy, and foundational concepts.", descZh: "稳定币基本概念、运作机制与分类体系。" },
  { href: "/about-stablecoins/types", icon: Shapes, en: "Stablecoin Types", zh: "稳定币分类", descEn: "Compare mechanisms, projects, status, and market scale.", descZh: "比较不同机制、稳定币项目、运行状态与市场规模。" },
  { href: "/about-stablecoins/applications", icon: Waypoints, en: "Applications", zh: "稳定币应用", descEn: "Payments, settlement, savings, trading, and regional patterns.", descZh: "支付、结算、储值、交易及区域应用特征。" },
  { href: "/research", icon: Microscope, en: "Our Research", zh: "我们的研究", descEn: "The full-lifecycle risk framework, accepted paper and future directions.", descZh: "全生命周期风险框架、已接收论文与未来研究方向。" },
  { href: "/academic-resources", icon: Database, en: "Resources", zh: "资源库", descEn: "Curated papers, reports, and data sources.", descZh: "精选学术论文、研究报告及相关数据资源。" },
  { href: "/regulatory", icon: Globe, en: "Regulatory Status", zh: "监管现状", descEn: "Cross-jurisdiction comparison, official documents, and policy status.", descZh: "跨辖区监管比较、官方文件与政策实施状态。" },
];

/* ─────── team ─────── */
const team = [
  { initials: "XL", nameEn: "Xueli Li", nameZh: "李雪丽", roleEn: "Project lead", roleZh: "课题组组长", areaEn: "ZIBS · iMF", areaZh: "ZIBS · 金融科技硕士" },
  { initials: "YC", nameEn: "Yang Chen", nameZh: "杨晨", roleEn: "Research group member", roleZh: "课题组成员", areaEn: "ZIBS · MBA", areaZh: "ZIBS · MBA" },
  { initials: "ZC", nameEn: "Tsanhua Chou", nameZh: "周赞华", roleEn: "Research group member", roleZh: "课题组成员", areaEn: "ZIBS · iMF", areaZh: "ZIBS · 金融科技硕士" },
  { initials: "HJ", nameEn: "Hui Jin", nameZh: "金辉", roleEn: "Research group member", roleZh: "课题组成员", areaEn: "ZIBS · MBA", areaZh: "ZIBS · MBA" },
  { initials: "YL", nameEn: "Yitong Lin", nameZh: "林奕彤", roleEn: "Research group member", roleZh: "课题组成员", areaEn: "University of Colorado Denver", areaZh: "科罗拉多大学丹佛分校" },
];

export default function HomeOverview() {
  const { t, language } = useLanguage();

  return (
    <div data-home-research="home" className="max-w-5xl mx-auto w-full min-w-0 space-y-14 pb-12">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "hub-introduction", label: t("Introduction", "平台概览") },
        { id: "hub-mission", label: t("Mission", "研究使命") },
        { id: "hub-work", label: t("Our work", "研究成果") },
        { id: "hub-agenda", label: t("Agenda", "研究计划") },
        { id: "hub-team", label: t("Team", "团队成员") },
        { id: "hub-modules", label: t("Platform", "平台功能") },
      ]} />

      {/* ── HERO ── */}
      <div id="hub-introduction" className="relative border-l-4 border-primary py-7 pl-7 md:py-10 md:pl-12">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            {t("Zhejiang University · AIF · Academic Research", "浙江大学 · AIF · 学术研究")}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary leading-tight mb-4">
            {t(BRAND.name.en, BRAND.name.zh)}
          </h1>
          <p className="mb-6 max-w-3xl text-lg leading-8 text-foreground/78">
            {t(
              "An academic research platform exploring the economics, technology, regulation, and global impact of stablecoins.",
              "聚焦稳定币的经济、技术、监管与全球影响，提供研究成果、学术资源与市场数据。"
            )}
          </p>
          <p className="mb-6 text-sm font-medium text-primary"><HubText text={PUBLIC_SUPPORT_LINE} /><HubCite ids={["SRC-HR-02", "SRC-HR-03"]} /></p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-primary">
            {[
              t("Stablecoin Economics", "稳定币经济学"),
              t("DeFi & Monetary Policy", "DeFi与货币政策"),
              t("Regulatory Frameworks", "监管框架"),
              t("CBDC Research", "央行数字货币研究"),
              t("Financial Inclusion", "普惠金融"),
            ].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-2 before:h-1.5 before:w-1.5 before:bg-chart-2">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── ABOUT / MISSION ── */}
      <section id="hub-mission" className="editorial-section space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("About the Hub", "关于平台")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-serif font-semibold text-lg text-primary">{t("Our Mission", "研究使命")}</h3>
            <p className="editorial-copy">
              {t(
                "We bridge academic research and practical policy-making in the rapidly evolving stablecoin landscape. Our mission is to produce high-quality, evidence-based research that informs regulators, central banks, financial institutions, and the broader public on the opportunities and risks associated with stablecoins.",
                "我们致力于在快速演变的稳定币领域架起学术研究与实际政策制定之间的桥梁。我们的使命是产出高质量、以证据为基础的研究成果，为监管机构、中央银行、金融机构及广大公众了解稳定币相关机遇与风险提供参考。"
              )}
            </p>
          </div>
          <div className="space-y-3">
            <h3 className="font-serif font-semibold text-lg text-primary">{t("Research Focus", "研究方向")}</h3>
            <p className="editorial-copy">
              {t(
                "Our core research areas span stablecoin monetary economics, systemic risk, decentralized finance (DeFi), cross-border payment infrastructure, CBDC–stablecoin interplay, global regulatory frameworks, and financial inclusion in emerging economies.",
                "我们的核心研究领域涵盖稳定币货币经济学、系统性风险、去中心化金融（DeFi）、跨境支付基础设施、央行数字货币与稳定币互动、全球监管框架以及新兴经济体的普惠金融。"
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ── ACCOMPLISHMENTS ── */}
      <section id="hub-work" className="editorial-section space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("What We Have Done", "我们做了什么")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div data-home-current-study className="relative space-y-0 border-l-2 border-primary/25 pl-7">
          {["risk-framework", "conference-paper"].map((id) => (
            <div key={id} className="relative grid gap-2 border-b border-border py-5 sm:grid-cols-[5rem_1fr] sm:gap-5">
              <CheckCircle2 className="absolute -left-[2.25rem] top-6 h-4 w-4 bg-background text-primary" />
              <span className="text-sm font-semibold tabular-nums text-primary">2026</span>
              <ResearchRecord id={id} editorial />
            </div>
          ))}
        </div>
        <HubBoundary text={TAXONOMY_BOUNDARY} />
      </section>

      {/* ── RESEARCH AGENDA ── */}
      <section id="hub-agenda" className="editorial-section space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("Research Agenda", "研究计划")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <FutureResearch editorial />
        <HubLink href="/research#future-research" text={["Read the research directions", "查看未来研究方向"]} />
      </section>

      {/* ── TEAM ── */}
      <section id="hub-team" className="editorial-section space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("Our Team", "团队成员")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Academic adviser", "课题指导")}</p><p className="mt-1 text-lg font-semibold">{t("Professor Ruidong Zhang", "张瑞东教授")}</p><p className="mt-1 text-sm text-foreground/62">{t(BRAND.institution.en, BRAND.institution.zh)}</p></div>
          <a href="https://zibs.zju.edu.cn/2024/0529/c81819a2924735/page.htm" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{t("Faculty profile", "教师主页")}<ExternalLink className="h-4 w-4" /></a>
        </div>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member) => (
            <div key={member.initials} className="flex items-start gap-4 border-b border-border py-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10 font-serif text-sm font-bold text-primary">
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
      </section>

      {/* ── PLATFORM MODULES ── */}
      <section id="hub-modules" className="editorial-section space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
            {t("Platform Modules", "功能模块")}
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="group h-full cursor-pointer border-t-2 border-primary/25 pt-5 transition-colors hover:border-primary">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center bg-primary/8">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="flex items-center justify-between text-base font-semibold transition-colors group-hover:text-primary">
                    {t(s.en, s.zh)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-foreground/72">{t(s.descEn, s.descZh)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <details className="border-t border-border pt-5">
        <summary className="cursor-pointer font-serif text-lg font-semibold text-primary">{t("Research navigation and evidence", "研究导航与证据")}</summary>
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">{QUESTIONS.map(q => <div key={q.href}><HubLink href={q.href} text={q.title} /><p className="text-sm leading-7 text-muted-foreground"><HubText text={q.detail} /></p></div>)}</div>
          <NavigationFigure />
          <p className="text-sm leading-7">{EVIDENCE_KINDS.map(kind => <span key={kind[0]} className="mr-4"><HubText text={kind} /></span>)}</p>
          <p className="text-sm leading-7">{t("Important changing facts retain their sources and verification dates. UNKNOWN is not filled with speculation.", "重要动态事实保留来源和核验日期。UNKNOWN 不用推测补齐。")}</p>
          <div className="flex flex-wrap gap-4">{EVIDENCE_LINKS.map(item => <HubLink key={item.href} href={item.href} text={item.title} />)}</div>
        </div>
      </details>
      <ResearchSourceNote />

      {/* ── FOOTER ── */}
      <div className="border-t border-border pt-8 pb-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">{t(BRAND.sponsorship.en, BRAND.sponsorship.zh)}</p>
            <a href={BRAND.institutionUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary hover:underline">{t("AIF official website", "AIF 官网")}<ExternalLink className="h-3 w-3" /></a>
          </div>
          <p className="text-xs text-muted-foreground">{t(`© ${new Date().getFullYear()} ${BRAND.name.en}`, `© ${new Date().getFullYear()} ${BRAND.name.zh}`)}</p>
        </div>
      </div>

    </div>
  );
}
