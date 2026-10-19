import { fetchFridayMarketData } from "@/lib/friday-market-data";
import { FridayDataNotice } from "@/components/friday-data-notice";
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Blocks,
  Landmark,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { SectionTopNav } from "@/components/section-top-nav";
import { useLanguage } from "@/lib/language-context";

export type MarketProject = {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  mechanism: string;
  currentMarketCapUsd: number;
  priceUsd: number | null;
  priceDeviationBps: number | null;
  change1dPct: number | null;
  change7dPct: number | null;
  change30dPct: number | null;
  chains: string[];
  historicalPeakUsd: number | null;
  status: "active" | "historical";
  statusReason: "collapsed" | "discontinued" | null;
  statusDate: string | null;
  officialUrl: string | null;
  sourceUrl: string;
};

export type MarketSnapshot = {
  source: "DefiLlama";
  sourceUrl: string;
  refreshedAt: string;
  summary: {
    totalUsd: number;
    bellwetherDominancePct: number;
    change1dPct: number | null;
    change7dPct: number | null;
    change30dPct: number | null;
  };
  history: Array<{ date: string; totalUsd: number }>;
  chains: Array<{
    name: string;
    totalUsd: number;
    sharePct: number;
    change30dPct: number | null;
    history: Array<{ date: string; totalUsd: number }>;
    dominantAssets: Array<{ symbol: string; totalUsd: number; sharePct: number }>;
  }>;
  projects: MarketProject[];
};

export const DATA_LENSES = [
  {
    id: "market",
    href: "/market-data/market",
    icon: BarChart3,
    title: { en: "Market", zh: "市场" },
    source: "DefiLlama · Binance · DexScreener · CoinGecko",
    body: { en: "Supply trends, CEX/DEX volume, spread, 2% depth, order slippage and depeg-event duration.", zh: "供应趋势、CEX/DEX 成交量、价差、2% 深度、订单滑点，以及脱锚事件的幅度和持续时间。" },
  },
  {
    id: "on-chain",
    href: "/market-data/on-chain",
    icon: Blocks,
    title: { en: "On-chain", zh: "链上数据" },
    source: "Artemis · DefiLlama · Etherscan",
    body: { en: "Transfer value, transactions, active addresses, chain distribution, mint, burn, Treasury flows and holder concentration.", zh: "转账额、交易笔数、活跃地址、跨链分布，以及铸造、销毁、Treasury 流量与持币集中度。" },
  },
  {
    id: "issuers",
    href: "/market-data/issuers-reserves",
    icon: ShieldCheck,
    title: { en: "Issuers & Reserves", zh: "发行方与储备" },
    source: "Issuer disclosures",
    body: { en: "Issuer earnings, reserve maturity, custodians, counterparties, redemption terms, assurance lag and income mix.", zh: "发行方盈利、储备期限、托管人、交易对手、赎回条件、鉴证时滞与收入结构。" },
  },
  {
    id: "macro",
    href: "/market-data/macro",
    icon: Landmark,
    title: { en: "Macro", zh: "宏观数据" },
    source: "FRED · official series",
    body: { en: "Two-year Treasury yield, dollar strength, money-market liquidity, volatility and selected Asian exchange rates.", zh: "2 年期美债收益率、美元强弱、货币市场流动性、波动率与部分亚洲汇率。" },
  },
  {
    id: "adoption",
    href: "/market-data/adoption",
    icon: UsersRound,
    title: { en: "Adoption", zh: "采用数据" },
    source: "Artemis · issuer reports",
    body: { en: "Attributed payment value, merchant coverage, institutional settlement, regional distribution and use channels.", zh: "可归因支付额、商户覆盖、机构结算、地区分布与使用渠道；当前采用带日期的报告快照。" },
  },
];

function apiBase() {
  return (import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL).replace(/\/$/, "");
}

export function useMarketSnapshot() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetchFridayMarketData("market");
      if (!response.ok) throw new Error("market data unavailable");
      setSnapshot(await response.json());
    } catch {
      setSnapshot(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const activeProjects = useMemo(
    () => (snapshot?.projects ?? []).filter((project) => project.status === "active").sort((a, b) => b.currentMarketCapUsd - a.currentMarketCapUsd),
    [snapshot],
  );
  const totalMarketCap = snapshot?.summary.totalUsd ?? activeProjects.reduce((total, project) => total + project.currentMarketCapUsd, 0);

  return { snapshot, loading, error, load, activeProjects, totalMarketCap };
}

export function MarketSectionNav() {
  const { t } = useLanguage();
  return (
    <>
      <FridayDataNotice />
    <SectionTopNav
      eyebrow={t("Market Data", "市场数据")}
      ariaLabel={t("Market-data sections", "市场数据二级导航")}
      items={[
        { href: "/market-data", label: t("Overview", "概览") },
        { href: "/market-data/market", label: t("Market", "市场") },
        { href: "/market-data/on-chain", label: t("On-chain", "链上数据") },
        { href: "/market-data/issuers-reserves", label: t("Issuers & Reserves", "发行方与储备") },
        { href: "/market-data/macro", label: t("Macro", "宏观数据") },
        { href: "/market-data/adoption", label: t("Adoption", "采用数据") },
      ]}
    />
      </>
  );
}

export function MarketPageHeader({
  kicker,
  title,
  description,
  icon: Icon = Activity,
}: {
  kicker: string;
  title: string;
  description: string;
  icon?: React.ElementType;
}) {
  return (
    <header className="border-b border-border pb-9">
      <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><p className="editorial-kicker">{kicker}</p></div>
      <h1 className="mt-4 font-serif text-4xl font-bold text-primary sm:text-5xl">{title}</h1>
      <p className="mt-5 max-w-4xl text-lg leading-8 text-foreground/78">{description}</p>
    </header>
  );
}

export function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: value >= 1_000_000_000 ? 1 : 2 }).format(value);
}

export function fullUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
