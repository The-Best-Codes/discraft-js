import { Events } from "discord.js";
import { logger } from "../utils/logger";

export default {
  event: Events.Error,
  handler: (client, error) => {
    logger.error("An error occurred:", error);
  },
};
