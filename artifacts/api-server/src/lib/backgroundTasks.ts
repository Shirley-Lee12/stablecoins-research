import { and, eq, inArray } from "drizzle-orm";
import { backgroundTasksTable, db, resourcesTable } from "@workspace/db";
import { logger } from "./logger";
import { normalizePublicationDateInput } from "./publicationDate";
import { refineSourceType } from "./sourceType";
import { retagResources } from "./tagging";
import { resetAndEnqueueAiPreReviews } from "./aiPreReview";
import { backgroundTaskQueue } from "./taskQueue";
import { hasAbbreviatedAuthorName, resolveLink } from "./scholar";
import { syncResourceAuthors } from "./resourceAuthors";
import { runResourceSubscription } from "./subscriptionDiscovery";

export const APPLY_LATEST_RULES_TASK = "apply_latest_rules";
export const RETAG_RESOURCES_TASK = "retag_resources";
export const RESOURCE_SUBSCRIPTION_TASK = "resource_subscription";

interface ApplyLatestRulesPayload {
  resourceIds: number[];
}

interface RetagResourcesPayload {
  resourceIds: number[];
  replaceManualThemeTags: boolean;
}

interface ResourceSubscriptionPayload {
  subscriptionId: number;
}

const scheduledTaskIds = new Set<number>();

function isExternalAiCapacityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /429|too many requests|credits are depleted|billing/i.test(message);
}

async function runApplyLatestRulesTask(taskId: number, payload: ApplyLatestRulesPayload, alreadyProcessed: number): Promise<void> {
  const resourceIds = [...new Set(payload.resourceIds)];
  const result = { resourcesProcessed: 0, skipped: 0, themeTagsLinked: 0, assetTagsLinked: 0, jurisdictionTagsLinked: 0 };

  for (let index = alreadyProcessed; index < resourceIds.length; index += 1) {
    const resourceId = resourceIds[index];
    const [row] = await db.select({
      id: resourcesTable.id,
      title: resourcesTable.title,
      authors: resourcesTable.authors,
      doi: resourcesTable.doi,
      sourceType: resourcesTable.sourceType,
      url: resourcesTable.url,
      publishedDate: resourcesTable.publishedDate,
      status: resourcesTable.status,
    }).from(resourcesTable).where(eq(resourcesTable.id, resourceId)).limit(1);

    if (!row || row.status !== "pending") {
      result.skipped += 1;
    } else {
      let publishedDate = row.publishedDate;
      try { publishedDate = normalizePublicationDateInput(row.publishedDate); } catch { /* Keep legacy text for manual review. */ }
      const linked = hasAbbreviatedAuthorName(row.authors)
        ? await resolveLink({ title: row.title, authors: row.authors, year: Number.parseInt(row.publishedDate ?? "", 10) || null, doi: row.doi })
        : null;
      const authors = linked?.authors.length ? linked.authors : row.authors;
      await db.update(resourcesTable).set({
        sourceType: refineSourceType(row.sourceType, row.url, row.title),
        publishedDate,
        authors,
      }).where(and(eq(resourcesTable.id, row.id), eq(resourcesTable.status, "pending")));
      if (authors.some((name, authorIndex) => name !== row.authors[authorIndex]) || authors.length !== row.authors.length) {
        await syncResourceAuthors(row.id, authors);
      }

      const retagged = await retagResources([row.id]);
      result.resourcesProcessed += retagged.resourcesProcessed;
      result.themeTagsLinked += retagged.themeTagsLinked;
      result.assetTagsLinked += retagged.assetTagsLinked;
      result.jurisdictionTagsLinked += retagged.jurisdictionTagsLinked;
      await resetAndEnqueueAiPreReviews([row.id], true);
    }

    await db.update(backgroundTasksTable).set({
      processed: index + 1,
      result,
      updatedAt: new Date(),
    }).where(eq(backgroundTasksTable.id, taskId));
  }
}

async function runRetagResourcesTask(taskId: number, payload: RetagResourcesPayload, alreadyProcessed: number): Promise<void> {
  const resourceIds = [...new Set(payload.resourceIds)];
  const result = {
    resourcesProcessed: alreadyProcessed,
    themeTagsLinked: 0,
    assetTagsLinked: 0,
    jurisdictionTagsLinked: 0,
    candidatesCreated: 0,
  };
  for (let index = alreadyProcessed; index < resourceIds.length; index += 1) {
    const retagged = await retagResources([resourceIds[index]], {
      replaceManualThemeTags: payload.replaceManualThemeTags,
    });
    result.resourcesProcessed += retagged.resourcesProcessed;
    result.themeTagsLinked += retagged.themeTagsLinked;
    result.assetTagsLinked += retagged.assetTagsLinked;
    result.jurisdictionTagsLinked += retagged.jurisdictionTagsLinked;
    result.candidatesCreated += retagged.candidatesCreated;
    await db.update(backgroundTasksTable).set({
      processed: index + 1,
      result,
      updatedAt: new Date(),
    }).where(eq(backgroundTasksTable.id, taskId));
  }
}

async function runResourceSubscriptionTask(taskId: number, payload: ResourceSubscriptionPayload): Promise<void> {
  const result = await runResourceSubscription(payload.subscriptionId, async (progress) => {
    await db.update(backgroundTasksTable).set({
      processed: progress.processed,
      total: progress.total,
      result: { phase: progress.phase, source: progress.source, sources: progress.sources },
      updatedAt: new Date(),
    }).where(eq(backgroundTasksTable.id, taskId));
  });
  await db.update(backgroundTasksTable).set({ result: { phase: "completed", ...result }, updatedAt: new Date() })
    .where(eq(backgroundTasksTable.id, taskId));
}

async function runBackgroundTask(taskId: number): Promise<void> {
  const [task] = await db.update(backgroundTasksTable).set({
    status: "processing", error: null, updatedAt: new Date(),
  }).where(and(eq(backgroundTasksTable.id, taskId), eq(backgroundTasksTable.status, "queued"))).returning();
  if (!task) return;

  try {
    const payload = task.payload as ApplyLatestRulesPayload | RetagResourcesPayload | ResourceSubscriptionPayload;
    if (task.type === APPLY_LATEST_RULES_TASK) {
      if (!("resourceIds" in payload) || !Array.isArray(payload.resourceIds)) throw new Error("Background task payload is invalid");
      await runApplyLatestRulesTask(task.id, payload, task.processed);
    } else if (task.type === RETAG_RESOURCES_TASK) {
      if (!("resourceIds" in payload) || !Array.isArray(payload.resourceIds)) throw new Error("Background task payload is invalid");
      await runRetagResourcesTask(task.id, payload as RetagResourcesPayload, task.processed);
    } else if (task.type === RESOURCE_SUBSCRIPTION_TASK) {
      if (!("subscriptionId" in payload) || !Number.isInteger(payload.subscriptionId)) throw new Error("Background task payload is invalid");
      await runResourceSubscriptionTask(task.id, payload);
    } else {
      throw new Error(`Unsupported background task type: ${task.type}`);
    }
    await db.update(backgroundTasksTable).set({
      status: "completed", processed: task.total, completedAt: new Date(), updatedAt: new Date(),
    }).where(eq(backgroundTasksTable.id, task.id));
  } catch (error) {
    logger.error({ error, taskId }, "Background task failed");
    const waitingForAi = isExternalAiCapacityError(error);
    await db.update(backgroundTasksTable).set({
      status: waitingForAi ? "waiting_external" : "failed",
      error: waitingForAi
        ? "Gemini API credits are depleted. The task is paused and can be retried after billing is restored."
        : error instanceof Error ? error.message : "Unknown background task error",
      completedAt: waitingForAi ? null : new Date(),
      updatedAt: new Date(),
    }).where(eq(backgroundTasksTable.id, task.id));
  }
}

export function enqueueBackgroundTask(taskId: number): void {
  if (scheduledTaskIds.has(taskId)) return;
  scheduledTaskIds.add(taskId);
  backgroundTaskQueue.enqueue(async () => {
    try { await runBackgroundTask(taskId); }
    finally { scheduledTaskIds.delete(taskId); }
  });
}

export async function resumePersistedBackgroundTasks(recoverInterrupted = false): Promise<void> {
  if (recoverInterrupted) {
    await db.update(backgroundTasksTable).set({ status: "queued", updatedAt: new Date() })
      .where(eq(backgroundTasksTable.status, "processing"));
  }
  const rows = await db.select({ id: backgroundTasksTable.id }).from(backgroundTasksTable)
    .where(inArray(backgroundTasksTable.status, ["queued"])).limit(100);
  rows.forEach((row) => enqueueBackgroundTask(row.id));
}

export function startBackgroundTaskScheduler(): void {
  void resumePersistedBackgroundTasks(true).catch((error) => logger.error({ error }, "Background task recovery failed"));
  const timer = setInterval(() => {
    void resumePersistedBackgroundTasks(false).catch((error) => logger.error({ error }, "Background task scan failed"));
  }, 60_000);
  timer.unref();
}
