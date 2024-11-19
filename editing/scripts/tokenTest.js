import { Client, GatewayIntentBits } from "discord.js";
import { error, success } from "../common/utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
  error("BOT_TOKEN is not set in the environment variables.");
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
  console.log("\nCancelling token check...");
  if (client) {
    client.destroy();
  }
  process.exit(0);
});
