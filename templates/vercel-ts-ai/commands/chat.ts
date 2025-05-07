import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  type APIApplicationCommandInteraction,
  type APIApplicationCommandOption,
  type APIChatInputApplicationCommandInteraction,
  type APIInteractionResponse,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  MessageFlags,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord-api-types/v10";

export default {
  data: {
    name: "chat",
    description: "Chat with Gemini AI",
    options: [
      {
        name: "prompt",
        description: "The prompt for the AI",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "image",
        description: "Optional image to include in the prompt",
        type: ApplicationCommandOptionType.Attachment,
        required: false,
      },
    ],
  } as RESTPostAPIApplicationCommandsJSONBody,
  async execute(data: {
    interaction: APIApplicationCommandInteraction;
  }): Promise<APIInteractionResponse> {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
    });
    const interaction = data.interaction;

    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content:
            "This command can only be used as a chat input (slash) command.",
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    const chatInteraction =
      interaction as APIChatInputApplicationCommandInteraction;

    const promptOption = chatInteraction.data.options?.find(
      (option) => option.name === "prompt",
    ) as (APIApplicationCommandOption & { value: string }) | undefined;
    const imageOption = chatInteraction.data.options?.find(
      (option) => option.name === "image",
    ) as (APIApplicationCommandOption & { value: string }) | undefined;
    const prompt = promptOption?.value || "";
    const imageAttachment =
      chatInteraction.data.resolved?.attachments?.[imageOption?.value || ""];

    if (prompt.length > 2000) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "Prompt must be less than 2000 characters.",
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parts: any[] = [prompt];
      if (imageAttachment) {
        const imageBuffer = await (
          await fetch(imageAttachment.url)
        ).arrayBuffer();
        const imageBase64 = Buffer.from(imageBuffer).toString("base64");
        const image = {
          inlineData: {
            data: imageBase64,
            mimeType: imageAttachment.content_type,
          },
        };
        parts = [prompt, image];
      }

      const result = await model.generateContent(parts);
      const response = result.response.text();

      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: response,
        },
      };
    } catch (error) {
      console.error("Error during AI chat:", error);
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content: "An error occurred while processing your request.",
          flags: MessageFlags.Ephemeral,
        },
      };
    }
  },
};
