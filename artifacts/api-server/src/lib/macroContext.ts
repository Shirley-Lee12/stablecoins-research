const REFRESH_INTERVAL_MS = 24 * 60 * 60_000;

const SERIES = [
  { id: "EFFR", label: "Effective federal funds rate", unit: "%" },
  { id: "DGS3MO", label: "3-month Treasury yield", unit: "%" },
  { id: "DGS2", label: "2-year Treasury yield", unit: "%" },
  { id: "DGS10", label: "10-year Treasury yield", unit: "%" },
  { id: "SOFR", label: "Secured overnight financing rate", unit: "%" },
  { id: "DTWEXBGS", label: "Nominal broad U.S. dollar index", unit: "index" },
  { id: "RRPONTSYD", label: "Overnight reverse repo balance", unit: "USD bn" },
  { id: "VIXCLS", label: "VIX", unit: "index" },
  { id: "DEXCHUS", label: "Chinese yuan per U.S. dollar", unit: "local/USD" },
  { id: "DEXHKUS", label: "Hong Kong dollars per U.S. dollar", unit: "local/USD" },
  { id: "DEXSIUS", label: "Singapore dollars per U.S. dollar", unit: "local/USD" },
] as const;

export interface MacroSeries {
  id: string;
  label: string;
  unit: string;
  sourceUrl: string;
  latest: { date: string; value: number } | null;
  observations: Array<{ date: string; value: number }>;
}

export interface MacroContextSnapshot {
  source: "Federal Reserve Economic Data";
  refreshedAt: string;
  series: MacroSeries[];
}

let cached: MacroContextSnapshot | null = null;
let refreshing: Promise<MacroContextSnapshot> | null = null;

function parseFredCsv(csv: string): Array<{ date: string; value: number }> {
  return csv.trim().split(/\r?\n/).slice(1).flatMap((line) => {
    const [date, rawValue] = line.split(",");
    const cleanedValue = rawValue?.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !cleanedValue || cleanedValue === ".") return [];
    const value = Number(cleanedValue);
    return Number.isFinite(value) ? [{ date, value }] : [];
  });
}

async function buildSnapshot(): Promise<MacroContextSnapshot> {
  const cutoff = Date.now() - 370 * 86_400_000;
  const series = await Promise.all(SERIES.map(async (definition): Promise<MacroSeries> => {
    const sourceUrl = `https://fred.stlouisfed.org/series/${definition.id}`;
    const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${definition.id}`, {
      headers: { Accept: "text/csv" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`FRED ${definition.id} request failed (${response.status})`);
    const all = parseFredCsv(await response.text());
    const observations = all.filter((point) => Date.parse(point.date) >= cutoff);
    return { ...definition, sourceUrl, latest: all.at(-1) ?? null, observations };
  }));
  return { source: "Federal Reserve Economic Data", refreshedAt: new Date().toISOString(), series };
}

export async function getMacroContext(force = false): Promise<MacroContextSnapshot> {
  const isFresh = cached && Date.now() - Date.parse(cached.refreshedAt) < REFRESH_INTERVAL_MS;
  if (!force && cached && isFresh) return cached;
  if (!force && refreshing) return refreshing;
  refreshing = buildSnapshot().then((snapshot) => {
    cached = snapshot;
    return snapshot;
  }).finally(() => { refreshing = null; });
  return refreshing;
}
