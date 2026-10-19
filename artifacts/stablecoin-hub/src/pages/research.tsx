import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Download, Expand, FileText, Layers3, Network, Radar, Search, ShieldCheck, Workflow, X } from "lucide-react";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MODULES, LIFECYCLE, AMPLIFICATION } from "@/data/conference-risk-framework";
import { TAXONOMY_BOUNDARY } from "@/data/home-research";
const researchRisks = [...new Map(MODULES.flatMap(module => module.risks.map(risk => [risk.id, { id:risk.id, family:risk.id.startsWith("C") ? "common" : "unique", name:{en:risk.name[0],zh:risk.name[1]}, dimension:{en:module.title[0],zh:module.title[1]}, definition:{en:"Representative example from the conference study; a complete individual definition is not supplied here.",zh:"会议研究中的代表性示例；此处未提供完整的个体定义。"}, indicators:[] as {en:string;zh:string}[] } ] as const))).values()];
import { useLanguage } from "@/lib/language-context";

type Figure = { src: string; alt: string };

const riskById = new Map(researchRisks.map((risk) => [risk.id, risk]));

const lifecycleRiskCodes: Record<string, string[]> = Object.fromEntries(LIFECYCLE.map(row => [row.level, row.risks.map(r => r.id)]));

const amplificationRiskCodes: Record<string, string[]> = Object.fromEntries(AMPLIFICATION.map(row => [row.level, row.risks.map(r => r.id)]));

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
                ) : <p className="mt-2 text-sm text-foreground/62">{zh ? "未提供" : "Not specified in this conference example"}</p>}
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

function ResearchFigures({zh}:{zh:boolean}) {
 const [mode,setMode]=useState<"lifecycle"|"amplification">("lifecycle");
 const rows=mode==="lifecycle"?LIFECYCLE:AMPLIFICATION;
 return <div className="border-t border-border pt-2"><div className="flex border-b border-border">{(["lifecycle","amplification"] as const).map(id=><button key={id} onClick={()=>setMode(id)} className={`px-4 py-3 text-sm font-semibold ${mode===id?"border-b-2 border-primary text-primary":"text-foreground/65"}`}>{id==="lifecycle"?(zh?"全生命周期":"Lifecycle"):(zh?"风险放大层级":"Amplification tiers")}</button>)}</div><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{rows.map(row=><article key={row.level} className="border-t-4 border-primary pt-3"><strong>{row.level}</strong><h3 className="mt-2 font-semibold">{row.title[zh?1:0]}</h3><p className="mt-3 text-sm leading-6">{row.description[zh?1:0]}</p><RiskCodeList ids={row.risks.map(r=>r.id)} zh={zh}/></article>)}</div><p className="mt-5 text-sm text-muted-foreground">{zh?"仅展示会议研究已提供的代表性映射；未重建完整55项名单。":"Only the conference study’s representative mappings are shown; the complete 55-item list is not reconstructed."}</p></div>;
}

function RiskTransmissionFigure({zh}:{zh:boolean}) {return <div className="border-y border-border py-8"><h2 className="font-serif text-3xl text-primary">{zh?"风险传导与未来研究":"Transmission and future research"}</h2><p className="mt-5 text-base leading-8">{zh?"会议论文提供概念拆解和映射。完整传导模型、量化指标、实证验证与运行中的预警系统属于未来研究，不作为本站已完成成果。":"The conference paper provides conceptual decomposition and mapping. Complete transmission models, quantitative indicators, empirical validation and an operational warning system are future work, not completed website outputs."}</p></div>;}

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
    { id: "risk-atlas", label: t("Representative risk examples", "代表性风险示例") },
    { id: "analytical-views", label: t("Analytical views", "分析维度") },
    { id: "transmission-path", label: t("Transmission path", "风险传导") },
    { id: "outputs", label: t("Research outputs", "研究成果") },
  ], [t]);

  return (
    <div className="mx-auto max-w-[1480px]">
      <p className="mb-6 border-l-2 border-primary pl-4 text-sm leading-7">{t(TAXONOMY_BOUNDARY[0],TAXONOMY_BOUNDARY[1])}</p>
      <ContentEdgeNav label={t("On this page", "本页目录")} items={navItems} />
      <section id="research-question" className="grid min-h-[470px] items-center gap-12 border-b border-border pb-16 pt-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Our research", "课题组研究")}</p><h1 className="mt-5 max-w-3xl font-serif text-3xl font-semibold leading-tight text-primary sm:text-4xl">{t("Stablecoin risk: conference framework and future research", "稳定币风险：会议框架与未来研究")}</h1><p className="mt-7 max-w-2xl text-lg leading-8 text-foreground/80">{t("The accepted conference study offers conceptual risk decomposition and mapping. Measurement, empirical validation and early warning remain future research.", "已接收的会议研究贡献是概念风险拆解与映射；测量、实证验证与风险预警仍属未来研究。")}</p></div>
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,rgba(49,87,200,0.10),rgba(7,139,127,0.07)_52%,rgba(212,92,77,0.09))] p-7 sm:p-10"><div className="flex items-center justify-between gap-5"><span className="text-xs font-semibold uppercase tracking-wider text-primary">{t("Research foundation", "研究基础")}</span><Radar className="h-8 w-8 text-primary" /></div><div className="mt-14 grid grid-cols-2 gap-7 sm:grid-cols-4">{[{ n: "55", l: t("atomic risks", "项原子风险") }, { n: "2", l: t("risk families", "类风险特质") }, { n: "4", l: t("lifecycle stages", "个生命周期阶段") }, { n: "4", l: t("amplification tiers", "个风险放大层级") }].map((metric) => <div key={metric.l} className="border-t border-foreground/25 pt-3"><strong className="block text-4xl font-semibold tabular-nums text-primary">{metric.n}</strong><span className="mt-1 block text-sm leading-5 text-foreground/70">{metric.l}</span></div>)}</div><div className="mt-14 flex items-center gap-3 text-sm font-semibold text-primary"><span className="h-2 w-2 rounded-full bg-chart-2" />{t("Primary goal: stablecoin risk early-warning platform", "首要研究计划：稳定币风险预警平台")}</div></div>
      </section>

      <section id="research-logic" className="py-20">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Research architecture", "研究架构")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("From risk traits to an operational warning system", "从风险特质走向可运行的预警系统")}</h2></div><p className="self-end text-lg leading-8 text-foreground/78">{t("Stablecoins combine conventional financial-asset risks with risks native to blockchain infrastructure and programmable protocols. The submitted framework identifies 55 atomic risks; representative conference examples support conceptual mapping. Indicators, regulatory mapping and warning models remain future research.", "稳定币同时承载传统金融资产的一般性风险，以及区块链基础设施和可编程协议带来的特殊风险。已提交框架包含55项原子风险；本站仅展示会议研究提供的代表性映射。指标设计、监管映射与预警模型仍为未来研究。")}</p></div>
        <div className="mt-12 border-y border-border py-10"><div className="grid items-center gap-6 lg:grid-cols-[1fr_70px_0.72fr_70px_1fr_70px_0.9fr]">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><div className="border-l-4 border-[#3157c8] pl-5"><ShieldCheck className="h-6 w-6 text-[#3157c8]" /><h3 className="mt-3 text-lg font-semibold">{t("Traditional financial risk traits", "传统金融风险特质")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Balance sheets, custody, compliance, liquidity and holder behaviour.", "资产负债表、托管、合规、流动性与持有者行为。")}</p></div><div className="border-l-4 border-[#d45c4d] pl-5"><Network className="h-6 w-6 text-[#d45c4d]" /><h3 className="mt-3 text-lg font-semibold">{t("Crypto-native risk traits", "稳定币特殊金融风险特质")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Blockchains, contracts, oracles, bridges, composability and endogenous mechanisms.", "公链、合约、预言机、跨链、可组合性与内生机制。")}</p></div></div>
          <div className="hidden h-px bg-primary/30 lg:block" /><div className="text-center"><strong className="font-serif text-6xl text-primary">55</strong><span className="mt-2 block text-sm font-semibold">{t("atomic risks", "项原子风险")}</span></div><div className="hidden h-px bg-primary/30 lg:block" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><div><Layers3 className="h-6 w-6 text-[#078b7f]" /><h3 className="mt-3 font-semibold">{t("Quantitative assessment", "量化评估")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Indicators, thresholds, exposure and interaction effects.", "指标、阈值、敞口与交互效应。")}</p></div><div><Workflow className="h-6 w-6 text-[#7f56a6]" /><h3 className="mt-3 font-semibold">{t("Regulatory coverage", "监管覆盖度")}</h3><p className="mt-2 text-sm leading-6 text-foreground/68">{t("Planned: map rules to atomic risks and identify blind spots.", "后续研究：将监管要求映射到原子风险并识别盲区。")}</p></div></div>
          <div className="hidden h-px bg-primary/30 lg:block" /><div className="bg-primary px-6 py-8 text-primary-foreground"><Radar className="h-7 w-7" /><h3 className="mt-4 text-xl font-semibold">{t("Stablecoin risk early-warning platform", "稳定币风险预警平台")}</h3><p className="mt-3 text-sm leading-6 text-primary-foreground/75">{t("Future direction: monitoring, risk signals and interpretable alerts; no operational system is claimed.", "未来方向：持续监测、风险信号与可解释预警；不声称已有运行系统。")}</p></div>
        </div></div>
      </section>

      <section id="risk-atlas" className="border-t border-border py-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Atomic-risk atlas", "原子风险图谱")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("Representative risks in the conference study", "会议研究中的代表性风险")}</h2></div><p className="self-end text-lg leading-8 text-foreground/75">{t("55 is the submitted-framework count. This page shows only representative risks supplied by the conference study, not the complete taxonomy.", "55是已提交框架的总数；本页仅展示会议研究提供的代表性风险，不重建完整分类名单。")}</p></div>
        <div className="mt-9 flex flex-col gap-4 border-y border-border py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap gap-2">{(["all", "common", "unique"] as const).map((value) => <button key={value} onClick={() => setFamily(value)} className={`h-9 rounded-md px-4 text-sm font-semibold ${family === value ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>{value === "all" ? t("All examples", "全部示例") : value === "common" ? t("Common examples", "一般性示例") : t("Crypto-native examples", "特殊性示例")}</button>)}</div><label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/45" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search ID, risk name or definition", "搜索编号、风险名称或定义")} className="h-10 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm" /></label></div>
        <div className="mt-8 border-y border-border">
          <div className="hidden grid-cols-[64px_minmax(170px,0.72fr)_minmax(0,1.55fr)_minmax(160px,0.72fr)] gap-5 bg-muted/55 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-foreground/65 md:grid"><span>{t("ID", "编号")}</span><span>{t("Risk", "风险名称")}</span><span>{t("Definition", "风险定义")}</span><span>{t("Indicators", "量化指标")}</span></div>
          {riskGroups.map(([dimension, entries]) => <div key={dimension}><div className="flex items-center justify-between border-t border-border bg-primary/[0.045] px-5 py-3 first:border-t-0"><span><span className="mr-3 text-xs font-semibold uppercase tracking-wider text-primary">{entries[0].family === "common" ? t("Common", "一般性") : t("Unique", "特殊性")}</span><strong className="text-sm">{dimension}</strong></span><span className="text-xs tabular-nums text-foreground/55">{entries.length}</span></div>{entries.map((entry) => <div key={entry.id} className="grid gap-2 border-t border-border px-5 py-4 md:grid-cols-[64px_minmax(170px,0.72fr)_minmax(0,1.55fr)_minmax(160px,0.72fr)] md:gap-5"><span className={`text-sm font-bold ${entry.family === "common" ? "text-[#3157c8]" : "text-[#d45c4d]"}`}>{entry.id}</span><strong className="text-sm leading-6">{zh ? entry.name.zh : entry.name.en}</strong><p className="text-sm leading-6 text-foreground/78">{zh ? entry.definition.zh : entry.definition.en}</p><div className="text-sm leading-6 text-foreground/68"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground/50 md:hidden">{t("Indicators", "量化指标")}</span>{entry.indicators.length > 0 ? entry.indicators.map((indicator) => <span key={indicator.en} className="block">{zh ? indicator.zh : indicator.en}</span>) : t("Not specified", "未提供")}</div></div>)}</div>)}
        </div>
        {filteredRisks.length === 0 && <p className="py-14 text-center text-sm text-foreground/60">{t("No matching risk found.", "未找到匹配的风险。")}</p>}
      </section>

      <section id="analytical-views" className="border-t border-border py-20"><div className="mb-10 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Cross-cutting analytical views", "交叉分析维度")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("Trace risk migration and amplification", "追踪风险的阶段迁移与层级放大")}</h2></div><p className="self-end text-lg leading-8 text-foreground/75">{t("The submitted framework uses two complementary lenses; the mappings shown below are representative examples. The lifecycle view identifies when a risk may emerge; the amplification hierarchy explains the level at which it acts and how damage can intensify.", "已提交框架通过两个互补维度进行定位，以下仅展示代表性映射：全生命周期用于识别风险可能出现在哪个运行环节，风险放大层级用于判断风险作用于哪个层面，以及损失如何逐级增强。")}</p></div><ResearchFigures zh={zh} /></section>

      <section id="transmission-path" className="border-t border-border py-20">
        <RiskTransmissionFigure zh={zh} />
      </section>

      <section id="outputs" className="border-t border-border py-20">
        <div className="mb-12"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("Research outputs", "研究成果")}</p><h2 className="mt-3 font-serif text-3xl font-semibold text-primary sm:text-4xl">{t("Accepted study and future work", "已接收研究与未来工作")}</h2></div>
        <article className="grid gap-7 border-y border-border py-8 lg:grid-cols-[220px_1fr_auto] lg:items-center"><div><span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />{t("Accepted conference paper", "已接收会议论文")}</span><p className="mt-2 text-sm text-foreground/58">AI-DEFIT 2026</p></div><div><h3 className="text-xl font-semibold leading-tight">Establishing a Multi-Dimensional Risk Framework over the Full Lifecycle of Stablecoins</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/72">{t("The accepted paper contributes conceptual decomposition and lifecycle/amplification mapping; 55 is its framework count, not a verified public list on this site.", "论文贡献为概念拆解与生命周期、放大传导映射；55是框架总数，不代表本站已核验公开完整名单。")}</p></div><a href="/media/research/ai-defit-2026-stablecoin-risk-framework.pdf" target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Download className="h-4 w-4" />{t("Submitted anonymised manuscript (PDF)", "匿名送审稿 (PDF)")}</a></article>
        <article className="grid gap-7 border-b border-border py-8 lg:grid-cols-[220px_1fr_auto] lg:items-center"><div><span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300"><Clock3 className="h-4 w-4" />{t("Future research", "未来研究")}</span><p className="mt-2 text-sm text-foreground/58">{t("Future directions", "未来研究方向")}</p></div><div><h3 className="text-xl font-semibold leading-tight">{t("Measurement, regulatory mapping and empirical validation", "测量设计、监管映射与实证验证")}</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-foreground/72">{t("These are proposed research directions, not completed manuscript findings or an operating monitoring service.", "以上为拟开展的研究方向，不作为已完成中文研究稿成果或运行中的监测服务。")}</p></div><span className="inline-flex items-center gap-2 text-sm text-foreground/58"><FileText className="h-4 w-4" />{t("Research record", "研究记录")}</span></article>
      </section>
    </div>
  );
}
