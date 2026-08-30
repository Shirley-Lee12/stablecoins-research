import { logger } from "./logger";

const DEFI_LLAMA_STABLECOINS_URL = "https://stablecoins.llama.fi/stablecoins?includePrices=true";
const DEFI_LLAMA_CHART_URL = "https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=";
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
  price?: number | null;
  deadFrom?: string;
}

interface DefiLlamaHistoryPoint {
  totalCirculatingUSD?: PeggedAmounts;
  totalCirculating?: PeggedAmounts;
}

export interface StablecoinMarketItem {
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
}

export interface StablecoinMarketSnapshot {
  source: "DefiLlama";
  sourceUrl: string;
  refreshedAt: string;
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
  "146": "https://www.ethena.fi/",
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
  const response = await fetch(DEFI_LLAMA_STABLECOINS_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`DefiLlama stablecoin request failed (${response.status})`);

  const payload = (await response.json()) as { peggedAssets?: DefiLlamaAsset[] };
  const assets = payload.peggedAssets ?? [];
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
