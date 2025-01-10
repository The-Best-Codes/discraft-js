import { Events } from "discord.js";
import { logger } from "../utils/logger";

export default {
  event: Events.MessageCreate,
  handler: async (client, message) => {
    if (message.author.bot) return; // Ignore bot messages
    if (message.content === "Hi, Discraft") {
      try {
        await message.reply(`Hello, ${message.author.username}!`);
      } catch (error) {
        logger.error(`Error replying to message: ${error}`);
      }
    }
  },
};
