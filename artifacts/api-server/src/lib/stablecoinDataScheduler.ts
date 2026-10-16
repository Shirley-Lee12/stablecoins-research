import { logger } from "./logger";
import { depegRefreshIntervalMs, refreshDepegSnapshot } from "./depegEvents";
import {
  refreshStablecoinLiquidity,
  stablecoinLiquidityRefreshIntervalMs,
} from "./stablecoinLiquidity";
import {
  refreshStablecoinOnchain,
  stablecoinOnchainRefreshIntervalMs,
} from "./stablecoinOnchain";

type RefreshJob = {
  name: string;
  intervalMs: number;
  run: () => Promise<unknown>;
  enabled?: () => boolean;
};

const jobs: RefreshJob[] = [
  {
    name: "stablecoin liquidity",
    intervalMs: stablecoinLiquidityRefreshIntervalMs,
    run: refreshStablecoinLiquidity,
  },
  {
    name: "stablecoin depeg",
    intervalMs: depegRefreshIntervalMs,
    run: refreshDepegSnapshot,
  },
  {
    name: "Ethereum stablecoin on-chain",
    intervalMs: stablecoinOnchainRefreshIntervalMs,
    run: refreshStablecoinOnchain,
    // V0.2: contract event/circulation semantics are not approved for public issuance.
    enabled: () => false,
  },
];

async function runJob(job: RefreshJob): Promise<void> {
  if (job.enabled && !job.enabled()) return;
  try {
    await job.run();
  } catch (error) {
    logger.warn(
      { error, dataJob: job.name },
      "Market-data refresh failed; the last successful snapshot remains active",
    );
  }
}

export async function refreshAllStablecoinData(): Promise<
  Array<{ name: string; refreshed: boolean }>
> {
  return Promise.all(
    jobs.map(async (job) => {
      if (job.enabled && !job.enabled())
        return { name: job.name, refreshed: false };
      try {
        await job.run();
        return { name: job.name, refreshed: true };
      } catch (error) {
        logger.warn(
          { error, dataJob: job.name },
          "Manual market-data refresh failed",
        );
        return { name: job.name, refreshed: false };
      }
    }),
  );
}

export function startStablecoinDataScheduler(): void {
  for (const job of jobs) {
    void runJob(job);
    const timer = setInterval(() => void runJob(job), job.intervalMs);
    timer.unref();
  }
}
