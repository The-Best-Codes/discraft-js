import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export default {
  commandData: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping the bot"),

  async execute(data: { interaction: ChatInputCommandInteraction }) {
    const interaction = data.interaction;
    await interaction.reply("Pong!");
  },
};
