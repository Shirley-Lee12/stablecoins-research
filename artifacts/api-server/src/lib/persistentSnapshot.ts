import { db, marketDataSnapshotsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export type SnapshotState = "current" | "delayed";

export interface SnapshotStatus {
  state: SnapshotState;
  observedAt: string;
  retrievedAt: string;
  ageSeconds: number;
  source: string;
}

type SnapshotPayload = Record<string, unknown>;

const memoryFallback = new Map<string, {
  source: string;
  payload: SnapshotPayload;
  observedAt: Date;
  retrievedAt: Date;
}>();

function attachStatus<T extends object>(
  payload: T,
  source: string,
  observedAt: Date,
  retrievedAt: Date,
  staleAfterMs: number,
): T & { dataStatus: SnapshotStatus } {
  const ageMs = Math.max(0, Date.now() - observedAt.getTime());
  return {
    ...payload,
    dataStatus: {
      state: ageMs <= staleAfterMs ? "current" : "delayed",
      observedAt: observedAt.toISOString(),
      retrievedAt: retrievedAt.toISOString(),
      ageSeconds: Math.round(ageMs / 1000),
      source,
    },
  };
}

export async function readPersistentSnapshot<T extends object>(
  key: string,
  staleAfterMs: number,
): Promise<(T & { dataStatus: SnapshotStatus }) | null> {
  try {
    const [row] = await db
      .select()
      .from(marketDataSnapshotsTable)
      .where(eq(marketDataSnapshotsTable.key, key))
      .limit(1);
    const processSnapshot = memoryFallback.get(key);
    if (!row) {
      return processSnapshot
        ? attachStatus(processSnapshot.payload as T, processSnapshot.source, processSnapshot.observedAt, processSnapshot.retrievedAt, staleAfterMs)
        : null;
    }
    if (processSnapshot && processSnapshot.observedAt.getTime() > row.observedAt.getTime()) {
      return attachStatus(processSnapshot.payload as T, processSnapshot.source, processSnapshot.observedAt, processSnapshot.retrievedAt, staleAfterMs);
    }
    const payload = row.payload as T;
    memoryFallback.set(key, {
      source: row.source,
      payload: payload as SnapshotPayload,
      observedAt: row.observedAt,
      retrievedAt: row.retrievedAt,
    });
    return attachStatus(payload, row.source, row.observedAt, row.retrievedAt, staleAfterMs);
  } catch (error) {
    const fallback = memoryFallback.get(key);
    logger.warn({ error, snapshotKey: key }, "Unable to read a persistent market-data snapshot");
    return fallback
      ? attachStatus(fallback.payload as T, fallback.source, fallback.observedAt, fallback.retrievedAt, staleAfterMs)
      : null;
  }
}

export async function writePersistentSnapshot<T extends object>(
  key: string,
  source: string,
  payload: T,
  observedAt: string,
): Promise<void> {
  const observed = new Date(observedAt);
  if (!Number.isFinite(observed.getTime())) throw new Error(`Snapshot ${key} has an invalid observation time`);
  const retrievedAt = new Date();
  const storedPayload = payload as SnapshotPayload;
  memoryFallback.set(key, { source, payload: storedPayload, observedAt: observed, retrievedAt });
  try {
    await db.insert(marketDataSnapshotsTable).values({
      key,
      source,
      payload: storedPayload,
      observedAt: observed,
      retrievedAt,
      updatedAt: retrievedAt,
    }).onConflictDoUpdate({
      target: marketDataSnapshotsTable.key,
      set: {
        source,
        payload: storedPayload,
        observedAt: observed,
        retrievedAt,
        updatedAt: retrievedAt,
      },
    });
  } catch (error) {
    logger.warn({ error, snapshotKey: key }, "Unable to persist a market-data snapshot; retaining the process fallback");
  }
}
