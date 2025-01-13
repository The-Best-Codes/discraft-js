import { GoogleGenerativeAI } from "@google/generative-ai";
import { type SimplifiedInteraction } from "../utils/types";

export default {
  data: {
    name: "chat",
    description: "Chat with Gemini AI",
    options: [
      {
        name: "prompt",
        description: "The prompt for the AI",
        type: 3,
        required: true,
      },
      {
        name: "image",
        description: "Optional image to include in the prompt",
        type: 11,
        required: false,
      },
    ],
  },

  async execute(data: { interaction: SimplifiedInteraction }) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
    });
    const interaction = data.interaction;
    const promptOption = interaction.data.options?.find(
      (option) => option.name === "prompt",
    );
    const imageOption = interaction.data.options?.find(
      (option) => option.name === "image",
    );
    const prompt = promptOption?.value || "";
    const imageAttachment =
      interaction.data.resolved?.attachments?.[imageOption?.value || ""];

    if (prompt.length > 2000) {
      return {
        type: 4,
        data: {
          content: "Prompt must be less than 2000 characters.",
          flags: 64,
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
        type: 4,
        data: {
          content: response,
        },
      };
    } catch (error) {
      console.error("Error during AI chat:", error);
      return {
        type: 4,
        data: {
          content: "An error occurred while processing your request.",
        },
      };
    }
  },
};
