import React, { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, Database, ExternalLink, RefreshCw } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/lib/language-context";
import { compactUsd, DATA_LENSES, fullUsd, MarketPageHeader, MarketSectionNav, useMarketSnapshot } from "@/pages/market-data-shared";

function changeLabel(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

const LENS_QUESTIONS = {
  market: { en: "How large, liquid and stable is the market?", zh: "市场有多大、交易是否顺畅、锚定是否稳定？" },
  "on-chain": { en: "Where does supply move, and who is holding it?", zh: "稳定币在哪些链上流动，由谁持有？" },
  issuers: { en: "What backs redemption, and how does the issuer earn?", zh: "什么资产支持赎回，发行方靠什么盈利？" },
  macro: { en: "Which rates, dollar and liquidity conditions matter?", zh: "哪些利率、美元与流动性条件正在影响市场？" },
  adoption: { en: "How much use can be tied to payments and settlement?", zh: "有多少活动能够归因到支付与结算？" },
} as const;

function DataMethodologyDialog() {
  const { t } = useLanguage();
  const sources = [
    { name: "DefiLlama", scope: t("Supply, asset ranking, prices, peg deviation and chain distribution", "供应、资产排行、价格、锚定偏离与链分布"), mode: t("Backend API · 24-hour cache", "后端 API · 24 小时缓存"), url: "https://defillama.com/stablecoins" },
    { name: "Binance", scope: t("Selected stablecoin-pair volume, spread, 2% depth and simulated order slippage", "选定稳定币交易对的成交量、价差、2% 深度与订单滑点模拟"), mode: t("Public Spot API · no key · 10-minute cache", "公开现货 API · 无需 key · 10 分钟缓存"), url: "https://developers.binance.com/en/docs/products/spot/rest-api" },
    { name: "DexScreener", scope: t("Ethereum USDC and USDT stablecoin-pool volume and liquidity", "以太坊 USDC、USDT 稳定币池的成交量与流动性"), mode: t("Pool API · 10-minute cache", "池级 API · 10 分钟缓存"), url: "https://docs.dexscreener.com/api/reference" },
    { name: "CoinGecko", scope: t("Ninety-day hourly price history used by the depeg-event monitor", "脱锚事件监测采用的 90 日小时价格历史"), mode: t("Free Demo key supported · 30-minute cache", "支持免费 Demo key · 30 分钟缓存"), url: "https://docs.coingecko.com/reference/coins-id-market-chart" },
    { name: "Etherscan", scope: t("Ethereum USDT and USDC mint, burn, holder and reviewed Treasury-address flows", "以太坊 USDT、USDC 的铸造、销毁、持币人与已审核 Treasury 地址流量"), mode: t("Free key for logs; full holder list is a paid endpoint", "事件日志可用免费 key；完整持币人名单为付费接口"), url: "https://docs.etherscan.io/api-reference/endpoint/getlogs-address-topics" },
    { name: "FRED", scope: t("Policy and funding rates, Treasury yields, broad dollar index, reverse repo, VIX and selected Asian exchange rates", "政策与资金利率、美债收益率、广义美元指数、逆回购、VIX 与部分亚洲汇率"), mode: t("Official CSV · checked daily, 24-hour cache", "官方 CSV · 每日检查，24 小时缓存"), url: "https://fred.stlouisfed.org/" },
    { name: "Artemis overview", scope: t("Transfer value, transactions and active addresses", "转账额、交易笔数与活跃地址"), mode: t("Dated public snapshot · manual refresh", "带日期的公开快照 · 人工更新"), url: "https://www.artemis.ai/sectors/stablecoins/overview" },
    { name: "Artemis payments report", scope: t("Attributed B2B, B2C, card, P2P and prefunding payments", "可归因 B2B、B2C、卡支付、P2P 与预充值支付"), mode: t("Report-period snapshot · updated by report edition", "报告期快照 · 随新版报告更新"), url: "https://reports.artemisanalytics.com/stablecoins/artemis-stablecoin-payments-from-the-ground-up-2025.pdf" },
    { name: t("Issuer disclosure database", "发行方披露数据库"), scope: t("Earnings, reserve composition and maturity, custodians, redemption terms and assurance lag", "盈利、储备构成与期限、托管人、赎回条件和鉴证时滞"), mode: t("Only reviewed official disclosures are published", "仅发布经过人工复核的官方披露记录"), url: "https://investor.circle.com/overview/default.aspx" },
  ];
  return (
    <Dialog>
      <DialogTrigger asChild><button type="button" className="font-semibold text-primary underline decoration-2 underline-offset-4 hover:text-primary/75">{t("Open the full data notes", "查看完整数据说明")}</button></DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-6 pb-5 pt-6 pr-14">
          <DialogTitle className="font-serif text-2xl text-primary">{t("Market data notes", "市场数据说明")}</DialogTitle>
          <DialogDescription className="mt-2 leading-6">{t("Sources, refresh methods and interpretation boundaries used across the market-data pages.", "市场数据各页面采用的数据源、更新方式与解释边界。")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-8 px-6 pb-6 pt-2">
          <section>
            <h3 className="text-lg font-semibold">{t("Sources and update frequency", "数据源与更新频率")}</h3>
            <div className="mt-4 overflow-x-auto border-y border-border"><table className="w-full min-w-[720px] border-collapse text-left"><thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 font-medium">{t("Source", "来源")}</th><th className="px-4 py-3 font-medium">{t("Coverage", "覆盖内容")}</th><th className="px-4 py-3 font-medium">{t("Update", "更新方式")}</th></tr></thead><tbody>{sources.map((source) => <tr key={source.name} className="border-b border-border last:border-0 align-top"><td className="px-4 py-4"><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline">{source.name}<ExternalLink className="h-3.5 w-3.5" /></a></td><td className="px-4 py-4 text-sm leading-6">{source.scope}</td><td className="px-4 py-4 text-sm leading-6 text-muted-foreground">{source.mode}</td></tr>)}</tbody></table></div>
          </section>
          <section>
            <h3 className="text-lg font-semibold">{t("How to read the data", "数据解读边界")}</h3>
            <div className="mt-3 divide-y divide-border border-y border-border">{[
              t("Supply and market capitalisation do not measure exchange turnover or payment value.", "供应量和市值不代表交易所成交额或支付金额。"),
              t("On-chain transfers and active addresses measure network activity; they are not automatically retail or commercial adoption.", "链上转账和活跃地址衡量网络活动，不能自动视为零售或商业采用。"),
              t("Payment-report figures are samples with a defined period and methodology, not whole-market totals.", "支付报告数字是具有特定期间和方法的样本，并非全市场总量。"),
              t("Issuer attestations examine specified reserve assertions and are not equivalent to full financial-statement audits.", "发行方鉴证核验特定储备声明，不等同于完整财务报表审计。"),
              t("A source link is for verification; only rows marked as an API are automatically retrieved.", "来源链接用于核验；只有明确标记 API 的数据才会自动获取。"),
              t("If a live source fails, the affected chart or table is hidden instead of leaving an empty frame or silently substituting an older number.", "实时来源失败时，相应图表或表格会隐藏，不留下空框，也不会静默替换为旧数字。"),
            ].map((item, index) => <p key={item} className="grid grid-cols-[2rem_1fr] gap-3 py-3 text-sm leading-6"><span className="font-mono text-xs text-primary">0{index + 1}</span><span>{item}</span></p>)}</div>
          </section>
          <section>
            <h3 className="text-lg font-semibold">{t("What counts as adoption evidence", "什么才算采用证据")}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("The website separates institutional progress from actual use. The four observations below answer different questions and should not be added together.", "本站把制度进展和实际使用分开记录。下面四类观测回答的是不同问题，不能相互替代，也不能直接相加。")}</p>
            <ol className="mt-3 divide-y divide-border border-y border-border">
              {[
                { title: t("Distribution coverage", "分发覆盖"), body: t("Shows where a stablecoin can be obtained—for example, supported blockchains, wallets or exchanges. It describes potential access, not how many people actually use it.", "说明稳定币可以通过哪些区块链、钱包或交易平台获得。它反映潜在可达范围，但不能说明实际有多少人使用。") },
                { title: t("Channel availability", "渠道开通"), body: t("Confirms that a payment, settlement or redemption function is operating. A named checkout or banking channel proves the function exists, but not that users have generated meaningful volume.", "确认支付、结算或赎回功能已经开放。具名的收银或银行渠道可以证明功能存在，但仍不能证明用户已经产生有意义的交易量。") },
                { title: t("Observed activity", "可观测活动"), body: t("Counts active wallets, transfers or participating institutions. These numbers show activity, but the transaction purpose may still be trading, internal movement or automated activity rather than payment.", "统计活跃钱包、链上转账或参与机构。这些数字能够证明存在活动，但交易目的仍可能是交易、内部调拨或自动化操作，不一定是支付。") },
                { title: t("Attributed payment use", "可归因支付使用"), body: t("Links activity to a payer, merchant, invoice or settlement purpose using an explained method. This is the strongest adoption evidence used on the site, but its sample and reporting period must still be shown.", "通过明确的方法，把活动与付款人、商户、发票或结算用途联系起来。这是本站采用的最强使用证据，但仍必须说明样本范围和报告期间。") },
              ].map((item, index) => <li key={item.title} className="grid gap-2 py-4 sm:grid-cols-[2rem_9rem_1fr]"><span className="font-mono text-xs text-primary">0{index + 1}</span><strong className="text-sm">{item.title}</strong><p className="text-sm leading-6 text-foreground/72">{item.body}</p></li>)}
            </ol>
            <p className="mt-3 text-sm leading-6 text-foreground/72">{t("Policies, licences and pilots remain important because they show whether a market is allowed and who may participate. They are displayed in the development and regulatory sections, but are not labelled as measured adoption until there is separate usage evidence.", "政策、牌照和试点仍然重要，因为它们说明市场是否获准发展、哪些主体可以参与；这些内容会展示在发展和监管页面中，但在出现独立的使用证据之前，不会被标记为可量化采用。")}</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MarketData() {
  const { t, language } = useLanguage();
  const zh = language === "zh";
  const { snapshot, loading, error, load, activeProjects, totalMarketCap } = useMarketSnapshot();
  const topProjects = useMemo(() => activeProjects.slice(0, 8).map((project) => ({ ...project, label: project.symbol || project.name })), [activeProjects]);
  const topChains = snapshot?.chains.slice(0, 8) ?? [];
  const refreshedAt = snapshot
    ? new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.refreshedAt))
    : null;

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip pb-10">
      <MarketSectionNav />
      <MarketPageHeader kicker={t("Stablecoin market monitor", "稳定币市场监测")} title={t("Market Overview", "市场概览")} description={t("Market size, change, concentration and distribution across assets and chains.", "集中呈现市场规模、增减变化、资产集中度与跨链分布。")} icon={Database} />

      <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="editorial-kicker">{t("Start with the trend", "先看趋势")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Supply growth and market concentration", "供应趋势与市场集中度")}</h2></div>
          {snapshot && <a href={snapshot.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline">{t("Updated", "更新于")} {refreshedAt} · {snapshot.source}<ExternalLink className="h-4 w-4" /></a>}
        </div>
        {(loading || snapshot) && <div className="grid gap-10 xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,.8fr)]">
          <div className="min-w-0"><h3 className="mt-6 text-lg font-semibold">{t("Total stablecoin supply · 12 months", "稳定币总供应 · 过去 12 个月")}</h3><div className="mt-4 h-[390px] border-y border-border py-5">{loading ? <Skeleton className="h-full w-full" /> : snapshot ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={snapshot.history} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}><defs><linearGradient id="marketSupply" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} /><stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="hsl(var(--border))" vertical={false} /><XAxis dataKey="date" minTickGap={42} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value: string) => value.slice(0, 7)} /><YAxis tickFormatter={compactUsd} width={72} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={["dataMin", "dataMax"]} /><Tooltip formatter={(value: number) => fullUsd(value)} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Area type="monotone" dataKey="totalUsd" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#marketSupply)" isAnimationActive={false} /></AreaChart></ResponsiveContainer> : null}</div></div>
          <div className="min-w-0"><h3 className="mt-6 text-lg font-semibold">{t("Largest assets", "头部资产")}</h3><div className="mt-4 h-[390px] border-y border-border py-5">{loading ? <Skeleton className="h-full w-full" /> : snapshot ? <ResponsiveContainer width="100%" height="100%"><BarChart data={topProjects} layout="vertical" margin={{ left: 0, right: 12 }}><CartesianGrid stroke="hsl(var(--border))" horizontal={false} /><XAxis type="number" tickFormatter={compactUsd} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="label" width={58} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => fullUsd(value)} contentStyle={{ border: "1px solid hsl(var(--border))", borderRadius: 3 }} /><Bar dataKey="currentMarketCapUsd" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} isAnimationActive={false} /></BarChart></ResponsiveContainer> : null}</div></div>
        </div>}
        {error && <div className="mt-5 flex items-center justify-between gap-4 border-y border-border py-4"><p className="text-sm text-muted-foreground">{t("Current market source is temporarily unavailable.", "当前市场数据源暂时无法访问。")}</p><Button type="button" variant="outline" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />{t("Try again", "重新加载")}</Button></div>}
      </section>

      {!loading && !error && <section className="editorial-section">
        <div><p className="editorial-kicker">{t("Current snapshot", "当前快照")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Read the latest level after the trend", "看完趋势，再看当前水平")}</h2></div>
        <div className="mt-7 grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: t("Total supply", "稳定币总供应"), value: compactUsd(totalMarketCap), note: `${changeLabel(snapshot?.summary.change30dPct)} · 30D`, tone: "text-primary" },
            { label: t("7-day change", "7 日变化"), value: changeLabel(snapshot?.summary.change7dPct), note: t("Net change in total USD value", "总美元计价值净变化"), tone: (snapshot?.summary.change7dPct ?? 0) >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300" },
            { label: t("USDT dominance", "USDT 市占率"), value: `${(snapshot?.summary.bellwetherDominancePct ?? 0).toFixed(1)}%`, note: t("Share of total stablecoin supply", "占稳定币总供应的比例"), tone: "text-primary" },
            { label: t("Tracked assets", "追踪资产"), value: String(activeProjects.length), note: t("Active assets in the ranked table", "排行榜中的运行资产"), tone: "text-primary" },
          ].map((metric) => <article key={metric.label} className="bg-background p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{metric.label}</p><strong className={`mt-4 block text-4xl font-semibold tabular-nums ${metric.tone}`}>{metric.value}</strong><p className="mt-3 text-sm leading-6 text-foreground/64">{metric.note}</p></article>)}
        </div>
      </section>
      }

      {topChains.length > 0 && <section className="editorial-section">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="editorial-kicker">{t("Network distribution", "网络分布")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Stablecoin supply by chain", "各链稳定币供应")}</h2></div><Link href="/market-data/on-chain" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">{t("Open on-chain analysis", "查看链上分析")}<ArrowRight className="h-4 w-4" /></Link></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{topChains.map((chain, index) => <article key={chain.name} className="border-t-2 border-border p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><span className="text-sm tabular-nums text-muted-foreground">{chain.sharePct.toFixed(1)}%</span></div><h3 className="mt-4 text-lg font-semibold">{chain.name}</h3><p className="mt-2 text-2xl font-semibold tabular-nums text-primary">{compactUsd(chain.totalUsd)}</p></article>)}</div>
      </section>}

      <section className="editorial-section">
        <div><p className="editorial-kicker">{t("Continue the analysis", "继续分析")}</p><h2 className="mt-2 font-serif text-3xl font-bold text-primary">{t("Five questions, from market structure to actual use", "从市场结构到实际使用的五个问题")}</h2></div>
        <div className="mt-7 divide-y divide-border border-y border-border">{DATA_LENSES.map((lens, index) => <Link key={lens.id} href={lens.href} className="group grid gap-4 py-6 sm:grid-cols-[3rem_minmax(180px,.55fr)_minmax(0,1.25fr)_auto] sm:items-start"><span className="font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, "0")}</span><div className="flex items-center gap-3"><lens.icon className="h-5 w-5 shrink-0 text-primary" /><h3 className="text-lg font-semibold group-hover:text-primary">{zh ? lens.title.zh : lens.title.en}</h3></div><div><p className="font-semibold leading-6">{zh ? LENS_QUESTIONS[lens.id as keyof typeof LENS_QUESTIONS].zh : LENS_QUESTIONS[lens.id as keyof typeof LENS_QUESTIONS].en}</p><p className="mt-2 text-sm leading-6 text-foreground/68">{zh ? lens.body.zh : lens.body.en}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{lens.source}</p></div><ArrowRight className="mt-1 h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></Link>)}</div>
        <p className="mt-8 border-t border-border pt-6 text-base leading-8 text-muted-foreground"><strong className="font-semibold text-foreground underline decoration-2 underline-offset-4">{t("DATA NOTES", "数据说明")}</strong>{t(": Figures combine automatically refreshed public data with dated reports and issuer disclosures. Source coverage, update frequency and interpretation boundaries differ by metric. ", "：页面数字由自动更新的公开数据、带日期的研究报告和发行方披露共同组成；不同指标的数据覆盖、更新频率与解释边界并不相同。") }<DataMethodologyDialog /></p>
      </section>
    </div>
  );
}
