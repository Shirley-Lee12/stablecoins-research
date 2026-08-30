import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as ChartTooltip } from "recharts";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import {
  ArrowRight,
  Building2,
  ExternalLink,
  GitMerge,
  RefreshCcw,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  WalletCards,
} from "lucide-react";
import { MECHANISMS, MECHANISM_COLORS } from "@/lib/stablecoin-mechanisms";

type MarketProject = {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  mechanism: string;
  currentMarketCapUsd: number;
  historicalPeakUsd: number | null;
  status: "active" | "historical";
  statusReason: "collapsed" | "discontinued" | null;
  statusDate: string | null;
  officialUrl: string | null;
  sourceUrl: string;
};

type MarketSnapshot = {
  source: "DefiLlama";
  sourceUrl: string;
  refreshedAt: string;
  projects: MarketProject[];
};

type MechanismLens = {
  referenceEn: string;
  referenceZh: string;
  backingEn: string;
  backingZh: string;
  stabilisationEn: string;
  stabilisationZh: string;
  accessEn: string;
  accessZh: string;
};

const MECHANISM_LENSES: Record<string, MechanismLens> = {
  "fiat-backed": {
    referenceEn: "Usually one sovereign currency",
    referenceZh: "通常锚定单一主权货币",
    backingEn: "Cash and high-quality liquid assets",
    backingZh: "现金与高质量流动性资产",
    stabilisationEn: "Primary issuance and redemption near par",
    stabilisationZh: "接近面值的一级发行、赎回与套利",
    accessEn: "Transfer is broad; direct redemption follows issuer rules",
    accessZh: "转移通常开放；直接赎回受发行人规则约束",
  },
  "crypto-backed": {
    referenceEn: "Usually one sovereign currency",
    referenceZh: "通常锚定单一主权货币",
    backingEn: "Overcollateralised on-chain crypto assets",
    backingZh: "链上超额抵押的加密资产",
    stabilisationEn: "Liquidation, fees, and market arbitrage",
    stabilisationZh: "清算、费用调节与市场套利",
    accessEn: "Holding and protocol use are commonly permissionless",
    accessZh: "持有与协议使用通常无需许可",
  },
  synthetic: {
    referenceEn: "Usually one sovereign currency",
    referenceZh: "通常锚定单一主权货币",
    backingEn: "Collateral combined with offsetting hedge positions",
    backingZh: "抵押资产与方向相反的对冲头寸",
    stabilisationEn: "Hedge rebalancing, minting, redemption, and arbitrage",
    stabilisationZh: "对冲再平衡、铸造赎回与套利",
    accessEn: "Holding may be open; minting and redemption can be restricted",
    accessZh: "持有可开放；铸造和赎回可能受限",
  },
  algorithmic: {
    referenceEn: "Usually one sovereign currency",
    referenceZh: "通常锚定单一主权货币",
    backingEn: "Endogenous tokens, partial reserves, or no full reserve",
    backingZh: "内生代币、部分储备或无充分储备",
    stabilisationEn: "Supply rules, paired-token conversion, and incentives",
    stabilisationZh: "供给调节、配对代币兑换与激励",
    accessEn: "Holding is commonly open; assured par redemption is limited",
    accessZh: "持有通常开放；按面值赎回保障有限",
  },
  other: {
    referenceEn: "Varies by project",
    referenceZh: "因项目而异",
    backingEn: "Requires project-level verification",
    backingZh: "需要逐项核验",
    stabilisationEn: "Requires project-level verification",
    stabilisationZh: "需要逐项核验",
    accessEn: "Varies by project",
    accessZh: "因项目而异",
  },
};

const QUESTIONS = [
  { key: "reference", icon: Building2, en: "Reference", zh: "锚定对象", bodyEn: "What value does it target?", bodyZh: "目标保持什么价值？" },
  { key: "backing", icon: ShieldCheck, en: "Backing", zh: "价值支撑", bodyEn: "What funds redemptions and absorbs losses?", bodyZh: "什么支持赎回并承担损失？" },
  { key: "stabilisation", icon: RefreshCcw, en: "Stabilisation", zh: "稳定方式", bodyEn: "How is the peg restored after a deviation?", bodyZh: "价格偏离后，如何恢复锚定？" },
  { key: "access", icon: WalletCards, en: "Access", zh: "使用与赎回", bodyEn: "Who may hold, transfer, and redeem it?", bodyZh: "谁可以持有、转移和赎回？" },
] as const;

const CAUSAL_INPUTS = QUESTIONS.filter((question) => question.key !== "stabilisation");

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

function formatUsd(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function mechanismLabel(value: string, zh: boolean) {
  const found = MECHANISMS.find((item) => item.id === value);
  return found ? (zh ? found.zh : found.en) : value;
}

function projectAmount(project: MarketProject) {
  return project.status === "historical" ? project.historicalPeakUsd ?? 0 : project.currentMarketCapUsd;
}

function historicalStatus(project: MarketProject, zh: boolean) {
  const reason = project.statusReason === "collapsed"
    ? (zh ? "已崩溃" : "Collapsed")
    : (zh ? "已终止" : "Discontinued");
  if (!project.statusDate) return reason;
  const [year, month] = project.statusDate.split("-").map(Number);
  const date = new Intl.DateTimeFormat(zh ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return `${reason}（${date}）`;
}

export default function AboutTypesPage() {
  const { t, language } = useLanguage();
  const { user, token } = useAuth();
  const zh = language === "zh";
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [status, setStatus] = useState<"all" | "active" | "historical">("all");
  const [selectedMechanism, setSelectedMechanism] = useState("all");
  const [focusedMechanism, setFocusedMechanism] = useState("fiat-backed");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async (force = false) => {
    setError(null);
    if (force) setRefreshing(true); else setLoading(true);
    try {
      const response = await fetch(`${apiBase()}/api/stablecoin-market${force ? "/refresh" : ""}`, {
        method: force ? "POST" : "GET",
        headers: force ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error("Unable to load market data");
      setSnapshot(await response.json());
    } catch {
      setError(t("Market data is temporarily unavailable. Please try again later.", "市场数据暂时不可用，请稍后重试。"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const summaries = useMemo(() => {
    const grouped = new Map<string, { mechanism: string; activeTotal: number; historicalPeakTotal: number; activeCount: number; historicalCount: number }>();
    for (const project of snapshot?.projects ?? []) {
      const value = grouped.get(project.mechanism) ?? {
        mechanism: project.mechanism,
        activeTotal: 0,
        historicalPeakTotal: 0,
        activeCount: 0,
        historicalCount: 0,
      };
      if (project.status === "historical") {
        value.historicalPeakTotal += project.historicalPeakUsd ?? 0;
        value.historicalCount += 1;
      } else {
        value.activeTotal += project.currentMarketCapUsd;
        value.activeCount += 1;
      }
      grouped.set(project.mechanism, value);
    }
    return [...grouped.values()].sort((a, b) => (b.activeTotal - a.activeTotal) || (b.historicalPeakTotal - a.historicalPeakTotal));
  }, [snapshot]);

  const activeMarketTotal = useMemo(
    () => summaries.reduce((total, item) => total + item.activeTotal, 0),
    [summaries],
  );

  const shareData = useMemo(() => summaries
    .filter((item) => item.activeTotal > 0)
    .map((item) => ({ ...item, value: item.activeTotal, label: mechanismLabel(item.mechanism, zh) })), [summaries, zh]);

  const visibleProjects = useMemo(() => (snapshot?.projects ?? [])
    .filter((item) => status === "all" || item.status === status)
    .filter((item) => selectedMechanism === "all" || item.mechanism === selectedMechanism)
    .sort((a, b) => projectAmount(b) - projectAmount(a)), [snapshot, status, selectedMechanism]);

  const activeMechanism = selectedMechanism === "all" ? focusedMechanism : selectedMechanism;

  const chooseMechanism = (mechanism: string) => {
    setFocusedMechanism(mechanism);
    setSelectedMechanism((current) => current === mechanism ? "all" : mechanism);
  };

  const resetFilters = () => {
    setStatus("all");
    setSelectedMechanism("all");
  };

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-10 overflow-x-clip">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "type-questions", label: t("Four questions", "四个问题") },
        { id: "type-mechanisms", label: t("Mechanism map", "机制图谱") },
        { id: "type-market", label: t("Market share", "市场份额") },
        { id: "stablecoin-projects", label: t("Project comparison", "项目比较") },
      ]} />
      <header className="border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("About Stablecoins", "关于稳定币")}</p>
        <h1 className="mt-3 text-3xl font-serif font-bold text-primary">{t("Stablecoin Types", "稳定币类别")}</h1>
        <p className="mt-2 max-w-4xl editorial-copy">{t("Classify stablecoins by what backs them and how they restore the peg, while keeping the reference value and access arrangements visible. Mechanism labels describe economic design, not legal status or safety.", "依据价值支撑和恢复锚定的方式划分稳定币，同时保留锚定对象与使用权限信息。机制标签描述经济设计，并不等同于法律属性或安全评价。")}</p>
      </header>

      <section id="type-questions" className="scroll-mt-24">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-serif font-bold text-primary">{t("Read Every Stablecoin Through Four Questions", "用四个问题理解稳定币")}</h2>
          <p className="mt-2 editorial-note">{t("The questions are connected. Reference defines the promise; backing and access determine whether redemptions and arbitrage can support it; stabilisation turns those conditions into a working peg.", "四个问题彼此关联：锚定对象界定承诺，价值支撑与使用权限决定赎回和套利能否发挥作用，稳定机制再将这些条件转化为可持续的锚定。")}</p>
        </div>
        <div className="relative mt-9 hidden min-h-[390px] overflow-hidden lg:block" aria-label={t("Causal diagram connecting four stablecoin questions", "稳定币四个问题的因果关联图") }>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1200 390" preserveAspectRatio="none" aria-hidden="true">
            <path d="M270 70 C430 70 430 195 585 195" fill="none" stroke="#3558c9" strokeWidth="8" strokeLinecap="round" opacity=".5" />
            <path d="M270 195 C430 195 470 195 585 195" fill="none" stroke="#138a7e" strokeWidth="12" strokeLinecap="round" opacity=".62" />
            <path d="M270 320 C430 320 430 195 585 195" fill="none" stroke="#c58a19" strokeWidth="8" strokeLinecap="round" opacity=".5" />
            <path d="M720 195 C820 195 865 195 950 195" fill="none" stroke="#d45d4c" strokeWidth="14" strokeLinecap="round" opacity=".72" />
          </svg>
          <div className="absolute inset-y-0 left-0 flex w-[27%] flex-col justify-between py-3">
            {CAUSAL_INPUTS.map((question, index) => <article key={question.key} className="relative z-10 grid grid-cols-[3rem_1fr] gap-4 bg-background py-3 pr-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: ["#3558c9", "#138a7e", "#c58a19"][index] }}><question.icon className="h-5 w-5" /></span>
              <div><p className="text-lg font-semibold">{zh ? question.zh : question.en}</p><p className="mt-1 text-[15px] leading-6 text-foreground/80">{zh ? question.bodyZh : question.bodyEn}</p></div>
            </article>)}
          </div>
          <div className="absolute left-[48%] top-1/2 z-10 flex h-44 w-44 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-primary px-6 text-center text-primary-foreground shadow-[0_18px_55px_rgba(32,56,120,.18)]">
            <GitMerge className="h-7 w-7" />
            <p className="mt-3 text-lg font-semibold">{t("Stabilisation", "稳定方式")}</p>
            <p className="mt-1 text-sm leading-5 text-primary-foreground/82">{t("Restore the target after deviation", "价格偏离后恢复锚定")}</p>
          </div>
          <div className="absolute right-0 top-1/2 z-10 w-[22%] -translate-y-1/2 bg-background py-5 pl-6">
            <Target className="h-9 w-9 text-[#d45d4c]" />
            <p className="mt-4 text-xl font-semibold">{t("Peg performance", "锚定表现")}</p>
            <p className="mt-2 editorial-note">{t("The same target can conceal very different liquidity, loss absorption, and failure paths.", "相同的锚定目标，可能隐藏完全不同的流动性、损失吸收能力与失效路径。")}</p>
          </div>
        </div>
        <div className="relative mt-8 space-y-7 pl-7 lg:hidden">
          <span className="absolute bottom-10 left-[1.35rem] top-6 w-1 rounded-full bg-primary/18" aria-hidden="true" />
          {CAUSAL_INPUTS.map((question, index) => <article key={question.key} className="relative grid grid-cols-[2.75rem_1fr] gap-4">
            <span className="z-10 flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: ["#3558c9", "#138a7e", "#c58a19"][index] }}><question.icon className="h-5 w-5" /></span>
            <div><p className="text-lg font-semibold">{zh ? question.zh : question.en}</p><p className="mt-1 editorial-note">{zh ? question.bodyZh : question.bodyEn}</p></div>
          </article>)}
          <article className="relative grid grid-cols-[2.75rem_1fr] gap-4">
            <span className="z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground"><GitMerge className="h-5 w-5" /></span>
            <div><p className="text-lg font-semibold">{t("Stabilisation → peg performance", "稳定方式 → 锚定表现")}</p><p className="mt-1 editorial-note">{t("Observe how the design restores the target and where it can fail.", "观察机制如何恢复锚定，以及它可能在哪里失效。")}</p></div>
          </article>
        </div>
      </section>

      <section id="type-mechanisms" className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-primary">{t("Mechanisms in the Market", "市场中的稳定机制")}</h2>
            <p className="mt-2 max-w-3xl editorial-note">{t("Market share reflects the current scale of each mechanism, while the mechanism paths trace differences in backing, stabilisation and redemption.", "市场份额反映不同机制的当前规模；机制路径则呈现价值支撑、稳定方式与赎回安排的差异。")}</p>
          </div>
          {selectedMechanism !== "all" && <button type="button" onClick={() => setSelectedMechanism("all")} className="text-sm font-semibold text-primary hover:underline">{t("Show all mechanisms", "显示全部机制")}</button>}
        </div>
        {loading ? <div className="mt-5 py-10 text-sm text-muted-foreground">{t("Loading market data…", "正在加载市场数据…")}</div> : error ? <div className="mt-5 border-l-4 border-destructive bg-destructive/5 p-5 text-sm text-destructive">{error}</div> : <div id="type-market" className="mt-8 scroll-mt-24 grid gap-10 lg:grid-cols-[minmax(270px,.72fr)_1.28fr]">
          <div className="relative h-72 min-w-0" role="img" aria-label={t("Donut chart of active stablecoin market share by mechanism", "按机制划分的运行中稳定币市场份额环图")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={shareData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="58%" outerRadius="86%" paddingAngle={1} isAnimationActive={false} onClick={(_, index) => chooseMechanism(shareData[index]?.mechanism ?? "all")}>
                  {shareData.map((item) => <Cell key={item.mechanism} fill={MECHANISM_COLORS[item.mechanism]} fillOpacity={activeMechanism === item.mechanism ? 1 : 0.38} stroke="hsl(var(--background))" strokeWidth={3} className="cursor-pointer" />)}
                </Pie>
                <ChartTooltip formatter={(value) => formatUsd(Number(value))} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 4, boxShadow: "none" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="editorial-kicker">{t("Active total", "当前总额")}</span>
              <span className="mt-2 text-3xl editorial-number">{formatUsd(activeMarketTotal)}</span>
            </div>
          </div>
          <div className="self-center divide-y divide-border/80 border-y border-border/80">
            {shareData.map((item) => {
              const selected = activeMechanism === item.mechanism;
              const share = activeMarketTotal > 0 ? (item.activeTotal / activeMarketTotal) * 100 : 0;
              return <button key={item.mechanism} type="button" onMouseEnter={() => setFocusedMechanism(item.mechanism)} onFocus={() => setFocusedMechanism(item.mechanism)} onClick={() => chooseMechanism(item.mechanism)} className={`grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4 text-left transition-colors hover:text-primary ${selected ? "text-primary" : ""}`}>
                <span className={`h-4 w-4 rounded-full transition-transform ${selected ? "scale-125" : ""}`} style={{ backgroundColor: MECHANISM_COLORS[item.mechanism] }} />
                <span><span className="block text-base font-semibold">{item.label}</span><span className="mt-0.5 block text-sm text-muted-foreground">{item.activeCount} {t("active projects", "个运行项目")}</span></span>
                <span className="text-right"><span className="block text-xl editorial-number">{share.toFixed(1)}%</span><span className="mt-0.5 block text-sm tabular-nums text-muted-foreground">{formatUsd(item.activeTotal)}</span></span>
              </button>;
            })}
          </div>
        </div>}

        <div className="mt-10 hidden border-y border-border/80 lg:block">
          <div className="grid grid-cols-[11rem_repeat(4,minmax(0,1fr))_2rem] gap-5 border-b border-border/80 py-3 text-xs font-semibold uppercase text-muted-foreground">
            <span>{t("Mechanism", "机制")}</span><span>{t("Reference", "锚定对象")}</span><span>{t("Backing", "价值支撑")}</span><span>{t("Stabilisation", "稳定方式")}</span><span>{t("Access", "使用与赎回")}</span><span />
          </div>
          {MECHANISMS.filter((item) => item.id !== "other").map((item) => {
            const lens = MECHANISM_LENSES[item.id];
            const selected = activeMechanism === item.id;
            return <article key={item.id} id={`mechanism-${item.id}`} onMouseEnter={() => setFocusedMechanism(item.id)} className={`grid scroll-mt-24 grid-cols-[11rem_repeat(4,minmax(0,1fr))_2rem] gap-5 border-b border-border/70 py-5 transition-colors last:border-b-0 ${selected ? "bg-primary/[0.045]" : ""}`}>
              <button type="button" onClick={() => chooseMechanism(item.id)} className="flex items-start gap-3 text-left"><span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: MECHANISM_COLORS[item.id] }} /><span className="font-semibold leading-6">{zh ? item.zh : item.en}</span></button>
              {["reference", "backing", "stabilisation", "access"].map((key) => <div key={key} className="relative pl-4 text-[15px] leading-6 text-foreground/84"><span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: MECHANISM_COLORS[item.id] }} />{zh ? lens[`${key}Zh` as keyof MechanismLens] : lens[`${key}En` as keyof MechanismLens]}</div>)}
              <Link href={`/about-stablecoins/types/${item.id}`} aria-label={t(`Open detailed guide for ${item.en}`, `打开${item.zh}详细介绍`)} className="text-primary hover:translate-x-0.5"><ArrowRight className="h-5 w-5" /></Link>
            </article>;
          })}
        </div>

        <div className="mt-9 space-y-8 lg:hidden">
          {MECHANISMS.filter((item) => item.id !== "other").map((item) => {
            const lens = MECHANISM_LENSES[item.id];
            const selected = activeMechanism === item.id;
            return <article key={item.id} className={selected ? "" : "opacity-70"}>
              <div className="flex items-center justify-between gap-4"><button type="button" onClick={() => chooseMechanism(item.id)} className="flex items-center gap-3 text-left text-lg font-semibold"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: MECHANISM_COLORS[item.id] }} />{zh ? item.zh : item.en}</button><Link href={`/about-stablecoins/types/${item.id}`} className="text-primary"><ArrowRight className="h-5 w-5" /></Link></div>
              <dl className="relative mt-5 space-y-5 border-l-2 pl-6" style={{ borderLeftColor: MECHANISM_COLORS[item.id] }}>
                {[{ key: "reference", label: t("Reference", "锚定对象") }, { key: "backing", label: t("Backing", "价值支撑") }, { key: "stabilisation", label: t("Stabilisation", "稳定方式") }, { key: "access", label: t("Access", "使用与赎回") }].map(({ key, label }) => <div key={key} className="relative"><span className="absolute -left-[1.7rem] top-1.5 h-2 w-2 rounded-full bg-background ring-2" style={{ color: MECHANISM_COLORS[item.id] }} /><dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt><dd className="mt-1 text-[15px] leading-6">{zh ? lens[`${key}Zh` as keyof MechanismLens] : lens[`${key}En` as keyof MechanismLens]}</dd></div>)}
              </dl>
            </article>;
          })}
        </div>
        <p className="mt-6 editorial-note">{t("The chart compares current circulating market capitalisation only. Historical peaks remain separate in the project table.", "图中仅比较当前流通市值；历史峰值仍在项目表中单独显示。")}</p>
      </section>

      <section id="stablecoin-projects" className="scroll-mt-20 border-t border-border pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-primary">{t("Stablecoin Projects", "稳定币项目")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("A flat view sorted by size makes projects across mechanisms directly comparable.", "采用按规模排序的平铺列表，便于直接比较不同机制下的项目。")}</p>
          </div>
          {user?.role === "admin" && <Button type="button" variant="outline" onClick={() => void load(true)} disabled={refreshing} className="h-10"><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? t("Updating", "更新中") : t("Update market data", "更新市场数据")}</Button>}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3 border-y border-border py-4">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Mechanism", "机制")}<select value={selectedMechanism} onChange={(event) => setSelectedMechanism(event.target.value)} className="mt-2 block h-10 min-w-48 border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-primary"><option value="all">{t("All mechanisms", "全部机制")}</option>{MECHANISMS.map((item) => <option key={item.id} value={item.id}>{zh ? item.zh : item.en}</option>)}</select></label>
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Operating status", "运行状态")}<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-2 block h-10 min-w-48 border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-primary"><option value="all">{t("All statuses", "全部状态")}</option><option value="active">{t("Operating", "运行中")}</option><option value="historical">{t("Discontinued / historical", "已停止运行 / 历史项目")}</option></select></label>
          {(selectedMechanism !== "all" || status !== "all") && <Button type="button" variant="ghost" onClick={resetFilters} className="h-10"><RotateCcw className="mr-2 h-4 w-4" />{t("Clear filters", "清除筛选")}</Button>}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />{t("Showing", "当前显示")} {visibleProjects.length} {t("projects", "个项目")}</span>{snapshot && <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-primary">{t("Data source", "数据来源")}: {snapshot.source} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.refreshedAt))}<ExternalLink className="h-3.5 w-3.5" /></a>}</div>

        {!loading && !error && <>
          <div className="mt-4 divide-y divide-border border-y border-border md:hidden">
            {visibleProjects.map((project) => {
              const historical = project.status === "historical";
              return <article key={project.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">{project.officialUrl ? <a href={project.officialUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-primary hover:underline">{project.name}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a> : <p className="font-semibold">{project.name}</p>}<p className="mt-1 text-xs text-muted-foreground">{project.symbol} · {project.pegType.replace(/^pegged/, "")}</p></div>
                  <a href={project.sourceUrl} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-semibold tabular-nums hover:text-primary hover:underline">{formatUsd(projectAmount(project))}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3"><Link href={`/about-stablecoins/types/${project.mechanism}`} className="inline-flex items-center gap-2 text-xs font-medium hover:text-primary hover:underline"><span className="h-2 w-2" style={{ backgroundColor: MECHANISM_COLORS[project.mechanism] }} />{mechanismLabel(project.mechanism, zh)}</Link><span className={historical ? "text-xs font-medium text-amber-800" : "text-xs font-medium text-emerald-700"}>{historical ? historicalStatus(project, zh) : t("Operating", "运行中")}</span></div>
              </article>;
            })}
          </div>

          <div className="mt-4 hidden min-w-0 overflow-x-auto border-y border-border md:block">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead className="border-b border-border bg-muted/45 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("Stablecoin project", "稳定币项目")}</th><th className="w-48 px-4 py-3 font-medium">{t("Mechanism", "机制")}</th><th className="w-28 px-4 py-3 font-medium">{t("Peg", "锚定")}</th><th className="w-28 px-4 py-3 font-medium">{t("Status", "状态")}</th><th className="w-44 px-4 py-3 text-right font-medium">{t("Market size", "市场规模")}</th></tr></thead>
              <tbody>{visibleProjects.map((project) => {
                const historical = project.status === "historical";
                return <tr key={project.id} className="border-b border-border align-top last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-4">{project.officialUrl ? <a href={project.officialUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-primary hover:underline">{project.name}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a> : <p className="font-semibold">{project.name}</p>}<span className="mt-1 block text-xs text-muted-foreground">{project.symbol}</span></td>
                  <td className="px-4 py-4"><Link href={`/about-stablecoins/types/${project.mechanism}`} className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary hover:underline"><span className="h-2.5 w-2.5" style={{ backgroundColor: MECHANISM_COLORS[project.mechanism] }} />{mechanismLabel(project.mechanism, zh)}</Link></td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{project.pegType.replace(/^pegged/, "")}</td>
                  <td className="px-4 py-4"><span className={historical ? "text-xs font-medium text-amber-800" : "text-xs font-medium text-emerald-700"}>{historical ? historicalStatus(project, zh) : t("Operating", "运行中")}</span></td>
                  <td className="px-4 py-4 text-right"><a href={project.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold tabular-nums hover:text-primary hover:underline">{formatUsd(projectAmount(project))}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a><p className="mt-1 text-xs leading-5 text-muted-foreground">{historical ? t("Historical peak", "历史峰值") : t("Current market cap", "当前流通市值")}</p></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
          {visibleProjects.length === 0 && <p className="border-x border-b border-border p-8 text-center text-sm text-muted-foreground">{t("No projects match these filters.", "没有符合当前筛选条件的项目。")}</p>}
        </>}
      </section>

      <div className="space-y-2 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><p>{t("Project names link to official project or issuer sites when a verified destination is available. Mechanism names open this site's detailed guides. Market-size values link to the DefiLlama stablecoin dashboard.", "项目名称在核验到官方地址时跳转至项目或发行方官网；机制名称进入本站详细介绍；市场规模数值跳转至 DefiLlama 稳定币数据面板。")}</p><p>{t("The catalogue shows the 50 largest active projects above the minimum threshold plus selected historical cases. Active totals and historical peak totals are kept separate because they are not directly comparable.", "目录展示超过最低阈值的前 50 个运行项目及少量代表性历史案例。运行项目市值与历史峰值分开汇总，二者不能直接相加比较。")}</p></div>
      <Link href="/about-stablecoins" className="inline-flex text-sm font-medium text-primary hover:underline">{t("Back to Learn Stablecoins", "返回“了解稳定币”")}</Link>
    </div>
  );
}
