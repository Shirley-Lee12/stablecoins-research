import { logger } from "./logger";
import { readPersistentSnapshot, writePersistentSnapshot } from "./persistentSnapshot";

const REFRESH_INTERVAL_MS = 10 * 60_000;
const STALE_AFTER_MS = 30 * 60_000;
const SNAPSHOT_KEY = "stablecoin-liquidity";
const BINANCE_BASE_URLS = ["https://data-api.binance.vision", "https://api.binance.com"] as const;
const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";
const ETHEREUM_USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const ETHEREUM_USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const STABLE_SYMBOLS = new Set(["USDT", "USDC", "DAI", "USDS", "FDUSD", "TUSD", "PYUSD", "FRAX", "LUSD", "USDE"]);
const CEX_PAIRS = ["USDCUSDT", "FDUSDUSDT", "TUSDUSDT", "DAIUSDT"];
const SLIPPAGE_NOTIONALS = [100_000, 1_000_000] as const;

type OrderLevel = [string, string];

interface BinanceDepth {
  bids?: OrderLevel[];
  asks?: OrderLevel[];
}

interface BinanceTicker {
  symbol?: string;
  quoteVolume?: string;
  closeTime?: number;
}

interface DexPair {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { symbol?: string };
  quoteToken?: { symbol?: string };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
}

export interface StablecoinLiquidityVenue {
  venue: string;
  market: string;
  kind: "CEX" | "DEX";
  volume24hUsd: number;
  spreadBps: number | null;
  depth2PctBidUsd: number | null;
  depth2PctAskUsd: number | null;
  buySlippageBps100k: number | null;
  sellSlippageBps100k: number | null;
  buySlippageBps1m: number | null;
  sellSlippageBps1m: number | null;
  liquidityUsd: number | null;
  sourceUrl: string;
}

export interface StablecoinLiquiditySnapshot {
  refreshedAt: string;
  coverage: {
    cex: string;
    dex: string;
    slippageNotionalsUsd: number[];
    cexMarketsRequested: number;
    cexMarketsReturned: number;
    dexAvailable: boolean;
  };
  summary: {
    cexVolume24hUsd: number | null;
    dexVolume24hUsd: number | null;
    dexLiquidityUsd: number | null;
  };
  venues: StablecoinLiquidityVenue[];
}

let refreshing: Promise<StablecoinLiquiditySnapshot> | null = null;

function finite(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function notionalWithin(levels: OrderLevel[], predicate: (price: number) => boolean): number {
  return levels.reduce((sum, [rawPrice, rawQuantity]) => {
    const price = Number(rawPrice);
    const quantity = Number(rawQuantity);
    return Number.isFinite(price) && Number.isFinite(quantity) && predicate(price) ? sum + price * quantity : sum;
  }, 0);
}

function slippageBps(levels: OrderLevel[], targetUsd: number, mid: number, side: "buy" | "sell"): number | null {
  let remaining = targetUsd;
  let acquired = 0;
  for (const [rawPrice, rawQuantity] of levels) {
    const price = Number(rawPrice);
    const quantity = Number(rawQuantity);
    if (!Number.isFinite(price) || !Number.isFinite(quantity) || price <= 0 || quantity <= 0) continue;
    const levelNotional = price * quantity;
    const used = Math.min(remaining, levelNotional);
    acquired += used / price;
    remaining -= used;
    if (remaining <= 0.01) break;
  }
  if (remaining > 0.01 || acquired <= 0) return null;
  const vwap = targetUsd / acquired;
  return side === "buy" ? ((vwap - mid) / mid) * 10_000 : ((mid - vwap) / mid) * 10_000;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${new URL(url).hostname} request failed (${response.status})`);
  return response.json() as Promise<T>;
}

async function loadCexPair(symbol: string): Promise<StablecoinLiquidityVenue | null> {
  for (const baseUrl of BINANCE_BASE_URLS) try {
    const [depth, ticker] = await Promise.all([
      fetchJson<BinanceDepth>(`${baseUrl}/api/v3/depth?symbol=${symbol}&limit=5000`),
      fetchJson<BinanceTicker>(`${baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`),
    ]);
    const bids = depth.bids ?? [];
    const asks = depth.asks ?? [];
    const bestBid = Number(bids[0]?.[0]);
    const bestAsk = Number(asks[0]?.[0]);
    if (!Number.isFinite(bestBid) || !Number.isFinite(bestAsk) || bestBid <= 0 || bestAsk <= 0) return null;
    const mid = (bestBid + bestAsk) / 2;
    return {
      venue: "Binance",
      market: symbol.replace(/USDT$/, "/USDT"),
      kind: "CEX",
      volume24hUsd: finite(ticker.quoteVolume) ?? 0,
      spreadBps: ((bestAsk - bestBid) / mid) * 10_000,
      depth2PctBidUsd: notionalWithin(bids, (price) => price >= mid * 0.98),
      depth2PctAskUsd: notionalWithin(asks, (price) => price <= mid * 1.02),
      buySlippageBps100k: slippageBps(asks, SLIPPAGE_NOTIONALS[0], mid, "buy"),
      sellSlippageBps100k: slippageBps(bids, SLIPPAGE_NOTIONALS[0], mid, "sell"),
      buySlippageBps1m: slippageBps(asks, SLIPPAGE_NOTIONALS[1], mid, "buy"),
      sellSlippageBps1m: slippageBps(bids, SLIPPAGE_NOTIONALS[1], mid, "sell"),
      liquidityUsd: null,
      sourceUrl: `https://www.binance.com/en/trade/${symbol.replace(/USDT$/, "_USDT")}`,
    };
  } catch (error) {
    logger.warn({ error, symbol, baseUrl }, "Unable to load a Binance stablecoin pair");
  }
  return null;
}

async function loadDexPairs(): Promise<{ rows: StablecoinLiquidityVenue[]; available: boolean }> {
  try {
    const payloads = await Promise.all([ETHEREUM_USDC, ETHEREUM_USDT].map((address) =>
      fetchJson<DexPair[]>(`${DEXSCREENER_BASE_URL}/token-pairs/v1/ethereum/${address}`),
    ));
    const unique = new Map<string, DexPair>();
    payloads.flat().forEach((pair) => {
      const base = pair.baseToken?.symbol?.toUpperCase() ?? "";
      const quote = pair.quoteToken?.symbol?.toUpperCase() ?? "";
      if (!STABLE_SYMBOLS.has(base) || !STABLE_SYMBOLS.has(quote) || !pair.pairAddress) return;
      unique.set(pair.pairAddress, pair);
    });
    const rows = Array.from(unique.values())
      .map((pair): StablecoinLiquidityVenue => ({
        venue: pair.dexId ?? "DEX",
        market: `${pair.baseToken?.symbol ?? "?"}/${pair.quoteToken?.symbol ?? "?"}`,
        kind: "DEX",
        volume24hUsd: finite(pair.volume?.h24) ?? 0,
        spreadBps: null,
        depth2PctBidUsd: null,
        depth2PctAskUsd: null,
        buySlippageBps100k: null,
        sellSlippageBps100k: null,
        buySlippageBps1m: null,
        sellSlippageBps1m: null,
        liquidityUsd: finite(pair.liquidity?.usd),
        sourceUrl: pair.url ?? "https://dexscreener.com/ethereum",
      }))
      .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
      .slice(0, 12);
    return { rows, available: true };
  } catch (error) {
    logger.warn({ error }, "Unable to load Ethereum stablecoin DEX pairs");
    return { rows: [], available: false };
  }
}

async function buildSnapshot(): Promise<StablecoinLiquiditySnapshot> {
  const [cexResults, dexResult] = await Promise.all([
    Promise.all(CEX_PAIRS.map(loadCexPair)),
    loadDexPairs(),
  ]);
  const cexRows = cexResults.filter((row): row is StablecoinLiquidityVenue => row !== null);
  const venues = [...cexRows, ...dexResult.rows];
  if (!venues.length) throw new Error("All stablecoin liquidity sources are unavailable");
  return {
    refreshedAt: new Date().toISOString(),
    coverage: {
      cex: "Selected Binance spot stablecoin pairs",
      dex: "Ethereum stablecoin pools returned for USDC and USDT",
      slippageNotionalsUsd: [...SLIPPAGE_NOTIONALS],
      cexMarketsRequested: CEX_PAIRS.length,
      cexMarketsReturned: cexRows.length,
      dexAvailable: dexResult.available,
    },
    summary: {
      cexVolume24hUsd: cexRows.length ? cexRows.reduce((sum, row) => sum + row.volume24hUsd, 0) : null,
      dexVolume24hUsd: dexResult.available ? dexResult.rows.reduce((sum, row) => sum + row.volume24hUsd, 0) : null,
      dexLiquidityUsd: dexResult.available ? dexResult.rows.reduce((sum, row) => sum + (row.liquidityUsd ?? 0), 0) : null,
    },
    venues,
  };
}

export async function refreshStablecoinLiquidity(): Promise<StablecoinLiquiditySnapshot> {
  if (refreshing) return refreshing;
  refreshing = buildSnapshot().then(async (snapshot) => {
    await writePersistentSnapshot(SNAPSHOT_KEY, "Binance + DexScreener", snapshot, snapshot.refreshedAt);
    return snapshot;
  }).finally(() => { refreshing = null; });
  return refreshing;
}

export async function getStablecoinLiquidity() {
  const snapshot = await readPersistentSnapshot<StablecoinLiquiditySnapshot>(SNAPSHOT_KEY, STALE_AFTER_MS);
  if (!snapshot) throw new Error("No successful stablecoin liquidity snapshot is available");
  return snapshot;
}

export const stablecoinLiquidityRefreshIntervalMs = REFRESH_INTERVAL_MS;
