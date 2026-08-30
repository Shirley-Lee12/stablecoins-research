import { db, resourceSubscriptionsTable, subscriptionCandidatesTable, resourcesTable } from "@workspace/db";
import { and, eq, lte } from "drizzle-orm";
import { discoverCrossref } from "./scholar/crossref";
import { discoverOpenAlex } from "./scholar/openalex";
import { discoverSemanticScholar } from "./scholar/semanticscholar";
import type { ScholarResult } from "./scholar/types";
import { logger } from "./logger";

export const DEFAULT_DISCOVERY_SOURCES = ["crossref", "openalex", "semanticscholar"] as const;
type DiscoverySource = typeof DEFAULT_DISCOVERY_SOURCES[number];
type DiscoveredItem = ScholarResult & { externalKey: string; rawMetadata: unknown };
export interface SubscriptionRunProgress {
  phase: "searching" | "deduplicating" | "saving" | "completed";
  processed: number;
  total: number;
  source?: DiscoverySource;
  sources?: Record<string, { found: number; error?: string }>;
}

function nextRun(frequency: string): Date {
  const days = frequency === "daily" ? 1 : 7;
  return new Date(Date.now() + days * 24 * 60 * 60_000);
}

function titleKey(title: string, year: number | null): string {
  return `${title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()}:${year ?? ""}`;
}

function preferRicherResult(current: DiscoveredItem, candidate: DiscoveredItem): DiscoveredItem {
  const score = (item: DiscoveredItem) => (item.abstract ? 4 : 0) + Math.min(item.authors.length, 4) + (item.canonicalUrl ? 1 : 0) + (item.venue ? 1 : 0);
  return score(candidate) > score(current) ? candidate : current;
}

export async function runResourceSubscription(
  subscriptionId: number,
  onProgress?: (progress: SubscriptionRunProgress) => Promise<void> | void,
): Promise<{ found: number; added: number; sources: Record<string, { found: number; error?: string }> }> {
  const [subscription] = await db.select().from(resourceSubscriptionsTable).where(eq(resourceSubscriptionsTable.id, subscriptionId)).limit(1);
  if (!subscription) throw new Error("Subscription not found");
  const startedAt = new Date();
  // Crossref recommends an overlap when incrementally syncing. Uniqueness in the candidate table
  // makes the repeated window harmless while protecting against delayed indexing.
  const since = subscription.lastCheckedAt
    ? new Date(subscription.lastCheckedAt.getTime() - 24 * 60 * 60_000)
    : new Date(Date.now() - 30 * 24 * 60 * 60_000);
  try {
    // Existing subscriptions created before multi-source discovery used Crossref alone. Upgrade
    // those legacy rows automatically so current subscriptions benefit without manual recreation.
    const configured = subscription.sources.length === 1 && subscription.sources[0] === "crossref"
      ? [...DEFAULT_DISCOVERY_SOURCES]
      : subscription.sources.filter((source): source is DiscoverySource => DEFAULT_DISCOVERY_SOURCES.includes(source as DiscoverySource));
    const activeSources = configured.length ? configured : [...DEFAULT_DISCOVERY_SOURCES];
    const adapters: Record<DiscoverySource, () => Promise<DiscoveredItem[]>> = {
      crossref: () => discoverCrossref(subscription.query, since, 100),
      openalex: () => discoverOpenAlex(subscription.query, since, 100),
      semanticscholar: () => discoverSemanticScholar(subscription.query, since, 100),
    };
    const totalSteps = activeSources.length + 2;
    let completedSources = 0;
    const settled = await Promise.allSettled(activeSources.map(async (source) => {
      try {
        return await adapters[source]();
      } finally {
        completedSources += 1;
        await onProgress?.({ phase: "searching", source, processed: completedSources, total: totalSteps });
      }
    }));
    const sourceStats: Record<string, { found: number; error?: string }> = {};
    const discoveredByKey = new Map<string, DiscoveredItem>();
    settled.forEach((result, index) => {
      const source = activeSources[index];
      if (result.status === "rejected") {
        sourceStats[source] = { found: 0, error: result.reason instanceof Error ? result.reason.message : "Source failed" };
        return;
      }
      sourceStats[source] = { found: result.value.length };
      for (const item of result.value) {
        const current = discoveredByKey.get(item.externalKey);
        discoveredByKey.set(item.externalKey, current ? preferRicherResult(current, item) : item);
      }
    });
    if (settled.every((result) => result.status === "rejected")) throw new Error(Object.values(sourceStats).map((item) => item.error).filter(Boolean).join("; "));
    const discovered = [...discoveredByKey.values()];
    await onProgress?.({ phase: "deduplicating", processed: activeSources.length + 1, total: totalSteps, sources: sourceStats });
    const resources = await db.select({ title: resourcesTable.title, publishedDate: resourcesTable.publishedDate, doi: resourcesTable.doi }).from(resourcesTable);
    const dois = new Set(resources.map((row) => row.doi?.toLowerCase()).filter(Boolean));
    const titles = new Set(resources.map((row) => titleKey(row.title, row.publishedDate ? Number(row.publishedDate.slice(0, 4)) : null)));
    await onProgress?.({ phase: "saving", processed: activeSources.length + 1, total: totalSteps, sources: sourceStats });
    let added = 0;
    for (const item of discovered) {
      if ((item.doi && dois.has(item.doi.toLowerCase())) || titles.has(titleKey(item.title, item.year))) continue;
      const rows = await db.insert(subscriptionCandidatesTable).values({
        subscriptionId, externalKey: item.externalKey, source: item.source, title: item.title,
        authors: item.authors, year: item.year, abstract: item.abstract, doi: item.doi,
        url: item.canonicalUrl, rawMetadata: item.rawMetadata,
      }).onConflictDoNothing().returning({ id: subscriptionCandidatesTable.id });
      added += rows.length;
    }
    await db.update(resourceSubscriptionsTable).set({
      sources: activeSources, lastCheckedAt: startedAt, nextRunAt: nextRun(subscription.frequency),
      lastError: Object.entries(sourceStats).filter(([, stat]) => stat.error).map(([source, stat]) => `${source}: ${stat.error}`).join("; ").slice(0, 500) || null,
      updatedAt: new Date(),
    }).where(eq(resourceSubscriptionsTable.id, subscriptionId));
    const result = { found: discovered.length, added, sources: sourceStats };
    await onProgress?.({ phase: "completed", processed: totalSteps, total: totalSteps, sources: sourceStats });
    return result;
  } catch (error) {
    await db.update(resourceSubscriptionsTable).set({
      lastCheckedAt: startedAt, nextRunAt: nextRun(subscription.frequency),
      lastError: error instanceof Error ? error.message.slice(0, 500) : "Discovery failed", updatedAt: new Date(),
    }).where(eq(resourceSubscriptionsTable.id, subscriptionId));
    throw error;
  }
}

export async function runDueResourceSubscriptions(): Promise<void> {
  const due = await db.select({ id: resourceSubscriptionsTable.id }).from(resourceSubscriptionsTable).where(and(
    eq(resourceSubscriptionsTable.active, true), lte(resourceSubscriptionsTable.nextRunAt, new Date()),
  ));
  for (const subscription of due) {
    try { await runResourceSubscription(subscription.id); }
    catch (error) { logger.error({ error, subscriptionId: subscription.id }, "Resource subscription run failed"); }
  }
}

export function startResourceSubscriptionScheduler(): void {
  const initial = setTimeout(() => void runDueResourceSubscriptions().catch((error) => logger.error({ error }, "Subscription scheduler failed")), 10_000);
  initial.unref();
  const timer = setInterval(() => void runDueResourceSubscriptions().catch((error) => logger.error({ error }, "Subscription scheduler failed")), 60 * 60_000);
  timer.unref();
}
