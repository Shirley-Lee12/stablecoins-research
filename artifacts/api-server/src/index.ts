import "dotenv/config";
import { env } from "./config";
import app from "./app";
import { logger } from "./lib/logger";

app.listen(env.PORT, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port: env.PORT }, "Server listening");
});
