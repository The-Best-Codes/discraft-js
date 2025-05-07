import {
  type APIApplicationCommandInteraction,
  type APIInteractionResponse,
  type RESTPostAPIApplicationCommandsJSONBody,
  InteractionResponseType,
} from "discord-api-types/v10";

// Here you define your command data
// Discraft will handle the registration and interactions with the API

export default {
  data: {
    name: "ping", // The name of the command
    description: "Check if the bot is online", // The description of the command
  } as RESTPostAPIApplicationCommandsJSONBody,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(data: {
    interaction: APIApplicationCommandInteraction;
  }): Promise<APIInteractionResponse> {
    return {
      type: InteractionResponseType.ChannelMessageWithSource, // Respond with a channel message
      data: {
        content: "Pong from Vercel!", // The message content
      },
    };
  },
};
