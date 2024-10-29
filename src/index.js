import { debug, error, info, success } from "./utils/logger.js";
import client from "./services/discord.js";
import { CommandHandler } from "./handlers/CommandHandler.js";
import { events } from "./.discraft/events/index.js";

const startTime = Date.now();

info("Initializing Discord bot...");

// Initialize command handler
client.commandHandler = new CommandHandler(client, startTime);

// Load events from static imports
info("Loading events...");
try {
  for (const [name, eventHandler] of Object.entries(events)) {
    debug(`Loading event: ${name}`);
    try {
      eventHandler(client);
      debug(`Loaded event: ${name}`);
    } catch (err) {
      error(`Error loading event ${name}:`, err);
    }
  }
  info("Events loaded.");
} catch (err) {
  error("Error loading events:", err);
}

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