import { logger } from "./logger";
import { cleanupOrphanedUploadTempFiles, resumePersistedUploadJobs } from "../routes/upload";

/**
 * Resume persisted work after a restart, then scan once a minute for retries that have become due.
 * PDFs may still have a referenced temporary source until text extraction succeeds. Recovery checks
 * that file before requeueing, while orphan cleanup leaves every referenced retry source intact.
 */
export function startUploadJobMaintenance(): void {
  void resumePersistedUploadJobs(true).catch((error) => logger.error({ error }, "Upload job recovery failed"));
  void cleanupOrphanedUploadTempFiles().catch((error) => logger.error({ error }, "Upload temp-file cleanup failed"));
  const timer = setInterval(() => {
    void resumePersistedUploadJobs(false).catch((error) => logger.error({ error }, "Upload retry scan failed"));
  }, 60_000);
  timer.unref();
  const cleanupTimer = setInterval(() => {
    void cleanupOrphanedUploadTempFiles().catch((error) => logger.error({ error }, "Upload temp-file cleanup failed"));
  }, 6 * 60 * 60_000);
  cleanupTimer.unref();
}
