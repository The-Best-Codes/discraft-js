import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping!"),

  async execute(data) {
    const interaction = data.interaction;
    await interaction.reply("Pong!");
  },
};
