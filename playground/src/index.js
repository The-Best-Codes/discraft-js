import { debug, error, info, success } from "./utils/logger.js";
import client from "./services/discord.js";
import { CommandHandler } from "./discraft/commands/handler.js";
import { eventHandler } from "./discraft/events/handler.js";

const startTime = Date.now();

info("Initializing Discord bot...");

// Initialize command handler
client.commandHandler = new CommandHandler(client, startTime);

// Initialize event handlers
await eventHandler(client);

success("Bot setup complete.");

process.on("unhandledRejection", (err) => {
  error("Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  error("Uncaught exception:", err);
});

process.on("uncaughtExceptionMonitor", (err) => {
  error("Uncaught exception monitor:", err);
});

process.on("exit", () => {
  info("Bot exiting...");
  client.destroy();
  debug("Bot client logged out, connection terminated.");
});