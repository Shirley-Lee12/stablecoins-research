export type DataState =
  | "FRESH"
  | "DELAYED"
  | "LAST_SUCCESSFUL_SNAPSHOT"
  | "REPORT_SNAPSHOT"
  | "UNAVAILABLE"
  | "NOT_APPLICABLE"
  | "UNKNOWN_TO_VERIFY";
export type Metric = {
  metric_id: string;
  label: string;
  value: number | null;
  unit: string;
  source_id: string;
  source: string;
  source_url: string;
  source_scope: string;
  observation_time: string | null;
  report_period_end: string | null;
  publication_time: string | null;
  freshness_state: DataState;
  last_successful_fetch: string | null;
  methodology_note: string;
  coverage_note: string;
  is_estimate: boolean;
  is_adjusted: boolean;
  freshness_tolerance_ms?: number;
};
export function numeric(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
export function strictSum(values: unknown[]): number | null {
  if (!values.length) return null;
  const numbers = values.map(numeric);
  if (numbers.some((n) => n === null)) return null;
  return (numbers as number[]).reduce((sum, n) => sum + n, 0);
}
export function freshness(
  observed: string | null,
  toleranceMs: number,
  now = Date.now(),
): DataState {
  const date = timestamp(observed);
  if (!date || Date.parse(date) > now + 300_000) return "UNKNOWN_TO_VERIFY";
  return now - Date.parse(date) <= toleranceMs ? "FRESH" : "DELAYED";
}
export function metric(
  input: Partial<Metric> &
    Pick<
      Metric,
      | "metric_id"
      | "label"
      | "unit"
      | "source_id"
      | "source"
      | "source_url"
      | "methodology_note"
      | "coverage_note"
    >,
  toleranceMs = 48 * 3_600_000,
): Metric {
  const observed = timestamp(input.observation_time);
  const period = timestamp(input.report_period_end);
  const value = numeric(input.value);
  const state =
    input.freshness_state === "REPORT_SNAPSHOT"
      ? period
        ? "REPORT_SNAPSHOT"
        : "UNKNOWN_TO_VERIFY"
      : (input.freshness_state ??
        (value === null ? "UNAVAILABLE" : freshness(observed, toleranceMs)));
  const publishable =
    !["UNAVAILABLE", "UNKNOWN_TO_VERIFY", "NOT_APPLICABLE"].includes(state) &&
    Boolean(period || observed);
  return {
    source_scope: input.coverage_note,
    last_successful_fetch: null,
    is_estimate: false,
    is_adjusted: false,
    ...input,
    value: publishable ? value : null,
    observation_time: observed,
    report_period_end: period,
    publication_time: timestamp(input.publication_time),
    freshness_state: state,
    freshness_tolerance_ms: toleranceMs,
  };
}
export function ageSnapshot<T>(value: T): T {
  if (Array.isArray(value)) return value.map(ageSnapshot) as T;
  if (value && typeof value === "object") {
    const obj = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, ageSnapshot(v)]),
    );
    if (["FRESH", "DELAYED"].includes(obj.freshness_state as string))
      obj.freshness_state = freshness(
        obj.observation_time as string,
        typeof obj.freshness_tolerance_ms === "number"
          ? obj.freshness_tolerance_ms
          : 48 * 3_600_000,
      );
    return obj as T;
  }
  return value;
}
export function lastSuccessful<T>(value: T): T {
  if (Array.isArray(value)) return value.map(lastSuccessful) as T;
  if (value && typeof value === "object") {
    const result = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, lastSuccessful(v)]),
    );
    if (
      typeof result.freshness_state === "string" &&
      ["FRESH", "DELAYED"].includes(result.freshness_state)
    )
      result.freshness_state = "LAST_SUCCESSFUL_SNAPSHOT";
    return result as T;
  }
  return value;
}
// A failed refresh never overwrites a valid observation or its original timestamp.
export function createSnapshotCache<T>(build: () => Promise<T>, ttlMs: number) {
  let cached: T | null = null,
    fetchedAt = 0,
    pending: Promise<T> | null = null,
    refreshFailed = false;
  return async (force = false): Promise<T> => {
    if (!force && cached !== null && Date.now() - fetchedAt < ttlMs)
      return refreshFailed ? lastSuccessful(cached) : ageSnapshot(cached);
    if (pending) return pending;
    pending = build()
      .then((value) => {
        cached = value;
        fetchedAt = Date.now();
        refreshFailed = false;
        return value;
      })
      .catch((error) => {
        refreshFailed = true;
        if (cached !== null) return lastSuccessful(cached);
        throw error;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  };
}
