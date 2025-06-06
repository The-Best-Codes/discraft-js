import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  type APIApplicationCommandOption,
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
    name: "chat", // The name of the command
    description: "Chat with Gemini AI", // The description of the command
    options: [
      {
        name: "prompt", // The name of the prompt option
        description: "The prompt for the AI", // The description of the prompt option
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "image", // The name of the image option
        description: "Optional image to include in the prompt", // The description of the image option
        type: ApplicationCommandOptionType.Attachment,
        required: false,
      },
    ],
  } as CommandData,
  async execute(data: {
    interaction: SimplifiedInteraction;
  }): CommandExecuteResult {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
    // Get the generative model instance
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
    });

    const interaction = data.interaction; // Get the interaction data

    // Check if the interaction is a chat input command
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      return {
        content:
          "This command can only be used as a chat input (slash) command.",
        flags: MessageFlags.Ephemeral, // Make the response visible only to the user
      };
    }

    // Cast the interaction to the correct type
    const chatInteraction = interaction;

    // Find the 'prompt' option from the interaction
    const promptOption = chatInteraction.data.options?.find(
      (option) => option.name === "prompt",
    ) as (APIApplicationCommandOption & { value: string }) | undefined;
    // Find the 'image' option from the interaction
    const imageOption = chatInteraction.data.options?.find(
      (option) => option.name === "image",
    ) as (APIApplicationCommandOption & { value: string }) | undefined;
    const prompt = promptOption?.value || ""; // Get the value of the prompt option
    const imageAttachment =
      chatInteraction.data.resolved?.attachments?.[imageOption?.value || ""]; // Get the image attachment details from the resolved data

    // Check if the prompt exceeds the maximum length
    if (prompt.length > 2000) {
      return {
        content: "Prompt must be less than 2000 characters.",
        flags: MessageFlags.Ephemeral,
      };
    }

    try {
      // Prepare the parts for the AI model, starting with the prompt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parts: any[] = [prompt];
      // If an image attachment exists, process it
      if (imageAttachment) {
        // Fetch the image data from the URL
        const imageBuffer = await (
          await fetch(imageAttachment.url)
        ).arrayBuffer();
        // Convert the image buffer to base64
        const imageBase64 = Buffer.from(imageBuffer).toString("base64");
        // Format the image data for the AI model
        const image = {
          inlineData: {
            data: imageBase64, // The base64 encoded image data
            mimeType: imageAttachment.content_type, // The MIME type of the image
          },
        };
        // Include the image data along with the prompt
        parts = [prompt, image];
      }

      // Generate content using the AI model
      const result = await model.generateContent(parts);
      // Extract the text response from the result
      const response = result.response.text();

      const truncatedResponse =
        response.length > 1900
          ? response.slice(0, 1900) +
            "\n...[truncated to keep below 2000 characters]"
          : response;

      // Return the AI's response
      return {
        content: truncatedResponse,
      };
    } catch (error) {
      // Log any errors that occur during the AI chat process
      console.error("Error during AI chat:", error);
      // Return an error message to the user
      return {
        content: "An error occurred while processing your request.",
        flags: MessageFlags.Ephemeral,
      };
    }
  },
};
