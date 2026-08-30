export function normalizeKeywordList(values: string[]): string[] {
  return [...new Set(values
    .flatMap((value) => value.split(/[;,；，]/))
    .map((value) => value
      .replace(/^[-*#\s]+|[-*#\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase())
    .filter(Boolean))];
}
