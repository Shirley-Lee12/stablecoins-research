// A separator between multiple initials is mandatory. Making it optional caused every ordinary
// given name ("Nicola" = N-i-c-o-l-a) to be treated as a sequence of initials, so a trusted full
// name was never considered richer than "N.".
const LATIN_INITIAL = /^(?:[A-Z]\.?|[A-Z]\.?-[A-Z]\.?)$/i;
const UPPERCASE_SURNAME_INITIALS = /^[\p{Lu}\p{M}'-]{2,}(?:\s+[A-Z]\.?)+$/u;

function words(value: string): string[] {
  return value.normalize("NFKC").trim().split(/[\s,]+/u)
    .map((part) => part.replace(/^[^\p{L}]+|[^\p{L}. '-]+$/gu, ""))
    .filter(Boolean);
}

function normalizedLetters(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/[^\p{L}]/gu, "");
}

function usesUppercaseSurnameFirst(value: string): boolean {
  return UPPERCASE_SURNAME_INITIALS.test(value.trim());
}

function surname(value: string): string {
  const trimmed = value.trim();
  const comma = trimmed.indexOf(",");
  const part = comma > 0
    ? trimmed.slice(0, comma)
    : usesUppercaseSurnameFirst(trimmed) ? words(trimmed)[0] ?? "" : words(trimmed).at(-1) ?? "";
  return normalizedLetters(part);
}

function givenParts(value: string): string[] {
  const trimmed = value.trim();
  const comma = trimmed.indexOf(",");
  if (comma > 0) return words(trimmed.slice(comma + 1));
  if (usesUppercaseSurnameFirst(trimmed)) return words(trimmed).slice(1);
  return words(trimmed).slice(0, -1);
}

function firstInitial(value: string): string {
  return normalizedLetters(givenParts(value)[0] ?? "").charAt(0);
}

function detailScore(value: string): number {
  return givenParts(value).reduce((score, part) => score + (LATIN_INITIAL.test(part) ? 1 : normalizedLetters(part).length), 0);
}

function cleanCandidateName(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&", apos: "'", quot: '"',
    aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
    Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
    ntilde: "ñ", Ntilde: "Ñ", auml: "ä", ouml: "ö", uuml: "ü",
    Auml: "Ä", Ouml: "Ö", Uuml: "Ü",
  };
  return value
    .replace(/&#(\d+);/gu, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/giu, (match, name) => namedEntities[name] ?? match)
    .trim();
}

function isCredibleExpandedName(value: string): boolean {
  const parts = words(value);
  if (parts.length < 2) return false;
  const allowedLowercaseParticles = new Set(["al", "bin", "da", "de", "del", "der", "di", "dos", "du", "la", "le", "van", "von"]);
  return parts.every((part) => {
    const letters = part.replace(/[^\p{L}]/gu, "");
    if (!letters) return false;
    if (allowedLowercaseParticles.has(letters.toLocaleLowerCase())) return true;
    // Reject visibly truncated provider data such as "rd Ananda" or "th K.Parijatha".
    return !/^[a-z]{1,2}$/u.test(letters) && /\p{Lu}/u.test(letters.charAt(0));
  });
}

/** True for bibliographic forms such as "T. Goel" or "Hamm, P.". */
export function isAbbreviatedAuthorName(value: string): boolean {
  if (!/[A-Za-z]/u.test(value)) return false;
  if (usesUppercaseSurnameFirst(value)) return true;
  const parts = givenParts(value);
  return parts.length > 0 && LATIN_INITIAL.test(parts[0]);
}

export function hasAbbreviatedAuthorName(authors: string[]): boolean {
  return authors.some(isAbbreviatedAuthorName);
}

function compatibleAuthorNames(current: string, candidate: string): boolean {
  if (!surname(current) || surname(current) !== surname(candidate)) return false;
  const currentInitial = firstInitial(current);
  const candidateInitial = firstInitial(candidate);
  return !currentInitial || !candidateInitial || currentInitial === candidateInitial;
}

/** Expands initials only when a confirmed scholarly source supplies a compatible richer name. */
export function preferFullAuthorNames(current: string[], candidateLists: string[][]): string[] {
  const cleanedLists = candidateLists.map((list) => list.map(cleanCandidateName).filter((name) => name && !/&[a-z#0-9]+;/iu.test(name)));
  const candidates = cleanedLists.flat();
  if (current.length === 0) {
    const score = (list: string[]) => list.length * 100 + list.reduce((sum, name) => sum + detailScore(name), 0);
    return [...cleanedLists].filter((list) => list.length > 0).sort((a, b) => score(b) - score(a))[0]
      ?.map((name) => name.trim()).filter(Boolean) ?? [];
  }

  return current.map((name, index) => {
    if (!isAbbreviatedAuthorName(name)) return name.trim();
    const samePosition = cleanedLists.map((list) => list[index]).filter((candidate): candidate is string => !!candidate);
    const matches = [...samePosition, ...candidates]
      .filter((candidate, candidateIndex, all) => all.indexOf(candidate) === candidateIndex)
      .filter((candidate) => compatibleAuthorNames(name, candidate))
      .filter(isCredibleExpandedName)
      .filter((candidate) => detailScore(candidate) > detailScore(name))
      .sort((a, b) => detailScore(b) - detailScore(a));
    return matches[0]?.trim() ?? name.trim();
  });
}

/**
 * A resolved DOI identifies one exact work, so its ordered author list may safely correct more
 * than initials (for example, a surname change between a preprint and the final publication).
 * Require strong list-level agreement first, then keep any richer spelling already supplied.
 */
export function preferExactDoiAuthorNames(current: string[], candidateLists: string[][]): string[] {
  const cleanedLists = candidateLists
    .map((list) => list.map(cleanCandidateName).filter((name) => name && !/&[a-z#0-9]+;/iu.test(name)))
    .filter((list) => list.length > 0);
  if (current.length === 0) return preferFullAuthorNames(current, cleanedLists);

  const compatible = cleanedLists
    .filter((list) => list.length === current.length)
    .map((list) => ({
      list,
      overlap: current.filter((name) => list.some((candidate) => surname(name) === surname(candidate))).length,
      detail: list.reduce((sum, name) => sum + detailScore(name), 0),
    }))
    .filter(({ overlap }) => overlap >= Math.max(1, Math.ceil(current.length * 0.6)))
    .sort((a, b) => b.overlap - a.overlap || b.detail - a.detail);
  const authoritative = compatible[0]?.list;
  if (!authoritative) return preferFullAuthorNames(current, cleanedLists);

  return authoritative.map((candidate) => {
    const existing = current.find((name) => surname(name) === surname(candidate));
    if (existing && isAbbreviatedAuthorName(existing) && !isCredibleExpandedName(candidate)) return existing.trim();
    return existing && detailScore(existing) >= detailScore(candidate) ? existing.trim() : candidate.trim();
  });
}
