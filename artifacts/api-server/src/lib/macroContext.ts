import { createSnapshotCache, metric, numeric } from "./dataGovernance";
const DAY = 86_400_000;
const SERIES = [
  ["SOFR", "Secured overnight financing rate", "%", "SRC-MD-12"],
  ["EFFR", "Effective federal funds rate", "%", "SRC-MD-13"],
  ["DGS3MO", "3-month Treasury yield", "%", "SRC-MD-14"],
  ["DGS2", "2-year Treasury yield", "%", "SRC-MD-14"],
  ["DGS10", "10-year Treasury yield", "%", "SRC-MD-14"],
  ["DTWEXBGS", "Broad USD index", "index · Jan 2006=100", "SRC-MD-15"],
  ["VIXCLS", "VIX", "index", "SRC-MD-17"],
  ["RRPONTSYD", "Overnight reverse repo amount", "USD bn", "SRC-MD-16"],
  ["DEXCHUS", "CNY per USD", "CNY / USD", "SRC-MD-18"],
  ["DEXHKUS", "HKD per USD", "HKD / USD", "SRC-MD-18"],
  ["DEXSIUS", "SGD per USD", "SGD / USD", "SRC-MD-18"],
] as const;
export function parseFredCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  if (!/^(observation_date|DATE),/i.test(lines[0] ?? ""))
    throw new Error("Invalid FRED CSV header");
  return lines
    .slice(1)
    .flatMap((line) => {
      const [date, raw] = line.split(",");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date))
      )
        return [];
      return [{ date, value: numeric(raw) }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
const readers = SERIES.map(([id, label, unit, source_id]) => {
  const source_url = `https://fred.stlouisfed.org/series/${id}`;
  const meta = {
    metric_id: id,
    label,
    unit,
    source_id,
    source: "FRED",
    source_url,
    methodology_note:
      "Official daily observations; missing observations remain gaps. Freshness tolerance is five calendar days to accommodate non-publication days.",
    coverage_note:
      "Macro environment only; not issuer realised portfolio return, stablecoin demand causality or risk probability.",
  };
  const load = createSnapshotCache(async () => {
    const r = await fetch(
      `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`,
      { headers: { Accept: "text/csv" }, signal: AbortSignal.timeout(20_000) },
    );
    if (!r.ok) throw new Error(`FRED ${id}: ${r.status}`);
    const all = parseFredCsv(await r.text());
    const latest = all
      .filter((p) => p.value !== null && Date.parse(p.date) <= Date.now())
      .at(-1);
    if (!latest) throw new Error(`FRED ${id}: no valid observation`);
    return {
      id,
      metric: metric(
        {
          ...meta,
          value: latest.value,
          observation_time: latest.date,
          last_successful_fetch: new Date().toISOString(),
        },
        5 * DAY,
      ),
      observations: all.filter(
        (p) => Date.parse(p.date) >= Date.now() - 370 * DAY,
      ),
    };
  }, DAY);
  return async (force = false) => {
    try {
      return await load(force);
    } catch {
      return { id, metric: metric({ ...meta, value: null }), observations: [] };
    }
  };
});
export async function getMacroContext(force = false) {
  return {
    version: "0.2",
    series: await Promise.all(readers.map((read) => read(force))),
  };
}
