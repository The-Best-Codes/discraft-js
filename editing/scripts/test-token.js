import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { error, success } from "../common/utils/logger.js";

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
  error(
    "BOT_TOKEN is not set in the environment variables. Make sure you are in the root of your project and have an environment file (like .env) with the bot token.",
  );
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client
  .login(token)
  .then(() => {
    success("The bot token is valid.");
    client.destroy();
    process.exit(0);
  })
  .catch(() => {
    error("Invalid bot token.");
    process.exit(1);
  });

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  error("\nCancelling token check...");
  if (client) {
    client.destroy();
  }
  process.exit(0);
});
