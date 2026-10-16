import { useCallback, useEffect, useState } from "react";
import { markLastSuccessful } from "@/data/market-data-model";
const prior = new Map<string, unknown>();
export function hasObservation(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasObservation);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.metric_id === "string")
      return (
        typeof obj.value === "number" &&
        Number.isFinite(obj.value) &&
        typeof obj.observation_time === "string" &&
        Number.isFinite(Date.parse(obj.observation_time))
      );
    return Object.values(obj).some(hasObservation);
  }
  return false;
}
export async function fetchDataset(
  endpoint: string,
  fetcher: typeof fetch = fetch,
): Promise<any> {
  const base = (
    import.meta.env.VITE_API_BASE_URL || import.meta.env.BASE_URL
  ).replace(/\/$/, "");
  try {
    const r = await fetcher(`${base}/api/${endpoint}`, {
      signal: AbortSignal.timeout(90_000),
    });
    if (!r.ok) throw new Error("Data retrieval unavailable");
    const payload = await r.json();
    if (!payload || payload.version !== "0.2")
      throw new Error("Unsupported data response");
    const arrays: Record<string, string> = {
      "stablecoin-market": "history",
      "stablecoin-macro": "series",
      "stablecoin-liquidity": "venues",
      "stablecoin-depegs": "tokens",
    };
    const key = arrays[endpoint];
    if (key && (!Array.isArray(payload[key]) || payload[key].length === 0))
      throw new Error("Empty data response");
    if (!hasObservation(payload))
      throw new Error("No valid source observations");
    prior.set(endpoint, payload);
    return payload;
  } catch (error) {
    if (prior.has(endpoint)) return markLastSuccessful(prior.get(endpoint));
    throw error;
  }
}
export function useDataset(endpoint: string | null) {
  const [data, setData] = useState<any>(null),
    [loading, setLoading] = useState(Boolean(endpoint)),
    [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    try {
      setData(await fetchDataset(endpoint));
      setFailed(false);
    } catch {
      setData(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);
  return { data, loading, failed, retry: load };
}
