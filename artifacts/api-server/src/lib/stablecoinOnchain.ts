import { logger } from "./logger";
import { readPersistentSnapshot, writePersistentSnapshot } from "./persistentSnapshot";

const ETHERSCAN_API = "https://api.etherscan.io/v2/api";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = `0x${"0".repeat(64)}`;
const REFRESH_INTERVAL_MS = 60 * 60_000;
const STALE_AFTER_MS = 3 * 60 * 60_000;
const SNAPSHOT_KEY = "stablecoin-onchain-ethereum";
const TOKENS = [
  { symbol: "USDT", contract: "0xdac17f958d2ee523a2206206994597c13d831ec7", decimals: 6, treasuryEnv: "USDT_TREASURY_ADDRESSES" },
  { symbol: "USDC", contract: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6, treasuryEnv: "USDC_TREASURY_ADDRESSES" },
] as const;

interface EtherscanResponse<T> { status?: string; message?: string; result?: T }
interface EtherscanLog { data?: string; topics?: string[] }
interface HolderRow { TokenHolderAddress?: string; TokenHolderQuantity?: string }

export interface StablecoinOnchainSnapshot {
  refreshedAt: string;
  windowDays: number;
  sourceUrl: string;
  tokens: Array<{
    symbol: string;
    contract: string;
    minted: number;
    burned: number;
    netIssuance: number;
    holderCount: number | null;
    adjustedTop10Pct: number | null;
    treasuryFlow: { inflow: number; outflow: number; net: number; addressCount: number } | null;
  }>;
}

let refreshing: Promise<StablecoinOnchainSnapshot> | null = null;

function query(params: Record<string, string>) {
  return `${ETHERSCAN_API}?${new URLSearchParams({ chainid: "1", apikey: process.env.ETHERSCAN_API_KEY ?? "", ...params })}`;
}

async function etherscan<T>(params: Record<string, string>): Promise<T> {
  const response = await fetch(query(params), { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Etherscan request failed (${response.status})`);
  const payload = await response.json() as EtherscanResponse<T>;
  if (payload.status === "0" || payload.result == null) throw new Error(String(payload.result ?? payload.message ?? "Etherscan returned no data"));
  return payload.result;
}

function amountFromLogs(logs: EtherscanLog[], decimals: number) {
  const divisor = 10 ** decimals;
  return logs.reduce((sum, log) => {
    try { return sum + Number(BigInt(log.data ?? "0x0")) / divisor; } catch { return sum; }
  }, 0);
}

function addressTopic(address: string) {
  return `0x${address.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
}

async function logsFor(contract: string, fromBlock: number, topicIndex: 1 | 2, topicValue: string) {
  return etherscan<EtherscanLog[]>({
    module: "logs", action: "getLogs", fromBlock: String(fromBlock), toBlock: "latest", address: contract,
    topic0: TRANSFER_TOPIC, [`topic${topicIndex}`]: topicValue, [`topic0_${topicIndex}_opr`]: "and", page: "1", offset: "1000",
  });
}

async function treasuryFlow(contract: string, decimals: number, fromBlock: number, rawAddresses: string | undefined) {
  const addresses = (rawAddresses ?? "").split(",").map((item) => item.trim()).filter((item) => /^0x[a-fA-F0-9]{40}$/.test(item));
  if (!addresses.length) return null;
  const flows = await Promise.all(addresses.map(async (address) => {
    const [outgoing, incoming] = await Promise.all([
      logsFor(contract, fromBlock, 1, addressTopic(address)),
      logsFor(contract, fromBlock, 2, addressTopic(address)),
    ]);
    return { inflow: amountFromLogs(incoming, decimals), outflow: amountFromLogs(outgoing, decimals) };
  }));
  const inflow = flows.reduce((sum, row) => sum + row.inflow, 0);
  const outflow = flows.reduce((sum, row) => sum + row.outflow, 0);
  return { inflow, outflow, net: inflow - outflow, addressCount: addresses.length };
}

async function loadToken(token: typeof TOKENS[number], fromBlock: number) {
  const [mintLogs, burnLogs, holderCountResult, holderListResult, totalSupplyResult, treasury] = await Promise.all([
    logsFor(token.contract, fromBlock, 1, ZERO_TOPIC),
    logsFor(token.contract, fromBlock, 2, ZERO_TOPIC),
    etherscan<string>({ module: "token", action: "tokenholdercount", contractaddress: token.contract }).catch(() => null),
    etherscan<HolderRow[]>({ module: "token", action: "tokenholderlist", contractaddress: token.contract, page: "1", offset: "100" }).catch(() => null),
    etherscan<string>({ module: "stats", action: "tokensupply", contractaddress: token.contract }).catch(() => null),
    treasuryFlow(token.contract, token.decimals, fromBlock, process.env[token.treasuryEnv]).catch((error) => {
      logger.warn({ error, token: token.symbol }, "Unable to calculate issuer treasury flow");
      return null;
    }),
  ]);
  const minted = amountFromLogs(mintLogs, token.decimals);
  const burned = amountFromLogs(burnLogs, token.decimals);
  let adjustedTop10Pct: number | null = null;
  if (holderListResult?.length && totalSupplyResult) {
    const excluded = new Set((process.env[token.treasuryEnv] ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
    excluded.add("0x0000000000000000000000000000000000000000");
    excluded.add(token.contract.toLowerCase());
    const rows = holderListResult.map((row) => ({ address: row.TokenHolderAddress?.toLowerCase() ?? "", balance: Number(row.TokenHolderQuantity ?? 0) })).filter((row) => Number.isFinite(row.balance) && row.balance > 0);
    const excludedBalance = rows.filter((row) => excluded.has(row.address)).reduce((sum, row) => sum + row.balance, 0);
    const denominator = Number(totalSupplyResult) - excludedBalance;
    const top10 = rows.filter((row) => !excluded.has(row.address)).slice(0, 10).reduce((sum, row) => sum + row.balance, 0);
    adjustedTop10Pct = denominator > 0 ? (top10 / denominator) * 100 : null;
  }
  return {
    symbol: token.symbol,
    contract: token.contract,
    minted,
    burned,
    netIssuance: minted - burned,
    holderCount: holderCountResult == null ? null : Number(holderCountResult),
    adjustedTop10Pct,
    treasuryFlow: treasury,
  };
}

async function buildSnapshot(): Promise<StablecoinOnchainSnapshot> {
  if (!process.env.ETHERSCAN_API_KEY) throw new Error("ETHERSCAN_API_KEY is not configured");
  const latestHex = await etherscan<string>({ module: "proxy", action: "eth_blockNumber" });
  const latestBlock = Number.parseInt(latestHex, 16);
  if (!Number.isFinite(latestBlock)) throw new Error("Unable to determine latest Ethereum block");
  const fromBlock = Math.max(0, latestBlock - 50_400);
  return {
    refreshedAt: new Date().toISOString(),
    windowDays: 7,
    sourceUrl: "https://etherscan.io/",
    tokens: await Promise.all(TOKENS.map((token) => loadToken(token, fromBlock))),
  };
}

export async function refreshStablecoinOnchain(): Promise<StablecoinOnchainSnapshot> {
  if (refreshing) return refreshing;
  refreshing = buildSnapshot().then(async (snapshot) => {
    await writePersistentSnapshot(SNAPSHOT_KEY, "Etherscan V2", snapshot, snapshot.refreshedAt);
    return snapshot;
  }).finally(() => { refreshing = null; });
  return refreshing;
}

export async function getStablecoinOnchain() {
  const snapshot = await readPersistentSnapshot<StablecoinOnchainSnapshot>(SNAPSHOT_KEY, STALE_AFTER_MS);
  if (!snapshot) throw new Error("No successful Ethereum stablecoin snapshot is available");
  return snapshot;
}

export const stablecoinOnchainRefreshIntervalMs = REFRESH_INTERVAL_MS;
