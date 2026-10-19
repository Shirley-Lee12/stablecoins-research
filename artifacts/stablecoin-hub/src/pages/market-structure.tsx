import { fetchFridayMarketData } from "@/lib/friday-market-data";
import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, ExternalLink, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { MECHANISMS } from "@/lib/stablecoin-mechanisms";
import { compactUsd, fullUsd, MarketPageHeader, MarketSectionNav, useMarketSnapshot } from "@/pages/market-data-shared";

const ONE_DOLLAR_PEG_MONITOR = new Set([
  "USDT", "USDC", "USDS", "DAI", "USDE", "USD1", "USDG", "PYUSD", "RLUSD", "USDD", "FDUSD", "FRAX", "GHO", "TUSD",
]);

type LiquidityVenue = {
  quoteDepth2PctBid: number | null; quoteDepth2PctAsk: number | null; venue: string; market: string; kind: "CEX" | "DEX"; volume24hUsd: number; spreadBps: number | null;
  depth2PctBidUsd: number | null; depth2PctAskUsd: number | null; buySlippageBps100k: number | null;
  sellSlippageBps100k: number | null; buySlippageBps1m: number | null; sellSlippageBps1m: number | null;
  liquidityUsd: number | null; sourceUrl: string;
};
type DataStatus = { state: "current" | "delayed"; observedAt: string; retrievedAt: string; ageSeconds: number; source: string };
type LiquiditySnapshot = { refreshedAt: string; dataStatus: DataStatus; coverage: { cexMarketsRequested: number; cexMarketsReturned: number; dexAvailable: boolean }; summary: { cexVolume24hUsd: number | null; dexVolume24hUsd: number | null; dexLiquidityUsd: number | null }; venues: LiquidityVenue[] };
type DepegSnapshot = { refreshedAt: string; dataStatus: DataStatus; windowDays: number; methodology: { startThresholdBps: number; recoveryThresholdBps: number }; tokens: Array<{ symbol: string; events: Array<{ startedAt: string; recoveredAt: string | null; direction: "above" | "below"; peakDeviationBps: number; durationHours: number | null; recoveryHours: number | null }> }>; sourceUrl: string };

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

function pairedBps(buy: number | null, sell: number | null) {
  if (buy == null && sell == null) return "—";
  const format = (value: number | null) => value == null ? "—" : value.toFixed(2);
  return `${format(buy)} / ${format(sell)} bp`;
}

export default function MarketStructurePage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const { snapshot, loading, error, activeProjects, totalMarketCap } = useMarketSnapshot();
  const [query, setQuery] = useState("");
  const [mechanism, setMechanism] = useState("all");
  const [liquidity, setLiquidity] = useState<LiquiditySnapshot | null>(null);
  const [depegs, setDepegs] = useState<DepegSnapshot | null>(null);
  const [liquidityUnavailable, setLiquidityUnavailable] = useState(false);
  const [depegsUnavailable, setDepegsUnavailable] = useState(false);
  useEffect(() => {
    fetchFridayMarketData("liquidity").then((response) => response.ok ? response.json() : Promise.reject()).then(setLiquidity).catch(() => setLiquidityUnavailable(true));
    fetchFridayMarketData("depegs").then((response) => response.ok ? response.json() : Promise.reject()).then(setDepegs).catch(() => setDepegsUnavailable(true));
  }, []);
  const topProjects = useMemo(
    () => activeProjects.slice(0, 10).map((project) => ({ ...project, chartLabel: project.symbol || project.name })),
    [activeProjects],
  );
  const supplyMovers = useMemo(
    () => activeProjects
      .filter((project) => project.change30dPct != null && project.currentMarketCapUsd >= 100_000_000)
      .sort((a, b) => Math.abs(b.change30dPct ?? 0) - Math.abs(a.change30dPct ?? 0))
      .slice(0, 10)
      .map((project) => ({ label: project.symbol || project.name, value: project.change30dPct ?? 0 })),
    [activeProjects],
  );
  const pegObservations = useMemo(
    () => activeProjects
      .filter((project) => ONE_DOLLAR_PEG_MONITOR.has(project.symbol.toUpperCase()) && project.priceDeviationBps != null)
      .sort((a, b) => b.currentMarketCapUsd - a.currentMarketCapUsd)
      .slice(0, 8),
    [activeProjects],
  );
  const visibleProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return activeProjects.filter((project) =>
      (!normalized || `${project.name} ${project.symbol}`.toLocaleLowerCase().includes(normalized))
      && (mechanism === "all" || project.mechanism === mechanism));
  }, [activeProjects, mechanism, query]);
  const refreshedAt = snapshot
    ? new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.refreshedAt))
    : null;

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <MarketSectionNav />
      <MarketPageHeader
        kicker={t("Market structure", "市场结构")}
        title={t("Market Size & Price Stability", "市场规模与价格稳定性")}
        description={t(
          "See which stablecoins are largest, how their supply is changing and whether their market price remains close to the target value.",
          "查看哪些稳定币规模最大、供应量如何变化，以及市场价格是否仍接近目标价值。",
        )}
        icon={BarChart3}
      />

      <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="editorial-kicker">{t("Concentration", "集中度")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Largest active stablecoins", "规模最大的运行中稳定币")}</h2></div>
          {snapshot && <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline">{t("Observed", "观测于")} {refreshedAt} · {snapshot.source}<ExternalLink className="h-4 w-4" /></a>}
        </div>
        <p className="mt-3 editorial-note">{t("The bar length is current USD market capitalisation. It is not exchange volume, on-chain transfer value or payment value.", "柱长表示当前美元市值，不代表交易所成交量、链上转账额或支付额。")}</p>
        {(loading || snapshot) && <div className="mt-6 h-[410px] min-w-0 border-y border-border py-5">
          {loading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProjects} layout="vertical" margin={{ left: 6, right: 30, top: 4, bottom: 4 }}>
                <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tickFormatter={compactUsd} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="chartLabel" width={64} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value: number) => fullUsd(value)} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3, boxShadow: "none" }} />
                <Bar dataKey="currentMarketCapUsd" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>}
        {error && <p className="mt-5 border-y border-border py-4 text-sm text-muted-foreground">{t("Current market source is temporarily unavailable.", "当前市场数据源暂时无法访问。")}</p>}
      </section>

      {(loading || snapshot) && <section className="editorial-section">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
          <div className="min-w-0">
            <p className="editorial-kicker">{t("Supply momentum", "供应变化")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Largest 30-day moves", "30 日供应变化幅度")}</h2>
            <p className="mt-3 editorial-note">{t("Active assets above $100 million, ranked by the absolute change in circulating USD value.", "仅列当前流通规模超过 1 亿美元的运行中资产，并按美元流通价值变化的绝对幅度排序。")}</p>
            <div className="mt-6 h-[390px] border-y border-border py-5">
              {loading ? <Skeleton className="h-full w-full" /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={supplyMovers} layout="vertical" margin={{ left: 4, right: 28 }}><CartesianGrid stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" unit="%" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" width={62} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Bar dataKey="value" isAnimationActive={false}>{supplyMovers.map((row) => <Cell key={row.label} fill={row.value >= 0 ? "#23836f" : "#b34b5b"} />)}</Bar></BarChart></ResponsiveContainer>}
            </div>
          </div>
          <div className="min-w-0">
            <p className="editorial-kicker">{t("Peg stability", "锚定稳定性")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Largest USD-pegged assets", "主要美元稳定币")}</h2>
            <p className="mt-3 editorial-note">{t("A point-in-time price observation, not a measure of redemption liquidity or intraday volatility.", "这是单一时点的价格观测，不代表赎回流动性或日内波动。")}</p>
            <div className="mt-6 divide-y divide-border border-y border-border">{loading ? <Skeleton className="my-5 h-72 w-full" /> : pegObservations.map((project) => {
              const deviation = project.priceDeviationBps ?? 0;
              return <div key={project.id} className="grid grid-cols-[minmax(84px,1fr)_100px_100px] items-center gap-3 py-4"><span className="font-semibold">{project.symbol || project.name}</span><span className="text-right text-sm tabular-nums">{project.priceUsd == null ? "—" : `$${project.priceUsd.toFixed(4)}`}</span><span className={`text-right text-sm font-semibold tabular-nums ${Math.abs(deviation) >= 25 ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"}`}>{deviation > 0 ? "+" : ""}{deviation.toFixed(1)} bp</span></div>;
            })}</div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("A 30-day increase or decrease is a net change in circulating supply. It does not identify gross issuance and redemption flows separately.", "30 日增减是流通供应的净变化，不能分别识别发行总额与赎回总额。")}</p>
      </section>}

      {liquidity && <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="editorial-kicker">{t("Trading liquidity", "交易流动性")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("CEX and DEX volume, depth and slippage", "CEX / DEX 成交量、深度与滑点")}</h2></div>
          <span className={`text-xs ${liquidity.dataStatus.state === "delayed" ? "font-semibold text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{liquidity.dataStatus.state === "delayed" ? t("Delayed snapshot", "延迟快照") : t("Updated", "更新于")} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(liquidity.dataStatus.observedAt))}</span>
        </div>
        <>
          <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px bg-border">
            {[
              liquidity.summary.cexVolume24hUsd == null ? null : { label: t("CEX stablecoin-pair volume · 24h", "CEX 稳定币交易对成交量 · 24h"), value: compactUsd(liquidity.summary.cexVolume24hUsd) },
              liquidity.summary.dexVolume24hUsd == null ? null : { label: t("Ethereum DEX stablecoin volume · 24h", "以太坊 DEX 稳定币成交量 · 24h"), value: compactUsd(liquidity.summary.dexVolume24hUsd) },
              liquidity.summary.dexLiquidityUsd == null ? null : { label: t("Ethereum DEX pool liquidity", "以太坊 DEX 池流动性"), value: compactUsd(liquidity.summary.dexLiquidityUsd) },
            ].filter((item): item is { label: string; value: string } => item !== null).map((item) => <article key={item.label} className="bg-background p-6"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{item.label}</p><strong className="mt-4 block text-3xl font-semibold tabular-nums text-primary">{item.value}</strong></article>)}
          </div>
          <div className="mt-7 overflow-x-auto border-y border-border"><table className="w-full min-w-[1180px] border-collapse text-left"><thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("Venue / pair", "场所 / 交易对")}</th><th className="px-4 py-3 text-right font-medium">{t("24h volume", "24h 成交量")}</th><th className="px-4 py-3 text-right font-medium">{t("Spread", "价差")}</th><th className="px-4 py-3 text-right font-medium">{t("2% bid depth · USDT", "2% 买盘深度 · USDT")}</th><th className="px-4 py-3 text-right font-medium">{t("2% ask depth · USDT", "2% 卖盘深度 · USDT")}</th><th className="px-4 py-3 text-right font-medium">{t("100K USDT slippage", "10 万 USDT 滑点")}</th><th className="px-4 py-3 text-right font-medium">{t("1M USDT slippage", "100 万 USDT 滑点")}</th><th className="px-4 py-3 text-right font-medium">{t("Pool liquidity", "池流动性")}</th></tr></thead><tbody>{liquidity.venues.map((row) => <tr key={`${row.kind}-${row.venue}-${row.market}`} className="border-b border-border last:border-0"><td className="px-4 py-4"><a href={row.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-primary hover:underline">{row.venue} · {row.market}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a><span className="mt-1 block text-xs text-muted-foreground">{row.kind}</span></td><td className="px-4 py-4 text-right text-sm tabular-nums">{row.volume24hUsd == null ? "—" : compactUsd(row.volume24hUsd)}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{row.spreadBps == null ? "—" : `${row.spreadBps.toFixed(2)} bp`}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{row.quoteDepth2PctBid == null ? "—" : new Intl.NumberFormat("en-US", {notation:"compact"}).format(row.quoteDepth2PctBid) + " USDT"}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{row.quoteDepth2PctAsk == null ? "—" : new Intl.NumberFormat("en-US", {notation:"compact"}).format(row.quoteDepth2PctAsk) + " USDT"}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{pairedBps(row.buySlippageBps100k, row.sellSlippageBps100k)}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{pairedBps(row.buySlippageBps1m, row.sellSlippageBps1m)}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{row.liquidityUsd == null ? "—" : compactUsd(row.liquidityUsd)}</td></tr>)}</tbody></table></div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">{t(`Slippage is buy / sell basis points from a CEX order-book snapshot. ${liquidity.coverage.cexMarketsReturned} of ${liquidity.coverage.cexMarketsRequested} requested CEX pairs were returned. DEX rows use reported pool volume and liquidity; unavailable DEX data is omitted rather than recorded as zero.`, `滑点按 CEX 订单簿快照依次显示买入 / 卖出基点；本次取得 ${liquidity.coverage.cexMarketsReturned}/${liquidity.coverage.cexMarketsRequested} 个指定 CEX 交易对。DEX 行采用池成交量与流动性；来源不可用时直接省略，不记为零。`)}</p>
        </>
      </section>}

      {depegs && <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-kicker">{t("Depeg monitor", "脱锚监测")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Magnitude, duration and recovery", "脱锚幅度、持续时间与恢复时间")}</h2></div><div className="text-right"><a href={depegs.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">CoinGecko<ExternalLink className="h-3.5 w-3.5" /></a><span className={`mt-1 block text-xs ${depegs.dataStatus.state === "delayed" ? "font-semibold text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{depegs.dataStatus.state === "delayed" ? t("Delayed snapshot", "延迟快照") : t("Observed", "观测于")} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(depegs.dataStatus.observedAt))}</span></div></div>
        <>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">{t(`An event begins at ${depegs.methodology.startThresholdBps} bp from $1 and closes only after two hourly observations within ${depegs.methodology.recoveryThresholdBps} bp.`, `价格偏离 1 美元达到 ${depegs.methodology.startThresholdBps} 个基点时开始记录；连续两个小时回到 ${depegs.methodology.recoveryThresholdBps} 个基点以内才判定恢复。`)}</p>
          <div className="mt-7 overflow-x-auto border-y border-border"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("Token", "币种")}</th><th className="px-4 py-3 font-medium">{t("Started", "开始")}</th><th className="px-4 py-3 text-right font-medium">{t("Peak deviation", "最大偏离")}</th><th className="px-4 py-3 text-right font-medium">{t("Duration", "持续时间")}</th><th className="px-4 py-3 text-right font-medium">{t("Recovery from worst point", "从最差点恢复")}</th><th className="px-4 py-3 font-medium">{t("Status", "状态")}</th></tr></thead><tbody>{depegs.tokens.flatMap((token) => token.events.map((event) => ({ ...event, token: token.symbol }))).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt)).slice(0, 20).map((event) => <tr key={`${event.token}-${event.startedAt}`} className="border-b border-border last:border-0"><td className="px-4 py-4 font-semibold">{event.token}</td><td className="px-4 py-4 text-sm tabular-nums">{event.startedAt.slice(0, 16).replace("T", " ")}</td><td className="px-4 py-4 text-right text-sm font-semibold tabular-nums text-primary">{event.direction === "below" ? "−" : "+"}{event.peakDeviationBps.toFixed(1)} bp</td><td className="px-4 py-4 text-right text-sm tabular-nums">{event.durationHours == null ? "—" : `${event.durationHours.toFixed(1)}h`}</td><td className="px-4 py-4 text-right text-sm tabular-nums">{event.recoveryHours == null ? "—" : `${event.recoveryHours.toFixed(1)}h`}</td><td className="px-4 py-4 text-sm">{event.recoveredAt ? t("Recovered", "已恢复") : t("Open", "尚未恢复")}</td></tr>)}</tbody></table></div>
          {depegs.tokens.every((token) => token.events.length === 0) && <p className="mt-5 text-sm text-muted-foreground">{t(`No events above ${depegs.methodology.startThresholdBps} bp were found in the ${depegs.windowDays}-day hourly window.`, `过去 ${depegs.windowDays} 天的小时数据中，没有检测到超过 ${depegs.methodology.startThresholdBps} 个基点的事件。`)}</p>}
        </>
      </section>}

      {(liquidityUnavailable || depegsUnavailable) && <div className="editorial-section py-5">
        <p className="border-y border-border py-4 text-sm text-muted-foreground">{t(
          `${liquidityUnavailable ? "Trading-liquidity" : ""}${liquidityUnavailable && depegsUnavailable ? " and " : ""}${depegsUnavailable ? "depeg-event" : ""} data has no successful stored snapshot yet. Supply and current-price data remain available.`,
          `${liquidityUnavailable ? "交易流动性" : ""}${liquidityUnavailable && depegsUnavailable ? "与" : ""}${depegsUnavailable ? "脱锚事件" : ""}目前尚无成功保存的数据快照；供应量和当前价格数据仍可查看。`,
        )}</p>
      </div>}

      {snapshot && <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="editorial-kicker">{t("Numeric observations", "数值观测")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Current project measures", "当前项目指标")}</h2></div>
          <p className="text-sm text-muted-foreground">{t("Showing", "当前显示")} {visibleProjects.length} / {activeProjects.length}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-end gap-3 border-y border-border py-4">
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Search", "搜索")}<span className="relative mt-2 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Name or symbol", "名称或代号")} className="h-10 w-64 max-w-full border border-input bg-background py-2 pl-9 pr-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" /></span></label>
          <label className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Mechanism", "稳定机制")}<select value={mechanism} onChange={(event) => setMechanism(event.target.value)} className="mt-2 block h-10 min-w-48 border border-input bg-background px-3 text-sm font-normal normal-case tracking-normal text-foreground outline-none focus:border-primary"><option value="all">{t("All mechanisms", "全部机制")}</option>{MECHANISMS.map((item) => <option key={item.id} value={item.id}>{zh ? item.zh : item.en}</option>)}</select></label>
        </div>
        {!loading && !error && (
          <div className="mt-4 overflow-x-auto border-y border-border">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="w-14 px-4 py-3 font-medium">#</th><th className="px-4 py-3 font-medium">{t("Asset", "资产")}</th><th className="w-28 px-4 py-3 font-medium">{t("Price", "价格")}</th><th className="w-28 px-4 py-3 text-right font-medium">{t("Off peg", "偏离锚定")}</th><th className="w-28 px-4 py-3 text-right font-medium">1D</th><th className="w-28 px-4 py-3 text-right font-medium">7D</th><th className="w-28 px-4 py-3 text-right font-medium">30D</th><th className="w-40 px-4 py-3 text-right font-medium">{t("Market cap", "当前市值")}</th><th className="w-28 px-4 py-3 text-right font-medium">{t("Share", "占比")}</th></tr></thead>
              <tbody>{visibleProjects.map((project, index) => (
                <tr key={project.id} className="border-b border-border last:border-b-0 hover:bg-muted/20">
                  <td className="px-4 py-4 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-4"><a href={project.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold hover:text-primary hover:underline">{project.name}<ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a><span className="mt-1 block text-xs text-muted-foreground">{project.symbol}</span></td>
                  <td className="px-4 py-4 text-sm tabular-nums">{project.priceUsd == null ? "—" : `$${project.priceUsd.toFixed(4)}`}</td>
                  <td className="px-4 py-4 text-right text-sm tabular-nums">{!ONE_DOLLAR_PEG_MONITOR.has(project.symbol.toUpperCase()) || project.priceDeviationBps == null ? "—" : `${project.priceDeviationBps > 0 ? "+" : ""}${project.priceDeviationBps.toFixed(1)} bp`}</td>
                  {[project.change1dPct, project.change7dPct, project.change30dPct].map((value, changeIndex) => <td key={changeIndex} className={`px-4 py-4 text-right text-sm tabular-nums ${(value ?? 0) > 0 ? "text-emerald-700 dark:text-emerald-300" : (value ?? 0) < 0 ? "text-rose-700 dark:text-rose-300" : "text-muted-foreground"}`}>{value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`}</td>)}
                  <td className="px-4 py-4 text-right font-semibold tabular-nums">{compactUsd(project.currentMarketCapUsd)}</td>
                  <td className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">{totalMarketCap ? `${((project.currentMarketCapUsd / totalMarketCap) * 100).toFixed(2)}%` : "—"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("Supply, price and change windows are sourced from DefiLlama. Off-peg values are limited to a reviewed set of stablecoins intended to remain at one U.S. dollar; yield-bearing tokens with a changing unit value are not forced into this measure. One basis point equals 0.01%.", "供应、价格与变化窗口来自 DefiLlama。偏离锚定只对经核验、目标价格为 1 美元的稳定币计算；单位净值会变化的收益型代币不强行套用这一指标。1 个基点等于 0.01%。")}</p>
      </section>}
    </div>
  );
}
