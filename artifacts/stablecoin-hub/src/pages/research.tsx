import { useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  PIPELINE,
  QUANTITATIVE,
  SCREENING,
  NEXT_STAGE,
  TAXONOMY_BOUNDARY,
  RESEARCH_BOUNDARY,
} from "@/data/home-research";
import {
  HubText,
  HubSection,
  HubBoundary,
  HubLink,
  HubCite,
  ResearchState,
  ResearchRecord,
  ResearchFigure,
  ResearchSourceNote,
  PublicSourceLink,
} from "@/components/home-research-ui";

export default function Research() {
  const { t } = useLanguage();
  useEffect(() => {
    // The shared layout resets its own scroll container after route changes.
    // Apply this page's explicit deep link afterwards, without changing global navigation.
    const frame = requestAnimationFrame(() => {
      if (window.location.hash === "#55-risk-framework") {
        document
          .getElementById("55-risk-framework")
          ?.scrollIntoView({ block: "start" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      data-home-research="research"
      className="mx-auto w-full min-w-0 max-w-[1280px] px-1 pb-8 sm:px-4"
    >
      <header id="hero" className="pb-9 pt-3 sm:pb-12">
        <p className="mb-4 text-xs font-semibold tracking-wider text-primary">
          {t(
            "Our Research · Stablecoin risk and market structure",
            "Our Research · 稳定币风险与市场结构",
          )}
        </p>
        <h1 className="max-w-5xl font-serif text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl xl:text-5xl">
          {t(
            "From a conceptual risk framework to empirical risk-transmission analysis",
            "从概念风险框架，到可量化的风险传导研究",
          )}
        </h1>
        <p className="mt-5 max-w-5xl text-base leading-8 text-muted-foreground sm:text-lg">
          {t(
            "Our research begins by identifying the structural risks stablecoins may face, then translates those risk concepts into measurable indicators, event definitions and network relationships. The conceptual framework and public evidence modules are complete. Transfer Entropy, multivariate Hawkes, stress-scenario analysis and historical-event validation have produced interim empirical results. Continuous monitoring and early warning remain future objectives, not deployed products.",
            "我们的研究先回答“稳定币有哪些结构性风险”，再逐步把可测量风险转化为数据、事件与网络关系。当前已经形成公开的概念框架和多个专题证据模块，并进入 Transfer Entropy、Hawkes、压力情景和历史事件验证的实证阶段；持续监测与早期预警仍是后续目标，而不是已经上线的产品。",
          )}
        </p>
      </header>

      <HubSection
        id="pipeline"
        number="01"
        title={[
          "Research pipeline and status",
          "研究不是一张“已完成系统”流程图",
        ]}
        intro={[
          "Arrows express research dependency, not completion of every stage.",
          "箭头表达研究依赖关系，不代表每个阶段均已完成。",
        ]}
      >
        <ol className="grid gap-x-8 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
          {PIPELINE.map((step, i) => (
            <li
              key={step.title[0]}
              data-pipeline-stage={i + 1}
              className={`border-l-2 pl-4 ${i === 5 ? "border-dashed border-border" : "border-primary/35"}`}
            >
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-primary">0{i + 1}</span>
                <h3 className="text-lg font-semibold">
                  <HubText text={step.title} />
                </h3>
              </div>
              <p className="mt-2 text-xs font-medium text-primary">
                <HubText text={step.stage} />
              </p>
              {step.status && (
                <div className="mt-2">
                  <ResearchState status={step.status} />
                </div>
              )}
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                <HubText text={step.detail} />
              </p>
            </li>
          ))}
        </ol>
        <ResearchFigure
          id="RES-D01"
          title={["Research Pipeline & Status", "研究流程与状态"]}
          mobileSummary={[
            "Conceptual framework: complete → measurement: core design established, refinement ongoing → audited research data pipeline: established → TE/Hawkes: interim results → validation: in progress → monitoring: planned.",
            "概念框架：完成 → 测量设计：已形成、持续修订 → 研究数据链：已建立 → TE / Hawkes：中期结果 → 验证：进行中 → 监测：计划。",
          ]}
        />
      </HubSection>

      <HubSection
        id="55-risk-framework"
        number="02"
        title={[
          "Completed conceptual research: 55 atomic risks",
          "已完成的概念研究：55 项原子风险",
        ]}
      >
        <ResearchRecord id="risk-framework" link={false} compact />
        <p className="mt-5 max-w-4xl text-base leading-8">
          {t(
            "The research accepted and presented at AI-DEFIT 2026 maps 55 conceptually distinct atomic risks across lifecycle position and amplification/transmission role.",
            "已接收并在 AI-DEFIT 2026 展示的研究建立了一个全生命周期风险框架，将稳定币风险拆解为 55 项概念上相对独立的原子风险，并从生命周期位置、风险放大 / 传导作用两个维度进行交叉分析。",
          )}
          <HubCite ids={["SRC-HR-04"]} />
        </p>
        <HubBoundary text={TAXONOMY_BOUNDARY} />
        <h3 className="mt-6 text-base font-semibold">
          {t(
            "From conceptual risks to empirical nodes",
            "从理论风险到实证节点",
          )}
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "A conceptual taxonomy does not require placing all 55 variables into a statistical model. Empirical nodes are screened for:",
            "55 是概念分类结果，不是要求把 55 个变量全部同时放进一个统计模型。量化节点需要根据以下条件筛选：",
          )}
        </p>
        <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {SCREENING.map((s) => (
            <li key={s[0]} className="border-l border-primary/35 pl-3">
              <HubText text={s} />
            </li>
          ))}
        </ul>
        <ResearchFigure
          id="RES-D03"
          title={["From Taxonomy to Measurement", "从风险分类到测量"]}
          mobileSummary={[
            "55 atomic risks form a completed conceptual taxonomy. Measurement screening produces an empirical representation; no fixed current node count is published. 55 ≠ 55 direct model nodes.",
            "55 项原子风险属于已完成的概念分类。经过测量条件筛选后，形成适合实证分析的节点表示；不公开未冻结的当前节点数量。55 ≠ 55 个直接模型节点。",
          ]}
        />
      </HubSection>

      <HubSection
        id="quantitative-research"
        number="03"
        title={["Current quantitative research", "当前量化研究"]}
      >
        <div className="space-y-7">
          {QUANTITATIVE.map((q) => (
            <article
              key={q.title[0]}
              data-quantitative-method={q.title[0]}
              className="grid gap-4 border-b border-border pb-7 md:grid-cols-[0.7fr_1.3fr]"
            >
              <div>
                <h3 className="text-xl font-semibold">
                  <HubText text={q.title} />
                </h3>
                <div className="mt-3">
                  <ResearchState status={q.status} />
                </div>
              </div>
              <div>
                <p className="text-base font-medium leading-7">
                  <HubText text={q.question} />
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  <HubText text={q.result} />
                </p>
                <p className="mt-3 text-sm leading-7">
                  <HubText text={q.boundary} />
                </p>
              </div>
            </article>
          ))}
        </div>
        <ResearchFigure
          id="RES-D02"
          title={[
            "Quantitative Risk-Transmission Research",
            "量化风险传导研究",
          ]}
          mobileSummary={[
            "Continuous risk states → measured nodes → rolling windows → Transfer Entropy. Extreme events → event construction → multivariate Hawkes. Both require case, stress, robustness, out-of-sample and reproducibility validation before future monitoring.",
            "连续风险状态 → 测量节点 → 滚动窗口 → Transfer Entropy；极端事件 → 事件构建 → 多元 Hawkes。两条路径都需要案例、压力、稳健性、样本外及可复现性验证，之后才进入未来监测。",
          ]}
        />
        <ResearchState status="VALIDATION_IN_PROGRESS" />
      </HubSection>

      <HubSection
        id="evidence-modules"
        number="04"
        title={["Research evidence modules", "研究证据模块"]}
        intro={[
          "These sit alongside quantitative risk research. They supply evidence on institutions, products and infrastructure rather than being forced into one risk score.",
          "这些模块与风险量化研究并列：它们提供制度、产品和基础设施层的事实证据，而不是被强行塞进同一个风险分数。",
        ]}
      >
        <div className="grid gap-8 md:grid-cols-2">
          <ResearchRecord id="asia-research" />
          <ResearchRecord id="agentic-payments" />
        </div>
      </HubSection>

      <HubSection
        id="outputs"
        number="05"
        title={["Research outputs", "研究产出"]}
      >
        <ResearchRecord id="conference-paper" link={false} />
        <div className="mt-4">
          <PublicSourceLink
            id="SRC-HR-04"
            text={["AI-DEFIT 2026 programme", "AI-DEFIT 2026 会议议程"]}
          />
        </div>
        <div className="mt-7 grid gap-8 lg:grid-cols-3">
          <ResearchRecord id="quantitative-te-hawkes" link={false} />
          <ResearchRecord id="stress-cases" link={false} />
          <ResearchRecord id="monitoring-platform" link={false} />
        </div>
      </HubSection>

      <HubSection
        id="not-live"
        number="06"
        title={["What is not yet live", "明确没有上线的东西"]}
      >
        <ResearchState status="PLANNED" />
        <HubBoundary text={RESEARCH_BOUNDARY} />
        <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "The website does not provide real-time stablecoin risk probabilities, calibrated live risk scores or a deployed TE/Hawkes risk engine. Quantitative outputs remain research-stage; model calibration and production early warning must not be represented as completed. No payment-gateway data partnership is claimed.",
            "当前没有上线的实时稳定币风险概率、已校准实时风险评分或实时 TE / Hawkes 风险引擎。量化输出仍属研究阶段，不能将模型校准和生产级预警表述为已完成；本站也不声称已与支付网关合作获取指标。",
          )}
        </p>
      </HubSection>

      <HubSection
        id="next-stage"
        number="07"
        title={["Next stage", "下一阶段"]}
        intro={[
          "The priority is not more indicators, but a stronger basis for measurement, modelling and validation.",
          "下一阶段研究重点不是“再增加更多指标”，而是提高测量、模型与验证基础。",
        ]}
      >
        <div className="mb-5">
          <ResearchState status="VALIDATION_IN_PROGRESS" />
        </div>
        <ul className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {NEXT_STAGE.map((item) => (
            <li key={item[0]} className="border-l border-primary/35 pl-3">
              <HubText text={item} />
            </li>
          ))}
        </ul>
        <p className="mt-6 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Only after these links are stable can monitoring and warnings have a sufficient research foundation.",
            "只有这些环节稳定后，监测和预警才有足够研究基础。",
          )}
        </p>
        <div className="mt-4">
          <HubLink
            href="/market-data"
            text={["Inspect market evidence", "查看市场证据"]}
          />
        </div>
      </HubSection>
      <ResearchSourceNote />
    </div>
  );
}
