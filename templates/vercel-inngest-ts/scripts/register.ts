import { configDotenv } from "dotenv";
configDotenv();

import {
  REST,
  type RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from "discord.js";
import commands from "../.discraft/commands/index.ts";

const token = process.env.DISCORD_TOKEN;
const applicationId = process.env.DISCORD_APP_ID;

if (!token) {
  console.error("DISCORD_TOKEN is not set in your environment variables.");
  process.exit(1);
}
if (!applicationId) {
  console.error("DISCORD_APP_ID is not set in your environment variables.");
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(token);

const commandData = Object.values(commands).map((command) => command.data);

(async () => {
  try {
    console.log(
      `Started refreshing ${commandData.length} application (/) commands.`,
    );

    const data = (await rest.put(Routes.applicationCommands(applicationId), {
      body: commandData,
    })) as RESTPostAPIApplicationCommandsJSONBody[];
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    console.error(error);
  }
})();
