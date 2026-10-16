import { logger } from "./logger";
import {
  readPersistentSnapshot,
  writePersistentSnapshot,
} from "./persistentSnapshot";
import { metric, numeric, strictSum, lastSuccessful } from "./dataGovernance";

const REFRESH_INTERVAL_MS = 10 * 60_000;
const STALE_AFTER_MS = 30 * 60_000;
const SNAPSHOT_KEY = "stablecoin-liquidity-v02";
let refreshFailed = false;
const BINANCE_BASE_URLS = [
  "https://data-api.binance.vision",
  "https://api.binance.com",
] as const;
const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";
const ETHEREUM_USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const ETHEREUM_USDT = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const STABLE_SYMBOLS = new Set([
  "USDT",
  "USDC",
  "DAI",
  "USDS",
  "FDUSD",
  "TUSD",
  "PYUSD",
  "FRAX",
  "LUSD",
  "USDE",
]);
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
  priceUsd?: string;
}

export interface StablecoinLiquidityVenue {
  venue: string;
  market: string;
  kind: "CEX" | "DEX";
  volume24hUsd: number | null;
  observationTime: string;
  quoteUnit: string;
  chain: string | null;
  pool: string | null;
  priceUsd: number | null;
  bestBid: number | null;
  bestAsk: number | null;
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
  const n = numeric(value);
  return n !== null && n >= 0 ? n : null;
}

function notionalWithin(
  levels: OrderLevel[],
  predicate: (price: number) => boolean,
): number {
  return levels.reduce((sum, [rawPrice, rawQuantity]) => {
    const price = Number(rawPrice);
    const quantity = Number(rawQuantity);
    return Number.isFinite(price) &&
      Number.isFinite(quantity) &&
      predicate(price)
      ? sum + price * quantity
      : sum;
  }, 0);
}

function slippageBps(
  levels: OrderLevel[],
  targetUsd: number,
  mid: number,
  side: "buy" | "sell",
): number | null {
  let remaining = targetUsd;
  let acquired = 0;
  for (const [rawPrice, rawQuantity] of levels) {
    const price = Number(rawPrice);
    const quantity = Number(rawQuantity);
    if (
      !Number.isFinite(price) ||
      !Number.isFinite(quantity) ||
      price <= 0 ||
      quantity <= 0
    )
      continue;
    const levelNotional = price * quantity;
    const used = Math.min(remaining, levelNotional);
    acquired += used / price;
    remaining -= used;
    if (remaining <= 0.01) break;
  }
  if (remaining > 0.01 || acquired <= 0) return null;
  const vwap = targetUsd / acquired;
  return side === "buy"
    ? ((vwap - mid) / mid) * 10_000
    : ((mid - vwap) / mid) * 10_000;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(
      `${new URL(url).hostname} request failed (${response.status})`,
    );
  return response.json() as Promise<T>;
}

async function loadCexPair(
  symbol: string,
): Promise<StablecoinLiquidityVenue | null> {
  for (const baseUrl of BINANCE_BASE_URLS)
    try {
      const [depth, ticker] = await Promise.all([
        fetchJson<BinanceDepth>(
          `${baseUrl}/api/v3/depth?symbol=${symbol}&limit=5000`,
        ),
        fetchJson<BinanceTicker>(
          `${baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`,
        ),
      ]);
      const bids = depth.bids ?? [];
      const asks = depth.asks ?? [];
      const bestBid = Number(bids[0]?.[0]);
      const bestAsk = Number(asks[0]?.[0]);
      if (
        !Number.isFinite(bestBid) ||
        !Number.isFinite(bestAsk) ||
        bestBid <= 0 ||
        bestAsk <= 0
      )
        return null;
      if (
        bestAsk < bestBid ||
        [...bids, ...asks].some(
          ([p, q]) => finite(p) === null || finite(q) === null,
        )
      )
        return null;
      const mid = (bestBid + bestAsk) / 2;
      return {
        venue: "Binance",
        market: symbol.replace(/USDT$/, "/USDT"),
        kind: "CEX",
        volume24hUsd: finite(ticker.quoteVolume),
        observationTime: new Date().toISOString(),
        quoteUnit: "USDT",
        chain: null,
        pool: null,
        priceUsd: null,
        bestBid,
        bestAsk,
        spreadBps: ((bestAsk - bestBid) / mid) * 10_000,
        depth2PctBidUsd: notionalWithin(bids, (price) => price >= mid * 0.98),
        depth2PctAskUsd: notionalWithin(asks, (price) => price <= mid * 1.02),
        buySlippageBps100k: slippageBps(
          asks,
          SLIPPAGE_NOTIONALS[0],
          mid,
          "buy",
        ),
        sellSlippageBps100k: slippageBps(
          bids,
          SLIPPAGE_NOTIONALS[0],
          mid,
          "sell",
        ),
        buySlippageBps1m: slippageBps(asks, SLIPPAGE_NOTIONALS[1], mid, "buy"),
        sellSlippageBps1m: slippageBps(
          bids,
          SLIPPAGE_NOTIONALS[1],
          mid,
          "sell",
        ),
        liquidityUsd: null,
        sourceUrl: `https://www.binance.com/en/trade/${symbol.replace(/USDT$/, "_USDT")}`,
      };
    } catch (error) {
      logger.warn(
        { error, symbol, baseUrl },
        "Unable to load a Binance stablecoin pair",
      );
    }
  return null;
}

async function loadDexPairs(): Promise<{
  rows: StablecoinLiquidityVenue[];
  available: boolean;
}> {
  try {
    const payloads = await Promise.all(
      [ETHEREUM_USDC, ETHEREUM_USDT].map((address) =>
        fetchJson<DexPair[]>(
          `${DEXSCREENER_BASE_URL}/token-pairs/v1/ethereum/${address}`,
        ),
      ),
    );
    const unique = new Map<string, DexPair>();
    payloads.flat().forEach((pair) => {
      const base = pair.baseToken?.symbol?.toUpperCase() ?? "";
      const quote = pair.quoteToken?.symbol?.toUpperCase() ?? "";
      if (
        !STABLE_SYMBOLS.has(base) ||
        !STABLE_SYMBOLS.has(quote) ||
        !pair.pairAddress
      )
        return;
      unique.set(pair.pairAddress, pair);
    });
    const rows = Array.from(unique.values())
      .map(
        (pair): StablecoinLiquidityVenue => ({
          venue: pair.dexId ?? "DEX",
          market: `${pair.baseToken?.symbol ?? "?"}/${pair.quoteToken?.symbol ?? "?"}`,
          kind: "DEX",
          volume24hUsd: finite(pair.volume?.h24),
          observationTime: new Date().toISOString(),
          quoteUnit: "USD",
          chain: pair.chainId ?? "ethereum",
          pool: pair.pairAddress ?? null,
          priceUsd: finite(pair.priceUsd),
          bestBid: null,
          bestAsk: null,
          spreadBps: null,
          depth2PctBidUsd: null,
          depth2PctAskUsd: null,
          buySlippageBps100k: null,
          sellSlippageBps100k: null,
          buySlippageBps1m: null,
          sellSlippageBps1m: null,
          liquidityUsd: finite(pair.liquidity?.usd),
          sourceUrl: pair.url ?? "https://dexscreener.com/ethereum",
        }),
      )
      .sort((a, b) => (b.volume24hUsd ?? -1) - (a.volume24hUsd ?? -1))
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
  const cexRows = cexResults.filter(
    (row): row is StablecoinLiquidityVenue => row !== null,
  );
  const venues = [...cexRows, ...dexResult.rows];
  if (!venues.length)
    throw new Error("All stablecoin liquidity sources are unavailable");
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
      cexVolume24hUsd: null, // USDT quote volumes are not silently treated as USD
      dexVolume24hUsd: strictSum(dexResult.rows.map((row) => row.volume24hUsd)),
      dexLiquidityUsd: strictSum(dexResult.rows.map((row) => row.liquidityUsd)),
    },
    venues,
  };
}

export async function refreshStablecoinLiquidity(): Promise<StablecoinLiquiditySnapshot> {
  if (refreshing) return refreshing;
  refreshing = buildSnapshot()
    .then(async (snapshot) => {
      await writePersistentSnapshot(
        SNAPSHOT_KEY,
        "Binance + DexScreener",
        snapshot,
        snapshot.refreshedAt,
      );
      refreshFailed = false;
      return snapshot;
    })
    .catch((error) => {
      refreshFailed = true;
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function getStablecoinLiquidity() {
  let snapshot = await readPersistentSnapshot<StablecoinLiquiditySnapshot>(
    SNAPSHOT_KEY,
    STALE_AFTER_MS,
  );
  if (!snapshot) {
    await refreshStablecoinLiquidity();
    snapshot = await readPersistentSnapshot<StablecoinLiquiditySnapshot>(
      SNAPSHOT_KEY,
      STALE_AFTER_MS,
    );
  }
  if (!snapshot) throw new Error("No successful liquidity snapshot");
  const rows = snapshot.venues.map((row) => {
    const cex = row.kind === "CEX";
    const common = {
      source_id: cex ? "SRC-MD-02" : "SRC-MD-03",
      source: cex ? "Binance" : "DEX Screener",
      source_url: row.sourceUrl,
      observation_time: row.observationTime,
      last_successful_fetch: snapshot.refreshedAt,
      methodology_note: cex
        ? "Order book sampled at the stated collection time; venue event time is unavailable. Depth within 2% of midpoint, limited to the returned 5,000 levels per side. Slippage is an explicit quote-notional simulation; insufficient book returns unavailable. USDT is not assumed to equal USD."
        : "Provider pool snapshot sampled at the stated collection time; provider observation time is unavailable. USD liquidity and 24-hour trading volume are pool-specific, not order-book depth or executable slippage.",
      coverage_note: cex
        ? "Selected Binance pair only; USDT quote amounts. Collection freshness does not establish venue event freshness."
        : "Selected Ethereum pools returned for USDC/USDT; not all DEX liquidity. Collection freshness does not establish venue event freshness.",
    };
    const m = (id: string, label: string, value: number | null, unit: string) =>
      metric({ ...common, metric_id: id, label, value, unit }, STALE_AFTER_MS);
    return {
      venue: row.venue,
      market: row.market,
      kind: row.kind,
      chain: row.chain,
      pool: row.pool,
      metrics: cex
        ? [
            m("CEX_BID", "Best bid", row.bestBid, "USDT / base token"),
            m("CEX_ASK", "Best ask", row.bestAsk, "USDT / base token"),
            m("MKT_CEX_SPREAD_BPS", "Quoted spread", row.spreadBps, "bps"),
            m(
              "MKT_CEX_BID_DEPTH_2PCT",
              "Bid depth within 2%",
              row.depth2PctBidUsd,
              "USDT",
            ),
            m(
              "MKT_CEX_ASK_DEPTH_2PCT",
              "Ask depth within 2%",
              row.depth2PctAskUsd,
              "USDT",
            ),
            m(
              "MKT_CEX_BUY_100K",
              "Simulated buy · 100,000 USDT",
              row.buySlippageBps100k,
              "bps",
            ),
            m(
              "MKT_CEX_SELL_100K",
              "Simulated sell · 100,000 USDT",
              row.sellSlippageBps100k,
              "bps",
            ),
            m(
              "MKT_CEX_BUY_1M",
              "Simulated buy · 1,000,000 USDT",
              row.buySlippageBps1m,
              "bps",
            ),
            m(
              "MKT_CEX_SELL_1M",
              "Simulated sell · 1,000,000 USDT",
              row.sellSlippageBps1m,
              "bps",
            ),
          ]
        : [
            m("MKT_DEX_POOL_LIQ", "Pool liquidity", row.liquidityUsd, "USD"),
            m(
              "MKT_DEX_VOL_24H",
              "Pool 24h trading volume",
              row.volume24hUsd,
              "USD",
            ),
            m("DEX_PRICE", "Pool price", row.priceUsd, "USD / base token"),
          ],
    };
  });
  const result = { version: "0.2", venues: rows };
  return refreshFailed ? lastSuccessful(result) : result;
}

export const stablecoinLiquidityRefreshIntervalMs = REFRESH_INTERVAL_MS;
