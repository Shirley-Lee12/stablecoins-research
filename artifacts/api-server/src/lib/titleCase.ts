const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "en", "for", "from", "if", "in", "of", "on", "or", "per", "the", "to", "v", "via", "vs", "with", "yet"]);
const TERM_CASE: Record<string, string> = {
  aml: "AML", api: "API", bitcoin: "Bitcoin", blockchain: "Blockchain", cbdc: "CBDC", dao: "DAO", daos: "DAOs", defi: "DeFi", dex: "DEX", erc20: "ERC20", ethereum: "Ethereum", fsb: "FSB", hkma: "HKMA", mica: "MiCA", nft: "NFT", nfts: "NFTs", ssrn: "SSRN", usdc: "USDC", usde: "USDe", usdt: "USDT",
};

/** Normalizes English bibliographic titles without changing CJK/Japanese titles or arbitrary casing in quoted source text. */
export function normalizeResourceTitle(title: string): string {
  if (!/[A-Za-z]/.test(title) || /[\u3040-\u30ff\u3400-\u9fff]/u.test(title)) return title.trim();
  const words = title.trim().split(/(\s+)/u);
  const lexicalIndexes = words.map((word, index) => /[A-Za-z]/.test(word) ? index : -1).filter((index) => index >= 0);
  const first = lexicalIndexes[0];
  const last = lexicalIndexes.at(-1);
  return words.map((word, index) => {
    if (!/[A-Za-z]/.test(word)) return word;
    return word.split(/([-–—/])/u).map((part) => {
      if (!/[A-Za-z]/.test(part)) return part;
      const bare = part.replace(/^[^A-Za-z]+|[^A-Za-z]+$/gu, "");
      const lower = bare.toLocaleLowerCase();
      const replacement = TERM_CASE[lower] ?? ((index !== first && index !== last && SMALL_WORDS.has(lower))
        ? lower
        : `${lower.charAt(0).toLocaleUpperCase()}${lower.slice(1)}`);
      return part.replace(bare, replacement);
    }).join("");
  }).join("");
}
