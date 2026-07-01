function normalizeWords(s: string): Set<string> {
  return new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2));
}

/** Jaccard (overlap / union) rather than overlap / min(size) — the latter lets a short candidate title get "covered" by a handful of generic words from a long input title and pass even when it's a different work entirely. */
export function titleOverlapScore(a: string, b: string): number {
  const wa = normalizeWords(a);
  const wb = normalizeWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  const overlap = [...wa].filter((w) => wb.has(w)).length;
  const union = new Set([...wa, ...wb]).size;
  return overlap / union;
}

export function surnameOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

export function authorOverlapCount(a: string[], b: string[]): number {
  const surnamesB = new Set(b.map(surnameOf));
  return a.map(surnameOf).filter((s) => s && surnamesB.has(s)).length;
}
