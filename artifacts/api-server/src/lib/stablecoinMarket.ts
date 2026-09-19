import { logger } from "./logger";

const DEFI_LLAMA_STABLECOINS_URL = "https://stablecoins.llama.fi/stablecoins?includePrices=true";
const DEFI_LLAMA_CHART_URL = "https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=";
const DEFI_LLAMA_TOTAL_HISTORY_URL = "https://stablecoins.llama.fi/stablecoincharts/all";
const DEFI_LLAMA_CHAIN_HISTORY_URL = "https://stablecoins.llama.fi/stablecoincharts";
const DEFI_LLAMA_CHAINS_URL = "https://stablecoins.llama.fi/stablecoinchains";
const REFRESH_INTERVAL_MS = 24 * 60 * 60_000;
const ACTIVE_MINIMUM_USD = 100_000;
const MAX_ACTIVE_PROJECTS = 50;

type PeggedAmounts = Record<string, number | undefined>;

interface DefiLlamaAsset {
  id: string;
  name: string;
  symbol: string;
  pegType?: string;
  pegMechanism?: string;
  circulating?: PeggedAmounts;
  circulatingPrevDay?: PeggedAmounts;
  circulatingPrevWeek?: PeggedAmounts;
  circulatingPrevMonth?: PeggedAmounts;
  chainCirculating?: Record<string, { current?: PeggedAmounts }>;
  price?: number | null;
  deadFrom?: string;
}

interface DefiLlamaHistoryPoint {
  date?: string;
  totalCirculatingUSD?: PeggedAmounts;
  totalCirculating?: PeggedAmounts;
}

interface DefiLlamaChain {
  name?: string;
  totalCirculatingUSD?: PeggedAmounts;
}

export interface StablecoinMarketItem {
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
}

export interface StablecoinMarketSnapshot {
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
  projects: StablecoinMarketItem[];
}

// The live source does not label every legacy token's operating status. Keep that
// editorial decision deliberately small and explicit rather than treating any
// low-supply asset as discontinued.
const HISTORICAL_PROJECTS: Record<string, { displayName: string; statusReason: "collapsed" | "discontinued"; statusDate: string }> = {
  "3": {
    displayName: "TerraUSD (UST)",
    statusReason: "collapsed",
    statusDate: "2022-05",
  },
  "9": {
    displayName: "Fei USD (FEI)",
    statusReason: "discontinued",
    statusDate: "2022-09",
  },
  "12": {
    displayName: "Neutrino USD (USDN)",
    statusReason: "discontinued",
    statusDate: "2023-02",
  },
};

// A small editorial override is used only where the market convention is more
// precise than the provider's broad mechanism bucket. USDe's delta-hedged
// structure is commonly described as synthetic rather than collateral-backed.
const MECHANISM_OVERRIDES: Record<string, string> = {
  "146": "synthetic",
};

// Project names should resolve to the issuer or protocol rather than an
// inferred DefiLlama detail route. Keep this list curated: a missing official
// URL is preferable to sending readers to an unofficial or broken page.
const OFFICIAL_PROJECT_URLS: Record<string, string> = {
  "1": "https://tether.to/",
  "2": "https://www.circle.com/usdc",
  "5": "https://sky.money/",
  "6": "https://frax.com/",
  "7": "https://www.trueusd.com/",
  "14": "https://usdd.io/",
  "50": "https://www.circle.com/eurc",
  "110": "https://www.curve.finance/crvusd/",
  "118": "https://aave.com/gho",
  "119": "https://firstdigitallabs.com/",
  "120": "https://www.paypal.com/us/digital-wallet/manage-money/crypto/pyusd",
  "129": "https://ondo.finance/usdy",
  // USDe's protocol documentation is the most useful official destination for
  // readers comparing how stablecoins work, rather than the issuer landing page.
  "146": "https://docs.ethena.fi/",
  "173": "https://www.blackrock.com/cash/en-us/products/329365/blackrock-usd-institutional-digital-liquidity-fund",
  "195": "https://usual.money/",
  "205": "https://www.agora.finance/",
  "209": "https://sky.money/",
  "221": "https://www.ethena.fi/",
  "237": "https://www.circle.com/usyc",
  "246": "https://falcon.finance/",
  "250": "https://ripple.com/solutions/stablecoin/",
  "262": "https://www.worldlibertyfinancial.com/",
  "271": "https://www.avantprotocol.com/",
  "286": "https://www.paxos.com/global-dollar",
};

let cachedSnapshot: StablecoinMarketSnapshot | null = null;
let refreshing: Promise<StablecoinMarketSnapshot> | null = null;

function sumAmounts(amounts: PeggedAmounts | undefined): number {
  if (!amounts) return 0;
  return Object.values(amounts).reduce<number>((total, value) => total + (Number.isFinite(value) ? Number(value) : 0), 0);
}

function percentChange(current: number, previous: number): number | null {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

function historyTotal(point: DefiLlamaHistoryPoint): number {
  return sumAmounts(point.totalCirculatingUSD) || sumAmounts(point.totalCirculating);
}

function normaliseHistory(points: DefiLlamaHistoryPoint[], days: number) {
  const threshold = Date.now() - days * 86_400_000;
  return points
    .filter((point) => point.date && historyTotal(point) > 0)
    .map((point) => ({ date: new Date(Number(point.date) * 1000).toISOString().slice(0, 10), totalUsd: historyTotal(point) }))
    .filter((point) => Date.parse(point.date) >= threshold);
}

function nearestHistoryValue(history: Array<{ date: string; totalUsd: number }>, daysAgo: number): number {
  if (!history.length) return 0;
  const latestTimestamp = Date.parse(history.at(-1)?.date ?? "");
  const target = latestTimestamp - daysAgo * 86_400_000;
  return history.reduce((best, point) => (
    Math.abs(Date.parse(point.date) - target) < Math.abs(Date.parse(best.date) - target) ? point : best
  )).totalUsd;
}

function normaliseMechanism(value: string | undefined): string {
  if (!value) return "other";
  if (value === "fiat-backed" || value === "crypto-backed" || value === "algorithmic") return value;
  if (value === "synthetic") return value;
  return value;
}

function defiLlamaStablecoinUrl(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://defillama.com/stablecoin/${encodeURIComponent(slug)}`;
}

async function historicalPeakUsd(id: string): Promise<number | null> {
  const response = await fetch(`${DEFI_LLAMA_CHART_URL}${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`DefiLlama history request failed (${response.status})`);
  const points = (await response.json()) as DefiLlamaHistoryPoint[];
  const peak = points.reduce((max, point) => Math.max(max, sumAmounts(point.totalCirculatingUSD) || sumAmounts(point.totalCirculating)), 0);
  return peak > 0 ? peak : null;
}

async function buildSnapshot(): Promise<StablecoinMarketSnapshot> {
  const request = (url: string) => fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  const [response, historyResponse, chainsResponse] = await Promise.all([
    request(DEFI_LLAMA_STABLECOINS_URL),
    request(DEFI_LLAMA_TOTAL_HISTORY_URL),
    request(DEFI_LLAMA_CHAINS_URL),
  ]);
  if (!response.ok) throw new Error(`DefiLlama stablecoin request failed (${response.status})`);
  if (!historyResponse.ok) throw new Error(`DefiLlama history request failed (${historyResponse.status})`);
  if (!chainsResponse.ok) throw new Error(`DefiLlama chains request failed (${chainsResponse.status})`);

  const payload = (await response.json()) as { peggedAssets?: DefiLlamaAsset[] };
  const rawHistory = (await historyResponse.json()) as DefiLlamaHistoryPoint[];
  const rawChains = (await chainsResponse.json()) as DefiLlamaChain[];
  const assets = payload.peggedAssets ?? [];
  const history = normaliseHistory(rawHistory, 370);
  const totalUsd = history.at(-1)?.totalUsd
    ?? assets.reduce((sum, asset) => sum + sumAmounts(asset.circulating) * (Number(asset.price) || 1), 0);
  const rankedChains = rawChains
    .map((chain) => ({ name: chain.name ?? "Unknown", totalUsd: sumAmounts(chain.totalCirculatingUSD) }))
    .filter((chain) => chain.totalUsd > 0)
    .sort((a, b) => b.totalUsd - a.totalUsd)
    .slice(0, 15);

  const chainHistories = new Map<string, Array<{ date: string; totalUsd: number }>>();
  await Promise.all(rankedChains.slice(0, 8).map(async (chain) => {
    try {
      const chainResponse = await request(`${DEFI_LLAMA_CHAIN_HISTORY_URL}/${encodeURIComponent(chain.name)}`);
      if (!chainResponse.ok) throw new Error(`DefiLlama ${chain.name} history request failed (${chainResponse.status})`);
      chainHistories.set(chain.name, normaliseHistory((await chainResponse.json()) as DefiLlamaHistoryPoint[], 190));
    } catch (error) {
      logger.warn({ error, chain: chain.name }, "Unable to refresh stablecoin chain history");
      chainHistories.set(chain.name, []);
    }
  }));

  const chains = rankedChains.map((chain) => {
    const chainHistory = chainHistories.get(chain.name) ?? [];
    const assetTotals = new Map<string, number>();
    for (const asset of assets) {
      const current = sumAmounts(asset.chainCirculating?.[chain.name]?.current);
      if (current <= 0) continue;
      const value = current * (Number(asset.price) || 1);
      assetTotals.set(asset.symbol, (assetTotals.get(asset.symbol) ?? 0) + value);
    }
    const leadingAssets = [...assetTotals.entries()]
      .map(([symbol, assetTotalUsd]) => ({ symbol, totalUsd: assetTotalUsd }))
      .sort((a, b) => b.totalUsd - a.totalUsd)
      .slice(0, 4);
    const leadingTotal = leadingAssets.reduce((sum, asset) => sum + asset.totalUsd, 0);
    const otherTotal = Math.max(0, chain.totalUsd - leadingTotal);
    const dominantAssets = [
      ...leadingAssets,
      ...(otherTotal / chain.totalUsd >= 0.005 ? [{ symbol: "Other", totalUsd: otherTotal }] : []),
    ].map((asset) => ({ ...asset, sharePct: chain.totalUsd > 0 ? (asset.totalUsd / chain.totalUsd) * 100 : 0 }));
    return {
      ...chain,
      sharePct: totalUsd > 0 ? (chain.totalUsd / totalUsd) * 100 : 0,
      change30dPct: chainHistory.length ? percentChange(chain.totalUsd, nearestHistoryValue(chainHistory, 30)) : null,
      history: chainHistory,
      dominantAssets,
    };
  });
  const historicalPeaks = new Map<string, number | null>();
  await Promise.all(
    Object.keys(HISTORICAL_PROJECTS).map(async (id) => {
      try {
        historicalPeaks.set(id, await historicalPeakUsd(id));
      } catch (error) {
        logger.warn({ error, id }, "Unable to refresh a historical stablecoin peak");
        historicalPeaks.set(id, null);
      }
    }),
  );

  const rankedProjects = assets
    .map<StablecoinMarketItem | null>((asset) => {
      const historical = HISTORICAL_PROJECTS[asset.id];
      const price = Number.isFinite(asset.price) && Number(asset.price) > 0 ? Number(asset.price) : 1;
      const currentMarketCapUsd = sumAmounts(asset.circulating) * price;
      // DefiLlama exposes an explicit inactive date. Do not allow a large
      // nominal token supply to make an inactive project look operational;
      // only curated historical cases remain in the learning catalogue.
      if (asset.deadFrom && !historical) return null;
      if (!historical && currentMarketCapUsd < ACTIVE_MINIMUM_USD) return null;
      return {
        id: asset.id,
        name: historical?.displayName ?? asset.name,
        symbol: asset.symbol,
        pegType: asset.pegType ?? "other",
        mechanism: MECHANISM_OVERRIDES[asset.id] ?? normaliseMechanism(asset.pegMechanism),
        currentMarketCapUsd,
        priceUsd: Number.isFinite(asset.price) && Number(asset.price) > 0 ? Number(asset.price) : null,
        priceDeviationBps: asset.pegType === "peggedUSD" && Number.isFinite(asset.price) ? (Number(asset.price) - 1) * 10_000 : null,
        change1dPct: percentChange(currentMarketCapUsd, sumAmounts(asset.circulatingPrevDay) * price),
        change7dPct: percentChange(currentMarketCapUsd, sumAmounts(asset.circulatingPrevWeek) * price),
        change30dPct: percentChange(currentMarketCapUsd, sumAmounts(asset.circulatingPrevMonth) * price),
        chains: Object.entries(asset.chainCirculating ?? {})
          .filter(([, values]) => sumAmounts(values.current) > 0)
          .sort(([, a], [, b]) => sumAmounts(b.current) - sumAmounts(a.current))
          .slice(0, 6)
          .map(([name]) => name),
        historicalPeakUsd: historical ? historicalPeaks.get(asset.id) ?? null : null,
        status: historical ? "historical" : "active",
        statusReason: historical?.statusReason ?? null,
        statusDate: historical?.statusDate ?? null,
        officialUrl: OFFICIAL_PROJECT_URLS[asset.id] ?? null,
        sourceUrl: defiLlamaStablecoinUrl(asset.name),
      };
    })
    .filter((project): project is StablecoinMarketItem => project !== null)
    .sort((a, b) => {
      const aValue = a.status === "historical" ? a.historicalPeakUsd ?? 0 : a.currentMarketCapUsd;
      const bValue = b.status === "historical" ? b.historicalPeakUsd ?? 0 : b.currentMarketCapUsd;
      return bValue - aValue;
    });
  const projects = [
    ...rankedProjects.filter((project) => project.status === "active").slice(0, MAX_ACTIVE_PROJECTS),
    ...rankedProjects.filter((project) => project.status === "historical"),
  ].sort((a, b) => {
    const aValue = a.status === "historical" ? a.historicalPeakUsd ?? 0 : a.currentMarketCapUsd;
    const bValue = b.status === "historical" ? b.historicalPeakUsd ?? 0 : b.currentMarketCapUsd;
    return bValue - aValue;
  });

  return {
    source: "DefiLlama",
    sourceUrl: "https://defillama.com/stablecoins",
    refreshedAt: new Date().toISOString(),
    summary: {
      totalUsd,
      bellwetherDominancePct: totalUsd > 0
        ? ((projects.find((project) => project.symbol.toUpperCase() === "USDT")?.currentMarketCapUsd ?? 0) / totalUsd) * 100
        : 0,
      change1dPct: percentChange(totalUsd, nearestHistoryValue(history, 1)),
      change7dPct: percentChange(totalUsd, nearestHistoryValue(history, 7)),
      change30dPct: percentChange(totalUsd, nearestHistoryValue(history, 30)),
    },
    history,
    chains,
    projects,
  };
}

export async function getStablecoinMarketSnapshot(force = false): Promise<StablecoinMarketSnapshot> {
  const isFresh = cachedSnapshot && Date.now() - Date.parse(cachedSnapshot.refreshedAt) < REFRESH_INTERVAL_MS;
  if (!force && cachedSnapshot && isFresh) return cachedSnapshot;
  if (!force && refreshing) return refreshing;

  refreshing = buildSnapshot()
    .then((snapshot) => {
      cachedSnapshot = snapshot;
      return snapshot;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export function startStablecoinMarketScheduler(): void {
  void getStablecoinMarketSnapshot().catch((error) => logger.warn({ error }, "Initial stablecoin market refresh failed"));
  const timer = setInterval(() => {
    void getStablecoinMarketSnapshot().catch((error) => logger.warn({ error }, "Daily stablecoin market refresh failed"));
  }, REFRESH_INTERVAL_MS);
  timer.unref();
}
