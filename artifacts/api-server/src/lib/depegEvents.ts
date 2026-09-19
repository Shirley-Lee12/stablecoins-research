import { logger } from "./logger";
import { readPersistentSnapshot, writePersistentSnapshot } from "./persistentSnapshot";

const REFRESH_INTERVAL_MS = 30 * 60_000;
const STALE_AFTER_MS = 90 * 60_000;
const SNAPSHOT_KEY = "stablecoin-depegs";
const START_THRESHOLD_BPS = 50;
const RECOVERY_THRESHOLD_BPS = 20;
const RECOVERY_CONFIRMATIONS = 2;
const TOKENS = [
  { id: "tether", symbol: "USDT" },
  { id: "usd-coin", symbol: "USDC" },
  { id: "dai", symbol: "DAI" },
  { id: "first-digital-usd", symbol: "FDUSD" },
  { id: "paypal-usd", symbol: "PYUSD" },
] as const;

interface MarketChartPayload {
  prices?: Array<[number, number]>;
}

export interface DepegEvent {
  token: string;
  startedAt: string;
  worstAt: string;
  recoveredAt: string | null;
  direction: "above" | "below";
  peakDeviationBps: number;
  durationHours: number | null;
  recoveryHours: number | null;
}

export interface DepegSnapshot {
  refreshedAt: string;
  windowDays: number;
  methodology: {
    startThresholdBps: number;
    recoveryThresholdBps: number;
    recoveryConfirmations: number;
    interval: "hourly";
  };
  tokens: Array<{ symbol: string; latestPriceUsd: number; latestAt: string; events: DepegEvent[] }>;
  sourceUrl: string;
}

let refreshing: Promise<DepegSnapshot> | null = null;

function coinGeckoConfig() {
  const proKey = process.env.COINGECKO_PRO_API_KEY;
  const demoKey = process.env.COINGECKO_API_KEY;
  if (proKey) return { baseUrl: "https://pro-api.coingecko.com/api/v3", headers: { "x-cg-pro-api-key": proKey } };
  if (demoKey) return { baseUrl: "https://api.coingecko.com/api/v3", headers: { "x-cg-demo-api-key": demoKey } };
  return { baseUrl: "https://api.coingecko.com/api/v3", headers: {} };
}

export function detectDepegEvents(token: string, prices: Array<[number, number]>): DepegEvent[] {
  const events: DepegEvent[] = [];
  let active: { startIndex: number; worstIndex: number; recoveryCount: number } | null = null;
  for (let index = 0; index < prices.length; index += 1) {
    const point = prices[index];
    const deviation = Math.abs(point[1] - 1) * 10_000;
    if (!active && deviation >= START_THRESHOLD_BPS) active = { startIndex: index, worstIndex: index, recoveryCount: 0 };
    if (!active) continue;
    const worstDeviation = Math.abs(prices[active.worstIndex][1] - 1) * 10_000;
    if (deviation > worstDeviation) active.worstIndex = index;
    active.recoveryCount = deviation <= RECOVERY_THRESHOLD_BPS ? active.recoveryCount + 1 : 0;
    if (active.recoveryCount < RECOVERY_CONFIRMATIONS) continue;
    const recoveredIndex = index;
    const start = prices[active.startIndex];
    const worst = prices[active.worstIndex];
    const recovered = prices[recoveredIndex];
    events.push({
      token,
      startedAt: new Date(start[0]).toISOString(),
      worstAt: new Date(worst[0]).toISOString(),
      recoveredAt: new Date(recovered[0]).toISOString(),
      direction: worst[1] >= 1 ? "above" : "below",
      peakDeviationBps: Math.abs(worst[1] - 1) * 10_000,
      durationHours: (recovered[0] - start[0]) / 3_600_000,
      recoveryHours: (recovered[0] - worst[0]) / 3_600_000,
    });
    active = null;
  }
  if (active) {
    const start = prices[active.startIndex];
    const worst = prices[active.worstIndex];
    events.push({
      token,
      startedAt: new Date(start[0]).toISOString(),
      worstAt: new Date(worst[0]).toISOString(),
      recoveredAt: null,
      direction: worst[1] >= 1 ? "above" : "below",
      peakDeviationBps: Math.abs(worst[1] - 1) * 10_000,
      durationHours: null,
      recoveryHours: null,
    });
  }
  return events;
}

async function loadToken(id: string, symbol: string) {
  const config = coinGeckoConfig();
  const response = await fetch(`${config.baseUrl}/coins/${id}/market_chart?vs_currency=usd&days=90&interval=hourly&precision=full`, {
    headers: { Accept: "application/json", ...config.headers },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`CoinGecko ${symbol} history failed (${response.status})`);
  const payload = await response.json() as MarketChartPayload;
  const prices = (payload.prices ?? []).filter((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]) && point[1] > 0);
  const latest = prices.at(-1);
  if (!latest) throw new Error(`CoinGecko ${symbol} history is empty`);
  return {
    symbol,
    latestPriceUsd: latest[1],
    latestAt: new Date(latest[0]).toISOString(),
    events: detectDepegEvents(symbol, prices),
  };
}

async function buildSnapshot(): Promise<DepegSnapshot> {
  const settled = await Promise.allSettled(TOKENS.map((token) => loadToken(token.id, token.symbol)));
  settled.forEach((result, index) => {
    if (result.status === "rejected") logger.warn({ error: result.reason, token: TOKENS[index].symbol }, "Unable to load depeg history");
  });
  const tokens = settled.flatMap((result) => result.status === "fulfilled" ? [result.value] : []);
  if (!tokens.length) throw new Error("All depeg history sources are unavailable");
  return {
    refreshedAt: new Date().toISOString(),
    windowDays: 90,
    methodology: {
      startThresholdBps: START_THRESHOLD_BPS,
      recoveryThresholdBps: RECOVERY_THRESHOLD_BPS,
      recoveryConfirmations: RECOVERY_CONFIRMATIONS,
      interval: "hourly",
    },
    tokens,
    sourceUrl: "https://www.coingecko.com/",
  };
}

export async function refreshDepegSnapshot(): Promise<DepegSnapshot> {
  if (refreshing) return refreshing;
  refreshing = buildSnapshot().then(async (snapshot) => {
    await writePersistentSnapshot(SNAPSHOT_KEY, "CoinGecko", snapshot, snapshot.refreshedAt);
    return snapshot;
  }).finally(() => { refreshing = null; });
  return refreshing;
}

export async function getDepegSnapshot() {
  const snapshot = await readPersistentSnapshot<DepegSnapshot>(SNAPSHOT_KEY, STALE_AFTER_MS);
  if (!snapshot) throw new Error("No successful stablecoin depeg snapshot is available");
  return snapshot;
}

export const depegRefreshIntervalMs = REFRESH_INTERVAL_MS;
