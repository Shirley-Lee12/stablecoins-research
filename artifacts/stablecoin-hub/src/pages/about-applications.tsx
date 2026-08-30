import React, { useState } from "react";
import { Link } from "wouter";
import {
  CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Scatter,
  Tooltip as ChartTooltip, XAxis, YAxis,
} from "recharts";
import { ContentEdgeNav } from "@/components/content-edge-nav";
import { useLanguage } from "@/lib/language-context";
import applicationData from "@/data/stablecoin-applications.json";
import {
  ArrowRight, Building2, CircleDollarSign, ExternalLink, Globe2, Landmark,
  Network, Play, RefreshCcw, Store, WalletCards,
} from "lucide-react";

const DATA = applicationData.datasets;

const USE_COLORS: Record<string, string> = {
  exchanges: "#3558c9", finance: "#138a7e", infrastructure: "#7b65b2",
  transfers: "#d45f50", idle: "#778193", payments: "#c58a19",
};

const USE_LABELS: Record<string, { en: string; zh: string }> = {
  exchanges: { en: "Exchange liquidity", zh: "交易所流动性" },
  finance: { en: "On-chain finance", zh: "链上金融" },
  infrastructure: { en: "Infrastructure", zh: "基础设施" },
  transfers: { en: "Wallet transfers", zh: "钱包转移" },
  idle: { en: "Idle balances", zh: "闲置余额" },
  payments: { en: "Goods and services", zh: "商品与服务支付" },
};

const TRANSACTION_LABELS: Record<string, { en: string; zh: string }> = {
  on_chain_trading: { en: "On-chain trading", zh: "链上交易" },
  payments: { en: "Payments", zh: "支付" },
  on_off_ramping: { en: "On-/off-ramping", zh: "出入金" },
  tokenised_asset_settlement: { en: "Tokenised asset settlement", zh: "代币化资产结算" },
};

const PATHS = [
  { id: "applications-markets", icon: Network, en: "Crypto markets", zh: "加密市场", detailEn: "Trading, collateral, market making and programmable settlement", detailZh: "交易、抵押、做市与可编程结算", color: "#3558c9" },
  { id: "applications-crossborder", icon: Globe2, en: "International money movement", zh: "国际资金流动", detailEn: "Cross-border transfers, dollar access and fiat conversion", detailZh: "跨境转移、美元获取与法币兑换", color: "#138a7e" },
  { id: "applications-real-economy", icon: Building2, en: "Firms and the real economy", zh: "企业与实体经济", detailEn: "Merchant payment, treasury and tokenised-asset settlement", detailZh: "商户支付、资金管理与代币化资产结算", color: "#d45f50" },
];

const USDT_FIAT_VOLUME = [
  { currency: "KRW", value: 123.73 }, { currency: "EUR", value: 123.27 },
  { currency: "TRY", value: 77.07 }, { currency: "BRL", value: 16.02 },
  { currency: "THB", value: 14.16 }, { currency: "GBP", value: 12.24 },
];

const JOURNEY = [
  { icon: Landmark, en: "Company bank account", zh: "企业银行账户", detailEn: "Local operating funds", detailZh: "本地经营资金" },
  { icon: Building2, en: "Regulated on-ramp", zh: "合规入金平台", detailEn: "FX, compliance and conversion", detailZh: "外汇、合规与兑换" },
  { icon: WalletCards, en: "Stablecoin transfer", zh: "稳定币转移", detailEn: "Wallet and blockchain settlement", detailZh: "钱包与区块链结算" },
  { icon: RefreshCcw, en: "Local off-ramp", zh: "本地出金平台", detailEn: "Liquidity and redemption", detailZh: "流动性与赎回" },
  { icon: Store, en: "Supplier account", zh: "供应商账户", detailEn: "Spend, hold or convert", detailZh: "支出、持有或兑换" },
];

const SOURCES = [
  { title: "Anchoring Trust in Money: Innovation beyond Stablecoins", org: "Bank for International Settlements, 2026", href: "https://www.bis.org/publ/arpdf/ar2026e3.htm" },
  { title: "Stablecoin Flows and Spillovers to FX Markets", org: "Bank for International Settlements, 2026", href: "https://www.bis.org/publ/work1340.htm" },
  { title: "Capital Flows to Emerging Markets", org: "International Monetary Fund, 2026", href: "https://www.elibrary.imf.org/abstract/book/9798229035910/CH002.xml" },
  { title: "What Are Stablecoins Used for Today?", org: "Federal Reserve Bank of Kansas City, 2026", href: "https://www.kansascityfed.org/research/payments-system-research-briefings/what-are-stablecoins-used-for-today-estimating-the-distribution-of-stablecoins/" },
];

function compactUsdBillions(value: number) {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}T`;
  return `$${value.toFixed(value >= 100 ? 0 : 1)}B`;
}

export default function AboutApplicationsPage() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const [activePath, setActivePath] = useState(PATHS[0].id);
  const latestMarket = DATA.marketCap.observations.at(-1)!;
  const stockAllocation = DATA.applicationStockBenchmark.categories;
  const transactionAllocation = DATA.applicationTransactionValue2024.categories;
  const crossBorderData = [
    ...DATA.historicalCrossBorderFlows.observations.map((item) => ({ period: item.period, historical: item.totalCovered, latest: null as number | null })),
    { period: DATA.latestCrossBorderBenchmark.period, historical: null, latest: DATA.latestCrossBorderBenchmark.value },
  ];
  const fiatInflows = DATA.fiatStablecoinNetInflows.observations;
  const maxFiatVolume = Math.max(...USDT_FIAT_VOLUME.map((item) => item.value));

  const openPath = (id: string) => {
    setActivePath(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <ContentEdgeNav label={t("On this page", "本页目录")} items={[
        { id: "applications-overview", label: t("Application map", "应用图谱") },
        { id: "applications-markets", label: t("Crypto markets", "加密市场") },
        { id: "applications-crossborder", label: t("International routes", "国际资金路径") },
        { id: "applications-real-economy", label: t("Real economy", "实体经济") },
        { id: "applications-journey", label: t("Transaction journey", "交易路径") },
        { id: "applications-evidence", label: t("Sources", "资料来源") },
      ]} />

      <header className="border-b border-border pb-8">
        <p className="editorial-kicker">{t("About Stablecoins", "关于稳定币")}</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-primary sm:text-5xl">{t("Stablecoin Applications", "稳定币应用")}</h1>
        <p className="mt-5 max-w-4xl editorial-copy">{t(
          "Stablecoins connect crypto-market liquidity, international money movement and real-economy settlement. Their value depends on the complete route between fiat money, wallets, blockchains and redemption channels.",
          "稳定币连接加密市场流动性、国际资金流动与实体经济结算。其实际价值取决于法币、钱包、区块链与赎回渠道共同构成的完整路径。",
        )}</p>
      </header>

      <section id="applications-overview" className="scroll-mt-24">
        <div className="relative overflow-hidden border-y border-border bg-[#eef3f7]">
          <img src="/media/stablecoin-applications-network.png" alt={t("A settlement network linking markets, international transfers and business activity", "连接市场、国际转移与企业活动的结算网络")} className="h-[300px] w-full object-cover sm:h-[360px] lg:h-[430px]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/85 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 grid px-4 pb-4 sm:grid-cols-3 sm:px-7 sm:pb-6">
            {PATHS.map((path) => <button key={path.id} type="button" onClick={() => openPath(path.id)} className={`group flex min-w-0 items-center gap-3 border-t-2 px-2 py-3 text-left transition-colors sm:px-4 ${activePath === path.id ? "text-foreground" : "text-foreground/70 hover:text-foreground"}`} style={{ borderTopColor: activePath === path.id ? path.color : "rgba(100,116,139,.28)" }}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: path.color }}><path.icon className="h-5 w-5" /></span>
              <span className="min-w-0"><span className="block font-semibold">{zh ? path.zh : path.en}</span><span className="mt-0.5 hidden text-xs leading-5 sm:block">{zh ? path.detailZh : path.detailEn}</span></span>
            </button>)}
          </div>
        </div>
      </section>

      <section id="applications-markets" className="editorial-section">
        <div className="grid gap-10 border-y border-border py-10 lg:grid-cols-[minmax(18rem,.7fr)_minmax(0,1.3fr)] lg:items-center">
          <div>
            <p className="editorial-kicker">{t("Route 01 · Crypto markets", "路径01 · 加密市场")}</p>
            <p className="mt-4 text-7xl font-semibold tabular-nums text-[#3558c9] sm:text-8xl">88%</p>
            <h2 className="mt-4 font-serif text-3xl font-bold text-primary">{t("Trading still dominates measured activity", "交易仍然主导可测量活动")}</h2>
            <p className="mt-4 editorial-copy">{t(
              "Stablecoins function primarily as quote currency, collateral and a settlement balance within crypto markets. Payments, fiat access and tokenised-asset settlement account for a much smaller share of estimated 2024 transaction value.",
              "稳定币目前主要在加密市场中承担报价货币、抵押品与结算余额功能。支付、法币出入金和代币化资产结算在2024年估算交易价值中所占比例明显较低。",
            )}</p>
          </div>
          <div>
            <div className="space-y-6">{transactionAllocation.map((item, index) => <div key={item.id}>
              <div className="flex items-end justify-between gap-4"><span className="text-base font-medium">{TRANSACTION_LABELS[item.id][zh ? "zh" : "en"]}</span><span className="text-3xl font-semibold tabular-nums">{item.sharePercent}%</span></div>
              <div className="mt-2 h-2 bg-muted"><div className="h-full" style={{ width: `${item.sharePercent}%`, backgroundColor: ["#3558c9", "#c58a19", "#138a7e", "#d45f50"][index] }} /></div>
            </div>)}</div>
            <a href={DATA.applicationTransactionValue2024.source.url} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">BIS Annual Economic Report 2026<ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        </div>

        <div className="pt-12">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div><p className="editorial-kicker">{t("Outstanding balances · November 2025", "存量分布 · 2025年11月")}</p><h3 className="mt-2 font-serif text-2xl font-bold text-primary">{t("Where an estimated $300.5B was held", "约3005亿美元稳定币被持有在哪里")}</h3></div>
            <div><p className="text-3xl font-semibold tabular-nums">{compactUsdBillions(latestMarket.totalCovered)}</p><p className="mt-1 text-sm text-foreground/70">{t("Total market cap · 29 May 2026", "市场总规模 · 2026年5月29日")}</p></div>
          </div>
          <div className="mt-7 flex h-16 w-full overflow-hidden" role="img" aria-label={t("Estimated allocation of stablecoin market capitalisation by use", "按用途估算的稳定币市场存量分配")}>{stockAllocation.map((item) => <span key={item.id} style={{ width: `${item.reportedSharePercent}%`, backgroundColor: USE_COLORS[item.id] }} title={`${USE_LABELS[item.id][zh ? "zh" : "en"]}: ${item.reportedSharePercent}%`} />)}</div>
          <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{stockAllocation.map((item) => <div key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border/70 pb-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: USE_COLORS[item.id] }} /><span className="text-sm font-medium">{USE_LABELS[item.id][zh ? "zh" : "en"]}</span><span className="text-lg font-semibold tabular-nums">{item.reportedSharePercent}%</span></div>)}</div>
          <p className="mt-5 max-w-4xl text-sm leading-6 text-foreground/75">{t(
            "The source estimates a stock at one reference date. Transfers and payments rely on stronger behavioural assumptions than directly observable exchange and protocol balances; independent rounding produces a 99.9% total.",
            "该研究估算的是一个时点的存量。转移和支付类别比可直接观察的交易所与协议余额依赖更多行为假设；各类别独立四舍五入后合计为99.9%。",
          )}</p>
          <a href={DATA.applicationStockBenchmark.source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">{t("Federal Reserve Bank of Kansas City · method and source", "堪萨斯城联储 · 方法与来源")}<ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
      </section>

      <section id="applications-crossborder" className="editorial-section">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] lg:items-end">
          <div><p className="editorial-kicker">{t("Route 02 · International money movement", "路径02 · 国际资金流动")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("A parallel route into dollar liquidity", "进入美元流动性的平行路径")}</h2></div>
          <p className="editorial-copy">{t(
            "More than 70% of cumulative fiat-to-stablecoin net inflows in the BIS sample originated in non-US-dollar currencies. The pattern connects stablecoin demand with local FX access, exchange infrastructure and cross-border funding conditions.",
            "BIS样本中超过70%的法币兑稳定币累计净流入来自非美元货币。这一现象将稳定币需求与本地外汇获取、交易所基础设施及跨境融资条件联系起来。",
          )}</p>
        </div>
        <div className="mt-10 grid gap-12 xl:grid-cols-2">
          <figure className="min-w-0 border-t-4 border-[#3558c9] pt-5">
            <figcaption><p className="text-lg font-semibold">{t("Estimated gross cross-border USDT + USDC flows", "估算USDT与USDC跨境总流量")}</p><p className="mt-1 text-sm text-foreground/70">{t("184 countries · quarterly · USD billions", "184个国家 · 季度 · 十亿美元")}</p></figcaption>
            <div className="mt-5 h-72 w-full"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={crossBorderData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="period" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} /><YAxis axisLine={false} tickLine={false} width={54} tickFormatter={(value) => compactUsdBillions(Number(value))} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} /><ChartTooltip formatter={(value: number) => compactUsdBillions(Number(value))} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 4, boxShadow: "none" }} /><Line type="monotone" dataKey="historical" name={t("BIS historical series", "BIS历史序列")} stroke="#3558c9" strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} /><Scatter dataKey="latest" name={t("IMF 2025 Q1 benchmark", "IMF 2025年第一季度基准")} fill="#d45f50" isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div>
            <p className="mt-3 text-sm leading-6 text-foreground/75">{t("The BIS series ends in 2024 Q2. The red point is the IMF's separately published estimate for 2025 Q1 ($316B); it is retained as a distinct data vintage.", "BIS连续序列截至2024年第二季度。红点为IMF单独公布的2025年第一季度估计值3160亿美元，作为不同数据版本单列。")}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold text-primary"><a href={DATA.historicalCrossBorderFlows.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">BIS 2025<ExternalLink className="h-3.5 w-3.5" /></a><a href={DATA.latestCrossBorderBenchmark.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">IMF 2026<ExternalLink className="h-3.5 w-3.5" /></a></div>
          </figure>
          <figure className="min-w-0 border-t-4 border-[#138a7e] pt-5">
            <figcaption><p className="text-lg font-semibold">{t("Cumulative net fiat-to-stablecoin inflows", "法币兑稳定币累计净流入")}</p><p className="mt-1 text-sm text-foreground/70">{t("USD, EUR and 25 other fiat currencies · through December 2025", "美元、欧元及其他25种法币 · 截至2025年12月")}</p></figcaption>
            <div className="mt-5 h-72 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={fiatInflows} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="hsl(var(--border))" /><XAxis dataKey="period" axisLine={false} tickLine={false} interval="preserveStartEnd" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} /><YAxis axisLine={false} tickLine={false} width={54} tickFormatter={(value) => compactUsdBillions(Number(value))} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} /><ChartTooltip formatter={(value: number) => compactUsdBillions(Number(value))} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 4, boxShadow: "none" }} /><Line type="monotone" dataKey="USD" name={t("US dollar", "美元")} stroke="#3558c9" strokeWidth={2.75} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="EUR" name={t("Euro", "欧元")} stroke="#138a7e" strokeWidth={2.75} dot={false} isAnimationActive={false} /><Line type="monotone" dataKey="otherFiat" name={t("Other fiat currencies", "其他法币")} stroke="#d45f50" strokeWidth={2.75} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer></div>
            <div className="mt-3 flex flex-wrap gap-5 text-sm font-medium"><span className="text-[#3558c9]">● {t("USD", "美元")}</span><span className="text-[#138a7e]">● {t("EUR", "欧元")}</span><span className="text-[#d45f50]">● {t("Other fiat", "其他法币")}</span></div>
            <p className="mt-3 text-sm leading-6 text-foreground/75">{t("The source combines 25 currencies other than USD and EUR. It measures exchange conversion flows, not all cross-border wallet transfers.", "原始数据将美元和欧元以外的25种法币合并统计。该指标衡量交易所兑换流量，并不覆盖全部跨境钱包转账。")}</p>
            <a href={DATA.fiatStablecoinNetInflows.source.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">BIS 2026 · Graph 8<ExternalLink className="h-3.5 w-3.5" /></a>
          </figure>
        </div>

        <div className="mt-14 grid gap-10 border-y border-border py-10 lg:grid-cols-[minmax(18rem,.72fr)_minmax(0,1.28fr)]">
          <div><p className="editorial-kicker">{t("Inside non-USD markets", "观察非美元市场")}</p><h3 className="mt-3 font-serif text-2xl font-bold text-primary">{t("KRW and TRY stand out in observable USDT trading", "KRW与TRY在可观察的USDT交易中较为突出")}</h3><p className="mt-4 editorial-note">{t("Average daily USDT trading volume by quote currency in 2025 Q2 identifies active exchange books. It is a trading-volume measure rather than a decomposition of cumulative net inflows.", "2025年第二季度按报价货币统计的USDT平均日交易量可用于识别活跃交易市场；它属于交易量指标，并非累计净流入的币种拆分。")}</p></div>
          <div className="space-y-4">{USDT_FIAT_VOLUME.map((item, index) => <div key={item.currency} className="grid grid-cols-[3rem_minmax(0,1fr)_4.5rem] items-center gap-3"><span className="font-semibold">{item.currency}</span><div className="h-3 bg-muted"><div className="h-full" style={{ width: `${(item.value / maxFiatVolume) * 100}%`, backgroundColor: index < 3 ? ["#3558c9", "#138a7e", "#c58a19"][index] : "#8a94a5" }} /></div><span className="text-right text-sm font-semibold tabular-nums">${item.value.toFixed(1)}M</span></div>)}<a href="https://www.bis.org/publ/work1340.pdf" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-primary hover:underline">{t("BIS Working Paper 1340 · Table 1", "BIS工作论文1340号 · 表1")}<ExternalLink className="h-3.5 w-3.5" /></a></div>
        </div>

        <div className="mt-12 border-y border-border py-10">
          <div className="max-w-3xl"><p className="editorial-kicker">{t("Regional signals", "区域需求差异")}</p><h3 className="mt-2 font-serif text-2xl font-bold text-primary">{t("One token can meet three different kinds of demand", "同一种稳定币，可以满足三类不同需求")}</h3><p className="mt-3 editorial-note">{t("What users do with a stablecoin depends on the financial problem they are trying to solve and the local routes available for entering and leaving the token economy.", "用户如何使用稳定币，取决于当地最迫切的金融需求，以及法币进入和退出稳定币体系的渠道是否可用。")}</p></div>
          <div className="relative mt-9 grid gap-8 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-border md:block" />
            {[
              { icon: Network, en: "When crypto-market infrastructure is deep", zh: "当加密市场基础设施成熟", detailEn: "Demand concentrates in trading liquidity, collateral and on-chain settlement.", detailZh: "需求主要集中在交易流动性、抵押品与链上结算。", color: "#3558c9" },
              { icon: Globe2, en: "When cross-border banking is costly", zh: "当跨境银行服务成本较高", detailEn: "Stablecoins provide an additional route for remittances, trade settlement and access to dollar liquidity.", detailZh: "稳定币为汇款、贸易结算和获取美元流动性提供补充路径。", color: "#138a7e" },
              { icon: WalletCards, en: "When local money loses purchasing power", zh: "当本币购买力持续下降", detailEn: "Dollar-linked balances are more often used for operating cash and value preservation.", detailZh: "美元锚定余额更常用于保存营运资金和维持价值。", color: "#d45f50" },
            ].map((item) => <div key={item.en} className="relative pt-16 md:pt-14"><span className="absolute left-0 top-0 z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-background text-white" style={{ backgroundColor: item.color }}><item.icon className="h-6 w-6" /></span><p className="text-lg font-semibold leading-7">{zh ? item.zh : item.en}</p><p className="mt-2 text-[15px] leading-7 text-foreground/80">{zh ? item.detailZh : item.detailEn}</p></div>)}
          </div>
        </div>
      </section>

      <section id="applications-real-economy" className="editorial-section">
        <div className="grid gap-10 border-y border-border py-10 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div><p className="editorial-kicker">{t("Route 03 · Firms and the real economy", "路径03 · 企业与实体经济")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("Payments are visible, but not yet the dominant measured use", "支付已经出现，但尚不是主要可测量用途")}</h2><p className="mt-4 editorial-copy">{t("Merchant settlement, corporate treasury and tokenised-asset settlement can benefit from continuous availability and programmable distribution. Adoption still depends on accounting, consumer protection, tax treatment, custody and reliable redemption.", "商户结算、企业资金管理与代币化资产结算可以利用全天候运行和可编程分配，但其采用仍取决于会计、消费者保护、税务处理、托管与可靠赎回。")}</p></div>
          <div className="grid grid-cols-2 gap-8"><div className="border-l-4 border-[#c58a19] pl-5"><p className="text-6xl font-semibold tabular-nums text-[#c58a19]">5%</p><p className="mt-3 font-semibold">{t("of estimated 2024 transaction value", "2024年估算交易价值")}</p></div><div className="border-l-4 border-[#d45f50] pl-5"><p className="text-6xl font-semibold tabular-nums text-[#d45f50]">0.7%</p><p className="mt-3 font-semibold">{t("of estimated November 2025 balances", "2025年11月估算存量")}</p></div></div>
        </div>
        <div className="mt-12">
          <p className="editorial-kicker">{t("Measurement sensitivity · 2025", "测量口径敏感性 · 2025")}</p>
          <div className="mt-5 grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,.72fr)]">
            <div className="border-t-4 border-[#3558c9] pt-5"><p className="text-5xl font-semibold tabular-nums">$28T</p><p className="mt-2 font-semibold">{t("Broad adjusted annual transaction estimate", "广义调整后年度交易估计")}</p><a href={DATA.annualTransactionBenchmark2025.source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">Chainalysis 2026b · {t("via BIS", "经BIS引用")}<ExternalLink className="h-3 w-3" /></a></div>
            <ArrowRight className="mx-auto hidden h-8 w-8 text-muted-foreground md:block" />
            <div className="border-t-4 border-[#d45f50] pt-5"><p className="text-5xl font-semibold tabular-nums">$390B</p><p className="mt-2 font-semibold">{t("Economically adjusted annual estimate", "经济活动调整后年度估计")}</p><a href={DATA.annualTransactionBenchmark2025.source.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">Visa · Aldasoro, Frost & Ito 2026 · {t("via BIS", "经BIS引用")}<ExternalLink className="h-3 w-3" /></a></div>
          </div>
          <p className="mt-6 max-w-4xl editorial-note">{t("Self-transfers, automated activity, arbitrage and transfers embedded in complex smart-contract transactions can change the resulting estimate substantially. Neither figure is a count of end-user purchases.", "自转账、自动化活动、套利以及复杂智能合约交易中嵌套的转移都会显著改变估计结果；两个数字都不等同于最终用户购买规模。")}</p>
        </div>
      </section>

      <section id="applications-journey" className="editorial-section">
        <div className="max-w-3xl"><p className="editorial-kicker">{t("A cross-border business payment", "一笔跨境企业付款")}</p><h2 className="mt-3 font-serif text-3xl font-bold text-primary">{t("The transfer is one segment of a longer route", "链上转移只是完整路径中的一段")}</h2><p className="mt-4 editorial-copy">{t("The payer and recipient encounter banking, foreign-exchange, compliance, custody and liquidity services before value becomes usable at the destination.", "付款人与收款人在资金最终可用之前，还会经过银行、外汇、合规、托管与流动性服务。")}</p></div>
        <div className="relative mt-12"><div className="absolute left-[9%] right-[9%] top-8 hidden h-1 bg-gradient-to-r from-[#3558c9] via-[#138a7e] to-[#d45f50] md:block" /><ol className="relative grid gap-8 md:grid-cols-5">{JOURNEY.map((step, index) => <li key={step.en} className="relative grid grid-cols-[3.5rem_1fr] items-start gap-4 md:block md:text-center"><span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground md:mx-auto"><step.icon className="h-6 w-6" /></span><div className="pt-1 md:pt-4"><span className="text-xs font-semibold tabular-nums text-primary">0{index + 1}</span><p className="mt-1 font-semibold">{zh ? step.zh : step.en}</p><p className="mt-1 text-sm leading-6 text-foreground/70">{zh ? step.detailZh : step.detailEn}</p></div></li>)}</ol></div>
      </section>

      <section id="applications-evidence" className="editorial-section border-t border-border pt-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)]">
          <div><h2 className="font-serif text-2xl font-bold text-primary">{t("Evidence and Further Reading", "证据与延伸阅读")}</h2><div className="mt-5 divide-y divide-border border-y border-border">{SOURCES.map((source) => <a key={source.href} href={source.href} target="_blank" rel="noreferrer" className="group grid grid-cols-[1fr_auto] gap-4 py-5"><div><p className="font-semibold group-hover:text-primary">{source.title}</p><p className="mt-1 text-sm text-foreground/70">{source.org}</p></div><ExternalLink className="mt-1 h-4 w-4 text-muted-foreground group-hover:text-primary" /></a>)}</div></div>
          <a href="https://www.youtube.com/watch?v=kcGlgF3QH0I" target="_blank" rel="noreferrer" className="group block self-start"><div className="relative aspect-video overflow-hidden bg-muted"><img src="/media/imf-stablecoin-payments-seminar.jpg" alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /><span className="absolute inset-0 bg-black/10 group-hover:bg-black/20" /><span className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-background/95 text-primary shadow-sm"><Play className="ml-0.5 h-5 w-5 fill-current" /></span></div><p className="mt-3 font-semibold leading-6 group-hover:text-primary">Stablecoins and the Future of Payments: Evidence from Financial Markets</p><p className="mt-1 text-sm text-foreground/70">International Monetary Fund · 2026</p></a>
        </div>
      </section>

      <div className="flex flex-wrap gap-5 border-t border-border pt-6 text-sm font-medium">
        <Link href="/about-stablecoins/types" className="inline-flex items-center gap-2 text-primary hover:underline"><CircleDollarSign className="h-4 w-4" />{t("Compare stablecoin types", "比较稳定币类别")}</Link>
        <Link href="/regulatory" className="inline-flex items-center gap-2 text-primary hover:underline">{t("Compare current regulation", "比较当前监管")}<ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
