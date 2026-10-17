import type { ReactNode } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import {
  CONFERENCE,
  TITLES,
  MODULES,
  LIFECYCLE,
  AMPLIFICATION,
  type FrameworkCopy,
} from "@/data/conference-risk-framework";
import {
  FrameworkText,
  FrameworkNav,
  FrameworkSection,
  FrameworkBoundary,
  StudySource,
  RepresentativeRisks,
  CurrentFuture,
  DimensionDistinctions,
  MappingBand,
} from "@/components/risk-framework-ui";

function FrameworkPage({
  kind,
  route,
  lead,
  children,
}: {
  kind: string;
  route: string;
  lead: FrameworkCopy;
  children: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <div
      data-conference-risk-framework={kind}
      className="mx-auto w-full min-w-0 max-w-[1280px] pb-8"
    >
      <FrameworkNav route={route} />
      <header className="pb-8">
        <p className="mb-3 text-xs font-semibold tracking-wide text-primary">
          {t("Conference study · Conceptual framework", "会议研究 · 概念框架")}
        </p>
        <h1 className="max-w-5xl break-words font-serif text-3xl font-bold leading-tight text-primary sm:text-4xl">
          <FrameworkText copy={TITLES[kind]} />
        </h1>
        <p className="mt-5 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg">
          <FrameworkText copy={lead} />
        </p>
        <StudySource />
      </header>
      {children}
    </div>
  );
}
export function RiskFramework() {
  const { t } = useLanguage();
  const flow: FrameworkCopy[] = [
    ["Stablecoin System", "稳定币系统"],
    ["Risk Modules", "风险模块"],
    ["Atomic Risk Units", "最小有用风险单元"],
    ["Two-Dimensional Mapping", "二维映射"],
  ];
  return (
    <FrameworkPage
      kind="overview"
      route="/quantitative"
      lead={[
        "Identify distinct risk units, locate them in the stablecoin lifecycle, and distinguish their roles in amplification and transmission.",
        "拆解可识别的风险单元，定位其生命周期位置，并区分它们在风险放大与传导中的角色。",
      ]}
    >
      <FrameworkSection
        id="atomic-risk"
        title={["What is an atomic risk?", "什么是 Atomic Risk？"]}
      >
        <p
          data-submitted-framework-count
          className="text-xl font-semibold text-primary"
        >
          {t(
            `${CONFERENCE.study.current_study.atomic_risks} atomic risks in the submitted framework`,
            "已提交框架包含 55 个 atomic risks",
          )}
        </p>
        <p className="mt-4 max-w-4xl text-base leading-8">
          {t(
            "An atomic risk is the minimum useful risk unit for identification and measurement in this framework.",
            "Atomic risk 是本框架中用于识别和测量的最小有用风险单元。",
          )}
        </p>
        <FrameworkBoundary>
          {t(
            "Atomic does not mean causally or statistically independent. Atomic risks can interact, amplify one another and transmit across systems.",
            "Atomic 不表示因果独立或统计独立。Atomic risks 仍可以相互作用、放大其他风险，并向其他系统传导。",
          )}
        </FrameworkBoundary>
        <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Stablecoins connect issuers, reserves, custodians, blockchains, markets, protocols and users. Decomposition helps distinguish specific risk sources and their operational locations before designing measurements.",
            "稳定币连接发行人、储备、托管机构、区块链、市场、协议与用户。风险拆解先区分具体风险来源和运行位置，再为后续测量提供基础。",
          )}
        </p>
      </FrameworkSection>
      <FrameworkSection
        id="decomposition"
        title={[
          "From the system to two-dimensional mapping",
          "从系统拆解到二维映射",
        ]}
      >
        <ol data-decomposition-flow className="grid gap-4 lg:grid-cols-4">
          {flow.map((c, i) => (
            <li
              key={c[0]}
              className="min-w-0 border-b-2 border-primary/40 py-4"
            >
              <span className="mr-3 font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <span className="font-semibold">
                <FrameworkText copy={c} />
              </span>
              {i < 3 && (
                <span aria-hidden="true" className="ml-3 text-primary">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-5 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Understand the architecture and operational relationships; organise modules by economic, institutional and technical function; define risk units with clear conceptual boundaries and an operational locus; map each unit along the two dimensions.",
            "先理解架构与运行关系，再按经济、机构和技术功能组织模块；定义概念边界清晰、有主要运行位置的风险单元，最后进行两个维度的映射。",
          )}
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Evidence draws on academic research, regulatory and industry reports, issuer/protocol documentation, and real-world failure or stress cases.",
            "证据基础包括学术研究、监管与行业报告、发行方或协议文档，以及真实失效与压力案例。",
          )}
        </p>
        <FrameworkBoundary>
          {t(
            "Quantification and monitoring follow decomposition and mapping as future research.",
            "量化与监测属于风险拆解和映射之后的未来研究。",
          )}
        </FrameworkBoundary>
      </FrameworkSection>
      <FrameworkSection
        id="risk-modules"
        title={["Seven presentation-level risk modules", "七个展示层风险模块"]}
      >
        <p className="mb-6 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "Presentation-level organisation of the submitted framework — not a new formal taxonomy. Only representative risks shown in the conference material are listed here.",
            "这些模块是已提交框架的展示层组织方式，不是一套新的正式分类。下方仅列出会议材料明确提供的代表性风险。",
          )}
        </p>
        <ol className="grid gap-x-10 md:grid-cols-2">
          {MODULES.map((m) => (
            <li
              key={m.module}
              data-risk-module={m.module}
              className="min-w-0 border-t border-border py-5"
            >
              <p className="text-xs font-semibold text-primary">{m.module}</p>
              <h3 className="mt-2 text-lg font-semibold leading-7">
                <FrameworkText copy={m.title} />
              </h3>
              <RepresentativeRisks risks={m.risks} />
            </li>
          ))}
        </ol>
      </FrameworkSection>
      <FrameworkSection
        id="two-dimensions"
        title={["Two complementary dimensions", "两个互补维度"]}
      >
        <div data-two-dimensions className="grid gap-6 md:grid-cols-2">
          {[
            {
              href: "/quantitative/dimension-a",
              title: TITLES.lifecycle,
              copy: [
                "Where is the risk primarily located in the stablecoin operational lifecycle?",
                "风险主要位于稳定币运行生命周期的哪里？",
              ] as FrameworkCopy,
            },
            {
              href: "/quantitative/dimension-b",
              title: TITLES.amplification,
              copy: [
                "What causal role does the risk play from initial shock to cross-system transmission?",
                "风险在初始冲击到跨系统传导中扮演什么因果角色？",
              ] as FrameworkCopy,
            },
          ].map((d) => (
            <div
              key={d.href}
              className="min-w-0 border-l-2 border-primary pl-5"
            >
              <h3 className="text-lg font-semibold leading-7">
                <Link
                  href={d.href}
                  className="text-primary underline underline-offset-4"
                >
                  <FrameworkText copy={d.title} />
                </Link>
              </h3>
              <p className="mt-3 text-sm leading-7">
                <FrameworkText copy={d.copy} />
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          {t(
            "Lifecycle location and causal role are different properties. The two dimensions complement one another.",
            "生命周期位置与因果角色是不同属性，两个维度互补而非互相替代。",
          )}
        </p>
        <DimensionDistinctions />
      </FrameworkSection>
      <CurrentFuture />
    </FrameworkPage>
  );
}
export function LifecycleMapping() {
  const { t } = useLanguage();
  return (
    <FrameworkPage
      kind="lifecycle"
      route="/quantitative/dimension-a"
      lead={[
        "Where is the risk primarily located in the stablecoin operational lifecycle? The T dimension identifies where a risk enters, is embedded, or becomes relevant.",
        "风险主要位于稳定币运行生命周期的哪里？T 维度标记风险进入、嵌入或变得相关的主要运行位置。",
      ]}
    >
      <FrameworkSection
        id="lifecycle-map"
        title={["Four lifecycle locations", "四个生命周期位置"]}
      >
        <FrameworkBoundary>
          {t(
            "T0–T3 locate risks. They are not a severity ranking, a risk score or a deterministic causal sequence. T3 does not mean more severe than T0.",
            "T0–T3 用于定位风险，不是严重程度排名、风险分数或确定性因果顺序。T3 不表示比 T0 更严重。",
          )}
        </FrameworkBoundary>
        <MappingBand stages={LIFECYCLE} kind="lifecycle" />
      </FrameworkSection>
      <FrameworkSection
        id="protocol-boundary"
        title={["The T1 / T2 boundary", "T1 / T2 的边界"]}
      >
        <FrameworkBoundary>
          <p className="font-semibold">
            {t(
              "Protocol embedding — not simply being on-chain or being in DeFi — is the boundary.",
              "边界在于协议嵌入，而不只是“是否上链”或“是否在 DeFi 中”。",
            )}
          </p>
        </FrameworkBoundary>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-primary">
              {t("A DEX trade can remain T1", "DEX 交易仍可属于 T1")}
            </dt>
            <dd className="mt-2 text-sm leading-7">
              {t(
                "Exchange, transfers and settlement need not create an embedded financial position.",
                "交换、转账与结算本身不必然形成嵌入式金融头寸。",
              )}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-primary">
              {t(
                "Layered financial positions belong to T2",
                "多层金融头寸属于 T2",
              )}
            </dt>
            <dd className="mt-2 text-sm leading-7">
              {t(
                "Lending, collateral, LP positions and other layered positions embed stablecoins in a protocol structure.",
                "借贷、抵押、LP 及其他多层头寸将稳定币嵌入协议结构。",
              )}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm leading-7 text-muted-foreground">
          {t(
            "If a risk takes different roles at different lifecycle locations, consider separating risk units rather than forcing them into one concept.",
            "若风险在不同生命周期位置承担不同角色，应考虑拆分风险单元，而不是强行合并为同一概念。",
          )}
        </p>
      </FrameworkSection>
      <CurrentFuture compact />
    </FrameworkPage>
  );
}
export function AmplificationMapping() {
  const { t } = useLanguage();
  return (
    <FrameworkPage
      kind="amplification"
      route="/quantitative/dimension-b"
      lead={[
        "What role does the risk play from initial shock to cross-system transmission? Distinguish the trigger, pre-existing susceptibility, activated feedback and outward outcomes.",
        "风险在初始冲击到跨系统传导中扮演什么角色？区分触发事件、预先存在的易受冲击性、被激活的反馈与向外传导的结果。",
      ]}
    >
      <FrameworkSection
        id="amplification-map"
        title={["Four causal roles", "四种因果角色"]}
      >
        <FrameworkBoundary>
          {t(
            "The arrows describe a conceptual causal-role structure, not an empirically estimated causal network or a mechanical time sequence. Structural vulnerability can exist before the trigger.",
            "箭头表示概念性的因果角色结构，不代表经验估计的因果网络，也不是机械的时间顺序。结构脆弱性可在触发事件前已经存在。",
          )}
        </FrameworkBoundary>
        <MappingBand stages={AMPLIFICATION} kind="amplification" />
      </FrameworkSection>
      <FrameworkSection
        id="dimension-boundaries"
        title={["Keep these distinctions separate", "保持这些概念区分"]}
      >
        <DimensionDistinctions />
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground">
          {t(
            "L3 begins when effects cross the focal stablecoin system boundary. Redemption or liquidation at T3 does not by itself establish cross-system propagation.",
            "L3 从影响越过目标稳定币系统边界开始。T3 的赎回或清算本身并不等于已经发生跨系统传导。",
          )}
        </p>
      </FrameworkSection>
      <CurrentFuture compact />
    </FrameworkPage>
  );
}
