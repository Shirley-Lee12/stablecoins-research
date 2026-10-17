import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Globe2,
  Workflow,
  BarChart3,
  Microscope,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { BRAND } from "@/lib/brand";
import {
  QUESTIONS,
  PUBLIC_SUPPORT_LINE,
  EVIDENCE_KINDS,
  EVIDENCE_LINKS,
  TAXONOMY_BOUNDARY,
} from "@/data/home-research";
import {
  HubText,
  HubSection,
  HubBoundary,
  HubLink,
  HubCite,
  FutureResearch,
  ResearchRecord,
  NavigationFigure,
  ResearchSourceNote,
} from "@/components/home-research-ui";

const icons = [BookOpen, Globe2, Workflow, BarChart3, Microscope];
export default function HomeOverview() {
  const { t, language } = useLanguage();
  return (
    <div
      data-home-research="home"
      className="mx-auto w-full min-w-0 max-w-[1280px] px-1 pb-8 sm:px-4"
    >
      <header id="hero" className="pb-9 pt-3 sm:pb-12">
        <p className="mb-4 text-xs font-semibold tracking-wider text-primary">
          {t(
            "Zhejiang University · AIF · Stablecoin Research",
            "浙江大学 · AIF · 稳定币研究",
          )}
        </p>
        <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight tracking-tight text-primary sm:text-5xl">
          {t(BRAND.name.en, BRAND.name.zh)}
        </h1>
        {language === "zh" && (
          <p className="mt-2 text-sm font-medium tracking-wide text-primary">
            {t(BRAND.name.en, BRAND.name.en)}
          </p>
        )}
        <p className="mt-5 max-w-4xl text-lg leading-8 text-muted-foreground">
          {t(
            "Understand stablecoins through mechanisms, live products, regulation, market evidence, risk transmission and emerging payment infrastructure.",
            "从稳定机制、真实产品和监管规则，到市场数据、风险传导与新型支付基础设施，用可核验的证据理解稳定币正在如何连接传统金融与数字资产世界。",
          )}
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          <HubText text={PUBLIC_SUPPORT_LINE} />
          <HubCite ids={["SRC-HR-02", "SRC-HR-03"]} />
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/about-stablecoins"
            className="inline-flex min-h-11 items-center gap-3 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("Start with stablecoins", "从稳定币开始")}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/research"
            className="inline-flex min-h-11 items-center gap-3 rounded-md border border-primary/40 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2"
          >
            {t("Explore our research", "查看我们的研究")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <HubSection
        id="question-entry"
        number="01"
        title={["Start with a question", "从一个问题开始"]}
      >
        <div className="divide-y divide-border border-y border-border">
          {QUESTIONS.map((q, i) => {
            const Icon = icons[i];
            return (
              <Link
                key={q.href}
                href={q.href}
                className="group grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)_1rem] items-start gap-4 py-5 transition-colors hover:bg-primary/3 focus-visible:outline focus-visible:outline-2 sm:grid-cols-[2rem_minmax(0,0.95fr)_minmax(0,1fr)_1rem] sm:items-center"
              >
                <Icon className="mt-1 text-primary" size={21} />
                <h3 className="text-base font-semibold leading-7 group-hover:text-primary sm:text-lg">
                  <HubText text={q.title} />
                </h3>
                <p className="col-start-2 row-start-2 min-w-0 text-sm leading-7 text-muted-foreground sm:col-start-auto sm:row-start-auto">
                  <HubText text={q.detail} />
                </p>
                <ArrowRight
                  className="col-start-3 row-start-1 mt-1 text-primary transition-transform group-hover:translate-x-1 sm:col-start-auto sm:row-start-auto"
                  size={16}
                />
              </Link>
            );
          })}
        </div>
        <NavigationFigure />
      </HubSection>

      <HubSection
        id="current-research"
        number="02"
        title={["Completed research · Current study", "已完成研究 · 当前研究"]}
      >
        <p className="mb-6 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "One current study: the framework and its accepted conference paper.",
            "同一项当前研究：风险框架及其已接收的会议论文。",
          )}
        </p>
        <div data-home-current-study className="grid gap-8 md:grid-cols-2">
          {["risk-framework", "conference-paper"].map((id) => (
            <ResearchRecord key={id} id={id} compact />
          ))}
        </div>
        <HubBoundary text={TAXONOMY_BOUNDARY} />
      </HubSection>

      <HubSection
        id="research-status"
        number="03"
        title={["Future research", "未来研究"]}
        intro={[
          "Potential extensions of the conference framework.",
          "会议框架的潜在后续延展。",
        ]}
      >
        <FutureResearch compact />
        <div className="mt-5">
          <HubLink
            href="/research#future-research"
            text={["Read the research directions", "查看未来研究方向"]}
          />
        </div>
      </HubSection>

      <HubSection
        id="evidence-principles"
        number="04"
        title={[
          "Data and evidence, not a stack of conclusions",
          "数据与证据，而不是结论堆叠",
        ]}
      >
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {EVIDENCE_KINDS.map((kind, i) => (
            <span
              key={kind[0]}
              className="inline-flex items-baseline gap-2 text-sm"
            >
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <HubText text={kind} />
            </span>
          ))}
        </div>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Important changing facts retain their sources and verification dates. UNKNOWN is not filled with speculation.",
            "重要动态事实保留来源和核验日期。UNKNOWN 不用推测补齐。",
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          {EVIDENCE_LINKS.map((item) => (
            <HubLink key={item.href} href={item.href} text={item.title} />
          ))}
        </div>
      </HubSection>

      <HubSection
        id="about-platform"
        number="05"
        title={["About the Hub", "关于平台"]}
      >
        <p className="max-w-4xl text-base leading-8 text-muted-foreground">
          {t(
            "Stablecoin Research Hub organises stablecoin mechanisms, regulation, market data, research methods and emerging payment infrastructure for general users, researchers and industry participants.",
            "Stablecoin Research Hub 面向普通用户、研究者和产业参与者，组织稳定币机制、监管、市场数据、研究方法和新型支付基础设施。",
          )}
        </p>
        <p className="mt-4 text-sm leading-7">
          <HubText text={PUBLIC_SUPPORT_LINE} />
          <HubCite ids={["SRC-HR-02", "SRC-HR-03"]} />
        </p>
      </HubSection>
      <ResearchSourceNote />
    </div>
  );
}
