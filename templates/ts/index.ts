import { registerCommands } from "./.discraft/commands/index";
import { registerEvents } from "./.discraft/events/index";
import client from "./clients/discord";
import { logger } from "./utils/logger";

logger.start("Starting bot...");

// Register events before login
registerEvents(client)
  .then(() => {
    logger.verbose("Events registered in main process.");
  })
  .catch((err) => {
    logger.error("Error registering events.");
    logger.verbose(err);
  })
  .finally(() => {
    client.on("ready", async () => {
      logger.success("Client logged in.");
      try {
        await registerCommands(client);
      } catch (err) {
        logger.error("Error registering commands.");
        logger.verbose(err);
      }
    });
    client.login(process.env.DISCORD_TOKEN).catch((err) => {
      logger.error("Client login failed.");
      logger.verbose(err);
    });
  });

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception.");
  logger.verbose(err);
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection.");
  logger.verbose(err);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, Gracefully shutting down...");
  try {
    logger.info("Closing client...");
    await client.destroy();
    logger.success("Client closed.");
  } catch (err) {
    logger.error("Error while shutting down client.");
    logger.verbose(err);
  }
  logger.info("Exiting...");
  process.exit(0);
});