import {
  type APIApplicationCommandInteraction,
  type APIInteractionResponse,
  type RESTPostAPIApplicationCommandsJSONBody,
  InteractionResponseType,
} from "discord-api-types/v10";

export default {
  data: {
    name: "ping",
    description: "Check if the bot is online",
  } as RESTPostAPIApplicationCommandsJSONBody,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(data: {
    interaction: APIApplicationCommandInteraction;
  }): Promise<APIInteractionResponse> {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: "Pong from Vercel!",
      },
    };
  },
};
