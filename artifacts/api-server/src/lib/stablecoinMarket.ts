import { logger } from "./logger";
import {
  createSnapshotCache,
  metric,
  numeric,
  strictSum,
} from "./dataGovernance";

const ROOT = "https://stablecoins.llama.fi";
const DAY = 86_400_000;
async function request(path: string): Promise<any> {
  const r = await fetch(ROOT + path, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error(`DefiLlama response ${r.status}`);
  return r.json();
}
// Only provider USD-valued fields are used. Token amounts are not a USD fallback.
export function parseSupplyHistory(input: unknown) {
  if (!Array.isArray(input)) throw new Error("Invalid DefiLlama history");
  const rows = input.flatMap((row) => {
    const seconds = numeric(row?.date);
    const total =
      row?.totalCirculatingUSD && typeof row.totalCirculatingUSD === "object"
        ? strictSum(Object.values(row.totalCirculatingUSD))
        : null;
    if (seconds === null || seconds * 1000 > Date.now() + 300_000) return [];
    const date = new Date(seconds * 1000).toISOString();
    return [{ date, value: total !== null && total >= 0 ? total : null }];
  });
  return [...new Map(rows.map((r) => [r.date, r])).values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}
const meta = {
  source_id: "SRC-MD-01",
  source: "DefiLlama",
  source_url: "https://api-docs.defillama.com/",
  unit: "USD",
  methodology_note:
    "Sum of provider totalCirculatingUSD fields; no token-unit or assumed-$1 substitute. History and change retain provider observation dates.",
  coverage_note:
    "DefiLlama tracked universe, not every stablecoin worldwide. Provider native/bridged classifications are retained; chain values are not summed again.",
};
export async function buildMarketSnapshot() {
  const [rawHistory, rawAssets, rawChains] = await Promise.all([
    request("/stablecoincharts/all"),
    request("/stablecoins?includePrices=true"),
    request("/stablecoinchains"),
  ]);
  const history = parseSupplyHistory(rawHistory).filter(
    (p) => Date.parse(p.date) >= Date.now() - 370 * DAY,
  );
  const latest = history
    .filter((p): p is { date: string; value: number } => p.value !== null)
    .at(-1);
  if (
    !latest ||
    !Array.isArray(rawAssets?.peggedAssets) ||
    !rawAssets.peggedAssets.length ||
    !Array.isArray(rawChains)
  )
    throw new Error("Incomplete DefiLlama response");
  const fetched = new Date().toISOString();
  const make = (
    id: string,
    label: string,
    value: number | null,
    observation = latest.date,
    unit = "USD",
  ) =>
    metric({
      ...meta,
      metric_id: id,
      label,
      value,
      unit,
      observation_time: observation,
      last_successful_fetch: fetched,
    });
  const target = Date.parse(latest.date) - 30 * DAY;
  const prior = history
    .filter(
      (p): p is { date: string; value: number } =>
        Date.parse(p.date) <= target && p.value !== null,
    )
    .at(-1);
  const comparable =
    prior && target - Date.parse(prior.date) <= 2 * DAY ? prior : null;
  // Rank candidates using a valid USD-target amount and observed price, then take their dated USD histories.
  const candidates: Array<{
    id: string;
    symbol: string;
    name: string;
    rank: number;
  }> = rawAssets.peggedAssets
    .flatMap((a: any) => {
      const amount = numeric(a?.circulating?.peggedUSD),
        price = numeric(a?.price);
      return a.pegType === "peggedUSD" &&
        !a.deadFrom &&
        amount !== null &&
        amount >= 0 &&
        price !== null &&
        price > 0
        ? [
            {
              id: String(a.id),
              symbol: String(a.symbol),
              name: String(a.name),
              rank: amount * price,
            },
          ]
        : [];
    })
    .sort((a: any, b: any) => b.rank - a.rank)
    .slice(0, 10);
  const ranked = (
    await Promise.all(
      candidates.map(async (a: any) => {
        try {
          const points = parseSupplyHistory(
            await request(
              `/stablecoincharts/all?stablecoin=${encodeURIComponent(a.id)}`,
            ),
          );
          const point = points.find(
            (p): p is { date: string; value: number } =>
              p.date === latest.date && p.value !== null,
          );
          return point
            ? {
                id: a.id,
                symbol: a.symbol,
                name: a.name,
                metric: make(`MKT_ASSET_${a.id}`, a.symbol, point.value),
              }
            : null;
        } catch (error) {
          logger.warn(
            { error, asset: a.id },
            "Asset supply history unavailable",
          );
          return null;
        }
      }),
    )
  )
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => (b.metric.value ?? -1) - (a.metric.value ?? -1));
  // Do not publish a top-two percentage if either leading candidate failed or dates differ.
  const top2 =
    candidates.length >= 2 &&
    candidates
      .slice(0, 2)
      .every((a: any) => ranked.some((r) => r.id === a.id)) &&
    latest.value > 0
      ? strictSum(
          candidates
            .slice(0, 2)
            .map((a: any) => ranked.find((r) => r.id === a.id)!.metric.value),
        )
      : null;
  const chains = (
    await Promise.all(
      rawChains
        .filter((c: any) => typeof c?.name === "string")
        .sort(
          (a: any, b: any) =>
            (strictSum(Object.values(b.totalCirculatingUSD ?? {})) ?? -1) -
            (strictSum(Object.values(a.totalCirculatingUSD ?? {})) ?? -1),
        )
        .slice(0, 10)
        .map(async (c: any) => {
          try {
            const points = parseSupplyHistory(
              await request(`/stablecoincharts/${encodeURIComponent(c.name)}`),
            );
            const point = points
              .filter(
                (p): p is { date: string; value: number } => p.value !== null,
              )
              .at(-1);
            return point
              ? {
                  name: c.name,
                  metric: make(
                    `CHAIN_${c.name}`,
                    c.name,
                    point.value,
                    point.date,
                  ),
                }
              : null;
          } catch (error) {
            logger.warn({ error, chain: c.name }, "Chain history unavailable");
            return null;
          }
        }),
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null);
  return {
    version: "0.2",
    fetched_at: fetched,
    total: make(
      "MKT_TOTAL_TRACKED_USD",
      "Tracked circulating value (USD)",
      latest.value,
    ),
    top2: {
      ...make(
        "MKT_TOP2_SHARE",
        "Top-2 supply concentration",
        top2 === null ? null : (top2 / latest.value) * 100,
        latest.date,
        "%",
      ),
      methodology_note:
        "Two largest USD-target candidates selected from the provider snapshot, using dated USD histories aligned to aggregate observation / total tracked circulating USD value × 100. This is supply concentration, not trading or liquidity concentration.",
    },
    change30d: {
      ...make(
        "MKT_30D_NET_CHANGE",
        "30-day net change in tracked circulating value",
        comparable ? latest.value - comparable.value : null,
      ),
      methodology_note: `Same provider USD-valued aggregate, current minus comparable prior snapshot. Prior date: ${comparable?.date ?? "unavailable"}; current date: ${latest.date}. At most two calendar days before the 30-day target are accepted; missing history is not zero.`,
    },
    history,
    ranked,
    chains,
    ranking_note:
      "USD-target candidates with valid current amounts and prices; dated USD histories aligned to the aggregate observation. Unavailable asset histories are omitted; this is not a trading-volume ranking.",
  };
}
export const getStablecoinMarketSnapshot = createSnapshotCache(
  buildMarketSnapshot,
  DAY,
);
export function startStablecoinMarketScheduler() {
  void getStablecoinMarketSnapshot().catch((error) =>
    logger.warn({ error }, "Initial market refresh unavailable"),
  );
  const timer = setInterval(
    () =>
      void getStablecoinMarketSnapshot(true).catch((error) =>
        logger.warn({ error }, "Market refresh unavailable"),
      ),
    DAY,
  );
  timer.unref();
}
