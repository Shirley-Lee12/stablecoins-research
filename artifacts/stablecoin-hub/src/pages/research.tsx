import { useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  HOME_RESEARCH,
  FRAMEWORK_STEPS,
  CONTRIBUTIONS,
  LIFECYCLE,
  AMPLIFICATION,
  MODULES,
  DISTINCTIONS,
  ATOMIC_BOUNDARY,
  TAXONOMY_BOUNDARY,
} from "@/data/home-research";
import {
  HubText,
  HubSection,
  HubBoundary,
  HubLink,
  HubCite,
  ResearchState,
  ResearchRecord,
  ResearchSourceNote,
  PublicSourceLink,
  ConferencePaperLink,
  FutureResearch,
} from "@/components/home-research-ui";
export default function Research() {
  const { t } = useLanguage();
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(id)?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const examples = [
    MODULES[0].risks[0],
    MODULES[2].risks[1],
    MODULES[6].risks[0],
  ];
  return (
    <div
      data-home-research="research"
      className="mx-auto w-full min-w-0 max-w-[1480px] pb-8"
    >
      <header id="hero" className="grid min-h-[470px] items-center gap-12 border-b border-border pb-16 pt-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
        <p className="mb-4 text-xs font-semibold tracking-wider text-primary">
          {t(
            "Our Research · AI-DEFIT 2026 conference study",
            "我们的研究 · AI-DEFIT 2026 会议研究",
          )}
        </p>
        <h1 className="max-w-5xl font-serif text-3xl font-bold leading-tight tracking-tight text-primary sm:text-4xl">
          {t(
            "A full-lifecycle framework for stablecoin risk",
            "稳定币全生命周期风险框架",
          )}
        </h1>
        <p className="mt-5 max-w-5xl text-base leading-8 text-muted-foreground sm:text-lg">
          {t(
            "Our current study identifies atomic risks and maps their lifecycle locations and amplification/transmission roles. The accepted AI-DEFIT 2026 conference paper contributes a conceptual framework; later measurement and monitoring are future research directions.",
            "当前研究识别 atomic risks，并映射它们的生命周期位置与放大 / 传导角色。AI-DEFIT 2026 已接收会议论文的贡献是概念框架；后续测量与监测属于未来研究方向。",
          )}
        </p>
        </div>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(49,87,200,0.10),rgba(7,139,127,0.07)_52%,rgba(212,92,77,0.09))] p-7 sm:p-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Research foundation", "研究基础")}</span>
          <div className="mt-14 grid grid-cols-2 gap-7 sm:grid-cols-4">
            {[
              {n:"55", label:t("Submitted-framework risks", "已提交框架风险数")},
              {n:"4", label:t("Lifecycle stages", "生命周期阶段")},
              {n:"4", label:t("Amplification tiers", "风险放大层级")},
              {n:"2026", label:t("AI-DEFIT conference study", "AI-DEFIT 会议研究")},
            ].map(metric => <div key={metric.label} className="min-w-0 border-t border-foreground/25 pt-3"><strong className="block text-3xl font-semibold tabular-nums text-primary sm:text-4xl">{metric.n}</strong><span className="mt-1 block text-sm leading-5 text-foreground/70">{metric.label}</span></div>)}
          </div>
          <p className="mt-14 text-sm font-semibold text-primary">{t("Conceptual framework · Future extensions remain future research", "概念框架 · 后续延展仍属于未来研究")}</p>
        </div>
      </header>
      <HubSection
        id="study-overview"
        number="01"
        title={["Study overview", "研究概览"]}
      >
        <div data-home-current-study>
          <ResearchState status="CURRENT_STUDY" />
          <p className="mt-4 max-w-4xl text-base leading-8">
            {t(HOME_RESEARCH.study.title, HOME_RESEARCH.study.title)}
          </p>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            {t(
              "Xueli Li · Zhejiang University",
              "Xueli Li · 浙江大学",
            )}
          </p>
          <p data-conference-programme className="mt-3 text-sm leading-7">
            {t(HOME_RESEARCH.study.programme_label_en, HOME_RESEARCH.study.programme_label_zh)}{" "}
            {t(HOME_RESEARCH.study.programme_display_en, HOME_RESEARCH.study.programme_display_zh)}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-7">
            {t(
              "The conference paper and its framework are the current research output presented here.",
              "这里的当前研究成果限于该会议论文及其框架。",
            )}
          </p>
        </div>
      </HubSection>
      <HubSection
        id="research-question"
        number="02"
        title={["Research question & motivation", "研究问题与动机"]}
      >
        <p className="max-w-4xl text-base leading-8">
          {t(
            "Where do stablecoin risks enter and become relevant, and how can they interact, amplify and spread beyond one stablecoin system?",
            "稳定币风险主要在哪里进入并变得相关？它们如何相互作用、放大，并越过单一稳定币的系统边界？",
          )}
        </p>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Stablecoins connect financial, institutional, technical and protocol relationships. Distinguishing common financial risks from stablecoin-specific risks helps clarify the source, location and role of a risk.",
            "稳定币连接金融、机构、技术与协议关系。区分一般金融风险与稳定币特有风险，有助于明确风险来源、位置及角色。",
          )}
        </p>
      </HubSection>
      <HubSection
        id="framework-architecture"
        number="03"
        title={["Framework architecture", "框架结构"]}
      >
        <ol
          data-conceptual-architecture
          className="grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-4"
        >
          {FRAMEWORK_STEPS.map((step, i) => (
            <li
              key={step[0]}
              className="min-w-0 border-l-2 border-primary/35 pl-4"
            >
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <h3 className="mt-2 text-base font-semibold">
                <HubText text={step} />
              </h3>
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "These are conceptual decomposition and mapping steps. The seven risk modules organise the presentation of the submitted framework; they are not a new formal taxonomy.",
            "这些是概念风险拆解与映射步骤。七个风险模块用于组织已提交框架的展示，不是一套新的正式分类。",
          )}
        </p>
        <div className="mt-4">
          <HubLink
            href="/quantitative"
            text={["Explore the risk framework", "查看风险框架"]}
          />
        </div>
      </HubSection>
      <HubSection
        id="55-risk-framework"
        number="04"
        title={["Atomic risk framework", "Atomic Risk 框架"]}
      >
        <ResearchRecord id="risk-framework" link={false} compact />
        <p className="mt-5 max-w-4xl text-base leading-8">
          {t(
            "An atomic risk is the minimum useful risk unit for identification and measurement in this framework.",
            "Atomic risk 是本框架中用于识别和测量的最小有用风险单元。",
          )}
        </p>
        <HubBoundary text={ATOMIC_BOUNDARY} />
        <HubBoundary text={TAXONOMY_BOUNDARY} />
        <h3 className="mt-6 text-base font-semibold">
          {t(
            "Representative risks from the conference study",
            "会议研究中的代表性风险",
          )}
        </h3>
        <ul className="mt-3 grid gap-4 text-sm leading-7 md:grid-cols-3">
          {examples.map((r) => (
            <li
              key={r.id}
              data-conference-example={r.id}
              className="min-w-0 border-l border-primary/35 pl-3"
            >
              <span className="mr-2 font-mono text-xs text-primary">
                {r.id}
              </span>
              <HubText text={r.name} />
            </li>
          ))}
        </ul>
      </HubSection>
      <HubSection
        id="lifecycle-mapping"
        number="05"
        title={["Lifecycle mapping — T0–T3", "生命周期映射 — T0–T3"]}
      >
        <p className="mb-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "The T dimension identifies the primary operational location of a risk. It does not rank severity.",
            "T 维度标记风险的主要运行位置，不表示严重程度排名。",
          )}
        </p>
        <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {LIFECYCLE.map((s) => (
            <li
              key={s.level}
              data-research-lifecycle={s.level}
              className="min-w-0 border-t-2 border-primary/35 pt-4"
            >
              <span className="font-mono text-lg text-primary">{s.level}</span>
              <h3 className="mt-2 text-base font-semibold leading-7">
                <HubText text={s.title} />
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                <HubText text={s.description} />
              </p>
            </li>
          ))}
        </ol>
        <HubBoundary
          text={[
            "Protocol embedding is the T1/T2 boundary. A DEX trade can remain T1; lending, collateral and LP positions belong to T2.",
            "T1/T2 的边界是协议嵌入。DEX 交易仍可属于 T1；借贷、抵押与 LP 头寸属于 T2。",
          ]}
        />
        <HubLink
          href="/quantitative/dimension-a"
          text={["Read Lifecycle Mapping (T0–T3)", "查看生命周期映射（T0–T3）"]}
        />
      </HubSection>
      <HubSection
        id="amplification-mapping"
        number="06"
        title={[
          "Amplification & transmission mapping — L0–L3",
          "放大与传导映射 — L0–L3",
        ]}
      >
        <p className="mb-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "The L dimension distinguishes an initial trigger, pre-existing vulnerability, activated feedback and cross-system outcomes.",
            "L 维度区分初始触发、预先存在的脆弱性、被激活的反馈与跨系统结果。",
          )}
        </p>
        <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {AMPLIFICATION.map((s) => (
            <li
              key={s.level}
              data-research-amplification={s.level}
              className="min-w-0 border-t-2 border-primary/35 pt-4"
            >
              <span className="font-mono text-lg text-primary">{s.level}</span>
              <h3 className="mt-2 text-base font-semibold leading-7">
                <HubText text={s.title} />
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                <HubText text={s.description} />
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-5">
          <HubLink
            href="/quantitative/dimension-b"
            text={[
              "Read Amplification & Transmission Mapping (L0–L3)",
              "查看放大与传导映射（L0–L3）",
            ]}
          />
        </div>
      </HubSection>
      <HubSection
        id="transmission-logic"
        number="07"
        title={["Risk transmission logic", "风险传导逻辑"]}
      >
        <p className="max-w-4xl text-base leading-8">
          {t(
            "Risks can interact and amplify one another. Cross-system transmission begins when effects move beyond the focal stablecoin into other stablecoins, DeFi protocols, broader crypto markets or traditional financial markets.",
            "风险可以相互作用与放大。当影响越过目标稳定币，传向其他稳定币、DeFi 协议、更广泛的加密市场或传统金融市场时，便进入跨系统传导。",
          )}
        </p>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "This is a conceptual interpretation of risk roles. Structural vulnerability can pre-date a trigger; lifecycle position and causal role are distinct properties.",
            "这是对风险角色的概念解释。结构脆弱性可以先于触发事件存在；生命周期位置与因果角色是不同属性。",
          )}
        </p>
        <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
          {DISTINCTIONS.map((d) => (
            <div key={d.id} className="min-w-0 border-t border-border py-4">
              <dt className="font-mono font-semibold text-primary">{d.id}</dt>
              <dd className="mt-2 text-sm leading-7">
                <HubText text={d.left} />
                {t(" versus ", " 与 ")}
                <HubText text={d.right} />
              </dd>
            </div>
          ))}
        </dl>
      </HubSection>
      <HubSection
        id="research-contribution"
        number="08"
        title={["Research contribution", "研究贡献"]}
      >
        <ul className="grid gap-5 sm:grid-cols-2">
          {CONTRIBUTIONS.map((c) => (
            <li
              key={c[0]}
              className="min-w-0 border-l-2 border-primary/35 pl-4 text-sm leading-7"
            >
              <HubText text={c} />
            </li>
          ))}
        </ul>
      </HubSection>
      <HubSection
        id="conference-paper"
        number="09"
        title={["Conference paper", "会议论文"]}
      >
        <ResearchRecord id="conference-paper" link={false} />
        <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
          <ConferencePaperLink />
          <PublicSourceLink
            id="SRC-HR-04"
            text={[
              "AI-DEFIT 2026 official programme",
              "AI-DEFIT 2026 官方议程",
            ]}
          />
        </div>
        <p className="mt-4 text-xs leading-6 text-muted-foreground">
          {t(
            "Downloadable manuscript version: submitted anonymised manuscript. Conference acceptance does not make this file a published version of record.",
            "可下载稿件版本：匿名送审稿。会议录用不代表此文件是已正式出版版本。",
          )}
          <HubCite ids={["SRC-HR-04"]} />
        </p>
      </HubSection>
      <HubSection
        id="future-research"
        number="10"
        title={["Future research", "未来研究"]}
        intro={[
          "Potential extensions beyond the current conference study.",
          "超出当前会议研究的潜在后续延展。",
        ]}
      >
        <FutureResearch />
      </HubSection>
      <ResearchSourceNote />
    </div>
  );
}
