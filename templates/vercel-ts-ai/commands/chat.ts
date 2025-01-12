import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Chat with Gemini AI")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("The prompt for the AI")
        .setRequired(true),
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("Optional image to include in the prompt")
        .setRequired(false),
    ),

  async execute(data: { interaction: ChatInputCommandInteraction }) {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_AI_MODEL || "gemini-1.5-flash",
    });
    const interaction = data.interaction;
    const prompt = interaction.options.getString("prompt", true);
    const imageAttachment = interaction.options.getAttachment("image");

    if (prompt.length > 2000) {
      await interaction.reply({
        content: "Prompt must be less than 2000 characters.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await interaction.deferReply();

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
            mimeType: imageAttachment.contentType,
          },
        };
        parts = [prompt, image];
      }

      const result = await model.generateContent(parts);
      const response = result.response.text();

      await interaction.editReply({
        content: response,
      });
    } catch (error) {
      console.error("Error during AI chat:", error);
      await interaction.editReply({
        content: "An error occurred while processing your request.",
      });
    }
  },
};
