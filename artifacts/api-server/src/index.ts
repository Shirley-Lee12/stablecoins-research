import "dotenv/config";
import { env } from "./config";
import app from "./app";
import { logger } from "./lib/logger";
import { startUploadJobMaintenance } from "./lib/uploadJobMaintenance";
import { startResourceSubscriptionScheduler } from "./lib/subscriptionDiscovery";
import { startAiPreReviewScheduler } from "./lib/aiPreReview";
import { startBackgroundTaskScheduler } from "./lib/backgroundTasks";
import { startStablecoinMarketScheduler } from "./lib/stablecoinMarket";

startUploadJobMaintenance();
startResourceSubscriptionScheduler();
startAiPreReviewScheduler();
startBackgroundTaskScheduler();
startStablecoinMarketScheduler();

app.listen(env.PORT, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: env.PORT }, "Server listening");
});
