import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Here you define your command data
// Discraft will handle the registration and interactions with the API

export default {
  data: {
    name: "ping", // The name of the command
    description: "Check if the bot is online", // The description of the command
  } as CommandData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(data: {
    interaction: SimplifiedInteraction;
  }): CommandExecuteResult {
    return {
      content: "Pong from Vercel!", // The message content
    };
  },
};
