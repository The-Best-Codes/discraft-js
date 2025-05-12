import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  MessageFlags,
} from "discord-api-types/v10";
import type {
  CommandData,
  CommandExecuteResult,
  SimplifiedInteraction,
} from "../utils/types";

// Here you define your command data
// Discraft will handle the registration and interactions with the API

export default {
  data: {
    name: "longcommand", // The name of the command
    description: "Simulate a long running task", // The description of the command
    options: [
      {
        name: "duration",
        description: "The duration of the task in seconds",
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
    ],
  } as CommandData,
  async execute(data: {
    interaction: SimplifiedInteraction;
  }): CommandExecuteResult {
    const interaction = data.interaction;

    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      return {
        content:
          "This command can only be used as a chat input (slash) command.",
        flags: MessageFlags.Ephemeral, // Make the response visible only to the user
      };
    }

    const durationString = interaction.data.options?.find(
      (option) => option.name === "duration",
    )?.value;

    const duration = parseInt(durationString as string);

    await new Promise((resolve) => setTimeout(resolve, duration * 1000));
    return {
      content: `Long running task completed in ${duration} seconds!`,
    };
  },
};
