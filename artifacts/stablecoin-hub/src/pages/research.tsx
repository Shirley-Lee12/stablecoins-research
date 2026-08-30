import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Download, Expand, FileText, Layers3, Network, Radar, Search, ShieldCheck, Workflow, X } from "lucide-react";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { researchRisks } from "@/data/research-risks";
import { useLanguage } from "@/lib/language-context";

type Figure = { src: string; alt: string };

const riskById = new Map(researchRisks.map((risk) => [risk.id, risk]));

const lifecycleRiskCodes: Record<string, string[]> = {
  T0: ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C11", "C12", "C13", "C14", "C15", "C16", "C19", "C20", "C21", "U4", "U8", "U9", "U23"],
  T1: ["C22", "C23", "C24", "C25", "U1", "U2", "U3", "U5", "U6", "U7", "U10", "U11", "U12", "U13", "U14", "U15", "U21"],
  T2: ["U16", "U17", "U18", "U19", "U24"],
  T3: ["C10", "C17", "C18", "C26", "C27", "U20", "U22", "U25", "U26", "U27", "U28"],
};

const amplificationRiskCodes: Record<string, string[]> = {
  L0: ["C1", "C2", "C3", "C4", "C12", "C15", "C16", "C19", "U2", "U3", "U4", "U5", "U6", "U7", "U8", "U9", "U10"],
  L1: ["C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14", "C17", "C20", "C21", "C22", "C23", "C24", "C25", "U14", "U23", "U24"],
  L2: ["C27", "U1", "U11", "U13", "U15", "U18", "U19", "U20", "U21", "U22", "U25", "U26"],
  L3: ["U16", "U17", "U18", "U27", "U28"],
};

function RiskCodeList({ ids, zh }: { ids: string[]; zh: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5" aria-label={zh ? "本阶段包含的风险" : "Risks included in this stage"}>
      {ids.map((id) => {
        const risk = riskById.get(id);
        if (!risk) return null;
        const name = zh ? risk.name.zh : risk.name.en;
        const definition = zh ? risk.definition.zh : risk.definition.en;
        return (
          <HoverCard key={id} openDelay={120} closeDelay={80}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className={`min-h-7 rounded-sm border px-2 py-1 text-xs font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${risk.family === "common" ? "border-[#3157c8]/35 text-[#3157c8] hover:bg-[#3157c8]/8" : "border-[#d45c4d]/35 text-[#b94a3f] hover:bg-[#d45c4d]/8"}`}
                aria-label={`${id}: ${name}`}
              >
                {id}
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-[min(22rem,calc(100vw-2rem))] rounded-sm p-5" align="start" sideOffset={8}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${risk.family === "common" ? "text-[#3157c8]" : "text-[#b94a3f]"}`}>{id} · {risk.family === "common" ? (zh ? "一般性金融风险" : "Common financial risk") : (zh ? "特殊性金融风险" : "Crypto-native risk")}</p>
                  <h4 className="mt-2 text-base font-semibold leading-6">{name}</h4>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-foreground/78">{definition}</p>
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/55">{zh ? "量化指标" : "Quantitative indicators"}</p>
                {risk.indicators.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm leading-5">
                    {risk.indicators.map((indicator) => <li key={indicator.en}>{zh ? indicator.zh : indicator.en}</li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-foreground/62">{zh ? "指标构建中" : "Indicator design in progress"}</p>}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}

function FigureLightbox({ figure, onClose }: { figure: Figure | null; onClose: () => void }) {
  useEffect(() => {
    if (!figure) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [figure, onClose]);

  if (!figure) return null;
  return (
    <div className="fixed inset-0 z-[80] overflow-auto bg-black/82 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label={figure.alt} onClick={onClose}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-black shadow-lg" aria-label="Close"><X className="h-5 w-5" /></button>
      <div className="flex min-h-full min-w-full items-center justify-center">
        <img src={figure.src} alt={figure.alt} className="min-w-[900px] max-w-none bg-white object-contain shadow-2xl sm:min-w-0 sm:max-h-[calc(100vh-4rem)] sm:max-w-full" onClick={(event) => event.stopPropagation()} />
      </div>
    </div>
  );
}

function ResearchFigures({ zh }: { zh: boolean }) {
  const [mode, setMode] = useState<"lifecycle" | "amplification">("lifecycle");
  const [expanded, setExpanded] = useState<Figure | null>(null);
  const figure = mode === "lifecycle"
    ? { src: "/media/research/risk-lifecycle.jpg", alt: zh ? "稳定币全生命周期风险分类图" : "Stablecoin full-lifecycle risk framework" }
    : { src: "/media/research/risk-amplification-pyramid.jpg", alt: zh ? "稳定币风险放大层级金字塔" : "Stablecoin risk amplification hierarchy" };

  return (
    <div className="border-t border-border pt-2">
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border">
        <div className="flex">
          <button onClick={() => setMode("lifecycle")} className={`px-4 py-3 text-sm font-semibold ${mode === "lifecycle" ? "border-b-2 border-primary text-primary" : "text-foreground/65 hover:text-foreground"}`}>{zh ? "全生命周期" : "Lifecycle"}</button>
          <button onClick={() => setMode("amplification")} className={`px-4 py-3 text-sm font-semibold ${mode === "amplification" ? "border-b-2 border-primary text-primary" : "text-foreground/65 hover:text-foreground"}`}>{zh ? "风险放大层级" : "Amplification tiers"}</button>
        </div>
        <p className="max-w-2xl pb-3 text-sm leading-6 text-foreground/75">{mode === "lifecycle" ? (zh ? "按照稳定币从准备发行、流通支付、衍生扩张到退出清算的运行过程，定位每项原子风险可能出现的环节。" : "The lifecycle view locates each atomic risk across preparation, circulation, expansion, and exit.") : (zh ? "按照风险作用强度划分根源冲击、状态扭曲、市场执行与跨系统外溢，呈现损失逐级放大的路径。" : "The hierarchy distinguishes root shocks, state distortion, market execution, and cross-system spillover.")}</p>
      </div>
      {mode === "lifecycle" ? (
        <div className="mt-8">
          <button type="button" onClick={() => setExpanded(figure)} className="group relative block w-full overflow-hidden bg-white text-left" aria-label={zh ? "放大全生命周期图" : "Expand lifecycle figure"}>
            <img src={figure.src} alt={figure.alt} className="h-auto w-full" loading="lazy" />
            <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-transform group-hover:scale-105"><Expand className="h-4 w-4" /></span>
          </button>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["T0", zh ? "准备与发行" : "Preparation & issuance", "#3157c8"],
              ["T1", zh ? "流通与支付" : "Circulation & payments", "#078b7f"],
              ["T2", zh ? "衍生与用途扩张" : "Derivation & use-case expansion", "#7f56a6"],
              ["T3", zh ? "退出与清算" : "Exit & liquidation", "#d45c4d"],
            ].map(([code, label, color]) => <div key={code} className="border-t-4 pt-3" style={{ borderColor: color }}><strong className="text-sm" style={{ color }}>{code}</strong><span className="ml-3 text-sm font-semibold">{label}</span><RiskCodeList ids={lifecycleRiskCodes[code]} zh={zh} /></div>)}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
          <button type="button" onClick={() => setExpanded(figure)} className="group relative mx-auto block w-full max-w-[650px] overflow-hidden bg-white" aria-label={zh ? "放大风险层级图" : "Expand amplification figure"}>
            <img src={figure.src} alt={figure.alt} className="h-auto w-full" loading="lazy" />
            <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-transform group-hover:scale-105"><Expand className="h-4 w-4" /></span>
          </button>
          <div className="space-y-0 lg:pt-6">
            {[
              ["L0", zh ? "根源冲击与内生禀赋" : "Root shocks and endogenous endowment", zh ? "宏观环境、合规约束、底层技术与共识安全构成冲击源。" : "Macroeconomic conditions, compliance, technology, and consensus form the initial shock layer.", "#3157c8"],
              ["L1", zh ? "状态扭曲与机制失灵" : "State distortion and mechanism failure", zh ? "资产结构、治理、法币通道和赎回机制决定系统如何承受冲击。" : "Assets, governance, fiat access, and redemption determine how the system absorbs a shock.", "#64748b"],
              ["L2", zh ? "跨境挤兑与市场踩踏" : "Cross-border runs and market stampedes", zh ? "拥堵、套利中断、自动交易和流动性撤离加快损失扩散。" : "Congestion, arbitrage failure, automated trading, and liquidity withdrawal accelerate losses.", "#d08a12"],
              ["L3", zh ? "跨协议传染与系统外溢" : "Cross-protocol contagion and systemic spillover", zh ? "协议崩溃、DeFi嵌套与储备抛售把风险传至其他市场。" : "Protocol collapse, DeFi nesting, and reserve fire sales transmit risk to other markets.", "#d45c4d"],
            ].map(([code, label, detail, color]) => <div key={code} className="grid grid-cols-[64px_1fr] gap-4 border-b border-border py-5 first:pt-0"><strong className="font-serif text-3xl" style={{ color }}>{code}</strong><div><h3 className="font-semibold">{label}</h3><p className="mt-2 text-sm leading-6 text-foreground/75">{detail}</p><RiskCodeList ids={amplificationRiskCodes[code]} zh={zh} /></div></div>)}
          </div>
        </div>
      )}
      <FigureLightbox figure={expanded} onClose={() => setExpanded(null)} />
    </div>
  );
}

function RiskTransmissionFigure({ zh }: { zh: boolean }) {
  const [expanded, setExpanded] = useState<Figure | null>(null);
  const figure = {
    src: "/media/research/risk-transmission-path.jpg",
    alt: zh ? "稳定币风险传染路径图" : "Stablecoin risk transmission pathway",
  };
  const stages = [
    ["I", zh ? "资产信用基础侵蚀" : "Erosion of the asset-credit base", "#3157c8"],
    ["II", zh ? "微观主体博弈与流动性耗竭" : "Micro-agent games and liquidity exhaustion", "#64748b"],
    ["III", zh ? "脱锚与协议解体" : "De-pegging and protocol dissolution", "#d45c4d"],
    ["IV", zh ? "跨市场与系统性外溢" : "Cross-market and systemic spillover", "#a93e4c"],
  ];

  return (
    <>
      <div className="mb-9 grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{zh ? "风险传导机制" : "Risk transmission mechanism"}</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{zh ? "原子风险如何连接为传染路径" : "How atomic risks connect into contagion pathways"}</h2>
        </div>
        <p className="self-end text-lg leading-8 text-foreground/78">{zh ? "单项风险并非孤立发生。外部冲击、储备损失或治理失灵可能削弱信用基础，继而触发挤兑、套利中断与流动性耗竭；当脱锚和自动清算相互强化，风险可经协议嵌套与储备资产出售扩散至加密市场和传统金融。" : "Atomic risks do not occur in isolation. External shocks, reserve losses, or governance failures can erode the credit base, trigger runs and liquidity exhaustion, and then spread through protocol nesting and reserve sales into crypto and traditional markets."}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map(([number, label, color]) => <div key={number} className="border-t-4 pt-3" style={{ borderColor: color }}><span className="text-sm font-bold" style={{ color }}>{number}</span><strong className="ml-3 text-sm">{label}</strong></div>)}
      </div>
      <button type="button" onClick={() => setExpanded(figure)} className="group relative mt-8 block w-full overflow-hidden bg-white" aria-label={zh ? "放大风险传染路径图" : "Expand risk transmission figure"}>
        <img src={figure.src} alt={figure.alt} className="h-auto w-full" loading="lazy" />
        <span className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-primary shadow-md transition-transform group-hover:scale-105"><Expand className="h-4 w-4" /></span>
      </button>
      <p className="mt-5 text-sm leading-6 text-foreground/70">{zh ? "图中编号对应55项原子风险，可与上方风险图谱交叉检索。路径表示可能的机制连接，不代表所有事件都会依次经历全部阶段。" : "The labels correspond to the 55 atomic risks above. The pathway shows possible mechanism links rather than a mandatory sequence for every event."}</p>
      <FigureLightbox figure={expanded} onClose={() => setExpanded(null)} />
    </>
  );
}

export default function Research() {
  const { language, t } = useLanguage();
  const zh = language === "zh";
  const [family, setFamily] = useState<"all" | "common" | "unique">("all");
  const [query, setQuery] = useState("");
  const filteredRisks = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return researchRisks.filter((entry) => (family === "all" || entry.family === family) && (!needle || entry.id.toLocaleLowerCase().includes(needle) || entry.name.en.toLocaleLowerCase().includes(needle) || entry.name.zh.includes(needle) || entry.definition.en.toLocaleLowerCase().includes(needle) || entry.definition.zh.includes(needle)));
  }, [family, query]);
  const riskGroups = useMemo(() => {
    const groups = new Map<string, typeof researchRisks>();
    filteredRisks.forEach((entry) => { const key = zh ? entry.dimension.zh : entry.dimension.en; groups.set(key, [...(groups.get(key) ?? []), entry]); });
    return [...groups.entries()];
  }, [filteredRisks, zh]);
  const navItems = useMemo(() => [
    { id: "research-question", label: t("Research objective", "研究目标") },
    { id: "research-logic", label: t("Research architecture", "研究架构") },
    { id: "risk-atlas", label: t("55-risk atlas", "55项风险图谱") },
    { id: "analytical-views", label: t("Analytical views", "分析维度") },
    { id: "transmission-path", label: t("Transmission path", "风险传导") },
    { id: "outputs", label: t("Research outputs", "研究成果") },
  ], [t]);

  return (
    <div className="mx-auto max-w-[1480px]">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={navItems} />
      <section id="research-question" className="grid min-h-[470px] items-center gap-12 border-b border-border pb-16 pt-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("ZIBS original research", "ZIBS原创研究")}</p><h1 className="mt-5 max-w-3xl font-serif text-3xl font-semibold leading-tight text-primary sm:text-4xl">{t("Measuring stablecoin risk for a more reliable early-warning platform", "全面衡量稳定币风险，建立更可靠的预警平台")}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-foreground/80">{t("The project identifies stablecoin risks across financial, technical and institutional structures, then develops measurable indicators that can support continuous monitoring and early warning.", "本课题从金融、技术与制度结构中识别稳定币风险，并进一步建立可量化指标，为持续监测与风险预警提供基础。")}</p></div>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(49,87,200,0.10),rgba(7,139,127,0.07)_52%,rgba(212,92,77,0.09))] p-7 sm:p-10"><div className="flex items-center justify-between gap-5"><span className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Research foundation", "研究基础")}</span><Radar className="h-8 w-8 text-primary" /></div><div className="mt-14 grid grid-cols-2 gap-7 sm:grid-cols-4">{[{ n: "55", l: t("atomic risks", "项原子风险") }, { n: "2", l: t("risk families", "类风险特质") }, { n: "4", l: t("lifecycle stages", "个生命周期阶段") }, { n: "4", l: t("amplification tiers", "个风险放大层级") }].map((metric) => <div key={metric.l} className="border-t border-foreground/25 pt-3"><strong className="block text-4xl font-semibold tabular-nums text-primary">{metric.n}</strong><span className="mt-1 block text-sm leading-5 text-foreground/70">{metric.l}</span></div>)}</div><div className="mt-14 flex items-center gap-3 text-sm font-semibold text-primary"><span className="h-2 w-2 rounded-full bg-chart-2" />{t("Primary goal: stablecoin risk early-warning platform", "首要研究计划：稳定币风险预警平台")}</div></div>
      </section>

      <section id="research-logic" className="py-20">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Research architecture", "研究架构")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("From risk traits to an operational warning system", "从风险特质走向可运行的预警系统")}</h2></div><p className="self-end text-lg leading-8 text-foreground/78">{t("Stablecoins combine conventional financial-asset risks with risks native to blockchain infrastructure and programmable protocols. We identify 55 atomic risks, examine how they migrate across the full lifecycle and amplify across systems, and use that structure to develop indicators, regulatory mappings and warning models.", "稳定币同时承载传统金融资产的一般性风险，以及区块链基础设施和可编程协议带来的特殊风险。课题首先识别55项原子风险，再从全生命周期和风险放大层级分析风险的转移、传导与放大，并据此开展指标设计、监管映射与预警模型研究。")}</p></div>
        <div className="mt-12 border-y border-border py-10"><div className="grid items-center gap-6 lg:grid-cols-[1fr_70px_0.72fr_70px_1fr_70px_0.9fr]">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><div className="border-l-4 border-[#3157c8] pl-5"><ShieldCheck className="h-6 w-6 text-[#3157c8]" /><h3 className="mt-3 text-lg font-semibold">{t("Traditional financial risk traits", "传统金融风险特质")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Balance sheets, custody, compliance, liquidity and holder behaviour.", "资产负债表、托管、合规、流动性与持有者行为。")}</p></div><div className="border-l-4 border-[#d45c4d] pl-5"><Network className="h-6 w-6 text-[#d45c4d]" /><h3 className="mt-3 text-lg font-semibold">{t("Crypto-native risk traits", "稳定币特殊金融风险特质")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Blockchains, contracts, oracles, bridges, composability and endogenous mechanisms.", "公链、合约、预言机、跨链、可组合性与内生机制。")}</p></div></div>
          <div className="hidden h-px bg-primary/30 lg:block" /><div className="text-center"><strong className="font-serif text-6xl text-primary">55</strong><span className="mt-2 block text-sm font-semibold">{t("atomic risks", "项原子风险")}</span></div><div className="hidden h-px bg-primary/30 lg:block" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><div><Layers3 className="h-6 w-6 text-[#078b7f]" /><h3 className="mt-3 font-semibold">{t("Quantitative assessment", "量化评估")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Indicators, thresholds, exposure and interaction effects.", "指标、阈值、敞口与交互效应。")}</p></div><div><Workflow className="h-6 w-6 text-[#7f56a6]" /><h3 className="mt-3 font-semibold">{t("Regulatory coverage", "监管覆盖度")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Planned: map rules to atomic risks and identify blind spots.", "后续研究：将监管要求映射到原子风险并识别盲区。")}</p></div></div>
          <div className="hidden h-px bg-primary/30 lg:block" /><div className="bg-primary px-6 py-8 text-primary-foreground"><Radar className="h-7 w-7" /><h3 className="mt-4 text-xl font-semibold">{t("Stablecoin risk early-warning platform", "稳定币风险预警平台")}</h3><p className="mt-3 text-sm leading-6 text-primary-foreground/75">{t("Continuous monitoring, risk signals and interpretable alerts.", "持续监测、风险信号与可解释预警。")}</p></div>
        </div></div>
      </section>

      <section id="risk-atlas" className="border-t border-border py-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Atomic-risk atlas", "原子风险图谱")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("All 55 risks in the framework", "框架中的全部55项风险")}</h2></div><p className="self-end text-lg leading-8 text-foreground/75">{t("Twenty-seven common financial risks and twenty-eight crypto-native risks form the research inventory used for measurement and monitoring.", "27项一般性金融风险与28项特殊性金融风险共同构成后续量化与监测的研究清单。")}</p></div>
        <div className="mt-9 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2">{(["all", "common", "unique"] as const).map((value) => <button key={value} onClick={() => setFamily(value)} className={`h-9 rounded-md px-4 text-sm font-semibold ${family === value ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>{value === "all" ? t("All 55", "全部55项") : value === "common" ? t("Common 27", "一般性27项") : t("Unique 28", "特殊性28项")}</button>)}</div><label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search ID, risk name or definition", "搜索编号、风险名称或定义")} className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm" /></label></div>
        <div className="mt-8 border-y border-border">
          <div className="hidden grid-cols-[64px_minmax(170px,0.72fr)_minmax(0,1.55fr)_minmax(160px,0.72fr)] gap-5 bg-muted/55 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/65 md:grid"><span>{t("ID", "编号")}</span><span>{t("Risk", "风险名称")}</span><span>{t("Definition", "风险定义")}</span><span>{t("Indicators", "量化指标")}</span></div>
          {riskGroups.map(([dimension, entries]) => <div key={dimension}><div className="flex items-center justify-between border-t border-border bg-primary/[0.045] px-5 py-3 first:border-t-0"><span><span className="mr-3 text-xs font-semibold uppercase tracking-wider text-primary">{entries[0].family === "common" ? t("Common", "一般性") : t("Unique", "特殊性")}</span><strong className="text-sm">{dimension}</strong></span><span className="text-xs tabular-nums text-foreground/55">{entries.length}</span></div>{entries.map((entry) => <div key={entry.id} className="grid gap-2 border-t border-border px-5 py-4 md:grid-cols-[64px_minmax(170px,0.72fr)_minmax(0,1.55fr)_minmax(160px,0.72fr)] md:gap-5"><span className={`text-sm font-bold ${entry.family === "common" ? "text-[#3157c8]" : "text-[#d45c4d]"}`}>{entry.id}</span><strong className="text-sm leading-6">{zh ? entry.name.zh : entry.name.en}</strong><p className="text-sm leading-6 text-foreground/78">{zh ? entry.definition.zh : entry.definition.en}</p><div className="text-sm leading-6 text-foreground/68"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground/50 md:hidden">{t("Indicators", "量化指标")}</span>{entry.indicators.length > 0 ? entry.indicators.map((indicator) => <span key={indicator.en} className="block">{zh ? indicator.zh : indicator.en}</span>) : t("In development", "指标构建中")}</div></div>)}</div>)}
        </div>
        {filteredRisks.length === 0 && <p className="py-14 text-center text-sm text-foreground/60">{t("No matching risk found.", "未找到匹配的风险。")}</p>}
      </section>

      <section id="analytical-views" className="border-t border-border py-20"><div className="mb-10 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Cross-cutting analytical views", "交叉分析维度")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("Trace risk migration and amplification", "追踪风险的阶段迁移与层级放大")}</h2></div><p className="self-end text-lg leading-8 text-foreground/75">{t("The 55 atomic risks are positioned through two complementary lenses. The lifecycle view identifies when a risk may emerge; the amplification hierarchy explains the level at which it acts and how damage can intensify.", "55项原子风险通过两个互补维度进行定位：全生命周期用于识别风险可能出现在哪个运行环节，风险放大层级用于判断风险作用于哪个层面，以及损失如何逐级增强。")}</p></div><ResearchFigures zh={zh} /></section>

      <section id="transmission-path" className="border-t border-border py-20">
        <RiskTransmissionFigure zh={zh} />
      </section>

      <section id="outputs" className="border-t border-border py-20">
        <div className="mb-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Research outputs", "研究成果")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("Published status and continuing work", "已接收成果与持续研究")}</h2></div>
        <article className="grid gap-7 border-y border-border py-8 lg:grid-cols-[220px_1fr_auto] lg:items-center"><div><span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />{t("Accepted conference paper", "已接收会议论文")}</span><p className="mt-2 text-sm text-foreground/58">AI-DEFIT 2026</p></div><div><h3 className="text-xl font-semibold leading-tight">Establishing a Multi-Dimensional Risk Framework over the Full Lifecycle of Stablecoins</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/72">{t("The accepted paper formalises the 55-risk taxonomy and the lifecycle-amplification analytical framework.", "论文系统构建55项原子风险，并提出生命周期与风险放大两个交叉分析维度。")}</p></div><a href="/media/research/ai-defit-2026-stablecoin-risk-framework.pdf" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Download className="h-4 w-4" />{t("Download PDF", "下载PDF")}</a></article>
        <article className="grid gap-7 border-b border-border py-8 lg:grid-cols-[220px_1fr_auto] lg:items-center"><div><span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300"><Clock3 className="h-4 w-4" />{t("Research progress", "阶段性研究成果")}</span><p className="mt-2 text-sm text-foreground/58">{t("Chinese manuscript", "中文研究稿")}</p></div><div><h3 className="text-xl font-semibold leading-tight">{t("Establishing and Exploring a Multi-Dimensional Risk System over the Full Lifecycle of Stablecoins", "稳定币全生命周期多元风险体系建立及探讨")}</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/72">{t("Compared with the accepted paper, the Chinese manuscript develops the risk-transmission process in greater detail and extends the discussion to cross-jurisdiction regulatory coverage and the next stage of quantitative research.", "相较于已接收论文，中文稿进一步展开风险传导过程，并补充跨辖区监管覆盖比较及下一阶段量化研究方向。")}</p></div><span className="inline-flex items-center gap-2 text-sm text-foreground/58"><FileText className="h-4 w-4" />{t("Research record", "研究记录")}</span></article>
      </section>
    </div>
  );
}
