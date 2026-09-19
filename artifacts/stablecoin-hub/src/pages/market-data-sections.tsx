import React, { useEffect, useMemo, useState } from "react";
import { Blocks, ExternalLink, Landmark, ShieldCheck, UsersRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { compactUsd, fullUsd, MarketPageHeader, MarketSectionNav, useMarketSnapshot } from "@/pages/market-data-shared";

const ONCHAIN_BENCHMARKS = [
  { label: { en: "Average daily transfer volume", zh: "日均转账额" }, value: "$277.4B", change: "+84.9%", note: { en: "versus previous 30 days", zh: "较前 30 日" } },
  { label: { en: "Average daily transactions", zh: "日均交易笔数" }, value: "74.1M", change: "+24.8%", note: { en: "token-transfer activity", zh: "代币转移活动" } },
  { label: { en: "Average daily active addresses", zh: "日均活跃地址" }, value: "4.9M", change: "+4.3%", note: { en: "sending or receiving", zh: "发送或接收地址" } },
];

const TOKEN_ACTIVITY = [
  { token: "USDC", volume: 190.91, transactions: 32.32, addresses: 1.43 },
  { token: "USDT", volume: 64.50, transactions: 30.30, addresses: 3.23 },
  { token: "USDS", volume: 1.99, transactions: 0.0168, addresses: 0.0012 },
  { token: "USDe", volume: 0.491, transactions: 0.0171, addresses: 0.0017 },
];

const ISSUERS = [
  {
    symbols: ["USDT"], name: "Tether", product: "USDT", period: "2026 Q1",
    earnings: "$1.04B", earningsLabel: { en: "net profit", zh: "净利润" },
    reserves: "$191.77B", reserveDetail: { en: "$141B in US Treasuries; $8.23B excess reserves", zh: "约 1,410 亿美元美国国债；82.3 亿美元超额储备" },
    assurance: { en: "BDO quarterly attestation; KPMG unqualified FY2025 audit", zh: "BDO 季度鉴证；KPMG 对 2025 全年财务报表出具无保留审计意见" },
    disclosure: { en: "Quarterly attestation", zh: "季度鉴证" },
    maturity: { en: "Treasury-heavy; the cited Q1 release does not publish a full maturity ladder", zh: "以美国国债为主；引述的 Q1 公告未披露完整期限梯度" },
    custody: { en: "Custodian and counterparty breakdown not separated in the cited release", zh: "引述公告未逐项列出托管人与交易对手" },
    redemption: { en: "Direct redemption requires an eligible, verified issuer account and remains subject to issuer terms", zh: "直接赎回要求符合条件并完成验证的发行方账户，具体依发行条款执行" },
    revenueMix: { en: "Interest income plus other investment results; no product-level revenue split", zh: "利息收入及其他投资结果；未披露产品级收入拆分" },
    assuranceLag: { en: "Quarterly; filing-by-filing publication lag still to be standardised", zh: "季度；各期报告发布时滞仍需逐份标准化" },
    url: "https://tether.io/news/tether-posts-1-04b-q1-2026-profit-despite-highly-volatile-global-markets-reaches-all-time-highs-8-23b-reserve-buffer-and-maintains-u-s-treasury-heavy-backing/",
  },
  {
    symbols: ["USDC", "EURC"], name: "Circle", product: "USDC · EURC", period: "2026 Q2",
    earnings: "$48M", earningsLabel: { en: "net income", zh: "净利润" },
    reserves: "$73.16B", reserveDetail: { en: "cash and cash equivalents segregated for stablecoin holders at 30 Jun 2026", zh: "截至 2026-06-30 为稳定币持有人隔离的现金及现金等价物" },
    assurance: { en: "Deloitte monthly reserve assurance; annual corporate audit", zh: "Deloitte 每月储备鉴证；年度公司审计" },
    disclosure: { en: "Weekly reserves · monthly assurance", zh: "每周储备 · 每月鉴证" },
    maturity: { en: "Cash, overnight Treasury repo and Treasuries with under three months to maturity", zh: "现金、隔夜美债回购及剩余期限低于三个月的美国国债" },
    custody: { en: "Most reserves in the BlackRock-managed Circle Reserve Fund; BNY Mellon is the fund custodian", zh: "多数储备位于贝莱德管理的 Circle Reserve Fund；基金托管人为纽约梅隆银行" },
    redemption: { en: "Direct 1:1 redemption through eligible Circle Mint accounts; not directly available to individuals", zh: "符合条件的 Circle Mint 账户可直接按 1:1 赎回；个人不能直接使用 Circle Mint" },
    revenueMix: { en: "Reserve income is the main line; transaction and other revenue are reported separately", zh: "储备收益为主要收入来源，交易及其他收入另行披露" },
    assuranceLag: { en: "Monthly assurance; exact lag is measured from report date to publication date", zh: "月度鉴证；具体时滞按报告日到发布日期计算" },
    url: "https://investor.circle.com/overview/default.aspx",
  },
  {
    symbols: ["PYUSD", "USDP"], name: "Paxos", product: "PYUSD · USDP", period: "2026 Jul",
    earnings: "N/D", earningsLabel: { en: "product-level profit not disclosed", zh: "未披露产品级利润" },
    reserves: "100%+", reserveDetail: { en: "cash and cash equivalents reported against tokens outstanding", zh: "按在外流通代币报告现金及现金等价物覆盖" },
    assurance: { en: "KPMG monthly independent attestation since February 2025", zh: "自 2025 年 2 月起由 KPMG 提供月度独立鉴证" },
    disclosure: { en: "Monthly reserve report · monthly attestation", zh: "月度储备报告 · 月度鉴证" },
    maturity: { en: "Cash equivalents and short-dated government instruments; composition varies by product report", zh: "现金等价物与短期政府工具；具体构成依不同产品报告而异" },
    custody: { en: "Custody is reported at product level; a comparable counterparty table is not yet available", zh: "托管安排按产品披露；尚无可横向比较的交易对手表" },
    redemption: { en: "Direct redemption depends on Paxos account eligibility and the terms of each product", zh: "直接赎回取决于 Paxos 账户资格及各产品条款" },
    revenueMix: { en: "Product-level revenue and profit are not separately disclosed", zh: "未单独披露产品级收入与利润" },
    assuranceLag: { en: "Monthly; publication lag to be recorded from each report", zh: "月度；发布时滞需从每期报告记录" },
    url: "https://www.paxos.com/pyusd-transparency",
  },
  {
    symbols: ["FDUSD"], name: "First Digital Labs", product: "FDUSD", period: "2026 Feb",
    earnings: "N/D", earningsLabel: { en: "issuer profit not disclosed", zh: "未披露发行方利润" },
    reserves: "100%+", reserveDetail: { en: "reserve accounts reported as at least equal to token supply", zh: "储备账户报告值不低于代币总供应" },
    assurance: { en: "Independent accountant's reserve accounts report", zh: "独立会计师储备账户报告" },
    disclosure: { en: "Monthly reserve attestation", zh: "月度储备鉴证" },
    maturity: { en: "Reserve report categories are available, but no standardised maturity ladder is stored yet", zh: "储备报告提供资产类别，但尚未保存标准化期限梯度" },
    custody: { en: "Trust and banking arrangements require report-by-report verification", zh: "信托与银行安排需要逐期报告核验" },
    redemption: { en: "Redemption access and fees depend on the issuer's eligibility and service terms", zh: "赎回入口与费用取决于发行方资格要求和服务条款" },
    revenueMix: { en: "Issuer revenue and product profit are not disclosed", zh: "未披露发行方收入与产品利润" },
    assuranceLag: { en: "Monthly; publication lag has not yet been normalised", zh: "月度；发布时滞尚未标准化" },
    url: "https://www.firstdigitallabs.com/transparency",
  },
];

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

type MacroSnapshot = { refreshedAt: string; series: Array<{ id: string; label: string; unit: string; sourceUrl: string; latest: { date: string; value: number } | null; observations: Array<{ date: string; value: number }> }> };
type OnchainSnapshot = { refreshedAt: string; dataStatus: { state: "current" | "delayed"; observedAt: string }; windowDays: number; sourceUrl: string; tokens: Array<{ symbol: string; contract: string; minted: number; burned: number; netIssuance: number; holderCount: number | null; adjustedTop10Pct: number | null; treasuryFlow: { inflow: number; outflow: number; net: number; addressCount: number } | null }> };

function DataSource({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">{children}<ExternalLink className="h-3.5 w-3.5" /></a>;
}

export function MarketOnChainPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const { snapshot, loading } = useMarketSnapshot();
  const [issuerFlows, setIssuerFlows] = useState<OnchainSnapshot | null>(null);
  const [issuerFlowsUnavailable, setIssuerFlowsUnavailable] = useState(false);
  const [activityMetric, setActivityMetric] = useState<"volume" | "transactions" | "addresses">("volume");
  const [selectedChainName, setSelectedChainName] = useState("");
  useEffect(() => { fetch(`${apiBase()}/api/stablecoin-onchain`).then((response) => response.ok ? response.json() : Promise.reject()).then(setIssuerFlows).catch(() => setIssuerFlowsUnavailable(true)); }, []);
  const chains = snapshot?.chains.slice(0, 8) ?? [];
  const selectedChain = chains.find((chain) => chain.name === selectedChainName) ?? chains[0];
  const activityMeta = {
    volume: { label: t("Transfer value", "转账额"), title: t("Average daily transfer value", "日均转账额"), unit: "B", format: (value: number) => `$${value.toFixed(2)}B` },
    transactions: { label: t("Transactions", "交易笔数"), title: t("Average daily transactions", "日均交易笔数"), unit: "M", format: (value: number) => `${value.toFixed(2)}M` },
    addresses: { label: t("Active addresses", "活跃地址"), title: t("Average daily active addresses", "日均活跃地址"), unit: "M", format: (value: number) => `${value.toFixed(3)}M` },
  }[activityMetric];
  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <MarketSectionNav />
      <MarketPageHeader kicker={t("Blockchain activity", "区块链活动")} title={t("On-chain Activity", "链上活动")} description={t("Track how stablecoins move across tokens and blockchains. Transfer activity shows network use, while payment use is measured separately.", "观察稳定币在不同币种和区块链之间如何流动。链上转账反映网络活动，支付使用则单独衡量。")} icon={Blocks} />
      <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-kicker">{t("30-day network activity", "30 日网络活动")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Global stablecoin activity", "全球稳定币链上活动")}</h2></div><DataSource href="https://www.artemis.ai/sectors/stablecoins/overview">Artemis · 2026-09-11</DataSource></div>
        <div className="mt-7 grid gap-px bg-border md:grid-cols-3">{ONCHAIN_BENCHMARKS.map((metric) => <article key={metric.label.en} className="bg-background p-6"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{zh ? metric.label.zh : metric.label.en}</p><strong className="mt-4 block text-4xl font-semibold tabular-nums text-primary">{metric.value}</strong><p className="mt-3 text-sm"><span className="font-semibold text-emerald-700 dark:text-emerald-300">{metric.change}</span><span className="ml-2 text-muted-foreground">{zh ? metric.note.zh : metric.note.en}</span></p></article>)}</div>
      </section>
      {(loading || chains.length > 0) && <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="editorial-kicker">{t("Free live chain data", "免费动态链数据")}</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Supply by blockchain", "按区块链观察稳定币供应")}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground/68">{t("Select a chain to compare its supply trend, market share and leading stablecoins.", "选择一条链，查看供应趋势、全球份额和主要稳定币构成。")}</p>
          </div>
          {snapshot && <div className="text-right"><DataSource href={snapshot.sourceUrl}>DefiLlama</DataSource><span className="mt-1 block text-xs text-muted-foreground">{t("Updated", "更新于")} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.refreshedAt))}</span></div>}
        </div>
        {loading ? <Skeleton className="mt-7 h-[520px] w-full" /> : selectedChain && <div className="mt-7 grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-5 border-b border-border pb-5">
              <div><span className="text-sm font-semibold text-muted-foreground">{selectedChain.name}</span><strong className="mt-1 block text-4xl font-semibold tabular-nums text-primary">{compactUsd(selectedChain.totalUsd)}</strong></div>
              <div className="flex gap-8">
                <div><span className="block text-xs text-muted-foreground">{t("Global share", "全球份额")}</span><strong className="mt-1 block text-xl tabular-nums">{selectedChain.sharePct.toFixed(1)}%</strong></div>
                {selectedChain.change30dPct != null && <div><span className="block text-xs text-muted-foreground">{t("30-day change", "30 日变化")}</span><strong className={`mt-1 block text-xl tabular-nums ${selectedChain.change30dPct >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{selectedChain.change30dPct >= 0 ? "+" : ""}{selectedChain.change30dPct.toFixed(1)}%</strong></div>}
              </div>
            </div>
            {selectedChain.history.length > 0 && <div className="h-[330px] py-6"><ResponsiveContainer width="100%" height="100%"><AreaChart data={selectedChain.history}><defs><linearGradient id="chainSupplyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" minTickGap={46} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: string) => value.slice(5)} /><YAxis width={72} domain={["auto", "auto"]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: number) => compactUsd(value)} /><Tooltip labelFormatter={(value: string) => value} formatter={(value: number) => [compactUsd(value), t("Supply", "供应量")]} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Area type="monotone" dataKey="totalUsd" stroke="hsl(var(--primary))" fill="url(#chainSupplyFill)" strokeWidth={2.5} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div>}
            <div className="border-t border-border pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t("Stablecoin mix on this chain", "该链稳定币构成")}</p>
              <div className="mt-4 flex h-3 overflow-hidden bg-muted">{selectedChain.dominantAssets.map((asset, index) => <span key={asset.symbol} className={["bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-muted-foreground/45"][index]} style={{ width: `${asset.sharePct}%` }} title={`${asset.symbol} ${asset.sharePct.toFixed(1)}%`} />)}</div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">{selectedChain.dominantAssets.map((asset, index) => <div key={asset.symbol} className="flex items-center gap-2 text-sm"><span className={`h-2.5 w-2.5 ${["bg-primary", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-muted-foreground/45"][index]}`} /><span>{asset.symbol === "Other" ? t("Other", "其他") : asset.symbol}</span><strong className="tabular-nums">{asset.sharePct.toFixed(1)}%</strong></div>)}</div>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-5 border-b border-border pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"><span>{t("Chain", "区块链")}</span><span>{t("Supply", "供应量")}</span><span>{t("30D", "30 日")}</span></div>
            <div className="divide-y divide-border">{chains.map((chain, index) => <button key={chain.name} type="button" onClick={() => setSelectedChainName(chain.name)} className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-5 py-4 text-left transition-colors ${selectedChain.name === chain.name ? "text-primary" : "hover:text-primary"}`}><span className="flex min-w-0 items-center gap-3"><span className="w-5 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><strong className="truncate">{chain.name}</strong></span><span className="text-sm tabular-nums">{compactUsd(chain.totalUsd)}</span><span className={`w-16 text-right text-sm tabular-nums ${chain.change30dPct == null ? "text-muted-foreground" : chain.change30dPct >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"}`}>{chain.change30dPct == null ? "—" : `${chain.change30dPct >= 0 ? "+" : ""}${chain.change30dPct.toFixed(1)}%`}</span></button>)}</div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">{t("Supply share is not transaction volume. Bridged assets can be classified differently by different providers.", "供应份额不等于交易量；不同数据商对桥接资产的分类可能不同。")}</p>
          </div>
        </div>}
      </section>}
      <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-kicker">{t("Cross-token comparison", "币种活动比较")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{activityMeta.title}</h2></div><DataSource href="https://www.artemis.ai/sectors/stablecoins/by-chain">Artemis · 2026-09-11</DataSource></div>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={t("Choose on-chain activity measure", "选择链上活动指标")}>{(["volume", "transactions", "addresses"] as const).map((metric) => <button key={metric} type="button" onClick={() => setActivityMetric(metric)} className={`border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${activityMetric === metric ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{({ volume: t("Transfer value", "转账额"), transactions: t("Transactions", "交易笔数"), addresses: t("Active addresses", "活跃地址") })[metric]}</button>)}</div>
        <div className="mt-3 h-[380px] border-y border-border py-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={TOKEN_ACTIVITY} layout="vertical"><CartesianGrid stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" unit={activityMeta.unit} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="token" width={60} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => activityMeta.format(value)} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Bar dataKey={activityMetric} name={activityMeta.label} fill="hsl(var(--primary))" isAnimationActive={false} /></BarChart></ResponsiveContainer></div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("Token activity is a dated Artemis snapshot. The chain supply section above is the free automatically updated layer.", "币种活动为带日期的 Artemis 快照；上方按链供应是免费且自动更新的数据层。")}</p>
      </section>
      {issuerFlows && <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-kicker">{t("Issuer flows on Ethereum", "以太坊发行流量")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t(`USDT and USDC · latest ${issuerFlows.windowDays} days`, `USDT 与 USDC · 最近 ${issuerFlows.windowDays} 天`)}</h2></div><div className="text-right"><DataSource href={issuerFlows.sourceUrl}>Etherscan</DataSource><span className={`mt-1 block text-xs ${issuerFlows.dataStatus.state === "delayed" ? "font-semibold text-amber-700 dark:text-amber-300" : "text-muted-foreground"}`}>{issuerFlows.dataStatus.state === "delayed" ? t("Delayed snapshot", "延迟快照") : t("Observed", "观测于")} · {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(issuerFlows.dataStatus.observedAt))}</span></div></div>
        <div className="mt-7 divide-y divide-border border-y border-border">{issuerFlows.tokens.map((token) => <article key={token.symbol} className="grid gap-5 py-6 lg:grid-cols-[8rem_repeat(3,minmax(0,1fr))]"><div><strong className="text-2xl text-primary">{token.symbol}</strong><a href={`https://etherscan.io/token/${token.contract}`} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-muted-foreground hover:text-primary hover:underline">Ethereum<ExternalLink className="ml-1 inline h-3 w-3" /></a></div>{[
          { label: t("Minted", "铸造"), value: compactUsd(token.minted) },
          { label: t("Burned", "销毁"), value: compactUsd(token.burned) },
          { label: t("Net issuance", "净发行"), value: `${token.netIssuance >= 0 ? "+" : "−"}${compactUsd(Math.abs(token.netIssuance))}` },
        ].map((metric) => <div key={metric.label}><p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</p><strong className="mt-2 block text-2xl tabular-nums">{metric.value}</strong></div>)}
        {(token.treasuryFlow || token.holderCount != null || token.adjustedTop10Pct != null) && <div className="lg:col-start-2 lg:col-span-3 grid gap-4 border-l-2 border-primary/30 pl-5 sm:grid-cols-3">{token.treasuryFlow && <div><p className="text-xs text-muted-foreground">{t("Treasury net flow", "Treasury 净流量")}</p><strong className="mt-1 block tabular-nums">{token.treasuryFlow.net >= 0 ? "+" : "−"}{compactUsd(Math.abs(token.treasuryFlow.net))}</strong></div>}{token.holderCount != null && <div><p className="text-xs text-muted-foreground">{t("Holder addresses", "持币地址")}</p><strong className="mt-1 block tabular-nums">{token.holderCount.toLocaleString()}</strong></div>}{token.adjustedTop10Pct != null && <div><p className="text-xs text-muted-foreground">{t("Adjusted top-10 concentration", "调整后前十集中度")}</p><strong className="mt-1 block tabular-nums">{token.adjustedTop10Pct.toFixed(2)}%</strong></div>}</div>}</article>)}</div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("Mint and burn are identified from Transfer events to or from the zero address. Treasury flow and adjusted concentration appear only after reviewed treasury addresses and holder coverage are available.", "铸造与销毁依据转入或转出零地址的 Transfer 事件识别。Treasury 流量与调整后集中度只有在 Treasury 地址完成审核且持有人数据可用时才显示。")}</p>
      </section>}
      {issuerFlowsUnavailable && <div className="editorial-section py-5"><p className="border-y border-border py-4 text-sm text-muted-foreground">{t("Ethereum issuance data has no successful stored snapshot yet. Other on-chain measures remain available.", "以太坊发行流量目前尚无成功保存的数据快照；其他链上指标仍可查看。")}</p></div>}
      <section className="editorial-section"><div className="grid gap-6 md:grid-cols-3">{[
        { title: t("Transfer activity", "转账活动"), body: t("Token movements after applying the provider's contract and chain coverage.", "按数据商覆盖的合约与区块链统计代币移动。") },
        { title: t("Economic transfer", "经济性转账"), body: t("Excludes mint, burn, internal routing and other identified non-economic flows.", "剔除铸造、销毁、内部路由及其他可识别的非经济流。") },
        { title: t("Payment adoption", "支付采用"), body: t("Requires merchant, payer, settlement or invoice evidence; transfer count alone is insufficient.", "还需商户、付款方、结算或发票证据，仅有转账笔数不足以证明。") },
      ].map((item, index) => <article key={item.title} className="border-t-2 border-primary p-5"><span className="font-mono text-xs text-muted-foreground">0{index + 1}</span><h3 className="mt-4 text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-foreground/70">{item.body}</p></article>)}</div></section>
    </div>
  );
}

export function MarketIssuersPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const { activeProjects } = useMarketSnapshot();
  const rows = useMemo(() => ISSUERS.map((issuer) => ({ ...issuer, circulation: issuer.symbols.reduce((sum, symbol) => sum + (activeProjects.find((project) => project.symbol.toUpperCase() === symbol)?.currentMarketCapUsd ?? 0), 0) })), [activeProjects]);
  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <MarketSectionNav />
      <MarketPageHeader kicker={t("Issuer economics and backing", "发行方经营与资产支持")} title={t("Issuers, Reserves & Redemption", "发行方、储备与赎回")} description={t("Compare what backs major stablecoins, how issuers earn income, who checks the reserves and how holders can redeem.", "比较主要稳定币由什么资产支持、发行方如何获得收入、谁负责核验储备，以及持有人如何赎回。")} icon={ShieldCheck} />
      <section className="editorial-section">
        <div><p className="editorial-kicker">{t("Issuer comparison", "发行方比较")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Financial and disclosure profile", "财务与披露画像")}</h2></div>
        <div className="mt-7 overflow-x-auto border-y border-border"><table className="w-full min-w-[1180px] border-collapse text-left"><thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("Issuer / product", "发行方 / 产品")}</th><th className="px-4 py-3 text-right font-medium">{t("Current circulation", "当前流通规模")}</th><th className="px-4 py-3 font-medium">{t("Earnings", "盈利")}</th><th className="px-4 py-3 font-medium">{t("Reported reserves", "已披露储备")}</th><th className="px-4 py-3 font-medium">{t("Assurance / audit", "鉴证 / 审计")}</th><th className="px-4 py-3 font-medium">{t("Cadence", "频率")}</th></tr></thead><tbody>{rows.map((issuer) => <tr key={issuer.name} className="border-b border-border last:border-0 align-top"><td className="px-4 py-5"><DataSource href={issuer.url}>{issuer.name}</DataSource><span className="mt-2 block text-sm text-muted-foreground">{issuer.product} · {issuer.period}</span></td><td className="px-4 py-5 text-right font-semibold tabular-nums">{issuer.circulation ? compactUsd(issuer.circulation) : "—"}</td><td className="px-4 py-5"><strong className="text-xl tabular-nums text-primary">{issuer.earnings}</strong><span className="mt-1 block max-w-48 text-xs leading-5 text-muted-foreground">{zh ? issuer.earningsLabel.zh : issuer.earningsLabel.en}</span></td><td className="px-4 py-5"><strong className="text-lg tabular-nums">{issuer.reserves}</strong><span className="mt-1 block max-w-64 text-xs leading-5 text-muted-foreground">{zh ? issuer.reserveDetail.zh : issuer.reserveDetail.en}</span></td><td className="max-w-xs px-4 py-5 text-sm leading-6 text-foreground/72">{zh ? issuer.assurance.zh : issuer.assurance.en}</td><td className="px-4 py-5 text-sm text-muted-foreground">{zh ? issuer.disclosure.zh : issuer.disclosure.en}</td></tr>)}</tbody></table></div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("N/D means the issuer does not separately disclose product-level profit. Attestation examines a defined reserve assertion at a point in time; it is not equivalent to a full financial-statement audit.", "N/D 表示发行方未单独披露产品级利润。鉴证针对特定时点和特定储备声明，不等同于完整财务报表审计。")}</p>
      </section>
      <section className="editorial-section">
        <div><p className="editorial-kicker">{t("Operational terms", "运营与赎回条件")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("What sits behind the reserve number", "储备数字背后还要看什么")}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t("Open an issuer to compare asset maturity, custody, redemption access, income sources and the delay between a reporting date and publication.", "展开发行方，可比较储备期限、托管安排、赎回入口、收入来源，以及报告日到发布日期之间的时滞。")}</p></div>
        <div className="mt-7 divide-y divide-border border-y border-border">{rows.map((issuer, index) => <details key={issuer.name} className="group"><summary className="grid cursor-pointer list-none grid-cols-[2.5rem_1fr_auto] items-center gap-3 py-5"><span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span><strong className="block text-lg group-open:text-primary">{issuer.name}</strong><span className="mt-1 block text-sm text-muted-foreground">{issuer.product} · {zh ? issuer.maturity.zh : issuer.maturity.en}</span></span><span className="text-sm font-semibold text-primary group-open:hidden">{t("View", "展开")}</span><span className="hidden text-sm font-semibold text-primary group-open:inline">{t("Hide", "收起")}</span></summary><dl className="mb-6 ml-10 grid gap-x-8 gap-y-5 border-l-2 border-primary/30 pl-5 md:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Custody & counterparties", "托管与交易对手")}</dt><dd className="mt-2 text-sm leading-6">{zh ? issuer.custody.zh : issuer.custody.en}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Redemption access", "赎回入口")}</dt><dd className="mt-2 text-sm leading-6">{zh ? issuer.redemption.zh : issuer.redemption.en}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Revenue structure", "收入结构")}</dt><dd className="mt-2 text-sm leading-6">{zh ? issuer.revenueMix.zh : issuer.revenueMix.en}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{t("Assurance lag", "鉴证时滞")}</dt><dd className="mt-2 text-sm leading-6">{zh ? issuer.assuranceLag.zh : issuer.assuranceLag.en}</dd></div></dl></details>)}</div>
      </section>
      <section className="editorial-section"><div className="grid gap-px bg-border md:grid-cols-4">{[
        { label: t("Liquidity", "流动性"), body: t("Cash, overnight repo and short-dated sovereign bills, including maturity profile.", "现金、隔夜回购和短期主权债券，并关注期限结构。") },
        { label: t("Credit & custody", "信用与托管"), body: t("Bank, custodian, counterparty and secured-lending exposures.", "银行、托管人、交易对手及担保贷款敞口。") },
        { label: t("Coverage", "覆盖程度"), body: t("Reserve value relative to tokens outstanding and the size of any excess buffer.", "储备价值相对流通代币的覆盖率及超额缓冲规模。") },
        { label: t("Verification", "核验强度"), body: t("Scope, standard, provider, reporting date and publication lag.", "范围、准则、服务机构、报告日与发布时间差。") },
      ].map((item) => <article key={item.label} className="bg-background p-5"><h3 className="font-semibold text-primary">{item.label}</h3><p className="mt-3 text-sm leading-6 text-foreground/70">{item.body}</p></article>)}</div></section>
    </div>
  );
}

export function MarketMacroPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const [snapshot, setSnapshot] = useState<MacroSnapshot | null>(null);
  useEffect(() => { fetch(`${apiBase()}/api/stablecoin-macro`).then((response) => response.ok ? response.json() : Promise.reject()).then(setSnapshot).catch(() => setSnapshot(null)); }, []);
  const rateSeries = useMemo(() => snapshot?.series.filter((series) => series.unit === "%") ?? [], [snapshot]);
  const conditionSeries = useMemo(() => snapshot?.series.filter((series) => series.unit !== "%") ?? [], [snapshot]);
  const chart = useMemo(() => {
    const rows = new Map<string, Record<string, number | string>>();
    rateSeries.forEach((series) => series.observations.forEach((point) => rows.set(point.date, { ...(rows.get(point.date) ?? { date: point.date }), [series.id]: point.value })));
    return Array.from(rows.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [rateSeries]);
  const colors = ["hsl(var(--primary))", "#2c8c7b", "#bd8a25", "#b45561", "#3977a6"];
  const translatedLabel = (id: string, fallback: string) => ({
    EFFR: t("Effective federal funds rate", "有效联邦基金利率"), DGS3MO: t("3-month Treasury yield", "3 个月期美债收益率"), DGS2: t("2-year Treasury yield", "2 年期美债收益率"), DGS10: t("10-year Treasury yield", "10 年期美债收益率"), SOFR: t("Secured overnight financing rate", "担保隔夜融资利率"), DTWEXBGS: t("Broad U.S. dollar index", "广义美元指数"), RRPONTSYD: t("Overnight reverse repo balance", "隔夜逆回购余额"), VIXCLS: t("Market volatility index", "市场波动率指数"), DEXCHUS: t("Chinese yuan per U.S. dollar", "人民币兑美元（人民币/美元）"), DEXHKUS: t("Hong Kong dollars per U.S. dollar", "港元兑美元（港元/美元）"), DEXSIUS: t("Singapore dollars per U.S. dollar", "新元兑美元（新元/美元）"),
  }[id] ?? fallback);
  const latestValue = (series: MacroSnapshot["series"][number]) => series.latest ? `${series.latest.value.toFixed(2)}${series.unit === "%" ? "%" : series.unit === "USD bn" ? "B" : ""}` : "—";
  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <MarketSectionNav />
      <MarketPageHeader kicker={t("Macro environment", "宏观环境")} title={t("Rates, Dollar, Liquidity & Asian FX", "利率、美元、资金环境与亚洲汇率")} description={t("Track the rates that affect reserve income, the dollar backdrop that shapes global demand, money-market liquidity and the Asian exchange rates relevant to local stablecoin markets.", "观察影响储备收益的利率、影响全球需求的美元环境、货币市场流动性，以及与亚洲本地稳定币市场相关的汇率。")} icon={Landmark} />
      {snapshot && <>
      <section className="editorial-section"><div><p className="editorial-kicker">{t("Interest-rate curve", "利率曲线")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Policy, funding and Treasury yields · 12 months", "政策利率、资金利率与美债收益率 · 过去 12 个月")}</h2></div><div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">{rateSeries.map((series, index) => <div key={series.id} className="flex items-center gap-2 text-sm"><span className="h-2.5 w-2.5" style={{ backgroundColor: colors[index] }} /><span className="text-foreground/68">{translatedLabel(series.id, series.label)}</span><strong className="tabular-nums">{latestValue(series)}</strong></div>)}</div><div className="mt-5 h-[410px] border-y border-border py-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart}><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" minTickGap={42} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: string) => value.slice(0, 7)} /><YAxis unit="%" width={50} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} />{rateSeries.map((series, index) => <Area key={series.id} type="monotone" dataKey={series.id} name={translatedLabel(series.id, series.label)} stroke={colors[index]} fill={colors[index]} fillOpacity={0.025} strokeWidth={2} connectNulls isAnimationActive={false} />)}</AreaChart></ResponsiveContainer></div></section>
      <section className="editorial-section"><div><p className="editorial-kicker">{t("Market conditions", "市场条件")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Dollar strength, liquidity, volatility and Asian FX", "美元强弱、流动性、市场波动与亚洲汇率")}</h2></div><div className="mt-7 grid gap-7 lg:grid-cols-3">{conditionSeries.map((series, index) => <article key={series.id} className="min-w-0"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold">{translatedLabel(series.id, series.label)}</p><strong className="mt-2 block text-2xl tabular-nums text-primary">{latestValue(series)}</strong></div><span className="text-xs text-muted-foreground">{series.latest?.date}</span></div><div className="mt-4 h-48 border-y border-border py-3"><ResponsiveContainer width="100%" height="100%"><AreaChart data={series.observations}><XAxis dataKey="date" hide /><YAxis domain={["dataMin", "dataMax"]} hide /><Tooltip labelFormatter={(value: string) => value} formatter={(value: number) => value.toFixed(4)} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Area type="monotone" dataKey="value" stroke={colors[(index + 2) % colors.length]} fill={colors[(index + 2) % colors.length]} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></article>)}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">{t("Asian FX series are local-currency units per U.S. dollar. Singapore implements monetary policy through the exchange-rate band rather than a single policy-rate target, so unlike-for-like policy rates are not forced into this chart.", "亚洲汇率均表示一美元对应多少本地货币。新加坡以汇率政策区间而不是单一目标利率实施货币政策，因此这里不强行放入不可直接比较的“政策利率”。")}</p></section>
      <section className="editorial-section"><div className="grid gap-6 md:grid-cols-3">{[
        { title: t("Reserve-income channel", "储备收益渠道"), body: t("Short-term policy and Treasury yields shape the gross income available on cash-like reserves.", "短端政策利率和美债收益率影响现金类储备可获得的总收益。") },
        { title: t("Demand channel", "需求渠道"), body: t("Dollar strength, funding stress and local currency conditions affect demand for tokenised dollars outside the US.", "美元强弱、资金压力与当地货币环境影响美国以外对代币化美元的需求。") },
        { title: t("Risk channel", "风险渠道"), body: t("Market volatility can raise redemption demand and test reserve liquidity; correlation alone does not establish causality.", "市场波动可能提高赎回需求并检验储备流动性；相关性本身不能证明因果。") },
      ].map((item) => <article key={item.title} className="border-t-2 border-primary p-5"><h3 className="text-xl font-semibold">{item.title}</h3><p className="mt-3 text-sm leading-7 text-foreground/70">{item.body}</p></article>)}</div></section>
      </>}
    </div>
  );
}

const ADOPTION_PAYMENT_CATEGORIES = [
  { category: "B2B", value: 76.0 },
  { category: "P2P", value: 19.0 },
  { category: "Card", value: 18.0 },
  { category: "Prefunding", value: 3.6 },
  { category: "B2C", value: 3.3 },
];

export function MarketAdoptionPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const { activeProjects, totalMarketCap, loading } = useMarketSnapshot();
  const usdtUsdcCirculation = useMemo(
    () => activeProjects
      .filter((project) => ["USDT", "USDC"].includes(project.symbol.toUpperCase()))
      .reduce((sum, project) => sum + project.currentMarketCapUsd, 0),
    [activeProjects],
  );
  const topTwoShare = totalMarketCap ? (usdtUsdcCirculation / totalMarketCap) * 100 : 0;

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <MarketSectionNav />
      <MarketPageHeader
        kicker={t("Measurable use", "可量化使用")}
        title={t("Payments & Actual Use", "支付与实际使用")}
        description={t(
          "See how much stablecoin activity can be linked to payments, how many users or institutions are active, and where usable channels already exist.",
          "查看有多少稳定币活动能够对应到支付、有多少用户或机构实际活跃，以及哪些使用渠道已经存在。",
        )}
        icon={UsersRound}
      />

      <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="editorial-kicker">{t("Attributed payments", "可归因支付")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Payment evidence in the Artemis sample", "Artemis 样本中的支付证据")}</h2></div>
          <DataSource href="https://reports.artemisanalytics.com/stablecoins/artemis-stablecoin-payments-from-the-ground-up-2025.pdf">Artemis · Jan 2023–Aug 2025</DataSource>
        </div>
        <div className="mt-7 grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t("Attributed payment value", "可归因支付总额"), value: "$136B", note: t("Cumulative value in the study period", "研究期间累计金额") },
            { label: t("August annualised run rate", "8 月年化运行规模"), value: "$122B", note: t("Annualised from August 2025 activity", "按 2025 年 8 月活动年化") },
            { label: t("Company coverage", "企业样本覆盖"), value: "33", note: t("22 surveyed and 11 additionally estimated", "22 家受访，另估算 11 家") },
            { label: t("USDT share", "USDT 占比"), value: "≈85%", note: t("Share of payment volume in the report sample", "在报告支付样本中的占比") },
          ].map((metric) => <article key={metric.label} className="bg-background p-6"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{metric.label}</p><strong className="mt-4 block text-4xl font-semibold tabular-nums text-primary">{metric.value}</strong><p className="mt-3 text-sm leading-6 text-foreground/64">{metric.note}</p></article>)}
        </div>
        <div className="mt-10"><p className="editorial-kicker">{t("Payment composition", "支付构成")}</p><h3 className="mt-2 text-2xl font-semibold">{t("Reported value by category", "按类别统计的报告金额")}</h3><div className="mt-6 h-[360px] border-y border-border py-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={ADOPTION_PAYMENT_CATEGORIES} layout="vertical" margin={{ right: 28 }}><CartesianGrid stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" unit="B" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="category" width={82} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => `$${value.toFixed(1)}B`} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Bar dataKey="value" fill="hsl(var(--primary))" isAnimationActive={false} /></BarChart></ResponsiveContainer></div><p className="mt-3 text-xs text-muted-foreground">{t("Report-period sample; see Data Notes on Market Overview for methodology and limitations.", "报告期样本；方法与局限详见市场概览底部的“数据说明”。")}</p></div>
      </section>

      <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-kicker">{t("Distribution and activity", "分发与活动")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Current reach and issuer-reported use", "当前覆盖与发行方报告的使用情况")}</h2></div><DataSource href="https://s206.q4cdn.com/265218871/files/doc_news/2026/Aug/05/CIRCLE_Q2-2026.pdf">Circle · Q2 2026</DataSource></div>
        <div className="mt-7 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <article className="bg-background p-5"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t("USDT + USDC circulation", "USDT + USDC 流通规模")}</p><strong className="mt-4 block text-3xl font-semibold tabular-nums text-primary">{loading ? "—" : compactUsd(usdtUsdcCirculation)}</strong><p className="mt-3 text-xs leading-5 text-muted-foreground">{loading ? t("Loading API data", "正在加载 API 数据") : `${topTwoShare.toFixed(1)}% ${t("of tracked supply · auto-updated", "占追踪供应 · 自动更新")}`}</p></article>
          {[
            { value: "7.0M", label: t("Meaningful wallets", "有效钱包"), note: t("Wallets holding more than $10 USDC", "持有超过 10 美元 USDC 的钱包") },
            { value: "$14.8T", label: t("Q2 on-chain volume", "Q2 链上交易额"), note: t("Activity measure, not payment volume", "活动指标，不等于支付额") },
            { value: "175", label: t("CPN institutions", "CPN 加入机构"), note: t("Enrolled financial institutions", "已加入的金融机构") },
            { value: "$14.7B", label: t("CPN annualised volume", "CPN 年化交易额"), note: t("Trailing 30-day annualised rate", "按过去 30 日年化") },
          ].map((metric) => <article key={metric.label} className="bg-background p-5"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{metric.label}</p><strong className="mt-4 block text-3xl font-semibold tabular-nums text-primary">{metric.value}</strong><p className="mt-3 text-xs leading-5 text-muted-foreground">{metric.note} · {t("report snapshot", "报告期快照")}</p></article>)}
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{t("The circulation figure is fetched from the site's DefiLlama-backed API. Circle figures are issuer-reported snapshots and retain the issuer's definitions.", "流通规模由本站后端通过 DefiLlama 数据自动获取；Circle 指标为发行方报告期快照，并保留发行方自身口径。")}</p>
      </section>

    </div>
  );
}
