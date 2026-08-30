function normalizeWords(s: string): Set<string> {
  const normalized = s.normalize("NFKC").toLowerCase();
  const tokens = new Set<string>();

  // Chinese titles do not contain spaces, so word-only tokenization collapses an entire title into
  // one unusable token. Character bigrams preserve enough local structure to compare Chinese and
  // mixed Chinese/English titles while still rejecting merely topical matches.
  const cjk = [...normalized.matchAll(/[\u3400-\u9fff]+/gu)].map((match) => match[0]).join("");
  if (cjk.length === 1) tokens.add(cjk);
  for (let i = 0; i < cjk.length - 1; i += 1) tokens.add(cjk.slice(i, i + 2));

  const nonCjk = normalized.replace(/[\u3400-\u9fff]+/gu, " ");
  for (const word of nonCjk.match(/[\p{L}\p{N}]+/gu) ?? []) {
    if (word.length > 2 || /^\d+$/u.test(word)) tokens.add(word);
  }
  return tokens;
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

/**
 * Registry metadata sometimes stores a paper's main title while publisher pages retain the full
 * subtitle. This is deliberately stricter than a token overlap: at least a two-word title phrase
 * must occur intact, so generic one-word labels cannot identify an unrelated work.
 */
export function titleHasPhraseContainment(a: string, b: string): boolean {
  const normalize = (value: string) => value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const first = normalize(a);
  const second = normalize(b);
  if (!first || !second) return false;
  const shorter = first.length <= second.length ? first : second;
  const longer = first.length <= second.length ? second : first;
  return shorter.split(" ").filter(Boolean).length >= 2 && longer.includes(shorter);
}

export function surnameOf(fullName: string): string {
  const trimmed = fullName.trim();
  const comma = trimmed.indexOf(",");
  const surnamePart = comma > 0 ? trimmed.slice(0, comma) : trimmed;
  const parts = surnamePart.split(/\s+/);
  return (parts[parts.length - 1] ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLocaleLowerCase();
}

function normalizedNameParts(fullName: string): string[] {
  const rawParts = fullName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];
  const parts: string[] = [];
  let initials = "";
  for (const part of rawParts) {
    if (part.length === 1) {
      initials += part;
    } else {
      if (initials) parts.push(initials);
      initials = "";
      parts.push(part);
    }
  }
  if (initials) parts.push(initials);
  return parts;
}

function namesMatch(a: string, b: string): boolean {
  if (surnameOf(a) === surnameOf(b)) return true;
  const partsA = normalizedNameParts(a);
  const partsB = normalizedNameParts(b);
  if (partsA.length === 0 || partsB.length === 0 || partsA.length !== partsB.length) return false;
  return partsA.every((part) => partsB.includes(part));
}

export function authorOverlapCount(a: string[], b: string[]): number {
  return a.filter((author) => b.some((candidate) => namesMatch(author, candidate))).length;
}
